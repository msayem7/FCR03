<template>
  <div class="container-fluid">
    <div class="row mb-4">
      <div class="col-md-12">
        <h2>Invoice Payment Report</h2>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <form @submit.prevent="loadReport">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <CustomerDropdown 
                v-model="form.customer" 
                :error="errors.customer"
                @update:modelValue="onCustomerChange"
              />
            </div>
            
            <div class="col-md-3">
              <label class="form-label">Start Date</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="form.startDate"
              >
            </div>
            
            <div class="col-md-3">
              <label class="form-label">End Date</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="form.endDate"
              >
            </div>
            
            <div class="col-md-2">
              <button type="submit" class="btn btn-primary w-100" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm"></span>
                Generate Report
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div v-if="reportData.length > 0" class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h4 class="mb-0">
          Payment Report for {{ customerName }}
          <span v-if="dateRange" class="text-muted fs-6">({{ dateRange }})</span>
        </h4>
        <div>
          <button @click="exportToExcel" class="btn btn-success btn-sm me-2">
            <i class="bi bi-file-excel"></i> Excel
          </button>
          <button @click="exportToPDF" class="btn btn-danger btn-sm">
            <i class="bi bi-file-pdf"></i> PDF
          </button>
        </div>
      </div>
      
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered table-hover">
            <thead class="table-light">
              <tr style="background-color: #233446;">
                <th rowspan="2">GRN</th>
                <th rowspan="2">Date</th>
                <th rowspan="2">Sales Amount</th>
                <th rowspan="2">Sales Return</th>
                <th rowspan="2">Net Sales</th>
                <th rowspan="2">Total Allocated</th>
                <th rowspan="2">Due Amount</th>
                <th colspan="5" class="text-center">Cheque Information</th>
                <th colspan="4" class="text-center">Claim Information</th>
              </tr>
              <tr>
                <!-- Cheque sub-headers -->
                <th>Received Date</th>
                <th>Receipt No</th>
                <th>Instrument Type</th>
                <th>Adjusted Amount</th>
                <th>Cheque Amount</th>
                
                <!-- Claim sub-headers -->
                <th>Received Date</th>
                <th>Claim No</th>
                <th>Claim Name</th>
                <th>Adjusted Amount</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(invoice, invoiceIndex) in reportData" :key="invoice.grn">
                <tr :class="invoiceIndex % 2 === 0 ? 'even-row' : 'odd-row'">
                  <td> {{ invoice.grn }}</td>
                  <td>{{ formatDate(invoice.transaction_date) }}</td>
                  <td class="text-end">{{ formatNumber(invoice.sales_amount) }}</td>
                  <td class="text-end">{{ formatNumber(invoice.sales_return) }}</td>
                  <td class="text-end">{{ formatNumber(invoice.net_sales) }}</td>
                  <td class="text-end">{{ formatNumber(invoice.total_allocated) }}</td>
                  <td class="text-end" :class="{ 'text-danger': invoice.due_amount > 0 }">
                    {{ formatNumber(invoice.due_amount) }}
                  </td>
                  
                  <!-- Cheque cells - first row -->
                  <template v-if="invoice.cheques.length > 0">
                    <td>{{ formatDate(invoice.cheques[0].received_date) }}</td>
                    <td>{{ invoice.cheques[0].receipt_no }}</td>
                    <td>{{ invoice.cheques[0].instrument_type }}</td>
                    <td class="text-end">{{ formatNumber(invoice.cheques[0].adjusted_amount) }}</td>
                    <td class="text-end">{{ formatNumber(invoice.cheques[0].cheque_amount) }}</td>
                  </template>
                  <template v-else>
                    <td colspan="5" class="text-center text-muted">No cheque</td>
                  </template>
                  
                  <!-- Claim cells - first row -->
                  <template v-if="invoice.claims.length > 0">
                    <td>{{ formatDate(invoice.claims[0].received_date) }}</td>
                    <td>{{ invoice.claims[0].claim_no }}</td>
                    <td>{{ invoice.claims[0].claim_name }}</td>
                    <td class="text-end">{{ formatNumber(invoice.claims[0].adjusted_amount) }}</td>
                  </template>
                  <template v-else>
                    <td colspan="4" class="text-center text-muted">No claim</td>
                  </template>
                </tr>
                
                
                <template v-for="rowIndex in Math.max(invoice.cheques.length, invoice.claims.length)" :key="`row-${rowIndex}`">
                  <template v-if="rowIndex>1 && invoice.cheques.length >= rowIndex && invoice.claims.length >= rowIndex">
                    <tr :class="invoiceIndex % 2 === 0 ? 'even-row' : 'odd-row'">
                      <td colspan="7"></td >
                      <td>{{ formatDate(invoice.cheques[rowIndex - 1].received_date) }}</td>
                      <td>{{ invoice.cheques[rowIndex - 1].receipt_no }}</td>
                      <td>{{ invoice.cheques[rowIndex - 1].instrument_type }}</td>
                      <td class="text-end">{{ formatNumber(invoice.cheques[rowIndex - 1].adjusted_amount) }}</td>
                      <td class="text-end">{{ formatNumber(invoice.cheques[rowIndex - 1].cheque_amount) }}</td>
                      <td>{{ formatDate(invoice.claims[rowIndex - 1].received_date) }}</td>
                      <td>{{ invoice.claims[rowIndex - 1].claim_no }}</td>
                      <td>{{ invoice.claims[rowIndex - 1].claim_name }}</td>
                      <td class="text-end">{{ formatNumber(invoice.claims[rowIndex - 1].adjusted_amount) }}</td>
                    </tr>
                  </template>                  
                  <template v-if="rowIndex>1 && invoice.cheques.length >= rowIndex && invoice.claims.length < rowIndex">
                    <tr :class="invoiceIndex % 2 === 0 ? 'even-row' : 'odd-row'">
                      <td colspan="7"></td>
                      <td>{{ formatDate(invoice.cheques[rowIndex - 1].received_date) }}</td>
                      <td>{{ invoice.cheques[rowIndex - 1].receipt_no }}</td>
                      <td>{{ invoice.cheques[rowIndex - 1].instrument_type }}</td>
                      <td class="text-end">{{ formatNumber(invoice.cheques[rowIndex - 1].adjusted_amount) }}</td>
                      <td class="text-end">{{ formatNumber(invoice.cheques[rowIndex - 1].cheque_amount) }}</td>
                      <td colspan="4"></td>
                    </tr>
                  </template>
                  <template v-if="rowIndex>1 && invoice.cheques.length < rowIndex && invoice.claims.length >= rowIndex">
                    <tr :class="invoiceIndex % 2 === 0 ? 'even-row' : 'odd-row'">
                      <td colspan="12"></td>
                      <td>{{ formatDate(invoice.claims[rowIndex - 1].received_date) }}</td>
                      <td>{{ invoice.claims[rowIndex - 1].claim_no }}</td>
                      <td>{{ invoice.claims[rowIndex - 1].claim_name }}</td>
                      <td class="text-end">{{ formatNumber(invoice.claims[rowIndex - 1].adjusted_amount) }}</td>
                    </tr>                  
                  </template>
                </template>
               


                <!-- Additional rows for multiple cheques -->
                <!-- <template v-for="(cheque, index) in getAdditionalCheques(invoice)" :key="`cheque-${index}-${invoice.grn}`">
                  <tr>
                    <td colspan="7"></td>
                    <td>{{ formatDate(cheque.received_date) }}</td>
                    <td>{{ cheque.receipt_no }}</td>
                    <td>{{ cheque.instrument_type }}</td>
                    <td class="text-end">{{ formatNumber(cheque.adjusted_amount) }}</td>
                    <td class="text-end">{{ formatNumber(cheque.cheque_amount) }}</td>
                    <td colspan="4"></td>
                  </tr>
                </template>                 -->

                <!-- Additional rows for multiple claims -->
                <!-- <template v-for="(claim, index) in getAdditionalClaims(invoice)" :key="`claim-${index}-${invoice.grn}`">
                  <tr>
                    <td colspan="12"></td>
                    <td>{{ formatDate(claim.received_date) }}</td>
                    <td>{{ claim.claim_no }}</td>
                    <td>{{ claim.claim_name }}</td>
                    <td class="text-end">{{ formatNumber(claim.adjusted_amount) }}</td>
                  </tr>
                </template> -->
              </template>
              <!-- Totals row -->
              <tr class="table-active">
                <td colspan="2" class="fw-bold">Totals</td>
                <td class="text-end fw-bold">{{ formatNumber(totals.sales_amount) }}</td>
                <td class="text-end fw-bold">{{ formatNumber(totals.sales_return) }}</td>
                <td class="text-end fw-bold">{{ formatNumber(totals.net_sales) }}</td>
                <td class="text-end fw-bold">{{ formatNumber(totals.total_allocated) }}</td>
                <td class="text-end fw-bold">{{ formatNumber(totals.due_amount) }}</td>
                <td colspan="11"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div v-else-if="initialLoad" class="alert alert-info">
      No data found for the selected criteria.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/plugins/axios'
