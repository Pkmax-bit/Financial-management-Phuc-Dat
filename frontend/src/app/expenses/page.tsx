'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Receipt, 
  Plus, 
  Search, 
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Building2,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import ExpensesTab from '@/components/expenses/ExpensesTab'
import BillsTab from '@/components/expenses/BillsTab'
import VendorsTab from '@/components/expenses/VendorsTab'
import ProjectExpensesTab from '@/components/expenses/ProjectExpensesTab'
import { expensesApi, billsApi, vendorsApi } from '@/lib/api'

interface User {
  full_name?: string
  role?: string
  email?: string
}

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState('expenses')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [expensesStats, setExpensesStats] = useState<unknown>({})
  const [shouldOpenCreateModal, setShouldOpenCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  // Create handlers for the tab components
  const handleCreateExpense = () => {
    setActiveTab('expenses')
    setShouldOpenCreateModal(true)
  }

  const handleCreateBill = () => {
    // Navigate to create bill page or open modal
    console.log('Create bill')
  }

  const handleCreateVendor = () => {
    // Navigate to create vendor page or open modal
    console.log('Create vendor')
  }

  const handleCreateProjectExpense = () => {
    setShouldOpenCreateModal(true)
  }

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
          // Fetch expenses stats after user is set
          fetchExpensesStats()
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

  const fetchExpensesStats = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching expenses stats...')
      
      // Try authenticated endpoint first
      try {
        // Fetch expenses data via API
        const expensesData = await expensesApi.getExpenses()
        const totalExpenses = expensesData?.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0) || 0
        const expensesCount = expensesData?.length || 0
        const pendingAmount = expensesData?.filter((e: any) => e.status === 'pending').reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0) || 0
        const pendingCount = expensesData?.filter((e: any) => e.status === 'pending').length || 0

        // Fetch bills data via API
        const billsData = await billsApi.getBills()
        const totalBills = billsData?.reduce((sum: number, bill: any) => sum + (bill.amount || 0), 0) || 0
        const billsCount = billsData?.length || 0

        // Fetch vendors data via API
        const vendorsData = await vendorsApi.getVendors()
        const vendorsCount = vendorsData?.length || 0
        const activeVendors = vendorsData?.filter((v: any) => v.is_active).length || 0

        setExpensesStats({
          total_expenses: totalExpenses,
          expenses_count: expensesCount,
          pending_amount: pendingAmount,
          pending_count: pendingCount,
          total_bills: totalBills,
          bills_count: billsCount,
          vendors_count: vendorsCount,
          active_vendors: activeVendors
        })
        console.log('Successfully fetched expenses stats via authenticated API')
        return
      } catch (authError) {
        console.log('Authenticated API failed, using fallback data:', authError)
        
        // Fallback to default stats
        setExpensesStats({
          total_expenses: 0,
          expenses_count: 0,
          pending_amount: 0,
          pending_count: 0,
          total_bills: 0,
          bills_count: 0,
          vendors_count: 0,
          active_vendors: 0
        })
        setError('Hiển thị dữ liệu mẫu (chưa đăng nhập)')
        console.log('Using fallback expenses stats')
        return
      }
      
    } catch (error: unknown) {
      console.error('Error fetching expenses stats:', error)
      setError(`Lỗi không thể tải thống kê chi phí: ${(error as Error)?.message || 'Không thể kết nối'}`)
      setExpensesStats({
        total_expenses: 0,
        expenses_count: 0,
        pending_amount: 0,
        pending_count: 0,
        total_bills: 0,
        bills_count: 0,
        vendors_count: 0,
        active_vendors: 0
      })
    } finally {
      setLoading(false)
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
      
      <div className="pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Chi phí</h1>
            <p className="mt-2 text-gray-600">
              Theo dõi và quản lý chi phí, hóa đơn nhà cung cấp và nhà cung cấp
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    ((expensesStats as Record<string, unknown>).expenses_count as number) > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-500">
                    {((expensesStats as Record<string, unknown>).expenses_count as number) > 0 ? `${(expensesStats as Record<string, unknown>).expenses_count} chi phí` : 'Chưa có dữ liệu'}
                  </span>
                </div>
                {user && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-xs text-gray-500">Đã đăng nhập: {(user as { email?: string })?.email || 'Unknown'}</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={fetchExpensesStats}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
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
                    onClick={fetchExpensesStats}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-500">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng chi phí</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(((expensesStats as Record<string, unknown>).total_expenses as number) || 0)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {((expensesStats as Record<string, unknown>).expenses_count as number) || 0} phiếu chi
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-500">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hóa đơn NCC</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(((expensesStats as Record<string, unknown>).total_bills as number) || 0)}
                  </p>
                  <p className="text-sm text-gray-500">{((expensesStats as Record<string, unknown>).bills_count as number) || 0} hóa đơn</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-500">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(((expensesStats as Record<string, unknown>).pending_amount as number) || 0)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {((expensesStats as Record<string, unknown>).pending_count as number) || 0} phiếu
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Nhà cung cấp</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((expensesStats as Record<string, unknown>).vendors_count as number) || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    {((expensesStats as Record<string, unknown>).active_vendors as number) || 0} hoạt động
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <div className="px-6 py-3">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'expenses'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Receipt className="w-4 h-4 inline mr-1" />
                    Chi phí ({((expensesStats as Record<string, unknown>).expenses_count as number) || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('bills')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'bills'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-1" />
                    Hóa đơn NCC ({((expensesStats as Record<string, unknown>).bills_count as number) || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('vendors')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'vendors'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Nhà cung cấp ({((expensesStats as Record<string, unknown>).vendors_count as number) || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('project-expenses')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'project-expenses'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Chi phí dự án
                  </button>
                </nav>
              </div>
            </div>

            {/* Search Bar and Actions */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 mr-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'expenses' 
                        ? 'Tìm kiếm chi phí...' 
                        : activeTab === 'bills' 
                        ? 'Tìm kiếm hóa đơn NCC...' 
                        : activeTab === 'vendors'
                        ? 'Tìm kiếm nhà cung cấp...'
                        : 'Tìm kiếm chi phí dự án...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {activeTab === 'expenses' && (
                    <button 
                      onClick={handleCreateExpense}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo chi phí
                    </button>
                  )}
                  {activeTab === 'bills' && (
                    <button 
                      onClick={handleCreateBill}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo hóa đơn NCC
                    </button>
                  )}
                  {activeTab === 'vendors' && (
                    <button 
                      onClick={handleCreateVendor}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm nhà cung cấp
                    </button>
                  )}
                  {activeTab === 'project-expenses' && (
                    <button 
                      onClick={handleCreateProjectExpense}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm chi phí dự án
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'expenses' && (
                <ExpensesTab 
                  searchTerm={searchTerm}
                  onCreateExpense={handleCreateExpense}
                  shouldOpenCreateModal={shouldOpenCreateModal}
                />
              )}
              {activeTab === 'bills' && (
                <BillsTab 
                  searchTerm={searchTerm}
                  onCreateBill={handleCreateBill}
                />
              )}
              {activeTab === 'vendors' && (
                <VendorsTab 
                  searchTerm={searchTerm}
                  onCreateVendor={handleCreateVendor}
                />
              )}
              {activeTab === 'project-expenses' && (
                <ProjectExpensesTab 
                  searchTerm={searchTerm}
                  onCreateExpense={handleCreateProjectExpense}
                  shouldOpenCreateModal={shouldOpenCreateModal}
                />
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}