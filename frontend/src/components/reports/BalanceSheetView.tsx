'use client'

import React from 'react'
import { 
  Building2, 
  CreditCard, 
  PiggyBank, 
  Scale,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react'

interface BalanceSheetData {
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

interface BalanceSheetViewProps {
  data: BalanceSheetData
}

export default function BalanceSheetView({ data }: BalanceSheetViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cash':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'accounts receivable':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'fixed assets':
        return <Building2 className="h-4 w-4 text-purple-600" />
      case 'accounts payable':
        return <CreditCard className="h-4 w-4 text-red-600" />
      case 'long-term liabilities':
        return <TrendingDown className="h-4 w-4 text-orange-600" />
      case 'retained earnings':
        return <PiggyBank className="h-4 w-4 text-green-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cash':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'accounts receivable':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'fixed assets':
        return 'bg-purple-50 border-purple-200 text-purple-800'
      case 'accounts payable':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'long-term liabilities':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'retained earnings':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bảng Cân đối Kế toán</h1>
            <p className="text-blue-100 mt-2">
              Tính đến ngày: {new Date(data.as_of_date).toLocaleDateString('vi-VN')}
            </p>
            <p className="text-blue-100 text-sm">
              Đơn vị tiền tệ: {data.currency}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.total_assets)}
            </div>
            <div className="text-blue-100 text-sm">Tổng tài sản</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Tài sản</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(data.assets.total_assets)}
              </p>
            </div>
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-900">Nợ phải trả</h3>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(data.liabilities.total_liabilities)}
              </p>
            </div>
            <CreditCard className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Vốn chủ sở hữu</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(data.equity.total_equity)}
              </p>
            </div>
            <PiggyBank className="h-12 w-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* Balance Sheet Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Building2 className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-blue-900">TÀI SẢN</h2>
          </div>

          {/* Current Assets */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Tài sản ngắn hạn</h3>
            <div className="space-y-3">
              {data.assets.asset_breakdown.filter(item => 
                item.category === 'Cash' || item.category === 'Accounts Receivable'
              ).map((item, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${getCategoryColor(item.category)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getCategoryIcon(item.category)}
                      <span className="ml-3 font-medium">
                        {item.category === 'Cash' ? 'Cash' :
                         item.category === 'Accounts Receivable' ? 'Accounts Receivable' :
                         item.category === 'Fixed Assets' ? 'Fixed Assets' :
                         item.category === 'Accounts Payable' ? 'Accounts Payable' :
                         item.category === 'Long-term Liabilities' ? 'Long-term Liabilities' :
                         item.category === 'Retained Earnings' ? 'Retained Earnings' :
                         item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="text-sm opacity-75">
                        {formatPercentage(item.percentage)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed Assets */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Tài sản dài hạn</h3>
            <div className="space-y-3">
              {data.assets.asset_breakdown.filter(item => 
                item.category === 'Fixed Assets'
              ).map((item, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${getCategoryColor(item.category)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getCategoryIcon(item.category)}
                      <span className="ml-3 font-medium">
                        {item.category === 'Cash' ? 'Cash' :
                         item.category === 'Accounts Receivable' ? 'Accounts Receivable' :
                         item.category === 'Fixed Assets' ? 'Fixed Assets' :
                         item.category === 'Accounts Payable' ? 'Accounts Payable' :
                         item.category === 'Long-term Liabilities' ? 'Long-term Liabilities' :
                         item.category === 'Retained Earnings' ? 'Retained Earnings' :
                         item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="text-sm opacity-75">
                        {formatPercentage(item.percentage)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Assets */}
          <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-900">TỔNG TÀI SẢN</h3>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(data.assets.total_assets)}
              </div>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="space-y-6">
          {/* Liabilities */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <CreditCard className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-red-900">NỢ PHẢI TRẢ</h2>
            </div>

            {/* Current Liabilities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Nợ ngắn hạn</h3>
              <div className="space-y-3">
                {data.liabilities.liability_breakdown.filter(item => 
                  item.category === 'Accounts Payable'
                ).map((item, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 ${getCategoryColor(item.category)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getCategoryIcon(item.category)}
                        <span className="ml-3 font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-sm opacity-75">
                          {formatPercentage(item.percentage)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Long-term Liabilities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Nợ dài hạn</h3>
              <div className="space-y-3">
                {data.liabilities.liability_breakdown.filter(item => 
                  item.category === 'Long-term Liabilities'
                ).map((item, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 ${getCategoryColor(item.category)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getCategoryIcon(item.category)}
                        <span className="ml-3 font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-sm opacity-75">
                          {formatPercentage(item.percentage)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Liabilities */}
            <div className="bg-red-100 rounded-lg p-4 border-2 border-red-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-red-900">TỔNG NỢ PHẢI TRẢ</h3>
                <div className="text-2xl font-bold text-red-900">
                  {formatCurrency(data.liabilities.total_liabilities)}
                </div>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <PiggyBank className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-green-900">VỐN CHỦ SỞ HỮU</h2>
            </div>

            {/* Retained Earnings */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Lợi nhuận giữ lại</h3>
              <div className="space-y-3">
                {data.equity.equity_breakdown.map((item, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 ${getCategoryColor(item.category)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getCategoryIcon(item.category)}
                        <span className="ml-3 font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-sm opacity-75">
                          {formatPercentage(item.percentage)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Equity */}
            <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-green-900">TỔNG VỐN CHỦ SỞ HỮU</h3>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(data.equity.total_equity)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Validation */}
      <div className={`rounded-xl p-6 shadow-lg ${data.summary.balance_check ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
        <div className="flex items-center justify-center">
          <Scale className={`h-8 w-8 mr-3 ${data.summary.balance_check ? 'text-green-600' : 'text-red-600'}`} />
          <div className="text-center">
            <h3 className={`text-2xl font-bold ${data.summary.balance_check ? 'text-green-900' : 'text-red-900'}`}>
              {data.summary.balance_check ? 'Bảng cân đối hợp lệ' : 'Bảng cân đối không hợp lệ'}
            </h3>
            <p className={`text-lg mt-2 ${data.summary.balance_check ? 'text-green-700' : 'text-red-700'}`}>
              Tài sản: {formatCurrency(data.summary.total_assets)} = Nợ phải trả + Vốn chủ sở hữu: {formatCurrency(data.summary.total_liabilities + data.summary.total_equity)}
            </p>
          </div>
        </div>
      </div>

      {/* Report Info */}
      <div className="bg-gray-100 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Ngày báo cáo:</span> {new Date(data.generated_at).toLocaleDateString('vi-VN')}
          </div>
          <div>
            <span className="font-medium">Tính đến ngày:</span> {new Date(data.as_of_date).toLocaleDateString('vi-VN')}
          </div>
          <div>
            <span className="font-medium">Đơn vị tiền tệ:</span> {data.currency}
          </div>
        </div>
      </div>
    </div>
  )
}
