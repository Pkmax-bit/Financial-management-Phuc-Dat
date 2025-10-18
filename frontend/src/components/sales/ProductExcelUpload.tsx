'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UploadResult {
  success: boolean
  message: string
  errors?: string[]
  importedCount?: number
  totalCount?: number
}

interface ProductImportData {
  name: string
  price: number
  unit: string
  description?: string
  area?: number
  volume?: number
  height?: number
  length?: number
  depth?: number
  category_name?: string
}

export default function ProductExcelUpload({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isUploadVisible, setIsUploadVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    if (!validTypes.includes(file.type)) {
      setUploadResult({
        success: false,
        message: 'Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV'
      })
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('http://localhost:8000/api/sales/products/import-excel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({
          success: true,
          message: result.message,
          importedCount: result.imported_count,
          totalCount: result.total_count
        })
        onImportComplete?.()
      } else {
        setUploadResult({
          success: false,
          message: result.detail || 'Có lỗi xảy ra khi import sản phẩm',
          errors: result.errors
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadResult({
        success: false,
        message: 'Có lỗi xảy ra khi upload file'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const downloadTemplate = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setUploadResult({
          success: false,
          message: 'Bạn cần đăng nhập để tải template'
        })
        return
      }

      const response = await fetch('http://localhost:8000/api/sales/products/download-template', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'product_import_template.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        setUploadResult({
          success: true,
          message: 'Template đã được tải về thành công!'
        })
      } else {
        const errorText = await response.text()
        console.error('Download failed:', response.status, errorText)
        setUploadResult({
          success: false,
          message: `Lỗi tải template: ${response.status} - ${errorText}`
        })
      }
    } catch (error) {
      console.error('Download error:', error)
      setUploadResult({
        success: false,
        message: `Lỗi tải template: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Nhập sản phẩm từ Excel</h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload file Excel để nhập hàng loạt sản phẩm
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Tải template
          </button>
          <button
            onClick={() => setIsUploadVisible(!isUploadVisible)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isUploadVisible ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Ẩn upload
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Hiện upload
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Area - Conditionally Rendered */}
      {isUploadVisible && (
        <>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Đang xử lý file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Kéo thả file Excel vào đây
            </p>
            <p className="text-sm text-gray-600 mb-4">
              hoặc <span className="text-blue-600 font-medium">click để chọn file</span>
            </p>
            <p className="text-xs text-gray-500">
              Hỗ trợ file .xlsx, .xls, .csv
            </p>
          </div>
        )}
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`mt-6 p-4 rounded-lg ${
          uploadResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <h4 className={`text-sm font-medium ${
                uploadResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {uploadResult.success ? 'Import thành công!' : 'Import thất bại'}
              </h4>
              <p className={`text-sm mt-1 ${
                uploadResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {uploadResult.message}
              </p>
              
              {uploadResult.importedCount !== undefined && (
                <p className="text-sm text-green-700 mt-1">
                  Đã import: {uploadResult.importedCount}/{uploadResult.totalCount} sản phẩm
                </p>
              )}
              
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-800">Chi tiết lỗi:</p>
                  <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setUploadResult(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

          {/* Instructions */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">📋 Hướng dẫn sử dụng:</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-800 mb-2">📥 Các bước thực hiện:</h5>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Tải template Excel mẫu</li>
              <li>Mở file và xem sheet "Hướng dẫn"</li>
              <li>Điền thông tin sản phẩm vào sheet "Products"</li>
              <li>Kiểm tra dữ liệu trước khi lưu</li>
              <li>Upload file lên hệ thống</li>
            </ol>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-800 mb-2">⚠️ Lưu ý quan trọng:</h5>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li><strong>Bắt buộc:</strong> Tên sản phẩm, Giá, Đơn vị</li>
              <li><strong>Tùy chọn:</strong> Mô tả, Kích thước, Hạng mục</li>
              <li>Giá phải là số, không có dấu phẩy</li>
              <li>Hạng mục sẽ tự động tạo nếu chưa có</li>
              <li>File phải có định dạng .xlsx</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="text-sm font-medium text-blue-800 mb-1">💡 Mẹo sử dụng:</h5>
          <p className="text-sm text-blue-700">
            Template đã có sẵn 10 sản phẩm mẫu với đầy đủ thông tin. 
            Bạn có thể xóa các dòng mẫu và thêm sản phẩm của mình, 
            hoặc chỉnh sửa thông tin từ các sản phẩm mẫu.
          </p>
          </div>
        </div>
        </>
      )}
    </div>
  )
}
