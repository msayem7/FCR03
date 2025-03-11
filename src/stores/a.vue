<template>
    <div class="container mt-4">
      <WorkingBranchSelector />
      <div class="mt-4">
        <h2>Master Claims</h2>
        <button class="btn btn-primary mb-3" @click="openAddModal">Add Claim</button>
        <table class="table table-striped">
          <!-- Existing table structure -->
          <tbody>
            <tr v-for="claim in master_claims" :key="claim.alias_id">
              <td>{{ claim.claim_name }}</td>
              <td>{{ claim.claim_category_name }}</td>
              <!-- Other columns -->
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Add/Edit Modal -->
      <div class="modal fade" :class="{ show: isModalOpen }" :style="{ display: isModalOpen ? 'block' : 'none' }">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Edit Claim' : 'Add Claim' }}</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveClaim">
                <div class="mb-3">
                  <label class="form-label">Claim Name</label>
                  <input v-model="currentClaim.claim_name" type="text" class="form-control" required>
                </div>
                
                <!-- New Dropdown for Claim Category -->
                <div class="mb-3">
                  <label class="form-label">Claim Category</label>
                  <select v-model="currentClaim.claim_category" class="form-select" required>
                    <option v-for="category in claimCategories" 
                            :key="category.alias_id" 
                            :value="category.alias_id">
                      {{ category.category_name }}
                    </option>
                  </select>
                </div>
  
                <!-- Existing form elements -->
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
                  <button type="submit" class="btn btn-primary">Save changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  import axios from '@/plugins/axios';
  import { useBranchStore } from '@/stores/branchStore';
  
  const branchStore = useBranchStore();
  const master_claims = ref([]);
  const claimCategories = ref([]); // New reactive variable for categories
  const isModalOpen = ref(false);
  const isEditing = ref(false);
  const currentClaim = ref({
    claim_name: '',
    claim_category: null,  // New field
    is_active: true
  });
  
  // Fetch both claims and categories when branch changes
  watch(() => branchStore.selectedBranch, async (newBranch) => {
    if (newBranch) {
      try {
        const [claimsRes, categoriesRes] = await Promise.all([
          axios.get(`/v1/chq/master-claims/?branch=${newBranch}`),
          axios.get(`/v1/chq/claim-categories/?branch=${newBranch}`)
        ]);
        
        master_claims.value = claimsRes.data;
        claimCategories.value = categoriesRes.data;
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
  }, { immediate: true });
  
  // Existing methods with modifications
  const openAddModal = () => {
    currentClaim.value = { 
      claim_name: '', 
      claim_category: null, 
      is_active: true 
    };
    isEditing.value = false;
    isModalOpen.value = true;
  };
  
  const openEditModal = (claim) => {
    currentClaim.value = { 
      ...claim,
      claim_category: claim.claim_category?.alias_id // Preselect category
    };
    isEditing.value = true;
    isModalOpen.value = true;
  };
  
  const saveClaim = async () => {
    try {
      const payload = {
        ...currentClaim.value,
        branch: branchStore.selectedBranch
      };
  
      if (isEditing.value) {
        await axios.put(`/v1/chq/master-claims/${currentClaim.value.alias_id}/`, payload);
      } else {
        await axios.post('/v1/chq/master-claims/', payload);
      }
      
      fetchClaims();
      closeModal();
    } catch (error) {
      console.error('Error saving claim:', error);
    }
  };
  </script>