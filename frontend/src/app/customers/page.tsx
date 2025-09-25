'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Customer } from '@/types'
import { supabase } from '@/lib/supabase'
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
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const defaultCustomerForm = {
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_code: ''
  }

  const [addForm, setAddForm] = useState(defaultCustomerForm)
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState(defaultCustomerForm)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
    fetchCustomers()
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

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
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

  const openAddModal = () => {
    setAddForm(defaultCustomerForm)
    setAddError('')
    setShowAddModal(true)
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm({
      name: customer.name || '',
      customer_code: customer.customer_code || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: (customer as any).address || '',
      city: (customer as any).city || '',
      type: (customer as any).type || 'individual',
      status: (customer as any).status || 'active'
    })
    setEditError('')
    setShowEditModal(true)
  }

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddSaving(true)
    setAddError('')
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Chưa đăng nhập')
      const { error } = await supabase
        .from('customers')
        .insert([{ ...addForm, user_id: authUser.id }])
      if (error) throw error
      setShowAddModal(false)
      setNotice({ type: 'success', text: 'Thêm khách hàng thành công' })
      await refreshCustomers()
    } catch (err: any) {
      setAddError(err?.message || 'Không thể thêm khách hàng')
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
      const { error } = await supabase
        .from('customers')
        .update({ ...editForm })
        .eq('id', selectedCustomer.id)
      if (error) throw error
      setShowEditModal(false)
      setNotice({ type: 'success', text: 'Cập nhật khách hàng thành công' })
      await refreshCustomers()
    } catch (err: any) {
      setEditError(err?.message || 'Không thể cập nhật khách hàng')
    } finally {
      setEditSaving(false)
    }
  }

  const deleteCustomer = async (customer: Customer) => {
    if (!confirm(`Xóa khách hàng "${customer.name}"?`)) return
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id)
      if (error) throw error
      setNotice({ type: 'success', text: 'Đã xóa khách hàng' })
      await refreshCustomers()
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Không thể xóa khách hàng' })
    }
  }

  const filteredCustomers = customers.filter((customer: any) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (customer.name || '').toLowerCase().includes(term) ||
      (customer.email || '').toLowerCase().includes(term) ||
      (customer.phone || '').toLowerCase().includes(term)
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
    const totalRevenue = customers.reduce((sum, c) => sum + (c.total_revenue || 0), 0)
    const overdueCount = customers.filter(c => c.status === 'overdue').length
    
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
                <p className="mt-1 text-sm text-gray-500">
                  Quản lý toàn diện khách hàng, công nợ và giao dịch
                </p>
              </div>
              <div className="flex space-x-3">
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng khách hàng</p>
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
                  <p className="text-sm font-medium text-gray-600">Hoạt động</p>
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
                  <p className="text-sm font-medium text-gray-600">Tiềm năng</p>
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
                  <p className="text-sm font-medium text-gray-600">Công ty</p>
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
                  <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
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
                  <p className="text-sm font-medium text-gray-600">Quá hạn</p>
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
                    <Search className="h-5 w-5 text-gray-400" />
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
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Thông tin cơ bản khách hàng</p>
            </div>
          
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy khách hàng</h3>
                <p className="mt-1 text-sm text-gray-500">
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        KHÁCH HÀNG
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        EMAIL
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ĐIỆN THOẠI
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ĐỊA CHỈ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MÃ SỐ THUẾ
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Hành động</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
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
                              <div className="text-sm text-gray-500">ID: {customer.id.slice(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.address || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.tax_code || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setShowDetailModal(true)
                                }}
                                className="text-gray-400 hover:text-gray-600"
                                title="Xem chi tiết"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setShowTransactionModal(true)
                                }}
                                className="text-gray-400 hover:text-blue-600"
                                title="Lịch sử giao dịch"
                              >
                                <FileText className="h-5 w-5" />
                              </button>
                              <button onClick={() => openEditModal(customer)} className="text-gray-400 hover:text-gray-600" title="Sửa">
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => deleteCustomer(customer)}
                                className="text-gray-400 hover:text-red-600"
                                title="Xóa"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                              <button className="text-gray-400 hover:text-gray-600" title="Thêm">
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
                  className="text-gray-400 hover:text-gray-600"
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
                    <label className="block text-sm font-medium text-gray-700">Tên/Công ty</label>
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                    <input name="address" value={addForm.address} onChange={handleAddChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
                    <input name="tax_code" value={addForm.tax_code} onChange={handleAddChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
                  className="text-gray-400 hover:text-gray-600"
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
                        <label className="block text-sm font-medium text-gray-700">Tên/Công ty</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.name}</p>
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
                        <label className="block text-sm font-medium text-gray-700">Địa chỉ xuất hóa đơn</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.address || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Địa chỉ giao hàng</label>
                        <p className="text-sm text-gray-900">Sẽ được cập nhật</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms & Tax Info */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Điều khoản & Thông tin Thuế</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Điều khoản thanh toán</label>
                        <p className="text-sm text-gray-900">Net 30</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phương thức giao hàng</label>
                        <p className="text-sm text-gray-900">Tiêu chuẩn</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
                        <p className="text-sm text-gray-900">Sẽ được cập nhật</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái miễn thuế</label>
                        <p className="text-sm text-gray-900">Không</p>
                      </div>
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Lịch sử kiểm toán đầy đủ về mọi tương tác tài chính
                </p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          LOẠI
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SỐ
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          NGÀY
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SỐ TIỀN
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          TRẠNG THÁI
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          <td className="px-6 py-4 text-sm text-gray-500">
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Khách hàng: <span className="font-medium">{selectedCustomer.name}</span>
                </p>
                <p className="text-sm text-gray-500">
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
                  className="text-gray-400 hover:text-gray-600"
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
                    <label className="block text-sm font-medium text-gray-700">Tên/Công ty</label>
                    <input name="name" value={editForm.name} onChange={handleEditChange} required
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                    <input name="address" value={editForm.address} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
                    <input name="tax_code" value={(editForm as any).tax_code || ''} onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
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