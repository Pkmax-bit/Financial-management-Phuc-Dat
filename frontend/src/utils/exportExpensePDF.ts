/**
 * Export Planned Expense to PDF
 * Similar to quote PDF export but for planned expenses
 */

// Dynamic imports to avoid SSR issues
// import html2canvas from 'html2canvas'
// import jsPDF from 'jspdf'

interface ExpenseItem {
  section?: string
  productName: string
  description?: string
  unitPrice: number
  quantity: number
  unit: string
  area?: number
  lineTotal: number
  components?: {
    [expenseObjectId: string]: {
      percentage?: number
      quantity?: number
      unitPrice?: number
      amount: number
    }
  }
}

interface ExpenseObject {
  id: string
  name: string
  level?: number
  parent_id?: string
}

interface PlannedExpenseData {
  id: string
  expense_code: string
  description: string
  amount: number
  currency: string
  expense_date: string
  project_name: string
  project_code: string
  customer_name?: string
  notes?: string
  invoice_items: ExpenseItem[]
  expense_objects: ExpenseObject[]
  expense_object_totals: { [objectId: string]: number }
  company_info?: {
    company_name?: string
    company_showroom?: string
    company_factory?: string
    company_website?: string
    company_hotline?: string
    company_logo_url?: string
    company_logo_base64?: string
  }
}

/**
 * Generate HTML for planned expense PDF (landscape orientation)
 */
