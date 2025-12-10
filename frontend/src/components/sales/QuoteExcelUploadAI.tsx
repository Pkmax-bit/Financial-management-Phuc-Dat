'use client'

import React, { useState, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, FileText, X, CheckCircle2, AlertCircle, Loader2, User, Building2, Package, DollarSign, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Lazy import xlsx with retry mechanism
async function loadXLSX() {
  let retries = 3
  while (retries > 0) {
    try {
      // Use dynamic import with explicit chunk name
      const mod = await import(/* webpackChunkName: "xlsx" */ 'xlsx')
      console.log('✅ xlsx loaded successfully')
      return mod
    } catch (error: any) {
      retries--
      console.warn(`⚠️ Error loading xlsx (${retries} retries left):`, error)
      
      if (retries === 0) {
        // Last attempt: try to reload the page chunk
        if (error.message?.includes('chunk') || error.message?.includes('Loading')) {
          console.error('❌ Chunk load error. Please refresh the page.')
          throw new Error('Không thể tải thư viện xlsx. Vui lòng refresh trang (F5) và thử lại.')
        }
        throw new Error(`Không thể tải thư viện xlsx: ${error.message || 'Unknown error'}`)
      }
      
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  throw new Error('Failed to load xlsx library after retries')
}

// Convert ArrayBuffer to base64 efficiently (chunked to avoid stack overflow)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000 // 32KB chunks
  let binary = ''
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  
  return btoa(binary)
}

// Extract text from PDF file by sending to server
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('📄 Starting PDF text extraction via server...')
    console.log('📊 PDF file size:', file.size, 'bytes')
    
    // Check file size (limit to 10MB to avoid issues)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error(`File PDF quá lớn (${(file.size / 1024 / 1024).toFixed(2)}MB). Vui lòng chọn file nhỏ hơn 10MB.`)
    }
    
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Chưa đăng nhập')
    }

    // Convert file to base64 using chunked method
    console.log('🔄 Converting PDF to base64...')
    const arrayBuffer = await file.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    console.log('✅ Base64 conversion complete, length:', base64.length)
    
    // Send to server for PDF extraction
    console.log('📤 Sending PDF to server for text extraction...')
    const response = await fetch('/api/sales/quotes/extract-pdf-text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: base64,
        fileName: file.name
      })
    })

    if (!response.ok) {
      let errorMessage = 'Lỗi khi trích xuất text từ PDF'
      try {
        // Clone response to read it multiple times if needed
        const responseClone = response.clone()
        const error = await response.json()
        errorMessage = error.message || error.error || errorMessage
        console.error('❌ Server error response:', {
          status: response.status,
          error: error
        })
      } catch (e) {
        // If JSON parse fails, response body was already consumed or not JSON
        try {
        const errorText = await response.text()
        console.error('❌ Server error text:', errorText)
        errorMessage = errorText || errorMessage
        } catch (textError) {
          console.error('❌ Could not read response body:', textError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log(`✅ PDF text extracted: ${result.text?.length || 0} characters`)
    
    if (!result.text || result.text.trim().length === 0) {
      throw new Error('PDF không có text. File có thể là PDF scan (hình ảnh). Vui lòng sử dụng PDF có text layer.')
    }
    
    return result.text
    
  } catch (error: any) {
    console.error('❌ Error extracting PDF text:', error)
    throw new Error(`Lỗi khi đọc PDF: ${error.message || 'Unknown error'}`)
  }
}

interface CustomerInfo {
  name: string
  address?: string
  phone?: string
  email?: string
}

interface QuoteItem {
  stt?: number
  ky_hieu?: string
  hang_muc_thi_cong: string
  ten_san_pham?: string  // Tên sản phẩm chính (dòng đầu)
  loai_san_pham?: string // Loại/Category (ví dụ: Nhôm Xingfa Việt Nam)
  mo_ta?: string         // Mô tả chi tiết (phần còn lại)
  dvt: string
  ngang?: number
  cao?: number
  so_luong: number
  dien_tich?: number
  don_gia: number
  thanh_tien: number
  ghi_chu?: string
}

interface ProjectInfo {
  name: string
  address?: string
  supervisor?: string
}

interface AnalyzedQuote {
  customer: CustomerInfo
  project: ProjectInfo
  items: QuoteItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  date?: string
  valid_until?: string
  notes?: string  // Ghi chú báo giá (phần 3)
  terms?: string  // Điều khoản, quy trình
}

interface DebugInfo {
  documentPreview: {
    first500Chars: string
    last200Chars: string
    totalLength: number
    lineCount: number
  }
  extractedInfo: {
    customerFound: boolean
    customerName: string | null
    addressFound: boolean
    address: string | null
    phoneFound: boolean
    phone: string | null
    supervisorFound: boolean
    supervisor: string | null
    dateFound: boolean
    date: string | null
    itemsCount: number
    itemsPreview: Array<{
      stt: number | null
      ten_san_pham: string
      loai_san_pham: string | null
      so_luong: number
      don_gia: number
      thanh_tien: number
    }>
    subtotalFound: boolean
    subtotal: number
    vatFound: boolean
    taxAmount: number
    totalFound: boolean
    totalAmount: number
  }
  warnings: string[]
  processingSteps: string[]
}

export default function QuoteExcelUploadAI({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [analyzedData, setAnalyzedData] = useState<AnalyzedQuote | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Dropdown data
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone?: string; email?: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [employees, setEmployees] = useState<Array<{ id: string; full_name: string }>>([])
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; unit: string }>>([])
  
  // Editable customer and project info
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    address: '',
    phone: '',
    email: ''
  })
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: '',
    address: '',
    supervisor: ''
  })
  
  // Selection states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [isNewProject, setIsNewProject] = useState(false)
  
  // Product matching status for each item
  const [productMatchStatus, setProductMatchStatus] = useState<Array<{
    index: number
    exists: boolean
    matchedProduct?: { id: string; name: string; price: number }
  }>>([])

  // Load customers, employees, and products on mount
  React.useEffect(() => {
    fetchCustomers()
    fetchEmployees()
    fetchProducts()
  }, [])
  
  // Load projects when customer is selected
  React.useEffect(() => {
    if (selectedCustomerId) {
      fetchProjects(selectedCustomerId)
    } else {
      setProjects([])
    }
  }, [selectedCustomerId])
  
  // Check product matches when analyzed data changes
  React.useEffect(() => {
    if (analyzedData?.items && products.length > 0) {
      checkProductMatches()
    }
  }, [analyzedData, products])

  const fetchCustomers = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('status', 'active')
        .order('name')
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchProjects = async (customerId: string) => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('customer_id', customerId)
        .in('status', ['planning', 'active'])
        .order('name')
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, unit')
        .eq('is_active', true)
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }
  
  // Helper function to normalize Vietnamese text for matching
  const normalizeText = (text: string): string => {
    if (!text) return ''
    return text
      .toLowerCase()
      .trim()
      // Remove common prefixes/suffixes
      .replace(/^\(anh\)\s*/i, '')
      .replace(/^\(chị\)\s*/i, '')
      .replace(/^\(chú\)\s*/i, '')
      .replace(/^\(cô\)\s*/i, '')
      .replace(/\s+/g, ' ')
  }

  // Helper function to calculate similarity between two strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = normalizeText(str1)
    const s2 = normalizeText(str2)
    
    // Exact match
    if (s1 === s2) return 1.0
    
    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.9
    
    // Word-based similarity
    const words1 = s1.split(/\s+/)
    const words2 = s2.split(/\s+/)
    const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)))
    
    if (commonWords.length > 0) {
      return commonWords.length / Math.max(words1.length, words2.length)
    }
    
    return 0
  }

  // Find matching customer from database
  const findMatchingCustomer = (customerName: string) => {
    if (!customerName || customers.length === 0) return null
    
    let bestMatch: { customer: any, similarity: number } | null = null
    
    for (const customer of customers) {
      const similarity = calculateSimilarity(customerName, customer.name)
      
      // Also check phone number if available
      if (customerInfo.phone && customer.phone) {
        const phoneSimilarity = customer.phone.includes(customerInfo.phone) || customerInfo.phone.includes(customer.phone)
        if (phoneSimilarity) {
          return { customer, similarity: 1.0 }  // Phone match is very strong
        }
      }
      
      if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { customer, similarity }
      }
    }
    
    return bestMatch
  }

  // Find matching project from database
  const findMatchingProject = (projectName: string, projectsList: any[]) => {
    if (!projectName || projectsList.length === 0) return null
    
    let bestMatch: { project: any, similarity: number } | null = null
    
    for (const project of projectsList) {
      const similarity = calculateSimilarity(projectName, project.name)
      
      if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { project, similarity }
      }
    }
    
    return bestMatch
  }

  const checkProductMatches = () => {
    if (!analyzedData?.items) return
    
    const matches = analyzedData.items.map((item, index) => {
      // Use ten_san_pham if available, otherwise extract from hang_muc_thi_cong
      const itemName = (item.ten_san_pham || item.hang_muc_thi_cong.split('\n')[0]).trim().toLowerCase()
      
      // Clean itemName for better matching
      const cleanedItemName = itemName.replace(/cửa sổ/g, '').replace(/cửa/g, '').trim()
      
      // Try exact match first
      let matchedProduct = products.find(p => {
        const pName = p.name.toLowerCase()
        return pName === cleanedItemName || 
               pName.includes(cleanedItemName) || 
               cleanedItemName.includes(pName)
      })
      
      // If no exact match, try fuzzy match
      if (!matchedProduct) {
        matchedProduct = products.find(p => {
          const pName = p.name.toLowerCase()
          // Simple similarity: check if significant words match
          const itemWords = cleanedItemName.split(/\s+/)
          const productWords = pName.split(/\s+/)
          const matchedWords = itemWords.filter(w => productWords.some(pw => pw.includes(w) || w.includes(pw)))
          return matchedWords.length >= Math.min(2, itemWords.length)
        })
      }
      
      return {
        index,
        exists: !!matchedProduct,
        matchedProduct
      }
    })
    
    setProductMatchStatus(matches)
  }

  const handleDownloadTemplate = async () => {
    setDownloading(true)
    try {
      const XLSX = await loadXLSX()
      const wb = XLSX.utils.book_new()
      
      // Template data theo định dạng thực tế
      const templateData = [
        {
          'STT': 1,
          'Ký hiệu': '',
          'Hạng mục thi công': 'VÁCH KÍNH VĂN PHÒNG\nKính trắng 10mm cường lực\nSử dụng đế nẹp sập tiêu chuẩn màu trắng sữa lắp kính',
          'ĐVT': 'm²',
          'Ngang (m)': 3.250,
          'Cao (m)': 2.780,
          'Số lượng': 1,
          'Diện tích (m²)': 9.04,
          'Đơn giá (VNĐ/ĐVT)': 850000,
          'Thành tiền (VNĐ)': 7684000,
          'Ghi chú': ''
        },
        {
          'STT': '',
          'Ký hiệu': 'Vách kính cường lực',
          'Hạng mục thi công': 'Phụ kiện cửa kính mở BLS VVP inox trắng\n1 bản lề sàn\n1 kẹp kính L\n1 kẹp kính trên\n1 kẹp kính dưới\n1 khóa âm sàn\n1 tay nắm H600',
          'ĐVT': 'bộ',
          'Ngang (m)': '',
          'Cao (m)': '',
          'Số lượng': 1,
          'Diện tích (m²)': '',
          'Đơn giá (VNĐ/ĐVT)': 2600000,
          'Thành tiền (VNĐ)': 2600000,
          'Ghi chú': ''
        }
      ]
      
      const ws = XLSX.utils.json_to_sheet(templateData)
      XLSX.utils.book_append_sheet(wb, ws, 'Báo giá')
      XLSX.writeFile(wb, 'Mau_Bao_Gia.xlsx')
    } catch (error) {
      console.error('Error downloading template:', error)
      alert('Lỗi khi tải file mẫu')
    } finally {
      setDownloading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('📁 New file selected:', file.name, 'Size:', file.size, 'bytes', 'Type:', file.type)
    console.log('🔄 Clearing previous data...')

    // Check for Excel temporary/lock files
    if (file.name.startsWith('~$') || file.name.startsWith('~')) {
      setError(
        `⚠️ File "${file.name}" là file tạm (temporary file) của Excel.\n\n` +
        `File này được Excel tự động tạo khi bạn đang mở file gốc.\n\n` +
        `🔧 Cách khắc phục:\n` +
        `1. Đóng file Excel đang mở\n` +
        `2. Upload file gốc (không có ký tự ~ hoặc ~$ ở đầu tên file)\n` +
        `3. File gốc có tên: "${file.name.replace(/^~\$?/, '')}"`
      )
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }
    
    // Check for suspiciously small files (likely temporary or corrupted)
    if (file.size < 1000) {
      setError(
        `⚠️ File quá nhỏ (${file.size} bytes).\n\n` +
        `File Excel báo giá thường có kích thước > 10KB.\n\n` +
        `Vui lòng kiểm tra:\n` +
        `- File có bị lỗi không?\n` +
        `- Đóng file Excel trước khi upload\n` +
        `- Upload đúng file báo giá gốc (không phải file temporary ~$...)`
      )
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Check file type - ONLY Excel for now (PDF has compatibility issues)
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel'
    const isPDF = file.name.endsWith('.pdf') || file.type === 'application/pdf'

    if (isPDF) {
      setError('Tính năng PDF đang được cập nhật. Vui lòng sử dụng file Excel (.xlsx, .xls)')
      return
    }

    if (!isExcel) {
      setError('Vui lòng chọn file Excel (.xlsx, .xls)')
      return
    }

    // Clear all previous data first
    setAnalyzedData(null)
    setError(null)
    setSuccess(null)
    setAnalyzing(true)

    try {
      let documentText = ''
      let fileType = 'excel'

      if (isPDF) {
        // Extract text from PDF
        console.log('📄 Extracting text from PDF...')
        fileType = 'pdf'
        documentText = await extractTextFromPDF(file)
        console.log('✅ PDF text extracted, length:', documentText.length)
        console.log('📊 PDF text preview (first 1000 chars):', documentText.substring(0, 1000))
      } else {
        // Convert Excel to structured text for AI analysis
        const XLSX = await loadXLSX()
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array', cellDates: true, cellNF: false, cellText: false })
        
        console.log('📊 Excel workbook loaded, sheets:', wb.SheetNames)
        
        // Find sheet: Ưu tiên "hợp đồng", "BG", "Báo giá", tránh "GIÁ VỐN"
        let sheetName = wb.SheetNames.find(name => 
          name.toLowerCase().includes('hợp đồng') || 
          name.toLowerCase().includes('hop dong')
        ) || wb.SheetNames.find(name => 
          name.toLowerCase().includes('bg') ||
          name.toLowerCase().includes('báo giá') || 
          name.toLowerCase().includes('bao gia')
        ) || wb.SheetNames.find(name => 
          !name.toLowerCase().includes('giá vốn') &&
          !name.toLowerCase().includes('gia von')
        ) || wb.SheetNames[0]
        
        const ws = wb.Sheets[sheetName]
        console.log(`✅ Đọc sheet: "${sheetName}"`)
        
        if (!ws) {
          throw new Error('Không tìm thấy sheet hợp lệ trong file Excel')
        }
        
        // Get sheet range
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
        const totalRows = range.e.r + 1
        const totalCols = range.e.c + 1
        
        console.log(`📊 Sheet dimensions: ${totalRows} rows x ${totalCols} columns`)
        console.log(`📊 Sheet range: ${ws['!ref']}`)
        
        // Read ALL rows including empty ones, preserving structure
        const rowsWithHeaders: any[] = []
        for (let rowIndex = 0; rowIndex <= range.e.r; rowIndex++) {
          const row: any[] = []
          for (let colIndex = 0; colIndex <= range.e.c; colIndex++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
            const cell = ws[cellAddress]
            
            // Get cell value, handling different types
            let cellValue = ''
            if (cell) {
              if (cell.t === 'n') {
                // Number
                cellValue = cell.v
              } else if (cell.t === 'd') {
                // Date
                cellValue = cell.w || cell.v.toString()
              } else if (cell.t === 'b') {
                // Boolean
                cellValue = cell.v ? 'TRUE' : 'FALSE'
              } else if (cell.t === 'e') {
                // Error
                cellValue = `#ERROR: ${cell.v}`
              } else {
                // String or formula result
                cellValue = cell.w || cell.v || ''
              }
            }
            row.push(cellValue)
          }
          rowsWithHeaders.push(row)
        }
        
        console.log(`✅ Read ${rowsWithHeaders.length} rows, ${rowsWithHeaders[0]?.length || 0} columns`)
        
        // Find actual header row (row with column names like STT, Hạng mục, etc.)
        let headerRowIndex = -1
        const headerKeywords = ['STT', 'Hạng mục', 'ĐVT', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Khách hàng', 'Địa chỉ', 'Giám sát']
        
        for (let i = 0; i < Math.min(30, rowsWithHeaders.length); i++) {
          const row = rowsWithHeaders[i]
          const rowText = row.map((cell: any) => String(cell || '')).join(' ').toUpperCase()
          const hasHeaderKeywords = headerKeywords.some(keyword => rowText.includes(keyword.toUpperCase()))
          
          if (hasHeaderKeywords) {
            headerRowIndex = i
            console.log(`✅ Found header row at index ${i}:`, row.filter((c: any) => c))
            break
          }
        }
        
        // Use found header row or first row
        const actualHeaders = headerRowIndex >= 0 ? rowsWithHeaders[headerRowIndex] : (rowsWithHeaders[0] || [])
        const dataStartRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 1
        
        console.log(`📊 Using headers from row ${headerRowIndex >= 0 ? headerRowIndex + 1 : 1}:`, actualHeaders.filter((h: any) => h))
        console.log(`📊 Data starts from row ${dataStartRow + 1}`)
        
        // Build comprehensive document text with ALL rows
        documentText = `=== THÔNG TIN FILE EXCEL ===\n`
        documentText += `Tên sheet: ${sheetName}\n`
        documentText += `Tổng số dòng: ${rowsWithHeaders.length}\n`
        documentText += `Tổng số cột: ${actualHeaders.length}\n`
        documentText += `Header row: ${headerRowIndex >= 0 ? headerRowIndex + 1 : 1}\n\n`
        
        documentText += `=== HEADER ROW ===\n`
        documentText += actualHeaders.map((header: string, idx: number) => {
          const h = String(header || '').trim()
          return `Cột ${idx + 1}: "${h}"`
        }).join(' | ') + '\n\n'
        
        documentText += `=== DỮ LIỆU TỪNG DÒNG (BẮT ĐẦU TỪ DÒNG ${dataStartRow + 1}) ===\n`
        
        // Process rows starting from data
        for (let rowIndex = 0; rowIndex < rowsWithHeaders.length; rowIndex++) {
          const row = rowsWithHeaders[rowIndex]
          
          // Check if row has any data
          const hasData = row.some((cell: any) => {
            const val = cell !== null && cell !== undefined && String(cell).trim() !== ''
            return val
          })
          
          // Always include first 30 rows for context (to find customer info, etc.)
          // And include all rows with data
          if (hasData || rowIndex < 30) {
            documentText += `\n--- Dòng ${rowIndex + 1} ---\n`
            
            // Create detailed key-value pairs for each cell
            const rowData: string[] = []
            for (let colIndex = 0; colIndex < Math.max(actualHeaders.length, row.length); colIndex++) {
              const header = colIndex < actualHeaders.length 
                ? (String(actualHeaders[colIndex] || '').trim() || `Cột ${colIndex + 1}`)
                : `Cột ${colIndex + 1}`
              const cellValue = row[colIndex] !== undefined && row[colIndex] !== null 
                ? String(row[colIndex]).trim() 
                : ''
              
              // Include all non-empty cells and first 10 columns
              if (cellValue || colIndex < 10) {
                rowData.push(`${header}: "${cellValue}"`)
              }
            }
            
            documentText += rowData.join(' | ') + '\n'
            
            // Also include raw row data for context (all non-empty cells)
            const rawRowData = row.map((cell: any, idx: number) => {
              const val = cell !== undefined && cell !== null ? String(cell).trim() : ''
              return val ? `[${idx}]=${val}` : ''
            }).filter((s: string) => s).join(' ')
            
            if (rawRowData) {
              documentText += `Raw: ${rawRowData}\n`
            }
          }
        }
        
        console.log('📊 Document text generated, length:', documentText.length)
        console.log('📊 First 1000 chars:', documentText.substring(0, 1000))
        console.log('📊 Last 500 chars:', documentText.substring(Math.max(0, documentText.length - 500)))
      }
      
      // Send to AI for analysis
      console.log(`📤 Sending ${fileType.toUpperCase()} data to AI for analysis...`)
      console.log('📄 File name:', file.name)
      console.log('📄 File size:', file.size, 'bytes')
      console.log('📄 File last modified:', new Date(file.lastModified).toISOString())
      console.log('📊 Document text length:', documentText.length, 'characters')
      console.log('📊 Document text preview (first 1000 chars):', documentText.substring(0, 1000))
      console.log('📊 Document text preview (last 500 chars):', documentText.substring(Math.max(0, documentText.length - 500)))
      
      // Create unique request ID to prevent caching
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      console.log('🆔 Request ID:', requestId)
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Chưa đăng nhập')
      }

      // Add timestamp and unique ID to prevent caching
      const timestamp = Date.now()
      const uniqueId = `${timestamp}-${Math.random().toString(36).substring(7)}`
      
      const requestBody = {
        documentData: documentText,
        fileName: file.name,
        fileType: fileType,
        timestamp: timestamp,
        requestId: uniqueId,
        fileSize: file.size,
        fileLastModified: file.lastModified
      }
      
      console.log('📤 Request body metadata:', {
        fileName: requestBody.fileName,
        fileType: requestBody.fileType,
        fileSize: requestBody.fileSize,
        documentDataLength: requestBody.documentData.length,
        requestId: requestBody.requestId
      })
      
      const response = await fetch(`/api/sales/quotes/analyze-excel-ai?t=${timestamp}&id=${uniqueId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-ID': uniqueId
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📥 API response status:', response.status)

      if (!response.ok) {
        let errorMessage = 'Lỗi khi phân tích file'
        let errorDetails: any = {}
        
        try {
          const error = await response.json()
          errorDetails = error
          errorMessage = error.message || error.error || error.detail || errorMessage
          
          // Save debug info from error response if available
          if (error.debug) {
            console.log('🔍 Debug info from error response:', error.debug)
            setDebugInfo(error.debug)
            setShowDebug(true)  // Auto-show debug on error
          }
          
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            error: error,
            hasDebug: !!error.debug
          })
        } catch (e) {
          const errorText = await response.text()
          console.error('Error response text:', errorText)
          errorMessage = errorText || errorMessage
          try {
            errorDetails = JSON.parse(errorText)
            errorMessage = errorDetails.message || errorDetails.error || errorMessage
            
            // Try to get debug info from parsed error
            if (errorDetails.debug) {
              setDebugInfo(errorDetails.debug)
              setShowDebug(true)
            }
          } catch (parseError) {
            // Keep original errorText as errorMessage
          }
        }
        
        // Provide more specific error message
        if (response.status === 400) {
          errorMessage = errorDetails.message || 'Dữ liệu file không hợp lệ. Vui lòng kiểm tra lại file.'
        } else if (response.status === 500) {
          errorMessage = errorDetails.message || 'Lỗi server khi phân tích file. Vui lòng thử lại sau.'
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('✅ AI Analysis result received:', {
        success: result.success,
        hasAnalysis: !!result.analysis,
        hasDebug: !!result.debug,
        customer: result.analysis?.customer?.name,
        itemsCount: result.analysis?.items?.length,
        requestId: uniqueId
      })
      
      // Save debug info if available
      if (result.debug) {
        console.log('🔍 Debug info received:', result.debug)
        setDebugInfo(result.debug)
        
        // Auto show debug if there are warnings
        if (result.debug.warnings && result.debug.warnings.length > 0) {
          setShowDebug(true)
          console.warn('⚠️ Warnings found:', result.debug.warnings)
        }
      }
      
      if (!result.success || !result.analysis) {
        throw new Error(result.error || 'Không nhận được dữ liệu phân tích từ AI')
      }
      
      console.log('🎉 Setting analyzed data to state')
      console.log('📋 Final analysis data:', {
        customer: result.analysis.customer?.name,
        project: result.analysis.project?.name,
        itemsCount: result.analysis.items?.length,
        totalAmount: result.analysis.total_amount,
        firstItem: result.analysis.items?.[0]?.hang_muc_thi_cong?.substring(0, 50)
      })
      
      // Verify this is new data (check customer name matches file)
      console.log('🔍 Verifying data matches file:', {
        file: file.name,
        customer: result.analysis.customer?.name,
        requestId: uniqueId
      })
      
      // Set new analyzed data
      setAnalyzedData(result.analysis)
      
      // Initialize editable customer and project info from analyzed data
      const customerName = result.analysis.customer?.name || ''
      const customerAddress = result.analysis.customer?.address || ''
      const customerPhone = result.analysis.customer?.phone || ''
      const customerEmail = result.analysis.customer?.email || ''
      
      setCustomerInfo({
        name: customerName,
        address: customerAddress,
        phone: customerPhone,
        email: customerEmail
      })
      
      // 🔍 AUTO-MATCH CUSTOMER FROM DATABASE
      console.log('🔍 Checking if customer exists in database...')
      let matchedCustomer = null
      
      if (customerName && customers.length > 0) {
        const match = findMatchingCustomer(customerName)
        
        if (match && match.similarity >= 0.8) {
          matchedCustomer = match.customer
          console.log(`✅ Found matching customer: "${matchedCustomer.name}" (similarity: ${(match.similarity * 100).toFixed(0)}%)`)
          
          // Auto-select the matched customer
          setSelectedCustomerId(matchedCustomer.id)
          setIsNewCustomer(false)
          
          // Update customer info with data from database
          setCustomerInfo({
            name: matchedCustomer.name,
            address: customerAddress || matchedCustomer.address || '',
            phone: customerPhone || matchedCustomer.phone || '',
            email: customerEmail || matchedCustomer.email || ''
          })
          
          // Load projects for this customer
          console.log('📂 Loading projects for matched customer...')
          await fetchProjects(matchedCustomer.id)
          
        } else if (match) {
          console.log(`⚠️ Found similar customer: "${match.customer.name}" but similarity too low (${(match.similarity * 100).toFixed(0)}%)`)
          setIsNewCustomer(true)
        } else {
          console.log('❌ No matching customer found in database')
          setIsNewCustomer(true)
        }
      } else if (!customerName) {
        setIsNewCustomer(true)
        console.log('⚠️ No customer name found, marking as new customer')
      } else {
        setIsNewCustomer(true)
        console.log('ℹ️ No customers loaded, marking as new customer')
      }
      
      // Initialize project info
      const projectName = result.analysis.project?.name || ''
      const projectAddress = result.analysis.project?.address || customerAddress
      const projectSupervisor = result.analysis.project?.supervisor || ''
      
      setProjectInfo({
        name: projectName || (customerName && customerAddress ? `${customerName} - ${customerAddress}` : customerName),
        address: projectAddress,
        supervisor: projectSupervisor
      })
      
      // 🔍 AUTO-MATCH PROJECT IF CUSTOMER MATCHED
      if (matchedCustomer) {
        console.log('🔍 Checking if project exists for this customer...')
        
        // Wait a bit for projects to load
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Re-fetch projects to ensure we have the latest
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .eq('customer_id', matchedCustomer.id)
          .in('status', ['planning', 'active'])
          .order('name')
        
        if (projectsData && projectsData.length > 0) {
          const projectMatch = findMatchingProject(projectName, projectsData)
          
          if (projectMatch && projectMatch.similarity >= 0.8) {
            console.log(`✅ Found matching project: "${projectMatch.project.name}" (similarity: ${(projectMatch.similarity * 100).toFixed(0)}%)`)
            
            // Auto-select the matched project
            setSelectedProjectId(projectMatch.project.id)
            setIsNewProject(false)
            
            // Update project info
            setProjectInfo({
              name: projectMatch.project.name,
              address: projectAddress,
              supervisor: projectSupervisor
            })
          } else if (projectMatch) {
            console.log(`⚠️ Found similar project: "${projectMatch.project.name}" but similarity too low (${(projectMatch.similarity * 100).toFixed(0)}%)`)
            setIsNewProject(true)
          } else {
            console.log('❌ No matching project found, will create new project')
            setIsNewProject(true)
          }
        } else {
          console.log('ℹ️ No projects found for this customer, will create new project')
          setIsNewProject(true)
        }
      } else {
        // Customer is new, so project must be new too
        if (!projectName && customerName) {
          setProjectInfo(prev => ({
            ...prev,
            name: customerAddress ? `${customerName} - ${customerAddress}` : customerName
          }))
        }
        setIsNewProject(true)
      }
      
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      console.log('✅ File processing complete for:', file.name)
      
    } catch (error: any) {
      console.error('❌ Error analyzing file:', error)
      setError(error.message || 'Lỗi khi phân tích file. Vui lòng thử lại.')
      // Reset file input on error too
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleClearData = () => {
    console.log('🗑️ Clearing all data...')
    setAnalyzedData(null)
    setError(null)
    setSuccess(null)
    setCustomerInfo({ name: '', address: '', phone: '', email: '' })
    setProjectInfo({ name: '', address: '', supervisor: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    console.log('✅ Data cleared, ready for new upload')
  }

  const getValidToken = async (): Promise<string> => {
    let token: string | null = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.')
    }
    
    // Validate token format
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      console.error('❌ Invalid token format')
      throw new Error('Token không đúng định dạng. Vui lòng đăng nhập lại.')
    }
    
    // Check if token is expired (simple check - decode JWT and check exp)
    try {
      const payload = JSON.parse(atob(tokenParts[1]))
      const exp = payload.exp * 1000 // Convert to milliseconds
      const now = Date.now()
      const expiresIn = exp - now
      
      console.log('🔑 Token status:', {
        expiresAt: new Date(exp).toISOString(),
        expiresInMinutes: Math.floor(expiresIn / 1000 / 60),
        isExpired: expiresIn < 0
      })
      
      // If token is expired or expires in less than 5 minutes, try to refresh
      if (expiresIn < 5 * 60 * 1000) {
        console.log('🔄 Token sắp hết hạn hoặc đã hết hạn, đang refresh...')
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${backendUrl}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken })
            })
            
            if (response.ok) {
              const data = await response.json()
              const newToken = data.access_token
              if (newToken && typeof newToken === 'string') {
                localStorage.setItem('access_token', newToken)
                console.log('✅ Token refreshed successfully')
                return newToken
              } else {
                console.warn('⚠️ Invalid access_token in refresh response')
              }
            } else {
              console.warn('⚠️ Token refresh failed:', response.status, response.statusText)
            }
          } catch (refreshError) {
            console.warn('⚠️ Token refresh error:', refreshError)
          }
        } else {
          console.warn('⚠️ No refresh token available')
        }
      }
      
      // If token is expired and refresh failed, throw error
      if (expiresIn < 0) {
        throw new Error('Token đã hết hạn và không thể refresh. Vui lòng đăng nhập lại.')
      }
      
      // Ensure token is not null
      if (!token) {
        throw new Error('Token không tồn tại. Vui lòng đăng nhập lại.')
      }
      
      return token
    } catch (e) {
      if (e instanceof Error && e.message.includes('hết hạn')) {
        throw e
      }
      // If can't decode, log warning but return token (let backend verify)
      console.warn('⚠️ Could not decode token, will let backend verify:', e)
      
      // Ensure token is not null before returning
      if (!token) {
        throw new Error('Token không hợp lệ. Vui lòng đăng nhập lại.')
      }
      
      return token
    }
  }

  const handleImport = async () => {
    if (!analyzedData) return
    
    // Validate required fields
    if (!customerInfo.name || !customerInfo.name.trim()) {
      setError('❌ Vui lòng nhập tên khách hàng')
      return
    }
    
    if (!projectInfo.name || !projectInfo.name.trim()) {
      setError('❌ Vui lòng nhập tên dự án')
      return
    }
    
    // Check if there are any items
    if (!analyzedData.items || analyzedData.items.length === 0) {
      setError('❌ Không có hạng mục nào để import. Vui lòng thêm ít nhất 1 hạng mục.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    
    console.log('🚀 Starting import process...')
    console.log('📋 Customer:', isNewCustomer ? 'NEW' : selectedCustomerId, '-', customerInfo.name)
    console.log('🏗️ Project:', isNewProject ? 'NEW' : selectedProjectId, '-', projectInfo.name)
    console.log('📦 Items:', analyzedData.items.length)

    try {
      const token = await getValidToken()

      // Prepare import data with edited customer and project info
      const importData = {
        ...analyzedData,
        customer: {
          ...analyzedData.customer,
          ...customerInfo,
          name: customerInfo.name.trim(),
          id: isNewCustomer ? undefined : selectedCustomerId  // Include customer ID if using existing
        },
        project: {
          ...analyzedData.project,
          ...projectInfo,
          name: projectInfo.name.trim(),
          id: isNewProject ? undefined : selectedProjectId,  // Include project ID if using existing
          customer_id: isNewCustomer ? undefined : selectedCustomerId
        },
        employee_id: selectedEmployeeId || null,
        is_new_customer: isNewCustomer,
        is_new_project: isNewProject
      }
      
      console.log('📤 Sending import request with data:', {
        customer: importData.customer.name,
        customerId: importData.customer.id,
        isNewCustomer,
        project: importData.project.name,
        projectId: importData.project.id,
        isNewProject,
        itemsCount: importData.items.length,
        employeeId: importData.employee_id
      })

      // Try calling backend directly (to avoid Next.js middleman issues)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const apiUrl = `${backendUrl}/api/sales/quotes/import-from-analysis`
      
      // Validate token before sending
      if (!token || token.length < 50) {
        throw new Error('Token không hợp lệ. Vui lòng đăng nhập lại.')
      }
      
      // Check token expiration
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const exp = payload.exp * 1000
        const now = Date.now()
        
        if (exp < now) {
          throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.')
        }
        
        console.log('🔑 Token info:', {
          userId: payload.sub || payload.user_id,
          exp: new Date(exp).toISOString(),
          expiresIn: Math.floor((exp - now) / 1000 / 60) + ' minutes'
        })
      } catch (e) {
        console.warn('⚠️ Could not parse token:', e)
        // Continue anyway, let backend verify
      }
      
      console.log('🎯 Calling backend directly:', apiUrl)
      console.log('🔑 Token preview:', token.substring(0, 30) + '...' + token.substring(token.length - 10))

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      })
      
      console.log('📥 Response status:', response.status, response.statusText)

      if (!response.ok) {
        let errorData: any = {}
        let errorMessage = 'Lỗi khi import'
        let errorDetail = ''
        
        try {
          errorData = await response.json()
          console.error('❌ Import failed (JSON):', errorData)
          errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage
          errorDetail = errorData.detail || errorData.error || ''
        } catch (e) {
          // Can't parse JSON, try text
          try {
            const errorText = await response.text()
            console.error('❌ Import failed (text):', errorText)
            errorMessage = errorText || errorMessage
            errorDetail = errorText
          } catch (e2) {
            console.error('❌ Import failed (unknown):', e2)
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
        }
        
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          console.error('🔐 Authentication failed:', {
            status: response.status,
            errorData,
            tokenPreview: token.substring(0, 30) + '...'
          })
          
          throw new Error(
            '🔐 Xác thực thất bại (401 Unauthorized)\n\n' +
            `Chi tiết: ${errorDetail || 'Token không hợp lệ hoặc đã hết hạn'}\n\n` +
            '📝 Cách khắc phục:\n' +
            '1. Nhấn F5 để tải lại trang\n' +
            '2. Đăng xuất và đăng nhập lại\n' +
            '3. Xóa localStorage và đăng nhập lại:\n' +
            '   - Mở DevTools (F12)\n' +
            '   - Console: localStorage.clear()\n' +
            '   - Refresh và đăng nhập lại\n\n' +
            'Nếu vẫn gặp lỗi, liên hệ admin để kiểm tra cấu hình Supabase JWT.'
          )
        }
        
        // Handle other JWT/token errors
        const lowerError = errorMessage.toLowerCase()
        if (lowerError.includes('jwt') || lowerError.includes('token') || lowerError.includes('signature') || lowerError.includes('unauthorized')) {
          throw new Error(
            '🔐 Lỗi xác thực token\n\n' +
            `Chi tiết: ${errorMessage}\n\n` +
            '📝 Cách khắc phục:\n' +
            '1. Nhấn F5 để tải lại trang\n' +
            '2. Đăng xuất và đăng nhập lại\n' +
            '3. Xóa cache trình duyệt (Ctrl+Shift+Delete)\n\n' +
            'Nếu vẫn gặp lỗi, liên hệ admin để kiểm tra token configuration.'
          )
        }
        
        // Generic error
        throw new Error(
          `❌ Lỗi khi import (HTTP ${response.status})\n\n` +
          `${errorMessage}\n\n` +
          (errorDetail ? `Chi tiết: ${errorDetail}\n\n` : '') +
          'Vui lòng thử lại hoặc liên hệ admin nếu lỗi vẫn tiếp tục.'
        )
      }

      const result = await response.json()
      console.log('✅ Import successful:', result)
      
      // Create detailed success message
      const successParts = []
      if (result.createdCustomers > 0) successParts.push(`✨ ${result.createdCustomers} khách hàng mới`)
      if (result.createdProjects > 0) successParts.push(`🏗️ ${result.createdProjects} dự án mới`)
      if (result.createdQuotes > 0) successParts.push(`📄 ${result.createdQuotes} báo giá`)
      if (result.matchedProducts > 0) successParts.push(`✓ ${result.matchedProducts} sản phẩm có sẵn`)
      if (result.createdProducts > 0) successParts.push(`✨ ${result.createdProducts} sản phẩm mới`)
      
      setSuccess(
        `🎉 Import thành công!\n\n${successParts.join('\n')}\n\n` +
        `Báo giá ID: ${result.quoteId}`
      )
      
      // Log detailed matching info
      if (result.matchedProductDetails && result.matchedProductDetails.length > 0) {
        console.log('✅ Matched products:', result.matchedProductDetails)
      }
      if (result.newProductDetails && result.newProductDetails.length > 0) {
        console.log('✨ New products created:', result.newProductDetails)
      }
      
      // Clear data and redirect after success
      if (onImportSuccess) {
        setTimeout(() => {
          handleClearData()
          onImportSuccess()
        }, 3000)
      }
    } catch (error: any) {
      console.error('❌ Error importing:', error)
      
      let errorMessage = error.message || 'Lỗi khi import'
      
      // Add helpful hints for common errors
      if (errorMessage.includes('JWT') || errorMessage.includes('token') || errorMessage.includes('Phiên đăng nhập')) {
        errorMessage += '\n\n💡 Hướng dẫn: Nhấn Ctrl+F5 để tải lại trang, sau đó đăng nhập lại.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Sparkles className="h-6 w-6 mr-2" />
              Import Báo giá từ Excel với AI
            </h2>
            <p className="text-blue-100">
              Upload file Excel (.xlsx, .xls) và để AI tự động phân tích, trích xuất thông tin khách hàng và sản phẩm
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {analyzedData && (
              <button
                onClick={handleClearData}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Xóa dữ liệu</span>
              </button>
            )}
            <button
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Tải file mẫu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
              accept=".xlsx,.xls"
            onChange={handleFileSelect}
            onClick={(e) => {
              // Reset value to allow selecting the same file again
              const target = e.target as HTMLInputElement
              target.value = ''
            }}
            className="hidden"
            id="document-upload-ai"
            key={analyzedData ? 'has-data' : 'no-data'}
          />
          <label
            htmlFor="document-upload-ai"
            className="cursor-pointer flex flex-col items-center space-y-4"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                <span className="text-lg font-medium text-gray-700">
                  🤖 AI đang phân tích file...
                </span>
                <span className="text-sm text-gray-500">
                  Đang gửi dữ liệu đến OpenAI GPT-4o để trích xuất thông tin
                </span>
                <span className="text-xs text-blue-600 mt-2">
                  ⏳ Quá trình này có thể mất 10-30 giây tùy vào độ phức tạp của file (PDF có thể mất thêm thời gian)
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-4">
                  <FileSpreadsheet className="h-16 w-16 text-gray-400" />
                </div>
                <div className="text-center">
                  <span className="text-lg font-medium text-gray-700">
                    Chọn file Excel để upload
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Hỗ trợ .xlsx, .xls - AI sẽ tự động phân tích và trích xuất thông tin
                  </p>
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                    <p className="text-xs font-semibold text-yellow-900 mb-1">⚠️ Lưu ý quan trọng:</p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li>• <strong>Đóng file Excel</strong> trước khi upload</li>
                      <li>• <strong>Không upload file có tên bắt đầu bằng ~$</strong> (đây là file tạm)</li>
                      <li>• File phải có <strong>kích thước {'>'} 10KB</strong></li>
                      <li>• Đảm bảo file có <strong>đầy đủ dữ liệu</strong> báo giá</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Debug Info Panel */}
      {debugInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="w-full flex items-center justify-between text-left font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔍</span>
              <span>Thông tin debug - AI đã quét được gì?</span>
              {debugInfo.warnings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 rounded-full">
                  {debugInfo.warnings.length} cảnh báo
                </span>
              )}
            </div>
            {showDebug ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {showDebug && (
            <div className="mt-4 space-y-4">
              {/* Warnings */}
              {debugInfo.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-bold text-yellow-900 mb-2">⚠️ Cảnh báo:</h4>
                  <ul className="space-y-1">
                    {debugInfo.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-800">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Document Preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h4 className="font-bold text-gray-900 mb-2">📄 Thông tin file:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Độ dài:</strong> {debugInfo.documentPreview.totalLength.toLocaleString()} ký tự</p>
                  <p><strong>Số dòng:</strong> {debugInfo.documentPreview.lineCount.toLocaleString()} dòng</p>
                </div>
                <details className="mt-2">
                  <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800">
                    Xem preview dữ liệu (500 ký tự đầu)
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                    {debugInfo.documentPreview.first500Chars}
                  </pre>
                </details>
              </div>
              
              {/* Extracted Info Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h4 className="font-bold text-gray-900 mb-2">📊 Thông tin đã trích xuất:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.customerFound ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.customerFound ? 'text-gray-900' : 'text-gray-500'}>
                      Khách hàng: {debugInfo.extractedInfo.customerName || 'Không tìm thấy'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.addressFound ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.addressFound ? 'text-gray-900' : 'text-gray-500'}>
                      Địa chỉ: {debugInfo.extractedInfo.address || 'Không tìm thấy'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.phoneFound ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.phoneFound ? 'text-gray-900' : 'text-gray-500'}>
                      SĐT: {debugInfo.extractedInfo.phone || 'Không tìm thấy'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.supervisorFound ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.supervisorFound ? 'text-gray-900' : 'text-gray-500'}>
                      Giám sát: {debugInfo.extractedInfo.supervisor || 'Không tìm thấy'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.dateFound ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.dateFound ? 'text-gray-900' : 'text-gray-500'}>
                      Ngày: {debugInfo.extractedInfo.date || 'Không tìm thấy'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {debugInfo.extractedInfo.itemsCount > 0 ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span className={debugInfo.extractedInfo.itemsCount > 0 ? 'text-gray-900' : 'text-gray-500'}>
                      Items: {debugInfo.extractedInfo.itemsCount}
                    </span>
                  </div>
                </div>
                
                {/* Items Preview */}
                {debugInfo.extractedInfo.itemsPreview.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800">
                      Xem 3 items đầu tiên
                    </summary>
                    <div className="mt-2 space-y-2">
                      {debugInfo.extractedInfo.itemsPreview.map((item, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                          <div className="font-semibold text-gray-900">{item.ten_san_pham}</div>
                          <div className="text-gray-600">
                            Loại: {item.loai_san_pham || 'N/A'} | 
                            SL: {item.so_luong} | 
                            Đơn giá: {item.don_gia.toLocaleString()} | 
                            Thành tiền: {item.thanh_tien.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                
                {/* Financial Summary */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng khối lượng:</span>
                      <span className={`font-semibold ${debugInfo.extractedInfo.subtotalFound ? 'text-gray-900' : 'text-red-600'}`}>
                        {debugInfo.extractedInfo.subtotal.toLocaleString()} đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT:</span>
                      <span className={`font-semibold ${debugInfo.extractedInfo.vatFound ? 'text-gray-900' : 'text-gray-500'}`}>
                        {debugInfo.extractedInfo.taxAmount.toLocaleString()} đ
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="text-gray-900 font-bold">Tổng thanh toán:</span>
                      <span className={`font-bold ${debugInfo.extractedInfo.totalFound ? 'text-blue-600' : 'text-red-600'}`}>
                        {debugInfo.extractedInfo.totalAmount.toLocaleString()} đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Processing Steps */}
              <details className="bg-white border border-gray-200 rounded-lg p-3">
                <summary className="font-bold text-gray-900 cursor-pointer hover:text-blue-600">
                  🔄 Các bước xử lý ({debugInfo.processingSteps.length} bước)
                </summary>
                <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                  {debugInfo.processingSteps.map((step, index) => (
                    <div key={index} className="text-xs text-gray-700 pl-4 border-l-2 border-gray-200">
                      {step}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Analyzed Data Display */}
      {analyzedData && (
        <div className="space-y-6">
          {/* Customer Information Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Thông tin khách hàng</h3>
            </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewCustomer}
                  onChange={(e) => {
                    setIsNewCustomer(e.target.checked)
                    if (e.target.checked) {
                      setSelectedCustomerId('')
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Khách hàng mới</span>
              </label>
            </div>
            
            {!isNewCustomer && selectedCustomerId && (
              <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                <p className="text-sm font-bold text-green-900 flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>✅ AI đã tự động tìm thấy khách hàng có sẵn trong hệ thống</span>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Hệ thống đã so sánh tên "{customerInfo.name}" với danh sách và tìm thấy khách hàng khớp
                </p>
              </div>
            )}
            
            {!isNewCustomer && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Chọn khách hàng có sẵn {selectedCustomerId && '(đã tự động chọn)'}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value)
                    setSelectedCustomerId(e.target.value)
                    if (customer) {
                      setCustomerInfo({
                        name: customer.name,
                        address: customerInfo.address || '',
                        phone: customer.phone || customerInfo.phone || '',
                        email: customer.email || customerInfo.email || ''
                      })
                    }
                    // Load projects for selected customer
                    if (e.target.value) {
                      fetchProjects(e.target.value)
                      setSelectedProjectId('')  // Reset project selection
                      setIsNewProject(true)
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Tên khách hàng <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-semibold text-gray-900"
                  placeholder="Nhập tên khách hàng"
                  required
                  disabled={!isNewCustomer && selectedCustomerId !== ''}
                />
              </div>
                <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  placeholder="Nhập địa chỉ khách hàng"
                />
                </div>
                <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  placeholder="Nhập số điện thoại"
                />
                </div>
                <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Email</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                  placeholder="Nhập email"
                />
              </div>
            </div>
            
            {isNewCustomer && (
              <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <p className="text-sm font-bold text-blue-900">
                  ✨ Khách hàng mới sẽ được tự động tạo khi bạn xác nhận import
                </p>
                </div>
              )}
            
            {!customerInfo.name && (
              <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <p className="text-sm font-bold text-yellow-900">
                  ⚠️ AI không tìm thấy thông tin khách hàng trong file. Vui lòng nhập thủ công.
                </p>
            </div>
            )}
          </div>

          {/* Project Information Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Thông tin dự án</h3>
            </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewProject}
                  onChange={(e) => {
                    setIsNewProject(e.target.checked)
                    if (e.target.checked) {
                      setSelectedProjectId('')
                    }
                  }}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Dự án mới</span>
              </label>
            </div>
            
            {!isNewProject && selectedCustomerId && selectedProjectId && (
              <div className="mb-4 p-3 bg-purple-50 border-2 border-purple-300 rounded-lg">
                <p className="text-sm font-bold text-purple-900 flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>✅ AI đã tự động tìm thấy dự án có sẵn cho khách hàng này</span>
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Hệ thống đã so sánh tên "{projectInfo.name}" với danh sách dự án và tìm thấy dự án khớp
                </p>
              </div>
            )}
            
            {!isNewProject && selectedCustomerId && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Chọn dự án có sẵn {selectedProjectId && '(đã tự động chọn)'}
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value)
                    setSelectedProjectId(e.target.value)
                    if (project) {
                      setProjectInfo({
                        ...projectInfo,
                        name: project.name
                      })
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                >
                  <option value="">-- Chọn dự án --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {!isNewProject && !selectedCustomerId && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                <p className="text-sm font-bold text-amber-900">
                  ⚠️ Vui lòng chọn khách hàng trước để hiển thị danh sách dự án
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Tên dự án <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={projectInfo.name}
                  onChange={(e) => setProjectInfo({ ...projectInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base font-semibold text-gray-900"
                  placeholder="Nhập tên dự án"
                  required
                  disabled={!isNewProject && selectedProjectId !== ''}
                />
              </div>
                <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Địa chỉ dự án</label>
                <input
                  type="text"
                  value={projectInfo.address}
                  onChange={(e) => setProjectInfo({ ...projectInfo, address: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                  placeholder="Nhập địa chỉ dự án"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-1">Nhân viên trách nhiệm / Giám sát</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => {
                    setSelectedEmployeeId(e.target.value)
                    const employee = employees.find(emp => emp.id === e.target.value)
                    if (employee) {
                      setProjectInfo({ ...projectInfo, supervisor: employee.full_name })
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={projectInfo.supervisor}
                  onChange={(e) => setProjectInfo({ ...projectInfo, supervisor: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mt-2 text-gray-900 font-medium"
                  placeholder="Hoặc nhập tên nhân viên trách nhiệm"
                />
              </div>
            </div>
            
            {isNewProject && (
              <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-300 rounded-lg">
                <p className="text-sm font-bold text-purple-900">
                  ✨ Dự án mới sẽ được tự động tạo khi bạn xác nhận import
                </p>
                </div>
              )}
            
            {!projectInfo.name && (
              <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <p className="text-sm font-bold text-yellow-900">
                  ⚠️ AI không tìm thấy thông tin dự án trong file. Vui lòng nhập thủ công.
                </p>
                </div>
              )}
          </div>

          {/* Quote Items Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Danh sách hạng mục</h3>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-900 font-semibold">Đã có trong hệ thống</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-gray-900 font-semibold">Sản phẩm mới</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Loại SP</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Tên sản phẩm</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Mô tả</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">ĐVT</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase" colSpan={2}>
                      <div className="text-center">Quy cách</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Số lượng</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Diện tích (m²)</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Đơn giá</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Thành tiền</th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th colSpan={6}></th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Ngang (m)</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Cao (m)</th>
                    <th colSpan={4}></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyzedData.items.map((item, index) => {
                    const matchStatus = productMatchStatus.find(m => m.index === index)
                    const exists = matchStatus?.exists || false
                    const bgColor = exists ? 'bg-green-50' : 'bg-amber-50'
                    const borderColor = exists ? 'border-l-4 border-green-500' : 'border-l-4 border-amber-500'
                    
                    return (
                      <tr key={index} className={`hover:bg-gray-100 ${bgColor} ${borderColor}`}>
                        <td className="px-4 py-3">
                          {exists ? (
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <span className="text-xs font-bold text-green-800">Đã có</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                              <span className="text-xs font-bold text-amber-800">Tạo mới</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-bold">{item.stt || index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          {item.loai_san_pham ? (
                            <div className="font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                              {item.loai_san_pham}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Chưa phân loại</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div className="font-bold text-gray-900">
                            {item.ten_san_pham || item.hang_muc_thi_cong?.split('\n')[0] || 'Chưa có tên'}
                          </div>
                          {matchStatus?.matchedProduct && (
                            <div className="mt-1 text-xs text-green-700 font-semibold">
                              ✓ Khớp: {matchStatus.matchedProduct.name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-md">
                          <div className="whitespace-pre-line text-xs leading-relaxed">
                            {item.mo_ta || item.hang_muc_thi_cong?.split('\n').slice(1).join('\n') || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.dvt || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold text-center">
                          {item.ngang != null && item.ngang !== undefined ? (
                            <span className="font-bold text-blue-700">
                              {typeof item.ngang === 'number' 
                                ? item.ngang.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
                                : item.ngang}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold text-center">
                          {item.cao != null && item.cao !== undefined ? (
                            <span className="font-bold text-blue-700">
                              {typeof item.cao === 'number' 
                                ? item.cao.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
                                : item.cao}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold text-center">
                          <span className="font-bold text-purple-700">
                            {item.so_luong || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold text-center">
                          {item.dien_tich != null && item.dien_tich !== undefined ? (
                            <span className="font-bold text-green-700">
                              {typeof item.dien_tich === 'number' 
                                ? item.dien_tich.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : item.dien_tich}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold text-right">
                          {(item.don_gia || 0).toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          {(item.thanh_tien || 0).toLocaleString('vi-VN')} VNĐ
                        </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Summary of products to be created */}
            {productMatchStatus.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                <p className="text-sm font-bold text-amber-900">
                  📝 Sẽ tự động tạo {productMatchStatus.filter(m => !m.exists).length} sản phẩm mới khi import
                </p>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Tổng kết</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Tổng tiền</label>
                <div className="text-2xl font-bold text-gray-900">
                  {(analyzedData.subtotal || 0).toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">VAT ({(analyzedData.tax_rate || 0) * 100}%)</label>
                <div className="text-xl font-bold text-gray-900">
                  {(analyzedData.tax_amount || 0).toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-1">Tổng thanh toán</label>
                <div className="text-3xl font-extrabold text-blue-700">
                  {(analyzedData.total_amount || 0).toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms Card */}
          {(analyzedData.notes || analyzedData.terms) && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Ghi chú & Điều khoản</h3>
              </div>
              
              <div className="space-y-4">
                {analyzedData.notes && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">📝 Ghi chú:</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                        {analyzedData.notes}
                      </p>
                    </div>
                  </div>
                )}
                
                {analyzedData.terms && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">📋 Quy trình & Điều khoản:</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                        {analyzedData.terms}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6 shadow-md">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span>Tổng hợp sẽ được tạo khi import</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Customer */}
              <div className={`p-4 rounded-lg border-2 ${isNewCustomer ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${isNewCustomer ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <User className={`h-5 w-5 ${isNewCustomer ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Khách hàng</p>
                    <p className={`text-sm font-bold ${isNewCustomer ? 'text-blue-700' : 'text-gray-700'}`}>
                      {isNewCustomer ? '✨ Tạo mới' : '✓ Sử dụng có sẵn'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-medium truncate" title={customerInfo.name}>
                  {customerInfo.name || 'Chưa có tên'}
                </p>
              </div>
              
              {/* Project */}
              <div className={`p-4 rounded-lg border-2 ${isNewProject ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-300'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${isNewProject ? 'bg-purple-100' : 'bg-gray-100'}`}>
                    <Building2 className={`h-5 w-5 ${isNewProject ? 'text-purple-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Dự án</p>
                    <p className={`text-sm font-bold ${isNewProject ? 'text-purple-700' : 'text-gray-700'}`}>
                      {isNewProject ? '✨ Tạo mới' : '✓ Sử dụng có sẵn'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-medium truncate" title={projectInfo.name}>
                  {projectInfo.name || 'Chưa có tên'}
                </p>
              </div>
              
              {/* Products */}
              <div className="p-4 rounded-lg border-2 bg-amber-50 border-amber-300">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Package className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Sản phẩm mới</p>
                    <p className="text-sm text-amber-700 font-bold">
                      ✨ {productMatchStatus.filter(m => !m.exists).length} sản phẩm
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  {productMatchStatus.filter(m => m.exists).length} sản phẩm đã có
                </p>
              </div>
              
              {/* Quote */}
              <div className="p-4 rounded-lg border-2 bg-green-50 border-green-300">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-100">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Báo giá</p>
                    <p className="text-sm text-green-700 font-bold">
                      ✨ 1 báo giá mới
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  {analyzedData.items.length} hạng mục
                </p>
              </div>
            </div>
            
            {/* Warning if no items */}
            {(!analyzedData.items || analyzedData.items.length === 0) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-sm font-bold text-red-800">
                  ⚠️ Chưa có hạng mục nào. Vui lòng kiểm tra lại file hoặc thêm hạng mục thủ công.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="text-sm text-gray-600">
              <p className="font-semibold">📌 Sẵn sàng import:</p>
              <p className="text-xs mt-1">
                {isNewCustomer ? '✨ Khách hàng mới' : '✓ Khách hàng có sẵn'} • 
                {isNewProject ? ' ✨ Dự án mới' : ' ✓ Dự án có sẵn'} • 
                {' '}1 báo giá • {analyzedData.items.length} hạng mục
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleClearData}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold flex items-center space-x-2 transition-colors"
              >
                <X className="h-5 w-5" />
                <span>Hủy & Upload khác</span>
              </button>
              <button
                onClick={handleImport}
                disabled={loading || !customerInfo.name || !projectInfo.name || !analyzedData.items || analyzedData.items.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center space-x-2 shadow-lg transition-all transform hover:scale-105"
                title={
                  !customerInfo.name ? 'Vui lòng nhập tên khách hàng' :
                  !projectInfo.name ? 'Vui lòng nhập tên dự án' :
                  !analyzedData.items || analyzedData.items.length === 0 ? 'Chưa có hạng mục nào' :
                  `Import ${isNewCustomer ? 'khách hàng mới' : 'khách hàng có sẵn'}, ${isNewProject ? 'dự án mới' : 'dự án có sẵn'}, 1 báo giá với ${analyzedData.items.length} hạng mục`
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang import...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>
                      {isNewCustomer && isNewProject ? 'Tạo mới & Import' : 'Xác nhận Import'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

