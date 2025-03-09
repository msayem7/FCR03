<template>
  <div class="working-branch-selector mb-3">
    <select 
      v-model="branchStore.selectedBranch" 
      class="form-select form-select-sm"
      @change="updateWorkingBranch"
    >
      <option value="">Select Working Branch</option>
      <option 
        v-for="branch in branchStore.branches" 
        :key="branch.alias_id"
        :value="branch.alias_id"
      >
        {{ branch.name }} <!--({{ branch.alias_id }}) -->
      </option>
    </select>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'; // Import onMounted
import { useBranchStore } from '@/stores/branchStore'

const branchStore = useBranchStore();

const updateWorkingBranch = () => {
  branchStore.setWorkingBranch(branchStore.selectedBranch);
};

// Load branches when the component mounts
onMounted(() => {
  branchStore.loadBranches();
  branchStore.selectedBranch = localStorage.getItem('workingBranch') || '';
});
</script>
