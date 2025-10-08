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
  AlertTriangle,
  Tag,
  Minus
} from 'lucide-react'
import CreateExpenseSidebar from './CreateExpenseSidebar'
import CreateExpenseDialog from './CreateExpenseDialog'
import CreateExpenseCategoryDialog from './CreateExpenseCategoryDialog'
import { supabase } from '@/lib/supabase'

interface Expense {
  id: string
  expense_code: string
  employee_id: string
  description: string
  amount: number
  currency: string
  expense_date: string
  receipt_url?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  notes?: string
  id_parent?: string
  category_id?: string
  created_at: string
  updated_at: string
  employees?: {
    id: string
    user_id?: string
    first_name?: string
    last_name?: string
    email?: string
    users?: {
      full_name: string
      email: string
    }
  }
  expense_categories?: {
    id: string
    name: string
    description: string
  }
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
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchExpenses()
  }, [])

  useEffect(() => {
    if (shouldOpenCreateModal) {
      setShowCreateDialog(true)
    }
  }, [shouldOpenCreateModal])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          expense_code,
          employee_id,
          description,
          amount,
          currency,
          expense_date,
          receipt_url,
          status,
          notes,
          id_parent,
          category_id,
          created_at,
          updated_at,
          employees!expenses_employee_id_fkey (
            id,
            user_id,
            first_name,
            last_name,
            email,
            users!employees_user_id_fkey (
              full_name,
              email
            )
          ),
          expense_categories!expenses_category_id_fkey (
            id,
            name,
            description
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error fetching expenses:', error)
        throw error
      }
      
      console.log('Expenses fetched successfully:', data?.length || 0)
      setExpenses(data || [])
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
    const empName = (expense.employees?.users?.full_name || `${expense.employees?.first_name || ''} ${expense.employees?.last_name || ''}`.trim()).toLowerCase()
    const catName = expense.expense_categories?.name?.toLowerCase() || ''
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.expense_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empName.includes(searchTerm.toLowerCase()) ||
                         catName.includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Build children map for hierarchy
  const childrenMap: Record<string, Expense[]> = filteredExpenses.reduce((acc, exp) => {
    const parentId = exp.id_parent || 'root'
    if (!acc[parentId]) acc[parentId] = []
    acc[parentId].push(exp)
    return acc
  }, {} as Record<string, Expense[]>)

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const hasChildren = (id: string) => {
    return (childrenMap[id] && childrenMap[id].length > 0) || false
  }

  const renderRows = (items: Expense[] = [], depth = 0): JSX.Element[] => {
    return items.flatMap((exp) => {
      const isExpanded = !!expandedIds[exp.id]
      const indentStyle = { paddingLeft: `${depth * 20}px` }
      const expandBtnClass = isExpanded
        ? "w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
        : "w-6 h-6 flex items-center justify-center rounded-full border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
      const rows: JSX.Element[] = [
        (
          <tr key={exp.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center space-x-2" style={indentStyle as any}>
                {hasChildren(exp.id) ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(exp.id)}
                    className={expandBtnClass}
                    aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                    title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                  >
                    {isExpanded ? (
                      <Minus className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="w-5 h-5" />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">{exp.expense_code}</div>
                  <div className="text-sm text-gray-500">{exp.expense_categories?.name || 'Chưa phân loại'}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900">{exp.description}</div>
              {(exp.employees?.users?.full_name || exp.employees?.first_name) && (
                <div className="text-xs text-gray-500">
                  Nhân viên: {exp.employees?.users?.full_name || `${exp.employees?.first_name || ''} ${exp.employees?.last_name || ''}`.trim()}
                </div>
              )}
              {exp.notes && (
                <div className="text-sm text-gray-500">{exp.notes}</div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{formatCurrency(exp.amount)}</div>
              <div className="text-sm text-gray-500">{exp.currency}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(exp.expense_date).toLocaleDateString('vi-VN')}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exp.status)}`}>
                {getStatusIcon(exp.status)}
                <span className="ml-1">{getStatusText(exp.status)}</span>
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-900 p-1" title="Xem chi tiết">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="text-gray-600 hover:text-gray-900 p-1" title="Chỉnh sửa">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="text-red-600 hover:text-red-900 p-1" title="Xóa">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        )
      ]

      if (isExpanded && hasChildren(exp.id)) {
        rows.push(...renderRows(childrenMap[exp.id], depth + 1))
      }

      return rows
    })
  }

  return (
    <div className="space-y-4">
      {/* Header with Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Chi phí công ty</h3>
          <p className="text-sm text-gray-600">Quản lý và theo dõi chi phí của công ty</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateCategoryDialog(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Tag className="h-4 w-4 mr-2" />
            Loại chi phí
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo chi phí
          </button>
        </div>
      </div>

      {/* Create Expense Sidebar */}
      <CreateExpenseSidebar
        isOpen={showCreateSidebar}
        onClose={() => setShowCreateSidebar(false)}
        onSuccess={() => {
          fetchExpenses()
          setShowCreateSidebar(false)
        }}
      />

      {/* Create Expense Dialog */}
      <CreateExpenseDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          fetchExpenses()
          setShowCreateDialog(false)
        }}
      />

      {/* Create Expense Category Dialog */}
      <CreateExpenseCategoryDialog
        isOpen={showCreateCategoryDialog}
        onClose={() => setShowCreateCategoryDialog(false)}
        onSuccess={() => {
          setShowCreateCategoryDialog(false)
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
              {renderRows(childrenMap['root'] || [])}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}