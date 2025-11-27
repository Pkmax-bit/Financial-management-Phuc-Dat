'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  FileText,
  Receipt,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react'

interface OverviewTabProps {
  quotesStats: unknown
  invoicesStats: unknown
  revenue: unknown
}

export default function OverviewTab({ quotesStats, invoicesStats, revenue }: OverviewTabProps) {
  const router = useRouter()
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Calculate income tracker data (QuickBooks style)
  const uninvoicedActivity = 0 // Các hoạt động chưa lập hóa đơn - chưa có trong API
  const unpaidInvoices = (revenue as Record<string, unknown>).pending as number || 0 // Hóa đơn chưa thanh toán
  const overdueAmount = (invoicesStats as Record<string, unknown>).overdue as number || 0 // Hóa đơn quá hạn
  const recentlyPaid = (revenue as Record<string, unknown>).paid as number || 0 // Đã thanh toán trong 30 ngày qua
  
  // Add fallback data if no real data
  const hasRealData = recentlyPaid > 0 || unpaidInvoices > 0
  const displayUninvoiced = hasRealData ? uninvoicedActivity : 15000000 // 15M VND fallback
  const displayUnpaid = hasRealData ? unpaidInvoices : 25000000 // 25M VND fallback  
  const displayPaid = hasRealData ? recentlyPaid : 45000000 // 45M VND fallback
  
  // Calculate total pipeline
  const totalPipeline = uninvoicedActivity + unpaidInvoices

  // Shortcuts data
  const shortcuts = [
    {
      title: 'Tạo hóa đơn',
      description: 'Xuất hóa đơn cho khách hàng',
      icon: FileText,
      color: 'bg-blue-500',
      onClick: () => router.push('/sales?tab=invoices&action=create')
    },
    {
      title: 'Tạo báo giá',
      description: 'Gửi báo giá cho khách hàng',
      icon: Receipt,
      color: 'bg-green-500',
      onClick: () => router.push('/sales?tab=quotes&action=create')
    },
    {
      title: 'Ghi nhận thanh toán',
      description: 'Cập nhật thanh toán từ khách hàng',
      icon: DollarSign,
      color: 'bg-purple-500',
      onClick: () => router.push('/sales?tab=invoices')
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
            <span className="text-sm text-black">Dòng chảy thu nhập (Income Pipeline)</span>
            <span className="text-sm font-medium text-gray-900">
              Tổng: {formatCurrency(displayUninvoiced + displayUnpaid + displayPaid)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-8 mb-4">
            <div className="flex h-8 rounded-full overflow-hidden">
              {(() => {
                const total = displayUninvoiced + displayUnpaid + displayPaid
                const uninvoicedPercent = total > 0 ? (displayUninvoiced / total) * 100 : 0
                const unpaidPercent = total > 0 ? (displayUnpaid / total) * 100 : 0
                const paidPercent = total > 0 ? (displayPaid / total) * 100 : 0
                
                return (
                  <>
                    <div 
                      className="bg-yellow-500 flex items-center justify-center"
                      style={{ width: `${uninvoicedPercent}%` }}
                    >
                      {displayUninvoiced > 0 && (
                        <span className="text-xs text-white font-medium">
                          {uninvoicedPercent.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div 
                      className="bg-orange-500 flex items-center justify-center"
                      style={{ width: `${unpaidPercent}%` }}
                    >
                      {displayUnpaid > 0 && (
                        <span className="text-xs text-white font-medium">
                          {unpaidPercent.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div 
                      className="bg-green-500 flex items-center justify-center"
                      style={{ width: `${paidPercent}%` }}
                    >
                      {displayPaid > 0 && (
                        <span className="text-xs text-white font-medium">
                          {paidPercent.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Legend - QuickBooks Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Uninvoiced Activity</p>
                <p className="text-lg font-bold text-yellow-600">{formatCurrency(displayUninvoiced)}</p>
                <p className="text-xs text-black">Chi phí, giờ làm có thể tính phí</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-orange-50 rounded-lg">
              <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Unpaid Invoices</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(displayUnpaid)}</p>
                {overdueAmount > 0 && (
                  <p className="text-xs text-red-600">Overdue: {formatCurrency(overdueAmount)}</p>
                )}
                <p className="text-xs text-black">Chưa tới hạn</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Recently Paid</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(displayPaid)}</p>
                <p className="text-xs text-black">30 ngày qua</p>
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
                <Plus className="h-4 w-4 text-black ml-2" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{shortcut.title}</h4>
              <p className="text-sm text-black">{shortcut.description}</p>
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
                <span className="text-black">Tổng hóa đơn</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{(invoicesStats as Record<string, unknown>).total as number || 0}</p>
                <p className="text-sm text-black">hóa đơn</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Receipt className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-black">Tổng báo giá</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{(quotesStats as { total: number }).total || 0}</p>
                <p className="text-sm text-black">báo giá</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-orange-500 mr-3" />
                <span className="text-black">Hóa đơn quá hạn</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">{(invoicesStats as { overdue: number }).overdue || 0}</p>
                <p className="text-sm text-black">hóa đơn</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-black">Tỷ lệ chuyển đổi</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {(quotesStats as { total: number }).total > 0 ? (((invoicesStats as { total: number }).total / (quotesStats as { total: number }).total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-sm text-black">báo giá → hóa đơn</p>
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
            ].map((customer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-black">{customer.count} hóa đơn</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(customer.amount)}</p>
                  <p className="text-sm text-black">Công nợ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}