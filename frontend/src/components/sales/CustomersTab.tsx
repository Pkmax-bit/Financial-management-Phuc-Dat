'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Eye,
  Filter,
  Star,
  DollarSign,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Customer } from '@/types'
import { customerApi } from '@/lib/api'

interface CustomersTabProps {
  searchTerm: string
}

export default function CustomersTab({ searchTerm }: CustomersTabProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [unpaidAmounts, setUnpaidAmounts] = useState<Record<string, number>>({})
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null)
    }

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdownId])

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
    }
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          customer_code,
          name,
          type,
          email,
          phone,
          address,
          city,
          country,
          tax_id,
          status,
          credit_limit,
          payment_terms,
          notes,
          assigned_to,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
      
      // Fetch unpaid amounts from invoices
      await fetchUnpaidAmounts(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnpaidAmounts = async (customersList: Customer[]) => {
    try {
      const customerIds = customersList.map(c => c.id)
      if (customerIds.length === 0) return

      // Fetch all invoices for these customers
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('customer_id, total_amount, paid_amount, payment_status')
        .in('customer_id', customerIds)
        .in('payment_status', ['pending', 'partial', 'overdue'])

      if (error) throw error

      // Calculate unpaid amount for each customer
      const unpaidMap: Record<string, number> = {}
      
      invoices?.forEach((invoice: any) => {
        const unpaid = (invoice.total_amount || 0) - (invoice.paid_amount || 0)
        if (unpaid > 0) {
          unpaidMap[invoice.customer_id] = (unpaidMap[invoice.customer_id] || 0) + unpaid
        }
      })

      setUnpaidAmounts(unpaidMap)
    } catch (error) {
      console.error('Error fetching unpaid amounts:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động'
      case 'inactive':
        return 'Ngừng hoạt động'
      case 'prospect':
        return 'Tiềm năng'
      default:
        return status
    }
  }

  const getCreditLimitColor = (creditLimit: number) => {
    if (creditLimit > 10000000) return 'text-green-600 font-semibold'
    if (creditLimit > 5000000) return 'text-blue-600 font-semibold'
    if (creditLimit > 0) return 'text-orange-600 font-semibold'
    return 'text-gray-900'
  }

  const handleViewCustomer = (customerId: string) => {
    console.log('View customer:', customerId)
    // Navigate to customer detail page
  }

  const handleEditCustomer = (customerId: string) => {
    console.log('Edit customer:', customerId)
    // Open edit modal or navigate to edit page
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    const customerId = customer.id
    const customerName = customer.name

    // Show confirmation dialog for soft delete
    const confirmSoftDelete = window.confirm(
      `Xóa tạm thời khách hàng "${customerName}"?\n\n` +
      `Khách hàng sẽ được đánh dấu là "không hoạt động" và có thể khôi phục bằng cách đổi trạng thái.\n\n` +
      `Bạn có chắc chắn muốn tiếp tục?`
    )

    if (!confirmSoftDelete) return

    try {
      setDeletingCustomerId(customerId)
      setDeleteMessage(null)

      // Soft delete by setting status to inactive
      await customerApi.deleteCustomer(customerId, false)

      // Show success message
      setDeleteMessage({
        type: 'success',
        text: `✅ Đã xóa tạm thời khách hàng "${customerName}" thành công (có thể khôi phục bằng cách đổi trạng thái)`
      })

      // Refresh customer list (no page reload)
      await fetchCustomers()

      // Auto-hide message after 3 seconds
      setTimeout(() => setDeleteMessage(null), 3000)
    } catch (err: unknown) {
      console.error('Error deleting customer:', err)
      setDeleteMessage({
        type: 'error',
        text: `❌ ${(err as Error)?.message || 'Không thể xóa khách hàng'}`
      })
      setTimeout(() => setDeleteMessage(null), 5000)
    } finally {
      setDeletingCustomerId(null)
    }
  }

  const handleHardDeleteCustomer = async (customer: Customer) => {
    const customerId = customer.id
    const customerName = customer.name

    // Show comprehensive warning for hard delete
    const confirmHardDelete = window.confirm(
      `🚨 CẢNH BÁO QUAN TRỌNG: Xóa vĩnh viễn khách hàng\n\n` +
      `Khách hàng: "${customerName}"\n\n` +
      `⚠️ HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC!\n\n` +
      `Dữ liệu sẽ bị xóa vĩnh viễn khỏi database bao gồm:\n` +
      `• Thông tin khách hàng\n` +
      `• Tất cả đơn hàng và báo giá\n` +
      `• Tất cả dự án liên quan\n` +
      `• Lịch sử thanh toán\n\n` +
      `Nếu có lỗi ràng buộc database, hệ thống sẽ thông báo chi tiết.\n\n` +
      `Bạn có ABSOLUTELY chắc chắn muốn xóa vĩnh viễn?`
    )

    if (!confirmHardDelete) return

    // Additional confirmation
    const finalConfirm = window.confirm(
      `🔴 XÁC NHẬN LẦN CUỐI\n\n` +
      `Bạn đang thực hiện xóa VĨNH VIỂN khách hàng "${customerName}".\n\n` +
      `KHÔNG CÓ CÁCH NÀO KHÔI PHỤC DỮ LIỆU SAU THAO TÁC NÀY!\n\n` +
      `Nhập "XÓA" để xác nhận:`
    )

    if (!finalConfirm) return

    try {
      setDeletingCustomerId(customerId)
      setDeleteMessage(null)

      await customerApi.deleteCustomer(customerId, true)

      // Show success message
      setDeleteMessage({
        type: 'success',
        text: `✅ Đã xóa vĩnh viễn khách hàng "${customerName}" và tất cả dữ liệu liên quan thành công`
      })

      // Refresh customer list (no page reload)
      await fetchCustomers()

      // Auto-hide message after 5 seconds for important action
      setTimeout(() => setDeleteMessage(null), 5000)
    } catch (err: unknown) {
      console.error('Error hard deleting customer:', err)
      const errorMessage = (err as Error)?.message || 'Không thể xóa vĩnh viễn khách hàng'
      setDeleteMessage({
        type: 'error',
        text: `❌ Lỗi xóa vĩnh viễn: ${errorMessage}`
      })
      setTimeout(() => setDeleteMessage(null), 8000)
    } finally {
      setDeletingCustomerId(null)
    }
  }

  const handleCreateInvoice = (customerId: string) => {
    console.log('Create invoice for customer:', customerId)
    // Navigate to create invoice with pre-selected customer
  }

  const togglePotentialCustomer = async (customer: Customer) => {
    try {
      const newStatus = customer.status === 'prospect' ? 'active' : 'prospect'
      await customerApi.updateCustomer(customer.id, { status: newStatus })
      // Refresh customers list
      await fetchCustomers()
    } catch (err: unknown) {
      console.error('Error toggling potential customer:', err)
      alert((err as Error)?.message || 'Không thể cập nhật trạng thái')
    }
  }

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = searchTerm === '' || 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'credit_limit':
          aValue = a.credit_limit
          bValue = b.credit_limit
          break
        case 'type':
          aValue = a.type.toLowerCase()
          bValue = b.type.toLowerCase()
          break
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Delete Message Notification */}
      {deleteMessage && (
        <div
          className={`p-4 rounded-lg shadow-md ${
            deleteMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{deleteMessage.text}</p>
            <button
              onClick={() => setDeleteMessage(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
            <option value="prospect">Tiềm năng</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order as 'asc' | 'desc')
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name-asc">Tên (A-Z)</option>
            <option value="name-desc">Tên (Z-A)</option>
            <option value="type-asc">Loại (A-Z)</option>
            <option value="type-desc">Loại (Z-A)</option>
            <option value="credit_limit-desc">Hạn mức (Cao nhất)</option>
            <option value="credit_limit-asc">Hạn mức (Thấp nhất)</option>
            <option value="created_at-desc">Mới nhất</option>
            <option value="created_at-asc">Cũ nhất</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm khách hàng
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Tổng khách hàng</p>
              <p className="text-2xl font-bold text-gray-900">{filteredCustomers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Khách hàng hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCustomers.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Chưa thanh toán</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  filteredCustomers.reduce((sum, c) => sum + (unpaidAmounts[c.id] || 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Khách hàng công ty</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCustomers.filter(c => c.type === 'company').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Tài chính
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Thông tin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                  Tiềm năng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-black">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-black">Mã: {customer.customer_code}</div>
                      </div>
                    </div>
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
                      {!customer.email && !customer.phone && (
                        <div className="text-sm text-black">—</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className={`${getCreditLimitColor(customer.credit_limit)}`}>
                        Hạn mức: {formatCurrency(customer.credit_limit)}
                      </div>
                      <div className="text-xs text-black">Thanh toán: {customer.payment_terms} ngày</div>
                      {unpaidAmounts[customer.id] && unpaidAmounts[customer.id] > 0 && (
                        <div className="text-xs font-semibold text-red-600 mt-1">
                          Chưa thanh toán: {formatCurrency(unpaidAmounts[customer.id])}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.type === 'individual' ? 'bg-blue-100 text-blue-800' :
                          customer.type === 'company' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {customer.type === 'individual' ? 'Cá nhân' : 
                           customer.type === 'company' ? 'Công ty' : 'Cơ quan nhà nước'}
                        </span>
                      </div>
                      <div className="text-xs text-black mt-1">{customer.city || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {formatDate(customer.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                      {getStatusLabel(customer.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePotentialCustomer(customer)
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title={customer.status === 'prospect' ? 'Bỏ đánh dấu khách hàng tiềm năng' : 'Đánh dấu khách hàng tiềm năng'}
                    >
                      <Star 
                        className={`h-5 w-5 ${
                          customer.status === 'prospect' 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300 hover:text-yellow-400'
                        } transition-colors`} 
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewCustomer(customer.id)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleCreateInvoice(customer.id)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Tạo đơn hàng"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditCustomer(customer.id)}
                        className="text-black hover:text-gray-900 p-1"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenDropdownId(openDropdownId === customer.id ? null : customer.id)
                          }}
                          className="text-red-600 hover:text-red-900 p-1 flex items-center"
                          title="Tùy chọn xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                          <svg
                            className={`h-3 w-3 ml-1 transition-transform ${openDropdownId === customer.id ? 'rotate-180' : ''}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {openDropdownId === customer.id && (
                          <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCustomer(customer)
                                setOpenDropdownId(null)
                              }}
                              className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md flex items-center"
                              disabled={deletingCustomerId === customer.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <div className="font-medium">Xóa tạm thời</div>
                                <div className="text-xs text-gray-500">Có thể khôi phục bằng cách đổi trạng thái</div>
                              </div>
                              {deletingCustomerId === customer.id && (
                                <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleHardDeleteCustomer(customer)
                                setOpenDropdownId(null)
                              }}
                              className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-md border-t border-gray-200 flex items-center"
                              disabled={deletingCustomerId === customer.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                              <div>
                                <div className="font-medium">Xóa hoàn toàn</div>
                                <div className="text-xs text-red-400">Không thể khôi phục - xóa tất cả dữ liệu</div>
                              </div>
                              {deletingCustomerId === customer.id && (
                                <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-black">Không tìm thấy khách hàng nào</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Thêm khách hàng đầu tiên
            </button>
          </div>
        )}
      </div>
      
      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-black">
        <span>Hiển thị {filteredCustomers.length} khách hàng</span>
        <span>
          Chưa thanh toán: {formatCurrency(
            filteredCustomers.reduce((sum, c) => sum + (unpaidAmounts[c.id] || 0), 0)
          )}
        </span>
      </div>
    </div>
  )
}
