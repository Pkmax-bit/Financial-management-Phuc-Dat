'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Receipt, 
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
  User,
  Building2,
  CreditCard,
  Banknote,
  FileCheck,
  Paperclip,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { expensesApi } from '@/lib/api'
import CreateExpenseSidebar from './CreateExpenseSidebar'

interface Expense {
  id: string
  expense_code: string
  employee_id: string
  project_id?: string
  category: 'travel' | 'meals' | 'accommodation' | 'transportation' | 'supplies' | 'equipment' | 'training' | 'other'
  description: string
  amount: number
  currency: string
  expense_date: string
  receipt_url?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  approved_by?: string
  approved_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface ExpensesTabProps {
  searchTerm: string
  onCreateExpense: () => void
  shouldOpenCreateModal?: boolean // Prop to control modal opening from parent
}

export default function ExpensesTab({ searchTerm, onCreateExpense, shouldOpenCreateModal }: ExpensesTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (shouldOpenCreateModal) {
      setShowCreateModal(true)
    }
  }, [shouldOpenCreateModal])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        // User is authenticated, proceed to fetch expenses
        fetchExpenses()
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const data = await expensesApi.getExpenses()
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveExpense = async (expenseId: string) => {
    try {
      await expensesApi.approveExpense(expenseId)
      fetchExpenses() // Refresh list
    } catch (error) {
      console.error('Error approving expense:', error)
    }
  }

  const rejectExpense = async (expenseId: string) => {
    try {
      await expensesApi.rejectExpense(expenseId)
      fetchExpenses() // Refresh list
    } catch (error) {
      console.error('Error rejecting expense:', error)
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
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt'
      case 'approved': return 'Đã duyệt'
      case 'rejected': return 'Từ chối'
      case 'paid': return 'Đã thanh toán'
      default: return status
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'office_supplies': return 'Văn phòng phẩm'
      case 'travel': return 'Du lịch'
      case 'meals': return 'Ăn uống'
      case 'equipment': return 'Thiết bị'
      case 'software': return 'Phần mềm'
      case 'marketing': return 'Marketing'
      case 'rent': return 'Thuê mặt bằng'
      case 'utilities': return 'Điện nước'
      case 'insurance': return 'Bảo hiểm'
      case 'legal': return 'Pháp lý'
      case 'accounting': return 'Kế toán'
      case 'advertising': return 'Quảng cáo'
      case 'fuel': return 'Xăng dầu'
      case 'maintenance': return 'Bảo trì'
      case 'training': return 'Đào tạo'
      case 'other': return 'Khác'
      default: return category
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />
      case 'debit_card': return <CreditCard className="h-4 w-4" />
      case 'credit_card': return <CreditCard className="h-4 w-4" />
      case 'check': return <FileCheck className="h-4 w-4" />
      case 'bank_transfer': return <Building2 className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt'
      case 'debit_card': return 'Thẻ ghi nợ'
      case 'credit_card': return 'Thẻ tín dụng'
      case 'check': return 'Séc'
      case 'bank_transfer': return 'Chuyển khoản'
      default: return method
    }
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'expense': return 'Chi phí'
      case 'check': return 'Séc'
      case 'credit_card_credit': return 'Hoàn tiền thẻ'
      default: return type
    }
  }

  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.expense_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || expense.status === filter
    
    return matchesSearch && matchesFilter
  })

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Lịch sử Chi tiêu</h3>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">Tất cả giao dịch</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="paid">Đã thanh toán</option>
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            <Upload className="w-4 h-4 mr-1" />
            Import từ Bank
          </button>
          <button 
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            Xuất Excel
          </button>
          <button 
            onClick={onCreateExpense}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ghi nhận Chi phí
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người nhận / Mô tả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phương thức
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chứng từ
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
            ) : filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Không tìm thấy chi phí nào
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{formatDate(expense.expense_date)}</div>
                    <div className="text-xs text-gray-500">
                      Expense
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-sm text-gray-600 mt-1">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>
                      )}
                      {expense.notes && (
                        <div className="text-xs text-gray-500 mt-1">Ghi chú: {expense.notes}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{getCategoryText(expense.category)}</div>
                    <div className="flex items-center mt-1 space-x-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {expense.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span>{expense.currency}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                      {getStatusText(expense.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      {expense.receipt_url ? (
                        <div className="flex items-center text-green-600">
                          <Paperclip className="h-4 w-4 mr-1" />
                          <span className="text-xs">Có</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-400">
                          <Paperclip className="h-4 w-4 mr-1" />
                          <span className="text-xs">Chưa có</span>
                        </div>
                      )}
                    </div>
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
                      {!expense.receipt_url && (
                        <button 
                          className="text-gray-400 hover:text-blue-600" 
                          title="Đính kèm chứng từ"
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                      )}
                      {expense.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => approveExpense(expense.id)}
                            className="text-gray-400 hover:text-green-600" 
                            title="Duyệt"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => rejectExpense(expense.id)}
                            className="text-gray-400 hover:text-red-600" 
                            title="Từ chối"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
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

      {/* Create Expense Sidebar */}
      <CreateExpenseSidebar
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchExpenses()
          setShowCreateModal(false)
        }}
      />
    </div>
  )
}