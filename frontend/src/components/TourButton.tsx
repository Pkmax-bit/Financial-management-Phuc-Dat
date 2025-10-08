/**
 * Tour Button Component - Nút hướng dẫn cho các trang
 */

'use client'

import { useState } from 'react'
import { HelpCircle, Play, CheckCircle } from 'lucide-react'
import WebsiteTour, { useTour } from './WebsiteTour'
import { tourConfigs } from '@/data/tourSteps'

interface TourButtonProps {
  page: keyof typeof tourConfigs
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
  showText?: boolean
}

export default function TourButton({ 
  page, 
  className = '', 
  size = 'md',
  variant = 'primary',
  showText = true 
}: TourButtonProps) {
  const config = tourConfigs[page]
  const { isOpen, hasCompleted, startTour, closeTour, completeTour } = useTour(config.id, config.steps)

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const variantClasses = {
    primary: hasCompleted 
      ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300' 
      : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
    secondary: hasCompleted
      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
      : 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600',
    outline: hasCompleted
      ? 'bg-transparent text-green-700 border-green-300 hover:bg-green-50'
      : 'bg-transparent text-blue-600 border-blue-600 hover:bg-blue-50'
  }

  return (
    <>
      <button
        onClick={startTour}
        className={`
          inline-flex items-center space-x-2 rounded-lg border font-medium transition-all duration-200
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        title={hasCompleted ? 'Xem lại hướng dẫn' : 'Bắt đầu hướng dẫn'}
      >
        {hasCompleted ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <HelpCircle className="h-4 w-4" />
        )}
        
        {showText && (
          <span>
            {hasCompleted ? 'Xem lại hướng dẫn' : 'Hướng dẫn'}
          </span>
        )}
      </button>

      <WebsiteTour
        isOpen={isOpen}
        onClose={closeTour}
        tourId={config.id}
        steps={config.steps}
        onComplete={completeTour}
      />
    </>
  )
}

// Floating Tour Button for easy access
export function FloatingTourButton({ page }: { page: keyof typeof tourConfigs }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110"
          title="Hướng dẫn"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
        
        {isVisible && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[200px]">
            <div className="text-sm font-medium text-gray-900 mb-2">
              Hướng dẫn sử dụng
            </div>
            <div className="space-y-2">
              <TourButton 
                page={page} 
                size="sm" 
                variant="outline" 
                className="w-full justify-center"
              />
              <button
                onClick={() => setIsVisible(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Tour Progress Indicator
export function TourProgress({ page }: { page: keyof typeof tourConfigs }) {
  const config = tourConfigs[page]
  const { hasCompleted } = useTour(config.id, config.steps)

  // Always show for testing
  // if (hasCompleted) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-full">
          <Play className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900">
            🧪 Chế độ Test - Hướng dẫn không giới hạn
          </h4>
          <p className="text-sm text-blue-700">
            Khám phá các tính năng với hướng dẫn tương tác (có thể test nhiều lần)
          </p>
        </div>
        <TourButton page={page} size="sm" variant="primary" />
      </div>
    </div>
  )
}
