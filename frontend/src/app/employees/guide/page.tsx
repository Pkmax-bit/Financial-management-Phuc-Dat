'use client'

import { useState } from 'react'
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Building2, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Target, 
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  Settings,
  FileText,
  BarChart3,
  Clock,
  Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

const guideSteps = [
  {
    id: 1,
    title: "Tổng quan quản lý nhân viên",
    description: "Hiểu về hệ thống quản lý nhân viên",
    icon: Users,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các chức năng chính:</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Quản lý nhân viên</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Thêm nhân viên mới</li>
            <li>• Chỉnh sửa thông tin</li>
            <li>• Xem chi tiết nhân viên</li>
            <li>• Xóa nhân viên</li>
          </ul>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Quản lý phòng ban</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Tạo phòng ban mới</li>
            <li>• Chỉnh sửa phòng ban</li>
            <li>• Phân công nhân viên</li>
            <li>• Quản lý cấp bậc</li>
          </ul>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Quản lý chức vụ</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Tạo chức vụ mới</li>
            <li>• Thiết lập mức lương</li>
            <li>• Phân quyền chức vụ</li>
            <li>• Quản lý cấp độ</li>
          </ul>
        </div>
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Báo cáo nhân sự</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Thống kê nhân viên</li>
            <li>• Báo cáo lương</li>
            <li>• Phân tích hiệu suất</li>
            <li>• Xuất báo cáo</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 2,
    title: "Thêm nhân viên mới",
    description: "Hướng dẫn thêm nhân viên vào hệ thống",
    icon: UserPlus,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các bước thêm nhân viên:</h3>
      <ol class="space-y-3">
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
          <div>
            <strong>Nhấn nút "Thêm nhân viên":</strong> Tìm nút có icon + trong giao diện
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
          <div>
            <strong>Điền thông tin cơ bản:</strong>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Họ và tên</li>
              <li>• Email</li>
              <li>• Số điện thoại</li>
              <li>• Ngày sinh</li>
            </ul>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
          <div>
            <strong>Chọn phòng ban và chức vụ:</strong>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Phòng ban làm việc</li>
              <li>• Chức vụ hiện tại</li>
              <li>• Ngày bắt đầu làm việc</li>
            </ul>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
          <div>
            <strong>Thiết lập quyền truy cập:</strong>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Tài khoản đăng nhập</li>
              <li>• Mật khẩu tạm thời</li>
              <li>• Phân quyền hệ thống</li>
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
    title: "Quản lý phòng ban",
    description: "Tạo và quản lý các phòng ban",
    icon: Building2,
    content: `
      <h3 class="text-lg font-semibold mb-3">Quản lý phòng ban:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Tạo phòng ban mới:</h4>
          <ol class="space-y-2 text-sm text-blue-700">
            <li>1. Nhấn "Quản lý phòng ban"</li>
            <li>2. Chọn "Thêm phòng ban"</li>
            <li>3. Điền tên phòng ban</li>
            <li>4. Chọn trưởng phòng</li>
            <li>5. Thiết lập mô tả</li>
            <li>6. Lưu thông tin</li>
          </ol>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Chỉnh sửa phòng ban:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Thay đổi tên phòng ban</li>
            <li>• Thay đổi trưởng phòng</li>
            <li>• Cập nhật mô tả</li>
            <li>• Thêm/xóa nhân viên</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Phân công nhân viên:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Chọn nhân viên</li>
            <li>• Chọn phòng ban đích</li>
            <li>• Thiết lập ngày hiệu lực</li>
            <li>• Xác nhận chuyển đổi</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 4,
    title: "Quản lý chức vụ",
    description: "Tạo và quản lý các chức vụ",
    icon: Briefcase,
    content: `
      <h3 class="text-lg font-semibold mb-3">Quản lý chức vụ:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Tạo chức vụ mới:</h4>
          <ol class="space-y-2 text-sm text-blue-700">
            <li>1. Nhấn "Quản lý chức vụ"</li>
            <li>2. Chọn "Thêm chức vụ"</li>
            <li>3. Điền tên chức vụ</li>
            <li>4. Thiết lập mức lương cơ bản</li>
            <li>5. Chọn phòng ban</li>
            <li>6. Thiết lập quyền hạn</li>
            <li>7. Lưu thông tin</li>
          </ol>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Thiết lập mức lương:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Lương cơ bản</li>
            <li>• Phụ cấp</li>
            <li>• Thưởng</li>
            <li>• Các khoản khác</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Phân quyền chức vụ:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Quyền truy cập hệ thống</li>
            <li>• Quyền xem báo cáo</li>
            <li>• Quyền chỉnh sửa dữ liệu</li>
            <li>• Quyền quản lý nhân viên</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 5,
    title: "Xem chi tiết nhân viên",
    description: "Thông tin chi tiết về nhân viên",
    icon: UserCheck,
    content: `
      <h3 class="text-lg font-semibold mb-3">Thông tin chi tiết:</h3>
      <div class="space-y-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold mb-2">Thông tin cá nhân:</h4>
          <ul class="space-y-1 text-sm">
            <li>• Họ và tên</li>
            <li>• Email</li>
            <li>• Số điện thoại</li>
            <li>• Địa chỉ</li>
            <li>• Ngày sinh</li>
            <li>• Giới tính</li>
          </ul>
        </div>
        
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Thông tin công việc:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Phòng ban</li>
            <li>• Chức vụ</li>
            <li>• Ngày bắt đầu làm việc</li>
            <li>• Trạng thái làm việc</li>
            <li>• Mức lương</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Lịch sử công việc:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Các chức vụ đã từng đảm nhiệm</li>
            <li>• Lịch sử chuyển phòng ban</li>
            <li>• Các thay đổi lương</li>
            <li>• Ghi nhận khen thưởng</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 6,
    title: "Báo cáo nhân sự",
    description: "Các loại báo cáo về nhân viên",
    icon: BarChart3,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các loại báo cáo:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Báo cáo thống kê:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Tổng số nhân viên</li>
            <li>• Phân bố theo phòng ban</li>
            <li>• Phân bố theo chức vụ</li>
            <li>• Tỷ lệ nam/nữ</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Báo cáo lương:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Tổng quỹ lương</li>
            <li>• Lương trung bình</li>
            <li>• Phân bố lương theo phòng ban</li>
            <li>• So sánh lương theo thời gian</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Báo cáo hiệu suất:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Đánh giá hiệu suất</li>
            <li>• Thống kê khen thưởng</li>
            <li>• Phân tích xu hướng</li>
            <li>• Dự báo nhân sự</li>
          </ul>
        </div>
      </div>
    `
  }
]

export default function EmployeesGuidePage() {
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
              <h1 className="text-3xl font-bold text-gray-900">Hướng dẫn quản lý nhân viên</h1>
              <p className="text-gray-600">Tìm hiểu cách quản lý nhân viên và tổ chức</p>
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
                      onClick={() => router.push('/employees')}
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
