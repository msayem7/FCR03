<template>
  <div class="container mt-4">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap">
        <h5>Customer Due</h5>
        <div class="d-flex align-items-center header-controls"> <input
            type="date"
            v-model="reportDate"
            class="form-control date-input" @change="loadReport"
          >
          <button
            class="btn btn-primary excel-export-btn ms-2" @click="exportToExcel"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
            Export Excel
          </button>
        </div>
      </div>

      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <template v-else>
          <div class="table-responsive">
            <table class="table table-bordered table-hover">
              <thead class="table-light">
                <tr>
                  <th>Customer</th>
                  <th class="text-end">Matured</th>
                  <th class="text-end">Immature</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="parent in filteredParents" :key="parent.alias_id">
                  <tr
                    class="parent-row"
                    :class="{ 'cursor-pointer': parent.children.length > 0 }"
                    @click="toggleParent(parent.alias_id)"
                  >
                    <td>
                      <div class="d-flex align-items-center">
                        <span v-if="parent.children.length > 0" class="me-2">
                          <i
                            class="bi"
                            :class="expandedParents.includes(parent.alias_id) ? 'bi-dash-square' : 'bi-plus-square'"
                          >
                          </i>
                        </span>
                        <router-link
                          :to="`/customers/${parent.alias_id}`"
                          class="text-decoration-none"
                          @click.stop
                        >
                          <strong>{{ parent.name }}</strong>
                        </router-link>
                      </div>
                    </td>
                    <td class="text-end">
                      {{ formatNumber(parent.matured_due) }}
                    </td>
                    <td class="text-end">
                      {{ formatNumber(parent.immature_due) }}
                    </td>
                    <td class="text-end">
                      {{ formatNumber(parent.total_due) }}
                    </td>
                  </tr>
                  <template v-if="expandedParents.includes(parent.alias_id)">
                    <tr
                      v-for="child in parent.children.filter(c => c.total_due > 0)"
                      :key="child.alias_id"
                      class="child-row"
                    >
                      <td class="ps-5">
                        <router-link
                          :to="`/customers/${child.alias_id}`"
                          class="text-decoration-none"
                        >
                          <i class="bi bi-arrow-return-right me-2"></i>
                          {{ child.name }}
                        </router-link>
                      </td>
                      <td class="text-end">
                        {{ formatNumber(child.matured_due) }}
                      </td>
                      <td class="text-end">
                        {{ formatNumber(child.immature_due) }}
                      </td>
                      <td class="text-end">
                        {{ formatNumber(child.total_due) }}
                      </td>
                    </tr>
                  </template>
                </template>
                <tr class="table-secondary">
                  <td><strong>Grand Total</strong></td>
                  <td class="text-end">
                    <strong>{{ formatNumber(reportData.grand_totals.matured_due) }}</strong>
                  </td>
                  <td class="text-end">
                    <strong>{{ formatNumber(reportData.grand_totals.immature_due) }}</strong>
                  </td>
                  <td class="text-end">
                    <strong>{{ formatNumber(reportData.grand_totals.total_due) }}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from '@/plugins/axios'
import { formatDate, formatNumber } from '@/utils/ezFormatter'
import { useNotificationStore } from '@/stores/notificationStore'
import { useBranchStore } from '@/stores/branchStore'

const notificationStore = useNotificationStore()
const branchStore = useBranchStore()

const reportDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(false)
const reportData = ref({
  report_date: '',
  data: [],
  grand_totals: {
    matured_due: 0,
    immature_due: 0,
    total_due: 0
  }
})
const expandedParents = ref([])

// Computed property to get current branch name
const currentBranchName = computed(() => {
  if (!branchStore.selectedBranch) return 'All Branches'
  const branch = branchStore.branches.find(b => b.alias_id === branchStore.selectedBranch)
  return branch ? branch.name : 'Selected Branch'
})

// Filter parents with total_due > 0 or with children having due amounts
const filteredParents = computed(() => {
  return reportData.value.data.filter(parent => {
    // Show parent if it has any due amount
    if (parent.total_due > 0) return true
    
    // Or if any of its children have due amounts
    return parent.children.some(child => child.total_due > 0)
  })
})

const toggleParent = (parentId) => {
  const index = expandedParents.value.indexOf(parentId)
  if (index === -1) {
    expandedParents.value.push(parentId)
  } else {
    expandedParents.value.splice(index, 1)
  }
}

const loadReport = async () => {
  try {
    loading.value = true
    expandedParents.value = [] // Reset expanded parents when loading new data
    const params = {
      date: reportDate.value
    }
    
    if (branchStore.selectedBranch) {
      params.branch = branchStore.selectedBranch
    }

    const response = await axios.get('/v1/chq/parent-customer-due-report/', {
      params
    })
    reportData.value = response.data
  } catch (error) {
    notificationStore.showError('Failed to load due report')
    console.error('Error loading report:', error)
  } finally {
    loading.value = false
  }
}

const exportToExcel = async () => {
  try {
    loading.value = true
    const params = {
      date: reportDate.value
    }
    
    if (branchStore.selectedBranch) {
      params.branch = branchStore.selectedBranch
    }

    const response = await axios.get('/v1/chq/parent-customer-due-report/export/', {
      params,
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `customer_due_report_${reportDate.value}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    notificationStore.showError('Failed to export report')
    console.error('Export error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadReport()
})
</script>

<style scoped>
.parent-row {
  background-color: #f8f9fa;
  font-weight: 500;
}

.child-row {
  background-color: white;
}

.cursor-pointer {
  cursor: pointer;
}

.table-responsive {
  max-height: 70vh;
  overflow-y: auto;
}

.text-muted small {
  font-size: 0.8rem;
  display: block;
}
.text-muted strong {
  font-size: 0.9rem;
}

/* --- New Styles for Header Layout --- */

.card-header {
  /* Ensure header content stays in one line on larger screens */
  flex-wrap: nowrap; /* Prevent wrapping in the header itself */
}

.header-controls {
  gap: 0.5rem; /* Adds space between date input and export button */
}

.date-input {
  /* Move reportDate left by reducing its width */
  width: 140px; /* Adjust this value as needed, e.g., 120px-150px */
  min-width: 120px; /* Prevent it from becoming too small */
}

.excel-export-btn {
  /* Ensure Excel export button stays in one line */
  white-space: nowrap; /* Prevent text wrapping */
  width: 120px; /* Fixed width to prevent content shifting */
  text-align: center; /* Center text within the button */
}

/* Optional: Adjust for smaller screens if needed */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column; /* Stack items vertically on small screens */
    align-items: flex-start; /* Align stacked items to the start */
  }
  .header-controls {
    width: 100%; /* Make controls take full width */
    justify-content: flex-start; /* Align controls to the left */
    margin-top: 0.5rem; /* Add some space from the title */
  }
  .date-input,
  .excel-export-btn {
    width: auto; /* Allow them to resize on small screens */
    flex-grow: 1; /* Allow them to grow if needed */
  }
}
</style>