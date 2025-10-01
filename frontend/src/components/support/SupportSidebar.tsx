'use client'

import React from 'react'
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  MessageCircle, 
  Phone, 
  Mail, 
  Search, 
  ChevronRight, 
  ChevronDown,
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
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Home
} from 'lucide-react'
import Link from 'next/link'

interface SupportSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  searchTerm: string
  onSearchChange: (term: string) => void
}

const modules = [
  {
    id: 'sales',
    name: 'Bán hàng',
    icon: DollarSign,
    color: 'blue',
    description: 'Quản lý bán hàng, hóa đơn, thanh toán',
    guides: [
      { title: 'Tổng quan Bán hàng', url: '/sales/guide' },
      { title: 'Hướng dẫn Tạo Hóa đơn', url: '/sales/guide#invoices' },
      { title: 'Quản lý Thanh toán', url: '/sales/guide#payments' },
      { title: 'Báo cáo Doanh thu', url: '/sales/guide#reports' }
    ]
  },
  {
    id: 'expenses',
    name: 'Chi phí',
    icon: Receipt,
    color: 'orange',
    description: 'Quản lý chi phí, ngân sách, nhà cung cấp',
    guides: [
      { title: 'Tổng quan Chi phí', url: '/expenses/guide' },
      { title: 'Quản lý Ngân sách', url: '/expenses/guide#budgeting' },
      { title: 'Hóa đơn Nhà cung cấp', url: '/expenses/guide#bills' },
      { title: 'Đề nghị Hoàn ứng', url: '/expenses/guide#expense-claims' }
    ]
  },
  {
    id: 'employees',
    name: 'Nhân sự',
    icon: Users,
    color: 'green',
    description: 'Quản lý nhân viên, phòng ban, chức vụ',
    guides: [
      { title: 'Tổng quan Nhân sự', url: '/employees/guide' },
      { title: 'Quản lý Nhân viên', url: '/employees/guide#employees' },
      { title: 'Phòng ban & Chức vụ', url: '/employees/guide#departments' },
      { title: 'Báo cáo Nhân sự', url: '/employees/guide#reports' }
    ]
  },
  {
    id: 'projects',
    name: 'Dự án',
    icon: Target,
    color: 'purple',
    description: 'Quản lý dự án, nhiệm vụ, tiến độ',
    guides: [
      { title: 'Tổng quan Dự án', url: '/projects/guide' },
      { title: 'Tạo Dự án mới', url: '/projects/guide#create-project' },
      { title: 'Quản lý Nhiệm vụ', url: '/projects/guide#tasks' },
      { title: 'Theo dõi Tiến độ', url: '/projects/guide#progress' }
    ]
  }
]

const quickGuides = [
  {
    id: 'getting-started',
    title: 'Bắt đầu sử dụng hệ thống',
    description: 'Hướng dẫn cơ bản để bắt đầu',
    estimatedTime: '15 phút'
  },
  {
    id: 'first-sale',
    title: 'Thực hiện giao dịch bán hàng đầu tiên',
    description: 'Từ tạo hóa đơn đến thu tiền',
    estimatedTime: '10 phút'
  },
  {
    id: 'first-expense',
    title: 'Ghi nhận chi phí đầu tiên',
    description: 'Từ tạo chi phí đến phê duyệt',
    estimatedTime: '8 phút'
  }
]

const videoTutorials = [
  {
    id: 1,
    title: 'Tổng quan hệ thống',
    duration: '5:30',
    description: 'Giới thiệu tổng quan về các chức năng chính'
  },
  {
    id: 2,
    title: 'Hướng dẫn Bán hàng',
    duration: '8:15',
    description: 'Từ tạo hóa đơn đến thu tiền'
  },
  {
    id: 3,
    title: 'Quản lý Chi phí',
    duration: '7:45',
    description: 'Thiết lập ngân sách và quản lý chi phí'
  },
  {
    id: 4,
    title: 'Báo cáo & Phân tích',
    duration: '6:20',
    description: 'Tạo và xem các báo cáo tài chính'
  }
]

