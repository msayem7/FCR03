<template>
  <div class="container-fluid">
    <div class="row mb-3">
      <div class="col">
        <h2>{{ isEditMode ? 'Edit Payment' : 'Receive Customer Payment' }}</h2>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <form @submit.prevent="submitForm">
          <div class="row g-3 mb-4">
            <div class="col-md-3">
              <div class="form-floating">
                <input 
                  type="date" 
                  v-model="formData.received_date" 
                  class="form-control" 
                  :class="{ 'is-invalid': errors.received_date }"
                  required
                  id="receivedDate"
                >
                <label for="receivedDate">Date*</label>
                <div class="invalid-feedback">{{ errors.received_date }}</div>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="form-floating">
                <select 
                  v-model="formData.customer" 
                  class="form-select" 
                  :class="{ 'is-invalid': errors.customer }"
                  required
                  @change="loadCustomerInvoices"
                  id="customerSelect"
                >
                  <option value="Select a customer"></option>
                  <option 
                    v-for="cust in parentCustomers" 
                    :value="cust.alias_id" 
                    :key="cust.alias_id"
                  >
                    {{ cust.name }}
                  </option>
                </select>
                <label for="customerSelect">Parent Customer*</label>
                <div class="invalid-feedback">{{ errors.customer }}</div>
              </div>
            </div>
          </div>

          <!-- Split Panels -->
          <div class="split-panels">
            <!-- Left Panel - Payment Instruments -->
            <div class="split-panel left-panel">
              <div class="panel-content">
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                  <table class="table table-bordered table-hover">
                    <thead class="table-light sticky-top">
                      <tr>
                        <th style="width: 30%">Instrument*</th>
                        <th style="width: 20%">ID Number</th>
                        <th style="width: 20%">Amount*</th>
                        <th style="width: 25%">Details</th>
                        <th style="width: 5%"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(detail, index) in formData.payment_details" :key="index">
                        <td>
                          <select 
                            v-model="detail.payment_instrument" 
                            class="form-select form-select-sm"
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
                          
                          <div class="invalid-feedback small">
                            {{ errors[`payment_details.${index}.payment_instrument`] }}
                          </div>
                        </td>
                        <td>
                          <input 
                            v-model="detail.id_number"
                            :disabled="isAutoNumber(detail)"
                            class="form-control form-control-sm"
                            :class="{ 'is-invalid': errors[`payment_details.${index}.id_number`] }"
                          >
                        </td>
                        <td>
                          <input 
                            type="number" 
                            v-model="detail.amount" 
                            step="0.01" 
                            min="0" 
                            class="form-control form-control-sm"
                            :class="{ 'is-invalid': errors[`payment_details.${index}.amount`] }"
                            required
                          >
                          <div class="invalid-feedback small">
                            {{ errors[`payment_details.${index}.amount`] }}
                          </div>
                        </td>
                        <td>
                          <input 
                            type="text" 
                            v-model="detail.detail" 
                            class="form-control form-control-sm"
                            :class="{ 'is-invalid': errors[`payment_details.${index}.detail`] }"
                          >
                          <div class="invalid-feedback small">
                            {{ errors[`payment_details.${index}.detail`] }}
                          </div>
                        </td>
                        <td class="text-center">
                          <button 
                            type="button" 
                            @click="removePaymentDetail(index)" 
                            class="btn btn-sm btn-outline-danger"
                            v-if="formData.payment_details.length > 1"
                            title="Remove instrument"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="row mb-2">
                  <div class="col">
                    <button 
                      type="button" 
                      @click="addPaymentDetail" 
                      class="btn btn-outline-primary btn-sm"
                    >
                      <i class="bi bi-plus"></i> Add Instrument
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Splitter -->
            <div class="splitter" @mousedown="startDrag"></div>

            <!-- Right Panel - Invoice Allocation -->
            <div class="split-panel right-panel">
              <div class="panel-content">
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                  <table class="table table-bordered table-hover">
                    <thead class="table-light sticky-top">
                      <tr>
                        <th style="width: 5%">
                          <input 
                            type="checkbox" 
                            v-model="selectAllInvoices"
                            @change="toggleAllInvoices"
                          >
                        </th>
                        <th style="width: 15%" @click="sortInvoices('transaction_date')">Date</th>
                        <th style="width: 15%" @click="sortInvoices('grn')">GRN</th>
                        <!--  customer..name-->
                        <th style="width: 25%" @click="sortInvoices('customer_name')">Customer</th> 
                        <th style="width: 15%" @click="sortInvoices('sales_amount')" class="text-end">Amount</th>
                        <th style="width: 15%" @click="sortInvoices('sales_return')" class="text-end">Return</th>
                        <th style="width: 15%" @click="sortInvoices('net_due')" class="text-end">Net Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="invoice in filteredInvoices" :key="invoice.alias_id">
                        <td>
                          <input 
                            type="checkbox" 
                            v-model="selectedInvoices"
                            :value="invoice"
                            :key="invoice.alias_id"
                          >
                        </td>
                        <td>{{ formatDate(invoice.transaction_date) }}</td>
                        <td>{{ invoice.grn }}</td>
                        <td>{{ invoice.customer_name }}</td>
                        <td class="text-end">{{ formatNumber(invoice.sales_amount) }}</td>
                        <td class="text-end">{{ formatNumber(invoice.sales_return) }}</td>
                        <td class="text-end">{{ formatNumber(invoice.net_due) }}</td>
                      </tr>
                      <tr v-if="filteredInvoices.length === 0">
                        <td colspan="7" class="text-center">No unpaid invoices found</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="row mt-3">
            <div class="col-md-6">
              <div class="card">
                <div class="card-body">
                  <h6>Payment Summary</h6>
                  <div class="row">
                    <div class="col-6">
                      <div>Total Payment Amount:</div>
                      <div>Total Selected Invoices:</div>
                      <div class="fw-bold">Difference:</div>
                    </div>
                    <div class="col-6 text-end">
                      <div><strong>{{ formatNumber(totalPaymentAmount) }}</strong></div>
                      <div><strong>{{ formatNumber(totalSelectedAmount) }}</strong></div>
                      <div :class="{'text-danger': paymentDifference < 0, 'text-success': paymentDifference >= 0}">
                        <strong>{{ formatNumber(Math.abs(paymentDifference)) }}</strong>
                        ({{ paymentDifference < 0 ? 'Shortage' : 'Excess' }})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="row mt-3">
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBranchStore } from '@/stores/branchStore'
import axios from '@/plugins/axios'
import { formatDate, formatNumber } from '@/utils/ezFormatter'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()
const route = useRoute()
const router = useRouter()
const branchStore = useBranchStore()

