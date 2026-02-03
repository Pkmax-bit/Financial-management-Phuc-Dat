'use client'

import React from 'react'
import { 
  Building2, 
  TrendingUp, 
  Users, 
  BarChart3, 
  CreditCard, 
  FileText,
  DollarSign,
  Calendar,
  Download,
  ArrowLeft
} from 'lucide-react'

interface SimpleReportViewProps {
  reportType: string
  data: any
  onBack: () => void
}

export default function SimpleReportView({ reportType, data, onBack }: SimpleReportViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'
  }

  const getReportInfo = (type: string) => {
    const reportMap = {
      'balance-sheet': {
        title: 'Báo cáo Cân đối Kế toán',
        icon: Building2,
        color: 'blue',
        description: 'Tài sản, nợ phải trả và vốn chủ sở hữu'
      },
      'cash-flow': {
        title: 'Báo cáo Lưu chuyển Tiền tệ',
        icon: TrendingUp,
        color: 'green',
        description: 'Dòng tiền vào và ra của doanh nghiệp'
      },
      'sales-customer': {
        title: 'Doanh thu theo Khách hàng',
        icon: Users,
        color: 'orange',
        description: 'Xếp hạng và phân tích khách hàng'
      },
      'profit-loss': {
        title: 'Báo cáo Kết quả Kinh doanh',
        icon: BarChart3,
        color: 'purple',
        description: 'Doanh thu, chi phí và lợi nhuận'
      },
      'expenses-vendor': {
        title: 'Chi phí theo Nhà cung cấp',
        icon: CreditCard,
        color: 'red',
        description: 'Phân tích chi phí và nhà cung cấp'
      },
      'general-ledger': {
        title: 'Sổ Cái Tổng hợp',
        icon: FileText,
        color: 'indigo',
        description: 'Tất cả giao dịch kế toán'
      }
    }
    return reportMap[type as keyof typeof reportMap] || reportMap['balance-sheet']
  }

  const reportInfo = getReportInfo(reportType)
  const IconComponent = reportInfo.icon

  const renderBalanceSheet = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Tổng Tài sản</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(data.assets?.total_assets || 0)}
              </p>
            </div>
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-900">Tổng Nợ phải trả</h3>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(data.liabilities?.total_liabilities || 0)}
              </p>
            </div>
            <CreditCard className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Vốn chủ sở hữu</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(data.equity?.total_equity || 0)}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* Assets */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Tài sản</h3>
        <div className="space-y-3">
          {data.assets?.asset_breakdown?.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{item.category}</span>
              <div className="text-right">
                <div className="font-bold">{formatCurrency(item.amount)}</div>
                <div className="text-sm text-black">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liabilities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Nợ phải trả</h3>
        <div className="space-y-3">
          {data.liabilities?.liability_breakdown?.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{item.category}</span>
              <div className="text-right">
                <div className="font-bold">{formatCurrency(item.amount)}</div>
                <div className="text-sm text-black">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCashFlow = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Tiền đầu kỳ</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(data.beginning_cash || 0)}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Tiền cuối kỳ</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(data.ending_cash || 0)}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Thay đổi ròng</h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(data.net_change_in_cash || 0)}
              </p>
            </div>
            <BarChart3 className="h-12 w-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Operating Activities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Hoạt động kinh doanh</h3>
        <div className="space-y-3">
          {data.operating_activities?.items?.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{item.item_name}</span>
              <div className="text-right">
                <div className={`font-bold ${item.is_inflow ? 'text-green-600' : 'text-red-600'}`}>
                  {item.is_inflow ? '+' : '-'}{formatCurrency(item.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSalesCustomer = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Tổng khách hàng</h3>
              <p className="text-3xl font-bold text-blue-600">
                {data.total_customers || 0}
              </p>
            </div>
            <Users className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Tổng doanh thu</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(data.total_sales || 0)}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Tổng đơn hàng</h3>
              <p className="text-3xl font-bold text-orange-600">
                {data.total_invoices || 0}
              </p>
            </div>
            <FileText className="h-12 w-12 text-orange-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Giá trị TB</h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(data.average_order_value || 0)}
              </p>
            </div>
            <BarChart3 className="h-12 w-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Top khách hàng</h3>
        <div className="space-y-3">
          {data.top_customers?.map((customer: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">#{customer.rank} {customer.customer_name}</span>
                <div className="text-sm text-black">{customer.customer_code}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatCurrency(customer.total_sales)}</div>
                <div className="text-sm text-black">{customer.total_invoices} đơn hàng</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderReportContent = () => {
    switch (reportType) {
      case 'balance-sheet':
        return renderBalanceSheet()
      case 'cash-flow':
        return renderCashFlow()
      case 'sales-customer':
        return renderSalesCustomer()
      default:
        return (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-black mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Báo cáo đang phát triển</h3>
            <p className="text-black">Báo cáo này sẽ có sẵn trong phiên bản tiếp theo.</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="flex items-center text-white hover:text-blue-100 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Quay lại
            </button>
            <div>
              <h1 className="text-3xl font-bold">{reportInfo.title}</h1>
              <p className="text-blue-100 mt-2">{reportInfo.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  )
}
