'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, MessageCircle, Phone, Mail, FileText, Users, Settings, Shield, Zap } from 'lucide-react'

export default function SupportCenterButton() {
  const router = useRouter()

  const handleSupportClick = () => {
    router.push('/support')
  }

  return (
    <div className="w-full">
      <button
        onClick={handleSupportClick}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <HelpCircle className="h-5 w-5" />
          <span>Trung tâm Hỗ trợ</span>
        </div>
      </button>
    </div>
  )
}