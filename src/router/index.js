import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/UserLogin.vue';
import CreditSales from '../components/CreditSales.vue';
import ChequeReceivables from '../components/ChequeReceivables.vue';

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/credit-sales', component: CreditSales },
    { path: '/cheque-receivables', component: ChequeReceivables },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.path !== '/' && !token) {
    next('/');
  } else {
    next();
  }
});

export default router;