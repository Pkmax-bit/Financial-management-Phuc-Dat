'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  FileText, 
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PendingExpense {
  id: string
  project_name: string
  description: string
  amount: number
  currency: string
  category: 'planned' | 'actual'
  created_at: string
  created_by_name: string
}

export default function PendingApprovalWidget() {
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadPendingExpenses = async () => {
    try {
      setLoading(true)
      setError('')

      // Load pending planned expenses (quotes)
      const { data: quotes, error: quotesError } = await supabase
        .from('project_expenses_quote')
        .select(`
          id,
          description,
          amount,
          currency,
          created_at,
          created_by,
          projects!inner(name),
          users!inner(full_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

      if (quotesError) {
        console.error('Error loading quotes:', quotesError)
        throw quotesError
      }

      // Load pending actual expenses
      const { data: actualExpenses, error: actualError } = await supabase
        .from('project_expenses')
        .select(`
          id,
          description,
          amount,
          currency,
          created_at,
          created_by,
          projects!inner(name),
          users!inner(full_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

      if (actualError) {
        console.error('Error loading actual expenses:', actualError)
        throw actualError
      }

      // Transform data
      const transformedQuotes = (quotes || []).map(quote => ({
        id: quote.id,
        project_name: quote.projects?.name || 'N/A',
        description: quote.description,
        amount: quote.amount || 0,
        currency: quote.currency || 'VND',
        category: 'planned' as const,
        created_at: quote.created_at,
        created_by_name: quote.users?.full_name || 'N/A'
      }))

      const transformedActual = (actualExpenses || []).map(expense => ({
        id: expense.id,
        project_name: expense.projects?.name || 'N/A',
        description: expense.description,
        amount: expense.amount || 0,
        currency: expense.currency || 'VND',
        category: 'actual' as const,
        created_at: expense.created_at,
        created_by_name: expense.users?.full_name || 'N/A'
      }))

      setPendingExpenses([...transformedQuotes, ...transformedActual].slice(0, 5))

    } catch (err) {
      console.error('Error loading pending expenses:', err)
      setError('Không thể tải chi phí chờ duyệt')
    } finally {
      setLoading(false)
    }
  }

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

  const totalAmount = pendingExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const plannedCount = pendingExpenses.filter(e => e.category === 'planned').length
  const actualCount = pendingExpenses.filter(e => e.category === 'actual').length

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Đang tải...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-yellow-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chi phí chờ duyệt</h3>
              <p className="text-sm text-gray-500">Cần phê duyệt ngay</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/expenses/pending-approval')}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{pendingExpenses.length}</div>
            <div className="text-sm text-gray-500">Tổng số</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
            <div className="text-sm text-gray-500">Tổng giá trị</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{plannedCount}/{actualCount}</div>
            <div className="text-sm text-gray-500">Kế hoạch/Thực tế</div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="px-6 py-4">
        {pendingExpenses.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Tất cả đã duyệt!</h4>
            <p className="text-gray-500">Không có chi phí nào đang chờ duyệt.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                      expense.category === 'planned' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {expense.category === 'planned' ? 'Kế hoạch' : 'Thực tế'}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {expense.description}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="truncate">{expense.project_name}</span>
                    <span className="mx-2">•</span>
                    <span>{expense.created_by_name}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(expense.created_at)}</span>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(expense.amount, expense.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {pendingExpenses.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => router.push('/expenses/pending-approval')}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Duyệt tất cả chi phí
          </button>
        </div>
      )}
    </div>
  )
}
