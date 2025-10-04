'use client'

import { useState, useEffect } from 'react'
import { 
  Receipt, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  DollarSign,
  Calendar,
  User,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import CreateExpenseSidebar from './CreateExpenseSidebar'

interface Expense {
  id: string
  expense_code: string
  employee_id: string
  project_id?: string
  category: string
  description: string
  amount: number
  currency: string
  expense_date: string
  receipt_url?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  notes?: string
  created_at: string
  updated_at: string
}

interface ExpensesTabProps {
  searchTerm: string
  onCreateExpense: () => void
  shouldOpenCreateModal: boolean
}

export default function ExpensesTab({ searchTerm, onCreateExpense, shouldOpenCreateModal }: ExpensesTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateSidebar, setShowCreateSidebar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExpenses()
  }, [])

  useEffect(() => {
    if (shouldOpenCreateModal) {
      setShowCreateSidebar(true)
    }
  }, [shouldOpenCreateModal])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for now - replace with actual API call
      const mockExpenses: Expense[] = [
        {
          id: '1',
          expense_code: 'EXP-20241201-001',
          employee_id: 'emp-001',
          project_id: 'proj-001',
          category: 'travel',
          description: 'Chi phí đi lại công tác',
          amount: 500000,
          currency: 'VND',
          expense_date: '2024-12-01',
          receipt_url: 'https://example.com/receipt1.pdf',
          status: 'pending',
          notes: 'Đi công tác Hà Nội',
          created_at: '2024-12-01T09:00:00Z',
          updated_at: '2024-12-01T09:00:00Z'
        },
        {
          id: '2',
          expense_code: 'EXP-20241201-002',
          employee_id: 'emp-002',
          project_id: 'proj-002',
          category: 'meals',
          description: 'Chi phí ăn uống',
          amount: 200000,
          currency: 'VND',
          expense_date: '2024-12-01',
          status: 'approved',
          notes: 'Tiệc khách hàng',
          created_at: '2024-12-01T10:00:00Z',
          updated_at: '2024-12-01T10:00:00Z'
        }
      ]
      
      setExpenses(mockExpenses)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setError('Không thể tải danh sách chi phí')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt'
      case 'pending': return 'Chờ duyệt'
      case 'rejected': return 'Từ chối'
      case 'paid': return 'Đã thanh toán'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'paid': return <DollarSign className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.expense_code.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* Create Expense Sidebar */}
      <CreateExpenseSidebar
        isOpen={showCreateSidebar}
        onClose={() => setShowCreateSidebar(false)}
        onSuccess={() => {
          fetchExpenses()
          setShowCreateSidebar(false)
        }}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải chi phí...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchExpenses}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có chi phí nào</h3>
          <p className="text-gray-600 mb-4">Bắt đầu bằng cách tạo chi phí đầu tiên</p>
          <button
            onClick={() => setShowCreateSidebar(true)}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo chi phí đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã chi phí
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
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
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {expense.expense_code}
                    </div>
                    <div className="text-sm text-gray-500">
                      {expense.category}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {expense.description}
                    </div>
                    {expense.notes && (
                      <div className="text-sm text-gray-500">
                        {expense.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {expense.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.expense_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                      {getStatusIcon(expense.status)}
                      <span className="ml-1">{getStatusText(expense.status)}</span>
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