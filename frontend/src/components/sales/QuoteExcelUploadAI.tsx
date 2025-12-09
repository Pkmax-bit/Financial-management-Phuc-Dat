'use client'

import React, { useState, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, FileText, X, CheckCircle2, AlertCircle, Loader2, User, Building2, Package, DollarSign, Sparkles } from 'lucide-react'
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
        const error = await response.json()
        errorMessage = error.message || error.error || errorMessage
        console.error('❌ Server error response:', {
          status: response.status,
          error: error
        })
      } catch (e) {
        const errorText = await response.text()
        console.error('❌ Server error text:', errorText)
        errorMessage = errorText || errorMessage
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
}

export default function QuoteExcelUploadAI({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [analyzedData, setAnalyzedData] = useState<AnalyzedQuote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

    // Check file type
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel'
    const isPDF = file.name.endsWith('.pdf') || file.type === 'application/pdf'

    if (!isExcel && !isPDF) {
      setError('Vui lòng chọn file Excel (.xlsx, .xls) hoặc PDF (.pdf)')
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
        
        // Try to find the sheet with most data (not empty)
        let sheetName = wb.SheetNames[0]
        let ws = wb.Sheets[sheetName]
        let maxRows = 0
        
        // Check all sheets to find the one with most data
        for (const name of wb.SheetNames) {
          const sheet = wb.Sheets[name]
          const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
          const rows = range.e.r + 1
          console.log(`📊 Sheet "${name}": ${rows} rows`)
          if (rows > maxRows) {
            maxRows = rows
            sheetName = name
            ws = sheet
          }
        }
        
        console.log(`✅ Using sheet: "${sheetName}" with ${maxRows} rows`)
        
        // Get sheet range to know exact dimensions
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
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            error: error
          })
        } catch (e) {
          const errorText = await response.text()
          console.error('Error response text:', errorText)
          errorMessage = errorText || errorMessage
          try {
            errorDetails = JSON.parse(errorText)
            errorMessage = errorDetails.message || errorDetails.error || errorMessage
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
        customer: result.analysis?.customer?.name,
        itemsCount: result.analysis?.items?.length,
        requestId: uniqueId
      })
      
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    console.log('✅ Data cleared, ready for new upload')
  }

  const handleImport = async () => {
    if (!analyzedData) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Chưa đăng nhập')
      }

      const response = await fetch('/api/sales/quotes/import-from-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyzedData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Lỗi khi import')
      }

      const result = await response.json()
      setSuccess(`Đã tạo thành công: ${result.createdCustomers} khách hàng, ${result.createdProjects} dự án, ${result.createdQuotes} báo giá, ${result.createdProducts} sản phẩm`)
      
      if (onImportSuccess) {
        setTimeout(() => {
          onImportSuccess()
        }, 2000)
      }
    } catch (error: any) {
      console.error('Error importing:', error)
      setError(error.message || 'Lỗi khi import')
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
              Import Báo giá từ Excel/PDF với AI
            </h2>
            <p className="text-blue-100">
              Upload file Excel (.xlsx, .xls) hoặc PDF (.pdf) và để AI tự động phân tích, trích xuất thông tin khách hàng và sản phẩm
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
            accept=".xlsx,.xls,.pdf"
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
                  <FileText className="h-16 w-16 text-gray-400" />
                </div>
                <div>
                  <span className="text-lg font-medium text-gray-700">
                    Chọn file Excel hoặc PDF để upload
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Hỗ trợ .xlsx, .xls, .pdf - AI sẽ tự động phân tích và trích xuất thông tin
                  </p>
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

      {/* Analyzed Data Display */}
      {analyzedData && (
        <div className="space-y-6">
          {/* Customer Information Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Thông tin khách hàng</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                <div className="text-lg font-semibold text-gray-900">{analyzedData.customer.name}</div>
              </div>
              {analyzedData.customer.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <div className="text-gray-900">{analyzedData.customer.address}</div>
                </div>
              )}
              {analyzedData.customer.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <div className="text-gray-900">{analyzedData.customer.phone}</div>
                </div>
              )}
              {analyzedData.customer.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="text-gray-900">{analyzedData.customer.email}</div>
                </div>
              )}
            </div>
          </div>

          {/* Project Information Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Thông tin dự án</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án</label>
                <div className="text-lg font-semibold text-gray-900">{analyzedData.project.name}</div>
              </div>
              {analyzedData.project.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ dự án</label>
                  <div className="text-gray-900">{analyzedData.project.address}</div>
                </div>
              )}
              {analyzedData.project.supervisor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên trách nhiệm</label>
                  <div className="text-gray-900">{analyzedData.project.supervisor}</div>
                </div>
              )}
            </div>
          </div>

          {/* Quote Items Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Danh sách hạng mục</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hạng mục thi công</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ĐVT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">SL</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Đơn giá</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyzedData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.stt || index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                        <div className="whitespace-pre-line">{item.hang_muc_thi_cong}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.dvt}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.so_luong}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.don_gia.toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {item.thanh_tien.toLocaleString('vi-VN')} VNĐ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổng tiền</label>
                <div className="text-2xl font-bold text-gray-900">
                  {analyzedData.subtotal.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VAT ({analyzedData.tax_rate * 100}%)</label>
                <div className="text-xl font-semibold text-gray-900">
                  {analyzedData.tax_amount.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổng thanh toán</label>
                <div className="text-3xl font-bold text-blue-600">
                  {analyzedData.total_amount.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClearData}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold flex items-center space-x-2"
            >
              <X className="h-5 w-5" />
              <span>Xóa dữ liệu & Upload khác</span>
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Đang import...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Xác nhận Import</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

