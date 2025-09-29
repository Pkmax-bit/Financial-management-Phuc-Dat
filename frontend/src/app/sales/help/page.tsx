'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  Play, 
  HelpCircle, 
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  Download,
  FileText,
  Video,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

export default function SalesHelpPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const helpSections = [
    {
      id: 'overview',
      title: 'Tổng quan',
      icon: BookOpen,
      content: {
        description: 'Giới thiệu tổng quan về hệ thống Sales và cách sử dụng',
        items: [
          {
            title: 'Sales Center là gì?',
            description: 'Trung tâm quản lý toàn bộ quy trình bán hàng từ báo giá đến thanh toán',
            features: [
              'Quản lý báo giá cho khách hàng tiềm năng',
              'Tạo và gửi hóa đơn bán hàng',
              'Ghi nhận thanh toán từ khách hàng',
              'Bán hàng trực tiếp (phiếu thu)',
              'Xử lý trả hàng (credit memo)',
              'Báo cáo và thống kê chi tiết'
            ]
          },
          {
            title: 'Ai nên sử dụng?',
            description: 'Hệ thống phù hợp cho các đối tượng sau:',
            features: [
              'Nhân viên bán hàng',
              'Quản lý bán hàng',
              'Kế toán viên',
              'Giám đốc kinh doanh',
              'Chủ doanh nghiệp nhỏ'
            ]
          },
          {
            title: 'Lợi ích chính',
            description: 'Những lợi ích khi sử dụng hệ thống:',
            features: [
              'Tự động hóa quy trình bán hàng',
              'Tích hợp kế toán tự động',
              'Báo cáo real-time',
              'Quản lý khách hàng hiệu quả',
              'Giảm thiểu lỗi thủ công',
              'Tăng năng suất làm việc'
            ]
          }
        ]
      }
    },
    {
      id: 'getting-started',
      title: 'Bắt đầu',
      icon: Play,
      content: {
        description: 'Hướng dẫn từng bước để bắt đầu sử dụng hệ thống',
        items: [
          {
            title: 'Đăng nhập hệ thống',
            description: 'Cách đăng nhập vào hệ thống Sales',
            steps: [
              'Truy cập trang web của công ty',
              'Nhấn nút "Đăng nhập"',
              'Nhập email và mật khẩu được cấp',
              'Nhấn "Đăng nhập" để vào hệ thống',
              'Chờ hệ thống xác thực và chuyển hướng'
            ]
          },
          {
            title: 'Làm quen với giao diện',
            description: 'Hiểu các thành phần chính của Sales Center',
            steps: [
              'Xem dashboard tổng quan ở tab Overview',
              'Khám phá các tab chức năng chính',
              'Thử tạo một báo giá mẫu',
              'Xem danh sách khách hàng',
              'Kiểm tra các báo cáo có sẵn'
            ]
          },
          {
            title: 'Thiết lập ban đầu',
            description: 'Các thiết lập cần thiết trước khi sử dụng',
            steps: [
              'Cập nhật thông tin cá nhân',
              'Thiết lập quyền truy cập',
              'Cấu hình thông tin công ty',
              'Thêm khách hàng đầu tiên',
              'Tạo sản phẩm/dịch vụ mẫu'
            ]
          }
        ]
      }
    },
    {
      id: 'tutorials',
      title: 'Hướng dẫn',
      icon: FileText,
      content: {
        description: 'Các hướng dẫn chi tiết cho từng chức năng',
        items: [
          {
            title: 'Hướng dẫn văn bản',
            description: 'Hướng dẫn chi tiết bằng văn bản',
            links: [
              { name: 'Tạo báo giá mới', url: '/sales/guide#quotes' },
              { name: 'Gửi hóa đơn', url: '/sales/guide#invoices' },
              { name: 'Ghi nhận thanh toán', url: '/sales/guide#payments' },
              { name: 'Bán hàng trực tiếp', url: '/sales/guide#sales-receipts' },
              { name: 'Xử lý trả hàng', url: '/sales/guide#credit-memos' }
            ]
          },
          {
            title: 'Video hướng dẫn',
            description: 'Xem video hướng dẫn từng bước',
            links: [
              { name: 'Video tổng quan', url: '/sales/help#videos' },
              { name: 'Video tạo báo giá', url: '/sales/help#videos' },
              { name: 'Video gửi hóa đơn', url: '/sales/help#videos' },
              { name: 'Video bán hàng trực tiếp', url: '/sales/help#videos' }
            ]
          },
          {
            title: 'Hướng dẫn nhanh',
            description: 'Các mẹo và thủ thuật sử dụng nhanh',
            tips: [
              'Sử dụng phím tắt Ctrl + S để lưu nhanh',
              'Nhấn F1 để mở hướng dẫn bất kỳ lúc nào',
              'Sử dụng bộ lọc để tìm kiếm nhanh',
              'Xuất báo cáo định kỳ để theo dõi hiệu suất',
              'Sử dụng template để tạo nhanh báo giá/hóa đơn'
            ]
          }
        ]
      }
    },
    {
      id: 'faq',
      title: 'Câu hỏi thường gặp',
      icon: HelpCircle,
      content: {
        description: 'Giải đáp các câu hỏi thường gặp khi sử dụng hệ thống',
        items: [
          {
            title: 'Lỗi đăng nhập',
            description: 'Không thể đăng nhập vào hệ thống',
            solutions: [
              'Kiểm tra email và mật khẩu có đúng không',
              'Đảm bảo kết nối internet ổn định',
              'Thử xóa cache trình duyệt và đăng nhập lại',
              'Liên hệ quản trị viên để reset mật khẩu',
              'Kiểm tra tài khoản có bị khóa không'
            ]
          },
          {
            title: 'Lỗi tạo hóa đơn',
            description: 'Không thể tạo hóa đơn mới',
            solutions: [
              'Kiểm tra thông tin khách hàng có đầy đủ không',
              'Đảm bảo đã nhập đúng số tiền và thuế',
              'Kiểm tra kết nối mạng',
              'Thử tải lại trang và tạo lại',
              'Liên hệ hỗ trợ kỹ thuật nếu vẫn lỗi'
            ]
          },
          {
            title: 'Lỗi ghi nhận thanh toán',
            description: 'Không thể ghi nhận thanh toán',
            solutions: [
              'Kiểm tra số tiền thanh toán có hợp lệ không',
              'Đảm bảo không vượt quá số tiền hóa đơn',
              'Kiểm tra thông tin thanh toán',
              'Thử ghi nhận với số tiền nhỏ hơn',
              'Liên hệ hỗ trợ kỹ thuật'
            ]
          },
          {
            title: 'Không thấy dữ liệu',
            description: 'Không hiển thị dữ liệu trong báo cáo',
            solutions: [
              'Kiểm tra bộ lọc thời gian',
              'Đảm bảo đã có dữ liệu trong hệ thống',
              'Thử làm mới trang',
              'Kiểm tra quyền truy cập',
              'Liên hệ quản trị viên'
            ]
          }
        ]
      }
    },
    {
      id: 'support',
      title: 'Hỗ trợ',
      icon: MessageCircle,
      content: {
        description: 'Các kênh hỗ trợ và liên hệ',
        items: [
          {
            title: 'Liên hệ trực tiếp',
            description: 'Các cách liên hệ để được hỗ trợ',
            contacts: [
              { type: 'Email', value: 'support@company.com', icon: Mail },
              { type: 'Hotline', value: '1900 1234', icon: Phone },
              { type: 'Chat trực tuyến', value: 'Mở chat ở góc phải màn hình', icon: MessageCircle }
            ]
          },
          {
            title: 'Tài liệu hỗ trợ',
            description: 'Các tài liệu và tài nguyên hỗ trợ',
            resources: [
              { name: 'Hướng dẫn sử dụng PDF', url: '/downloads/sales-guide.pdf' },
              { name: 'Video hướng dẫn', url: '/sales/help#videos' },
              { name: 'FAQ chi tiết', url: '/sales/help#faq' },
              { name: 'API Documentation', url: '/api/docs' }
            ]
          },
          {
            title: 'Phản hồi',
            description: 'Gửi phản hồi và đề xuất cải tiến',
            feedback: [
              'Gửi email phản hồi',
              'Điền form phản hồi trực tuyến',
              'Tham gia khảo sát người dùng',
              'Đề xuất tính năng mới'
            ]
          }
        ]
      }
    }
  ]

  const tabs = [
    { id: 'overview', name: 'Tổng quan', icon: BookOpen },
    { id: 'getting-started', name: 'Bắt đầu', icon: Play },
    { id: 'tutorials', name: 'Hướng dẫn', icon: FileText },
    { id: 'faq', name: 'FAQ', icon: HelpCircle },
    { id: 'support', name: 'Hỗ trợ', icon: MessageCircle }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <HelpCircle className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trung tâm hỗ trợ Sales</h1>
                <p className="text-sm text-gray-600">Tìm kiếm trợ giúp và hướng dẫn sử dụng</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Tải tài liệu
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh mục</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              {helpSections.map((section) => {
                const Icon = section.icon
                return (
                  <div key={section.id} className={activeTab === section.id ? 'block' : 'hidden'}>
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center mb-4">
                        <Icon className="h-6 w-6 text-blue-600 mr-3" />
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                          <p className="text-gray-600 mt-1">{section.content.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-8">
                        {section.content.items?.map((item, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                            <p className="text-gray-600 mb-4">{item.description}</p>
                            
                            {item.features && (
                              <ul className="space-y-2">
                                {item.features.map((feature, featureIndex) => (
                                  <li key={featureIndex} className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {item.steps && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Các bước thực hiện:</h4>
                                <ol className="space-y-2">
                                  {item.steps.map((step, stepIndex) => (
                                    <li key={stepIndex} className="flex items-start">
                                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                                        {stepIndex + 1}
                                      </span>
                                      <span className="text-gray-700">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {item.solutions && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Giải pháp:</h4>
                                <ul className="space-y-2">
                                  {item.solutions.map((solution, solutionIndex) => (
                                    <li key={solutionIndex} className="flex items-start">
                                      <ArrowRight className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-700">{solution}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {item.links && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Liên kết hữu ích:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {item.links.map((link, linkIndex) => (
                                    <a
                                      key={linkIndex}
                                      href={link.url}
                                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      {link.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {item.contacts && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Thông tin liên hệ:</h4>
                                <div className="space-y-3">
                                  {item.contacts.map((contact, contactIndex) => {
                                    const ContactIcon = contact.icon
                                    return (
                                      <div key={contactIndex} className="flex items-center">
                                        <ContactIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <span className="text-sm text-gray-700">
                                          <strong>{contact.type}:</strong> {contact.value}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {item.tips && (
                              <div className="mt-4 bg-yellow-50 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-yellow-800 mb-3">Mẹo hữu ích:</h4>
                                <ul className="space-y-1">
                                  {item.tips.map((tip, tipIndex) => (
                                    <li key={tipIndex} className="text-sm text-yellow-700">
                                      • {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {item.resources && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Tài nguyên:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {item.resources.map((resource, resourceIndex) => (
                                    <a
                                      key={resourceIndex}
                                      href={resource.url}
                                      className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      {resource.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {item.feedback && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Gửi phản hồi:</h4>
                                <ul className="space-y-2">
                                  {item.feedback.map((feedback, feedbackIndex) => (
                                    <li key={feedbackIndex} className="flex items-start">
                                      <MessageCircle className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{feedback}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Hướng dẫn chi tiết</h3>
                </div>
                <p className="text-gray-600 mb-4">Xem hướng dẫn từng bước chi tiết cho tất cả chức năng</p>
                <a
                  href="/sales/guide"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                  Xem hướng dẫn
                  <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <Video className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Video hướng dẫn</h3>
                </div>
                <p className="text-gray-600 mb-4">Xem video hướng dẫn trực quan và dễ hiểu</p>
                <a
                  href="/sales/help#videos"
                  className="inline-flex items-center text-green-600 hover:text-green-700"
                >
                  Xem video
                  <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <MessageCircle className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Liên hệ hỗ trợ</h3>
                </div>
                <p className="text-gray-600 mb-4">Cần hỗ trợ thêm? Liên hệ với chúng tôi</p>
                <a
                  href="mailto:support@company.com"
                  className="inline-flex items-center text-purple-600 hover:text-purple-700"
                >
                  Gửi email
                  <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
