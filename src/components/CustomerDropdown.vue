<template>
    <div :class="['custom-dropdown', { 'form-floating': showLabel }]">
      <select
        v-model="selectedCustomer"
        class="form-select"
        :class="{ 'is-invalid': error }"
        @change="$emit('update:modelValue', selectedCustomer)"
        :aria-label="showLabel ? null : 'Customer selection'"
      >
        <option value="" disabled>Select Customer</option>
        <option 
          v-for="customer in customers" 
          :key="customer.alias_id"
          :value="customer.alias_id"
        >
          {{ customer.name }} 
          <!-- ({{ customer.alias_id }}) -->
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
    modelValue: String,
    error: String,
    showLabel: {
        type: Boolean,
        default: true
    }
})
// eslint-disable-next-line no-undef
const emit = defineEmits(['update:modelValue'])

const customers = ref([])
const selectedCustomer = ref('')

const branchStore = useBranchStore()
  
onMounted(async () => {
    try {
      const params = {
        is_active: true,
        branch: branchStore.selectedBranch
      }
      const response = await axios.get('/v1/chq/customers/', { params }) //await axios.get('/v1/chq/active-customers/')
      customers.value = response.data
    } catch (error) {
      console.error('Error loading customers:', error)
    }
})
</script>