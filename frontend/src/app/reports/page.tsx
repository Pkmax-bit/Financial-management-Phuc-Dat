'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Users,
  FolderOpen,
  Receipt,
  FileText,
  Clock,
  Target,
  AlertCircle,
  Building2,
  CreditCard,
  PiggyBank,
  BookOpen,
  Calculator,
  Scale,
  ArrowLeft
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import { dashboardApi } from '@/lib/api'
import Navigation from '@/components/Navigation'
import PLReportModal from '@/components/reports/PLReportModal'
import BalanceSheetModal from '@/components/reports/BalanceSheetModal'
import BalanceSheetView from '@/components/reports/BalanceSheetView'
import CashFlowModal from '@/components/reports/CashFlowModal'
import SalesByCustomerModal from '@/components/reports/SalesByCustomerModal'
import ExpensesByVendorModal from '@/components/reports/ExpensesByVendorModal'
import GeneralLedgerModal from '@/components/reports/GeneralLedgerModal'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<{ full_name?: string; role?: string; email?: string; id?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [showPLModal, setShowPLModal] = useState(false)
  const [plDateRange, setPLDateRange] = useState(() => {
    const now = new Date()
    return {
      startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      endDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`
    }
  })
  const [showBalanceSheetModal, setShowBalanceSheetModal] = useState(false)
  const [balanceSheetDate, setBalanceSheetDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [showCashFlowModal, setShowCashFlowModal] = useState(false)
  const [cashFlowDateRange, setCashFlowDateRange] = useState(() => {
    const now = new Date()
    return {
      startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      endDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`
    }
  })
  const [showSalesByCustomerModal, setShowSalesByCustomerModal] = useState(false)
  const [salesByCustomerDateRange, setSalesByCustomerDateRange] = useState(() => {
    const now = new Date()
    return {
      startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      endDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`
    }
  })
  const [showExpensesByVendorModal, setShowExpensesByVendorModal] = useState(false)
  const [expensesByVendorDateRange, setExpensesByVendorDateRange] = useState(() => {
    const now = new Date()
    return {
      startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      endDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`
    }
  })
  const [showGeneralLedgerModal, setShowGeneralLedgerModal] = useState(false)
  const [generalLedgerDateRange, setGeneralLedgerDateRange] = useState(() => {
    const now = new Date()
    return {
      startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      endDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`
    }
  })
  
  // Month filter for reports
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM format
  
  // Report data states
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null)
  const [balanceSheetLoading, setBalanceSheetLoading] = useState(false)
  const [plReportData, setPLReportData] = useState<any>(null)
  const [plReportLoading, setPLReportLoading] = useState(false)
  const [cashFlowData, setCashFlowData] = useState<any>(null)
  const [cashFlowLoading, setCashFlowLoading] = useState(false)
  
  const router = useRouter()

  // Fetch balance sheet data
  const fetchBalanceSheetData = async (date: string) => {
    setBalanceSheetLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/reports/financial/balance-sheet-demo?as_of_date=${date}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Balance sheet data received:', data)
        setBalanceSheetData(data)
      } else {
        console.error('Failed to fetch balance sheet data:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching balance sheet data:', error)
    } finally {
      setBalanceSheetLoading(false)
    }
  }

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (userData) {
          setUser(userData)
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true)
      const data = await dashboardApi.getDashboardStats()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Không thể tải dữ liệu dashboard')
    } finally {
      setDashboardLoading(false)
    }
  }

  // Monthly revenue data from API or empty if not available
  const monthlyRevenueData = dashboardData?.monthlyRevenueData || []

  const expenseCategoryData = dashboardData?.expensesByCategory?.map((item: any, index: number) => ({
    name: item.category,
    value: item.amount,
    color: item.color || ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][index % 6]
  })) || []

  const topCustomersData = dashboardData?.topCustomers || []

  const projectProfitabilityData = dashboardData?.projectProfitability || []

  const dashboardStats = dashboardData ? {
    monthlyRevenue: dashboardData.totalRevenue || 0,
    monthlyExpenses: dashboardData.totalExpenses || 0,
    monthlyProfit: dashboardData.profitLoss || 0,
    totalCustomers: 156, // This would need a separate API call
    totalProjects: 24, // This would need a separate API call
    activeProjects: 8, // This would need a separate API call
    totalEmployees: 45, // This would need a separate API call
    pendingInvoices: dashboardData.openInvoices || 0,
    pendingAmount: dashboardData.pendingBills || 0
  } : {
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    monthlyProfit: 0,
    totalCustomers: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalEmployees: 0,
    pendingInvoices: 0,
    pendingAmount: 0
  }

  const tabs = [
    { id: 'overview', name: 'Tổng quan', icon: BarChart3 },
    { id: 'reports-list', name: 'Danh sách báo cáo', icon: FileText },
    { id: 'financial', name: 'Tài chính', icon: DollarSign },
    { id: 'pl-report', name: 'P&L Report', icon: FileText },
    { id: 'balance-sheet', name: 'Balance Sheet', icon: Building2 },
    { id: 'cash-flow', name: 'Cash Flow', icon: TrendingUp },
    { id: 'sales-customer', name: 'Doanh thu KH', icon: Users },
    { id: 'expenses-vendor', name: 'Chi phí NCC', icon: Building2 },
    { id: 'general-ledger', name: 'Sổ cái', icon: BookOpen },
    { id: 'customers', name: 'Khách hàng', icon: Users },
    { id: 'projects', name: 'Dự án', icon: FolderOpen },
    { id: 'expenses', name: 'Chi phí', icon: Receipt }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const renderReportHeader = (title: string, icon: any) => {
    const IconComponent = icon
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <IconComponent className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">{title}</span>
          </div>
          <button
            onClick={() => setActiveTab('reports-list')}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {dashboardLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
          <div className="flex items-center">
              <div className="p-3 rounded-xl bg-green-500 shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-green-700">Doanh thu tháng</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(dashboardStats.monthlyRevenue)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-semibold text-green-600">+12%</span>
              </div>
              <p className="text-xs text-green-600 mt-1">so với tháng trước</p>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-6 border border-red-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
          <div className="flex items-center">
              <div className="p-3 rounded-xl bg-red-500 shadow-lg">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-red-700">Chi phí tháng</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(dashboardStats.monthlyExpenses)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end">
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm font-semibold text-red-600">+5%</span>
              </div>
              <p className="text-xs text-red-600 mt-1">so với tháng trước</p>
            </div>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
          <div className="flex items-center">
              <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-blue-700">Lợi nhuận</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(dashboardStats.monthlyProfit)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end">
                <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-semibold text-blue-600">+18%</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">so với tháng trước</p>
            </div>
          </div>
        </div>

        {/* Customers Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
          <div className="flex items-center">
              <div className="p-3 rounded-xl bg-purple-500 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-purple-700">Khách hàng</p>
                <p className="text-2xl font-bold text-purple-900">{dashboardStats.totalCustomers}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end">
                <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-sm font-semibold text-purple-600">+8</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">khách hàng mới</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Xu hướng Doanh thu & Chi phí</h3>
            <p className="text-sm text-gray-600 mt-1">Biểu đồ so sánh doanh thu và chi phí theo tháng</p>
          </div>
          <div className="flex space-x-4">
            <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-700">Doanh thu</span>
        </div>
            <div className="flex items-center bg-red-50 px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-red-700">Chi phí</span>
            </div>
          </div>
        </div>
        {monthlyRevenueData.length > 0 ? (
          <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(Number(value)), name === 'revenue' ? 'Doanh thu' : 'Chi phí']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fill="url(#revenueGradient)" 
                  fillOpacity={0.6} 
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fill="url(#expensesGradient)" 
                  fillOpacity={0.6} 
                />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-6 text-gray-300" />
              <h4 className="text-lg font-medium text-gray-700 mb-2">Chưa có dữ liệu</h4>
              <p className="text-sm text-gray-500 mb-4">Dữ liệu doanh thu và chi phí sẽ hiển thị khi có giao dịch</p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Thêm hóa đơn và chi phí để xem biểu đồ</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Projects Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Dự án đang hoạt động</p>
              <p className="text-3xl font-bold text-blue-900">{dashboardStats.activeProjects}</p>
              <p className="text-xs text-blue-600 mt-1">Dự án đang thực hiện</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
              <FolderOpen className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Pending Invoices Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg p-6 border border-yellow-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Hóa đơn chờ thanh toán</p>
              <p className="text-3xl font-bold text-yellow-900">{dashboardStats.pendingInvoices}</p>
              <p className="text-xs text-yellow-600 mt-1">Cần xử lý</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-500 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Total Employees Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Tổng nhân viên</p>
              <p className="text-3xl font-bold text-green-900">{dashboardStats.totalEmployees}</p>
              <p className="text-xs text-green-600 mt-1">Nhân viên trong hệ thống</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Health Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg p-8 border border-indigo-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Tình hình Tài chính</h3>
            <p className="text-sm text-gray-600 mt-1">Tổng quan về sức khỏe tài chính của doanh nghiệp</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">Tích cực</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Profit Margin */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tỷ lệ lợi nhuận</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.monthlyRevenue > 0 
                    ? ((dashboardStats.monthlyProfit / dashboardStats.monthlyRevenue) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <Calculator className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Cash Flow Status */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dòng tiền</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.monthlyProfit > 0 ? 'Dương' : 'Âm'}
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-green-500" />
            </div>
          </div>

          {/* Expense Ratio */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tỷ lệ chi phí</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats.monthlyRevenue > 0 
                    ? ((dashboardStats.monthlyExpenses / dashboardStats.monthlyRevenue) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <Receipt className="h-8 w-8 text-red-500" />
            </div>
          </div>

          {/* Growth Rate */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tăng trưởng</p>
                <p className="text-2xl font-bold text-gray-900">+12%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Hoạt động Gần đây</h3>
            <p className="text-sm text-gray-600 mt-1">Các giao dịch và sự kiện mới nhất</p>
          </div>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Xem tất cả
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="p-2 bg-green-500 rounded-lg mr-4">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Hóa đơn mới được thanh toán</p>
              <p className="text-sm text-gray-600">Khách hàng ABC Corp - {formatCurrency(2500000)}</p>
            </div>
            <span className="text-sm text-gray-500">2 giờ trước</span>
          </div>
          
          <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="p-2 bg-yellow-500 rounded-lg mr-4">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Chi phí mới được thêm</p>
              <p className="text-sm text-gray-600">Văn phòng phẩm - {formatCurrency(500000)}</p>
            </div>
            <span className="text-sm text-gray-500">4 giờ trước</span>
          </div>
          
          <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="p-2 bg-blue-500 rounded-lg mr-4">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Khách hàng mới đăng ký</p>
              <p className="text-sm text-gray-600">XYZ Company đã tham gia hệ thống</p>
            </div>
            <span className="text-sm text-gray-500">1 ngày trước</span>
          </div>
        </div>
      </div>
    </div>
  )


  const renderFinancialTab = () => {
    // Financial reports for the selected month
    const financialReports = [
      {
        id: 'pl-report',
        name: 'P&L Report',
        description: 'Báo cáo Kết quả Kinh doanh',
        icon: FileText,
        color: 'blue',
        category: 'Tài chính'
      },
      {
        id: 'balance-sheet',
        name: 'Balance Sheet',
        description: 'Bảng Cân đối Kế toán',
        icon: Building2,
        color: 'green',
        category: 'Tài chính'
      },
      {
        id: 'cash-flow',
        name: 'Cash Flow',
        description: 'Báo cáo Lưu chuyển Tiền tệ',
        icon: TrendingUp,
        color: 'purple',
        category: 'Tài chính'
      }
    ]

    // Generate month options for the last 12 months
    const monthOptions: Array<{ value: string; label: string }> = []
    const seenMonths = new Set<string>()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthValue = date.toISOString().slice(0, 7)
      const monthLabel = date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
      
      // Only add if we haven't seen this month before
      if (!seenMonths.has(monthValue)) {
        seenMonths.add(monthValue)
        monthOptions.push({ value: monthValue, label: monthLabel })
      }
    }

    const handleReportClick = (reportId: string) => {
      setActiveTab(reportId)
    }

    const handleMonthClick = (monthValue: string) => {
      // Set the selected month and show report details
      setSelectedMonth(monthValue)
      // You can add logic here to show specific report for that month
    }

    const getColorClasses = (color: string) => {
      const colorMap = {
        blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
        green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
        purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
      }
      return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
    }

    const getIconColor = (color: string) => {
      const colorMap = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        purple: 'text-purple-600'
      }
      return colorMap[color as keyof typeof colorMap] || 'text-gray-600'
    }

    return (
    <div className="space-y-6">
        {/* Header with Month Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Báo cáo Tài chính</h2>
              <p className="text-sm text-gray-600 mt-1">Chọn tháng để xem báo cáo tài chính chi tiết</p>
          </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Tháng:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
          </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Hiển thị báo cáo tài chính cho tháng: <strong>{monthOptions.find(opt => opt.value === selectedMonth)?.label}</strong>
              </span>
          </div>
        </div>
      </div>

        {/* Financial Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {financialReports.map((report) => {
            const IconComponent = report.icon
            return (
              <div
                key={report.id}
                onClick={() => handleReportClick(report.id)}
                className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${getColorClasses(report.color)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-white shadow-sm ${getIconColor(report.color)}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-lg">{report.name}</h3>
                      <p className="text-sm opacity-75">{report.category}</p>
                    </div>
                  </div>
                  <div className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
                    {report.id}
                  </div>
                </div>
                
                <p className="text-sm mb-4 opacity-90">{report.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium opacity-75">
                    Tháng: {monthOptions.find(opt => opt.value === selectedMonth)?.label}
                  </span>
                  <div className="flex items-center text-xs font-medium">
                    <span>Xem chi tiết</span>
                    <TrendingUp className="h-4 w-4 ml-1" />
        </div>
      </div>
    </div>
  )
          })}
        </div>

        {/* Monthly Reports List */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Báo cáo theo tháng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthOptions.map((month) => (
              <div
                key={month.value}
                onClick={() => handleMonthClick(month.value)}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                  selectedMonth === month.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{month.label}</h4>
                    <p className="text-sm text-gray-600">Báo cáo tài chính</p>
                  </div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {month.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">Tổng quan</span>
            </button>
            <button
              onClick={() => setActiveTab('reports-list')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="font-medium">Danh sách báo cáo</span>
            </button>
            <button
              onClick={() => setActiveTab('pl-report')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium">P&L Report</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderReportsListTab = () => {
    // Define report types with their details
    const reportTypes = [
      {
        id: 'pl-report',
        name: 'P&L Report',
        description: 'Báo cáo Kết quả Kinh doanh',
        icon: FileText,
        color: 'blue',
        category: 'Tài chính'
      },
      {
        id: 'balance-sheet',
        name: 'Balance Sheet',
        description: 'Bảng Cân đối Kế toán',
        icon: Building2,
        color: 'green',
        category: 'Tài chính'
      },
      {
        id: 'cash-flow',
        name: 'Cash Flow',
        description: 'Báo cáo Lưu chuyển Tiền tệ',
        icon: TrendingUp,
        color: 'purple',
        category: 'Tài chính'
      },
      {
        id: 'sales-customer',
        name: 'Doanh thu KH',
        description: 'Báo cáo Doanh thu theo Khách hàng',
        icon: Users,
        color: 'orange',
        category: 'Bán hàng'
      },
      {
        id: 'expenses-vendor',
        name: 'Chi phí NCC',
        description: 'Báo cáo Chi phí theo Nhà cung cấp',
        icon: Building2,
        color: 'red',
        category: 'Chi phí'
      },
      {
        id: 'general-ledger',
        name: 'Sổ cái',
        description: 'Sổ cái Tổng hợp',
        icon: BookOpen,
        color: 'indigo',
        category: 'Kế toán'
      },
      {
        id: 'customers',
        name: 'Khách hàng',
        description: 'Báo cáo Khách hàng',
        icon: Users,
        color: 'teal',
        category: 'Bán hàng'
      },
      {
        id: 'projects',
        name: 'Dự án',
        description: 'Báo cáo Dự án',
        icon: FolderOpen,
        color: 'pink',
        category: 'Dự án'
      },
      {
        id: 'expenses',
        name: 'Chi phí',
        description: 'Báo cáo Chi phí',
        icon: Receipt,
        color: 'yellow',
        category: 'Chi phí'
      }
    ]

    // Get current month and year
    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
    
    // Generate month options for the last 12 months
    const monthOptions: Array<{ value: string; label: string }> = []
    const seenMonths = new Set<string>()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthValue = date.toISOString().slice(0, 7)
      const monthLabel = date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
      
      // Only add if we haven't seen this month before
      if (!seenMonths.has(monthValue)) {
        seenMonths.add(monthValue)
        monthOptions.push({ value: monthValue, label: monthLabel })
      }
    }

    const handleReportClick = (reportId: string) => {
      setActiveTab(reportId)
    }

    const getColorClasses = (color: string) => {
      const colorMap = {
        blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
        green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
        purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
        orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
        red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
        teal: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100',
        pink: 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
      }
      return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
    }

    const getIconColor = (color: string) => {
      const colorMap = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        purple: 'text-purple-600',
        orange: 'text-orange-600',
        red: 'text-red-600',
        indigo: 'text-indigo-600',
        teal: 'text-teal-600',
        pink: 'text-pink-600',
        yellow: 'text-yellow-600'
      }
      return colorMap[color as keyof typeof colorMap] || 'text-gray-600'
    }

    return (
      <div className="space-y-6">
        {/* Header with Month Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Danh sách Báo cáo Tài chính</h2>
              <p className="text-sm text-gray-600 mt-1">Chọn tháng để xem báo cáo chi tiết</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Tháng:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Hiển thị báo cáo cho tháng: <strong>{monthOptions.find(opt => opt.value === selectedMonth)?.label}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => {
            const IconComponent = report.icon
            return (
              <div
                key={report.id}
                onClick={() => handleReportClick(report.id)}
                className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${getColorClasses(report.color)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-white shadow-sm ${getIconColor(report.color)}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-lg">{report.name}</h3>
                      <p className="text-sm opacity-75">{report.category}</p>
                    </div>
                  </div>
                  <div className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
                    {report.id}
                  </div>
                </div>
                
                <p className="text-sm mb-4 opacity-90">{report.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium opacity-75">
                    Tháng: {monthOptions.find(opt => opt.value === selectedMonth)?.label}
                  </span>
                  <div className="flex items-center text-xs font-medium">
                    <span>Xem chi tiết</span>
                    <TrendingUp className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">Tổng quan</span>
            </button>
            <button
              onClick={() => setActiveTab('reports-list')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="font-medium">Danh sách báo cáo</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderCustomersTab = () => (
    <div className="space-y-6">
      {renderReportHeader("Báo cáo Khách hàng", Users)}
      
      {/* Top Customers Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
        {topCustomersData.length > 0 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCustomersData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Chưa có dữ liệu khách hàng</p>
              <p className="text-sm">Dữ liệu sẽ hiển thị khi có hóa đơn đã thanh toán</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderProjectsTab = () => (
    <div className="space-y-6">
      {renderReportHeader("Báo cáo Dự án", FolderOpen)}
      
      {/* Project Profitability */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Profitability</h3>
        {projectProfitabilityData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {projectProfitabilityData.map((project: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {project.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(project.budget)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(project.actual)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    project.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(project.profit)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    project.margin >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {project.margin.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Chưa có dữ liệu dự án</p>
              <p className="text-sm">Dữ liệu sẽ hiển thị khi có dự án được tạo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderExpensesTab = () => (
    <div className="space-y-6">
      {renderReportHeader("Báo cáo Chi phí", Receipt)}
      
      {/* Expenses by Category */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
        {expenseCategoryData.length > 0 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={expenseCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                  {expenseCategoryData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Chưa có dữ liệu chi phí theo danh mục</p>
              <p className="text-sm">Dữ liệu sẽ hiển thị khi có chi phí được phê duyệt</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderBalanceSheetTab = () => {
    // Balance sheet reports for the selected month
    const balanceSheetReports = [
      {
        id: 'balance-sheet',
        name: 'Balance Sheet',
        description: 'Bảng Cân đối Kế toán',
        icon: Building2,
        color: 'green',
        category: 'Tài chính'
      }
    ]

    // Generate month options for the last 12 months
    const monthOptions: Array<{ value: string; label: string }> = []
    const seenMonths = new Set<string>()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthValue = date.toISOString().slice(0, 7)
      const monthLabel = date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
      
      // Only add if we haven't seen this month before
      if (!seenMonths.has(monthValue)) {
        seenMonths.add(monthValue)
        monthOptions.push({ value: monthValue, label: monthLabel })
      }
    }

    const handleReportClick = (reportId: string) => {
      console.log('Report clicked:', reportId)
      if (reportId === 'balance-sheet') {
        const date = selectedMonth + '-01' // Convert month to date
        console.log('Fetching balance sheet for date:', date)
        setBalanceSheetDate(date)
        fetchBalanceSheetData(date)
      } else {
        setActiveTab(reportId)
      }
    }

    const handleMonthClick = (monthValue: string) => {
      setSelectedMonth(monthValue)
    }

    const getColorClasses = (color: string) => {
      const colorMap = {
        green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
      }
      return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
    }

    const getIconColor = (color: string) => {
      const colorMap = {
        green: 'text-green-600'
      }
      return colorMap[color as keyof typeof colorMap] || 'text-gray-600'
    }

    return (
      <div className="space-y-6">
        {/* Header with Month Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bảng Cân đối Kế toán</h2>
              <p className="text-sm text-gray-600 mt-1">Chọn tháng để xem bảng cân đối kế toán chi tiết</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Tháng:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                Hiển thị bảng cân đối cho tháng: <strong>{monthOptions.find(opt => opt.value === selectedMonth)?.label}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Balance Sheet Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {balanceSheetReports.map((report) => {
            const IconComponent = report.icon
            return (
              <div
                key={report.id}
                onClick={() => handleReportClick(report.id)}
                className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${getColorClasses(report.color)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-white shadow-sm ${getIconColor(report.color)}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-lg">{report.name}</h3>
                      <p className="text-sm opacity-75">{report.category}</p>
                    </div>
                  </div>
                  <div className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
                    {report.id}
                  </div>
                </div>
                
                <p className="text-sm mb-4 opacity-90">{report.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium opacity-75">
                    Tháng: {monthOptions.find(opt => opt.value === selectedMonth)?.label}
                  </span>
                  <div className="flex items-center text-xs font-medium">
                    <span>Xem chi tiết</span>
                    <TrendingUp className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Monthly Reports List */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Báo cáo theo tháng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthOptions.map((month) => (
              <div
                key={month.value}
                onClick={() => handleMonthClick(month.value)}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                  selectedMonth === month.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{month.label}</h4>
                    <p className="text-sm text-gray-600">Bảng cân đối kế toán</p>
                  </div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {month.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balance Sheet Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan Bảng Cân đối</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">Tài sản</h4>
                  <p className="text-xs text-blue-700">Tài sản ngắn hạn và dài hạn</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-900">Nợ phải trả</h4>
                  <p className="text-xs text-red-700">Các khoản nợ ngắn hạn và dài hạn</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <PiggyBank className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-900">Vốn chủ sở hữu</h4>
                  <p className="text-xs text-green-700">Vốn đầu tư và lợi nhuận giữ lại</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">Tổng quan</span>
            </button>
            <button
              onClick={() => setActiveTab('reports-list')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="font-medium">Danh sách báo cáo</span>
            </button>
            <button
              onClick={() => setShowBalanceSheetModal(true)}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">Xem Bảng Cân đối</span>
            </button>
          </div>
        </div>

        {/* Balance Sheet Report Display */}
        {balanceSheetLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải báo cáo...</span>
          </div>
        )}

        {balanceSheetData && !balanceSheetLoading && (
          <div className="mt-8">
            <BalanceSheetView data={balanceSheetData} />
          </div>
        )}

        {/* Debug info */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold">Debug Info:</h4>
          <p>Loading: {balanceSheetLoading ? 'true' : 'false'}</p>
          <p>Data: {balanceSheetData ? 'Available' : 'None'}</p>
          <p>Selected Month: {selectedMonth}</p>
        </div>
      </div>
    )
  }

  const renderBalanceSheetTabOld = () => (
    <div className="space-y-6">
      {renderReportHeader("Bảng Cân đối Kế toán", Building2)}
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bảng Cân đối Kế toán</h3>
            <p className="text-sm text-gray-600 mt-1">
              Bức ảnh chụp nhanh về tình hình tài chính của công ty tại một thời điểm cụ thể
            </p>
          </div>
          <button
            onClick={() => setShowBalanceSheetModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Xem Bảng Cân đối
          </button>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tính đến ngày
          </label>
          <input
            type="date"
            value={balanceSheetDate}
            onChange={(e) => setBalanceSheetDate(e.target.value)}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Balance Sheet Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Tài sản</h4>
                <p className="text-xs text-blue-700">Tài sản ngắn hạn và dài hạn của công ty</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-900">Nợ phải trả</h4>
                <p className="text-xs text-red-700">Các khoản nợ ngắn hạn và dài hạn</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <PiggyBank className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-900">Vốn chủ sở hữu</h4>
                <p className="text-xs text-green-700">Vốn đầu tư và lợi nhuận giữ lại</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Thao tác nhanh</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBalanceSheetDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Hôm nay
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
                setBalanceSheetDate(lastMonth.toISOString().split('T')[0])
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng trước
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31)
                setBalanceSheetDate(endOfLastYear.toISOString().split('T')[0])
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cuối năm trước
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPLReportTab = () => (
    <div className="space-y-6">
      {renderReportHeader("Báo cáo Kết quả Kinh doanh (P&L)", FileText)}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Báo cáo Kết quả Kinh doanh (P&L)</h3>
            <p className="text-sm text-gray-600 mt-1">
              Báo cáo tài chính chuẩn mực thể hiện lợi nhuận của công ty
            </p>
          </div>
          <button
            onClick={() => setShowPLModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Xem báo cáo P&L
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={plDateRange.startDate}
              onChange={(e) => setPLDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={plDateRange.endDate}
              onChange={(e) => setPLDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* P&L Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-900">Doanh thu</h4>
                <p className="text-xs text-green-700">Tổng hợp doanh thu từ bán hàng và dịch vụ</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-900">Giá vốn hàng bán</h4>
                <p className="text-xs text-red-700">Chi phí trực tiếp tạo ra sản phẩm/dịch vụ</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Lợi nhuận ròng</h4>
                <p className="text-xs text-blue-700">Kết quả cuối cùng sau tất cả chi phí</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Thao tác nhanh</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                setPLDateRange({
                  startDate: lastMonth.toISOString().split('T')[0],
                  endDate: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng trước
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                setPLDateRange({
                  startDate: thisMonth.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng này
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const thisYear = new Date(today.getFullYear(), 0, 1)
                setPLDateRange({
                  startDate: thisYear.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Năm này
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCashFlowTab = () => (
    <div className="space-y-6">
      {renderReportHeader("Báo cáo Lưu chuyển Tiền tệ", TrendingUp)}
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Báo cáo Lưu chuyển Tiền tệ</h3>
            <p className="text-sm text-gray-600 mt-1">
              Báo cáo chi tiết về các dòng tiền vào và ra của công ty theo 3 hoạt động chính
            </p>
          </div>
          <button
            onClick={() => setShowCashFlowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Xem Cash Flow
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={cashFlowDateRange.startDate}
              onChange={(e) => setCashFlowDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={cashFlowDateRange.endDate}
              onChange={(e) => setCashFlowDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cash Flow Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Hoạt động Kinh doanh</h4>
                <p className="text-xs text-blue-700">Dòng tiền từ hoạt động sản xuất kinh doanh chính</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-purple-900">Hoạt động Đầu tư</h4>
                <p className="text-xs text-purple-700">Mua bán tài sản cố định và đầu tư dài hạn</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <PiggyBank className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-900">Hoạt động Tài chính</h4>
                <p className="text-xs text-green-700">Vay/trả nợ, góp vốn và chia cổ tức</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Thao tác nhanh</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                setCashFlowDateRange({
                  startDate: lastMonth.toISOString().split('T')[0],
                  endDate: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng trước
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                setCashFlowDateRange({
                  startDate: thisMonth.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng này
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const thisYear = new Date(today.getFullYear(), 0, 1)
                setCashFlowDateRange({
                  startDate: thisYear.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Năm này
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSalesCustomerTab = () => {
    // Sales customer reports for the selected month
    const salesReports = [
      {
        id: 'sales-customer',
        name: 'Doanh thu KH',
        description: 'Báo cáo Doanh thu theo Khách hàng',
        icon: Users,
        color: 'orange',
        category: 'Bán hàng'
      }
    ]

    // Generate month options for the last 12 months
    const monthOptions: Array<{ value: string; label: string }> = []
    const seenMonths = new Set<string>()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthValue = date.toISOString().slice(0, 7)
      const monthLabel = date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
      
      // Only add if we haven't seen this month before
      if (!seenMonths.has(monthValue)) {
        seenMonths.add(monthValue)
        monthOptions.push({ value: monthValue, label: monthLabel })
      }
    }

    const handleReportClick = (reportId: string) => {
      setActiveTab(reportId)
    }

    const handleMonthClick = (monthValue: string) => {
      setSelectedMonth(monthValue)
    }

    const getColorClasses = (color: string) => {
      const colorMap = {
        orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
      }
      return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
    }

    const getIconColor = (color: string) => {
      const colorMap = {
        orange: 'text-orange-600'
      }
      return colorMap[color as keyof typeof colorMap] || 'text-gray-600'
    }

    return (
      <div className="space-y-6">
        {/* Header with Month Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Báo cáo Doanh thu Khách hàng</h2>
              <p className="text-sm text-gray-600 mt-1">Chọn tháng để xem báo cáo doanh thu chi tiết</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Tháng:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-800">
                Hiển thị báo cáo doanh thu cho tháng: <strong>{monthOptions.find(opt => opt.value === selectedMonth)?.label}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Sales Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salesReports.map((report) => {
            const IconComponent = report.icon
            return (
              <div
                key={report.id}
                onClick={() => handleReportClick(report.id)}
                className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${getColorClasses(report.color)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-white shadow-sm ${getIconColor(report.color)}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-lg">{report.name}</h3>
                      <p className="text-sm opacity-75">{report.category}</p>
                    </div>
                  </div>
                  <div className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
                    {report.id}
                  </div>
                </div>
                
                <p className="text-sm mb-4 opacity-90">{report.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium opacity-75">
                    Tháng: {monthOptions.find(opt => opt.value === selectedMonth)?.label}
                  </span>
                  <div className="flex items-center text-xs font-medium">
                    <span>Xem chi tiết</span>
                    <TrendingUp className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Monthly Reports List */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Báo cáo theo tháng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthOptions.map((month) => (
              <div
                key={month.value}
                onClick={() => handleMonthClick(month.value)}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                  selectedMonth === month.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{month.label}</h4>
                    <p className="text-sm text-gray-600">Báo cáo doanh thu</p>
                  </div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {month.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-lg p-6 border border-orange-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">Tổng quan</span>
            </button>
            <button
              onClick={() => setActiveTab('reports-list')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="font-medium">Danh sách báo cáo</span>
            </button>
            <button
              onClick={() => setActiveTab('sales-customer')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Users className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-medium">Doanh thu KH</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderSalesByCustomerTab = () => (
    <div className="space-y-6">
      {renderReportHeader("Báo cáo Doanh thu theo Khách hàng", Users)}
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Báo cáo Doanh thu theo Khách hàng</h3>
            <p className="text-sm text-gray-600 mt-1">
              Xếp hạng khách hàng theo tổng doanh thu và phân tích hiệu suất
            </p>
          </div>
          <button
            onClick={() => setShowSalesByCustomerModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Xem báo cáo
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={salesByCustomerDateRange.startDate}
              onChange={(e) => setSalesByCustomerDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={salesByCustomerDateRange.endDate}
              onChange={(e) => setSalesByCustomerDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sales by Customer Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Xếp hạng Khách hàng</h4>
                <p className="text-xs text-blue-700">Sắp xếp theo tổng doanh thu từ cao đến thấp</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-900">Phân tích Doanh thu</h4>
                <p className="text-xs text-green-700">Tổng doanh thu, giá trị trung bình, giao dịch lớn nhất</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-purple-900">Thống kê Chi tiết</h4>
                <p className="text-xs text-purple-700">Số lượng giao dịch, khách hàng mới, khách hàng quay lại</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Thao tác nhanh</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                setSalesByCustomerDateRange({
                  startDate: lastMonth.toISOString().split('T')[0],
                  endDate: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng trước
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                setSalesByCustomerDateRange({
                  startDate: thisMonth.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng này
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const thisYear = new Date(today.getFullYear(), 0, 1)
                setSalesByCustomerDateRange({
                  startDate: thisYear.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Năm này
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderExpensesVendorTab = () => {
    // Expenses vendor reports for the selected month
    const expensesReports = [
      {
        id: 'expenses-vendor',
        name: 'Chi phí NCC',
        description: 'Báo cáo Chi phí theo Nhà cung cấp',
        icon: Building2,
        color: 'red',
        category: 'Chi phí'
      }
    ]

    // Generate month options for the last 12 months
    const monthOptions: Array<{ value: string; label: string }> = []
    const seenMonths = new Set<string>()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthValue = date.toISOString().slice(0, 7)
      const monthLabel = date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
      
      // Only add if we haven't seen this month before
      if (!seenMonths.has(monthValue)) {
        seenMonths.add(monthValue)
        monthOptions.push({ value: monthValue, label: monthLabel })
      }
    }

    const handleReportClick = (reportId: string) => {
      setActiveTab(reportId)
    }

    const handleMonthClick = (monthValue: string) => {
      setSelectedMonth(monthValue)
    }

    const getColorClasses = (color: string) => {
      const colorMap = {
        red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
      }
      return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
    }

    const getIconColor = (color: string) => {
      const colorMap = {
        red: 'text-red-600'
      }
      return colorMap[color as keyof typeof colorMap] || 'text-gray-600'
    }

    return (
      <div className="space-y-6">
        {/* Header with Month Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Báo cáo Chi phí Nhà cung cấp</h2>
              <p className="text-sm text-gray-600 mt-1">Chọn tháng để xem báo cáo chi phí chi tiết</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Tháng:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">
                Hiển thị báo cáo chi phí cho tháng: <strong>{monthOptions.find(opt => opt.value === selectedMonth)?.label}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Expenses Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expensesReports.map((report) => {
            const IconComponent = report.icon
            return (
              <div
                key={report.id}
                onClick={() => handleReportClick(report.id)}
                className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${getColorClasses(report.color)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-white shadow-sm ${getIconColor(report.color)}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-lg">{report.name}</h3>
                      <p className="text-sm opacity-75">{report.category}</p>
                    </div>
                  </div>
                  <div className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
                    {report.id}
                  </div>
                </div>
                
                <p className="text-sm mb-4 opacity-90">{report.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium opacity-75">
                    Tháng: {monthOptions.find(opt => opt.value === selectedMonth)?.label}
                  </span>
                  <div className="flex items-center text-xs font-medium">
                    <span>Xem chi tiết</span>
                    <TrendingUp className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Monthly Reports List */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Báo cáo theo tháng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthOptions.map((month) => (
              <div
                key={month.value}
                onClick={() => handleMonthClick(month.value)}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                  selectedMonth === month.value
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{month.label}</h4>
                    <p className="text-sm text-gray-600">Báo cáo chi phí</p>
                  </div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {month.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl shadow-lg p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">Tổng quan</span>
            </button>
            <button
              onClick={() => setActiveTab('reports-list')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="font-medium">Danh sách báo cáo</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses-vendor')}
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-medium">Chi phí NCC</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderExpensesByVendorTab = () => (
    <div className="space-y-6">
      {renderReportHeader("Báo cáo Chi phí theo Nhà cung cấp", Building2)}
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Báo cáo Chi phí theo Nhà cung cấp</h3>
            <p className="text-sm text-gray-600 mt-1">
              Xếp hạng nhà cung cấp theo tổng chi phí và phân tích hiệu suất
            </p>
          </div>
          <button
            onClick={() => setShowExpensesByVendorModal(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Xem báo cáo
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={expensesByVendorDateRange.startDate}
              onChange={(e) => setExpensesByVendorDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={expensesByVendorDateRange.endDate}
              onChange={(e) => setExpensesByVendorDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Expenses by Vendor Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-900">Xếp hạng Nhà cung cấp</h4>
                <p className="text-xs text-red-700">Sắp xếp theo tổng chi phí từ cao đến thấp</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-orange-900">Phân tích Chi phí</h4>
                <p className="text-xs text-orange-700">Tổng chi phí, giá trị trung bình, giao dịch lớn nhất</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-purple-900">Thống kê Chi tiết</h4>
                <p className="text-xs text-purple-700">Số lượng giao dịch, nhà cung cấp mới, nhà cung cấp hoạt động</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Thao tác nhanh</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                setExpensesByVendorDateRange({
                  startDate: lastMonth.toISOString().split('T')[0],
                  endDate: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng trước
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                setExpensesByVendorDateRange({
                  startDate: thisMonth.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng này
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const thisYear = new Date(today.getFullYear(), 0, 1)
                setExpensesByVendorDateRange({
                  startDate: thisYear.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Năm này
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderGeneralLedgerTab = () => (
    <div className="space-y-6">
      {renderReportHeader("Báo cáo Sổ cái", BookOpen)}
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Báo cáo Sổ cái</h3>
            <p className="text-sm text-gray-600 mt-1">
              Bản ghi chi tiết, theo thứ tự thời gian của tất cả các giao dịch kế toán
            </p>
          </div>
          <button
            onClick={() => setShowGeneralLedgerModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Xem sổ cái
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={generalLedgerDateRange.startDate}
              onChange={(e) => setGeneralLedgerDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={generalLedgerDateRange.endDate}
              onChange={(e) => setGeneralLedgerDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* General Ledger Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-indigo-900">Sổ cái chi tiết</h4>
                <p className="text-xs text-indigo-700">Bản ghi theo thứ tự thời gian của tất cả giao dịch</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">Số dư lũy kế</h4>
                <p className="text-xs text-blue-700">Tính toán số dư sau mỗi giao dịch</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-900">Kiểm tra cân đối</h4>
                <p className="text-xs text-green-700">Đảm bảo tổng Nợ = tổng Có</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Thao tác nhanh</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                setGeneralLedgerDateRange({
                  startDate: lastMonth.toISOString().split('T')[0],
                  endDate: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng trước
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                setGeneralLedgerDateRange({
                  startDate: thisMonth.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Tháng này
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const thisYear = new Date(today.getFullYear(), 0, 1)
                setGeneralLedgerDateRange({
                  startDate: thisYear.toISOString().split('T')[0],
                  endDate: today.toISOString().split('T')[0]
                })
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Năm này
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'reports-list':
        return renderReportsListTab()
      case 'financial':
        return renderFinancialTab()
      // Individual report tabs are now accessed through the reports list
      case 'pl-report':
        return renderPLReportTab()
      case 'balance-sheet':
        return renderBalanceSheetTab()
      case 'cash-flow':
        return renderCashFlowTab()
      case 'sales-customer':
        return renderSalesCustomerTab()
      case 'expenses-vendor':
        return renderExpensesVendorTab()
      case 'general-ledger':
        return renderGeneralLedgerTab()
      case 'customers':
        return renderCustomersTab()
      case 'projects':
        return renderProjectsTab()
      case 'expenses':
        return renderExpensesTab()
      default:
        return renderOverviewTab()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user || undefined} onLogout={handleLogout} />

      {/* Main content */}
      <div className="pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Báo cáo & Phân tích</h2>
            </div>
            <div className="flex items-center space-x-3">
               <button
                 onClick={async () => {
                   try {
                     const { data: { user: authUser } } = await supabase.auth.getUser()
                     
                     if (!authUser) {
                       console.log('No authenticated user found. Please login through the login page.')
                       alert('Vui lòng đăng nhập để sử dụng báo cáo.')
                     } else {
                       console.log('User authenticated:', authUser.email)
                     }
                   } catch (error) {
                     console.error('Auth check error:', error)
                   }
                 }}
                 className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
               >
                 {user ? 'Kiểm tra Auth' : 'Chưa đăng nhập'}
               </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Phân tích</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Thông tin chi tiết về hiệu suất kinh doanh của bạn
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-xs text-gray-500">Dữ liệu mẫu</span>
                  </div>
                  {user && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs text-gray-500">Đã đăng nhập: {user.email || 'Unknown'}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="7">7 ngày qua</option>
                  <option value="30">30 ngày qua</option>
                  <option value="90">90 ngày qua</option>
                  <option value="365">1 năm qua</option>
                </select>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="h-4 w-4 mr-2" />
                  Xuất báo cáo
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                  {error.includes('đăng nhập') && (
                    <p className="text-xs text-red-600 mt-1">
                      <button
                        onClick={() => router.push('/login')}
                        className="underline hover:no-underline"
                      >
                        Nhấn vào đây để đăng nhập
                      </button>
                    </p>
                  )}
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>

      {/* P&L Report Modal */}
      <PLReportModal
        isOpen={showPLModal}
        onClose={() => setShowPLModal(false)}
        startDate={plDateRange.startDate}
        endDate={plDateRange.endDate}
      />

      {/* Balance Sheet Modal */}
      <BalanceSheetModal
        isOpen={showBalanceSheetModal}
        onClose={() => setShowBalanceSheetModal(false)}
        asOfDate={balanceSheetDate}
      />

      {/* Cash Flow Modal */}
      <CashFlowModal
        isOpen={showCashFlowModal}
        onClose={() => setShowCashFlowModal(false)}
        startDate={cashFlowDateRange.startDate}
        endDate={cashFlowDateRange.endDate}
      />

      {/* Sales by Customer Modal */}
      <SalesByCustomerModal
        isOpen={showSalesByCustomerModal}
        onClose={() => setShowSalesByCustomerModal(false)}
        startDate={salesByCustomerDateRange.startDate}
        endDate={salesByCustomerDateRange.endDate}
      />

      {/* Expenses by Vendor Modal */}
      <ExpensesByVendorModal
        isOpen={showExpensesByVendorModal}
        onClose={() => setShowExpensesByVendorModal(false)}
        startDate={expensesByVendorDateRange.startDate}
        endDate={expensesByVendorDateRange.endDate}
      />

      {/* General Ledger Modal */}
      <GeneralLedgerModal
        isOpen={showGeneralLedgerModal}
        onClose={() => setShowGeneralLedgerModal(false)}
        startDate={generalLedgerDateRange.startDate}
        endDate={generalLedgerDateRange.endDate}
      />
    </div>
  )
}
