'use client'

import React, { useState } from 'react'
import { HelpCircle, X, BookOpen, Video, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface SupportBannerProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message?: string
  showCloseButton?: boolean
  onClose?: () => void
}

export default function SupportBanner({ 
  variant = 'info',
  title = 'Cần hỗ trợ?',
  message = 'Truy cập Trung tâm Hỗ trợ để xem hướng dẫn chi tiết và video minh họa.',
  showCloseButton = true,
  onClose
}: SupportBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${getVariantClasses()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <HelpCircle className={`h-5 w-5 ${getIconColor()}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="mt-1 text-sm">{message}</p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/support"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              <BookOpen className="h-4 w-4" />
              Hướng dẫn
            </Link>
            <Link
              href="/support?tab=videos"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              <Video className="h-4 w-4" />
              Video
            </Link>
            <Link
              href="/support?tab=contact"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              <MessageCircle className="h-4 w-4" />
              Liên hệ
            </Link>
          </div>
        </div>
        
        {showCloseButton && (
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