import CustomerDropdown from '@/components/CustomerDropdown.vue'
import { formatDate, formatNumber } from '@/utils/ezFormatter'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const router = useRouter()
const loading = ref(false)
const initialLoad = ref(false)
const reportData = ref([])
const customerName = ref('')
const dateRange = ref('')

const form = ref({
  customer: null,
  startDate: '',
  endDate: ''
})

const errors = ref({
  customer: null
})

// Define the helper functions
const getAdditionalCheques = (invoice) => {
  return invoice.cheques.slice(1) // Return all cheques except the first one
}

const getAdditionalClaims = (invoice) => {
  return invoice.claims.slice(1) // Return all claims except the first one
}

const totals = computed(() => {
  return reportData.value.reduce((acc, invoice) => {
    acc.sales_amount += parseFloat(invoice.sales_amount)
    acc.sales_return += parseFloat(invoice.sales_return)
    acc.net_sales += parseFloat(invoice.net_sales)
    acc.total_allocated += parseFloat(invoice.total_allocated)
    acc.due_amount += parseFloat(invoice.due_amount)
    return acc
  }, {
    sales_amount: 0,
    sales_return: 0,
    net_sales: 0,
    total_allocated: 0,
    due_amount: 0
  })
})

const onCustomerChange = (customer) => {
  form.value.customer = customer
  errors.value.customer = null
}

