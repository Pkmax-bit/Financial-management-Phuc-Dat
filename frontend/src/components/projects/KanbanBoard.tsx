"use client"

import React, { useEffect, useMemo, useState, useImperativeHandle, forwardRef } from 'react'
import KanbanColumn from './KanbanColumn'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CheckCircle, X, AlertTriangle, Plus, Edit2, Trash2, Settings, Tag, Filter, Users, Calendar, ChevronDown } from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete, projectCategoryApi } from '@/lib/api'
import ProjectCategoriesManager from './ProjectCategoriesManager'

type ProjectStatus = string

interface ProjectStatusItem {
  id: string
  name: string
  display_order: number
  description?: string
  color_class: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProjectItem {
  id: string
  name: string
  project_code: string
  description?: string
  customer_id?: string
  customer_name?: string
  manager_id?: string
  manager_name?: string
  manager_code?: string
  category_id?: string
  category_name?: string
  category_color?: string
  start_date?: string
  end_date?: string
  budget?: number
  actual_cost?: number
  billing_type?: 'fixed' | 'hourly' | 'milestone'
  hourly_rate?: number
  progress: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status: ProjectStatus
  status_id?: string
  created_at?: string
  updated_at?: string
}

interface KanbanBoardProps {
  onViewProject?: (project: ProjectItem) => void
  customerId?: string
  // Filter props controlled externally
  categoryFilter?: string
  customerFilter?: string
  dateFilter?: string
  startDate?: string
  endDate?: string
  onCategoryFilterChange?: (value: string) => void
  onCustomerFilterChange?: (value: string) => void
  onDateFilterChange?: (value: string) => void
  onStartDateChange?: (value: string) => void
  onEndDateChange?: (value: string) => void
}

export interface KanbanBoardRef {
  refresh: () => Promise<void>
}

const KanbanBoard = forwardRef<KanbanBoardRef, KanbanBoardProps>(({
  onViewProject,
  customerId,
  categoryFilter: externalCategoryFilter,
  customerFilter: externalCustomerFilter,
  dateFilter: externalDateFilter,
  startDate: externalStartDate,
  endDate: externalEndDate,
  onCategoryFilterChange,
  onCustomerFilterChange,
  onDateFilterChange,
  onStartDateChange,
  onEndDateChange
}, ref) => {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [statuses, setStatuses] = useState<ProjectStatusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggedProject, setDraggedProject] = useState<ProjectItem | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ProjectStatus | null>(null)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [showHoldDialog, setShowHoldDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false)
  const [pendingDrop, setPendingDrop] = useState<{project: ProjectItem, status: ProjectStatus} | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [draggedStatusId, setDraggedStatusId] = useState<string | null>(null)
  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null)
  const [isReorderingStatuses, setIsReorderingStatuses] = useState(false)
  const [editingStatus, setEditingStatus] = useState<ProjectStatusItem | null>(null)
  const [statusForm, setStatusForm] = useState({
    name: '',
    display_order: 0,
    description: '',
    color_class: 'bg-gray-100 text-gray-800'
  })
  const [selectedColor, setSelectedColor] = useState('#6b7280') // Default gray color
  const [showOrderConflictDialog, setShowOrderConflictDialog] = useState(false)
  const [conflictingStatus, setConflictingStatus] = useState<ProjectStatusItem | null>(null)
  const [pendingStatusData, setPendingStatusData] = useState<{isEdit: boolean, data: any} | null>(null)
  const [isShiftingStatuses, setIsShiftingStatuses] = useState(false)
  const [isDeletingStatus, setIsDeletingStatus] = useState(false)
  const [deletingStatusId, setDeletingStatusId] = useState<string | null>(null)
  const [projectInvoiceTotals, setProjectInvoiceTotals] = useState<Record<string, number>>({})
  const [projectQuoteTotals, setProjectQuoteTotals] = useState<Record<string, number>>({})
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  const [categoriesManagerInitialTab, setCategoriesManagerInitialTab] = useState<'categories' | 'flow-rules'>('categories')
  const [userRole, setUserRole] = useState<string>('')
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color?: string }>>([])
  const [showStatusManagerModal, setShowStatusManagerModal] = useState(false)
  const [selectedStatusForEdit, setSelectedStatusForEdit] = useState<ProjectStatusItem | null>(null)

  // Use external filter states or internal fallbacks
  const [internalCategoryFilter, setInternalCategoryFilter] = useState<string>('all')
  const [internalCustomerFilter, setInternalCustomerFilter] = useState<string>('all')
  const [internalDateFilter, setInternalDateFilter] = useState<string>('all')
  const [internalStartDate, setInternalStartDate] = useState<string>('')
  const [internalEndDate, setInternalEndDate] = useState<string>('')

  const categoryFilter = externalCategoryFilter ?? internalCategoryFilter
  const customerFilter = externalCustomerFilter ?? internalCustomerFilter
  const dateFilter = externalDateFilter ?? internalDateFilter
  const startDate = externalStartDate ?? internalStartDate
  const endDate = externalEndDate ?? internalEndDate

  const setCategoryFilter = onCategoryFilterChange ?? setInternalCategoryFilter
  const setCustomerFilter = onCustomerFilterChange ?? setInternalCustomerFilter
  const setDateFilter = onDateFilterChange ?? setInternalDateFilter
  const setStartDate = onStartDateChange ?? setInternalStartDate
  const setEndDate = onEndDateChange ?? setInternalEndDate
  const [filteredProjects, setFilteredProjects] = useState<ProjectItem[]>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false)
  const [showDatePickerDialog, setShowDatePickerDialog] = useState<boolean>(false)
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start')

  // Predefined color options with Tailwind classes
  const colorOptions = [
    // Neutral colors
    { name: 'Xám nhạt', bg: 'bg-gray-100', text: 'text-gray-800', hex: '#6b7280' },
    { name: 'Xám đậm', bg: 'bg-gray-200', text: 'text-gray-900', hex: '#4b5563' },
    { name: 'Xám xanh', bg: 'bg-slate-100', text: 'text-slate-800', hex: '#475569' },
    { name: 'Xám đá', bg: 'bg-stone-100', text: 'text-stone-800', hex: '#57534e' },
    { name: 'Xám kẽm', bg: 'bg-zinc-100', text: 'text-zinc-800', hex: '#52525b' },
    
    // Blue colors
    { name: 'Xanh dương', bg: 'bg-blue-100', text: 'text-blue-800', hex: '#3b82f6' },
    { name: 'Xanh dương đậm', bg: 'bg-blue-200', text: 'text-blue-900', hex: '#2563eb' },
    { name: 'Xanh ngọc', bg: 'bg-cyan-100', text: 'text-cyan-800', hex: '#06b6d4' },
    { name: 'Xanh ngọc đậm', bg: 'bg-cyan-200', text: 'text-cyan-900', hex: '#0891b2' },
    { name: 'Xanh bầu trời', bg: 'bg-sky-100', text: 'text-sky-800', hex: '#0ea5e9' },
    { name: 'Xanh indigo', bg: 'bg-indigo-100', text: 'text-indigo-800', hex: '#6366f1' },
    
    // Green colors
    { name: 'Xanh lá', bg: 'bg-green-100', text: 'text-green-800', hex: '#10b981' },
    { name: 'Xanh lá đậm', bg: 'bg-green-200', text: 'text-green-900', hex: '#059669' },
    { name: 'Xanh lá cây', bg: 'bg-emerald-100', text: 'text-emerald-800', hex: '#10b981' },
    { name: 'Xanh lá cây đậm', bg: 'bg-emerald-200', text: 'text-emerald-900', hex: '#059669' },
    { name: 'Xanh rêu', bg: 'bg-teal-100', text: 'text-teal-800', hex: '#14b8a6' },
    { name: 'Xanh rêu đậm', bg: 'bg-teal-200', text: 'text-teal-900', hex: '#0d9488' },
    { name: 'Xanh lá mạ', bg: 'bg-lime-100', text: 'text-lime-800', hex: '#84cc16' },
    
    // Yellow & Orange colors
    { name: 'Vàng', bg: 'bg-yellow-100', text: 'text-yellow-800', hex: '#f59e0b' },
    { name: 'Vàng đậm', bg: 'bg-yellow-200', text: 'text-yellow-900', hex: '#d97706' },
    { name: 'Vàng chanh', bg: 'bg-amber-100', text: 'text-amber-800', hex: '#f59e0b' },
    { name: 'Cam', bg: 'bg-orange-100', text: 'text-orange-800', hex: '#f97316' },
    { name: 'Cam đậm', bg: 'bg-orange-200', text: 'text-orange-900', hex: '#ea580c' },
    
    // Red & Pink colors
    { name: 'Đỏ', bg: 'bg-red-100', text: 'text-red-800', hex: '#ef4444' },
    { name: 'Đỏ đậm', bg: 'bg-red-200', text: 'text-red-900', hex: '#dc2626' },
    { name: 'Hồng', bg: 'bg-pink-100', text: 'text-pink-800', hex: '#ec4899' },
    { name: 'Hồng đậm', bg: 'bg-pink-200', text: 'text-pink-900', hex: '#db2777' },
    { name: 'Hồng đào', bg: 'bg-rose-100', text: 'text-rose-800', hex: '#f43f5e' },
    
    // Purple & Violet colors
    { name: 'Tím', bg: 'bg-purple-100', text: 'text-purple-800', hex: '#a855f7' },
    { name: 'Tím đậm', bg: 'bg-purple-200', text: 'text-purple-900', hex: '#9333ea' },
    { name: 'Tím violet', bg: 'bg-violet-100', text: 'text-violet-800', hex: '#8b5cf6' },
    { name: 'Tím fuchsia', bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', hex: '#d946ef' },
  ]

  // Convert hex to Tailwind class
  const getColorClassFromHex = (hex: string) => {
    const color = colorOptions.find(c => c.hex === hex)
    return color ? `${color.bg} ${color.text}` : 'bg-gray-100 text-gray-800'
  }

  // Check if form is valid
  const isFormValid = statusForm.name.trim().length > 0 && statusForm.display_order > 0
  const router = useRouter()

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get current user role
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single()
        if (userData) {
          setUserRole(userData.role)
        }
      }
      
      // Fetch statuses - will be filtered by category if needed (handled in separate useEffect)
      // Get statuses data for mapping projects
      let statusesDataForMapping = statuses
      if (statuses.length === 0) {
        // If statuses not loaded yet, fetch them
        let url = '/api/projects/statuses'
        if (categoryFilter && categoryFilter !== 'all') {
          url += `?category_id=${categoryFilter}`
        }
        statusesDataForMapping = await apiGet(url) || []
      }

      // Then fetch projects with status_id and category data
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          project_code,
          description,
          status,
          status_id,
          priority,
          progress,
          customer_id,
          manager_id,
          category_id,
          start_date,
          end_date,
          budget,
          actual_cost,
          billing_type,
          hourly_rate,
          created_at,
          updated_at,
          customers(name),
          employees!manager_id(
            id,
            employee_code,
            first_name,
            last_name
          ),
          project_categories:category_id(
            id,
            name,
            color
          )
        `)

      // Filter by customer_id if provided
      if (customerId) {
        query = query.eq('customer_id', customerId)
      }

      const { data, error } = await query

      if (error) throw error

      const mapped: ProjectItem[] = (data || []).map((p: any) => {
        // Get manager name from employees table
        const manager = p.employees
        const managerName = manager ? `${manager.first_name || ''} ${manager.last_name || ''}`.trim() : undefined
        
        // Get status name from statuses array by matching status_id
        // Otherwise fallback to enum status mapping
        let statusName: string
        if (p.status_id && statusesDataForMapping && statusesDataForMapping.length > 0) {
          const matchedStatus = statusesDataForMapping.find((s: ProjectStatusItem) => s.id === p.status_id)
          statusName = matchedStatus?.name || enumToStatusName[p.status] || p.status
        } else {
          statusName = enumToStatusName[p.status] || p.status
        }
        
        return {
          id: p.id,
          name: p.name,
          project_code: p.project_code,
          description: p.description,
          status: statusName, // Use status name from project_statuses or fallback to enum
          status_id: p.status_id, // Include status_id
          priority: p.priority,
          progress: typeof p.progress === 'number' ? p.progress : Number(p.progress ?? 0),
          customer_id: p.customer_id,
          customer_name: p.customers?.name,
          manager_id: p.manager_id,
          manager_name: managerName,
          manager_code: manager?.employee_code,
          category_id: p.category_id,
          category_name: p.project_categories?.name,
          category_color: p.project_categories?.color,
          start_date: p.start_date,
          end_date: p.end_date,
          budget: p.budget,
          actual_cost: p.actual_cost,
          billing_type: p.billing_type,
          hourly_rate: p.hourly_rate,
          created_at: p.created_at,
          updated_at: p.updated_at
        }
      })

      setProjects(mapped)

      // Fetch invoices and quotes for all projects to calculate totals
      const projectIds = mapped.map(p => p.id)
      if (projectIds.length > 0) {
        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('project_id, total_amount')
          .in('project_id', projectIds)

        if (!invoicesError && invoicesData) {
          // Calculate total invoice amount for each project
          const totals: Record<string, number> = {}
          invoicesData.forEach((invoice: any) => {
            const projectId = invoice.project_id
            const amount = Number(invoice.total_amount) || 0
            totals[projectId] = (totals[projectId] || 0) + amount
          })
          setProjectInvoiceTotals(totals)
        }

        // Fetch quotes
        const { data: quotesData, error: quotesError } = await supabase
          .from('quotes')
          .select('project_id, total_amount')
          .in('project_id', projectIds)

        if (!quotesError && quotesData) {
          // Calculate total quote amount for each project
          const quoteTotals: Record<string, number> = {}
          quotesData.forEach((quote: any) => {
            const projectId = quote.project_id
            const amount = Number(quote.total_amount) || 0
            quoteTotals[projectId] = (quoteTotals[projectId] || 0) + amount
          })
          setProjectQuoteTotals(quoteTotals)
        }
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  // Fetch statuses with optional category filter
  const fetchStatuses = async () => {
    try {
      let url = '/api/projects/statuses'
      if (categoryFilter && categoryFilter !== 'all') {
        url += `?category_id=${categoryFilter}`
      }
      const statusesData = await apiGet(url)
      setStatuses(statusesData || [])
    } catch (error) {
      console.error('Error fetching statuses:', error)
      setStatuses([])
    }
  }

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const categoriesData = await projectCategoryApi.getCategories(true)
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Fetch customers for filter
  const fetchCustomers = async () => {
    try {
      const response = await apiGet('/api/customers?limit=1000')
      const customersData = response?.customers || response || []
      setCustomers(customersData.map((c: any) => ({ id: c.id, name: c.name })))
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  // Filter projects by category, customer, and date
  const filterProjects = () => {
    let filtered = [...projects]

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category_id === categoryFilter)
    }

    // Filter by customer
    if (customerFilter !== 'all') {
      filtered = filtered.filter((p) => p.customer_id === customerFilter)
    }

    // Filter by date range
    if (dateFilter === 'custom' && (startDate || endDate)) {
      filtered = filtered.filter((p) => {
        if (!p.start_date) return false

        const projectStartDate = new Date(p.start_date)
        let isInRange = true

        if (startDate) {
          const filterStartDate = new Date(startDate)
          isInRange = isInRange && projectStartDate >= filterStartDate
        }

        if (endDate) {
          const filterEndDate = new Date(endDate)
          // Set end date to end of day
          filterEndDate.setHours(23, 59, 59, 999)
          isInRange = isInRange && projectStartDate <= filterEndDate
        }

        return isInRange
      })
    } else if (dateFilter === 'this_month') {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      filtered = filtered.filter((p) => {
        if (!p.start_date) return false
        const projectStartDate = new Date(p.start_date)
        return projectStartDate >= startOfMonth && projectStartDate <= endOfMonth
      })
    } else if (dateFilter === 'last_month') {
      const now = new Date()
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

      filtered = filtered.filter((p) => {
        if (!p.start_date) return false
        const projectStartDate = new Date(p.start_date)
        return projectStartDate >= startOfLastMonth && projectStartDate <= endOfLastMonth
      })
    } else if (dateFilter === 'this_year') {
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)

      filtered = filtered.filter((p) => {
        if (!p.start_date) return false
        const projectStartDate = new Date(p.start_date)
        return projectStartDate >= startOfYear && projectStartDate <= endOfYear
      })
    }

    setFilteredProjects(filtered)
  }

  // Expose refresh function via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchData
  }))

  useEffect(() => {
    fetchData()
  }, [customerId])

  useEffect(() => {
    fetchCategories()
    fetchCustomers()
  }, [])

  // Fetch statuses when category filter changes
  useEffect(() => {
    fetchStatuses()
  }, [categoryFilter])

  useEffect(() => {
    filterProjects()
  }, [projects, categoryFilter, customerFilter, dateFilter, startDate, endDate])

  const handleDragStart = (project: ProjectItem) => {
    setDraggedProject(project)
  }

  const handleDragOver = (e: React.DragEvent, status: ProjectStatus) => {
    e.preventDefault()
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatusName: string) => {
    e.preventDefault()
    
    if (!draggedProject || draggedProject.status === newStatusName) {
      setDraggedProject(null)
      setDragOverColumn(null)
      return
    }

    // Always show confirmation dialog for any status change
    setPendingDrop({ project: draggedProject, status: newStatusName })
    setShowStatusChangeDialog(true)
    setDraggedProject(null)
    setDragOverColumn(null)
  }

  const updateProjectStatus = async (project: ProjectItem, newStatusName: string) => {
    try {
      // Find the status_id from the statuses array by matching the name
      const targetStatus = statuses.find(s => s.name === newStatusName)
      
      if (!targetStatus) {
        throw new Error(`Không tìm thấy trạng thái: ${newStatusName}`)
      }

      // Prepare update data - use status_id instead of status enum
      const updateData: any = { status_id: targetStatus.id }
      
      // Auto-set progress to 100% when moving to completed
      if (newStatusName === 'Hoàn thành' || newStatusName === 'completed') {
        updateData.progress = 100
      }
      // Auto-set progress to 0% when moving back to planning
      else if (newStatusName === 'Lập kế hoạch' || newStatusName === 'planning') {
        updateData.progress = 0
      }

      // Update project status_id and progress in database using API
      await apiPut(`/api/projects/${project.id}`, updateData)

      // Update local state
      setProjects(prev => 
        prev.map(p => 
          p.id === project.id 
            ? { 
                ...p, 
                status: newStatusName,
                status_id: targetStatus.id,
                progress: newStatusName === 'Hoàn thành' || newStatusName === 'completed' ? 100 : 
                         newStatusName === 'Lập kế hoạch' || newStatusName === 'planning' ? 0 : p.progress
              }
            : p
        )
      )
      
      // Clear any error state on success
      setError(null)

      console.log(`Project ${project.name} moved to ${newStatusName}${newStatusName === 'Hoàn thành' || newStatusName === 'completed' ? ' with 100% progress' : ''}`)
    } catch (err: any) {
      console.error('Error updating project status:', err)
      setError(err.message || 'Không thể cập nhật trạng thái dự án')
    }
  }

  const handleConfirmCompletion = async () => {
    if (pendingDrop) {
      await updateProjectStatus(pendingDrop.project, pendingDrop.status)
      setShowCompletionDialog(false)
      setPendingDrop(null)
    }
  }

  const handleCancelCompletion = () => {
    setShowCompletionDialog(false)
    setPendingDrop(null)
  }

  const handleConfirmHold = async () => {
    if (pendingDrop) {
      await updateProjectStatus(pendingDrop.project, pendingDrop.status)
      setShowHoldDialog(false)
      setPendingDrop(null)
    }
  }

  const handleCancelHold = () => {
    setShowHoldDialog(false)
    setPendingDrop(null)
  }

  const handleConfirmCancel = async () => {
    if (pendingDrop) {
      await updateProjectStatus(pendingDrop.project, pendingDrop.status)
      setShowCancelDialog(false)
      setPendingDrop(null)
    }
  }

  const handleCancelCancel = () => {
    setShowCancelDialog(false)
    setPendingDrop(null)
  }

  const handleConfirmStatusChange = async () => {
    if (pendingDrop) {
      await updateProjectStatus(pendingDrop.project, pendingDrop.status)
      setShowStatusChangeDialog(false)
      setPendingDrop(null)
    }
  }

  const handleCancelStatusChange = () => {
    setShowStatusChangeDialog(false)
    setPendingDrop(null)
  }

  // Map between Vietnamese status names and English enum values
  const statusNameToEnum: Record<string, string> = {
    'Lập kế hoạch': 'planning',
    'Đang thực hiện': 'active',
    'Tạm dừng': 'on_hold',
    'Hoàn thành': 'completed',
    'Đã hủy': 'cancelled'
  }
  
  const enumToStatusName: Record<string, string> = {
    'planning': 'Lập kế hoạch',
    'active': 'Đang thực hiện',
    'on_hold': 'Tạm dừng',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  }

  const grouped = useMemo(() => {
    const byStatus: Record<string, ProjectItem[]> = {}

    // Initialize with all statuses from database (using Vietnamese names)
    statuses.forEach(status => {
      byStatus[status.name] = []
    })

    for (const p of filteredProjects) {
      // Use status name directly (already mapped from project_statuses or fallback to enum)
      // The status field now contains the Vietnamese name from project_statuses
      const finalStatusName = p.status || 'Lập kế hoạch' // Default fallback

      if (!byStatus[finalStatusName]) {
        byStatus[finalStatusName] = []
      }
      byStatus[finalStatusName].push(p)
    }
    return byStatus
  }, [filteredProjects, statuses])

  const getStatusMeta = (statusName: string) => {
    const status = statuses.find(s => s.name === statusName)
    if (status) {
      return {
        title: status.name,
        colorClass: status.color_class
      }
    }
    return {
      title: statusName,
      colorClass: 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateStatus = async () => {
    try {
      if (!statusForm.name.trim()) {
        alert('Vui lòng nhập tên trạng thái')
        return
      }

      // Check if display_order already exists (excluding current editing status)
      const existingStatus = statuses.find(
        s => s.display_order === statusForm.display_order && 
        (!editingStatus || s.id !== editingStatus.id)
      )

      if (existingStatus) {
        // Show confirmation dialog
        setConflictingStatus(existingStatus)
        setPendingStatusData({
          isEdit: !!editingStatus,
          data: { ...statusForm }
        })
        setShowOrderConflictDialog(true)
        return
      }

      // No conflict, proceed with create/update
      setPendingStatusData({
        isEdit: !!editingStatus,
        data: { ...statusForm }
      })
      await performCreateOrUpdate()
    } catch (e: any) {
      alert(e.message || 'Lỗi khi tạo/cập nhật trạng thái')
    }
  }

  const performCreateOrUpdate = async () => {
    try {
      // Add category_id to status form if category filter is set
      const statusData = pendingStatusData?.data || statusForm
      if (!editingStatus && categoryFilter && categoryFilter !== 'all') {
        statusData.category_id = categoryFilter
      }
      
      if (pendingStatusData?.isEdit && editingStatus) {
        await apiPut(`/api/projects/statuses/${editingStatus.id}`, pendingStatusData.data)
      } else if (pendingStatusData) {
        await apiPost('/api/projects/statuses', pendingStatusData.data)
      } else if (editingStatus) {
        await apiPut(`/api/projects/statuses/${editingStatus.id}`, statusForm)
      } else {
        await apiPost('/api/projects/statuses', statusData)
      }

      // Refresh statuses with current category filter
      await fetchStatuses()
      
      setShowStatusModal(false)
      setShowOrderConflictDialog(false)
      setEditingStatus(null)
      setConflictingStatus(null)
      setPendingStatusData(null)
      setStatusForm({
        name: '',
        display_order: 0,
        description: '',
        color_class: 'bg-gray-100 text-gray-800'
      })
      setSelectedColor('#6b7280')
    } catch (e: any) {
      alert(e.message || 'Lỗi khi tạo/cập nhật trạng thái')
    }
  }

  const handleConfirmShiftStatuses = async () => {
    try {
      if (!pendingStatusData || !conflictingStatus) return

      setIsShiftingStatuses(true)
      const startTime = Date.now() // Start timing from the beginning

      // Get all statuses that need to be shifted (display_order >= new order)
      // Sort by display_order descending to avoid conflicts when shifting
      // Store original order values before shifting
      const statusesToShift = statuses
        .filter(
          s => s.display_order >= pendingStatusData.data.display_order &&
          (!editingStatus || s.id !== editingStatus.id)
        )
        .sort((a, b) => b.display_order - a.display_order) // Sort descending
        .map(status => ({
          ...status,
          originalOrder: status.display_order // Store original order
        }))

      // Step 1: Move all conflicting statuses to temporary high values to avoid conflicts
      const tempOffset = 10000 // Use a high temporary value
      for (const status of statusesToShift) {
        await apiPut(`/api/projects/statuses/${status.id}`, {
          display_order: status.originalOrder + tempOffset
        })
      }

      // Step 2: Wait a bit to ensure backend has processed all updates
      await new Promise(resolve => setTimeout(resolve, 200))

      // Step 3: Now move them to their final positions (original + 1)
      for (const status of statusesToShift) {
        await apiPut(`/api/projects/statuses/${status.id}`, {
          display_order: status.originalOrder + 1
        })
      }

      // Step 4: Wait again to ensure all updates are processed
      await new Promise(resolve => setTimeout(resolve, 200))

      // Step 5: Refresh statuses to get updated display_order values
      await fetchStatuses()

      // Step 6: Now proceed with create/update
      await performCreateOrUpdate()

      // Step 7: Ensure minimum 3 seconds total wait time
      const minWaitTime = 3000 // 3 seconds
      const elapsed = Date.now() - startTime
      if (elapsed < minWaitTime) {
        await new Promise(resolve => setTimeout(resolve, minWaitTime - elapsed))
      }

      // Step 8: Refresh data
      await fetchData()
    } catch (e: any) {
      setIsShiftingStatuses(false)
      alert(e.message || 'Lỗi khi cập nhật vị trí trạng thái')
      setShowOrderConflictDialog(false)
      setConflictingStatus(null)
      setPendingStatusData(null)
    }
  }

  const handleCancelShiftStatuses = () => {
    setShowOrderConflictDialog(false)
    setConflictingStatus(null)
    setPendingStatusData(null)
  }

  const handleEditStatus = (status: ProjectStatusItem) => {
    setEditingStatus(status)
    setStatusForm({
      name: status.name,
      display_order: status.display_order,
      description: status.description || '',
      color_class: status.color_class
    })
    // Find matching color from color_class
    const bgClass = status.color_class.split(' ')[0]
    const color = colorOptions.find(c => c.bg === bgClass)
    setSelectedColor(color?.hex || '#6b7280')
    setShowStatusModal(true)
  }

  // Handle status column drag and drop
  const handleStatusDragStart = (e: React.DragEvent, statusId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', statusId)
    setDraggedStatusId(statusId)
  }

  const handleStatusDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedStatusId && draggedStatusId !== statusId) {
      setDragOverStatusId(statusId)
    }
  }

  const handleStatusDragLeave = () => {
    setDragOverStatusId(null)
  }

  const handleStatusDrop = async (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedStatusId || draggedStatusId === targetStatusId) {
      setDraggedStatusId(null)
      setDragOverStatusId(null)
      return
    }

    try {
      setIsReorderingStatuses(true)
      
      const draggedStatus = statuses.find(s => s.id === draggedStatusId)
      const targetStatus = statuses.find(s => s.id === targetStatusId)
      
      if (!draggedStatus || !targetStatus) {
        return
      }

      const draggedOrder = draggedStatus.display_order
      const targetOrder = targetStatus.display_order

      // Calculate new order for dragged status
      const newOrder = targetOrder

      // Get all statuses that need to be shifted
      const statusesToShift: Array<{ id: string; newOrder: number }> = []
      
      if (draggedOrder < targetOrder) {
        // Moving forward: shift statuses between dragged and target backward
        statuses.forEach(s => {
          if (s.id !== draggedStatusId && s.display_order > draggedOrder && s.display_order <= targetOrder) {
            statusesToShift.push({ id: s.id, newOrder: s.display_order - 1 })
          }
        })
        // Set dragged status to target order
        statusesToShift.push({ id: draggedStatusId, newOrder: targetOrder })
      } else {
        // Moving backward: shift statuses between target and dragged forward
        statuses.forEach(s => {
          if (s.id !== draggedStatusId && s.display_order >= targetOrder && s.display_order < draggedOrder) {
            statusesToShift.push({ id: s.id, newOrder: s.display_order + 1 })
          }
        })
        // Set dragged status to target order
        statusesToShift.push({ id: draggedStatusId, newOrder: targetOrder })
      }

      // Update all statuses
      for (const { id, newOrder: order } of statusesToShift) {
        await apiPut(`/api/projects/statuses/${id}`, {
          display_order: order
        })
      }

      // Refresh statuses
      await fetchStatuses()
    } catch (error: any) {
      console.error('Error reordering statuses:', error)
      alert(error?.data?.detail || error?.message || 'Không thể thay đổi vị trí trạng thái')
    } finally {
      setIsReorderingStatuses(false)
      setDraggedStatusId(null)
      setDragOverStatusId(null)
    }
  }

  const handleDeleteStatus = async (statusId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa trạng thái này?')) {
      return
    }

    try {
      setIsDeletingStatus(true)
      setDeletingStatusId(statusId)

      // Get the status being deleted to know its display_order
      const statusToDelete = statuses.find(s => s.id === statusId)
      if (!statusToDelete) {
        alert('Không tìm thấy trạng thái cần xóa')
        setIsDeletingStatus(false)
        setDeletingStatusId(null)
        return
      }

      const deletedOrder = statusToDelete.display_order

      // Delete the status
      await apiDelete(`/api/projects/statuses/${statusId}`)
      
      // Get all statuses that need to be shifted down (display_order > deleted order)
      const statusesToShift = statuses
        .filter(s => s.display_order > deletedOrder && s.id !== statusId)
        .sort((a, b) => a.display_order - b.display_order) // Sort ascending

      // Shift down each status by 1 (decrease display_order by 1)
      for (const status of statusesToShift) {
        await apiPut(`/api/projects/statuses/${status.id}`, {
          display_order: status.display_order - 1
        })
      }

      // Refresh statuses to get updated list
      await fetchStatuses()

      setIsDeletingStatus(false)
      setDeletingStatusId(null)
    } catch (e: any) {
      setIsDeletingStatus(false)
      setDeletingStatusId(null)
      alert(e.message || 'Lỗi khi xóa trạng thái')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
    )
  }

  return (
    <>
      {/* Status Management Button and Filters */}
      <div className="mb-4 space-y-4">
        {/* Main filter row */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Lọc theo nhóm:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                const newCategoryFilter = e.target.value
                setCategoryFilter(newCategoryFilter)
                // When selecting "all" categories, also reset customer and date filters to show all projects
                if (newCategoryFilter === 'all') {
                  setCustomerFilter('all')
                  setDateFilter('all')
                  setStartDate('')
                  setEndDate('')
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-sm"
            >
              <option value="all">Tất cả nhóm</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showAdvancedFilters
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
              title={showAdvancedFilters ? 'Ẩn bộ lọc nâng cao' : 'Hiện bộ lọc nâng cao'}
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">
                {showAdvancedFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}
              </span>
            </button>
          </div>

          {/* Management Buttons */}
          <div className="flex gap-2">
            {(userRole === 'admin' || userRole === 'manager') && (
              <button
                onClick={() => {
                  setCategoriesManagerInitialTab('categories')
                  setShowCategoriesManager(true)
                }}
                className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 shadow-sm"
                title="Quản lý nhóm phân loại dự án"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Quản lý nhóm</span>
                <span className="sm:hidden">Nhóm</span>
              </button>
            )}
            <button
              onClick={() => {
                setEditingStatus(null)
                setStatusForm({
                  name: '',
                  display_order: statuses.length > 0 ? Math.max(...statuses.map(s => s.display_order)) + 1 : 1,
                  description: '',
                  color_class: 'bg-gray-100 text-gray-800'
                })
                setSelectedColor('#6b7280')
                setShowStatusModal(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tạo trạng thái mới
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Filter */}
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Khách hàng:</span>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-sm"
                >
                  <option value="all">Tất cả khách hàng</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Thời gian:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-sm"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="this_month">Tháng này</option>
                  <option value="last_month">Tháng trước</option>
                  <option value="this_year">Năm nay</option>
                  <option value="custom">Tùy chỉnh</option>
                </select>
              </div>

              {/* Custom date range - only show when custom is selected */}
              {dateFilter === 'custom' && (
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Từ ngày:</span>
                    <button
                      onClick={() => {
                        setDatePickerMode('start')
                        setShowDatePickerDialog(true)
                      }}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-sm min-w-[140px]"
                    >
                      <span className="flex-1 text-left">
                        {startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Đến ngày:</span>
                    <button
                      onClick={() => {
                        setDatePickerMode('end')
                        setShowDatePickerDialog(true)
                      }}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-sm min-w-[140px]"
                    >
                      <span className="flex-1 text-left">
                        {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board with Horizontal Scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {statuses
            .sort((a, b) => a.display_order - b.display_order)
            .map((status) => {
              const statusMeta = getStatusMeta(status.name)
              const statusProjects = grouped[status.name] || []
              
              return (
                <div 
                  key={status.id} 
                  className={`flex-shrink-0 transition-all ${draggedStatusId === status.id ? 'opacity-50' : ''} ${dragOverStatusId === status.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                  style={{ width: '320px' }}
                >
                  <div className="mb-2 flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditStatus(status)}
                        disabled={isDeletingStatus}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Chỉnh sửa trạng thái"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStatus(status.id)}
                        disabled={isDeletingStatus}
                        className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Xóa trạng thái"
                      >
                        {isDeletingStatus && deletingStatusId === status.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
          <KanbanColumn
                    title={statusMeta.title}
                    colorClass={statusMeta.colorClass}
                    count={statusProjects.length}
                    projects={statusProjects}
                    totalInvoiceAmount={statusProjects.reduce((sum, p) => {
                      return sum + (projectInvoiceTotals[p.id] || 0)
                    }, 0)}
                    totalQuoteAmount={statusProjects.reduce((sum, p) => {
                      return sum + (projectQuoteTotals[p.id] || 0)
                    }, 0)}
                    isQuoteStatus={statusMeta.title.toLowerCase().includes('báo giá') || statusMeta.title.toLowerCase().includes('lên kế hoạch')}
            onCardClick={(id) => {
              const project = projects.find(p => p.id === id)
              if (project && onViewProject) {
                onViewProject(project)
              } else {
                router.push(`/projects/${id}/detail`)
              }
            }}
            onDragStart={handleDragStart}
                    onDragOver={(e) => {
                      handleDragOver(e, status.name as ProjectStatus)
                    }}
            onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status.name)}
                    isDragOver={dragOverColumn === status.name}
                    statusId={status.id}
                    onStatusHeaderDragStart={(e) => handleStatusDragStart(e, status.id)}
                    onStatusHeaderDragOver={(e) => handleStatusDragOver(e, status.id)}
                    onStatusHeaderDragLeave={handleStatusDragLeave}
                    onStatusHeaderDrop={(e) => handleStatusDrop(e, status.id)}
                    isStatusHeaderDragging={draggedStatusId === status.id}
                    isStatusHeaderDragOver={dragOverStatusId === status.id}
                    onAddStatus={async () => {
                      // Set display_order = current status's display_order
                      const newDisplayOrder = status.display_order
                      
                      // Shift all statuses with display_order >= newDisplayOrder up by 1
                      const statusesToShift = statuses
                        .filter(s => s.display_order >= newDisplayOrder)
                        .sort((a, b) => b.display_order - a.display_order) // Sort descending to avoid conflicts
                        .map(s => ({ ...s, originalOrder: s.display_order })) // Store original order
                      
                      if (statusesToShift.length > 0) {
                        try {
                          // Step 1: Move to temporary high values
                          const tempOffset = 10000
                          for (const s of statusesToShift) {
                            await apiPut(`/api/projects/statuses/${s.id}`, {
                              display_order: s.originalOrder + tempOffset
                            })
                          }
                          
                          // Step 2: Wait a bit
                          await new Promise(resolve => setTimeout(resolve, 200))
                          
                          // Step 3: Move to final positions (original + 1)
                          for (const s of statusesToShift) {
                            await apiPut(`/api/projects/statuses/${s.id}`, {
                              display_order: s.originalOrder + 1
                            })
                          }
                          
                          // Step 4: Wait again
                          await new Promise(resolve => setTimeout(resolve, 200))
                          
                          // Step 5: Refresh statuses
                          await fetchStatuses()
                        } catch (e: any) {
                          console.error('Error shifting statuses:', e)
                          alert('Có lỗi khi dồn trạng thái. Vui lòng thử lại.')
                          return
                        }
                      }
                      
                      // Set form with new display_order
                      setStatusForm({
                        name: '',
                        display_order: newDisplayOrder,
                        description: '',
                        color_class: 'bg-gray-100 text-gray-800'
                      })
                      setSelectedColor('#6b7280')
                      setEditingStatus(null)
                      setShowStatusModal(true)
                    }}
                    statusId={status.id}
                  />
                </div>
              )
            })}
        </div>
      </div>

      {/* Delete Status Loading Dialog */}
      {isDeletingStatus && deletingStatusId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="text-center py-8">
              <div className="mb-4 flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-black">
                Đang xóa...
              </h2>
              <p className="text-sm text-gray-600">
                Vui lòng đợi trong giây lát
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Conflict Dialog */}
      {showOrderConflictDialog && conflictingStatus && pendingStatusData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            {isShiftingStatuses ? (
              <div className="text-center py-8">
                <div className="mb-4 flex justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-black"></div>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-black">
                  Đang cập nhật...
                </h2>
                <p className="text-sm text-gray-600">
                  Vui lòng đợi trong giây lát
                </p>
              </div>
            ) : (
              <>
                <h2 className="mb-4 text-xl font-semibold text-black">
                  Vị trí đã được sử dụng
                </h2>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-700 mb-3">
                    Vị trí <strong>{pendingStatusData.data.display_order}</strong> đã được sử dụng bởi trạng thái:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="font-medium text-black">{conflictingStatus.name}</p>
                    {conflictingStatus.description && (
                      <p className="text-xs text-gray-600 mt-1">{conflictingStatus.description}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    Bạn có muốn đẩy trạng thái <strong>"{conflictingStatus.name}"</strong> và tất cả các trạng thái sau đó lên +1 không?
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelShiftStatuses}
                    disabled={isShiftingStatuses}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirmShiftStatuses}
                    disabled={isShiftingStatuses}
                    className="flex-1 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Đồng ý, đẩy lên +1
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Status Management Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-black">
              {editingStatus ? 'Chỉnh sửa trạng thái' : 'Tạo trạng thái mới'}
            </h2>
            {!editingStatus && categoryFilter && categoryFilter !== 'all' && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Nhóm:</strong> {categories.find(c => c.id === categoryFilter)?.name || 'Đang chọn nhóm'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Trạng thái mới sẽ được gán vào nhóm này
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="mt-1 text-xs text-black">Tên trạng thái *</label>
                <input
                  type="text"
                  value={statusForm.name}
                  onChange={(e) => setStatusForm({ ...statusForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-500 px-3 py-2 mt-1 text-xs text-black"
                  placeholder="Ví dụ: Đang xử lý"
                />
              </div>

              <div>
                <label className="mt-1 text-xs text-black">Thứ tự *</label>
                <input
                  type="number"
                  value={statusForm.display_order}
                  onChange={(e) => setStatusForm({ ...statusForm, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-500 px-3 py-2 mt-1 text-xs text-black"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="mt-1 text-xs text-black">Mô tả</label>
                <textarea
                  value={statusForm.description}
                  onChange={(e) => setStatusForm({ ...statusForm, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-500 px-3 py-2 mt-1 text-xs text-black"
                  rows={3}
                  placeholder="Mô tả về trạng thái này"
                />
              </div>

              <div>
                <label className="mt-1 text-xs text-black">Màu sắc</label>
                <div className="mb-2">
                  <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                    {colorOptions.map((color, index) => (
                      <button
                        key={`${color.name}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color.hex)
                          setStatusForm({ ...statusForm, color_class: `${color.bg} ${color.text}` })
                        }}
                        className={`h-10 w-full rounded-lg border-2 transition-all ${
                          selectedColor === color.hex
                            ? 'border-gray-900 ring-2 ring-gray-500'
                            : 'border-gray-200 hover:border-gray-400'
                        } ${color.bg} ${color.text} flex items-center justify-center text-xs font-medium`}
                        title={color.name}
                      >
                        {selectedColor === color.hex && '✓'}
                      </button>
        ))}
      </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => {
                      const hex = e.target.value
                      setSelectedColor(hex)
                      setStatusForm({ ...statusForm, color_class: getColorClassFromHex(hex) })
                    }}
                    className="h-10 w-20 cursor-pointer rounded-lg border border-gray-800 text-black"
                  />
                  <input
                    type="text"
                    value={statusForm.color_class}
                    onChange={(e) => setStatusForm({ ...statusForm, color_class: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-800 px-3 py-2 text-sm mt-1 text-xs text-black"
                    placeholder="bg-gray-100 text-gray-500"
                  />
                </div>
                <p className="mt-1 text-xs text-black">
                  Chọn màu từ bảng màu hoặc nhập CSS class tùy chỉnh
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setEditingStatus(null)
                  setStatusForm({
                    name: '',
                    display_order: 0,
                    description: '',
                    color_class: 'bg-gray-100 text-gray-500'
                  })
                  setSelectedColor('#6b7280')
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateStatus}
                disabled={!isFormValid}
                className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
                  isFormValid
                    ? 'bg-black text-white hover:bg-gray-500'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {editingStatus ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Confirmation Dialog */}
      {showCompletionDialog && pendingDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Xác nhận hoàn thành dự án
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Bạn có chắc chắn muốn hoàn thành dự án này không?
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{pendingDrop.project.name}</p>
                  <p className="text-sm text-gray-600">#{pendingDrop.project.project_code}</p>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Dự án sẽ được đặt tiến độ 100% và chuyển sang trạng thái "Hoàn thành"
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelCompletion}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
                <button
                  onClick={handleConfirmCompletion}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Xác nhận hoàn thành
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hold Confirmation Dialog */}
      {showHoldDialog && pendingDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Xác nhận tạm dừng dự án
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Bạn có chắc chắn muốn tạm dừng dự án này không?
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{pendingDrop.project.name}</p>
                  <p className="text-sm text-gray-600">#{pendingDrop.project.project_code}</p>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Dự án sẽ được chuyển sang trạng thái "Tạm dừng" và có thể tiếp tục sau
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelHold}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
                <button
                  onClick={handleConfirmHold}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Xác nhận tạm dừng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && pendingDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Xác nhận hủy dự án
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Bạn có chắc chắn muốn hủy dự án này không?
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{pendingDrop.project.name}</p>
                  <p className="text-sm text-gray-600">#{pendingDrop.project.project_code}</p>
                </div>
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Dự án sẽ được chuyển sang trạng thái "Hủy" và không thể hoàn thành
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Status Change Confirmation Dialog */}
      {showStatusChangeDialog && pendingDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Xác nhận thay đổi trạng thái
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Bạn có chắc chắn muốn thay đổi trạng thái dự án này không?
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="font-medium text-gray-900">{pendingDrop.project.name}</p>
                  <p className="text-sm text-gray-600">#{pendingDrop.project.project_code}</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Trạng thái hiện tại</p>
                    <p className="font-medium text-gray-900">{pendingDrop.project.status}</p>
                  </div>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Trạng thái mới</p>
                    <p className="font-medium text-blue-600">{pendingDrop.status}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelStatusChange}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Categories Manager */}
      <ProjectCategoriesManager
        isOpen={showCategoriesManager}
        onClose={() => setShowCategoriesManager(false)}
        onSuccess={() => {
          // Refresh categories and projects to get updated category data
          fetchCategories()
          fetchData()
        }}
        initialTab={categoriesManagerInitialTab}
      />

      {/* Date Picker Dialog */}
      {showDatePickerDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Chọn {datePickerMode === 'start' ? 'ngày bắt đầu' : 'ngày kết thúc'}
                </h3>
              </div>

              <div className="mb-6">
                <input
                  type="date"
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg"
                  onChange={(e) => {
                    if (datePickerMode === 'start') {
                      setStartDate(e.target.value)
                    } else {
                      setEndDate(e.target.value)
                    }
                    setShowDatePickerDialog(false)
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDatePickerDialog(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
                <button
                  onClick={() => setShowDatePickerDialog(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

KanbanBoard.displayName = 'KanbanBoard'

export default KanbanBoard



