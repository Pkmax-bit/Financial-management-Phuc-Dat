'use client'

import { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  X,
  Eye,
  MousePointer,
  Keyboard,
  AlertCircle,
  Info
} from 'lucide-react'

interface InteractiveGuideProps {
  isOpen: boolean
  onClose: () => void
  guideType: 'quotes' | 'invoices' | 'payments' | 'sales-receipts' | 'credit-memos'
}

export default function InteractiveGuide({ isOpen, onClose, guideType }: InteractiveGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showHints, setShowHints] = useState(false)

  const guides = {
    quotes: {
      title: 'Hướng dẫn tạo báo giá',
      description: 'Tạo báo giá cho khách hàng tiềm năng',
      steps: [
        {
          title: 'Mở form tạo báo giá',
          description: 'Nhấn nút "Tạo báo giá" ở góc phải màn hình',
          action: 'Tìm và nhấn nút có biểu tượng dấu + màu xanh',
          hint: 'Nút này thường ở góc phải trên cùng của màn hình',
          target: 'create-quote-button'
        },
        {
          title: 'Điền thông tin khách hàng',
          description: 'Chọn hoặc tạo mới khách hàng',
          action: 'Chọn khách hàng từ danh sách hoặc nhấn "Thêm mới"',
          hint: 'Nếu khách hàng chưa có, nhấn "Thêm khách hàng mới"',
          target: 'customer-select'
        },
        {
          title: 'Thêm sản phẩm/dịch vụ',
          description: 'Thêm các sản phẩm hoặc dịch vụ vào báo giá',
          action: 'Nhấn "Thêm sản phẩm" và điền thông tin',
          hint: 'Có thể thêm nhiều sản phẩm bằng cách nhấn "Thêm dòng"',
          target: 'add-product-button'
        },
        {
          title: 'Kiểm tra tổng tiền',
          description: 'Xem lại tổng tiền và thuế',
          action: 'Kiểm tra các con số ở cuối form',
          hint: 'Tổng tiền = Tổng sản phẩm + Thuế - Giảm giá',
          target: 'total-amount'
        },
        {
          title: 'Lưu báo giá',
          description: 'Lưu báo giá vào hệ thống',
          action: 'Nhấn nút "Lưu" hoặc "Tạo báo giá"',
          hint: 'Báo giá sẽ được tạo với trạng thái "Draft"',
          target: 'save-quote-button'
        }
      ]
    },
    invoices: {
      title: 'Hướng dẫn tạo đơn hàng',
      description: 'Tạo đơn hàng từ báo giá hoặc tạo mới',
      steps: [
        {
          title: 'Chọn cách tạo đơn hàng',
          description: 'Tạo từ báo giá hoặc tạo mới',
          action: 'Chọn "Tạo từ báo giá" hoặc "Tạo mới"',
          hint: 'Nếu có báo giá, nên tạo từ báo giá để tiết kiệm thời gian',
          target: 'create-invoice-option'
        },
        {
          title: 'Điền thông tin đơn hàng',
          description: 'Nhập thông tin chi tiết đơn hàng',
          action: 'Điền số đơn hàng, ngày phát hành, ngày đến hạn',
          hint: 'Số đơn hàng thường tự động tạo, có thể chỉnh sửa',
          target: 'invoice-details'
        },
        {
          title: 'Thêm sản phẩm/dịch vụ',
          description: 'Thêm các sản phẩm vào đơn hàng',
          action: 'Thêm sản phẩm và kiểm tra số lượng, đơn giá',
          hint: 'Có thể copy từ báo giá nếu tạo từ báo giá',
          target: 'invoice-items'
        },
        {
          title: 'Thiết lập thanh toán',
          description: 'Cấu hình điều khoản thanh toán',
          action: 'Chọn phương thức thanh toán và điều khoản',
          hint: 'Điều khoản thanh toán ảnh hưởng đến thời gian thu tiền',
          target: 'payment-terms'
        },
        {
          title: 'Gửi đơn hàng',
          description: 'Gửi đơn hàng cho khách hàng',
          action: 'Nhấn "Gửi đơn hàng" sau khi tạo xong',
          hint: 'Đơn hàng sẽ chuyển từ "Draft" sang "Sent"',
          target: 'send-invoice-button'
        }
      ]
    },
    payments: {
      title: 'Hướng dẫn ghi nhận thanh toán',
      description: 'Ghi nhận thanh toán từ khách hàng',
      steps: [
        {
          title: 'Tìm đơn hàng cần thanh toán',
          description: 'Tìm đơn hàng trong danh sách',
          action: 'Sử dụng bộ lọc hoặc tìm kiếm theo khách hàng',
          hint: 'Đơn hàng có trạng thái "Sent" mới có thể thanh toán',
          target: 'invoice-list'
        },
        {
          title: 'Mở form thanh toán',
          description: 'Nhấn nút thanh toán trên đơn hàng',
          action: 'Tìm nút có biểu tượng tiền hoặc "Thanh toán"',
          hint: 'Nút này chỉ hiện khi đơn hàng chưa thanh toán đầy đủ',
          target: 'payment-button'
        },
        {
          title: 'Nhập thông tin thanh toán',
          description: 'Điền số tiền và phương thức thanh toán',
          action: 'Nhập số tiền, chọn phương thức, thêm ghi chú',
          hint: 'Số tiền không được vượt quá số tiền còn lại của đơn hàng',
          target: 'payment-form'
        },
        {
          title: 'Xác nhận thanh toán',
          description: 'Kiểm tra và xác nhận thông tin',
          action: 'Xem lại thông tin và nhấn "Xác nhận"',
          hint: 'Sau khi xác nhận, đơn hàng sẽ được cập nhật trạng thái',
          target: 'confirm-payment-button'
        }
      ]
    },
    'sales-receipts': {
      title: 'Hướng dẫn tạo phiếu thu bán hàng',
      description: 'Tạo phiếu thu cho bán hàng trực tiếp',
      steps: [
        {
          title: 'Chọn tab Sales Receipts',
          description: 'Chuyển sang tab phiếu thu bán hàng',
          action: 'Nhấn tab "Sales Receipts" ở menu trên',
          hint: 'Tab này dành cho bán hàng thu tiền ngay',
          target: 'sales-receipts-tab'
        },
        {
          title: 'Tạo phiếu thu mới',
          description: 'Nhấn nút tạo phiếu thu',
          action: 'Nhấn nút "Tạo phiếu thu" hoặc dấu +',
          hint: 'Phiếu thu khác với đơn hàng vì thu tiền ngay',
          target: 'create-receipt-button'
        },
        {
          title: 'Chọn khách hàng',
          description: 'Chọn hoặc tạo khách hàng mới',
          action: 'Chọn khách hàng từ danh sách',
          hint: 'Có thể tạo khách hàng mới nếu chưa có',
          target: 'customer-select'
        },
        {
          title: 'Thêm sản phẩm/dịch vụ',
          description: 'Thêm sản phẩm bán ra',
          action: 'Thêm từng sản phẩm với số lượng và đơn giá',
          hint: 'Có thể thêm nhiều sản phẩm trong một phiếu thu',
          target: 'add-products'
        },
        {
          title: 'Chọn phương thức thanh toán',
          description: 'Chọn cách khách hàng thanh toán',
          action: 'Chọn tiền mặt, thẻ, chuyển khoản',
          hint: 'Phương thức thanh toán ảnh hưởng đến tài khoản kế toán',
          target: 'payment-method'
        },
        {
          title: 'Lưu phiếu thu',
          description: 'Lưu phiếu thu vào hệ thống',
          action: 'Nhấn "Lưu" để tạo phiếu thu',
          hint: 'Phiếu thu sẽ tự động ghi doanh thu và tiền mặt',
          target: 'save-receipt-button'
        }
      ]
    },
    'credit-memos': {
      title: 'Hướng dẫn tạo credit memo',
      description: 'Tạo giấy báo có cho trả hàng',
      steps: [
        {
          title: 'Chọn tab Credit Memos',
          description: 'Chuyển sang tab credit memo',
          action: 'Nhấn tab "Credit Memos" ở menu trên',
          hint: 'Tab này dành cho xử lý trả hàng, hủy dịch vụ',
          target: 'credit-memos-tab'
        },
        {
          title: 'Tạo credit memo mới',
          description: 'Nhấn nút tạo credit memo',
          action: 'Nhấn nút "Tạo Credit Memo"',
          hint: 'Credit memo dùng để giảm trừ công nợ hoặc hoàn tiền',
          target: 'create-credit-memo-button'
        },
        {
          title: 'Chọn khách hàng',
          description: 'Chọn khách hàng cần tạo credit memo',
          action: 'Chọn khách hàng từ danh sách',
          hint: 'Chỉ khách hàng có đơn hàng mới có thể tạo credit memo',
          target: 'customer-select'
        },
        {
          title: 'Liên kết với đơn hàng gốc',
          description: 'Chọn đơn hàng gốc (nếu có)',
          action: 'Chọn đơn hàng gốc từ danh sách',
          hint: 'Có thể bỏ trống nếu không liên quan đến đơn hàng cụ thể',
          target: 'original-invoice'
        },
        {
          title: 'Thêm sản phẩm trả lại',
          description: 'Thêm sản phẩm/dịch vụ trả lại',
          action: 'Thêm từng sản phẩm trả lại với số lượng',
          hint: 'Số lượng trả lại không được vượt quá số lượng đã bán',
          target: 'returned-items'
        },
        {
          title: 'Nhập lý do trả hàng',
          description: 'Ghi rõ lý do trả hàng',
          action: 'Nhập lý do trả hàng vào ô ghi chú',
          hint: 'Lý do trả hàng giúp theo dõi và phân tích',
          target: 'return-reason'
        },
        {
          title: 'Lưu credit memo',
          description: 'Lưu credit memo vào hệ thống',
          action: 'Nhấn "Lưu" để tạo credit memo',
          hint: 'Credit memo sẽ được tạo với trạng thái "Open"',
          target: 'save-credit-memo-button'
        }
      ]
    }
  }

  const currentGuide = guides[guideType]
  const totalSteps = currentGuide.steps.length

  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < totalSteps - 1) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, 3000)
      return () => clearInterval(timer)
    }
  }, [isPlaying, totalSteps])

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex])
    }
  }

  const resetGuide = () => {
    setCurrentStep(0)
    setCompletedSteps([])
    setIsPlaying(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{currentGuide.title}</h2>
            <p className="text-sm text-black">{currentGuide.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHints(!showHints)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Info className="h-4 w-4 mr-1" />
              {showHints ? 'Ẩn gợi ý' : 'Hiện gợi ý'}
            </button>
            <button
              onClick={onClose}
              className="text-black hover:text-black"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Bước {currentStep + 1} / {totalSteps}
            </span>
            <span className="text-sm text-black">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Current Step */}
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg font-semibold text-blue-600">{currentStep + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      {currentGuide.steps[currentStep].title}
                    </h3>
                    <p className="text-blue-700">
                      {currentGuide.steps[currentStep].description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleStepComplete(currentStep)}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    completedSteps.includes(currentStep)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {completedSteps.includes(currentStep) ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                </button>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Hành động cần thực hiện:</h4>
                <div className="flex items-start mb-3">
                  <MousePointer className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{currentGuide.steps[currentStep].action}</span>
                </div>
                
                {showHints && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="text-sm font-semibold text-yellow-800 mb-1">Gợi ý:</h5>
                        <p className="text-sm text-yellow-700">{currentGuide.steps[currentStep].hint}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Trước
            </button>

            <div className="flex space-x-2">
              {currentGuide.steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : completedSteps.includes(index)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
              disabled={currentStep === totalSteps - 1}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp theo
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>

          {/* Auto-play Controls */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Tạm dừng' : 'Tự động phát'}
            </button>
            <button
              onClick={resetGuide}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Bắt đầu lại
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-black">
            Đã hoàn thành {completedSteps.length} / {totalSteps} bước
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
              Xem hướng dẫn đầy đủ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
