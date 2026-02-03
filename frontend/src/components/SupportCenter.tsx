'use client'

import React, { useState } from 'react'
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
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
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
  VolumeX
} from 'lucide-react'
import Link from 'next/link'

interface SupportCenterProps {
  isOpen: boolean
  onClose: () => void
}

const modules = [
  {
    id: 'workflow',
    name: 'Quy trình Quản lý Tài chính',
    icon: Target,
    color: 'blue',
    description: 'Hướng dẫn 8 bước từ tạo khách hàng đến báo cáo',
    guides: [
      { title: 'Bước 1: Tạo Khách hàng', url: '/support#workflow-step-1' },
      { title: 'Bước 2: Tạo Dự án', url: '/support#workflow-step-2' },
      { title: 'Bước 3: Tạo Báo giá', url: '/support#workflow-step-3' },
      { title: 'Bước 4: Ngân sách Dự án', url: '/support#workflow-step-4' },
      { title: 'Bước 5: Duyệt Báo giá', url: '/support#workflow-step-5' },
      { title: 'Bước 6: Đơn hàng & Chi phí', url: '/support#workflow-step-6' },
      { title: 'Bước 7: Báo cáo Tài chính', url: '/support#workflow-step-7' },
      { title: 'Bước 8: Khách hàng Xem Tiến độ', url: '/support#workflow-step-8' }
    ],
    quickActions: [
      { title: 'Xem quy trình hoàn chỉnh', action: 'view-complete-workflow' },
      { title: 'Bảng tóm tắt nhanh', action: 'view-quick-reference' },
      { title: 'Hướng dẫn từng bước', action: 'view-step-by-step' }
    ]
  }
]

const quickGuides = [
  {
    id: 'complete-workflow',
    title: 'Quy trình Quản lý Tài chính Hoàn chỉnh',
    description: 'Hướng dẫn từ tạo khách hàng đến báo cáo',
    steps: [
      'Bước 1: Tạo khách hàng mới',
      'Bước 2: Tạo dự án và liên kết khách hàng',
      'Bước 3: Tạo báo giá chi tiết',
      'Bước 4: Thiết lập ngân sách dự án',
      'Bước 5: Duyệt báo giá (khách hàng)',
      'Bước 6: Tạo hóa đơn và ghi nhận chi phí',
      'Bước 7: Tạo báo cáo tài chính',
      'Bước 8: Khách hàng xem tiến độ dự án'
    ],
    estimatedTime: '45 phút',
    isComplete: true
  },
  {
    id: 'getting-started',
    title: 'Bắt đầu sử dụng hệ thống',
    description: 'Hướng dẫn cơ bản để bắt đầu',
    steps: [
      'Thiết lập tài khoản và phân quyền',
      'Cấu hình thông tin công ty',
      'Thiết lập ngân sách cơ bản',
      'Tạo dữ liệu mẫu để làm quen'
    ],
    estimatedTime: '15 phút'
  },
  {
    id: 'first-sale',
    title: 'Thực hiện giao dịch bán hàng đầu tiên',
    description: 'Từ tạo hóa đơn đến thu tiền',
    steps: [
      'Tạo khách hàng mới',
      'Tạo hóa đơn bán hàng',
      'Ghi nhận thanh toán',
      'Xem báo cáo doanh thu'
    ],
    estimatedTime: '10 phút'
  },
  {
    id: 'first-expense',
    title: 'Ghi nhận chi phí đầu tiên',
    description: 'Từ tạo chi phí đến phê duyệt',
    steps: [
      'Tạo chi phí mới',
      'Đính kèm chứng từ',
      'Gửi phê duyệt',
      'Theo dõi trạng thái'
    ],
    estimatedTime: '8 phút'
  }
]

