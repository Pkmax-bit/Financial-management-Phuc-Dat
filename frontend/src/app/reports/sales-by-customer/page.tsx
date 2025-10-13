'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  Building2, 
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  FileText,
  Filter,
  RefreshCw,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface CustomerSalesData {
  customerId: string
  customerName: string
  totalInvoices: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  projectCount: number
  projectBudget: number
  lastInvoiceDate: string
  averageInvoiceAmount: number
}

export default function SalesByCustomerPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CustomerSalesData[]>([])
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
      // Fetch data from database - only real data, no mock/hardcode
      const [invoicesResult, customersResult, projectsResult] = await Promise.all([
        // Get invoices with customer info
        supabase
          .from('invoices')
          .select(`
            total_amount, 
            paid_amount, 
            payment_status, 
            created_at,
            customer_id,
            customers!inner(name)
          `)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59'),
        
        // Get all customers
        supabase
          .from('customers')
          .select('id, name, status'),
        
        // Get projects with customer info
        supabase
          .from('projects')
          .select(`
            budget, 
            actual_cost, 
            status, 
            created_at,
            customer_id,
            customers!inner(name)
          `)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59')
      ])

      // Process customer sales data from real database
      const customerSalesMap = new Map<string, CustomerSalesData>()

      // Process invoices
      if (invoicesResult.data) {
        invoicesResult.data.forEach(invoice => {
          const customerId = invoice.customer_id
          const customerName = invoice.customers?.name || 'Unknown Customer'
          
          if (!customerSalesMap.has(customerId)) {
            customerSalesMap.set(customerId, {
              customerId,
              customerName,
              totalInvoices: 0,
              totalAmount: 0,
              paidAmount: 0,
              pendingAmount: 0,
              projectCount: 0,
              projectBudget: 0,
              lastInvoiceDate: '',
              averageInvoiceAmount: 0
            })
          }
          
          const customerData = customerSalesMap.get(customerId)!
          customerData.totalInvoices += 1
          customerData.totalAmount += invoice.total_amount || 0
          customerData.paidAmount += invoice.paid_amount || 0
          customerData.pendingAmount += (invoice.total_amount || 0) - (invoice.paid_amount || 0)
          
          if (invoice.created_at > customerData.lastInvoiceDate) {
            customerData.lastInvoiceDate = invoice.created_at
          }
        })
      }

      // Process projects
      if (projectsResult.data) {
        projectsResult.data.forEach(project => {
          const customerId = project.customer_id
          const customerName = project.customers?.name || 'Unknown Customer'
          
          if (!customerSalesMap.has(customerId)) {
            customerSalesMap.set(customerId, {
              customerId,
              customerName,
              totalInvoices: 0,
              totalAmount: 0,
              paidAmount: 0,
              pendingAmount: 0,
              projectCount: 0,
              projectBudget: 0,
              lastInvoiceDate: '',
              averageInvoiceAmount: 0
            })
          }
          
          const customerData = customerSalesMap.get(customerId)!
          customerData.projectCount += 1
          customerData.projectBudget += project.budget || 0
        })
      }

      // Calculate averages and sort by total amount
      const customerSalesData = Array.from(customerSalesMap.values()).map(customer => ({
        ...customer,
        averageInvoiceAmount: customer.totalInvoices > 0 ? customer.totalAmount / customer.totalInvoices : 0
      })).sort((a, b) => b.totalAmount - a.totalAmount)

      setData(customerSalesData)
    } catch (err) {
      console.error('Error fetching sales by customer data:', err)
      setError('Không thể tải dữ liệu báo cáo từ cơ sở dữ liệu')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const handleExport = () => {
    console.log('Exporting Sales by Customer report...')
  }

  const getTotalSales = () => {
    return data.reduce((sum, customer) => sum + customer.totalAmount, 0)
  }

  const getTotalPaid = () => {
    return data.reduce((sum, customer) => sum + customer.paidAmount, 0)
  }

  const getTotalPending = () => {
    return data.reduce((sum, customer) => sum + customer.pendingAmount, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8 lg:ml-64 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Building2 className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Báo cáo bán hàng theo khách hàng</h1>
                <p className="text-gray-600">Doanh thu và số lượng bán hàng theo từng khách hàng</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Bộ lọc thời gian:</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Data */}
        {data && !loading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng khách hàng</p>
                    <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalSales())}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Đã thanh toán</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalPaid())}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chưa thanh toán</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalPending())}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Sales Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Chi tiết bán hàng theo khách hàng</h2>
                <p className="text-gray-600">Từ {startDate} đến {endDate}</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hóa đơn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng giá trị
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đã thanh toán
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chưa thanh toán
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dự án
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngân sách dự án
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hóa đơn cuối
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((customer, index) => (
                      <tr key={customer.customerId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-orange-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                              <div className="text-sm text-gray-500">ID: {customer.customerId.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.totalInvoices}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(customer.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(customer.paidAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(customer.pendingAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.projectCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(customer.projectBudget)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.lastInvoiceDate ? formatDate(customer.lastInvoiceDate) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
