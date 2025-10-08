/**
 * Tour Steps Data - Các bước hướng dẫn cho từng trang
 */

import { TourStep } from '@/components/WebsiteTour'

// Dashboard Tour Steps
export const dashboardTourSteps: TourStep[] = [
  {
    id: 'dashboard-overview',
    title: '📊 Tổng quan Dashboard',
    description: 'Đây là trung tâm điều khiển chính của hệ thống quản lý tài chính. Tại đây bạn có thể:\n\n• Xem tổng quan tình hình kinh doanh\n• Theo dõi các chỉ số quan trọng\n• Thực hiện các thao tác nhanh\n• Truy cập các chức năng chính\n\nDashboard được thiết kế để cung cấp cái nhìn tổng quan về hoạt động kinh doanh của bạn.',
    target: '[data-tour="dashboard-header"]',
    position: 'bottom',
    action: 'Khám phá các tính năng chính của hệ thống',
    highlight: true
  },
  {
    id: 'dashboard-quick-actions',
    title: '⚡ Lối tắt truy cập nhanh',
    description: 'Đây là các nút tác vụ nhanh giúp bạn tạo các tài liệu quan trọng một cách dễ dàng:\n\n• 📄 Tạo Hóa đơn mới - Bán hàng cho khách hàng\n• 💰 Tạo Chi phí mới - Ghi nhận chi phí kinh doanh\n• 🏢 Tạo Hóa đơn phải trả - Chi phí từ nhà cung cấp\n• 💳 Ghi nhận Thanh toán - Thu tiền từ khách hàng\n\nMỗi nút sẽ đưa bạn trực tiếp đến form tạo tài liệu tương ứng.',
    target: '[data-tour="quick-actions"]',
    position: 'top',
    action: 'Thử click vào một trong các nút để tạo tài liệu mới',
    highlight: true
  },
  {
    id: 'dashboard-stats',
    title: '📈 Thống kê tổng quan',
    description: 'Các thẻ thống kê hiển thị các chỉ số quan trọng:\n\n• 💰 Tổng doanh thu - Tổng số tiền thu được\n• 💸 Tổng chi phí - Tổng số tiền đã chi\n• 📊 Lợi nhuận - Chênh lệch giữa doanh thu và chi phí\n• 📁 Số dự án - Tổng số dự án đang thực hiện\n• 👥 Số khách hàng - Tổng số khách hàng\n• 📋 Số hóa đơn - Tổng số hóa đơn đã tạo\n\nDữ liệu được cập nhật real-time và hiển thị theo thời gian thực.',
    target: '[data-tour="stats-cards"]',
    position: 'top',
    action: 'Theo dõi hiệu suất kinh doanh của bạn',
    highlight: true
  },
  {
    id: 'dashboard-refresh',
    title: '🔄 Làm mới dữ liệu',
    description: 'Nút "Làm mới" giúp bạn cập nhật dữ liệu mới nhất:\n\n• Tự động làm mới mỗi 30 giây\n• Cập nhật thống kê real-time\n• Đồng bộ dữ liệu từ database\n• Hiển thị thời gian cập nhật cuối\n\nBạn có thể tắt/bật chế độ tự động làm mới bằng nút "Tự động/Thủ công".',
    target: '[data-tour="refresh-button"]',
    position: 'left',
    action: 'Click để làm mới dữ liệu ngay bây giờ',
    highlight: true
  },
  {
    id: 'dashboard-controls',
    title: '🎛️ Bảng điều khiển',
    description: 'Các nút điều khiển giúp bạn:\n\n• 🔄 Làm mới - Cập nhật dữ liệu thủ công\n• ⚡ Tự động/Thủ công - Chuyển đổi chế độ làm mới\n• 🎯 Hướng dẫn - Xem tour hướng dẫn này\n• 🆘 Hỗ trợ - Truy cập trung tâm hỗ trợ\n• 🐛 Debug - Kiểm tra thông tin hệ thống\n\nMỗi nút có chức năng riêng để hỗ trợ bạn sử dụng hệ thống hiệu quả.',
    target: '[data-tour="dashboard-controls"]',
    position: 'right',
    action: 'Khám phá các nút điều khiển',
    highlight: true
  },
  {
    id: 'dashboard-navigation',
    title: '🧭 Menu điều hướng',
    description: 'Menu bên trái cung cấp truy cập đến tất cả chức năng:\n\n• 📊 Dashboard - Trang hiện tại\n• 📁 Dự án - Quản lý dự án\n• 💰 Chi phí - Quản lý chi phí\n• 👥 Khách hàng - Quản lý khách hàng\n• 📈 Báo cáo - Xem báo cáo tài chính\n• 🤖 AI Assistant - Trí tuệ nhân tạo\n• 🆘 Hỗ trợ - Trung tâm hỗ trợ\n\nClick vào bất kỳ mục nào để chuyển đến trang tương ứng.',
    target: '[data-tour="sidebar-nav"]',
    position: 'right',
    action: 'Khám phá các chức năng khác trong menu',
    highlight: true
  }
]

