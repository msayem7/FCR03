<template>
  <div class="working-branch-selector mb-3">
    <select 
      v-model="branchStore.selectedBranch" 
      class="form-select form-select-sm"
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

// Load branches when the component mounts
onMounted(() => {
  branchStore.loadBranches();
  branchStore.selectedBranch = localStorage.getItem('workingBranch') || '';
});
</script>

<!-- <template>
  <div class="working-branch-selector mb-3">
    <select 
      v-model="store.selectedBranch" 
      class="form-select form-select-sm"
    >
      <option value="">Select Working Branch</option>
      <option 
        v-for="branch in store.branches" 
        :key="branch.alias_id"
        :value="branch.alias_id"
      >
         {{ branch.name }} 
      </option>
    </select>
  </div>
</template> -->

<!-- <template>
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
</template> -->



<!-- <script setup>
import { onMounted } from 'vue'
import { useBranchStore } from '@/stores/branchStore'

const store = useBranchStore()

const updateWorkingBranch = () => {
  store.triggerRefresh() // Add this line
  // eslint-disable-next-line 
  localStorage.setItem('workingBranch', selectedBranch.value)
}
onMounted(() => {
  store.loadBranches()
})
</script> -->


<!-- 
<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/plugins/axios'

const branches = ref([])
const selectedBranch = ref('')

const loadBranches = async () => {
  try {
    const { data } = await axios.get('/branches/')
    branches.value = data
  } catch (error) {
    console.error('Error loading branches:', error)
  }
}

const updateWorkingBranch = () => {
  // Store in Pinia or localStorage
  localStorage.setItem('workingBranch', selectedBranch.value)
}

onMounted(() => {
  loadBranches()
  selectedBranch.value = localStorage.getItem('workingBranch') || ''
})
</script> -->