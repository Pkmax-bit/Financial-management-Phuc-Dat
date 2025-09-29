'use client'

import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import SupportCenter from './SupportCenter'

export default function SupportCenterButton() {
  const [isSupportOpen, setIsSupportOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsSupportOpen(true)}
        className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <HelpCircle className="h-5 w-5" />
        <span>Trung tâm Hỗ trợ</span>
      </button>
      
      <SupportCenter 
        isOpen={isSupportOpen} 
        onClose={() => setIsSupportOpen(false)} 
      />
    </>
  )
}
