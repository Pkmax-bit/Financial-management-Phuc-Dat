'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Calendar, DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProjectExpense {
  id: string
  expense_code?: string
  description: string
  amount: number
  currency: string
  expense_date: string
  status: string
  notes?: string
  receipt_url?: string
  project_id: string
  customer_id?: string
  employee_id?: string
  department_id?: string
  created_at: string
  updated_at: string
}

interface ProjectExpensesProps {
  projectId: string
  projectName: string
}

const statusConfig = {
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  paid: { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-800', icon: CreditCard }
}

export default function ProjectExpenses({ projectId, projectName }: ProjectExpensesProps) {
  const [expenses, setExpenses] = useState<ProjectExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'planned' | 'actual'>('all')

  useEffect(() => {
    fetchExpenses()
  }, [projectId])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(`/api/project-expenses?project_id=${projectId}`, {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setExpenses(data || [])
      } else if (response.status === 403) {
        setError('Bạn không có quyền xem dữ liệu chi phí')
      } else {
        setError('Không thể tải dữ liệu chi phí')
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setError('Lỗi khi tải dữ liệu chi phí')
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const filteredExpenses = expenses.filter(expense => {
    if (selectedPeriod === 'planned') {
      return expense.status === 'planned'
    } else if (selectedPeriod === 'actual') {
      return expense.status !== 'planned'
    }
    return true
  })

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const approvedAmount = filteredExpenses
    .filter(expense => expense.status === 'approved' || expense.status === 'paid')
    .reduce((sum, expense) => sum + expense.amount, 0)
  const pendingAmount = filteredExpenses
    .filter(expense => expense.status === 'pending')
    .reduce((sum, expense) => sum + expense.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Chưa có chi phí nào cho dự án này</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Tổng chi phí</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-sm text-gray-600">{filteredExpenses.length} chi phí</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Đã duyệt</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(approvedAmount)}
          </p>
          <p className="text-sm text-gray-600">
            {filteredExpenses.filter(exp => exp.status === 'approved' || exp.status === 'paid').length} chi phí
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Chờ duyệt</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(pendingAmount)}
          </p>
          <p className="text-sm text-gray-600">
            {filteredExpenses.filter(exp => exp.status === 'pending').length} chi phí
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex space-x-1">
          {[
            { id: 'all', label: 'Tất cả', count: expenses.length },
            { id: 'planned', label: 'Kế hoạch', count: expenses.filter(exp => exp.status === 'planned').length },
            { id: 'actual', label: 'Thực tế', count: expenses.filter(exp => exp.status !== 'planned').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedPeriod(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách chi phí</h3>
        </div>
        <div className="divide-y">
          {filteredExpenses.map((expense) => {
            const statusInfo = statusConfig[expense.status as keyof typeof statusConfig] || statusConfig.pending
            const StatusIcon = statusInfo.icon

            return (
              <div key={expense.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {expense.expense_code ? `#${expense.expense_code}` : `Chi phí #${expense.id.slice(-8)}`}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{expense.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Ngày: {formatDate(expense.expense_date)}
                      </span>
                      {expense.employee_id && (
                        <span className="text-gray-500">Nhân viên: {expense.employee_id}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-sm text-gray-500">{expense.currency}</p>
                  </div>
                </div>

                {expense.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Ghi chú:</span> {expense.notes}
                    </p>
                  </div>
                )}

                {expense.receipt_url && (
                  <div className="mt-4">
                    <a
                      href={expense.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <CreditCard className="h-4 w-4" />
                      Xem đơn hàng
                    </a>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <span>Tạo: {formatDate(expense.created_at)}</span>
                  {expense.updated_at !== expense.created_at && (
                    <span>• Cập nhật: {formatDate(expense.updated_at)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
