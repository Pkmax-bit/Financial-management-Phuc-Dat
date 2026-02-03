'use client'

import { useState } from 'react'
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Target, 
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  Settings,
  FileText,
  BarChart3,
  Clock,
  Award,
  CreditCard,
  DollarSign
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

const guideSteps = [
  {
    id: 1,
    title: "Tổng quan quản lý khách hàng",
    description: "Hiểu về hệ thống quản lý khách hàng",
    icon: Users,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các chức năng chính:</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Quản lý thông tin</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Thêm khách hàng mới</li>
            <li>• Chỉnh sửa thông tin</li>
            <li>• Xem chi tiết khách hàng</li>
            <li>• Xóa khách hàng</li>
          </ul>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Phân loại khách hàng</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Khách hàng cá nhân</li>
            <li>• Khách hàng doanh nghiệp</li>
            <li>• Khách hàng VIP</li>
            <li>• Khách hàng tiềm năng</li>
          </ul>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Theo dõi giao dịch</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Lịch sử mua hàng</li>
            <li>• Đơn hàng chưa thanh toán</li>
            <li>• Tổng giá trị giao dịch</li>
            <li>• Tần suất mua hàng</li>
          </ul>
        </div>
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Báo cáo khách hàng</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Thống kê khách hàng</li>
            <li>• Phân tích doanh thu</li>
            <li>• Khách hàng tiềm năng</li>
            <li>• Xuất báo cáo</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 2,
    title: "Thêm khách hàng mới",
    description: "Hướng dẫn thêm khách hàng vào hệ thống",
    icon: UserPlus,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các bước thêm khách hàng:</h3>
      <ol class="space-y-3">
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
          <div>
            <strong>Nhấn nút "Thêm khách hàng":</strong> Tìm nút có icon + trong giao diện
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
          <div>
            <strong>Chọn loại khách hàng:</strong>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Cá nhân: Họ tên, CMND/CCCD</li>
              <li>• Doanh nghiệp: Tên công ty, MST</li>
            </ul>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
          <div>
            <strong>Điền thông tin liên hệ:</strong>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Số điện thoại</li>
              <li>• Email</li>
              <li>• Địa chỉ</li>
              <li>• Website (nếu có)</li>
            </ul>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
          <div>
            <strong>Thiết lập phân loại:</strong>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Loại khách hàng</li>
              <li>• Mức độ ưu tiên</li>
              <li>• Ghi chú đặc biệt</li>
            </ul>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">5</div>
          <div>
            <strong>Lưu thông tin:</strong> Nhấn "Lưu" để hoàn tất
          </div>
        </li>
      </ol>
    `
  },
  {
    id: 3,
    title: "Quản lý thông tin khách hàng",
    description: "Chỉnh sửa và cập nhật thông tin",
    icon: UserCheck,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các thao tác quản lý:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Chỉnh sửa thông tin:</h4>
          <ol class="space-y-2 text-sm text-blue-700">
            <li>1. Tìm khách hàng trong danh sách</li>
            <li>2. Nhấn nút "Chỉnh sửa"</li>
            <li>3. Cập nhật thông tin cần thiết</li>
            <li>4. Lưu thay đổi</li>
          </ol>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Xem chi tiết:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Thông tin cơ bản</li>
            <li>• Lịch sử giao dịch</li>
            <li>• Đơn hàng chưa thanh toán</li>
            <li>• Ghi chú và lịch sử</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Tìm kiếm khách hàng:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Tìm theo tên</li>
            <li>• Tìm theo số điện thoại</li>
            <li>• Tìm theo email</li>
            <li>• Lọc theo loại khách hàng</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 4,
    title: "Phân loại khách hàng",
    description: "Tổ chức và phân loại khách hàng",
    icon: Target,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các loại khách hàng:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Khách hàng cá nhân:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Thông tin cá nhân</li>
            <li>• CMND/CCCD</li>
            <li>• Địa chỉ thường trú</li>
            <li>• Thông tin liên hệ</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Khách hàng doanh nghiệp:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Tên công ty</li>
            <li>• Mã số thuế</li>
            <li>• Địa chỉ trụ sở</li>
            <li>• Người đại diện</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Khách hàng VIP:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Mức độ ưu tiên cao</li>
            <li>• Hỗ trợ đặc biệt</li>
            <li>• Ưu đãi riêng</li>
            <li>• Theo dõi chặt chẽ</li>
          </ul>
        </div>
        
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Khách hàng tiềm năng:</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Chưa có giao dịch</li>
            <li>• Có khả năng mua hàng</li>
            <li>• Cần chăm sóc đặc biệt</li>
            <li>• Theo dõi và phát triển</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 5,
    title: "Theo dõi giao dịch",
    description: "Quản lý lịch sử giao dịch của khách hàng",
    icon: BarChart3,
    content: `
      <h3 class="text-lg font-semibold mb-3">Thông tin giao dịch:</h3>
      <div class="space-y-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold mb-2">Lịch sử mua hàng:</h4>
          <ul class="space-y-1 text-sm">
            <li>• Danh sách đơn hàng</li>
            <li>• Tổng giá trị mua hàng</li>
            <li>• Tần suất mua hàng</li>
            <li>• Sản phẩm/dịch vụ đã mua</li>
          </ul>
        </div>
        
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Đơn hàng chưa thanh toán:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Danh sách đơn hàng chưa trả</li>
            <li>• Tổng số tiền nợ</li>
            <li>• Ngày đến hạn</li>
            <li>• Trạng thái thanh toán</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Phân tích khách hàng:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Giá trị khách hàng (CLV)</li>
            <li>• Xu hướng mua hàng</li>
            <li>• Sản phẩm yêu thích</li>
            <li>• Thời điểm mua hàng</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 6,
    title: "Báo cáo khách hàng",
    description: "Các loại báo cáo về khách hàng",
    icon: FileText,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các loại báo cáo:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Báo cáo thống kê:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Tổng số khách hàng</li>
            <li>• Phân bố theo loại</li>
            <li>• Khách hàng mới</li>
            <li>• Tỷ lệ khách hàng VIP</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Báo cáo doanh thu:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Doanh thu theo khách hàng</li>
            <li>• Top khách hàng có giá trị cao</li>
            <li>• Phân tích xu hướng</li>
            <li>• Dự báo doanh thu</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Báo cáo nợ phải thu:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Danh sách khách hàng nợ</li>
            <li>• Tổng số tiền nợ</li>
            <li>• Phân loại theo mức độ</li>
            <li>• Kế hoạch thu hồi</li>
          </ul>
        </div>
        
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Xuất báo cáo:</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Xuất file Excel</li>
            <li>• Xuất file PDF</li>
            <li>• Gửi email báo cáo</li>
            <li>• Lưu trữ báo cáo</li>
          </ul>
        </div>
      </div>
    `
  }
]

export default function CustomersGuidePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()

  const currentGuide = guideSteps.find(step => step.id === currentStep)
  const IconComponent = currentGuide?.icon || Users

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
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hướng dẫn quản lý khách hàng</h1>
              <p className="text-gray-600">Tìm hiểu cách quản lý thông tin khách hàng</p>
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
                      onClick={() => router.push('/customers')}
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