const loadReport = async () => {
  if (!form.value.customer) {
    errors.value.customer = 'Please select a customer'
    return
  }

  loading.value = true
  initialLoad.value = true
  
  try {
    const params = {
      customer_id: form.value.customer.alias_id
    }
    
    if (form.value.startDate) params.start_date = form.value.startDate
    if (form.value.endDate) params.end_date = form.value.endDate
    
    const response = await axios.get('/v1/chq/reports/invoice-payments/', { params })
    console.log(response.data.data) // Changed from print() to console.log()

    reportData.value = response.data.data
    customerName.value = response.data.customer
    
    // Set date range display
    if (form.value.startDate || form.value.endDate) {
      const start = form.value.startDate ? formatDate(form.value.startDate) : 'Beginning'
      const end = form.value.endDate ? formatDate(form.value.endDate) : 'Today'
      dateRange.value = `${start} to ${end}`
    } else {
      dateRange.value = 'All Dates'
    }
    
  } catch (error) {
    console.error('Error loading report:', error)
    alert('Failed to load report. Please try again.')
  } finally {
    loading.value = false
  }
}

const exportToExcel = () => {
  // Prepare data for Excel export
  const excelData = reportData.value.flatMap(invoice => {
    const baseData = {
      'GRN': invoice.grn,
      'Date': formatDate(invoice.transaction_date),
      'Sales Amount': invoice.sales_amount,
      'Sales Return': invoice.sales_return,
      'Net Sales': invoice.net_sales,
      'Total Allocated': invoice.total_allocated,
      'Due Amount': invoice.due_amount,
    }
    
    // Add cheque and claim data
    const rows = []
    
    // Determine max rows needed (cheques or claims)
    const maxRows = Math.max(invoice.cheques.length, invoice.claims.length, 1)
    
    for (let i = 0; i < maxRows; i++) {
      const row = { ...baseData }
      
      if (i < invoice.cheques.length) {
        row['Cheque Received Date'] = formatDate(invoice.cheques[i].received_date)
        row['Cheque Receipt No'] = invoice.cheques[i].receipt_no
        row['Instrument Type'] = invoice.cheques[i].instrument_type
        row['Cheque Adjusted Amount'] = invoice.cheques[i].adjusted_amount
        row['Cheque Amount'] = invoice.cheques[i].cheque_amount
      }
      
      if (i < invoice.claims.length) {
        row['Claim Received Date'] = formatDate(invoice.claims[i].received_date)
        row['Claim No'] = invoice.claims[i].claim_no
        row['Claim Name'] = invoice.claims[i].claim_name
        row['Claim Adjusted Amount'] = invoice.claims[i].adjusted_amount
        row['Claim Amount'] = invoice.claims[i].claim_amount
      }
      
      rows.push(row)
    }
    
    return rows
  })
  
  // Create workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)
  XLSX.utils.book_append_sheet(wb, ws, 'Invoice Payments')
  
  // Generate file name
  const fileName = `Invoice_Payments_${customerName.value}_${new Date().toISOString().slice(0,10)}.xlsx`
  
  // Export
  XLSX.writeFile(wb, fileName)
}

