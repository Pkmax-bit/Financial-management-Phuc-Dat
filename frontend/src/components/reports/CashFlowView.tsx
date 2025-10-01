'use client'

import React from 'react'
import { 
  Activity, 
  Target, 
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle,
  Building2,
  CreditCard,
  PiggyBank,
  Scale,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface CashFlowItem {
  item_name: string
  item_code?: string
  amount: number
  is_inflow: boolean
  description?: string
  account_codes: string[]
}

interface CashFlowSection {
  section_name: string
  section_type: string
  items: CashFlowItem[]
  subtotal: number
  net_cash_flow: number
}

interface CashFlowData {
  report_period: string
  start_date: string
  end_date: string
  currency: string
  generated_at: string
  beginning_cash: number
  ending_cash: number
  net_change_in_cash: number
  net_income: number
  operating_activities: CashFlowSection
  investing_activities: CashFlowSection
  financing_activities: CashFlowSection
  total_operating_cash_flow: number
  total_investing_cash_flow: number
  total_financing_cash_flow: number
  net_cash_flow: number
  cash_flow_validation: boolean
  total_transactions: number
  total_journal_entries: number
}

interface CashFlowViewProps {
  data: CashFlowData
}

export default function CashFlowView({ data }: CashFlowViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`
  }

  const getItemIcon = (isInflow: boolean) => {
    return isInflow ? 
      <ArrowUpRight className="h-4 w-4 text-green-600" /> : 
      <ArrowDownRight className="h-4 w-4 text-red-600" />
  }

  const getItemColor = (isInflow: boolean) => {
    return isInflow ? 
      'bg-green-50 border-green-200 text-green-800' : 
      'bg-red-50 border-red-200 text-red-800'
  }

  const getSectionIcon = (sectionType: string) => {
    switch (sectionType.toLowerCase()) {
      case 'operating':
        return <Activity className="h-6 w-6 text-blue-600" />
      case 'investing':
        return <Target className="h-6 w-6 text-purple-600" />
      case 'financing':
        return <Zap className="h-6 w-6 text-green-600" />
      default:
        return <DollarSign className="h-6 w-6 text-black" />
    }
  }

  const getSectionColor = (sectionType: string) => {
    switch (sectionType.toLowerCase()) {
      case 'operating':
        return 'text-blue-900'
      case 'investing':
        return 'text-purple-900'
      case 'financing':
        return 'text-green-900'
      default:
        return 'text-gray-900'
    }
  }

  const getSectionBgColor = (sectionType: string) => {
    switch (sectionType.toLowerCase()) {
      case 'operating':
        return 'bg-blue-100 border-blue-300'
      case 'investing':
        return 'bg-purple-100 border-purple-300'
      case 'financing':
        return 'bg-green-100 border-green-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Báo cáo Lưu chuyển Tiền tệ</h1>
            <p className="text-green-100 mt-2">
              Kỳ báo cáo: {new Date(data.start_date).toLocaleDateString('vi-VN')} - {new Date(data.end_date).toLocaleDateString('vi-VN')}
            </p>
            <p className="text-green-100 text-sm">
              Đơn vị tiền tệ: {data.currency}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(data.net_cash_flow)}
            </div>
            <div className="text-green-100 text-sm">Dòng tiền thuần</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Hoạt động kinh doanh</h3>
              <p className={`text-3xl font-bold ${data.total_operating_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.total_operating_cash_flow)}
              </p>
            </div>
            <Activity className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Hoạt động đầu tư</h3>
              <p className={`text-3xl font-bold ${data.total_investing_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.total_investing_cash_flow)}
              </p>
            </div>
            <Target className="h-12 w-12 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Hoạt động tài chính</h3>
              <p className={`text-3xl font-bold ${data.total_financing_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.total_financing_cash_flow)}
              </p>
            </div>
            <Zap className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Lợi nhuận ròng</h3>
              <p className={`text-3xl font-bold ${data.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.net_income)}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-black" />
          </div>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-green-900">TỔNG KẾT DÒNG TIỀN</h2>
          <div className="text-right">
            <div className={`text-3xl font-bold ${data.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.net_cash_flow)}
            </div>
            <div className="text-sm text-black">Dòng tiền thuần</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-black">Tiền đầu kỳ</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(data.beginning_cash)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-black">Thay đổi tiền</div>
            <div className={`text-lg font-semibold ${data.net_change_in_cash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.net_change_in_cash >= 0 ? '+' : ''}{formatCurrency(data.net_change_in_cash)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-black">Tiền cuối kỳ</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(data.ending_cash)}
            </div>
          </div>
        </div>
        
        {data.cash_flow_validation && (
          <div className="mt-4 flex items-center justify-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Đối chiếu tiền mặt chính xác</span>
          </div>
        )}
      </div>

      {/* Cash Flow Details */}
      <div className="space-y-6">
        {/* Operating Activities */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            {getSectionIcon('operating')}
            <h2 className={`text-2xl font-bold ml-3 ${getSectionColor('operating')}`}>
              HOẠT ĐỘNG KINH DOANH
            </h2>
          </div>

          <div className="space-y-3">
            {data.operating_activities.items.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${getItemColor(item.is_inflow)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getItemIcon(item.is_inflow)}
                    <span className="ml-3 font-medium">{item.item_name}</span>
                    {item.item_code && (
                      <span className="ml-2 text-xs opacity-75">({item.item_code})</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {item.is_inflow ? '+' : '-'}{formatCurrency(item.amount)}
                    </div>
                  </div>
                </div>
                {item.description && (
                  <div className="text-sm opacity-75 mt-1">
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total Operating */}
          <div className={`rounded-lg p-4 border-2 mt-4 ${getSectionBgColor('operating')}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-xl font-bold ${getSectionColor('operating')}`}>
                TỔNG HOẠT ĐỘNG KINH DOANH
              </h3>
              <div className={`text-2xl font-bold ${data.total_operating_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.total_operating_cash_flow)}
              </div>
            </div>
          </div>
        </div>

        {/* Investing Activities */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            {getSectionIcon('investing')}
            <h2 className={`text-2xl font-bold ml-3 ${getSectionColor('investing')}`}>
              HOẠT ĐỘNG ĐẦU TƯ
            </h2>
          </div>

          <div className="space-y-3">
            {data.investing_activities.items.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${getItemColor(item.is_inflow)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getItemIcon(item.is_inflow)}
                    <span className="ml-3 font-medium">{item.item_name}</span>
                    {item.item_code && (
                      <span className="ml-2 text-xs opacity-75">({item.item_code})</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {item.is_inflow ? '+' : '-'}{formatCurrency(item.amount)}
                    </div>
                  </div>
                </div>
                {item.description && (
                  <div className="text-sm opacity-75 mt-1">
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total Investing */}
          <div className={`rounded-lg p-4 border-2 mt-4 ${getSectionBgColor('investing')}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-xl font-bold ${getSectionColor('investing')}`}>
                TỔNG HOẠT ĐỘNG ĐẦU TƯ
              </h3>
              <div className={`text-2xl font-bold ${data.total_investing_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.total_investing_cash_flow)}
              </div>
            </div>
          </div>
        </div>

        {/* Financing Activities */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            {getSectionIcon('financing')}
            <h2 className={`text-2xl font-bold ml-3 ${getSectionColor('financing')}`}>
              HOẠT ĐỘNG TÀI CHÍNH
            </h2>
          </div>

          <div className="space-y-3">
            {data.financing_activities.items.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${getItemColor(item.is_inflow)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getItemIcon(item.is_inflow)}
                    <span className="ml-3 font-medium">{item.item_name}</span>
                    {item.item_code && (
                      <span className="ml-2 text-xs opacity-75">({item.item_code})</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {item.is_inflow ? '+' : '-'}{formatCurrency(item.amount)}
                    </div>
                  </div>
                </div>
                {item.description && (
                  <div className="text-sm opacity-75 mt-1">
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total Financing */}
          <div className={`rounded-lg p-4 border-2 mt-4 ${getSectionBgColor('financing')}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-xl font-bold ${getSectionColor('financing')}`}>
                TỔNG HOẠT ĐỘNG TÀI CHÍNH
              </h3>
              <div className={`text-2xl font-bold ${data.total_financing_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.total_financing_cash_flow)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Info */}
      <div className="bg-gray-100 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-black">
          <div>
            <span className="font-medium">Ngày báo cáo:</span> {new Date(data.generated_at).toLocaleDateString('vi-VN')}
          </div>
          <div>
            <span className="font-medium">Kỳ báo cáo:</span> {data.report_period}
          </div>
          <div>
            <span className="font-medium">Đơn vị tiền tệ:</span> {data.currency}
          </div>
        </div>
      </div>
    </div>
  )
}
