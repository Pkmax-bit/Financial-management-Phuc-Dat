'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
  CreditCard,
  BookOpen,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import OverviewTab from '@/components/sales/OverviewTab'
import ProductCatalog, { ProductCatalogRef } from '@/components/sales/ProductCatalog'
import ProductCategoriesTab from '@/components/sales/ProductCategoriesTab'
import ProductCreateModal from '@/components/sales/ProductCreateModal'
import ProductExcelUpload from '@/components/sales/ProductExcelUpload'
import QuoteExcelUploadAI from '@/components/sales/QuoteExcelUploadAI'
// import AllSalesTab from '@/components/sales/AllSalesTab' // Tạm thời ẩn
import QuotesTab from '@/components/sales/QuotesTab'
import InvoicesTab from '@/components/sales/InvoicesTab'
import PaymentsTab from '@/components/sales/PaymentsTab'
import PaymentMethodsTab from '@/components/sales/PaymentMethodsTab'
// import CustomersTab from '@/components/sales/CustomersTab' // Tạm thời ẩn
// import SalesReceiptsTab from '@/components/sales/SalesReceiptsTab' // Tạm thời ẩn
// // import VarianceTab from '@/components/sales/VarianceTab' // Tạm thời ẩn
import CreateSalesReceiptModal from '@/components/sales/CreateSalesReceiptModal'
import QuickGuideModal from '@/components/sales/QuickGuideModal'
import MaterialAdjustmentRulesTab from '@/components/sales/MaterialAdjustmentRulesTab'
import { apiGet } from '@/lib/api'
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'

interface User {
  full_name?: string
  role?: string
  email?: string
}

