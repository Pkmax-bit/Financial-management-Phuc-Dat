/**
 * Report Export Utilities
 * Xuất báo cáo dự án ra PDF và Excel với format chuyên nghiệp
 */

import * as XLSX from 'xlsx'

interface ProjectReportData {
  project: {
    name: string
    project_code: string
    customer_name: string
    status: string
    start_date?: string
    end_date?: string
  }
  summary: {
    totalQuotes: number
    totalInvoices: number
    totalExpenses: number
    actualProfit: number
    profitMargin: number
    unpaidInvoices: number
    partialInvoices: number
    plannedCosts: number
  }
  invoices: Array<{
    invoice_number: string
    description: string
    total_amount: number
    status: string
    payment_status: string
    created_at: string
  }>
  expenses: Array<{
    expense_code: string
    description: string
    amount: number
    status: string
    expense_date: string
  }>
  quotes?: Array<{
    quote_number: string
    description: string
    total_amount: number
    status: string
    created_at: string
  }>
  expenseComparison?: Array<{
    category: string
    department: string
    planned: number
    actual: number
    variance: number
    variance_percent: number
    status: string
    responsible_party: string
    note: string
  }>
}

/**
 * Xuất báo cáo ra PDF với mẫu tiêu chuẩn
 */
// exportToPDF removed per request

/**
 * Xuất báo cáo ra Excel với nhiều sheets
 */
