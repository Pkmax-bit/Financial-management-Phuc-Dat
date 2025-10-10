'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Target,
  BarChart3
} from 'lucide-react'
import CreateProjectExpenseDialog from './CreateProjectExpenseDialog'
import { supabase } from '@/lib/supabase'

interface ProjectExpense {
  id: string
  project_id: string
  project_name: string
  project_code: string
  planned_amount: number
  actual_amount: number
  variance: number
  variance_percentage: number
  category: 'planned' | 'actual'
  description: string
  expense_date: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

interface ProjectExpensesTabProps {
  searchTerm: string
  onCreateExpense: () => void
}

export default function ProjectExpensesTab({ searchTerm, onCreateExpense }: ProjectExpensesTabProps) {
  const [expenses, setExpenses] = useState<ProjectExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'planned' | 'actual'>('all')

// Filter expenses based on view mode
const getFilteredExpenses = () => {
  switch (viewMode) {
    case 'planned':
      return expenses.filter(e => e.category === 'planned')
    case 'actual':
      return expenses.filter(e => e.category === 'actual')
    default:
      return expenses
  }
}

// CRUD permissions
const canEdit = (expense: ProjectExpense) => {
  return expense.category === 'planned' && expense.status !== 'approved'
}

const canDelete = (expense: ProjectExpense) => {
  return expense.category === 'planned' && expense.status !== 'approved'
}

const handleEditExpense = (expense: ProjectExpense) => {
  if (!canEdit(expense)) return
  // Open edit dialog logic here
}

const handleDeleteExpense = async (expenseId: string) => {
  const expense = expenses.find(e => e.id === expenseId)
  if (!expense || !canDelete(expense)) return
  
  if (window.confirm('Bạn có chắc chắn muốn xóa chi phí này?')) {
    try {
      const { error } = await supabase
        .from('project_expenses_quote')
        .delete()
        .eq('id', expenseId)
      
      if (error) throw error
      
      // Refresh list after delete
      fetchProjectExpenses()
    } catch (e) {
      console.error('Error deleting expense:', e)
      setError('Không thể xóa chi phí')
    }
  }
}
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Define projectsMap at the top of the component after fetching data
  const [projectsMap, setProjectsMap] = useState(new Map())

  useEffect(() => {
    fetchProjectExpenses()
  }, [])


  const fetchProjectExpenses = async () => {
    try {
      setLoading(true)
      setError(null)

      const [quotesRes, actualRes, projectsRes] = await Promise.all([
        supabase
          .from('project_expenses_quote')
          .select('id, project_id, expense_code, description, amount, currency, expense_date, status, created_at, updated_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('project_expenses')
          .select('id, project_id, expense_code, description, amount, currency, expense_date, status, created_at, updated_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select('id, name, project_code'),
      ])

      if (quotesRes.error) throw quotesRes.error
      if (actualRes.error) throw actualRes.error
      if (projectsRes.error) throw projectsRes.error

      // After fetching projectsRes
      setProjectsMap(new Map(projectsRes.data.map(p => [p.id, p])))

      const expensesMapped = [
        ...quotesRes.data.map(e => ({
          id: e.id,
          project_id: e.project_id,
          project_name: projectsMap.get(e.project_id)?.name || '',
          project_code: projectsMap.get(e.project_id)?.project_code || '',
          planned_amount: e.amount || 0,
          actual_amount: 0,
          category: 'planned',
          description: e.description,
          expense_date: e.expense_date,
          status: e.status,
          created_at: e.created_at,
          updated_at: e.updated_at,
        })),
        ...actualRes.data.map(e => ({
          id: e.id,
          project_id: e.project_id,
          project_name: projectsMap.get(e.project_id)?.name || '',
          project_code: projectsMap.get(e.project_id)?.project_code || '',
          planned_amount: 0,
          actual_amount: e.amount || 0,
          category: 'actual',
          description: e.description,
          expense_date: e.expense_date,
          status: e.status,
          created_at: e.created_at,
          updated_at: e.updated_at,
        })),
      ]

      setExpenses(expensesMapped)
    } catch (error) {
      console.error('Error fetching project expenses:', error)
      setError('Không thể tải chi phí dự án')
    } finally {
      setLoading(false)
    }
  }

  // Calculate group totals and variance for comparison
  const calculateComparison = (expenses: ProjectExpense[]) => {
    const comparison = expenses.reduce((acc, exp) => {
      const key = exp.project_id
      if (!acc[key]) {
        acc[key] = { planned: 0, actual: 0 }
      }
      acc[key][exp.category] += exp.category === 'planned' ? exp.planned_amount : exp.actual_amount
      return acc
    }, {})
    return Object.entries(comparison).map(([projectId, { planned, actual }]) => ({
      projectId,
      planned,
      actual,
      variance: actual - planned,
      variance_percentage: planned ? ((actual - planned) / planned) * 100 : 0
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt'
      case 'pending': return 'Chờ duyệt'
      case 'rejected': return 'Từ chối'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600'
    if (variance < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4" />
    if (variance < 0) return <TrendingDown className="h-4 w-4" />
    return <BarChart3 className="h-4 w-4" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const handleApprove = async (quoteId: string) => {
    try {
      setLoading(true)
      // Add auth header using Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/project-expenses/quotes/${quoteId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || err.message || 'Duyệt thất bại')
      }
      await fetchProjectExpenses()
    } catch (e) {
      console.error('Approve quote failed:', e)
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpense = () => {
    setShowCreateModal(true)
    onCreateExpense()
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
  }

  const handleCreateSuccess = () => {
    fetchProjectExpenses()
    setShowCreateModal(false)
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesView = viewMode === 'all' || expense.category === viewMode
    
    return matchesSearch && matchesView
  })

  // Calculate summary statistics
  const totalPlanned = expenses.filter(e => e.category === 'planned').reduce((sum, e) => sum + e.planned_amount, 0)
  const totalActual = expenses.filter(e => e.category === 'actual').reduce((sum, e) => sum + e.actual_amount, 0)
  const totalVariance = totalActual - totalPlanned
  const variancePercentage = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0

  const formatProjects = (expenses: ProjectExpense[]) => {
    const projectTotals = expenses.reduce((acc, expense) => {
      const { project_id, planned_amount, actual_amount } = expense
      if (!acc[project_id]) {
        acc[project_id] = { planned: 0, actual: 0 }
      }
      acc[project_id].planned += planned_amount
      acc[project_id].actual += actual_amount
      return acc
    }, {})

    return Object.keys(projectTotals).map(project_id => {
      const { planned, actual } = projectTotals[project_id]
      return {
        project_id,
        planned,
        actual,
        variance: actual - planned,
        variance_percentage: planned ? ((actual - planned) / planned) * 100 : 0
      }
    })
  }

  const projectDisplay = formatProjects(expenses)

return (
  <div className="space-y-6">
    {/* View Mode Tabs */}
    <div className="flex space-x-2">
      <button
        onClick={() => setViewMode('all')}
        className={`px-4 py-2 rounded-lg ${
          viewMode === 'all' 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        Tất cả
      </button>
      <button
        onClick={() => setViewMode('planned')}
        className={`px-4 py-2 rounded-lg ${
          viewMode === 'planned'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        Kế hoạch
      </button>
      <button
        onClick={() => setViewMode('actual')}
        className={`px-4 py-2 rounded-lg ${
          viewMode === 'actual'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        Thực tế
      </button>
    </div>

    {/* Add New Button - Only show in Planned tab */}
    {viewMode === 'planned' && (
      <button
        onClick={() => setShowCreateDialog(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
      >
        <Plus className="w-4 h-4 mr-2" />
        Thêm chi phí kế hoạch
      </button>
    )}

    {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Kế hoạch</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalPlanned)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Thực tế</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalActual)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Chênh lệch</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalVariance)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-500">
              {getVarianceIcon(totalVariance)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tỷ lệ %</p>
              <p className="text-lg font-bold text-gray-900">
                {variancePercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setViewMode('all')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            viewMode === 'all' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setViewMode('planned')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            viewMode === 'planned' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Kế hoạch
        </button>
        <button
          onClick={() => setViewMode('actual')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            viewMode === 'actual' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Thực tế
        </button>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải chi phí dự án...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProjectExpenses}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dự án
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kế hoạch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thực tế
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chênh lệch
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
              {projectDisplay.map((project) => (
                <tr key={project.project_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {projectsMap.get(project.project_id)?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {projectsMap.get(project.project_id)?.project_code || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Cộng dồn
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(project.planned)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(project.actual)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm ${getVarianceColor(project.variance)}`}>
                      {getVarianceIcon(project.variance)}
                      <span className="ml-1">
                        {formatCurrency(project.variance)} ({project.variance_percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.variance_percentage > 0 ? 'rejected' : 'approved')} ${getStatusColor(project.variance_percentage < 0 ? 'approved' : 'pending')}`}>
                      {project.variance_percentage > 0 ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      <span className="ml-1">{project.variance_percentage > 0 ? 'Từ chối' : 'Đã duyệt'}</span>
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
                      {project.variance_percentage > 0 && (
                        <button
                          onClick={() => handleApprove(project.project_id)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Duyệt thành thực tế"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
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

      {/* Create Project Expense Dialog */}
      <CreateProjectExpenseDialog
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