// Split panel drag functionality
const isDragging = ref(false)
const leftPanelWidth = ref(40) // Initial width percentage for left panel

const startDrag = (e) => {
  isDragging.value = true
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.cursor = 'col-resize'
}

const handleDrag = (e) => {
  if (!isDragging.value) return
  
  const container = document.querySelector('.split-panels')
  const containerRect = container.getBoundingClientRect()
  const containerWidth = containerRect.width
  const mouseX = e.clientX - containerRect.left
  const newLeftWidth = (mouseX / containerWidth) * 100
  
  // Constrain between 20% and 80%
  leftPanelWidth.value = Math.max(20, Math.min(80, newLeftWidth))
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.cursor = ''
}

// Invoice data and filtering
const customerInvoices = ref([])
const selectedInvoices = ref([])
const selectAllInvoices = ref(false)
const invoiceFilter = ref('')
const sortField = ref('transaction_date')
const sortDirection = ref('asc')

const loadCustomerInvoices = async () => {
  if (!formData.value.customer) return
  
  try {
    const response = await axios.get('/v1/chq/credit-invoices/', {
      params: {
        branch: branchStore.selectedBranch,
        customer: formData.value.customer,
        payment: 'unpaid' // Only unpaid invoices
      }
    })
    customerInvoices.value = response.data.map(invoice => ({
      ...invoice,
      customer_name: invoice.customer_name,
      net_due: invoice.sales_amount - invoice.sales_return
    }))
    
    console.log('Loaded response invoices:', response.data)
    console.log('Loaded customer invoices:', customerInvoices.value)


    selectedInvoices.value = [] // Clear previous selections when customer changes
  } catch (error) {
    notificationStore.showError('Failed to load customer invoices: ' + error.message)
    customerInvoices.value = []
  }
}


