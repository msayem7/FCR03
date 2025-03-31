<template>
  <div class="card">
    <div class="card-header">Customer Claims</div>
    <div class="card-body p-0">
      <table class="table table-bordered m-0">
        <thead>
          <tr>
            <th style="width: 20%">Claims</th>
            <th style="width: 15%">Number</th>
            <th style="width: 50%">Details</th>
            <th style="width: 15%">Amount</th>
            <!-- <th style="width: 5%" class="text-center">X</th> -->
          </tr>
        </thead>
        <tbody>
          <tr v-for="(claim, index) in localClaims" :key="index">            
            <td>
              <input
                v-model="claim.claim_name"
                type="text"
                class="form-control border-0"
                placeholder="Claim Name"
                disabled
              >
            </td>
            <td>
              <input
                v-model="claim.claim_no"
                type="text"
                class="form-control border-0"
                placeholder="Claim No"
              >
            </td>
            <td>
              <input
                v-model="claim.details"
                type="text"
                class="form-control border-0"
                placeholder="Details"
              >
            </td>
            <td class="text-right align-middle">
              <input
                v-model="localClaims[index].formatted_amount"
                type="text"
                @blur="formatClaimAmount(index)"
                class="form-control border-0 text-end"
                placeholder="Amount"
              >
            </td>
            <!-- <td class="text-center align-middle">
              <button 
                @click="removeClaim(index)"
                class="btn btn-danger btn-sm py-0 px-2"
                title="Remove Claim"
                style="min-width: 28px;"
              >
                ×
              </button>
            </td> -->
          </tr>
        </tbody>
      </table>
      <!-- <div class="p-2">
        <button @click="addClaim" class="btn btn-sm btn-secondary">
          Add Claim
        </button>
      </div> -->
    </div>
  </div>
</template>


<script setup>
import { ref, watchEffect } from 'vue'
import { formatNumber, parseNumber } from '@/utils/ezFormatter'
// eslint-disable-next-line
const props = defineProps(['claims'])
// eslint-disable-next-line
const emit = defineEmits(['update:claims'])

const localClaims = ref(props.claims.map(c => ({
  ...c,
  formatted_amount: formatNumber(c.claim_amount)
})))

function updateClaims() {
  emit('update:claims', localClaims.value.map(c => ({
    ...c,
    claim_amount: parseNumber(c.formatted_amount)
  })))
}

// function addClaim() {
//   localClaims.value.push({
//     claim_no: '',
//     claim_name: 'New Claim',
//     details: '',
//     formatted_amount: formatNumber(0),
//     claim_amount: 0
//   })
//   updateClaims()
// }


function formatClaimAmount(index) {
  const parsed = parseNumber(localClaims.value[index].formatted_amount)
  localClaims.value[index].formatted_amount = formatNumber(parsed)
  localClaims.value[index].claim_amount = parsed
  updateClaims()
}

watchEffect(() => {
  localClaims.value = props.claims.map(c => ({
    ...c,
    formatted_amount: formatNumber(c.claim_amount)
  }))
})
</script>

<style scoped>
/* Match the cheques table styling */
.table th {
  background-color: #f8f9fa;
  vertical-align: middle;
  font-size: 0.9rem;
}

.form-control {
  background: transparent;
  padding: 0.25rem;
  font-size: 0.9rem;
}

.form-control:focus {
  box-shadow: none;
  background: white;
}

.btn-danger {
  line-height: 1.2;
  font-size: 1.1rem;
}

/* Disabled input styling */
.form-control:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}
</style>