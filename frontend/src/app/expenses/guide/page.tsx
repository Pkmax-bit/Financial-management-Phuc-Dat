'use client'

import React from 'react'
import { 
  Receipt, 
  FileText, 
  Building2, 
  ShoppingCart, 
  User, 
  BarChart3,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Target,
  Users,
  PieChart,
  LineChart
} from 'lucide-react'
import Link from 'next/link'

export default function ExpensesGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/expenses"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Quay lại Chi phí
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  Hướng dẫn Quản lý Chi phí
                </h1>
                <p className="text-black mt-1">
                  Hướng dẫn chi tiết về cách sử dụng hệ thống quản lý chi phí
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href="/expenses/help"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Trung tâm hỗ trợ
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="sticky top-8 space-y-2">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Mục lục</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#overview" className="text-blue-600 hover:text-blue-800">Tổng quan</a></li>
                  <li><a href="#expenses" className="text-blue-600 hover:text-blue-800">Chi phí</a></li>
                  <li><a href="#bills" className="text-blue-600 hover:text-blue-800">Hóa đơn NCC</a></li>
                  <li><a href="#purchase-orders" className="text-blue-600 hover:text-blue-800">Đơn đặt hàng</a></li>
                  <li><a href="#expense-claims" className="text-blue-600 hover:text-blue-800">Đề nghị hoàn ứng</a></li>
                  <li><a href="#budgeting" className="text-blue-600 hover:text-blue-800">Quản lý ngân sách</a></li>
                  <li><a href="#vendors" className="text-blue-600 hover:text-blue-800">Nhà cung cấp</a></li>
                  <li><a href="#reports" className="text-blue-600 hover:text-blue-800">Báo cáo</a></li>
                  <li><a href="#tips" className="text-blue-600 hover:text-blue-800">Mẹo sử dụng</a></li>
                </ul>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Overview Section */}
            <section id="overview" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                Tổng quan Hệ thống Quản lý Chi phí
              </h2>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  Hệ thống Quản lý Chi phí giúp bạn theo dõi, quản lý và kiểm soát tất cả các khoản chi phí của doanh nghiệp một cách hiệu quả và minh bạch.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">🎯 Mục tiêu chính</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Theo dõi chi phí thực tế</li>
                      <li>• Quản lý hóa đơn nhà cung cấp</li>
                      <li>• Kiểm soát ngân sách</li>
                      <li>• Tối ưu hóa chi phí</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">✅ Lợi ích</h3>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Minh bạch tài chính</li>
                      <li>• Kiểm soát chi phí hiệu quả</li>
                      <li>• Báo cáo chính xác</li>
                      <li>• Tuân thủ quy định</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <Lightbulb className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-yellow-800">
                        <strong>Mẹo:</strong> Bắt đầu bằng cách thiết lập ngân sách cho từng danh mục chi phí, sau đó theo dõi chi phí thực tế để đảm bảo không vượt quá ngân sách đã định.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Expenses Section */}
            <section id="expenses" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Receipt className="h-6 w-6 text-orange-600" />
                Quản lý Chi phí
              </h2>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  Chi phí là các khoản tiền mà doanh nghiệp đã chi ra cho hoạt động kinh doanh. Hệ thống giúp bạn ghi nhận và theo dõi tất cả các chi phí này.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 Các bước tạo chi phí:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
                  <li>Nhấn <strong>&quot;Tạo chi phí&quot;</strong> trong tab Chi phí</li>
                  <li>Điền thông tin cơ bản: ngày, mô tả, số tiền</li>
                  <li>Chọn danh mục chi phí phù hợp</li>
                  <li>Đính kèm hóa đơn/chứng từ (nếu có)</li>
                  <li>Chọn người phê duyệt</li>
                  <li>Nhấn <strong>&quot;Tạo chi phí&quot;</strong></li>
                </ol>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">📋 Thông tin bắt buộc</h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Ngày chi phí</li>
                      <li>• Mô tả chi phí</li>
                      <li>• Số tiền</li>
                      <li>• Danh mục chi phí</li>
                      <li>• Người phê duyệt</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">📁 Danh mục chi phí</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Đi lại</li>
                      <li>• Ăn uống</li>
                      <li>• Văn phòng phẩm</li>
                      <li>• Tiện ích</li>
                      <li>• Marketing</li>
                      <li>• Đào tạo</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-green-800">
                        <strong>Lưu ý:</strong> Luôn đính kèm hóa đơn/chứng từ để đảm bảo tính minh bạch và tuân thủ quy định kế toán.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bills Section */}
            <section id="bills" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-red-600" />
                Quản lý Hóa đơn Nhà cung cấp
              </h2>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  Hóa đơn nhà cung cấp là các hóa đơn mà doanh nghiệp nhận được từ nhà cung cấp hàng hóa/dịch vụ. Cần được ghi nhận và theo dõi để thanh toán đúng hạn.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Quy trình xử lý hóa đơn:</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Nhận hóa đơn</h4>
                      <p className="text-black text-sm">Nhận hóa đơn từ nhà cung cấp và kiểm tra tính hợp lệ</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Nhập vào hệ thống</h4>
                      <p className="text-black text-sm">Tạo hóa đơn mới với đầy đủ thông tin</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Phê duyệt</h4>
                      <p className="text-black text-sm">Người có thẩm quyền phê duyệt hóa đơn</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Thanh toán</h4>
                      <p className="text-black text-sm">Thực hiện thanh toán theo đúng hạn</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-6">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-red-800">
                        <strong>Quan trọng:</strong> Luôn kiểm tra kỹ thông tin trên hóa đơn trước khi phê duyệt để tránh sai sót trong thanh toán.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Purchase Orders Section */}
            <section id="purchase-orders" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
                Quản lý Đơn đặt hàng
              </h2>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  Đơn đặt hàng (Purchase Order) giúp kiểm soát chi tiêu trước khi thực hiện mua hàng. Đây là công cụ quan trọng để quản lý ngân sách và tránh chi tiêu vượt mức.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">🔄 Quy trình đơn đặt hàng:</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold">1</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Draft</span>
                      <span className="text-sm text-black ml-2">- Tạo đơn đặt hàng</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold">2</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Pending Approval</span>
                      <span className="text-sm text-black ml-2">- Chờ phê duyệt</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold">3</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Approved</span>
                      <span className="text-sm text-black ml-2">- Đã phê duyệt</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold">4</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Closed</span>
                      <span className="text-sm text-black ml-2">- Chuyển thành hóa đơn</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
                  <div className="flex">
                    <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Mẹo:</strong> Đơn đặt hàng không tạo bút toán kế toán. Chỉ khi chuyển thành hóa đơn mới ghi nhận vào sổ sách kế toán.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Expense Claims Section */}
            <section id="expense-claims" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-6 w-6 text-purple-600" />
                Quản lý Đề nghị Hoàn ứng
              </h2>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  Đề nghị hoàn ứng cho phép nhân viên yêu cầu hoàn trả các khoản tiền đã chi từ tiền cá nhân cho công việc. Hệ thống quản lý toàn bộ quy trình từ đề nghị đến thanh toán.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Quy trình đề nghị hoàn ứng:</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-purple-200 pl-4">
                    <h4 className="font-semibold text-gray-900">1. Tạo đề nghị</h4>
                    <p className="text-black text-sm">Nhân viên tạo đề nghị với các chi phí đã chi</p>
                    <ul className="text-sm text-black mt-1 space-y-1">
                      <li>• Đính kèm hóa đơn/chứng từ</li>
                      <li>• Mô tả chi tiết từng khoản chi</li>
                      <li>• Chọn danh mục chi phí</li>
                    </ul>
                  </div>
                  
                  <div className="border-l-4 border-yellow-200 pl-4">
                    <h4 className="font-semibold text-gray-900">2. Gửi phê duyệt</h4>
                    <p className="text-black text-sm">Đề nghị được gửi cho người quản lý phê duyệt</p>
                  </div>
                  
                  <div className="border-l-4 border-green-200 pl-4">
                    <h4 className="font-semibold text-gray-900">3. Phê duyệt</h4>
                    <p className="text-black text-sm">Người quản lý xem xét và phê duyệt/ từ chối</p>
                    <ul className="text-sm text-black mt-1 space-y-1">
                      <li>• Tạo bút toán kế toán khi phê duyệt</li>
                      <li>• Ghi nhận nợ phải trả nhân viên</li>
                    </ul>
                  </div>
                  
                  <div className="border-l-4 border-blue-200 pl-4">
                    <h4 className="font-semibold text-gray-900">4. Thanh toán</h4>
                    <p className="text-black text-sm">Thực hiện thanh toán cho nhân viên</p>
                    <ul className="text-sm text-black mt-1 space-y-1">
                      <li>• Ghi nhận thanh toán</li>
                      <li>• Cấn trừ nợ phải trả</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mt-6">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-purple-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-purple-800">
                        <strong>Lưu ý:</strong> Hệ thống tự động tạo bút toán kế toán khi phê duyệt và thanh toán đề nghị hoàn ứng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Budgeting Section */}
            <section id="budgeting" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-green-600" />
                Quản lý Ngân sách
              </h2>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  Quản lý ngân sách giúp bạn thiết lập giới hạn chi tiêu và theo dõi thực tế so với kế hoạch. Đây là công cụ quan trọng để kiểm soát tài chính hiệu quả.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Các bước quản lý ngân sách:</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Tạo ngân sách</h4>
                      <p className="text-black text-sm">Thiết lập ngân sách cho từng danh mục chi phí</p>
                      <ul className="text-sm text-black mt-1 space-y-1">
                        <li>• Chọn chu kỳ (tháng/quý/năm)</li>
                        <li>• Phân bổ ngân sách theo danh mục</li>
                        <li>• Thiết lập mục tiêu chi tiêu</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Phê duyệt ngân sách</h4>
                      <p className="text-black text-sm">Người quản lý phê duyệt ngân sách</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Theo dõi thực tế</h4>
                      <p className="text-black text-sm">Hệ thống tự động cập nhật chi tiêu thực tế</p>
                      <ul className="text-sm text-black mt-1 space-y-1">
                        <li>• Từ chi phí đã ghi nhận</li>
                        <li>• Từ hóa đơn đã thanh toán</li>
                        <li>• Tính toán chênh lệch</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-600">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Báo cáo & Phân tích</h4>
                      <p className="text-black text-sm">Xem báo cáo so sánh ngân sách vs thực tế</p>
                      <ul className="text-sm text-black mt-1 space-y-1">
                        <li>• Biểu đồ trực quan</li>
                        <li>• Phân tích chênh lệch</li>
                        <li>• Đề xuất điều chỉnh</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-6">
                  <div className="flex">
                    <TrendingUp className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-green-800">
                        <strong>Lợi ích:</strong> Quản lý ngân sách giúp kiểm soát chi phí, tối ưu hóa nguồn lực và đảm bảo tài chính ổn định.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Vendors Section */}
            <section id="vendors" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-purple-600" />
                Quản lý Nhà cung cấp
              </h2>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  Nhà cung cấp là các đối tác cung cấp hàng hóa/dịch vụ cho doanh nghiệp. Quản lý thông tin nhà cung cấp giúp duy trì mối quan hệ tốt và đảm bảo chất lượng.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Thông tin nhà cung cấp:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">📝 Thông tin cơ bản</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Tên nhà cung cấp</li>
                      <li>• Mã số thuế</li>
                      <li>• Địa chỉ</li>
                      <li>• Số điện thoại</li>
                      <li>• Email liên hệ</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">💰 Thông tin tài chính</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Số tài khoản</li>
                      <li>• Ngân hàng</li>
                      <li>• Điều khoản thanh toán</li>
                      <li>• Hạn mức tín dụng</li>
                      <li>• Lịch sử giao dịch</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mt-6">
                  <div className="flex">
                    <Users className="h-5 w-5 text-purple-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-purple-800">
                        <strong>Mẹo:</strong> Thường xuyên cập nhật thông tin nhà cung cấp để đảm bảo tính chính xác và duy trì mối quan hệ tốt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Reports Section */}
            <section id="reports" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="h-6 w-6 text-indigo-600" />
                Báo cáo & Phân tích
              </h2>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  Hệ thống cung cấp các báo cáo chi tiết giúp bạn phân tích chi phí, đánh giá hiệu quả và đưa ra quyết định tài chính chính xác.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Các loại báo cáo:</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">📈 Báo cáo chi phí theo thời gian</h4>
                    <p className="text-black text-sm mb-2">Theo dõi xu hướng chi phí qua các tháng/quý</p>
                    <ul className="text-sm text-black space-y-1">
                      <li>• Biểu đồ đường xu hướng</li>
                      <li>• So sánh theo kỳ</li>
                      <li>• Dự báo chi phí</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">🥧 Báo cáo chi phí theo danh mục</h4>
                    <p className="text-black text-sm mb-2">Phân tích chi phí theo từng danh mục</p>
                    <ul className="text-sm text-black space-y-1">
                      <li>• Biểu đồ tròn phân bổ</li>
                      <li>• Top danh mục chi phí cao</li>
                      <li>• Tỷ trọng từng danh mục</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">📋 Báo cáo ngân sách vs thực tế</h4>
                    <p className="text-black text-sm mb-2">So sánh ngân sách với chi tiêu thực tế</p>
                    <ul className="text-sm text-black space-y-1">
                      <li>• Chênh lệch ngân sách</li>
                      <li>• Tỷ lệ sử dụng ngân sách</li>
                      <li>• Cảnh báo vượt ngân sách</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">🏢 Báo cáo theo nhà cung cấp</h4>
                    <p className="text-black text-sm mb-2">Phân tích chi phí theo từng nhà cung cấp</p>
                    <ul className="text-sm text-black space-y-1">
                      <li>• Top nhà cung cấp</li>
                      <li>• Lịch sử giao dịch</li>
                      <li>• Đánh giá hiệu quả</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mt-6">
                  <div className="flex">
                    <LineChart className="h-5 w-5 text-indigo-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-indigo-800">
                        <strong>Lưu ý:</strong> Thường xuyên xem báo cáo để phát hiện xu hướng và điều chỉnh chiến lược tài chính kịp thời.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tips Section */}
            <section id="tips" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                Mẹo sử dụng hiệu quả
              </h2>
              
              <div className="prose max-w-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">💡 Mẹo quản lý chi phí</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Ghi nhận chi phí ngay khi phát sinh</li>
                        <li>• Phân loại chi phí chính xác</li>
                        <li>• Đính kèm đầy đủ chứng từ</li>
                        <li>• Kiểm tra trước khi phê duyệt</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">📊 Mẹo quản lý ngân sách</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Thiết lập ngân sách thực tế</li>
                        <li>• Theo dõi thường xuyên</li>
                        <li>• Điều chỉnh kịp thời</li>
                        <li>• Phân tích xu hướng</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">🔄 Mẹo quy trình</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Thiết lập quy trình rõ ràng</li>
                        <li>• Phân quyền phù hợp</li>
                        <li>• Đào tạo người dùng</li>
                        <li>• Kiểm tra định kỳ</li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">📈 Mẹo báo cáo</h4>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• Xem báo cáo hàng tuần</li>
                        <li>• So sánh theo kỳ</li>
                        <li>• Phân tích xu hướng</li>
                        <li>• Đưa ra quyết định dựa trên dữ liệu</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-400 p-6 mt-6">
                  <div className="flex">
                    <Target className="h-6 w-6 text-blue-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">🎯 Mục tiêu cuối cùng</h4>
                      <p className="text-sm text-blue-800">
                        Sử dụng hệ thống quản lý chi phí hiệu quả để kiểm soát tài chính, tối ưu hóa chi phí và đảm bảo tính minh bạch trong mọi hoạt động tài chính của doanh nghiệp.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t">
              <Link
                href="/expenses"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại Chi phí
              </Link>
              
              <Link
                href="/expenses/help"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Trung tâm hỗ trợ
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
