'use client'

import React, { useState, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Lazy import xlsx
async function loadXLSX() {
  const mod = await import('xlsx')
  return mod
}

interface PreviewRow {
  rowIndex: number
  customerName: string
  customerAddress: string
  projectName: string
  productName: string
  productMatch?: { id: string; name: string; similarity: number } | null
  createNew?: boolean
  quantity: number
  unitPrice: number
  unit: string
  description?: string
  area?: number
  volume?: number
  height?: number
  length?: number
  depth?: number
}

interface ImportResult {
  success: boolean
  message: string
  createdCustomers: number
  createdProjects: number
  createdQuotes: number
  createdProducts: number
  errors: string[]
}

export default function UploadQuoteExcel({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [products, setProducts] = useState<Array<{ id: string; name: string; category_id?: string }>>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Load products for matching
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, category_id')
          .eq('is_active', true)
        setProducts((data || []) as Array<{ id: string; name: string; category_id?: string }>)
      } catch (error) {
        console.error('Error loading products:', error)
      }
    }
    loadProducts()
  }, [])

  // Fuzzy string matching using Levenshtein distance
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()
    
    if (s1 === s2) return 100
    
    // Calculate Levenshtein distance
    const len1 = s1.length
    const len2 = s2.length
    const matrix: number[][] = []
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1
          )
        }
      }
    }
    
    const distance = matrix[len1][len2]
    const maxLen = Math.max(len1, len2)
    const similarity = ((maxLen - distance) / maxLen) * 100
    
    return similarity
  }

  // Find best matching product
  const findBestMatch = (productName: string): { id: string; name: string; similarity: number } | null => {
    if (!productName || !productName.trim()) return null
    
    let bestMatch: { id: string; name: string; similarity: number } | null = null
    let bestScore = 0
    
    products.forEach(product => {
      const similarity = calculateSimilarity(productName, product.name)
      if (similarity > bestScore && similarity >= 60) { // Minimum 60% similarity
        bestScore = similarity
        bestMatch = {
          id: product.id,
          name: product.name,
          similarity: Math.round(similarity)
        }
      }
    })
    
    return bestMatch
  }

  const handleDownloadTemplate = async () => {
    setDownloading(true)
    try {
      const XLSX = await loadXLSX()
      const wb = XLSX.utils.book_new()
      
      // Template data - theo định dạng báo giá thực tế
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
          'Ghi chú': '',
          'Tên khách hàng': '(Chị) Nhi',
          'Địa chỉ khách hàng': 'Quận 3',
          'Số điện thoại': '',
          'Tên dự án': 'Dự án vách kính văn phòng',
          'Tạo sản phẩm mới': 'Có'
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
          'Ghi chú': '',
          'Tên khách hàng': '(Chị) Nhi',
          'Địa chỉ khách hàng': 'Quận 3',
          'Số điện thoại': '',
          'Tên dự án': 'Dự án vách kính văn phòng',
          'Tạo sản phẩm mới': 'Có'
        },
        {
          'STT': '',
          'Ký hiệu': '',
          'Hạng mục thi công': 'Chi phí vận chuyển lắp đặt',
          'ĐVT': 'xe',
          'Ngang (m)': '',
          'Cao (m)': '',
          'Số lượng': 1,
          'Diện tích (m²)': '',
          'Đơn giá (VNĐ/ĐVT)': 1000000,
          'Thành tiền (VNĐ)': 1000000,
          'Ghi chú': '',
          'Tên khách hàng': '(Chị) Nhi',
          'Địa chỉ khách hàng': 'Quận 3',
          'Số điện thoại': '',
          'Tên dự án': 'Dự án vách kính văn phòng',
          'Tạo sản phẩm mới': 'Có'
        }
      ]
      
      const ws = XLSX.utils.json_to_sheet(templateData)
      XLSX.utils.book_append_sheet(wb, ws, 'Báo giá')
      
      // Add lookup sheet for products
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, name, price, unit')
        .eq('is_active', true)
        .limit(100)
      
      if (existingProducts && existingProducts.length > 0) {
        const productLookup = existingProducts.map(p => ({
          'ID': p.id,
          'Tên sản phẩm': p.name,
          'Giá': p.price || 0,
          'Đơn vị': p.unit || 'cái'
        }))
        const wsProducts = XLSX.utils.json_to_sheet(productLookup)
        XLSX.utils.book_append_sheet(wb, wsProducts, 'Sản phẩm có sẵn')
      }
      
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

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)')
      return
    }

    setLoading(true)
    try {
      const XLSX = await loadXLSX()
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      
      // Try to read from first sheet
      const sheetName = wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
      
      if (!rows || rows.length === 0) {
        alert('File trống hoặc không hợp lệ')
        return
      }

      // Process rows and find product matches
      const preview: PreviewRow[] = rows.map((row, index) => {
        // Lấy tên sản phẩm từ cột "Hạng mục thi công" (dòng đầu tiên của mô tả)
        const constructionItem = String(row['Hạng mục thi công'] || row['Hang muc thi cong'] || '').trim()
        const productName = constructionItem.split('\n')[0] || constructionItem // Lấy dòng đầu tiên
        const createNew = String(row['Tạo sản phẩm mới'] || row['Tao san pham moi'] || 'Không').toLowerCase() === 'có'
        
        const match = createNew ? null : findBestMatch(productName)
        
        return {
          rowIndex: index + 2, // Excel row number (1-indexed, +1 for header)
          customerName: String(row['Tên khách hàng'] || row['Ten khach hang'] || '').trim(),
          customerAddress: String(row['Địa chỉ khách hàng'] || row['Dia chi khach hang'] || '').trim(),
          projectName: String(row['Tên dự án'] || row['Ten du an'] || '').trim(),
          productName,
          productMatch: match,
          createNew: createNew || !match,
          quantity: parseFloat(String(row['Số lượng'] || row['So luong'] || 1)) || 1,
          unitPrice: parseFloat(String(row['Đơn giá (VNĐ/ĐVT)'] || row['Don gia'] || row['Đơn giá'] || 0)) || 0,
          unit: String(row['ĐVT'] || row['Đơn vị'] || row['Don vi'] || 'cái').trim(),
          description: constructionItem, // Toàn bộ mô tả hạng mục thi công
          area: parseFloat(String(row['Diện tích (m²)'] || row['Dien tich'] || '')) || undefined,
          volume: parseFloat(String(row['Thể tích (m³)'] || row['The tich'] || '')) || undefined,
          height: parseFloat(String(row['Cao (m)'] || row['Cao'] || '')) ? parseFloat(String(row['Cao (m)'] || row['Cao'] || '')) * 1000 : undefined, // Convert m to mm
          length: parseFloat(String(row['Ngang (m)'] || row['Ngang'] || row['Dài (m)'] || row['Dai'] || '')) ? parseFloat(String(row['Ngang (m)'] || row['Ngang'] || row['Dài (m)'] || row['Dai'] || '')) * 1000 : undefined, // Convert m to mm
          depth: parseFloat(String(row['Sâu (mm)'] || row['Sau'] || '')) || undefined
        }
      })

      setPreviewData(preview)
      setShowPreview(true)
      setImportResult(null)
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Lỗi khi đọc file Excel')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (previewData.length === 0) return

    setLoading(true)
    setImportResult(null)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Chưa đăng nhập')
      }

      const formData = new FormData()
      const file = fileInputRef.current?.files?.[0]
      if (!file) {
        throw new Error('Không tìm thấy file')
      }

      // Update Excel file with user's createNew selections
      const XLSX = await loadXLSX()
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheetName = wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 })
      
      // Update createNew column based on previewData
      if (rows.length > 1) { // Skip header row
        const headerRow = rows[0]
        let createNewColIndex = headerRow.findIndex((col: string) => 
          col === 'Tạo sản phẩm mới' || col === 'Tao san pham moi'
        )
        
        if (createNewColIndex === -1) {
          // Add column if it doesn't exist
          headerRow.push('Tạo sản phẩm mới')
          createNewColIndex = headerRow.length - 1
        }
        
        previewData.forEach((previewRow, index) => {
          const dataRowIndex = previewRow.rowIndex - 1 // Convert to 0-based
          if (dataRowIndex < rows.length) {
            while (rows[dataRowIndex].length <= createNewColIndex) {
              rows[dataRowIndex].push('')
            }
            rows[dataRowIndex][createNewColIndex] = previewRow.createNew ? 'Có' : 'Không'
          }
        })
        
        // Convert back to worksheet
        const newWs = XLSX.utils.aoa_to_sheet(rows)
        wb.Sheets[sheetName] = newWs
        
        // Convert to buffer
        const updatedBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
        const updatedFile = new File([updatedBuffer], file.name, { type: file.type })
        formData.append('file', updatedFile)
      } else {
        formData.append('file', file)
      }

      const response = await fetch('/api/sales/quotes/import-excel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Lỗi khi import')
      }

      const result = await response.json()
      setImportResult({
        success: result.success,
        message: result.message,
        createdCustomers: result.createdCustomers || 0,
        createdProjects: result.createdProjects || 0,
        createdQuotes: result.createdQuotes || 0,
        createdProducts: result.createdProducts || 0,
        errors: result.errors || []
      })
      setShowPreview(false)
      
      if (result.success && onImportSuccess) {
        setTimeout(() => {
          onImportSuccess()
        }, 2000)
      }
    } catch (error: any) {
      console.error('Error importing:', error)
      setImportResult({
        success: false,
        message: error.message || 'Lỗi khi import',
        createdCustomers: 0,
        createdProjects: 0,
        createdQuotes: 0,
        createdProducts: 0,
        errors: [error.message || 'Lỗi không xác định']
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleCreateNew = (index: number) => {
    const newData = [...previewData]
    newData[index].createNew = !newData[index].createNew
    if (newData[index].createNew) {
      newData[index].productMatch = null
    } else {
      newData[index].productMatch = findBestMatch(newData[index].productName)
    }
    setPreviewData(newData)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Import Báo giá từ Excel</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Tải file mẫu</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <FileSpreadsheet className="h-12 w-12 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Chọn file Excel để import
              </span>
              <span className="text-xs text-gray-500">
                Hỗ trợ .xlsx, .xls
              </span>
            </label>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang xử lý...</span>
            </div>
          )}
        </div>
      </div>

      {showPreview && previewData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900">
              Xem trước dữ liệu ({previewData.length} dòng)
            </h4>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Dòng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Dự án</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hạng mục thi công</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ĐVT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Khớp sản phẩm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tạo mới</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">SL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Đơn giá</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Diện tích</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{row.rowIndex}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.customerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.projectName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={row.description}>
                        {row.productName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.unit}</td>
                    <td className="px-4 py-3 text-sm">
                      {row.productMatch ? (
                        <span className="text-green-600" title={row.productMatch.name}>
                          {row.productMatch.name.substring(0, 30)}... ({row.productMatch.similarity}%)
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={row.createNew}
                        onChange={() => toggleCreateNew(index)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {row.unitPrice.toLocaleString('vi-VN')} VNĐ
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {row.area ? `${row.area} m²` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang import...' : 'Xác nhận Import'}
            </button>
          </div>
        </div>
      )}

      {importResult && (
        <div className={`bg-white border rounded-lg p-6 shadow-sm ${
          importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-start space-x-3">
            {importResult.success ? (
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-bold mb-2 ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {importResult.message}
              </h4>
              {importResult.success && (
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Đã tạo {importResult.createdCustomers} khách hàng</p>
                  <p>• Đã tạo {importResult.createdProjects} dự án</p>
                  <p>• Đã tạo {importResult.createdQuotes} báo giá</p>
                  <p>• Đã tạo {importResult.createdProducts} sản phẩm mới</p>
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div className="mt-3 text-sm text-red-700">
                  <p className="font-semibold">Lỗi:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

