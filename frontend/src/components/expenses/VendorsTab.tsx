'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface Vendor {
  id: string
  vendor_code: string
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  is_active: boolean
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for now - replace with actual API call
      const mockVendors: Vendor[] = [
        {
          id: '1',
          vendor_code: 'VENDOR-001',
          name: 'Công ty ABC',
          email: 'contact@abc.com',
          phone: '0123456789',
          address: '123 Đường ABC, Quận 1, TP.HCM',
          contact_person: 'Nguyễn Văn A',
          is_active: true,
          created_at: '2024-12-01T09:00:00Z',
          updated_at: '2024-12-01T09:00:00Z'
        },
        {
          id: '2',
          vendor_code: 'VENDOR-002',
          name: 'Công ty XYZ',
          email: 'info@xyz.com',
          phone: '0987654321',
          address: '456 Đường XYZ, Quận 2, TP.HCM',
          contact_person: 'Trần Thị B',
          is_active: false,
          created_at: '2024-12-01T10:00:00Z',
          updated_at: '2024-12-01T10:00:00Z'
        }
      ]
      
      setVendors(mockVendors)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      setError('Không thể tải danh sách nhà cung cấp')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Hoạt động' : 'Không hoạt động'
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />
  }

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.vendor_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (vendor.phone && vendor.phone.includes(searchTerm)) ||
                         (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải nhà cung cấp...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchVendors}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có nhà cung cấp nào</h3>
          <p className="text-gray-600 mb-4">Bắt đầu bằng cách thêm nhà cung cấp đầu tiên</p>
          <button
            onClick={onCreateVendor}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm nhà cung cấp đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã NCC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên nhà cung cấp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vendor.vendor_code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {vendor.name}
                    </div>
                    {vendor.contact_person && (
                      <div className="text-sm text-gray-500">
                        Liên hệ: {vendor.contact_person}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {vendor.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          {vendor.email}
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {vendor.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {vendor.address && (
                      <div className="text-sm text-gray-500">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{vendor.address}</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.is_active)}`}>
                      {getStatusIcon(vendor.is_active)}
                      <span className="ml-1">{getStatusText(vendor.is_active)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
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
      )}
    </div>
  )
}