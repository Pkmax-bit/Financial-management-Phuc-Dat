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
  Scale
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import PLReportModal from '@/components/reports/PLReportModal'
import BalanceSheetModal from '@/components/reports/BalanceSheetModal'
import CashFlowModal from '@/components/reports/CashFlowModal'
import SalesByCustomerModal from '@/components/reports/SalesByCustomerModal'
import ExpensesByVendorModal from '@/components/reports/ExpensesByVendorModal'
import GeneralLedgerModal from '@/components/reports/GeneralLedgerModal'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPLModal, setShowPLModal] = useState(false)
  const [plDateRange, setPLDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [showBalanceSheetModal, setShowBalanceSheetModal] = useState(false)
  const [balanceSheetDate, setBalanceSheetDate] = useState(new Date().toISOString().split('T')[0])
  const [showCashFlowModal, setShowCashFlowModal] = useState(false)
  const [cashFlowDateRange, setCashFlowDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [showSalesByCustomerModal, setShowSalesByCustomerModal] = useState(false)
  const [salesByCustomerDateRange, setSalesByCustomerDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [showExpensesByVendorModal, setShowExpensesByVendorModal] = useState(false)
  const [expensesByVendorDateRange, setExpensesByVendorDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [showGeneralLedgerModal, setShowGeneralLedgerModal] = useState(false)
  const [generalLedgerDateRange, setGeneralLedgerDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

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

  // Sample data - in real app, this would come from API
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 40000, expenses: 25000 },
    { month: 'Feb', revenue: 45000, expenses: 28000 },
    { month: 'Mar', revenue: 52000, expenses: 30000 },
    { month: 'Apr', revenue: 48000, expenses: 32000 },
    { month: 'May', revenue: 60000, expenses: 35000 },
    { month: 'Jun', revenue: 55000, expenses: 30000 },
    { month: 'Jul', revenue: 65000, expenses: 38000 },
    { month: 'Aug', revenue: 70000, expenses: 40000 },
    { month: 'Sep', revenue: 68000, expenses: 42000 },
    { month: 'Oct', revenue: 75000, expenses: 45000 },
    { month: 'Nov', revenue: 80000, expenses: 48000 },
    { month: 'Dec', revenue: 85000, expenses: 50000 }
  ]

  const expenseCategoryData = [
    { name: 'Office Supplies', value: 15000, color: '#ef4444' },
    { name: 'Travel', value: 12000, color: '#f59e0b' },
    { name: 'Marketing', value: 18000, color: '#10b981' },
    { name: 'Software', value: 8000, color: '#3b82f6' },
    { name: 'Utilities', value: 10000, color: '#8b5cf6' },
    { name: 'Other', value: 5000, color: '#ec4899' }
  ]

  const topCustomersData = [
    { name: 'ABC Corp', revenue: 25000 },
    { name: 'XYZ Ltd', revenue: 22000 },
    { name: 'Tech Solutions', revenue: 18000 },
    { name: 'Global Inc', revenue: 15000 },
    { name: 'Startup Co', revenue: 12000 }
  ]

  const projectProfitabilityData = [
    { name: 'Website Redesign', budget: 50000, actual: 45000, profit: 5000, margin: 10 },
    { name: 'Mobile App', budget: 80000, actual: 75000, profit: 5000, margin: 6.25 },
    { name: 'E-commerce Platform', budget: 120000, actual: 110000, profit: 10000, margin: 8.33 },
    { name: 'CRM System', budget: 60000, actual: 65000, profit: -5000, margin: -8.33 },
    { name: 'Analytics Dashboard', budget: 40000, actual: 35000, profit: 5000, margin: 12.5 }
  ]

  const dashboardStats = {
    monthlyRevenue: 75000,
    monthlyExpenses: 45000,
    monthlyProfit: 30000,
    totalCustomers: 156,
    totalProjects: 24,
    activeProjects: 8,
    totalEmployees: 45,
    pendingInvoices: 12,
    pendingAmount: 25000
  }

  const tabs = [
    { id: 'overview', name: 'Tổng quan', icon: BarChart3 },
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

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.monthlyRevenue)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12% from last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.monthlyExpenses)}</p>
              <div className="flex items-center mt-1">
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600">+5% from last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Profit</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.monthlyProfit)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+18% from last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalCustomers}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8 new this month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue vs Expenses</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md">Revenue</button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-md">Expenses</button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeProjects}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.pendingInvoices}</p>
            </div>
            <FileText className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  )

  const renderFinancialTab = () => (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(750000)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(450000)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(300000)}</p>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderCustomersTab = () => (
    <div className="space-y-6">
      {/* Top Customers Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
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
      </div>
    </div>
  )

  const renderProjectsTab = () => (
    <div className="space-y-6">
      {/* Project Profitability */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Profitability</h3>
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
              {projectProfitabilityData.map((project, index) => (
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
      </div>
    </div>
  )

  const renderExpensesTab = () => (
    <div className="space-y-6">
      {/* Expenses by Category */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
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
                {expenseCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderBalanceSheetTab = () => (
    <div className="space-y-6">
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

  const renderSalesByCustomerTab = () => (
    <div className="space-y-6">
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

  const renderExpensesByVendorTab = () => (
    <div className="space-y-6">
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
      case 'financial':
        return renderFinancialTab()
      case 'pl-report':
        return renderPLReportTab()
      case 'balance-sheet':
        return renderBalanceSheetTab()
      case 'cash-flow':
        return renderCashFlowTab()
      case 'sales-customer':
        return renderSalesByCustomerTab()
      case 'expenses-vendor':
        return renderExpensesByVendorTab()
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
                      <span className="text-xs text-gray-500">Đã đăng nhập: {(user as { email?: string })?.email || 'Unknown'}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={async () => {
                    try {
                      const { data: { user: authUser } } = await supabase.auth.getUser()
                      
                      console.log('Debug Info:', {
                        authUser: authUser?.email || 'No auth user',
                        userState: (user as { email?: string })?.email || 'No user state'
                      })
                      
                      if (!authUser) {
                        console.log('Attempting login...')
                        const loginResult = await supabase.auth.signInWithPassword({
                          email: 'admin@example.com',
                          password: 'admin123'
                        })
                        
                        if (loginResult.data.session) {
                          console.log('Login successful, reloading...')
                          window.location.reload()
                        } else {
                          console.error('Login failed:', loginResult.error?.message)
                        }
                      }
                    } catch (error) {
                      console.error('Debug error:', error)
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                  {user ? 'Debug Auth' : 'Login & Debug'}
                </button>
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
