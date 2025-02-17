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
  
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in invoices" :key="invoice.alias_id">
            <td>{{ invoice.invoice_no }}</td>
            <td>{{ invoice.customer_name }}</td>
            <td>{{ new Date(invoice.transaction_date).toLocaleDateString() }}</td>
            <td>{{ invoice.due_amount }}</td>
            <td>
              <router-link 
                :to="{ name: 'credit-invoice-edit', params: { aliasId: invoice.alias_id }}" 
                class="btn btn-sm btn-warning"
              >
                Edit
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  import { useBranchStore } from '@/stores/branchStore'
  import axios from '@/plugins/axios'
  
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
      throw new Error('Select a branch first')
      }
    
      // const branch = localStorage.getItem('workingBranch')
      // if (!branch) throw new Error('Select a branch first')

      const params = {
        branch: store.selectedBranch,
        transaction_date_after: filters.value.dateFrom,
        transaction_date_before: filters.value.dateTo,
        customer: filters.value.customer
      }
            
      const { data } = await axios.get('/credit-invoices/', { params })
      invoices.value = data    
    } catch (error) {
      alert('Credit Invoice :'+ error.message)
    }
    
  // Add watchers
  watch([
    () => store.selectedBranch,
    () => store.refreshTrigger
  ], fetchInvoices)

  }
  
  const fetchCustomers = async () => {
    const { data } = await axios.get('/customers/')
    customers.value = data
  }
  
  onMounted(() => {
    fetchCustomers()
    fetchInvoices()
  })
  </script>