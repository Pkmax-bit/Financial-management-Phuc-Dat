'use client'

import { useState, useEffect } from 'react'
import { Plus, Upload, Camera, FileText, Eye, Edit, Trash2, Filter, Search } from 'lucide-react'
import AIReceiptUpload from '@/components/expenses/AIReceiptUpload'
import { supabase } from '@/lib/supabase'

interface Expense {
  id: string
  amount: number
  description: string
  vendor: string
  cost_date: string
  status: string
  ai_generated: boolean
  ai_confidence: number
  cost_categories: {
    name: string
    type: string
  }
  projects: {
    name: string
    project_code: string
  } | null
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAIUpload, setShowAIUpload] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [user, setUser] = useState<{ full_name?: string; role?: string; email?: string; id?: string } | null>(null)

  useEffect(() => {
    fetchUser()
    fetchExpenses()
  }, [])

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: user.user_metadata?.role || 'user',
          email: user.email || '',
          id: user.id
        })
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/expenses')
      const data = await response.json()
      
      if (data.success) {
        setExpenses(data.data || [])
      } else {
        console.error('Error fetching expenses:', data.error)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExpenseCreated = (expense: any) => {
    fetchExpenses()
    setShowAIUpload(false)
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

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý chi phí</h1>
              <p className="text-sm text-gray-600">Quản lý và theo dõi chi phí dự án với AI</p>
            </div>
          </div>
          <button
            onClick={() => setShowAIUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Thêm chi phí AI
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Tổng chi phí</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  VND {expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Chờ duyệt</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {expenses.filter(e => e.status === 'pending').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Đã duyệt</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {expenses.filter(e => e.status === 'approved').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">AI Generated</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {expenses.filter(e => e.ai_generated).length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm chi phí..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="paid">Đã thanh toán</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách chi phí</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Đang tải...</span>
            </div>
          ) : filteredExpenses.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{expense.description}</h3>
                        {expense.ai_generated && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            AI Generated ({expense.ai_confidence}%)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>{expense.vendor}</span>
                        <span>{expense.cost_categories?.name}</span>
                        <span>{new Date(expense.cost_date).toLocaleDateString('vi-VN')}</span>
                        {expense.projects && (
                          <span className="text-blue-600">
                            {expense.projects.name} ({expense.projects.project_code})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          VND {expense.amount.toLocaleString()}
                        </p>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(expense.status)}`}>
                          {getStatusText(expense.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có chi phí nào</h3>
              <p className="text-gray-500 mb-4">Bắt đầu bằng cách thêm chi phí với AI</p>
              <button
                onClick={() => setShowAIUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Thêm chi phí AI
              </button>
            </div>
          )}
        </div>

        {/* AI Upload Modal */}
        {showAIUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Thêm chi phí bằng AI</h3>
                  <button
                    onClick={() => setShowAIUpload(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <AIReceiptUpload onExpenseCreated={handleExpenseCreated} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}