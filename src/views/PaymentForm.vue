<template>
  <div class="container-fluid">
    <h3>Customer Payment</h3>
    <div class="row mt-4">
      <div class="col-md-2">
        <div class="form-floating">
          <input
            v-model="formData.received_date"
            type="date"
            class="form-control"
            :class="{ 'is-invalid': errors.received_date }"
            @input="formatDate('received_date')"
          >
          <label>Received Date</label>
          <div v-if="errors.received_date" class="invalid-feedback">
            {{ errors.received_date }}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <CustomerDropdown 
          v-model="formData.customer"
          :error="errors.customer"
        />
      </div>
    </div>
    <div class="row mt-4">
      <div class="col-md-6">
        <ReceivedCheques 
          :cheques="formData.cheques"
          @update:cheques="updateCheques"
        />
      </div>
      <div class="col-md-6">
        <CustomerClaims
          :claims="formData.claims"
          @update:claims="updateClaims"
        />
      </div>      
    </div>
    <div class="row mt-4">
      <!-- <div class="col-md-12"> -->
      <InvoiceComponent
        ref="invoiceComponentRef"
        :key="invoiceComponentKey"
        :invoices="filteredInvoices"
        :cheques="formData.cheques"
        :claims="formData.claims"
        :loading="loadingInvoices"
        v-model="formData.allocations"
      />
      <!-- </div> -->
      <div v-if="loadingInvoices" class="mt-2">
        Loading invoices...
      </div>
      
      <div v-if="invoiceError" class="alert alert-danger mt-2">
        {{ invoiceError }}
      </div>
    </div>
    <button @click="submitPayment" class="btn btn-primary mt-3">
      Submit Payment
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { useBranchStore } from '@/stores/branchStore'
import { formatDate, ServerDateFormat, formatNumber, parseNumber } from '@/utils/ezFormatter'
import ReceivedCheques from '@/views/ReceivedCheques.vue'
import CustomerClaims from '@/views/CustomerClaims.vue'
import CustomerDropdown from '@/components/CustomerDropdown.vue'
import InvoiceComponent from '@/views/InvoiceComponent.vue'
import axios from '@/plugins/axios'

const invoiceComponentRef = ref(null)
const invoiceComponentKey = ref(0)

const notificationStore = useNotificationStore()
const branchStore = useBranchStore()
const masterClaims = ref([])

const formData = ref({
  received_date: formatDate(new Date()),
  customer: null,
  cheques: [],
  claims: [],
  allocations: {}
})

const filteredInvoices = ref([])
const loadingInvoices = ref(false)
const invoiceError = ref(null)

const errors = ref({})


watchEffect(async () => {  
  // console.log(`The watch2 formData.value.customer?.alias_id is: ${formData.value.customer?.alias_id}`)
  // console.log(`The watch2 fbranchStore.selectedBranch?.alias_id is: ${branchStore.selectedBranch}`)
  if (formData.value.customer?.alias_id && branchStore.selectedBranch) {
    loadingInvoices.value = true
    try {
      
      const response = await axios.get('/v1/chq/credit-invoices/', {
        params: {
          branch: branchStore.selectedBranch,
          customer: formData.value.customer.alias_id
          // , status: "true"  // Send as lowercase string
        }
      })
      // const response = await axios.get('/v1/chq/credit-invoices/', {
      //   params: {
      //     branch: branchStore.selectedBranch,
      //     customer: formData.value.customer.alias_id,
      //     status: true
      //   }
      // })
      filteredInvoices.value = response.data
      //filteredInvoices.value = response.data.results // If paginated
    } catch (error) {
      invoiceError.value = 'Failed to load invoices'
      console.error('Invoice load error:', error)
    } finally {
      loadingInvoices.value = false
    }
  } else {
    filteredInvoices.value = []
    loadingInvoices.value = false
  }
})


function updateCheques(updatedCheques) {
  formData.value.cheques = updatedCheques
}

function updateClaims(updatedClaims) {
  console.log('updatedClaims > Started > formData.value.claims :', updatedClaims)
  formData.value.claims = updatedClaims.map(claim => ({   
    claim_no: claim.claim_no,
    claim: claim.claim,
    claim_name: claim.claim_name, 
    claim_amount: parseNumber(claim.claim_amount),
    details: claim.details
  }))
  
  console.log ('updatedClaims> End > formData.value.claims:', formData.value.claims)
}


function resetForm() {
  formData.value.cheques = []
  formData.value.claims = masterClaims.value.map(claim => ({
    ...claim,
    claim_no: '',
    claim_amount: 0,
    details: ''
  }))
  formData.value.allocations = {}
  errors.value = {}
}


