<template>
  <div class="card">
    <div class="card-header">Received Cheques</div>
    <div class="card-body p-0">
      <table class="table table-bordered m-0">
        <thead>
          <tr>
            <th style="width: 15%">Cheque No</th>
            <th style="width: 20%">Date</th>
            <th style="width: 45%">Details</th>
            <th style="width: 15%">Amount</th>
            <th style="width: 5%" class="text-center">X</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(cheque, index) in cheques" :key="index">
            <td>
              <input
                type="text"
                v-model="cheque.cheque_no"
                class="form-control border-0"
                placeholder="Cheque No"
              >
            </td>
            <td>
              <input
                type="date"
                v-model="cheque.cheque_date"
                class="form-control border-0"
                @input="formatChequeDate(index)"
              >
            </td>
            <td>
              <input
                type="text"
                v-model="cheque.cheque_detail"
                class="form-control border-0"
                placeholder="Details"
              >
            </td>
            <td>
              <input
                type="text"
                v-model="localCheques[index].formatted_amount"
                @blur="formatChequeAmount(index)"
                class="form-control border-0 text-end"
                placeholder="Amount"
              >
            </td>
            <!-- <td>
              <input
                type="text"
                v-model="cheque.cheque_amount"
                class="form-control border-0 text-end"
                @input="formatChequeAmount(index)"
                placeholder="Amount"
              >
            </td> -->
            <td class="text-center align-middle">
              <button 
                @click="removeCheque(index)"
                class="btn btn-danger btn-sm py-0 px-2"
                title="Remove Cheque"
                style="min-width: 28px;"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="p-2">
        <button @click="addCheque" class="btn btn-sm btn-secondary">
          Add Cheque
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect  } from 'vue'
import { formatDate, parseDate, formatNumber, parseNumber } from '@/utils/ezFormatter'



// eslint-disable-next-line no-undef
const props = defineProps(['cheques'])
// eslint-disable-next-line no-undef
const emit = defineEmits(['update:cheques'])
const localCheques = ref(props.cheques.map(c => ({
  ...c,
  formatted_amount: formatNumber(c.cheque_amount)
})))


function updateCheques() {
  emit('update:cheques', localCheques.value.map(c => ({
    cheque_no: c.cheque_no,
    cheque_date: c.cheque_date,
    cheque_detail: c.cheque_detail,
    cheque_amount: parseNumber(c.formatted_amount)
  })))
}


function addCheque() {
  localCheques.value.push({
    cheque_no: '',
    cheque_date: new Date().toISOString().split('T')[0],
    cheque_detail: '',
    formatted_amount: formatNumber(0),
    cheque_amount: 0
  })
  updateCheques()
}



// function removeCheque(index) {
//   const newCheques = props.cheques.filter((_, i) => i !== index)
//   emit('update:cheques', newCheques)
// }

function removeCheque(index) {
  localCheques.value.splice(index, 1)
  updateCheques()
}

// function formatChequeDate(index) {
//   const newCheques = [...props.cheques]
//   newCheques[index].cheque_date = parseDate(newCheques[index].cheque_date)
//     .toISOString()
//     .split('T')[0]
//   emit('update:cheques', newCheques)
// }

// function formatChequeAmount(index) {
//   const newCheques = [...props.cheques]
//   const rawValue = newCheques[index].cheque_amount
//   const parsed = parseNumber(rawValue)

//   newCheques[index].cheque_amount = isNaN(parsed) ? 0 : parsed
//   newCheques[index].formatted_amount = formatNumber(parsed)
//   // formatNumber(
//   //   parseNumber(newCheques[index].cheque_amount)
//   // )
//   emit('update:cheques', newCheques)
// }

// Handle date changes
function formatChequeDate(index) {
  const date = parseDate(localCheques.value[index].cheque_date)
  localCheques.value[index].cheque_date = date.toISOString().split('T')[0]
  updateCheques()
}

// Format amount input
function formatChequeAmount(index) {
  const parsed = parseNumber(localCheques.value[index].formatted_amount)
  localCheques.value[index].formatted_amount = formatNumber(parsed)
  localCheques.value[index].cheque_amount = parsed
  updateCheques()
}


// Sync with parent changes (one-way)

watchEffect(() => {
  localCheques.value = props.cheques.map(c => ({
    ...c,
    formatted_amount: formatNumber(c.cheque_amount)
  }))
})
</script>

<style scoped>
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
</style>