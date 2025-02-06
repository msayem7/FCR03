<template>
    <div class="container mt-5">
      <h2>Cheque Receivables</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Cheque Number</th>
            <th>Bank Name</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cheque in chequeReceivables" :key="cheque.id">
            <td>{{ cheque.cheque_number }}</td>
            <td>{{ cheque.bank_name }}</td>
            <td>{{ cheque.amount }}</td>
            <td>{{ cheque.due_date }}</td>
            <td>{{ cheque.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import axios from '../plugins/axios';
  
  export default {
    setup() {
      const chequeReceivables = ref([]);
  
      const fetchChequeReceivables = async () => {
        const response = await axios.get('/cheque-receivables/');
        chequeReceivables.value = response.data;
      };
  
      onMounted(fetchChequeReceivables);
  
      return { chequeReceivables };
    },
  };
  </script>