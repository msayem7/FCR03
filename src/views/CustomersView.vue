<template>
    <div class="container mt-4">
      <h2>Customer Management</h2>
      <button @click="openForm(null)" class="btn btn-primary mb-3">Add New</button>
      
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Company Type</th>
            <th>Mother Company</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="org in organizations" :key="org.alias_id">
            <td>{{ org.name }}</td>
            <td>{{ org.is_mother_company ? 'Mother Company' : 'Branch' }}</td>
            <td>{{ org.mother_company_name || '-' }}</td>
            <td>
              <!-- <button @click="openForm(org)" class="btn btn-sm btn-warning">Edit</button> -->
              <button @click="openForm(org)" class="btn btn-sm btn-warning">
                <i class="bi-pencil-square"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
  
      <CustomerForm 
        v-if="showForm"
        :organization="selectedOrg"
        :mother-companies="motherCompanies"
        @close="handleFormClose"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import axios from '../plugins/axios'
  import CustomerForm from './CustomerForm.vue'
  
  const organizations = ref([])
  const motherCompanies = ref([])
  const showForm = ref(false)
  const selectedOrg = ref(null)
  
  const fetchData = async () => {
    try {
      const [orgsRes, mothersRes] = await Promise.all([
        axios.get('/organizations/'),
        axios.get('/organizations/?is_mother_company=true')
      ])
      organizations.value = orgsRes.data
      motherCompanies.value = mothersRes.data

      // console.log('mothersRes.data: ', mothersRes.data)
      // console.log('motherCompanies.value: ', motherCompanies.value)

    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }
  
  const openForm = (org) => {
    selectedOrg.value = org || null
    showForm.value = true
  }
  
  const handleFormClose = (saved) => {
    showForm.value = false
    if (saved) fetchData()
  }
  
  onMounted(fetchData)
  </script>