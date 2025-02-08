<template>
    <div class="modal" style="display: block; background: rgba(0,0,0,0.5)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEdit ? 'Edit' : 'Add' }} Organization</h5>
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
                  v-model="formData.is_mother_company"
                  class="form-check-input"
                  @change="handleMotherCompanyChange"
                >
                <label class="form-check-label">Is Mother Company</label>
              </div>
  
              <div class="mb-3" v-if="!formData.is_mother_company">
                <label class="form-label">Mother Company</label>
                <select 
                  v-model="formData.mother_company" 
                  class="form-select"
                  required
                >
                  <option v-for="mc in motherCompanies" :key="mc.alias_id" :value="mc.alias_id">
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
    organization: Object,
    motherCompanies: Array
  })
  
  const emit = defineEmits(['close'])
  /* eslint-enable no-undef */

  const formData = ref({
    id: null,
    name: '',
    is_mother_company: false,
    mother_company: null
  })

  
  //console.log('props.organization?.id',props.organization?.id)
  
  const isEdit = computed(() => !!props.organization?.alias_id)

  const resetForm = () => {
    formData.value = {
      id: null,
      name: '',
      is_mother_company: false,
      mother_company: null
    }
  }
  
  const handleMotherCompanyChange = () => {
    if (formData.value.is_mother_company) {
      formData.value.mother_company = null
    }
  }
  
  const submitForm = async () => {
    try {
      const url = formData.value.alias_id
        ? `/organizations/${formData.value.alias_id}/`
        : '/organizations/'
        
      const method = formData.value.alias_id ? 'put' : 'post'
      
      await axios[method](url, formData.value)

      emit('close', true)

    } catch (error) {
      console.error('Error saving organization:', error)
    }
  }
  
  const closeForm = () => {
    resetForm()
    emit('close', false)
  }
  
  watch(() => props.organization, (newVal) => {
    if (newVal) {
      formData.value = { ...newVal }
    } else {
      resetForm()
    }
  }, { immediate: true })
  </script>