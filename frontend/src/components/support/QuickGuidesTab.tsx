'use client'

import React from 'react'
import { Clock, CheckCircle } from 'lucide-react'

const quickGuides = [
  {
    id: 'getting-started',
    title: 'Bắt đầu sử dụng hệ thống',
    description: 'Hướng dẫn cơ bản để bắt đầu',
    steps: [
      'Thiết lập tài khoản và phân quyền',
      'Cấu hình thông tin công ty',
      'Thiết lập ngân sách cơ bản',
      'Tạo dữ liệu mẫu để làm quen'
    ],
    estimatedTime: '15 phút'
  },
  {
    id: 'first-sale',
    title: 'Thực hiện giao dịch bán hàng đầu tiên',
    description: 'Từ tạo hóa đơn đến thu tiền',
    steps: [
      'Tạo khách hàng mới',
      'Tạo hóa đơn bán hàng',
      'Ghi nhận thanh toán',
      'Xem báo cáo doanh thu'
    ],
    estimatedTime: '10 phút'
  },
  {
    id: 'first-expense',
    title: 'Ghi nhận chi phí đầu tiên',
    description: 'Từ tạo chi phí đến phê duyệt',
    steps: [
      'Tạo chi phí mới',
      'Đính kèm chứng từ',
      'Gửi phê duyệt',
      'Theo dõi trạng thái'
    ],
    estimatedTime: '8 phút'
  }
]

export default function QuickGuidesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Hướng dẫn Nhanh</h3>
        <p className="text-black mb-6">
          Các bước cơ bản để bắt đầu sử dụng hệ thống
        </p>
      </div>

      <div className="space-y-6">
        {quickGuides.map((guide) => (
          <div key={guide.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{guide.title}</h4>
                <p className="text-black text-sm mb-4">{guide.description}</p>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Các bước thực hiện:</h5>
                  <ol className="space-y-1">
                    {guide.steps.map((step, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-black">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="text-sm text-black mb-2">Thời gian ước tính:</div>
                <div className="text-sm font-medium text-blue-600 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {guide.estimatedTime}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Mẹo sử dụng
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Bắt đầu với dữ liệu mẫu để làm quen với hệ thống</li>
          <li>• Sử dụng hướng dẫn từng bước cho từng chức năng</li>
          <li>• Xem video minh họa để hiểu rõ hơn</li>
          <li>• Liên hệ hỗ trợ nếu gặp khó khăn</li>
        </ul>
      </div>
    </div>
  )
}
