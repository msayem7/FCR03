<template>
    <div class="modal" style="display: block; background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEdit ? 'Edit' : 'Add' }} customer</h5>
            <button type="button" class="btn-close" @click="closeForm"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm">
              <input type="hidden" v-model="formData.alias_id">
              <div class="mb-3">
                <label class="form-label">Name</label>
                <input v-model="formData.name" class="form-control" required>
              </div>
              
              <div class="mb-3 form-check">
                <input 
                  type="checkbox" 
                  v-model="formData.is_parent"
                  class="form-check-input"
                  @change="handleParentChange"
                >
                <label class="form-check-label">Is Parent</label>
              </div>
  
              <div class="mb-3" v-if="!formData.is_parent">
                <label class="form-label">Parent</label>
                <select 
                  v-model="formData.parent" 
                  class="form-select"
                  required
                >
                  <option v-for="mc in parents" :key="mc.alias_id" :value="mc.alias_id">
                    {{ mc.name}}
                  </option>
                </select>
              </div>
  
              <!-- Add other fields as needed -->
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeForm">Cancel</button>
                <button type="submit" class="btn btn-primary" >Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue'
  import axios from '../plugins/axios'

/* eslint-disable no-undef */
  const props = defineProps({
    customer: Object,
    parents: Array
  })
  
  const emit = defineEmits(['close'])
  /* eslint-enable no-undef */

  const formData = ref({
    id: null,
    name: '',
    is_parent: false,
    parent: null
  })

  
  //console.log('props.customer?.id',props.customer?.id)
  
  const isEdit = computed(() => !!props.customer?.alias_id)

  const resetForm = () => {
    formData.value = {
      id: null,
      name: '',
      is_parent: false,
      parent: null
    }
  }
  
  const handleParentChange = () => {
    if (formData.value.is_parent) {
      formData.value.parent = null
    }
  }
  
  const submitForm = async () => {
    try {
      const url = formData.value.alias_id
        ? `/customers/${formData.value.alias_id}/`
        : '/customers/'
        
      const method = formData.value.alias_id ? 'put' : 'post'
      
      await axios[method](url, formData.value)

      emit('close', true)

    } catch (error) {
      console.error('Error saving customer:', error)
    }
  }
  
  const closeForm = () => {
    resetForm()
    emit('close', false)
  }
  
  watch(() => props.customer, (newVal) => {
    if (newVal) {
      formData.value = { ...newVal }
    } else {
      resetForm()
    }
  }, { immediate: true })
  </script>