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
  Zap,
  Truck,
  Package,
  Receipt,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  PieChart,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import { expensesVendorApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import DrillDownModal from './DrillDownModal'

interface ExpensesByVendorModalProps {
  isOpen: boolean
  onClose: () => void
  startDate: string
  endDate: string
}

interface VendorRanking {
  vendor_id: string
  vendor_name: string
  vendor_code?: string
  vendor_email?: string
  vendor_phone?: string
  vendor_address?: string
  total_expenses: number
  total_bills: number
  total_expense_claims: number
  average_transaction_value: number
  largest_transaction: number
  smallest_transaction: number
  first_transaction_date?: string
  last_transaction_date?: string
  currency: string
  ranking: number
}

interface ExpensesByVendorReport {
  report_period: string
  start_date: string
  end_date: string
  currency: string
  generated_at: string
  total_vendors: number
  total_expenses: number
  average_expenses_per_vendor: number
  top_vendor_percentage: number
  vendor_rankings: VendorRanking[]
  new_vendors: number
  active_vendors: number
  inactive_vendors: number
  total_transactions: number
  total_bills: number
  total_expense_claims: number
}

export default function ExpensesByVendorModal({ isOpen, onClose, startDate, endDate }: ExpensesByVendorModalProps) {
  const [report, setReport] = useState<ExpensesByVendorReport | null>(null)
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
      fetchExpensesByVendorReport()
    }
  }, [isOpen, startDate, endDate])

  const fetchExpensesByVendorReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await expensesVendorApi.getExpensesByVendor(startDate, endDate, 1000)
      
      if (response.success && response.data) {
        setReport(response.data)
      } else {
        setError('Không thể tải báo cáo Chi phí theo Nhà cung cấp')
      }
    } catch (err) {
      console.error('Error fetching expenses by vendor report:', err)
      setError('Lỗi khi tải báo cáo Chi phí theo Nhà cung cấp')
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

  const handleVendorClick = (vendor: VendorRanking) => {
    setDrillDownData({
      accountId: vendor.vendor_id,
      accountName: vendor.vendor_name
    })
    setShowDrillDown(true)
  }

  const getRankingIcon = (ranking: number) => {
    if (ranking === 1) return <Truck className="h-5 w-5 text-yellow-500" />
    if (ranking === 2) return <Package className="h-5 w-5 text-black" />
    if (ranking === 3) return <Package className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-medium text-black">#{ranking}</span>
  }

  const getRankingColor = (ranking: number) => {
    if (ranking === 1) return "bg-yellow-50 border-yellow-200"
    if (ranking === 2) return "bg-gray-50 border-gray-200"
    if (ranking === 3) return "bg-amber-50 border-amber-200"
    return "bg-white border-gray-200"
  }

  const filteredVendors = report?.vendor_rankings.filter(vendor =>
    vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendor_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendor_email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const renderKeyMetrics = () => {
    if (!report) return null

    const metrics = [
      {
        title: "Tổng nhà cung cấp",
        value: report.total_vendors,
        icon: Building2,
        color: "text-blue-600 bg-blue-100",
        description: "Nhà cung cấp có giao dịch"
      },
      {
        title: "Tổng chi phí",
        value: report.total_expenses,
        icon: DollarSign,
        color: "text-red-600 bg-red-100",
        description: "Tổng chi phí từ tất cả nhà cung cấp"
      },
      {
        title: "Chi phí trung bình",
        value: report.average_expenses_per_vendor,
        icon: BarChart3,
        color: "text-purple-600 bg-purple-100",
        description: "Chi phí trung bình mỗi nhà cung cấp"
      },
      {
        title: "Nhà cung cấp mới",
        value: report.new_vendors,
        icon: Target,
        color: "text-orange-600 bg-orange-100",
        description: "Nhà cung cấp lần đầu giao dịch"
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
                  <p className="text-sm font-medium text-black">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.title.includes('Chi phí') ? formatCurrency(metric.value) : metric.value}
                  </p>
                  <p className="text-xs text-black">{metric.description}</p>
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

  const renderTopVendors = () => {
    if (!report) return null

    const topVendors = report.vendor_rankings.slice(0, 5)

    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top 5 Nhà cung cấp</h3>
          <div className="text-sm text-black">
            Chiếm {report.top_vendor_percentage.toFixed(1)}% tổng chi phí
          </div>
        </div>
        
        <div className="space-y-3">
          {topVendors.map((vendor, index) => (
            <div key={vendor.vendor_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center space-x-3">
                {getRankingIcon(vendor.ranking)}
                <div>
                  <div className="font-medium text-gray-900">{vendor.vendor_name}</div>
                  <div className="text-sm text-black">
                    {vendor.total_bills + vendor.total_expense_claims} giao dịch
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(vendor.total_expenses)}</div>
                <div className="text-sm text-black">
                  {((vendor.total_expenses / report.total_expenses) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderVendorTable = () => {
    if (!report) return null

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Bảng xếp hạng Nhà cung cấp</h3>
            <div className="text-sm text-black">
              Hiển thị {paginatedVendors.length} / {filteredVendors.length} nhà cung cấp
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Xếp hạng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Nhà cung cấp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                  Tổng chi phí
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                  Giao dịch
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                  Giá trị TB
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                  Giao dịch lớn nhất
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                  Lần cuối
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedVendors.map((vendor) => (
                <tr 
                  key={vendor.vendor_id} 
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${getRankingColor(vendor.ranking)}`}
                  onClick={() => handleVendorClick(vendor)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRankingIcon(vendor.ranking)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {vendor.vendor_name}
                      </div>
                      {vendor.vendor_code && (
                        <div className="text-sm text-black">
                          {vendor.vendor_code}
                        </div>
                      )}
                      {vendor.vendor_address && (
                        <div className="text-xs text-black flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {vendor.vendor_address}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vendor.vendor_email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {vendor.vendor_email}
                        </div>
                      )}
                      {vendor.vendor_phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {vendor.vendor_phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                      {formatCurrency(vendor.total_expenses)}
                    </div>
                    <div className="text-sm text-black">
                      {((vendor.total_expenses / report.total_expenses) * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {vendor.total_bills + vendor.total_expense_claims}
                    </div>
                    <div className="text-xs text-black">
                      {vendor.total_bills} hóa đơn, {vendor.total_expense_claims} chi phí
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(vendor.average_transaction_value)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(vendor.largest_transaction)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {vendor.last_transaction_date ? formatDate(vendor.last_transaction_date) : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedVendors.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-black mx-auto mb-4" />
            <p className="text-black">Không tìm thấy nhà cung cấp nào</p>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Báo cáo Chi phí theo Nhà cung cấp</h2>
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
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin báo cáo</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Kỳ báo cáo</label>
                  <p className="text-sm text-black">{formatDate(startDate)} - {formatDate(endDate)}</p>
                </div>
                {report && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cập nhật lúc</label>
                    <p className="text-sm text-black">{formatDate(report.generated_at)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Mô tả</label>
                  <p className="text-sm text-black">Báo cáo chi tiết về chi phí và hiệu suất mua hàng theo từng nhà cung cấp</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-black">Đang tải báo cáo Chi phí theo Nhà cung cấp...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchExpensesByVendorReport}
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

              {/* Top Vendors */}
              {renderTopVendors()}

              {/* Search and Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhà cung cấp..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="text-sm text-black">
                  Hiển thị {paginatedVendors.length} / {filteredVendors.length} nhà cung cấp
                </div>
              </div>

              {/* Vendor Table */}
              {renderVendorTable()}

              {/* Pagination */}
              {filteredVendors.length > pageSize && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-black">
                    Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, filteredVendors.length)} 
                    trong tổng số {filteredVendors.length} nhà cung cấp
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
                      disabled={currentPage * pageSize >= filteredVendors.length}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-black">
                  <div>
                    <span className="font-medium">Tổng giao dịch:</span> {report.total_transactions}
                  </div>
                  <div>
                    <span className="font-medium">Tổng hóa đơn:</span> {report.total_bills}
                  </div>
                  <div>
                    <span className="font-medium">Tổng chi phí:</span> {report.total_expense_claims}
                  </div>
                  <div>
                    <span className="font-medium">Đơn vị tiền tệ:</span> {report.currency}
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
            reportType="expenses-vendor"
            accountId={drillDownData.accountId}
            accountName={drillDownData.accountName}
            startDate={startDate}
            endDate={endDate}
          />
        )}
          </div>
        </div>
      </div>
    </div>
  )
}
