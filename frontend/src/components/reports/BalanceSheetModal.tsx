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
  Scale
} from 'lucide-react'
import { balanceSheetApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import DrillDownModal from './DrillDownModal'

interface BalanceSheetModalProps {
  isOpen: boolean
  onClose: () => void
  asOfDate: string
}

interface BalanceSheetAccount {
  account_code: string
  account_name: string
  account_category: string
  subcategory?: string
  balance: number
  is_debit_balance: boolean
}

interface BalanceSheetSection {
  section_name: string
  section_type: string
  accounts: BalanceSheetAccount[]
  total_amount: number
  percentage?: number
}

interface BalanceSheetReport {
  report_date: string
  as_of_date: string
  currency: string
  generated_at: string
  assets: {
    total_assets: number
    current_assets: number
    fixed_assets: number
    asset_breakdown: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  liabilities: {
    total_liabilities: number
    current_liabilities: number
    long_term_liabilities: number
    liability_breakdown: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  equity: {
    total_equity: number
    retained_earnings: number
    equity_breakdown: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  summary: {
    total_assets: number
    total_liabilities: number
    total_equity: number
    balance_check: boolean
  }
}

export default function BalanceSheetModal({ isOpen, onClose, asOfDate }: BalanceSheetModalProps) {
  const [report, setReport] = useState<BalanceSheetReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDrillDown, setShowDrillDown] = useState(false)
  const [drillDownData, setDrillDownData] = useState<{
    accountId: string
    accountName: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchBalanceSheet()
    }
  }, [isOpen, asOfDate])

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await balanceSheetApi.getBalanceSheet(asOfDate)
      
      if (response.success && response.data) {
        setReport(response.data)
      } else {
        setError('Không thể tải báo cáo Bảng Cân đối Kế toán')
      }
    } catch (err) {
      console.error('Error fetching Balance Sheet:', err)
      setError('Lỗi khi tải báo cáo Bảng Cân đối Kế toán')
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

  const handleAccountClick = (account: BalanceSheetAccount) => {
    setDrillDownData({
      accountId: account.account_code,
      accountName: account.account_name
    })
    setShowDrillDown(true)
  }

  const renderSection = (section: BalanceSheetSection, color: string) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center py-2 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900">{section.section_name}</h4>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(section.total_amount)}
          </div>
          {section.percentage && (
            <div className="text-sm text-black">
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
            <div className="text-xs text-black">
              {account.account_code}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
              {formatCurrency(account.balance)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderKeyMetrics = () => {
    if (!report) return null

    const metrics = [
      {
        label: 'Tổng Tài sản',
        value: report.assets.total_assets,
        color: 'text-blue-600',
        icon: Building2
      },
      {
        label: 'Tổng Nợ phải trả',
        value: report.liabilities.total_liabilities,
        color: 'text-red-600',
        icon: CreditCard
      },
      {
        label: 'Tổng Vốn chủ sở hữu',
        value: report.equity.total_equity,
        color: 'text-green-600',
        icon: PiggyBank
      },
      {
        label: 'Cân đối',
        value: report.summary.balance_check ? 'Cân bằng' : 'Không cân bằng',
        color: report.summary.balance_check ? 'text-green-600' : 'text-red-600',
        icon: report.summary.balance_check ? CheckCircle : AlertCircle
      }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color}`}>
                  {typeof metric.value === 'string' ? metric.value : formatCurrency(metric.value)}
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
              <h2 className="text-2xl font-semibold text-gray-900">Bảng Cân đối Kế toán</h2>
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
                className="p-2 text-black hover:text-black"
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
                    <h1 className="text-3xl font-bold text-gray-900">Bảng Cân đối Kế toán</h1>
                    <p className="mt-2 text-black">
                      Báo cáo chi tiết về tài sản, nợ phải trả và vốn chủ sở hữu của công ty
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-black">
                      <span>Tính đến ngày: {report?.report_date || asOfDate}</span>
                    </div>
                  </div>
                </div>
              </div>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-black">Đang tải báo cáo...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchBalanceSheet}
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

              {/* Balance Sheet Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assets Side */}
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      TÀI SẢN
                    </h3>
                    
                    {/* Current Assets */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-blue-800 mb-3">Tài sản ngắn hạn</h4>
                      <div className="space-y-2">
                        {report.assets.asset_breakdown.filter(item => 
                          item.category === 'Cash' || item.category === 'Accounts Receivable'
                        ).map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-4 bg-white rounded-md">
                            <span className="text-sm font-medium text-gray-700">{item.category}</span>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(item.amount)}
                              </div>
                              <div className="text-xs text-black">
                                {item.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Fixed Assets */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-blue-800 mb-3">Tài sản dài hạn</h4>
                      <div className="space-y-2">
                        {report.assets.asset_breakdown.filter(item => 
                          item.category === 'Fixed Assets'
                        ).map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-4 bg-white rounded-md">
                            <span className="text-sm font-medium text-gray-700">{item.category}</span>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(item.amount)}
                              </div>
                              <div className="text-xs text-black">
                                {item.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Total Assets */}
                    <div className="bg-blue-100 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-bold text-blue-900">TỔNG TÀI SẢN</h4>
                        <div className="text-2xl font-bold text-blue-900">
                          {formatCurrency(report.assets.total_assets)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity Side */}
                <div className="space-y-6">
                  {/* Liabilities */}
                  <div className="bg-red-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      NỢ PHẢI TRẢ
                    </h3>
                    
                    {/* Current Liabilities */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-red-800 mb-3">Nợ ngắn hạn</h4>
                      <div className="space-y-2">
                        {report.liabilities.liability_breakdown.filter(item => 
                          item.category === 'Accounts Payable'
                        ).map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-4 bg-white rounded-md">
                            <span className="text-sm font-medium text-gray-700">{item.category}</span>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(item.amount)}
                              </div>
                              <div className="text-xs text-black">
                                {item.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Long-term Liabilities */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-red-800 mb-3">Nợ dài hạn</h4>
                      <div className="space-y-2">
                        {report.liabilities.liability_breakdown.filter(item => 
                          item.category === 'Long-term Liabilities'
                        ).map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-4 bg-white rounded-md">
                            <span className="text-sm font-medium text-gray-700">{item.category}</span>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(item.amount)}
                              </div>
                              <div className="text-xs text-black">
                                {item.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Total Liabilities */}
                    <div className="bg-red-100 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-bold text-red-900">TỔNG NỢ PHẢI TRẢ</h4>
                        <div className="text-2xl font-bold text-red-900">
                          {formatCurrency(report.liabilities.total_liabilities)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                      <PiggyBank className="h-5 w-5 mr-2" />
                      VỐN CHỦ SỞ HỮU
                    </h3>
                    
                    {/* Retained Earnings */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-green-800 mb-3">Lợi nhuận giữ lại</h4>
                      <div className="space-y-2">
                        {report.equity.equity_breakdown.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-4 bg-white rounded-md">
                            <span className="text-sm font-medium text-gray-700">{item.category}</span>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(item.amount)}
                              </div>
                              <div className="text-xs text-black">
                                {item.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Total Equity */}
                    <div className="bg-green-100 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-bold text-green-900">TỔNG VỐN CHỦ SỞ HỮU</h4>
                        <div className="text-2xl font-bold text-green-900">
                          {formatCurrency(report.equity.total_equity)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Liabilities & Equity */}
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-gray-900">TỔNG NỢ PHẢI TRẢ VÀ VỐN CHỦ SỞ HỮU</h4>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(report.liabilities.total_liabilities + report.equity.total_equity)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Validation */}
              <div className={`rounded-lg p-6 ${report.summary.balance_check ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-center">
                  <Scale className={`h-8 w-8 mr-3 ${report.summary.balance_check ? 'text-green-600' : 'text-red-600'}`} />
                  <div className="text-center">
                    <h4 className={`text-lg font-bold ${report.summary.balance_check ? 'text-green-900' : 'text-red-900'}`}>
                      {report.summary.balance_check ? 'Bảng cân đối hợp lệ' : 'Bảng cân đối không hợp lệ'}
                    </h4>
                    <p className={`text-sm ${report.summary.balance_check ? 'text-green-700' : 'text-red-700'}`}>
                      Tài sản: {formatCurrency(report.summary.total_assets)} = Nợ phải trả + Vốn chủ sở hữu: {formatCurrency(report.summary.total_liabilities + report.summary.total_equity)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Info */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-black">
                  <div>
                    <span className="font-medium">Ngày báo cáo:</span> {new Date(report.report_date).toLocaleDateString('vi-VN')}
                  </div>
                  <div>
                    <span className="font-medium">Tính đến ngày:</span> {new Date(report.as_of_date).toLocaleDateString('vi-VN')}
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
          reportType="balance-sheet"
          accountId={drillDownData.accountId}
          accountName={drillDownData.accountName}
          asOfDate={asOfDate}
        />
        )}
        </div>
      </div>
    </div>
  )
}
