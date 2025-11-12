/**
 * ImageUpload Component
 * Simplified component for uploading images only
 */

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import FileUpload, { UploadResult } from './FileUpload'

interface ImageUploadProps {
  /** API endpoint for upload */
  endpoint: string
  /** Callback when upload succeeds */
  onSuccess: (url: string) => void
  /** Callback when upload fails */
  onError?: (error: string) => void
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number
  /** Upload label text */
  label?: string
  /** Current image URL to display */
  currentImageUrl?: string | null
  /** Show delete button */
  showDelete?: boolean
  /** Callback when image is deleted */
  onDelete?: () => void
  /** Disable upload */
  disabled?: boolean
  /** Image preview size */
  previewSize?: 'sm' | 'md' | 'lg'
}

export default function ImageUpload({
  endpoint,
  onSuccess,
  onError,
  maxSize = 5 * 1024 * 1024, // 5MB
  label = 'Upload Image',
  currentImageUrl,
  showDelete = false,
  onDelete,
  disabled = false,
  previewSize = 'md'
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)

  const handleSuccess = (result: UploadResult) => {
    setPreview(result.url)
    onSuccess(result.url)
  }

  const handleDelete = () => {
    setPreview(null)
    onDelete?.()
  }

  const sizeClasses = {
    sm: 'max-w-xs max-h-32',
    md: 'max-w-md max-h-48',
    lg: 'max-w-lg max-h-64'
  }

  return (
    <div className="space-y-2">
      {/* Preview */}
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className={`${sizeClasses[previewSize]} rounded-lg border border-gray-300 object-cover`}
          />
          {showDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload Component */}
      <FileUpload
        endpoint={endpoint}
        onSuccess={handleSuccess}
        onError={onError}
        accept="image/*"
        maxSize={maxSize}
        label={label}
        showPreview={true}
        currentFileUrl={preview}
        showDelete={false}
        disabled={disabled}
      />
    </div>
  )
}