// Projects Tour Steps
export const projectsTourSteps: TourStep[] = [
  {
    id: 'projects-header',
    title: 'Quản lý Dự án',
    description: 'Trang này giúp bạn quản lý tất cả các dự án, từ tạo mới đến theo dõi tiến độ và ngân sách.',
    target: '[data-tour="projects-header"]',
    position: 'bottom',
    action: 'Bắt đầu quản lý dự án của bạn'
  },
  {
    id: 'projects-create',
    title: 'Tạo dự án mới',
    description: 'Click nút "Tạo dự án" để thêm dự án mới với thông tin chi tiết về ngân sách, thời gian và nhóm làm việc.',
    target: '[data-tour="create-project-btn"]',
    position: 'bottom',
    action: 'Thử tạo dự án đầu tiên của bạn'
  },
  {
    id: 'projects-list',
    title: 'Danh sách dự án',
    description: 'Xem tất cả dự án với trạng thái, tiến độ và ngân sách. Click vào dự án để xem chi tiết.',
    target: '[data-tour="projects-list"]',
    position: 'top',
    action: 'Khám phá các dự án hiện có'
  },
  {
    id: 'projects-filters',
    title: 'Bộ lọc và tìm kiếm',
    description: 'Sử dụng bộ lọc để tìm dự án theo trạng thái, người quản lý hoặc thời gian. Tìm kiếm nhanh bằng từ khóa.',
    target: '[data-tour="projects-filters"]',
    position: 'bottom',
    action: 'Thử lọc dự án theo trạng thái'
  }
]

// Expenses Tour Steps
export const expensesTourSteps: TourStep[] = [
  {
    id: 'expenses-header',
    title: 'Quản lý Chi phí',
    description: 'Trang này giúp bạn theo dõi và quản lý tất cả các khoản chi phí của doanh nghiệp.',
    target: '[data-tour="expenses-header"]',
    position: 'bottom',
    action: 'Bắt đầu quản lý chi phí hiệu quả'
  },
  {
    id: 'expenses-create',
    title: 'Tạo chi phí mới',
    description: 'Click "Tạo chi phí" để thêm khoản chi phí mới. Bạn có thể upload hóa đơn và phân loại chi phí.',
    target: '[data-tour="create-expense-btn"]',
    position: 'bottom',
    action: 'Thử tạo chi phí đầu tiên'
  },
  {
    id: 'expenses-categories',
    title: 'Phân loại chi phí',
    description: 'Chi phí được phân loại theo danh mục như Văn phòng, Marketing, Vận chuyển... để dễ quản lý.',
    target: '[data-tour="expense-categories"]',
    position: 'top',
    action: 'Xem các danh mục chi phí có sẵn'
  },
  {
    id: 'expenses-approval',
    title: 'Phê duyệt chi phí',
    description: 'Các chi phí cần được phê duyệt trước khi thanh toán. Xem danh sách chờ phê duyệt ở đây.',
    target: '[data-tour="expenses-approval"]',
    position: 'left',
    action: 'Kiểm tra các chi phí chờ phê duyệt'
  }
]

// Customers Tour Steps
export const customersTourSteps: TourStep[] = [
  {
    id: 'customers-header',
    title: 'Quản lý Khách hàng',
    description: 'Trang này giúp bạn quản lý thông tin khách hàng, lịch sử giao dịch và mối quan hệ kinh doanh.',
    target: '[data-tour="customers-header"]',
    position: 'bottom',
    action: 'Bắt đầu quản lý khách hàng'
  },
  {
    id: 'customers-create',
    title: 'Thêm khách hàng mới',
    description: 'Click "Thêm khách hàng" để tạo hồ sơ khách hàng mới với thông tin liên hệ và công ty.',
    target: '[data-tour="create-customer-btn"]',
    position: 'bottom',
    action: 'Thử thêm khách hàng đầu tiên'
  },
  {
    id: 'customers-list',
    title: 'Danh sách khách hàng',
    description: 'Xem tất cả khách hàng với thông tin cơ bản. Click vào khách hàng để xem chi tiết và lịch sử.',
    target: '[data-tour="customers-list"]',
    position: 'top',
    action: 'Khám phá danh sách khách hàng'
  },
  {
    id: 'customers-projects',
    title: 'Dự án của khách hàng',
    description: 'Xem các dự án liên quan đến từng khách hàng để hiểu rõ mối quan hệ kinh doanh.',
    target: '[data-tour="customer-projects"]',
    position: 'right',
    action: 'Xem dự án của khách hàng'
  }
]

