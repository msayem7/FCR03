<template>
    <div class="customer-claims">
      <h4>Customer Claims</h4>
      <div v-if="loadingClaims" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading claims...</p>
      </div>
  
      <div v-else>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Claim Name</th>
              <th>Claim Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="claim in claims" :key="claim.alias_id">
              <td>{{ claim.claim_name }}</td>
              <td>
                <input
                  type="number"
                  v-model="claim.claim_amount"
                  class="form-control"
                  :disabled="!claim.is_active && !claim.existing"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, defineProps, defineExpose, onMounted, watch } from 'vue';
  import axios from '@/plugins/axios';
  import { useBranchStore } from '@/stores/branchStore';
  
  const props = defineProps({
    invoiceAliasId: String, // For existing invoices 
    customerAliasId: String, // For new invoices 
  });
  
  const branchStore = useBranchStore();
  const claims = ref([]);
  const loadingClaims = ref(false);
  
  // Fetch claims for the selected branch and customer
  const fetchClaims = async () => {
    try {
      loadingClaims.value = true;
      const params = {
        branch: branchStore.selectedBranch,
        is_active: true,
      };
      
//--------------------------------------
      const { data: masterClaimsData } = await axios.get('/master-claims/', { params });
      //const { data1 } = await axios.get('/master-claims/', { params });
      console.log('masterClaimsData: ', masterClaimsData)
      let claimsData1 = masterClaimsData.map((claim) => ({
          ...claim,
          claim_amount: 0, // Default amount for new claims
          existing: false, // Indicates if this is an existing claim
      }));
      console.log('claimsData1: ', claimsData1)
      console.log('props.invoiceAliasId: ', props.invoiceAliasId)
      if (props.invoiceAliasId){
        const { data: customerClaimsData } = await axios.get(`/customer-claims/?invoice=${props.invoiceAliasId}`);
        console.log('customerClaimsData: ', customerClaimsData)
        const claimsData2 = customerClaimsData.map((claim) => ({
            ...claim,
            existing: true, // Indicates if this is an existing claim
        }));

        // Create a Set to track unique claim names in claimsData2
        const uniqueNames = new Set(claimsData2.map(claim => claim.name));

        // Filter out duplicates from claimsData1 based on claim.name
        claimsData1 = claimsData1.filter(claim => !uniqueNames.has(claim.name));

        // Combine filtered claimsData1 with claimsData2
        claims.value = [...claimsData1, ...claimsData2];
        console.log('Edit claims.value: ', claims.value)
      }else{
        claims.value = [...claimsData1]        
        console.log('Add claims.value: ', claims.value)
      }
      
      // // Fetch active claims for new invoices
      // if (!props.invoiceAliasId) {
      //   const { data } = await axios.get('/master-claims/', { params });
        // claims.value = data.map((claim) => ({
        //   ...claim,
        //   claim_amount: 0, // Default amount for new claims
        //   existing: false, // Indicates if this is an existing claim
        // }));
      // } else {
      //   // Fetch existing claims for the invoice
      //   const { data } = await axios.get(`/customer-claims/?invoice=${props.invoiceAliasId}`);
      //   claims.value = data.map((claim) => ({
      //     ...claim,
      //     existing: true, // Indicates if this is an existing claim
      //   }));
      // }
//-----------------------------------------

    } catch (error) {
      console.error('Error fetching claims:', error);
      claims.value = []; // Set empty array on error
    } finally {
      loadingClaims.value = false;
    }
  };
  
  // Watch for changes in the selected branch or customer. 
  // Watch is not required. If new then all active master claim are fetched. 
  // If existing then only  the existing claims  + new active which are not in existing claims are fetched
  // If existing then only  the existing claims  + new active which are not in existing claims are fetched
  // and called from onmounted hook 

  // watch(
  //   () => [branchStore.selectedBranch, props.customerAliasId],
  //   () => {
  //     if (branchStore.selectedBranch && props.customerAliasId) {
  //       fetchClaims();
  //     }
  //   },
  //   { immediate: true }
  // );
 
onMounted(async () => {
  await fetchClaims();
})
  // Expose the claims data to the parent component
  defineExpose({
    claims,
  });
  </script>
  
  <style scoped>
  .customer-claims {
    margin-top: 20px;
  }
  
  .table {
    margin-top: 10px;
  }
  
  .form-control {
    width: 100px;
  }
  </style>