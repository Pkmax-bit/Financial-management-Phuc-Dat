'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, MessageCircle, Phone, Mail, FileText, Users, Settings, Shield, Zap } from 'lucide-react'

export default function SupportCenterButton() {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSupportClick = () => {
    setIsExpanded(!isExpanded)
  }

  const handleNavigate = (path: string) => {
    router.push(path)
    setIsExpanded(false)
  }

  const supportSections = [
    {
      title: "Hướng dẫn sử dụng",
      icon: BookOpen,
      items: [
        { name: "Hướng dẫn cơ bản", path: "/support/basics" },
        { name: "Quản lý dự án", path: "/support/projects" },
        { name: "Tạo chi phí", path: "/support/expenses" },
        { name: "Báo cáo tài chính", path: "/support/reports" }
      ]
    },
    {
      title: "Hỗ trợ kỹ thuật",
      icon: Settings,
      items: [
        { name: "Khắc phục sự cố", path: "/support/troubleshooting" },
        { name: "Cài đặt hệ thống", path: "/support/setup" },
        { name: "Bảo mật", path: "/support/security" },
        { name: "Tích hợp API", path: "/support/api" }
      ]
    },
    {
      title: "Liên hệ hỗ trợ",
      icon: MessageCircle,
      items: [
        { name: "Chat trực tuyến", path: "/support/chat" },
        { name: "Gửi email", path: "/support/email" },
        { name: "Gọi điện thoại", path: "/support/phone" },
        { name: "Tạo ticket", path: "/support/ticket" }
      ]
    }
  ]

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
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-0.5 space-y-1">
          {supportSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-gray-50 rounded p-1">
              <div className="flex items-center space-x-1 mb-0.5">
                <section.icon className="h-2 w-2 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">
                  {section.title}
                </span>
              </div>
              <div className="space-y-0.5">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => handleNavigate(item.path)}
                    className="block w-full text-left px-0.5 py-0.5 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {/* Quick Actions */}
          <div className="bg-blue-50 rounded p-1">
            <div className="flex items-center space-x-1 mb-0.5">
              <Zap className="h-2 w-2 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                Thao tác nhanh
              </span>
            </div>
            <div className="grid grid-cols-2 gap-0.5">
              <button
                onClick={() => handleNavigate('/support/quick-start')}
                className="px-0.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Bắt đầu
              </button>
              <button
                onClick={() => handleNavigate('/support/faq')}
                className="px-0.5 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}