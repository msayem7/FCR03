<template>
    <div>
      <h2>Create New Branch</h2>
      <BranchForm @submit="handleCreate"/>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import axios from '@/plugins/axios'
  import BranchForm from '@/components/BranchForm.vue'
  
  const router = useRouter()
  
  const handleCreate = async (formData) => {
    try {
      const { data } = await axios.post('/branches/', formData)
      router.push({ name: 'branch-edit', params: { aliasId: data.alias_id } })
    } catch (error) {
      // Handle error
    }
  }
  </script>