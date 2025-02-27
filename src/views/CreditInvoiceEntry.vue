<template>
  <div class="container mt-4">
    <h2 class="mb-4">{{ editing ? 'Edit' : 'Create' }} Invoice</h2>
    
    <div v-if="loading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading invoice data...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="row g-3">
        <!-- Invoice Number -->
        <div class="col-md-6 form-floating">
          <input 
            v-model="form.invoice_no" 
            type="text" 
            class="form-control" 
            id="invoiceNo"
            placeholder=" "
            required
          >
          <label for="invoiceNo">Invoice Number</label>
        </div>

        <!-- Customer Select -->
        <div class="col-md-6 form-floating">
          <select 
            v-model="form.customer" 
            class="form-select" 
            id="customerSelect"
            required 
            :disabled="loadingCustomers"
          >
            <option v-if="loadingCustomers" value="" disabled>
              Loading customers...
            </option>
            <template v-else>
              <option value="" disabled hidden>Select a customer</option>
              <option 
                v-for="c in customers" 
                :value="c.alias_id" 
                :key="c.alias_id"
              >
                {{ c.name }}
              </option>
            </template>
          </select>
          <label for="customerSelect">Customer</label>
          <div v-if="customerError" class="text-danger mt-1">
            {{ customerError }}
          </div>
        </div>

        <!-- Transaction Date -->
        <div class="col-md-6 form-floating">
          <input 
            v-model="form.transaction_date" 
            type="date" 
            class="form-control" 
            id="transactionDate"
            placeholder=" "
            required
          >
          <label for="transactionDate">Transaction Date</label>
        </div>

        <!-- Due Amount -->
        <div class="col-md-6 form-floating">
          <input 
            v-model="form.due_amount" 
            type="number" 
            step="0.01" 
            class="form-control" 
            id="dueAmount"
            placeholder=" "
            required
          >
          <label for="dueAmount">Due Amount</label>
        </div>

        <!-- Grace Days -->
        <div class="col-md-6 form-floating">
          <input 
            :value="graceDays" 
            type="number" 
            class="form-control" 
            id="graceDays"
            placeholder=" "
            readonly
          >
          <label for="graceDays">Grace Days</label>
        </div>

        <!-- Payment Date -->
        <div class="col-md-6 form-floating">
          <input 
            :value="paymentDate" 
            type="date" 
            class="form-control" 
            id="paymentDate"
            placeholder=" "
            readonly
          >
          <label for="paymentDate">Payment Date</label>
        </div>

        <!-- Image Upload & Preview -->
        <div class="col-12">
          <div class="form-floating">
            <input 
              type="file" 
              @change="handleFile" 
              class="form-control" 
              id="invoiceImage"
              placeholder=" "
              accept="image/*"
            >
            <label for="invoiceImage">Invoice Image</label>
          </div>
          
          <!-- Image Preview -->
          <div v-if="imagePreview" class="mt-3">
            <h6 class="text-muted mb-2">Preview:</h6>
            <img 
              :src="imagePreview" 
              class="img-thumbnail" 
              style="max-width: 300px; max-height: 200px"
              alt="Invoice preview"
            >
          </div>
          
          <!-- Existing Image -->
          <div v-if="existingImageUrl" class="mt-3">
            <h6 class="text-muted mb-2">Current Invoice Image:</h6>
            <img 
              :src="existingImageUrl" 
              class="img-thumbnail" 
              style="max-width: 300px; max-height: 200px"
              alt="Current invoice"
            >
          </div>
          
        </div>
        <div class="col-12">
          <CustomerClaims
            ref="customerClaimsRef"
            v-if="form.invoice_no"
            :customerAliasId="form.customer"
            :invoiceAliasId="invoiceId"
          />
        </div>

        <!-- Action Buttons -->
        <div class="col-12">
          <button type="submit" class="btn btn-primary me-2" :disabled="submitting">
            <span v-if="submitting" class="spinner-border spinner-border-sm" role="status"></span>
            {{ submitting ? 'Saving...' : 'Save' }}
          </button>
          <router-link to="/credit-invoices" class="btn btn-secondary">Cancel</router-link>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/plugins/axios'
import { useBranchStore } from '@/stores/branchStore'
import CustomerClaims from '@/views/CustomerClaims.vue'

