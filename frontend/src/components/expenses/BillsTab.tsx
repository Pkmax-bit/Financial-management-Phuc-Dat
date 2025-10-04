'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  DollarSign,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface Bill {
  id: string
  bill_number: string
  vendor_id: string
  vendor_name: string
  amount: number
  currency: string
  bill_date: string
  due_date: string
  status: 'pending' | 'approved' | 'paid' | 'overdue'
  description?: string
  created_at: string
  updated_at: string
}

interface BillsTabProps {
  searchTerm: string
  onCreateBill: () => void
}

export default function BillsTab({ searchTerm, onCreateBill }: BillsTabProps) {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for now - replace with actual API call
      const mockBills: Bill[] = [
        {
          id: '1',
          bill_number: 'BILL-20241201-001',
          vendor_id: 'vendor-001',
          vendor_name: 'Công ty ABC',
          amount: 1000000,
          currency: 'VND',
          bill_date: '2024-12-01',
          due_date: '2024-12-31',
          status: 'pending',
          description: 'Hóa đơn dịch vụ tư vấn',
          created_at: '2024-12-01T09:00:00Z',
          updated_at: '2024-12-01T09:00:00Z'
        },
        {
          id: '2',
          bill_number: 'BILL-20241201-002',
          vendor_id: 'vendor-002',
          vendor_name: 'Công ty XYZ',
          amount: 2000000,
          currency: 'VND',
          bill_date: '2024-12-01',
          due_date: '2024-12-15',
          status: 'paid',
          description: 'Hóa đơn dịch vụ marketing',
          created_at: '2024-12-01T10:00:00Z',
          updated_at: '2024-12-01T10:00:00Z'
        }
      ]
      
      setBills(mockBills)
    } catch (error) {
      console.error('Error fetching bills:', error)
      setError('Không thể tải danh sách hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán'
      case 'pending': return 'Chờ duyệt'
      case 'approved': return 'Đã duyệt'
      case 'overdue': return 'Quá hạn'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'approved': return <DollarSign className="h-4 w-4" />
      case 'overdue': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bill.description && bill.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải hóa đơn...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchBills}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có hóa đơn nào</h3>
          <p className="text-gray-600 mb-4">Bắt đầu bằng cách tạo hóa đơn đầu tiên</p>
          <button
            onClick={onCreateBill}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo hóa đơn đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số hóa đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhà cung cấp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày hóa đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hạn thanh toán
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
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {bill.bill_number}
                    </div>
                    {bill.description && (
                      <div className="text-sm text-gray-500">
                        {bill.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {bill.vendor_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(bill.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {bill.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.bill_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.due_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {getStatusIcon(bill.status)}
                      <span className="ml-1">{getStatusText(bill.status)}</span>
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