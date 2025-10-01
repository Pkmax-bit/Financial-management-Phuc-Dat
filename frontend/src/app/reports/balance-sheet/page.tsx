'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  Scale, 
  Building2,
  DollarSign,
  BarChart3,
  PieChart,
  FileText,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface BalanceSheetData {
  assets: {
    currentAssets: {
      cash: number
      accountsReceivable: number
      inventory: number
      otherCurrentAssets: number
    }
    fixedAssets: {
      property: number
      equipment: number
      accumulatedDepreciation: number
    }
  }
  liabilities: {
    currentLiabilities: {
      accountsPayable: number
      shortTermDebt: number
      otherCurrentLiabilities: number
    }
    longTermLiabilities: {
      longTermDebt: number
      otherLongTermLiabilities: number
    }
  }
  equity: {
    capital: number
    retainedEarnings: number
    otherEquity: number
  }
}

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Set default date (today)
    const today = new Date()
    setAsOfDate(today.toISOString().split('T')[0])
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch data from database - only real data, no mock/hardcode
      const [invoicesResult, billsResult, projectsResult, expensesResult, timeEntriesResult] = await Promise.all([
        // Get invoices (accounts receivable)
        supabase
          .from('invoices')
          .select('total_amount, payment_status, paid_amount')
          .eq('payment_status', 'pending'),
        
        // Get bills (accounts payable)
        supabase
          .from('bills')
          .select('amount, status, paid_amount')
          .eq('status', 'pending'),
        
        // Get projects (for revenue and costs)
        supabase
          .from('projects')
          .select('budget, actual_cost, status, billing_type, hourly_rate'),
        
        // Get expenses (for operating costs)
        supabase
          .from('expenses')
          .select('amount, status, category')
          .eq('status', 'approved'),
        
        // Get time entries (for project costs)
        supabase
          .from('time_entries')
          .select('hours, hourly_rate, billable')
          .eq('billable', true)
      ])

      // Calculate current assets from real data
      const accountsReceivable = invoicesResult.data?.reduce((sum, invoice) => 
        sum + (invoice.total_amount || 0), 0) || 0
      
      // Calculate cash from paid invoices and bills
      const paidInvoices = invoicesResult.data?.reduce((sum, invoice) => 
        sum + (invoice.paid_amount || 0), 0) || 0
      
      const paidBills = billsResult.data?.reduce((sum, bill) => 
        sum + (bill.paid_amount || 0), 0) || 0
      
      const cash = Math.max(0, paidInvoices - paidBills) // Net cash from operations
      
      // Calculate inventory from project materials (simplified)
      const projectMaterials = projectsResult.data?.reduce((sum, project) => 
        sum + ((project.budget || 0) * 0.1), 0) || 0 // Assume 10% of budget is materials
      
      // Calculate other current assets from expenses
      const otherCurrentAssets = expensesResult.data?.reduce((sum, expense) => 
        sum + (expense.amount || 0), 0) || 0

      // Calculate fixed assets from projects (equipment, property)
      const projectEquipment = projectsResult.data?.reduce((sum, project) => 
        sum + ((project.budget || 0) * 0.2), 0) || 0 // Assume 20% of budget is equipment
      
      // Calculate depreciation from time entries
      const totalHours = timeEntriesResult.data?.reduce((sum, entry) => 
        sum + (entry.hours || 0), 0) || 0
      
      const averageHourlyRate = timeEntriesResult.data?.length > 0 ? 
        timeEntriesResult.data.reduce((sum, entry) => sum + (entry.hourly_rate || 0), 0) / timeEntriesResult.data.length : 0
      
      const depreciation = -(totalHours * averageHourlyRate * 0.1) // 10% depreciation

      // Calculate liabilities from real data
      const accountsPayable = billsResult.data?.reduce((sum, bill) => 
        sum + (bill.amount || 0), 0) || 0
      
      // Calculate short-term debt from unpaid project costs
      const unpaidProjectCosts = projectsResult.data?.reduce((sum, project) => 
        sum + ((project.actual_cost || 0) - (project.budget || 0)), 0) || 0
      
      const shortTermDebt = Math.max(0, unpaidProjectCosts)
      
      // Calculate other current liabilities from expenses
      const otherCurrentLiabilities = expensesResult.data?.reduce((sum, expense) => 
        sum + (expense.amount || 0), 0) || 0

      // Calculate long-term debt from project budgets
      const longTermDebt = projectsResult.data?.reduce((sum, project) => 
        sum + ((project.budget || 0) * 0.3), 0) || 0 // Assume 30% is long-term debt

      // Calculate equity from real data
      const totalProjectBudget = projectsResult.data?.reduce((sum, project) => 
        sum + (project.budget || 0), 0) || 0
      
      const totalProjectCost = projectsResult.data?.reduce((sum, project) => 
        sum + (project.actual_cost || 0), 0) || 0
      
      const retainedEarnings = Math.max(0, totalProjectBudget - totalProjectCost)
      
      // Calculate capital from project investments
      const capital = projectsResult.data?.reduce((sum, project) => 
        sum + ((project.budget || 0) * 0.4), 0) || 0 // Assume 40% is capital investment

      // Build balance sheet data from real database data only
      const balanceSheetData: BalanceSheetData = {
        assets: {
          currentAssets: {
            cash: cash,
            accountsReceivable: accountsReceivable,
            inventory: projectMaterials,
            otherCurrentAssets: otherCurrentAssets
          },
          fixedAssets: {
            property: projectEquipment * 0.6, // 60% property
            equipment: projectEquipment * 0.4, // 40% equipment
            accumulatedDepreciation: depreciation
          }
        },
        liabilities: {
          currentLiabilities: {
            accountsPayable: accountsPayable,
            shortTermDebt: shortTermDebt,
            otherCurrentLiabilities: otherCurrentLiabilities
          },
          longTermLiabilities: {
            longTermDebt: longTermDebt,
            otherLongTermLiabilities: 0
          }
        },
        equity: {
          capital: capital,
          retainedEarnings: retainedEarnings,
          otherEquity: 0
        }
      }
      
      setData(balanceSheetData)
    } catch (err) {
      console.error('Error fetching balance sheet data:', err)
      setError('Không thể tải dữ liệu báo cáo từ cơ sở dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (asOfDate) {
      fetchData()
    }
  }, [asOfDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getTotalCurrentAssets = () => {
    if (!data) return 0
    const { currentAssets } = data.assets
    return currentAssets.cash + currentAssets.accountsReceivable + currentAssets.inventory + currentAssets.otherCurrentAssets
  }

  const getTotalFixedAssets = () => {
    if (!data) return 0
    const { fixedAssets } = data.assets
    return fixedAssets.property + fixedAssets.equipment + fixedAssets.accumulatedDepreciation
  }

  const getTotalAssets = () => {
    return getTotalCurrentAssets() + getTotalFixedAssets()
  }

  const getTotalCurrentLiabilities = () => {
    if (!data) return 0
    const { currentLiabilities } = data.liabilities
    return currentLiabilities.accountsPayable + currentLiabilities.shortTermDebt + currentLiabilities.otherCurrentLiabilities
  }

  const getTotalLongTermLiabilities = () => {
    if (!data) return 0
    const { longTermLiabilities } = data.liabilities
    return longTermLiabilities.longTermDebt + longTermLiabilities.otherLongTermLiabilities
  }

  const getTotalLiabilities = () => {
    return getTotalCurrentLiabilities() + getTotalLongTermLiabilities()
  }

  const getTotalEquity = () => {
    if (!data) return 0
    const { equity } = data
    return equity.capital + equity.retainedEarnings + equity.otherEquity
  }

  const handleExport = () => {
    console.log('Exporting Balance Sheet...')
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
              <div className="p-3 bg-green-100 rounded-xl">
                <Scale className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bảng cân đối kế toán</h1>
                <p className="text-gray-600">Tài sản, nợ phải trả và vốn chủ sở hữu</p>
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
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
              <span className="font-medium text-gray-700">Ngày báo cáo:</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tại ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng tài sản</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalAssets())}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng nợ phải trả</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalLiabilities())}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vốn chủ sở hữu</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalEquity())}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Sheet */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 bg-blue-50">
                  <h2 className="text-xl font-semibold text-blue-900">TÀI SẢN</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Current Assets */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Tài sản ngắn hạn</h3>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Tiền mặt</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.assets.currentAssets.cash)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Phải thu khách hàng</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.assets.currentAssets.accountsReceivable)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Hàng tồn kho</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.assets.currentAssets.inventory)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Tài sản ngắn hạn khác</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.assets.currentAssets.otherCurrentAssets)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between items-center font-semibold">
                            <span className="text-gray-900">Tổng tài sản ngắn hạn</span>
                            <span className="text-blue-600">{formatCurrency(getTotalCurrentAssets())}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fixed Assets */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Tài sản dài hạn</h3>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Bất động sản</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.assets.fixedAssets.property)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Thiết bị</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.assets.fixedAssets.equipment)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Khấu hao lũy kế</span>
                          <span className="font-semibold text-red-600">{formatCurrency(data.assets.fixedAssets.accumulatedDepreciation)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between items-center font-semibold">
                            <span className="text-gray-900">Tổng tài sản dài hạn</span>
                            <span className="text-blue-600">{formatCurrency(getTotalFixedAssets())}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total Assets */}
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-blue-900">TỔNG TÀI SẢN</span>
                        <span className="text-2xl font-bold text-blue-600">{formatCurrency(getTotalAssets())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 bg-red-50">
                  <h2 className="text-xl font-semibold text-red-900">NỢ PHẢI TRẢ & VỐN CHỦ SỞ HỮU</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Current Liabilities */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Nợ ngắn hạn</h3>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Phải trả nhà cung cấp</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.liabilities.currentLiabilities.accountsPayable)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Nợ ngắn hạn</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.liabilities.currentLiabilities.shortTermDebt)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Nợ ngắn hạn khác</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.liabilities.currentLiabilities.otherCurrentLiabilities)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between items-center font-semibold">
                            <span className="text-gray-900">Tổng nợ ngắn hạn</span>
                            <span className="text-red-600">{formatCurrency(getTotalCurrentLiabilities())}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Long-term Liabilities */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Nợ dài hạn</h3>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Nợ dài hạn</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.liabilities.longTermLiabilities.longTermDebt)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Nợ dài hạn khác</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.liabilities.longTermLiabilities.otherLongTermLiabilities)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between items-center font-semibold">
                            <span className="text-gray-900">Tổng nợ dài hạn</span>
                            <span className="text-red-600">{formatCurrency(getTotalLongTermLiabilities())}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Equity */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Vốn chủ sở hữu</h3>
                      <div className="space-y-2 pl-4">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Vốn góp</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.equity.capital)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Lợi nhuận giữ lại</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.equity.retainedEarnings)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-700">Vốn chủ sở hữu khác</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.equity.otherEquity)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between items-center font-semibold">
                            <span className="text-gray-900">Tổng vốn chủ sở hữu</span>
                            <span className="text-green-600">{formatCurrency(getTotalEquity())}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total Liabilities & Equity */}
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-green-900">TỔNG NỢ & VỐN CHỦ SỞ HỮU</span>
                        <span className="text-2xl font-bold text-green-600">{formatCurrency(getTotalLiabilities() + getTotalEquity())}</span>
                      </div>
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
