'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  HelpCircle,
  RefreshCw,
  Activity,
  Zap,
  RotateCcw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import { useDashboard } from '@/hooks/useDashboard'
import { CashflowWidget, EventsWidget, MonthlyChartWidget } from '@/components/DashboardWidgets'

interface User {
  full_name?: string
  role?: string
  email?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<unknown>(null)
  const [userLoading, setUserLoading] = useState(true)
  const initRef = useRef(false)
  const [activeWidget, setActiveWidget] = useState('overview')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const router = useRouter()
  const lastRefreshRef = useRef<number>(0)

  // Use the comprehensive dashboard hook
  const {
    stats,
    cashflow,
    events,
    widgets,
    filters,
    scenario,
    isLoading,
    hasErrors,
    refreshAll
  } = useDashboard()

  // Optimized user check with useCallback
  const checkUser = useCallback(async () => {
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
          return true
        }
      }
      router.push('/login')
      return false
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
      return false
    } finally {
      setUserLoading(false)
    }
  }, [router])

  // Single useEffect for initialization (guarded to avoid double run)
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    checkUser()
  }, [checkUser])

  // Auto refresh effect - optimized to prevent double loading
  useEffect(() => {
    if (!userLoading && user && autoRefresh) {
      // Set up auto refresh every 30 seconds
      const interval = setInterval(async () => {
        try {
          await refreshAll()
          setRefreshCount(prev => prev + 1)
          lastRefreshRef.current = Date.now()
        } catch (error) {
          console.error('Auto refresh failed:', error)
        }
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [userLoading, user, autoRefresh, refreshAll])

  // Handle page visibility change for better performance (throttled)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && !isLoading) {
        const now = Date.now()
        if (now - lastRefreshRef.current > 15000) {
          // Refresh when page becomes visible, but throttle to avoid double load
          refreshAll()
          lastRefreshRef.current = now
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, isLoading, refreshAll])

  // Handle realtime updates toggle
  const handleToggleRealtime = () => {
    setAutoRefresh(!autoRefresh)
  }

  // Manual refresh handler
  const handleManualRefresh = async () => {
    try {
      await refreshAll()
      setRefreshCount(prev => prev + 1)
      lastRefreshRef.current = Date.now()
    } catch (error) {
      console.error('Manual refresh failed:', error)
    }
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

  // Optimized initial loading: show layout as soon as user state is ready
  const isInitialLoading = userLoading
  
  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-black">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
          <div className="space-y-8">

            {/* Header */}
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Tổng quan kinh doanh</h1>
                  <p className="mt-2 text-black">
                    Nắm bắt tình hình tài chính và thực hiện các công việc hàng ngày
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {(stats.error || hasErrors) && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">
                            {stats.error || 'Có lỗi xảy ra khi tải dữ liệu'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {stats.lastUpdated && (
                    <div className="text-sm text-black flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Cập nhật: {stats.lastUpdated.toLocaleTimeString('vi-VN')}
                    </div>
                  )}

                  {refreshCount > 0 && (
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <RefreshCw className="h-4 w-4" />
                      Đã làm mới: {refreshCount} lần
                    </div>
                  )}

                  {autoRefresh && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      Tự động làm mới mỗi 30s
                    </div>
                  )}

                  <button
                    onClick={() => {
                      console.log('=== DASHBOARD DEBUG INFO ===')
                      console.log('User:', user)
                      console.log('Loading:', isLoading)
                      console.log('Stats:', stats)
                      console.log('Cashflow:', cashflow)
                      console.log('Events:', events)
                      console.log('Has Errors:', hasErrors)
                      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
                      console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
                      console.log('========================')
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    Debug
                  </button>
                  
                  <button
                    onClick={handleManualRefresh}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                  </button>

                  <button
                    onClick={handleToggleRealtime}
                    className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                      autoRefresh 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    <Activity className="h-4 w-4" />
                    {autoRefresh ? 'Tự động' : 'Thủ công'}
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
                    <p className="text-sm text-black">Tạo nhanh</p>
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
                  <p className="text-sm font-medium text-black">Lãi/Lỗ (30 ngày)</p>
                  <p className={`text-2xl font-bold ${(stats.stats?.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.stats?.profitLoss || 0)}
                  </p>
                  <div className="flex items-center text-sm text-black mt-1">
                    {(stats.stats?.profitLoss || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    Doanh thu: {formatCurrency(stats.stats?.totalRevenue || 0)}
                  </div>
                  <div className="text-sm text-black">
                    Chi phí: {formatCurrency(stats.stats?.totalExpenses || 0)}
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-black" />
              </div>
            </div>

            {/* Cash Balance */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Số dư tiền mặt</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.stats?.cashBalance || 0)}
                  </p>
                  <p className="text-sm text-black mt-1">
                    {stats.stats?.bankAccounts?.length || 0} tài khoản
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-black" />
              </div>
            </div>

            {/* Open Invoices */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Hóa đơn chưa thu</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.stats?.openInvoices || 0}
                  </p>
                  <div className="text-sm text-black mt-1">
                    <span className="text-red-600">{stats.stats?.overdueInvoices || 0}</span> quá hạn
                  </div>
                </div>
                <FileText className="h-8 w-8 text-black" />
              </div>
            </div>

            {/* Pending Bills */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Hóa đơn phải trả</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.stats?.pendingBills || 0}
                  </p>
                  <p className="text-sm text-black mt-1">Chờ thanh toán</p>
                </div>
                <Receipt className="h-8 w-8 text-black" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Doanh thu theo trạng thái</h3>
                <PieChart className="h-5 w-5 text-black" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-black">Đã thanh toán (30 ngày)</span>
                  </div>
                  <span className="font-medium">{formatCurrency(stats.stats?.paidLast30Days || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-black">Hóa đơn chưa thanh toán</span>
                  </div>
                  <span className="font-medium">{stats.stats?.openInvoices || 0} hóa đơn</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-black">Hóa đơn quá hạn</span>
                  </div>
                  <span className="font-medium text-red-600">{stats.stats?.overdueInvoices || 0} hóa đơn</span>
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
                <PieChart className="h-5 w-5 text-black" />
              </div>
              <div className="space-y-3">
                {stats.stats?.expensesByCategory?.slice(0, 4).map((expense: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: expense.color }}></div>
                      <span className="text-sm text-black">{expense.category}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(expense.amount)}</span>
                  </div>
                )) || (
                  <div className="text-sm text-black text-center py-4">
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
              {stats.stats?.bankAccounts?.map((account: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-black">{account.type}</p>
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
                <div className="col-span-3 text-center py-8 text-black">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có tài khoản ngân hàng nào được kết nối</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-800 font-medium">
                    Kết nối ngay
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cashflow Projection */}
            <CashflowWidget 
              projection={cashflow.projection}
              loading={cashflow.loading}
              error={cashflow.error}
            />
            
            {/* Upcoming Events */}
            <EventsWidget 
              events={events.events}
              loading={events.loading}
              error={events.error}
            />
            
            {/* Monthly Chart */}
            <MonthlyChartWidget 
              monthlyData={stats.stats?.monthlyRevenueData || []}
              loading={stats.loading}
            />
          </div>

          {/* Action Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cần chú ý</h3>
            <div className="space-y-3">
              {stats.stats?.overdueInvoices && stats.stats.overdueInvoices > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-red-800">
                      {stats.stats.overdueInvoices} hóa đơn đã quá hạn thanh toán
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
              
              {stats.stats?.pendingBills && stats.stats.pendingBills > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-orange-800">
                      {stats.stats.pendingBills} hóa đơn phải trả cần xử lý
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

              {(!stats.stats?.overdueInvoices || stats.stats.overdueInvoices === 0) && 
               (!stats.stats?.pendingBills || stats.stats.pendingBills === 0) && (
                <div className="text-center py-4 text-black">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  Tuyệt vời! Không có vấn đề nào cần xử lý ngay.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  )
}
