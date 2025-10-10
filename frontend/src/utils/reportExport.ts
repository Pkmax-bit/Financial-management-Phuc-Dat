/**
 * Report Export Utilities
 * Xuất báo cáo dự án ra PDF và Excel với format chuyên nghiệp
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
export const exportToPDF = (data: ProjectReportData) => {
  const doc = new jsPDF()
  
  // Font setup
  doc.setFont('helvetica')
  
  // ========== HEADER ==========
  doc.setFontSize(20)
  doc.setTextColor(0, 102, 204)
  doc.text('BÁO CÁO DỰ ÁN CHI TIẾT', 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 105, 28, { align: 'center' })
  
  // ========== THÔNG TIN DỰ ÁN ==========
  let yPos = 40
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('THÔNG TIN DỰ ÁN', 14, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  
  const projectInfo = [
    ['Tên dự án:', data.project.name],
    ['Mã dự án:', data.project.project_code],
    ['Khách hàng:', data.project.customer_name],
    ['Trạng thái:', getStatusText(data.project.status)],
  ]
  
  projectInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 14, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 50, yPos)
    yPos += 6
  })
  
  // ========== TÓM TẮT TÀI CHÍNH ==========
  yPos += 5
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('TÓM TẮT TÀI CHÍNH', 14, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  
  const financialSummary = [
    ['Tổng hóa đơn:', formatCurrency(data.summary.totalInvoices), data.summary.unpaidInvoices > 0 ? `(${data.summary.unpaidInvoices} chưa TT)` : ''],
    ['Tổng chi phí:', formatCurrency(data.summary.totalExpenses), ''],
    ['Lợi nhuận:', formatCurrency(data.summary.actualProfit), data.summary.actualProfit >= 0 ? '✓' : '✗'],
    ['Biên lợi nhuận:', `${data.summary.profitMargin.toFixed(1)}%`, ''],
  ]
  
  financialSummary.forEach(([label, value, note]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 14, yPos)
    doc.setFont('helvetica', 'normal')
    
    if (label.includes('Lợi nhuận:') && !label.includes('Biên')) {
      doc.setTextColor(data.summary.actualProfit >= 0 ? 0 : 255, data.summary.actualProfit >= 0 ? 128 : 0, 0)
    }
    
    doc.text(value, 50, yPos)
    
    if (note) {
      doc.setTextColor(255, 140, 0)
      doc.text(note, 100, yPos)
    }
    
    doc.setTextColor(60, 60, 60)
    yPos += 6
  })
  
  // ========== CHI TIẾT HÓA ĐƠN ==========
  yPos += 5
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('CHI TIẾT HÓA ĐƠN', 14, yPos)
  yPos += 5
  
  const invoiceTableData = data.invoices.map(inv => [
    inv.invoice_number,
    inv.description || '-',
    formatCurrency(inv.total_amount),
    getStatusText(inv.status),
    getPaymentStatusText(inv.payment_status),
    new Date(inv.created_at).toLocaleDateString('vi-VN')
  ])
  
  autoTable(doc, {
    startY: yPos,
    head: [['Số HĐ', 'Mô tả', 'Số tiền', 'Trạng thái', 'TT', 'Ngày']],
    body: invoiceTableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' },
      5: { fontSize: 7 }
    },
    didDrawPage: (data) => {
      yPos = data.cursor?.y || yPos
    }
  })
  
  // ========== CHI TIẾT CHI PHÍ ==========
  yPos += 10
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(12)
  doc.text('CHI TIẾT CHI PHÍ DỰ ÁN', 14, yPos)
  yPos += 5
  
  const expenseTableData = data.expenses.map(exp => [
    exp.expense_code || '-',
    exp.description || '-',
    formatCurrency(exp.amount),
    getStatusText(exp.status),
    new Date(exp.expense_date).toLocaleDateString('vi-VN')
  ])
  
  autoTable(doc, {
    startY: yPos,
    head: [['Mã CP', 'Mô tả', 'Số tiền', 'Trạng thái', 'Ngày']],
    body: expenseTableData,
    theme: 'grid',
    headStyles: { fillColor: [220, 53, 69], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' }
    },
    didDrawPage: (data) => {
      yPos = data.cursor?.y || yPos
    }
  })

  // ========== SO SÁNH CHI PHÍ KẾ HOẠCH VS THỰC TẾ ==========
  if (data.expenseComparison && data.expenseComparison.length > 0) {
    yPos += 10
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('PHÂN TÍCH CHI PHÍ - KẾ HOẠCH VS THỰC TẾ', 14, yPos)
    yPos += 5
    
    const comparisonTableData = data.expenseComparison.map(item => [
      item.category,
      formatCurrency(item.planned),
      formatCurrency(item.actual),
      (item.variance > 0 ? '+' : '') + formatCurrency(item.variance),
      (item.variance > 0 ? '↑' : item.variance < 0 ? '↓' : '=') + ' ' + Math.abs(item.variance_percent).toFixed(1) + '%',
      item.responsible_party,
      item.note
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Danh mục', 'Kế hoạch', 'Thực tế', 'Chênh lệch', '% Biến động', 'Trách nhiệm', 'Ghi chú']],
      body: comparisonTableData,
      theme: 'grid',
      headStyles: { fillColor: [255, 140, 0], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'center' },
        6: { fontSize: 6 }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const value = data.cell.raw as string
          if (value.startsWith('+')) {
            data.cell.styles.textColor = [220, 53, 69] // Red for over budget
          } else if (value.startsWith('-')) {
            data.cell.styles.textColor = [40, 167, 69] // Green for under budget
          }
        }
      }
    })
    
    // Add legend
    yPos = (doc as any).lastAutoTable.finalY + 5
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('❌ Vượt chi: Bộ phận chịu trách nhiệm giải trình', 14, yPos)
    yPos += 4
    doc.text('✅ Tiết kiệm: Bộ phận được hưởng phần tiết kiệm', 14, yPos)
  }
  
  // ========== FOOTER ==========
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Trang ${i} / ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
    doc.text(
      'Báo cáo được tạo bởi Hệ thống Quản lý Tài chính',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    )
  }
  
  // Save PDF
  const fileName = `Bao_cao_du_an_${data.project.project_code}_${Date.now()}.pdf`
  doc.save(fileName)
}

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
    ['Tên dự án:', data.project.name],
    ['Mã dự án:', data.project.project_code],
    ['Khách hàng:', data.project.customer_name],
    ['Trạng thái:', getStatusText(data.project.status)],
    [],
    ['TÓM TẮT TÀI CHÍNH'],
    ['Tổng hóa đơn:', data.summary.totalInvoices],
    ['  - Chưa thanh toán:', data.summary.unpaidInvoices],
    ['  - Thanh toán 1 phần:', data.summary.partialInvoices],
    ['Tổng chi phí:', data.summary.totalExpenses],
    ['Lợi nhuận:', data.summary.actualProfit],
    ['Biên lợi nhuận (%):', data.summary.profitMargin],
    [],
    ['PHÂN TÍCH'],
    ['Số lượng hóa đơn:', data.invoices.length],
    ['Số lượng chi phí:', data.expenses.length],
    ['Hóa đơn chưa thanh toán:', data.summary.unpaidInvoices],
  ]
  
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  
  // Style cho sheet tóm tắt
  ws1['!cols'] = [{ wch: 25 }, { wch: 30 }]
  
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
  
  XLSX.utils.book_append_sheet(wb, ws2, 'Hóa đơn')
  
  // ========== SHEET 3: CHI PHÍ ==========
  const expenseData = [
    ['DANH SÁCH CHI PHÍ DỰ ÁN'],
    ['Mã CP', 'Mô tả', 'Số tiền (VND)', 'Trạng thái', 'Ngày chi'],
    ...data.expenses.map(exp => [
      exp.expense_code || '-',
      exp.description || '-',
      exp.amount,
      getStatusText(exp.status),
      new Date(exp.expense_date).toLocaleDateString('vi-VN')
    ]),
    [],
    ['TỔNG CỘNG:', '', data.summary.totalExpenses, '', '']
  ]
  
  const ws3 = XLSX.utils.aoa_to_sheet(expenseData)
  ws3['!cols'] = [
    { wch: 15 }, // Mã CP
    { wch: 40 }, // Mô tả
    { wch: 20 }, // Số tiền
    { wch: 15 }, // Trạng thái
    { wch: 15 }  // Ngày
  ]
  
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

