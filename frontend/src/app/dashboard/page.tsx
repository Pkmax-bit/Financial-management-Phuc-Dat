'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  DollarSign,
  Receipt,
  FileText,
  CreditCard,
  Building2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  AlertCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  CheckCircle,
  HelpCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface User {
  full_name?: string
  role?: string
  email?: string
}

interface DashboardStats {
  totalRevenue: number
  totalExpenses: number
  profitLoss: number
  cashBalance: number
  openInvoices: number
  overdueInvoices: number
  paidLast30Days: number
  pendingBills: number
  expensesByCategory: { category: string; amount: number; color: string }[]
  recentTransactions: unknown[]
  bankAccounts: { name: string; balance: number; type: string }[]
}

export default function DashboardPage() {
    const [user, setUser] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activeWidget, setActiveWidget] = useState('overview')
  const [error, setError] = useState<string | null>(null)
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
          // Fetch dashboard stats after user is set
          fetchDashboardStats()
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

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching dashboard stats...')
      
      // Try authenticated endpoint first
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/login')
          return
        }

        // Use Supabase client to fetch dashboard stats
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            total_amount,
            payment_status,
            paid_date,
            status,
            due_date
          `)

        if (error) throw error

        // Calculate stats from the data
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        
        const paidInvoices = data?.filter(invoice => 
          invoice.payment_status === 'paid' && 
          invoice.paid_date && 
          new Date(invoice.paid_date) >= thirtyDaysAgo
        ) || []
        
        const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)
        
        const openInvoices = data?.filter(invoice => 
          invoice.payment_status === 'pending' || invoice.payment_status === 'partial'
        ) || []
        
        const overdueInvoices = data?.filter(invoice => 
          invoice.due_date && 
          new Date(invoice.due_date) < now && 
          (invoice.payment_status === 'pending' || invoice.payment_status === 'partial')
        ) || []

        // Fetch expenses data
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('amount, category, status')
          .gte('expense_date', thirtyDaysAgo.toISOString().split('T')[0])

        const totalExpenses = expensesData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0
        
        // Fetch bills data
        const { data: billsData } = await supabase
          .from('bills')
          .select('amount, status')

        const pendingBills = billsData?.filter(bill => 
          bill.status === 'pending' || bill.status === 'partial'
        ) || []

        // Fetch bank accounts
        const { data: bankAccountsData } = await supabase
          .from('bank_accounts')
          .select('account_name, balance, account_type')
          .eq('is_active', true)

        const bankAccounts = bankAccountsData?.map(account => ({
          name: account.account_name || 'Unknown Account',
          balance: account.balance || 0,
          type: account.account_type || 'Banking Account'
        })) || []

        const cashBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0)

        // Calculate expenses by category
        const expensesByCategory = expensesData?.reduce((acc, expense) => {
          const category = expense.category || 'other'
          if (!acc[category]) {
            acc[category] = { category, amount: 0, color: getCategoryColor(category) }
          }
          acc[category].amount += expense.amount || 0
          return acc
        }, {} as Record<string, { category: string; amount: number; color: string }>) || {}

        const expensesByCategoryArray = Object.values(expensesByCategory)

        setStats({
          totalRevenue,
          totalExpenses,
          profitLoss: totalRevenue - totalExpenses,
          cashBalance,
          openInvoices: openInvoices.length,
          overdueInvoices: overdueInvoices.length,
          paidLast30Days: totalRevenue,
          pendingBills: pendingBills.length,
          expensesByCategory: expensesByCategoryArray,
          recentTransactions: [],
          bankAccounts
        })
        console.log('Successfully fetched dashboard stats via authenticated API')
        return
      } catch (authError) {
        console.log('Authenticated API failed, using fallback data:', authError)
        
        // Fallback to default stats
        setStats({
          totalRevenue: 0,
          totalExpenses: 0,
          profitLoss: 0,
          cashBalance: 0,
          openInvoices: 0,
          overdueInvoices: 0,
          paidLast30Days: 0,
          pendingBills: 0,
          expensesByCategory: [],
          recentTransactions: [],
          bankAccounts: []
        })
        setError('Hiển thị dữ liệu mẫu (chưa đăng nhập)')
        console.log('Using fallback dashboard stats')
        return
      }
      
    } catch (error: unknown) {
      console.error('Error fetching dashboard stats:', error)
      setError(`Lỗi không thể tải thống kê dashboard: ${(error as Error)?.message || 'Không thể kết nối'}`)
      setStats({
        totalRevenue: 0,
        totalExpenses: 0,
        profitLoss: 0,
        cashBalance: 0,
        openInvoices: 0,
        overdueInvoices: 0,
        paidLast30Days: 0,
        pendingBills: 0,
        expensesByCategory: [],
        recentTransactions: [],
        bankAccounts: []
      })
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'travel': '#3B82F6',
      'meals': '#10B981', 
      'accommodation': '#F59E0B',
      'transportation': '#8B5CF6',
      'supplies': '#EF4444',
      'equipment': '#06B6D4',
      'training': '#84CC16',
      'other': '#6B7280'
    }
    return colors[category as keyof typeof colors] || '#6B7280'
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const quickActions = [
    {
      title: 'Tạo Hóa đơn mới',
      icon: FileText,
      color: 'bg-blue-500',
      onClick: () => router.push('/sales?tab=invoices&action=create')
    },
    {
      title: 'Tạo Chi phí mới', 
      icon: Receipt,
      color: 'bg-red-500',
      onClick: () => router.push('/expenses?tab=expenses&action=create')
    },
    {
      title: 'Tạo Hóa đơn phải trả',
      icon: Building2,
      color: 'bg-orange-500',
      onClick: () => router.push('/expenses?tab=bills&action=create')
    },
    {
      title: 'Ghi nhận Thanh toán',
      icon: CreditCard,
      color: 'bg-green-500',
      onClick: () => router.push('/sales?tab=payments&action=create')
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user || undefined} onLogout={handleLogout} />
      
      {/* Main content - offset for sidebar */}
      <div className="pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Tổng quan kinh doanh</h1>
                  <p className="mt-2 text-gray-600">
                    Nắm bắt tình hình tài chính và thực hiện các công việc hàng ngày
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      console.log('=== DASHBOARD DEBUG INFO ===')
                      console.log('User:', user)
                      console.log('Loading:', loading)
                      console.log('Error:', error)
                      console.log('Stats:', stats)
                      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
                      console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
                      console.log('========================')
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Debug
                  </button>
                  <button
                    onClick={() => {
                      setError(null)
                      fetchDashboardStats()
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => router.push('/support')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Hỗ trợ
                  </button>
                </div>
              </div>
            </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Lối tắt truy cập nhanh</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left"
                >
                  <div className={`p-3 rounded-lg ${action.color} mr-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500">Tạo nhanh</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Profit & Loss */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lãi/Lỗ (30 ngày)</p>
                  <p className={`text-2xl font-bold ${(stats?.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats?.profitLoss || 0)}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    {(stats?.profitLoss || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    Doanh thu: {formatCurrency(stats?.totalRevenue || 0)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Chi phí: {formatCurrency(stats?.totalExpenses || 0)}
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Cash Balance */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Số dư tiền mặt</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.cashBalance || 0)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats?.bankAccounts?.length || 0} tài khoản
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Open Invoices */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hóa đơn chưa thu</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats?.openInvoices || 0}
                  </p>
                  <div className="text-sm text-gray-500 mt-1">
                    <span className="text-red-600">{stats?.overdueInvoices || 0}</span> quá hạn
                  </div>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Pending Bills */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hóa đơn phải trả</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats?.pendingBills || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Chờ thanh toán</p>
                </div>
                <Receipt className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Doanh thu theo trạng thái</h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Đã thanh toán (30 ngày)</span>
                  </div>
                  <span className="font-medium">{formatCurrency(stats?.paidLast30Days || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Hóa đơn chưa thanh toán</span>
                  </div>
                  <span className="font-medium">{stats?.openInvoices || 0} hóa đơn</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Hóa đơn quá hạn</span>
                  </div>
                  <span className="font-medium text-red-600">{stats?.overdueInvoices || 0} hóa đơn</span>
                </div>
              </div>
              <button 
                onClick={() => router.push('/sales')}
                className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Xem chi tiết
              </button>
            </div>

            {/* Expenses Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Chi phí theo danh mục</h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {stats?.expensesByCategory?.slice(0, 4).map((expense, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: expense.color }}></div>
                      <span className="text-sm text-gray-600">{expense.category}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(expense.amount)}</span>
                  </div>
                )) || (
                  <div className="text-sm text-gray-500 text-center py-4">
                    Chưa có dữ liệu chi phí
                  </div>
                )}
              </div>
              <button 
                onClick={() => router.push('/expenses')}
                className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Xem chi tiết
              </button>
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tài khoản ngân hàng</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Kết nối tài khoản
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats?.bankAccounts?.map((account, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">{account.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(account.balance)}</p>
                      <button className="text-xs text-blue-600 hover:text-blue-800">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có tài khoản ngân hàng nào được kết nối</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-800 font-medium">
                    Kết nối ngay
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cần chú ý</h3>
            <div className="space-y-3">
              {stats?.overdueInvoices && stats.overdueInvoices > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-red-800">
                      {stats.overdueInvoices} hóa đơn đã quá hạn thanh toán
                    </span>
                  </div>
                  <button 
                    onClick={() => router.push('/sales?tab=invoices&filter=overdue')}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Xem ngay
                  </button>
                </div>
              )}
              
              {stats?.pendingBills && stats.pendingBills > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-orange-800">
                      {stats.pendingBills} hóa đơn phải trả cần xử lý
                    </span>
                  </div>
                  <button 
                    onClick={() => router.push('/expenses?tab=bills&filter=pending')}
                    className="text-orange-600 hover:text-orange-800 font-medium"
                  >
                    Xem ngay
                  </button>
                </div>
              )}

              {(!stats?.overdueInvoices || stats.overdueInvoices === 0) && 
               (!stats?.pendingBills || stats.pendingBills === 0) && (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  Tuyệt vời! Không có vấn đề nào cần xử lý ngay.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
