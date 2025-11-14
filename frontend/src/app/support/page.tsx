'use client'

import React from 'react'
import { Users, FolderOpen, Receipt, FileText, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SupportPage() {
  const router = useRouter()

  const guides = [
    {
      title: '1) Tạo khách hàng',
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      steps: [
        "Mở menu 'Khách hàng'",
        "Bấm 'Thêm khách hàng'",
        "Nhập thông tin: Tên, Mã, SĐT, Địa chỉ",
        "Lưu để tạo khách hàng mới"
      ],
      cta: { label: 'Đi tới Khách hàng', href: '/customers' }
    },
    {
      title: '2) Tạo dự án',
      icon: FolderOpen,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      steps: [
        "Mở menu 'Dự án'",
        "Bấm 'Tạo dự án mới'",
        "Chọn khách hàng liên quan",
        "Điền thông tin dự án và Lưu"
      ],
      cta: { label: 'Đi tới Dự án', href: '/projects' }
    },
    {
      title: '3) Báo giá → Duyệt hoá đơn',
      icon: FileText,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      steps: [
        "Mở 'Bán hàng & Báo giá'",
        "Tạo báo giá cho dự án/khách hàng",
        "Gửi và duyệt báo giá",
        "Chuyển báo giá thành hoá đơn khi được duyệt"
      ],
      cta: { label: 'Đi tới Bán hàng', href: '/sales' }
    },
    {
      title: '4) Chi phí kế hoạch → Duyệt chi phí thực tế',
      icon: Receipt,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      steps: [
        "Mở 'Chi phí & Ngân sách'",
        "Tạo chi phí kế hoạch theo hạng mục",
        "Ghi nhận chi phí thực tế (có hoá đơn nếu có)",
        "Thực hiện quy trình duyệt chi phí thực tế"
      ],
      cta: { label: 'Đi tới Chi phí', href: '/expenses' }
    },
    {
      title: '5) Báo cáo dự án',
      icon: FileText,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      steps: [
        "Mở 'Báo cáo & Phân tích'",
        "Chọn báo cáo dự án cần xem",
        "Lọc theo khách hàng/dự án/thời gian",
        "Xuất báo cáo khi cần (PDF/Excel)"
      ],
      cta: { label: 'Đi tới Báo cáo', href: '/reports' }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((g, idx) => {
            const Icon = g.icon
            return (
              <div key={idx} className={`bg-white border rounded-xl shadow-sm ${g.color.split(' ').includes('border-') ? '' : ''} border-gray-200`}>
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${g.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-900">{g.title}</div>
                    </div>
                  </div>

                  <ol className="space-y-2">
                    {g.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                          {i + 1}
                        </span>
                        <span className="leading-5">{s}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-4">
                    <button
                      onClick={() => router.push(g.cta.href)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white"
                    >
                      {g.cta.label}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Note */}
        <div className="mt-8 flex items-center gap-2 text-gray-700 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Các bước được sắp xếp theo trình tự làm việc: Khách hàng → Dự án → Bán hàng → Chi phí → Báo cáo.</span>
        </div>
      </div>
    </div>
  )
}