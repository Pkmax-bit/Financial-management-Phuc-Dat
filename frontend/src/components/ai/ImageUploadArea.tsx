'use client'

import { useState, useRef } from 'react'
import { Upload, Camera, Loader2, X } from 'lucide-react'

interface ImageUploadAreaProps {
  onImageUpload: (file: File) => void
  preview?: string | null
  uploading?: boolean
  analyzing?: boolean
}

export default function ImageUploadArea({ 
  onImageUpload, 
  preview, 
  uploading = false, 
  analyzing = false 
}: ImageUploadAreaProps) {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLVideoElement>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera
      })
      setCameraStream(stream)
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Không thể truy cập camera')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const capturePhoto = () => {
    if (cameraRef.current) {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      canvas.width = cameraRef.current.videoWidth
      canvas.height = cameraRef.current.videoHeight
      
      context?.drawImage(cameraRef.current, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'captured-receipt.jpg', { type: 'image/jpeg' })
          onImageUpload(file)
          stopCamera()
        }
      }, 'image/jpeg', 0.8)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageUpload(file)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Hình Ảnh</h2>
      
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {preview ? (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={preview} 
                alt="Receipt preview" 
                className="max-w-full h-64 object-contain mx-auto rounded-lg" 
              />
              {analyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 text-white">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI đang phân tích hình ảnh...</span>
                  </div>
                </div>
              )}
            </div>
            {!analyzing && (
              <button
                onClick={() => onImageUpload(new File([], ''))} // Reset
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mx-auto"
              >
                <X className="h-4 w-4" />
                Xóa ảnh
              </button>
            )}
          </div>
        ) : cameraStream ? (
          <div className="space-y-4">
            <video
              ref={cameraRef}
              autoPlay
              playsInline
              className="max-w-full h-64 mx-auto rounded-lg"
            />
            <div className="flex justify-center gap-3">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Chụp ảnh
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                Tải lên từ thiết bị
              </button>
              
              <button
                onClick={startCamera}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                Chụp ảnh
              </button>
            </div>
            
            <p className="text-sm text-gray-500">
              Hỗ trợ: JPG, PNG, PDF. AI sẽ tự động đọc và trích xuất thông tin
            </p>
            
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang upload...</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
