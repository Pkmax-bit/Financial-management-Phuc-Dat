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
    ],
    quickActions: [
      { title: 'Tạo hóa đơn mới', action: 'create-invoice' },
      { title: 'Xem báo cáo doanh thu', action: 'view-reports' },
      { title: 'Quản lý khách hàng', action: 'manage-customers' }
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
    ],
    quickActions: [
      { title: 'Tạo chi phí mới', action: 'create-expense' },
      { title: 'Thiết lập ngân sách', action: 'create-budget' },
      { title: 'Quản lý nhà cung cấp', action: 'manage-vendors' }
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
    ],
    quickActions: [
      { title: 'Thêm nhân viên mới', action: 'create-employee' },
      { title: 'Quản lý phòng ban', action: 'manage-departments' },
      { title: 'Xem báo cáo nhân sự', action: 'view-reports' }
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
    ],
    quickActions: [
      { title: 'Tạo dự án mới', action: 'create-project' },
      { title: 'Thêm nhiệm vụ', action: 'create-task' },
      { title: 'Xem tiến độ dự án', action: 'view-progress' }
    ]
  }
]

const quickGuides = [
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

const videoTutorials = [
  {
    id: 1,
    title: 'Tổng quan hệ thống',
    duration: '5:30',
    thumbnail: '/videos/overview-thumb.jpg',
    description: 'Giới thiệu tổng quan về các chức năng chính'
  },
  {
    id: 2,
    title: 'Hướng dẫn Bán hàng',
    duration: '8:15',
    thumbnail: '/videos/sales-thumb.jpg',
    description: 'Từ tạo hóa đơn đến thu tiền'
  },
  {
    id: 3,
    title: 'Quản lý Chi phí',
    duration: '7:45',
    thumbnail: '/videos/expenses-thumb.jpg',
    description: 'Thiết lập ngân sách và quản lý chi phí'
  },
  {
    id: 4,
    title: 'Báo cáo & Phân tích',
    duration: '6:20',
    thumbnail: '/videos/reports-thumb.jpg',
    description: 'Tạo và xem các báo cáo tài chính'
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
                    <div key={guide.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{guide.title}</h4>
                          <p className="text-black text-sm mb-4">{guide.description}</p>
                          
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-700">Các bước thực hiện:</h5>
                            <ol className="space-y-1">
                              {guide.steps.map((step, index) => (
                                <li key={index} className="flex items-start space-x-2 text-sm text-black">
                                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
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
                          <div className="text-sm font-medium text-blue-600">{guide.estimatedTime}</div>
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
                    Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                      Hỗ trợ Trực tuyến
                    </h4>
                    <p className="text-black text-sm mb-4">
                      Nhận hỗ trợ nhanh chóng qua chat trực tuyến
                    </p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                      Bắt đầu Chat
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-green-600" />
                      Email Hỗ trợ
                    </h4>
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
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-purple-600" />
                      Điện thoại
                    </h4>
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
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      Giờ làm việc
                    </h4>
                    <p className="text-black text-sm mb-2">
                      <strong>Thứ 2 - Thứ 6:</strong> 8:00 - 17:00
                    </p>
                    <p className="text-black text-sm">
                      <strong>Thứ 7:</strong> 8:00 - 12:00
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