const faqs = [
  {
    id: 1,
    question: "Làm thế nào để tạo tài khoản người dùng mới?",
    answer: "Vào mục Nhân sự > Quản lý Nhân viên > Thêm nhân viên mới. Điền đầy đủ thông tin và hệ thống sẽ tự động tạo tài khoản đăng nhập.",
    category: "Nhân sự",
    module: "employees"
  },
  {
    id: 2,
    question: "Cách thiết lập ngân sách cho doanh nghiệp?",
    answer: "Vào mục Chi phí > Quản lý Ngân sách > Tạo ngân sách. Chọn chu kỳ (tháng/quý/năm) và thiết lập ngân sách cho từng danh mục chi phí.",
    category: "Chi phí",
    module: "expenses"
  },
  {
    id: 3,
    question: "Làm sao để tạo hóa đơn bán hàng?",
    answer: "Vào mục Bán hàng > Hóa đơn > Tạo hóa đơn. Chọn khách hàng, thêm sản phẩm/dịch vụ, điền thông tin và lưu hóa đơn.",
    category: "Bán hàng",
    module: "sales"
  },
  {
    id: 4,
    question: "Cách quản lý thanh toán của khách hàng?",
    answer: "Vào mục Bán hàng > Thanh toán > Ghi nhận thanh toán. Chọn hóa đơn cần thanh toán, nhập số tiền và phương thức thanh toán.",
    category: "Bán hàng",
    module: "sales"
  },
  {
    id: 5,
    question: "Làm thế nào để phê duyệt chi phí?",
    answer: "Vào mục Chi phí > Danh sách chi phí. Tìm chi phí cần phê duyệt và nhấn 'Phê duyệt' hoặc 'Từ chối' với ghi chú.",
    category: "Chi phí",
    module: "expenses"
  },
  {
    id: 6,
    question: "Cách tạo báo cáo tài chính?",
    answer: "Vào mục Báo cáo > Báo cáo Tài chính. Chọn loại báo cáo, khoảng thời gian và nhấn 'Tạo báo cáo' để xem kết quả.",
    category: "Báo cáo",
    module: "reports"
  }
]

export default function SupportSidebar({ activeTab, onTabChange, searchTerm, onSearchChange }: SupportSidebarProps) {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      orange: 'bg-orange-100 text-orange-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-black'
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <HelpCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Trung tâm Hỗ trợ</h2>
            <p className="text-sm text-black">Hướng dẫn toàn diện</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm kiếm hỗ trợ..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4">
        <nav className="space-y-1">
          <button
            onClick={() => onTabChange('overview')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'overview' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-black hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Home className="h-4 w-4 mr-3" />
            Tổng quan
          </button>
          
          <button
            onClick={() => onTabChange('modules')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'modules' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-black hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <BookOpen className="h-4 w-4 mr-3" />
            Theo Module
          </button>
          
          <button
            onClick={() => onTabChange('quick-guides')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'quick-guides' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-black hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Lightbulb className="h-4 w-4 mr-3" />
            Hướng dẫn nhanh
          </button>
          
          <button
            onClick={() => onTabChange('videos')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'videos' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-black hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Video className="h-4 w-4 mr-3" />
            Video hướng dẫn
          </button>
          
          <button
            onClick={() => onTabChange('faq')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'faq' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-black hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="h-4 w-4 mr-3" />
            Câu hỏi thường gặp
          </button>
          
          <button
            onClick={() => onTabChange('contact')}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'contact' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-black hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Phone className="h-4 w-4 mr-3" />
            Liên hệ hỗ trợ
          </button>
        </nav>
      </div>

      {/* Quick Links */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Liên kết nhanh</h3>
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center text-sm text-black hover:text-blue-600"
          >
            <Home className="h-4 w-4 mr-2" />
            Về trang chủ
          </Link>
          <Link
            href="/sales"
            className="flex items-center text-sm text-black hover:text-blue-600"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Bán hàng
          </Link>
          <Link
            href="/expenses"
            className="flex items-center text-sm text-black hover:text-blue-600"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Chi phí
          </Link>
          <Link
            href="/employees"
            className="flex items-center text-sm text-black hover:text-blue-600"
          >
            <Users className="h-4 w-4 mr-2" />
            Nhân sự
          </Link>
        </div>
      </div>
    </div>
  )
}