const faqs = [
  {
    id: 1,
    question: "Quy trình quản lý tài chính hoàn chỉnh gồm những bước nào?",
    answer: "Quy trình gồm 8 bước: 1) Tạo khách hàng, 2) Tạo dự án, 3) Tạo báo giá, 4) Ngân sách dự án, 5) Duyệt báo giá, 6) Đơn hàng & Chi phí, 7) Báo cáo tài chính, 8) Khách hàng xem tiến độ. Xem tab 'Quy trình hoàn chỉnh' để biết chi tiết.",
    category: "Quy trình",
    module: "workflow"
  },
  {
    id: 2,
    question: "Làm thế nào để bắt đầu quy trình quản lý tài chính?",
    answer: "Bắt đầu từ Bước 1: Tạo khách hàng mới. Vào mục Khách hàng > Tạo khách hàng mới. Điền thông tin cơ bản, phân loại khách hàng, thiết lập credit limit và payment terms. Hệ thống sẽ tự động tạo mã khách hàng (CUS001, CUS002...).",
    category: "Quy trình",
    module: "workflow"
  },
  {
    id: 3,
    question: "Sau khi tạo khách hàng, bước tiếp theo là gì?",
    answer: "Bước 2: Tạo dự án. Vào mục Dự án > Tạo dự án mới. Chọn khách hàng từ danh sách, thiết lập budget, phân công project manager, chọn ngày bắt đầu/kết thúc. Hệ thống sẽ tự động tạo mã dự án (PRJ001, PRJ002...).",
    category: "Quy trình",
    module: "workflow"
  },
  {
    id: 4,
    question: "Cách tạo báo giá trong quy trình?",
    answer: "Bước 3: Tạo báo giá. Vào mục Bán hàng & Báo giá > Tạo báo giá. Chọn khách hàng và dự án, thêm sản phẩm/dịch vụ với số lượng và đơn giá, hệ thống sẽ tự động tính thuế và tổng tiền. Sau đó gửi email cho khách hàng.",
    category: "Quy trình",
    module: "workflow"
  },
  {
    id: 5,
    question: "Thiết lập ngân sách dự án như thế nào?",
    answer: "Bước 4: Ngân sách dự án. Vào mục Chi phí & Ngân sách > Thiết lập ngân sách. Chọn dự án, phân bổ chi phí theo danh mục (vật liệu 40%, nhân công 35%, máy móc 15%, chi phí khác 10%), thiết lập mục tiêu lợi nhuận và ngưỡng cảnh báo.",
    category: "Quy trình",
    module: "workflow"
  },
  {
    id: 6,
    question: "Khách hàng duyệt báo giá trong quy trình như thế nào?",
    answer: "Bước 5: Duyệt báo giá. Khách hàng nhận email với link báo giá, xem chi tiết và quyết định chấp nhận/từ chối/yêu cầu sửa. Khi duyệt, hệ thống tự động tạo hóa đơn và cập nhật trạng thái dự án sang giai đoạn thực hiện.",
    category: "Quy trình",
    module: "workflow"
  },
  {
    id: 7,
    question: "Ghi nhận chi phí thực tế trong quy trình?",
    answer: "Bước 6: Đơn hàng & Chi phí. Vào mục Chi phí & Ngân sách > Chi phí thực tế. Ghi nhận chi phí theo loại (vật liệu/nhân công/máy móc), số tiền, ngày phát sinh, đính kèm chứng từ. Manager/Admin sẽ phê duyệt chi phí trước khi cập nhật vào dự án.",
    category: "Quy trình",
    module: "workflow"
  },
  {
    id: 8,
    question: "Tạo báo cáo tài chính trong quy trình?",
    answer: "Bước 7: Báo cáo tài chính. Vào mục Báo cáo & Phân tích. Có các loại báo cáo: Báo cáo dự án chi tiết (so sánh kế hoạch vs thực tế), P&L Report, Balance Sheet, Cash Flow Report. Chọn khoảng thời gian và dự án để xem báo cáo.",
    category: "Quy trình",
    module: "workflow"
  },
  {
    id: 9,
    question: "Khách hàng xem tiến độ dự án trong quy trình?",
    answer: "Bước 8: Khách hàng xem tiến độ. Khách hàng truy cập timeline dự án qua link được chia sẻ. Xem tiến độ theo giai đoạn với hình ảnh minh họa, phần trăm hoàn thành, có thể bình luận và yêu cầu thay đổi. Hệ thống gửi thông báo khi có cập nhật.",
    category: "Quy trình",
    module: "workflow"
  },
  {
    id: 10,
    question: "Lợi ích của quy trình quản lý tài chính hoàn chỉnh?",
    answer: "Quy trình giúp: Quản lý dự án hiệu quả, kiểm soát chi phí chặt chẽ, tăng tính minh bạch, ra quyết định dựa trên dữ liệu, nâng cao trải nghiệm khách hàng, tăng năng suất nhân viên. Tất cả được tích hợp trong một hệ thống thống nhất.",
    category: "Quy trình",
    module: "workflow"
  }
]

