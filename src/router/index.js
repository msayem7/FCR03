import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/UserLogin.vue';
import ChequeListView from '../views/ChequeListView.vue';
import { useAuthStore } from '@/stores/authStore';
import DashboardView from '../views/DashboardView';
import CustomersView from '../views/CustomersView';
import DuePayementsView from '../views/DuePayementsView';
import PendingListView from '../views/PendingListView';
import ChequeDepositedView from '../views/ChequeDepositedView';
import SalesReport from '../views/SalesReport';
import SalesDetailReport from '../views/SalesDetailReport';
import ChargesListView from '@/views/ChargesListView.vue';
import DiductionsView from '@/views/DiductionsView.vue';

const routes = [
    // { path: '/', redirect: '/login' },
    { path: '/', name: 'login', component: Login, meta: { hideNav: true }},
    { path: '/cheque-dashboard', name: 'cheque-dashboard', component: DashboardView, meta: {requiresAuth: true, hideNav: false} },
    { path: '/customers', name: 'customers', component: CustomersView, meta: {requiresAuth: true, hideNav: false} },
    { path: '/charges-list', name: 'chargesList', component: ChargesListView, meta: {requiresAuth: true, hideNav: false} },
    { path: '/deductions', name: 'deductions', component: DiductionsView, meta: {requiresAuth: true, hideNav: false} },
    { path: '/cheques', name: 'cheques', component: ChequeListView, meta: {requiresAuth: true, hideNav: false} },
    { path: '/cheques/pending', name: 'pending', component: PendingListView, meta: {requiresAuth: true, hideNav: false} },  //Check not yet deposited
    { path: '/cheques/deposited', name: 'deposited', component: ChequeDepositedView, meta: {requiresAuth: true, hideNav: false} },
    { path: '/reports/sales', name: 'sales', component: SalesReport, meta: {requiresAuth: true, hideNav: false} },
    { path: '/reports/sale/detail', name: 'sale-detail', component: SalesDetailReport, meta: {requiresAuth: true, hideNav: false} },
    { path: '/due-payements', name: 'due-payements', component: DuePayementsView, meta: {requiresAuth: true, hideNav: false} },
    {
      path: '/branches',
      name: 'branches',
      component: () => import('@/views/BranchListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/branches/create',
      name: 'branch-create',
      component: () => import('@/views/BranchFormView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/branches/edit/:aliasId',
      name: 'branch-edit',
      component: () => import('@/views/BranchEditView.vue'),
      meta: { requiresAuth: true }
    },
    // Invoice routes
    {
      path: '/credit-invoices/create',
      name: 'CreditInvoiceCreate',
      component: () => import('@/views/CreditInvoiceEntry.vue'),
      meta: { requiresAuth: true, hideNav: false }
    },
    {
      path: '/credit-invoices/edit/:aliasId',
      name: 'CreditInvoiceEdit',
      component: () => import('@/views/CreditInvoiceEntry.vue'),
      meta: { requiresAuth: true, hideNav: false }
    },
    {
      path: '/credit-invoices',
      name: 'CreditInvoiceList',
      component: () => import('@/views/CreditInvoiceList.vue'),
      meta: { requiresAuth: true, hideNav: false }
    },
    {
      path: '/cheques',
      name: 'cheques',
      component: () => import('@/views/ChequeListView.vue'),
      meta: { requiresAuth: true, hideNav: false }
    },
    {
      path: '/cheques/create',
      name: 'cheque-create',
      component: () => import('@/views/ChequeEntryView.vue'),
      meta: { requiresAuth: true, hideNav: false }
    },
    {
      path: '/cheques/edit/:aliasId',
      name: 'cheque-edit',
      component: () => import('@/views/ChequeEntryView.vue'),
      meta: { requiresAuth: true, hideNav: false }
    },
    {
      path: '/claims/',
      name: 'Master-Claim',
      component: () => import('@/views/ClaimPage.vue'),
      meta: { requiresAuth: true, hideNav: false }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
  //const token = localStorage.getItem('token');
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.token)  { 
    next('/');
  } else {
    next();
  }
});

export default router;