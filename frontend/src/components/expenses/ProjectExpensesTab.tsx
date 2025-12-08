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
  CircleHelp,
  Mail,
  Download,
  Send
} from 'lucide-react'
import CreateProjectExpenseDialog from './CreateProjectExpenseDialog'
import CreateExpenseObjectDialog from './CreateExpenseObjectDialog'
import ExpenseRestoreButton from './ExpenseRestoreButton'
import ExpensePreviewModal from './ExpensePreviewModal'
import ExpensePDFPreviewModal from './ExpensePDFPreviewModal'
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
  notes?: string
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
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all') // Mặc định: tất cả trạng thái (đang cố định, không lọc)
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
        // Helper function to extract file path from storage URL
        const extractFilePathFromUrl = (url: string | null | undefined): string | null => {
          if (!url) return null
          try {
            const match = url.match(/\/storage\/v1\/object\/[^\/]+\/(.+)$/)
            if (match && match[1]) {
              return match[1]
            }
          } catch (e) {
            console.warn('Failed to extract file path from URL:', url, e)
          }
          return null
        }

        // Helper function to delete file from storage
        const deleteFileFromStorage = async (filePath: string): Promise<void> => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) {
              console.warn('No session token, skipping file deletion')
              return
            }

            const parts = filePath.split('/')
            const filename = parts.pop() || ''
            const folderPath = parts.join('/')

            const response = await fetch(`/api/uploads/${folderPath}/${encodeURIComponent(filename)}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            })

            if (!response.ok) {
              console.warn(`Failed to delete file ${filePath}:`, await response.text())
            }
          } catch (e) {
            console.warn('Error deleting file from storage:', e)
          }
        }

        // Helper function to delete receipt file for an expense
        const deleteExpenseReceipt = async (expenseData: any): Promise<void> => {
          if (expenseData?.receipt_url) {
            const filePath = extractFilePathFromUrl(expenseData.receipt_url)
            if (filePath) {
              await deleteFileFromStorage(filePath)
            }
          }
        }

        if (isPlanned) {
          // Delete receipt file before deleting expense
          await deleteExpenseReceipt(expense)

          // For planned expenses, just delete the single expense
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', expenseId)

          if (error) throw error
        } else {
          // For actual expenses, implement cascade delete
          console.log('🗑️ Deleting expense with cascade:', expenseId)

          // Get all child expenses to delete their receipt files
          const childExpenses = expenses.filter(e => e.id_parent === expenseId)
          
          // Delete receipt files for all child expenses
          for (const childExpense of childExpenses) {
            await deleteExpenseReceipt(childExpense)
          }

          // Delete receipt file for parent expense
          await deleteExpenseReceipt(expense)

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
  const [showExpenseObjectModal, setShowExpenseObjectModal] = useState(false)
  const [editExpense, setEditExpense] = useState<{ id: string; category: 'planned' | 'actual' } | null>(null)
  const [createExpenseCategory, setCreateExpenseCategory] = useState<'planned' | 'actual'>('planned')
  const [showExpensePreviewModal, setShowExpensePreviewModal] = useState(false)
  const [previewExpenseId, setPreviewExpenseId] = useState<string | null>(null)

  // PDF Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  // Define projectsMap at the top of the component after fetching data
  const [projectsMap, setProjectsMap] = useState(new Map())
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string; project_code?: string; status?: string }>>([])
  const [teamMembers, setTeamMembers] = useState<Array<{id: string, name: string, email?: string, user_id?: string, project_id?: string, project_ids?: string[], hasProjects?: boolean}>>([])
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>('all')

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

    // KHÔNG lọc theo trạng thái dự án nữa: luôn hiển thị tất cả trạng thái

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
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      // Lấy user đang đăng nhập
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Lấy thông tin user từ bảng users
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', authUser.id)
        .single()

      if (!userData) return

      // Lấy danh sách project_ids mà user có quyền truy cập
      let allowedProjectIds: string[] = []
      
      // Nếu là admin hoặc accountant, xem tất cả dự án
      if (userData.role === 'admin' || userData.role === 'accountant') {
        const { data: allProjects } = await supabase
          .from('projects')
          .select('id')
        allowedProjectIds = (allProjects || []).map(p => p.id)
      } else {
        // Lấy project_ids từ project_team theo user_id hoặc email
        // Thử query riêng biệt để đảm bảo chính xác
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
        
        // Gộp kết quả từ cả hai query
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

      // Lấy tất cả nhân viên từ employees và users
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

      // Loại bỏ trùng lặp theo email
      const uniqueEmployees = Array.from(
        new Map(allEmployees.map(emp => [emp.email, emp])).values()
      )

      // Lấy thành viên dự án từ các dự án mà user có quyền
      const { data: teamMembersData } = await supabase
        .from('project_team')
        .select('id, name, email, project_id, user_id')
        .eq('status', 'active')
        .in('project_id', allowedProjectIds)

      // Tạo map từ user_id -> employee_id
      const userIdToEmployeeIdMap = new Map<string, string>()
      for (const emp of uniqueEmployees) {
        if (emp.user_id && emp.type === 'employee') {
          userIdToEmployeeIdMap.set(emp.user_id, emp.id)
        }
      }

      // Tạo map để match: user_id -> employee_id -> name -> email -> project_ids
      const memberProjectMap = new Map<string, string[]>()
      ;(teamMembersData || []).forEach((member: any) => {
        // Ưu tiên: user_id -> employee_id (từ user_id) -> name -> email
        const keys: string[] = []
        
        if (member.user_id) {
          keys.push(`user_${member.user_id}`)
          // Tìm employee_id từ user_id
          const empId = userIdToEmployeeIdMap.get(member.user_id)
          if (empId) {
            keys.push(`emp_${empId}`)
          }
        }
        if (member.name) {
          // Normalize name: lowercase, trim, remove extra spaces
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

      // Hiển thị TẤT CẢ nhân viên trong dropdown
      // Nhưng chỉ lọc theo project_ids của những nhân viên có trong project_team của các dự án user có quyền
      const allMembersWithProjects = uniqueEmployees
        .map(emp => {
          // Lấy project_ids theo thứ tự ưu tiên: user_id -> employee_id -> name -> email
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
          
          // Lọc project_ids: chỉ giữ những project_ids mà user đang đăng nhập có quyền
          const filteredProjectIds = projectIds.filter(pid => allowedProjectIds.includes(pid))
          
          return {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            user_id: emp.user_id,
            project_ids: [...new Set(filteredProjectIds)], // Chỉ giữ project_ids mà user có quyền
            project_id: filteredProjectIds[0] || '',
            hasProjects: filteredProjectIds.length > 0
          }
        })

      // CHỈ hiển thị những nhân viên có trong project_team của các dự án user có quyền
      const filteredMembers = allMembersWithProjects.filter(m => m.hasProjects)
      setTeamMembers(filteredMembers)
    } catch (error) {
      console.error('Error fetching team members:', error)
      setTeamMembers([])
    }
  }

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
          .select('id, project_id, expense_code, description, amount, currency, expense_date, status, id_parent, notes, created_at, updated_at')
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
          notes: e.notes || '',
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

  // Hiển thị tiền tệ dạng 1.234.567 (không kèm ký hiệu tiền tệ),
  // dùng chung cho Đơn giá / Thành tiền ở chi phí dự án
  const formatCurrency = (amount: number) => {
    if (!amount) return '0'
    return new Intl.NumberFormat('vi-VN').format(amount)
  }

  // Handle open preview modal for planned expense
  const handleOpenPreview = (expenseId: string) => {
    console.log('🔍 Opening preview modal for expense:', expenseId)
    setPreviewExpenseId(expenseId)
    setShowExpensePreviewModal(true)
    console.log('✅ Preview modal state set to true')
  }

  // Handle export PDF for planned expense (moved to preview modal)
  const handleExportPDF = async (expenseId: string) => {
    try {
      setLoading(true)

      // 1. Fetch full expense data from project_expenses_quote
      const { data: expenseData, error: fetchError } = await supabase
        .from('project_expenses_quote')
        .select(`
          *,
          projects:project_id(name, project_code),
          customers:customer_id(name)
        `)
        .eq('id', expenseId)
        .single()

      if (fetchError || !expenseData) {
        throw new Error('Không tìm thấy dữ liệu chi phí kế hoạch')
      }

      const projectId = expenseData.project_id
      if (!projectId) {
        throw new Error('Chi phí kế hoạch không có dự án liên kết')
      }

      // 2. Fetch quote data from quotes table (based on project_id)
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (quotesError) {
        console.warn('Warning: Could not fetch quote data:', quotesError)
      }

      const quoteData = quotesData && quotesData.length > 0 ? quotesData[0] : null
      const quoteId = quoteData?.id

      // 3. Fetch quote items from quote_items table with product names
      let quoteItems: any[] = []
      if (quoteId) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('quote_items')
          .select(`
            *,
            products:product_service_id(id, name, description)
          `)
          .eq('quote_id', quoteId)
          .order('created_at', { ascending: true })

        if (itemsError) {
          console.warn('Warning: Could not fetch quote items:', itemsError)
        } else {
          quoteItems = itemsData || []
        }
      }

      // 4. Fetch expense objects
      const expenseObjectIds = expenseData.expense_object_columns || []
      let expenseObjects: any[] = []
      if (expenseObjectIds.length > 0) {
        const { data: objectsData, error: objectsError } = await supabase
          .from('expense_objects')
          .select('id, name, level, parent_id')
          .in('id', expenseObjectIds)

        if (objectsError) {
          console.warn('Warning: Could not fetch expense objects:', objectsError)
        } else {
          expenseObjects = objectsData || []
        }
      }

      // 5. Fetch product names for invoice_items if they have product_service_id
      const fetchProductNames = async (items: any[]) => {
        const productIds = items
          .map(item => item.product_service_id || item.product_id)
          .filter(id => id)

        if (productIds.length === 0) return {}

        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, description')
          .in('id', productIds)

        const productMap: { [key: string]: { name: string; description?: string } } = {}
        if (productsData) {
          productsData.forEach(product => {
            productMap[product.id] = {
              name: product.name,
              description: product.description || ''
            }
          })
        }
        return productMap
      }

      // 6. Prepare invoice items - use expense invoice_items if available, otherwise use quote_items
      let invoiceItems: any[] = []
      if (expenseData.invoice_items && Array.isArray(expenseData.invoice_items) && expenseData.invoice_items.length > 0) {
        // Fetch product names for expense invoice_items
        const productMap = await fetchProductNames(expenseData.invoice_items)

        // Use invoice_items from expense
        invoiceItems = expenseData.invoice_items.map((item: any) => {
          const productId = item.product_service_id || item.product_id
          const productInfo = productId ? productMap[productId] : null

          return {
            section: item.section || '',
            productName: productInfo?.name || item.productName || item.name_product || '',
            description: productInfo?.description || item.description || '',
            unitPrice: Number(item.unitPrice || item.unit_price || 0),
            quantity: Number(item.quantity || 0),
            unit: item.unit || 'cái',
            area: item.area ? Number(item.area) : undefined,
            lineTotal: Number(item.lineTotal || item.line_total || item.total_price || 0),
            components: item.components || {}
          }
        })
      } else if (quoteItems.length > 0) {
        // Fallback to quote_items - get product names from join or fetch separately
        invoiceItems = quoteItems.map((item: any) => {
          // Try to get product name from joined products relation
          const product = item.products
          const productName = Array.isArray(product)
            ? (product[0]?.name || '')
            : (product?.name || '')

          return {
            section: '',
            productName: productName || item.name_product || item.product_name || '',
            description: item.products?.description || item.description || '',
            unitPrice: Number(item.unit_price || item.price || 0),
            quantity: Number(item.quantity || item.qty || 0),
            unit: item.unit || 'cái',
            area: item.area ? Number(item.area) : undefined,
            lineTotal: Number(item.total_price || item.subtotal || item.total || 0),
            components: item.product_components || item.components || {}
          }
        })
      }

      // Log invoice items for debugging
      console.log('📦 Invoice items prepared:', {
        count: invoiceItems.length,
        hasExpenseItems: expenseData.invoice_items?.length > 0,
        hasQuoteItems: quoteItems.length > 0,
        sample: invoiceItems[0]
      })

      // Warn if no invoice items found
      if (!invoiceItems || invoiceItems.length === 0) {
        console.warn('⚠️ No invoice items found for expense:', expenseId)
        console.warn('  - Expense invoice_items:', expenseData.invoice_items)
        console.warn('  - Quote items:', quoteItems)
      }

      // 7. Prepare data for PDF export
      const project = expenseData.projects as any
      const customer = expenseData.customers as any
      const projectName = Array.isArray(project) ? project[0]?.name : (project?.name || '')
      const projectCode = Array.isArray(project) ? project[0]?.project_code : (project?.project_code || '')
      const customerName = Array.isArray(customer) ? customer[0]?.name : (customer?.name || '')

      // 8. Get company info from database (company_settings table)
      let companyInfo: any = {}

      // Try to fetch from company_settings table first
      const { data: companyData, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()

      if (!companyError && companyData) {
        console.log('✅ Fetched company settings from database:', companyData)

        // Fetch logo and convert to base64 if URL exists
        let logoBase64 = ''
        if (companyData.company_logo_url) {
          try {
            const response = await fetch(companyData.company_logo_url)
            const blob = await response.blob()
            logoBase64 = await new Promise((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
            console.log('✅ Converted company logo to base64')
          } catch (err) {
            console.warn('⚠️ Could not fetch company logo:', err)
          }
        }

        companyInfo = {
          company_name: companyData.company_name,
          company_showroom: companyData.company_showroom,
          company_factory: companyData.company_factory,
          company_website: companyData.company_website,
          company_hotline: companyData.company_hotline,
          company_logo_url: companyData.company_logo_url,
          company_logo_base64: logoBase64
        }
      } else {
        console.warn('⚠️ Could not fetch company settings, using quote data as fallback')

        // Fallback to quote data if available
        if (quoteData) {
          companyInfo = {
            company_name: quoteData.company_name || 'Công ty TNHH Cửa Phúc Đạt',
            company_showroom: quoteData.company_showroom || '',
            company_factory: quoteData.company_factory || '',
            company_website: quoteData.company_website || '',
            company_hotline: quoteData.company_hotline || '',
            company_logo_url: quoteData.company_logo_url || '',
            company_logo_base64: quoteData.company_logo_base64 || ''
          }
        }
      }


      // 8. Import and use export function
      const { exportExpenseToPDF } = await import('@/utils/exportExpensePDF')

      await exportExpenseToPDF({
        id: expenseData.id,
        expense_code: expenseData.expense_code || '',
        description: expenseData.description || '',
        amount: expenseData.amount || 0,
        currency: expenseData.currency || 'VND',
        expense_date: expenseData.expense_date || new Date().toISOString(),
        project_name: projectName,
        project_code: projectCode,
        customer_name: customerName,
        notes: expenseData.notes || '',
        invoice_items: invoiceItems,
        expense_objects: expenseObjects,
        expense_object_totals: expenseData.expense_object_totals || {},
        company_info: companyInfo
      })

      // Update expense notes to mark PDF as sent
      const currentNotes = expenseData.notes || ''
      const updatedNotes = currentNotes.includes('[PDF_SENT]')
        ? currentNotes
        : `${currentNotes}\n[PDF_SENT]`.trim()

      await supabase
        .from('project_expenses_quote')
        .update({ notes: updatedNotes })
        .eq('id', expenseId)

      // Refresh data
      await fetchProjectExpenses()

      alert('Xuất PDF thành công!')
    } catch (error: any) {
      console.error('Error exporting PDF:', error)
      alert(`Lỗi khi xuất PDF: ${error.message || 'Lỗi không xác định'}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle preview PDF for planned expense
  const handlePreviewPDF = async (expenseId: string) => {
    try {
      setLoading(true)

      // Fetch data using the same logic as handleExportPDF
      const pdfData = await fetchExpenseDataForPDF(expenseId)

      // Set preview data and open modal
      setPreviewData(pdfData)
      setPreviewModalOpen(true)
    } catch (error: any) {
      console.error('Error preparing PDF preview:', error)
      alert(`Lỗi khi xem trước PDF: ${error.message || 'Lỗi không xác định'}`)
    } finally {
      setLoading(false)
    }
  }

  // Extract PDF data fetching logic to reuse in both export and preview
  const fetchExpenseDataForPDF = async (expenseId: string) => {
    // 1. Fetch full expense data from project_expenses_quote
    const { data: expenseData, error: fetchError } = await supabase
      .from('project_expenses_quote')
      .select(`
        *,
        projects:project_id(name, project_code),
        customers:customer_id(name)
      `)
      .eq('id', expenseId)
      .single()

    if (fetchError || !expenseData) {
      throw new Error('Không tìm thấy dữ liệu chi phí kế hoạch')
    }

    const projectId = expenseData.project_id
    if (!projectId) {
      throw new Error('Chi phí kế hoạch không có dự án liên kết')
    }

    // 2. Fetch quote data from quotes table (based on project_id)
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (quotesError) {
      console.warn('Warning: Could not fetch quote data:', quotesError)
    }

    const quoteData = quotesData && quotesData.length > 0 ? quotesData[0] : null
    const quoteId = quoteData?.id

    // 3. Fetch quote items from quote_items table with product names
    let quoteItems: any[] = []
    if (quoteId) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select(`
          *,
          products:product_service_id(id, name, description)
        `)
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true })

      if (itemsError) {
        console.warn('Warning: Could not fetch quote items:', itemsError)
      } else {
        quoteItems = itemsData || []
      }
    }

    // 4. Fetch expense objects
    const expenseObjectIds = expenseData.expense_object_columns || []
    let expenseObjects: any[] = []
    if (expenseObjectIds.length > 0) {
      const { data: objectsData, error: objectsError } = await supabase
        .from('expense_objects')
        .select('id, name, level, parent_id')
        .in('id', expenseObjectIds)

      if (objectsError) {
        console.warn('Warning: Could not fetch expense objects:', objectsError)
      } else {
        expenseObjects = objectsData || []
      }
    }

    // 5. Fetch product names for invoice_items if they have product_service_id
    const fetchProductNames = async (items: any[]) => {
      const productIds = items
        .map(item => item.product_service_id || item.product_id)
        .filter(id => id)

      if (productIds.length === 0) return {}

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, description')
        .in('id', productIds)

      const productMap: { [key: string]: { name: string; description?: string } } = {}
      if (productsData) {
        productsData.forEach(product => {
          productMap[product.id] = {
            name: product.name,
            description: product.description || ''
          }
        })
      }
      return productMap
    }

    // 6. Prepare invoice items - use expense invoice_items if available, otherwise use quote_items
    let invoiceItems: any[] = []
    if (expenseData.invoice_items && Array.isArray(expenseData.invoice_items) && expenseData.invoice_items.length > 0) {
      // Fetch product names for expense invoice_items
      const productMap = await fetchProductNames(expenseData.invoice_items)

      // Use invoice_items from expense
      invoiceItems = expenseData.invoice_items.map((item: any) => {
        const productId = item.product_service_id || item.product_id
        const productInfo = productId ? productMap[productId] : null

        return {
          section: item.section || '',
          productName: productInfo?.name || item.productName || item.name_product || '',
          description: productInfo?.description || item.description || '',
          unitPrice: Number(item.unitPrice || item.unit_price || 0),
          quantity: Number(item.quantity || 0),
          unit: item.unit || 'cái',
          area: item.area ? Number(item.area) : undefined,
          lineTotal: Number(item.lineTotal || item.line_total || item.total_price || 0),
          components: item.components || {}
        }
      })
    } else if (quoteItems.length > 0) {
      // Fallback to quote_items - get product names from join or fetch separately
      invoiceItems = quoteItems.map((item: any) => {
        // Try to get product name from joined products relation
        const product = item.products
        const productName = Array.isArray(product)
          ? (product[0]?.name || '')
          : (product?.name || '')

        return {
          section: '',
          productName: productName || item.name_product || item.product_name || '',
          description: item.products?.description || item.description || '',
          unitPrice: Number(item.unit_price || item.price || 0),
          quantity: Number(item.quantity || item.qty || 0),
          unit: item.unit || 'cái',
          area: item.area ? Number(item.area) : undefined,
          lineTotal: Number(item.total_price || item.subtotal || item.total || 0),
          components: item.product_components || item.components || {}
        }
      })
    }

    // Log invoice items for debugging
    console.log('📦 Invoice items prepared:', {
      count: invoiceItems.length,
      hasExpenseItems: expenseData.invoice_items?.length > 0,
      hasQuoteItems: quoteItems.length > 0,
      sample: invoiceItems[0]
    })

    // Warn if no invoice items found
    if (!invoiceItems || invoiceItems.length === 0) {
      console.warn('⚠️ No invoice items found for expense:', expenseId)
      console.warn('  - Expense invoice_items:', expenseData.invoice_items)
      console.warn('  - Quote items:', quoteItems)
    }

    // 7. Prepare data for PDF export
    const project = expenseData.projects as any
    const customer = expenseData.customers as any
    const projectName = Array.isArray(project) ? project[0]?.name : (project?.name || '')
    const projectCode = Array.isArray(project) ? project[0]?.project_code : (project?.project_code || '')
    const customerName = Array.isArray(customer) ? customer[0]?.name : (customer?.name || '')

    // 8. Get company info from database (company_settings table)
    let companyInfo: any = {}

    // Try to fetch from company_settings table first
    const { data: companyData, error: companyError } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single()

    if (!companyError && companyData) {
      console.log('✅ Fetched company settings from database:', companyData)

      // Fetch logo and convert to base64 if URL exists
      let logoBase64 = ''
      if (companyData.company_logo_url) {
        try {
          const response = await fetch(companyData.company_logo_url)
          const blob = await response.blob()
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          })
          console.log('✅ Converted company logo to base64')
        } catch (err) {
          console.warn('⚠️ Could not fetch company logo:', err)
        }
      }

      companyInfo = {
        company_name: companyData.company_name,
        company_showroom: companyData.company_showroom,
        company_factory: companyData.company_factory,
        company_website: companyData.company_website,
        company_hotline: companyData.company_hotline,
        company_logo_url: companyData.company_logo_url,
        company_logo_base64: logoBase64
      }
    } else {
      console.warn('⚠️ Could not fetch company settings, using quote data as fallback')

      // Fallback to quote data if available
      if (quoteData) {
        companyInfo = {
          company_name: quoteData.company_name || 'Công ty TNHH Cửa Phúc Đạt',
          company_showroom: quoteData.company_showroom || '',
          company_factory: quoteData.company_factory || '',
          company_website: quoteData.company_website || '',
          company_hotline: quoteData.company_hotline || '',
          company_logo_url: quoteData.company_logo_url || '',
          company_logo_base64: quoteData.company_logo_base64 || ''
        }
      }
    }

    return {
      id: expenseData.id,
      expense_code: expenseData.expense_code || '',
      description: expenseData.description || '',
      amount: expenseData.amount || 0,
      currency: expenseData.currency || 'VND',
      expense_date: expenseData.expense_date || new Date().toISOString(),
      project_name: projectName,
      project_code: projectCode,
      customer_name: customerName,
      notes: expenseData.notes || '',
      invoice_items: invoiceItems,
      expense_objects: expenseObjects,
      expense_object_totals: expenseData.expense_object_totals || {},
      company_info: companyInfo
    }
  }

  // Handle send email for planned expense
  const handleSendEmail = async (expenseId: string) => {
    try {
      setLoading(true)

      // Fetch expense data
      const { data: expenseData, error: fetchError } = await supabase
        .from('project_expenses_quote')
        .select('*')
        .eq('id', expenseId)
        .single()

      if (fetchError || !expenseData) {
        throw new Error('Không tìm thấy dữ liệu chi phí kế hoạch')
      }

      // TODO: Implement email sending with backend API
      // For now, just mark as sent
      const currentNotes = expenseData.notes || ''
      const updatedNotes = currentNotes.includes('[EMAIL_SENT]')
        ? currentNotes
        : `${currentNotes}\n[EMAIL_SENT]`.trim()

      await supabase
        .from('project_expenses_quote')
        .update({ notes: updatedNotes })
        .eq('id', expenseId)

      // Refresh data
      await fetchProjectExpenses()

      alert('Gửi email thành công! (Tính năng đang được phát triển)')
    } catch (error: any) {
      console.error('Error sending email:', error)
      alert(`Lỗi khi gửi email: ${error.message || 'Lỗi không xác định'}`)
    } finally {
      setLoading(false)
    }
  }

  // Check if expense has been exported or emailed
  const hasBeenExportedOrEmailed = (expense: ProjectExpense): boolean => {
    const notes = expense.notes || ''
    return notes.includes('[PDF_SENT]') || notes.includes('[EMAIL_SENT]')
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

  // Handle auto-trigger actions from query parameters
  const actionTriggeredRef = useRef(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && expenses.length > 0 && !actionTriggeredRef.current) {
      const urlParams = new URLSearchParams(window.location.search)
      const action = urlParams.get('action')
      const projectId = urlParams.get('project')
      
      if (action && projectId && (action === 'export-pdf' || action === 'send' || action === 'approve' || action === 'convert')) {
        // Find first planned expense for this project
        const projectExpense = expenses.find(e => 
          e.project_id === projectId && e.category === 'planned'
        )
        
        if (projectExpense) {
          actionTriggeredRef.current = true
          if (action === 'export-pdf' || action === 'send') {
            // Auto-click Send button (icon máy bay) - opens preview modal
            setTimeout(() => {
              handleOpenPreview(projectExpense.id)
            }, 800)
          } else if (action === 'approve' || action === 'convert') {
            // Auto-click Approve button (icon $) - converts to actual expense
            setTimeout(() => {
              handleApprove(projectExpense.id)
            }, 800)
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, selectedProjectId])

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = !searchTerm ||
      expense.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesView = viewMode === 'all' || expense.category === viewMode

    const matchesProject = selectedProjectId === 'all' || expense.project_id === selectedProjectId

    // Filter by team member
    const matchesTeamMember = selectedTeamMemberId === 'all' || (() => {
      const selectedMember = teamMembers.find(m => {
        return m.id === selectedTeamMemberId || m.user_id === selectedTeamMemberId
      })
      if (selectedMember) {
        if (selectedMember.project_ids && selectedMember.project_ids.length > 0) {
          return selectedMember.project_ids.includes(expense.project_id)
        } else {
          // Nếu nhân viên không có project trong danh sách allowed, không hiển thị gì
          return false
        }
      }
      return true
    })()

    // Không lọc theo trạng thái dự án -> luôn true
    const matchesProjectStatus = true

    return matchesSearch && matchesView && matchesProject && matchesTeamMember && matchesProjectStatus
  })

  // Pagination calculations - use getFilteredExpenses for accurate count
  const allFilteredExpenses = getFilteredExpenses()
  const totalPages = Math.ceil(allFilteredExpenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  // Reset to page 1 khi filter thay đổi (không còn phụ thuộc trạng thái dự án)
  useEffect(() => {
    setCurrentPage(1)
  }, [viewMode, selectedProjectId, selectedTeamMemberId, searchTerm])

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
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${isApproveExpenseTourRunning
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
            className={`px-4 py-2 rounded-lg ${viewMode === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setViewMode('planned')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'planned'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            Kế hoạch
          </button>
          <button
            onClick={() => setViewMode('actual')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'actual'
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

          <select
            value={selectedTeamMemberId}
            onChange={(e) => setSelectedTeamMemberId(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả thành viên</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.user_id || member.id}>
                {member.name} {member.email ? `(${member.email})` : ''}
              </option>
            ))}
          </select>

          {/* Project Status Filter - luôn hiển thị tất cả trạng thái, nên ẩn dropdown này */}
          {/* <select
          value={projectStatusFilter}
          onChange={(e) => setProjectStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PROJECT_STATUS_FILTER_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select> */}
        </div>
      </div>

      {/* Summary Cards - Show based on viewMode */}
      <div className={`grid grid-cols-1 gap-4 ${viewMode === 'all' ? 'md:grid-cols-4' :
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
          className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'all'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setViewMode('planned')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'planned'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Kế hoạch
        </button>
        <button
          onClick={() => setViewMode('actual')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${viewMode === 'actual'
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
                  <tr key={expense.id} className={`hover:bg-gray-50 ${expense.level && expense.level > 0
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
                            <div className={`text-sm font-medium ${expense.level && expense.level > 0
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
                            <div className={`text-xs mt-1 ${expense.level && expense.level > 0
                              ? 'text-orange-600' // Child expenses - orange color
                              : 'text-gray-500'   // Parent expenses - normal color
                              }`}>
                              Mã: {expense.id.substring(0, 8)}...
                            </div>
                            <div className={`text-xs ${expense.level && expense.level > 0
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
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${expense.level && expense.level > 0
                        ? 'text-orange-600' // Child expenses - orange color
                        : 'text-blue-600'   // Parent expenses - blue color
                        }`}>
                        {formatCurrency(expense.planned_amount)}
                      </td>
                    )}
                    {/* Show only actual amount in 'actual' view */}
                    {viewMode === 'actual' && (
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${expense.level && expense.level > 0
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
                            {/* Preview/Edit button - opens preview modal for pending expenses */}
                            {expense.status === 'pending' && (
                              <button 
                                onClick={() => handleOpenPreview(expense.id)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Xem và chỉnh sửa trước khi xuất PDF hoặc gửi email"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            {/* Approve button - only visible after PDF export or email sent */}
                            {canApprove(expense) && hasBeenExportedOrEmailed(expense) && (
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
                  className={`px-3 py-1 rounded-md text-sm ${currentPage === 1
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
                      className={`px-3 py-1 rounded-md text-sm ${currentPage === page
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
                  className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages
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

      {/* Expense Preview Modal */}
      <ExpensePreviewModal
        isOpen={showExpensePreviewModal}
        onClose={() => {
          setShowExpensePreviewModal(false)
          setPreviewExpenseId(null)
        }}
        expenseId={previewExpenseId || ''}
        onSuccess={() => {
          fetchProjectExpenses()
        }}
      />
    </div>
  )
}
