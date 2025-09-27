'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Plus, 
  Search, 
  Download,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Users,
  CreditCard
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import OverviewTab from '@/components/sales/OverviewTab'
import AllSalesTab from '@/components/sales/AllSalesTab'
import QuotesTab from '@/components/sales/QuotesTab'
import InvoicesTab from '@/components/sales/InvoicesTab'
import PaymentsTab from '@/components/sales/PaymentsTab'
import CustomersTab from '@/components/sales/CustomersTab'
import ProductsServicesTab from '@/components/sales/ProductsServicesTab'
import { apiGet } from '@/lib/api'

interface User {
  full_name?: string
  role?: string
  email?: string
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [salesStats, setSalesStats] = useState<unknown>({})
  const [shouldOpenCreateModal, setShouldOpenCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (shouldOpenCreateModal && activeTab === 'quotes') {
      // Reset the flag after a short delay to allow the modal to open
      const timer = setTimeout(() => {
        setShouldOpenCreateModal(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [shouldOpenCreateModal, activeTab])



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
          // Fetch sales stats after user is set
          fetchSalesStats()
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

  const fetchSalesStats = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching sales stats...')
      
      // Try authenticated endpoint first
      try {
        const stats = await apiGet('/api/sales/dashboard/stats')
        setSalesStats(stats)
        console.log('Successfully fetched sales stats via authenticated API')
        return
      } catch (authError) {
        console.log('Authenticated API failed, using fallback data:', authError)
        
        // Fallback to default stats
        setSalesStats({
          revenue: { total: 0, paid: 0, pending: 0 },
          invoices: { total: 0, overdue: 0 },
          quotes: { total: 0, by_status: {} }
        })
        setError('Hiển thị dữ liệu mẫu (chưa đăng nhập)')
        console.log('Using fallback sales stats')
        return
      }
      
    } catch (error: unknown) {
      console.error('Error fetching sales stats:', error)
      setError(`Lỗi không thể tải thống kê bán hàng: ${(error as Error)?.message || 'Không thể kết nối'}`)
      setSalesStats({
        revenue: { total: 0, paid: 0, pending: 0 },
        invoices: { total: 0, overdue: 0 },
        quotes: { total: 0, by_status: {} }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuote = () => {
    // Navigate to create quote page or open modal
    setActiveTab('quotes')
    setShouldOpenCreateModal(true)
  }

  const handleCreateInvoice = () => {
    setActiveTab('invoices')
    setShouldOpenCreateModal(true)
  }

  const handleCreatePayment = () => {
    // Navigate to create payment page or open modal
    console.log('Create payment')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán'
      case 'pending':
        return 'Chờ thanh toán'
      case 'overdue':
        return 'Quá hạn'
      case 'draft':
        return 'Nháp'
      default:
        return status
    }
  }

  // Extract stats from API response
  const revenue = (salesStats as Record<string, unknown>).revenue || {}
  const invoicesStats = (salesStats as Record<string, unknown>).invoices || {}
  const quotesStats = (salesStats as Record<string, unknown>).quotes || {}

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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
              <h2 className="text-2xl font-semibold text-gray-900">Sales Center</h2>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Center</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Trung tâm chỉ huy cho toàn bộ quy trình tạo ra doanh thu - từ báo giá đến thu tiền
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchSalesStats}
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
                {activeTab !== 'overview' && (
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Excel
                  </button>
                )}
                {activeTab !== 'overview' && (
                  <>
                  {(activeTab === 'quotes' || activeTab === 'all-sales') && (
                    <button 
                      onClick={handleCreateQuote}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo báo giá
                    </button>
                  )}
                  {(activeTab === 'invoices' || activeTab === 'all-sales') && (
                    <button 
                      onClick={handleCreateInvoice}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo hóa đơn
                    </button>
                  )}
                  {activeTab === 'customers' && (
                    <button 
                      onClick={() => console.log('Create customer')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm khách hàng
                    </button>
                  )}
                  {activeTab === 'products' && (
                    <button 
                      onClick={() => console.log('Create product')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm sản phẩm
                    </button>
                  )}
                  </>
                )}
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
                    onClick={fetchSalesStats}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards - Only show for non-overview tabs */}
          {activeTab !== 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-500">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tổng báo giá</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(quotesStats as Record<string, unknown>).total as number || 0}
                    </p>
                    <p className="text-sm text-gray-500">
                      {String(Object.values((quotesStats as Record<string, unknown>).by_status || {}).reduce((a: unknown, b: unknown) => (a as number) + (b as number), 0))} báo giá
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-500">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency((revenue as Record<string, unknown>).total as number || 0)}
                    </p>
                    <p className="text-sm text-gray-500">{(invoicesStats as Record<string, unknown>).total as number || 0} hóa đơn</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-500">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Đã thanh toán</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency((revenue as Record<string, unknown>).paid as number || 0)}
                    </p>
                    <p className="text-sm text-gray-500">Đã thu</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-orange-500">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Chờ thanh toán</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency((revenue as Record<string, unknown>).pending as number || 0)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(invoicesStats as Record<string, unknown>).overdue as number || 0} quá hạn
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tổng quan
                </button>
                <button
                  onClick={() => setActiveTab('all-sales')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'all-sales'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tất cả giao dịch
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'invoices'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Hóa đơn ({(invoicesStats as Record<string, unknown>).total as number || 0})
                </button>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'quotes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Báo giá ({String(Object.values((quotesStats as Record<string, unknown>).by_status || {}).reduce((a: unknown, b: unknown) => (a as number) + (b as number), 0))})
                </button>
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'customers'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Khách hàng
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'products'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Sản phẩm & Dịch vụ
                </button>
              </nav>
            </div>

            {/* Search Bar - Only show for non-overview tabs */}
            {activeTab !== 'overview' && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'all-sales' ? 'Tìm kiếm tất cả giao dịch...' :
                      activeTab === 'quotes' ? 'Tìm kiếm báo giá...' : 
                      activeTab === 'invoices' ? 'Tìm kiếm hóa đơn...' : 
                      activeTab === 'customers' ? 'Tìm kiếm khách hàng...' :
                      activeTab === 'products' ? 'Tìm kiếm sản phẩm...' :
                      'Tìm kiếm...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Tab Content */}
            <div className={`${activeTab === 'overview' ? '' : 'p-6'}`}>
              {activeTab === 'overview' && (
                <OverviewTab 
                  quotesStats={quotesStats}
                  invoicesStats={invoicesStats}
                  revenue={revenue}
                />
              )}
              {activeTab === 'all-sales' && (
                <AllSalesTab 
                  searchTerm={searchTerm}
                />
              )}
              {activeTab === 'invoices' && (
                <InvoicesTab 
                  searchTerm={searchTerm}
                  onCreateInvoice={handleCreateInvoice}
                  shouldOpenCreateModal={shouldOpenCreateModal}
                />
              )}
              {activeTab === 'quotes' && (
                <QuotesTab 
                  searchTerm={searchTerm}
                  onCreateQuote={handleCreateQuote}
                  shouldOpenCreateModal={shouldOpenCreateModal}
                />
              )}
              {activeTab === 'customers' && (
                <CustomersTab 
                  searchTerm={searchTerm}
                />
              )}
              {activeTab === 'products' && (
                <ProductsServicesTab 
                  searchTerm={searchTerm}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}