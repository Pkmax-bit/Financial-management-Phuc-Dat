'use client'

import { useState } from 'react'
import { 
  X, 
  BookOpen, 
  Play, 
  CheckCircle, 
  ArrowRight,
  FileText,
  Receipt,
  CreditCard,
  RotateCcw,
  BarChart3,
  AlertCircle
} from 'lucide-react'

interface QuickGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function QuickGuideModal({ isOpen, onClose }: QuickGuideModalProps) {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      title: 'Tạo báo giá',
      icon: FileText,
      description: 'Tạo báo giá cho khách hàng tiềm năng',
      actions: [
        'Nhấn nút "Tạo báo giá"',
        'Điền thông tin khách hàng',
        'Thêm sản phẩm/dịch vụ',
        'Nhấn "Lưu" để tạo'
      ]
    },
    {
      title: 'Gửi báo giá',
      icon: Play,
      description: 'Gửi báo giá cho khách hàng',
      actions: [
        'Tìm báo giá cần gửi',
        'Nhấn nút "Gửi"',
        'Xác nhận gửi báo giá',
        'Trạng thái chuyển thành "Sent"'
      ]
    },
    {
      title: 'Tạo đơn hàng',
      icon: Receipt,
      description: 'Chuyển báo giá thành đơn hàng',
      actions: [
        'Từ báo giá đã gửi',
        'Nhấn "Chuyển đổi"',
        'Kiểm tra thông tin',
        'Nhấn "Tạo đơn hàng"'
      ]
    },
    {
      title: 'Gửi đơn hàng',
      icon: Play,
      description: 'Gửi đơn hàng cho khách hàng',
      actions: [
        'Tìm đơn hàng cần gửi',
        'Nhấn nút "Gửi"',
        'Xác nhận gửi đơn hàng',
        'Hệ thống tự động tạo bút toán kế toán'
      ]
    },
    {
      title: 'Ghi nhận thanh toán',
      icon: CreditCard,
      description: 'Ghi nhận khi khách hàng thanh toán',
      actions: [
        'Tìm đơn hàng cần thanh toán',
        'Nhấn nút "Thanh toán"',
        'Nhập số tiền thanh toán',
        'Chọn phương thức thanh toán',
        'Nhấn "Xác nhận"'
      ]
    },
    {
      title: 'Bán hàng trực tiếp',
      icon: Receipt,
      description: 'Tạo phiếu thu cho bán hàng tại chỗ',
      actions: [
        'Chọn tab "Sales Receipts"',
        'Nhấn "Tạo phiếu thu"',
        'Chọn khách hàng',
        'Thêm sản phẩm/dịch vụ',
        'Chọn phương thức thanh toán',
        'Nhấn "Lưu"'
      ]
    },
    {
      title: 'Xử lý trả hàng',
      icon: RotateCcw,
      description: 'Tạo credit memo cho trả hàng',
      actions: [
        'Chọn tab "Credit Memos"',
        'Nhấn "Tạo Credit Memo"',
        'Chọn khách hàng',
        'Thêm sản phẩm trả lại',
        'Nhập lý do trả hàng',
        'Nhấn "Lưu"'
      ]
    },
    {
      title: 'Xem báo cáo',
      icon: BarChart3,
      description: 'Theo dõi tình hình bán hàng',
      actions: [
        'Chọn tab "Overview"',
        'Xem thống kê tổng quan',
        'Theo dõi doanh thu',
        'Kiểm tra đơn hàng quá hạn',
        'Xuất báo cáo chi tiết'
      ]
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Hướng dẫn nhanh Sales</h2>
              <p className="text-sm text-black">Quy trình bán hàng từ A đến Z</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-black"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Bước {activeStep + 1} / {steps.length}
              </span>
              <span className="text-sm text-black">
                {Math.round(((activeStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  {React.createElement(steps[activeStep].icon, { className: "h-6 w-6 text-blue-600" })}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">{steps[activeStep].title}</h3>
                  <p className="text-blue-700">{steps[activeStep].description}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Các bước thực hiện:</h4>
                <ul className="space-y-2">
                  {steps[activeStep].actions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Trước
            </button>

            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === activeStep
                      ? 'bg-blue-600'
                      : index < activeStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
              disabled={activeStep === steps.length - 1}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp theo
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>

          {/* Quick Tips */}
          <div className="mt-6 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">Mẹo hữu ích:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Sử dụng bộ lọc để tìm kiếm nhanh</li>
                  <li>• Nhấn F1 để mở hướng dẫn chi tiết</li>
                  <li>• Xuất báo cáo định kỳ để theo dõi hiệu suất</li>
                  <li>• Liên hệ hỗ trợ nếu gặp khó khăn</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-black">
            Cần hỗ trợ thêm? <a href="/sales/guide" className="text-blue-600 hover:text-blue-700">Xem hướng dẫn chi tiết</a>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                onClose()
                // Navigate to full guide
                window.open('/sales/guide', '_blank')
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Hướng dẫn đầy đủ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
