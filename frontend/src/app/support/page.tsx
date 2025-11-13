'use client'

import React from 'react'
import {
  Users,
  FolderOpen,
  Receipt,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
  Repeat,
  Package,
  SlidersHorizontal,
  ClipboardList,
  Calculator,
  PieChart,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SupportPage() {
  const router = useRouter()

  type GuideItem = {
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    steps: string[]
    cta: { label: string; href: string; tour?: string }
  }

  const guideSections: Array<{
    title: string
    description: string
    guides: GuideItem[]
  }> = [
    {
      title: 'Khách hàng & Dự án',
      description: 'Thiết lập dữ liệu nền tảng với tour từng trường thông tin.',
      guides: [
        {
          title: 'Tạo khách hàng mới',
          description: 'Tour chi tiết từng trường: mã tự động, loại khách hàng, thông tin liên hệ, thuế và ghi chú.',
          icon: Users,
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          steps: [
            'Mở trang "Khách hàng" và nhấn nút "Tạo khách hàng".',
            'Tour tự động hướng dẫn từng trường: Mã khách hàng, Loại, Tên, Email, Điện thoại, Địa chỉ, Mã số thuế.',
            'Bổ sung hạn mức tín dụng, nhân viên phụ trách và ghi chú nếu cần.',
            'Nhấn "Tạo khách hàng" để lưu và xem chi tiết.'
          ],
          cta: { label: 'Mở Khách hàng', href: '/customers', tour: 'customers' }
        },
        {
          title: 'Tạo dự án',
          description: 'Tour từng bước: mã dự án, khách hàng, đội ngũ, ngân sách, tiến độ và thời gian.',
          icon: FolderOpen,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          steps: [
            'Đi tới trang "Dự án" và chọn "Tạo dự án mới".',
            'Tour giới thiệu từng trường: Mã dự án, Tên, Khách hàng, Đội ngũ, Ngân sách, Trạng thái, Tiến độ.',
            'Chọn ngày bắt đầu, ngày kết thúc dự kiến và mô tả chi tiết.',
            'Lưu để khởi tạo dự án và theo dõi trong bảng dự án.'
          ],
          cta: { label: 'Mở Dự án', href: '/projects', tour: 'projects' }
        }
      ]
    },
    {
      title: 'Bán hàng & Báo giá',
      description: 'Quy trình báo giá, hóa đơn và email với tour tự động.',
      guides: [
        {
          title: 'Tạo báo giá chi tiết',
          description: 'Tour hướng dẫn từng phần: thông tin cơ bản, sản phẩm, diện tích & quy tắc điều chỉnh.',
          icon: FileText,
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          steps: [
            'Tại trang "Bán hàng", nhấn "Tạo báo giá".',
            'Tour giải thích thông tin cơ bản: khách hàng, dự án, mô tả, điều khoản.',
            'Thêm sản phẩm, chọn từ danh sách, áp dụng quy tắc điều chỉnh vật tư và kiểm tra tổng tiền.',
            'Xem cảnh báo chi phí, thuế và lưu báo giá.'
          ],
          cta: { label: 'Tạo báo giá chi tiết', href: '/sales?tab=quotes&action=create-quote-tour' }
        },
        {
          title: 'Các nút thao tác báo giá',
          description: 'Tour về danh sách báo giá: xem chi tiết, chỉnh sửa, gửi email, chuyển hóa đơn, xóa.',
          icon: Repeat,
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          steps: [
            'Trong tab "Báo giá", mở "Hướng dẫn chuyển đổi".',
            'Tour giới thiệu phân vùng danh sách, trạng thái và bộ lọc.',
            'Từng nút thao tác được giải thích: Xem, Chỉnh sửa, Gửi email, Chuyển hóa đơn, Xóa.',
            'Hiểu điều kiện hiển thị & quyền sử dụng từng nút trước khi thao tác.'
          ],
          cta: { label: 'Xem Báo giá', href: '/sales', tour: 'quote-actions' }
        },
        {
          title: 'Tạo hóa đơn',
          description: 'Tour tương tự báo giá nhưng tập trung vào công nợ, lịch thanh toán và thuế.',
          icon: Receipt,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          steps: [
            'Từ trang "Bán hàng", nhấn "Tạo hóa đơn".',
            'Tour giải thích thông tin chính: khách hàng, dự án, mã hóa đơn, ngày lập, điều khoản thanh toán.',
            'Thêm sản phẩm/vật tư, xem tính thuế, tổng tiền và cảnh báo công nợ.',
            'Lưu hóa đơn để xuất bản hoặc gửi cho khách hàng.'
          ],
          cta: { label: 'Mở Hóa đơn', href: '/sales', tour: 'invoice-form' }
        },
        {
          title: 'Soạn & gửi email báo giá/hóa đơn',
          description: 'Tour modal email: mẫu nội dung, điều khoản thanh toán, ghi chú, file đính kèm và gửi.',
          icon: Mail,
          color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          steps: [
            'Trong báo giá/hóa đơn, chọn "Gửi email".',
            'Tour giới thiệu bản xem trước, chỉnh sửa tiêu đề, nội dung và điều khoản.',
            'Cập nhật thông tin công ty, ngân hàng, đính kèm file và lưu mẫu.',
            'Gửi email trực tiếp cho khách hàng và xem trạng thái gửi.'
          ],
          cta: { label: 'Soạn Email', href: '/sales', tour: 'email-modal' }
        }
      ]
    },
    {
      title: 'Sản phẩm & Quy tắc vật tư',
      description: 'Tạo catalog sản phẩm và quy tắc điều chỉnh vật tư tự động.',
      guides: [
        {
          title: 'Tạo sản phẩm',
          description: 'Tour giải thích thông tin chung, kích thước, cấu thành vật tư và giá tham chiếu.',
          icon: Package,
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          steps: [
            'Mở trang "Bán hàng" và vào mục Sản phẩm.',
            'Tour hướng dẫn các trường: Mã, Tên, Đơn vị, Giá chuẩn.',
            'Thiết lập kích thước (dài, rộng, cao) và cách tính diện tích/thể tích.',
            'Thêm vật tư cấu thành với tỷ lệ và lưu sản phẩm.'
          ],
          cta: { label: 'Quản lý Sản phẩm', href: '/sales', tour: 'product-form' }
        },
        {
          title: 'Quy tắc điều chỉnh vật tư',
          description: 'Tour bảng quy tắc: đối tượng chi phí, loại điều chỉnh, giới hạn và ưu tiên.',
          icon: SlidersHorizontal,
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          steps: [
            'Đi tới mục "Quy tắc vật tư" trong trang Bán hàng.',
            'Tour giới thiệu từng cột: Đối tượng, Loại vật tư, Chiều đo, Kiểu thay đổi, Giá trị.',
            'Thiết lập giới hạn %, giá trị tuyệt đối và độ ưu tiên áp dụng.',
            'Lưu quy tắc và kiểm tra áp dụng trong tour tạo báo giá.'
          ],
          cta: { label: 'Thiết lập Quy tắc', href: '/sales', tour: 'material-rules' }
        }
      ]
    },
    {
      title: 'Chi phí & Ngân sách',
      description: 'Kiểm soát kế hoạch, thực tế và quy trình duyệt chi phí.',
      guides: [
        {
          title: 'Tạo chi phí kế hoạch',
          description: 'Tour từng trường: dự án, phân cấp chi phí, loại chi phí, ngày và mô tả.',
          icon: ClipboardList,
          color: 'bg-orange-50 text-orange-700 border-orange-200',
          steps: [
            'Mở trang "Chi phí" và chọn "Tạo chi phí kế hoạch".',
            'Tour hướng dẫn các trường cơ bản: Dự án, Nhân viên, Chi phí cha, Loại chi phí, Ngày ghi nhận.',
            'Thêm đối tượng chi phí, vật tư và số lượng dự kiến.',
            'Kiểm tra cảnh báo màu (đỏ/vàng/xanh) và lưu kế hoạch.'
          ],
          cta: { label: 'Chi phí kế hoạch', href: '/expenses', tour: 'planned-expense' }
        },
        {
          title: 'Tạo chi phí thực tế',
          description: 'Tour cho biểu mẫu thực tế: dự án, cập nhật chi phí hiện hữu, phân cấp và diễn giải.',
          icon: Calculator,
          color: 'bg-lime-50 text-lime-700 border-lime-200',
          steps: [
            'Trong trang "Chi phí", chọn "Tạo chi phí thực tế".',
            'Tour giải thích trường: Dự án, Nhân viên, Chi phí cha, Ngày phát sinh, Vai trò, Mô tả.',
            'Nhập vật tư, đơn giá, diện tích, số lượng để hệ thống tính "Tổng thành tiền".',
            'Lưu chi phí, xem cảnh báo vượt ngân sách theo màu sắc.'
          ],
          cta: { label: 'Chi phí thực tế', href: '/expenses', tour: 'actual-expense' }
        },
        {
          title: 'Duyệt chi phí kế hoạch',
          description: 'Tour danh sách chi phí với nút duyệt → tạo chi phí thực tế ở trạng thái chờ.',
          icon: CheckCircle,
          color: 'bg-green-50 text-green-700 border-green-200',
          steps: [
            'Trong tab "Chi phí kế hoạch", bật "Hướng dẫn duyệt".',
            'Tour giới thiệu bộ lọc, cảnh báo và nút "Duyệt" cho từng chi phí.',
            'Xác nhận tạo chi phí thực tế từ kế hoạch với trạng thái "Chưa duyệt".',
            'Theo dõi kết quả chuyển đổi và cập nhật lại khi cần.'
          ],
          cta: { label: 'Duyệt chi phí', href: '/expenses', tour: 'approve-expense' }
        }
      ]
    },
    {
      title: 'Báo cáo & Phân tích',
      description: 'Tour cho bảng tổng hợp và phân tích chi tiết dự án.',
      guides: [
        {
          title: 'Báo cáo dự án tổng hợp',
          description: 'Tour danh sách dự án: thẻ số liệu, bộ lọc, nút tải Excel và bảng kết quả.',
          icon: BarChart3,
          color: 'bg-teal-50 text-teal-700 border-teal-200',
          steps: [
            'Mở "Báo cáo" → "Hiệu quả dự án".',
            'Tour giới thiệu thẻ tổng quan (Tổng dự án, Doanh thu, Chi phí, Lợi nhuận).',
            'Sử dụng bộ lọc tìm kiếm, trạng thái, năm/tháng và tải Excel.',
            'Xem bảng dự án, nhấn "Xem chi tiết" để mở tour phân tích sâu.'
          ],
          cta: { label: 'Báo cáo dự án', href: '/reports/projects-detailed', tour: 'reports' }
        },
        {
          title: 'Báo cáo chi tiết dự án',
          description: 'Tour từng phần: thẻ tóm tắt, kế hoạch vs thực tế, biểu đồ, danh sách chi phí.',
          icon: PieChart,
          color: 'bg-sky-50 text-sky-700 border-sky-200',
          steps: [
            'Từ báo cáo tổng hợp, nhấn "Xem chi tiết" một dự án.',
            'Tour trình bày thẻ tổng quan (Báo giá, Hóa đơn, Chi phí, Lợi nhuận).',
            'So sánh Kế hoạch vs Thực tế, xem biểu đồ Doanh thu–Chi phí–Lợi nhuận và theo đối tượng chi phí.',
            'Duyệt bảng chi tiết chi phí kế hoạch/thực tế và ghi chú phân tích.'
          ],
          cta: { label: 'Phân tích dự án', href: '/reports/projects-detailed', tour: 'report-detail' }
        }
      ]
    }
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trung tâm Hỗ trợ</h1>
              <p className="text-gray-700 mt-2 max-w-3xl">
                Hướng dẫn triển khai theo quy trình thực tế, giúp bạn thao tác nhanh và chính xác.
              </p>
            </div>
            <div className="pt-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Về Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {guideSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-10">
            <div className="flex items-start justify-between flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.guides.map((guide, guideIdx) => {
                const Icon = guide.icon
                const handleNavigate = () => {
                  const hasTour = guide.cta.tour
                  if (hasTour) {
                    const url = new URL(guide.cta.href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
                    url.searchParams.set('tour', hasTour)
                    router.push(url.pathname + url.search + url.hash)
                  } else {
                    router.push(guide.cta.href)
                  }
                }
                return (
                  <div key={guideIdx} className="bg-white border border-gray-200 rounded-xl shadow-sm h-full">
                    <div className="p-5 flex flex-col h-full">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${guide.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-gray-900">{guide.title}</div>
                          <p className="text-sm text-gray-600 mt-1">{guide.description}</p>
                        </div>
                      </div>

                      <ol className="mt-4 space-y-2 text-sm text-gray-800 flex-1">
                        {guide.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex items-start gap-2 leading-5">
                            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                              {stepIdx + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>

                      <div className="mt-4">
                        <button
                          onClick={handleNavigate}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors"
                        >
                          {guide.cta.label}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Note */}
        <div className="mt-8 flex items-center gap-2 text-gray-700 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Tất cả hướng dẫn đều có tour Shepherd.js tương ứng trong ứng dụng. Mở từng trang và nhấn nút "Hướng dẫn" để xem trực tiếp.</span>
        </div>
      </div>
    </div>
  )
}