function SalesPageContent({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const productCatalogRef = useRef<ProductCatalogRef>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [salesStats, setSalesStats] = useState<unknown>({})
  const [shouldOpenCreateModal, setShouldOpenCreateModal] = useState(false)
  const [showCreateReceiptModal, setShowCreateReceiptModal] = useState(false)
  const [showCreateProductModal, setShowCreateProductModal] = useState(false)
  const [showQuickGuide, setShowQuickGuide] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    const action = searchParams.get('action')
    const tab = searchParams.get('tab')

    // If tab is specified in URL, set it first
    if (tab && ['overview', 'quotes', 'invoices', 'payments', 'payment-methods', 'products', 'product-categories', 'adjustments', 'upload-quote'].includes(tab)) {
      setActiveTab(tab)
    }

    // Then check for action
    if (action === 'create') {
      // Use tab from URL if available, otherwise use current activeTab
      const targetTab = tab || activeTab
      
      // Use setTimeout to ensure activeTab is updated first if tab was set
      const openModal = () => {
        if (targetTab === 'quotes' || tab === 'quotes') {
          setActiveTab('quotes')
          // Use a small delay to ensure tab is set before opening modal
          setTimeout(() => {
            setShouldOpenCreateModal(true)
          }, 100)
        } else if (targetTab === 'invoices' || tab === 'invoices') {
          setActiveTab('invoices')
          setTimeout(() => {
            setShouldOpenCreateModal(true)
          }, 100)
        } else if (targetTab === 'receipts' || tab === 'receipts') {
          setActiveTab('receipts')
          setTimeout(() => {
            setShowCreateReceiptModal(true)
          }, 100)
        } else if (activeTab === 'quotes') {
          setShouldOpenCreateModal(true)
        } else if (activeTab === 'invoices') {
          setShouldOpenCreateModal(true)
        } else if (activeTab === 'receipts') {
          setShowCreateReceiptModal(true)
        }
      }

      // If tab was set, wait a bit for it to update, otherwise open immediately
      if (tab) {
        setTimeout(openModal, 200)
      } else {
        openModal()
      }
    }
  }, [searchParams, activeTab])

  useEffect(() => {
    if (shouldOpenCreateModal && (activeTab === 'quotes' || activeTab === 'invoices')) {
      // Reset the flag after a longer delay to ensure modal opens
      const timer = setTimeout(() => {
        setShouldOpenCreateModal(false)
      }, 500)
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
        const stats = await apiGet(getApiEndpoint('/api/sales/dashboard/stats'))
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
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="w-full">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Center</h1>
                <p className="mt-1 text-sm text-black">
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
                {activeTab !== 'overview' && (
                  <>
                    {activeTab === 'quotes' && (
                      <button
                        onClick={handleCreateQuote}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo báo giá
                      </button>
                    )}
                    {activeTab === 'invoices' && (
                      <button
                        onClick={handleCreateInvoice}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo đơn hàng
                      </button>
                    )}
                    {activeTab === 'receipts' && (
                      <button
                        onClick={() => setShowCreateReceiptModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo phiếu thu
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
                      <>
                        <button
                          onClick={() => setShowCreateProductModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm sản phẩm
                        </button>
                        <Link
                          href="/sales/custom-products"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Tùy chỉnh sản phẩm
                        </Link>
                      </>
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
                    <p className="text-sm font-medium text-black">Tổng báo giá</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(quotesStats as Record<string, unknown>).total as number || 0}
                    </p>
                    <p className="text-sm text-black">
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
                    <p className="text-sm font-medium text-black">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency((revenue as Record<string, unknown>).total as number || 0)}
                    </p>
                    <p className="text-sm text-black">{(invoicesStats as Record<string, unknown>).total as number || 0} đơn hàng</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-500">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-black">Đã thanh toán</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency((revenue as Record<string, unknown>).paid as number || 0)}
                    </p>
                    <p className="text-sm text-black">Đã thu</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-orange-500">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-black">Chờ thanh toán</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency((revenue as Record<string, unknown>).pending as number || 0)}
                    </p>
                    <p className="text-sm text-black">
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
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Tổng quan
                </button>
                {/* Tạm thời ẩn nút Tất cả giao dịch */}
                {/* <button
                  onClick={() => setActiveTab('all-sales')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all-sales'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Tất cả giao dịch
                </button> */}
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoices'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Đơn hàng ({(invoicesStats as Record<string, unknown>).total as number || 0})
                </button>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'quotes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Báo giá ({String(Object.values((quotesStats as Record<string, unknown>).by_status || {}).reduce((a: unknown, b: unknown) => (a as number) + (b as number), 0))})
                </button>
                {/* Tạm thời ẩn nút Phiếu Thu */}
                {/* <button
                  onClick={() => setActiveTab('receipts')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'receipts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Phiếu Thu
                </button> */}
                <button
                  onClick={() => setActiveTab('payment-methods')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'payment-methods'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Phương thức thanh toán
                </button>
                {/* Tạm thời ẩn nút Khách hàng */}
                {/* <button
                  onClick={() => setActiveTab('customers')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'customers'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Khách hàng
                </button> */}
                {/* Tạm thời ẩn nút Chênh lệch trước đơn hàng */}
                {/* <button
                  onClick={() => setActiveTab('variance')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'variance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Chênh lệch trước đơn hàng
                </button> */}
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'products'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Sản phẩm
                </button>
                <button
                  onClick={() => setActiveTab('product-categories')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'product-categories'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Loại sản phẩm
                </button>
                <button
                  onClick={() => setActiveTab('adjustments')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'adjustments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Điều chỉnh
                </button>
                <button
                  onClick={() => setActiveTab('upload-quote')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${activeTab === 'upload-quote'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Import Excel với AI</span>
                </button>
              </nav>
            </div>

            {/* Search Bar - Only show for non-overview tabs, but hide for quotes and invoices */}
            {activeTab !== 'overview' && activeTab !== 'quotes' && activeTab !== 'invoices' && activeTab !== 'payment-methods' && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-black" />
                  </div>
                  <input
                    type="text"
                    placeholder='Tìm kiếm...'
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
              {/* Tạm thời ẩn tab Tất cả giao dịch */}
              {/* {activeTab === 'all-sales' && (
                <AllSalesTab
                  searchTerm={searchTerm}
                />
              )} */}
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
              {/* Tạm thời ẩn tab Phiếu Thu */}
              {/* {activeTab === 'receipts' && (
                <SalesReceiptsTab
                  onShowCreateModal={() => setShowCreateReceiptModal(true)}
                  onShowEditModal={(receipt) => console.log('Edit receipt:', receipt)}
                  onShowDetailModal={(receipt) => console.log('Detail receipt:', receipt)}
                />
              )} */}
              {activeTab === 'payment-methods' && (
                <PaymentMethodsTab
                  searchTerm={searchTerm}
                />
              )}
              {/* Tạm thời ẩn tab Khách hàng */}
              {/* {activeTab === 'customers' && (
                <CustomersTab
                  searchTerm={searchTerm}
                />
              )} */}
              {/* Tạm thời ẩn tab Chênh lệch trước đơn hàng */}
              {/* {activeTab === 'variance' && (
                <VarianceTab
                  searchTerm={searchTerm}
                />
              )} */}
              {activeTab === 'products' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Danh mục sản phẩm</h3>
                    <p className="text-sm text-black">Bảng chứa sản phẩm, phân theo loại sản phẩm (Loại, Tên, Đơn giá, Đơn vị, Mô tả)</p>
                  </div>

                  {/* Excel Upload Section */}
                  <div className="mb-6">
                    <ProductExcelUpload onImportComplete={() => {
                      // Refresh product catalog after import
                      productCatalogRef.current?.refresh()
                    }} />
                  </div>

                  <ProductCatalog ref={productCatalogRef} />
                </div>
              )}
              {activeTab === 'product-categories' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Loại sản phẩm</h3>
                    <p className="text-sm text-black">Tạo và quản lý loại sản phẩm</p>
                  </div>
                  <ProductCategoriesTab />
                </div>
              )}
              {activeTab === 'adjustments' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Điều chỉnh vật tư</h3>
                    <p className="text-sm text-black">Thiết lập quy tắc điều chỉnh theo kích thước, số lượng</p>
                  </div>
                  <MaterialAdjustmentRulesTab />
                </div>
              )}
              {activeTab === 'upload-quote' && (
                <QuoteExcelUploadAI onImportSuccess={() => {
                  // Refresh data after import
                  setActiveTab('quotes')
                  // Trigger refresh if needed
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Sales Receipt Modal */}
      <CreateSalesReceiptModal
        isOpen={showCreateReceiptModal}
        onClose={() => setShowCreateReceiptModal(false)}
        onSuccess={() => {
          setShowCreateReceiptModal(false)
          // Refresh data if needed
        }}
      />

      {/* Quick Guide Modal */}
      <QuickGuideModal
        isOpen={showQuickGuide}
        onClose={() => setShowQuickGuide(false)}
      />

      {/* Create Product Modal */}
      <ProductCreateModal
        isOpen={showCreateProductModal}
        onClose={() => setShowCreateProductModal(false)}
        onSuccess={() => {
          setShowCreateProductModal(false)
        }}
      />
    </LayoutWithSidebar>
  )
}

function SalesPageWithParams() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Extract tab immediately to avoid searchParams enumeration
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'quotes', 'invoices', 'payments', 'payment-methods', 'products', 'product-categories', 'adjustments'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  return <SalesPageContent activeTab={activeTab} setActiveTab={setActiveTab} />
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SalesPageWithParams />
    </Suspense>
  )
}