const filteredInvoices = computed(() => {
  let filtered = customerInvoices.value

  // Apply filter
  if (invoiceFilter.value) {
    const filter = invoiceFilter.value.toLowerCase()
    filtered = filtered.filter(invoice => 
      invoice.grn.toLowerCase().includes(filter) ||
      (invoice.customer?.name || '').toLowerCase().includes(filter) ||
      invoice.transaction_details?.toLowerCase().includes(filter)
    )
  }
  
  // Apply sorting
  return filtered.sort((a, b) => {
    let aValue, bValue
    
    // Handle nested properties (like customer.name)
    if (sortField.value.includes('.')) {
      const fields = sortField.value.split('.')
      aValue = fields.reduce((obj, field) => obj?.[field], a)
      bValue = fields.reduce((obj, field) => obj?.[field], b)
    } else {
      aValue = a[sortField.value]
      bValue = b[sortField.value]
    }
    
    // Convert to number if the field is numeric
    const isNumericField = ['sales_amount', 'sales_return', 'net_due'].includes(sortField.value)
    if (isNumericField) {
      aValue = parseFloat(aValue) || 0
      bValue = parseFloat(bValue) || 0
    }
    
    let comparison = 0
    if (aValue > bValue) {
      comparison = 1
    } else if (aValue < bValue) {
      comparison = -1
    }
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})



const sortInvoices = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  
}

const toggleAllInvoices = () => {
  if (selectAllInvoices.value) {
    selectedInvoices.value = [...filteredInvoices.value]
  } else {
    selectedInvoices.value = []
  }
}

watch(selectedInvoices, (newVal) => {
  selectAllInvoices.value = newVal.length === filteredInvoices.value.length && filteredInvoices.value.length > 0
})

const totalPaymentAmount = computed(() => {
  return formData.value.payment_details.reduce((sum, detail) => {
    return sum + (parseFloat(detail.amount) || 0)
  }, 0)
})

const totalSelectedAmount = computed(() => {
  return selectedInvoices.value.reduce((sum, invoice) => {
    return sum + (invoice.net_due || 0)
  }, 0)
})

const paymentDifference = computed(() => {
  return totalPaymentAmount.value - totalSelectedAmount.value
})



// Original payment form code (with minor adjustments)
const instrumentTypeList = ref([])
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
      id_number: '',
      amount: 0,
      detail: '',
    }
  ]
})

const parentCustomers = ref([])
const paymentInstruments = ref([])

const loadInstrumentTypes = async() => {
  try{
    const response = await axios.get('v1/chq/PaymentInstrumentType/', {
      params:{
        branch: branchStore.selectedBranch,
      }
    })
    instrumentTypeList.value = response.data || [];
  }
  catch (error) {
    notificationStore.showError('Failed to load instrument types. ' + error.message)
  }
}

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
    notificationStore.showError('Failed to load customers: ' + error.message)
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
    paymentInstruments.value = response.data.results || response.data || []
  } catch (error) {
    notificationStore.showError('Failed to load payment instruments: ' + error.message)
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

    formData.value = {
      received_date: payment.received_date,
      customer: payment.customer.alias_id,
      payment_details: payment.payment_details.map(detail => ({
        payment_instrument: detail.payment_instrument.id,
        id_number: detail.id_number || '',
        amount: detail.amount,
        detail: detail.detail,
      })) || [{
        payment_instrument: '',
        amount: 0,
        detail: '',
      }]
    }
    
    // Load invoices for this customer
    await loadCustomerInvoices()
    
    // Load existing allocations. 
    const allocationResponse = await axios.get(`/v1/chq/payments/${id}/invoices/`)
    selectedInvoices.value = allocationResponse.data.map(item => ({
      ...item.credit_invoice,
      // customer..name
      customer_name: item.credit_invoice.customer_name,
      net_due: item.credit_invoice.sales_amount - item.credit_invoice.sales_return
    }))
  } catch (error) {
    notificationStore.showError('Failed to load payment data: ' + error.message)
    router.push('/payment')
  } finally {
    isLoading.value = false
  }
}

const addPaymentDetail = () => {
  formData.value.payment_details.push({
    payment_instrument: '',
    id_number: '',
    amount: 0,
    detail: '',
  })
}

const removePaymentDetail = (index) => {
  formData.value.payment_details.splice(index, 1)
}

const updateInstrumentDetails = (index) => {
  // You can add logic here to update details based on instrument selection if needed
}

const isAutoNumber = (detail) => {
  const instrument = paymentInstruments.value.find(
    inst => inst.id === detail.payment_instrument
  )
  if (!instrument) return false
  
  const instrumentType = instrumentTypeList.value.find(
    instType => instType.id == instrument.instrument_type
  )
  return instrumentType?.auto_number || false
}

const cashAndClaimAmount = () => {
  let cashSum = 0.0; // Declare outside to accumulate
  let nonCashSum = 0.0; // Declare outside to accumulate

  // Check if formData.value.payment_details exists and is an array
  if (!formData.value || !Array.isArray(formData.value.payment_details)) {
    console.warn("Invalid or missing payment_details in formData.");
    return { cashSum: 0, nonCashSum: 0 }; // Return default if data is not structured as expected
  }

  formData.value.payment_details.forEach((detail) => {
    // Basic validation for detail structure
    if (typeof detail.amount === 'undefined' || typeof detail.payment_instrument === 'undefined') {
        console.warn("Skipping malformed payment detail:", detail);
        return; // Skip to the next iteration
    }

    const amount = Number(detail.amount); // Ensure amount is a number
    if (isNaN(amount)) { // Handle cases where amount might not be a valid number
        console.warn(`Skipping transaction with invalid amount: ${detail.amount}`);
        return;
    }

    const instrument = paymentInstruments.value.find(
      (inst) => inst.id === detail.payment_instrument
    );

    if (!instrument) {
      console.warn(
        `Payment instrument with ID ${detail.payment_instrument} not found.`
      );
      return; // Skip this detail if instrument is not found
    }

    const instrumentType = instrumentTypeList.value.find(
      (instType) => instType.id == instrument.instrument_type
    );

    if (!instrumentType) {
      console.warn(
        `Instrument type with ID ${instrument.instrument_type} not found.`
      );
      return; // Skip this detail if instrument type is not found
    }

    if (instrumentType.is_cash_equivalent) {
      cashSum += amount;
    } else {
      nonCashSum += amount;
    }
  });

  return { cashSum, nonCashSum }; // Return the accumulated sums
};

