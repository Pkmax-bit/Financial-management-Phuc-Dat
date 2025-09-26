'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Download
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Vendor {
  id: string
  name: string
  company_name?: string
  email?: string
  phone?: string
  address?: string
  tax_id?: string
  payment_terms?: string
  status: 'active' | 'inactive'
  notes?: string
  total_bills?: number
  total_amount?: number
  created_at: string
  updated_at: string
}

interface VendorsTabProps {
  searchTerm: string
  onCreateVendor: () => void
}

export default function VendorsTab({ searchTerm, onCreateVendor }: VendorsTabProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        // User is authenticated, proceed to fetch vendors
        fetchVendors()
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    }
  }

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('vendors')
        .select(`
          id,
          name,
          company_name,
          email,
          phone,
          address,
          tax_id,
          payment_terms,
          status,
          notes,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVendors(data || [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVendorStatus = async (vendorId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/expenses/vendors/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchVendors() // Refresh list
      }
    } catch (error) {
      console.error('Error updating vendor status:', error)
    }
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
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động'
      case 'inactive': return 'Không hoạt động'
      default: return status
    }
  }

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || vendor.status === filter
    
    return matchesSearch && matchesFilter
  })

  return (
    <div>
      {/* Quick Actions Bar */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h4 className="font-medium text-gray-900">Hành động nhanh:</h4>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
              <Plus className="w-4 h-4 mr-1" />
              Tạo Bill từ NCC
            </button>
            <button className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Tạo Expense mới
            </button>
            <button className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              Báo cáo Chi phí theo NCC
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {filteredVendors.length} nhà cung cấp • {filteredVendors.filter(v => v.status === 'active').length} hoạt động
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Danh bạ Nhà cung cấp</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            Xuất danh sách
          </button>
          <button 
            onClick={onCreateVendor}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Thêm Nhà cung cấp
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nhà cung cấp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thông tin liên hệ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng hóa đơn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng số tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Không tìm thấy nhà cung cấp nào
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      <Building2 className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        {vendor.company_name && (
                          <div className="text-xs text-gray-500">{vendor.company_name}</div>
                        )}
                        {vendor.tax_id && (
                          <div className="text-xs text-gray-500">MST: {vendor.tax_id}</div>
                        )}
                        {vendor.payment_terms && (
                          <div className="text-xs text-blue-600">Điều kiện: {vendor.payment_terms}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-1">
                      {vendor.email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">
                            {vendor.email}
                          </a>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:underline">
                            {vendor.phone}
                          </a>
                        </div>
                      )}
                      {vendor.address && (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-xs">{vendor.address}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{vendor.total_bills || 0} bill</div>
                    <div className="text-xs text-gray-500">
                      {(vendor.total_bills || 0) > 0 ? 'Có lịch sử giao dịch' : 'Chưa có giao dịch'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-semibold">
                      {vendor.total_amount ? formatCurrency(vendor.total_amount) : '0 ₫'}
                    </div>
                    <div className="text-xs text-gray-500">Tổng chi tiêu</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleVendorStatus(vendor.id, vendor.status === 'active' ? 'inactive' : 'active')}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${getStatusColor(vendor.status)}`}
                    >
                      {getStatusText(vendor.status)}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{formatDate(vendor.created_at)}</div>
                    <div className="text-xs text-gray-400">Ngày tạo</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-gray-400 hover:text-blue-600" 
                        title="Xem lịch sử giao dịch"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-green-600" 
                        title="Tạo Bill mới"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-gray-600" 
                        title="Sửa thông tin"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-red-600" 
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}