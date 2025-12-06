'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { 
  X, 
  Save, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Calendar,
  User,
  DollarSign,
  Target,
  BarChart3,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  CircleHelp,
  RefreshCw
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getExpenseObjectsByRole } from '@/utils/expenseObjectPermissions'
import { ExpenseObjectRoleFilter, useExpenseObjectRoleFilter, ExpenseObjectDisplayUtils } from '@/utils/expenseObjectRoleFilter'
import ExpenseObjectSelector from '@/components/ExpenseObjectSelector'
import ExpenseObjectMultiSelector from '@/components/ExpenseObjectMultiSelector'
import ExpenseObjectMultiSelectorEnhanced from '@/components/ExpenseObjectMultiSelectorEnhanced'
import ExpenseObjectTreeView from '@/components/expenses/ExpenseObjectTreeView'
import ExpenseSummaryDisplay from '@/components/ExpenseSummaryDisplay'
import ExpenseRestoreButton from './ExpenseRestoreButton'
import ExpenseColumnVisibilityDialog from './ExpenseColumnVisibilityDialog'
import { useSidebar } from '@/components/LayoutWithSidebar'
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || getApiUrl()

interface Project {
  id: string
  name: string
  project_code: string
  status: string
  budget?: number
}

interface Employee {
  id: string
  full_name: string
  email?: string
}

interface CreateProjectExpenseDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  category?: 'planned' | 'actual'
  mode?: 'create' | 'edit'
  editId?: string
}

