<template>
    <div class="container mt-4">
      <WorkingBranchSelector />
      <div class="mt-4">
        <h2>Claims</h2>
        <button class="btn btn-primary mb-3" @click="openAddModal">Add Claim</button>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Claim Name</th>
              <th>Claim Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="claim in master_claims" :key="claim.alias_id">
              <td>{{ claim.claim_name }}</td>
              <td>{{ categoryOptions[claim.category]}}</td>
              <td>
                <span :class="{'badge bg-success': claim.is_active, 'badge bg-danger': !claim.is_active}">
                  {{ claim.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-warning me-2" @click="openEditModal(claim)">Edit</button>
                <button class="btn btn-sm btn-danger" @click="deleteClaim(claim.alias_id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Add/Edit Modal -->
      <!-- <div class="modal fade" :class="{ show: isModalOpen }" tabindex="-1" :style="{ display: isModalOpen ? 'block' : 'none' }"> -->
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
                  <label for="claimName" class="form-label">Claim Name</label>
                  <input type="text" class="form-control" id="claimName" v-model="currentClaim.claim_name" required />
                </div>
                <!-- New Dropdown for Claim Category -->
                <!-- <div class="mb-3">
                  <label class="form-label">Claim Category</label>
                  <select v-model="currentClaim.claim_category" class="form-select" required>
                    <option v-for="category in claimCategories" 
                            :key="category.alias_id" 
                            :value="category.alias_id">
                      {{ category.category_name }}
                    </option>
                  </select>
                </div> -->
                <div class="mb-3">
                  <label class="form-label">Claim Category</label>
                  <select 
                    v-model="currentClaim.category" 
                    class="form-select" 
                    required
                  >
                    <option 
                      v-for="(label, value) in categoryOptions" 
                      :key="value" 
                      :value="value"
                    >
                      {{ label }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="claimStatus" class="form-label">Status</label>
                  <select class="form-select" id="claimStatus" v-model="currentClaim.is_active" required>
                    <option :value="true">Active</option>
                    <option :value="false">Inactive</option>
                  </select>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
                  <button type="submit" class="btn btn-primary">Save changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <!-- </div v-if="isModalOpen" class="modal-backdrop fade show"></div>
  
      
      <div v-if="errorMessage" class="alert alert-danger mt-3">
        {{ errorMessage }}
      </div> -->
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  import axios from '@/plugins/axios';
  import { useBranchStore } from '@/stores/branchStore';

  // category options
  const categoryOptions = ref({
    SRTN: 'Sales Return', 
    OTH: 'Other Claims'
  });
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
  const errorMessage = ref('');
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


  const fetchClaims = async () => {
    if (branchStore.selectedBranch) {
      try {
        const response = await axios.get(`/v1/chq/master-claims/?branch=${branchStore.selectedBranch}`);
        master_claims.value = response.data;
      } catch (error) {
        errorMessage.value = 'Error fetching claims: ' + error.message;
      }
    }
  };
  
  // watch(() => branchStore.selectedBranch, fetchClaims, { immediate: true });
  
  // const openAddModal = () => {
  //   currentClaim.value = { claim_name: '', is_active: true };
  //   isEditing.value = false;
  //   isModalOpen.value = true;
  // };
  
  // const openEditModal = (claim) => {
  //   currentClaim.value = { ...claim };
  //   isEditing.value = true;
  //   isModalOpen.value = true;
  // };
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
  
  const closeModal = () => {
    isModalOpen.value = false;
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
  // const saveClaim = async () => {
  //   try {
  //     if (isEditing.value) {
  //       await axios.put(`/v1/chq/master-claims/${currentClaim.value.alias_id}/`, currentClaim.value);
  //     } else {
  //       await axios.post('/v1/chq/master-claims/', { ...currentClaim.value, branch: branchStore.selectedBranch });
  //     }
  //     fetchClaims();
  //     closeModal();
  //   } catch (error) {
  //     errorMessage.value = 'Error saving claim: ' + error.message;
  //   }
  // };
  
  const deleteClaim = async (alias_id) => {
    try {
      await axios.delete(`/v1/chq/master-claims/${alias_id}/`);
      fetchClaims();
    } catch (error) {
      errorMessage.value = 'Error deleting claim: ' + error.message;
    }
  };
  </script>
  
  <style scoped>
  .modal {
    display: block;
    background-color: rgba(0, 0, 0, 0.5);
  }
  </style>