const exportToPDF = () => {
  const doc = new jsPDF({
    orientation: 'landscape'
  })
  
  // Title
  doc.setFontSize(16)
  doc.text(`Invoice Payment Report for ${customerName.value}`, 14, 15)
  
  // Date range
  doc.setFontSize(10)
  doc.text(dateRange.value, 14, 22)
  
  // Table data
  const headers = [
    'GRN',
    'Date',
    'Sales',
    'Return',
    'Net Sales',
    'Allocated',
    'Due',
    'Cheque Date',
    'Receipt No',
    'Type',
    'Adj Amount',
    'Cheque Amt',
    'Claim Date',
    'Claim No',
    'Claim Name',
    'Adj Amount'
  ]
  
  const body = reportData.value.flatMap(invoice => {
    const baseData = [
      invoice.grn,
      formatDate(invoice.transaction_date),
      formatNumber(invoice.sales_amount),
      formatNumber(invoice.sales_return),
      formatNumber(invoice.net_sales),
      formatNumber(invoice.total_allocated),
      formatNumber(invoice.due_amount)
    ]
    
    // Determine max rows needed
    const maxRows = Math.max(invoice.cheques.length, invoice.claims.length, 1)
    const rows = []
    
    for (let i = 0; i < maxRows; i++) {
      const row = [...baseData]
      
      // Add cheque data
      if (i < invoice.cheques.length) {
        row.push(
          formatDate(invoice.cheques[i].received_date),
          invoice.cheques[i].receipt_no,
          invoice.cheques[i].instrument_type,
          formatNumber(invoice.cheques[i].adjusted_amount),
          formatNumber(invoice.cheques[i].cheque_amount)
      )
      } else {
        row.push('', '', '', '', '')
      }
      
      // Add claim data
      if (i < invoice.claims.length) {
        row.push(
          formatDate(invoice.claims[i].received_date),
          invoice.claims[i].claim_no,
          invoice.claims[i].claim_name,
          formatNumber(invoice.claims[i].adjusted_amount)
        )
      } else {
        row.push('', '', '', '')
      }
      
      rows.push(row)
    }
    
    return rows
  })
  
  // Add totals row
  body.push([
    'TOTALS',
    '',
    formatNumber(totals.value.sales_amount),
    formatNumber(totals.value.sales_return),
    formatNumber(totals.value.net_sales),
    formatNumber(totals.value.total_allocated),
    formatNumber(totals.value.due_amount),
    '', '', '', '', '', '', '', ''
  ])
  
  // Generate PDF
  doc.autoTable({
    head: [headers],
    body: body,
    startY: 25,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      2: { cellWidth: 'auto', halign: 'right' },
      3: { cellWidth: 'auto', halign: 'right' },
      4: { cellWidth: 'auto', halign: 'right' },
      5: { cellWidth: 'auto', halign: 'right' },
      6: { cellWidth: 'auto', halign: 'right' },
      10: { halign: 'right' },
      11: { halign: 'right' },
      15: { halign: 'right' }
    }
  })
  
  // Save PDF
  doc.save(`Invoice_Payments_${customerName.value}_${new Date().toISOString().slice(0,10)}.pdf`)
}
</script>

<style scoped>
.table th{
  vertical-align: middle;
  background-color:  #acbe74;;
}
.table td {
  vertical-align: middle;
  background-color: transparent;
}
.text-end {
  text-align: right !important;
}
/* Alternating row colors for invoice groups */
.odd-row {
  background-color: #7f8e6a !important;;
}
.even-row {
  background-color: #6a6372 !important;;
}

</style>