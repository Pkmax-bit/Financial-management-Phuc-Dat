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
  BarChart3,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText
} from 'lucide-react'
import CreateProjectExpenseDialog from './CreateProjectExpenseDialog'
import CreateExpenseObjectDialog from './CreateExpenseObjectDialog'
import ExpenseRestoreButton from './ExpenseRestoreButton'
import SnapshotStatusIndicator from './SnapshotStatusIndicator'
import { supabase } from '@/lib/supabase'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  id_parent?: string | null
  children?: ProjectExpense[]
  level?: number
  hasChildren?: boolean
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [employees, setEmployees] = useState<Map<string, string>>(new Map())

// Filter expenses based on view mode and build tree
const getFilteredExpenses = () => {
  let filtered: ProjectExpense[] = []
  
  switch (viewMode) {
    case 'planned':
      filtered = expenses.filter(e => e.category === 'planned')
      break
    case 'actual':
      filtered = expenses.filter(e => e.category === 'actual')
      break
    default:
      filtered = expenses
  }
  
  // Build tree structure and flatten for display
  const tree = buildTree(filtered)
  return flattenTree(tree)
}

// Get display data based on view mode
const getDisplayData = () => {
  if (viewMode === 'all') {
    // For 'all' view, show aggregated by project
    return projectDisplay
  } else {
    // For 'planned' or 'actual', show individual expense items
    return getFilteredExpenses()
  }
}

// CRUD permissions
const canEdit = (expense: ProjectExpense) => {
  // Planned: only pending can be edited
  // Actual: can be edited (for corrections)
  if (expense.category === 'planned') {
    return expense.status === 'pending'
  }
  // Actual expenses can be edited
  return true
}

const canDelete = (expense: ProjectExpense) => {
  // Planned: only pending can be deleted
  // Actual: can be deleted (for corrections)
  if (expense.category === 'planned') {
    return expense.status === 'pending'
  }
  // Actual expenses can be deleted
  return true
}

const canApprove = (expense: ProjectExpense) => {
  // Only planned expenses that are pending can be approved
  return expense.category === 'planned' && expense.status === 'pending'
}

const [editExpense, setEditExpense] = useState<{ id: string; category: 'planned' | 'actual' } | null>(null)

const handleEditExpense = (expense: ProjectExpense) => {
  if (!canEdit(expense)) return
  setEditExpense({ id: expense.id, category: expense.category })
  setCreateExpenseCategory(expense.category)
  setShowCreateModal(true)
}

const handleDeleteExpense = async (expenseId: string) => {
  const expense = expenses.find(e => e.id === expenseId)
  if (!expense || !canDelete(expense)) return
  
  const isPlanned = expense.category === 'planned'
  const tableName = isPlanned ? 'project_expenses_quote' : 'project_expenses'
  const confirmMessage = isPlanned 
    ? 'Bạn có chắc chắn muốn xóa chi phí kế hoạch này?' 
    : 'Bạn có chắc chắn muốn xóa chi phí thực tế này? Hành động này không thể hoàn tác!'
  
  if (window.confirm(confirmMessage)) {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', expenseId)
      
      if (error) throw error
      
      alert('Xóa chi phí thành công!')
      
      // Refresh list after delete
      fetchProjectExpenses()
    } catch (e: any) {
      console.error('Error deleting expense:', e)
      const errorMessage = e?.message || 'Không thể xóa chi phí'
      setError(errorMessage)
      alert(`Lỗi: ${errorMessage}`)
    }
  }
}

