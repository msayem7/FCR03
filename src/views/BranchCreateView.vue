<template>
    <div>
      <h2>Create New Branch</h2>
      <BranchFormView @submit="handleCreate"/>
    </div>
  </template>
  
  <script setup>
  //import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import axios from '@/plugins/axios'
  import BranchFormView from '@/views/BranchFormView.vue'
  
  const router = useRouter()
  
  const handleCreate = async (formData) => {
    try {
      const { data } = await axios.post('/v1/chq/branches/', formData)
      router.push({ name: 'branch-edit', params: { aliasId: data.alias_id } })
    } catch (error) {
      // Handle error
    }
  }
  </script>