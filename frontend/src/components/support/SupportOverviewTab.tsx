'use client'

import React from 'react'
import { 
  BookOpen, 
  Video, 
  MessageCircle, 
  Phone, 
  ChevronRight,
  Lightbulb,
  Target,
  Users,
  BarChart3,
  Receipt,
  FileText,
  Building2,
  ShoppingCart,
  User,
  PieChart,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  Star,
  ExternalLink,
  Home
} from 'lucide-react'
import Link from 'next/link'

interface SupportOverviewTabProps {
  searchTerm: string
  onCreateGuide?: () => void
}

export default function SupportOverviewTab({ searchTerm, onCreateGuide }: SupportOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Chào mừng đến với Trung tâm Hỗ trợ</h3>
        <p className="text-black mb-6">
          Tại đây bạn có thể tìm thấy tất cả các hướng dẫn, video và tài liệu để sử dụng hệ thống hiệu quả.
        </p>
      </div>

      {/* Quick Start Guides */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Bắt đầu nhanh
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Bán hàng
            </h5>
            <p className="text-sm text-black mb-3">Quản lý bán hàng, đơn hàng, thanh toán</p>
            <Link href="/sales/guide" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Hướng dẫn Bán hàng →
            </Link>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-orange-500" />
              Chi phí
            </h5>
            <p className="text-sm text-black mb-3">Quản lý chi phí, ngân sách, nhà cung cấp</p>
            <Link href="/expenses/guide" className="text-orange-600 hover:text-orange-800 text-sm font-medium">
              Hướng dẫn Chi phí →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Hướng dẫn Chi tiết
          </h4>
          <p className="text-blue-800 text-sm mb-3">
            Hướng dẫn từng bước cho tất cả các chức năng
          </p>
          <button
            onClick={onCreateGuide}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            Xem hướng dẫn <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Hướng dẫn
          </h4>
          <p className="text-green-800 text-sm mb-3">
            Video minh họa cách sử dụng hệ thống
          </p>
          <button
            onClick={onCreateGuide}
            className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
          >
            Xem video <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg">
          <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Hướng dẫn Nhanh
          </h4>
          <p className="text-orange-800 text-sm mb-3">
            Các bước cơ bản để bắt đầu sử dụng
          </p>
          <button
            onClick={onCreateGuide}
            className="text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1"
          >
            Xem hướng dẫn nhanh <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Hỗ trợ Trực tiếp
          </h4>
          <p className="text-purple-800 text-sm mb-3">
            Liên hệ với đội ngũ hỗ trợ
          </p>
          <button
            onClick={onCreateGuide}
            className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1"
          >
            Liên hệ ngay <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Thống kê Hỗ trợ</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">4</div>
            <div className="text-sm text-black">Modules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">12</div>
            <div className="text-sm text-black">Hướng dẫn</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">4</div>
            <div className="text-sm text-black">Video</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">6</div>
            <div className="text-sm text-black">FAQ</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Hoạt động Gần đây</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Hướng dẫn Bán hàng</p>
              <p className="text-xs text-black">2 giờ trước</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Video className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Video Quản lý Chi phí</p>
              <p className="text-xs text-black">1 ngày trước</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MessageCircle className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">FAQ: Tạo tài khoản mới</p>
              <p className="text-xs text-black">3 ngày trước</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
