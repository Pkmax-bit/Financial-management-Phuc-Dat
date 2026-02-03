'use client'

import React from 'react'
import { 
  DollarSign,
  Receipt,
  Users,
  Target,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface SupportModulesTabProps {
  searchTerm: string
  onCreateGuide?: () => void
}

const modules = [
  {
    id: 'sales',
    name: 'Bán hàng',
    icon: DollarSign,
    color: 'blue',
    description: 'Quản lý bán hàng, hóa đơn, thanh toán',
    guides: [
      { title: 'Tổng quan Bán hàng', url: '/sales/guide' },
      { title: 'Hướng dẫn Tạo Đơn hàng', url: '/sales/guide#invoices' },
      { title: 'Quản lý Thanh toán', url: '/sales/guide#payments' },
      { title: 'Báo cáo Doanh thu', url: '/sales/guide#reports' },
      { title: 'Quản lý Khách hàng', url: '/sales/guide#customers' },
      { title: 'Tạo Báo giá', url: '/sales/guide#quotes' },
      { title: 'Phiếu Thu Bán hàng', url: '/sales/guide#receipts' },
      { title: 'Credit Memo', url: '/sales/guide#credit-memos' }
    ],
    quickActions: [
      { title: 'Tạo hóa đơn mới', action: 'create-invoice' },
      { title: 'Xem báo cáo doanh thu', action: 'view-reports' },
      { title: 'Quản lý khách hàng', action: 'manage-customers' }
    ],
    features: [
      'Tạo và quản lý hóa đơn bán hàng',
      'Theo dõi thanh toán từ khách hàng',
      'Quản lý thông tin khách hàng',
      'Tạo báo giá và chuyển đổi thành hóa đơn',
      'Xử lý phiếu thu bán hàng',
      'Quản lý credit memo và hoàn tiền',
      'Báo cáo doanh thu chi tiết'
    ]
  },
  {
    id: 'expenses',
    name: 'Chi phí',
    icon: Receipt,
    color: 'orange',
    description: 'Quản lý chi phí, ngân sách, nhà cung cấp',
    guides: [
      { title: 'Tổng quan Chi phí', url: '/expenses/guide' },
      { title: 'Quản lý Ngân sách', url: '/expenses/guide#budgeting' },
      { title: 'Đơn hàng Nhà cung cấp', url: '/expenses/guide#bills' },
      { title: 'Đề nghị Hoàn ứng', url: '/expenses/guide#expense-claims' },
      { title: 'Đơn Đặt Hàng', url: '/expenses/guide#purchase-orders' },
      { title: 'Quản lý Nhà cung cấp', url: '/expenses/guide#vendors' },
      { title: 'Chi phí Trực tiếp', url: '/expenses/guide#direct-expenses' }
    ],
    quickActions: [
      { title: 'Tạo chi phí mới', action: 'create-expense' },
      { title: 'Thiết lập ngân sách', action: 'create-budget' },
      { title: 'Quản lý nhà cung cấp', action: 'manage-vendors' }
    ],
    features: [
      'Ghi nhận và quản lý chi phí',
      'Thiết lập và theo dõi ngân sách',
      'Quản lý hóa đơn nhà cung cấp',
      'Xử lý đề nghị hoàn ứng nhân viên',
      'Tạo đơn đặt hàng và phê duyệt',
      'Quản lý thông tin nhà cung cấp',
      'Báo cáo chi phí chi tiết'
    ]
  },
  {
    id: 'employees',
    name: 'Nhân sự',
    icon: Users,
    color: 'green',
    description: 'Quản lý nhân viên, phòng ban, chức vụ',
    guides: [
      { title: 'Tổng quan Nhân sự', url: '/employees/guide' },
      { title: 'Quản lý Nhân viên', url: '/employees/guide#employees' },
      { title: 'Phòng ban & Chức vụ', url: '/employees/guide#departments' },
      { title: 'Báo cáo Nhân sự', url: '/employees/guide#reports' }
    ],
    quickActions: [
      { title: 'Thêm nhân viên mới', action: 'create-employee' },
      { title: 'Quản lý phòng ban', action: 'manage-departments' },
      { title: 'Xem báo cáo nhân sự', action: 'view-reports' }
    ]
  },
  {
    id: 'projects',
    name: 'Dự án',
    icon: Target,
    color: 'purple',
    description: 'Quản lý dự án, nhiệm vụ, tiến độ',
    guides: [
      { title: 'Tổng quan Dự án', url: '/projects/guide' },
      { title: 'Tạo Dự án mới', url: '/projects/guide#create-project' },
      { title: 'Quản lý Nhiệm vụ', url: '/projects/guide#tasks' },
      { title: 'Theo dõi Tiến độ', url: '/projects/guide#progress' }
    ],
    quickActions: [
      { title: 'Tạo dự án mới', action: 'create-project' },
      { title: 'Thêm nhiệm vụ', action: 'create-task' },
      { title: 'Xem tiến độ dự án', action: 'view-progress' }
    ]
  }
]

export default function SupportModulesTab({ searchTerm, onCreateGuide }: SupportModulesTabProps) {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      orange: 'bg-orange-100 text-orange-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-black'
  }

  const handleQuickAction = (action: string) => {
    // Handle quick actions
    console.log('Quick action:', action)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Hướng dẫn theo Module</h3>
        <p className="text-black mb-6">
          Chọn module bạn muốn tìm hiểu để xem hướng dẫn chi tiết
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <div key={module.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${getColorClasses(module.color)}`}>
                <module.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{module.name}</h4>
                <p className="text-black text-sm mb-4">{module.description}</p>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Hướng dẫn:</h5>
                  {module.guides.map((guide, index) => (
                    <Link
                      key={index}
                      href={guide.url}
                      className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      • {guide.title}
                    </Link>
                  ))}
                </div>

                {module.features && (
                  <div className="mt-4 space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Tính năng chính:</h5>
                    <ul className="space-y-1">
                      {module.features.map((feature, index) => (
                        <li key={index} className="text-sm text-black flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Thao tác nhanh:</h5>
                  <div className="flex flex-wrap gap-2">
                    {module.quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.action)}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        {action.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Truy cập Nhanh</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/sales"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Bán hàng</p>
              <p className="text-xs text-black">Đơn hàng & Thanh toán</p>
            </div>
          </Link>
          
          <Link
            href="/expenses"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-orange-100 rounded-lg">
              <Receipt className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Chi phí</p>
              <p className="text-xs text-black">Ngân sách & NCC</p>
            </div>
          </Link>
          
          <Link
            href="/employees"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Nhân sự</p>
              <p className="text-xs text-black">Quản lý nhân viên</p>
            </div>
          </Link>
          
          <Link
            href="/projects"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Dự án</p>
              <p className="text-xs text-black">Nhiệm vụ & Tiến độ</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