const handleApproveExpense = async (expenseId: string) => {
  const expense = expenses.find(e => e.id === expenseId)
  if (!expense || !canApprove(expense)) return
  
  if (window.confirm('Duyệt chi phí này thành chi phí thực tế?')) {
    try {
      // Get the quote data
      const { data: quoteData, error: fetchError } = await supabase
        .from('project_expenses_quote')
        .select('*')
        .eq('id', expenseId)
        .single()
      
      if (fetchError) {
        console.error('Error fetching quote:', fetchError)
        throw new Error(`Lỗi lấy dữ liệu: ${fetchError.message}`)
      }
      
      if (!quoteData) {
        throw new Error('Không tìm thấy chi phí')
      }
      
      console.log('Quote data to approve:', quoteData)
      
      // Create actual expense from quote
      const newExpense: any = {
        id: crypto.randomUUID(), // Generate new UUID for id
        project_id: quoteData.project_id,
        description: quoteData.description,
        amount: quoteData.amount,
        expense_date: quoteData.expense_date,
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Add optional fields if they exist
      if (quoteData.expense_code) newExpense.expense_code = quoteData.expense_code
      if (quoteData.currency) newExpense.currency = quoteData.currency
      if (quoteData.notes) newExpense.notes = quoteData.notes
      if (quoteData.receipt_url) newExpense.receipt_url = quoteData.receipt_url
      if (quoteData.employee_id) newExpense.employee_id = quoteData.employee_id
      if (quoteData.department_id) newExpense.department_id = quoteData.department_id
      if (quoteData.customer_id) newExpense.customer_id = quoteData.customer_id
      if (quoteData.id_parent) newExpense.id_parent = quoteData.id_parent
      
      // Copy expense object related fields from quote to actual expense
      if (quoteData.expense_object_id) {
        newExpense.expense_object_id = quoteData.expense_object_id
        console.log('✅ Copied expense_object_id:', quoteData.expense_object_id)
      }
      
      if (Array.isArray(quoteData.expense_object_columns) && quoteData.expense_object_columns.length > 0) {
        newExpense.expense_object_columns = quoteData.expense_object_columns
        console.log('✅ Copied expense_object_columns:', quoteData.expense_object_columns.length, 'columns')
      }
      
      if (Array.isArray(quoteData.invoice_items) && quoteData.invoice_items.length > 0) {
        newExpense.invoice_items = quoteData.invoice_items
        console.log('✅ Copied invoice_items:', quoteData.invoice_items.length, 'items')
      }
      
      console.log('Creating actual expense:', newExpense)
      
      const { data: insertedData, error: insertError } = await supabase
        .from('project_expenses')
        .insert(newExpense)
        .select()
      
      if (insertError) {
        console.error('Error inserting expense:', insertError)
        throw new Error(`Lỗi tạo chi phí thực tế: ${insertError.message}`)
      }
      
      console.log('Inserted expense:', insertedData)
      
      // Update quote status to approved
      const { error: updateError } = await supabase
        .from('project_expenses_quote')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseId)
      
      if (updateError) {
        console.error('Error updating quote status:', updateError)
        throw new Error(`Lỗi cập nhật trạng thái: ${updateError.message}`)
      }
      
      // Show success message
      alert('Duyệt chi phí thành công!')
      
      // Refresh list
      fetchProjectExpenses()
    } catch (e: any) {
      console.error('Error approving expense:', e)
      const errorMessage = e?.message || 'Không thể duyệt chi phí'
      setError(errorMessage)
      alert(`Lỗi: ${errorMessage}`)
    }
  }
}
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createExpenseCategory, setCreateExpenseCategory] = useState<'planned' | 'actual'>('planned')
  const [showExpenseObjectModal, setShowExpenseObjectModal] = useState(false)

  // Define projectsMap at the top of the component after fetching data
  const [projectsMap, setProjectsMap] = useState(new Map())

  // Toggle expand/collapse for parent items
  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Build tree structure from flat list
  const buildTree = (flatList: ProjectExpense[]): ProjectExpense[] => {
    const map = new Map<string, ProjectExpense>()
    const roots: ProjectExpense[] = []

    // First pass: create map of all items
    flatList.forEach(item => {
      map.set(item.id, { ...item, children: [], hasChildren: false })
    })

    // Second pass: build tree
    flatList.forEach(item => {
      const node = map.get(item.id)!
      if (item.id_parent) {
        const parent = map.get(item.id_parent)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
          parent.hasChildren = true
        } else {
          // Parent not found in same category, treat as root
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  // Flatten tree for rendering with level info
  const flattenTree = (tree: ProjectExpense[], level = 0): ProjectExpense[] => {
    const result: ProjectExpense[] = []
    
    tree.forEach(item => {
      result.push({ ...item, level })
      
      if (item.hasChildren && item.children && expandedItems.has(item.id)) {
        result.push(...flattenTree(item.children, level + 1))
      }
    })
    
    return result
  }

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
          .select('id, project_id, expense_code, description, amount, currency, expense_date, status, id_parent, created_at, updated_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('project_expenses')
          .select('id, project_id, expense_code, description, amount, currency, expense_date, status, id_parent, created_at, updated_at')
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
          variance: 0,
          variance_percentage: 0,
          category: 'planned' as 'planned' | 'actual',
          description: e.description,
          expense_date: e.expense_date,
          status: e.status as 'pending' | 'approved' | 'rejected',
          id_parent: e.id_parent,
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
          variance: 0,
          variance_percentage: 0,
          category: 'actual' as 'planned' | 'actual',
          description: e.description,
          expense_date: e.expense_date,
          status: e.status as 'pending' | 'approved' | 'rejected',
          id_parent: e.id_parent,
          created_at: e.created_at,
          updated_at: e.updated_at,
        })),
      ]

      setExpenses(expensesMapped)

      // Fetch employees data for display names
      console.log('Fetching employees data in ProjectExpensesTab...')
      
      // Try fetching from users table first
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name')
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        // Try employees table as fallback
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, full_name')
        
        if (employeesError) {
          console.error('Error fetching employees:', employeesError)
        } else {
          console.log('Employees fetch successful, data:', employeesData)
          if (employeesData) {
            const employeesMap = new Map<string, string>()
            employeesData.forEach(emp => {
              employeesMap.set(emp.id, emp.full_name)
            })
            setEmployees(employeesMap)
          }
        }
      } else {
        console.log('Users fetch successful, data:', usersData)
        if (usersData) {
          const employeesMap = new Map<string, string>()
          usersData.forEach(user => {
            employeesMap.set(user.id, user.full_name)
          })
          setEmployees(employeesMap)
        }
      }
    } catch (error) {
      console.error('Error fetching project expenses:', error)
      setError('Không thể tải chi phí dự án')
    } finally {
      setLoading(false)
    }
  }

  // Calculate group totals and variance for comparison
  const calculateComparison = (expenses: ProjectExpense[]) => {
    const comparison = expenses.reduce((acc: Record<string, { planned: number; actual: number }>, exp) => {
      const key = exp.project_id
      if (!acc[key]) {
        acc[key] = { planned: 0, actual: 0 }
      }
      acc[key][exp.category] += exp.category === 'planned' ? exp.planned_amount : exp.actual_amount
      return acc
    }, {})
    return Object.entries(comparison).map(([projectId, { planned, actual }]: [string, { planned: number; actual: number }]) => ({
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
      const res = await fetch(`${API_BASE_URL}/api/project-expenses/quotes/${quoteId}/approve`, {
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

  const handleRestoreSuccess = async () => {
    // Reload data after successful restore
    await fetchProjectExpenses()
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditExpense(null)
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
    const projectTotals = expenses.reduce((acc: Record<string, { planned: number; actual: number }>, expense) => {
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
    {/* Action Buttons */}
    <div className="flex justify-end space-x-2">
      <button
        onClick={() => setShowExpenseObjectModal(true)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        <Target className="h-4 w-4 mr-2" />
        Tạo đối tượng chi phí
      </button>
      <button
        onClick={() => {
          setCreateExpenseCategory('planned')
          setShowCreateModal(true)
        }}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Thêm chi phí kế hoạch
      </button>
      <button
        onClick={() => {
          setCreateExpenseCategory('actual')
          setShowCreateModal(true)
        }}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Thêm chi phí thực tế
      </button>
    </div>

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

    {/* Summary Cards - Show based on viewMode */}
      <div className={`grid grid-cols-1 gap-4 ${
        viewMode === 'all' ? 'md:grid-cols-4' : 
        viewMode === 'planned' || viewMode === 'actual' ? 'md:grid-cols-1 max-w-md' : 
        'md:grid-cols-4'
      }`}>
        {/* Kế hoạch - Show in 'all' and 'planned' */}
        {(viewMode === 'all' || viewMode === 'planned') && (
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
        )}
        
        {/* Thực tế - Show in 'all' and 'actual' */}
        {(viewMode === 'all' || viewMode === 'actual') && (
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
        )}
        
        {/* Chênh lệch - Only show in 'all' */}
        {viewMode === 'all' && (
          <>
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
          </>
        )}
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
                {/* Loại - removed per request; keep detailed in other views if needed */}
                {/* Kế hoạch - Show in 'all' and 'planned' */}
                {(viewMode === 'all' || viewMode === 'planned') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kế hoạch
                </th>
                )}
                {/* Thực tế - Show in 'all' and 'actual' */}
                {(viewMode === 'all' || viewMode === 'actual') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thực tế
                </th>
                )}
                {/* Chênh lệch - Only show in 'all' */}
                {viewMode === 'all' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chênh lệch
                </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {viewMode === 'all' ? (
                // Show aggregated data for 'all' view
                projectDisplay.map((project) => (
                <tr key={project.project_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {projectsMap.get(project.project_id)?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {projectsMap.get(project.project_id)?.project_code || 'N/A'}
                    </div>
                  </td>
                  {/* Loại column removed */}
                  {/* Kế hoạch - Show in 'all' and 'planned' */}
                  {(viewMode === 'all' || viewMode === 'planned') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(project.planned)}
                  </td>
                  )}
                  {/* Thực tế - Show in 'all' and 'actual' */}
                  {(viewMode === 'all' || viewMode === 'actual') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(project.actual)}
                  </td>
                  )}
                  {/* Chênh lệch - Only show in 'all' */}
                  {viewMode === 'all' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm ${getVarianceColor(project.variance)}`}>
                      {getVarianceIcon(project.variance)}
                      <span className="ml-1">
                        {formatCurrency(project.variance)} ({project.variance_percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.variance_percentage > 0 ? 'rejected' : 'approved')}`}>
                      {project.variance_percentage > 0 ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      <span className="ml-1">{project.variance_percentage > 0 ? 'Vượt chi phí kế hoạch' : 'Đã duyệt'}</span>
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
                      {/* Approve action removed in aggregated view; approval is available on planned rows */}
                      <button 
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              ) : (
                // Show individual expense items for 'planned' or 'actual' view
                getFilteredExpenses().map((expense) => (
                  <tr key={expense.id} className={`hover:bg-gray-50 ${
                    expense.level && expense.level > 0 
                      ? 'bg-orange-50' // Child expenses - light orange background
                      : 'bg-white'     // Parent expenses - white background
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {projectsMap.get(expense.project_id)?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {projectsMap.get(expense.project_id)?.project_code || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {/* Indent based on level */}
                        <div style={{ marginLeft: `${(expense.level || 0) * 24}px` }} className="flex items-center flex-1">
                          {/* Expand/Collapse button for parents */}
                          {expense.hasChildren ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(expense.id)
                              }}
                              className="mr-2 p-1 hover:bg-gray-100 rounded"
                              title={expandedItems.has(expense.id) ? 'Thu gọn' : 'Mở rộng'}
                            >
                              {expandedItems.has(expense.id) ? (
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6 mr-2" />
                          )}
                          
                          {/* Icon for parent/child with different colors */}
                          {expense.hasChildren ? (
                            <Folder className="h-4 w-4 text-blue-500 mr-2" />
                          ) : (
                            <FileText className={`h-4 w-4 mr-2 ${expense.level && expense.level > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                          )}
                          
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${
                              expense.level && expense.level > 0 
                                ? 'text-orange-700' // Child expenses - orange color
                                : 'text-gray-900'  // Parent expenses - normal color
                            }`}>
                              {expense.description}
                              {expense.hasChildren && expense.children && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({expense.children.length} mục)
                                </span>
                              )}
                            </div>
                            <div className={`text-xs mt-1 ${
                              expense.level && expense.level > 0 
                                ? 'text-orange-600' // Child expenses - orange color
                                : 'text-gray-500'   // Parent expenses - normal color
                            }`}>
                              Mã: {expense.id.substring(0, 8)}...
                            </div>
                            <div className={`text-xs ${
                              expense.level && expense.level > 0 
                                ? 'text-orange-400' // Child expenses - light orange
                                : 'text-gray-400'   // Parent expenses - normal color
                            }`}>
                              {new Date(expense.expense_date).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Show only planned amount in 'planned' view */}
                    {viewMode === 'planned' && (
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        expense.level && expense.level > 0 
                          ? 'text-orange-600' // Child expenses - orange color
                          : 'text-blue-600'   // Parent expenses - blue color
                      }`}>
                        {formatCurrency(expense.planned_amount)}
                      </td>
                    )}
                    {/* Show only actual amount in 'actual' view */}
                    {viewMode === 'actual' && (
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        expense.level && expense.level > 0 
                          ? 'text-orange-600' // Child expenses - orange color
                          : 'text-green-600'  // Parent expenses - green color
                      }`}>
                        {formatCurrency(expense.actual_amount)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                        {expense.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {expense.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {expense.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                        {getStatusText(expense.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* For planned expenses */}
                        {viewMode === 'planned' && (
                          <>
                            {canEdit(expense) && (
                              <button 
                                onClick={() => handleEditExpense(expense)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Sửa"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {canApprove(expense) && (
                              <button 
                                onClick={() => handleApprove(expense.id)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Duyệt thành chi phí thực tế"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete(expense) && (
                              <button 
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                        
                        {/* For actual expenses */}
                        {viewMode === 'actual' && (
                          <>
                            {canEdit(expense) && (
                              <button 
                                onClick={() => handleEditExpense(expense)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Sửa"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete(expense) && (
                              <button 
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                        
    {/* Snapshot Status Indicator for parent expenses only */}
    {console.log(`Expense ${expense.id}: level=${expense.level}, category=${expense.category}`)}
    {(!expense.level || expense.level === 0) && (
      <SnapshotStatusIndicator
        parentId={expense.id}
        tableName={expense.category === 'planned' ? 'project_expenses_quote' : 'project_expenses'}
        projectId={expense.project_id}
        onRestore={handleRestoreSuccess}
        className="inline-flex"
      />
    )}
                        
                        <button 
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Project Expense Dialog */}
      <CreateProjectExpenseDialog
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess}
        category={createExpenseCategory}
        mode={editExpense ? 'edit' : 'create'}
        editId={editExpense?.id}
      />

      {/* Create Expense Object Dialog */}
      <CreateExpenseObjectDialog
        isOpen={showExpenseObjectModal}
        onClose={() => setShowExpenseObjectModal(false)}
        onSuccess={() => {
          setShowExpenseObjectModal(false)
          // Có thể thêm logic refresh danh sách đối tượng chi phí nếu cần
        }}
      />
    </div>
  )
}
