'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle } from 'lucide-react'

export default function SupportCenterButton() {
  const router = useRouter()

  const handleSupportClick = () => {
    router.push('/support')
  }

  return (
    <button
      onClick={handleSupportClick}
      className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      <HelpCircle className="h-5 w-5" />
      <span>Trung tâm Hỗ trợ</span>
    </button>
  )
}
