<template>
    <div class="container mt-4">
      <WorkingBranchSelector />
      <div class="mt-4">
        <h2>Claim Categories</h2>
        <button class="btn btn-primary mb-3" @click="openAddModal">Add Category</button>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Claim Category Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="claim_category in claim_categories" :key="claim_category.alias_id">
              <td>{{ claim_category.category_name }}</td>
              <td>
                <span :class="{'badge bg-success': claim_category.is_active, 'badge bg-danger': !claim_category.is_active}">
                  {{ claim_category.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-warning me-2" @click="openEditModal(claim_category)">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Add/Edit Claim Modal -->
      <div class="modal fade" :class="{ show: isModalOpen }" tabindex="-1" :style="{ display: isModalOpen ? 'block' : 'none' }">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Edit Claim Category' : 'Add Claim Category' }}</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveClaimCategory">
                <div class="mb-3">
                  <label for="claimName" class="form-label">Claim Name</label>
                  <input type="text" class="form-control" id="claimName" v-model="currentClaimCategory.category_name" required />
                </div>
                <div class="mb-3">
                  <label for="claimStatus" class="form-label">Status</label>
                  <select class="form-select" id="claimStatus" v-model="currentClaimCategory.is_active" required>
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
      <div v-if="isModalOpen" class="modal-backdrop fade show"></div>
  
      <!-- Error Alert -->
      <div v-if="errorMessage" class="alert alert-danger mt-3">
        {{ errorMessage }}
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  import axios from '@/plugins/axios';
  import { useBranchStore } from '@/stores/branchStore';
  
  const branchStore = useBranchStore();
  const claim_categories = ref([]);
  const isModalOpen = ref(false);
  const isEditing = ref(false);
  const currentClaimCategory = ref({ category_name: '', is_active: true });
  const errorMessage = ref('');
  
  const fetchClaimCategories = async () => {
    if (branchStore.selectedBranch) {
      try {
        const response = await axios.get(`/v1/chq/claim-categories/?branch=${branchStore.selectedBranch}`);
        claim_categories.value = response.data;
      } catch (error) {
        errorMessage.value = 'Error fetching claim categories: ' + error.message;
      }
    }
  };
  
  watch(() => branchStore.selectedBranch, fetchClaimCategories, { immediate: true });
  
  const openAddModal = () => {
    currentClaimCategory.value = { category_name: '', is_active: true };
    isEditing.value = false;
    isModalOpen.value = true;
  };
  
  const openEditModal = (claim_category) => {
    currentClaimCategory.value = { ...claim_category };
    isEditing.value = true;
    isModalOpen.value = true;
  };
  
  const closeModal = () => {
    isModalOpen.value = false;
  };
  
  const saveClaimCategory = async () => {
    try {
      if (isEditing.value) {
        await axios.put(`/v1/chq/claim-categories/${currentClaimCategory.value.alias_id}/`, currentClaimCategory.value);
      } else {
        await axios.post('/v1/chq/claim-categories/', { ...currentClaimCategory.value, branch: branchStore.selectedBranch });
      }
      fetchClaimCategories();
      closeModal();
    } catch (error) {
      errorMessage.value = 'Error saving claim categry: ' + error.message;
    }
  };
  
//   const deleteClaim = async (alias_id) => {
//     try {
//       await axios.delete(`/v1/chq/master-claims/${alias_id}/`);
//       fetchClaims();
//     } catch (error) {
//       errorMessage.value = 'Error deleting claim: ' + error.message;
//     }
//   };
  </script>
  
  <style scoped>
  .modal {
    display: block;
    background-color: rgba(0, 0, 0, 0.5);
  }
  </style>