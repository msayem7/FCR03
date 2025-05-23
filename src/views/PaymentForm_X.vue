<template>
  <div class="container-fluid">
    <div class="row mb-3">
      <div class="col">
        <h2>{{ isEditMode ? 'Edit Payment' : 'Add New Payment' }}</h2>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <form @submit.prevent="submitForm">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Date*</label>
              <input 
                type="date" 
                v-model="formData.received_date" 
                class="form-control" 
                :class="{ 'is-invalid': errors.received_date }"
                required
              >
              <div class="invalid-feedback">{{ errors.received_date }}</div>
            </div>
            
            <div class="col-md-4">
              <label class="form-label">Customer*</label>
              <select 
                v-model="formData.customer" 
                class="form-select" 
                :class="{ 'is-invalid': errors.customer }"
                required
              >
                <option value="">Select Customer</option>
                <option 
                  v-for="cust in parentCustomers" 
                  :value="cust.alias_id" 
                  :key="cust.alias_id"
                >
                  {{ cust.name }}
                </option>
              </select>
              <div class="invalid-feedback">{{ errors.customer }}</div>
            </div>
          </div>

          <hr class="my-4">

          <h5 class="mb-3">Payment Instruments</h5>
          
          <div v-for="(detail, index) in formData.payment_details" :key="index" class="row g-3 mb-3">
            <div class="col-md-3">
              <label class="form-label">Instrument*</label>
              <div v-if="isLoading" class="text-muted">Loading instruments...</div>
              <select 
                v-model="detail.payment_instrument" 
                class="form-select" 
                @change="updateInstrumentDetails(index)"
                :class="{ 'is-invalid': errors[`payment_details.${index}.payment_instrument`] }"
                required
              >
                <option value="">Select Instrument</option>
                <option 
                  v-for="inst in paymentInstruments" 
                  :value="inst.id" 
                  :key="inst.id"
                >
                  {{ inst.instrument_name }}
                </option>
              </select>
              <!-- <select 
                v-else
                v-model="detail.payment_instrument" 
                class="form-select" 
                @change="updateInstrumentDetails(index)"
                :class="{ 'is-invalid': errors[`payment_details.${index}.payment_instrument`] }"
                required
              >
                <option value="">Select Instrument</option>
                <option 
                  v-for="inst in paymentInstruments" 
                  :value="inst.id" 
                  :key="inst.id"
                >
                  {{ inst.instrument_name }} 
                </option>
              </select> -->
              <div class="invalid-feedback">{{ errors[`payment_details.${index}.payment_instrument`] }}</div>
              <div v-if="paymentInstruments.length === 0 && !isLoading" class="text-danger">
                No payment instruments found
              </div>
            </div>
            
            <div class="col-md-3">
              <label class="form-label">Amount*</label>
              <input 
                type="number" 
                v-model="detail.amount" 
                step="0.01" 
                min="0" 
                class="form-control" 
                :class="{ 'is-invalid': errors[`payment_details.${index}.amount`] }"
                required
              >
              <div class="invalid-feedback">{{ errors[`payment_details.${index}.amount`] }}</div>
            </div>
            
            <div class="col-md-4">
              <label class="form-label">Details</label>
              <input 
                type="text" 
                v-model="detail.detail" 
                class="form-control"
                :class="{ 'is-invalid': errors[`payment_details.${index}.detail`] }"
              >
              <div class="invalid-feedback">{{ errors[`payment_details.${index}.detail`] }}</div>
            </div>
            
            <div class="col-md-2 d-flex align-items-end">
              <button 
                type="button" 
                @click="removePaymentDetail(index)" 
                class="btn btn-outline-danger"
                v-if="formData.payment_details.length > 1"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="row mb-4">
            <div class="col">
              <button 
                type="button" 
                @click="addPaymentDetail" 
                class="btn btn-outline-primary"
              >
                <i class="bi bi-plus"></i> Add Instrument
              </button>
            </div>
          </div>

          <div class="row">
            <div class="col">
              <button type="submit" class="btn btn-primary me-2" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"></span>
                {{ isEditMode ? 'Update Payment' : 'Save Payment' }}
              </button>
              <router-link to="v1/chq/payments" class="btn btn-outline-secondary">
                Cancel
              </router-link>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBranchStore } from '@/stores/branchStore'
import axios from '@/plugins/axios'
import { formatDate } from '@/utils/ezFormatter'

