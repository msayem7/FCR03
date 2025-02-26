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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="claim in claims" :key="claim.alias_id">
              <td>{{ claim.claim_name }}</td>
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
  
      <!-- Add/Edit Claim Modal -->
      <div class="modal fade" :class="{ show: isModalOpen }" tabindex="-1" :style="{ display: isModalOpen ? 'block' : 'none' }">
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
  const claims = ref([]);
  const isModalOpen = ref(false);
  const isEditing = ref(false);
  const currentClaim = ref({ claim_name: '', is_active: true });
  const errorMessage = ref('');
  
  const fetchClaims = async () => {
    if (branchStore.selectedBranch) {
      try {
        const response = await axios.get(`/master-claims/?branch=${branchStore.selectedBranch}`);
        claims.value = response.data;
      } catch (error) {
        errorMessage.value = 'Error fetching claims: ' + error.message;
      }
    }
  };
  
  watch(() => branchStore.selectedBranch, fetchClaims, { immediate: true });
  
  const openAddModal = () => {
    currentClaim.value = { claim_name: '', is_active: true };
    isEditing.value = false;
    isModalOpen.value = true;
  };
  
  const openEditModal = (claim) => {
    currentClaim.value = { ...claim };
    isEditing.value = true;
    isModalOpen.value = true;
  };
  
  const closeModal = () => {
    isModalOpen.value = false;
  };
  
  const saveClaim = async () => {
    try {
      if (isEditing.value) {
        await axios.put(`/master-claims/${currentClaim.value.alias_id}/`, currentClaim.value);
      } else {
        await axios.post('/master-claims/', { ...currentClaim.value, branch: branchStore.selectedBranch });
      }
      fetchClaims();
      closeModal();
    } catch (error) {
      errorMessage.value = 'Error saving claim: ' + error.message;
    }
  };
  
  const deleteClaim = async (alias_id) => {
    try {
      await axios.delete(`/master-claims/${alias_id}/`);
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