export default function CreateProjectExpenseDialog({ isOpen, onClose, onSuccess, category = 'planned', mode = 'create', editId }: CreateProjectExpenseDialogProps) {
  const { hideSidebar } = useSidebar()
  
  // Hide sidebar when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      hideSidebar(true)
    } else {
      hideSidebar(false)
    }
    // Cleanup: restore sidebar when component unmounts
    return () => {
      hideSidebar(false)
    }
  }, [isOpen, hideSidebar])
  
  // Function hiển thị thông báo đẹp
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    console.log('🔔 showNotification called:', { message, type })
    
    try {
      const colors = {
        success: { 
          bg: 'rgba(16, 185, 129, 0.95)', 
          border: '#10b981', 
          shadow: 'rgba(16, 185, 129, 0.4)',
          text: '#ffffff'
        },
        error: { 
          bg: 'rgba(239, 68, 68, 0.95)', 
          border: '#ef4444', 
          shadow: 'rgba(239, 68, 68, 0.4)',
          text: '#ffffff'
        },
        warning: { 
          bg: 'rgba(245, 158, 11, 0.95)', 
          border: '#f59e0b', 
          shadow: 'rgba(245, 158, 11, 0.4)',
          text: '#ffffff'
        },
        info: { 
          bg: 'rgba(59, 130, 246, 0.95)', 
          border: '#3b82f6', 
          shadow: 'rgba(59, 130, 246, 0.4)',
          text: '#ffffff'
        }
      }
      
      const color = colors[type]
      console.log('🎨 Using color:', color)
      
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color.bg};
        color: ${color.text};
        padding: 20px 24px;
        border-radius: 16px;
        box-shadow: 0 20px 40px ${color.shadow}, 0 0 0 1px ${color.border};
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 15px;
        font-weight: 600;
        max-width: 450px;
        line-height: 1.6;
        border: 2px solid ${color.border};
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        word-wrap: break-word;
        white-space: pre-line;
      `
      notification.innerHTML = message.replace(/\n/g, '<br>')
      console.log('📝 Notification HTML:', notification.innerHTML)
      
      // Thêm animation CSS nếu chưa có
      if (!document.querySelector('#notification-styles')) {
        console.log('🎬 Adding CSS animation styles')
        const style = document.createElement('style')
        style.id = 'notification-styles'
        style.textContent = `
          @keyframes slideInRight {
            from { 
              transform: translateX(100%) scale(0.9); 
              opacity: 0; 
            }
            to { 
              transform: translateX(0) scale(1); 
              opacity: 1; 
            }
          }
          @keyframes slideOutRight {
            from { 
              transform: translateX(0) scale(1); 
              opacity: 1; 
            }
            to { 
              transform: translateX(100%) scale(0.9); 
              opacity: 0; 
            }
          }
        `
        document.head.appendChild(style)
      }
      
      document.body.appendChild(notification)
      console.log('✅ Notification added to DOM')
      
      // Tự động ẩn sau 6 giây
      setTimeout(() => {
        console.log('⏰ Auto-hiding notification after 6 seconds')
        notification.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification)
            console.log('🗑️ Notification removed from DOM')
          }
        }, 300)
      }, 6000)
      
    } catch (error) {
      console.error('❌ Error in showNotification:', error)
      // Fallback to alert if notification fails
      alert(message)
    }
  }
  
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [userRole, setUserRole] = useState<string>('employee')
  const [parentQuotes, setParentQuotes] = useState<{ id: string; expense_code?: string; description: string; amount: number }[]>([])
  const [parentExpenses, setParentExpenses] = useState<{ id: string; expense_code?: string; description: string; amount: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [descriptionIsManual, setDescriptionIsManual] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    amounts: true,
    additional: false
  })
  
  // State for expense object selection visibility
  const [showExpenseObjectSelection, setShowExpenseObjectSelection] = useState(true)

  // Tour state for planned expenses
  const PLANNED_EXPENSE_TOUR_STORAGE_KEY = 'planned-expense-tour-status-v1'
  const [isPlannedExpenseTourRunning, setIsPlannedExpenseTourRunning] = useState(false)
  const plannedExpenseTourRef = useRef<any>(null)
  const plannedExpenseShepherdRef = useRef<any>(null)
  const plannedExpenseTourAutoStartAttemptedRef = useRef(false)
  type PlannedExpenseShepherdModule = typeof import('shepherd.js')
  type PlannedExpenseShepherdType = PlannedExpenseShepherdModule & { Tour: new (...args: any[]) => any }
  type PlannedExpenseShepherdTour = InstanceType<PlannedExpenseShepherdType['Tour']>

  // Tour state for actual expenses
  const ACTUAL_EXPENSE_TOUR_STORAGE_KEY = 'actual-expense-tour-status-v1'
  const [isActualExpenseTourRunning, setIsActualExpenseTourRunning] = useState(false)
  const actualExpenseTourRef = useRef<any>(null)
  const actualExpenseShepherdRef = useRef<any>(null)
  const actualExpenseTourAutoStartAttemptedRef = useRef(false)
  type ActualExpenseShepherdModule = typeof import('shepherd.js')
  type ActualExpenseShepherdType = ActualExpenseShepherdModule & { Tour: new (...args: any[]) => any }
  type ActualExpenseShepherdTour = InstanceType<ActualExpenseShepherdType['Tour']>

  // State for cost detail modal
  const [showCostDetailModal, setShowCostDetailModal] = useState(false)
  const [selectedExpenseObjectId, setSelectedExpenseObjectId] = useState<string>('')
  
  // State for expense selector
  const [existingExpenses, setExistingExpenses] = useState<any[]>([])
  const [selectedExpenseToUpdate, setSelectedExpenseToUpdate] = useState<any>(null)
  const [showExpenseSelector, setShowExpenseSelector] = useState(false)
  const [isReplaceParentMode, setIsReplaceParentMode] = useState(false)
  
  // State for expense dropdown
  const [expenseDropdownOptions, setExpenseDropdownOptions] = useState<any[]>([])
  const [selectedExpenseForUpdate, setSelectedExpenseForUpdate] = useState<string>('')
  
  // State for direct cost input
  const [directProductCosts, setDirectProductCosts] = useState<Record<number, number>>({})
  const [directObjectCosts, setDirectObjectCosts] = useState<Record<string, number>>({})
  const [inputMode, setInputMode] = useState<'detailed' | 'product-total' | 'object-total'>('detailed')
  
  // State for formatted unit price display
  const [formattedUnitPrices, setFormattedUnitPrices] = useState<Record<number, string>>({})
  
  // State for formatted object amounts
  const [formattedObjectAmounts, setFormattedObjectAmounts] = useState<Record<string, Record<number, string>>>({})
  
  // State for direct total inputs
  const [directObjectTotals, setDirectObjectTotals] = useState<Record<string, number>>({})
  
  // State for toggle visibility
  const [showObjectTotalInputs, setShowObjectTotalInputs] = useState<boolean>(false)
  
  // State for column visibility
  const [showColumnDialog, setShowColumnDialog] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    description: true,
    quantity: true,
    unit: true,
    unit_price: true,
    total_price: true,
    expense_percentage: true,
    expense_quantity: true,
    expense_unit_price: true,
    expense_amount: true
  })
  
  // State for workshop employee confirmation dialog
  const [showUpdateCreateDialog, setShowUpdateCreateDialog] = useState(false)
  const [pendingExpenseData, setPendingExpenseData] = useState<any>(null)
  
  const [workshopParentObject, setWorkshopParentObject] = useState<SimpleExpenseObject | null>(null)
  
  // Use expense object role filter hook
  const { processExpenseObjects, canAccessExpenseObject } = useExpenseObjectRoleFilter()
  
  // Column visibility functions
  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const resetColumns = () => {
    setVisibleColumns({
      name: true,
      description: true,
      quantity: true,
      unit: true,
      unit_price: true,
      total_price: true,
      expense_percentage: true,
      expense_quantity: true,
      expense_unit_price: true,
      expense_amount: true
    })
  }

  // Form data
  const [formData, setFormData] = useState({
    project_id: '',
    employee_id: '',
    category: 'planned', // 'planned' or 'actual'
    description: '',
    expense_object_id: '',
    planned_amount: 0,
    actual_amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: '',
    receipt_url: '',
    currency: 'VND',
    id_parent: ''
  })

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // System notification state
  const [systemNotification, setSystemNotification] = useState<string>('')
  
  // Get validation status for button display
  const getValidationStatus = () => {
    if (!formData.description.trim()) {
      return { 
        message: '⚠️ Thiếu mô tả', 
        color: 'orange',
        details: 'Nhập mô tả chi phí'
      }
    }
    if (!formData.project_id) {
      return { 
        message: '⚠️ Thiếu dự án', 
        color: 'orange',
        details: 'Chọn dự án'
      }
    }
    if (!formData.expense_date) {
      return { 
        message: '⚠️ Thiếu ngày', 
        color: 'orange',
        details: 'Chọn ngày chi phí'
      }
    }
    if ((Number(grandAllocationTotal) || 0) <= 0) {
      return { 
        message: '⚠️ Thiếu số tiền', 
        color: 'orange',
        details: 'Nhập số tiền kế hoạch'
      }
    }
    return null
  }

  // Invoice-like table state (left side)
  interface InvoiceItemRow {
    section: string // Hạng mục
    index: number // STT
    productCode?: string // Mã sản phẩm
    productName: string // Tên sản phẩm
    description?: string // Mô tả sản phẩm
    unitPrice: number // Đơn giá
    quantity: number // Số lượng
    unit: string // Đơn vị
    area?: number | null // Diện tích (m²)
    // Derived
    lineTotal: number // Thành tiền
    // Component percentages per row
    componentsPct: Record<string, number> // key: expense_object_id, value: percent
    componentsAmt: Record<string, number> // key: expense_object_id, value: amount (VND)
    // New fields for expense object columns
    componentsQuantity: Record<string, number> // key: expense_object_id, value: quantity
    componentsUnitPrice: Record<string, number> // key: expense_object_id, value: unit price
  }

  // Expense object columns
  interface SimpleExpenseObject { 
    id: string; 
    name: string; 
    description?: string;
    is_active: boolean;
    parent_id?: string; // Added parent_id
    is_parent?: boolean; // Added is_parent
    role?: string; // Added role
    level?: number; // Added level
  }
  const [expenseObjectsOptions, setExpenseObjectsOptions] = useState<SimpleExpenseObject[]>([])
  const [selectedExpenseObjectIds, setSelectedExpenseObjectIds] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  // Store product components data from quote_items for auto-filling
  const [quoteProductComponents, setQuoteProductComponents] = useState<Array<{
    expense_object_id: string
    name?: string
    unit?: string
    quantity: number
    unit_price: number
    total_price?: number
  }>>([])

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemRow[]>([
    {
      section: 'Tủ bếp',
      index: 1,
      productCode: '',
      productName: 'Tủ bếp trên',
      description: '',
      unitPrice: 0,
      quantity: 0,
      unit: 'cái',
      lineTotal: 0,
      componentsPct: {},
      componentsAmt: {},
      componentsQuantity: {},
      componentsUnitPrice: {}
    }
  ])
  const [projectRevenueTotal, setProjectRevenueTotal] = useState<number>(0)
  const isEdit = mode === 'edit'

  // Helper function to auto-calculate parent total from children in the same row
  const updateParentTotalFromChildren = (row: InvoiceItemRow): InvoiceItemRow => {
    const updated = { ...row }
    
    // Find all parent objects that are selected
    const parentObjects = expenseObjectsOptions.filter(obj => 
      obj.is_parent && selectedExpenseObjectIds.includes(obj.id)
    )
    
    // For each parent, calculate total from its children
    parentObjects.forEach(parent => {
      // Find all children of this parent that are also selected
      const children = expenseObjectsOptions.filter(obj => 
        obj.parent_id === parent.id && selectedExpenseObjectIds.includes(obj.id)
      )
      
      if (children.length > 0) {
        // Calculate total from children - use the actual amount value
        // Priority: componentsAmt > (componentsQuantity * componentsUnitPrice) > (lineTotal * componentsPct / 100)
        let parentTotal = 0
        let parentQuantity = 0
        let parentUnitPrice = 0
        
        children.forEach(child => {
          // Get child amount - prioritize direct amount input
          let childAmt = updated.componentsAmt[child.id]
          
          // If no direct amount, calculate from quantity * unit price
          if (childAmt === undefined || childAmt === 0) {
            const childQty = updated.componentsQuantity[child.id] || 0
            const childUnitPrice = updated.componentsUnitPrice[child.id] || 0
            childAmt = childQty * childUnitPrice
          }
          
          // If still no amount, calculate from percentage
          if (childAmt === 0 || childAmt === undefined) {
            const childPct = updated.componentsPct[child.id] || 0
            const lineTotal = updated.lineTotal || 0
            childAmt = Math.round((lineTotal * childPct) / 100)
          }
          
          const childQty = updated.componentsQuantity[child.id] || 0
          const childUnitPrice = updated.componentsUnitPrice[child.id] || 0
          
          parentTotal += (childAmt || 0)
          parentQuantity += childQty
        })
        
        // Update parent values
        updated.componentsAmt[parent.id] = parentTotal
        
        // Calculate parent percentage based on lineTotal
        const lineTotal = updated.lineTotal || 0
        const parentPct = lineTotal > 0 ? (parentTotal / lineTotal) * 100 : 0
        updated.componentsPct[parent.id] = Math.round(parentPct * 100) / 100
        
        // Update parent quantity and unit price
        // Calculate average unit price if there are quantities
        if (parentQuantity > 0) {
          parentUnitPrice = parentTotal / parentQuantity
        } else if (parentTotal > 0) {
          // If no quantity but has total, set unit price to total
          parentUnitPrice = parentTotal
          parentQuantity = 1
        }
        
        updated.componentsQuantity[parent.id] = parentQuantity
        updated.componentsUnitPrice[parent.id] = Math.round(parentUnitPrice)
      } else {
        // If no children selected, clear parent values
        updated.componentsAmt[parent.id] = 0
        updated.componentsPct[parent.id] = 0
        updated.componentsQuantity[parent.id] = 0
        updated.componentsUnitPrice[parent.id] = 0
      }
    })
    
    return updated
  }

  const updateRow = (rowIndex: number, updater: (row: InvoiceItemRow) => InvoiceItemRow) => {
    setInvoiceItems(prev => {
      const next = [...prev]
      let updated = updater(next[rowIndex])
      
      // Recompute line total
      // Thành tiền = Đơn giá × Diện tích × Số lượng (nếu có diện tích), nếu không thì đơn giá × số lượng
      const unitPrice = Number(updated.unitPrice) || 0
      const quantity = Number(updated.quantity) || 0
      const areaVal = updated.area != null ? Number(updated.area) : null
      
      if (areaVal != null && isFinite(areaVal) && areaVal > 0) {
        // Có diện tích: thành tiền = Đơn giá × Diện tích × Số lượng
        updated.lineTotal = Math.round(unitPrice * areaVal * quantity * 100) / 100
      } else {
        // Không có diện tích: thành tiền = đơn giá × số lượng
        updated.lineTotal = Math.round(unitPrice * quantity * 100) / 100
      }
      
      // Auto-calculate parent totals from children in the same row
      updated = updateParentTotalFromChildren(updated)
      
      next[rowIndex] = updated
      return next
    })
  }

  const addRow = () => {
    setInvoiceItems(prev => [
      ...prev,
      {
        section: prev[prev.length - 1]?.section || '',
        index: prev.length + 1,
        productCode: '',
        productName: '',
        description: '',
        unitPrice: 0,
        quantity: 0,
        unit: 'cái',
        area: null,
        lineTotal: 0,
        componentsPct: {},
        componentsAmt: {},
        componentsQuantity: {},
        componentsUnitPrice: {}
      }
    ])
  }

  const removeRow = (rowIndex: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== rowIndex).map((r, i) => ({ ...r, index: i + 1 })))
  }

  const plannedAmountComputed = invoiceItems.reduce((sum, r) => sum + (Number(r.lineTotal) || 0), 0)

  // Tổng chi phí theo từng đối tượng chi phí được chọn
  const expenseObjectTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    // Initialize all selected expense object IDs to 0
    selectedExpenseObjectIds.forEach(id => { totals[id] = 0 })
    // Calculate totals from invoice items
    invoiceItems.forEach(row => {
      selectedExpenseObjectIds.forEach(id => {
        const pct = Number(row.componentsPct[id] ?? 0)
        const amt = row.componentsAmt[id]
        const value = amt !== undefined ? Number(amt) : Math.round(((row.lineTotal || 0) * pct) / 100)
        totals[id] = (totals[id] || 0) + (value || 0)
      })
    })
    return totals
  }, [invoiceItems, selectedExpenseObjectIds])

  // Combined totals: direct input takes priority, then calculated totals
  const combinedExpenseObjectTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    selectedExpenseObjectIds.forEach(id => {
      totals[id] = directObjectTotals[id] || expenseObjectTotals[id] || 0
    })
    return totals
  }, [directObjectTotals, expenseObjectTotals, selectedExpenseObjectIds])

  // Tổng chi phí đã phân bổ (nếu không có phân bổ thì dùng tổng thành tiền dòng)
  const grandAllocationTotal = useMemo(() => {
    const totalAllocated = invoiceItems.reduce((grand, row) => {
      const rowSum = selectedExpenseObjectIds.reduce((s, id) => {
        const pct = Number(row.componentsPct[id] ?? 0)
        const amt = row.componentsAmt[id]
        const value = amt !== undefined ? Number(amt) : Math.round(((row.lineTotal || 0) * pct) / 100)
        return s + (value || 0)
      }, 0)
      return grand + rowSum
    }, 0)
    // Nếu chưa chọn đối tượng hoặc chưa nhập phân bổ, fallback dùng tổng thành tiền dòng
    return totalAllocated > 0 ? totalAllocated : plannedAmountComputed
  }, [invoiceItems, selectedExpenseObjectIds, plannedAmountComputed])

  const profitComputed = useMemo(() => {
    return (Number(projectRevenueTotal) || 0) - (Number(grandAllocationTotal) || 0)
  }, [projectRevenueTotal, grandAllocationTotal])

  // Hàm xác định màu cảnh báo cho tỷ lệ chi phí so với thành tiền
  const getCostPercentageColor = (cost: number, totalPrice: number): string => {
    if (totalPrice <= 0) {
      return 'text-gray-600' // Không có thành tiền
    }
    const percentage = (cost / totalPrice) * 100
    if (percentage > 100) {
      return 'text-red-600' // Chi phí vượt thành tiền: màu đỏ
    } else if (percentage > 90) {
      return 'text-yellow-600' // Chi phí > 90% thành tiền: màu vàng
    } else {
      return 'text-green-600' // Chi phí <= 90% thành tiền: màu xanh
    }
  }

  // Auto-select expense objects from product_components when both are ready (for both planned and actual expenses)
  useEffect(() => {
    if (
      quoteProductComponents.length > 0 && 
      expenseObjectsOptions.length > 0 && 
      formData.project_id
    ) {
      // Extract unique expense_object_ids from quoteProductComponents (works for both planned and actual)
      const expenseObjectIds = Array.from(new Set(
        quoteProductComponents
          .map(comp => comp.expense_object_id)
          .filter(id => !!id)
      ))
      
      // Only select IDs that exist in expenseObjectsOptions
      const validIds = expenseObjectIds.filter(id => 
        expenseObjectsOptions.some(obj => obj.id === id)
      )
      
      if (validIds.length > 0) {
        setSelectedExpenseObjectIds(validIds)
        const categoryText = category === 'planned' ? 'quote_items' : 'invoice_items'
        console.log(`✅ Auto-selected ${validIds.length} expense objects from ${categoryText} product_components`)
      }
    }
  }, [quoteProductComponents, expenseObjectsOptions, formData.project_id, category])

  // Ensure each row has keys for all selected expense objects
  useEffect(() => {
    setInvoiceItems(prev => prev.map(row => {
      const nextPct: Record<string, number> = { ...row.componentsPct }
      const nextAmt: Record<string, number> = { ...row.componentsAmt }
      const nextQuantity: Record<string, number> = { ...row.componentsQuantity }
      const nextUnitPrice: Record<string, number> = { ...row.componentsUnitPrice }
      selectedExpenseObjectIds.forEach(id => {
        if (nextPct[id] === undefined) nextPct[id] = 0
        if (nextAmt[id] === undefined) nextAmt[id] = 0
        if (nextQuantity[id] === undefined) nextQuantity[id] = 0
        if (nextUnitPrice[id] === undefined) nextUnitPrice[id] = 0
      })
      // Clean removed ids
      Object.keys(nextPct).forEach(id => {
        if (!selectedExpenseObjectIds.includes(id)) delete nextPct[id]
      })
      Object.keys(nextAmt).forEach(id => {
        if (!selectedExpenseObjectIds.includes(id)) delete nextAmt[id]
      })
      Object.keys(nextQuantity).forEach(id => {
        if (!selectedExpenseObjectIds.includes(id)) delete nextQuantity[id]
      })
      Object.keys(nextUnitPrice).forEach(id => {
        if (!selectedExpenseObjectIds.includes(id)) delete nextUnitPrice[id]
      })
      return { 
        ...row, 
        componentsPct: nextPct, 
        componentsAmt: nextAmt,
        componentsQuantity: nextQuantity,
        componentsUnitPrice: nextUnitPrice
      }
    }))
  }, [selectedExpenseObjectIds])

  // Load expense objects to choose columns - NEW VERSION
  const loadExpenseObjectsOptions = async () => {
    if (!userRole) {
      console.log('⏳ Waiting for user role to load expense objects...')
      return
    }
    
    try {
      // Step 1: Load data from API
      let data
      try {
        console.log('🔍 Trying authenticated endpoint for expense objects options...')
        data = await apiGet(`${API_BASE_URL}/api/expense-objects/?active_only=true`)
        console.log('✅ Authenticated endpoint succeeded for options')
      } catch (err) {
        console.log('⚠️ Authenticated endpoint failed for options, trying public endpoint:', err)
        data = await apiGet(`${API_BASE_URL}/api/expense-objects/public?active_only=true`)
        console.log('✅ Public endpoint succeeded for options')
      }
      
      // Step 2: Map data to ExpenseObject format
      const allExpenseObjects = Array.isArray(data) ? data.map((o: any) => ({ 
        id: o.id, 
        name: o.name, 
        description: o.description,
        is_active: o.is_active ?? true,
        parent_id: o.parent_id,
        is_parent: o.is_parent ?? false,
        role: o.role,
        level: o.level
      })) : []
      
      console.log(`📊 Loaded ${allExpenseObjects.length} expense objects from API`)
      
      // Step 3: Process expense objects using new role filter
      const result = processExpenseObjects(allExpenseObjects, userRole, category, isEdit)
      
      // Step 4: Sort options by preferred order
      const normalizeLower = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
      const preferredOrder = [
        'quan ly',       // quản lý
        'thiet ke',      // thiết kế
        'san xuat',      // sản xuất
        'van chuyen',    // vận chuyển
        'lap dat',       // lắp đặt
        'nha dau tu'     // nhà đầu tư
      ]
      
      const sortedOpts = [...result.filteredObjects].sort((a, b) => {
        const na = normalizeLower(a.name)
        const nb = normalizeLower(b.name)
        const ia = preferredOrder.indexOf(na)
        const ib = preferredOrder.indexOf(nb)
        const ra = ia === -1 ? Number.MAX_SAFE_INTEGER : ia
        const rb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
        if (ra !== rb) return ra - rb
        return a.name.localeCompare(b.name, 'vi')
      })
      
      // Step 5: Set state
      setExpenseObjectsOptions(sortedOpts)
      
      // Step 6: Auto-select objects - DISABLED per requirement
      // Do not auto-select any objects; user will choose manually
      console.log('ℹ️ Auto-selection disabled: User must manually choose expense objects')
      
      // Step 7: Set parent object
      if (result.parentObject) {
        setWorkshopParentObject(result.parentObject)
        console.log('🔧 Set parent object:', result.parentObject.name)
      }
      
    } catch (e) {
      console.error('❌ Error loading expense object options:', e)
      setExpenseObjectsOptions([])
    }
  }

  // Load invoice items from backend purchase orders API for selected project
  const loadInvoiceItemsForProject = async (projectId: string) => {
    try {
      // For planned expenses: load quote_items with product_components
      if (category === 'planned') {
        console.log('📋 Loading quote_items with product_components for planned expense, project:', projectId)
        
        // Load revenue (invoices) for profit calculation in planned expenses
        // Use subtotal (before tax) to match with expense amounts (which are also before tax)
        try {
          const { data: invForRevenue } = await supabase
            .from('invoices')
            .select('id, subtotal, total_amount, tax_rate, items')
            .eq('project_id', projectId)
          if (Array.isArray(invForRevenue)) {
            const sumRevenue = invForRevenue.reduce((s: number, inv: any) => {
              // Prefer subtotal (before tax) to match with expense lineTotal
              // Check if subtotal exists and is a valid number (not null, not undefined)
              if (inv.subtotal !== null && inv.subtotal !== undefined && inv.subtotal !== '') {
                const subtotal = Number(inv.subtotal)
                if (!isNaN(subtotal)) {
                  // Use subtotal if it exists (even if 0, as it's a valid value)
                  return s + subtotal
                }
              }
              // Fallback: calculate from total_amount by removing tax
              const totalAmt = Number(inv.total_amount)
              const taxRate = Number(inv.tax_rate) || 10 // Default 10% VAT
              if (!isNaN(totalAmt) && totalAmt > 0) {
                // Calculate subtotal from total_amount: subtotal = total_amount / (1 + tax_rate/100)
                const calculatedSubtotal = totalAmt / (1 + taxRate / 100)
                console.log(`💰 Invoice ${inv.id}: total_amount=${totalAmt}, tax_rate=${taxRate}%, calculated_subtotal=${calculatedSubtotal}`)
                return s + calculatedSubtotal
              }
              // Last fallback: sum items if both subtotal and total_amount missing
              const items = Array.isArray(inv.items) ? inv.items : []
              const itemsSum = items.reduce((ss: number, it: any) => {
                const unitPrice = Number(it.unit_price ?? it.price ?? it.unitPrice) || 0
                const qty = Number(it.quantity ?? it.qty) || 0
                const lineTotal = Number(it.line_total ?? it.total ?? it.lineTotal) || (unitPrice * qty)
                return ss + (lineTotal || 0)
              }, 0)
              return s + itemsSum
            }, 0)
            console.log(`✅ Calculated revenue (subtotal before tax) for planned expense: ${sumRevenue}`)
            setProjectRevenueTotal(sumRevenue)
          } else {
            setProjectRevenueTotal(0)
          }
        } catch (e) {
          console.warn('⚠️ Error loading revenue for planned expense:', e)
          setProjectRevenueTotal(0)
        }
        
        // First, get quote IDs for this project
        const { data: quotesData, error: quotesError } = await supabase
          .from('quotes')
          .select('id')
          .eq('project_id', projectId)
        
        if (quotesError) {
          console.error('❌ Error loading quotes:', quotesError)
          setInvoiceItems([])
          setQuoteProductComponents([])
          return
        }
        
        if (!Array.isArray(quotesData) || quotesData.length === 0) {
          console.log('ℹ️ No quotes found for project')
          setInvoiceItems([])
          setQuoteProductComponents([])
          return
        }
        
        const quoteIds = quotesData.map((q: any) => q.id)
        
        // Load quote_items - try to get components column (product_components may not exist in quote_items)
        // First try with both columns, if fails, try only with components
        let quoteItemsData: any[] | null = null
        let quoteItemsError: any = null
        
        // Try loading with both columns first
        const { data: quoteItemsDataWithBoth, error: errorWithBoth } = await supabase
          .from('quote_items')
          .select('*')
          .in('quote_id', quoteIds)
          .order('created_at', { ascending: true })
        
        if (errorWithBoth) {
          console.warn('⚠️ Error loading quote_items with all columns, trying basic select:', errorWithBoth)
          // Try with minimal columns including product_components
          const { data: basicData, error: basicError } = await supabase
            .from('quote_items')
            .select('id, quote_id, name_product, description, quantity, unit_price, unit, total_price, area, created_at, components, product_components')
            .in('quote_id', quoteIds)
            .order('created_at', { ascending: true })
          
          if (basicError) {
            console.error('❌ Error loading quote_items:', basicError)
            quoteItemsError = basicError
          } else {
            quoteItemsData = basicData
          }
        } else {
          quoteItemsData = quoteItemsDataWithBoth
        }
        
        if (quoteItemsError) {
          console.error('❌ Error loading quote_items:', quoteItemsError)
          setInvoiceItems([])
          setQuoteProductComponents([])
          return
        }
        
        if (!Array.isArray(quoteItemsData) || quoteItemsData.length === 0) {
          console.log('ℹ️ No quote_items found')
          setInvoiceItems([])
          setQuoteProductComponents([])
          return
        }
        
        // Collect all product_components from all quote_items
        const allComponents: Array<{
          expense_object_id: string
          name?: string
          unit?: string
          quantity: number
          unit_price: number
          total_price?: number
        }> = []
        
        // Extract expense_object_ids and create invoice items
        const expenseObjectIdsSet = new Set<string>()
        
        const rows: InvoiceItemRow[] = []
        quoteItemsData.forEach((qi: any) => {
          // Use product_components from quote_items (may also have components as fallback)
          const productComponents = qi.product_components || qi.components || []
          
          if (Array.isArray(productComponents) && productComponents.length > 0) {
            // Collect components for auto-selection and auto-fill
            productComponents.forEach((comp: any) => {
              if (comp?.expense_object_id) {
                expenseObjectIdsSet.add(comp.expense_object_id)
                allComponents.push({
                  expense_object_id: comp.expense_object_id,
                  name: comp.name,
                  unit: comp.unit,
                  quantity: Number(comp.quantity) || 0,
                  unit_price: Number(comp.unit_price) || 0,
                  total_price: Number(comp.total_price) || 0
                })
              }
            })
          }
          
          // Create invoice item row from quote_item
          const unitPrice = Number(qi.unit_price ?? qi.price) || 0
          const quantity = Number(qi.quantity ?? qi.qty) || 0
          const areaVal = qi.area != null ? Number(qi.area) : null
          // Thành tiền = Đơn giá × Diện tích × Số lượng (nếu có diện tích), nếu không thì đơn giá × số lượng
          let lineTotal = Number(qi.total_price ?? qi.subtotal ?? qi.total)
          if (!lineTotal || lineTotal === 0) {
            if (areaVal != null && isFinite(areaVal) && areaVal > 0) {
              lineTotal = Math.round(unitPrice * areaVal * quantity * 100) / 100
            } else {
              lineTotal = Math.round(unitPrice * quantity * 100) / 100
            }
          }
          
          // Prepare components data for this row
          const componentsPct: Record<string, number> = {}
          const componentsAmt: Record<string, number> = {}
          const componentsQuantity: Record<string, number> = {}
          const componentsUnitPrice: Record<string, number> = {}
          
          // Fill components data if product_components exists
          if (Array.isArray(productComponents) && productComponents.length > 0) {
            productComponents.forEach((comp: any) => {
              if (comp?.expense_object_id) {
                const compQty = Number(comp.quantity) || 0
                const compUnitPrice = Number(comp.unit_price) || 0
                // Use total_price from product_components, or calculate from quantity * unit_price
                const compTotal = Number(comp.total_price) || (compQty * compUnitPrice)
                
                // Fill the 4 columns: %, số lượng, đơn giá, thành tiền
                componentsQuantity[comp.expense_object_id] = compQty
                componentsUnitPrice[comp.expense_object_id] = compUnitPrice
                componentsAmt[comp.expense_object_id] = compTotal
                
                // Calculate percentage: (component total / line total) * 100
                if (lineTotal > 0 && compTotal > 0) {
                  const percentage = (compTotal / lineTotal) * 100
                  componentsPct[comp.expense_object_id] = Math.round(percentage * 100) / 100 // Round to 2 decimal places
                } else {
                  componentsPct[comp.expense_object_id] = 0
                }
              }
            })
          }
          
          rows.push({
            section: '',
            index: rows.length + 1,
            productCode: qi.product_code || qi.code || '',
            productName: qi.name_product || qi.product_name || qi.description || '',
            description: qi.description || '',
            unitPrice,
            quantity,
            unit: qi.unit || 'cái',
            area: areaVal,
            lineTotal,
            componentsPct,
            componentsAmt,
            componentsQuantity,
            componentsUnitPrice
          })
        })
        
        // Store components for auto-selection
        setQuoteProductComponents(allComponents)
        
        // Store expense object IDs for auto-selection (will be handled by useEffect)
        if (expenseObjectIdsSet.size > 0) {
          const expenseObjectIds = Array.from(expenseObjectIdsSet)
          console.log(`✅ Found ${expenseObjectIds.length} expense objects from quote_items product_components:`, expenseObjectIds)
        }
        
        if (rows.length > 0) {
          console.log(`✅ Loaded ${rows.length} quote_items with product_components`)
          setInvoiceItems(rows)
          return
        }
      }
      
      // For actual expenses: load invoice_items with product_components
      if (category === 'actual') {
        console.log('💰 Loading invoice_items with product_components for actual expense, project:', projectId)
        
        // First, get invoice IDs for this project
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('id, subtotal, total_amount, tax_rate, items')
          .eq('project_id', projectId)
        
        if (invoicesError) {
          console.error('❌ Error loading invoices:', invoicesError)
          // Continue with fallback logic below
        }
        
        // Load revenue for profit calculation - use subtotal (before tax) to match with expense amounts
        if (Array.isArray(invoicesData) && invoicesData.length > 0) {
          const sumRevenue = invoicesData.reduce((s: number, inv: any) => {
            // Prefer subtotal (before tax) to match with expense lineTotal
            // Check if subtotal exists and is a valid number (not null, not undefined)
            if (inv.subtotal !== null && inv.subtotal !== undefined && inv.subtotal !== '') {
              const subtotal = Number(inv.subtotal)
              if (!isNaN(subtotal)) {
                // Use subtotal if it exists (even if 0, as it's a valid value)
                return s + subtotal
              }
            }
            // Fallback: calculate from total_amount by removing tax
            const totalAmt = Number(inv.total_amount) || 0
            const taxRate = Number(inv.tax_rate) || 10 // Default 10% VAT
            if (totalAmt > 0) {
              // Calculate subtotal from total_amount: subtotal = total_amount / (1 + tax_rate/100)
              const calculatedSubtotal = totalAmt / (1 + taxRate / 100)
              console.log(`💰 Invoice ${inv.id}: total_amount=${totalAmt}, tax_rate=${taxRate}%, calculated_subtotal=${calculatedSubtotal}`)
              return s + calculatedSubtotal
            }
            // Last fallback: sum items if both subtotal and total_amount missing
            const items = Array.isArray(inv.items) ? inv.items : []
            const itemsSum = items.reduce((ss: number, it: any) => {
              const unitPrice = Number(it.unit_price ?? it.price ?? it.unitPrice) || 0
              const qty = Number(it.quantity ?? it.qty) || 0
              const lineTotal = Number(it.line_total ?? it.total ?? it.lineTotal) || (unitPrice * qty)
              return ss + (lineTotal || 0)
            }, 0)
            return s + itemsSum
          }, 0)
          console.log(`✅ Calculated revenue (subtotal before tax) for actual expense (early load): ${sumRevenue}`)
          setProjectRevenueTotal(sumRevenue)
          
          const invoiceIds = invoicesData.map((inv: any) => inv.id)
          
          // Load invoice_items with product_components (or components column)
          let invoiceItemsData: any[] | null = null
          let invoiceItemsError: any = null
          
          // Try loading with all columns first
          const { data: invoiceItemsWithAll, error: errorWithAll } = await supabase
            .from('invoice_items')
            .select('*')
            .in('invoice_id', invoiceIds)
            .order('created_at', { ascending: true })
          
          if (errorWithAll) {
            console.warn('⚠️ Error loading invoice_items with all columns, trying basic select:', errorWithAll)
            // Try with minimal columns including product_components
            const { data: basicData, error: basicError } = await supabase
              .from('invoice_items')
              .select('id, invoice_id, name_product, description, quantity, unit_price, unit, total_price, area, created_at, components, product_components')
              .in('invoice_id', invoiceIds)
              .order('created_at', { ascending: true })
            
            if (basicError) {
              console.error('❌ Error loading invoice_items:', basicError)
              invoiceItemsError = basicError
            } else {
              invoiceItemsData = basicData
            }
          } else {
            invoiceItemsData = invoiceItemsWithAll
          }
          
          if (!invoiceItemsError && Array.isArray(invoiceItemsData) && invoiceItemsData.length > 0) {
            // ===== Chuẩn bị lấy chi phí vật tư thực tế từ sản phẩm =====
            const productIdSet = new Set<string>()
            invoiceItemsData.forEach((ii: any) => {
              if (ii.product_id) {
                productIdSet.add(String(ii.product_id))
              }
            })

            const productComponentsByProductId: Record<string, any[]> = {}
            if (productIdSet.size > 0) {
              const productIds = Array.from(productIdSet)
              const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('id, actual_material_components, product_components')
                .in('id', productIds)

              if (productsError) {
                console.warn('⚠️ Error loading products for actual_material_components, fallback to invoice_items.product_components:', productsError)
              } else if (Array.isArray(productsData)) {
                productsData.forEach((p: any) => {
                  const pid = String(p.id)
                  // Ưu tiên dùng actual_material_components; nếu rỗng thì fallback product_components
                  const actualComps = Array.isArray(p.actual_material_components) ? p.actual_material_components : []
                  const plannedComps = Array.isArray(p.product_components) ? p.product_components : []
                  productComponentsByProductId[pid] = actualComps.length > 0 ? actualComps : plannedComps
                })
              }
            }

            // Collect all components from all invoice_items (dùng để auto-chọn đối tượng chi phí)
            const allComponents: Array<{
              expense_object_id: string
              name?: string
              unit?: string
              quantity: number
              unit_price: number
              total_price?: number
            }> = []
            
            // Extract expense_object_ids and create invoice items
            const expenseObjectIdsSet = new Set<string>()
            
            const rows: InvoiceItemRow[] = []
            invoiceItemsData.forEach((ii: any) => {
              // Với chi phí thực tế: ưu tiên lấy chi phí đối tượng thực tế từ sản phẩm
              let productComponents: any[] = []
              const pid = ii.product_id ? String(ii.product_id) : ''
              if (pid && productComponentsByProductId[pid] && productComponentsByProductId[pid].length > 0) {
                productComponents = productComponentsByProductId[pid]
              } else {
                // Fallback: dùng product_components / components từ invoice_items nếu không có dữ liệu thực tế
                productComponents = ii.product_components || ii.components || []
              }
              
              if (Array.isArray(productComponents) && productComponents.length > 0) {
                // Collect components for auto-selection and auto-fill
                productComponents.forEach((comp: any) => {
                  if (comp?.expense_object_id) {
                    expenseObjectIdsSet.add(comp.expense_object_id)
                    allComponents.push({
                      expense_object_id: comp.expense_object_id,
                      name: comp.name,
                      unit: comp.unit,
                      quantity: Number(comp.quantity) || 0,
                      unit_price: Number(comp.unit_price) || 0,
                      total_price: Number(comp.total_price) || 0
                    })
                  }
                })
              }
              
              // Create invoice item row from invoice_item
              const unitPrice = Number(ii.unit_price ?? ii.price) || 0
              const quantity = Number(ii.quantity ?? ii.qty) || 0
              const areaVal = ii.area != null ? Number(ii.area) : null
              // Thành tiền = Đơn giá × Diện tích × Số lượng (nếu có diện tích), nếu không thì đơn giá × số lượng
              let lineTotal = Number(ii.total_price ?? ii.subtotal ?? ii.total)
              if (!lineTotal || lineTotal === 0) {
                if (areaVal != null && isFinite(areaVal) && areaVal > 0) {
                  lineTotal = Math.round(unitPrice * areaVal * quantity * 100) / 100
                } else {
                  lineTotal = Math.round(unitPrice * quantity * 100) / 100
                }
              }
              
              // Prepare components data cho dòng này
              const componentsPct: Record<string, number> = {}
              const componentsAmt: Record<string, number> = {}
              const componentsQuantity: Record<string, number> = {}
              const componentsUnitPrice: Record<string, number> = {}
              
              // Fill components data if product_components exists
              if (Array.isArray(productComponents) && productComponents.length > 0) {
                productComponents.forEach((comp: any) => {
                  if (comp?.expense_object_id) {
                    const compQty = Number(comp.quantity) || 0
                    const compUnitPrice = Number(comp.unit_price) || 0
                    // Use total_price from product_components, or calculate from quantity * unit_price
                    const compTotal = Number(comp.total_price) || (compQty * compUnitPrice)
                    
                    // Fill the 4 columns: %, số lượng, đơn giá, thành tiền
                    componentsQuantity[comp.expense_object_id] = compQty
                    componentsUnitPrice[comp.expense_object_id] = compUnitPrice
                    componentsAmt[comp.expense_object_id] = compTotal
                    
                    // Calculate percentage: (component total / line total) * 100
                    if (lineTotal > 0 && compTotal > 0) {
                      const percentage = (compTotal / lineTotal) * 100
                      componentsPct[comp.expense_object_id] = Math.round(percentage * 100) / 100 // Round to 2 decimal places
                    } else {
                      componentsPct[comp.expense_object_id] = 0
                    }
                  }
                })
              }
              
              rows.push({
                section: '',
                index: rows.length + 1,
                productCode: ii.product_code || ii.code || '',
                productName: ii.name_product || ii.product_name || ii.description || '',
                description: ii.description || '',
                unitPrice,
                quantity,
                unit: ii.unit || 'cái',
                area: areaVal,
                lineTotal,
                componentsPct,
                componentsAmt,
                componentsQuantity,
                componentsUnitPrice
              })
            })
            
            // Store components for auto-selection
            setQuoteProductComponents(allComponents)
            
            // Store expense object IDs for auto-selection (will be handled by useEffect)
            if (expenseObjectIdsSet.size > 0) {
              const expenseObjectIds = Array.from(expenseObjectIdsSet)
              console.log(`✅ Found ${expenseObjectIds.length} expense objects from invoice_items product_components:`, expenseObjectIds)
            }
            
            if (rows.length > 0) {
              console.log(`✅ Loaded ${rows.length} invoice_items with product_components`)
              setInvoiceItems(rows)
              return
            }
          }
        }
      }
      
      // For actual expenses: load revenue and continue with fallback logic if no invoice_items with product_components found
      if (category === 'actual') {
        // Load revenue (invoices) to compute profit
        // Use subtotal (before tax) to match with expense amounts (which are also before tax)
        try {
          const { data: invForRevenue } = await supabase
            .from('invoices')
            .select('id, subtotal, total_amount, tax_rate, items')
            .eq('project_id', projectId)
          if (Array.isArray(invForRevenue)) {
            const sumRevenue = invForRevenue.reduce((s: number, inv: any) => {
              // Prefer subtotal (before tax) to match with expense lineTotal
              // Check if subtotal exists and is a valid number (not null, not undefined)
              if (inv.subtotal !== null && inv.subtotal !== undefined && inv.subtotal !== '') {
                const subtotal = Number(inv.subtotal)
                if (!isNaN(subtotal)) {
                  // Use subtotal if it exists (even if 0, as it's a valid value)
                  return s + subtotal
                }
              }
              // Fallback: calculate from total_amount by removing tax
              const totalAmt = Number(inv.total_amount)
              const taxRate = Number(inv.tax_rate) || 10 // Default 10% VAT
              if (!isNaN(totalAmt) && totalAmt > 0) {
                // Calculate subtotal from total_amount: subtotal = total_amount / (1 + tax_rate/100)
                const calculatedSubtotal = totalAmt / (1 + taxRate / 100)
                console.log(`💰 Invoice ${inv.id}: total_amount=${totalAmt}, tax_rate=${taxRate}%, calculated_subtotal=${calculatedSubtotal}`)
                return s + calculatedSubtotal
              }
              // Last fallback: sum items if both subtotal and total_amount missing
              const items = Array.isArray(inv.items) ? inv.items : []
              const itemsSum = items.reduce((ss: number, it: any) => {
                const unitPrice = Number(it.unit_price ?? it.price ?? it.unitPrice) || 0
                const qty = Number(it.quantity ?? it.qty) || 0
                const lineTotal = Number(it.line_total ?? it.total ?? it.lineTotal) || (unitPrice * qty)
                return ss + (lineTotal || 0)
              }, 0)
              return s + itemsSum
            }, 0)
            console.log(`✅ Calculated revenue (subtotal before tax) for actual expense: ${sumRevenue}`)
            setProjectRevenueTotal(sumRevenue)
          } else {
            setProjectRevenueTotal(0)
          }
        } catch (_re) {
          setProjectRevenueTotal(0)
        }
        
        // Fallback for actual expenses: continue with existing logic
        try {
          // Try purchase orders first (have structured line_items)
          const params = new URLSearchParams()
          params.append('project_id', projectId)
          const url = `${API_BASE_URL}/api/expenses/purchase-orders?${params.toString()}`
          const poList = await apiGet(url)

          if (Array.isArray(poList) && poList.length > 0) {
            const rows: InvoiceItemRow[] = []
            poList.forEach((po: any, idx: number) => {
              const sectionName = ''
              const items = Array.isArray(po.line_items) ? po.line_items : []
              items.forEach((li: any, liIdx: number) => {
                const unitPrice = Number(li.unit_price) || 0
                const quantity = Number(li.quantity) || 0
                const areaVal = li.area != null ? Number(li.area) : null
                // Thành tiền = Đơn giá × Diện tích × Số lượng (nếu có diện tích), nếu không thì đơn giá × số lượng
                let lineTotal = Number(li.line_total)
                if (!lineTotal || lineTotal === 0) {
                  if (areaVal != null && isFinite(areaVal) && areaVal > 0) {
                    lineTotal = Math.round(unitPrice * areaVal * quantity * 100) / 100
                  } else {
                    lineTotal = Math.round(unitPrice * quantity * 100) / 100
                  }
                }
                rows.push({
                  section: sectionName,
                  index: rows.length + 1,
                  productCode: '',
                  productName: li.product_name || li.description || '',
                  unitPrice,
                  quantity,
                  unit: li.unit || 'cái',
                  area: areaVal,
                  lineTotal,
                  componentsPct: {},
                  componentsAmt: {},
                  componentsQuantity: {},
                  componentsUnitPrice: {}
                })
              })
            })
            setInvoiceItems(rows)
            return
          }

          // Fallback A: load invoices for this project directly from Supabase and map their embedded JSON items
          const { data: invoices, error } = await supabase
            .from('invoices')
            .select('id, items, created_at')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

          if (!error && Array.isArray(invoices)) {
            const rows: InvoiceItemRow[] = []
            invoices.forEach((inv: any) => {
              const items = Array.isArray(inv.items) ? inv.items : []
              items.forEach((it: any) => {
                const unitPrice = Number(it.unit_price ?? it.price ?? it.unitPrice) || 0
                const quantity = Number(it.quantity ?? it.qty) || 0
                const areaVal = it.area != null ? Number(it.area) : null
                // Thành tiền = Đơn giá × Diện tích × Số lượng (nếu có diện tích), nếu không thì đơn giá × số lượng
                let lineTotal = Number(it.line_total ?? it.total ?? it.lineTotal)
                if (!lineTotal || lineTotal === 0) {
                  if (areaVal != null && isFinite(areaVal) && areaVal > 0) {
                    lineTotal = Math.round(unitPrice * areaVal * quantity * 100) / 100
                  } else {
                    lineTotal = Math.round(unitPrice * quantity * 100) / 100
                  }
                }
                rows.push({
                  section: '',
                  index: rows.length + 1,
                  productCode: it.product_code || it.code || '',
                  productName: it.product_name || it.name || it.description || '',
                  description: it.description || '',
                  unitPrice,
                  quantity,
                  unit: it.unit || 'cái',
                  area: areaVal,
                  lineTotal,
                  componentsPct: {},
                  componentsAmt: {},
                  componentsQuantity: {},
                  componentsUnitPrice: {}
                })
              })
            })
            if (rows.length > 0) {
              setInvoiceItems(rows)
              return
            }
          }

          // Fallback B: load invoice_items rows for all invoices of the project
          const { data: invIdsData, error: invIdsErr } = await supabase
            .from('invoices')
            .select('id')
            .eq('project_id', projectId)

          if (!invIdsErr && Array.isArray(invIdsData) && invIdsData.length > 0) {
            const invoiceIds = invIdsData.map((r: any) => r.id)
            const { data: itemRows, error: itemsErr } = await supabase
              .from('invoice_items')
              .select('*')
              .in('invoice_id', invoiceIds)
              .order('created_at', { ascending: true })

            if (!itemsErr && Array.isArray(itemRows) && itemRows.length > 0) {
              const rows: InvoiceItemRow[] = []
              itemRows.forEach((it: any) => {
                const unitPrice = Number(it.unit_price ?? it.price) || 0
                const quantity = Number(it.quantity ?? it.qty) || 0
                const areaVal = it.area != null ? Number(it.area) : null
                // Thành tiền = Đơn giá × Diện tích × Số lượng (nếu có diện tích), nếu không thì đơn giá × số lượng
                let lineTotal = Number(it.total_price ?? it.subtotal ?? it.total)
                if (!lineTotal || lineTotal === 0) {
                  if (areaVal != null && isFinite(areaVal) && areaVal > 0) {
                    lineTotal = Math.round(unitPrice * areaVal * quantity * 100) / 100
                  } else {
                    lineTotal = Math.round(unitPrice * quantity * 100) / 100
                  }
                }
                rows.push({
                  section: '',
                  index: rows.length + 1,
                  productCode: it.product_code || it.code || '',
                  productName: it.name_product || it.description || '',
                  description: it.description || '',
                  unitPrice,
                  quantity,
                  unit: it.unit || 'cái',
                  area: areaVal,
                  lineTotal,
                  componentsPct: {},
                  componentsAmt: {},
                  componentsQuantity: {},
                  componentsUnitPrice: {}
                })
              })
              if (rows.length > 0) {
                setInvoiceItems(rows)
                return
              }
            }
          }
        } catch (e) {
          console.error('❌ Error loading invoice items for project:', e)
          // Keep current invoiceItems if load fails
        }
      }
    } catch (e) {
      console.error('❌ Error loading invoice items for project:', e)
      // Keep current invoiceItems if load fails
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
      fetchEmployees()
      if (!isEdit) {
        resetForm()
      }
    }
  }, [isOpen])

  // Load user role and expense objects when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Load user role and employee info first
      ;(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user?.id) {
            // Load user role and employee info
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role, full_name, email')
              .eq('id', session.user.id)
              .single()
            
            if (!userError && userData) {
              // Map role cũ sang role mới
              let mappedRole = userData.role
              if (userData.role === 'workshop_employee') {
                mappedRole = 'Supplier'
                console.log('🔄 Mapped workshop_employee to Supplier')
              }
              
              setUserRole(mappedRole)
              // Tự động điền role của user (đã được map)
              setSelectedRole(mappedRole)
              
              // Kiểm tra xem user có tồn tại trong bảng employees không
              const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('id')
                .eq('id', session.user.id)
                .single()
              
              if (!employeeError && employeeData) {
                // Tự động điền employee_id của user hiện tại
                setFormData(prev => ({
                  ...prev,
                  employee_id: session.user.id
                }))
                console.log('✅ Auto-filled employee_id:', session.user.id)
              } else {
                console.log('⚠️ User not found in employees table, employee_id will be empty')
                // Không auto-fill employee_id nếu user không có trong bảng employees
              }
              
              console.log('✅ Auto-filled user info:', {
                original_role: userData.role,
                mapped_role: mappedRole,
                employee_id: employeeData ? session.user.id : 'not found in employees table',
                full_name: userData.full_name
              })
              
              // Expense objects will be loaded by the consolidated useEffect
            }
          }
        } catch (err) {
          console.error('Error loading user info:', err)
        }
      })()
    }
  }, [isOpen])


  // Validate parent-child logic: tổng con = cha
  const validateParentChildLogic = (directObjectTotals: Record<string, number>, parentAmount: number) => {
    const childrenTotal = Object.values(directObjectTotals).reduce((sum, amount) => sum + (amount || 0), 0)
    const isValid = Math.abs(childrenTotal - parentAmount) < 0.01 // Allow small floating point differences
    
    console.log('🔍 Parent-Child Validation:')
    console.log('📊 Children total (tổng con):', childrenTotal)
    console.log('📊 Parent amount (cha):', parentAmount)
    console.log('📊 Difference:', Math.abs(childrenTotal - parentAmount))
    console.log('📊 Is valid (tổng con = cha):', isValid)
    
    if (!isValid) {
      console.error('❌ Parent-Child Logic Violation: Tổng con ≠ cha')
      console.error('📊 Children total:', childrenTotal)
      console.error('📊 Parent amount:', parentAmount)
      console.error('📊 Difference:', Math.abs(childrenTotal - parentAmount))
    }
    
    return isValid
  }


  // Cascade delete: xóa cha thì con cũng bị xóa
  const deleteExpenseWithCascade = async (expenseId: string) => {
    try {
      console.log('🗑️ Deleting expense with cascade:', expenseId)
      
      // First, delete all child expenses
      console.log('🔍 Step 1: Deleting child expenses...')
      const { error: deleteChildrenError } = await supabase
        .from('project_expenses')
        .delete()
        .eq('id_parent', expenseId)
      
      if (deleteChildrenError) {
        console.error('❌ Error deleting child expenses:', deleteChildrenError)
        return false
      }
      
      console.log('✅ Child expenses deleted successfully')
      
      // Then, delete the parent expense
      console.log('🔍 Step 2: Deleting parent expense...')
      const { error: deleteParentError } = await supabase
        .from('project_expenses')
        .delete()
        .eq('id', expenseId)
      
      if (deleteParentError) {
        console.error('❌ Error deleting parent expense:', deleteParentError)
        return false
      }
      
      console.log('✅ Parent expense deleted successfully')
      console.log('✅ Cascade delete completed: Xóa cha thì con cũng bị xóa')
      
      return true
      
    } catch (error) {
      console.error('❌ Error in cascade delete:', error)
      return false
    }
  }


  // Load expense objects when userRole, category, or isOpen changes - CONSOLIDATED
  useEffect(() => {
    if (userRole && isOpen && category) {
      console.log(`🔄 Loading expense objects for role: ${userRole}, category: ${category}`)
      // Only clear selection if not in update mode (not editing existing expense)
      if (!selectedExpenseToUpdate) {
        console.log('🔄 Clear current selection to trigger auto-selection with new category')
      setSelectedExpenseObjectIds([])
      } else {
        console.log('🔄 Preserving current selection for update mode')
      }
      // Load expense objects
      loadExpenseObjectsOptions()
    }
  }, [userRole, category, isOpen, selectedExpenseToUpdate])

  // Auto-select expense objects based on role when options are loaded (for create mode)
  useEffect(() => {
    if (expenseObjectsOptions.length > 0 && !isEdit && selectedExpenseObjectIds.length === 0 && userRole) {
      // Chỉ auto-select cho workshop employee khi tạo actual expense
      if (userRole === 'workshop_employee' && category === 'actual') {
        // Logic này sẽ được xử lý trong useEffect riêng cho workshop employee
        return
      }
      
      // Cho các role khác, không auto-select mặc định
      console.log(`📋 No auto-selection for ${userRole} - user needs to manually select expense objects`)
    }
  }, [expenseObjectsOptions, isEdit, selectedExpenseObjectIds.length, userRole, category])

  // Auto-select children objects for Supplier when creating actual expense - DISABLED per requirement
  useEffect(() => {
    if (userRole === 'Supplier' && category === 'actual' && expenseObjectsOptions.length > 0 && !isEdit) {
      // Do not auto-select any expense objects; user will choose manually
      console.log('ℹ️ Auto-selection disabled: Supplier must manually choose expense objects')
    }
  }, [userRole, category, expenseObjectsOptions, isEdit])

  // Auto-select children objects for all roles when expense objects are loaded - DISABLED per requirement
  useEffect(() => {
    if (expenseObjectsOptions.length > 0 && selectedExpenseObjectIds.length === 0 && userRole && category === 'actual' && !isEdit) {
      // Do not auto-select; user will choose manually
      console.log('ℹ️ Auto-selection disabled: Users must manually choose expense objects')
    }
  }, [expenseObjectsOptions, selectedExpenseObjectIds.length, userRole, category, isEdit])

  // Set workshop parent object for all users when they select children objects
  useEffect(() => {
    console.log('🔍 Debug parent object detection:', { 
      selectedExpenseObjectIds: selectedExpenseObjectIds.length,
      expenseObjectsOptions: expenseObjectsOptions.length,
      userRole,
      category
    })
    
    // Debug: Hiển thị tất cả expense objects options
    console.log('🔍 All expense objects options:', expenseObjectsOptions.map(o => ({
      id: o.id,
      name: o.name,
      is_parent: o.is_parent,
      parent_id: o.parent_id
    })))
    
    // Debug: Hiển thị selected expense object IDs
    console.log('🔍 Selected expense object IDs:', selectedExpenseObjectIds)
    
    // Debug: Hiển thị workshop parent object hiện tại
    console.log('🔍 Current workshop parent object:', workshopParentObject?.name)
    
    if (selectedExpenseObjectIds.length > 0 && expenseObjectsOptions.length > 0) {
      // Tìm parent object của các children được chọn
      const firstChild = expenseObjectsOptions.find(o => selectedExpenseObjectIds.includes(o.id))
      console.log('🔍 First child found:', firstChild?.name, 'parent_id:', firstChild?.parent_id)
      
      if (firstChild && firstChild.parent_id) {
        const parentObject = expenseObjectsOptions.find(o => o.id === firstChild.parent_id)
        console.log('🔍 Parent object found:', parentObject?.name, 'is_parent:', parentObject?.is_parent)
        
        if (parentObject && parentObject.is_parent) {
          setWorkshopParentObject(parentObject)
          console.log(`✅ Set parent object for children:`, parentObject.name)
        }
      } else {
        // Fallback: Tìm parent object theo tên pattern
        const parentObject = expenseObjectsOptions.find(o => 
          o.is_parent && (
            o.name.includes('Xưởng') || o.name.includes('xuong') || o.name.includes('sản xuất') ||
            o.name.includes('Nguyên vật liệu') || o.name.includes('nguyen vat lieu') ||
            o.name.includes('Vật liệu') || o.name.includes('vat lieu')
          )
        )
        
        if (parentObject) {
          setWorkshopParentObject(parentObject)
          console.log(`✅ Set parent object by pattern:`, parentObject.name)
        } else {
          console.log('❌ No parent object found for children')
        }
      }
    } else {
      setWorkshopParentObject(null)
      console.log('❌ Clear parent object - no children selected')
    }
  }, [selectedExpenseObjectIds, expenseObjectsOptions, userRole, category])

  // Load existing expense when in edit mode
  useEffect(() => {
    const loadForEdit = async () => {
      if (!isOpen || !isEdit || !editId) return
      try {
        const tableName = category === 'planned' ? 'project_expenses_quote' : 'project_expenses'
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', editId)
          .single()
        if (error) throw error
        if (!data) return
        setFormData(prev => ({
          ...prev,
          project_id: data.project_id || '',
          employee_id: data.employee_id || '',
          category: category,
          description: data.description || '',
          expense_object_id: data.expense_object_id || '',
          planned_amount: Number(data.amount) || 0,
          actual_amount: category === 'actual' ? Number(data.amount) || 0 : 0,
          expense_date: data.expense_date || new Date().toISOString().split('T')[0],
          status: data.status || 'pending',
          notes: data.notes || '',
          receipt_url: data.receipt_url || '',
          currency: data.currency || 'VND',
          id_parent: data.id_parent || ''
        }))
        // Use current user's role instead of saved role
        setSelectedRole(userRole || '')
        const columns: string[] = Array.isArray(data.expense_object_columns) ? data.expense_object_columns : []
        // Only set columns if we have saved data, otherwise keep current selection
        if (columns.length > 0) {
          setSelectedExpenseObjectIds(columns)
          console.log('✅ Loaded expense object columns for edit:', columns)
        } else {
          console.log('📝 No saved expense object columns, keeping current selection or will auto-select all')
        }
        if (Array.isArray(data.invoice_items) && data.invoice_items.length > 0) {
          console.log('📋 Loading invoice_items for edit:', data.invoice_items)
          const rows: InvoiceItemRow[] = data.invoice_items.map((it: any, idx: number) => {
            const componentsPct = it.components_pct || {}
            const componentsAmt: Record<string, number> = {}
            const componentsQuantity: Record<string, number> = it.components_quantity || {}
            const componentsUnitPrice: Record<string, number> = it.components_unit_price || {}
            
            // Load components quantity and unit price from invoice_items
            if (it.components_quantity) {
              Object.entries(it.components_quantity).forEach(([objectId, quantity]) => {
                componentsQuantity[objectId] = Number(quantity) || 0
              })
            }
            
            if (it.components_unit_price) {
              Object.entries(it.components_unit_price).forEach(([objectId, unitPrice]) => {
                componentsUnitPrice[objectId] = Number(unitPrice) || 0
              })
            }
            
            // Calculate lineTotal with area support - Always recalculate to ensure accuracy
            const unitPrice = Number(it.unit_price) || 0
            const quantity = Number(it.quantity) || 0
            let areaVal = it.area != null ? Number(it.area) : null
            
            // If area is missing but we have line_total, try to calculate area backwards
            // This handles cases where area wasn't saved in older records
            if ((areaVal == null || areaVal === 0) && unitPrice > 0 && quantity > 0) {
              const storedLineTotal = Number(it.line_total) || 0
              const calculatedWithoutArea = Math.round(unitPrice * quantity * 100) / 100
              // If stored line_total is different from calculated (without area), 
              // it likely means area was used in the original calculation
              if (storedLineTotal > 0 && Math.abs(storedLineTotal - calculatedWithoutArea) > 0.01) {
                // Calculate area backwards: area = line_total / (unitPrice * quantity)
                const calculatedArea = storedLineTotal / (unitPrice * quantity)
                if (calculatedArea > 0 && isFinite(calculatedArea)) {
                  areaVal = Math.round(calculatedArea * 100) / 100 // Round to 2 decimal places
                  console.log('🔧 Calculated area backwards from line_total:', areaVal, 'for product:', it.product_name)
                }
              }
            }
            
            // Thành tiền = Đơn giá × Diện tích × Số lượng (nếu có diện tích), nếu không thì đơn giá × số lượng
            // Always recalculate lineTotal based on current values, don't trust stored value
            console.log('🔍 Loading invoice item for edit:', {
              productName: it.product_name,
              unitPrice,
              quantity,
              area: it.area,
              areaVal,
              storedLineTotal: it.line_total
            })
            let lineTotal: number
            if (areaVal != null && isFinite(areaVal) && areaVal > 0) {
              lineTotal = Math.round(unitPrice * areaVal * quantity * 100) / 100
              console.log('✅ Calculated lineTotal with area:', lineTotal, '= unitPrice', unitPrice, '× area', areaVal, '× quantity', quantity)
            } else {
              lineTotal = Math.round(unitPrice * quantity * 100) / 100
              console.log('⚠️ Calculated lineTotal without area:', lineTotal, '= unitPrice', unitPrice, '× quantity', quantity, '(area:', areaVal, ')')
            }
            
            // Calculate componentsAmt from componentsPct and lineTotal
            Object.keys(componentsPct).forEach(id => {
              const pct = Number(componentsPct[id]) || 0
              componentsAmt[id] = Math.round((lineTotal * pct) / 100)
            })
            
            return {
              section: '',
              index: idx + 1,
              productCode: '',
              productName: it.product_name || it.description || '',
              description: it.description || '',
              unitPrice,
              quantity,
              unit: it.unit || 'cái',
              area: areaVal,
              lineTotal,
              componentsPct,
              componentsAmt,
              componentsQuantity,
              componentsUnitPrice
            }
          })
          setInvoiceItems(rows)
          console.log('✅ Loaded invoice items for edit:', rows.length, 'rows with components:', rows.map(r => ({ 
            productName: r.productName, 
            componentsPct: r.componentsPct, 
            componentsAmt: r.componentsAmt 
          })))
        }
        // Only load project invoice items if we don't have existing invoice_items data
        if (data.project_id && (!Array.isArray(data.invoice_items) || data.invoice_items.length === 0)) {
          console.log('📋 No existing invoice items, loading from project...')
          await loadInvoiceItemsForProject(data.project_id)
        } else {
          console.log('✅ Using existing invoice items from database')
        }
      } catch (e) {
        console.error('❌ Error loading expense for edit:', e)
      }
    }
    loadForEdit()
  }, [isOpen, isEdit, editId, category])

  // Load parent expenses based on category
  useEffect(() => {
    const loadParents = async () => {
      if (!formData.project_id) {
        setParentQuotes([])
        setParentExpenses([])
        return
      }
      try {
        if (category === 'planned') {
          // Load from project_expenses_quote for planned expenses
          const { data, error } = await supabase
            .from('project_expenses_quote')
            .select('id, expense_code, description, amount')
            .eq('project_id', formData.project_id)
            .order('created_at', { ascending: false })
          if (error) throw error
          setParentQuotes(data || [])
        } else {
          // Load from project_expenses for actual expenses
          const { data, error } = await supabase
            .from('project_expenses')
            .select('id, expense_code, description, amount')
            .eq('project_id', formData.project_id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
          if (error) throw error
          setParentExpenses(data || [])
        }
      } catch (e) {
        console.error('❌ Error fetching parent expenses:', e)
        setParentQuotes([])
        setParentExpenses([])
      }
    }
    loadParents()
  }, [formData.project_id, category])
  
  // Load expenses for dropdown when project changes
  useEffect(() => {
    if (category === 'actual' && formData.project_id) {
      loadExpensesForDropdown(formData.project_id)
    } else {
      setExpenseDropdownOptions([])
      setSelectedExpenseForUpdate('')
      setSelectedExpenseToUpdate(null)
    }
  }, [formData.project_id, category])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching projects from database...')
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, project_code, status, budget')
        .in('status', ['planning', 'active'])
        .order('name', { ascending: true })
      
      if (error) {
        console.error('❌ Supabase error fetching projects:', error)
        throw error
      }
      
      console.log('✅ Projects fetched successfully:', data?.length || 0)
      setProjects(data || [])
    } catch (error) {
      console.error('❌ Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      console.log('🔍 Fetching employees from database...')
      
      const { data, error } = await supabase
        .from('employees')
        .select('id, user_id, first_name, last_name, email')
        .order('first_name', { ascending: true })
      
      if (error) {
        console.error('❌ Supabase error fetching employees:', error)
        throw error
      }
      
      const mapped: Employee[] = (data || []).map((e: any) => ({
        id: e.id,
        full_name: ((e.first_name || '') + ' ' + (e.last_name || '')).trim() || e.email || e.id,
        email: e.email
      }))
      
      console.log('✅ Employees fetched successfully:', mapped.length)
      setEmployees(mapped)

      // Auto-select current user's employee record for convenience
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id && !isEdit) {
          const current = (data || []).find((e: any) => e.user_id === session.user.id)
          if (current) {
            setFormData(prev => ({ ...prev, employee_id: current.id }))
          }
        }
      } catch (_e) {
        // ignore
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
    }
  }

  // Load existing expenses for update selection
  const loadExistingExpenses = async () => {
    try {
      if (!formData.project_id) {
        console.log('❌ No project selected')
        return
      }
      
      console.log('🔍 Loading existing actual expenses for project:', formData.project_id)
      
      const { data, error } = await supabase
        .from('project_expenses')
        .select('*')
        .eq('project_id', formData.project_id)
        .is('id_parent', null) // Only load parent expenses
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error loading existing expenses:', error)
        return
      }
      
      console.log('✅ Loaded existing expenses:', data?.length || 0)
      setExistingExpenses(data || [])
      setShowExpenseSelector(true)
    } catch (error) {
      console.error('❌ Error in loadExistingExpenses:', error)
    }
  }
  
  // Load expenses for dropdown
  const loadExpensesForDropdown = async (projectId: string) => {
    try {
      if (!projectId) {
        setExpenseDropdownOptions([])
        return
      }
      
      console.log('🔍 Loading expenses for dropdown, project:', projectId)
      
      const { data, error } = await supabase
        .from('project_expenses')
        .select('*')
        .eq('project_id', projectId)
        .is('id_parent', null) // Only load parent expenses
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error loading expenses for dropdown:', error)
        return
      }
      
      console.log('✅ Loaded expenses for dropdown:', data?.length || 0)
      setExpenseDropdownOptions(data || [])
    } catch (error) {
      console.error('❌ Error in loadExpensesForDropdown:', error)
    }
  }
  
  // Handle expense selection from dropdown
  const handleExpenseSelection = async (expenseId: string) => {
    try {
      if (!expenseId) {
        setSelectedExpenseForUpdate('')
        setSelectedExpenseToUpdate(null)
        return
      }
      
      console.log('🔍 Handling expense selection:', expenseId)
      
      const selectedExpense = expenseDropdownOptions.find(exp => exp.id === expenseId)
      if (!selectedExpense) {
        console.error('❌ Selected expense not found')
        return
      }
      
      console.log('✅ Selected expense:', selectedExpense)
      
      // Load expense data for update
      await loadExpenseDataForUpdate(selectedExpense)
      
      setSelectedExpenseForUpdate(expenseId)
    } catch (error) {
      console.error('❌ Error in handleExpenseSelection:', error)
    }
  }
  
  // Load expense data for update
  const loadExpenseDataForUpdate = async (expense: any) => {
    try {
      console.log('🔍 Loading expense data for update:', expense.id)
      
      // Load parent expense
      const { data: parentData, error: parentError } = await supabase
        .from('project_expenses')
        .select('*')
        .eq('id', expense.id)
        .single()
      
      if (parentError) {
        console.error('❌ Error loading parent expense:', parentError)
        return
      }
      
      // Load child expenses
      const { data: childData, error: childError } = await supabase
        .from('project_expenses')
        .select('*')
        .eq('id_parent', expense.id)
      
      if (childError) {
        console.error('❌ Error loading child expenses:', childError)
        return
      }
      
      console.log('✅ Loaded parent expense:', parentData)
      console.log('✅ Loaded child expenses:', childData?.length || 0)
      
      // Populate form with expense data
      setFormData({
        ...formData,
        project_id: parentData.project_id || '',
        employee_id: parentData.employee_id || '',
        category: 'actual',
        description: parentData.description || '',
        expense_object_id: parentData.expense_object_id || '',
        planned_amount: 0,
        actual_amount: Number(parentData.amount) || 0,
        expense_date: parentData.expense_date || new Date().toISOString().split('T')[0],
        status: parentData.status || 'pending',
        notes: parentData.notes || '',
        receipt_url: parentData.receipt_url || '',
        currency: parentData.currency || 'VND',
        id_parent: parentData.id_parent || ''
      })
      
      // Preserve current expense object selections based on user role
      // Don't reset selectedExpenseObjectIds - let role-based filtering handle display
      console.log('🔍 Preserving current expense object selections for role-based display')
      console.log('📊 Current selectedExpenseObjectIds:', selectedExpenseObjectIds)
      console.log('📊 User role:', userRole)
      console.log('📊 Saved expense_object_columns:', parentData.expense_object_columns)
      
      // Trigger role-based filtering to update display without changing selections
      if (expenseObjectsOptions.length > 0) {
        console.log('🔄 Triggering role-based filtering for expense objects display')
        // The role-based filtering will be handled by the existing useEffect
        // that watches userRole, category, and isOpen
      }
      
      // Populate invoice items
      if (Array.isArray(parentData.invoice_items) && parentData.invoice_items.length > 0) {
        const rows: InvoiceItemRow[] = parentData.invoice_items.map((it: any, idx: number) => {
          const componentsPct = it.components_pct || {}
          const componentsAmt: Record<string, number> = {}
          const componentsQuantity: Record<string, number> = it.components_quantity || {}
          const componentsUnitPrice: Record<string, number> = it.components_unit_price || {}
          
          // Load components quantity and unit price from invoice_items
          if (it.components_quantity) {
            Object.entries(it.components_quantity).forEach(([objectId, quantity]) => {
              componentsQuantity[objectId] = Number(quantity as any) || 0
            })
          }
          
          if (it.components_unit_price) {
            Object.entries(it.components_unit_price).forEach(([objectId, unitPrice]) => {
              componentsUnitPrice[objectId] = Number(unitPrice as any) || 0
            })
          }
          
          // Calculate lineTotal with area support - Always recalculate to ensure accuracy
          const unitPrice = Number(it.unit_price) || 0
          const quantity = Number(it.quantity) || 0
          let areaVal = it.area != null ? Number(it.area) : null
          
          // If area is missing but we have line_total, try to calculate area backwards
          // This handles cases where area wasn't saved in older records
          if ((areaVal == null || areaVal === 0) && unitPrice > 0 && quantity > 0) {
            const storedLineTotal = Number(it.line_total) || 0
            const calculatedWithoutArea = Math.round(unitPrice * quantity * 100) / 100
            // If stored line_total is different from calculated (without area), 
            // it likely means area was used in the original calculation
            if (storedLineTotal > 0 && Math.abs(storedLineTotal - calculatedWithoutArea) > 0.01) {
              // Calculate area backwards: area = line_total / (unitPrice * quantity)
              const calculatedArea = storedLineTotal / (unitPrice * quantity)
              if (calculatedArea > 0 && isFinite(calculatedArea)) {
                areaVal = Math.round(calculatedArea * 100) / 100 // Round to 2 decimal places
                console.log('🔧 Calculated area backwards from line_total:', areaVal, 'for product:', it.product_name)
              }
            }
          }
          
          // Thành tiền = Đơn giá × Diện tích × Số lượng (nếu có diện tích), nếu không thì đơn giá × số lượng
          // Always recalculate lineTotal based on current values, don't trust stored value
          let lineTotal: number
          if (areaVal != null && isFinite(areaVal) && areaVal > 0) {
            lineTotal = Math.round(unitPrice * areaVal * quantity * 100) / 100
          } else {
            lineTotal = Math.round(unitPrice * quantity * 100) / 100
          }
          
          Object.keys(componentsPct).forEach((key: string) => {
            const pct = Number(componentsPct[key]) || 0
            componentsAmt[key] = Math.round((lineTotal * pct) / 100)
          })
          
          return {
            section: '',
            index: idx + 1,
            productCode: '',
            productId: it.product_id || '',
            productName: it.product_name || '',
            description: it.description || '',
            quantity,
            unit: it.unit || 'cái',
            unitPrice,
            area: areaVal,
            lineTotal,
            componentsPct,
            componentsAmt,
            componentsQuantity,
            componentsUnitPrice
          }
        })
        setInvoiceItems(rows)
      }
      
      setSelectedExpenseToUpdate(expense)
      setShowExpenseSelector(false)
      
      console.log('✅ Form populated with expense data')
    } catch (error) {
      console.error('❌ Error in loadExpenseDataForUpdate:', error)
    }
  }
  
  // Update selected expense directly (fallback when no matching parent found)
  const updateSelectedExpenseDirectly = async (expenseData: any) => {
    try {
      console.log('🔍 Updating selected expense directly:', selectedExpenseToUpdate?.id)
      
      if (!selectedExpenseToUpdate) {
        console.error('❌ No expense selected for direct update')
        return false
      }
      
      const dataToUse = expenseData || pendingExpenseData
      
      if (!dataToUse || !dataToUse.formData) {
        console.error('❌ Missing required data in updateSelectedExpenseDirectly')
        return false
      }
      
      // Calculate total amount
      const totalAmount = Object.values(dataToUse.directObjectTotals || {}).reduce((sum: number, amount: any) => sum + (Number(amount) || 0), 0)
      
      if (totalAmount <= 0) {
        console.error('❌ Total amount must be greater than 0')
        return false
      }
      
      console.log('💰 Total amount to update:', totalAmount)
      
      // Load current parent to merge (avoid overwriting existing data)
      const { data: currentParentArr, error: loadParentErr } = await supabase
        .from('project_expenses')
        .select('id, amount, invoice_items, expense_object_columns')
        .eq('id', selectedExpenseToUpdate.id)
        .limit(1)

      if (loadParentErr) {
        console.error('❌ Error loading current parent before update:', loadParentErr)
        return false
      }

      const currentParent = currentParentArr?.[0] || {}
      const oldItems = Array.isArray(currentParent?.invoice_items) ? currentParent.invoice_items : []
      const newItems = Array.isArray(dataToUse.invoiceItems) ? dataToUse.invoiceItems : []
      const mergedInvoiceItems = [...oldItems, ...newItems]

      const oldColumns = Array.isArray(currentParent?.expense_object_columns) ? currentParent.expense_object_columns : []
      const newColumns = Array.isArray(dataToUse.selectedExpenseObjectIds) ? dataToUse.selectedExpenseObjectIds : []
      const mergedColumns = Array.from(new Set([...(oldColumns as any[]), ...(newColumns as any[])]))

      const parentExpenseData = {
        project_id: dataToUse.formData.project_id,
        description: dataToUse.formData.description,
        expense_object_id: dataToUse.workshopParentObject?.id,
        amount: Number(currentParent?.amount || 0) + Number(totalAmount || 0),
        expense_date: dataToUse.formData.expense_date,
        status: 'pending',
        employee_id: dataToUse.formData.employee_id,
        expense_object_columns: mergedColumns,
        invoice_items: mergedInvoiceItems.map((item: any) => ({
          ...item,
          components_pct: item.componentsPct || {},
          components_quantity: item.componentsQuantity || {},
          components_unit_price: item.componentsUnitPrice || {},
          components_amount: item.componentsAmt || {}
        })),
        updated_at: new Date().toISOString()
      }
      
      console.log('🔄 Updating selected expense directly (additive):', selectedExpenseToUpdate.id)
      
      const { error: parentError } = await supabase
        .from('project_expenses')
        .update(parentExpenseData)
        .eq('id', selectedExpenseToUpdate.id)
      
      if (parentError) {
        console.error('❌ Error updating selected expense:', parentError)
        return false
      }
      
      console.log('✅ Selected expense updated successfully')
      
      // Kiểm tra có đối tượng bên trong chi phí được chọn không
      const newParentObjectId = dataToUse.workshopParentObject?.id
      
      // Lấy danh sách children hiện tại của expense được chọn
      const { data: existingChildren, error: fetchChildrenError } = await supabase
        .from('project_expenses')
        .select('*')
        .eq('id_parent', selectedExpenseToUpdate.id)
      
      if (fetchChildrenError) {
        console.error('❌ Error fetching existing children:', fetchChildrenError)
        return false
      }
      
      console.log('📊 Existing children count:', existingChildren?.length || 0)
      
      // Kiểm tra xem có children với đối tượng cha mới không
      const hasExistingObject = existingChildren?.some(child => 
        child.expense_object_id === newParentObjectId
      ) || false
      
      console.log('🔍 Has existing object in children:', hasExistingObject)
      console.log('🎯 New parent object ID:', newParentObjectId)
      
      if (hasExistingObject) {
        // Trường hợp 2: Nếu có thì chỉ thêm vào (không xóa gì)
        console.log('🔄 Case 2: Object exists, adding new children while keeping old ones')
        
        // Tạo children mới cho đối tượng cha này (không xóa children cũ)
        const childExpenses = Object.entries(dataToUse.directObjectTotals || {}).map(([objectId, amount]) => ({
          id: crypto.randomUUID(),
          project_id: dataToUse.formData.project_id,
          description: `${dataToUse.formData.description} - Child`,
          expense_object_id: objectId,
          amount: Number(amount),
          expense_date: dataToUse.formData.expense_date,
          status: 'pending',
          employee_id: dataToUse.formData.employee_id,
          id_parent: selectedExpenseToUpdate.id,
          expense_object_columns: [objectId],
          invoice_items: dataToUse.invoiceItems?.map((item: any) => ({
            ...item,
            components_pct: item.componentsPct || {},
            components_quantity: item.componentsQuantity || {},
            components_unit_price: item.componentsUnitPrice || {},
            components_amount: item.componentsAmt || {}
          })) || []
        }))
        
        if (childExpenses.length > 0) {
          const { error: childError } = await supabase
            .from('project_expenses')
            .insert(childExpenses)
          
          if (childError) {
            console.error('❌ Error creating new children for existing object:', childError)
            return false
          }
          
          console.log('✅ New children created for existing object successfully')
        }
      } else {
        // Trường hợp 1: Nếu không có thì thêm vào và giữ nguyên các chi phí cũ
        console.log('🔄 Case 1: Object does not exist, adding new children while keeping old ones')
        
        // Tạo children mới cho đối tượng cha mới (không xóa children cũ)
        const childExpenses = Object.entries(dataToUse.directObjectTotals || {}).map(([objectId, amount]) => ({
          id: crypto.randomUUID(),
          project_id: dataToUse.formData.project_id,
          description: `${dataToUse.formData.description} - Child`,
          expense_object_id: objectId,
          amount: Number(amount),
          expense_date: dataToUse.formData.expense_date,
          status: 'pending',
          employee_id: dataToUse.formData.employee_id,
          id_parent: selectedExpenseToUpdate.id,
          expense_object_columns: [objectId],
          invoice_items: dataToUse.invoiceItems?.map((item: any) => ({
            ...item,
            components_pct: item.componentsPct || {},
            components_quantity: item.componentsQuantity || {},
            components_unit_price: item.componentsUnitPrice || {},
            components_amount: item.componentsAmt || {}
          })) || []
        }))
        
        if (childExpenses.length > 0) {
          const { error: childError } = await supabase
            .from('project_expenses')
            .insert(childExpenses)
          
          if (childError) {
            console.error('❌ Error creating new children for new object:', childError)
            return false
          }
          
          console.log('✅ New children created for new object successfully')
        }
      }
      
      console.log('✅ Selected expense updated successfully - direct update')
      return true
    } catch (error) {
      console.error('❌ Error in updateSelectedExpenseDirectly:', error)
      return false
    }
  }

  // Update existing expense
  const updateExistingExpense = async (expenseData: any) => {
    try {
      console.log('🔍 Updating existing expense (overwrite mode):', selectedExpenseToUpdate?.id)

      if (!selectedExpenseToUpdate) {
        console.error('❌ No expense selected for update')
        return false
      }

      const dataToUse = expenseData || pendingExpenseData

      if (!dataToUse || !dataToUse.formData) {
        console.error('❌ Missing required data in updateExistingExpense')
        return false
      }

      // YÊU CẦU MỚI: Không tạo chi phí mới, chỉ cập nhật vào bản ghi hiện tại
      // → luôn dùng đường "cập nhật trực tiếp" thay vì logic cộng dồn / tạo children mới
      console.log('🔄 Overwriting existing expense directly (no new rows created)')
      return await updateSelectedExpenseDirectly(dataToUse)
    } catch (error) {
      console.error('❌ Error in updateExistingExpense:', error)
      return false
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.project_id) {
      newErrors.project_id = 'Vui lòng chọn dự án'
    }

    if (!formData.description.trim()) {
      newErrors.description = '⚠️ Hệ thống yêu cầu: Vui lòng nhập mô tả chi phí để tiếp tục'
    }

    if (!formData.expense_date) {
      newErrors.expense_date = 'Vui lòng chọn ngày chi phí'
    }

    // Role is auto-filled based on user's role, no validation needed

    // Validate planned amount based on computed allocation total
    if ((Number(grandAllocationTotal) || 0) <= 0) {
      newErrors.planned_amount = 'Số tiền kế hoạch phải lớn hơn 0'
    }

    // Validate parent selection - cannot select self as parent
    if (formData.id_parent && formData.id_parent === formData.project_id) {
      newErrors.id_parent = 'Không thể chọn chính nó làm chi phí cha'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    // Clear previous system notification
    setSystemNotification('')
    
    if (!validateForm()) {
      // Thông báo hệ thống nếu chưa nhập mô tả
      if (!formData.description.trim()) {
        setSystemNotification('⚠️ Hệ thống yêu cầu: Vui lòng nhập mô tả chi phí để tiếp tục lưu dữ liệu.')
        console.warn('⚠️ Hệ thống: Chưa nhập mô tả chi phí')
      }
      return
    }

    // Kiểm tra nếu có parent object và children được chọn
    console.log('🔍 Debug dialog trigger:', { 
      workshopParentObject: workshopParentObject?.name, 
      selectedExpenseObjectIds: selectedExpenseObjectIds.length,
      category,
      userRole,
      isUpdating: !!selectedExpenseToUpdate
    })
    
    
    if (workshopParentObject && selectedExpenseObjectIds.length > 0 && category === 'actual') {
      console.log(selectedExpenseToUpdate ? '🔄 Updating existing expense' : '✅ Creating new expense directly')
      console.log('📊 Form data from inputs:', {
        project_id: formData.project_id,
        description: formData.description,
        expense_date: formData.expense_date,
        currency: formData.currency,
        role: selectedRole
      })
      console.log('📊 Selected expense object IDs:', selectedExpenseObjectIds)
      console.log('📊 Invoice items:', invoiceItems)
      console.log('📊 Direct object totals (before calculation):', directObjectTotals)
      console.log('📊 Grand allocation total:', grandAllocationTotal)
      
      // Calculate directObjectTotals from invoiceItems if not already set
      let calculatedDirectObjectTotals = { ...directObjectTotals }
      
      if (Object.keys(calculatedDirectObjectTotals).length === 0 && invoiceItems && invoiceItems.length > 0) {
        console.log('🔍 Calculating directObjectTotals from invoiceItems...')
        calculatedDirectObjectTotals = {}
        
        for (const item of invoiceItems) {
          // Calculate totals from componentsAmt for each expense object
          if (item.componentsAmt) {
            for (const [expenseObjectId, amount] of Object.entries(item.componentsAmt)) {
              if (amount > 0) {
                calculatedDirectObjectTotals[expenseObjectId] = 
                  (calculatedDirectObjectTotals[expenseObjectId] || 0) + amount
              }
            }
          }
        }
        
        console.log('📊 Calculated directObjectTotals from invoiceItems:', calculatedDirectObjectTotals)
      }
      
      const expenseData = {
        formData,
        selectedExpenseObjectIds,
        invoiceItems,
        directObjectTotals: calculatedDirectObjectTotals,
        grandAllocationTotal,
        workshopParentObject
      }
      
      console.log('📊 Setting pending expense data:', expenseData)
      setPendingExpenseData(expenseData)
      
      // Check if updating or creating
      if (selectedExpenseToUpdate) {
        const success = await updateExistingExpense(expenseData)
        if (success) {
          alert('Cập nhật chi phí thành công!')
          hideSidebar(true) // Ensure sidebar is hidden
          onSuccess()
          onClose()
          // Reset state
          setSelectedExpenseToUpdate(null)
        } else {
          alert('Lỗi khi cập nhật chi phí!')
        }
      } else {
        // Wait for state to be updated or pass data directly
        await createNewExpense(expenseData)
      }
      return
    }

    // Logic tạo chi phí bình thường
    await createExpense()
  }

  // ========================================
  // FUNCTION TẠO CHI PHÍ BÌNH THƯỜNG - VIẾT LẠI HOÀN TOÀN
  // ========================================
  const createExpense = async () => {
    console.log('🚀 ===== STARTING CREATE EXPENSE =====')
    console.log('📊 Form data:', formData)
    console.log('📊 Category:', category)
    console.log('📊 Selected expense object IDs:', selectedExpenseObjectIds)
    console.log('📊 Direct object totals:', directObjectTotals)
    
    setSubmitting(true)
    
    try {
      // ===== VALIDATION =====
      console.log('🔍 Step 1: Validation...')
      
      if (!formData.project_id) {
        console.error('❌ Missing project_id')
        return
      }
      
      if (!formData.description?.trim()) {
        console.error('❌ Missing description')
        return
      }
      
      if (selectedExpenseObjectIds.length === 0) {
        console.error('❌ No expense objects selected')
        return
      }

      console.log('✅ Validation passed')

      // ===== ROUTE TO APPROPRIATE FUNCTION =====
      console.log('🔍 Step 2: Routing to appropriate function...')

      if (category === 'planned') {
        console.log('📋 Routing to planned expense creation')
        await createPlannedExpense()
      } else {
        console.log('💰 Routing to actual expense creation')
        await createActualExpense()
      }
      
      console.log('✅ Create expense completed successfully')
      
    } catch (error) {
      console.error('❌ Error in createExpense:', error)
    } finally {
      setSubmitting(false)
    }
  }
  
  // ========================================
  // FUNCTION TẠO CHI PHÍ KẾ HOẠCH (PLANNED)
  // ========================================
  const createPlannedExpense = async () => {
    console.log('📋 ===== CREATING PLANNED EXPENSE =====')
    
    try {
      const primaryExpenseObjectId = formData.expense_object_id || selectedExpenseObjectIds[0]
      const totalAmount = Object.values(directObjectTotals).some(val => val > 0)
        ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
        : (Number(grandAllocationTotal) || 0)
      
      console.log('📊 Primary expense object ID:', primaryExpenseObjectId)
      console.log('📊 Total amount:', totalAmount)
      
            const expenseData = {
            project_id: formData.project_id,
            employee_id: formData.employee_id || null,
            description: formData.description,
            expense_object_id: primaryExpenseObjectId,
        amount: totalAmount,
            currency: formData.currency,
            expense_date: formData.expense_date,
            status: 'pending',
            notes: formData.notes || null,
            receipt_url: formData.receipt_url || null,
            id_parent: formData.id_parent || null,
            expense_object_columns: selectedExpenseObjectIds,
        expense_object_totals: Object.values(directObjectTotals).some(val => val > 0) ? directObjectTotals : undefined,
        invoice_items: getInvoiceItems().map((item: any) => ({
          ...item,
          components_pct: item.components_pct || {},
          components_quantity: item.components_quantity || {},
          components_unit_price: item.components_unit_price || {},
          components_amount: item.components_amount || {}
        }))
      }

      console.log('📤 Expense data prepared:', expenseData)

          if (isEdit && editId) {
        console.log('📤 Updating planned expense:', editId)
            const { error } = await supabase
              .from('project_expenses_quote')
              .update(expenseData)
              .eq('id', editId)
        if (error) {
          console.error('❌ Error updating planned expense:', error)
          throw error
        }
        console.log('✅ Planned expense updated successfully')
          } else {
        console.log('📤 Creating new planned expense...')
            const result = await apiPost(getApiEndpoint('/api/project-expenses/quotes'), expenseData)
        console.log('✅ Planned expense created:', result)
      }
      
      // Update parent if exists
      if (expenseData.id_parent) {
        console.log('🔄 Updating parent expense amount...')
        await updateParentExpenseAmount(expenseData.id_parent, 'project_expenses_quote')
      }
      
      // Reset form
          setDirectObjectTotals({})
          
      // Show success notification and close dialog
      alert('Tạo chi phí dự kiến thành công!')
      hideSidebar(true) // Ensure sidebar is hidden
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('❌ Error in createPlannedExpense:', error)
      alert('Lỗi khi tạo chi phí dự kiến!')
    }
  }

  const startPlannedExpenseTour = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (category !== 'planned') return

    if (plannedExpenseTourRef.current) {
      plannedExpenseTourRef.current.cancel()
      plannedExpenseTourRef.current = null
    }

    if (!plannedExpenseShepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: PlannedExpenseShepherdType })?.default ?? (module as unknown as PlannedExpenseShepherdType)
        plannedExpenseShepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = plannedExpenseShepherdRef.current
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

    await waitForElement('[data-tour-id="planned-expense-header"]')
    await waitForElement('[data-tour-id="planned-expense-basic-info"]')
    await waitForElement('[data-tour-id="planned-expense-field-project"]')
    await waitForElement('[data-tour-id="planned-expense-field-employee"]')
    await waitForElement('[data-tour-id="planned-expense-field-parent"]')
    await waitForElement('[data-tour-id="planned-expense-field-category"]')
    await waitForElement('[data-tour-id="planned-expense-field-date"]')
    await waitForElement('[data-tour-id="planned-expense-field-role"]')
    await waitForElement('[data-tour-id="planned-expense-field-description"]')
    await waitForElement('[data-tour-id="planned-expense-objects"]')
    await waitForElement('[data-tour-id="planned-expense-amounts"]')
    await waitForElement('[data-tour-id="planned-expense-submit"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'planned-expense-intro',
      title: 'Hướng dẫn tạo chi phí kế hoạch',
      text: 'Chi phí kế hoạch là chi phí dự kiến cho dự án, giúp bạn lập kế hoạch và theo dõi ngân sách. Form này cho phép bạn tạo chi phí kế hoạch với đầy đủ thông tin về dự án, đối tượng chi phí và số tiền.',
      attachTo: { element: '[data-tour-id="planned-expense-header"]', on: 'bottom' },
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

    tour.addStep({
      id: 'planned-expense-basic-info-intro',
      title: 'Thông tin cơ bản',
      text: 'Form này bao gồm các thông tin cơ bản về chi phí kế hoạch. Chúng ta sẽ điền từng trường một.',
      attachTo: { element: '[data-tour-id="planned-expense-basic-info"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Bắt đầu',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'planned-expense-field-project',
      title: 'Dự án',
      text: 'Dự án (bắt buộc *): Chọn dự án từ danh sách dropdown. Đây là trường bắt buộc. Hệ thống sẽ tự động tải danh sách dự án khi mở form.',
      attachTo: { element: '[data-tour-id="planned-expense-field-project"]', on: 'top' },
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

    tour.addStep({
      id: 'planned-expense-field-employee',
      title: 'Nhân viên',
      text: 'Nhân viên: Tự động điền nhân viên đang đăng nhập. Trường này sẽ tự động được điền khi bạn mở form. Bạn có thể thay đổi nếu cần.',
      attachTo: { element: '[data-tour-id="planned-expense-field-employee"]', on: 'top' },
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

    tour.addStep({
      id: 'planned-expense-field-parent',
      title: 'Chi phí cha',
      text: 'Chi phí cha (tùy chọn): Chọn chi phí kế hoạch cha nếu có để tạo cấu trúc phân cấp:\n• Cấp cha: Chi phí chính (Cấp: 1)\n• Cấp con: Chi phí chi tiết (Cấp: 2+)\n\nLưu ý: Chỉ chọn khi bạn muốn tạo chi phí con thuộc một chi phí cha đã có.',
      attachTo: { element: '[data-tour-id="planned-expense-field-parent"]', on: 'top' },
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

    tour.addStep({
      id: 'planned-expense-field-category',
      title: 'Loại chi phí',
      text: 'Loại chi phí: Kế hoạch (đã tự động chọn, không thể thay đổi). Trường này được tự động điền dựa trên loại form bạn đang mở.',
      attachTo: { element: '[data-tour-id="planned-expense-field-category"]', on: 'top' },
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

    tour.addStep({
      id: 'planned-expense-field-date',
      title: 'Ngày chi phí',
      text: 'Ngày chi phí (bắt buộc *): Chọn ngày phát sinh chi phí. Đây là trường bắt buộc. Sử dụng date picker để chọn ngày.',
      attachTo: { element: '[data-tour-id="planned-expense-field-date"]', on: 'top' },
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

    tour.addStep({
      id: 'planned-expense-field-role',
      title: 'Vai trò',
      text: 'Vai trò: Tự động điền vai trò của nhân viên đang đăng nhập. Trường này được tự động điền dựa trên thông tin đăng nhập của bạn.',
      attachTo: { element: '[data-tour-id="planned-expense-field-role"]', on: 'top' },
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

    tour.addStep({
      id: 'planned-expense-field-description',
      title: 'Mô tả',
      text: 'Mô tả (bắt buộc *): Nhập mô tả chi tiết về chi phí. Đây là trường bắt buộc. Mô tả nên rõ ràng để dễ quản lý và theo dõi sau này.',
      attachTo: { element: '[data-tour-id="planned-expense-field-description"]', on: 'top' },
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

    tour.addStep({
      id: 'planned-expense-objects',
      title: 'Đối tượng chi phí',
      text: 'Chọn đối tượng chi phí (có thể chọn nhiều):\n• Nhấn vào ô chọn để mở danh sách đối tượng chi phí\n• Chọn một hoặc nhiều đối tượng chi phí để phân bổ ngân sách\n• Hệ thống sẽ tự động tải đối tượng chi phí từ báo giá nếu có\n• Bạn có thể chọn đối tượng chi phí cấp 1, 2, hoặc 3',
      attachTo: { element: '[data-tour-id="planned-expense-objects"]', on: 'top' },
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

    tour.addStep({
      id: 'planned-expense-amounts',
      title: 'Phân bổ số tiền',
      text: 'Các cách phân bổ:\n1. Phân bổ theo tỷ lệ phần trăm: Nhập % cho từng đối tượng chi phí\n2. Phân bổ theo số tiền cụ thể: Nhập số tiền trực tiếp cho từng đối tượng\n\nThông tin hiển thị:\n• Bảng chi tiết hóa đơn với các cột: STT, Tên sản phẩm, Mô tả, Đơn giá, Số lượng, Đơn vị, Thành tiền\n• Các cột đối tượng chi phí (%, Số lượng, Đơn giá, VND)\n• Tổng phân bổ\n\nThao tác:\n• Nhập số tiền cho từng đối tượng chi phí đã chọn\n• Tổng số tiền sẽ được tự động tính\n• Có thể thêm hóa đơn/đơn hàng từ báo giá nếu có',
      attachTo: { element: '[data-tour-id="planned-expense-amounts"]', on: 'top' },
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

    tour.addStep({
      id: 'planned-expense-submit',
      title: 'Lưu chi phí kế hoạch',
      text: 'Hành động:\n• Kiểm tra lại các thông tin đã nhập\n• Nhấn nút "Tạo chi phí kế hoạch" để lưu\n\nKết quả:\n• Chi phí kế hoạch sẽ được thêm vào dự án\n• Có thể được duyệt sau để chuyển thành chi phí thực tế\n• Bạn có thể xem chi phí kế hoạch trong danh sách chi phí dự án',
      attachTo: { element: '[data-tour-id="planned-expense-submit"]', on: 'top' },
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
      setIsPlannedExpenseTourRunning(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem(PLANNED_EXPENSE_TOUR_STORAGE_KEY, 'completed')
      }
      plannedExpenseTourRef.current = null
    })

    tour.on('cancel', () => {
      setIsPlannedExpenseTourRunning(false)
      plannedExpenseTourRef.current = null
    })

    plannedExpenseTourRef.current = tour
    setIsPlannedExpenseTourRunning(true)
    tour.start()
  }, [category])

  // Auto-start tour when dialog opens for the first time (only for planned expenses)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (category !== 'planned') return
    if (!isOpen) return
    if (plannedExpenseTourAutoStartAttemptedRef.current) return

    const storedStatus = localStorage.getItem(PLANNED_EXPENSE_TOUR_STORAGE_KEY)
    plannedExpenseTourAutoStartAttemptedRef.current = true

    if (!storedStatus) {
      // Delay to ensure form is fully rendered
      setTimeout(() => {
        startPlannedExpenseTour()
      }, 1000)
    }
  }, [isOpen, category, startPlannedExpenseTour])

  // Reset tour auto-start when dialog closes
  useEffect(() => {
    if (!isOpen) {
      plannedExpenseTourAutoStartAttemptedRef.current = false
    }
  }, [isOpen])

  // Cleanup tour on unmount
  useEffect(() => {
    return () => {
      plannedExpenseTourRef.current?.cancel()
      plannedExpenseTourRef.current?.destroy?.()
      plannedExpenseTourRef.current = null
      actualExpenseTourRef.current?.cancel()
      actualExpenseTourRef.current?.destroy?.()
      actualExpenseTourRef.current = null
    }
  }, [])

  const startActualExpenseTour = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (category !== 'actual') return

    if (actualExpenseTourRef.current) {
      actualExpenseTourRef.current.cancel()
      actualExpenseTourRef.current = null
    }

    if (!actualExpenseShepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: ActualExpenseShepherdType })?.default ?? (module as unknown as ActualExpenseShepherdType)
        actualExpenseShepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = actualExpenseShepherdRef.current
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

    await waitForElement('[data-tour-id="actual-expense-header"]')
    await waitForElement('[data-tour-id="actual-expense-basic-info"]')
    await waitForElement('[data-tour-id="actual-expense-field-project"]')
    await waitForElement('[data-tour-id="actual-expense-field-employee"]')
    await waitForElement('[data-tour-id="actual-expense-field-parent"]')
    await waitForElement('[data-tour-id="actual-expense-field-category"]')
    await waitForElement('[data-tour-id="actual-expense-field-date"]')
    await waitForElement('[data-tour-id="actual-expense-field-role"]')
    await waitForElement('[data-tour-id="actual-expense-field-update"]')
    await waitForElement('[data-tour-id="actual-expense-field-description"]')
    await waitForElement('[data-tour-id="actual-expense-objects"]')
    await waitForElement('[data-tour-id="actual-expense-amounts"]')
    await waitForElement('[data-tour-id="actual-expense-submit"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'actual-expense-intro',
      title: 'Hướng dẫn tạo chi phí thực tế',
      text: 'Chi phí thực tế là chi phí đã phát sinh trong quá trình thực hiện dự án. Form này cho phép bạn tạo chi phí thực tế với đầy đủ thông tin về dự án, đối tượng chi phí và số tiền đã chi.',
      attachTo: { element: '[data-tour-id="actual-expense-header"]', on: 'bottom' },
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

    tour.addStep({
      id: 'actual-expense-basic-info-intro',
      title: 'Thông tin cơ bản',
      text: 'Form này bao gồm các thông tin cơ bản về chi phí thực tế. Chúng ta sẽ điền từng trường một.',
      attachTo: { element: '[data-tour-id="actual-expense-basic-info"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Bắt đầu',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'actual-expense-field-project',
      title: 'Dự án',
      text: 'Dự án (bắt buộc *): Chọn dự án từ danh sách dropdown. Đây là trường bắt buộc. Hệ thống sẽ tự động tải danh sách dự án khi mở form.',
      attachTo: { element: '[data-tour-id="actual-expense-field-project"]', on: 'top' },
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

    tour.addStep({
      id: 'actual-expense-field-employee',
      title: 'Nhân viên',
      text: 'Nhân viên: Tự động điền nhân viên đang đăng nhập. Trường này sẽ tự động được điền khi bạn mở form. Bạn có thể thay đổi nếu cần.',
      attachTo: { element: '[data-tour-id="actual-expense-field-employee"]', on: 'top' },
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

    tour.addStep({
      id: 'actual-expense-field-parent',
      title: 'Chi phí cha',
      text: 'Chi phí cha (tùy chọn): Chọn chi phí thực tế cha nếu có để tạo cấu trúc phân cấp:\n• Cấp cha: Chi phí chính (Cấp: 1)\n• Cấp con: Chi phí chi tiết (Cấp: 2+)\n\nLưu ý: Chỉ chọn khi bạn muốn tạo chi phí con thuộc một chi phí cha đã có.',
      attachTo: { element: '[data-tour-id="actual-expense-field-parent"]', on: 'top' },
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

    tour.addStep({
      id: 'actual-expense-field-category',
      title: 'Loại chi phí',
      text: 'Loại chi phí: Thực tế (đã tự động chọn, không thể thay đổi). Trường này được tự động điền dựa trên loại form bạn đang mở.',
      attachTo: { element: '[data-tour-id="actual-expense-field-category"]', on: 'top' },
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

    tour.addStep({
      id: 'actual-expense-field-date',
      title: 'Ngày chi phí',
      text: 'Ngày chi phí (bắt buộc *): Chọn ngày phát sinh chi phí. Đây là trường bắt buộc. Sử dụng date picker để chọn ngày.',
      attachTo: { element: '[data-tour-id="actual-expense-field-date"]', on: 'top' },
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

    tour.addStep({
      id: 'actual-expense-field-role',
      title: 'Vai trò',
      text: 'Vai trò: Tự động điền vai trò của nhân viên đang đăng nhập. Trường này được tự động điền dựa trên thông tin đăng nhập của bạn.',
      attachTo: { element: '[data-tour-id="actual-expense-field-role"]', on: 'top' },
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

    tour.addStep({
      id: 'actual-expense-field-update',
      title: 'Cập nhật chi phí đã có',
      text: 'Cập nhật chi phí đã có (tùy chọn): Có thể chọn chi phí thực tế đã có để cập nhật thông tin. Nếu không chọn, hệ thống sẽ tạo chi phí mới.',
      attachTo: { element: '[data-tour-id="actual-expense-field-update"]', on: 'top' },
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

    tour.addStep({
      id: 'actual-expense-field-description',
      title: 'Mô tả',
      text: 'Mô tả (bắt buộc *): Nhập mô tả chi tiết về chi phí. Đây là trường bắt buộc. Mô tả nên rõ ràng để dễ quản lý và theo dõi sau này.',
      attachTo: { element: '[data-tour-id="actual-expense-field-description"]', on: 'top' },
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

    tour.addStep({
      id: 'actual-expense-objects',
      title: 'Đối tượng chi phí',
      text: 'Chọn đối tượng chi phí (có thể chọn nhiều):\n• Nhấn vào ô chọn để mở danh sách đối tượng chi phí\n• Chọn một hoặc nhiều đối tượng chi phí để phân bổ chi phí thực tế\n• Hệ thống sẽ tự động tải đối tượng chi phí từ hóa đơn nếu có\n• Bạn có thể chọn đối tượng chi phí cấp 1, 2, hoặc 3',
      attachTo: { element: '[data-tour-id="actual-expense-objects"]', on: 'top' },
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

    tour.addStep({
      id: 'actual-expense-amounts',
      title: 'Phân bổ số tiền',
      text: 'Các cách phân bổ:\n1. Phân bổ theo tỷ lệ phần trăm: Nhập % cho từng đối tượng chi phí\n2. Phân bổ theo số tiền cụ thể: Nhập số tiền trực tiếp cho từng đối tượng\n\nThông tin hiển thị:\n• Bảng chi tiết hóa đơn với các cột: STT, Tên sản phẩm, Mô tả, Đơn giá, Số lượng, Đơn vị, Thành tiền\n• Các cột đối tượng chi phí (%, Số lượng, Đơn giá, VND)\n• Tổng phân bổ\n\nThao tác:\n• Nhập số tiền thực tế đã chi cho từng đối tượng chi phí đã chọn\n• Tổng số tiền sẽ được tự động tính\n• Có thể thêm hóa đơn/đơn hàng từ hóa đơn nếu có',
      attachTo: { element: '[data-tour-id="actual-expense-amounts"]', on: 'top' },
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

    tour.addStep({
      id: 'actual-expense-submit',
      title: 'Lưu chi phí thực tế',
      text: 'Hành động:\n• Kiểm tra lại các thông tin đã nhập\n• Nhấn nút "Tạo chi phí thực tế" để lưu\n\nKết quả:\n• Chi phí thực tế sẽ được thêm vào dự án\n• Có thể được duyệt sau\n• Bạn có thể xem chi phí thực tế trong danh sách chi phí dự án',
      attachTo: { element: '[data-tour-id="actual-expense-submit"]', on: 'top' },
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
      setIsActualExpenseTourRunning(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTUAL_EXPENSE_TOUR_STORAGE_KEY, 'completed')
      }
      actualExpenseTourRef.current = null
    })

    tour.on('cancel', () => {
      setIsActualExpenseTourRunning(false)
      actualExpenseTourRef.current = null
    })

    actualExpenseTourRef.current = tour
    setIsActualExpenseTourRunning(true)
    tour.start()
  }, [category])

  // Auto-start tour when dialog opens for the first time (only for actual expenses)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (category !== 'actual') return
    if (!isOpen) return
    if (actualExpenseTourAutoStartAttemptedRef.current) return

    const storedStatus = localStorage.getItem(ACTUAL_EXPENSE_TOUR_STORAGE_KEY)
    actualExpenseTourAutoStartAttemptedRef.current = true

    if (!storedStatus) {
      // Delay to ensure form is fully rendered
      setTimeout(() => {
        startActualExpenseTour()
      }, 1000)
    }
  }, [isOpen, category, startActualExpenseTour])

  // Reset tour auto-start when dialog closes
  useEffect(() => {
    if (!isOpen) {
      actualExpenseTourAutoStartAttemptedRef.current = false
    }
  }, [isOpen])
  
  // ========================================
  // FUNCTION TẠO CHI PHÍ THỰC TẾ (ACTUAL)
  // ========================================
  const createActualExpense = async () => {
    console.log('💰 ===== CREATING ACTUAL EXPENSE (SIMPLIFIED) =====')
    
    try {
      // Validate basic requirements first
      if (!formData.project_id) {
        alert('Vui lòng chọn dự án!')
        return
      }
      
      if (!formData.description || formData.description.trim() === '') {
        alert('Vui lòng nhập mô tả chi phí!')
        return
      }
      
      if (selectedExpenseObjectIds.length === 0) {
        alert('Vui lòng chọn ít nhất một đối tượng chi phí!')
        return
      }

      // Handle update if in edit mode (similar to planned expense)
      if (isEdit && editId) {
        console.log('📤 Updating actual expense:', editId)
        
        const primaryExpenseObjectId = formData.expense_object_id || selectedExpenseObjectIds[0]
        const totalAmount = Object.values(directObjectTotals).some(val => val > 0)
          ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
          : (Number(grandAllocationTotal) || 0)
        
        // Do NOT include status in update - preserve current status from database
        // Status should only be changed through approval/rejection actions, not through edit
        const expenseData = {
          project_id: formData.project_id,
          employee_id: formData.employee_id || null,
          description: formData.description,
          expense_object_id: primaryExpenseObjectId,
          amount: totalAmount,
          currency: formData.currency,
          expense_date: formData.expense_date,
          // status is intentionally omitted to preserve current status
          notes: formData.notes || null,
          receipt_url: formData.receipt_url || null,
          id_parent: formData.id_parent || null,
          expense_object_columns: selectedExpenseObjectIds,
          expense_object_totals: Object.values(directObjectTotals).some(val => val > 0) ? directObjectTotals : undefined,
          invoice_items: getInvoiceItems().map((item: any) => ({
            ...item,
            components_pct: item.components_pct || {},
            components_quantity: item.components_quantity || {},
            components_unit_price: item.components_unit_price || {},
            components_amount: item.components_amount || {}
          }))
        }

        // CRITICAL: Remove status from expenseData if it exists to prevent auto-approval
        const { status: _, ...expenseDataWithoutStatus } = expenseData as any
        const finalExpenseData = expenseDataWithoutStatus
        
        console.log('📤 Expense data prepared for update (status explicitly excluded):', finalExpenseData)
        console.log('⚠️ CRITICAL: Status field has been explicitly removed from update payload')
        console.log('📊 Original expenseData had status?', 'status' in expenseData)
        console.log('📊 Final expenseData has status?', 'status' in finalExpenseData)

        // Explicitly exclude status from update to ensure it's not changed
        const { error } = await supabase
          .from('project_expenses')
          .update(finalExpenseData)
          .eq('id', editId)
        
        if (error) {
          console.error('❌ Error updating actual expense:', error)
          throw error
        }
        
        console.log('✅ Actual expense updated successfully')
        
        // Update parent if exists
        if (expenseData.id_parent) {
          console.log('🔄 Updating parent expense amount...')
          await updateParentExpenseAmount(expenseData.id_parent, 'project_expenses')
        }
        
        alert('Cập nhật chi phí thực tế thành công!')
        hideSidebar(true)
        onSuccess()
        onClose()
        resetForm()
        return
      }
      
      const createdExpenses = []
      
      // If we have invoice_items, save ONE combined expense with allocations
      let builtInvoiceItems: any[] = []
      try {
        const items = getInvoiceItems()
        if (Array.isArray(items) && items.length > 0) {
          builtInvoiceItems = items
        }
      } catch (e) {
        console.warn('⚠️ getInvoiceItems failed, continue without items', e)
      }

      if (builtInvoiceItems.length > 0 && Array.isArray(selectedExpenseObjectIds) && selectedExpenseObjectIds.length > 0) {
        // Compute total amount from invoice_items components for selected objects
        const selectedIds = selectedExpenseObjectIds
        const totalAmount = builtInvoiceItems.reduce((sum: number, it: any) => {
          const compAmt = it?.components_amount || {}
          let itemSum = 0
          selectedIds.forEach((id: string) => {
            itemSum += Number(compAmt[id] || 0)
          })
          return sum + itemSum
        }, 0)

        const combinedId = (globalThis as any)?.crypto?.randomUUID
          ? (globalThis as any).crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
              const r = Math.random() * 16 | 0
              const v = c === 'x' ? r : (r & 0x3 | 0x8)
              return v.toString(16)
            })

        const combinedExpense: any = {
          id: combinedId,
          project_id: formData.project_id,
          description: formData.description,
          expense_object_id: selectedIds[0],
          expense_object_columns: selectedIds,
          amount: Number(totalAmount) || 0,
          currency: formData.currency || 'VND',
          expense_date: formData.expense_date ? formData.expense_date.toString() : new Date().toISOString().split('T')[0],
          status: 'pending',
          expense_code: `EXP-${Date.now()}-COMB-${Math.random().toString(36).substr(2, 6)}`,
          invoice_items: builtInvoiceItems
        }
        if (formData.employee_id) combinedExpense.employee_id = formData.employee_id
        if (formData.notes) combinedExpense.notes = formData.notes
        if (formData.receipt_url) combinedExpense.receipt_url = formData.receipt_url
        if (formData.id_parent) combinedExpense.id_parent = formData.id_parent

        console.log('📤 Creating combined expense with data:', {
          id: combinedExpense.id,
          project_id: combinedExpense.project_id,
          amount: combinedExpense.amount,
          expense_object_id: combinedExpense.expense_object_id,
          expense_object_columns: combinedExpense.expense_object_columns,
          items: builtInvoiceItems.length
        })

        const { data, error } = await supabase
          .from('project_expenses')
          .insert(combinedExpense)
          .select()
        if (error) {
          console.error('❌ Error creating combined expense:', error)
          throw new Error(error.message || 'Insert failed')
        }
        console.log('✅ Combined expense created:', data)
        createdExpenses.push(data?.[0])

        // Reset and exit early (no per-object splitting)
        console.log('📊 Total created expenses:', createdExpenses.length)
        if (createdExpenses.length === 0) {
          alert('Không có chi phí nào được tạo! Vui lòng kiểm tra lại dữ liệu.')
          return
        }
        setDirectObjectTotals({})
        alert(`Tạo thành công ${createdExpenses.length} chi phí thực tế!`)
        hideSidebar(true) // Ensure sidebar is hidden
        onSuccess()
        onClose()
        resetForm()
        return
      }

      console.log('🔄 Processing', selectedExpenseObjectIds.length, 'expense objects')
      
      for (let i = 0; i < selectedExpenseObjectIds.length; i++) {
        const expenseObjectId = selectedExpenseObjectIds[i]
        console.log(`🔄 Processing expense object ${i + 1}/${selectedExpenseObjectIds.length}:`, expenseObjectId)
        
        // Calculate amount
        const amount = Object.values(directObjectTotals).some(val => val > 0)
          ? (directObjectTotals[expenseObjectId] || 0)
          : (expenseObjectTotals[expenseObjectId] || 0)
        
        if (amount <= 0) {
          console.log('⚠️ Skipping expense object with zero amount:', expenseObjectId)
          continue
        }
        
        // Generate UUID for primary key id (DB has no default)
        const newId = (globalThis as any)?.crypto?.randomUUID
          ? (globalThis as any).crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
              const r = Math.random() * 16 | 0
              const v = c === 'x' ? r : (r & 0x3 | 0x8)
              return v.toString(16)
            })
        
        // Create simple expense data - only essential fields
        const expenseData: any = {
          id: newId,
          project_id: formData.project_id,
          description: formData.description,
          expense_object_id: expenseObjectId,
          amount: Number(amount),
          currency: formData.currency || 'VND',
          expense_date: formData.expense_date ? formData.expense_date.toString() : new Date().toISOString().split('T')[0],
          status: 'pending',
          expense_code: `EXP-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`
        }
            
        // Add optional fields only if they exist
        if (formData.employee_id) {
          expenseData.employee_id = formData.employee_id
        }
        if (formData.notes) {
          expenseData.notes = formData.notes
        }
        if (formData.receipt_url) {
          expenseData.receipt_url = formData.receipt_url
        }
        if (formData.id_parent) {
          expenseData.id_parent = formData.id_parent
        }
        
        // Attach invoice_items (JSONB) if available
        try {
          const items = getInvoiceItems()
          if (Array.isArray(items) && items.length > 0) {
            expenseData.invoice_items = items
          }
        } catch (e) {
          console.warn('⚠️ Could not build invoice_items, skipping. Error:', e)
        }
        
        // Attach expense_object_columns (JSONB) as selected IDs if present
        if (Array.isArray(selectedExpenseObjectIds) && selectedExpenseObjectIds.length > 0) {
          expenseData.expense_object_columns = selectedExpenseObjectIds
        }
            
        console.log('📤 Creating expense with data:', {
          id: expenseData.id,
          project_id: expenseData.project_id,
          description: expenseData.description,
          expense_object_id: expenseData.expense_object_id,
          amount: expenseData.amount,
          currency: expenseData.currency,
          expense_date: expenseData.expense_date,
          status: expenseData.status,
          expense_code: expenseData.expense_code
        })
            
        try {
          const { data, error } = await supabase
            .from('project_expenses')
            .insert(expenseData)
            .select()
          
          if (error) {
            console.error('❌ Error creating expense:', error)
            console.error('❌ Error message:', error.message)
            console.error('❌ Error details:', error.details)
            console.error('❌ Error hint:', error.hint)
            console.error('❌ Error code:', error.code)
            
            // Try with even simpler data
            const simpleData = {
              id: (globalThis as any)?.crypto?.randomUUID
                ? (globalThis as any).crypto.randomUUID()
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0
                    const v = c === 'x' ? r : (r & 0x3 | 0x8)
                    return v.toString(16)
                  }),
              project_id: formData.project_id,
              description: formData.description,
              expense_object_id: expenseObjectId,
              amount: Number(amount),
              currency: 'VND',
              expense_date: new Date().toISOString().split('T')[0],
              status: 'pending'
            }
            
            console.log('🔄 Trying with minimal data:', simpleData)
            
            const { data: simpleResult, error: simpleError } = await supabase
              .from('project_expenses')
              .insert(simpleData)
              .select()
            
            if (simpleError) {
              console.error('❌ Even minimal data failed:', simpleError)
              throw new Error(`Failed to create expense: ${simpleError.message}`)
            } else {
              console.log('✅ Minimal data succeeded:', simpleResult)
              createdExpenses.push(simpleResult[0])
            }
          } else {
            console.log('✅ Expense created successfully:', data)
            createdExpenses.push(data[0])
          }
        } catch (insertError) {
          console.error('❌ Insert error for expense object:', expenseObjectId, insertError)
          throw insertError
        }
      }
      
      console.log('📊 Total created expenses:', createdExpenses.length)
      
      if (createdExpenses.length === 0) {
        alert('Không có chi phí nào được tạo! Vui lòng kiểm tra lại dữ liệu.')
        return
      }
      
      // Reset form
      setDirectObjectTotals({})
      
      // Show success notification and close dialog
      alert(`Tạo thành công ${createdExpenses.length} chi phí thực tế!`)
      hideSidebar(true) // Ensure sidebar is hidden
      onSuccess()
      onClose()
      resetForm()
      
    } catch (error: any) {
      console.error('❌ Error in createActualExpense:', error)
      alert(`Lỗi khi tạo chi phí thực tế: ${error?.message || 'Unknown error'}`)
    }
  }
  
  // ========================================
  // TEST FUNCTION: KIỂM TRA DỮ LIỆU CÓ LƯU ĐƯỢC KHÔNG
  // ========================================
  const testSaveData = async () => {
    const uniqueCode = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-TEST`
    const testId = (globalThis as any)?.crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
    console.log('🔑 Generated unique expense code:', uniqueCode)
    console.log('🆔 Generated test id:', testId)
    
    const testData = {
      "id": testId,
      "project_id": "1623f25e-8f63-4525-abcd-219b993e9f1b",
      "description": "d",
      "expense_object_id": "198ecff2-1cd9-416e-acae-07b918eb5f43",
      "amount": 477700,
      "currency": "VND",
      "expense_date": "2025-10-29",
      "status": "pending",
      "expense_code": uniqueCode,
      "employee_id": "27112c37-d9eb-46b5-92a5-a5c7a150a8bc",
      "invoice_items": [
        {
          "product_name": "Ban lam viec go",
          "description": "Ban lam viec go tu nhien, kich thuoc 120x60cm",
          "unit_price": 3500000,
          "quantity": 1,
          "unit": "cai",
          "line_total": 3500000,
          "components_pct": {
            "198ecff2-1cd9-416e-acae-07b918eb5f43": 6.67
          },
          "components_quantity": {
            "198ecff2-1cd9-416e-acae-07b918eb5f43": 10
          },
          "components_unit_price": {
            "198ecff2-1cd9-416e-acae-07b918eb5f43": 23330
          },
          "components_amount": {
            "198ecff2-1cd9-416e-acae-07b918eb5f43": 233300
          }
        },
        {
          "product_name": "Ghe van phong",
          "description": "Ghe van phong co the dieu chinh do cao, mau den",
          "unit_price": 1200000,
          "quantity": 1,
          "unit": "cai",
          "line_total": 1200000,
          "components_pct": {
            "198ecff2-1cd9-416e-acae-07b918eb5f43": 20.37
          },
          "components_quantity": {
            "198ecff2-1cd9-416e-acae-07b918eb5f43": 10
          },
          "components_unit_price": {
            "198ecff2-1cd9-416e-acae-07b918eb5f43": 24440
          },
          "components_amount": {
            "198ecff2-1cd9-416e-acae-07b918eb5f43": 244400
          }
        }
      ],
      "expense_object_columns": [
        "198ecff2-1cd9-416e-acae-07b918eb5f43"
      ]
    }
    
    console.log('🧪 Testing save data:', testData)
    
    try {
      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from('project_expenses')
        .select('id')
        .limit(1)
      
      if (testError) {
        console.error('❌ Supabase connection test failed:', testError)
        return false
      }
      
      console.log('✅ Supabase connection test passed')
      
      // Try to insert the test data
      console.log('📤 Inserting test data:', JSON.stringify(testData, null, 2))
      const { data, error } = await supabase
        .from('project_expenses')
        .insert(testData)
        .select()
      
      if (error) {
        console.error('❌ Test data insert failed:', error)
        console.error('❌ Error details:', {
          message: error?.message || 'No message',
          details: error?.details || 'No details',
          hint: error?.hint || 'No hint',
          code: error?.code || 'No code'
        })
        console.error('❌ Full error object:', JSON.stringify(error, null, 2))
        console.error('❌ Error type:', typeof error)
        console.error('❌ Error keys:', Object.keys(error || {}))
        return false
      }
      
      console.log('✅ Test data inserted successfully:', data)
      return true
      
    } catch (error) {
      console.error('❌ Test save error:', error)
      return false
    }
  }

  // ========================================
  // HELPER FUNCTION: LẤY INVOICE ITEMS
  // ========================================
  const getInvoiceItems = () => {
    const hasDirectObjectInputs = directObjectTotals && Object.values(directObjectTotals).some(val => val > 0)
    const hasProductDetails = invoiceItems && invoiceItems.some(row => 
      row.productName.trim() !== '' || row.unitPrice > 0 || row.quantity > 0
    )
    
    if (hasDirectObjectInputs && !hasProductDetails) {
      return []
    }
    
    return Array.isArray(invoiceItems) ? invoiceItems.map((r: any) => {
      const components_pct: Record<string, number> = {}
      const components_quantity: Record<string, number> = {}
      const components_unit_price: Record<string, number> = {}
      const components_amount: Record<string, number> = {}
      if (Array.isArray(selectedExpenseObjectIds)) {
        selectedExpenseObjectIds.forEach((id: string) => {
          components_pct[id] = (r.componentsPct && r.componentsPct[id] !== undefined) ? Number(r.componentsPct[id]) || 0 : 0
          components_quantity[id] = (r.componentsQuantity && r.componentsQuantity[id] !== undefined) ? Number(r.componentsQuantity[id]) || 0 : 0
          components_unit_price[id] = (r.componentsUnitPrice && r.componentsUnitPrice[id] !== undefined) ? Number(r.componentsUnitPrice[id]) || 0 : 0
          components_amount[id] = (r.componentsAmt && r.componentsAmt[id] !== undefined) ? Number(r.componentsAmt[id]) || 0 : 0
        })
      }
      return {
        product_name: r.productName || '',
        description: r.description || '',
        unit_price: r.unitPrice || 0,
        quantity: r.quantity || 0,
        unit: r.unit || '',
        area: r.area != null ? Number(r.area) : null,
        line_total: r.lineTotal || 0,
        components_pct,
        components_quantity,
        components_unit_price,
        components_amount
      }
    }) : []
  }
  
  // ========================================
  // HELPER FUNCTION: CẬP NHẬT TỔNG CHI PHÍ PARENT
  // ========================================
  const updateParentExpenseAmount = async (parentId: string, tableName: string) => {
    try {
      console.log('🔄 Updating parent expense amount:', parentId, 'in table:', tableName)
            const { data: children } = await supabase
        .from(tableName)
              .select('amount')
              .eq('id_parent', parentId)
            const total = (children || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0)
            await supabase
        .from(tableName)
              .update({ amount: total, updated_at: new Date().toISOString() })
              .eq('id', parentId)
      console.log('✅ Parent expense amount updated:', total)
          } catch (e) {
            console.error('❌ Error updating parent expense amount:', e)
          }
        }

  // ========================================
  // FUNCTION CẬP NHẬT CHI PHÍ PARENT - VIẾT LẠI HOÀN TOÀN
  // ========================================
  const updateParentExpense = async (expenseData?: any) => {
    console.log('🔄 ===== STARTING UPDATE PARENT EXPENSE =====')
    console.log('📊 workshopParentObject:', workshopParentObject)
    console.log('📊 pendingExpenseData:', pendingExpenseData)
    console.log('📊 expenseData parameter:', expenseData)
    
    setSubmitting(true)
    
    try {
      // ===== VALIDATION =====
      console.log('🔍 Step 1: Validation...')
      
      // Use expenseData parameter if available, otherwise use pendingExpenseData
      const dataToUse = expenseData || pendingExpenseData
      console.log('📊 Using data:', dataToUse)
      
      if (!workshopParentObject || !dataToUse) {
        console.error('❌ Missing required data:', { workshopParentObject, pendingExpenseData, expenseData })
        return
      }
      
      if (!dataToUse.formData.project_id) {
        console.error('❌ Missing project_id')
        return
      }
      
      if (!dataToUse.directObjectTotals || Object.keys(dataToUse.directObjectTotals).length === 0) {
        console.error('❌ No directObjectTotals data')
        return
      }
      
      console.log('✅ Validation passed')
      
      // ===== TÌM CHI PHÍ PARENT HIỆN TẠI =====
      console.log('🔍 Step 2: Searching for existing parent expenses...')
      
      const { data: existingParents, error: searchError } = await supabase
        .from('project_expenses')
        .select('*')
        .eq('expense_object_id', workshopParentObject.id)
        .eq('project_id', dataToUse.formData.project_id)
        .order('created_at', { ascending: false })
      
      if (searchError) {
        console.error('❌ Error searching for existing parents:', searchError)
        return
      }
      
      console.log('📊 Found existing parents:', existingParents)
      
      if (!existingParents || existingParents.length === 0) {
        console.log('❌ No existing parent found')
        return
      }
      
      // ===== CẬP NHẬT CHI PHÍ PARENT =====
      console.log('🔍 Step 3: Updating parent expense...')
      
      const existingParent = existingParents[0]
      console.log('📊 Using parent expense:', existingParent)
      
      const totalAmount = (Object.values(dataToUse.directObjectTotals) as number[]).reduce((sum: number, val: number) => sum + val, 0)
      console.log('💰 Total amount calculated:', totalAmount)
      console.log('📊 directObjectTotals:', dataToUse.directObjectTotals)
      
      if (totalAmount <= 0) {
        console.error('❌ Total amount must be greater than 0')
        return
      }
      
      const { error: updateError } = await supabase
          .from('project_expenses')
          .update({
            amount: totalAmount,
          description: dataToUse.formData.description || existingParent.description,
            updated_at: new Date().toISOString(),
            role: selectedRole,
          expense_object_breakdown: dataToUse.directObjectTotals
          })
          .eq('id', existingParent.id)
        
      if (updateError) {
        console.error('❌ Error updating parent expense:', updateError)
        return
      }
      
      console.log('✅ Updated parent expense:', existingParent.id, 'with amount:', totalAmount)
      
      // ===== CẬP NHẬT CHI PHÍ CON =====
      console.log('🔍 Step 4: Updating child expenses...')
      await updateChildExpenses(existingParent.id, dataToUse.directObjectTotals, dataToUse)
      
      // ===== HOÀN THÀNH =====
      console.log('🔍 Step 5: Completing update...')
      
      // Removed success notification
      
      console.log('🔄 Calling onSuccess callback...')
      hideSidebar(true) // Ensure sidebar is hidden
      onSuccess()
      onClose()
      resetForm()
      console.log('✅ Update completed successfully')
      
    } catch (error) {
      console.error('❌ Error updating parent expense:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Function cập nhật chi phí con
  const updateChildExpenses = async (parentId: string, directObjectTotals: Record<string, number>, expenseData?: any) => {
    try {
      console.log('🔄 Updating child expenses for parent:', parentId)
      
      // Use expenseData parameter if available, otherwise use pendingExpenseData
      const dataToUse = expenseData || pendingExpenseData
      console.log('📊 Using data in updateChildExpenses:', dataToUse)
      
      // Xóa tất cả chi phí con cũ
      const { error: deleteError } = await supabase
        .from('project_expenses')
        .delete()
        .eq('id_parent', parentId)
      
      if (deleteError) {
        console.error('❌ Error deleting old child expenses:', deleteError)
        return
      }
      
      console.log('✅ Deleted old child expenses')
      
      // Tạo chi phí con mới
      for (const [childObjectId, amount] of Object.entries(directObjectTotals)) {
        if (amount > 0) {
          const childObjectName = expenseObjectsOptions.find(o => o.id === childObjectId)?.name || 'Đối tượng'
          const childExpenseData = {
            id: crypto.randomUUID(),
            project_id: dataToUse.formData.project_id,
            description: `${dataToUse.formData.description || 'Chi phí'} - ${childObjectName}`,
            expense_object_id: childObjectId,
            amount: amount,
            currency: dataToUse.formData.currency || 'VND',
            expense_date: dataToUse.formData.expense_date || new Date().toISOString().split('T')[0],
            status: 'pending', // CRITICAL: Must be pending - only approve button can change to approved
            role: selectedRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            id_parent: parentId
          }
          
          const { error: insertError } = await supabase
            .from('project_expenses')
            .insert(childExpenseData)
          
          if (insertError) {
            console.error('❌ Error creating child expense:', insertError)
          } else {
            console.log('✅ Created child expense:', childObjectName, 'with amount:', amount)
          }
        }
      }
      
      console.log('✅ All child expenses updated')
      
    } catch (error) {
      console.error('❌ Error updating child expenses:', error)
    }
  }

  // ========================================
  // FUNCTION TẠO CHI PHÍ MỚI - VIẾT LẠI HOÀN TOÀN
  // ========================================
  const createNewExpense = async (expenseData?: any) => {
    console.log('🔄 ===== STARTING CREATE NEW EXPENSE =====')
    console.log('📊 workshopParentObject:', workshopParentObject)
    console.log('📊 pendingExpenseData:', pendingExpenseData)
    console.log('📊 expenseData parameter:', expenseData)
    console.log('📊 Form data from pendingExpenseData:', pendingExpenseData?.formData)
    console.log('📊 Selected expense object IDs from pendingExpenseData:', pendingExpenseData?.selectedExpenseObjectIds)
    console.log('📊 Invoice items from pendingExpenseData:', pendingExpenseData?.invoiceItems)
    console.log('📊 Direct object totals from pendingExpenseData:', pendingExpenseData?.directObjectTotals)
    
      setSubmitting(true)
      
    try {
      // ===== VALIDATION =====
      console.log('🔍 Step 1: Validation...')
      
      // Use expenseData parameter if available, otherwise use pendingExpenseData
      const dataToUse = expenseData || pendingExpenseData
      console.log('📊 Using data:', dataToUse)
      
      if (!workshopParentObject || !dataToUse) {
        console.error('❌ Missing required data in createNewExpense:', { workshopParentObject, pendingExpenseData, expenseData })
        return
      }
      
      console.log('✅ Validation passed')
      
      // ===== TÍNH TỔNG CHI PHÍ =====
      console.log('🔍 Step 2: Calculating total amount...')
      console.log('📊 directObjectTotals:', dataToUse.directObjectTotals)
      console.log('📊 directObjectTotals type:', typeof dataToUse.directObjectTotals)
      console.log('📊 directObjectTotals keys:', Object.keys(dataToUse.directObjectTotals || {}))
      console.log('📊 directObjectTotals values:', Object.values(dataToUse.directObjectTotals || {}))
      console.log('📊 invoiceItems:', dataToUse.invoiceItems)
      console.log('📊 invoiceItems length:', dataToUse.invoiceItems?.length)
      console.log('📊 grandAllocationTotal:', dataToUse.grandAllocationTotal)
      
      // Calculate total amount from direct object totals (tổng con = cha)
      let totalAmount = (Object.values(dataToUse.directObjectTotals || {}) as number[]).reduce((sum: number, val: number) => sum + (val || 0), 0)
      console.log('💰 Total amount calculated from directObjectTotals (tổng con = cha):', totalAmount)
      console.log('📊 Parent-Child Logic: Tổng con = cha')
      console.log('📊 Direct object totals (con):', dataToUse.directObjectTotals)
      console.log('📊 Calculated total amount (cha):', totalAmount)
      
      // Validate parent-child logic
      if (!validateParentChildLogic(dataToUse.directObjectTotals, totalAmount)) {
        console.error('❌ Parent-Child Logic Violation: Cannot create expense')
        return
      }
      
      if (totalAmount <= 0) {
        console.error('❌ Total amount must be greater than 0')
        console.error('📊 Debug directObjectTotals:', {
          directObjectTotals: dataToUse.directObjectTotals,
          keys: Object.keys(dataToUse.directObjectTotals || {}),
          values: Object.values(dataToUse.directObjectTotals || {}),
          totalAmount
        })
        
        // Try to calculate from invoice items if directObjectTotals is empty
        console.log('🔍 Trying to calculate from invoice items...')
        console.log('📊 Invoice items structure:', dataToUse.invoiceItems)
        
        const invoiceTotal = dataToUse.invoiceItems?.reduce((sum: number, item: any) => {
          console.log('📊 Processing invoice item:', item)
          const itemTotal = item.total || item.amount || 0
          console.log('📊 Item total:', itemTotal)
          return sum + itemTotal
        }, 0) || 0
        
        console.log('💰 Invoice total calculated:', invoiceTotal)
        
        if (invoiceTotal > 0) {
          console.log('✅ Using invoice total as fallback')
          totalAmount = invoiceTotal
          console.log('💰 Using fallback total:', totalAmount)
          
          // Also try to populate directObjectTotals from invoiceItems
          console.log('🔍 Trying to populate directObjectTotals from invoiceItems...')
          const calculatedDirectObjectTotals: Record<string, number> = {}
          
          if (dataToUse.invoiceItems && dataToUse.invoiceItems.length > 0) {
            // Calculate totals for each expense object from invoice items
            for (const item of dataToUse.invoiceItems) {
              if (item.expense_object_id && item.total) {
                calculatedDirectObjectTotals[item.expense_object_id] = (calculatedDirectObjectTotals[item.expense_object_id] || 0) + item.total
              }
            }
            
            console.log('📊 Calculated directObjectTotals from invoiceItems:', calculatedDirectObjectTotals)
            
            // Update dataToUse with calculated directObjectTotals
            dataToUse.directObjectTotals = calculatedDirectObjectTotals
          }
        } else {
          console.error('❌ No valid total found in directObjectTotals or invoiceItems')
          console.error('📊 Debug invoiceItems:', dataToUse.invoiceItems)
          return
        }
      }
      
      // ===== TẠO CHI PHÍ PARENT =====
      console.log('🔍 Step 3: Creating parent expense...')
      
      // Validate required fields
      if (!dataToUse.formData.project_id) {
        console.error('❌ Missing project_id')
        throw new Error('Missing project_id')
      }
      
      if (!dataToUse.formData.description?.trim()) {
        console.error('❌ Missing description')
        throw new Error('Missing description')
      }
      
      if (!workshopParentObject?.id) {
        console.error('❌ Missing workshopParentObject.id')
        throw new Error('Missing workshopParentObject.id')
      }
      
      if (totalAmount <= 0) {
        console.error('❌ Invalid totalAmount:', totalAmount)
        throw new Error('Invalid totalAmount')
      }
      
      const parentExpenseData = {
        id: crypto.randomUUID(),
        project_id: dataToUse.formData.project_id,
        description: dataToUse.formData.description.trim(),
        expense_object_id: workshopParentObject.id,
        amount: totalAmount,
        currency: dataToUse.formData.currency || 'VND',
        expense_date: dataToUse.formData.expense_date,
        status: 'pending', // CRITICAL: Must be pending - only approve button can change to approved
        employee_id: dataToUse.formData.employee_id || null,
        id_parent: null, // This is a parent expense, so no parent
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expense_object_columns: Object.keys(dataToUse.directObjectTotals || {}),
        invoice_items: dataToUse.invoiceItems?.map((item: any) => ({
          ...item,
          components_quantity: item.componentsQuantity || {},
          components_unit_price: item.componentsUnitPrice || {}
        })) || []
      }
      
      console.log('📤 Parent expense data:', parentExpenseData)
      console.log('📊 Parent expense data validation:', {
        hasId: !!parentExpenseData.id,
        hasProjectId: !!parentExpenseData.project_id,
        hasDescription: !!parentExpenseData.description,
        hasAmount: parentExpenseData.amount > 0,
        hasExpenseObjectId: !!parentExpenseData.expense_object_id,
        hasCurrency: !!parentExpenseData.currency,
        hasExpenseDate: !!parentExpenseData.expense_date,
        hasStatus: !!parentExpenseData.status
      })
      
      // Debug: Check if data is actually populated
      console.log('🔍 Debug dataToUse:', {
        formData: dataToUse.formData,
        directObjectTotals: dataToUse.directObjectTotals,
        invoiceItems: dataToUse.invoiceItems,
        workshopParentObject: workshopParentObject
      })
      
      // Debug: Check individual fields
      console.log('🔍 Debug individual fields:', {
        project_id: dataToUse.formData?.project_id,
        description: dataToUse.formData?.description,
        currency: dataToUse.formData?.currency,
        expense_date: dataToUse.formData?.expense_date,
        workshopParentObject_id: workshopParentObject?.id,
        totalAmount: totalAmount
      })
      
      const { data: createdParent, error: parentError } = await supabase
        .from('project_expenses')
        .insert(parentExpenseData)
        .select()
        .single()
      
      if (parentError) {
        console.error('❌ Error creating parent expense:', parentError)
        console.error('📊 Error details:', {
          message: parentError.message,
          details: parentError.details,
          hint: parentError.hint,
          code: parentError.code
        })
        console.error('📊 Data that failed:', parentExpenseData)
        throw parentError
      }
      
      console.log('✅ Created parent expense:', createdParent)
      
      // ===== TẠO CHI PHÍ CON =====
      console.log('🔍 Step 4: Creating child expenses...')
      
      const childExpenses = []
      
      for (const [childObjectId, amount] of Object.entries(dataToUse.directObjectTotals)) {
        const amountValue = Number(amount)
        if (amountValue <= 0) {
          console.log('⚠️ Skipping child with zero amount:', childObjectId)
          continue
        }
        
        const childObjectName = expenseObjectsOptions.find(o => o.id === childObjectId)?.name || 'Đối tượng'
        const childExpenseData = {
          id: crypto.randomUUID(),
          project_id: dataToUse.formData.project_id,
          description: `${dataToUse.formData.description} - ${childObjectName}`,
          expense_object_id: childObjectId,
          amount: amountValue,
          currency: dataToUse.formData.currency || 'VND',
          expense_date: dataToUse.formData.expense_date,
          status: 'pending', // CRITICAL: Must be pending - only approve button can change to approved
          employee_id: dataToUse.formData.employee_id || null,
          id_parent: createdParent.id, // Link to parent
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expense_object_columns: [childObjectId],
          invoice_items: []
        }
        
        console.log('📤 Creating child expense:', childObjectName, 'amount:', amountValue)
        
        const { data: createdChild, error: childError } = await supabase
          .from('project_expenses')
          .insert(childExpenseData)
          .select()
          .single()
        
        if (childError) {
          console.error('❌ Error creating child expense:', childError)
          throw childError
        }
        
        console.log('✅ Created child expense:', childObjectName, 'with amount:', amountValue)
        childExpenses.push(createdChild)
      }
      
      console.log('📊 Total child expenses created:', childExpenses.length)
      
      // ===== HOÀN THÀNH =====
      console.log('🔍 Step 5: Completing creation...')
      
      // Show success notification and close dialog
      alert('Tạo chi phí đối tượng thành công!')
      
      console.log('🔄 Calling onSuccess callback...')
      hideSidebar(true) // Ensure sidebar is hidden
      onSuccess()
      onClose()
      resetForm()
      console.log('✅ Create new expense completed successfully')
      
    } catch (error) {
      console.error('❌ Error creating new expense:', error)
      alert('Lỗi khi tạo chi phí đối tượng!')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      project_id: '',
      employee_id: '',
      category: 'planned',
      description: '',
      expense_object_id: '',
      planned_amount: 0,
      actual_amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: '',
      receipt_url: '',
      currency: 'VND',
      id_parent: ''
    })
    setErrors({})
    // Clear expense object selection to trigger auto-select all
    setSelectedExpenseObjectIds([])
    setSelectedRole('')
    console.log('🔄 Reset form - cleared expense object selection')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600'
    if (variance < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <BarChart3 className="h-4 w-4" />
    if (variance < 0) return <Target className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  // Handle click on expense object total cost
  const handleExpenseObjectTotalClick = (expenseObjectId: string) => {
    setSelectedExpenseObjectId(expenseObjectId)
    setShowCostDetailModal(true)
  }


  // Get detailed breakdown for selected expense object
  const getExpenseObjectDetail = (expenseObjectId: string) => {
    const expenseObject = expenseObjectsOptions.find(obj => obj.id === expenseObjectId)
    const totalAmount = expenseObjectTotals[expenseObjectId] || 0
    
    const breakdown = invoiceItems.map((row, index) => {
      const percentage = Number(row.componentsPct[expenseObjectId] ?? 0)
      const amount = row.componentsAmt[expenseObjectId]
      const calculatedAmount = amount !== undefined ? Number(amount) : Math.round(((row.lineTotal || 0) * percentage) / 100)
      
      return {
        rowIndex: index + 1,
        section: row.section,
        productName: row.productName,
        lineTotal: row.lineTotal,
        percentage: percentage,
        amount: calculatedAmount
      }
    }).filter(item => item.amount > 0)

    return {
      expenseObject,
      totalAmount,
      breakdown
    }
  }

  // Handle direct product cost input
  const handleDirectProductCostChange = (rowIndex: number, value: number) => {
    setDirectProductCosts(prev => ({
      ...prev,
      [rowIndex]: value
    }))
    
    // Update the invoice item's line total
    updateRow(rowIndex, (row) => ({
      ...row,
      lineTotal: value
    }))
  }

  // Handle direct object cost input
  const handleDirectObjectCostChange = (objectId: string, value: number) => {
    setDirectObjectCosts(prev => ({
      ...prev,
      [objectId]: value
    }))
    
    // Auto-calculate breakdown for all products
    const totalObjectCost = value
    const totalProductCost = invoiceItems.reduce((sum, row) => sum + row.lineTotal, 0)
    
    if (totalProductCost > 0) {
      invoiceItems.forEach((row, index) => {
        const productPercentage = (row.lineTotal / totalProductCost) * 100
        const objectAmount = (totalObjectCost * productPercentage) / 100
        
        updateRow(index, (updatedRow) => ({
          ...updatedRow,
          componentsPct: {
            ...updatedRow.componentsPct,
            [objectId]: productPercentage
          },
          componentsAmt: {
            ...updatedRow.componentsAmt,
            [objectId]: objectAmount
          }
        }))
      })
    }
  }

  // Switch input mode
  const switchInputMode = (mode: 'detailed' | 'product-total' | 'object-total') => {
    setInputMode(mode)
    
    if (mode === 'product-total') {
      // Clear object costs when switching to product mode
      setDirectObjectCosts({})
    } else if (mode === 'object-total') {
      // Clear product costs when switching to object mode
      setDirectProductCosts({})
    }
  }


  // Format number with commas (no currency symbol)
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }

  // Parse currency from formatted string
  const parseCurrency = (formattedValue: string): number => {
    // Remove all non-numeric characters except decimal point
    const cleanValue = formattedValue.replace(/[^\d.]/g, '')
    return parseFloat(cleanValue) || 0
  }

  // Handle unit price change with formatting
  const handleUnitPriceChange = (rowIndex: number, inputValue: string) => {
    const numericValue = parseCurrency(inputValue)
    
    // Update the actual value
    updateRow(rowIndex, (row) => ({
      ...row,
      unitPrice: numericValue
    }))
    
    // Format the display value if it's a valid number
    const formattedValue = numericValue > 0 ? formatNumber(numericValue) : inputValue
    
    // Update formatted display value
    setFormattedUnitPrices(prev => ({
      ...prev,
      [rowIndex]: formattedValue
    }))
  }

  // Handle object amount change with formatting
  const handleObjectAmountChange = (objectId: string, rowIndex: number, inputValue: string) => {
    const numericValue = parseCurrency(inputValue)
    
    // Update the actual value
    updateRow(rowIndex, (row) => {
      const next = { ...row }
      next.componentsAmt[objectId] = numericValue
      next.componentsPct[objectId] = (next.lineTotal || 0) > 0 ? (numericValue * 100) / (next.lineTotal || 1) : 0
      return next
    })
    
    // Format the display value if it's a valid number
    const formattedValue = numericValue > 0 ? formatNumber(numericValue) : inputValue
    
    // Update formatted display value
    setFormattedObjectAmounts(prev => ({
      ...prev,
      [objectId]: {
        ...prev[objectId],
        [rowIndex]: formattedValue
      }
    }))
  }

  // Initialize formatted prices when component mounts or invoiceItems change
  React.useEffect(() => {
    const newFormattedPrices: Record<number, string> = {}
    invoiceItems.forEach((row, index) => {
      newFormattedPrices[index] = formatNumber(row.unitPrice)
    })
    setFormattedUnitPrices(newFormattedPrices)
  }, [invoiceItems])


  // Handle direct object total input - just store the total, don't calculate details
  const handleDirectObjectTotalChange = (objectId: string, value: number) => {
    setDirectObjectTotals(prev => ({
      ...prev,
      [objectId]: value
    }))
    
    // Only store the total, don't calculate breakdown
    // The total will be used directly in the summary display
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="bg-white shadow-2xl border border-gray-200 min-h-full w-full animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50" data-tour-id={category === 'planned' ? 'planned-expense-header' : 'actual-expense-header'}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${category === 'actual' ? 'bg-green-100' : 'bg-blue-100'}`}>
              <DollarSign className={`h-6 w-6 ${category === 'actual' ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEdit 
                  ? (category === 'actual' ? 'Chỉnh sửa chi phí thực tế' : 'Chỉnh sửa chi phí kế hoạch')
                  : (category === 'actual' ? 'Tạo chi phí thực tế' : 'Tạo chi phí kế hoạch')}
              </h2>
              <p className="text-sm text-black mt-1">
                {category === 'actual' 
                  ? (isEdit ? 'Chỉnh sửa chi phí thực tế đã phát sinh cho dự án' : 'Tạo chi phí thực tế đã phát sinh cho dự án')
                  : (isEdit ? 'Chỉnh sửa chi phí dự kiến cho dự án' : 'Tạo chi phí dự kiến cho dự án')}
              </p>
              
              {/* Show selected expense info */}
              {selectedExpenseToUpdate && (
                <div className="mt-2 text-sm text-blue-600">
                  Đang cập nhật: {selectedExpenseToUpdate.description}
            </div>
              )}
          </div>
          </div>
          <div className="flex items-center space-x-2">
            {category === 'planned' && (
              <button
                onClick={() => startPlannedExpenseTour()}
                disabled={isPlannedExpenseTourRunning || submitting}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isPlannedExpenseTourRunning || submitting
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-white bg-blue-600 hover:bg-blue-700'
                }`}
                title="Bắt đầu hướng dẫn tạo chi phí kế hoạch"
              >
                <CircleHelp className="h-4 w-4" />
                <span>Hướng dẫn</span>
              </button>
            )}
            {category === 'actual' && (
              <button
                onClick={() => startActualExpenseTour()}
                disabled={isActualExpenseTourRunning || submitting}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isActualExpenseTourRunning || submitting
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-white bg-green-600 hover:bg-green-700'
                }`}
                title="Bắt đầu hướng dẫn tạo chi phí thực tế"
              >
                <CircleHelp className="h-4 w-4" />
                <span>Hướng dẫn</span>
              </button>
            )}
            {/* Update existing expense button */}
            {category === 'actual' && !selectedExpenseToUpdate && formData.project_id && (
              <button
                onClick={loadExistingExpenses}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                title="Chọn chi phí thực tế đã có để cập nhật"
              >
                🔄 Cập nhật chi phí đã có
              </button>
            )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6 text-gray-900 flex flex-col">
          <div className="space-y-6 flex-none">
            {/* Basic Information Section */}
            <div className="bg-white border border-gray-200 rounded-lg" data-tour-id={category === 'planned' ? 'planned-expense-basic-info' : 'actual-expense-basic-info'}>
              <button
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">Thông tin cơ bản</span>
                </div>
                {expandedSections.basic ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {expandedSections.basic && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div data-tour-id={category === 'planned' ? 'planned-expense-field-project' : 'actual-expense-field-project'}>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Dự án <span className="text-red-500">*</span>
                      </label>
                      {loading ? (
                        <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                          <span className="text-sm text-black">Đang tải...</span>
                        </div>
                      ) : projects.length === 0 ? (
                        <div className="w-full border border-red-300 rounded-md px-3 py-2 bg-red-50">
                          <span className="text-sm text-red-600">Không có dự án</span>
                        </div>
                      ) : (
                        <select
                          value={formData.project_id}
                          onChange={async (e) => {
                            const value = e.target.value
                            const selectedProject = projects.find(p => p.id === value)
                            // Tự động điền mô tả khi chọn dự án
                            const newDescription = value && selectedProject
                              ? `${selectedProject.name} - chi phí ${category === 'planned' ? 'kế hoạch' : 'thực tế'}`
                              : formData.description
                            setFormData({ ...formData, project_id: value, description: newDescription })
                            // Reset flag khi chọn dự án mới
                            if (value) {
                              setDescriptionIsManual(false)
                            }
                            if (value) {
                              await loadInvoiceItemsForProject(value)
                            } else {
                              setInvoiceItems([])
                              setQuoteProductComponents([])
                              setSelectedExpenseObjectIds([])
                            }
                          }}
                          className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                            errors.project_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Chọn dự án</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.project_code} - {project.name} ({project.status})
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.project_id && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.project_id}
                        </p>
                      )}
                    </div>

                    <div data-tour-id={category === 'planned' ? 'planned-expense-field-employee' : 'actual-expense-field-employee'}>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nhân viên
                      </label>
                      <select
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        disabled={!!formData.employee_id} // Disable khi đã auto-fill
                        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                          formData.employee_id ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="">Chọn nhân viên (tùy chọn)</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </option>
                        ))}
                      </select>
                      {formData.employee_id && (
                        <p className="text-xs text-blue-600 mt-1">
                          ✅ Đã tự động điền nhân viên đang đăng nhập
                        </p>
                      )}
                    </div>
                  </div>

                  <div data-tour-id={category === 'planned' ? 'planned-expense-field-parent' : 'actual-expense-field-parent'}>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <div className="flex items-center space-x-2">
                        <span>Chi phí cha (tuỳ chọn)</span>
                        <div className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          <span>📊</span>
                          <span>Cấp cha</span>
                        </div>
                      </div>
                    </label>
                    <select
                      value={formData.id_parent}
                      onChange={(e) => setFormData({ ...formData, id_parent: e.target.value })}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 text-gray-900 ${
                        category === 'actual' ? 'focus:ring-green-500 border-gray-300' : 'focus:ring-blue-500 border-gray-300'
                      }`}
                    >
                      <option value="">Không chọn chi phí cha</option>
                      {(category === 'planned' ? parentQuotes : parentExpenses).map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          🏢 Cấp: 1 - {(parent.expense_code ? parent.expense_code + ' - ' : '') + parent.description} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parent.amount || 0)})
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        {category === 'planned' 
                          ? 'Chọn chi phí kế hoạch làm cha (từ project_expenses_quote)'
                          : 'Chọn chi phí thực tế làm cha (từ project_expenses)'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1 text-blue-600">
                          <span>🏢</span>
                          <span>Cấp cha: Chi phí chính (Cấp: 1)</span>
                        </div>
                        <div className="flex items-center space-x-1 text-green-600">
                          <span>📋</span>
                          <span>Cấp con: Chi phí chi tiết (Cấp: 2+)</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Restore Button - Show when parent is selected */}
                    {formData.id_parent && (
                      <div className="mt-3">
                        <ExpenseRestoreButton
                          parentId={formData.id_parent}
                          tableName={category === 'planned' ? 'project_expenses_quote' : 'project_expenses'}
                          onRestore={() => {
                            // Reload parent expenses after restore
                            const loadParents = async () => {
                              try {
                                if (category === 'planned') {
                                  const { data, error } = await supabase
                                    .from('project_expenses_quote')
                                    .select('id, expense_code, description, amount')
                                    .eq('project_id', formData.project_id)
                                    .order('created_at', { ascending: false })
                                  if (error) throw error
                                  setParentQuotes(data || [])
                                } else {
                                  const { data, error } = await supabase
                                    .from('project_expenses')
                                    .select('id, expense_code, description, amount')
                                    .eq('project_id', formData.project_id)
                                    .eq('status', 'approved')
                                    .order('created_at', { ascending: false })
                                  if (error) throw error
                                  setParentExpenses(data || [])
                                }
                              } catch (e) {
                                console.error('Error reloading parent expenses:', e)
                              }
                            }
                            loadParents()
                          }}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Chọn chi phí thực tế để cập nhật - chỉ hiển thị khi category = 'actual' */}
                  {category === 'actual' && (
                    <div data-tour-id="actual-expense-field-update">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Chọn chi phí thực tế để cập nhật (tùy chọn)
                      </label>
                      <select
                        value={selectedExpenseForUpdate}
                        onChange={(e) => handleExpenseSelection(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                      >
                        <option value="">Không chọn - Tạo chi phí mới</option>
                        {expenseDropdownOptions.map((expense) => (
                          <option key={expense.id} value={expense.id}>
                            {expense.expense_code ? `${expense.expense_code} - ` : ''}{expense.description} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expense.amount || 0)} ({new Date(expense.expense_date).toLocaleDateString('vi-VN')})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Chọn chi phí thực tế đã có để cập nhật thông tin
                      </p>
                      
                      {/* Hiển thị thông tin chi phí đã chọn */}
                      {selectedExpenseToUpdate && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-900">
                              Đang cập nhật: {selectedExpenseToUpdate.description}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-blue-700">
                            Số tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedExpenseToUpdate.amount || 0)} | 
                            Ngày: {new Date(selectedExpenseToUpdate.expense_date).toLocaleDateString('vi-VN')} | 
                            Trạng thái: {selectedExpenseToUpdate.status === 'approved' ? 'Đã duyệt' : selectedExpenseToUpdate.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div data-tour-id={category === 'planned' ? 'planned-expense-field-category' : 'actual-expense-field-category'}>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Loại chi phí <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={category}
                        className={`w-full border rounded-md px-3 py-2 text-sm bg-gray-50 cursor-not-allowed ${
                          category === 'actual' ? 'text-green-700 border-green-300' : 'text-blue-700 border-blue-300'
                        }`}
                        disabled
                      >
                        <option value="planned">Kế hoạch</option>
                        <option value="actual">Thực tế</option>
                      </select>
                    </div>

                    <div data-tour-id={category === 'planned' ? 'planned-expense-field-date' : 'actual-expense-field-date'}>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Ngày chi phí <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.expense_date}
                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                          errors.expense_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.expense_date && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.expense_date}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Role field - ẩn nhưng vẫn hoạt động (tự động điền) */}
                  <div className="space-y-2 hidden" data-tour-id={category === 'planned' ? 'planned-expense-field-role' : 'actual-expense-field-role'}>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Vai trò *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="role"
                        value={selectedRole}
                        readOnly
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                        placeholder="Vai trò của bạn"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-green-600 text-sm">✅</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      ✅ Đã tự động điền vai trò của nhân viên đang đăng nhập
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" data-tour-id={category === 'planned' ? 'planned-expense-objects' : 'actual-expense-objects'}>
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Target className="w-4 h-4 text-blue-600" />
                          </div>
                          <span>Đối tượng chi phí (có thể chọn nhiều)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowExpenseObjectSelection(!showExpenseObjectSelection)}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          title={showExpenseObjectSelection ? 'Ẩn' : 'Hiện'}
                        >
                          {showExpenseObjectSelection ? (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                      </div>
                      <div className="text-sm font-normal text-gray-600 mt-1 ml-8">
                        Chọn các đối tượng chi phí để phân bổ ngân sách dự án
                      </div>
                    </label>
                    
                    {showExpenseObjectSelection && (
                      <div className="space-y-3">
                        {/* Expense Object Tree View */}
                        <ExpenseObjectTreeView
                          expenseObjects={expenseObjectsOptions}
                          selectedIds={selectedExpenseObjectIds}
                          onSelectionChange={setSelectedExpenseObjectIds}
                          expenseAmounts={combinedExpenseObjectTotals}
                          invoiceItems={invoiceItems.map((item, idx) => ({
                            id: idx.toString(),
                            productName: item.productName,
                            componentsAmt: item.componentsAmt,
                            lineTotal: item.lineTotal || 0
                          }))}
                        />
                        
                        {/* Selected Objects Summary */}
                        {selectedExpenseObjectIds.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-800">
                                  Đã chọn {selectedExpenseObjectIds.length} đối tượng
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedExpenseObjectIds([])}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Bỏ chọn tất cả
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

                </div>

          {/* Split area: Left invoice details, Right amount/additional sections */}
          <div className="flex-1 overflow-hidden mt-6">
            <div className="grid grid-cols-1 gap-6 h-full">
              {/* System Notification */}
              {systemNotification && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-orange-800 font-medium text-sm">
                        Thông báo hệ thống
                      </h4>
                      <p className="text-orange-700 text-sm mt-1">
                        {systemNotification}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice-like details full width */}
              <div className="h-full overflow-auto bg-white border border-gray-200 rounded-lg" data-tour-id={category === 'planned' ? 'planned-expense-amounts' : 'actual-expense-amounts'}>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Chi tiết hóa đơn</h3>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-600">100% Đối tượng chi phí</div>
                      {/* Load lại chi phí button - chỉ hiển thị khi đang edit và có project_id */}
                      {isEdit && formData.project_id && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setLoading(true)
                              showNotification('Đang tải lại chi phí từ dự án...', 'info')
                              await loadInvoiceItemsForProject(formData.project_id)
                              showNotification('Đã tải lại chi phí thành công!', 'success')
                            } catch (error) {
                              console.error('❌ Error reloading expenses:', error)
                              showNotification('Lỗi khi tải lại chi phí: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'), 'error')
                            } finally {
                              setLoading(false)
                            }
                          }}
                          disabled={loading || submitting}
                          className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Tải lại chi phí từ dự án (kế hoạch/thực tế)"
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                          Load lại chi phí
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowColumnDialog(true)}
                        className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Hiện/Ẩn cột
                      </button>
                    </div>
                  </div>
                  
                  
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-900" style={{ minWidth: '1200px' }}>
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th rowSpan={2} className="px-3 py-2 text-left font-semibold bg-gray-50 sticky z-20" style={{ minWidth: '60px', left: '0px' }}>STT</th>
                        {visibleColumns.name && <th rowSpan={2} className="px-3 py-2 text-left font-semibold bg-gray-50 sticky z-20" style={{ minWidth: '200px', left: '60px' }}>Tên sản phẩm</th>}
                        {visibleColumns.description && <th rowSpan={2} className="px-3 py-2 text-left font-semibold" style={{ minWidth: '150px' }}>Mô tả</th>}
                        {visibleColumns.unit_price && <th rowSpan={2} className="px-3 py-2 text-right font-semibold bg-gray-50 sticky z-20" style={{ minWidth: '100px', left: '260px' }}>Đơn giá</th>}
                        {visibleColumns.quantity && <th rowSpan={2} className="px-3 py-2 text-right font-semibold bg-gray-50 sticky z-20" style={{ minWidth: '80px', left: '360px' }}>Số lượng</th>}
                        {visibleColumns.unit && <th rowSpan={2} className="px-3 py-2 text-left font-semibold bg-gray-50 sticky z-20" style={{ minWidth: '80px', left: '440px' }}>Đơn vị</th>}
                        {visibleColumns.total_price && <th rowSpan={2} className="px-3 py-2 text-right font-semibold bg-gray-50 sticky z-20" style={{ minWidth: '120px', left: '520px' }}>Thành tiền</th>}
                        {selectedExpenseObjectIds.length > 0 && selectedExpenseObjectIds.map((id) => (
                          <th key={`${id}-group`} colSpan={[
                            visibleColumns.expense_percentage,
                            visibleColumns.expense_quantity,
                            visibleColumns.expense_unit_price,
                            visibleColumns.expense_amount
                          ].filter(Boolean).length} className="px-3 py-2 text-center font-semibold" style={{ minWidth: '200px' }}>
                            {(expenseObjectsOptions.find(o => o.id === id)?.name) || 'Đối tượng'}
                          </th>
                        ))}
                        {selectedExpenseObjectIds.length > 0 && (
                        <th rowSpan={2} className="px-3 py-2 text-right font-semibold" style={{ minWidth: '120px' }}>Tổng phân bổ</th>
                        )}
                        <th rowSpan={2} className="px-3 py-2 text-right font-semibold" style={{ minWidth: '80px' }}></th>
                      </tr>
                      <tr>
                        {selectedExpenseObjectIds.length > 0 && selectedExpenseObjectIds.map((id) => (
                          <React.Fragment key={`${id}-header`}>
                        {visibleColumns.expense_percentage && <th className="px-3 py-2 text-right font-semibold" style={{ minWidth: '60px' }}>%</th>}
                        {visibleColumns.expense_quantity && <th className="px-3 py-2 text-right font-semibold" style={{ minWidth: '80px' }}>Đơn vị</th>}
                        {visibleColumns.expense_unit_price && <th className="px-3 py-2 text-right font-semibold" style={{ minWidth: '100px' }}>Đơn giá</th>}
                        {visibleColumns.expense_amount && <th className="px-3 py-2 text-right font-semibold" style={{ minWidth: '120px' }}>VND</th>}
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((row, i) => (
                        <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                          <td className="px-3 py-2 bg-white sticky z-10" style={{ left: '0px' }}>
                            {row.index}
                          </td>
                          {visibleColumns.name && (
                            <td className="px-3 py-2 bg-white sticky z-10" style={{ left: '60px' }}>
                              <input
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-100 cursor-not-allowed"
                                style={{ minWidth: '180px' }}
                                value={row.productName}
                                onChange={(e) => updateRow(i, r => ({ ...r, productName: e.target.value }))}
                                disabled
                              />
                            </td>
                          )}
                          {visibleColumns.description && (
                            <td className="px-3 py-2 bg-white">
                              <input
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                style={{ minWidth: '140px' }}
                                value={row.description || ''}
                                onChange={(e) => updateRow(i, r => ({ ...r, description: e.target.value }))}
                                placeholder="Mô tả sản phẩm..."
                              />
                            </td>
                          )}
                          {visibleColumns.unit_price && (
                            <td className="px-3 py-2 text-right bg-white sticky z-10" style={{ left: '260px' }}>
                              <input
                                type="text"
                                className="w-full border-2 border-gray-400 rounded px-2 py-1.5 text-sm text-right text-black font-medium bg-gray-100 cursor-not-allowed"
                                style={{ minWidth: '90px' }}
                                value={formattedUnitPrices[i] || formatNumber(row.unitPrice)}
                                onChange={(e) => handleUnitPriceChange(i, e.target.value)}
                                placeholder="0"
                                disabled
                              />
                            </td>
                          )}
                          {visibleColumns.quantity && (
                            <td className="px-3 py-2 text-right bg-white sticky z-10" style={{ left: '360px' }}>
                              <input
                                type="number"
                                className="w-full border-2 border-gray-400 rounded px-2 py-1.5 text-sm text-right text-black font-medium bg-gray-100 cursor-not-allowed"
                                style={{ minWidth: '70px' }}
                                value={row.quantity}
                                onChange={(e) => updateRow(i, r => ({ ...r, quantity: parseFloat(e.target.value) || 0 }))}
                                step="1"
                                min="0"
                                disabled
                              />
                            </td>
                          )}
                          {visibleColumns.unit && (
                            <td className="px-3 py-2 bg-white sticky z-10" style={{ left: '440px' }}>
                              <input
                                className="w-full border-2 border-gray-400 rounded px-2 py-1.5 text-sm text-black font-medium bg-gray-100 cursor-not-allowed"
                                style={{ minWidth: '70px' }}
                                value={row.unit}
                                onChange={(e) => updateRow(i, r => ({ ...r, unit: e.target.value }))}
                                disabled
                              />
                            </td>
                          )}
                          {visibleColumns.total_price && (
                            <td className="px-3 py-2 text-right bg-white sticky z-10" style={{ left: '520px' }}>
                              {new Intl.NumberFormat('vi-VN').format(row.lineTotal)}
                            </td>
                          )}
                          {selectedExpenseObjectIds.length > 0 && selectedExpenseObjectIds.map((id) => (
                            <React.Fragment key={`${id}-row-${i}`}>
                              {visibleColumns.expense_percentage && (
                                <td className="px-3 py-2 text-right">
                                  <input
                                    type="number"
                                    className="w-full border-2 border-gray-400 rounded px-2 py-1.5 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    style={{ minWidth: '50px' }}
                                    value={row.componentsPct[id] ?? 0}
                                    onChange={(e) => {
                                      const pct = parseFloat(e.target.value) || 0
                                      updateRow(i, r => {
                                        const next = { ...r }
                                        next.componentsPct[id] = pct
                                        next.componentsAmt[id] = Math.round(((next.lineTotal || 0) * pct) / 100)
                                        return next
                                      })
                                    }}
                                    step="0.5"
                                    min="0"
                                    max="100"
                                  />
                                </td>
                              )}
                              {visibleColumns.expense_quantity && (
                                <td className="px-3 py-2 text-right">
                                  <input
                                    type="number"
                                    className="w-full border-2 border-gray-400 rounded px-2 py-1.5 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    style={{ minWidth: '70px' }}
                                    value={row.componentsQuantity[id] || 0}
                                    onChange={(e) => {
                                      const quantity = parseFloat(e.target.value) || 0
                                      const unitPrice = row.componentsUnitPrice[id] || 0
                                      const amount = quantity * unitPrice
                                      const lineTotal = row.lineTotal || 0
                                      const percentage = lineTotal > 0 ? (amount / lineTotal) * 100 : 0
                                      
                                      updateRow(i, r => {
                                        const next = { ...r }
                                        next.componentsQuantity[id] = quantity
                                        next.componentsAmt[id] = amount
                                        next.componentsPct[id] = Math.round(percentage * 100) / 100 // Làm tròn 2 chữ số thập phân
                                        return next
                                      })
                                    }}
                                    step="1"
                                    min="0"
                                  />
                                </td>
                              )}
                              {visibleColumns.expense_unit_price && (
                                <td className="px-3 py-2 text-right">
                                  <input
                                    type="number"
                                    className="w-full border-2 border-gray-400 rounded px-2 py-1.5 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    style={{ minWidth: '90px' }}
                                    value={row.componentsUnitPrice[id] || 0}
                                    onChange={(e) => {
                                      const unitPrice = parseFloat(e.target.value) || 0
                                      const quantity = row.componentsQuantity[id] || 0
                                      const amount = quantity * unitPrice
                                      const lineTotal = row.lineTotal || 0
                                      const percentage = lineTotal > 0 ? (amount / lineTotal) * 100 : 0
                                      
                                      updateRow(i, r => {
                                        const next = { ...r }
                                        next.componentsUnitPrice[id] = unitPrice
                                        next.componentsAmt[id] = amount
                                        next.componentsPct[id] = Math.round(percentage * 100) / 100 // Làm tròn 2 chữ số thập phân
                                        return next
                                      })
                                    }}
                                    placeholder="0"
                                    min="0"
                                    step="100000"
                                  />
                                </td>
                              )}
                              {visibleColumns.expense_amount && (
                                <td className="px-3 py-2 text-right">
                                  <input
                                    type="number"
                                    className="w-full border-2 border-gray-400 rounded px-2 py-1.5 text-sm text-right text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    style={{ minWidth: '100px' }}
                                    value={row.componentsAmt[id] || 0}
                                    onChange={(e) => {
                                      const amount = parseFloat(e.target.value) || 0
                                      const quantity = row.componentsQuantity[id] || 0
                                      const unitPrice = quantity > 0 ? amount / quantity : 0
                                      updateRow(i, r => {
                                        const next = { ...r }
                                        next.componentsAmt[id] = amount
                                        next.componentsUnitPrice[id] = unitPrice
                                        return next
                                      })
                                    }}
                                    placeholder="0"
                                    step="100000"
                                    min="0"
                                  />
                                </td>
                              )}
                            </React.Fragment>
                          ))}
                          {/* Tổng phân bổ theo dòng */}
                          {selectedExpenseObjectIds.length > 0 && (
                          <td className="px-3 py-2 text-right font-medium">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                              selectedExpenseObjectIds.reduce((s, id) => {
                                const pct = Number(row.componentsPct[id] ?? 0)
                                const amt = row.componentsAmt[id]
                                const value = amt !== undefined ? Number(amt) : Math.round(((row.lineTotal || 0) * pct) / 100)
                                return s + (value || 0)
                              }, 0)
                            )}
                          </td>
                          )}
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => removeRow(i)} className="text-red-600 hover:underline text-xs">Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {(() => {
                        // Calculate visible columns count
                        const visibleBasicColumns = [
                          visibleColumns.name,
                          visibleColumns.description,
                          visibleColumns.unit_price,
                          visibleColumns.quantity,
                          visibleColumns.unit,
                          visibleColumns.total_price
                        ].filter(Boolean).length
                        
                        const visibleExpenseColumns = [
                          visibleColumns.expense_percentage,
                          visibleColumns.expense_quantity,
                          visibleColumns.expense_unit_price,
                          visibleColumns.expense_amount
                        ].filter(Boolean).length
                        
                        const totalColSpan = 1 + visibleBasicColumns + (selectedExpenseObjectIds.length * visibleExpenseColumns) + (selectedExpenseObjectIds.length > 0 ? 1 : 0)
                        
                        return (
                          <>
                            <tr className="bg-gray-50 border-t border-gray-200">
                              <td className="px-3 py-2 text-left font-semibold bg-gray-50 sticky left-0 z-10" colSpan={totalColSpan}>Doanh thu</td>
                              <td className="px-3 py-2 text-right font-semibold">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(projectRevenueTotal)}
                              </td>
                              <td className="px-3 py-2"></td>
                            </tr>
                            {selectedExpenseObjectIds.length > 0 && (
                            <tr className="bg-gray-50">
                              <td className="px-3 py-1.5 text-left text-xs font-medium bg-gray-50 sticky left-0 z-10" colSpan={totalColSpan}>Tổng chi phí</td>
                              <td className={`px-3 py-1.5 text-right text-xs font-medium ${getCostPercentageColor(grandAllocationTotal, plannedAmountComputed)}`}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal)}
                                {plannedAmountComputed > 0 && (
                                  <span className="ml-2 text-xs">
                                    ({(grandAllocationTotal / plannedAmountComputed * 100).toFixed(1)}%)
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-1.5"></td>
                            </tr>
                            )}
                            {selectedExpenseObjectIds.length > 0 && (
                            <tr className="bg-gray-100">
                              <td className="px-3 py-2 text-left font-bold bg-gray-100 sticky left-0 z-10" colSpan={totalColSpan}>Lợi nhuận</td>
                              <td className="px-3 py-2 text-right font-bold">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(profitComputed)}
                              </td>
                              <td className="px-3 py-2"></td>
                            </tr>
                            )}
                          </>
                        )
                      })()}
                    </tfoot>
                  </table>
                  </div>
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                  <button onClick={addRow} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Thêm dòng</button>
                    <div className="flex flex-col items-end gap-1">
                      {selectedExpenseObjectIds.length > 0 && (
                        <div className="text-sm text-gray-700">
                          Tổng chi phí: <span className={`font-semibold ${getCostPercentageColor(grandAllocationTotal, plannedAmountComputed)}`}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal)}
                            {plannedAmountComputed > 0 && (
                              <span className="ml-2">
                                ({(grandAllocationTotal / plannedAmountComputed * 100).toFixed(1)}%)
                              </span>
                            )}
                          </span>
                          {plannedAmountComputed > 0 && grandAllocationTotal > plannedAmountComputed && (
                            <div className="mt-1 text-xs text-red-600 font-medium">
                              ⚠️ Chi phí vượt quá thành tiền!
                            </div>
                          )}
                          {plannedAmountComputed > 0 && grandAllocationTotal > plannedAmountComputed * 0.9 && grandAllocationTotal <= plannedAmountComputed && (
                            <div className="mt-1 text-xs text-yellow-600 font-medium">
                              ⚠️ Chi phí gần bằng thành tiền!
                            </div>
                          )}
                        </div>
                      )}
                      {plannedAmountComputed > 0 && (
                        <div className="text-sm text-gray-700">
                          Lợi nhuận: <span className={`font-semibold ${
                            (plannedAmountComputed - grandAllocationTotal) > 0 ? 'text-green-600' : (plannedAmountComputed - grandAllocationTotal) < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plannedAmountComputed - grandAllocationTotal)}
                            {plannedAmountComputed > 0 && (
                              <span className="ml-2">
                                ({(((plannedAmountComputed - grandAllocationTotal) / plannedAmountComputed) * 100).toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                  <div className="text-sm text-gray-700">
                    Tổng thành tiền: <span className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plannedAmountComputed)}</span>
                      </div>
                    </div>
                </div>
                </div>
            </div>

            {/* Cost Warning Box */}
            {selectedExpenseObjectIds.length > 0 && plannedAmountComputed > 0 && (
              <div className="mt-4">
                {(() => {
                  const costPercentage = (grandAllocationTotal / plannedAmountComputed) * 100
                  const isOverTotal = grandAllocationTotal > plannedAmountComputed
                  const isNearTotal = grandAllocationTotal > plannedAmountComputed * 0.9 && grandAllocationTotal <= plannedAmountComputed
                  
                  if (isOverTotal) {
                    return (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-red-800">
                              Cảnh báo: Chi phí vượt quá thành tiền
                            </h3>
                            <div className="mt-1 text-sm text-red-700">
                              <p>
                                Tổng thành tiền: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plannedAmountComputed)}</strong>
                              </p>
                              <p className="mt-1">
                                Tổng chi phí: <strong className="text-red-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal)}</strong>
                              </p>
                              <p className="mt-1">
                                Lợi nhuận: <strong className="text-red-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plannedAmountComputed - grandAllocationTotal)}</strong>
                                <span className="ml-2">({(((plannedAmountComputed - grandAllocationTotal) / plannedAmountComputed) * 100).toFixed(1)}%)</span>
                              </p>
                              <p className="mt-1 text-red-600 font-medium">
                                ⚠️ Chi phí vượt quá thành tiền {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal - plannedAmountComputed)} ({costPercentage.toFixed(1)}%)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  } else if (isNearTotal) {
                    return (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Cảnh báo: Chi phí gần bằng thành tiền
                            </h3>
                            <div className="mt-1 text-sm text-yellow-700">
                              <p>
                                Tổng thành tiền: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plannedAmountComputed)}</strong>
                              </p>
                              <p className="mt-1">
                                Tổng chi phí: <strong className="text-yellow-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal)}</strong>
                              </p>
                              <p className="mt-1">
                                Lợi nhuận: <strong className="text-yellow-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plannedAmountComputed - grandAllocationTotal)}</strong>
                                <span className="ml-2">({(((plannedAmountComputed - grandAllocationTotal) / plannedAmountComputed) * 100).toFixed(1)}%)</span>
                              </p>
                              <p className="mt-1 text-yellow-600 font-medium">
                                ⚠️ Chi phí đã đạt {costPercentage.toFixed(1)}% thành tiền, cần kiểm tra lại!
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-green-800">
                              Tình trạng: Chi phí trong phạm vi an toàn
                            </h3>
                            <div className="mt-1 text-sm text-green-700">
                              <p>
                                Tổng thành tiền: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plannedAmountComputed)}</strong>
                              </p>
                              <p className="mt-1">
                                Tổng chi phí: <strong className="text-green-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal)}</strong>
                                <span className="ml-2">({costPercentage.toFixed(1)}%)</span>
                              </p>
                              <p className="mt-1">
                                Lợi nhuận: <strong className="text-green-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plannedAmountComputed - grandAllocationTotal)}</strong>
                                <span className="ml-2">({(((plannedAmountComputed - grandAllocationTotal) / plannedAmountComputed) * 100).toFixed(1)}%)</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                })()}
              </div>
            )}

              {/* Right panel removed for full-width invoice table */}
                  </div>
                </div>
            </div>

            {/* Expense Summary Display - Enhanced with hierarchical totals */}
            {selectedExpenseObjectIds.length > 0 && (
              <div key={`expense-summary-${selectedExpenseObjectIds.join('-')}`} className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Tóm tắt chi phí theo cấp độ</span>
                </h3>
                <ExpenseSummaryDisplay
                  key={`expense-summary-display-${selectedExpenseObjectIds.join('-')}-${JSON.stringify(combinedExpenseObjectTotals)}`}
                  selectedObjectIds={selectedExpenseObjectIds}
                  expenseObjects={expenseObjectsOptions}
                  expenseAmounts={combinedExpenseObjectTotals}
                />
              </div>
            )}

            {/* Total Cost Breakdown Section - Always visible */}
            {/* Hiển thị chi phí đối tượng cha khi có parent object và children được chọn */}
            {workshopParentObject && selectedExpenseObjectIds.length > 0 && (
              <div className="mt-4 bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-2 bg-gray-200 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-black">📊 Tổng kết chi phí đối tượng</span>
                    <div className="text-sm text-gray-700">Mối quan hệ cha-con trong chi phí</div>
                    <div className="flex items-center space-x-4 text-xs mt-1">
                      <div className="flex items-center space-x-1 text-blue-600">
                        <span>🏢</span>
                        <span>Cấp cha: {workshopParentObject?.name} ({workshopParentObject?.level || 1})</span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600">
                        <span>📋</span>
                        <span>Cấp con: {selectedExpenseObjectIds.length} đối tượng (2+)</span>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      🔗 Logic: Tổng con = cha | Xóa cha → Xóa con
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                      <span className="text-black font-bold text-lg">{workshopParentObject.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-black">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          (() => {
                            const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
                            return hasDirectObjectInputs 
                              ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                              : grandAllocationTotal
                          })()
                        )}
                      </div>
                      <div className="text-xs text-gray-600">Tổng chi phí</div>
                    </div>
                  </div>
                  
                  {/* Breakdown chi tiết các đối tượng con */}
                  {selectedExpenseObjectIds.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="text-xs text-black font-medium mb-1.5">📋 Chi tiết các đối tượng chi phí con:</div>
                      <div className="space-y-1.5">
                        {selectedExpenseObjectIds.map((id) => {
                          const expenseObject = expenseObjectsOptions.find(o => o.id === id)
                          const totalAmount = combinedExpenseObjectTotals[id] || 0
                          const parentTotal = (() => {
                            const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
                            return hasDirectObjectInputs 
                              ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                              : grandAllocationTotal
                          })()
                          const percentage = parentTotal > 0 ? (totalAmount / parentTotal * 100) : 0
                          
                          return (
                            <div key={id} className="flex items-center justify-between text-xs py-1.5 px-2 bg-gray-50 rounded border border-gray-200">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-black font-medium text-xs">{expenseObject?.name || 'Đối tượng'}</span>
                                  <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                    {expenseObject?.level || 2}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <div className="text-gray-600 text-xs">Tỷ lệ</div>
                                  <div className="font-medium text-black text-xs">{percentage.toFixed(1)}%</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-gray-600 text-xs">Số tiền</div>
                                  <div className="font-medium text-black text-xs">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedExpenseObjectIds.length > 0 && (
              <div key={`expense-object-totals-${selectedExpenseObjectIds.join('-')}`} className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-black">Tổng chi phí theo đối tượng</span>
                </div>

                {/* Direct Input Section */}
                <div className="mb-4 space-y-3">
                  {/* Toggle Buttons */}
                  <div className="flex space-x-2 mb-3">
                    <button
                      onClick={() => setShowObjectTotalInputs(!showObjectTotalInputs)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        showObjectTotalInputs
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {showObjectTotalInputs ? 'Ẩn' : 'Hiện'} Tổng chi phí đối tượng
                    </button>
                  </div>


                  {/* Direct Object Totals Input */}
                  {showObjectTotalInputs && (
                    <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-black font-semibold text-sm">Tổng chi phí từng đối tượng:</span>
                      {selectedExpenseObjectIds.map((id) => {
                        const expenseObject = ExpenseObjectDisplayUtils.getById(expenseObjectsOptions, id)
                        return (
                          <div key={id} className="flex items-center justify-between text-sm">
                            <span className="text-black text-sm">{ExpenseObjectDisplayUtils.formatName(expenseObject)}:</span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={directObjectTotals[id] || 0}
                                onChange={(e) => handleDirectObjectTotalChange(id, parseFloat(e.target.value) || 0)}
                                className="w-32 border-2 border-gray-400 rounded px-2 py-1 text-sm text-right text-black font-medium focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                                placeholder="0"
                                step="1000"
                                min="0"
                              />
                              <span className="text-xs text-gray-600">VND</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Current Breakdown Display */}
                <div className="space-y-1">
                  {selectedExpenseObjectIds.map((id) => {
                    const expenseObject = ExpenseObjectDisplayUtils.getById(expenseObjectsOptions, id)
                    // Use combined totals (direct input takes priority, then calculated)
                    const totalAmount = combinedExpenseObjectTotals[id] || 0
                    
                    // Calculate total allocation: sum of all direct object totals or use grandAllocationTotal
                    const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
                    const totalAllocation = hasDirectObjectInputs 
                      ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                      : grandAllocationTotal
                    
                    const percentage = totalAllocation > 0 ? (totalAmount / totalAllocation * 100) : 0
                    
                    return (
                      <div key={id} className="flex items-center justify-between text-sm py-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                          <span className="text-black font-medium">{ExpenseObjectDisplayUtils.formatName(expenseObject)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-black font-medium">{percentage.toFixed(1)}%</span>
                          <span className="font-semibold text-black">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Hiển thị chi phí đối tượng cha cho Supplier */}
                  {userRole === 'Supplier' && category === 'actual' && workshopParentObject && (
                    <div className="border-t border-gray-300 pt-2 mt-2 bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                          <span className="text-black font-medium text-xs">{workshopParentObject.name} (Tổng)</span>
                          <span className="text-xs text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded-full">
                            Cha = Tổng các con
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-black text-xs">100.0%</span>
                          <span className="font-medium text-black text-sm">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                              (() => {
                                const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
                                return hasDirectObjectInputs 
                                  ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                                  : grandAllocationTotal
                              })()
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 italic">
                        Tổng chi phí đối tượng cha = Tổng các chi phí đối tượng con
                      </div>
                    </div>
                  )}
                  
                  {/* Total Summary */}
                  <div className="border-t border-gray-300 pt-1 mt-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        <span className="text-black text-xs">Tổng cộng</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-black text-xs">100.0%</span>
                        <span className="font-medium text-black text-sm">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            (() => {
                              const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
                              return hasDirectObjectInputs 
                                ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                                : grandAllocationTotal
                            })()
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Hiển thị tổng đối tượng cha = tổng đối tượng con */}
                    {workshopParentObject && selectedExpenseObjectIds.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                            <span className="text-black text-xs">🏢 Tổng cấp cha = 📋 Tổng cấp con</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 text-xs">
                              <span className="text-blue-600">🏢</span>
                              <span className="text-gray-600">Cha =</span>
                              <span className="text-green-600">📋</span>
                              <span className="text-gray-600">Con</span>
                            </div>
                            <span className="font-medium text-black text-xs">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                (() => {
                                  const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
                                  return hasDirectObjectInputs 
                                    ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                                    : grandAllocationTotal
                                })()
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          <span className="font-medium text-black">{workshopParentObject.name}</span> = Tổng các đối tượng con
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Direct Cost Input Sections */}
            {inputMode === 'product-total' && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Nhập tổng chi phí cho từng sản phẩm</span>
                </div>
                <div className="space-y-2">
                  {invoiceItems.map((row, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{row.productName || `Sản phẩm ${index + 1}`}</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={directProductCosts[index] || row.lineTotal}
                          onChange={(e) => handleDirectProductCostChange(index, parseFloat(e.target.value) || 0)}
                          className="w-32 border border-blue-300 rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          step="1000"
                          min="0"
                        />
                        <span className="text-xs text-gray-500">VND</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inputMode === 'object-total' && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Nhập tổng chi phí cho từng đối tượng</span>
                </div>
                <div className="space-y-2">
                  {selectedExpenseObjectIds.map((id) => {
                    const expenseObject = ExpenseObjectDisplayUtils.getById(expenseObjectsOptions, id)
                    return (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{ExpenseObjectDisplayUtils.formatName(expenseObject)}</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={directObjectCosts[id] || 0}
                            onChange={(e) => handleDirectObjectCostChange(id, parseFloat(e.target.value) || 0)}
                            className="w-32 border border-green-300 rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-green-500"
                            placeholder="0"
                            step="1000"
                            min="0"
                          />
                          <span className="text-xs text-gray-500">VND</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-6">
          {/* Planned amount summary moved to bottom */}
          <div className="bg-white border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">Số tiền kế hoạch</div>
              <div className="text-lg font-bold text-blue-700">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal)}
              </div>
            </div>
          </div>
          
          {/* Total Summary with Profit Percentage */}
          {projectRevenueTotal > 0 && (
            <div className="bg-white border border-green-200 rounded-lg p-4 space-y-3">
              <div className="text-sm font-semibold text-gray-900 mb-3">📊 Tổng kết</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">Doanh thu</div>
                  <div className="text-base font-semibold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(projectRevenueTotal)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">
                    {category === 'planned' ? 'Chi phí kế hoạch' : 'Chi phí thực tế'}
                  </div>
                  <div className="text-base font-semibold text-blue-700">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal)}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <div className="text-sm font-medium text-gray-700">Lợi nhuận</div>
                  <div className="text-base font-semibold text-green-700">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(profitComputed)}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <div className="text-sm font-medium text-gray-900">% Lợi nhuận</div>
                  <div className={`text-lg font-bold ${
                    projectRevenueTotal > 0 && (profitComputed / projectRevenueTotal) * 100 > 0 
                      ? 'text-green-600' 
                      : (profitComputed / projectRevenueTotal) * 100 < 0 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                  }`}>
                    {projectRevenueTotal > 0 
                      ? `${((profitComputed / projectRevenueTotal) * 100).toFixed(2)}%`
                      : '0.00%'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Additional Information Section moved to bottom */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('additional')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-gray-900">Thông tin bổ sung</span>
                </div>
                {expandedSections.additional ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {expandedSections.additional && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Tổng chi phí theo đối tượng chi phí */}
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">Tổng theo đối tượng</div>
                    {selectedExpenseObjectIds.length === 0 ? (
                      <div className="text-sm text-gray-600">Chưa chọn đối tượng chi phí</div>
                    ) : (
                      <div className="space-y-1">
                        {selectedExpenseObjectIds.map(id => (
                          <div key={`obj-total-${id}`} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{(expenseObjectsOptions.find(o => o.id === id)?.name) || 'Đối tượng'}</span>
                            <button
                              onClick={() => handleExpenseObjectTotalClick(id)}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                              title="Nhấp để xem chi tiết"
                            >
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expenseObjectTotals[id] || 0)}
                            </button>
                          </div>
                        ))}
                        <div className="pt-2 mt-1 border-t border-gray-200 flex items-center justify-between text-sm">
                          <span className="text-gray-700">Tổng kế hoạch</span>
                          <span className="font-semibold text-blue-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plannedAmountComputed)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Trạng thái
                      </label>
                      <input
                        value="Chờ duyệt"
                        readOnly
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Đơn vị tiền tệ
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="VND">VND (Việt Nam Đồng)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      rows={3}
                      placeholder="Ghi chú thêm về chi phí dự án..."
                    />
                  </div>

                  {/* Mô tả - di chuyển xuống cuối */}
                  <div data-tour-id={category === 'planned' ? 'planned-expense-field-description' : 'actual-expense-field-description'}>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value })
                        // Đánh dấu là người dùng đã chỉnh sửa thủ công
                        setDescriptionIsManual(true)
                        // Clear system notification when user starts typing
                        if (systemNotification && e.target.value.trim()) {
                          setSystemNotification('')
                        }
                      }}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                        errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="Mô tả chi tiết về chi phí dự án..."
                    />
                    {errors.description && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-red-700 text-sm font-medium">
                              {errors.description}
                            </p>
                            <p className="text-red-600 text-xs mt-1">
                              Mô tả chi phí giúp quản lý và theo dõi ngân sách dự án hiệu quả hơn.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
        </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 focus:outline-none focus:ring-2 flex items-center space-x-2 ${
                getValidationStatus() 
                  ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
              title={getValidationStatus()?.details || ''}
            >
              <Save className="h-4 w-4" />
              <span>
                {getValidationStatus()?.message || 'Cập nhật'}
              </span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 focus:outline-none focus:ring-2 flex items-center space-x-2 ${
                getValidationStatus() 
                  ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500' 
                  : category === 'actual' 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
              title={getValidationStatus()?.details || ''}
              data-tour-id={category === 'planned' ? 'planned-expense-submit' : 'actual-expense-submit'}
            >
              <Save className="h-4 w-4" />
              <span>
                {submitting 
                  ? 'Đang lưu...' 
                  : getValidationStatus()?.message || (isEdit 
                    ? (category === 'actual' ? 'Cập nhật chi phí thực tế' : 'Cập nhật chi phí kế hoạch')
                    : (category === 'actual' ? 'Tạo chi phí thực tế' : 'Tạo chi phí kế hoạch'))
                }
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Cost Detail Modal */}
      {showCostDetailModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCostDetailModal(false)}></div>
            
            <div className="inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Chi tiết tổng chi phí
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getExpenseObjectDetail(selectedExpenseObjectId).expenseObject?.name || 'Đối tượng chi phí'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCostDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Total Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Tổng chi phí</span>
                    <span className="text-xl font-bold text-blue-700">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getExpenseObjectDetail(selectedExpenseObjectId).totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900">Chi tiết phân bổ</h4>
                  </div>
                  
                  {getExpenseObjectDetail(selectedExpenseObjectId).breakdown.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Không có chi phí được phân bổ cho đối tượng này
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạng mục</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ lệ %</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getExpenseObjectDetail(selectedExpenseObjectId).breakdown.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">{item.rowIndex}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.section}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.lineTotal)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                {item.percentage.toFixed(1)}%
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-blue-700 text-right">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={5} className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Tổng cộng</td>
                            <td className="px-4 py-2 text-right text-sm font-bold text-blue-700">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getExpenseObjectDetail(selectedExpenseObjectId).totalAmount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCostDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update/Create Confirmation Dialog */}

      {/* Expense Selector Modal */}
      {showExpenseSelector && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={() => setShowExpenseSelector(false)}></div>
            
            <div className="inline-block w-full max-w-4xl px-6 pt-6 pb-6 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-xl shadow-2xl sm:my-8 sm:align-middle">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Chọn chi phí thực tế để cập nhật</h3>
                    <p className="text-sm text-gray-600">Chọn một chi phí thực tế đã có để cập nhật thông tin</p>
                  </div>
                </div>
                    <button
                  onClick={() => setShowExpenseSelector(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                    </button>
                  </div>
                  
              <div className="mt-4">
                {existingExpenses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Không có chi phí thực tế nào cho dự án này</p>
                    </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã chi phí</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {existingExpenses.map((expense) => (
                          <tr key={expense.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{expense.expense_code || expense.id.substring(0, 8)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expense.amount || 0)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-600">
                              {new Date(expense.expense_date).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                                expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {expense.status === 'approved' ? 'Đã duyệt' :
                                 expense.status === 'rejected' ? 'Từ chối' :
                                 'Chờ duyệt'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                    <button
                                onClick={() => loadExpenseDataForUpdate(expense)}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                              >
                                Chọn
                    </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowExpenseSelector(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Visibility Dialog */}
      <ExpenseColumnVisibilityDialog
        isOpen={showColumnDialog}
        onClose={() => setShowColumnDialog(false)}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onReset={resetColumns}
      />

    </div>
  )
}



