'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Target,
  BarChart3,
  FileText,
  Receipt,
  Building2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

interface Quote {
  id: string
  quote_number: string
  customer_id: string
  customer_name: string
  project_id: string
  project_name: string
  issue_date: string
  valid_until: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  status: string
  created_at: string
}

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  customer_name: string
  project_id: string
  project_name: string
  quote_id: string
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  status: string
  payment_status: string
  created_at: string
}

interface ComparisonData {
  quote: Quote
  invoice: Invoice | null
  variance: number
  variance_percentage: number
  conversion_status: 'converted' | 'not_converted' | 'partial'
  conversion_date: string | null
}

interface ComparisonTabProps {
  searchTerm: string
}

export default function ComparisonTab({ searchTerm }: ComparisonTabProps) {
  const [comparisons, setComparisons] = useState<ComparisonData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'converted' | 'not_converted'>('all')

  useEffect(() => {
    fetchComparisonData()
  }, [])

  const fetchComparisonData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for now - replace with actual API call
      const mockComparisons: ComparisonData[] = [
        {
          quote: {
            id: 'quote-001',
            quote_number: 'Q-2024-001',
            customer_id: 'cust-001',
            customer_name: 'Công ty ABC',
            project_id: 'proj-001',
            project_name: 'Dự án Website',
            issue_date: '2024-12-01',
            valid_until: '2024-12-31',
            subtotal: 10000000,
            tax_rate: 10,
            tax_amount: 1000000,
            total_amount: 11000000,
            status: 'approved',
            created_at: '2024-12-01T09:00:00Z'
          },
          invoice: {
            id: 'inv-001',
            invoice_number: 'INV-2024-001',
            customer_id: 'cust-001',
            customer_name: 'Công ty ABC',
            project_id: 'proj-001',
            project_name: 'Dự án Website',
            quote_id: 'quote-001',
            issue_date: '2024-12-01',
            due_date: '2024-12-31',
            subtotal: 9500000,
            tax_rate: 10,
            tax_amount: 950000,
            total_amount: 10450000,
            status: 'sent',
            payment_status: 'pending',
            created_at: '2024-12-01T10:00:00Z'
          },
          variance: -550000,
          variance_percentage: -5.0,
          conversion_status: 'converted',
          conversion_date: '2024-12-01T10:00:00Z'
        },
        {
          quote: {
            id: 'quote-002',
            quote_number: 'Q-2024-002',
            customer_id: 'cust-002',
            customer_name: 'Công ty XYZ',
            project_id: 'proj-002',
            project_name: 'Dự án Mobile App',
            issue_date: '2024-12-01',
            valid_until: '2024-12-31',
            subtotal: 15000000,
            tax_rate: 10,
            tax_amount: 1500000,
            total_amount: 16500000,
            status: 'approved',
            created_at: '2024-12-01T11:00:00Z'
          },
          invoice: null,
          variance: 0,
          variance_percentage: 0,
          conversion_status: 'not_converted',
          conversion_date: null
        },
        {
          quote: {
            id: 'quote-003',
            quote_number: 'Q-2024-003',
            customer_id: 'cust-003',
            customer_name: 'Công ty DEF',
            project_id: 'proj-003',
            project_name: 'Dự án ERP',
            issue_date: '2024-12-01',
            valid_until: '2024-12-31',
            subtotal: 20000000,
            tax_rate: 10,
            tax_amount: 2000000,
            total_amount: 22000000,
            status: 'approved',
            created_at: '2024-12-01T12:00:00Z'
          },
          invoice: {
            id: 'inv-003',
            invoice_number: 'INV-2024-003',
            customer_id: 'cust-003',
            customer_name: 'Công ty DEF',
            project_id: 'proj-003',
            project_name: 'Dự án ERP',
            quote_id: 'quote-003',
            issue_date: '2024-12-01',
            due_date: '2024-12-31',
            subtotal: 22000000,
            tax_rate: 10,
            tax_amount: 2200000,
            total_amount: 24200000,
            status: 'sent',
            payment_status: 'pending',
            created_at: '2024-12-01T13:00:00Z'
          },
          variance: 2200000,
          variance_percentage: 10.0,
          conversion_status: 'converted',
          conversion_date: '2024-12-01T13:00:00Z'
        }
      ]
      
      setComparisons(mockComparisons)
    } catch (error) {
      console.error('Error fetching comparison data:', error)
      setError('Không thể tải dữ liệu so sánh')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted': return 'bg-green-100 text-green-800'
      case 'not_converted': return 'bg-yellow-100 text-yellow-800'
      case 'partial': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'converted': return 'Đã chuyển đổi'
      case 'not_converted': return 'Chưa chuyển đổi'
      case 'partial': return 'Chuyển đổi một phần'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'converted': return <CheckCircle className="h-4 w-4" />
      case 'not_converted': return <Clock className="h-4 w-4" />
      case 'partial': return <AlertTriangle className="h-4 w-4" />
      default: return <XCircle className="h-4 w-4" />
    }
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600'
    if (variance < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <ArrowUpRight className="h-4 w-4" />
    if (variance < 0) return <ArrowDownRight className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const filteredComparisons = comparisons.filter(comparison => {
    const matchesSearch = comparison.quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comparison.quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comparison.quote.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (comparison.invoice?.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    const matchesView = viewMode === 'all' || comparison.conversion_status === viewMode
    
    return matchesSearch && matchesView
  })

  // Calculate summary statistics
  const totalQuotes = comparisons.length
  const convertedQuotes = comparisons.filter(c => c.conversion_status === 'converted').length
  const notConvertedQuotes = comparisons.filter(c => c.conversion_status === 'not_converted').length
  const totalQuoteAmount = comparisons.reduce((sum, c) => sum + c.quote.total_amount, 0)
  const totalInvoiceAmount = comparisons.filter(c => c.invoice).reduce((sum, c) => sum + (c.invoice?.total_amount || 0), 0)
  const totalVariance = totalInvoiceAmount - totalQuoteAmount
  const variancePercentage = totalQuoteAmount > 0 ? (totalVariance / totalQuoteAmount) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tổng báo giá</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalQuoteAmount)}
              </p>
              <p className="text-sm text-gray-500">{totalQuotes} báo giá</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tổng hóa đơn</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalInvoiceAmount)}
              </p>
              <p className="text-sm text-gray-500">{convertedQuotes} hóa đơn</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Chênh lệch</p>
              <p className={`text-lg font-bold ${getVarianceColor(totalVariance)}`}>
                {formatCurrency(totalVariance)}
              </p>
              <p className="text-sm text-gray-500">
                {variancePercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-500">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tỷ lệ chuyển đổi</p>
              <p className="text-lg font-bold text-gray-900">
                {totalQuotes > 0 ? ((convertedQuotes / totalQuotes) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-gray-500">
                {convertedQuotes}/{totalQuotes} báo giá
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setViewMode('all')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            viewMode === 'all' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setViewMode('converted')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            viewMode === 'converted' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Đã chuyển đổi
        </button>
        <button
          onClick={() => setViewMode('not_converted')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            viewMode === 'not_converted' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Chưa chuyển đổi
        </button>
      </div>

      {/* Comparison Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu so sánh...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchComparisonData}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredComparisons.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu so sánh</h3>
          <p className="text-gray-600 mb-4">Không có báo giá hoặc hóa đơn để so sánh</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Báo giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hóa đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dự án
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chênh lệch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComparisons.map((comparison) => (
                <tr key={comparison.quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {comparison.quote.quote_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(comparison.quote.total_amount)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(comparison.quote.issue_date).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {comparison.invoice ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {comparison.invoice.invoice_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(comparison.invoice.total_amount)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(comparison.invoice.issue_date).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">
                        Chưa có hóa đơn
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {comparison.quote.customer_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {comparison.quote.project_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {comparison.invoice ? (
                      <div className={`flex items-center text-sm ${getVarianceColor(comparison.variance)}`}>
                        {getVarianceIcon(comparison.variance)}
                        <span className="ml-1">
                          {formatCurrency(comparison.variance)} ({comparison.variance_percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comparison.conversion_status)}`}>
                      {getStatusIcon(comparison.conversion_status)}
                      <span className="ml-1">{getStatusText(comparison.conversion_status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {comparison.invoice ? (
                        <button 
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Chỉnh sửa hóa đơn"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      ) : (
                        <button 
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Tạo hóa đơn"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
