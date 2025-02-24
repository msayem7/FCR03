<template>
  <div class="working-branch-selector mb-3">
    <select 
      v-model="selectedBranch" 
      class="form-select form-select-sm"
      @change="updateWorkingBranch"
    >
      <option value="">Select Working Branch</option>
      <option 
        v-for="branch in branches" 
        :key="branch.alias_id" 
        :value="branch.alias_id"
      >
        {{ branch.name }} ({{ branch.alias_id }})
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useWBStore } from '@/stores/branchStore' //WB = Working Branch 
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const branchStore = useWBStore()
const branches = ref([])
const selectedBranch = ref('')

onMounted(async () => {
  await branchStore.fill() // Ensure this method is called correctly
  branches.value = branchStore.branches
  selectedBranch.value = localStorage.getItem('workingBranch') || ''
})

const updateWorkingBranch = () => {
  branchStore.updateWorkingBranch(selectedBranch.value)
}
</script>