const videoTutorials = [
  {
    id: 1,
    title: 'Quy trình Quản lý Tài chính Hoàn chỉnh',
    duration: '12:30',
    thumbnail: '/videos/complete-workflow-thumb.jpg',
    description: 'Hướng dẫn 8 bước từ tạo khách hàng đến báo cáo'
  },
  {
    id: 2,
    title: 'Bước 1-2: Tạo Khách hàng & Dự án',
    duration: '6:15',
    thumbnail: '/videos/customer-project-thumb.jpg',
    description: 'Hướng dẫn tạo khách hàng và dự án mới'
  },
  {
    id: 3,
    title: 'Bước 3-5: Báo giá & Duyệt',
    duration: '8:45',
    thumbnail: '/videos/quote-approval-thumb.jpg',
    description: 'Tạo báo giá, ngân sách và quy trình duyệt'
  },
  {
    id: 4,
    title: 'Bước 6: Đơn hàng & Chi phí Thực tế',
    duration: '7:20',
    thumbnail: '/videos/invoice-expenses-thumb.jpg',
    description: 'Tạo hóa đơn và ghi nhận chi phí thực tế'
  },
  {
    id: 5,
    title: 'Bước 7-8: Báo cáo & Khách hàng Xem',
    duration: '5:40',
    thumbnail: '/videos/reports-customer-thumb.jpg',
    description: 'Báo cáo tài chính và khách hàng xem tiến độ'
  }
]