async function submitPayment() {
  try {
    // Check for duplicates before submission
   // Modified cheque/claim validation
   const chequeNos = formData.value.cheques
      .map(c => c.cheque_no)
      .filter(n => n.trim() !== '')

    const claimNos = formData.value.claims
      .map(c => c.claim_no)
      .filter(n => n.trim() !== '')  // Add this filter
      
    if (new Set(chequeNos).size !== chequeNos.length) {
      throw new Error('Duplicate cheque numbers exist')
    }

    if (new Set(claimNos).size !== claimNos.length) {
      throw new Error('Duplicate claim numbers exist')
    }
    // Store customer ID before reset
    const customerAliasId = formData.value.customer?.alias_id
    const filteredClaims = formData.value.claims.filter(claim => {
      const amount = parseFloat(claim.claim_amount);
      return (
        claim.claim_no?.trim() &&
        !isNaN(amount) &&
        amount > 0 &&
        claim.claim // 👈 Ensure the "claim" field exists
      );
    });
    
    //console.log ('formData.value.allocations', formData.value.allocations)
    const validAllocations = Object.entries(formData.value.allocations)
      .filter(([invoiceId, allocation]) => {
        const totalAllocated = Object.values(allocation.cheques || {})
          .concat(Object.values(allocation.claims || {}))
          .reduce((sum, val) => sum + parseNumber(val || 0), 0)
        return totalAllocated > 0 // 👈 Only include invoices with allocations
      })
      .reduce((acc, [invoiceId, allocation]) => {
        acc[invoiceId] = allocation
        return acc
      }, {})

    // const validAllocations = Object.entries(formData.value.allocations)
    //   .filter(([invoiceId, allocation]) => {
    //     const totalAllocated = Object.values(allocation.cheques)
    //       .concat(Object.values(allocation.claims))
    //       .reduce((sum, val) => sum + parseNumber(val || 0), 0)
    //     return totalAllocated > 0
    //   })
    // const validAllocations = Object.entries(formData.value.allocations)
    //   .filter(([invoiceId, allocation]) => {
    //     const invoice = filteredInvoices.value.find(inv => inv.alias_id === invoiceId)
    //     // Filter out invoices with zero net due
    //     return invoice.net_due > 0 && invoice.net_due !=invoice.remainingDue
    //   })
    //   .reduce((acc, [invoiceId, allocation]) => {
    //     acc[invoiceId] = allocation
    //     return acc
    //   }, {})

    //console.log ("validAllocations: ", validAllocations)
    if (Object.keys(validAllocations).length === 0) {
      throw new Error('No valid allocations found')
    }

    // const filteredClaims = formData.value.claims.filter(claim => {
    //   const amount = parseFloat(claim.amount)
    //   return claim.claim_no?.trim() && !isNaN(amount) && amount > 0
    // })
    
    const payload = {
      ...formData.value,
      received_date: formatDate(formData.value.received_date), //ServerDateFormat(formData.value.received_date),
      branch: branchStore.selectedBranch,
      customer: formData.value.customer.alias_id,
      claims: filteredClaims,
      allocations: validAllocations  // Use filtered allocations
    }
    
    const response = await axios.post('/v1/chq/customer-payments/', payload);
  
    notificationStore.showSuccess('Payment recorded successfully');
    //alert('Payment recorded successfully')

    resetForm()

    // Reset invoice component state
    if (invoiceComponentRef.value) {
      invoiceComponentRef.value.resetState()
    } 

    // Force reload invoices
    invoiceComponentKey.value++

    await fetchInvoices()

    // formData.value.allocations = {}; // Reset allocations
    // selectedInvoices.value = []; // Clear selected invoices

    // Add cache-buster to force fresh data
    const timestamp = new Date().getTime()
    const response1 = await axios.get('/v1/chq/credit-invoices/', {
      params: {
        branch: branchStore.selectedBranch,
        customer: customerAliasId,  // Use stored value
        _: timestamp
      }
    })
    
    filteredInvoices.value = JSON.parse(JSON.stringify(response1.data))
    
  } catch (error) {
    notificationStore.showError(error.response?.data?.error || error.message)
    if (error.response?.data) {
      errors.value = error.response.data
    }
  }
}


// Add this function to re-fetch invoices
async function fetchInvoices() {
  if (formData.value.customer?.alias_id && branchStore.selectedBranch) {
    loadingInvoices.value = true;
    try {
      const response = await axios.get('/v1/chq/credit-invoices/', {
        params: {
          branch: branchStore.selectedBranch,
          customer: formData.value.customer.alias_id,
          status: "true"  // 👈 Ensure active invoices are fetched
        }
      })
      // filteredInvoices.value = response.data;
      filteredInvoices.value = JSON.parse(JSON.stringify(response.data)); 
    } catch (error) {
      invoiceError.value = 'Failed to reload invoices';
    } finally {
      loadingInvoices.value = false;
    }
  }
}


// Updated mounted hook
onMounted(async () => {
  try {     
    const response = await axios.get('/v1/chq/master-claims/', {params:{
      branch:branchStore.selectedBranch
    }})
    masterClaims.value = response.data.map(item => ({
      // master_id: item.alias_id,
      claim:item.alias_id,
      claim_name: item.claim_name,
      claim_no: '',
      claim_amount: 0,
      details: ''
    }))
  
    resetForm() // Initialize claims with master data
  } catch (error) {
    console.error('Error loading master claims:', error)
    notificationStore.showError('Failed to load claim templates')
  }
})


</script>

<style scoped>
.is-invalid {
  border-color: #dc3545;
  background-image: url("data:image/svg+xml,%3csvg...");
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875em;
  margin-top: 0.25rem;
}
</style>