const store = useBranchStore()
const route = useRoute()
const router = useRouter()

// State management
const loading = ref(false)
const loadingCustomers = ref(true)
const submitting = ref(false)
const customerError = ref(null)
const imagePreview = ref(null)
const existingImageUrl = ref(null)

// Data refs
const editing = ref(false)
const invoiceId = ref(null)
const customers = ref([])
const customerClaimsRef = ref(null)

// Form data
const form = ref({
  invoice_no: '',
  customer: '',
  transaction_date: '',
  due_amount: 0,
  invoice_image: null,
  version: 1
})

// Computed properties
const graceDays = computed(() => {
  const customer = customers.value.find(c => c.alias_id === form.value.customer)
  return customer?.grace_days || 0
})

const paymentDate = computed(() => {
  if (!form.value.transaction_date) return ''
  const date = new Date(form.value.transaction_date)
  if (graceDays.value) date.setDate(date.getDate() + graceDays.value)
  return date.toISOString().split('T')[0]
})

// File handling
const handleFile = (e) => {
  const file = e.target.files[0]
  if (file) {
    form.value.invoice_image = file
    imagePreview.value = URL.createObjectURL(file)
    existingImageUrl.value = null
  }
}

// Data fetching
const fetchCustomers = async () => {
  try {
    const params = {
      is_active: true,
      branch: store.selectedBranch
    }
    loadingCustomers.value = true

    const { data } = await axios.get('/customers/', { params })
    customers.value = data
  } catch (error) {
    customerError.value = 'Failed to load customers. Please try again later.'
  } finally {
    loadingCustomers.value = false
  }
}

const fetchInvoice = async () => {
  try {
    loading.value = true
    const { data } = await axios.get(`/credit-invoices/${invoiceId.value}/`)
    
    form.value = {
      ...data,
      customer: data.customer, // Direct assignment of alias_id
      version: data.version
    }

    if (data.invoice_image) {
      existingImageUrl.value = data.invoice_image
    }

    // Verify customer exists in loaded list
    await nextTick()
    if (!customers.value.some(c => c.alias_id === form.value.customer)) {
      customerError.value = 'Selected customer not found in current list'
    }
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to load invoice')
    router.push('/credit-invoices')
  } finally {
    loading.value = false
  }
}

// Form submission
const handleSubmit = async () => {
  try {
    submitting.value = true
    const branch = localStorage.getItem('workingBranch')
    if (!branch) throw new Error('Select a branch first')
    
    // Get claims data from child component
    const allClaims = customerClaimsRef.value?.claims || []
    const claimsToSave = allClaims.filter(c => {
      // Filter out zero amounts and invalid claims
      return Number(c.claim_amount) !== 0 && c.claim_amount !== ''
    }).map(c => ({
      alias_id: c.alias_id,
      claim_amount: c.claim_amount,
      existing: c.existing
    }))

    const formData = new FormData()
    formData.append('version', form.value.version)
    formData.append('claims', JSON.stringify(claimsToSave))
    
    Object.entries(form.value).forEach(([key, val]) => {
      if (key === 'invoice_image') {
        if (val instanceof File) formData.append(key, val)
      } else if (key !== 'version') {
        formData.append(key, val)
      }
    })
    
    formData.append('branch', branch)

    const response = await axios({
      method: editing.value ? 'put' : 'post',
      url: editing.value ? `/credit-invoices/${invoiceId.value}/` : '/credit-invoices/',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    router.push('/credit-invoices')
  } catch (error) {
    alert(error.response?.data?.error || error.message)
  } finally {
    submitting.value = false
  }
}

// watch(() => store.selectedBranch, async () => {
//   await fetchCustomers()
// }, { immediate: true })

watch(() => store.selectedBranch, (newBranch, oldBranch) => {
  if (oldBranch && newBranch !== oldBranch) {
    // Show alert to user
    alert('Branch has changed. Redirecting to invoice list.')
    // Redirect to invoice list
    router.push('/credit-invoices')
  }
}, { immediate: true })


// Initialization
onMounted(async () => {
  await fetchCustomers()
  
  if (route.params.aliasId) {
    editing.value = true
    invoiceId.value = route.params.aliasId
    await fetchInvoice()
  }
})
</script>