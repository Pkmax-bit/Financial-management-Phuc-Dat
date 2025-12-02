'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Send, Loader2, Download, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getApiEndpoint } from '@/lib/apiUrl'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ExpensePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  expenseId: string
  onSuccess?: () => void
}

export default function ExpensePreviewModal({
  isOpen,
  onClose,
  expenseId,
  onSuccess
}: ExpensePreviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [pdfDownloaded, setPdfDownloaded] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  
  // Expense data
  const [expenseData, setExpenseData] = useState<any>(null)
  const [quoteData, setQuoteData] = useState<any>(null)
  const [quoteItems, setQuoteItems] = useState<any[]>([])
  const [expenseObjects, setExpenseObjects] = useState<any[]>([])
  const [projectData, setProjectData] = useState<any>(null)
  const [customerData, setCustomerData] = useState<any>(null)
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [invoiceItemsWithComponents, setInvoiceItemsWithComponents] = useState<any[]>([])
  const [selectedExpenseObjectIds, setSelectedExpenseObjectIds] = useState<string[]>([])
  
  // Editable fields
  const [notes, setNotes] = useState('')
  const [companyInfo, setCompanyInfo] = useState({
    company_name: '',
    company_showroom: '',
    company_factory: '',
    company_website: '',
    company_hotline: '',
    company_logo_url: '',
    company_logo_base64: ''
  })

  // Fetch expense data
  const fetchExpenseData = useCallback(async () => {
    if (!expenseId || expenseId === '') {
      console.log('⚠️ ExpensePreviewModal: expenseId is empty')
      return
    }
    
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching expense data for ID:', expenseId)

      // 1. Fetch expense data (without employees join first to avoid errors)
      const { data: expense, error: expenseError } = await supabase
        .from('project_expenses_quote')
        .select(`
          *,
          projects:project_id(name, project_code),
          customers:customer_id(name)
        `)
        .eq('id', expenseId)
        .single()

      console.log('📊 Expense fetch result:', { expense, expenseError })

      if (expenseError) {
        console.error('❌ Error fetching expense:', expenseError)
        throw new Error(`Lỗi khi tải dữ liệu: ${expenseError.message || 'Không tìm thấy dữ liệu chi phí kế hoạch'}`)
      }

      if (!expense) {
        console.error('❌ Expense not found for ID:', expenseId)
        throw new Error('Không tìm thấy dữ liệu chi phí kế hoạch với ID: ' + expenseId)
      }

      setExpenseData(expense)
      setNotes(expense.notes || '')
      
      const project = expense.projects as any
      const customer = expense.customers as any
      setProjectData({
        name: Array.isArray(project) ? project[0]?.name : (project?.name || ''),
        code: Array.isArray(project) ? project[0]?.project_code : (project?.project_code || '')
      })
      setCustomerData({
        name: Array.isArray(customer) ? customer[0]?.name : (customer?.name || '')
      })
      
      // 1b. Fetch employee data separately if employee_id exists
      if (expense.employee_id) {
        try {
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select(`
              id,
              first_name,
              last_name,
              email,
              user_id,
              users!employees_user_id_fkey(full_name, email)
            `)
            .eq('id', expense.employee_id)
            .single()
          
          if (!employeeError && employeeData) {
            // Try to get name from users table first, fallback to employees table
            const user = employeeData.users as any
            const userName = Array.isArray(user) 
              ? (user[0]?.full_name || '')
              : (user?.full_name || '')
            
            const employeeName = `${employeeData.first_name || ''} ${employeeData.last_name || ''}`.trim()
            const fullName = userName || employeeName || employeeData.email || ''
            
            const userEmail = Array.isArray(user)
              ? (user[0]?.email || '')
              : (user?.email || '')
            
            setEmployeeData({
              name: fullName,
              email: userEmail || employeeData.email || ''
            })
          }
        } catch (empErr) {
          console.warn('⚠️ Could not fetch employee data:', empErr)
          // Continue without employee data
        }
      }

      const projectId = expense.project_id
      if (!projectId) {
        throw new Error('Chi phí kế hoạch không có dự án liên kết')
      }

      // 2. Fetch quote data
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (quotesData && quotesData.length > 0) {
        const quote = quotesData[0]
        setQuoteData(quote)
        
        // Set company info from quote
        setCompanyInfo({
          company_name: quote.company_name || 'Công ty TNHH Cửa Phúc Đạt',
          company_showroom: quote.company_showroom || '',
          company_factory: quote.company_factory || '',
          company_website: quote.company_website || '',
          company_hotline: quote.company_hotline || '',
          company_logo_url: quote.company_logo_url || '',
          company_logo_base64: quote.company_logo_base64 || ''
        })

        // 3. Fetch quote items with products
        const { data: itemsData } = await supabase
          .from('quote_items')
          .select(`
            *,
            products:product_service_id(id, name, description)
          `)
          .eq('quote_id', quote.id)
          .order('created_at', { ascending: true })

        if (itemsData) {
          setQuoteItems(itemsData)
        }
      }

      // 4. Fetch expense objects
      const expenseObjectIds = expense.expense_object_columns || []
      setSelectedExpenseObjectIds(expenseObjectIds)
      if (expenseObjectIds.length > 0) {
        const { data: objectsData } = await supabase
          .from('expense_objects')
          .select('id, name, level, parent_id')
          .in('id', expenseObjectIds)
        
        if (objectsData) {
          setExpenseObjects(objectsData)
        }
      }

      // 5. Prepare invoice items with components
      let itemsWithComponents: any[] = []
      if (expense.invoice_items && Array.isArray(expense.invoice_items) && expense.invoice_items.length > 0) {
        itemsWithComponents = expense.invoice_items.map((item: any) => ({
          productName: item.product_name || item.productName || '',
          description: item.description || '',
          unitPrice: Number(item.unit_price || item.unitPrice || 0),
          quantity: Number(item.quantity || 0),
          unit: item.unit || 'cái',
          area: item.area ? Number(item.area) : undefined,
          lineTotal: Number(item.line_total || item.lineTotal || item.total_price || 0),
          componentsPct: item.components_pct || item.componentsPct || {},
          componentsAmt: item.components_amount || item.componentsAmt || {},
          componentsQuantity: item.components_quantity || item.componentsQuantity || {},
          componentsUnitPrice: item.components_unit_price || item.componentsUnitPrice || {}
        }))
      } else if (quoteItems.length > 0) {
        // Fetch product names for quote items
        itemsWithComponents = quoteItems.map((item: any) => {
          const product = item.products
          const productName = Array.isArray(product) 
            ? (product[0]?.name || '')
            : (product?.name || '')
          
          // Get components from product_components if available
          const productComponents = item.product_components || item.components || []
          const componentsPct: Record<string, number> = {}
          const componentsAmt: Record<string, number> = {}
          const componentsQuantity: Record<string, number> = {}
          const componentsUnitPrice: Record<string, number> = {}
          
          if (Array.isArray(productComponents)) {
            productComponents.forEach((comp: any) => {
              if (comp?.expense_object_id) {
                const compQty = Number(comp.quantity || 0)
                const compUnitPrice = Number(comp.unit_price || 0)
                const compTotal = Number(comp.total_price) || (compQty * compUnitPrice)
                const lineTotal = Number(item.total_price || item.subtotal || item.total || 0)
                
                componentsQuantity[comp.expense_object_id] = compQty
                componentsUnitPrice[comp.expense_object_id] = compUnitPrice
                componentsAmt[comp.expense_object_id] = compTotal
                componentsPct[comp.expense_object_id] = lineTotal > 0 ? Math.round((compTotal / lineTotal) * 100 * 100) / 100 : 0
              }
            })
          }
          
          return {
            productName: productName || item.name_product || item.product_name || '',
            description: item.products?.description || item.description || '',
            unitPrice: Number(item.unit_price || item.price || 0),
            quantity: Number(item.quantity || item.qty || 0),
            unit: item.unit || 'cái',
            area: item.area ? Number(item.area) : undefined,
            lineTotal: Number(item.total_price || item.subtotal || item.total || 0),
            componentsPct,
            componentsAmt,
            componentsQuantity,
            componentsUnitPrice
          }
        })
      }
      setInvoiceItemsWithComponents(itemsWithComponents)

    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu')
      console.error('Error fetching expense data:', err)
    } finally {
      setLoading(false)
    }
  }, [expenseId])

  useEffect(() => {
    console.log('🔍 ExpensePreviewModal useEffect:', { isOpen, expenseId })
    if (isOpen && expenseId && expenseId !== '') {
      console.log('✅ Fetching expense data...')
      fetchExpenseData()
      setPdfDownloaded(false)
      setEmailSent(false)
    } else if (!isOpen) {
      // Reset state when modal closes
      setPdfDownloaded(false)
      setEmailSent(false)
      setExpenseData(null)
      setQuoteData(null)
      setQuoteItems([])
      setExpenseObjects([])
      setInvoiceItemsWithComponents([])
      setSelectedExpenseObjectIds([])
      setEmployeeData(null)
    }
  }, [isOpen, expenseId, fetchExpenseData])

  // Generate HTML for preview
  const generatePreviewHTML = (): string => {
    if (!expenseData || invoiceItemsWithComponents.length === 0) return ''

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: expenseData.currency || 'VND'
      }).format(amount)
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN')
    }

    // Group expense objects by level
    const level1Objects = expenseObjects.filter(obj => obj.level === 1)
    const level2Objects = expenseObjects.filter(obj => obj.level === 2)
    const level3Objects = expenseObjects.filter(obj => obj.level === 3)

    // Calculate totals
    const calculateLevelTotals = () => {
      const level1Totals: { [id: string]: number } = {}
      const level2Totals: { [id: string]: number } = {}
      const level3Totals: { [id: string]: number } = {}

      level3Objects.forEach(obj => {
        level3Totals[obj.id] = expenseData.expense_object_totals?.[obj.id] || 0
      })

      level2Objects.forEach(obj => {
        const children = level3Objects.filter(child => child.parent_id === obj.id)
        level2Totals[obj.id] = children.reduce((sum, child) => sum + (level3Totals[child.id] || 0), 0)
      })

      level1Objects.forEach(obj => {
        const children = level2Objects.filter(child => child.parent_id === obj.id)
        level1Totals[obj.id] = children.reduce((sum, child) => sum + (level2Totals[child.id] || 0), 0)
      })

      return { level1Totals, level2Totals, level3Totals }
    }

    const { level1Totals, level2Totals, level3Totals } = calculateLevelTotals()
    const grandTotal = Object.values(level1Totals).reduce((sum, val) => sum + val, 0)
    
    // Calculate total revenue from invoice items (sum of lineTotal)
    const totalRevenueFromItems = invoiceItemsWithComponents.reduce((sum, item) => {
      return sum + (item.lineTotal || 0)
    }, 0)
    
    // Calculate total cost from allocated amounts (sum of componentsAmt for all items)
    const totalCostFromAllocated = invoiceItemsWithComponents.reduce((sum, item) => {
      const itemAllocated = selectedExpenseObjectIds.reduce((itemSum, id) => {
        return itemSum + (item.componentsAmt?.[id] || 0)
      }, 0)
      return sum + itemAllocated
    }, 0)
    
    // Use totalCostFromAllocated if available, otherwise use grandTotal
    const cost = totalCostFromAllocated > 0 ? totalCostFromAllocated : grandTotal
    
    // Calculate revenue, cost, profit and profit percentage
    // Revenue: from quote total_amount or sum of invoice items lineTotal
    let revenue = 0
    if (quoteData && quoteData.total_amount) {
      revenue = Number(quoteData.total_amount) || 0
    } else if (totalRevenueFromItems > 0) {
      // If no quote, use sum of invoice items lineTotal as revenue
      revenue = totalRevenueFromItems
    } else if (expenseData.amount) {
      revenue = Number(expenseData.amount) || 0
    } else if (expenseData.planned_amount) {
      revenue = Number(expenseData.planned_amount) || 0
    }
    
    const profit = revenue - cost
    const profitPercentage = revenue > 0 ? (profit / revenue) * 100 : 0
    
    // Determine color based on profit percentage
    const getProfitColor = (percentage: number): string => {
      if (percentage >= 30) {
        return 'text-green-700 bg-green-50 border-green-200' // An toàn
      } else if (percentage >= 15) {
        return 'text-yellow-700 bg-yellow-50 border-yellow-200' // Cảnh báo
      } else {
        return 'text-red-700 bg-red-50 border-red-200' // Nguy hiểm
      }
    }
    
    const getProfitStatus = (percentage: number): string => {
      if (percentage >= 30) {
        return 'Chi phí trong phạm vi an toàn'
      } else if (percentage >= 15) {
        return 'Chi phí cần chú ý'
      } else {
        return 'Chi phí vượt quá ngưỡng an toàn'
      }
    }
    
    const profitColorClass = getProfitColor(profitPercentage)
    const profitStatus = getProfitStatus(profitPercentage)

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
      page-break-before: always;
      break-before: page;
      -webkit-break-before: page;
    }
    .profit-summary-section {
      margin-top: 20px;
      margin-bottom: 30px;
      page-break-inside: avoid;
      page-break-after: always;
      break-after: page;
      -webkit-break-after: page;
      orphans: 3;
      widows: 3;
      min-height: 120px;
    }
    .profit-summary-section table {
      page-break-inside: avoid;
    }
    .notes-section {
      margin-top: 20px;
      padding: 10px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    .total-row {
      font-weight: bold;
      background-color: #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="header">
    ${companyInfo.company_logo_base64 ? `<img src="${companyInfo.company_logo_base64}" class="logo" alt="Logo">` : ''}
    <div class="company-info">
      <div class="company-name">${companyInfo.company_name}</div>
      <div class="company-details">
        ${companyInfo.company_showroom ? `Showroom: ${companyInfo.company_showroom}<br>` : ''}
        ${companyInfo.company_factory ? `Nhà máy: ${companyInfo.company_factory}<br>` : ''}
        ${companyInfo.company_hotline ? `Hotline: ${companyInfo.company_hotline}` : ''}
      </div>
    </div>
  </div>

  <div class="title">CHI PHÍ KẾ HOẠCH DỰ ÁN</div>

  <div class="info-section">
    <div class="info-row">
      <span class="info-label">Mã chi phí:</span>
      <span>${expenseData.expense_code || expenseData.id?.substring(0, 8) || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Dự án:</span>
      <span>${projectData?.code || ''} - ${projectData?.name || ''}</span>
    </div>
    ${customerData?.name ? `
    <div class="info-row">
      <span class="info-label">Khách hàng:</span>
      <span>${customerData.name}</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span class="info-label">Ngày chi phí:</span>
      <span>${formatDate(expenseData.expense_date || new Date().toISOString())}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Mô tả:</span>
      <span>${expenseData.description || ''}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Người tạo:</span>
      <span>${employeeData?.name || 'N/A'}${employeeData?.email ? ` (${employeeData.email})` : ''}</span>
    </div>
  </div>

  <div class="profit-summary-section" style="margin-top: 20px; margin-bottom: 30px; padding: 15px; border: 2px solid #ddd; border-radius: 8px; page-break-after: always; break-after: page; -webkit-break-after: page; ${profitPercentage >= 30 ? 'background-color: #f0fdf4; border-color: #86efac;' : profitPercentage >= 15 ? 'background-color: #fefce8; border-color: #fde047;' : 'background-color: #fef2f2; border-color: #fca5a5;'}">
    <div class="section-title" style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; ${profitPercentage >= 30 ? 'color: #15803d;' : profitPercentage >= 15 ? 'color: #a16207;' : 'color: #dc2626;'}">TỔNG KẾT CHI PHÍ - DOANH THU - LỢI NHUẬN</div>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        <tr>
          <td style="padding: 8px; font-weight: bold; width: 30%;">Doanh thu:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 12pt;">${formatCurrency(revenue)}</td>
          <td style="padding: 8px; text-align: right; width: 15%;">100.0%</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Tổng chi phí:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 12pt;">${formatCurrency(cost)}</td>
          <td style="padding: 8px; text-align: right; ${revenue > 0 ? ((cost / revenue) * 100) > 100 ? 'color: #dc2626;' : ((cost / revenue) * 100) > 90 ? 'color: #a16207;' : 'color: #15803d;' : ''}">${revenue > 0 ? ((cost / revenue) * 100).toFixed(1) : '0.0'}%</td>
        </tr>
        <tr style="${profitPercentage >= 30 ? 'background-color: #dcfce7;' : profitPercentage >= 15 ? 'background-color: #fef9c3;' : 'background-color: #fee2e2;'}">
          <td style="padding: 8px; font-weight: bold; ${profitPercentage >= 30 ? 'color: #15803d;' : profitPercentage >= 15 ? 'color: #a16207;' : 'color: #dc2626;'}">Lợi nhuận:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 12pt; ${profitPercentage >= 30 ? 'color: #15803d;' : profitPercentage >= 15 ? 'color: #a16207;' : 'color: #dc2626;'}">${formatCurrency(profit)}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; ${profitPercentage >= 30 ? 'color: #15803d;' : profitPercentage >= 15 ? 'color: #a16207;' : 'color: #dc2626;'}">${profitPercentage.toFixed(2)}%</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 8px; font-weight: bold; ${profitPercentage >= 30 ? 'color: #15803d;' : profitPercentage >= 15 ? 'color: #a16207;' : 'color: #dc2626;'}">
            Tình trạng: ${profitStatus}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="products-table" style="page-break-before: always; break-before: page; -webkit-break-before: page;">
    <div class="section-title">DANH SÁCH CHI PHÍ</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2" style="width: 3%">STT</th>
          <th rowspan="2" style="width: 18%">Tên sản phẩm</th>
          <th rowspan="2" style="width: 15%">Mô tả</th>
          <th rowspan="2" style="width: 10%" class="text-right">Thành tiền</th>
          ${selectedExpenseObjectIds.length > 0 ? selectedExpenseObjectIds.map(id => {
            const obj = expenseObjects.find(o => o.id === id)
            return `<th colspan="4" style="width: ${(100 - 46) / selectedExpenseObjectIds.length}%" class="text-center">${obj?.name || 'Vật tư'}</th>`
          }).join('') : ''}
          ${selectedExpenseObjectIds.length > 0 ? '<th rowspan="2" style="width: 8%" class="text-right">Tổng phân bổ</th>' : ''}
        </tr>
        <tr>
          ${selectedExpenseObjectIds.map(() => `
            <th class="text-right" style="font-size: 8pt;">%</th>
            <th class="text-right" style="font-size: 8pt;">Đơn vị</th>
            <th class="text-right" style="font-size: 8pt;">Đơn giá</th>
            <th class="text-right" style="font-size: 8pt;">Thành tiền</th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${invoiceItemsWithComponents.map((item, index) => {
          const totalAllocated = selectedExpenseObjectIds.reduce((sum, id) => {
            return sum + (item.componentsAmt?.[id] || 0)
          }, 0)
          
          return `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.productName || ''}</td>
            <td>${item.description || ''}</td>
            <td class="text-right"><strong>${formatCurrency(item.lineTotal || 0)}</strong></td>
            ${selectedExpenseObjectIds.map(id => {
              const pct = item.componentsPct?.[id] || 0
              const qty = item.componentsQuantity?.[id] || 0
              const unitPrice = item.componentsUnitPrice?.[id] || 0
              const amt = item.componentsAmt?.[id] || 0
              return `
                <td class="text-right">${pct.toFixed(2)}%</td>
                <td class="text-right">${qty.toFixed(2)}</td>
                <td class="text-right">${formatCurrency(unitPrice)}</td>
                <td class="text-right">${formatCurrency(amt)}</td>
              `
            }).join('')}
            ${selectedExpenseObjectIds.length > 0 ? `<td class="text-right"><strong>${formatCurrency(totalAllocated)}</strong></td>` : ''}
          </tr>
        `
        }).join('')}
        <tr class="total-row">
          <td colspan="3"><strong>TỔNG THÀNH TIỀN</strong></td>
          <td class="text-right"><strong>${formatCurrency(invoiceItemsWithComponents.reduce((sum, item) => sum + (item.lineTotal || 0), 0))}</strong></td>
          ${selectedExpenseObjectIds.map(id => {
            const totalQty = invoiceItemsWithComponents.reduce((sum, item) => {
              return sum + (item.componentsQuantity?.[id] || 0)
            }, 0)
            const totalAmt = invoiceItemsWithComponents.reduce((sum, item) => {
              return sum + (item.componentsAmt?.[id] || 0)
            }, 0)
            return `
              <td class="text-right">-</td>
              <td class="text-right"><strong>${totalQty.toFixed(2)}</strong></td>
              <td class="text-right">-</td>
              <td class="text-right"><strong>${formatCurrency(totalAmt)}</strong></td>
            `
          }).join('')}
          ${selectedExpenseObjectIds.length > 0 ? `
            <td class="text-right"><strong>${formatCurrency(invoiceItemsWithComponents.reduce((sum, item) => {
              return sum + selectedExpenseObjectIds.reduce((itemSum, id) => itemSum + (item.componentsAmt?.[id] || 0), 0)
            }, 0))}</strong></td>
          ` : ''}
        </tr>
        <tr class="total-row" style="background-color: #e0e0e0; font-weight: bold;">
          <td colspan="${3 + selectedExpenseObjectIds.length * 4 + (selectedExpenseObjectIds.length > 0 ? 1 : 0)}" style="text-align: right; padding: 8px;">
            <strong>TỔNG CHI PHÍ: ${formatCurrency(cost)}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  ${notes ? `
  <div class="notes-section">
    <div style="font-weight: bold; margin-bottom: 5px;">GHI CHÚ:</div>
    <div>${notes.replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}
</body>
</html>
    `
  }

  // Generate HTML for page 1 (header + info + profit summary)
  const generatePage1HTML = (): string => {
    if (!expenseData) return ''

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: expenseData.currency || 'VND'
      }).format(amount)
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN')
    }

    // Calculate totals for profit summary
    const totalRevenueFromItems = invoiceItemsWithComponents.reduce((sum, item) => {
      return sum + (item.lineTotal || 0)
    }, 0)
    
    const totalCostFromAllocated = invoiceItemsWithComponents.reduce((sum, item) => {
      const itemAllocated = selectedExpenseObjectIds.reduce((itemSum, id) => {
        return itemSum + (item.componentsAmt?.[id] || 0)
      }, 0)
      return sum + itemAllocated
    }, 0)
    
    const cost = totalCostFromAllocated > 0 ? totalCostFromAllocated : 0
    
    let revenue = 0
    if (quoteData && quoteData.total_amount) {
      revenue = Number(quoteData.total_amount) || 0
    } else if (totalRevenueFromItems > 0) {
      revenue = totalRevenueFromItems
    } else if (expenseData.amount) {
      revenue = Number(expenseData.amount) || 0
    } else if (expenseData.planned_amount) {
      revenue = Number(expenseData.planned_amount) || 0
    }
    
    const profit = revenue - cost
    const profitPercentage = revenue > 0 ? (profit / revenue) * 100 : 0
    
    const getProfitStatus = (percentage: number): string => {
      if (percentage >= 30) {
        return 'Chi phí trong phạm vi an toàn'
      } else if (percentage >= 15) {
        return 'Chi phí cần chú ý'
      } else {
        return 'Chi phí vượt quá ngưỡng an toàn'
      }
    }
    
    const profitStatus = getProfitStatus(profitPercentage)

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
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    .profit-summary-section {
      margin-top: 20px;
      margin-bottom: 30px;
      padding: 15px;
      border: 2px solid #ddd;
      border-radius: 8px;
      ${profitPercentage >= 30 ? 'background-color: #f0fdf4; border-color: #86efac;' : profitPercentage >= 15 ? 'background-color: #fefce8; border-color: #fde047;' : 'background-color: #fef2f2; border-color: #fca5a5;'}
    }
    .profit-summary-section table {
      width: 100%;
      border-collapse: collapse;
    }
  </style>
</head>
<body>
  <div class="header">
    ${companyInfo.company_logo_base64 ? `<img src="${companyInfo.company_logo_base64}" class="logo" alt="Logo">` : ''}
    <div class="company-info">
      <div class="company-name">${companyInfo.company_name}</div>
      <div class="company-details">
        ${companyInfo.company_showroom ? `Showroom: ${companyInfo.company_showroom}<br>` : ''}
        ${companyInfo.company_factory ? `Nhà máy: ${companyInfo.company_factory}<br>` : ''}
        ${companyInfo.company_hotline ? `Hotline: ${companyInfo.company_hotline}` : ''}
      </div>
    </div>
  </div>

  <div class="title">CHI PHÍ KẾ HOẠCH DỰ ÁN</div>

  <div class="info-section">
    <div class="info-row">
      <span class="info-label">Mã chi phí:</span>
      <span>${expenseData.expense_code || expenseData.id?.substring(0, 8) || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Dự án:</span>
      <span>${projectData?.code || ''} - ${projectData?.name || ''}</span>
    </div>
    ${customerData?.name ? `
    <div class="info-row">
      <span class="info-label">Khách hàng:</span>
      <span>${customerData.name}</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span class="info-label">Ngày chi phí:</span>
      <span>${formatDate(expenseData.expense_date || new Date().toISOString())}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Mô tả:</span>
      <span>${expenseData.description || ''}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Người tạo:</span>
      <span>${employeeData?.name || 'N/A'}${employeeData?.email ? ` (${employeeData.email})` : ''}</span>
    </div>
  </div>

  <div class="profit-summary-section">
    <div class="section-title" style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; ${profitPercentage >= 30 ? 'color: #15803d;' : profitPercentage >= 15 ? 'color: #a16207;' : 'color: #dc2626;'}">TỔNG KẾT CHI PHÍ - DOANH THU - LỢI NHUẬN</div>
    <table>
      <tbody>
        <tr>
          <td style="padding: 8px; font-weight: bold; width: 30%;">Doanh thu:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 12pt;">${formatCurrency(revenue)}</td>
          <td style="padding: 8px; text-align: right; width: 15%;">100.0%</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Tổng chi phí:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 12pt;">${formatCurrency(cost)}</td>
          <td style="padding: 8px; text-align: right; ${revenue > 0 ? ((cost / revenue) * 100) > 100 ? 'color: #dc2626;' : ((cost / revenue) * 100) > 90 ? 'color: #a16207;' : 'color: #15803d;' : ''}">${revenue > 0 ? ((cost / revenue) * 100).toFixed(1) : '0.0'}%</td>
        </tr>
        <tr style="${profitPercentage >= 30 ? 'background-color: #dcfce7;' : profitPercentage >= 15 ? 'background-color: #fef9c3;' : 'background-color: #fee2e2;'}">
          <td style="padding: 8px; font-weight: bold; ${profitPercentage >= 30 ? 'color: #15803d;' : profitPercentage >= 15 ? 'color: #a16207;' : 'color: #dc2626;'}">Lợi nhuận:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 12pt; ${profitPercentage >= 30 ? 'color: #15803d;' : profitPercentage >= 15 ? 'color: #a16207;' : 'color: #dc2626;'}">${formatCurrency(profit)}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; ${profitPercentage >= 30 ? 'color: #15803d;' : profitPercentage >= 15 ? 'color: #a16207;' : 'color: #dc2626;'}">${profitPercentage.toFixed(2)}%</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 8px; font-weight: bold; ${profitPercentage >= 30 ? 'color: #15803d;' : profitPercentage >= 15 ? 'color: #a16207;' : 'color: #dc2626;'}">
            Tình trạng: ${profitStatus}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  ${notes ? `
  <div class="notes-section" style="margin-top: 20px; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd; font-size: 9pt;">
    <div style="font-weight: bold; margin-bottom: 5px;">GHI CHÚ:</div>
    <div>${notes.replace(/\n/g, '<br>')}</div>
  </div>
  ` : ''}
</body>
</html>
    `
  }

  // Generate HTML for page 2+ (expense list)
  const generatePage2HTML = (): string => {
    if (!expenseData || invoiceItemsWithComponents.length === 0) return ''

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: expenseData.currency || 'VND'
      }).format(amount)
    }

    const totalCostFromAllocated = invoiceItemsWithComponents.reduce((sum, item) => {
      const itemAllocated = selectedExpenseObjectIds.reduce((itemSum, id) => {
        return itemSum + (item.componentsAmt?.[id] || 0)
      }, 0)
      return sum + itemAllocated
    }, 0)
    
    const cost = totalCostFromAllocated > 0 ? totalCostFromAllocated : 0

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
    .total-row {
      font-weight: bold;
      background-color: #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="products-table">
    <div class="section-title">DANH SÁCH CHI PHÍ</div>
    <table style="font-size: 7pt;">
      <thead>
        <tr>
          <th rowspan="2" style="width: 3%">STT</th>
          <th rowspan="2" style="width: 18%">Tên sản phẩm</th>
          <th rowspan="2" style="width: 15%">Mô tả</th>
          <th rowspan="2" style="width: 10%" class="text-right">Thành tiền</th>
          ${selectedExpenseObjectIds.length > 0 ? selectedExpenseObjectIds.map(id => {
            const obj = expenseObjects.find(o => o.id === id)
            return `<th colspan="4" style="width: ${(100 - 46) / selectedExpenseObjectIds.length}%" class="text-center">${obj?.name || 'Vật tư'}</th>`
          }).join('') : ''}
          ${selectedExpenseObjectIds.length > 0 ? '<th rowspan="2" style="width: 8%" class="text-right">Tổng phân bổ</th>' : ''}
        </tr>
        <tr>
          ${selectedExpenseObjectIds.map(() => `
            <th class="text-right" style="font-size: 8pt;">%</th>
            <th class="text-right" style="font-size: 8pt;">Đơn vị</th>
            <th class="text-right" style="font-size: 8pt;">Đơn giá</th>
            <th class="text-right" style="font-size: 8pt;">Thành tiền</th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${invoiceItemsWithComponents.map((item, index) => {
          const totalAllocated = selectedExpenseObjectIds.reduce((sum, id) => {
            return sum + (item.componentsAmt?.[id] || 0)
          }, 0)
          
          return `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.productName || ''}</td>
            <td>${item.description || ''}</td>
            <td class="text-right"><strong>${formatCurrency(item.lineTotal || 0)}</strong></td>
            ${selectedExpenseObjectIds.map(id => {
              const pct = item.componentsPct?.[id] || 0
              const qty = item.componentsQuantity?.[id] || 0
              const unitPrice = item.componentsUnitPrice?.[id] || 0
              const amt = item.componentsAmt?.[id] || 0
              return `
                <td class="text-right">${pct.toFixed(2)}%</td>
                <td class="text-right">${qty.toFixed(2)}</td>
                <td class="text-right">${formatCurrency(unitPrice)}</td>
                <td class="text-right">${formatCurrency(amt)}</td>
              `
            }).join('')}
            ${selectedExpenseObjectIds.length > 0 ? `<td class="text-right"><strong>${formatCurrency(totalAllocated)}</strong></td>` : ''}
          </tr>
        `
        }).join('')}
        <tr class="total-row">
          <td colspan="3"><strong>TỔNG THÀNH TIỀN</strong></td>
          <td class="text-right"><strong>${formatCurrency(invoiceItemsWithComponents.reduce((sum, item) => sum + (item.lineTotal || 0), 0))}</strong></td>
          ${selectedExpenseObjectIds.map(id => {
            const totalQty = invoiceItemsWithComponents.reduce((sum, item) => {
              return sum + (item.componentsQuantity?.[id] || 0)
            }, 0)
            const totalAmt = invoiceItemsWithComponents.reduce((sum, item) => {
              return sum + (item.componentsAmt?.[id] || 0)
            }, 0)
            return `
              <td class="text-right">-</td>
              <td class="text-right"><strong>${totalQty.toFixed(2)}</strong></td>
              <td class="text-right">-</td>
              <td class="text-right"><strong>${formatCurrency(totalAmt)}</strong></td>
            `
          }).join('')}
          ${selectedExpenseObjectIds.length > 0 ? `
            <td class="text-right"><strong>${formatCurrency(invoiceItemsWithComponents.reduce((sum, item) => {
              return sum + selectedExpenseObjectIds.reduce((itemSum, id) => itemSum + (item.componentsAmt?.[id] || 0), 0)
            }, 0))}</strong></td>
          ` : ''}
        </tr>
        <tr class="total-row" style="background-color: #e0e0e0; font-weight: bold;">
          <td colspan="${3 + selectedExpenseObjectIds.length * 4 + (selectedExpenseObjectIds.length > 0 ? 1 : 0)}" style="text-align: right; padding: 8px;">
            <strong>TỔNG CHI PHÍ: ${formatCurrency(cost)}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
    `
  }

  // Handle download PDF
  const handleDownloadPDF = async () => {
    if (!expenseData || !previewRef.current || invoiceItemsWithComponents.length === 0) {
      console.error('Preview content not available')
      return
    }

    try {
      setIsDownloadingPDF(true)

      // Dynamic imports
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      // Create PDF (landscape)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = 297 // A4 landscape width in mm
      const pageHeight = 210 // A4 landscape height in mm

      // Generate and add page 1 (header + info + profit summary)
      const htmlPage1 = generatePage1HTML()
      if (htmlPage1) {
        const tempContainer1 = document.createElement('div')
        tempContainer1.style.position = 'absolute'
        tempContainer1.style.left = '-9999px'
        tempContainer1.style.width = '297mm'
        tempContainer1.style.padding = '10mm'
        tempContainer1.style.backgroundColor = '#ffffff'
        tempContainer1.innerHTML = htmlPage1
        document.body.appendChild(tempContainer1)

        const canvas1 = await html2canvas(tempContainer1, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 1123,
          height: tempContainer1.scrollHeight
        })

        document.body.removeChild(tempContainer1)

        const imgData1 = canvas1.toDataURL('image/png')
        const imgHeight1 = (canvas1.height * pageWidth) / canvas1.width

        pdf.addImage(imgData1, 'PNG', 0, 0, pageWidth, imgHeight1)
      }

      // Generate and add page 2+ (expense list)
      const htmlPage2 = generatePage2HTML()
      if (htmlPage2) {
        const tempContainer2 = document.createElement('div')
        tempContainer2.style.position = 'absolute'
        tempContainer2.style.left = '-9999px'
        tempContainer2.style.width = '297mm'
        tempContainer2.style.padding = '10mm'
        tempContainer2.style.backgroundColor = '#ffffff'
        tempContainer2.innerHTML = htmlPage2
        document.body.appendChild(tempContainer2)

        const canvas2 = await html2canvas(tempContainer2, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 1123,
          height: tempContainer2.scrollHeight
        })

        document.body.removeChild(tempContainer2)

        const imgData2 = canvas2.toDataURL('image/png')
        const imgHeight2 = (canvas2.height * pageWidth) / canvas2.width

        // Add new page for expense list
        pdf.addPage()
        
        let heightLeft = imgHeight2
        let position = 0

        // Add first part of expense list
        pdf.addImage(imgData2, 'PNG', 0, position, pageWidth, imgHeight2)
        heightLeft -= pageHeight

        // Add additional pages if expense list is longer than one page
        while (heightLeft > 0) {
          position = heightLeft - imgHeight2
          pdf.addPage()
          pdf.addImage(imgData2, 'PNG', 0, position, pageWidth, imgHeight2)
          heightLeft -= pageHeight
        }
      }

      // Generate filename
      const removeVietnameseDiacritics = (str: string) => {
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

      const sanitizedProjectName = projectData?.name ? removeVietnameseDiacritics(projectData.name) : 'Khong-du-an'
      const projectIdPart = expenseData.id ? expenseData.id.substring(0, 8) : 'no-id'
      const creatorName = employeeData?.name ? removeVietnameseDiacritics(employeeData.name) : 'Nguoi-tao'
      const filename = `Chi-phi-ke-hoach-${sanitizedProjectName}-${projectIdPart}-${creatorName}.pdf`

      // Save PDF
      pdf.save(filename)

      // Mark PDF as downloaded
      setPdfDownloaded(true)

      // Update expense notes to mark PDF as sent
      const currentNotes = expenseData.notes || ''
      const updatedNotes = currentNotes.includes('[PDF_SENT]') 
        ? currentNotes 
        : `${currentNotes}\n[PDF_SENT]`.trim()
      
      await supabase
        .from('project_expenses_quote')
        .update({ notes: updatedNotes })
        .eq('id', expenseId)

      if (onSuccess) {
        onSuccess()
      }

      alert('Xuất PDF thành công!')
    } catch (error: any) {
      console.error('Error exporting PDF:', error)
      alert(`Lỗi khi xuất PDF: ${error.message || 'Lỗi không xác định'}`)
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  // Handle send email
  const handleSendEmail = async () => {
    if (!expenseData) {
      alert('Không có dữ liệu chi phí kế hoạch')
      return
    }

    try {
      setIsSendingEmail(true)

      // TODO: Implement email sending with backend API
      // For now, just mark as sent
      const currentNotes = expenseData.notes || ''
      const updatedNotes = currentNotes.includes('[EMAIL_SENT]') 
        ? currentNotes 
        : `${currentNotes}\n[EMAIL_SENT]`.trim()
      
      await supabase
        .from('project_expenses_quote')
        .update({ notes: updatedNotes })
        .eq('id', expenseId)

      setEmailSent(true)

      if (onSuccess) {
        onSuccess()
      }

      alert('Gửi email thành công! (Tính năng đang được phát triển)')
    } catch (error: any) {
      console.error('Error sending email:', error)
      alert(`Lỗi khi gửi email: ${error.message || 'Lỗi không xác định'}`)
    } finally {
      setIsSendingEmail(false)
    }
  }

  console.log('🔍 ExpensePreviewModal render:', { isOpen, expenseId, hasExpenseData: !!expenseData, loading, error })
  
  if (!isOpen) {
    console.log('❌ Modal is not open, returning null')
    return null
  }

  const htmlContent = expenseData ? generatePreviewHTML() : ''

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white shadow-xl w-full h-full flex flex-col max-w-[95vw] max-h-[95vh] m-auto rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Xem và chỉnh sửa chi phí kế hoạch</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => fetchExpenseData()}
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          ) : !expenseData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Xem trước</h3>
                </div>
                <div 
                  ref={previewRef}
                  className="p-4 bg-white overflow-auto"
                  style={{ maxHeight: '600px' }}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>

              {/* Editable Fields - Moved to bottom with yellow background */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-yellow-900 mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-yellow-400 rounded-md px-3 py-2 text-sm bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900"
                      rows={3}
                      placeholder="Nhập ghi chú..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-yellow-900 mb-2">
                      Tên công ty
                    </label>
                    <input
                      type="text"
                      value={companyInfo.company_name}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, company_name: e.target.value })}
                      className="w-full border border-yellow-400 rounded-md px-3 py-2 text-sm bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Action Buttons */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {pdfDownloaded && (
              <span className="text-green-600">✓ PDF đã được xuất</span>
            )}
            {emailSent && (
              <span className="text-green-600">✓ Email đã được gửi</span>
                  )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Đóng
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isDownloadingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xuất...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Xuất PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Gửi email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

