'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Customer } from '@/types'
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Users,
  FileText,
  Receipt,
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  Building,
  Truck,
  FileImage,
  Settings,
  BarChart3,
  PieChart,
  TrendingDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { customerApi } from '@/lib/api'
import Navigation from '@/components/Navigation'

interface Transaction {
  id: string
  type: 'estimate' | 'invoice' | 'receipt' | 'payment' | 'credit' | 'refund'
  number: string
  date: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partial' | 'cancelled'
  description?: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showQuickActionModal, setShowQuickActionModal] = useState(false)
  const [quickActionType, setQuickActionType] = useState<'invoice' | 'payment' | 'estimate' | 'reminder'>('invoice')
  const [user, setUser] = useState<{ email?: string; full_name?: string; role?: string } | null>(null)
  const router = useRouter()

  const defaultCustomerForm = {
    customer_code: '',
    name: '',
    type: 'individual',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Vietnam',
    tax_id: '',
    credit_limit: 0,
    payment_terms: 30,
    notes: '',
    assigned_to: '',
    status: 'active'
  }

  const [addForm, setAddForm] = useState(defaultCustomerForm)
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState(defaultCustomerForm)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Mock transaction data
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'invoice',
      number: 'INV-2024-001',
      date: '2024-01-15',
      amount: 2500000,
      status: 'overdue',
      description: 'Dịch vụ tư vấn tháng 1'
    },
    {
      id: '2',
      type: 'payment',
      number: 'PAY-2024-001',
      date: '2024-01-10',
      amount: 1500000,
      status: 'paid',
      description: 'Thanh toán một phần'
    },
    {
      id: '3',
      type: 'estimate',
      number: 'EST-2024-001',
      date: '2024-01-05',
      amount: 3000000,
      status: 'sent',
      description: 'Báo giá dự án mới'
    }
  ]

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
          // Fetch customers after user is set
          fetchCustomers()
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

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching customers...')
      
      // Try authenticated endpoint first
      try {
        const data = await customerApi.getCustomers()
        setCustomers(Array.isArray(data) ? data : [])
        console.log('Successfully fetched customers via authenticated API:', data?.length || 0)
        return
      } catch (authError) {
        console.log('Authenticated API failed, trying public endpoint:', authError)
        
        // Fallback to public endpoint
        try {
          const data = await customerApi.getCustomersPublic()
          setCustomers(Array.isArray(data) ? data : [])
          setError('Hiển thị dữ liệu mẫu (chưa đăng nhập)')
          console.log('Successfully fetched customers via public API:', data?.length || 0)
          return
        } catch (publicError) {
          console.log('Public API also failed:', publicError)
          throw publicError
        }
      }
      
    } catch (error: unknown) {
      console.error('Error fetching customers:', error)
      setError(`Lỗi không thể tải danh sách khách hàng: ${(error as Error)?.message || 'Không thể kết nối'}`)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const refreshCustomers = async () => {
    setLoading(true)
    await fetchCustomers()
    setLoading(false)
  }

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleAddTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleEditTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const openAddModal = () => {
    setAddForm(defaultCustomerForm)
    setAddError('')
    setShowAddModal(true)
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm({
      customer_code: customer.customer_code || '',
      name: customer.name || '',
      type: customer.type || 'individual',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || 'Vietnam',
      tax_id: customer.tax_id || '',
      credit_limit: customer.credit_limit || 0,
      payment_terms: customer.payment_terms || 30,
      notes: customer.notes || '',
      assigned_to: customer.assigned_to || '',
      status: customer.status || 'active'
    })
    setEditError('')
    setShowEditModal(true)
  }

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddSaving(true)
    setAddError('')
    try {
      // Prepare customer data according to API schema
      const customerData = {
        customer_code: addForm.customer_code,
        name: addForm.name,
        type: addForm.type as 'individual' | 'company' | 'government',
        email: addForm.email || undefined,
        phone: addForm.phone || undefined,
        address: addForm.address || undefined,
        city: addForm.city || undefined,
        country: addForm.country || 'Vietnam',
        tax_id: addForm.tax_id || undefined,
        status: 'active' as 'active' | 'inactive' | 'prospect',
        credit_limit: addForm.credit_limit || 0,
        payment_terms: addForm.payment_terms || 30,
        notes: addForm.notes || undefined,
        assigned_to: addForm.assigned_to || undefined
      }
      
      await customerApi.createCustomer(customerData)
      setShowAddModal(false)
      setNotice({ type: 'success', text: 'Thêm khách hàng thành công' })
      await fetchCustomers()
    } catch (err: unknown) {
      setAddError((err as Error)?.message || 'Không thể thêm khách hàng')
    } finally {
      setAddSaving(false)
    }
  }

  const updateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return
    setEditSaving(true)
    setEditError('')
    try {
      // Prepare update data according to API schema
      const updateData = {
        customer_code: editForm.customer_code,
        name: editForm.name,
        type: editForm.type,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        address: editForm.address || undefined,
        city: editForm.city || undefined,
        country: editForm.country || 'Vietnam',
        tax_id: editForm.tax_id || undefined,
        status: editForm.status || 'active',
        credit_limit: editForm.credit_limit || 0,
        payment_terms: editForm.payment_terms || 30,
        notes: editForm.notes || undefined,
        assigned_to: editForm.assigned_to || undefined
      }
      
      await customerApi.updateCustomer(selectedCustomer.id, updateData)
      setShowEditModal(false)
      setNotice({ type: 'success', text: 'Cập nhật khách hàng thành công' })
      await fetchCustomers()
    } catch (err: unknown) {
      setEditError((err as Error)?.message || 'Không thể cập nhật khách hàng')
    } finally {
      setEditSaving(false)
    }
  }

  const deleteCustomer = async (customer: Customer) => {
    if (!confirm(`Xóa khách hàng "${customer.name}"?`)) return
    try {
      await customerApi.deleteCustomer(customer.id)
      setNotice({ type: 'success', text: 'Đã xóa khách hàng' })
      await fetchCustomers()
    } catch (err: unknown) {
      setNotice({ type: 'error', text: (err as Error)?.message || 'Không thể xóa khách hàng' })
    }
  }

  const filteredCustomers = customers.filter((customer: unknown) => {
    const c = customer as { name?: string; email?: string; phone?: string }
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term)
    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'prospect':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'individual':
        return 'bg-purple-100 text-purple-800'
      case 'company':
        return 'bg-blue-100 text-blue-800'
      case 'government':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze':
        return 'bg-orange-100 text-orange-800'
      case 'silver':
        return 'bg-gray-100 text-gray-800'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800'
      case 'platinum':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-100 text-blue-800'
      case 'payment':
        return 'bg-green-100 text-green-800'
      case 'estimate':
        return 'bg-yellow-100 text-yellow-800'
      case 'receipt':
        return 'bg-purple-100 text-purple-800'
      case 'credit':
        return 'bg-orange-100 text-orange-800'
      case 'refund':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCustomerLevel = (customerId: string) => {
    // This would be calculated based on revenue in a real implementation
    return 'bronze' // Placeholder
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

  const getCustomerStats = () => {
    const total = customers.length
    const active = customers.filter(c => c.status === 'active').length
    const prospects = customers.filter(c => c.status === 'prospect').length
    const companies = customers.filter(c => c.type === 'company').length
    const totalRevenue = 0 // TODO: Calculate from invoices when available
    const overdueCount = 0 // TODO: Calculate from invoices when available
    
    return { total, active, prospects, companies, totalRevenue, overdueCount }
  }

  const getOpenBalance = (customerId: string) => {
    // Mock calculation - in real app, this would be calculated from transactions
    return Math.floor(Math.random() * 10000000)
  }

  const stats = getCustomerStats()

  const handleQuickAction = (actionType: 'invoice' | 'payment' | 'estimate' | 'reminder') => {
    setQuickActionType(actionType)
    setShowQuickActionModal(true)
  }

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
              <h2 className="text-2xl font-semibold text-gray-900">Trung tâm Khách hàng</h2>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trung tâm Khách hàng</h1>
                <p className="mt-1 text-sm text-black">
                  Quản lý toàn diện khách hàng, công nợ và giao dịch
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      customers.length > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-black">
                      {customers.length > 0 ? `${customers.length} khách hàng` : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                  {user && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs text-black">Đã đăng nhập: {user?.email || 'Unknown'}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchCustomers}
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
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Báo cáo
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="h-4 w-4 mr-2" />
                  Xuất Excel
                </button>
                <button 
                  onClick={openAddModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm khách hàng
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
                    onClick={fetchCustomers}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Tổng khách hàng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Hoạt động</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-500">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Tiềm năng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.prospects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Công ty</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-500">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Quá hạn</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdueCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-black" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, email, điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-3 justify-end">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Filter className="h-4 w-4 mr-2" />
                    Bộ lọc
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Danh sách Khách hàng ({filteredCustomers.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-black">Thông tin cơ bản khách hàng</p>
            </div>
          
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-black" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy khách hàng</h3>
                <p className="mt-1 text-sm text-black">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterLevel !== 'all'
                    ? 'Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc.'
                    : 'Bắt đầu bằng cách thêm khách hàng mới.'}
                </p>
                {!searchTerm && filterType === 'all' && filterStatus === 'all' && filterLevel === 'all' && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm khách hàng
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        KHÁCH HÀNG
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        LOẠI
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        LIÊN HỆ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        TÀI CHÍNH
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        TRẠNG THÁI
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Hành động</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* eslint-disable @typescript-eslint/no-explicit-any */}
                    {filteredCustomers.map((customer: any) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.name}
                                </div>
                                <div className="text-sm text-black">Mã: {customer.customer_code || customer.id.slice(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(customer.type)}`}>
                            {customer.type === 'individual' ? 'Cá nhân' :
                             customer.type === 'company' ? 'Công ty' : 'Cơ quan nhà nước'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1 text-black" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center mt-1">
                                <Phone className="h-3 w-3 mr-1 text-black" />
                                {customer.phone}
                              </div>
                            )}
                            {!customer.email && !customer.phone && <span className="text-black">—</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>Hạn mức: {formatCurrency(customer.credit_limit || 0)}</div>
                            <div className="text-xs text-black">Thanh toán: {customer.payment_terms || 30} ngày</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                            {customer.status === 'active' ? 'Hoạt động' :
                             customer.status === 'inactive' ? 'Ngừng hoạt động' : 'Tiềm năng'}
                          </span>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setShowDetailModal(true)
                                }}
                                className="text-black hover:text-black"
                                title="Xem chi tiết"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setShowTransactionModal(true)
                                }}
                                className="text-black hover:text-blue-600"
                                title="Lịch sử giao dịch"
                              >
                                <FileText className="h-5 w-5" />
                              </button>
                              <button onClick={() => openEditModal(customer)} className="text-black hover:text-black" title="Sửa">
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => deleteCustomer(customer)}
                                className="text-black hover:text-red-600"
                                title="Xóa"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                              <button className="text-black hover:text-black" title="Thêm">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Action Bar */}
          {selectedCustomer && (
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Hành động nhanh cho {selectedCustomer.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => handleQuickAction('invoice')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Tạo Hóa đơn
                </button>
                <button
                  onClick={() => handleQuickAction('payment')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Ghi nhận Thanh toán
                </button>
                <button
                  onClick={() => handleQuickAction('estimate')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Receipt className="h-5 w-5 mr-2" />
                  Tạo Báo giá
                </button>
                <button
                  onClick={() => handleQuickAction('reminder')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Gửi email nhắc nợ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[30rem] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Thêm khách hàng mới</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-black hover:text-black"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {addError && (
                <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {addError}
                </div>
              )}

              <form onSubmit={createCustomer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mã khách hàng *</label>
                    <input name="customer_code" value={addForm.customer_code} onChange={handleAddChange} required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loại khách hàng</label>
                    <select name="type" value={addForm.type} onChange={handleAddChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="individual">Cá nhân</option>
                      <option value="company">Công ty</option>
                      <option value="government">Cơ quan nhà nước</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tên/Công ty *</label>
                    <input name="name" value={addForm.name} onChange={handleAddChange} required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input name="email" type="email" value={addForm.email} onChange={handleAddChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Điện thoại</label>
                    <input name="phone" value={addForm.phone} onChange={handleAddChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Thành phố</label>
                    <input name="city" value={addForm.city} onChange={handleAddChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                    <input name="address" value={addForm.address} onChange={handleAddChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
                    <input name="tax_id" value={addForm.tax_id} onChange={handleAddChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quốc gia</label>
                    <input name="country" value={addForm.country} onChange={handleAddChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                
                {/* Financial Information */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Thông tin tài chính</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hạn mức tín dụng (VND)</label>
                      <input name="credit_limit" type="number" value={addForm.credit_limit} onChange={handleAddChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Điều khoản thanh toán (ngày)</label>
                      <input name="payment_terms" type="number" value={addForm.payment_terms} onChange={handleAddChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                
                {/* Additional Information */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Thông tin bổ sung</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                      <textarea name="notes" value={addForm.notes} onChange={handleAddTextareaChange} rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    Hủy
                  </button>
                  <button type="submit" disabled={addSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {addSaving ? 'Đang lưu...' : 'Thêm khách hàng'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Hồ sơ Khách hàng Chi tiết</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-black hover:text-black"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact & Billing Info */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Thông tin liên hệ & Hóa đơn</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mã khách hàng</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.customer_code || selectedCustomer.id.slice(0, 8)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tên/Công ty</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Loại khách hàng</label>
                        <p className="text-sm text-gray-900">
                          {selectedCustomer.type === 'individual' ? 'Cá nhân' :
                           selectedCustomer.type === 'company' ? 'Công ty' : 'Cơ quan nhà nước'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.email || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Điện thoại</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.address || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Thành phố</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.city || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quốc gia</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.country || 'Vietnam'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial & Tax Info */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Thông tin Tài chính & Thuế</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Hạn mức tín dụng</label>
                        <p className="text-sm text-gray-900">{formatCurrency(selectedCustomer.credit_limit || 0)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Điều khoản thanh toán</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.payment_terms || 30} ngày</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.tax_id || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedCustomer.status)}`}>
                          {selectedCustomer.status === 'active' ? 'Hoạt động' :
                           selectedCustomer.status === 'inactive' ? 'Ngừng hoạt động' : 'Tiềm năng'}
                        </span>
                      </div>
                      {selectedCustomer.notes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                          <p className="text-sm text-gray-900">{selectedCustomer.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Đóng
                </button>
                <button
                  onClick={() => { setShowDetailModal(false); if (selectedCustomer) openEditModal(selectedCustomer) }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Sửa khách hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Lịch sử Giao dịch - {selectedCustomer.name}</h3>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-black hover:text-black"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-black">
                  Lịch sử kiểm toán đầy đủ về mọi tương tác tài chính
                </p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          LOẠI
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          SỐ
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          NGÀY
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          SỐ TIỀN
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          TRẠNG THÁI
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          MÔ TẢ
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Hành động</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                              {transaction.type === 'invoice' ? 'Hóa đơn' :
                               transaction.type === 'payment' ? 'Thanh toán' :
                               transaction.type === 'estimate' ? 'Báo giá' :
                               transaction.type === 'receipt' ? 'Phiếu bán hàng' :
                               transaction.type === 'credit' ? 'Ghi có' : 'Hoàn tiền'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(transaction.status)}`}>
                              {transaction.status === 'paid' ? 'Đã thanh toán' :
                               transaction.status === 'overdue' ? 'Quá hạn' :
                               transaction.status === 'partial' ? 'Thanh toán một phần' :
                               transaction.status === 'sent' ? 'Đã gửi' :
                               transaction.status === 'draft' ? 'Nháp' : 'Đã hủy'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-black">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Modal */}
      {showQuickActionModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {quickActionType === 'invoice' ? 'Tạo Hóa đơn' :
                   quickActionType === 'payment' ? 'Ghi nhận Thanh toán' :
                   quickActionType === 'estimate' ? 'Tạo Báo giá' : 'Gửi email nhắc nợ'}
                </h3>
                <button
                  onClick={() => setShowQuickActionModal(false)}
                  className="text-black hover:text-black"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-black">
                  Khách hàng: <span className="font-medium">{selectedCustomer.name}</span>
                </p>
                <p className="text-sm text-black">
                  Form {quickActionType === 'invoice' ? 'tạo hóa đơn' :
                        quickActionType === 'payment' ? 'ghi nhận thanh toán' :
                        quickActionType === 'estimate' ? 'tạo báo giá' : 'gửi email nhắc nợ'} sẽ được phát triển.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowQuickActionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  {quickActionType === 'invoice' ? 'Tạo hóa đơn' :
                   quickActionType === 'payment' ? 'Ghi nhận' :
                   quickActionType === 'estimate' ? 'Tạo báo giá' : 'Gửi email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[30rem] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Sửa khách hàng</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-black hover:text-black"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {editError && (
                <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editError}
                </div>
              )}

              <form onSubmit={updateCustomer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mã khách hàng</label>
                    <input name="customer_code" value={editForm.customer_code} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loại khách hàng</label>
                    <select name="type" value={editForm.type} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="individual">Cá nhân</option>
                      <option value="company">Công ty</option>
                      <option value="government">Cơ quan nhà nước</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tên/Công ty</label>
                    <input name="name" value={editForm.name} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input name="email" type="email" value={editForm.email} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Điện thoại</label>
                    <input name="phone" value={editForm.phone} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Thành phố</label>
                    <input name="city" value={editForm.city} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                    <input name="address" value={editForm.address} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
                    <input name="tax_id" value={editForm.tax_id} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quốc gia</label>
                    <input name="country" value={editForm.country} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                
                {/* Financial Information */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Thông tin tài chính</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hạn mức tín dụng (VND)</label>
                      <input name="credit_limit" type="number" value={editForm.credit_limit} onChange={handleEditChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Điều khoản thanh toán (ngày)</label>
                      <input name="payment_terms" type="number" value={editForm.payment_terms} onChange={handleEditChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                
                {/* Additional Information */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Thông tin bổ sung</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                      <textarea name="notes" value={editForm.notes} onChange={handleEditTextareaChange} rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    Hủy
                  </button>
                  <button type="submit" disabled={editSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