export default function SupportCenter({ isOpen, onClose }: SupportCenterProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<number | null>(null)

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  const handleQuickAction = (action: string) => {
    // Handle quick actions
    console.log('Quick action:', action)
  }

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      orange: 'bg-orange-100 text-orange-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-black'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              Trung tâm Hỗ trợ
            </h2>
            <p className="text-black mt-1">
              Hướng dẫn toàn diện cho tất cả các chức năng hệ thống
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-black"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r">
            <div className="p-4">
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
                  onClick={() => setActiveTab('modules')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'modules' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Theo Module
                </button>
                <button
                  onClick={() => setActiveTab('workflow')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'workflow' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Quy trình hoàn chỉnh
                </button>
                <button
                  onClick={() => setActiveTab('quick-guides')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'quick-guides' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Hướng dẫn nhanh
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'videos' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Video hướng dẫn
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
                  onClick={() => setActiveTab('contact')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeTab === 'contact' 
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
          <div className="flex-1 p-6">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Chào mừng đến với Trung tâm Hỗ trợ</h3>
                  <p className="text-black mb-6">
                    Tại đây bạn có thể tìm thấy tất cả các hướng dẫn, video và tài liệu để sử dụng hệ thống hiệu quả.
                  </p>
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
                      onClick={() => setActiveTab('modules')}
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
                      onClick={() => setActiveTab('videos')}
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
                      onClick={() => setActiveTab('quick-guides')}
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
                      onClick={() => setActiveTab('contact')}
                      className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1"
                    >
                      Liên hệ ngay <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modules Tab */}
            {activeTab === 'modules' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Hướng dẫn theo Module</h3>
                  <p className="text-black mb-6">
                    Chọn module bạn muốn tìm hiểu để xem hướng dẫn chi tiết
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {modules.map((module) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${getColorClasses(module.color)}`}>
                          <module.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{module.name}</h4>
                          <p className="text-black text-sm mb-4">{module.description}</p>
                          
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-700">Hướng dẫn:</h5>
                            {module.guides.map((guide, index) => (
                              <Link
                                key={index}
                                href={guide.url}
                                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                • {guide.title}
                              </Link>
                            ))}
                          </div>

                          <div className="mt-4 pt-4 border-t">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Thao tác nhanh:</h5>
                            <div className="flex flex-wrap gap-2">
                              {module.quickActions.map((action, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleQuickAction(action.action)}
                                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                                >
                                  {action.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow Tab */}
            {activeTab === 'workflow' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Quy trình Quản lý Tài chính Hoàn chỉnh</h3>
                  <p className="text-black mb-6">
                    Hướng dẫn chi tiết từ tạo khách hàng đến báo cáo tài chính
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Tổng quan Quy trình</h4>
                      <p className="text-sm text-gray-600">8 bước từ tạo khách hàng đến báo cáo</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-2">1</div>
                      <p className="text-xs text-gray-600">Tạo khách hàng</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-2">2</div>
                      <p className="text-xs text-gray-600">Tạo dự án</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-2">3</div>
                      <p className="text-xs text-gray-600">Tạo báo giá</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-2">4</div>
                      <p className="text-xs text-gray-600">Ngân sách</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-2">5</div>
                      <p className="text-xs text-gray-600">Duyệt báo giá</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-2">6</div>
                      <p className="text-xs text-gray-600">Đơn hàng & Chi phí</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-2">7</div>
                      <p className="text-xs text-gray-600">Báo cáo</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-2">8</div>
                      <p className="text-xs text-gray-600">Khách hàng xem</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Bước 1 */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">1</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Tạo Khách hàng</h4>
                        <p className="text-gray-600 text-sm mb-3">Thiết lập thông tin khách hàng làm nền tảng cho toàn bộ quy trình</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p><strong>Đường dẫn:</strong> /customers</p>
                          <p><strong>Quyền:</strong> Admin, Manager, Sales</p>
                          <p><strong>Kết quả:</strong> Khách hàng được tạo với mã tự động (CUS001, CUS002...)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bước 2 */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">2</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Tạo Dự án</h4>
                        <p className="text-gray-600 text-sm mb-3">Tạo dự án và liên kết với khách hàng để quản lý toàn bộ quy trình</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p><strong>Đường dẫn:</strong> /projects</p>
                          <p><strong>Quyền:</strong> Admin, Manager, Sales</p>
                          <p><strong>Kết quả:</strong> Dự án được tạo với mã tự động, liên kết với khách hàng</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bước 3 */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">3</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Tạo Báo giá</h4>
                        <p className="text-gray-600 text-sm mb-3">Tạo báo giá chi tiết cho khách hàng với các sản phẩm/dịch vụ và giá cả cụ thể</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p><strong>Đường dẫn:</strong> /sales/quotes</p>
                          <p><strong>Quyền:</strong> Admin, Manager, Sales</p>
                          <p><strong>Kết quả:</strong> Báo giá được tạo và gửi email cho khách hàng</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bước 4 */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">4</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Chi phí Kế hoạch (Budget)</h4>
                        <p className="text-gray-600 text-sm mb-3">Lập ngân sách chi tiết cho dự án dựa trên báo giá đã tạo</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p><strong>Đường dẫn:</strong> /budgeting</p>
                          <p><strong>Quyền:</strong> Admin, Manager, Accountant</p>
                          <p><strong>Kết quả:</strong> Ngân sách được phân bổ theo danh mục chi phí</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bước 5 */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">5</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Duyệt Báo giá</h4>
                        <p className="text-gray-600 text-sm mb-3">Khách hàng xem xét và duyệt báo giá, sau đó chuyển đổi thành hóa đơn</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p><strong>Đường dẫn:</strong> /customers/quotes (cho khách hàng)</p>
                          <p><strong>Quyền:</strong> Customer</p>
                          <p><strong>Kết quả:</strong> Báo giá được duyệt, hóa đơn tự động được tạo</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bước 6 */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">6</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Đơn hàng & Chi phí Thực tế</h4>
                        <p className="text-gray-600 text-sm mb-3">Tạo hóa đơn từ báo giá đã duyệt và theo dõi chi phí thực tế</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p><strong>Đường dẫn:</strong> /sales/invoices, /projects/[id]/expenses</p>
                          <p><strong>Quyền:</strong> Admin, Manager, Accountant, Workshop, Worker, Transport</p>
                          <p><strong>Kết quả:</strong> Đơn hàng được tạo, chi phí thực tế được ghi nhận</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bước 7 */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">7</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Báo cáo & Phân tích</h4>
                        <p className="text-gray-600 text-sm mb-3">Tạo các báo cáo tài chính chi tiết để đánh giá hiệu quả dự án</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p><strong>Đường dẫn:</strong> /reports</p>
                          <p><strong>Quyền:</strong> Admin, Manager, Accountant</p>
                          <p><strong>Kết quả:</strong> Báo cáo chi tiết, phân tích tài chính, so sánh hiệu quả</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bước 8 */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">8</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">Khách hàng Xem Tiến độ</h4>
                        <p className="text-gray-600 text-sm mb-3">Cho phép khách hàng theo dõi tiến độ dự án thông qua timeline</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p><strong>Đường dẫn:</strong> /projects/[id]/timeline</p>
                          <p><strong>Quyền:</strong> Customer, Admin, Manager</p>
                          <p><strong>Kết quả:</strong> Khách hàng theo dõi được tiến độ, tăng tính minh bạch</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-green-800">
                        <strong>Lợi ích:</strong> Quy trình này giúp quản lý dự án hiệu quả, kiểm soát chi phí chặt chẽ, tăng tính minh bạch và ra quyết định dựa trên dữ liệu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Guides Tab */}
            {activeTab === 'quick-guides' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Hướng dẫn Nhanh</h3>
                  <p className="text-black mb-6">
                    Các bước cơ bản để bắt đầu sử dụng hệ thống
                  </p>
                </div>

                <div className="space-y-6">
                  {quickGuides.map((guide) => (
                    <div key={guide.id} className={`border rounded-lg p-6 ${
                      guide.isComplete 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{guide.title}</h4>
                            {guide.isComplete && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                Quy trình hoàn chỉnh
                              </span>
                            )}
                          </div>
                          <p className="text-black text-sm mb-4">{guide.description}</p>
                          
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-700">Các bước thực hiện:</h5>
                            <ol className="space-y-1">
                              {guide.steps.map((step, index) => (
                                <li key={index} className="flex items-start space-x-2 text-sm text-black">
                                  <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5 ${
                                    guide.isComplete 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm text-black mb-2">Thời gian ước tính:</div>
                          <div className={`text-sm font-medium ${
                            guide.isComplete ? 'text-green-600' : 'text-blue-600'
                          }`}>{guide.estimatedTime}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Video Hướng dẫn</h3>
                  <p className="text-black mb-6">
                    Xem video minh họa để hiểu rõ cách sử dụng hệ thống
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {videoTutorials.map((video) => (
                    <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="relative bg-gray-200 h-48 flex items-center justify-center">
                        <button
                          onClick={() => {
                            setCurrentVideo(currentVideo === video.id ? null : video.id)
                            setIsPlaying(currentVideo === video.id ? !isPlaying : true)
                          }}
                          className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all"
                        >
                          {currentVideo === video.id && isPlaying ? (
                            <Pause className="h-8 w-8 text-gray-700" />
                          ) : (
                            <Play className="h-8 w-8 text-gray-700" />
                          )}
                        </button>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{video.title}</h4>
                        <p className="text-black text-sm">{video.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Câu hỏi Thường gặp</h3>
                  
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
                </div>
                
                {/* FAQ List */}
                <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xs bg-gray-100 text-black px-2 py-1 rounded">
                            {faq.category}
                          </span>
                          <span className="font-medium text-gray-900">{faq.question}</span>
                        </div>
                        {expandedFaq === faq.id ? (
                          <ChevronDown className="h-4 w-4 text-black" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-black" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-4 pb-3 border-t bg-gray-50">
                          <p className="text-black text-sm pt-3">{faq.answer}</p>
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
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Liên hệ Hỗ trợ</h3>
                  <p className="text-black mb-6">
                    Cần hỗ trợ về quy trình quản lý tài chính? Chúng tôi luôn sẵn sàng giúp đỡ.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      Email Hỗ trợ
                    </h4>
                    <p className="text-black text-sm mb-4">
                      Gửi email để nhận hỗ trợ chi tiết về quy trình
                    </p>
                    <a 
                      href="mailto:support@company.com"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm inline-block"
                    >
                      Gửi Email
                    </a>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-green-600" />
                      Điện thoại
                    </h4>
                    <p className="text-black text-sm mb-4">
                      Gọi điện để được hỗ trợ trực tiếp
                    </p>
                    <a 
                      href="tel:+84123456789"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm inline-block"
                    >
                      Gọi ngay
                    </a>
                  </div>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Lưu ý:</strong> Để nhận hỗ trợ tốt nhất, vui lòng mô tả rõ bước nào trong quy trình bạn đang gặp khó khăn.
                      </p>
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
