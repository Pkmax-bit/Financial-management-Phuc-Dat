'use client'

import React from 'react'
import { 
  Users, 
  Crown, 
  Star, 
  Target, 
  Award, 
  User, 
  Mail, 
  Phone, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  ExternalLink,
  FileText,
  Receipt
} from 'lucide-react'

interface CustomerRanking {
  customer_id: string
  customer_name: string
  customer_code?: string
  customer_email?: string
  customer_phone?: string
  total_sales: number
  total_invoices: number
  total_sales_receipts: number
  average_order_value: number
  last_transaction_date?: string
  growth_rate?: number
  rank: number
}

interface SalesByCustomerData {
  report_period: string
  start_date: string
  end_date: string
  currency: string
  generated_at: string
  total_customers: number
  total_sales: number
  total_invoices: number
  total_sales_receipts: number
  average_order_value: number
  top_customers: CustomerRanking[]
  customer_segments: {
    segment_name: string
    customer_count: number
    total_sales: number
    percentage: number
  }[]
  summary_stats: {
    highest_sales: number
    lowest_sales: number
    median_sales: number
    growth_rate: number
  }
}

interface SalesByCustomerViewProps {
  data: SalesByCustomerData
}

export default function SalesByCustomerView({ data }: SalesByCustomerViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-600" />
      case 2:
        return <Award className="h-5 w-5 text-black" />
      case 3:
        return <Star className="h-5 w-5 text-orange-600" />
      default:
        return <Target className="h-5 w-5 text-blue-600" />
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 2:
        return 'bg-gray-50 border-gray-200 text-gray-800'
      case 3:
        return 'bg-orange-50 border-orange-200 text-orange-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getSegmentColor = (index: number) => {
    const colors = [
      'bg-blue-50 border-blue-200 text-blue-800',
      'bg-green-50 border-green-200 text-green-800',
      'bg-purple-50 border-purple-200 text-purple-800',
      'bg-orange-50 border-orange-200 text-orange-800',
      'bg-red-50 border-red-200 text-red-800'
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Báo cáo Doanh thu theo Khách hàng</h1>
            <p className="text-blue-100 mt-2">
              Kỳ báo cáo: {new Date(data.start_date).toLocaleDateString('vi-VN')} - {new Date(data.end_date).toLocaleDateString('vi-VN')}
            </p>
            <p className="text-blue-100 text-sm">
              Đơn vị tiền tệ: {data.currency}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(data.total_sales)}
            </div>
            <div className="text-blue-100 text-sm">Tổng doanh thu</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Tổng khách hàng</h3>
              <p className="text-3xl font-bold text-blue-600">
                {data.total_customers}
              </p>
            </div>
            <Users className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Tổng đơn hàng</h3>
              <p className="text-3xl font-bold text-green-600">
                {data.total_invoices}
              </p>
            </div>
            <FileText className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Tổng phiếu thu</h3>
              <p className="text-3xl font-bold text-purple-600">
                {data.total_sales_receipts}
              </p>
            </div>
            <Receipt className="h-12 w-12 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Giá trị đơn hàng TB</h3>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(data.average_order_value)}
              </p>
            </div>
            <BarChart3 className="h-12 w-12 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-green-900">THỐNG KÊ TỔNG QUAN</h2>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(data.summary_stats.highest_sales)}
            </div>
            <div className="text-sm text-black">Doanh thu cao nhất</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-black">Doanh thu thấp nhất</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(data.summary_stats.lowest_sales)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-black">Doanh thu trung bình</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(data.summary_stats.median_sales)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-black">Tỷ lệ tăng trưởng</div>
            <div className={`text-lg font-semibold ${data.summary_stats.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary_stats.growth_rate >= 0 ? '+' : ''}{formatPercentage(data.summary_stats.growth_rate)}
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Crown className="h-6 w-6 text-yellow-600 mr-3" />
          <h2 className="text-2xl font-bold text-yellow-900">TOP KHÁCH HÀNG</h2>
        </div>

        <div className="space-y-4">
          {data.top_customers.map((customer, index) => (
            <div key={customer.customer_id} className={`p-4 rounded-lg border-2 ${getRankColor(customer.rank)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {getRankIcon(customer.rank)}
                    <span className="ml-2 font-bold text-lg">#{customer.rank}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{customer.customer_name}</h3>
                    {customer.customer_code && (
                      <p className="text-sm opacity-75">Mã: {customer.customer_code}</p>
                    )}
                    {customer.customer_email && (
                      <p className="text-sm opacity-75 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {customer.customer_email}
                      </p>
                    )}
                    {customer.customer_phone && (
                      <p className="text-sm opacity-75 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatCurrency(customer.total_sales)}
                  </div>
                  <div className="text-sm opacity-75">
                    {customer.total_invoices} đơn hàng • {customer.total_sales_receipts} phiếu thu
                  </div>
                  <div className="text-sm opacity-75">
                    TB: {formatCurrency(customer.average_order_value)}
                  </div>
                  {customer.growth_rate !== undefined && (
                    <div className={`text-sm font-medium ${customer.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {customer.growth_rate >= 0 ? '+' : ''}{formatPercentage(customer.growth_rate)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Segments */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <PieChart className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-2xl font-bold text-purple-900">PHÂN KHÚC KHÁCH HÀNG</h2>
        </div>

        <div className="space-y-4">
          {data.customer_segments.map((segment, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${getSegmentColor(index)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-current mr-3"></div>
                  <div>
                    <h3 className="font-semibold text-lg">{segment.segment_name}</h3>
                    <p className="text-sm opacity-75">
                      {segment.customer_count} khách hàng
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">
                    {formatCurrency(segment.total_sales)}
                  </div>
                  <div className="text-sm opacity-75">
                    {formatPercentage(segment.percentage)} tổng doanh thu
                  </div>
                </div>
              </div>
            </div>
          ))}
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
