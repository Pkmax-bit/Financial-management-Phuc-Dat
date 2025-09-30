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
  Users,
  Crown,
  Star,
  Target,
  Award,
  User,
  Mail,
  Phone,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  PieChart,
  Activity
} from 'lucide-react'
import { salesCustomerApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import DrillDownModal from './DrillDownModal'

interface SalesByCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  startDate: string
  endDate: string
}

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
  largest_order: number
  smallest_order: number
  first_order_date?: string
  last_order_date?: string
  currency: string
  ranking: number
}

interface SalesByCustomerReport {
  report_period: string
  start_date: string
  end_date: string
  currency: string
  generated_at: string
  total_customers: number
  total_sales: number
  average_sales_per_customer: number
  top_customer_percentage: number
  customer_rankings: CustomerRanking[]
  new_customers: number
  returning_customers: number
  inactive_customers: number
  total_transactions: number
  total_invoices: number
  total_sales_receipts: number
}

export default function SalesByCustomerModal({ isOpen, onClose, startDate, endDate }: SalesByCustomerModalProps) {
  const [report, setReport] = useState<SalesByCustomerReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [showDrillDown, setShowDrillDown] = useState(false)
  const [drillDownData, setDrillDownData] = useState<{
    accountId: string
    accountName: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchSalesByCustomerReport()
    }
  }, [isOpen, startDate, endDate])

  const fetchSalesByCustomerReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await salesCustomerApi.getSalesByCustomer(startDate, endDate, 1000)
      
      if (response.success && response.data) {
        setReport(response.data)
      } else {
        setError('Không thể tải báo cáo Doanh thu theo Khách hàng')
      }
    } catch (err) {
      console.error('Error fetching sales by customer report:', err)
      setError('Lỗi khi tải báo cáo Doanh thu theo Khách hàng')
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

  const handleCustomerClick = (customer: CustomerRanking) => {
    setDrillDownData({
      accountId: customer.customer_id,
      accountName: customer.customer_name
    })
    setShowDrillDown(true)
  }

  const getRankingIcon = (ranking: number) => {
    if (ranking === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (ranking === 2) return <Award className="h-5 w-5 text-gray-400" />
    if (ranking === 3) return <Award className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-medium text-gray-500">#{ranking}</span>
  }

  const getRankingColor = (ranking: number) => {
    if (ranking === 1) return "bg-yellow-50 border-yellow-200"
    if (ranking === 2) return "bg-gray-50 border-gray-200"
    if (ranking === 3) return "bg-amber-50 border-amber-200"
    return "bg-white border-gray-200"
  }

  const filteredCustomers = report?.customer_rankings.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const renderKeyMetrics = () => {
    if (!report) return null

    const metrics = [
      {
        title: "Tổng khách hàng",
        value: report.total_customers,
        icon: Users,
        color: "text-blue-600 bg-blue-100",
        description: "Khách hàng có giao dịch"
      },
      {
        title: "Tổng doanh thu",
        value: report.total_sales,
        icon: DollarSign,
        color: "text-green-600 bg-green-100",
        description: "Tổng doanh thu từ tất cả khách hàng"
      },
      {
        title: "Doanh thu trung bình",
        value: report.average_sales_per_customer,
        icon: BarChart3,
        color: "text-purple-600 bg-purple-100",
        description: "Doanh thu trung bình mỗi khách hàng"
      },
      {
        title: "Khách hàng mới",
        value: report.new_customers,
        icon: Star,
        color: "text-orange-600 bg-orange-100",
        description: "Khách hàng lần đầu mua hàng"
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
                    {metric.title.includes('Doanh thu') ? formatCurrency(metric.value) : metric.value}
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

  const renderTopCustomers = () => {
    if (!report) return null

    const topCustomers = report.customer_rankings.slice(0, 5)

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top 5 Khách hàng</h3>
          <div className="text-sm text-gray-600">
            Chiếm {report.top_customer_percentage.toFixed(1)}% tổng doanh thu
          </div>
        </div>
        
        <div className="space-y-3">
          {topCustomers.map((customer, index) => (
            <div key={customer.customer_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center space-x-3">
                {getRankingIcon(customer.ranking)}
                <div>
                  <div className="font-medium text-gray-900">{customer.customer_name}</div>
                  <div className="text-sm text-gray-500">
                    {customer.total_invoices + customer.total_sales_receipts} giao dịch
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(customer.total_sales)}</div>
                <div className="text-sm text-gray-500">
                  {((customer.total_sales / report.total_sales) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderCustomerTable = () => {
    if (!report) return null

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Bảng xếp hạng Khách hàng</h3>
            <div className="text-sm text-gray-500">
              Hiển thị {paginatedCustomers.length} / {filteredCustomers.length} khách hàng
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Xếp hạng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng doanh thu
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giao dịch
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá trị TB
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giao dịch lớn nhất
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lần cuối
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCustomers.map((customer) => (
                <tr 
                  key={customer.customer_id} 
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${getRankingColor(customer.ranking)}`}
                  onClick={() => handleCustomerClick(customer)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRankingIcon(customer.ranking)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {customer.customer_name}
                      </div>
                      {customer.customer_code && (
                        <div className="text-sm text-gray-500">
                          {customer.customer_code}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.customer_email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.customer_email}
                        </div>
                      )}
                      {customer.customer_phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {customer.customer_phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                      {formatCurrency(customer.total_sales)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {((customer.total_sales / report.total_sales) * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {customer.total_invoices + customer.total_sales_receipts}
                    </div>
                    <div className="text-xs text-gray-500">
                      {customer.total_invoices} hóa đơn, {customer.total_sales_receipts} phiếu thu
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(customer.average_order_value)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(customer.largest_order)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {customer.last_order_date ? formatDate(customer.last_order_date) : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy khách hàng nào</p>
          </div>
        )}
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
              <h2 className="text-2xl font-semibold text-gray-900">Báo cáo Doanh thu theo Khách hàng</h2>
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
                    <h1 className="text-3xl font-bold text-gray-900">Báo cáo Doanh thu theo Khách hàng</h1>
                    <p className="mt-2 text-gray-600">
                      Báo cáo chi tiết về doanh thu và hiệu suất bán hàng theo từng khách hàng
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Kỳ báo cáo: {formatDate(startDate)} - {formatDate(endDate)}</span>
                      {report && (
                        <span>• Cập nhật lúc: {formatDate(report.generated_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Đang tải báo cáo Doanh thu theo Khách hàng...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{error}</p>
                    <button
                      onClick={fetchSalesByCustomerReport}
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

                  {/* Top Customers */}
                  {renderTopCustomers()}

                  {/* Search and Filter */}
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm khách hàng..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Hiển thị {paginatedCustomers.length} / {filteredCustomers.length} khách hàng
                    </div>
                  </div>

                  {/* Customer Table */}
                  {renderCustomerTable()}

                  {/* Pagination */}
                  {filteredCustomers.length > pageSize && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, filteredCustomers.length)} 
                        trong tổng số {filteredCustomers.length} khách hàng
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Trang {currentPage}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={currentPage * pageSize >= filteredCustomers.length}
                          className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Report Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Thông tin báo cáo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Tổng giao dịch:</span> {report.total_transactions}
                      </div>
                      <div>
                        <span className="font-medium">Tổng hóa đơn:</span> {report.total_invoices}
                      </div>
                      <div>
                        <span className="font-medium">Tổng phiếu thu:</span> {report.total_sales_receipts}
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
        </div>

        {/* Drill-Down Modal */}
        {drillDownData && (
          <DrillDownModal
            isOpen={showDrillDown}
            onClose={() => setShowDrillDown(false)}
            reportType="sales-customer"
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
