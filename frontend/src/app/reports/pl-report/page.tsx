'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface PLData {
  revenue: number
  costOfGoodsSold: number
  grossProfit: number
  operatingExpenses: number
  operatingIncome: number
  otherIncome: number
  otherExpenses: number
  netIncome: number
}

export default function PLReportPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PLData | null>(null)
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
      // Fetch data from database
      const [invoicesResult, billsResult, projectsResult, expensesResult] = await Promise.all([
        // Get invoices (revenue)
        supabase
          .from('invoices')
          .select('total_amount, payment_status, created_at')
          .eq('payment_status', 'paid')
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59'),
        
        // Get bills (cost of goods sold)
        supabase
          .from('bills')
          .select('amount, status, created_at')
          .eq('status', 'paid')
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59'),
        
        // Get projects (revenue and costs)
        supabase
          .from('projects')
          .select('budget, actual_cost, status, created_at')
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59'),
        
        // Get expenses (operating expenses)
        supabase
          .from('expenses')
          .select('amount, status, expense_date')
          .eq('status', 'approved')
          .gte('expense_date', startDate)
          .lte('expense_date', endDate)
      ])

      // Calculate revenue from invoices and projects - only real data
      const invoiceRevenue = invoicesResult.data?.reduce((sum, invoice) => 
        sum + (invoice.total_amount || 0), 0) || 0
      
      // Calculate project revenue from completed projects
      const completedProjects = projectsResult.data?.filter(project => 
        project.status === 'completed' || project.status === 'active'
      ) || []
      
      const projectRevenue = completedProjects.reduce((sum, project) => 
        sum + (project.budget || 0), 0)
      
      const totalRevenue = invoiceRevenue + projectRevenue

      // Calculate cost of goods sold from bills and project costs
      const costOfGoodsSold = billsResult.data?.reduce((sum, bill) => 
        sum + (bill.amount || 0), 0) || 0

      // Calculate operating expenses from expenses and time entries
      const operatingExpenses = expensesResult.data?.reduce((sum, expense) => 
        sum + (expense.amount || 0), 0) || 0

      // Calculate project costs from actual costs and time entries
      const projectCosts = projectsResult.data?.reduce((sum, project) => 
        sum + (project.actual_cost || 0), 0) || 0
      
      // Calculate time-based costs
      const timeEntriesResult = await supabase
        .from('time_entries')
        .select('hours, hourly_rate, billable')
        .eq('billable', true)
        .gte('date', startDate)
        .lte('date', endDate)
      
      const timeBasedCosts = timeEntriesResult.data?.reduce((sum, entry) => 
        sum + ((entry.hours || 0) * (entry.hourly_rate || 0)), 0) || 0

      // Calculate other income from project overruns
      const projectOverruns = projectsResult.data?.reduce((sum, project) => {
        const overrun = (project.budget || 0) - (project.actual_cost || 0)
        return sum + Math.max(0, overrun)
      }, 0) || 0

      // Calculate other expenses from project underruns
      const projectUnderruns = projectsResult.data?.reduce((sum, project) => {
        const underrun = (project.actual_cost || 0) - (project.budget || 0)
        return sum + Math.max(0, underrun)
      }, 0) || 0

      // Calculate derived values from real data only
      const grossProfit = totalRevenue - costOfGoodsSold
      const operatingIncome = grossProfit - operatingExpenses - projectCosts - timeBasedCosts
      const otherIncome = projectOverruns
      const otherExpenses = projectUnderruns
      const netIncome = operatingIncome + otherIncome - otherExpenses

      // Build P&L data from database only
      const plData: PLData = {
        revenue: totalRevenue,
        costOfGoodsSold: costOfGoodsSold,
        grossProfit: grossProfit,
        operatingExpenses: operatingExpenses + projectCosts + timeBasedCosts,
        operatingIncome: operatingIncome,
        otherIncome: otherIncome,
        otherExpenses: otherExpenses,
        netIncome: netIncome
      }
      
      setData(plData)
    } catch (err) {
      console.error('Error fetching P&L data:', err)
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

  const handleExport = () => {
    // Export functionality
    console.log('Exporting P&L report...')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Báo cáo Kết quả kinh doanh (P&L)</h1>
                <p className="text-gray-600">Báo cáo lãi lỗ, doanh thu và chi phí</p>
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.revenue)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lợi nhuận gộp</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.grossProfit)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lợi nhuận hoạt động</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.operatingIncome)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lợi nhuận ròng</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.netIncome)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed P&L Statement */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Báo cáo Kết quả kinh doanh</h2>
                <p className="text-gray-600">Từ {startDate} đến {endDate}</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {/* Revenue Section */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">DOANH THU</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-700">Doanh thu bán hàng</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost of Goods Sold */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">GIÁ VỐN HÀNG BÁN</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-700">Giá vốn hàng bán</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(data.costOfGoodsSold)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gross Profit */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Lợi nhuận gộp</span>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(data.grossProfit)}</span>
                    </div>
                  </div>

                  {/* Operating Expenses */}
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">CHI PHÍ HOẠT ĐỘNG</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-700">Chi phí hoạt động</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(data.operatingExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operating Income */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Lợi nhuận hoạt động</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(data.operatingIncome)}</span>
                    </div>
                  </div>

                  {/* Other Income/Expenses */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">THU NHẬP/KHÁC</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-700">Thu nhập khác</span>
                        <span className="font-semibold text-green-600">{formatCurrency(data.otherIncome)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-700">Chi phí khác</span>
                        <span className="font-semibold text-red-600">{formatCurrency(data.otherExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">LỢI NHUẬN RÒNG</span>
                      <span className="text-2xl font-bold text-emerald-600">{formatCurrency(data.netIncome)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