// const cashNonCashWiseAmount = () => {

//   return formData.value.payment_details.forEach((detail) => {
//     let cashAmount=0.0,  calimedAmount = 0.0
//     const instrument = paymentInstruments.value.find(
//       inst => inst.id === detail.payment_instrument
//     )
//     if (!instrument) return 0
//     const instrumentType = instrumentTypeList.value.find(
//       instType => instType.id == instrument.instrument_type
//     )
//     if (instrumentType) return 0

//     if (instrumentType.is_cash_equivalent)
//       cashAmount += detail.amount
//     else
//       calimedAmount += detail.amount

//     return (cashAmount, calimedAmount)
//   })
  
  
// }


const submitForm = async () => {
  isSubmitting.value = true
  errors.value = {}

  try {
    
    const cash_claim = cashAndClaimAmount()

    const payload = {
      received_date: formData.value.received_date,
      customer: formData.value.customer,
      branch: branchStore.selectedBranch,
      payment_details: formData.value.payment_details.map(detail => ({
        payment_instrument: detail.payment_instrument,
        id_number: detail.id_number,
        amount: parseFloat(detail.amount),
        detail: detail.detail,
      })),
      // Add invoice allocations to payload
      invoices: selectedInvoices.value.map(invoice => ({
             //allocated_amount: invoice.net_due,
        invoice_alias_id: invoice.alias_id,
        ...invoice
      })),

      shortage_amount: -1 * paymentDifference.value,
      cash_equivalent_amount: cash_claim.cashSum,
      claim_amount: cash_claim.nonCashSum,
      total_amount: totalPaymentAmount.value
    }

    if (isEditMode.value) {
      await axios.put(`/v1/chq/payments/${route.params.id}/`, payload)
    } else {
      await axios.post('/v1/chq/payments/', payload)
    }
    notificationStore.showSuccess('Payment saved successfully')
    router.push('/operations/payment')
  } catch (error) {
    if (error.response?.data?.error?.details) {
      const newErrors = {}
      
      // Process payment_details errors
      error.response.data.error.details.payment_details?.forEach((detailErrors, index) => {
        Object.entries(detailErrors).forEach(([field, messages]) => {
          if (messages.length > 0) {
            newErrors[`payment_details.${index}.${field}`] = messages[0]
          }
        })
      })

      errors.value = newErrors
      notificationStore.showError('Please correct the errors in the form')
    } else {
      errors.value.general = [error.message || 'Failed to submit payment']
      notificationStore.showError(error.message || 'Failed to submit payment')
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadInstrumentTypes()
  loadParentCustomers()
  loadPaymentInstruments()

  if (isEditMode.value) {
    loadPaymentData(route.params.id)
  }
})
</script>

<style scoped>
.split-panels {
  display: flex;
  height: 400px;
  width: 100%;
  position: relative;
}

.split-panel {
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;
}

.left-panel {
  width: v-bind(leftPanelWidth + '%');
  border-right: 1px solid #ddd;
}

.right-panel {
  width: calc(100% - v-bind(leftPanelWidth + '%'));
}

.splitter {
  width: 5px;
  background-color: #eee;
  cursor: col-resize;
  transition: background-color 0.3s;
}

.splitter:hover {
  background-color: #ccc;
}

.panel-content {
  padding: 15px;
}

th {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

th:hover {
  background-color: #f8f9fa;
}

.text-end {
  text-align: end;
}

.sticky-top {
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
}

.form-floating {
  position: relative;
}

.form-floating label {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  padding: 1rem 0.75rem;
  pointer-events: none;
  transform-origin: 0 0;
  transition: opacity .1s ease-in-out,transform .1s ease-in-out;
}

.form-floating input:not(:placeholder-shown) ~ label,
.form-floating input:focus ~ label,
.form-floating select ~ label {
  transform: scale(.85) translateY(-0.5rem) translateX(0.15rem);
  opacity: .65;
}

.form-floating input, .form-floating select {
  padding-top: 1.625rem;
  padding-bottom: 0.625rem;
}
</style>