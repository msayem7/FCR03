<template>
    <div class="container mt-5">
      <h2>Credit Sales</h2>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Sale Date</th>
            <th>Amount</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in creditSales" :key="sale.id">
            <td>{{ sale.id }}</td>
            <td>{{ sale.sale_date }}</td>
            <td>{{ sale.amount }}</td>
            <td>{{ sale.description }}</td>
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
      const creditSales = ref([]);
  
      const fetchCreditSales = async () => {
        const response = await axios.get('/credit-sales/');
        creditSales.value = response.data;
      };
  
      onMounted(fetchCreditSales);
  
      return { creditSales };
    },
  };
  </script>