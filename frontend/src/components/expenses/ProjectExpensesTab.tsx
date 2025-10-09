'use client'

import React, { useState, useEffect } from 'react'
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
  ChevronDown,
  ChevronRight
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
  id_parent?: string
  children?: ProjectExpense[]
  level?: number
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({})
  const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null)

  useEffect(() => {
    fetchProjectExpenses()
  }, [viewMode]) // Re-fetch when viewMode changes

  const fetchProjectExpenses = async () => {
    try {
      setLoading(true)
      setError(null)

      let quotesQuery = supabase
        .from('project_expenses_quote')
        .select(`
          id,
          project_id,
          id_parent,
          expense_code,
          description,
          amount,
          currency,
          expense_date,
          status,
          created_at,
          updated_at,
          projects (
            id,
            name,
            project_code
          )
        `)
        .order('created_at', { ascending: false })

      let actualQuery = supabase
        .from('project_expenses')
        .select(`
          id,
          project_id,
          id_parent,
          expense_code,
          description,
          amount,
          currency,
          expense_date,
          status,
          created_at,
          updated_at,
          projects (
            id,
            name,
            project_code
          )
        `)
        .order('created_at', { ascending: false })

      // Filter based on viewMode
      if (viewMode === 'planned') {
        actualQuery = null
      } else if (viewMode === 'actual') {
        quotesQuery = null
      }

      // Luôn fetch projects trước
      const projectsRes = await supabase.from('projects').select('id, name, project_code')
      if (projectsRes.error) throw projectsRes.error

      // Fetch quotes và actual expenses tùy theo viewMode
      let quotesRes = null
      let actualRes = null

      if (viewMode !== 'actual' && quotesQuery) {
        quotesRes = await quotesQuery
        if (quotesRes?.error) throw quotesRes.error
      }

      if (viewMode !== 'planned' && actualQuery) {
        actualRes = await actualQuery
        if (actualRes?.error) throw actualRes.error
      }

      const expensesMapped = [
        ...(quotesRes?.data?.map(e => ({
          id: e.id,
          project_id: e.project_id,
          project_name: e.projects?.name || '',
          project_code: e.projects?.project_code || '',
          planned_amount: e.amount || 0,
          actual_amount: 0,
          category: 'planned' as const,
          description: e.description,
          expense_date: e.expense_date,
          status: e.status,
          created_at: e.created_at,
          updated_at: e.updated_at,
          id_parent: e.id_parent
        })) || []),
        ...(actualRes?.data?.map(e => ({
          id: e.id,
          project_id: e.project_id,
          project_name: e.projects?.name || '',
          project_code: e.projects?.project_code || '',
          planned_amount: 0,
          actual_amount: e.amount || 0,
          category: 'actual' as const,
          description: e.description,
          expense_date: e.expense_date,
          status: e.status,
          created_at: e.created_at,
          updated_at: e.updated_at,
          id_parent: e.id_parent
        })) || [])
      ]

      setExpenses(expensesMapped)
    } catch (error) {
      console.error('Error fetching project expenses:', error)
      setError('Không thể tải chi phí dự án')
    } finally {
      setLoading(false)
    }
  }
  // Build expense tree
  const buildExpenseTree = (expenses: ProjectExpense[]) => {
    // Create map to store expenses by id
    const expenseMap = new Map(expenses.map(e => [e.id, { ...e, children: [] }]));
    const rootExpenses = [];

    // Build tree structure
    expenses.forEach(expense => {
      if (expense.id_parent) {
        // If has parent, add to parent's children
        const parent = expenseMap.get(expense.id_parent);
        if (parent) {
          parent.children.push(expenseMap.get(expense.id));
        }
      } else {
        // If no parent, this is a root expense
        rootExpenses.push(expenseMap.get(expense.id));
      }
    });

    return rootExpenses;
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesView = viewMode === 'all' || expense.category === viewMode
    
    return matchesSearch && matchesView
  });

  // Build tree from filtered expenses
  const expenseTree = buildExpenseTree(filteredExpenses);

  // Calculate summary statistics - only count approved planned expenses
  const totalPlanned = expenses
    .filter(e => e.category === 'planned' && e.status === 'approved')
    .reduce((sum, e) => sum + e.planned_amount, 0)
  const totalActual = expenses
    .filter(e => e.category === 'actual')
    .reduce((sum, e) => sum + e.actual_amount, 0)
  const totalVariance = totalActual - totalPlanned
  const variancePercentage = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0

  const formatProjects = (expenses: ProjectExpense[]) => {
    // Group expenses by project
    const projectGroups = expenses.reduce((acc, expense) => {
      const { project_id } = expense
      if (!acc[project_id]) {
        acc[project_id] = {
          project_id,
          project_name: expense.project_name,
          project_code: expense.project_code,
          planned_expenses: [],
          actual_expenses: [],
          planned_total: 0,
          actual_total: 0,
          has_approved_plan: false // Flag to check if has approved plan
        }
      }
      
      if (expense.category === 'planned') {
        acc[project_id].planned_expenses.push(expense)
        // Only count planned amount when approved
        if (expense.status === 'approved') {
          acc[project_id].planned_total += expense.planned_amount
          acc[project_id].has_approved_plan = true
        }
      } else {
        acc[project_id].actual_expenses.push(expense)
        acc[project_id].actual_total += expense.actual_amount
      }
      
      return acc
    }, {})

    // Convert to array and calculate totals
    return Object.values(projectGroups).map(group => {
      // Only show variance when has approved plan
      const variance = group.has_approved_plan ? group.actual_total - group.planned_total : null
      const variance_percentage = group.has_approved_plan && group.planned_total > 0 
        ? ((group.actual_total - group.planned_total) / group.planned_total) * 100 
        : null

      return {
        ...group,
        variance,
        variance_percentage,
        // Status based on having approved plan
        status: group.has_approved_plan ? 'approved' : 'pending'
      }
    })
  }

  const projectDisplay = formatProjects(expenses)

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
    setEditingExpense(null) // Reset editing state
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingExpense(null)
  }

  const handleCreateSuccess = () => {
    fetchProjectExpenses()
    setShowCreateModal(false)
    setEditingExpense(null)
  }

  const canEdit = (expense: ProjectExpense) => {
    return expense.category === 'planned' && expense.status !== 'approved'
  }

  const canDelete = (expense: ProjectExpense) => {
    return expense.category === 'planned' && expense.status !== 'approved'
  }

  const handleEditExpense = (expense: ProjectExpense) => {
    if (!canEdit(expense)) return
    setEditingExpense(expense)
    setShowCreateModal(true)
  }

  const handleDeleteExpense = async (expenseId: string, category: 'planned' | 'actual') => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chi phí này?')) return

    try {
      const table = category === 'planned' ? 'project_expenses_quote' : 'project_expenses'
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', expenseId)
      
      if (error) throw error

      // If child expense, update parent total
      const expense = expenses.find(e => e.id === expenseId)
      if (expense?.id_parent) {
        const { data: siblings } = await supabase
          .from(table)
          .select('amount')
          .eq('id_parent', expense.id_parent)
        
        const total = (siblings || []).reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
        await supabase
          .from(table)
          .update({ amount: total })
          .eq('id', expense.id_parent)
      }
      
      // Refresh list after delete
      fetchProjectExpenses()
    } catch (e) {
      console.error('Error deleting expense:', e)
      setError('Không thể xóa chi phí')
    }
  }
  return (
    <div className="space-y-6">
      {/* Add New Button */}
      {(viewMode === 'planned' || viewMode === 'actual') && (
        <button
          onClick={handleCreateExpense}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {viewMode === 'planned' ? 'Thêm chi phí kế hoạch' : 'Thêm chi phí thực tế'}
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
                {viewMode === 'all' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng
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
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày
                    </th>
                  </>
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
              {(() => {
                if (viewMode === 'all') {
                  return projectDisplay.map((project) => (
                    <tr key={project.project_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {project.project_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.project_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Kế hoạch đã duyệt: {project.planned_expenses.filter(e => e.status === 'approved').length}</div>
                        <div>Thực tế: {project.actual_expenses.length}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(project.planned_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(project.actual_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.has_approved_plan ? (
                          <div className={`flex items-center text-sm ${getVarianceColor(project.variance)}`}>
                            {getVarianceIcon(project.variance)}
                            <span className="ml-1">
                              {formatCurrency(project.variance)} ({project.variance_percentage.toFixed(1)}%)
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Chưa có kế hoạch được duyệt
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1">{getStatusText(project.status)}</span>
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
                        </div>
                      </td>
                    </tr>
                  ));
                } else {
                  return expenseTree.map(expense => {
                    const renderExpense = (expense: ProjectExpense, level: number = 0) => {
                      const isExpanded = expandedRows[expense.id] || false;
                      const hasChildren = expense.children && expense.children.length > 0;
                      const indentation = level * 24;

                      return (
                        <React.Fragment key={expense.id}>
                          <tr className={`hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center" style={{ marginLeft: `${indentation}px` }}>
                                {hasChildren ? (
                                  <button
                                    onClick={() => setExpandedRows(prev => ({
                                      ...prev,
                                      [expense.id]: !prev[expense.id]
                                    }))}
                                    className="mr-2 text-gray-500 hover:text-gray-700"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-6 h-6 mr-2 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {expense.description}
                                    {hasChildren && (
                                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                        {expense.children.length} chi phí con
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Dự án: {expense.project_name} ({expense.project_code})
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {hasChildren ? 'Chi phí cha' : 'Chi phí đơn lẻ'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(expense.category === 'planned' ? expense.planned_amount : expense.actual_amount)}
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
                                {expense.category === 'planned' ? (
                                  <>
                                    {expense.status !== 'approved' && (
                                      <>
                                        <button 
                                          onClick={() => handleEditExpense(expense)}
                                          className="text-gray-600 hover:text-gray-900 p-1"
                                          title="Chỉnh sửa"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteExpense(expense.id, expense.category)}
                                          className="text-red-600 hover:text-red-900 p-1"
                                          title="Xóa"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </>
                                    )}
                                    {expense.status === 'pending' && (
                                      <button
                                        onClick={() => handleApprove(expense.id)}
                                        className="text-green-600 hover:text-green-900 p-1"
                                        title="Duyệt thành thực tế"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => handleEditExpense(expense)}
                                      className="text-gray-600 hover:text-gray-900 p-1"
                                      title="Chỉnh sửa"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteExpense(expense.id, expense.category)}
                                      className="text-red-600 hover:text-red-900 p-1"
                                      title="Xóa"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && hasChildren && expense.children.map(child => renderExpense(child, level + 1))}
                        </React.Fragment>
                      );
                    };

                    return renderExpense(expense);
                  });
                }
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Project Expense Dialog */}
      <CreateProjectExpenseDialog
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess}
        editExpense={editingExpense}
      />
    </div>
  )
}