// Reports Tour Steps
export const reportsTourSteps: TourStep[] = [
  {
    id: 'reports-header',
    title: 'Báo cáo & Phân tích',
    description: 'Trang này cung cấp các báo cáo chi tiết về tài chính, hiệu suất dự án và phân tích kinh doanh.',
    target: '[data-tour="reports-header"]',
    position: 'bottom',
    action: 'Khám phá các báo cáo tài chính'
  },
  {
    id: 'reports-financial',
    title: 'Báo cáo tài chính',
    description: 'Xem báo cáo lãi lỗ, bảng cân đối kế toán và dòng tiền để hiểu tình hình tài chính.',
    target: '[data-tour="financial-reports"]',
    position: 'top',
    action: 'Xem báo cáo tài chính tổng quan'
  },
  {
    id: 'reports-project',
    title: 'Báo cáo dự án',
    description: 'Theo dõi hiệu suất dự án, chi phí thực tế vs ngân sách và tiến độ hoàn thành.',
    target: '[data-tour="project-reports"]',
    position: 'left',
    action: 'Phân tích hiệu suất dự án'
  },
  {
    id: 'reports-export',
    title: 'Xuất báo cáo',
    description: 'Xuất báo cáo ra file PDF hoặc Excel để chia sẻ với đối tác hoặc lưu trữ.',
    target: '[data-tour="export-reports"]',
    position: 'right',
    action: 'Thử xuất báo cáo ra file'
  }
]

// AI Assistant Tour Steps
export const aiAssistantTourSteps: TourStep[] = [
  {
    id: 'ai-overview',
    title: 'AI Assistant',
    description: 'Trí tuệ nhân tạo giúp bạn phân tích chi phí, dự đoán xu hướng và tối ưu hóa ngân sách.',
    target: '[data-tour="ai-header"]',
    position: 'bottom',
    action: 'Khám phá sức mạnh của AI'
  },
  {
    id: 'ai-analysis',
    title: 'Phân tích thông minh',
    description: 'AI tự động phân tích dữ liệu chi phí và đưa ra insights có giá trị cho quyết định kinh doanh.',
    target: '[data-tour="ai-analysis"]',
    position: 'top',
    action: 'Xem phân tích AI về chi phí'
  },
  {
    id: 'ai-predictions',
    title: 'Dự đoán xu hướng',
    description: 'AI dự báo chi phí tương lai dựa trên dữ liệu lịch sử và xu hướng thị trường.',
    target: '[data-tour="ai-predictions"]',
    position: 'left',
    action: 'Xem dự đoán chi phí tương lai'
  },
  {
    id: 'ai-optimization',
    title: 'Tối ưu hóa ngân sách',
    description: 'AI đề xuất cách phân bổ ngân sách hiệu quả và tiết kiệm chi phí.',
    target: '[data-tour="ai-optimization"]',
    position: 'right',
    action: 'Nhận gợi ý tối ưu hóa từ AI'
  }
]

// Tour configuration for different pages
export const tourConfigs = {
  dashboard: {
    id: 'dashboard-tour',
    steps: dashboardTourSteps,
    title: 'Hướng dẫn Dashboard'
  },
  projects: {
    id: 'projects-tour',
    steps: projectsTourSteps,
    title: 'Hướng dẫn Quản lý Dự án'
  },
  expenses: {
    id: 'expenses-tour',
    steps: expensesTourSteps,
    title: 'Hướng dẫn Quản lý Chi phí'
  },
  customers: {
    id: 'customers-tour',
    steps: customersTourSteps,
    title: 'Hướng dẫn Quản lý Khách hàng'
  },
  reports: {
    id: 'reports-tour',
    steps: reportsTourSteps,
    title: 'Hướng dẫn Báo cáo'
  },
  aiAssistant: {
    id: 'ai-assistant-tour',
    steps: aiAssistantTourSteps,
    title: 'Hướng dẫn AI Assistant'
  }
}
