<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between mb-4">
      <h2>Payments</h2>
      <router-link to="/payments/new" class="btn btn-primary">
        <i class="bi bi-plus-circle"></i> New Payment
      </router-link>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Cash</th>
                <th>Non-Cash</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in payments" :key="payment.payment_alias_id">
                <td>{{ payment.payment_alias_id }}</td>
                <td>{{ payment.customer_name }}</td>
                <td>{{ formatDate(payment.received_date) }}</td>
                <td>{{ formatCurrency(payment.total_payment) }}</td>
                <td>{{ formatCurrency(payment.cash_payment) }}</td>
                <td>{{ formatCurrency(payment.non_cash_payment) }}</td>
                <td>
                  <button 
                    @click="toggleDetails(payment.payment_alias_id)" 
                    class="btn btn-sm btn-outline-info"
                  >
                    {{ visibleDetails.includes(payment.payment_alias_id) ? 'Hide' : 'View' }} Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Payment Details Accordion -->
        <div v-for="payment in payments" :key="payment.payment_alias_id + '-details'">
          <div v-if="visibleDetails.includes(payment.payment_alias_id)" class="mt-3">
            <h5>Payment Details</h5>
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Amount</th>
                  <th>Details</th>
                  <th>Allocated</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(detail, index) in payment.payment_details" :key="index">
                  <td>{{ detail.payment_instrument }}</td>
                  <td>{{ formatCurrency(detail.amount) }}</td>
                  <td>{{ detail.detail }}</td>
                  <td>
                    <i v-if="detail.is_allocated" class="bi bi-check-circle text-success"></i>
                    <i v-else class="bi bi-x-circle text-danger"></i>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="isLoading" class="text-center my-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-if="!isLoading && payments.length === 0" class="text-center my-4">
          No payments found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/plugins/axios'
import { useBranchStore } from '@/stores/branchStore'
//import { formatDate, formatCurrency } from '@/utils/ezformatter'

const branchStore = useBranchStore()
const payments = ref([])
const visibleDetails = ref([])
const isLoading = ref(false)

const loadPayments = async () => {
  try {
    isLoading.value = true
    const response = await axios.get('/api/payments/summary/', {
      params: {
        branch: branchStore.selectedBranch
      }
    })
    payments.value = response.data
  } catch (error) {
    console.error('Error loading payments:', error)
  } finally {
    isLoading.value = false
  }
}

const toggleDetails = (paymentId) => {
  const index = visibleDetails.value.indexOf(paymentId)
  if (index > -1) {
    visibleDetails.value.splice(index, 1)
  } else {
    visibleDetails.value.push(paymentId)
  }
}

onMounted(() => {
  loadPayments()
})
</script>