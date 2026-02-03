'use client'

import React, { useState } from 'react'
import { 
  ArrowLeft, 
  Search, 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Phone, 
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  FileText,
  Video,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Star,
  Users,
  BarChart3,
  Receipt,
  FileText as FileTextIcon,
  Building2,
  ShoppingCart,
  User,
  PieChart
} from 'lucide-react'
import Link from 'next/link'

export default function ExpensesHelpPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const faqs = [
    {
      id: 1,
      question: "Làm thế nào để tạo chi phí mới?",
      answer: "Để tạo chi phí mới, bạn vào tab 'Chi phí', nhấn nút 'Tạo chi phí', điền đầy đủ thông tin bao gồm ngày, mô tả, số tiền, danh mục chi phí và người phê duyệt, sau đó nhấn 'Tạo chi phí'."
    },
    {
      id: 2,
      question: "Tôi có thể chỉnh sửa chi phí sau khi đã tạo không?",
      answer: "Có, bạn có thể chỉnh sửa chi phí nếu nó đang ở trạng thái 'Draft' hoặc 'Pending'. Khi chi phí đã được phê duyệt, bạn cần liên hệ với người quản lý để thay đổi."
    },
    {
      id: 3,
      question: "Làm thế nào để phê duyệt chi phí?",
      answer: "Chỉ người có quyền quản lý mới có thể phê duyệt chi phí. Vào tab 'Chi phí', tìm chi phí cần phê duyệt và nhấn nút 'Phê duyệt' hoặc 'Từ chối'."
    },
    {
      id: 4,
      question: "Đơn đặt hàng khác gì với đơn hàng nhà cung cấp?",
      answer: "Đơn đặt hàng (PO) là yêu cầu mua hàng trước khi thực hiện giao dịch, không tạo bút toán kế toán. Đơn hàng nhà cung cấp là chứng từ thanh toán thực tế, tạo bút toán kế toán."
    },
    {
      id: 5,
      question: "Làm thế nào để tạo ngân sách?",
      answer: "Vào tab 'Quản lý ngân sách', nhấn 'Tạo ngân sách', chọn chu kỳ (tháng/quý/năm), thiết lập các dòng ngân sách cho từng danh mục chi phí, sau đó gửi phê duyệt."
    },
    {
      id: 6,
      question: "Tôi có thể xem báo cáo chi phí ở đâu?",
      answer: "Bạn có thể xem báo cáo chi phí trong tab 'Báo cáo' hoặc sử dụng các báo cáo có sẵn trong từng module như báo cáo ngân sách, báo cáo theo nhà cung cấp."
    },
    {
      id: 7,
      question: "Làm thế nào để thêm nhà cung cấp mới?",
      answer: "Vào tab 'Nhà cung cấp', nhấn 'Tạo nhà cung cấp', điền đầy đủ thông tin bao gồm tên, địa chỉ, số điện thoại, email và thông tin tài chính."
    },
    {
      id: 8,
      question: "Đề nghị hoàn ứng hoạt động như thế nào?",
      answer: "Nhân viên tạo đề nghị hoàn ứng với các chi phí đã chi từ tiền cá nhân, đính kèm chứng từ, gửi phê duyệt. Khi được phê duyệt, hệ thống tạo bút toán kế toán. Sau đó thực hiện thanh toán cho nhân viên."
    }
  ]

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/expenses"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Quay lại Chi phí
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-blue-600" />
                  Trung tâm Hỗ trợ - Chi phí
                </h1>
                <p className="text-black mt-1">
                  Tìm kiếm câu trả lời và hỗ trợ cho các vấn đề về quản lý chi phí
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Danh mục hỗ trợ</h3>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'overview' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Tổng quan
                </button>
                <button
                  onClick={() => setActiveTab('getting-started')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'getting-started' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Bắt đầu
                </button>
                <button
                  onClick={() => setActiveTab('guides')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'guides' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Hướng dẫn
                </button>
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'faq' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Câu hỏi thường gặp
                </button>
                <button
                  onClick={() => setActiveTab('support')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'support' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Liên hệ hỗ trợ
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Tổng quan Hệ thống Quản lý Chi phí</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Quản lý Chi phí
                      </h3>
                      <p className="text-sm text-blue-800">
                        Ghi nhận và theo dõi tất cả các khoản chi phí của doanh nghiệp
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Quản lý Ngân sách
                      </h3>
                      <p className="text-sm text-green-800">
                        Thiết lập và theo dõi ngân sách chi tiêu theo danh mục
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                        <FileTextIcon className="h-5 w-5" />
                        Đơn hàng NCC
                      </h3>
                      <p className="text-sm text-orange-800">
                        Quản lý đơn hàng từ nhà cung cấp và theo dõi thanh toán
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Đề nghị Hoàn ứng
                      </h3>
                      <p className="text-sm text-purple-800">
                        Quản lý đề nghị hoàn ứng của nhân viên
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm text-blue-800">
                          <strong>Mẹo:</strong> Bắt đầu bằng cách thiết lập ngân sách, sau đó theo dõi chi phí thực tế để đảm bảo không vượt quá ngân sách đã định.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Getting Started Tab */}
            {activeTab === 'getting-started' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Bắt đầu với Hệ thống</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">1</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Thiết lập Nhà cung cấp</h3>
                        <p className="text-black text-sm mb-2">Thêm thông tin các nhà cung cấp mà doanh nghiệp thường xuyên làm việc</p>
                        <ul className="text-sm text-black space-y-1">
                          <li>• Vào tab &quot;Nhà cung cấp&quot;</li>
                          <li>• Nhấn &quot;Tạo nhà cung cấp&quot;</li>
                          <li>• Điền đầy đủ thông tin liên hệ và tài chính</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">2</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Tạo Ngân sách</h3>
                        <p className="text-black text-sm mb-2">Thiết lập ngân sách cho các danh mục chi phí chính</p>
                        <ul className="text-sm text-black space-y-1">
                          <li>• Vào tab &quot;Quản lý ngân sách&quot;</li>
                          <li>• Nhấn &quot;Tạo ngân sách&quot;</li>
                          <li>• Chọn chu kỳ và thiết lập các dòng ngân sách</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">3</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Ghi nhận Chi phí</h3>
                        <p className="text-black text-sm mb-2">Bắt đầu ghi nhận các khoản chi phí phát sinh</p>
                        <ul className="text-sm text-black space-y-1">
                          <li>• Vào tab &quot;Chi phí&quot;</li>
                          <li>• Nhấn &quot;Tạo chi phí&quot;</li>
                          <li>• Điền thông tin và đính kèm chứng từ</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">4</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Theo dõi & Báo cáo</h3>
                        <p className="text-black text-sm mb-2">Sử dụng các báo cáo để theo dõi hiệu quả</p>
                        <ul className="text-sm text-black space-y-1">
                          <li>• Xem báo cáo ngân sách vs thực tế</li>
                          <li>• Phân tích chi phí theo danh mục</li>
                          <li>• Điều chỉnh ngân sách khi cần thiết</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Guides Tab */}
            {activeTab === 'guides' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Hướng dẫn Chi tiết</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-orange-600" />
                        Quản lý Chi phí
                      </h3>
                      <p className="text-black text-sm mb-3">Hướng dẫn tạo và quản lý chi phí</p>
                      <Link 
                        href="/expenses/guide#expenses"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        Xem hướng dẫn <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        Quản lý Ngân sách
                      </h3>
                      <p className="text-black text-sm mb-3">Hướng dẫn thiết lập và theo dõi ngân sách</p>
                      <Link 
                        href="/expenses/guide#budgeting"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        Xem hướng dẫn <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileTextIcon className="h-5 w-5 text-red-600" />
                        Đơn hàng NCC
                      </h3>
                      <p className="text-black text-sm mb-3">Hướng dẫn quản lý đơn hàng nhà cung cấp</p>
                      <Link 
                        href="/expenses/guide#bills"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        Xem hướng dẫn <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-600" />
                        Đề nghị Hoàn ứng
                      </h3>
                      <p className="text-black text-sm mb-3">Hướng dẫn quản lý đề nghị hoàn ứng</p>
                      <Link 
                        href="/expenses/guide#expense-claims"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        Xem hướng dẫn <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Câu hỏi Thường gặp</h2>
                  
                  {/* Search */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm câu hỏi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* FAQ List */}
                  <div className="space-y-4">
                    {filteredFaqs.map((faq) => (
                      <div key={faq.id} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">{faq.question}</span>
                          {expandedFaq === faq.id ? (
                            <ChevronDown className="h-4 w-4 text-black" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-black" />
                          )}
                        </button>
                        {expandedFaq === faq.id && (
                          <div className="px-4 pb-3">
                            <p className="text-black text-sm">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {filteredFaqs.length === 0 && (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-black mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy câu hỏi</h3>
                      <p className="text-black">Thử tìm kiếm với từ khóa khác hoặc liên hệ hỗ trợ</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Support Tab */}
            {activeTab === 'support' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Liên hệ Hỗ trợ</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-blue-600" />
                        Hỗ trợ Trực tuyến
                      </h3>
                      <p className="text-black text-sm mb-4">
                        Nhận hỗ trợ nhanh chóng qua chat trực tuyến
                      </p>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                        Bắt đầu Chat
                      </button>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-green-600" />
                        Email Hỗ trợ
                      </h3>
                      <p className="text-black text-sm mb-4">
                        Gửi email để nhận hỗ trợ chi tiết
                      </p>
                      <a 
                        href="mailto:support@company.com"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm inline-block"
                      >
                        Gửi Email
                      </a>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Phone className="h-5 w-5 text-purple-600" />
                        Điện thoại
                      </h3>
                      <p className="text-black text-sm mb-4">
                        Gọi điện để được hỗ trợ trực tiếp
                      </p>
                      <a 
                        href="tel:+84123456789"
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm inline-block"
                      >
                        Gọi ngay
                      </a>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        Giờ làm việc
                      </h3>
                      <p className="text-black text-sm mb-2">
                        <strong>Thứ 2 - Thứ 6:</strong> 8:00 - 17:00
                      </p>
                      <p className="text-black text-sm">
                        <strong>Thứ 7:</strong> 8:00 - 12:00
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm text-blue-800">
                          <strong>Lưu ý:</strong> Để nhận hỗ trợ tốt nhất, vui lòng cung cấp thông tin chi tiết về vấn đề bạn đang gặp phải.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
