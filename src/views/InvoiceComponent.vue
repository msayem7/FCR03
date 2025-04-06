<template>
  <div class="card mt-4">
    <div class="card-header d-flex justify-content-between">
      Invoice Allocation
      <button 
        class="btn btn-sm btn-outline-secondary me-2"
        @click="toggleUnselected"
      >
        {{ showUnselected ? 'Hide' : 'Show' }} Unselected
      </button>
      <div v-if="loading" class="spinner-border spinner-border-sm"></div>
    </div>

    <div class="card-body p-0">
      <table class="table table-bordered m-0">
        <thead>
          <tr>
            <!-- Static Columns -->
            <th>
              <input
                v-model="selectAll" 
                type="checkbox" 
                @change="toggleAllSelection"
              >
            </th>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Sale</th>
            <th>Return</th>
            <th>Net Sale</th>
            <th>Allocated</th>
            <th>Net Due</th>
            
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
          <tr 
            v-for="invoice in activeInvoices" 
            :key="invoice.alias_id"
            v-show="showUnselected || selectedInvoices.includes(invoice.alias_id)"
          >
            <!-- Add disabled state to inputs -->
          
            <td>
              <input 
                v-model="selectedInvoices"
                type="checkbox" 
                :value="invoice.alias_id"
              >
            </td>
            <!-- Non-editable Invoice Data -->
            <td>{{ invoice.invoice_no }}</td>
            <td>{{ formatDate(invoice.transaction_date) }}</td>
            <td class="text-end">{{ formatNumber(invoice.sales_amount) }}</td>
            <td class="text-end">{{ formatNumber(invoice.sales_return) }}</td>
            <td class="text-end">{{ formatNumber(netSale(invoice)) }}</td>            
            <td class="text-end">{{ formatNumber(invoice.allocated) }}</td>
            <td class="text-end">{{ formatNumber(invoice.net_due) }}</td>

            <!-- Editable Cheque Allocations -->
            <td v-for="cheque in activeCheques" :key="`chq-${cheque.cheque_no}`">
              <input
                type="text"
                v-model="allocations[invoice.alias_id].cheques[cheque.cheque_no]"
                @input="validateAllocation(invoice)"
                class="form-control text-end"
                :class="{ 'is-invalid': hasAllocationError(invoice, 'cheque', cheque.cheque_no) }"
                :disabled="!selectedInvoices.includes(invoice.alias_id)"
              >
            </td>

            <td v-for="claim in activeClaims" :key="`clm-${claim.claim_no}`">
              <input
                type="text"
                v-model="allocations[invoice.alias_id].claims[claim.claim_no]"
                @input="validateAllocation(invoice)"
                class="form-control text-end"
                :class="{ 'is-invalid': hasAllocationError(invoice, 'claim', claim.claim_no) }"
                :disabled="!selectedInvoices.includes(invoice.alias_id)"
              >
            </td>          
            
            <!-- Calculated Remaining Due -->
            <td class="text-end">
              {{ formatNumber(remainingDue(invoice)) }}
            </td>
          </tr>
          <!-- Selected rows' summary -->
          <tr v-if="selectedInvoices.length > 0" class="table-info">            
            <td colspan="3" class="fw-bold">Selected Total</td>
            <td class="text-end">{{ formatNumber(selectedTotals.sales) }}</td>
            <td class="text-end">{{ formatNumber(selectedTotals.returns) }}</td>
            <td class="text-end">{{ formatNumber(selectedTotals.netSales) }}</td>
            <td class="text-end">{{ formatNumber(selectedTotals.allocated) }}</td>
            <td class="text-end">{{ formatNumber(selectedTotals.netDue) }}</td>
            
            <td 
              v-for="cheque in activeCheques"
              :key="`chq-selected-total-${cheque.cheque_no}`"
              class="text-end"
            >
              {{ formatNumber(selectedTotals.cheques[cheque.cheque_no]) }}
            </td>
            
            <td 
              v-for="claim in activeClaims"
              :key="`clm-selected-total-${claim.claim_no}`"
              class="text-end"
            >
              {{ formatNumber(selectedTotals.claims[claim.claim_no]) }}
            </td>
            
            <td class="text-end">{{ formatNumber(selectedTotals.remaining) }}</td>
          </tr>
          <!-- Summary Row -->
          <tr class="table-secondary">
            <td colspan="3" class="fw-bold">Total</td>
            <td class="text-end">{{ formatNumber(totalSales) }}</td>
            <td class="text-end">{{ formatNumber(totalReturns) }}</td>
            <td class="text-end">{{ formatNumber(totalNetSales) }}</td>
            <td class="text-end">{{ formatNumber(totalAllocated) }}</td>
            <td class="text-end">{{ formatNumber(totalNetDue) }}</td>
            
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
import { ref, computed, watch, onMounted } from 'vue'
import { formatDate, formatNumber, parseNumber } from '@/utils/ezFormatter'

