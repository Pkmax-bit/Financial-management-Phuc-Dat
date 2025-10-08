'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, ArrowRight, Clock } from 'lucide-react'

interface ProjectSuccessToastProps {
  isVisible: boolean
  projectName: string
  projectCode: string
  onComplete: () => void
}

export default function ProjectSuccessToast({ 
  isVisible, 
  projectName, 
  projectCode, 
  onComplete 
}: ProjectSuccessToastProps) {
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    if (!isVisible) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-2xl border border-green-200 max-w-md">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 animate-bounce" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                🎉 Dự án đã được tạo thành công!
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>{projectName}</strong> (Mã: <strong>{projectCode}</strong>)
              </p>
              <div className="mt-3 flex items-center text-sm text-blue-600">
                <ArrowRight className="w-4 h-4 mr-2" />
                <span>Đang chuyển sang trang báo giá...</span>
              </div>
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                <span>Tự động chuyển trong {countdown} giây</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 px-6 py-3 border-t border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-green-600 font-medium">
              Bước tiếp theo: Tạo báo giá cho dự án
            </span>
            <div className="w-16 bg-green-200 rounded-full h-1">
              <div 
                className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${((4 - countdown) / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
