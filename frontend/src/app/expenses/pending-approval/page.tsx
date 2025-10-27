'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Calendar, 
  User, 
  Building2,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  FileText,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PendingExpense {
  id: string
  project_id: string
  project_name: string
  description: string
  amount: number
  currency: string
  expense_date: string
  status: 'pending'
  category: 'planned' | 'actual'
  created_at: string
  created_by: string
  created_by_name: string
  expense_object_name: string
  role: string
}

export default function PendingApprovalPage() {
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'planned' | 'actual'>('all')
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const router = useRouter()

  // Load pending expenses
  const loadPendingExpenses = async () => {
    try {
      setLoading(true)
      setError('')

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Bạn cần đăng nhập để xem chi phí chờ duyệt')
        return
      }

      // Load pending planned expenses (quotes)
      const { data: quotes, error: quotesError } = await supabase
        .from('project_expenses_quote')
        .select(`
          id,
          project_id,
          description,
          amount,
          currency,
          expense_date,
          status,
          created_at,
          created_by,
          expense_object_id,
          role,
          projects!inner(name),
          users!inner(full_name),
          expense_objects!inner(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (quotesError) {
        console.error('Error loading quotes:', quotesError)
        throw quotesError
      }

      // Load pending actual expenses
      const { data: actualExpenses, error: actualError } = await supabase
        .from('project_expenses')
        .select(`
          id,
          project_id,
          description,
          amount,
          currency,
          expense_date,
          status,
          created_at,
          created_by,
          expense_object_id,
          role,
          projects!inner(name),
          users!inner(full_name),
          expense_objects!inner(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (actualError) {
        console.error('Error loading actual expenses:', actualError)
        throw actualError
      }

      // Transform data
      const transformedQuotes = (quotes || []).map(quote => ({
        id: quote.id,
        project_id: quote.project_id,
        project_name: quote.projects?.name || 'N/A',
        description: quote.description,
        amount: quote.amount || 0,
        currency: quote.currency || 'VND',
        expense_date: quote.expense_date,
        status: 'pending' as const,
        category: 'planned' as const,
        created_at: quote.created_at,
        created_by: quote.created_by,
        created_by_name: quote.users?.full_name || 'N/A',
        expense_object_name: quote.expense_objects?.name || 'N/A',
        role: quote.role || 'N/A'
      }))

      const transformedActual = (actualExpenses || []).map(expense => ({
        id: expense.id,
        project_id: expense.project_id,
        project_name: expense.projects?.name || 'N/A',
        description: expense.description,
        amount: expense.amount || 0,
        currency: expense.currency || 'VND',
        expense_date: expense.expense_date,
        status: 'pending' as const,
        category: 'actual' as const,
        created_at: expense.created_at,
        created_by: expense.created_by,
        created_by_name: expense.users?.full_name || 'N/A',
        expense_object_name: expense.expense_objects?.name || 'N/A',
        role: expense.role || 'N/A'
      }))

      setPendingExpenses([...transformedQuotes, ...transformedActual])

    } catch (err) {
      console.error('Error loading pending expenses:', err)
      setError('Không thể tải danh sách chi phí chờ duyệt')
    } finally {
      setLoading(false)
    }
  }

  // Approve expense
  const handleApprove = async (expenseId: string, category: 'planned' | 'actual') => {
    try {
      setApproving(expenseId)

      if (category === 'planned') {
        // Approve planned expense (quote)
        const { error } = await supabase
          .from('project_expenses_quote')
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseId)

        if (error) throw error
      } else {
        // Approve actual expense
        const { error } = await supabase
          .from('project_expenses')
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseId)

        if (error) throw error
      }

      // Reload data
      await loadPendingExpenses()
      alert('Duyệt chi phí thành công!')

    } catch (err) {
      console.error('Error approving expense:', err)
      alert('Không thể duyệt chi phí. Vui lòng thử lại.')
    } finally {
      setApproving(null)
    }
  }

  // Reject expense
  const handleReject = async (expenseId: string, category: 'planned' | 'actual') => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối chi phí này?')) return

    try {
      setRejecting(expenseId)

      if (category === 'planned') {
        // Reject planned expense (quote)
        const { error } = await supabase
          .from('project_expenses_quote')
          .update({ 
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseId)

        if (error) throw error
      } else {
        // Reject actual expense
        const { error } = await supabase
          .from('project_expenses')
          .update({ 
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseId)

        if (error) throw error
      }

      // Reload data
      await loadPendingExpenses()
      alert('Từ chối chi phí thành công!')

    } catch (err) {
      console.error('Error rejecting expense:', err)
      alert('Không thể từ chối chi phí. Vui lòng thử lại.')
    } finally {
      setRejecting(null)
    }
  }

  // Filter expenses
  const filteredExpenses = pendingExpenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.created_by_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || expense.category === filterStatus
    
    return matchesSearch && matchesFilter
  })

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const plannedCount = filteredExpenses.filter(e => e.category === 'planned').length
  const actualCount = filteredExpenses.filter(e => e.category === 'actual').length

  useEffect(() => {
    loadPendingExpenses()
  }, [])

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang tải danh sách chi phí chờ duyệt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Clock className="h-8 w-8 mr-3 text-yellow-500" />
                Chi phí chờ duyệt
              </h1>
              <p className="mt-2 text-gray-600">
                Duyệt và quản lý các khoản chi phí đang chờ phê duyệt
              </p>
            </div>
            <button
              onClick={loadPendingExpenses}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng chi phí chờ duyệt</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredExpenses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng giá trị</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Chi phí kế hoạch</p>
                <p className="text-2xl font-semibold text-gray-900">{plannedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Chi phí thực tế</p>
                <p className="text-2xl font-semibold text-gray-900">{actualCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo mô tả, dự án, người tạo..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại chi phí
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="planned">Chi phí kế hoạch</option>
                <option value="actual">Chi phí thực tế</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có chi phí chờ duyệt</h3>
              <p className="text-gray-500">Tất cả chi phí đã được duyệt hoặc chưa có chi phí nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chi phí
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dự án
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {expense.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {expense.expense_object_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{expense.project_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(expense.amount, expense.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{formatDate(expense.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{expense.created_by_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          expense.category === 'planned' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {expense.category === 'planned' ? 'Kế hoạch' : 'Thực tế'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleApprove(expense.id, expense.category)}
                            disabled={approving === expense.id}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approving === expense.id ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(expense.id, expense.category)}
                            disabled={rejecting === expense.id}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rejecting === expense.id ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            Từ chối
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
      </div>
    </div>
  )
}