// eslint-disable-next-line no-undef
const props = defineProps({
  invoices: Array,
  cheques: Array,
  claims: Array,
  loading: Boolean
})

// eslint-disable-next-line no-undef
const emit = defineEmits(['update:modelValue'])

const showUnselected = ref(true)

const selectedInvoices = ref([])
const selectAll = ref(false)
// Initialize allocations structure
const allocations = ref({})
const errors = ref({})


function resetState() {
  selectedInvoices.value = []
  showUnselected.value = true
  initializeAllocations()
}

// eslint-disable-next-line no-undef
defineExpose({
  resetState
})

// Computed properties
// const activeInvoices = computed(() => 
//   props.invoices.filter(inv => inv.status)
// )
// Computed properties
// Add a default array if undefined
const selectedTotals = computed(() => {
  const totals = {
      sales: 0,
      returns: 0,
      netSales: 0,
      allocated: 0,  // New
      netDue: 0,    // New
      remaining: 0,
      cheques: {},
      claims: {}
  }

  activeInvoices.value
    .filter(invoice => selectedInvoices.value.includes(invoice.alias_id))
    .forEach(invoice => {
      totals.sales += invoice.sales_amount
      totals.returns += invoice.sales_return
      totals.netSales += netSale(invoice)
      totals.allocated += parseNumber(invoice.allocated)  // Sum allocated
      totals.netDue += parseNumber(invoice.net_due)       // Sum net due
      totals.remaining += remainingDue(invoice)

      // Sum cheque allocations
      activeCheques.value.forEach(cheque => {
        const amount = parseFloat(allocations.value[invoice.alias_id]?.cheques[cheque.cheque_no]) || 0
        totals.cheques[cheque.cheque_no] = (totals.cheques[cheque.cheque_no] || 0) + amount
      })

    // Sum claim allocations
      activeClaims.value.forEach(claim => {
        const amount = parseFloat(allocations.value[invoice.alias_id]?.claims[claim.claim_no]) || 0
        totals.claims[claim.claim_no] = (totals.claims[claim.claim_no] || 0) + amount
      })
      
      
  })

  return totals
})

const activeInvoices = computed(() => 
  (props.invoices || []).filter(inv => parseNumber(inv.net_due) != 0)
)
const activeCheques = computed(() => 
  props.cheques.filter(c => parseNumber(c.cheque_amount) > 0 && c.cheque_no)
)

// const activeClaims = computed(() => 
//   props.claims.filter(c => parseNumber(c.claim_amount) > 0 && c.claim_no)
// )
const activeClaims = computed(() => 
  props.claims.filter(c => 
    parseNumber(c.claim_amount) > 0 && 
    c.claim_no && 
    c.claim_no.trim() !== ''
  )
)


function toggleUnselected() {
  showUnselected.value = !showUnselected.value
}
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
const totalAllocated = computed(() =>
  activeInvoices.value.reduce((sum, inv) => sum + parseNumber(inv.allocated), 0)
)

const totalNetDue = computed(() =>
  activeInvoices.value.reduce((sum, inv) => sum + parseNumber(inv.net_due), 0)
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
  const currentAllocations = Object.values(allocations.value[invoice.alias_id]?.cheques || {})
    .concat(Object.values(allocations.value[invoice.alias_id]?.claims || {}))
    .reduce((sum, val) => sum + parseNumber(val), 0)
  
  return invoice.net_due - currentAllocations
}
// const remainingDue = (invoice) => {
//   const allocated = Object.values(allocations.value[invoice.alias_id]?.cheques || {})
//     .concat(Object.values(allocations.value[invoice.alias_id]?.claims || {}))
//     .reduce((sum, val) => sum + parseNumber(val), 0)
    
//   return netSale(invoice) - allocated
// }

