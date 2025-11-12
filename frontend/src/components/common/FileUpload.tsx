/**
 * FileUpload Component
 * Reusable component for uploading files/images
 */

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react'

interface FileUploadProps {
  /** API endpoint for upload (e.g., '/api/uploads/expenses/123') */
  endpoint: string
  /** Callback when upload succeeds */
  onSuccess: (result: UploadResult) => void
  /** Callback when upload fails */
  onError?: (error: string) => void
  /** Accepted file types (e.g., 'image/*', 'application/pdf') */
  accept?: string
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number
  /** Upload label text */
  label?: string
  /** Show preview for images */
  showPreview?: boolean
  /** Allow multiple files */
  multiple?: boolean
  /** Current file URL to display */
  currentFileUrl?: string | null
  /** Show delete button */
  showDelete?: boolean
  /** Callback when file is deleted */
  onDelete?: () => void
  /** Disable upload */
  disabled?: boolean
}

interface UploadResult {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploaded_at: string
  path: string
  content_type: string
}

export default function FileUpload({
  endpoint,
  onSuccess,
  onError,
  accept = 'image/*,application/pdf',
  maxSize = 10 * 1024 * 1024, // 10MB
  label = 'Upload File',
  showPreview = true,
  multiple = false,
  currentFileUrl,
  showDelete = false,
  onDelete,
  disabled = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentFileUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file size
    if (file.size > maxSize) {
      const errorMsg = `File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    // Show preview for images
    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }

    // Upload file
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Upload failed: ${response.statusText}`)
      }

      const result: UploadResult = await response.json()
      onSuccess(result)
      
      // Update preview if image
      if (showPreview && result.type === 'image') {
        setPreview(result.url)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!currentFileUrl || !onDelete) return

    try {
      // Extract file path from URL if needed
      // For now, just call onDelete callback
      onDelete()
      setPreview(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Delete failed'
      setError(errorMsg)
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Preview */}
      {showPreview && preview && (
        <div className="relative inline-block">
          {preview.startsWith('data:') || preview.startsWith('http') ? (
            <img
              src={preview}
              alt="Preview"
              className="max-w-xs max-h-48 rounded-lg border border-gray-300"
            />
          ) : (
            <div className="flex items-center gap-2 p-4 border border-gray-300 rounded-lg">
              <FileText className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">{preview}</span>
            </div>
          )}
          {showDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          ${disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-sm text-gray-600">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {preview ? (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
            <div className="text-sm text-gray-600">
              {preview ? 'Click to change file' : 'Click to upload or drag and drop'}
            </div>
            <div className="text-xs text-gray-500">
              Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
}

