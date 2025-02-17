<template>
    <div class="container mt-4">
      <h2 class="mb-4">{{ editing ? 'Edit' : 'Create' }} Invoice</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Invoice Number</label>
            <input v-model="form.invoice_no" type="text" class="form-control" required>
          </div>
          
          <div class="col-md-6">
            <label class="form-label">Customer</label>
            <select v-model="form.customer" class="form-select" required @change="updateGraceDays">
              <option v-for="c in customers" :value="c.alias_id" :key="c.alias_Id">{{ c.name }}</option>
            </select>
          </div>
  
          <div class="col-md-6">
            <label class="form-label">Transaction Date</label>
            <input v-model="form.transaction_date" type="date" class="form-control" required>
          </div>
  
          <div class="col-md-6">
            <label class="form-label">Due Amount</label>
            <input v-model="form.due_amount" type="number" step="0.01" class="form-control" required>
          </div>
  
          <div class="col-md-6">
            <label class="form-label">Grace Days</label>
            <input :value="graceDays" type="number" class="form-control" readonly>
          </div>
  
          <div class="col-md-6">
            <label class="form-label">Payment Date</label>
            <input :value="paymentDate" type="date" class="form-control" readonly>
          </div>
  
          <div class="col-12">
            <label class="form-label">Invoice Image</label>
            <input type="file" @change="handleFile" class="form-control">
          </div>
  
          <div class="col-12">
            <button type="submit" class="btn btn-primary me-2">Save</button>
            <router-link to="/credit-invoices" class="btn btn-secondary">Cancel</router-link>
          </div>
        </div>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from '@/plugins/axios'
  
  const route = useRoute()
  const router = useRouter()
  const editing = ref(false)
  const invoiceId = ref(null)
  const customers = ref([])
  const form = ref({
    invoice_no: '',
    customer: '',
    transaction_date: '',
    due_amount: 0,
    invoice_image: null,
    version: 1
  })
  
  const graceDays = computed(() => {
    const customer = customers.value.find(c => c.alias_id === form.value.customer)  //Neeed to check how many data this query consumes
    return customer?.grace_days || 0
  })
  
  const paymentDate = computed(() => {
    if (!form.value.transaction_date ) return  ''
    const date = new Date(form.value.transaction_date)
    if (graceDays.value) 
      date.setDate(date.getDate() + graceDays.value)   

    return date.toISOString().split('T')[0]
  })
  
  const handleFile = (e) => {
    form.value.invoice_image = e.target.files[0]
  }
  
  const fetchCustomers = async () => {
    const { data } = await axios.get('/customers/')
    customers.value = data
  }
  
  const handleSubmit = async () => {
    try {
      const branch = localStorage.getItem('workingBranch')
      if (!branch) throw new Error('Select a branch first')
      
      const formData = new FormData()
      Object.entries(form.value).forEach(([key, val]) => {
        if (key === 'invoice_image' && !val) return
        formData.append(key, val)
      })
      formData.append('branch', branch)
  
      if (editing.value) {
        await axios.put(`/credit-invoices/${invoiceId.value}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await axios.post('/credit-invoices/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      
      router.push('/credit-invoices')
    } catch (error) {
      alert(error.response?.data?.error || error.message)
    }
  }
  
  onMounted(async () => {
    await fetchCustomers()
    if (route.params.aliasId) {
      editing.value = true
      invoiceId.value =  route?.params?.aliasId
      //invoiceId.value = invoiceId.value ?  '?' +invoiceId.value : invoiceId.value
      const { data } = await axios.get(`/credit-invoices/${invoiceId?.value}/`)
      console.log('Voucher Entry data:', data)
      form.value = {
        ...data,
        // here customer is not a customer object. It is alias_id. as a result following code is replaceing the custome with invalid data.
        //customer: data.customer.alias_id,
        version: data.version
      }
    }
  })
  </script>