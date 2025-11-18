'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  FileText,
  CircleHelp
} from 'lucide-react'
import CreateProjectExpenseDialog from './CreateProjectExpenseDialog'
import CreateExpenseObjectDialog from './CreateExpenseObjectDialog'
import ExpenseRestoreButton from './ExpenseRestoreButton'
import { supabase } from '@/lib/supabase'
import { getApiUrl } from '@/lib/apiUrl'
import { PROJECT_STATUS_FILTER_OPTIONS } from '@/config/projectStatus'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || getApiUrl()

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
  searchTerm?: string
  onCreateExpense: () => void
}

export default function ProjectExpensesTab({ searchTerm, onCreateExpense }: ProjectExpensesTabProps) {
  const [expenses, setExpenses] = useState<ProjectExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'planned' | 'actual'>('all')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [employees, setEmployees] = useState<Map<string, string>>(new Map())
  const [userRole, setUserRole] = useState<string>('employee')
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all') // Mặc định: tất cả trạng thái
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(10)

  // Tour state
  const APPROVE_EXPENSE_TOUR_STORAGE_KEY = 'approve-expense-tour-status-v1'
  const [isApproveExpenseTourRunning, setIsApproveExpenseTourRunning] = useState(false)
  const approveExpenseTourRef = useRef<any>(null)
  const approveExpenseShepherdRef = useRef<any>(null)
  const approveExpenseTourAutoStartAttemptedRef = useRef(false)
  type ApproveExpenseShepherdModule = typeof import('shepherd.js')
  type ApproveExpenseShepherdType = ApproveExpenseShepherdModule & { Tour: new (...args: any[]) => any }
  type ApproveExpenseShepherdTour = InstanceType<ApproveExpenseShepherdType['Tour']>

// CRUD permissions
const canEdit = (expense: ProjectExpense) => {
  // Check if user role has permission to edit
  const allowedRoles = ['admin', 'accountant', 'manager', 'Supplier', 'vận chuyển', 'nhân công']
  console.log('🔍 canEdit check:', { userRole, allowedRoles, isAllowed: allowedRoles.includes(userRole) })
  
  if (!allowedRoles.includes(userRole)) {
    console.log('❌ canEdit: User role not allowed', userRole)
    return false
  }
  
  // Planned: only pending can be edited
  // Actual: can be edited (for corrections)
  if (expense.category === 'planned') {
    const canEditPlanned = expense.status === 'pending'
    console.log('📋 canEdit planned:', { category: expense.category, status: expense.status, canEdit: canEditPlanned })
    return canEditPlanned
  }
  // Actual expenses can be edited
  console.log('✅ canEdit actual: true')
  return true
}

const canDelete = (expense: ProjectExpense) => {
  // Check if user role has permission to delete
  const allowedRoles = ['admin', 'accountant', 'manager', 'Supplier', 'vận chuyển', 'nhân công']
  console.log('🔍 canDelete check:', { userRole, allowedRoles, isAllowed: allowedRoles.includes(userRole) })
  
  if (!allowedRoles.includes(userRole)) {
    console.log('❌ canDelete: User role not allowed', userRole)
    return false
  }
  
  // Planned: only pending can be deleted
  // Actual: can be deleted (for corrections)
  if (expense.category === 'planned') {
    const canDeletePlannedStatuses: Array<ProjectExpense['status']> = ['pending', 'approved']
    const canDeletePlanned = canDeletePlannedStatuses.includes(expense.status)
    console.log('📋 canDelete planned:', { category: expense.category, status: expense.status, canDelete: canDeletePlanned })
    return canDeletePlanned
  }
  // Actual expenses can be deleted
  console.log('✅ canDelete actual: true')
  return true
}

const canApprove = (expense: ProjectExpense) => {
  // Only planned expenses that are pending can be approved
  if (expense.category !== 'planned' || expense.status !== 'pending') {
    console.log('❌ canApprove: Not planned or not pending', { category: expense.category, status: expense.status })
    return false
  }
  
  // Check if user role has permission to approve
  const allowedRoles = ['admin', 'accountant', 'manager', 'Supplier', 'vận chuyển', 'nhân công']
  const canApproveResult = allowedRoles.includes(userRole)
  console.log('🔍 canApprove check:', { userRole, allowedRoles, canApprove: canApproveResult })
  return canApproveResult
}

// Approve permission for actual expenses (pending only)
const canApproveActual = (expense: ProjectExpense) => {
  if (expense.category !== 'actual' || expense.status !== 'pending') {
    return false
  }
  const allowedRoles = ['admin', 'accountant', 'manager', 'Supplier', 'vận chuyển', 'nhân công']
  return allowedRoles.includes(userRole)
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
  
  // Check if this is a parent expense (has children)
  const hasChildren = expenses.some(e => e.id_parent === expenseId)
  
  const confirmMessage = isPlanned 
    ? (expense.status === 'approved'
        ? 'Chi phí kế hoạch này đã được duyệt. Bạn có chắc chắn muốn xóa?'
        : 'Bạn có chắc chắn muốn xóa chi phí kế hoạch này?')
    : hasChildren 
      ? 'Bạn có chắc chắn muốn xóa chi phí thực tế này? Xóa cha sẽ xóa tất cả chi phí con. Hành động này không thể hoàn tác!'
      : 'Bạn có chắc chắn muốn xóa chi phí thực tế này? Hành động này không thể hoàn tác!'
  
  if (window.confirm(confirmMessage)) {
    try {
      if (isPlanned) {
        // For planned expenses, just delete the single expense
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', expenseId)
        
        if (error) throw error
      } else {
        // For actual expenses, implement cascade delete
        console.log('🗑️ Deleting expense with cascade:', expenseId)
        
        // First, delete all child expenses
        console.log('🔍 Step 1: Deleting child expenses...')
        const { error: deleteChildrenError } = await supabase
          .from(tableName)
          .delete()
          .eq('id_parent', expenseId)
        
        if (deleteChildrenError) {
          console.error('❌ Error deleting child expenses:', deleteChildrenError)
          throw deleteChildrenError
        }
        
        console.log('✅ Child expenses deleted successfully')
        
        // Then, delete the parent expense
        console.log('🔍 Step 2: Deleting parent expense...')
        const { error: deleteParentError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', expenseId)
        
        if (deleteParentError) {
          console.error('❌ Error deleting parent expense:', deleteParentError)
          throw deleteParentError
        }
        
        console.log('✅ Parent expense deleted successfully')
        console.log('✅ Cascade delete completed: Xóa cha thì con cũng bị xóa')
      }
      
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
      // CRITICAL: Status must be 'pending' by default, not 'approved'
      // Only the approve button in the actions column should change status to 'approved'
      const newExpense: any = {
        id: crypto.randomUUID(), // Generate new UUID for id
        project_id: quoteData.project_id,
        description: quoteData.description,
        amount: quoteData.amount,
        expense_date: quoteData.expense_date,
        status: 'pending', // Default to pending - must be approved via approve button
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

const startApproveExpenseTour = useCallback(async () => {
    if (typeof window === 'undefined') return

    if (approveExpenseTourRef.current) {
      approveExpenseTourRef.current.cancel()
      approveExpenseTourRef.current = null
    }

    if (!approveExpenseShepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: ApproveExpenseShepherdType })?.default ?? (module as unknown as ApproveExpenseShepherdType)
        approveExpenseShepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = approveExpenseShepherdRef.current
    if (!Shepherd) return

    const waitForElement = async (selector: string, retries = 20, delay = 100) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        if (document.querySelector(selector)) {
          return true
        }
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      return false
    }

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )

    // Try to find a planned expense with pending status
    const pendingPlannedExpense = expenses.find(e => e.category === 'planned' && e.status === 'pending')
    const hasApproveButton = pendingPlannedExpense ? await waitForElement(`[data-tour-id="approve-expense-button-${pendingPlannedExpense.id}"]`) : false

    await waitForElement('[data-tour-id="expenses-list-header"]')
    await waitForElement('[data-tour-id="expenses-list"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'approve-expense-intro',
      title: 'Hướng dẫn duyệt chi phí kế hoạch thành chi phí thực tế',
      text: 'Sau khi tạo chi phí kế hoạch, bạn có thể duyệt nó để chuyển thành chi phí thực tế. Khi duyệt, tất cả thông tin từ chi phí kế hoạch sẽ được sao chép sang chi phí thực tế.',
      attachTo: { element: '[data-tour-id="expenses-list-header"]', on: 'bottom' },
      buttons: [
        {
          text: 'Bỏ qua',
          action: () => tour.cancel(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Bắt đầu',
          action: () => tour.next()
        }
      ]
    })

    if (hasApproveButton && pendingPlannedExpense) {
      tour.addStep({
        id: 'approve-expense-button',
        title: 'Nút duyệt chi phí',
        text: `Khi chi phí kế hoạch có trạng thái "Chờ duyệt" (pending), bạn sẽ thấy nút duyệt (biểu tượng ✓ màu xanh lá). Nhấn vào nút này để duyệt chi phí kế hoạch thành chi phí thực tế.`,
        attachTo: { element: `[data-tour-id="approve-expense-button-${pendingPlannedExpense.id}"]`, on: 'left' },
        buttons: [
          {
            text: 'Quay lại',
            action: () => tour.back(),
            classes: 'shepherd-button-secondary'
          },
          {
            text: 'Tiếp tục',
            action: () => tour.next()
          }
        ]
      })
    }

    tour.addStep({
      id: 'approve-expense-process',
      title: 'Quy trình duyệt',
      text: 'Khi nhấn nút duyệt, hệ thống sẽ tự động:\n\n1. Tạo chi phí thực tế mới: Tạo chi phí thực tế mới từ chi phí kế hoạch\n2. Sao chép thông tin: Tất cả thông tin sẽ được sao chép:\n   - Dự án\n   - Đối tượng chi phí\n   - Số tiền\n   - Hóa đơn/đơn hàng\n   - Ghi chú\n3. Cập nhật trạng thái: Trạng thái chi phí kế hoạch sẽ được cập nhật thành "Đã duyệt"\n4. Hiển thị kết quả:\n   - Chi phí thực tế sẽ xuất hiện trong tab "Thực tế"\n   - Bạn có thể so sánh chi phí kế hoạch và thực tế trong tab "Tất cả"\n\nLưu ý:\n• Quá trình này không thể hoàn tác\n• Chi phí kế hoạch vẫn giữ nguyên trong danh sách với trạng thái "Đã duyệt"',
      attachTo: { element: '[data-tour-id="expenses-list"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Hoàn tất',
          action: () => tour.complete()
        }
      ]
    })

    tour.on('complete', () => {
      setIsApproveExpenseTourRunning(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem(APPROVE_EXPENSE_TOUR_STORAGE_KEY, 'completed')
      }
      approveExpenseTourRef.current = null
    })

    tour.on('cancel', () => {
      setIsApproveExpenseTourRunning(false)
      approveExpenseTourRef.current = null
    })

    approveExpenseTourRef.current = tour
    setIsApproveExpenseTourRunning(true)
    tour.start()
  }, [expenses])

  // Auto-start tour when expenses are loaded and there's at least one pending planned expense
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (approveExpenseTourAutoStartAttemptedRef.current) return
    if (loading) return
    if (expenses.length === 0) return

    const storedStatus = localStorage.getItem(APPROVE_EXPENSE_TOUR_STORAGE_KEY)
    if (storedStatus) return

    // Check if there's at least one pending planned expense
    const hasPendingPlannedExpense = expenses.some(e => e.category === 'planned' && e.status === 'pending')
    if (!hasPendingPlannedExpense) return

    approveExpenseTourAutoStartAttemptedRef.current = true
    setTimeout(() => {
      startApproveExpenseTour()
    }, 1000)
  }, [loading, expenses, startApproveExpenseTour])

  // Cleanup tour on unmount
  useEffect(() => {
    return () => {
      approveExpenseTourRef.current?.cancel()
      approveExpenseTourRef.current?.destroy?.()
      approveExpenseTourRef.current = null
    }
  }, [])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createExpenseCategory, setCreateExpenseCategory] = useState<'planned' | 'actual'>('planned')
  const [showExpenseObjectModal, setShowExpenseObjectModal] = useState(false)

  // Define projectsMap at the top of the component after fetching data
  const [projectsMap, setProjectsMap] = useState(new Map())
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string; project_code?: string; status?: string }>>([])
  
  // Update project status filter when viewMode changes
  useEffect(() => {
    if (viewMode === 'planned') {
      setProjectStatusFilter('active')
    } else if (viewMode === 'actual') {
      setProjectStatusFilter('active')
    }
    // For 'all' view, keep current filter or default to 'all'
  }, [viewMode])

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
    
    // Filter by project status if needed
    if (projectStatusFilter !== 'all') {
      filtered = filtered.filter(e => {
        const project = projectsMap.get(e.project_id)
        return project && project.status === projectStatusFilter
      })
    }
    
    // Build tree structure and flatten for display
    const tree = buildTree(filtered)
    return flattenTree(tree)
  }

  // Get paginated filtered expenses (will use startIndex and endIndex calculated below)
  const getPaginatedFilteredExpenses = () => {
    const allFiltered = getFilteredExpenses()
    // startIndex and endIndex are calculated below in the component body
    return allFiltered
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

  // Load user role
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          if (!userError && userData) {
            // Map role cũ sang role mới (giống như trong CreateProjectExpenseDialog)
            let mappedRole = userData.role
            if (userData.role === 'workshop_employee') {
              mappedRole = 'Supplier'
              console.log('🔄 Mapped workshop_employee to Supplier')
            }
            
            setUserRole(mappedRole || 'employee')
            console.log('✅ Loaded user role:', mappedRole)
          }
        }
      } catch (err) {
        console.error('Error loading user role:', err)
      }
    }
    
    loadUserRole()
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
          .select('id, name, project_code, status'),
      ])

      if (quotesRes.error) throw quotesRes.error
      if (actualRes.error) throw actualRes.error
      if (projectsRes.error) throw projectsRes.error

      // After fetching projectsRes
      setProjectsMap(new Map(projectsRes.data.map(p => [p.id, p])))
      setProjectsList(projectsRes.data || [])

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
      // Planned: cộng tất cả
      if (exp.category === 'planned') {
        acc[key].planned += exp.planned_amount
      } else {
        // Actual: chỉ cộng parent (id_parent null)
        if (!exp.id_parent) {
          acc[key].actual += exp.actual_amount
        }
      }
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

  // Approve actual expense (set status to approved)
  const handleApproveActual = async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId)
    if (!expense || !canApproveActual(expense)) return
    
    if (window.confirm('Duyệt chi phí thực tế này?')) {
      try {
        const { error } = await supabase
          .from('project_expenses')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', expenseId)
        if (error) throw error
        await fetchProjectExpenses()
      } catch (e) {
        console.error('Approve actual expense failed:', e)
        setError((e as Error).message)
      }
    }
  }

  const handleCreateExpense = () => {
    setShowCreateModal(true)
    onCreateExpense()
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
    const matchesSearch = !searchTerm || 
      expense.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesView = viewMode === 'all' || expense.category === viewMode
    
    const matchesProject = selectedProjectId === 'all' || expense.project_id === selectedProjectId
    
    const matchesProjectStatus = projectStatusFilter === 'all' || (() => {
      const project = projectsMap.get(expense.project_id)
      return project && project.status === projectStatusFilter
    })()
    
    return matchesSearch && matchesView && matchesProject && matchesProjectStatus
  })

  // Pagination calculations - use getFilteredExpenses for accurate count
  const allFilteredExpenses = getFilteredExpenses()
  const totalPages = Math.ceil(allFilteredExpenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [viewMode, selectedProjectId, projectStatusFilter, searchTerm])

  // Calculate summary statistics
  const totalPlanned = expenses
    .filter(e => e.category === 'planned')
    .reduce((sum, e) => sum + e.planned_amount, 0)
  // Thực tế: chỉ tính các chi phí đối tượng cha (id_parent null)
  const totalActual = expenses
    .filter(e => e.category === 'actual' && !e.id_parent)
    .reduce((sum, e) => sum + e.actual_amount, 0)
  const totalVariance = totalActual - totalPlanned
  const variancePercentage = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0

  const formatProjects = (expenses: ProjectExpense[]) => {
    const projectTotals = expenses.reduce((acc: Record<string, { planned: number; actual: number }>, expense) => {
      const { project_id, planned_amount, actual_amount } = expense
      if (!acc[project_id]) {
        acc[project_id] = { planned: 0, actual: 0 }
      }
      // Planned giữ nguyên
      acc[project_id].planned += planned_amount
      // Actual: chỉ cộng khi là đối tượng cha
      if (!expense.id_parent) {
        acc[project_id].actual += actual_amount
      }
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

  const projectDisplay = formatProjects(selectedProjectId === 'all' ? expenses : expenses.filter(e => e.project_id === selectedProjectId))

return (
  <div className="space-y-6">
    {/* Action Buttons */}
    <div className="flex justify-end space-x-2" data-tour-id="expenses-list-header">
      {viewMode === 'planned' && (
        <button
          onClick={() => startApproveExpenseTour()}
          disabled={isApproveExpenseTourRunning}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
            isApproveExpenseTourRunning
              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
              : 'text-white bg-green-600 hover:bg-green-700'
          }`}
          title="Bắt đầu hướng dẫn duyệt chi phí kế hoạch"
        >
          <CircleHelp className="h-4 w-4" />
          <span>Hướng dẫn duyệt</span>
        </button>
      )}
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

    {/* View Mode Tabs and Project Filter */}
    <div className="flex items-center justify-between flex-wrap gap-4">
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
      
      <div className="flex space-x-2">
        {/* Project Filter */}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả dự án</option>
          {projectsList.map((project) => (
            <option key={project.id} value={project.id}>
              {project.project_code ? `${project.project_code} - ` : ''}{project.name}
            </option>
          ))}
        </select>
        
        {/* Project Status Filter */}
        <select
          value={projectStatusFilter}
          onChange={(e) => setProjectStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PROJECT_STATUS_FILTER_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
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
        <div className="overflow-x-auto" data-tour-id="expenses-list">
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
                {/* Thao tác - chỉ hiển thị khi không phải tab "Tất cả" */}
                {viewMode !== 'all' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
                )}
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
                  {/* Thao tác - chỉ hiển thị khi không phải tab "Tất cả" */}
                  {viewMode !== 'all' && (
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
                  )}
                </tr>
                ))
              ) : (
                // Show individual expense items for 'planned' or 'actual' view
                getPaginatedFilteredExpenses().slice(startIndex, endIndex).map((expense) => (
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
                                data-tour-id={`approve-expense-button-${expense.id}`}
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
                            {canApproveActual(expense) && (
                              <button 
                                onClick={() => handleApproveActual(expense.id)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Duyệt chi phí thực tế"
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
          
          {/* Pagination Controls */}
          {allFilteredExpenses.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Hiển thị {startIndex + 1} - {Math.min(endIndex, allFilteredExpenses.length)} trong tổng số {allFilteredExpenses.length} chi phí
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Trước
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
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
