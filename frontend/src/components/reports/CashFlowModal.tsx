'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Download, 
  Calendar, 
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
  ArrowDownRight,
  Activity,
  Target,
  Zap
} from 'lucide-react'
import { cashFlowApi } from '@/lib/api'
import DrillDownModal from './DrillDownModal'

interface CashFlowModalProps {
  isOpen: boolean
  onClose: () => void
  startDate: string
  endDate: string
}

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

interface CashFlowStatement {
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

export default function CashFlowModal({ isOpen, onClose, startDate, endDate }: CashFlowModalProps) {
  const [statement, setStatement] = useState<CashFlowStatement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDrillDown, setShowDrillDown] = useState(false)
  const [drillDownData, setDrillDownData] = useState<{
    accountId: string
    accountName: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchCashFlowStatement()
    }
  }, [isOpen, startDate, endDate])

  const fetchCashFlowStatement = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await cashFlowApi.getCashFlowStatement(startDate, endDate)
      
      if (response.success && response.data) {
        setStatement(response.data)
      } else {
        setError('Không thể tải báo cáo Lưu chuyển Tiền tệ')
      }
    } catch (err) {
      console.error('Error fetching cash flow statement:', err)
      setError('Lỗi khi tải báo cáo Lưu chuyển Tiền tệ')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const handleItemClick = (item: CashFlowItem) => {
    if (item.item_code) {
      setDrillDownData({
        accountId: item.item_code,
        accountName: item.item_name
      })
      setShowDrillDown(true)
    }
  }

  const renderSection = (section: CashFlowSection, color: string, icon: React.ReactNode) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{section.section_name}</h3>
            <p className="text-sm text-gray-600">
              {section.items.length} mục • Tổng: {formatCurrency(section.subtotal)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${section.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(section.net_cash_flow)}
          </div>
          <div className="text-sm text-gray-500">
            {section.net_cash_flow >= 0 ? 'Dòng tiền vào' : 'Dòng tiền ra'}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {section.items.map((item, index) => (
          <div 
            key={index} 
            className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${
              item.item_code ? 'hover:bg-gray-50 cursor-pointer' : ''
            }`}
            onClick={() => item.item_code && handleItemClick(item)}
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${item.is_inflow ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div className="text-sm font-medium text-gray-900">
                  {item.item_name}
                </div>
                {item.item_code && (
                  <div className="text-xs text-gray-500">
                    ({item.item_code})
                  </div>
                )}
              </div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-1">
                  {item.description}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${item.is_inflow ? 'text-green-600' : 'text-red-600'}`}>
                {item.is_inflow ? '+' : '-'}{formatCurrency(item.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderKeyMetrics = () => {
    if (!statement) return null

    const metrics = [
      {
        title: "Lợi nhuận ròng",
        value: statement.net_income,
        icon: TrendingUp,
        color: statement.net_income >= 0 ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100",
        description: "Từ báo cáo P&L"
      },
      {
        title: "Dòng tiền hoạt động",
        value: statement.total_operating_cash_flow,
        icon: Activity,
        color: statement.total_operating_cash_flow >= 0 ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100",
        description: "Từ hoạt động kinh doanh"
      },
      {
        title: "Dòng tiền đầu tư",
        value: statement.total_investing_cash_flow,
        icon: Target,
        color: statement.total_investing_cash_flow >= 0 ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100",
        description: "Mua/bán tài sản"
      },
      {
        title: "Dòng tiền tài chính",
        value: statement.total_financing_cash_flow,
        icon: Zap,
        color: statement.total_financing_cash_flow >= 0 ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100",
        description: "Vay/trả nợ, góp vốn"
      }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metric.value)}
                  </p>
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${metric.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderCashFlowSummary = () => {
    if (!statement) return null

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tổng kết Dòng tiền</h3>
            <p className="text-sm text-gray-600">
              Kỳ báo cáo: {statement.report_period}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${statement.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(statement.net_cash_flow)}
            </div>
            <div className="text-sm text-gray-500">
              Dòng tiền thuần
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Tiền đầu kỳ</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(statement.beginning_cash)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Thay đổi tiền</div>
            <div className={`text-lg font-semibold ${statement.net_change_in_cash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {statement.net_change_in_cash >= 0 ? '+' : ''}{formatCurrency(statement.net_change_in_cash)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Tiền cuối kỳ</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(statement.ending_cash)}
            </div>
          </div>
        </div>
        
        {statement.cash_flow_validation && (
          <div className="mt-4 flex items-center justify-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Đối chiếu tiền mặt chính xác</span>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Báo cáo Lưu chuyển Tiền tệ</h2>
            <p className="text-gray-600">
              Kỳ báo cáo: {formatDate(startDate)} - {formatDate(endDate)}
            </p>
            <p className="text-sm text-gray-500">
              {statement ? `Cập nhật lúc: ${formatDate(statement.generated_at)}` : 'Đang tải...'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {/* TODO: Implement export */}}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải báo cáo Lưu chuyển Tiền tệ...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchCashFlowStatement}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {statement && !loading && (
            <div className="space-y-8">
              {/* Key Metrics */}
              {renderKeyMetrics()}

              {/* Cash Flow Summary */}
              {renderCashFlowSummary()}

              {/* Operating Activities */}
              {renderSection(
                statement.operating_activities,
                "bg-blue-100 text-blue-600",
                <Activity className="h-5 w-5" />
              )}

              {/* Investing Activities */}
              {renderSection(
                statement.investing_activities,
                "bg-purple-100 text-purple-600",
                <Target className="h-5 w-5" />
              )}

              {/* Financing Activities */}
              {renderSection(
                statement.financing_activities,
                "bg-green-100 text-green-600",
                <Zap className="h-5 w-5" />
              )}

              {/* Report Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Thông tin báo cáo</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Tổng giao dịch:</span> {statement.total_transactions}
                  </div>
                  <div>
                    <span className="font-medium">Tổng bút toán:</span> {statement.total_journal_entries}
                  </div>
                  <div>
                    <span className="font-medium">Đơn vị tiền tệ:</span> {statement.currency}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drill-Down Modal */}
        {drillDownData && (
          <DrillDownModal
            isOpen={showDrillDown}
            onClose={() => setShowDrillDown(false)}
            reportType="cash-flow"
            accountId={drillDownData.accountId}
            accountName={drillDownData.accountName}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>
    </div>
  )
}
