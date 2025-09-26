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
  AlertCircle
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<unknown>(null)
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
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'financial':
        return renderFinancialTab()
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
    </div>
  )
}
