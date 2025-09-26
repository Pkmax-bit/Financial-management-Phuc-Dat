'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  FileText,
  Receipt,
  Users,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react'

interface OverviewTabProps {
  quotesStats: any
  invoicesStats: any
  revenue: any
}

export default function OverviewTab({ quotesStats, invoicesStats, revenue }: OverviewTabProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Calculate income tracker data (QuickBooks style)
  const uninvoicedActivity = revenue.uninvoiced || 0 // Các hoạt động chưa lập hóa đơn
  const unpaidInvoices = revenue.pending || 0 // Hóa đơn chưa thanh toán
  const overdueAmount = revenue.overdue || 0 // Hóa đơn quá hạn
  const recentlyPaid = revenue.paid || 0 // Đã thanh toán trong 30 ngày qua
  
  // Calculate total pipeline
  const totalPipeline = uninvoicedActivity + unpaidInvoices

  // Shortcuts data
  const shortcuts = [
    {
      title: 'Tạo hóa đơn',
      description: 'Xuất hóa đơn cho khách hàng',
      icon: FileText,
      color: 'bg-blue-500',
      onClick: () => console.log('Create invoice')
    },
    {
      title: 'Tạo báo giá',
      description: 'Gửi báo giá cho khách hàng',
      icon: Receipt,
      color: 'bg-green-500',
      onClick: () => console.log('Create quote')
    },
    {
      title: 'Ghi nhận thanh toán',
      description: 'Cập nhật thanh toán từ khách hàng',
      icon: DollarSign,
      color: 'bg-purple-500',
      onClick: () => console.log('Create payment')
    },
    {
      title: 'Tạo phiếu bán hàng',
      description: 'Bán hàng và thu tiền ngay',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      onClick: () => console.log('Create sales receipt')
    }
  ]

  return (
    <div className="space-y-6">
      {/* Income Tracker - QuickBooks Style */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Thanh theo dõi thu nhập (Income Tracker)</h3>
        
        {/* Income Flow Visualization */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Dòng chảy thu nhập (Income Pipeline)</span>
            <span className="text-sm font-medium text-gray-900">
              Tổng: {formatCurrency(uninvoicedActivity + unpaidInvoices + recentlyPaid)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-8 mb-4">
            <div className="flex h-8 rounded-full overflow-hidden">
              <div 
                className="bg-yellow-500 flex items-center justify-center"
                style={{ width: `${(uninvoicedActivity / (uninvoicedActivity + unpaidInvoices + recentlyPaid)) * 100 || 0}%` }}
              >
                {uninvoicedActivity > 0 && (
                  <span className="text-xs text-white font-medium">
                    {((uninvoicedActivity / (uninvoicedActivity + unpaidInvoices + recentlyPaid)) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <div 
                className="bg-orange-500 flex items-center justify-center"
                style={{ width: `${(unpaidInvoices / (uninvoicedActivity + unpaidInvoices + recentlyPaid)) * 100 || 0}%` }}
              >
                {unpaidInvoices > 0 && (
                  <span className="text-xs text-white font-medium">
                    {((unpaidInvoices / (uninvoicedActivity + unpaidInvoices + recentlyPaid)) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <div 
                className="bg-green-500 flex items-center justify-center"
                style={{ width: `${(recentlyPaid / (uninvoicedActivity + unpaidInvoices + recentlyPaid)) * 100 || 0}%` }}
              >
                {recentlyPaid > 0 && (
                  <span className="text-xs text-white font-medium">
                    {((recentlyPaid / (uninvoicedActivity + unpaidInvoices + recentlyPaid)) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Legend - QuickBooks Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Uninvoiced Activity</p>
                <p className="text-lg font-bold text-yellow-600">{formatCurrency(uninvoicedActivity)}</p>
                <p className="text-xs text-gray-500">Chi phí, giờ làm có thể tính phí</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-orange-50 rounded-lg">
              <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Unpaid Invoices</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(unpaidInvoices)}</p>
                {overdueAmount > 0 && (
                  <p className="text-xs text-red-600">Overdue: {formatCurrency(overdueAmount)}</p>
                )}
                <p className="text-xs text-gray-500">Chưa tới hạn</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Recently Paid</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(recentlyPaid)}</p>
                <p className="text-xs text-gray-500">30 ngày qua</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Shortcuts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lối tắt (Shortcuts)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {shortcuts.map((shortcut, index) => (
            <button
              key={index}
              onClick={shortcut.onClick}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="flex items-center mb-3">
                <div className={`p-2 rounded-lg ${shortcut.color}`}>
                  <shortcut.icon className="h-5 w-5 text-white" />
                </div>
                <Plus className="h-4 w-4 text-gray-400 ml-2" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{shortcut.title}</h4>
              <p className="text-sm text-gray-600">{shortcut.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Insights & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt bán hàng</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-500 mr-3" />
                <span className="text-gray-600">Tổng hóa đơn</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{invoicesStats.total || 0}</p>
                <p className="text-sm text-gray-500">hóa đơn</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Receipt className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-600">Tổng báo giá</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{quotesStats.total || 0}</p>
                <p className="text-sm text-gray-500">báo giá</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-orange-500 mr-3" />
                <span className="text-gray-600">Hóa đơn quá hạn</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">{invoicesStats.overdue || 0}</p>
                <p className="text-sm text-gray-500">hóa đơn</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-gray-600">Tỷ lệ chuyển đổi</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {quotesStats.total > 0 ? ((invoicesStats.total / quotesStats.total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-sm text-gray-500">báo giá → hóa đơn</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Khách hàng công nợ cao</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">Xem tất cả</button>
          </div>
          <div className="space-y-3">
            {/* Mock top customers data for now */}
            {[
              { name: 'Công ty ABC', amount: 50000000, count: 12 },
              { name: 'Công ty XYZ', amount: 35000000, count: 8 },
              { name: 'Doanh nghiệp DEF', amount: 28000000, count: 6 },
              { name: 'Công ty GHI', amount: 22000000, count: 5 },
              { name: 'Tập đoàn JKL', amount: 18000000, count: 4 }
            ].map((customer: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(customer.balance)}</p>
                  <p className="text-sm text-gray-500">{customer.invoices_count} hóa đơn</p>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-500 py-4">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Chưa có dữ liệu khách hàng</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}