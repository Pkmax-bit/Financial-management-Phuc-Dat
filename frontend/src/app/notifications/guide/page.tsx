'use client'

import { useState } from 'react'
import { 
  Bell, 
  BellRing, 
  Settings, 
  Mail, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Info,
  ArrowLeft,
  PlayCircle,
  Clock,
  User,
  Calendar,
  FileText
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

const guideSteps = [
  {
    id: 1,
    title: "Tổng quan hệ thống thông báo",
    description: "Hiểu về hệ thống thông báo",
    icon: Bell,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các loại thông báo:</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Thông báo hệ thống</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Cập nhật hệ thống</li>
            <li>• Bảo trì định kỳ</li>
            <li>• Thay đổi chính sách</li>
            <li>• Cảnh báo bảo mật</li>
          </ul>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Thông báo công việc</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Nhắc nhở deadline</li>
            <li>• Phê duyệt tài liệu</li>
            <li>• Cập nhật tiến độ</li>
            <li>• Giao việc mới</li>
          </ul>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Thông báo tài chính</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Đơn hàng đến hạn</li>
            <li>• Thanh toán thành công</li>
            <li>• Cảnh báo ngân sách</li>
            <li>• Báo cáo tài chính</li>
          </ul>
        </div>
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Thông báo nhóm</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Tin nhắn nhóm</li>
            <li>• Chia sẻ tài liệu</li>
            <li>• Cuộc họp sắp tới</li>
            <li>• Cập nhật dự án</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 2,
    title: "Quản lý thông báo",
    description: "Cách quản lý và xử lý thông báo",
    icon: Settings,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các thao tác quản lý:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Đánh dấu đã đọc:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Nhấn vào thông báo để đánh dấu đã đọc</li>
            <li>• Sử dụng nút "Đánh dấu tất cả đã đọc"</li>
            <li>• Tự động đánh dấu khi mở thông báo</li>
            <li>• Lọc theo trạng thái đã đọc/chưa đọc</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Xóa thông báo:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Xóa từng thông báo riêng lẻ</li>
            <li>• Xóa nhiều thông báo cùng lúc</li>
            <li>• Xóa tất cả thông báo cũ</li>
            <li>• Tự động xóa thông báo hết hạn</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Sắp xếp thông báo:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Sắp xếp theo thời gian</li>
            <li>• Sắp xếp theo mức độ ưu tiên</li>
            <li>• Sắp xếp theo loại thông báo</li>
            <li>• Sắp xếp theo trạng thái</li>
          </ul>
        </div>
        
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Tìm kiếm thông báo:</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Tìm theo từ khóa</li>
            <li>• Lọc theo ngày</li>
            <li>• Lọc theo người gửi</li>
            <li>• Lọc theo loại thông báo</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 3,
    title: "Cài đặt thông báo",
    description: "Tùy chỉnh cài đặt thông báo",
    icon: BellRing,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các cài đặt thông báo:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Thông báo email:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Bật/tắt thông báo email</li>
            <li>• Chọn loại thông báo gửi email</li>
            <li>• Thiết lập tần suất email</li>
            <li>• Cài đặt thời gian nhận email</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Thông báo trong ứng dụng:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Bật/tắt thông báo popup</li>
            <li>• Thiết lập âm thanh thông báo</li>
            <li>• Chọn thời gian hiển thị</li>
            <li>• Cài đặt vị trí hiển thị</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Thông báo push:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Bật/tắt thông báo push</li>
            <li>• Chọn loại thông báo push</li>
            <li>• Thiết lập thời gian im lặng</li>
            <li>• Cài đặt mức độ ưu tiên</li>
          </ul>
        </div>
        
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Lọc thông báo:</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Chọn loại thông báo muốn nhận</li>
            <li>• Thiết lập từ khóa lọc</li>
            <li>• Cài đặt người gửi được phép</li>
            <li>• Thiết lập thời gian nhận thông báo</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 4,
    title: "Thông báo quan trọng",
    description: "Xử lý thông báo quan trọng",
    icon: AlertCircle,
    content: `
      <h3 class="text-lg font-semibold mb-3">Phân loại thông báo quan trọng:</h3>
      <div class="space-y-4">
        <div class="bg-red-50 p-4 rounded-lg">
          <h4 class="font-semibold text-red-800 mb-2">Thông báo khẩn cấp:</h4>
          <ul class="space-y-1 text-sm text-red-700">
            <li>• Cảnh báo bảo mật</li>
            <li>• Sự cố hệ thống</li>
            <li>• Deadline quan trọng</li>
            <li>• Thông báo từ ban lãnh đạo</li>
          </ul>
        </div>
        
        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">Thông báo ưu tiên cao:</h4>
          <ul class="space-y-1 text-sm text-yellow-700">
            <li>• Phê duyệt tài liệu</li>
            <li>• Thanh toán đến hạn</li>
            <li>• Cập nhật dự án quan trọng</li>
            <li>• Thông báo từ khách hàng</li>
          </ul>
        </div>
        
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Thông báo thông thường:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Cập nhật tiến độ</li>
            <li>• Thông báo nhóm</li>
            <li>• Nhắc nhở công việc</li>
            <li>• Thông báo hệ thống</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Xử lý thông báo quan trọng:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Ưu tiên xử lý thông báo khẩn cấp</li>
            <li>• Phản hồi nhanh chóng</li>
            <li>• Chuyển tiếp cho người có trách nhiệm</li>
            <li>• Theo dõi tiến độ xử lý</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 5,
    title: "Thông báo nhóm",
    description: "Quản lý thông báo nhóm làm việc",
    icon: MessageSquare,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các loại thông báo nhóm:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Thông báo dự án:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Cập nhật tiến độ dự án</li>
            <li>• Thay đổi kế hoạch</li>
            <li>• Phân công công việc mới</li>
            <li>• Hoàn thành milestone</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Thông báo cuộc họp:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Lịch cuộc họp mới</li>
            <li>• Thay đổi thời gian họp</li>
            <li>• Nhắc nhở trước cuộc họp</li>
            <li>• Tóm tắt cuộc họp</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Thông báo chia sẻ:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Chia sẻ tài liệu mới</li>
            <li>• Cập nhật tài liệu</li>
            <li>• Phản hồi trên tài liệu</li>
            <li>• Yêu cầu phê duyệt</li>
          </ul>
        </div>
        
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Quản lý thông báo nhóm:</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Thiết lập quyền gửi thông báo</li>
            <li>• Tạo kênh thông báo riêng</li>
            <li>• Quản lý thành viên nhóm</li>
            <li>• Lưu trữ thông báo quan trọng</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 6,
    title: "Tích hợp thông báo",
    description: "Tích hợp thông báo với các ứng dụng khác",
    icon: Mail,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các tích hợp thông báo:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Email tích hợp:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Gửi thông báo qua email</li>
            <li>• Tích hợp với Gmail/Outlook</li>
            <li>• Tự động trả lời email</li>
            <li>• Lọc thông báo email</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Slack/Teams:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Gửi thông báo đến Slack</li>
            <li>• Tích hợp với Microsoft Teams</li>
            <li>• Tạo kênh thông báo riêng</li>
            <li>• Đồng bộ thông báo</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Mobile app:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Thông báo push trên mobile</li>
            <li>• Đồng bộ với ứng dụng di động</li>
            <li>• Thông báo offline</li>
            <li>• Cài đặt thông báo mobile</li>
          </ul>
        </div>
        
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">API tích hợp:</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Webhook cho thông báo</li>
            <li>• API để gửi thông báo</li>
            <li>• Tích hợp với hệ thống bên ngoài</li>
            <li>• Tùy chỉnh định dạng thông báo</li>
          </ul>
        </div>
      </div>
    `
  }
]

export default function NotificationsGuidePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()

  const currentGuide = guideSteps.find(step => step.id === currentStep)
  const IconComponent = currentGuide?.icon || Bell

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
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hướng dẫn hệ thống thông báo</h1>
              <p className="text-gray-600">Tìm hiểu cách quản lý và sử dụng thông báo</p>
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
                      onClick={() => router.push('/notifications')}
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
