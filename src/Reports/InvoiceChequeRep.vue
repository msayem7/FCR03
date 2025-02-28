<!-- ReportPage.vue -->
<template>
    <div class="container mt-4">
      <div class="card">
        <div class="card-header">
          <h3 class="mb-0">CI vs Cheque Report</h3>
        </div>
        <div class="card-body">
          <div class="row mb-3 g-3">
            <div class="col-md-3">
              <label class="form-label">Branch</label>
              <WorkingBranchSelector />
            </div>
            <div class="col-md-3">
              <label class="form-label">From Date</label>
              <input type="date" class="form-control" v-model="filters.date_from">
            </div>
            <div class="col-md-3">
              <label class="form-label">To Date</label>
              <input type="date" class="form-control" v-model="filters.date_to">
            </div>
            <div class="col-md-3">
              <label class="form-label">Due Amount Range</label>
              <div class="input-group">
                <input type="number" class="form-control" placeholder="Min" v-model="filters.min_amount">
                <input type="number" class="form-control" placeholder="Max" v-model="filters.max_amount">
              </div>
            </div>
          </div>
  
          <div class="d-flex gap-2 mb-3">
            <button class="btn btn-primary" @click="loadReport">
              <i class="bi bi-search"></i> Generate
            </button>
            <button class="btn btn-success" @click="exportExcel">
              <i class="bi bi-file-earmark-excel"></i> Excel
            </button>
            <button class="btn btn-danger" @click="exportPDF">
              <i class="bi bi-file-earmark-pdf"></i> PDF
            </button>
          </div>
  
          <div v-if="loading" class="text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
  
          <div v-if="reportData.length" class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Due Amount</th>
                  <th>Claims</th>
                  <th>Net Sales</th>
                  <th>Total Due</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in reportData" :key="index">
                  <td>{{ item.invoice_no }}</td>
                  <td>{{ formatDate(item.transaction_date) }}</td>
                  <td>{{ item.due_amount }}</td>
                  <td>{{ item.claims }}</td>
                  <td>{{ item.net_sales }}</td>
                  <td :class="{ 'text-danger': item.total_due < 0 }">
                    {{ item.total_due }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import axios from '@/plugins/axios'
  import { useBranchStore } from '@/stores/branchStore'
  import { format } from 'date-fns'
  
  const branchStore = useBranchStore()
  const loading = ref(false)
  const reportData = ref([])
  
  const filters = ref({
    date_from: '',
    date_to: '',
    min_amount: null,
    max_amount: null
  })
  
  async function loadReport() {
    try {
      loading.value = true
      const params = {
        branch: branchStore.selectedBranch,
        ...filters.value
      }
      const { data } = await axios.get('/reports/ci-vs-cheque/', { params })
      reportData.value = data
    } catch (error) {
      console.error('Error loading report:', error)
    } finally {
      loading.value = false
    }
  }
  
  function formatDate(dateString) {
    return format(new Date(dateString), 'dd MMM yyyy')
  }
  
  async function exportExcel() {
    try {
      const params = {
        branch: branchStore.selectedBranch,
        ...filters.value,
        format: 'excel'
      }
      const response = await axios.get('/reports/ci-vs-cheque/export_excel/', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'ci_vs_cheque.xlsx')
      document.body.appendChild(link)
      link.click()
    } catch (error) {
      console.error('Export error:', error)
    }
  }
  
  async function exportPDF() {
    // Similar to exportExcel but with PDF endpoint
    try {
      const params = {
        branch: branchStore.selectedBranch,
        ...filters.value,
        format: 'pdf'
      }
      const response = await axios.get('/reports/ci-vs-cheque/export_pdf/', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'ci_vs_cheque.pdf')
      document.body.appendChild(link)
      link.click()
    } catch (error) {
      console.error('Export error:', error)
    }
  }
  </script>