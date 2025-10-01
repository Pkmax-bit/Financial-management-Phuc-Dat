'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Info,
  ArrowRight,
  Users,
  FileText,
  CreditCard,
  Receipt,
  RotateCcw,
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-react'

export default function SalesGuidePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const sections = [
    {
      id: 'overview',
      title: 'Tổng quan hệ thống Sales',
      icon: BarChart3,
      content: {
        description: 'Hệ thống Sales giúp bạn quản lý toàn bộ quy trình bán hàng từ báo giá đến thanh toán.',
        features: [
          'Quản lý báo giá cho khách hàng',
          'Tạo và gửi hóa đơn',
          'Ghi nhận thanh toán',
          'Bán hàng trực tiếp (phiếu thu)',
          'Xử lý trả hàng (credit memo)',
          'Báo cáo và thống kê'
        ]
      }
    },
    {
      id: 'getting-started',
      title: 'Bắt đầu sử dụng',
      icon: Play,
      content: {
        description: 'Hướng dẫn từng bước để bắt đầu sử dụng hệ thống Sales.',
        steps: [
          {
            title: 'Đăng nhập hệ thống',
            description: 'Sử dụng tài khoản được cấp để đăng nhập',
            details: [
              'Truy cập trang đăng nhập',
              'Nhập email và mật khẩu',
              'Nhấn nút "Đăng nhập"',
              'Chờ hệ thống xác thực'
            ]
          },
          {
            title: 'Truy cập Sales Center',
            description: 'Vào trang quản lý bán hàng chính',
            details: [
              'Từ menu chính, chọn "Sales"',
              'Bạn sẽ thấy dashboard tổng quan',
              'Các tab chức năng ở phía trên'
            ]
          },
          {
            title: 'Làm quen với giao diện',
            description: 'Hiểu các thành phần chính của giao diện',
            details: [
              'Tab Overview: Tổng quan thống kê',
              'Tab Quotes: Quản lý báo giá',
              'Tab Invoices: Quản lý hóa đơn',
              'Tab Payments: Quản lý thanh toán',
              'Tab Sales Receipts: Phiếu thu bán hàng',
              'Tab Credit Memos: Giấy báo có'
            ]
          }
        ]
      }
    },
    {
      id: 'quotes',
      title: 'Quản lý Báo giá',
      icon: FileText,
      content: {
        description: 'Tạo và quản lý báo giá cho khách hàng tiềm năng.',
        steps: [
          {
            title: 'Tạo báo giá mới',
            description: 'Tạo báo giá cho khách hàng',
            details: [
              'Nhấn nút "Tạo báo giá" (dấu +)',
              'Điền thông tin khách hàng',
              'Thêm sản phẩm/dịch vụ',
              'Nhập số lượng và đơn giá',
              'Kiểm tra tổng tiền',
              'Nhấn "Lưu" để tạo báo giá'
            ]
          },
          {
            title: 'Gửi báo giá',
            description: 'Gửi báo giá cho khách hàng',
            details: [
              'Tìm báo giá cần gửi trong danh sách',
              'Nhấn nút "Gửi" (biểu tượng gửi)',
              'Xác nhận gửi báo giá',
              'Trạng thái sẽ chuyển thành "Sent"'
            ]
          },
          {
            title: 'Chuyển đổi thành hóa đơn',
            description: 'Khi khách hàng chấp nhận báo giá',
            details: [
              'Tìm báo giá đã được chấp nhận',
              'Nhấn nút "Chuyển đổi"',
              'Kiểm tra thông tin hóa đơn',
              'Nhấn "Tạo hóa đơn"'
            ]
          }
        ]
      }
    },
    {
      id: 'invoices',
      title: 'Quản lý Hóa đơn',
      icon: Receipt,
      content: {
        description: 'Tạo, gửi và theo dõi hóa đơn bán hàng.',
        steps: [
          {
            title: 'Tạo hóa đơn mới',
            description: 'Tạo hóa đơn cho khách hàng',
            details: [
              'Nhấn nút "Tạo hóa đơn" (dấu +)',
              'Chọn khách hàng từ danh sách',
              'Thêm sản phẩm/dịch vụ',
              'Nhập thông tin thanh toán',
              'Kiểm tra tổng tiền và thuế',
              'Nhấn "Lưu" để tạo hóa đơn'
            ]
          },
          {
            title: 'Gửi hóa đơn',
            description: 'Gửi hóa đơn cho khách hàng',
            details: [
              'Tìm hóa đơn cần gửi',
              'Nhấn nút "Gửi" (biểu tượng gửi)',
              'Xác nhận gửi hóa đơn',
              'Trạng thái chuyển thành "Sent"',
              'Hệ thống tự động tạo bút toán kế toán'
            ]
          },
          {
            title: 'Ghi nhận thanh toán',
            description: 'Ghi nhận khi khách hàng thanh toán',
            details: [
              'Tìm hóa đơn cần ghi nhận thanh toán',
              'Nhấn nút "Thanh toán" (biểu tượng tiền)',
              'Nhập số tiền thanh toán',
              'Chọn phương thức thanh toán',
              'Nhấn "Xác nhận"',
              'Hệ thống tự động cập nhật trạng thái'
            ]
          }
        ]
      }
    },
    {
      id: 'payments',
      title: 'Quản lý Thanh toán',
      icon: CreditCard,
      content: {
        description: 'Theo dõi và quản lý các khoản thanh toán từ khách hàng.',
        steps: [
          {
            title: 'Xem danh sách thanh toán',
            description: 'Theo dõi tất cả giao dịch thanh toán',
            details: [
              'Chọn tab "Payments"',
              'Xem danh sách tất cả thanh toán',
              'Lọc theo khách hàng, ngày, trạng thái',
              'Tìm kiếm thanh toán cụ thể'
            ]
          },
          {
            title: 'Ghi nhận thanh toán mới',
            description: 'Ghi nhận thanh toán từ khách hàng',
            details: [
              'Từ hóa đơn, nhấn nút "Thanh toán"',
              'Hoặc tạo thanh toán mới từ tab Payments',
              'Nhập thông tin thanh toán',
              'Chọn hóa đơn để áp dụng',
              'Xác nhận ghi nhận thanh toán'
            ]
          },
          {
            title: 'Theo dõi trạng thái thanh toán',
            description: 'Kiểm tra tình trạng thanh toán',
            details: [
              'Pending: Chưa thanh toán',
              'Partial: Thanh toán một phần',
              'Paid: Đã thanh toán đầy đủ',
              'Overdue: Quá hạn thanh toán'
            ]
          }
        ]
      }
    },
    {
      id: 'sales-receipts',
      title: 'Phiếu Thu Bán Hàng',
      icon: Receipt,
      content: {
        description: 'Xử lý bán hàng thu tiền ngay lập tức (bán lẻ, dịch vụ tại chỗ).',
        steps: [
          {
            title: 'Tạo phiếu thu mới',
            description: 'Tạo phiếu thu cho bán hàng trực tiếp',
            details: [
              'Chọn tab "Sales Receipts"',
              'Nhấn nút "Tạo phiếu thu"',
              'Chọn khách hàng (hoặc tạo mới)',
              'Thêm sản phẩm/dịch vụ',
              'Nhập số lượng và đơn giá',
              'Chọn phương thức thanh toán',
              'Nhấn "Lưu" để tạo phiếu thu'
            ]
          },
          {
            title: 'Xử lý thanh toán ngay',
            description: 'Khách hàng thanh toán ngay lập tức',
            details: [
              'Tiền mặt: Ghi nhận thu tiền mặt',
              'Thẻ tín dụng: Ghi nhận qua ngân hàng',
              'Chuyển khoản: Ghi nhận qua tài khoản',
              'Hệ thống tự động ghi doanh thu'
            ]
          },
          {
            title: 'Theo dõi phiếu thu',
            description: 'Quản lý các phiếu thu đã tạo',
            details: [
              'Xem danh sách tất cả phiếu thu',
              'Tìm kiếm theo ngày, khách hàng',
              'In phiếu thu cho khách hàng',
              'Xuất báo cáo doanh thu'
            ]
          }
        ]
      }
    },
    {
      id: 'credit-memos',
      title: 'Giấy Báo Có (Credit Memo)',
      icon: RotateCcw,
      content: {
        description: 'Xử lý trả hàng, hủy dịch vụ, giảm trừ công nợ.',
        steps: [
          {
            title: 'Tạo credit memo',
            description: 'Tạo giấy báo có cho trả hàng',
            details: [
              'Chọn tab "Credit Memos"',
              'Nhấn nút "Tạo Credit Memo"',
              'Chọn khách hàng',
              'Liên kết với hóa đơn gốc (nếu có)',
              'Thêm sản phẩm/dịch vụ trả lại',
              'Nhập lý do trả hàng',
              'Nhấn "Lưu" để tạo credit memo'
            ]
          },
          {
            title: 'Áp dụng vào hóa đơn',
            description: 'Giảm trừ công nợ khách hàng',
            details: [
              'Tìm credit memo cần áp dụng',
              'Nhấn nút "Áp dụng"',
              'Chọn hóa đơn để áp dụng',
              'Nhập số tiền áp dụng',
              'Xác nhận áp dụng',
              'Hệ thống tự động cập nhật công nợ'
            ]
          },
          {
            title: 'Hoàn tiền cho khách',
            description: 'Trả tiền cho khách hàng',
            details: [
              'Tìm credit memo cần hoàn tiền',
              'Nhấn nút "Hoàn tiền"',
              'Chọn phương thức hoàn tiền',
              'Nhập số tiền hoàn trả',
              'Xác nhận hoàn tiền',
              'Hệ thống ghi nhận giao dịch'
            ]
          }
        ]
      }
    },
    {
      id: 'reports',
      title: 'Báo cáo và Thống kê',
      icon: BarChart3,
      content: {
        description: 'Xem báo cáo chi tiết về tình hình bán hàng.',
        steps: [
          {
            title: 'Dashboard tổng quan',
            description: 'Xem thống kê tổng quan',
            details: [
              'Doanh thu tổng cộng',
              'Doanh thu đã thu',
              'Doanh thu chưa thu',
              'Số lượng hóa đơn',
              'Hóa đơn quá hạn',
              'Biểu đồ xu hướng'
            ]
          },
          {
            title: 'Báo cáo doanh thu',
            description: 'Báo cáo chi tiết về doanh thu',
            details: [
              'Doanh thu theo thời gian',
              'Doanh thu theo khách hàng',
              'Doanh thu theo sản phẩm',
              'So sánh các kỳ',
              'Xuất báo cáo Excel/PDF'
            ]
          },
          {
            title: 'Báo cáo công nợ',
            description: 'Theo dõi công nợ khách hàng',
            details: [
              'Danh sách khách hàng nợ tiền',
              'Số tiền nợ theo từng khách',
              'Thời gian nợ',
              'Phân loại theo mức độ rủi ro',
              'Báo cáo tuổi nợ'
            ]
          }
        ]
      }
    },
    {
      id: 'troubleshooting',
      title: 'Xử lý sự cố',
      icon: AlertCircle,
      content: {
        description: 'Giải quyết các vấn đề thường gặp khi sử dụng hệ thống.',
        steps: [
          {
            title: 'Lỗi đăng nhập',
            description: 'Không thể đăng nhập vào hệ thống',
            details: [
              'Kiểm tra email và mật khẩu',
              'Đảm bảo kết nối internet ổn định',
              'Thử xóa cache trình duyệt',
              'Liên hệ quản trị viên nếu vẫn lỗi'
            ]
          },
          {
            title: 'Lỗi tạo hóa đơn',
            description: 'Không thể tạo hóa đơn mới',
            details: [
              'Kiểm tra thông tin khách hàng',
              'Đảm bảo đã nhập đầy đủ thông tin',
              'Kiểm tra kết nối mạng',
              'Thử tải lại trang'
            ]
          },
          {
            title: 'Lỗi ghi nhận thanh toán',
            description: 'Không thể ghi nhận thanh toán',
            details: [
              'Kiểm tra số tiền thanh toán',
              'Đảm bảo không vượt quá số tiền hóa đơn',
              'Kiểm tra thông tin thanh toán',
              'Liên hệ hỗ trợ kỹ thuật'
            ]
          }
        ]
      }
    }
  ]

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId)
    setActiveStep(null)
  }

  const toggleStep = (stepIndex: number) => {
    setActiveStep(activeStep === stepIndex ? null : stepIndex)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hướng dẫn sử dụng Sales</h1>
                <p className="text-sm text-black">Hướng dẫn chi tiết cho người mới bắt đầu</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <HelpCircle className="h-5 w-5 text-black" />
              <span className="text-sm text-black">Cần hỗ trợ? Liên hệ: support@company.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mục lục</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 mr-3" />
                        <span className="font-medium">{section.title}</span>
                      </div>
                      {activeSection === section.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <div key={section.id} className="border-b border-gray-200 last:border-b-0">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <Icon className="h-6 w-6 text-blue-600 mr-4" />
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                          <p className="text-sm text-black mt-1">{section.content.description}</p>
                        </div>
                      </div>
                      {activeSection === section.id ? (
                        <ChevronDown className="h-5 w-5 text-black" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-black" />
                      )}
                    </button>

                    {activeSection === section.id && (
                      <div className="px-6 pb-6">
                        {section.content.steps ? (
                          <div className="space-y-6">
                            {section.content.steps.map((step, stepIndex) => (
                              <div key={stepIndex} className="border border-gray-200 rounded-lg">
                                <button
                                  onClick={() => toggleStep(stepIndex)}
                                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                      <span className="text-sm font-semibold text-blue-600">{stepIndex + 1}</span>
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                                      <p className="text-sm text-black mt-1">{step.description}</p>
                                    </div>
                                  </div>
                                  {activeStep === stepIndex ? (
                                    <ChevronDown className="h-5 w-5 text-black" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-black" />
                                  )}
                                </button>

                                {activeStep === stepIndex && (
                                  <div className="px-4 pb-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Chi tiết thực hiện:</h4>
                                      <ul className="space-y-2">
                                        {step.details.map((detail, detailIndex) => (
                                          <li key={detailIndex} className="flex items-start">
                                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-gray-700">{detail}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Tính năng chính:</h4>
                            <ul className="space-y-2">
                              {section.content.features?.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Quick Tips */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <div className="flex items-start">
                <Info className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Mẹo sử dụng nhanh</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Sử dụng phím tắt Ctrl + S để lưu nhanh</li>
                    <li>• Nhấn F1 để mở hướng dẫn này bất kỳ lúc nào</li>
                    <li>• Sử dụng bộ lọc để tìm kiếm nhanh</li>
                    <li>• Xuất báo cáo định kỳ để theo dõi hiệu suất</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <HelpCircle className="h-12 w-12 text-black mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cần hỗ trợ thêm?</h3>
                <p className="text-black mb-4">
                  Nếu bạn gặp khó khăn hoặc có câu hỏi, đừng ngần ngại liên hệ với chúng tôi.
                </p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="mailto:support@company.com"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Gửi email hỗ trợ
                  </a>
                  <a
                    href="tel:+84123456789"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Gọi hotline
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
