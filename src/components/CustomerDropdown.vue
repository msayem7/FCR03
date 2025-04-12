<template>
  <div class="customer-selector-container">
    <!-- Parent Company Selection -->
    <div class="dropdown-section">
      <label class="dropdown-label">Parent Organization</label>
      <select
        v-model="selectedParent"
        class="form-select"
        :class="{ 'is-invalid': error }"
        @change="onParentChange"
      >
        <option value="">Select Parent Organization</option>
        <option 
          v-for="parent in parentOrganizations" 
          :key="parent.alias_id"
          :value="parent"  
        >
          {{ parent.name }} 
        </option>
      </select>
    </div>

    <!-- Customer Selection -->
    <div class="dropdown-section">
      <label class="dropdown-label">Customer</label>
      <select
        v-model="selectedCustomer"
        class="form-select"
        :class="{ 'is-invalid': error }"
        :disabled="!selectedParent"
        @change="onCustomerChange"
      >
        <option value="">Select Customer</option>
        <option 
          v-for="customer in filteredCustomers" 
          :key="customer.alias_id"
          :value="customer"  
        >
          {{ customer.name }} 
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useBranchStore } from '@/stores/branchStore'
import axios from '@/plugins/axios'

// eslint-disable-next-line no-undef
const props = defineProps({ 
  modelValue: Object,
  error: String,
  showLabels: {
    type: Boolean,
    default: true
  },
  layout: {
    type: String,
    default: 'side-by-side', // or 'stacked'
    validator: (value) => ['side-by-side', 'stacked'].includes(value)
  }
})

// eslint-disable-next-line no-undef
const emit = defineEmits(['update:modelValue'])
const customers = ref([])
const parentOrganizations = ref([])
const selectedParent = ref(null)
const selectedCustomer = ref(null)
const branchStore = useBranchStore()

const filteredCustomers = computed(() => {
  console.log("selectedParent.value :", selectedParent.value)
  console.log("customers.value :", customers.value)
  if (!selectedParent.value) return []
  return customers.value.filter(customer => 
    customer.parent === selectedParent.value.alias_id // || 
    // customer.alias_id === selectedParent.value.alias_id
  )
})

const loadCustomers = async () => {
  try {
    if (branchStore.selectedBranch) {
      // Load all active customers
      const customersResponse = await axios.get('/v1/chq/customers/', {
        params: {
          is_active: true,
          branch: branchStore.selectedBranch
        }
      })
      customers.value = customersResponse.data

      // Load only parent organizations
      const parentsResponse = await axios.get('/v1/chq/customers/', {
        params: {
          is_active: true,
          branch: branchStore.selectedBranch,
          is_parent: true
        }
      })
      parentOrganizations.value = parentsResponse.data
    } else {
      customers.value = []
      parentOrganizations.value = []
    }
    resetSelections()
  } catch (error) {
    console.error('Error loading customers:', error)
  }
}

const resetSelections = () => {
  selectedParent.value = null
  selectedCustomer.value = null
  emit('update:modelValue', null)
}

const onParentChange = () => {
  selectedCustomer.value = null
  emit('update:modelValue', null)
}

const onCustomerChange = () => {
  emit('update:modelValue', selectedCustomer.value)
}

onMounted(loadCustomers)

watch(() => branchStore.selectedBranch, loadCustomers, { immediate: true })
</script>

<style scoped>
.customer-selector-container {
  display: flex;
  gap: 20px;
  width: 100%;
}

.dropdown-section {
  flex: 1;
  min-width: 0;
}

.dropdown-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.form-select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875em;
  margin-top: 4px;
}

/* Stacked layout option */
.customer-selector-container.stacked {
  flex-direction: column;
  gap: 12px;
}
</style>