const route = useRoute()
const router = useRouter()
const branchStore = useBranchStore()

const isEditMode = computed(() => route.params.id !== undefined)
const isSubmitting = ref(false)
const isLoading = ref(false)
const errors = ref({})

const formData = ref({
  received_date: new Date().toISOString().split('T')[0],
  customer: '',
  payment_details: [
    {
      payment_instrument: '',
      amount: 0,
      detail: '',
      is_allocated: false
    }
  ]
})

const parentCustomers = ref([])
const paymentInstruments = ref([])

const loadParentCustomers = async () => {
  try {
    isLoading.value = true
    const response = await axios.get('/v1/chq/customers/', {
      params: {
        branch: branchStore.selectedBranch,
        is_parent: true,
        is_active: true
      }
    })
    parentCustomers.value = response.data || []
  } catch (error) {
    console.error('Error loading customers:', error)
    parentCustomers.value = []
  } finally {
    isLoading.value = false
  }
}

const loadPaymentInstruments = async () => {
  try {
    isLoading.value = true
    const response = await axios.get('/v1/chq/payment-instruments/', {
      params: {
        branch: branchStore.selectedBranch,
        is_active: true
      }
    })

    console.log('Payment instruments response after loading:', response.data)
    // Check if response is paginated (has results property) or direct array
    paymentInstruments.value = response.data.results || response.data || []
    console.log('Payment instruments:', paymentInstruments.value)

  } catch (error) {
    console.error('Error loading payment instruments:', error)
    paymentInstruments.value = []
  } finally {
    isLoading.value = false
  }
}

const loadPaymentData = async (id) => {
  try {
    isLoading.value = true
    const response = await axios.get(`/v1/chq/payments/${id}/`)
    const payment = response.data

    console.log('Payment data response for id',id,':', payment )

    formData.value = {
      received_date: payment.received_date,
      customer: payment.customer.alias_id,
      payment_details: payment.payment_details.map(detail => ({
        payment_instrument: detail.payment_instrument.id,
        amount: detail.amount,
        detail: detail.detail,
        is_allocated: detail.is_allocated
      })) || [{
        payment_instrument: '',
        amount: 0,
        detail: '',
        is_allocated: false
      }]
    }
  } catch (error) {
    console.error('Error loading payment data:', error)
    router.push('/payments')
  } finally {
    isLoading.value = false
  }
}

const addPaymentDetail = () => {
  formData.value.payment_details.push({
    payment_instrument: '',
    amount: 0,
    detail: '',
    is_allocated: false
  })
}

const removePaymentDetail = (index) => {
  formData.value.payment_details.splice(index, 1)
}

const updateInstrumentDetails = (index) => {
  
  // You can add logic here to update details based on instrument selection if needed
}


const submitForm = async () => {
  isSubmitting.value = true
  errors.value = {}
  
  try {
    const payload = {
      received_date: formData.value.received_date,
      customer: formData.value.customer,
      branch: branchStore.selectedBranch,
      payment_details: formData.value.payment_details.map(detail => ({
        payment_instrument: detail.payment_instrument,
        amount: parseFloat(detail.amount),
        detail: detail.detail,
        is_allocated: detail.is_allocated
      }))
    }

    const response = isEditMode.value
      ? await axios.put(`/v1/chq/payments/${route.params.id}/`, payload)
      : await axios.post('/v1/chq/payments/', payload)

    if (response.data) {
      // Refresh payment list after successful submission
      router.push({ 
        path: '/payments',
        query: { refresh: true }
      })
    }
  } catch (error) {
    if (error.response?.data) {
      // Handle validation errors
      if (error.response.data.payment_details) {
        error.response.data.payment_details.forEach((err, index) => {
          Object.keys(err).forEach(field => {
            errors.value[`payment_details.${index}.${field}`] = err[field]
          })
        })
      } else {
        errors.value.general = [error.response.data.detail || 'Submission failed']
      }
    } else {
      errors.value.general = [error.message || 'An unexpected error occurred']
    }
  } finally {
    isSubmitting.value = false
  }
}


onMounted(() => {
  console.log('Component mounted')
  console.log('Selected branch:', branchStore.selectedBranch)
  loadParentCustomers()
  loadPaymentInstruments()

  if (isEditMode.value) {
    console.log('Edit mode, loading payment data')
    loadPaymentData(route.params.id)
  }
})

</script>

<style scoped>
/* Add any custom styles here if needed */
</style>
