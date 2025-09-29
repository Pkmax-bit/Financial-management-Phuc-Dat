'use client'

import React, { useState } from 'react'
import { X, ArrowRight, ArrowLeft, CheckCircle, Receipt, FileText, Building2, ShoppingCart, User, BarChart3, PieChart } from 'lucide-react'

interface QuickGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

const steps = [
  {
    id: 1,
    title: "Thiết lập Nhà cung cấp",
    description: "Thêm thông tin các nhà cung cấp mà doanh nghiệp thường xuyên làm việc",
    icon: Building2,
    color: "purple",
    details: [
      "Vào tab 'Nhà cung cấp'",
      "Nhấn 'Tạo nhà cung cấp'",
      "Điền thông tin liên hệ và tài chính",
      "Lưu thông tin nhà cung cấp"
    ]
  },
  {
    id: 2,
    title: "Tạo Ngân sách",
    description: "Thiết lập ngân sách cho các danh mục chi phí chính",
    icon: BarChart3,
    color: "green",
    details: [
      "Vào tab 'Quản lý ngân sách'",
      "Nhấn 'Tạo ngân sách'",
      "Chọn chu kỳ (tháng/quý/năm)",
      "Thiết lập các dòng ngân sách",
      "Gửi phê duyệt"
    ]
  },
  {
    id: 3,
    title: "Ghi nhận Chi phí",
    description: "Bắt đầu ghi nhận các khoản chi phí phát sinh",
    icon: Receipt,
    color: "orange",
    details: [
      "Vào tab 'Chi phí'",
      "Nhấn 'Tạo chi phí'",
      "Điền thông tin chi phí",
      "Đính kèm chứng từ",
      "Chọn người phê duyệt"
    ]
  },
  {
    id: 4,
    title: "Quản lý Hóa đơn NCC",
    description: "Xử lý hóa đơn từ nhà cung cấp và theo dõi thanh toán",
    icon: FileText,
    color: "red",
    details: [
      "Vào tab 'Hóa đơn NCC'",
      "Nhấn 'Tạo hóa đơn NCC'",
      "Nhập thông tin hóa đơn",
      "Phê duyệt hóa đơn",
      "Thực hiện thanh toán"
    ]
  },
  {
    id: 5,
    title: "Đơn đặt hàng",
    description: "Tạo đơn đặt hàng để kiểm soát chi tiêu trước khi mua",
    icon: ShoppingCart,
    color: "blue",
    details: [
      "Vào tab 'Đơn đặt hàng'",
      "Nhấn 'Tạo đơn đặt hàng'",
      "Chọn nhà cung cấp",
      "Thêm các mặt hàng cần mua",
      "Gửi phê duyệt"
    ]
  },
  {
    id: 6,
    title: "Đề nghị Hoàn ứng",
    description: "Quản lý đề nghị hoàn ứng của nhân viên",
    icon: User,
    color: "purple",
    details: [
      "Vào tab 'Đề nghị hoàn ứng'",
      "Nhấn 'Tạo đề nghị hoàn ứng'",
      "Thêm các chi phí đã chi",
      "Đính kèm hóa đơn/chứng từ",
      "Gửi phê duyệt"
    ]
  },
  {
    id: 7,
    title: "Theo dõi & Báo cáo",
    description: "Sử dụng các báo cáo để theo dõi hiệu quả",
    icon: PieChart,
    color: "indigo",
    details: [
      "Xem báo cáo ngân sách vs thực tế",
      "Phân tích chi phí theo danh mục",
      "Theo dõi xu hướng chi phí",
      "Điều chỉnh ngân sách khi cần"
    ]
  },
  {
    id: 8,
    title: "Hoàn thành",
    description: "Bạn đã hoàn thành hướng dẫn cơ bản!",
    icon: CheckCircle,
    color: "green",
    details: [
      "Hệ thống đã sẵn sàng sử dụng",
      "Bạn có thể bắt đầu quản lý chi phí",
      "Tham khảo hướng dẫn chi tiết khi cần",
      "Liên hệ hỗ trợ nếu có vấn đề"
    ]
  }
]

export default function QuickGuideModal({ isOpen, onClose }: QuickGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setCompletedSteps([...completedSteps, currentStep])
    if (currentStep < steps.length - 1) {
      handleNext()
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    setCompletedSteps([])
    onClose()
  }

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      blue: 'bg-blue-100 text-blue-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Hướng dẫn Nhanh - Quản lý Chi phí
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Bước {currentStep + 1} / {steps.length}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getColorClasses(currentStepData.color)}`}>
              <currentStepData.icon className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          {/* Step Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Các bước thực hiện:</h4>
            <ol className="space-y-2">
              {currentStepData.details.map((detail, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{detail}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          {currentStep < steps.length - 1 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">💡</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>Mẹo:</strong> {getStepTip(currentStep)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Completion Message */}
          {currentStep === steps.length - 1 && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-green-800">
                    <strong>Chúc mừng!</strong> Bạn đã hoàn thành hướng dẫn cơ bản. Hệ thống đã sẵn sàng để bạn bắt đầu quản lý chi phí hiệu quả.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Trước
          </button>

          <div className="flex items-center space-x-2">
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleComplete}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                Hoàn thành
                <CheckCircle className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Đóng
              </button>
            )}

            {currentStep < steps.length - 1 && (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                Tiếp theo
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getStepTip(step: number): string {
  const tips = [
    "Thông tin nhà cung cấp càng chi tiết càng tốt để dễ dàng quản lý sau này.",
    "Thiết lập ngân sách thực tế dựa trên kinh nghiệm và kế hoạch kinh doanh.",
    "Ghi nhận chi phí ngay khi phát sinh để đảm bảo tính chính xác.",
    "Kiểm tra kỹ thông tin hóa đơn trước khi phê duyệt để tránh sai sót.",
    "Sử dụng đơn đặt hàng để kiểm soát chi tiêu trước khi thực hiện mua hàng.",
    "Đính kèm đầy đủ chứng từ để đảm bảo tính minh bạch trong đề nghị hoàn ứng.",
    "Thường xuyên xem báo cáo để phát hiện xu hướng và điều chỉnh kịp thời.",
    "Hệ thống đã sẵn sàng! Bạn có thể bắt đầu sử dụng ngay bây giờ."
  ]
  return tips[step] || ""
}