// Modify initialization to handle empty state
function initializeAllocations() {
  allocations.value = {}
  activeInvoices.value.forEach(inv => {
    allocations.value[inv.alias_id] = {
      cheques: {},
      claims: {}
    }
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
     // 2. Cheque total validation
    activeCheques.value.forEach(cheque => {
      const totalAllocated = chequeTotals.value[cheque.cheque_no] || 0
      const chequeAmount = parseNumber(cheque.cheque_amount)
      
      if (totalAllocated > chequeAmount) {
        errors.value[`chq-${cheque.cheque_no}`] = 
          `Cheque ${cheque.cheque_no} over-allocated (Max: ${formatNumber(chequeAmount)})`
      }
    })
    // const allocated = parseNumber(allocations.value[invoice.alias_id].cheques[chq.cheque_no] || 0)
    // const chequeTotal = parseNumber(chq.cheque_amount)
    // // 1. Invoice-level validation
    // if (allocated > chequeTotal) {
    //   errors.value[`chq-${chq.cheque_no}`] = 
    //     `Cheque ${chq.cheque_no} allocation exceeds cheque amount (${formatNumber(chequeTotal)})`
    // }
    
    // // 2. Cheque total validation
    // const totalAllocated = chequeTotals.value[chq.cheque_no] || 0
    // if (totalAllocated > chequeTotal) {
    //     errors.value[`chq-${chq.cheque_no}`] = 
    //       `Cheque ${chq.cheque_no} over-allocated (Max: ${formatNumber(chequeTotal)})`
    // }
    // activeCheques.value.forEach(cheque => {
    //   //const totalAllocated = chequeTotals.value[cheque.cheque_no] || 0
    //   const chequeAmount = parseNumber(cheque.cheque_amount)
      
    //   if (totalAllocated > chequeAmount) {
    //     errors.value[`chq-${cheque.cheque_no}`] = 
    //       `Cheque ${cheque.cheque_no} over-allocated (Max: ${formatNumber(chequeAmount)})`
    //   }
    // })

    // New validation for net due
    if (invoice.net_due <= 0) {
      errors.value[`inv-${invoice.invoice_no}`] = 
        `Invoice ${invoice.invoice_no} is already fully allocated`
    }

    // Update remaining due validation
    if (remainingDue(invoice) < 0) {
      errors.value[`inv-${invoice.invoice_no}`] = 
        `Over-allocation detected for invoice ${invoice.invoice_no}`
    }

  })

  // 3. Claim total validation
  activeClaims.value.forEach(claim => {
    const totalAllocated = claimTotals.value[claim.claim_no] || 0
    const claimAmount = parseNumber(claim.claim_amount)
    
    if (totalAllocated > claimAmount) {
      errors.value[`clm-${claim.claim_no}`] = 
        `Claim ${claim.claim_no} over-allocated (Max: ${formatNumber(claimAmount)})`
    }
  })
  // Validate claim allocations
  // activeClaims.value.forEach(clm => {
  //   const allocated = parseNumber(allocations.value[invoice.alias_id].claims[clm.claim_no] || 0)
  //   const claimTotal = parseNumber(clm.claim_amount)
    
  //   if (allocated > claimTotal) {
  //     errors.value[`clm-${clm.claim_no}`] = 
  //       `Claim ${clm.claim_no} allocation exceeds claim amount (${formatNumber(claimTotal)})`
  //   }
  // })

  // Validate remaining due
  if (remainingDue(invoice) < 0) {
    errors.value[`inv-${invoice.invoice_no}`] = 
      `Invoice ${invoice.invoice_no} has over-allocation`
  }
   
  //Need to check the application of this function
  if (remainingDue(invoice) === netSale(invoice) && remainingDue(invoice)>0) {
    errors.value[`inv-${invoice.invoice_no}`] = 
      `No allocations made for invoice ${invoice.invoice_no}`
  }
}

function toggleAllSelection() {
    if (selectAll.value) {
        selectedInvoices.value = activeInvoices.value.map(invoice => invoice.alias_id)
    } else {
        selectedInvoices.value = []
    }
}

// Enhanced error checking
const hasAllocationError = (invoice, type, identifier) => {
  return !!errors.value[
    type === 'cheque' ? `chq-${identifier}` : `clm-${identifier}`
  ] || !!errors.value[`inv-${invoice.invoice_no}`]
}

// const hasAllocationError = (invoice, type, identifier) => {
//   if (type === 'cheque') {
//     return !!errors.value[`chq-${identifier}`]
//   }
//   return !!errors.value[`clm-${identifier}`]
// }

// Watchers
watch(() => props.cheques, initializeAllocations, { deep: true })
//watch(() => props.claims, initializeAllocations, { deep: true })
watch(() => props.claims, (newClaims) => {
  initializeAllocations()
  validateAllAllocations()
}, { deep: true })
watch(() => props.invoices, initializeAllocations)

watch(selectedInvoices, (newVal) => {
    selectAll.value = newVal.length === activeInvoices.value.length
})

watch(allocations, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

function validateAllAllocations() {
  activeInvoices.value.forEach(invoice => {
    validateAllocation(invoice)
  })
}
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

input[type="checkbox"] {
    cursor: pointer;
    transform: scale(1.2);
}

.table-info td {
    font-weight: bold;
    background-color: #e3f2fd !important;
}
</style>