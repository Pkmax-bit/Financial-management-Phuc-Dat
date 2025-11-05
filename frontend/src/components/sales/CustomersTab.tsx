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
  Star
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
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
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

  const handleDeleteCustomer = (customerId: string) => {
    console.log('Delete customer:', customerId)
    // Show confirmation dialog and delete
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
            <FileText className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Tổng hạn mức</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(filteredCustomers.reduce((sum, c) => sum + c.credit_limit, 0))}
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
                        title="Tạo hóa đơn"
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
                      <button 
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
          Tổng hạn mức: {formatCurrency(filteredCustomers.reduce((sum, c) => sum + c.credit_limit, 0))}
        </span>
      </div>
    </div>
  )
}
