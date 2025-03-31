<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Credit Invoices</h2>
      <router-link to="/credit-invoices/create" class="btn btn-success">
        Create New
      </router-link>
    </div>
    
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <input type="date" v-model="filters.dateFrom" class="form-control">
          </div>
          <div class="col-md-3">
            <input type="date" v-model="filters.dateTo" class="form-control">
          </div>
          <div class="col-md-4">
            <select v-model="filters.customer" class="form-select">
              <option value="">All Customers</option>
              <option v-for="c in customers" :value="c.alias_id" :key="c.alias_Id">{{ c.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <button @click="fetchInvoices" class="btn btn-primary w-100">Filter</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="table-responsive">      
      <table class="table table-striped  table-hover">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Customer</th>
            <th>Invoice Date</th>
            <th>Grace</th>
            <th>Payment Date</th>
            <th>Sale</th>
            <th>Return</th>
            <th>Net Sale</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>          
          <tr v-for="(invoice) in invoices" :key="invoice.alias_id">
            <td>{{ invoice.invoice_no }} </td>
            <td>{{ invoice.customer_name }}</td>
            <td>{{ formatDate(invoice.transaction_date) }}</td>
            <td>{{ parseInt(invoice.payment_grace_days) }}</td>
            <td>{{ formatDate(calculatePaymentDate(invoice)) }}</td>
            <td>{{ formatNumber(invoice.sales_amount) }}</td>
            <td>{{ formatNumber(invoice.sales_return) }}</td>
            <td>{{ formatNumber(invoice.sales_amount -invoice.sales_return)}}</td>
            <td>
              <router-link 
                :to="{ name: 'CreditInvoiceEdit', params: { aliasId: invoice.alias_id }}" 
                class="btn btn-sm btn-warning"
              >
                Edit
              </router-link>
            </td>
          </tr>
          <!-- Add empty state message -->
          <tr v-if="invoices.length === 0">
            <td colspan="6" class="text-center">No invoices found</td>
          </tr>
        </tbody>
      </table>
    
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useBranchStore } from '@/stores/branchStore'
import axios from '@/plugins/axios'
import { formatDate, formatNumber } from '@/utils/ezFormatter'


const store = useBranchStore()
const invoices = ref([])
const customers = ref([])
const filters = ref({
  dateFrom: '',
  dateTo: '',
  customer: ''
})

const fetchInvoices = async () => {
  try {
    if (!store.selectedBranch) {
      invoices.value = []
      throw new Error('Select a working office first')
    }

    const params = {
      branch: store.selectedBranch,
      transaction_date_after: filters.value.dateFrom,
      transaction_date_before: filters.value.dateTo,
      customer: filters.value.customer, 
      _t: new Date().getTime()
    }

    const { data } = await axios.get('/v1/chq/credit-invoices/', { params })
    invoices.value = data    
  } catch (error) {
    console.error('Fetch error:', error) // Add this debug log
    alert('Credit Invoice: ' + error.message)
  }
}

const fetchCustomers = async () => {
  try{
    const params = {
      is_active: true,
      branch: store.selectedBranch
    }
    const { data } = await axios.get('/v1/chq/customers/', { params })
    customers.value = data
  } catch (error) {
    console.error('Error loading customers: ', error)
    alert('Error loading customers: '+ error.message)
  }
  
}

const calculatePaymentDate = (invoice) => {
  if (!invoice.transaction_date) return ''
  const date = new Date(invoice.transaction_date)
  //console.log(invoice.invoice_no, date, date.getDate(), parseInt(invoice.payment_grace_days))
  
  if (invoice.payment_grace_days) 
    date.setDate(date.getDate() + parseInt(invoice.payment_grace_days))
   return date.toISOString().split('T')[0]
}

onMounted(() => {
  fetchCustomers()
  fetchInvoices()
})
watch([
  () => store.selectedBranch
], () => {
  fetchInvoices()
  fetchCustomers()
}, { immediate: true })


watch([
  () => store.refreshTrigger
], () => {
  fetchInvoices()
  fetchCustomers()
}, { immediate: true })

// watch([
//   () => store.selectedBranch,
//   () => store.refreshTrigger
// ], ()=>{
//   fetchInvoices,
//   fetchCustomers
// }, { immediate: true })
</script>

<style scoped>
.table-responsive {
  overflow-x: auto;
  max-height: none; /* Remove any height restrictions */
}

.table {
  width: 100%;
  margin-bottom: 1rem;
  border-collapse: collapse;
}

tbody tr {
  cursor: pointer;
}

tbody tr:hover {
  background-color: rgba(0,0,0,.075);
}
</style>
