<template>
  <div class="container-fluid">
    <h3>Customer Payment</h3>
    <div class="row mt-4">
      <div class="col-md-2">
        <div class="form-floating">
          <input
            type="date"
            v-model="formData.received_date"
            class="form-control"
            :class="{ 'is-invalid': errors.received_date }"
            @input="formatDate('received_date')"
          >
          <label>Payment Date</label>
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

    <button @click="submitPayment" class="btn btn-primary mt-3">
      Submit Payment
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { useBranchStore } from '@/stores/branchStore'
import { formatDate,  formatNumber, parseNumber } from '@/utils/ezFormatter'
import ReceivedCheques from '@/views/ReceivedCheques.vue'
import CustomerClaims from '@/views/CustomerClaims.vue'
import CustomerDropdown from '@/components/CustomerDropdown.vue'
import axios from '@/plugins/axios'


const notificationStore = useNotificationStore()
const branchStore = useBranchStore()
const masterClaims = ref([])

const formData = ref({
  received_date: formatDate(new Date()),
  customer: null,
  cheques: [],
  claims: []
})

const errors = ref({})

// function updateCheques(updatedCheques) {
//   formData.value.cheques = updatedCheques.map(cheque => ({
//     ...cheque,
//     cheque_amount: parseNumber(cheque.cheque_amount),
//     // cheque_date: parseDate(cheque.cheque_date)
//     cheque_date: cheque.cheque_date
//   }))
// }

function updateCheques(updatedCheques) {
  formData.value.cheques = updatedCheques
}

function updateClaims(updatedClaims) {
  formData.value.claims = updatedClaims.map(claim => ({
    ...claim,
    claim: claim.master_id,  // Map master_id to the required 'claim' field
    claim_amount: parseNumber(claim.claim_amount)
  }))
}


function resetForm() {
  formData.value = {
    received_date: formatDate(new Date()),
    customer: null,
    cheques: [],
    claims: masterClaims.value.map(claim => ({
      ...claim,
      claim_no: '',
      claim_amount: 0,
      details: ''
    }))
  }
  errors.value = {}
}


async function submitPayment() {
  try {
    const payload = {
      ...formData.value,
      branch: branchStore.selectedBranch,
      customer: formData.value.customer // Ensure this matches your API requirements
    }
    
    const response = await axios.post('/v1/chq/customer-payments/', payload)
    
    notificationStore.showSuccess('Payment recorded successfully')
    resetForm()
  } catch (error) {
    notificationStore.showError('Failed to submit payment')
    if (error.response?.data) {
      errors.value = error.response.data
    }
  }
}


// Updated mounted hook
onMounted(async () => {
  try {     
    const response = await axios.get('/v1/chq/master-claims/')
    masterClaims.value = response.data.map(item => ({
      master_id: item.alias_id,
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

// function resetForm() { 
//   formData.value = {
//     received_date: formatDate(new Date()),
//     cheques: [],
//     claims: {...initialClaims.value}
//   }
//   errors.value = {}
// }

// onMounted(async () => {
//   try {
//     async () => {
//     const response = await axios.get('/v1/chq/master-claims/')    
//     // console.log(" Response data: ", response.data)
//     const initialClaims = response.data.map(item => ({
//       alias_id: item.alias_id,
//       claim_no: '',               // Added empty string
//       claim_name: item.claim_name,
//       details: '',             // Added empty string
//       amount: 0.00,               // Added default 0.00
//       existing: false             // Added default false
//     }))
//     formData.value.claims = initialClaims
//   } 
       
//   } catch (error) {
//     console.error('Error loading claims:', error)
//   }
// })




</script>