<!-- PaymentListView.vue -->
<template>
  <div class="container-fluid">
    <div class="row mb-3">
      <div class="col">
        <h2>Payment Information</h2>
      </div>
      <div class="col-auto">
        <router-link to="/operations/payment/create" class="btn btn-primary">
          <i class="bi bi-plus-circle"></i> Add Payment
        </router-link>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="card mb-4">
      <div class="card-body">
        <form @submit.prevent="loadPayments">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label">Customer</label>
              <select v-model="filters.customer" class="form-select">
                <option value="">All Customers</option>
                <option v-for="cust in parentCustomers" :value="cust.alias_id" :key="cust.alias_id">
                  {{ cust.name }}
                </option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label">From Date</label>
              <input type="date" v-model="filters.date_from" class="form-control">
            </div>
            <div class="col-md-2">
              <label class="form-label">To Date</label>
              <input type="date" v-model="filters.date_to" class="form-control">
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button type="submit" class="btn btn-primary me-2">
                <i class="bi bi-filter"></i> Filter
              </button>
              <button type="button" @click="resetFilters" class="btn btn-outline-secondary">
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Payment List -->
    <div class="card">
      <div class="card-body">
        <div v-if="isLoading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Cash & Cheques</th>
                <th>Claims</th>
                <th>Total</th>
                <th>Shortage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in payments" :key="payment.alias_id">
                <td>{{ formatDate(payment.received_date) }}</td>
                <td>{{ getCustomerName(payment.customer) }}</td>
                <td>{{formatNumber(payment.cash_equivalent_amount)}}</td>
                <td>{{ formatNumber(payment.claim_amount)}}</td>
                <td>{{ formatNumber(payment.total_amount)}}</td>
                <td>{{ formatNumber(payment.shortage_amount)}}</td>
                <!-- <td>{{ cashAndBankAmount(payment)}}</td> -->
                <!-- <td>{{ claimAmount(payment) }}</td> -->
                <td>
                  <button 
                    @click="viewPaymentDetails(payment)" 
                    class="btn btn-sm btn-outline-primary"
                  >
                    <i class="bi bi-eye"></i> View
                  </button>
                </td>
              </tr>
              <tr v-if="payments && payments.length === 0">
                <td colspan="5" class="text-center">No payments found</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div class="d-flex justify-content-center mt-3" v-if="pagination.total_pages > 1">
          <nav aria-label="Page navigation">
            <ul class="pagination">
              <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                <button class="page-link" @click="changePage(pagination.current_page - 1)">
                  Previous
                </button>
              </li>
              <li 
                v-for="page in pagination.total_pages" 
                :key="page"
                class="page-item" 
                :class="{ active: pagination.current_page === page }"
              >
                <button class="page-link" @click="changePage(page)">
                  {{ page }}
                </button>
              </li>
              <li class="page-item" :class="{ disabled: pagination.current_page === pagination.total_pages }">
                <button class="page-link" @click="changePage(pagination.current_page + 1)">
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Payment Details Modal -->
    <div class="modal fade" id="paymentDetailsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Payment Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedPayment">
              <div class="row mb-3">
                <div class="col-md-6">
                  <strong>Date:</strong> {{ formatDate(selectedPayment.received_date) }}
                </div>
                <div class="col-md-6">
                  <strong>Customer:</strong> {{ selectedPayment.customer.name }}
                </div>
              </div>
              
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Instrument</th>
                    <th>Detail</th>
                    <th class="text-end">Amount</th>
                    <th>Allocated</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="detail in selectedPayment.payment_details" :key="detail.id">
                    <td>{{ detail.instrument_name }}</td>
                    <td>{{ detail.detail }}</td>
                    <td class="text-end">{{ formatNumber(detail.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBranchStore } from '@/stores/branchStore'
import axios from '@/plugins/axios'
import { formatDate, formatNumber } from '@/utils/ezFormatter'
import { Modal } from 'bootstrap'

const branchStore = useBranchStore()
const payments = ref([])
const parentCustomers = ref([])
const selectedPayment = ref(null)
const paymentDetailsModal = ref(null)
const isLoading = ref(null)

const filters = ref({
  customer: '',
  date_from: new Date().toISOString().split('T')[0],
  date_to: new Date().toISOString().split('T')[0],
  is_fully_allocated: 'all'
})

const pagination = ref({
  current_page: 1,
  total_pages: 1,
  total_items: 0
})

const loadPayments = async () => {
  try {    
    isLoading.value = true;
    const params = {
      branch: branchStore.selectedBranch,
      page: pagination.value.current_page,
      ...filters.value
    }
    
    const response = await axios.get('/v1/chq/payments/', { params })
    console.log('Payments Array.isArray(response.data) :', Array.isArray(response.data) )
    payments.value = Array.isArray(response.data) ? response.data : response.data.results || [];
    if (payments?.value?.length)
      pagination.value = {
        current_page: 1,
        total_pages: 1,
        total_items:payments.value.length    
      // current_page: response.data.current_page,
      // total_pages: response.data.total_pages,
      // total_items: response.data.total_items      
      }    
    console.log('Payments list response.data:', response.data)
    console.log('Payments list response.data.results:', response.data.results)
    console.log('Payments list payments.value:', payments.value)

  } catch (error) {
    console.error('Error loading payments:', error);
  } finally {
    isLoading.value = false;
  }
}

const loadParentCustomers = async () => {
  try {
    const response = await axios.get('/v1/chq/customers/', {
      params: {
        branch: branchStore.selectedBranch,
        is_parent: true,
        is_active: true
      }
    })
    parentCustomers.value = response.data
  } catch (error) {
    console.error('Error loading customers:', error)
  }
}

const resetFilters = () => {
  filters.value = {
    customer: '',
    date_from: new Date().toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    is_fully_allocated: 'all'
  }
  loadPayments()
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.total_pages) {
    pagination.value.current_page = page
    loadPayments()
  }
}

const viewPaymentDetails = (payment) => {
  selectedPayment.value = payment
  if (!paymentDetailsModal.value) {
    paymentDetailsModal.value = new Modal(document.getElementById('paymentDetailsModal'))
  }
  paymentDetailsModal.value.show()
}

const getCustomerName = (customerId) => {
  const customer = parentCustomers.value.find(c => c.alias_id === customerId)
  return customer ? customer.name : 'Unknown'
}

const calculateTotalAmount = (payment) => {
  return payment.payment_details.reduce((sum, detail) => {
    return sum + parseFloat(detail.amount)
  }, 0)
}

const cashAndBankAmount = (payment) => {
  return payment.payment_details.reduce((sum, detail) => {    
    // Check if the amount is a valid number before adding it
    const amount = parseFloat(detail.amount);
    if (!isNaN(amount)) {
      if (detail.instrument_type === 1 || detail.instrument_type === 2) {
        return sum + amount;
      }
    } else {
      console.log('Invalid amount:', detail.amount);
    }
    return sum;
  }, 0);
}

const claimAmount = (payment) => {
  return payment.payment_details.reduce((sum, detail) => {    
    const amount = parseFloat(detail.amount);
    if (!isNaN(amount)) {
      if (detail.instrument_type === 3) {
        return sum + amount;
      }
    } else {
      console.log('Invalid amount:', detail.amount);
    }
    return sum;
  }, 0);
}

// const cashAndBankAmount = (payment) => {
//   return payment.payment_details.reduce((sum, detail) => {
//     console.log('cashAndBank Amount detail instrument type:', detail.instrument_type, detail.instrument_type === 1,detail.instrument_type === 2, detail.instrument_type === 3 )
//     if (detail.instrument_type === 1 || detail.instrument_type === 2) {
//       return sum + parseFloat(detail.amount)
//     }
//   }, 0)
// }

// const claimAmount = (payment) => {
//   return payment.payment_details.reduce((sum, detail) => {
//     console.log('cashAndBank Amount detail instrument type:', detail.instrument_type, detail.instrument_type === 1,detail.instrument_type === 2,detail.instrument_type === 3) 
//     // console.log('claim Amount detail instrument type:', detail)
//     if (detail.instrument_type === 3) {
//       return sum + parseFloat(detail.amount)
//     }
//   }, 0)
// }

onMounted(() => {
  loadParentCustomers()
  loadPayments()
})
</script>

<style scoped>
.table th {
  white-space: nowrap;
}
</style>