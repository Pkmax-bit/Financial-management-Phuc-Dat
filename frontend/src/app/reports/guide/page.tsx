'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar, 
  Filter, 
  DollarSign, 
  Users, 
  FolderOpen, 
  Receipt, 
  FileText, 
  Clock, 
  Target, 
  AlertCircle, 
  Building2, 
  CreditCard, 
  PiggyBank, 
  BookOpen, 
  Calculator, 
  Scale, 
  ArrowLeft,
  FileSpreadsheet,
  Activity,
  Banknote,
  LineChart,
  CheckCircle,
  PlayCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

const guideSteps = [
  {
    id: 1,
    title: "Tổng quan báo cáo",
    description: "Hiểu về các loại báo cáo tài chính",
    icon: BarChart3,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các loại báo cáo chính:</h3>
      <ul class="space-y-2">
        <li class="flex items-center gap-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span><strong>Báo cáo lãi lỗ (P&L):</strong> Theo dõi doanh thu và chi phí</span>
        </li>
        <li class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span><strong>Bảng cân đối kế toán:</strong> Tài sản, nợ phải trả và vốn chủ sở hữu</span>
        </li>
        <li class="flex items-center gap-2">
          <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span><strong>Báo cáo lưu chuyển tiền tệ:</strong> Theo dõi dòng tiền vào/ra</span>
        </li>
        <li class="flex items-center gap-2">
          <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span><strong>Báo cáo doanh thu theo khách hàng:</strong> Phân tích khách hàng</span>
        </li>
        <li class="flex items-center gap-2">
          <div class="w-2 h-2 bg-red-500 rounded-full"></div>
          <span><strong>Báo cáo chi phí theo nhà cung cấp:</strong> Phân tích chi phí</span>
        </li>
        <li class="flex items-center gap-2">
          <div class="w-2 h-2 bg-indigo-500 rounded-full"></div>
          <span><strong>Sổ cái:</strong> Chi tiết tất cả giao dịch</span>
        </li>
      </ul>
    `
  },
  {
    id: 2,
    title: "Tạo báo cáo lãi lỗ",
    description: "Hướng dẫn tạo báo cáo P&L",
    icon: TrendingUp,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các bước tạo báo cáo lãi lỗ:</h3>
      <ol class="space-y-3">
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
          <div>
            <strong>Chọn khoảng thời gian:</strong> Tháng, quý hoặc năm
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
          <div>
            <strong>Xem doanh thu:</strong> Tổng doanh thu từ bán hàng
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
          <div>
            <strong>Xem chi phí:</strong> Chi phí hoạt động và chi phí khác
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
          <div>
            <strong>Phân tích lãi lỗ:</strong> So sánh doanh thu và chi phí
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">5</div>
          <div>
            <strong>Xuất báo cáo:</strong> Tải xuống file PDF hoặc Excel
          </div>
        </li>
      </ol>
    `
  },
  {
    id: 3,
    title: "Bảng cân đối kế toán",
    description: "Hiểu về tài sản và nợ phải trả",
    icon: Scale,
    content: `
      <h3 class="text-lg font-semibold mb-3">Cấu trúc bảng cân đối:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">TÀI SẢN</h4>
          <ul class="space-y-1 text-sm">
            <li>• Tiền mặt và tương đương tiền</li>
            <li>• Các khoản phải thu</li>
            <li>• Hàng tồn kho</li>
            <li>• Tài sản cố định</li>
          </ul>
        </div>
        <div class="bg-red-50 p-4 rounded-lg">
          <h4 class="font-semibold text-red-800 mb-2">NỢ PHẢI TRẢ</h4>
          <ul class="space-y-1 text-sm">
            <li>• Các khoản phải trả</li>
            <li>• Nợ ngắn hạn</li>
            <li>• Nợ dài hạn</li>
          </ul>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">VỐN CHỦ SỞ HỮU</h4>
          <ul class="space-y-1 text-sm">
            <li>• Vốn góp</li>
            <li>• Lợi nhuận giữ lại</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 4,
    title: "Báo cáo lưu chuyển tiền tệ",
    description: "Theo dõi dòng tiền vào/ra",
    icon: Activity,
    content: `
      <h3 class="text-lg font-semibold mb-3">Phân loại dòng tiền:</h3>
      <div class="space-y-3">
        <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <strong class="text-green-800">Dòng tiền từ hoạt động kinh doanh</strong>
            <p class="text-sm text-green-600">Tiền từ bán hàng, chi phí hoạt động</p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <strong class="text-blue-800">Dòng tiền từ hoạt động đầu tư</strong>
            <p class="text-sm text-blue-600">Mua/bán tài sản cố định</p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
          <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <strong class="text-purple-800">Dòng tiền từ hoạt động tài chính</strong>
            <p class="text-sm text-purple-600">Vay nợ, trả nợ, góp vốn</p>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 5,
    title: "Phân tích khách hàng",
    description: "Báo cáo doanh thu theo khách hàng",
    icon: Users,
    content: `
      <h3 class="text-lg font-semibold mb-3">Thông tin báo cáo khách hàng:</h3>
      <div class="space-y-3">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold mb-2">Dữ liệu hiển thị:</h4>
          <ul class="space-y-1 text-sm">
            <li>• Tên khách hàng</li>
            <li>• Tổng doanh thu</li>
            <li>• Số lượng hóa đơn</li>
            <li>• Giá trị trung bình mỗi hóa đơn</li>
            <li>• Tỷ lệ % so với tổng doanh thu</li>
          </ul>
        </div>
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold mb-2">Cách sử dụng:</h4>
          <ol class="space-y-1 text-sm">
            <li>1. Chọn khoảng thời gian</li>
            <li>2. Xem danh sách khách hàng</li>
            <li>3. Phân tích khách hàng quan trọng</li>
            <li>4. Xuất báo cáo để lưu trữ</li>
          </ol>
        </div>
      </div>
    `
  },
  {
    id: 6,
    title: "Phân tích chi phí",
    description: "Báo cáo chi phí theo nhà cung cấp",
    icon: Receipt,
    content: `
      <h3 class="text-lg font-semibold mb-3">Thông tin báo cáo chi phí:</h3>
      <div class="space-y-3">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold mb-2">Dữ liệu hiển thị:</h4>
          <ul class="space-y-1 text-sm">
            <li>• Tên nhà cung cấp</li>
            <li>• Tổng chi phí</li>
            <li>• Số lượng hóa đơn</li>
            <li>• Giá trị trung bình mỗi hóa đơn</li>
            <li>• Tỷ lệ % so với tổng chi phí</li>
          </ul>
        </div>
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold mb-2">Lợi ích:</h4>
          <ul class="space-y-1 text-sm">
            <li>• Xác định nhà cung cấp chính</li>
            <li>• Phân tích chi phí theo danh mục</li>
            <li>• Tối ưu hóa chi phí</li>
            <li>• Lập kế hoạch ngân sách</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 7,
    title: "Sổ cái",
    description: "Chi tiết tất cả giao dịch",
    icon: BookOpen,
    content: `
      <h3 class="text-lg font-semibold mb-3">Thông tin sổ cái:</h3>
      <div class="space-y-3">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold mb-2">Dữ liệu hiển thị:</h4>
          <ul class="space-y-1 text-sm">
            <li>• Ngày giao dịch</li>
            <li>• Mô tả giao dịch</li>
            <li>• Tài khoản nợ</li>
            <li>• Tài khoản có</li>
            <li>• Số tiền</li>
            <li>• Số dư</li>
          </ul>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold mb-2">Tính năng:</h4>
          <ul class="space-y-1 text-sm">
            <li>• Lọc theo tài khoản</li>
            <li>• Lọc theo khoảng thời gian</li>
            <li>• Tìm kiếm giao dịch</li>
            <li>• Xuất báo cáo chi tiết</li>
          </ul>
        </div>
      </div>
    `
  }
]

export default function ReportsGuidePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()

  const currentGuide = guideSteps.find(step => step.id === currentStep)
  const IconComponent = currentGuide?.icon || BarChart3

  const nextStep = () => {
    if (currentStep < guideSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hướng dẫn báo cáo</h1>
              <p className="text-gray-600">Tìm hiểu cách sử dụng các loại báo cáo tài chính</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Bước {currentStep} / {guideSteps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / guideSteps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / guideSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Nội dung hướng dẫn</h3>
              <div className="space-y-2">
                {guideSteps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentStep === step.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        currentStep === step.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {step.id}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{step.title}</div>
                        <div className="text-xs text-gray-500">{step.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentGuide?.title}</h2>
                  <p className="text-gray-600">{currentGuide?.description}</p>
                </div>
              </div>

              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: currentGuide?.content || '' }}
              />

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Trước
                </button>

                <div className="flex items-center gap-2">
                  {currentStep === guideSteps.length ? (
                    <button
                      onClick={() => router.push('/reports')}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Bắt đầu sử dụng
                    </button>
                  ) : (
                    <button
                      onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Tiếp theo
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
