'use client'

import React, { useState } from 'react'
import { 
  BookOpen, 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText, 
  Users, 
  Settings, 
  Shield, 
  Zap,
  ChevronRight,
  Search,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('basics')
  const [searchQuery, setSearchQuery] = useState('')

  const supportTabs = [
    { id: 'basics', name: 'Hướng dẫn cơ bản', icon: BookOpen },
    { id: 'projects', name: 'Quản lý dự án', icon: FileText },
    { id: 'expenses', name: 'Tạo chi phí', icon: Zap },
    { id: 'reports', name: 'Báo cáo', icon: Settings },
    { id: 'troubleshooting', name: 'Khắc phục sự cố', icon: AlertCircle },
    { id: 'contact', name: 'Liên hệ', icon: MessageCircle }
  ]

  const quickStart = [
    {
      title: "Đăng nhập hệ thống",
      description: "Sử dụng tài khoản được cung cấp để đăng nhập",
      steps: [
        "Truy cập trang đăng nhập",
        "Nhập email và mật khẩu",
        "Chọn role phù hợp",
        "Bấm 'Đăng nhập'"
      ]
    },
    {
      title: "Tạo dự án mới",
      description: "Bắt đầu với việc tạo dự án đầu tiên",
      steps: [
        "Vào menu 'Dự án'",
        "Bấm 'Tạo dự án mới'",
        "Điền thông tin dự án",
        "Lưu và bắt đầu làm việc"
      ]
    },
    {
      title: "Tạo chi phí",
      description: "Ghi nhận chi phí cho dự án",
      steps: [
        "Vào menu 'Chi phí'",
        "Chọn dự án liên quan",
        "Thêm chi tiết chi phí",
        "Upload hóa đơn (nếu có)"
      ]
    }
  ]

  const faqItems = [
    {
      question: "Làm thế nào để đăng nhập?",
      answer: "Sử dụng email và mật khẩu được cung cấp. Chọn role phù hợp với quyền của bạn.",
      category: "Đăng nhập"
    },
    {
      question: "Tôi không thể tạo dự án mới?",
      answer: "Kiểm tra quyền của bạn. Chỉ ADMIN, SALES, ACCOUNTANT mới có thể tạo dự án.",
      category: "Dự án"
    },
    {
      question: "Làm sao để tạo chi phí?",
      answer: "Vào menu 'Chi phí', chọn dự án, điền thông tin chi phí và lưu.",
      category: "Chi phí"
    },
    {
      question: "Tôi không thấy menu nào?",
      answer: "Menu hiển thị theo role của bạn. Kiểm tra role hiện tại trong sidebar.",
      category: "Giao diện"
    }
  ]

  const contactMethods = [
    {
      name: "Chat trực tuyến",
      icon: MessageCircle,
      description: "Hỗ trợ 24/7",
      action: "Bắt đầu chat",
      color: "bg-blue-500"
    },
    {
      name: "Email hỗ trợ",
      icon: Mail,
      description: "support@company.com",
      action: "Gửi email",
      color: "bg-green-500"
    },
    {
      name: "Điện thoại",
      icon: Phone,
      description: "0123-456-789",
      action: "Gọi ngay",
      color: "bg-purple-500"
    }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hướng dẫn bắt đầu</h3>
              <p className="text-gray-600">Làm quen với hệ thống quản lý tài chính dự án</p>
            </div>

            <div className="grid gap-4">
              {quickStart.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <ul className="mt-3 space-y-1">
                        {item.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-center text-sm text-gray-700">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'projects':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quản lý dự án</h3>
              <p className="text-gray-600">Hướng dẫn tạo và quản lý dự án hiệu quả</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Tạo dự án mới</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Vào menu "Dự án"</li>
                  <li>• Bấm "Tạo dự án mới"</li>
                  <li>• Điền thông tin chi tiết</li>
                  <li>• Chọn ngày bắt đầu/kết thúc</li>
                  <li>• Gán nhân viên tham gia</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Theo dõi tiến độ</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Xem dashboard dự án</li>
                  <li>• Cập nhật trạng thái</li>
                  <li>• Thêm milestone</li>
                  <li>• Ghi nhận chi phí</li>
                  <li>• Tạo báo cáo</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quản lý chi phí</h3>
              <p className="text-gray-600">Hướng dẫn tạo và theo dõi chi phí dự án</p>
            </div>

            <div className="grid gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Các loại chi phí</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h5 className="font-medium text-blue-900">Chi phí sản xuất</h5>
                    <p className="text-sm text-blue-700">Nhân viên xưởng</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h5 className="font-medium text-green-900">Chi phí vận chuyển</h5>
                    <p className="text-sm text-green-700">Nhân viên vận chuyển</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h5 className="font-medium text-purple-900">Chi phí cơ bản</h5>
                    <p className="text-sm text-purple-700">Công nhân, nhân viên</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Báo cáo tài chính</h3>
              <p className="text-gray-600">Tạo và xem báo cáo chi tiết về tài chính dự án</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Báo cáo theo dự án</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Tổng chi phí dự án</li>
                  <li>• Chi phí theo loại</li>
                  <li>• Tiến độ thanh toán</li>
                  <li>• So sánh ngân sách</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Báo cáo tổng hợp</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Báo cáo doanh thu</li>
                  <li>• Báo cáo lãi lỗ</li>
                  <li>• Báo cáo dòng tiền</li>
                  <li>• Báo cáo tổng kết</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'troubleshooting':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Khắc phục sự cố</h3>
              <p className="text-gray-600">Giải quyết các vấn đề thường gặp</p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.question}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.answer}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Liên hệ hỗ trợ</h3>
              <p className="text-gray-600">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className={`w-12 h-12 ${method.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <method.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{method.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                  <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    {method.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trung tâm Hỗ trợ</h1>
              <p className="text-gray-600 mt-1">Hướng dẫn chi tiết và hỗ trợ kỹ thuật</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Danh mục hỗ trợ</h3>
              <nav className="space-y-1">
                {supportTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                    {activeTab === tab.id && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}