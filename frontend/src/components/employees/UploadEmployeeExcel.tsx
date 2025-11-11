'use client'

import { useState, useRef } from 'react'
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader } from 'lucide-react'

interface UploadEmployeeExcelProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentUser?: { full_name?: string; role?: string; email?: string } | null
}

interface UploadResult {
  message: string
  success_count: number
  error_count: number
  total_rows: number
  imported_by?: string
  imported_by_id?: string
  errors: string[]
}

export default function UploadEmployeeExcel({ isOpen, onClose, onSuccess, currentUser }: UploadEmployeeExcelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Vui lòng chọn file Excel (.xlsx hoặc .xls)')
        return
      }
      
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true)
      setError(null)

      // Build API URL (no authentication needed for download template)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const endpoint = `${apiUrl}/api/employee-excel/download-template`
      
      const response = await fetch(endpoint, {
        method: 'GET',
        // No headers needed - endpoint is public
      })

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Không thể tải file mẫu'
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch (e) {
          // Could not parse error response
        }
        
        // Check for server errors
        if (response.status >= 500) {
          throw new Error('Lỗi máy chủ. Vui lòng kiểm tra xem backend có đang chạy không.')
        }
        
        // Check for network/connection errors
        if (response.status === 0 || !response.status) {
          throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.')
        }
        
        throw new Error(`${errorMessage} (Status: ${response.status})`)
      }

      // Get the blob from response
      const blob = await response.blob()
      
      if (blob.size === 0) {
        throw new Error('File mẫu rỗng. Vui lòng kiểm tra backend.')
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mau_nhap_nhan_vien.xlsx'
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        setError('Không thể kết nối đến backend.')
      } else {
        setError(err.message || 'Có lỗi xảy ra khi tải file mẫu.')
      }
    } finally {
      setDownloading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Vui lòng chọn file')
      return
    }

    try {
      setUploading(true)
      setError(null)
      setResult(null)

      // Get token from localStorage
      let token = localStorage.getItem('token')
      
      // If no token but user is logged in, try to get fresh session
      if (!token && currentUser) {
        try {
          const { supabase } = await import('@/lib/supabase')
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.access_token) {
            token = session.access_token
            localStorage.setItem('token', token)
          } else {
            throw new Error('Không thể lấy session. Vui lòng đăng nhập lại.')
          }
        } catch (sessionError) {
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        }
      }
      
      // Final check
      if (!token) {
        throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập với tài khoản Admin hoặc Manager.')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employee-excel/upload-excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      // Handle authentication errors
      if (response.status === 401) {
        throw new Error('Token không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.')
      }

      // Handle permission errors
      if (response.status === 403) {
        throw new Error('Bạn không có quyền upload file Excel. Cần quyền Admin hoặc Manager.')
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Có lỗi xảy ra khi upload file')
      }

      setResult(data)
      
      // If successful, refresh employee list after a short delay
      if (data.success_count > 0) {
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }

    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setError(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border-4 border-blue-500 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upload danh sách nhân viên</h2>
            <p className="text-sm font-semibold text-gray-700">Import nhân viên từ file Excel</p>
          </div>
          <button
            onClick={handleClose}
            className="text-black hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            disabled={uploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Download Template Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <FileSpreadsheet className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Bước 1: Tải file mẫu</h3>
                <p className="text-xs text-gray-700 mb-3">
                  Tải file Excel mẫu và điền thông tin nhân viên theo hướng dẫn
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                    Không cần đăng nhập
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadTemplate}
                    disabled={downloading}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                  >
                    {downloading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Tải file mẫu
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                </p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Upload className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Bước 2: Upload file đã điền</h3>
                <p className="text-xs text-gray-700 mb-3">
                  Chọn file Excel đã điền thông tin nhân viên để upload
                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                    Cần đăng nhập
                  </span>
                </p>
                
                {/* Auth Status */}
                {currentUser ? (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-xs text-green-800 flex-1">
                        <p className="font-semibold">✅ Đã đăng nhập</p>
                        <p className="mt-1">👤 {currentUser.full_name || currentUser.email} • {currentUser.role?.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-xs text-yellow-800">
                        <p className="font-semibold mb-1">⚠️ Yêu cầu xác thực</p>
                        <p>Bạn cần đăng nhập với tài khoản <strong>Admin</strong> hoặc <strong>Manager</strong> để upload file.</p>
                        <p className="mt-1 text-red-600 font-semibold">
                          ❌ Chưa đăng nhập - Vui lòng đăng nhập trước!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* File Input */}
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="excel-file-input"
                  />
                  <label
                    htmlFor="excel-file-input"
                    className="inline-flex items-center px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Chọn file Excel
                  </label>
                  
                  {file && (
                    <div className="mt-2 flex items-center text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-medium">{file.name}</span>
                      <button
                        onClick={() => {
                          setFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading || !currentUser}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                  title={!currentUser ? 'Vui lòng đăng nhập trước' : !file ? 'Vui lòng chọn file' : ''}
                >
                  {uploading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload và import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900 mb-1">Có lỗi xảy ra</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success/Result Message */}
          {result && (
            <div className={`border-2 rounded-lg p-4 ${
              result.error_count === 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start">
                {result.error_count === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-sm font-bold mb-2 ${
                    result.error_count === 0 ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    Kết quả import
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-900">
                      <span className="font-semibold">Tổng số dòng:</span> {result.total_rows}
                    </p>
                    <p className="text-green-700">
                      <span className="font-semibold">Thành công:</span> {result.success_count}
                    </p>
                    {result.error_count > 0 && (
                      <p className="text-red-700">
                        <span className="font-semibold">Lỗi:</span> {result.error_count}
                      </p>
                    )}
                    {result.imported_by && (
                      <p className="text-blue-700 text-xs mt-2 pt-2 border-t border-blue-200">
                        <span className="font-semibold">👤 Import bởi:</span> {result.imported_by}
                      </p>
                    )}
                  </div>

                  {/* Display errors if any */}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Chi tiết lỗi:</p>
                      <div className="bg-white border border-gray-200 rounded p-3 max-h-48 overflow-y-auto">
                        <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
                          {result.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {result.success_count > 0 && (
                    <p className="mt-3 text-xs text-green-700 font-medium">
                      ✅ Danh sách nhân viên sẽ được cập nhật tự động sau 2 giây
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">💡 Lưu ý:</p>
                <p>• File Excel phải có sheet "Mẫu nhân viên" • Email phải duy nhất • Ngày định dạng YYYY-MM-DD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t-2 border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            disabled={uploading}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

