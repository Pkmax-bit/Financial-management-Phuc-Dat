'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, ArrowRight, X, Clock } from 'lucide-react'

interface ProjectSuccessModalProps {
  isVisible: boolean
  projectName: string
  projectCode: string
  onContinue: () => void
  onCancel: () => void
}

export default function ProjectSuccessModal({ 
  isVisible, 
  projectName, 
  projectCode, 
  onContinue,
  onCancel
}: ProjectSuccessModalProps) {
  const [countdown, setCountdown] = useState(3)
  const [isAutoRedirect, setIsAutoRedirect] = useState(true)

  useEffect(() => {
    if (!isVisible) return

    setCountdown(3)
    setIsAutoRedirect(true)

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (isAutoRedirect) {
            onContinue()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, isAutoRedirect, onContinue])

  const handleContinue = () => {
    setIsAutoRedirect(false)
    onContinue()
  }

  const handleCancel = () => {
    setIsAutoRedirect(false)
    onCancel()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-transparent flex items-start justify-start z-50 animate-fade-in pointer-events-none">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 mt-4 ml-8 animate-bounce-in pointer-events-auto" style={{ marginLeft: '30%', marginTop: '30%' }}>
        {/* Header */}
        <div className="bg-green-50 border-b border-green-200 rounded-t-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-green-800">
              Tạo dự án thành công!
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-600 mb-1">Tên dự án:</p>
              <p className="font-semibold text-gray-900">{projectName}</p>
              <p className="text-sm text-gray-600 mb-1 mt-2">Mã dự án:</p>
              <p className="font-semibold text-blue-600">{projectCode}</p>
            </div>
          </div>

                 {/* Countdown */}
                 {isAutoRedirect && (
                   <div className="bg-blue-50 rounded-lg p-3 mb-4">
                     <div className="flex items-center justify-center mb-2">
                       <Clock className="w-4 h-4 text-blue-500 mr-2" />
                       <span className="text-sm font-medium text-blue-700">
                         Chuẩn bị sang trang báo giá trong {countdown}s
                       </span>
                     </div>
                     <div className="w-full bg-blue-200 rounded-full h-1.5">
                       <div
                         className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000"
                         style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                       />
                     </div>
                   </div>
                 )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <X className="w-3 h-3 inline mr-1" />
              Ở lại
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <ArrowRight className="w-3 h-3 inline mr-1" />
              Chuyển
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
