'use client'

import React, { useState } from 'react'
import { Camera } from 'lucide-react'
import CameraGuidePopup from './ai/CameraGuidePopup'

interface CameraGuideButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function CameraGuideButton({ 
  className = '', 
  size = 'md',
  variant = 'primary' 
}: CameraGuideButtonProps) {
  const [showPopup, setShowPopup] = useState(false)

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50'
  }

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className={`flex items-center gap-2 rounded-lg font-semibold transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        <Camera className="h-4 w-4" />
        Hướng dẫn Camera
      </button>

      <CameraGuidePopup 
        isOpen={showPopup} 
        onClose={() => setShowPopup(false)} 
      />
    </>
  )
}
