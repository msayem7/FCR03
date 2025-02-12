<template>
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Branch Management</h2>
        <router-link to="/branches/create" class="btn btn-primary">
          <i class="bi bi-plus-circle me-2"></i>Create New Branch
        </router-link>
      </div>
  
      <div class="card shadow">
        <div class="card-body">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Parent</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="branch in branches" :key="branch.alias_id">
                <td>{{ branch.name }}</td>
                <td>{{ branchTypeMap[branch.branch_type] }}</td>
                <td>{{ getParentName(branch.parent) }}</td>
                <td>{{ formatDate(branch.updated_at) }}</td>
                <td>
                  <router-link 
                    :to="`/branches/edit/${branch.alias_id}`" 
                    class="btn btn-sm btn-outline-secondary me-2"
                  >
                    Edit
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import axios from '@/plugins/axios'
  
  const branches = ref([])
  const branchTypeMap = {
    1: 'Head Office',
    2: 'Branch'
  }
  
  const loadBranches = async () => {
    try {
      axios.get('/branches/'):
     
      // const response = await axios.get('/branches/');
      // const data = response.data;
      // the short form of above two lines is const { data } = await axios.get('/branches/') 
      const { data } = await axios.get('/branches/') 
     
      branches.value = data
      branches.value.forEach(branch => {
        console.log(`Branch: ${branch.name}, Updated At: ${branch.updated_at}`);
      });
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }
  
  const getParentName = (parent) => {
    return branches.value.find(b => b.alias_id === parent)?.name || '-'
  }


//   const formatDate(datetime) {
//       if (!datetime) return '';
//       const date = new Date(datetime);
//       const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
//       return date.toLocaleDateString(undefined, options);
//     }

  const formatDate = (dateString) => {
    console.log('dateString: ', dateString)
    return new Date(dateString).toLocaleDateString()
  }
  
  onMounted(loadBranches)
  </script>