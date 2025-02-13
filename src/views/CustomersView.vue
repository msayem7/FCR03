<template>
    <div class="container mt-4">
      <h2>Customer Management</h2>
      <button @click="openForm(null)" class="btn btn-primary mb-3">Add New</button>
      
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Parent</th>
            <th>Grace Days</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in customers" :key="customer.alias_id">
            <td>{{ customer.name }}</td>
            <td>{{ customer.is_parent ? 'Parent' : 'Branch/Individual' }}</td>
            <td>{{ customer.parent_name || '-' }}</td>
            <td>{{ customer.grace_days || '-' }}</td>
            <td>
              <!-- <button @click="openForm(customer)" class="btn btn-sm btn-warning">Edit</button> -->
              <button @click="openForm(customer)" class="btn btn-sm btn-warning">
                <i class="bi-pencil-square"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
  
      <CustomerForm 
        v-if="showForm"
        :customer="selectedCus"
        :parents="parents"
        @close="handleFormClose"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import axios from '../plugins/axios'
  import CustomerForm from './CustomerForm.vue'
  
  const customers = ref([])
  const parents = ref([])
  const showForm = ref(false)
  const selectedCus = ref(null)
  
  const fetchData = async () => {
    try {
      const [customersRes, parentRes] = await Promise.all([
        axios.get('/customers/'),
        axios.get('/customers/?is_parent=true')
      ])
      customers.value = customersRes.data
      parents.value = parentRes.data

      // console.log('parentRes.data: ', parentRes.data)
      // console.log('parents.value: ', parents.value)

    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }
  
  const openForm = (customer) => {
    console.log(customer);
    
    selectedCus.value = customer || null
    showForm.value = true
  }
  
  const handleFormClose = (saved) => {
    showForm.value = false
    if (saved) fetchData()
  }
  
  onMounted(fetchData)
  </script>