export function generateExpensePDFHTML(data: PlannedExpenseData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: data.currency || 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  // Group expense objects by level
  const level1Objects = data.expense_objects.filter(obj => obj.level === 1)
  const level2Objects = data.expense_objects.filter(obj => obj.level === 2)
  const level3Objects = data.expense_objects.filter(obj => obj.level === 3)

  // Calculate totals by level
  const calculateLevelTotals = () => {
    const level1Totals: { [id: string]: number } = {}
    const level2Totals: { [id: string]: number } = {}
    const level3Totals: { [id: string]: number } = {}

    // Level 3 totals (direct from expense_object_totals)
    level3Objects.forEach(obj => {
      level3Totals[obj.id] = data.expense_object_totals[obj.id] || 0
    })

    // Level 2 totals (sum of level 3 children)
    level2Objects.forEach(obj => {
      const children = level3Objects.filter(child => child.parent_id === obj.id)
      level2Totals[obj.id] = children.reduce((sum, child) => sum + (level3Totals[child.id] || 0), 0)
    })

    // Level 1 totals (sum of level 2 children)
    level1Objects.forEach(obj => {
      const children = level2Objects.filter(child => child.parent_id === obj.id)
      level1Totals[obj.id] = children.reduce((sum, child) => sum + (level2Totals[child.id] || 0), 0)
    })

    return { level1Totals, level2Totals, level3Totals }
  }

  const { level1Totals, level2Totals, level3Totals } = calculateLevelTotals()
  const grandTotal = Object.values(level1Totals).reduce((sum, val) => sum + val, 0)

  const companyName = data.company_info?.company_name || 'Công ty TNHH Cửa Phúc Đạt'
  const companyShowroom = data.company_info?.company_showroom || 'Showroom: Địa chỉ showroom'
  const companyFactory = data.company_info?.company_factory || 'Nhà máy: Địa chỉ nhà máy'
  const companyHotline = data.company_info?.company_hotline || 'Hotline: Số điện thoại'
  const logoBase64 = data.company_info?.company_logo_base64 || ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    body {
      font-family: Arial, "Times New Roman", "DejaVu Sans", sans-serif;
      font-size: 10pt;
      color: #000000;
      margin: 0;
      padding: 10mm;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .logo {
      max-width: 80px;
      max-height: 80px;
    }
    .company-info {
      flex: 1;
      margin-left: 20px;
    }
    .company-name {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .company-details {
      font-size: 9pt;
      line-height: 1.4;
    }
    .title {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      margin: 20px 0;
      text-transform: uppercase;
    }
    .info-section {
      margin-bottom: 15px;
    }
    .info-row {
      display: flex;
      margin-bottom: 5px;
      font-size: 9pt;
    }
    .info-label {
      font-weight: bold;
      width: 120px;
    }
    .expense-objects-section {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 8pt;
    }
    th, td {
      border: 1px solid #000;
      padding: 4px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .level-1 {
      background-color: #e8f4f8;
      font-weight: bold;
    }
    .level-2 {
      background-color: #f0f8f0;
      padding-left: 15px;
    }
    .level-3 {
      background-color: #fff8f0;
      padding-left: 30px;
    }
    .products-table {
      margin-top: 20px;
      page-break-inside: avoid;
    }
    .notes-section {
      margin-top: 20px;
      padding: 10px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      font-size: 9pt;
    }
    .total-row {
      font-weight: bold;
      background-color: #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Logo">` : ''}
    <div class="company-info">
      <div class="company-name">${companyName}</div>
      <div class="company-details">
        ${companyShowroom ? `Showroom: ${companyShowroom}<br>` : ''}
        ${companyFactory ? `Nhà máy: ${companyFactory}<br>` : ''}
        ${companyHotline ? `Hotline: ${companyHotline}` : ''}
      </div>
    </div>
  </div>

  <div class="title">CHI PHÍ KẾ HOẠCH DỰ ÁN</div>

  <div class="info-section">
    <div class="info-row">
      <span class="info-label">Mã chi phí:</span>
      <span>${data.expense_code}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Dự án:</span>
      <span>${data.project_code} - ${data.project_name}</span>
    </div>
    ${data.customer_name ? `
    <div class="info-row">
      <span class="info-label">Khách hàng:</span>
      <span>${data.customer_name}</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span class="info-label">Ngày chi phí:</span>
      <span>${formatDate(data.expense_date)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Mô tả:</span>
      <span>${data.description}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tổng chi phí:</span>
      <span><strong>${formatCurrency(grandTotal)}</strong></span>
    </div>
  </div>

  <div class="expense-objects-section">
    <div class="section-title">TỔNG CHI PHÍ THEO ĐỐI TƯỢNG</div>
    <table>
      <thead>
        <tr>
          <th style="width: 40%">Đối tượng chi phí</th>
          <th style="width: 20%">Cấp độ</th>
          <th style="width: 20%" class="text-right">Số tiền</th>
          <th style="width: 20%" class="text-right">Tỷ lệ %</th>
        </tr>
      </thead>
      <tbody>
        ${(level1Objects.length > 0 || level2Objects.length > 0 || level3Objects.length > 0) ? `
          ${level1Objects.map(obj => `
            <tr class="level-1">
              <td>${obj.name}</td>
              <td class="text-center">Cấp 1 - Tổng hợp</td>
              <td class="text-right">${formatCurrency(level1Totals[obj.id] || 0)}</td>
              <td class="text-right">${grandTotal > 0 ? ((level1Totals[obj.id] || 0) / grandTotal * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            ${level2Objects.filter(child => child.parent_id === obj.id).map(child => `
              <tr class="level-2">
                <td>${child.name}</td>
                <td class="text-center">Cấp 2 - Loại vật liệu</td>
                <td class="text-right">${formatCurrency(level2Totals[child.id] || 0)}</td>
                <td class="text-right">${grandTotal > 0 ? ((level2Totals[child.id] || 0) / grandTotal * 100).toFixed(1) : '0.0'}%</td>
              </tr>
              ${level3Objects.filter(grandchild => grandchild.parent_id === child.id).map(grandchild => `
                <tr class="level-3">
                  <td>${grandchild.name}</td>
                  <td class="text-center">Cấp 3 - Nhà cung cấp</td>
                  <td class="text-right">${formatCurrency(level3Totals[grandchild.id] || 0)}</td>
                  <td class="text-right">${grandTotal > 0 ? ((level3Totals[grandchild.id] || 0) / grandTotal * 100).toFixed(1) : '0.0'}%</td>
                </tr>
              `).join('')}
            `).join('')}
          `).join('')}
        ` : ''}
        <tr class="total-row">
          <td colspan="2"><strong>TỔNG CỘNG</strong></td>
          <td class="text-right"><strong>${formatCurrency(grandTotal)}</strong></td>
          <td class="text-right"><strong>100.0%</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="products-table">
    <div class="section-title">DANH SÁCH SẢN PHẨM</div>
    <table>
      <thead>
        <tr>
          <th style="width: 5%">STT</th>
          <th style="width: 20%">Tên sản phẩm</th>
          <th style="width: 25%">Mô tả</th>
          <th style="width: 10%" class="text-right">Đơn giá</th>
          <th style="width: 8%" class="text-right">Số lượng</th>
          <th style="width: 7%">Đơn vị</th>
          <th style="width: 8%" class="text-right">Diện tích</th>
          <th style="width: 17%" class="text-right">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${data.invoice_items.map((item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.productName || '[Sản phẩm không có tên]'}</td>
            <td>${item.description || ''}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${item.quantity}</td>
            <td>${item.unit}</td>
            <td class="text-right">${item.area ? item.area.toFixed(2) : '-'}</td>
            <td class="text-right"><strong>${formatCurrency(item.lineTotal)}</strong></td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="7"><strong>TỔNG THÀNH TIỀN</strong></td>
          <td class="text-right"><strong>${formatCurrency(data.invoice_items.reduce((sum, item) => sum + item.lineTotal, 0))}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="notes-section">
    <div style="font-weight: bold; margin-bottom: 5px;">GHI CHÚ:</div>
    <div>${data.notes ? data.notes.replace(/\n/g, '<br>') : '[PDF_SENT]'}</div>
  </div>
</body>
</html>
  `
}

/**
 * Export planned expense to PDF
 */
export async function exportExpenseToPDF(data: PlannedExpenseData): Promise<void> {
  try {
    // Dynamic imports
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default

    // Generate HTML
    const html = generateExpensePDFHTML(data)

    // Create a temporary container
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.width = '297mm' // A4 landscape width
    tempContainer.style.padding = '10mm'
    tempContainer.style.backgroundColor = '#ffffff'
    tempContainer.innerHTML = html
    document.body.appendChild(tempContainer)

    // Convert to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 1123, // A4 landscape width in pixels at 96 DPI
      height: tempContainer.scrollHeight
    })

    // Remove temporary container
    document.body.removeChild(tempContainer)

    // Create PDF (landscape)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 297 // A4 landscape width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pageHeight = 210 // A4 landscape height in mm
    let heightLeft = imgHeight
    let position = 0

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Generate filename
    const removeVietnameseDiacritics = (str: string): string => {
      if (!str) return ''
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .trim()
    }

    const sanitizedProjectName = data.project_name ? removeVietnameseDiacritics(data.project_name) : 'Khong-du-an'
    const projectIdPart = data.id ? data.id.substring(0, 8) : 'no-id'
    const filename = `Chi-phi-ke-hoach-${sanitizedProjectName}-${projectIdPart}.pdf`

    // Save PDF
    pdf.save(filename)
  } catch (error) {
    console.error('Error exporting expense PDF:', error)
    throw error
  }
}

