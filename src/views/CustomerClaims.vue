<template>
  <div class="customer-claims">
    
    <div v-if="loadingClaims" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading claims...</p>
    </div>

    <div v-else>
      <div >
        <table class="table table-striped">
          <thead>
            <tr>
              <th style="width: 40%">Claim Name</th>
              <th style="width: 30%">Claim Date</th>
              <th style="width: 30%">Claim Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="claim in claims" :key="claim.alias_id">
              <td>{{ claim.claim_name }}</td>        
              <td >
                <div class="col-12">
                  <input
                    type="date"
                    v-model="claim.claim_date"
                    class="form-control form-control-sm"
                    :disabled="!claim.is_active && !claim.existing"
                     style="min-width: 150px"
                  />
                </div>
              </td>
              <td>
                <div class="col-12">
                  <input
                    type="number"
                    v-model="claim.claim_amount"
                    @blur="validateNumber(claim)"
                    class="form-control form-control-sm"
                    :disabled="!claim.is_active && !claim.existing"
                    style="min-width: 150px"
                  />
                </div>                
              </td>
            </tr>
          </tbody>
        </table>
      </div>      
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

// Update input handler to validate numbers
const validateNumber = (claim) => {
  const value = parseFloat(claim.claim_amount)
  if (isNaN(value)) {
    claim.claim_amount = 0
  } else {
    claim.claim_amount = Math.max(0, value).toFixed(4)
  }
}


// Fetch claims for the selected branch and customer
const fetchClaims = async () => {
  try {
    loadingClaims.value = true;
    const params = {
      branch: branchStore.selectedBranch,
      is_active: true,
    };
    
//--------------------------------------
    const { data: masterClaimsData } = await axios.get('/v1/chq/master-claims/', { params });
    let claimsData1 = masterClaimsData.map((claim) => ({
        ...claim,
        claim_date: new Date().toISOString().split('T')[0],  // Default to today
        claim_amount: 0, // Default amount for new claims
        existing: false, // Indicates if this is an existing claim
    }));
    // console.log('claimsData1: ', claimsData1)
    if (props.invoiceAliasId){
      const { data: customerClaimsData } = await axios.get(`/v1/chq/customer-claims/?invoice=${props.invoiceAliasId}`);
      // console.log('customerClaimsData: ', customerClaimsData)
      const claimsData2 = customerClaimsData.map((claim) => ({
          ...claim,
          claim_date: claim?.claim_date?.split('T')[0],
          existing: true, // Indicates if this is an existing claim
      }));
      // console.log('claimsData2 : ', claimsData2)
      // Create a Set to track unique claim names in claimsData2
      const uniqueNames = new Set(claimsData2.map(claim => claim.claim_name));

      // console.log('uniqueNames: ', uniqueNames)
      // Filter out duplicates from claimsData1 based on claim.name
      claimsData1 = claimsData1.filter(claim => !uniqueNames.has(claim.claim_name));
      // console.log('claimsData1 Filtered: ', claimsData1)

      // Combine filtered claimsData1 with claimsData2
      claims.value = [...claimsData1, ...claimsData2];
      // console.log('Edit claims.value: ', claims.value)
    }else{
      claims.value = [...claimsData1]        
      // console.log('Add claims.value: ', claims.value)
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

/* Override Bootstrap's default input styles */
.form-control-sm {
  height: calc(1.5em + 0.5rem + 2px) !important;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  height: 1em;
}
</style>
<!-- 

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
</style> -->