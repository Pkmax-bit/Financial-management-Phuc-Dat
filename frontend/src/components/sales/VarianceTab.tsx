'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Download,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { apiGet } from '@/lib/api'

interface VarianceData {
  project_id: string
  project_name: string
  customer_name: string
  quote_amount: number
  invoice_amount: number
  variance_amount: number
  variance_percentage: number
  quote_date: string
  invoice_date: string
  status: 'positive' | 'negative' | 'neutral'
}

interface VarianceTabProps {
  searchTerm: string
}

export default function VarianceTab({ searchTerm }: VarianceTabProps) {
  const [varianceData, setVarianceData] = useState<VarianceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all')

  useEffect(() => {
    fetchVarianceData()
  }, [])

  const fetchVarianceData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch variance data with customer and project names
      const varianceResponse = await apiGet('/api/sales/variance')
      const quotes = varianceResponse.quotes || []
      const invoices = varianceResponse.invoices || []

      console.log('Fetched quotes:', quotes)
      console.log('Fetched invoices:', invoices)
      
      // Debug: Check if quotes have customer and project data
      if (Array.isArray(quotes) && quotes.length > 0) {
        console.log('Sample quote data:', quotes[0])
        console.log('Quote customer data:', quotes[0]?.customers)
        console.log('Quote project data:', quotes[0]?.projects)
        console.log('Quote keys:', Object.keys(quotes[0]))
      }
      
      // Debug: Check if invoices have customer and project data
      if (Array.isArray(invoices) && invoices.length > 0) {
        console.log('Sample invoice data:', invoices[0])
        console.log('Invoice customer data:', invoices[0]?.customers)
        console.log('Invoice project data:', invoices[0]?.projects)
        console.log('Invoice keys:', Object.keys(invoices[0]))
      }

      // Calculate variance for each project
      const varianceMap = new Map<string, VarianceData>()

      // Process quotes
      if (Array.isArray(quotes)) {
        quotes.forEach((quote: any) => {
          if (quote.project_id && quote.total_amount) {
            const key = quote.project_id
            
            // Try multiple ways to get project name
            let projectName = 'Dự án không tên'
            if (quote.projects?.name) {
              projectName = quote.projects.name
            } else if (quote.project_name) {
              projectName = quote.project_name
            } else if (quote.projects?.description) {
              projectName = quote.projects.description
            }
            
            // Try multiple ways to get customer name
            let customerName = 'Khách hàng không tên'
            if (quote.customers?.name) {
              customerName = quote.customers.name
            } else if (quote.customer_name) {
              customerName = quote.customer_name
            }
            
            console.log(`Processing quote for project ${key}:`, {
              projectName,
              customerName,
              quoteAmount: quote.total_amount
            })
            
            if (!varianceMap.has(key)) {
              varianceMap.set(key, {
                project_id: quote.project_id,
                project_name: projectName,
                customer_name: customerName,
                quote_amount: 0,
                invoice_amount: 0,
                variance_amount: 0,
                variance_percentage: 0,
                quote_date: quote.created_at,
                invoice_date: '',
                status: 'neutral'
              })
            }
            const existing = varianceMap.get(key)!
            existing.quote_amount = quote.total_amount
            existing.quote_date = quote.created_at
            // Update names in case they were missing initially
            if (existing.project_name === 'Dự án không tên' && projectName !== 'Dự án không tên') {
              existing.project_name = projectName
            }
            if (existing.customer_name === 'Khách hàng không tên' && customerName !== 'Khách hàng không tên') {
              existing.customer_name = customerName
            }
          }
        })
      }

      // Process invoices
      if (Array.isArray(invoices)) {
        invoices.forEach((invoice: any) => {
          if (invoice.project_id && invoice.total_amount) {
            const key = invoice.project_id
            
            // Try multiple ways to get project name
            let projectName = 'Dự án không tên'
            if (invoice.projects?.name) {
              projectName = invoice.projects.name
            } else if (invoice.project_name) {
              projectName = invoice.project_name
            } else if (invoice.projects?.description) {
              projectName = invoice.projects.description
            }
            
            // Try multiple ways to get customer name
            let customerName = 'Khách hàng không tên'
            if (invoice.customers?.name) {
              customerName = invoice.customers.name
            } else if (invoice.customer_name) {
              customerName = invoice.customer_name
            }
            
            console.log(`Processing invoice for project ${key}:`, {
              projectName,
              customerName,
              invoiceAmount: invoice.total_amount
            })
            
            if (!varianceMap.has(key)) {
              varianceMap.set(key, {
                project_id: invoice.project_id,
                project_name: projectName,
                customer_name: customerName,
                quote_amount: 0,
                invoice_amount: 0,
                variance_amount: 0,
                variance_percentage: 0,
                quote_date: '',
                invoice_date: invoice.created_at,
                status: 'neutral'
              })
            }
            const existing = varianceMap.get(key)!
            existing.invoice_amount = invoice.total_amount
            existing.invoice_date = invoice.created_at
            // Update names in case they were missing initially
            if (existing.project_name === 'Dự án không tên' && projectName !== 'Dự án không tên') {
              existing.project_name = projectName
            }
            if (existing.customer_name === 'Khách hàng không tên' && customerName !== 'Khách hàng không tên') {
              existing.customer_name = customerName
            }
          }
        })
      }

      // Calculate variance for each project
      const varianceResults: VarianceData[] = []
      varianceMap.forEach((data) => {
        // Include projects that have either quote or invoice
        if (data.quote_amount > 0 || data.invoice_amount > 0) {
          if (data.quote_amount > 0 && data.invoice_amount > 0) {
            // Both quote and invoice exist - calculate variance
            data.variance_amount = data.invoice_amount - data.quote_amount
            data.variance_percentage = (data.variance_amount / data.quote_amount) * 100
            
            if (data.variance_percentage > 5) {
              data.status = 'positive'
            } else if (data.variance_percentage < -5) {
              data.status = 'negative'
            } else {
              data.status = 'neutral'
            }
          } else if (data.quote_amount > 0 && data.invoice_amount === 0) {
            // Only quote exists - no invoice yet
            data.variance_amount = 0
            data.variance_percentage = 0
            data.status = 'neutral'
          } else if (data.quote_amount === 0 && data.invoice_amount > 0) {
            // Only invoice exists - no quote
            data.variance_amount = data.invoice_amount
            data.variance_percentage = 100
            data.status = 'positive'
          }
          
          varianceResults.push(data)
        }
      })

      console.log('Variance results:', varianceResults)
      console.log('Total variance items:', varianceResults.length)

      // Sort by variance percentage (highest first)
      varianceResults.sort((a, b) => b.variance_percentage - a.variance_percentage)
      
      setVarianceData(varianceResults)
    } catch (err) {
      console.error('Error fetching variance data:', err)
      setError('Không thể tải dữ liệu chênh lệch')
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
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive':
        return 'text-green-600 bg-green-50'
      case 'negative':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'positive':
        return <TrendingUp className="h-4 w-4" />
      case 'negative':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const filteredData = varianceData.filter(item => {
    const matchesSearch = 
      item.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' || item.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const summaryStats = {
    total: varianceData.length,
    positive: varianceData.filter(item => item.status === 'positive').length,
    negative: varianceData.filter(item => item.status === 'negative').length,
    neutral: varianceData.filter(item => item.status === 'neutral').length,
    avgVariance: varianceData.length > 0 
      ? varianceData.reduce((sum, item) => sum + item.variance_percentage, 0) / varianceData.length 
      : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải dữ liệu chênh lệch...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchVarianceData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng dự án</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tăng giá</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.positive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Giảm giá</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.negative}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gray-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chênh lệch TB</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(summaryStats.avgVariance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Lọc theo:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="positive">Tăng giá</option>
              <option value="negative">Giảm giá</option>
              <option value="neutral">Không đổi</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchVarianceData}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Làm mới
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Variance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dự án
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Báo giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chênh lệch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy dự án nào phù hợp' : 'Chưa có dữ liệu chênh lệch'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.project_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.project_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.quote_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.invoice_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.variance_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        item.variance_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(item.variance_percentage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1">
                          {item.status === 'positive' ? 'Tăng giá' : 
                           item.status === 'negative' ? 'Giảm giá' : 'Không đổi'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
