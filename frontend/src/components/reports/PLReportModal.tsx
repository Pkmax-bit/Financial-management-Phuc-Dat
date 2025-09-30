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
  CheckCircle
} from 'lucide-react'
import { plReportsApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import DrillDownModal from './DrillDownModal'

interface PLReportModalProps {
  isOpen: boolean
  onClose: () => void
  startDate: string
  endDate: string
}

interface PLAccount {
  account_code: string
  account_name: string
  account_type: string
  amount: number
  percentage?: number
}

interface PLSection {
  section_name: string
  accounts: PLAccount[]
  total_amount: number
  percentage?: number
}

interface PLReport {
  report_period: string
  start_date: string
  end_date: string
  currency: string
  generated_at: string
  total_revenue: number
  revenue_section: PLSection
  total_cogs: number
  cogs_section: PLSection
  gross_profit: number
  gross_profit_margin: number
  total_operating_expenses: number
  operating_expenses_section: PLSection
  operating_income: number
  operating_income_margin: number
  other_income: number
  other_expenses: number
  net_income: number
  net_income_margin: number
  total_transactions: number
  total_journal_entries: number
}

export default function PLReportModal({ isOpen, onClose, startDate, endDate }: PLReportModalProps) {
  const [report, setReport] = useState<PLReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDrillDown, setShowDrillDown] = useState(false)
  const [drillDownData, setDrillDownData] = useState<{
    accountId: string
    accountName: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchPLReport()
    }
  }, [isOpen, startDate, endDate])

  const fetchPLReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await plReportsApi.getProfitAndLoss(startDate, endDate)
      
      if (response.success && response.data) {
        setReport(response.data)
      } else {
        setError('Không thể tải báo cáo P&L')
      }
    } catch (err) {
      console.error('Error fetching P&L report:', err)
      setError('Lỗi khi tải báo cáo P&L')
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

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`
  }

  const handleAccountClick = (account: PLAccount) => {
    setDrillDownData({
      accountId: account.account_code,
      accountName: account.account_name
    })
    setShowDrillDown(true)
  }

  const renderSection = (section: PLSection, isRevenue = false) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center py-2 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900">{section.section_name}</h4>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(section.total_amount)}
          </div>
          {section.percentage && (
            <div className="text-sm text-gray-500">
              {formatPercentage(section.percentage)}
            </div>
          )}
        </div>
      </div>
      
      {section.accounts.map((account, index) => (
        <div 
          key={index} 
          className="flex justify-between items-center py-1 px-4 hover:bg-gray-50 cursor-pointer rounded-md transition-colors"
          onClick={() => handleAccountClick(account)}
        >
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700 hover:text-blue-600">
              {account.account_name}
            </div>
            <div className="text-xs text-gray-500">
              {account.account_code}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
              {formatCurrency(account.amount)}
            </div>
            {account.percentage && (
              <div className="text-xs text-gray-500">
                {formatPercentage(account.percentage)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  const renderKeyMetrics = () => {
    if (!report) return null

    const metrics = [
      {
        label: 'Tổng Doanh thu',
        value: report.total_revenue,
        color: 'text-green-600',
        icon: TrendingUp
      },
      {
        label: 'Lợi nhuận gộp',
        value: report.gross_profit,
        color: report.gross_profit >= 0 ? 'text-green-600' : 'text-red-600',
        icon: report.gross_profit >= 0 ? TrendingUp : TrendingDown
      },
      {
        label: 'Thu nhập hoạt động',
        value: report.operating_income,
        color: report.operating_income >= 0 ? 'text-green-600' : 'text-red-600',
        icon: report.operating_income >= 0 ? TrendingUp : TrendingDown
      },
      {
        label: 'Lợi nhuận ròng',
        value: report.net_income,
        color: report.net_income >= 0 ? 'text-green-600' : 'text-red-600',
        icon: report.net_income >= 0 ? TrendingUp : TrendingDown
      }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color}`}>
                  {formatCurrency(metric.value)}
                </p>
              </div>
              <metric.icon className={`h-8 w-8 ${metric.color}`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Báo cáo Kết quả Kinh doanh</h2>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {/* TODO: Implement export */}}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
              {/* Header */}
              <div>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Báo cáo Kết quả Kinh doanh</h1>
                    <p className="mt-2 text-gray-600">
                      Báo cáo chi tiết về doanh thu, chi phí và lợi nhuận của công ty
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Kỳ báo cáo: {report?.report_period || `${startDate} - ${endDate}`}</span>
                    </div>
                  </div>
                </div>
              </div>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải báo cáo...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchPLReport}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {report && !loading && (
            <div className="space-y-8">
              {/* Key Metrics */}
              {renderKeyMetrics()}

              {/* Revenue Section */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  DOANH THU
                </h3>
                {renderSection(report.revenue_section, true)}
              </div>

              {/* COGS Section */}
              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  GIÁ VỐN HÀNG BÁN
                </h3>
                {renderSection(report.cogs_section)}
              </div>

              {/* Gross Profit */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Lợi nhuận gộp
                  </h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(report.gross_profit)}
                    </div>
                    <div className="text-sm text-blue-700">
                      Tỷ lệ: {formatPercentage(report.gross_profit_margin)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Operating Expenses */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  CHI PHÍ HOẠT ĐỘNG
                </h3>
                {renderSection(report.operating_expenses_section)}
              </div>

              {/* Operating Income */}
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-purple-900">
                    Thu nhập hoạt động
                  </h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(report.operating_income)}
                    </div>
                    <div className="text-sm text-purple-700">
                      Tỷ lệ: {formatPercentage(report.operating_income_margin)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Income/Expenses */}
              {(report.other_income > 0 || report.other_expenses > 0) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Thu nhập/Chi phí khác
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.other_income > 0 && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Thu nhập khác</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(report.other_income)}
                        </p>
                      </div>
                    )}
                    {report.other_expenses > 0 && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Chi phí khác</p>
                        <p className="text-lg font-semibold text-red-600">
                          {formatCurrency(report.other_expenses)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Net Income */}
              <div className={`rounded-lg p-6 ${report.net_income >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <h3 className={`text-lg font-semibold ${report.net_income >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    Lợi nhuận ròng
                  </h3>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${report.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(report.net_income)}
                    </div>
                    <div className={`text-sm ${report.net_income >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Tỷ lệ: {formatPercentage(report.net_income_margin)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Info */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Tổng giao dịch:</span> {report.total_transactions}
                  </div>
                  <div>
                    <span className="font-medium">Tổng bút toán:</span> {report.total_journal_entries}
                  </div>
                  <div>
                    <span className="font-medium">Đơn vị tiền tệ:</span> {report.currency}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drill-Down Modal */}
      {drillDownData && (
        <DrillDownModal
          isOpen={showDrillDown}
          onClose={() => setShowDrillDown(false)}
          reportType="pnl"
          accountId={drillDownData.accountId}
          accountName={drillDownData.accountName}
          startDate={startDate}
          endDate={endDate}
        />
      )}
        </div>
      </div>
    </div>
  )
}
