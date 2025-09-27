'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Clock,
  Building2,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { billsApi } from '@/lib/api'

interface Bill {
  id: string
  bill_number: string
  vendor_id: string
  vendor_name?: string
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  currency: string
  status: 'draft' | 'sent' | 'received' | 'approved' | 'paid' | 'overdue' | 'cancelled'
  items: unknown[]
  notes?: string
  payment_terms?: string
  received_at?: string
  approved_at?: string
  paid_at?: string
  created_by: string
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
  const [filter, setFilter] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        // User is authenticated, proceed to fetch bills
        fetchBills()
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    }
  }

  const fetchBills = async () => {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const data = await billsApi.getBills()
      setBills(data || [])
    } catch (error) {
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveBill = async (billId: string) => {
    try {
      await billsApi.approveBill(billId)
      fetchBills() // Refresh list
    } catch (error) {
      console.error('Error approving bill:', error)
    }
  }

  const payBill = async (billId: string) => {
    try {
      await billsApi.payBill(billId)
      fetchBills() // Refresh list
    } catch (error) {
      console.error('Error paying bill:', error)
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
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'received': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Nháp'
      case 'sent': return 'Đã gửi'
      case 'received': return 'Đã nhận'
      case 'approved': return 'Đã duyệt'
      case 'paid': return 'Đã thanh toán'
      case 'overdue': return 'Quá hạn'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  const isOverdue = (bill: Bill) => {
    if (bill.status === 'paid' || bill.status === 'cancelled') return false
    return new Date(bill.due_date) < new Date()
  }

  // Filter bills based on search term
  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || bill.status === filter
    
    return matchesSearch && matchesFilter
  })

  return (
    <div>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Chưa thanh toán</p>
              <p className="text-2xl font-bold text-blue-900">
                {filteredBills.filter(b => ['received', 'approved'].includes(b.status)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Quá hạn</p>
              <p className="text-2xl font-bold text-red-900">
                {filteredBills.filter(b => isOverdue(b)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Đã thanh toán</p>
              <p className="text-2xl font-bold text-green-900">
                {filteredBills.filter(b => b.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Tổng phải trả</p>
              <p className="text-lg font-bold text-purple-900">
                {formatCurrency(
                  filteredBills
                    .filter(b => ['received', 'approved', 'overdue'].includes(b.status))
                    .reduce((sum, b) => sum + b.total_amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Công nợ Phải trả (Bills)</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="received">Chưa thanh toán (Open)</option>
            <option value="overdue">Quá hạn (Overdue)</option>
            <option value="paid">Đã thanh toán (Paid)</option>
            <option value="draft">Nháp</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Thanh toán hàng loạt
          </button>
          <button 
            onClick={onCreateBill}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nhập Bill mới
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="overflow-x-auto bg-white rounded-lg border">
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
                Ngày phát hành
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hạn thanh toán
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
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
            ) : filteredBills.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Không tìm thấy hóa đơn nào
                </td>
              </tr>
            ) : (
              filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      {bill.bill_number || `BILL-${bill.id.slice(-12)}`}
                      {isOverdue(bill) && (
                        <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                      {bill.vendor_name || 'Chưa có tên'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(bill.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(bill.issue_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className={`${isOverdue(bill) ? 'text-red-600 font-medium' : ''}`}>
                      {formatDate(bill.due_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {getStatusText(bill.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-gray-400 hover:text-gray-600" 
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-gray-600" 
                        title="Sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {bill.status === 'received' && (
                        <button 
                          onClick={() => approveBill(bill.id)}
                          className="text-gray-400 hover:text-green-600" 
                          title="Duyệt thanh toán"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {(bill.status === 'approved' || bill.status === 'overdue') && (
                        <button 
                          onClick={() => payBill(bill.id)}
                          className="text-gray-400 hover:text-blue-600" 
                          title="Thanh toán"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                      )}
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