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
  import { ref, computed, onMounted } from 'vue';
  import { useAuthStore } from '@/stores/authStore';
  import axios from '../plugins/axios';
  
  export default {
    setup() {
      const creditSales = ref([]);

      const authStore = useAuthStore();
      const user =computed(()=> authStore.user);
      const fetchCreditSales = async () => {
        try{
          const response = await axios.get('/credit-sales/');
          creditSales.value = response.data;
        } catch(error){
          console.error('Error fetching credit sales', error);
        }

      };
  
      onMounted(fetchCreditSales);
  
      return { creditSales };
    },
  };
  </script>