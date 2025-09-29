'use client'

import React, { useState } from 'react'
import { HelpCircle, Home } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import SupportSidebar from '@/components/support/SupportSidebar'
import OverviewTab from '@/components/support/OverviewTab'
import ModulesTab from '@/components/support/ModulesTab'
import QuickGuidesTab from '@/components/support/QuickGuidesTab'
import VideosTab from '@/components/support/VideosTab'
import FAQTab from '@/components/support/FAQTab'
import ContactTab from '@/components/support/ContactTab'

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={undefined} onLogout={() => {}} />

      {/* Main content */}
      <div className="pl-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <HelpCircle className="h-8 w-8 text-blue-600" />
                  Trung tâm Hỗ trợ
                </h1>
                <p className="mt-2 text-gray-600">
                  Hướng dẫn toàn diện cho tất cả các chức năng hệ thống
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Home className="h-4 w-4" />
                  Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex">
            {/* Sidebar */}
            <SupportSidebar 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            {/* Main Content */}
            <div className="flex-1 ml-8">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'modules' && <ModulesTab />}
              {activeTab === 'quick-guides' && <QuickGuidesTab />}
              {activeTab === 'videos' && <VideosTab />}
              {activeTab === 'faq' && <FAQTab searchTerm={searchTerm} onSearchChange={setSearchTerm} />}
              {activeTab === 'contact' && <ContactTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
