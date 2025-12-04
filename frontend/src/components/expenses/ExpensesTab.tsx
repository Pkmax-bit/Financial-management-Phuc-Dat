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
  Minus,
  Check
} from 'lucide-react'
import CreateExpenseSidebar from './CreateExpenseSidebar'
import CreateExpenseDialog from './CreateExpenseDialog'
import CreateExpenseCategoryDialog from './CreateExpenseCategoryDialog'
import ExpenseRestoreButton from './ExpenseRestoreButton'
import SnapshotStatusIndicator from './SnapshotStatusIndicator'
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
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined)
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})
  const [editDialogState, setEditDialogState] = useState<{ mode: 'create' | 'edit'; expense?: Expense; isLeaf?: boolean } | null>(null)
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string, name: string, email?: string, user_id?: string, project_id?: string, project_ids?: string[], hasProjects?: boolean }>>([])
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>('all')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchExpenses()
    fetchTeamMembers()
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

  const fetchTeamMembers = async () => {
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', authUser.id)
        .single()

      if (!userData) return

      // Save user role for UI display logic
      setUserRole(userData.role)

      // Get allowed project IDs
      let allowedProjectIds: string[] = []

      // Admin and accountant see all projects
      if (userData.role === 'admin' || userData.role === 'accountant') {
        const { data: allProjects } = await supabase
          .from('projects')
          .select('id')
        allowedProjectIds = (allProjects || []).map(p => p.id)
      } else {
        // Get project_ids from project_team by user_id or email
        const [teamDataByUserId, teamDataByEmail] = await Promise.all([
          supabase
            .from('project_team')
            .select('project_id')
            .eq('status', 'active')
            .eq('user_id', userData.id),
          supabase
            .from('project_team')
            .select('project_id')
            .eq('status', 'active')
            .eq('email', userData.email)
        ])

        const allTeamData = [
          ...(teamDataByUserId.data || []),
          ...(teamDataByEmail.data || [])
        ]

        allowedProjectIds = [...new Set(allTeamData.map(t => t.project_id))]
      }

      if (allowedProjectIds.length === 0) {
        setTeamMembers([])
        return
      }

      // Fetch all employees and users
      const [employeesRes, usersRes] = await Promise.all([
        supabase
          .from('employees')
          .select('id, first_name, last_name, email, user_id')
          .eq('status', 'active'),
        supabase
          .from('users')
          .select('id, full_name, email, is_active')
          .eq('is_active', true)
      ])

      const allEmployees = [
        ...(employeesRes.data || []).map((emp: any) => ({
          id: emp.id,
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || 'Không có tên',
          email: emp.email,
          user_id: emp.user_id,
          type: 'employee' as const
        })),
        ...(usersRes.data || []).map((user: any) => ({
          id: user.id,
          name: user.full_name || user.email || 'Không có tên',
          email: user.email,
          user_id: user.id,
          type: 'user' as const
        }))
      ]

      // Remove duplicates by email
      const uniqueEmployees = Array.from(
        new Map(allEmployees.map(emp => [emp.email, emp])).values()
      )

      // Fetch team members from allowed projects
      const { data: teamMembersData } = await supabase
        .from('project_team')
        .select('id, name, email, project_id, user_id')
        .eq('status', 'active')
        .in('project_id', allowedProjectIds)

      // Create user_id to employee_id map
      const userIdToEmployeeIdMap = new Map<string, string>()
      for (const emp of uniqueEmployees) {
        if (emp.user_id && emp.type === 'employee') {
          userIdToEmployeeIdMap.set(emp.user_id, emp.id)
        }
      }

      // Create member project map
      const memberProjectMap = new Map<string, string[]>()
        ; (teamMembersData || []).forEach((member: any) => {
          const keys: string[] = []

          if (member.user_id) {
            keys.push(`user_${member.user_id}`)
            const empId = userIdToEmployeeIdMap.get(member.user_id)
            if (empId) {
              keys.push(`emp_${empId}`)
            }
          }
          if (member.name) {
            const normalizedName = member.name.toLowerCase().trim().replace(/\s+/g, ' ')
            keys.push(`name_${normalizedName}`)
          }
          if (member.email) {
            keys.push(`email_${member.email.toLowerCase().trim()}`)
          }

          keys.forEach(key => {
            if (!memberProjectMap.has(key)) {
              memberProjectMap.set(key, [])
            }
            memberProjectMap.get(key)!.push(member.project_id)
          })
        })

      // Map employees to projects
      const allMembersWithProjects = uniqueEmployees.map(emp => {
        let projectIds: string[] = []

        if (emp.user_id) {
          projectIds = memberProjectMap.get(`user_${emp.user_id}`) || []
        }
        if (projectIds.length === 0 && emp.type === 'employee') {
          projectIds = memberProjectMap.get(`emp_${emp.id}`) || []
        }
        if (projectIds.length === 0 && emp.name) {
          const normalizedName = emp.name.toLowerCase().trim().replace(/\s+/g, ' ')
          projectIds = memberProjectMap.get(`name_${normalizedName}`) || []
        }
        if (projectIds.length === 0 && emp.email) {
          projectIds = memberProjectMap.get(`email_${emp.email.toLowerCase().trim()}`) || []
        }

        const filteredProjectIds = projectIds.filter(pid => allowedProjectIds.includes(pid))

        return {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          user_id: emp.user_id,
          project_ids: [...new Set(filteredProjectIds)],
          project_id: filteredProjectIds[0] || '',
          hasProjects: filteredProjectIds.length > 0
        }
      })

      // Only show members with projects
      const filteredMembers = allMembersWithProjects.filter(m => m.hasProjects)
      setTeamMembers(filteredMembers)
    } catch (error) {
      console.error('Error fetching team members:', error)
      setTeamMembers([])
    }
  }


  const updateParentExpenseAmount = async (parentId: string) => {
    try {
      // Get all child expenses
      const { data: childExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('id_parent', parentId)

      // Calculate total amount from children
      const totalAmount = childExpenses?.reduce((sum, child) => sum + (child.amount || 0), 0) || 0

      // Update parent expense amount
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', parentId)

      if (error) throw error

      // Update local state
      setExpenses(expenses.map(exp =>
        exp.id === parentId
          ? { ...exp, amount: totalAmount }
          : exp
      ))

      console.log('Parent expense amount updated:', totalAmount)
    } catch (error) {
      console.error('Error updating parent expense amount:', error)
    }
  }

  const handleDeleteExpense = async (expenseId: string, expenseCode: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chi phí ${expenseCode}? Hành động này không thể hoàn tác.`)) {
      try {
        // Try API first, fallback to Supabase
        try {
          // Get the current session token
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.access_token) {
            throw new Error('No authentication token found')
          }

          // Call the backend API with correct endpoint
          const response = await fetch(`/api/expenses/expenses/${expenseId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || errorData.error || 'Failed to delete expense')
          }
        } catch (apiError) {
          console.log('API failed, falling back to Supabase:', apiError)

          // Check if expense exists and get its status
          const { data: expense, error: fetchError } = await supabase
            .from('expenses')
            .select('id, status, expense_code')
            .eq('id', expenseId)
            .single()

          if (fetchError || !expense) {
            throw new Error('Expense not found')
          }

          // Allow deletion at any status - no restriction

          // Delete the expense directly from Supabase
          const { error: deleteError } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenseId)

          if (deleteError) {
            console.error('Error deleting expense:', deleteError)
            throw new Error('Failed to delete expense')
          }
        }

        // Update local state
        setExpenses(expenses.filter(exp => exp.id !== expenseId))
        console.log('Expense deleted successfully')
      } catch (error) {
        console.error('Error deleting expense:', error)
        setError(`Không thể xóa chi phí: ${(error as Error)?.message || 'Lỗi không xác định'}`)
      }
    }
  }

  const handleApproveExpense = async (expenseId: string, expenseCode: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn duyệt chi phí ${expenseCode}? Tất cả chi phí con cũng sẽ được duyệt.`)) {
      try {
        setLoading(true)

        // Get all child expenses first
        const { data: childExpenses } = await supabase
          .from('expenses')
          .select('id')
          .eq('id_parent', expenseId)

        const childIds = childExpenses?.map(child => child.id) || []

        // Update parent expense status
        const { error: parentError } = await supabase
          .from('expenses')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseId)

        if (parentError) throw parentError

        // Update all child expenses status
        if (childIds.length > 0) {
          const { error: childrenError } = await supabase
            .from('expenses')
            .update({
              status: 'approved',
              approved_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .in('id', childIds)

          if (childrenError) throw childrenError
        }

        // Update local state
        setExpenses(expenses.map(exp => {
          if (exp.id === expenseId || childIds.includes(exp.id)) {
            return { ...exp, status: 'approved' }
          }
          return exp
        }))

        console.log('Expense and children approved successfully')
      } catch (error) {
        console.error('Error approving expense:', error)
        setError(`Không thể duyệt chi phí: ${(error as Error)?.message || 'Lỗi không xác định'}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleEditExpense = (expenseId: string, expenseCode: string) => {
    const expense = expenses.find(exp => exp.id === expenseId)
    if (!expense) return

    const isLeaf = isLeafExpense(expenseId)

    // Open edit dialog with expense data and amount field enabled/disabled
    setEditDialogState({ mode: 'edit', expense, isLeaf })
    setDefaultParentId(expense.id_parent)
    setShowCreateDialog(true)

    // You can pass additional props to CreateExpenseDialog to handle edit mode
    // For now, we'll use the existing dialog but with different behavior
    console.log('Edit expense:', expenseCode, 'Is leaf:', isLeaf)
  }

  const handleRestoreSuccess = async () => {
    // Reload data after successful restore
    await fetchExpenses()
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

  // Hiển thị tiền tệ dạng 1.234.567 (không kèm ký hiệu tiền tệ),
  // dùng chung cho Đơn giá / Thành tiền ở màn chi phí
  const formatCurrency = (amount: number) => {
    if (!amount) return '0'
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  const filteredExpenses = expenses.filter(expense => {
    const empName = (expense.employees?.users?.full_name || `${expense.employees?.first_name || ''} ${expense.employees?.last_name || ''}`.trim()).toLowerCase()
    const catName = expense.expense_categories?.name?.toLowerCase() || ''
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.expense_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empName.includes(searchTerm.toLowerCase()) ||
      catName.includes(searchTerm.toLowerCase())

    // Team member filter
    const matchesTeamMember = selectedTeamMemberId === 'all' || (() => {
      const selectedMember = teamMembers.find(m =>
        m.id === selectedTeamMemberId || m.user_id === selectedTeamMemberId
      )
      if (selectedMember) {
        // Filter by employee_id matching selected member
        return expense.employee_id === selectedMember.id
      }
      return true
    })()

    return matchesSearch && matchesTeamMember
  })

  // Build children map for hierarchy
  const childrenMap: Record<string, Expense[]> = filteredExpenses.reduce((acc, exp) => {
    const parentId = exp.id_parent || 'root'
    if (!acc[parentId]) acc[parentId] = []
    acc[parentId].push(exp)
    return acc
  }, {} as Record<string, Expense[]>)

  // Parent lookup map for quick percent calculation
  const parentMap: Record<string, string> = filteredExpenses.reduce((acc, exp) => {
    if (exp.id) acc[exp.id] = exp.id_parent || 'root'
    return acc
  }, {} as Record<string, string>)

  // Sum of immediate children only
  const getImmediateChildrenTotal = (id: string): number => {
    const children = childrenMap[id] || []
    return children.reduce((sum, c) => sum + (c.amount || 0), 0)
  }

  // Display amount: if has direct children, show sum(children); else show own amount
  const getDisplayAmount = (exp: Expense): number => {
    return hasChildren(exp.id) ? getImmediateChildrenTotal(exp.id) : (exp.amount || 0)
  }

  // Percent for a child relative to its parent immediate total
  const getChildPercent = (exp: Expense): string | null => {
    const parentId = parentMap[exp.id]
    if (!parentId || parentId === 'root') return null
    const total = getImmediateChildrenTotal(parentId)
    if (!total) return null
    const pct = (exp.amount / total) * 100
    return `${pct.toFixed(1)}%`
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const hasChildren = (id: string) => {
    return (childrenMap[id] && childrenMap[id].length > 0) || false
  }

  const isLeafExpense = (id: string) => {
    return !hasChildren(id)
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
              <div className="text-sm font-medium text-gray-900">{formatCurrency(getDisplayAmount(exp))}</div>
              <div className="text-sm text-gray-500">{exp.currency}</div>
              {!hasChildren(exp.id) && getChildPercent(exp) && (
                <div className="text-xs text-gray-500 mt-1">Tỉ lệ trong cha: {getChildPercent(exp)}</div>
              )}
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
                <button
                  className="text-orange-600 hover:text-orange-800 p-1"
                  title="Tạo chi phí con"
                  onClick={() => {
                    setDefaultParentId(exp.id)
                    setShowCreateDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button className="text-blue-600 hover:text-blue-900 p-1" title="Xem chi tiết">
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  className="text-gray-600 hover:text-gray-900 p-1"
                  title="Chỉnh sửa"
                  onClick={() => handleEditExpense(exp.id, exp.expense_code)}
                >
                  <Edit className="h-4 w-4" />
                </button>
                {exp.status === 'pending' && (
                  <button
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Duyệt chi phí"
                    onClick={() => handleApproveExpense(exp.id, exp.expense_code)}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {/* Snapshot Status Indicator for parent expenses only */}
                {!exp.id_parent && (
                  <SnapshotStatusIndicator
                    parentId={exp.id}
                    tableName="expenses"
                    onRestore={handleRestoreSuccess}
                    className="inline-flex"
                  />
                )}

                <button
                  className="text-red-600 hover:text-red-900 p-1"
                  title="Xóa"
                  onClick={() => handleDeleteExpense(exp.id, exp.expense_code)}
                >
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

      {/* Team Member Filter - Only show for admin and accountant */}
      {(userRole === 'admin' || userRole === 'accountant') && teamMembers.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Lọc theo thành viên dự án
          </label>
          <select
            value={selectedTeamMemberId}
            onChange={(e) => setSelectedTeamMemberId(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
          >
            <option value="all">Tất cả thành viên</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.user_id || member.id}>
                {member.name} {member.email ? `(${member.email})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

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
          setDefaultParentId(undefined)
          setEditDialogState(null)
        }}
        defaultParentId={defaultParentId}
        // If we opened via Edit button, pass edit params stored in temp state
        mode={(editDialogState as any)?.mode || 'create'}
        expense={(editDialogState as any)?.expense}
        isLeaf={(editDialogState as any)?.isLeaf ?? true}
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