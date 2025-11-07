'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, RefreshCw, Calendar, PiggyBank, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CashFlowItemVietnamese {
  item_name: string
  item_code?: string
  debit_amount: number
  credit_amount: number
  net_amount: number
  description?: string
  account_type: string
}

interface CashFlowSectionVietnamese {
  section_name: string
  section_type: string
  items: CashFlowItemVietnamese[]
  total_debit: number
  total_credit: number
  net_cash_flow: number
}

interface CashFlowStatementVietnamese {
  report_period: string
  start_date: string
  end_date: string
  currency: string
  generated_at: string
  
  beginning_cash: number
  ending_cash: number
  net_change_in_cash: number
  
  operating_activities: CashFlowSectionVietnamese
  investing_activities: CashFlowSectionVietnamese
  financing_activities: CashFlowSectionVietnamese
  
  total_operating_cash_flow: number
  total_investing_cash_flow: number
  total_financing_cash_flow: number
  net_cash_flow: number
  
  cash_flow_validation: boolean
  total_transactions: number
}

export default function CashFlowVietnamesePage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CashFlowStatementVietnamese | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || getApiUrl()
      const response = await fetch(`${apiUrl}/api/reports/financial/cash-flow-vietnamese?start_date=${startDate}&end_date=${endDate}`)
      
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu báo cáo dòng tiền')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching cash flow data:', err)
      setError('Không thể tải dữ liệu báo cáo dòng tiền')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      fetchData()
    }
  }, [startDate, endDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  const getAccountTypeColor = (accountType: string) => {
    switch (accountType) {
      case 'asset': return 'text-blue-600'
      case 'liability': return 'text-red-600'
      case 'equity': return 'text-green-600'
      case 'revenue': return 'text-purple-600'
      case 'expense': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getAccountTypeLabel = (accountType: string) => {
    switch (accountType) {
      case 'asset': return 'Tài sản'
      case 'liability': return 'Nợ phải trả'
      case 'equity': return 'Vốn chủ sở hữu'
      case 'revenue': return 'Doanh thu'
      case 'expense': return 'Chi phí'
      default: return accountType
    }
  }

  const renderSection = (section: CashFlowSectionVietnamese, title: string, color: string) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className={`px-6 py-4 border-b border-gray-200 ${color}`}>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div className="p-6">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 mb-4 pb-2 border-b border-gray-200">
          <div className="col-span-4 font-medium text-gray-700">Khoản mục</div>
          <div className="col-span-2 text-center font-medium text-gray-700">Bên nợ</div>
          <div className="col-span-2 text-center font-medium text-gray-700">Bên có</div>
          <div className="col-span-2 text-center font-medium text-gray-700">Số dư ròng</div>
          <div className="col-span-2 text-center font-medium text-gray-700">Loại tài khoản</div>
        </div>

        {/* Items */}
        {section.items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100 hover:bg-gray-50">
            <div className="col-span-4">
              <div className="font-medium text-gray-900">{item.item_name}</div>
              {item.item_code && (
                <div className="text-sm text-gray-500">Mã: {item.item_code}</div>
              )}
              {item.description && (
                <div className="text-sm text-gray-500">{item.description}</div>
              )}
            </div>
            <div className="col-span-2 text-center">
              <span className="text-red-600 font-medium">
                {formatNumber(item.debit_amount)}
              </span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-green-600 font-medium">
                {formatNumber(item.credit_amount)}
              </span>
            </div>
            <div className="col-span-2 text-center">
              <span className={`font-medium ${item.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(item.net_amount)}
              </span>
            </div>
            <div className="col-span-2 text-center">
              <span className={`text-xs px-2 py-1 rounded-full ${getAccountTypeColor(item.account_type)} bg-gray-100`}>
                {getAccountTypeLabel(item.account_type)}
              </span>
            </div>
          </div>
        ))}

        {/* Section Totals */}
        <div className="grid grid-cols-12 gap-4 mt-4 pt-4 border-t-2 border-gray-300 bg-gray-50 rounded-lg p-4">
          <div className="col-span-4 font-semibold text-gray-900">Tổng cộng</div>
          <div className="col-span-2 text-center">
            <span className="text-red-600 font-semibold text-lg">
              {formatNumber(section.total_debit)}
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className="text-green-600 font-semibold text-lg">
              {formatNumber(section.total_credit)}
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className={`font-semibold text-lg ${section.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatNumber(section.net_cash_flow)}
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className="text-gray-500 text-sm">Dòng tiền ròng</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Báo cáo Lưu chuyển Tiền tệ (Chuẩn Việt Nam)
                </h1>
                <p className="text-sm text-gray-500">
                  Phân loại theo bên nợ và bên có
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Tải lại</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Đang tải dữ liệu...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Lỗi</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cash Flow Statement */}
        {data && !loading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <PiggyBank className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Tiền mặt đầu kỳ</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(data.beginning_cash)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Dòng tiền ròng</p>
                    <p className={`text-xl font-semibold ${data.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.net_cash_flow)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <PiggyBank className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Tiền mặt cuối kỳ</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(data.ending_cash)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  {data.cash_flow_validation ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Xác thực</p>
                    <p className={`text-sm font-medium ${data.cash_flow_validation ? 'text-green-600' : 'text-red-600'}`}>
                      {data.cash_flow_validation ? 'Đúng' : 'Sai'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Activities */}
            {renderSection(
              data.operating_activities,
              "Dòng tiền từ hoạt động kinh doanh",
              "bg-blue-50 text-blue-900"
            )}

            {/* Investing Activities */}
            {renderSection(
              data.investing_activities,
              "Dòng tiền từ hoạt động đầu tư",
              "bg-green-50 text-green-900"
            )}

            {/* Financing Activities */}
            {renderSection(
              data.financing_activities,
              "Dòng tiền từ hoạt động tài chính",
              "bg-purple-50 text-purple-900"
            )}

            {/* Final Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Tổng kết Báo cáo Dòng tiền</h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Dòng tiền từ hoạt động kinh doanh</p>
                    <p className={`text-xl font-semibold ${data.total_operating_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.total_operating_cash_flow)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Dòng tiền từ hoạt động đầu tư</p>
                    <p className={`text-xl font-semibold ${data.total_investing_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.total_investing_cash_flow)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Dòng tiền từ hoạt động tài chính</p>
                    <p className={`text-xl font-semibold ${data.total_financing_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.total_financing_cash_flow)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Dòng tiền ròng tổng cộng:</span>
                    <span className={`text-2xl font-bold ${data.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.net_cash_flow)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Báo cáo được tạo: {new Date(data.generated_at).toLocaleString('vi-VN')}</span>
                <span>Tổng giao dịch: {data.total_transactions}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
