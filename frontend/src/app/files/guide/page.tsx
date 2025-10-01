'use client'

import { useState } from 'react'
import { 
  FolderOpen, 
  Upload, 
  Download, 
  FileText, 
  Image, 
  File, 
  Trash2, 
  Search, 
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  Settings,
  BarChart3,
  Clock,
  Award,
  Share2,
  Eye,
  Edit
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

const guideSteps = [
  {
    id: 1,
    title: "Tổng quan quản lý tệp",
    description: "Hiểu về hệ thống quản lý tệp tin",
    icon: FolderOpen,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các chức năng chính:</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Quản lý tệp</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Tải lên tệp tin</li>
            <li>• Tạo thư mục</li>
            <li>• Di chuyển tệp</li>
            <li>• Xóa tệp tin</li>
          </ul>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Tổ chức tệp</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Phân loại theo danh mục</li>
            <li>• Đặt tên có ý nghĩa</li>
            <li>• Sử dụng thẻ (tags)</li>
            <li>• Tạo cấu trúc thư mục</li>
          </ul>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Chia sẻ tệp</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Chia sẻ với nhóm</li>
            <li>• Tạo liên kết công khai</li>
            <li>• Thiết lập quyền truy cập</li>
            <li>• Theo dõi hoạt động</li>
          </ul>
        </div>
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Bảo mật tệp</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Mã hóa tệp nhạy cảm</li>
            <li>• Sao lưu tự động</li>
            <li>• Kiểm soát phiên bản</li>
            <li>• Lưu trữ an toàn</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 2,
    title: "Tải lên tệp tin",
    description: "Hướng dẫn tải lên tệp tin mới",
    icon: Upload,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các bước tải lên tệp:</h3>
      <ol class="space-y-3">
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
          <div>
            <strong>Chọn phương thức tải lên:</strong>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Kéo thả tệp vào vùng tải lên</li>
              <li>• Nhấn nút "Tải lên" và chọn tệp</li>
              <li>• Tải lên nhiều tệp cùng lúc</li>
            </ul>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
          <div>
            <strong>Chọn thư mục đích:</strong>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Chọn thư mục phù hợp</li>
              <li>• Tạo thư mục mới nếu cần</li>
              <li>• Xem trước cấu trúc thư mục</li>
            </ul>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
          <div>
            <strong>Thiết lập thông tin tệp:</strong>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Đặt tên tệp rõ ràng</li>
              <li>• Thêm mô tả (nếu cần)</li>
              <li>• Chọn thẻ phân loại</li>
              <li>• Thiết lập quyền truy cập</li>
            </ul>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
          <div>
            <strong>Xác nhận tải lên:</strong> Nhấn "Tải lên" để hoàn tất
          </div>
        </li>
      </ol>
    `
  },
  {
    id: 3,
    title: "Tổ chức tệp tin",
    description: "Cách tổ chức tệp tin hiệu quả",
    icon: FolderOpen,
    content: `
      <h3 class="text-lg font-semibold mb-3">Nguyên tắc tổ chức:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Cấu trúc thư mục:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Tạo thư mục theo dự án</li>
            <li>• Phân loại theo loại tệp</li>
            <li>• Sử dụng tên thư mục rõ ràng</li>
            <li>• Tránh tạo quá nhiều cấp thư mục</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Đặt tên tệp:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Sử dụng tên có ý nghĩa</li>
            <li>• Bao gồm ngày tháng</li>
            <li>• Sử dụng định dạng nhất quán</li>
            <li>• Tránh ký tự đặc biệt</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Sử dụng thẻ (tags):</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Tạo thẻ phân loại</li>
            <li>• Gán nhiều thẻ cho một tệp</li>
            <li>• Sử dụng thẻ nhất quán</li>
            <li>• Tìm kiếm theo thẻ</li>
          </ul>
        </div>
        
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Dọn dẹp định kỳ:</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Xóa tệp không cần thiết</li>
            <li>• Lưu trữ tệp cũ</li>
            <li>• Cập nhật tên tệp</li>
            <li>• Kiểm tra quyền truy cập</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 4,
    title: "Tìm kiếm tệp tin",
    description: "Cách tìm kiếm tệp tin nhanh chóng",
    icon: Search,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các cách tìm kiếm:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Tìm kiếm theo tên:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Nhập tên tệp hoặc một phần</li>
            <li>• Sử dụng ký tự đại diện (*, ?)</li>
            <li>• Tìm kiếm không phân biệt hoa thường</li>
            <li>• Tìm kiếm trong nội dung tệp</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Tìm kiếm theo thẻ:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Chọn thẻ từ danh sách</li>
            <li>• Kết hợp nhiều thẻ</li>
            <li>• Tìm kiếm theo loại tệp</li>
            <li>• Lọc theo kích thước</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Tìm kiếm nâng cao:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Lọc theo ngày tạo/sửa</li>
            <li>• Tìm theo người tải lên</li>
            <li>• Lọc theo quyền truy cập</li>
            <li>• Tìm kiếm trong thư mục cụ thể</li>
          </ul>
        </div>
        
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Lưu tìm kiếm:</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Lưu bộ lọc thường dùng</li>
            <li>• Tạo tìm kiếm nhanh</li>
            <li>• Chia sẻ tìm kiếm với nhóm</li>
            <li>• Nhận thông báo khi có tệp mới</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 5,
    title: "Chia sẻ tệp tin",
    description: "Cách chia sẻ tệp tin với người khác",
    icon: Share2,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các cách chia sẻ:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Chia sẻ nội bộ:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Chia sẻ với nhóm làm việc</li>
            <li>• Gửi liên kết qua email</li>
            <li>• Thiết lập quyền xem/chỉnh sửa</li>
            <li>• Thêm người dùng vào thư mục</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Chia sẻ công khai:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Tạo liên kết công khai</li>
            <li>• Thiết lập mật khẩu bảo vệ</li>
            <li>• Giới hạn thời gian truy cập</li>
            <li>• Theo dõi lượt tải xuống</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Quản lý quyền:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Chỉ xem (View only)</li>
            <li>• Xem và tải xuống</li>
            <li>• Chỉnh sửa nội dung</li>
            <li>• Quản lý quyền truy cập</li>
          </ul>
        </div>
        
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Theo dõi hoạt động:</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Xem ai đã truy cập tệp</li>
            <li>• Theo dõi thay đổi</li>
            <li>• Nhận thông báo hoạt động</li>
            <li>• Lưu lịch sử truy cập</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 6,
    title: "Bảo mật tệp tin",
    description: "Bảo vệ tệp tin an toàn",
    icon: Settings,
    content: `
      <h3 class="text-lg font-semibold mb-3">Các biện pháp bảo mật:</h3>
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">Mã hóa tệp:</h4>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• Mã hóa tệp nhạy cảm</li>
            <li>• Sử dụng mật khẩu bảo vệ</li>
            <li>• Mã hóa tự động cho tệp quan trọng</li>
            <li>• Quản lý khóa mã hóa</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">Sao lưu:</h4>
          <ul class="space-y-1 text-sm text-green-700">
            <li>• Sao lưu tự động định kỳ</li>
            <li>• Lưu trữ tại nhiều vị trí</li>
            <li>• Kiểm tra tính toàn vẹn tệp</li>
            <li>• Khôi phục tệp khi cần</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-semibold text-purple-800 mb-2">Kiểm soát truy cập:</h4>
          <ul class="space-y-1 text-sm text-purple-700">
            <li>• Phân quyền chi tiết</li>
            <li>• Xác thực hai yếu tố</li>
            <li>• Theo dõi hoạt động truy cập</li>
            <li>• Tự động khóa tài khoản</li>
          </ul>
        </div>
        
        <div class="bg-orange-50 p-4 rounded-lg">
          <h4 class="font-semibold text-orange-800 mb-2">Tuân thủ quy định:</h4>
          <ul class="space-y-1 text-sm text-orange-700">
            <li>• Tuân thủ GDPR</li>
            <li>• Lưu trữ theo quy định</li>
            <li>• Xóa tệp khi hết hạn</li>
            <li>• Báo cáo vi phạm bảo mật</li>
          </ul>
        </div>
      </div>
    `
  }
]

export default function FilesGuidePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()

  const currentGuide = guideSteps.find(step => step.id === currentStep)
  const IconComponent = currentGuide?.icon || FolderOpen

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
              <FolderOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hướng dẫn quản lý tệp tin</h1>
              <p className="text-gray-600">Tìm hiểu cách quản lý và tổ chức tệp tin</p>
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
                      onClick={() => router.push('/files')}
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