export const exportToExcel = (data: ProjectReportData) => {
  const wb = XLSX.utils.book_new()
  
  // ========== SHEET 1: TÓM TẮT ==========
  const summaryData = [
    ['BÁO CÁO DỰ ÁN CHI TIẾT'],
    [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
    [],
    ['THÔNG TIN DỰ ÁN'],
    ['Tên dự án', data.project.name],
    ['Mã dự án', data.project.project_code],
    ['Khách hàng', data.project.customer_name],
    ['Trạng thái', getStatusText(data.project.status)],
    [],
    ['TÓM TẮT TÀI CHÍNH'],
    ['Tổng đơn hàng (VND)', data.summary.totalInvoices],
    ['  - Chưa thanh toán', data.summary.unpaidInvoices],
    ['  - Thanh toán 1 phần', data.summary.partialInvoices],
    ['Tổng chi phí (VND)', data.summary.totalExpenses],
    ['Lợi nhuận (VND)', data.summary.actualProfit],
    ['Biên lợi nhuận (%)', data.summary.profitMargin],
    [],
    ['PHÂN TÍCH'],
    ['Số lượng đơn hàng', data.invoices.length],
    ['Số lượng chi phí', data.expenses.length],
    ['Đơn hàng chưa thanh toán', data.summary.unpaidInvoices],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  ws1['!cols'] = [{ wch: 30 }, { wch: 35 }]
  // Merge title row across two columns
  ws1['!merges'] = (ws1['!merges'] || []).concat([{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }])
  // Number formatting for VND values and percentage
  const setFormat = (addr: string, z: string) => { if (ws1[addr]) (ws1[addr] as any).z = z }
  const toA1 = (r: number, c: number) => XLSX.utils.encode_cell({ r, c })
  // Total invoices (row 10), total expenses (row 13), profit (row 14)
  setFormat(toA1(9, 1), '#,##0');
  setFormat(toA1(12, 1), '#,##0');
  setFormat(toA1(13, 1), '#,##0');
  setFormat(toA1(14, 1), '0.0');
  XLSX.utils.book_append_sheet(wb, ws1, 'Tóm tắt')
  
  // ========== SHEET 2: HÓA ĐƠN ==========
  const invoiceData = [
    ['DANH SÁCH HÓA ĐƠN'],
    ['Số HĐ', 'Mô tả', 'Số tiền (VND)', 'Trạng thái', 'Thanh toán', 'Ngày tạo'],
    ...data.invoices.map(inv => [
      inv.invoice_number,
      inv.description || '-',
      inv.total_amount,
      getStatusText(inv.status),
      getPaymentStatusText(inv.payment_status),
      new Date(inv.created_at).toLocaleDateString('vi-VN')
    ]),
    [],
    ['TỔNG CỘNG:', '', data.summary.totalInvoices, '', '', '']
  ]
  
  const ws2 = XLSX.utils.aoa_to_sheet(invoiceData)
  ws2['!cols'] = [
    { wch: 15 }, // Số HĐ
    { wch: 35 }, // Mô tả
    { wch: 20 }, // Số tiền
    { wch: 15 }, // Trạng thái
    { wch: 20 }, // Thanh toán
    { wch: 15 }  // Ngày
  ]
  // Merge title row
  ws2['!merges'] = (ws2['!merges'] || []).concat([{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }])
  // Number formats, date format, totals as formula
  const rows2 = invoiceData.length
  for (let r = 2; r < rows2 - 2; r++) {
    const amountCell = XLSX.utils.encode_cell({ r, c: 2 })
    const dateCell = XLSX.utils.encode_cell({ r, c: 5 })
    if (ws2[amountCell]) (ws2[amountCell] as any).z = '#,##0'
    if (ws2[dateCell]) (ws2[dateCell] as any).z = 'dd/mm/yyyy'
  }
  // Set total formula in C:last-1 (row index rows2-2)
  const totalRow2 = rows2 - 1
  const totalCell2 = XLSX.utils.encode_cell({ r: totalRow2 - 1, c: 2 })
  const firstDataRow2 = 2
  const lastDataRow2 = rows2 - 3
  ;(ws2[totalCell2] = ws2[totalCell2] || { t: 'n' } as any).f = `SUM(C${firstDataRow2 + 1}:C${lastDataRow2 + 1})`
  ;(ws2[totalCell2] as any).z = '#,##0'
  // AutoFilter for data block
  ws2['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: rows2 - 3, c: 5 } }) }
  
  XLSX.utils.book_append_sheet(wb, ws2, 'Đơn hàng')
  
  // ========== SHEET 3: CHI PHÍ ==========
  const expenseData = [
    ['DANH SÁCH CHI PHÍ DỰ ÁN'],
    ['Mô tả', 'Số tiền (VND)', 'Trạng thái', 'Ngày chi'],
    ...data.expenses.map(exp => [
      exp.description || '-',
      exp.amount,
      getStatusText(exp.status),
      new Date(exp.expense_date).toLocaleDateString('vi-VN')
    ]),
    [],
    ['TỔNG CỘNG:', data.summary.totalExpenses, '', '']
  ]
  
  const ws3 = XLSX.utils.aoa_to_sheet(expenseData)
  ws3['!cols'] = [
    { wch: 40 }, // Mô tả
    { wch: 20 }, // Số tiền
    { wch: 18 }, // Trạng thái
    { wch: 15 }  // Ngày
  ]
  // Merge title row
  ws3['!merges'] = (ws3['!merges'] || []).concat([{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }])
  // Number formats, date format, totals as formula
  const rows3 = expenseData.length
  for (let r = 2; r < rows3 - 2; r++) {
    const amountCell = XLSX.utils.encode_cell({ r, c: 1 })
    const dateCell = XLSX.utils.encode_cell({ r, c: 3 })
    if (ws3[amountCell]) (ws3[amountCell] as any).z = '#,##0'
    if (ws3[dateCell]) (ws3[dateCell] as any).z = 'dd/mm/yyyy'
  }
  // Set total formula in B:last-1
  const totalCell3 = XLSX.utils.encode_cell({ r: rows3 - 2, c: 1 })
  const firstDataRow3 = 2
  const lastDataRow3 = rows3 - 3
  ;(ws3[totalCell3] = ws3[totalCell3] || { t: 'n' } as any).f = `SUM(B${firstDataRow3 + 1}:B${lastDataRow3 + 1})`
  ;(ws3[totalCell3] as any).z = '#,##0'
  ws3['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: rows3 - 3, c: 3 } }) }
  
  XLSX.utils.book_append_sheet(wb, ws3, 'Chi phí')
  
  // ========== SHEET 4: BÁO GIÁ (nếu có) ==========
  if (data.quotes && data.quotes.length > 0) {
    const quoteData = [
      ['DANH SÁCH BÁO GIÁ'],
      ['Số BG', 'Mô tả', 'Số tiền (VND)', 'Trạng thái', 'Ngày tạo'],
      ...data.quotes.map(q => [
        q.quote_number,
        q.description || '-',
        q.total_amount,
        getStatusText(q.status),
        new Date(q.created_at).toLocaleDateString('vi-VN')
      ]),
      [],
      ['TỔNG CỘNG:', '', data.summary.totalQuotes, '', '']
    ]
    
    const ws4 = XLSX.utils.aoa_to_sheet(quoteData)
    ws4['!cols'] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 }
    ]
    // Merge title row
    ws4['!merges'] = (ws4['!merges'] || []).concat([{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }])
    // Number/date formats, totals as formula, and autofilter
    const rows4 = quoteData.length
    for (let r = 2; r < rows4 - 2; r++) {
      const amountCell = XLSX.utils.encode_cell({ r, c: 2 })
      const dateCell = XLSX.utils.encode_cell({ r, c: 4 })
      if (ws4[amountCell]) (ws4[amountCell] as any).z = '#,##0'
      if (ws4[dateCell]) (ws4[dateCell] as any).z = 'dd/mm/yyyy'
    }
    // Total formula in C:last-1
    const totalCell4 = XLSX.utils.encode_cell({ r: rows4 - 2, c: 2 })
    const firstDataRow4 = 2
    const lastDataRow4 = rows4 - 3
    ;(ws4[totalCell4] = ws4[totalCell4] || { t: 'n' } as any).f = `SUM(C${firstDataRow4 + 1}:C${lastDataRow4 + 1})`
    ;(ws4[totalCell4] as any).z = '#,##0'
    ws4['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: rows4 - 3, c: 4 } }) }
    
    XLSX.utils.book_append_sheet(wb, ws4, 'Báo giá')
  }

  // ========== SHEET 5: SO SÁNH CHI PHÍ (nếu có) ==========
  if (data.expenseComparison && data.expenseComparison.length > 0) {
    const comparisonData = [
      ['PHÂN TÍCH CHI PHÍ - KẾ HOẠCH VS THỰC TẾ'],
      ['Danh mục', 'Kế hoạch (VND)', 'Thực tế (VND)', 'Chênh lệch (VND)', '% Biến động', 'Trách nhiệm / Hưởng lợi', 'Ghi chú'],
      ...data.expenseComparison.map(item => [
        item.category,
        item.planned,
        item.actual,
        item.variance,
        item.variance_percent.toFixed(1) + '%',
        item.responsible_party,
        item.note
      ]),
      [],
      ['TỔNG CỘNG:', data.summary.plannedCosts, data.summary.totalExpenses, 
       data.summary.totalExpenses - data.summary.plannedCosts, 
       ((data.summary.totalExpenses - data.summary.plannedCosts) / data.summary.plannedCosts * 100).toFixed(1) + '%',
       data.summary.totalExpenses > data.summary.plannedCosts ? '⚠️ Vượt ngân sách' : '✅ Tiết kiệm',
       ''],
      [],
      ['CHÚ GIẢI:'],
      ['❌ Vượt chi (Over Budget)', 'Bộ phận chịu trách nhiệm giải trình và xử lý'],
      ['✅ Tiết kiệm (Under Budget)', 'Bộ phận được hưởng phần tiết kiệm theo quy định'],
      ['⚪ Đúng kế hoạch (On Budget)', 'Chênh lệch dưới 5%, được chấp nhận']
    ]
    
    const ws5 = XLSX.utils.aoa_to_sheet(comparisonData)
    ws5['!cols'] = [
      { wch: 18 }, // Danh mục
      { wch: 18 }, // Kế hoạch
      { wch: 18 }, // Thực tế
      { wch: 18 }, // Chênh lệch
      { wch: 15 }, // % Biến động
      { wch: 40 }, // Trách nhiệm
      { wch: 50 }  // Ghi chú
    ]
    // Merge title row
    ws5['!merges'] = (ws5['!merges'] || []).concat([{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }])
    // Number formats for money columns
    const rows5 = comparisonData.length
    for (let r = 2; r < rows5 - 6; r++) {
      const plannedCell = XLSX.utils.encode_cell({ r, c: 1 })
      const actualCell = XLSX.utils.encode_cell({ r, c: 2 })
      const varianceCell = XLSX.utils.encode_cell({ r, c: 3 })
      if (ws5[plannedCell]) (ws5[plannedCell] as any).z = '#,##0'
      if (ws5[actualCell]) (ws5[actualCell] as any).z = '#,##0'
      if (ws5[varianceCell]) (ws5[varianceCell] as any).z = '#,##0'
    }
    ws5['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: rows5 - 7, c: 6 } }) }
    
    XLSX.utils.book_append_sheet(wb, ws5, 'So sánh chi phí')
  }
  
  // Save Excel
  const fileName = `Bao_cao_du_an_${data.project.project_code}_${Date.now()}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// ========== HELPER FUNCTIONS ==========

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ₫'
}

const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'draft': 'Nháp',
    'sent': 'Đã gửi',
    'paid': 'Đã TT',
    'pending': 'Chờ duyệt',
    'approved': 'Đã duyệt',
    'rejected': 'Từ chối',
    'planning': 'Kế hoạch',
    'active': 'Hoạt động',
    'on_hold': 'Tạm dừng',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  }
  return statusMap[status] || status
}

const getPaymentStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Chưa TT',
    'partial': 'TT 1 phần',
    'paid': 'Đã TT'
  }
  return statusMap[status] || status
}

// tryLoadUnicodeFont removed

