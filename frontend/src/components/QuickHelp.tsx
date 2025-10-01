'use client'

import React, { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Video, MessageCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface QuickHelpProps {
  module?: string
  title?: string
  items?: Array<{
    title: string
    description: string
    url: string
    type: 'guide' | 'video' | 'faq'
  }>
}

const defaultItems = [
  {
    title: 'Hướng dẫn cơ bản',
    description: 'Các bước đầu tiên để sử dụng hệ thống',
    url: '/support?tab=quick-guides',
    type: 'guide' as const
  },
  {
    title: 'Video hướng dẫn',
    description: 'Xem video minh họa cách sử dụng',
    url: '/support?tab=videos',
    type: 'video' as const
  },
  {
    title: 'Câu hỏi thường gặp',
    description: 'Tìm câu trả lời cho các vấn đề phổ biến',
    url: '/support?tab=faq',
    type: 'faq' as const
  },
  {
    title: 'Liên hệ hỗ trợ',
    description: 'Nhận hỗ trợ trực tiếp từ đội ngũ',
    url: '/support?tab=contact',
    type: 'guide' as const
  }
]

export default function QuickHelp({ 
  module = 'Hệ thống',
  title = 'Cần hỗ trợ?',
  items = defaultItems
}: QuickHelpProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video
      case 'faq':
        return MessageCircle
      default:
        return BookOpen
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'text-green-600'
      case 'faq':
        return 'text-blue-600'
      default:
        return 'text-purple-600'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <HelpCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-black">Hỗ trợ cho {module}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-black" />
        ) : (
          <ChevronDown className="h-5 w-5 text-black" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {items.map((item, index) => {
              const Icon = getIcon(item.type)
              return (
                <Link
                  key={index}
                  href={item.url}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <Icon className={`h-5 w-5 mt-0.5 ${getIconColor(item.type)}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {item.title}
                    </h4>
                    <p className="text-xs text-black mt-1">{item.description}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-black group-hover:text-blue-600" />
                </Link>
              )
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <BookOpen className="h-4 w-4" />
              Xem tất cả hướng dẫn
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
