<template>
  <div :class="['custom-dropdown', { 'form-floating': showLabel }]">
    <select
      v-model="selectedCustomer"
      class="form-select"
      :class="{ 'is-invalid': error }"
      :aria-label="showLabel ? null : 'Customer selection'"
      @change="$emit('update:modelValue', selectedCustomer)"
    >
      <option value="" disabled>Select Customer</option>
      <option 
        v-for="customer in customers" 
        :key="customer.alias_id"
        :value="customer"  
      >
        {{ customer.name }}
      </option>
    </select>
    <label v-if="showLabel" class="dropdown-label">Customer</label>
    <div v-if="error" class="invalid-feedback">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBranchStore } from '@/stores/branchStore'
import axios from '@/plugins/axios'

// eslint-disable-next-line no-undef
const props = defineProps({ 
    modelValue: Object,  
    error: String,
    showLabel: {
        type: Boolean,
        default: true
    }
})

// eslint-disable-next-line no-undef
const emit = defineEmits(['update:modelValue'])
const customers = ref([])
const selectedCustomer = ref(null)  
const branchStore = useBranchStore()

onMounted(async () => {
    try {
      const response = await axios.get('/v1/chq/customers/', {
        params: {
          is_active: true,
          branch: branchStore.selectedBranch
        }
      })
      customers.value = response.data
    } catch (error) {
      console.error('Error loading customers:', error)
    }
})
</script>

