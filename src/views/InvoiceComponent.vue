<template>
  <div class="card mt-4">
    <div class="card-header">Invoice Allocation</div>
    <div class="card-body p-0">
      <table class="table table-bordered m-0">
        <thead>
          <tr>
            <!-- Static Columns -->
            <th>Invoice No</th>
            <th>Date</th>
            <th>Sale</th>
            <th>Return</th>
            <th>Net Sale</th>
            
            <!-- Dynamic Cheque Columns -->
            <th v-for="cheque in activeCheques" :key="`chq-${cheque.cheque_no}`">
              CHQ-{{ cheque.cheque_no }}
            </th>
            
            <!-- Dynamic Claim Columns -->
            <th v-for="claim in activeClaims" :key="`clm-${claim.claim_no}`">
              CLM-{{ claim.claim_no }}
            </th>
            
            <th>Remaining Due</th>
          </tr>
        </thead>
        
        <tbody>
          <tr v-for="invoice in activeInvoices" :key="invoice.alias_id">
            <!-- Non-editable Invoice Data -->
            <td>{{ invoice.invoice_no }}</td>
            <td>{{ formatDate(invoice.transaction_date) }}</td>
            <td class="text-end">{{ formatNumber(invoice.sales_amount) }}</td>
            <td class="text-end">{{ formatNumber(invoice.sales_return) }}</td>
            <td class="text-end">{{ formatNumber(netSale(invoice)) }}</td>
            
            <!-- Editable Cheque Allocations -->
            <td v-for="cheque in activeCheques" :key="`chq-${cheque.cheque_no}`">
              <input
                type="text"
                v-model="allocations[invoice.alias_id].cheques[cheque.cheque_no]"
                @input="validateAllocation(invoice)"
                class="form-control text-end"
                :class="{ 'is-invalid': hasAllocationError(invoice, 'cheque', cheque.cheque_no) }"
              >
            </td>
            
            <!-- Editable Claim Allocations -->
            <td v-for="claim in activeClaims" :key="`clm-${claim.claim_no}`">
              <input
                type="text"
                v-model="allocations[invoice.alias_id].claims[claim.claim_no]"
                @input="validateAllocation(invoice)"
                class="form-control text-end"
                :class="{ 'is-invalid': hasAllocationError(invoice, 'claim', claim.claim_no) }"
              >
            </td>
            
            <!-- Calculated Remaining Due -->
            <td class="text-end">
              {{ formatNumber(remainingDue(invoice)) }}
            </td>
          </tr>
          
          <!-- Summary Row -->
          <tr class="table-secondary">
            <td colspan="2" class="fw-bold">Total</td>
            <td class="text-end">{{ formatNumber(totalSales) }}</td>
            <td class="text-end">{{ formatNumber(totalReturns) }}</td>
            <td class="text-end">{{ formatNumber(totalNetSales) }}</td>
            
            <td 
              v-for="cheque in activeCheques" 
              :key="`chq-total-${cheque.cheque_no}`"
              class="text-end"
            >
              {{ formatNumber(chequeTotals[cheque.cheque_no]) }}
            </td>
            
            <td 
              v-for="claim in activeClaims" 
              :key="`clm-total-${claim.claim_no}`"
              class="text-end"
            >
              {{ formatNumber(claimTotals[claim.claim_no]) }}
            </td>
            
            <td class="text-end">{{ formatNumber(totalRemaining) }}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Validation Errors -->
      <div v-if="Object.keys(errors).length" class="alert alert-danger mt-3">
        <ul class="mb-0">
          <li v-for="(error, field) in errors" :key="field">{{ error }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { formatDate, formatNumber, parseNumber } from '@/utils/ezFormatter'

// eslint-disable-next-line no-undef
const props = defineProps({
  invoices: Array,
  cheques: Array,
  claims: Array
})

// eslint-disable-next-line no-undef
const emit = defineEmits(['update:modelValue'])

// Initialize allocations structure
const allocations = ref({})
const errors = ref({})

// Computed properties
const activeInvoices = computed(() => 
  props.invoices.filter(inv => inv.status)
)

const activeCheques = computed(() => 
  props.cheques.filter(c => parseNumber(c.cheque_amount) > 0)
)

const activeClaims = computed(() => 
  props.claims.filter(c => parseNumber(c.claim_amount) > 0)
)

// Totals calculations
const totalSales = computed(() =>
  activeInvoices.value.reduce((sum, inv) => sum + parseNumber(inv.sales_amount), 0)
)

const totalReturns = computed(() =>
  activeInvoices.value.reduce((sum, inv) => sum + parseNumber(inv.sales_return), 0)
)

const totalNetSales = computed(() => 
  activeInvoices.value.reduce((sum, inv) => sum + netSale(inv), 0)
)

const chequeTotals = computed(() => {
  const totals = {}
  activeCheques.value.forEach(chq => {
    totals[chq.cheque_no] = activeInvoices.value.reduce((sum, inv) => 
      sum + parseNumber(allocations.value[inv.alias_id]?.cheques[chq.cheque_no] || 0)
    , 0)
  })
  return totals
})

const claimTotals = computed(() => {
  const totals = {}
  activeClaims.value.forEach(clm => {
    totals[clm.claim_no] = activeInvoices.value.reduce((sum, inv) => 
      sum + parseNumber(allocations.value[inv.alias_id]?.claims[clm.claim_no] || 0)
    , 0)
  })
  return totals
})

const totalRemaining = computed(() =>
  activeInvoices.value.reduce((sum, inv) => sum + remainingDue(inv), 0)
)

// Helper methods
const netSale = (invoice) => 
  parseNumber(invoice.sales_amount) - parseNumber(invoice.sales_return)

const remainingDue = (invoice) => {
  const allocated = Object.values(allocations.value[invoice.alias_id]?.cheques || {})
    .concat(Object.values(allocations.value[invoice.alias_id]?.claims || {}))
    .reduce((sum, val) => sum + parseNumber(val), 0)
    
  return netSale(invoice) - allocated
}

const initializeAllocations = () => {
  allocations.value = {}
  activeInvoices.value.forEach(inv => {
    allocations.value[inv.alias_id] = {
      cheques: {},
      claims: {}
    }
    // Initialize existing allocations
    activeCheques.value.forEach(chq => {
      allocations.value[inv.alias_id].cheques[chq.cheque_no] = '0'
    })
    activeClaims.value.forEach(clm => {
      allocations.value[inv.alias_id].claims[clm.claim_no] = '0'
    })
  })
}

// Validation
const validateAllocation = (invoice) => {
  errors.value = {}

  // Validate cheque allocations
  activeCheques.value.forEach(chq => {
    const allocated = parseNumber(allocations.value[invoice.alias_id].cheques[chq.cheque_no] || 0)
    const chequeTotal = parseNumber(chq.cheque_amount)
    
    if (allocated > chequeTotal) {
      errors.value[`chq-${chq.cheque_no}`] = 
        `Cheque ${chq.cheque_no} allocation exceeds cheque amount (${formatNumber(chequeTotal)})`
    }
  })

  // Validate claim allocations
  activeClaims.value.forEach(clm => {
    const allocated = parseNumber(allocations.value[invoice.alias_id].claims[clm.claim_no] || 0)
    const claimTotal = parseNumber(clm.claim_amount)
    
    if (allocated > claimTotal) {
      errors.value[`clm-${clm.claim_no}`] = 
        `Claim ${clm.claim_no} allocation exceeds claim amount (${formatNumber(claimTotal)})`
    }
  })

  // Validate remaining due
  if (remainingDue(invoice) < 0) {
    errors.value[`inv-${invoice.invoice_no}`] = 
      `Invoice ${invoice.invoice_no} has over-allocation`
  }
}

const hasAllocationError = (invoice, type, identifier) => {
  if (type === 'cheque') {
    return !!errors.value[`chq-${identifier}`]
  }
  return !!errors.value[`clm-${identifier}`]
}

// Watchers
watch(() => props.cheques, initializeAllocations, { deep: true })
watch(() => props.claims, initializeAllocations, { deep: true })
watch(() => props.invoices, initializeAllocations)

watch(allocations, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

// Initial setup
onMounted(initializeAllocations)
</script>

<style scoped>
.table th {
  background-color: #f8f9fa;
  vertical-align: middle;
  font-size: 0.9rem;
}

.form-control {
  padding: 0.25rem;
  font-size: 0.9rem;
  text-align: right;
}

.form-control.is-invalid {
  border-color: #dc3545;
  background-image: none;
}

.alert {
  border-radius: 0;
  margin-bottom: 0;
}
</style>
[file content end]

Now let's update the PaymentForm.vue to integrate this component:

```vue
[file name]: PaymentForm.vue (updated excerpt)
[file content begin]
<template>
  <div class="container-fluid">
    <!-- Existing form elements -->
    
    <InvoiceComponent
      :invoices="filteredInvoices"
      :cheques="formData.cheques"
      :claims="formData.claims"
      v-model="formData.allocations"
      class="mt-4"
    />

    <button @click="submitPayment" class="btn btn-primary mt-3">
      Submit Payment
    </button>
  </div>
</template>

<script setup>
// Add these imports
import InvoiceComponent from '@/components/InvoiceComponent.vue'
import { ref } from 'vue'

// Update formData structure
const formData = ref({
  // ... existing fields ...
  allocations: {}
})

// Add filtered invoices computed
const filteredInvoices = computed(async () => {
  if (!formData.value.customer) return []
  const response = await axios.get('/v1/chq/credit-invoices/', {
    params: {
      customer: formData.value.customer.alias_id,
      status: true
    }
  })
  return response.data
})
</script>
[file content end]

Finally, update the backend serializer to handle allocations:

```python
[file name]: serializers.py (updated excerpt)
[file content begin]
class CustomerPaymentSerializer(serializers.ModelSerializer):
    # ... existing fields ...
    allocations = serializers.JSONField(write_only=True, required=False)

    def create(self, validated_data):
        allocations = validated_data.pop('allocations', {})
        payment = super().create(validated_data)
        
        # Create invoice mappings
        for invoice_id, allocation in allocations.items():
            invoice = CreditInvoice.objects.get(alias_id=invoice_id)
            
            # Process cheque allocations
            for cheque_no, amount in allocation['cheques'].items():
                cheque = ChequeStore.objects.get(
                    cheque_no=cheque_no,
                    customer_payment=payment
                )
                InvoiceChequeMap.objects.create(
                    creditinvoice=invoice,
                    cheque_store=cheque,
                    adjusted_amount=amount,
                    branch=payment.branch
                )
            
            # Process claim allocations
            for claim_no, amount in allocation['claims'].items():
                claim = CustomerClaim.objects.get(
                    claim_no=claim_no,
                    customer_payment=payment
                )
                InvoiceClaimMap.objects.create(
                    credit_invoice=invoice,
                    customer_claim=claim,
                    adjusted_amount=amount,
                    branch=payment.branch
                )
        
        return payment