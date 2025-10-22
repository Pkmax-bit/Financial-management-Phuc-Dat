'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Clock
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getExpenseObjectsByRole } from '@/utils/expenseObjectPermissions'
import { ExpenseObjectRoleFilter, useExpenseObjectRoleFilter, ExpenseObjectDisplayUtils } from '@/utils/expenseObjectRoleFilter'
import ExpenseObjectSelector from '@/components/ExpenseObjectSelector'
import ExpenseObjectMultiSelector from '@/components/ExpenseObjectMultiSelector'
import ExpenseRestoreButton from './ExpenseRestoreButton'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    amounts: true,
    additional: false
  })

  // State for cost detail modal
  const [showCostDetailModal, setShowCostDetailModal] = useState(false)
  const [selectedExpenseObjectId, setSelectedExpenseObjectId] = useState<string>('')
  
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
  
  // State for workshop employee confirmation dialog
  const [showUpdateCreateDialog, setShowUpdateCreateDialog] = useState(false)
  const [pendingExpenseData, setPendingExpenseData] = useState<any>(null)
  const [workshopParentObject, setWorkshopParentObject] = useState<SimpleExpenseObject | null>(null)
  
  // Use expense object role filter hook
  const { processExpenseObjects, canAccessExpenseObject } = useExpenseObjectRoleFilter()
  

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

  // Invoice-like table state (left side)
  interface InvoiceItemRow {
    section: string // Hạng mục
    index: number // STT
    productCode?: string // Mã sản phẩm
    productName: string // Tên sản phẩm
    unitPrice: number // Đơn giá
    quantity: number // Số lượng
    unit: string // Đơn vị
    // Derived
    lineTotal: number // Thành tiền
    // Component percentages per row
    componentsPct: Record<string, number> // key: expense_object_id, value: percent
    componentsAmt: Record<string, number> // key: expense_object_id, value: amount (VND)
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
  }
  const [expenseObjectsOptions, setExpenseObjectsOptions] = useState<SimpleExpenseObject[]>([])
  const [selectedExpenseObjectIds, setSelectedExpenseObjectIds] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemRow[]>([
    {
      section: 'Tủ bếp',
      index: 1,
      productCode: '',
      productName: 'Tủ bếp trên',
      unitPrice: 0,
      quantity: 0,
      unit: 'cái',
      lineTotal: 0,
      componentsPct: {},
      componentsAmt: {}
    }
  ])
  const [projectRevenueTotal, setProjectRevenueTotal] = useState<number>(0)
  const isEdit = mode === 'edit'

  const updateRow = (rowIndex: number, updater: (row: InvoiceItemRow) => InvoiceItemRow) => {
    setInvoiceItems(prev => {
      const next = [...prev]
      const updated = updater(next[rowIndex])
      // Recompute line total
      updated.lineTotal = (Number(updated.unitPrice) || 0) * (Number(updated.quantity) || 0)
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
        unitPrice: 0,
        quantity: 0,
        unit: 'cái',
        lineTotal: 0,
        componentsPct: {},
        componentsAmt: {}
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
    selectedExpenseObjectIds.forEach(id => { totals[id] = 0 })
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

  // Ensure each row has keys for all selected expense objects
  useEffect(() => {
    setInvoiceItems(prev => prev.map(row => {
      const nextPct: Record<string, number> = { ...row.componentsPct }
      const nextAmt: Record<string, number> = { ...row.componentsAmt }
      selectedExpenseObjectIds.forEach(id => {
        if (nextPct[id] === undefined) nextPct[id] = 0
        if (nextAmt[id] === undefined) nextAmt[id] = 0
      })
      // Clean removed ids
      Object.keys(nextPct).forEach(id => {
        if (!selectedExpenseObjectIds.includes(id)) delete nextPct[id]
      })
      Object.keys(nextAmt).forEach(id => {
        if (!selectedExpenseObjectIds.includes(id)) delete nextAmt[id]
      })
      return { ...row, componentsPct: nextPct, componentsAmt: nextAmt }
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
        role: o.role
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
      
      // Step 6: Auto-select objects
      if (result.selectedIds.length > 0) {
        setSelectedExpenseObjectIds(result.selectedIds)
        console.log('🎯 Auto-selected objects:', result.selectedIds)
      }
      
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
      // Load revenue (invoices) to compute profit
      try {
        const { data: invForRevenue } = await supabase
          .from('invoices')
          .select('id, total_amount, items')
          .eq('project_id', projectId)
        if (Array.isArray(invForRevenue)) {
          const sumRevenue = invForRevenue.reduce((s: number, inv: any) => {
            const totalAmt = Number(inv.total_amount)
            if (!isNaN(totalAmt) && totalAmt > 0) return s + totalAmt
            // fallback: sum items if total_amount missing
            const items = Array.isArray(inv.items) ? inv.items : []
            const itemsSum = items.reduce((ss: number, it: any) => {
              const unitPrice = Number(it.unit_price ?? it.price ?? it.unitPrice) || 0
              const qty = Number(it.quantity ?? it.qty) || 0
              const lineTotal = Number(it.line_total ?? it.total ?? it.lineTotal) || (unitPrice * qty)
              return ss + (lineTotal || 0)
            }, 0)
            return s + itemsSum
          }, 0)
          setProjectRevenueTotal(sumRevenue)
        } else {
          setProjectRevenueTotal(0)
        }
      } catch (_re) {
        setProjectRevenueTotal(0)
      }
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
            const lineTotal = Number(li.line_total) || (unitPrice * quantity)
            rows.push({
              section: sectionName,
              index: rows.length + 1,
              productCode: '',
              productName: li.product_name || li.description || '',
              unitPrice,
              quantity,
              unit: li.unit || 'cái',
              lineTotal,
              componentsPct: {},
              componentsAmt: {}
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
            const lineTotal = Number(it.line_total ?? it.total ?? it.lineTotal) || (unitPrice * quantity)
            rows.push({
              section: '',
              index: rows.length + 1,
              productCode: it.product_code || it.code || '',
              productName: it.product_name || it.name || it.description || '',
              unitPrice,
              quantity,
              unit: it.unit || 'cái',
              lineTotal,
              componentsPct: {},
              componentsAmt: {}
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
            const lineTotal = Number(it.total_price ?? it.subtotal ?? it.total) || (unitPrice * quantity)
            rows.push({
              section: '',
              index: rows.length + 1,
              productCode: it.product_code || it.code || '',
              productName: it.name_product || it.description || '',
              unitPrice,
              quantity,
              unit: it.unit || 'cái',
              lineTotal,
              componentsPct: {},
              componentsAmt: {}
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

  // Load expense objects when userRole, category, or isOpen changes - CONSOLIDATED
  useEffect(() => {
    if (userRole && isOpen && category) {
      console.log(`🔄 Loading expense objects for role: ${userRole}, category: ${category}`)
      // Clear current selection to trigger auto-selection with new category
      setSelectedExpenseObjectIds([])
      // Load expense objects
      loadExpenseObjectsOptions()
    }
  }, [userRole, category, isOpen])

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

  // Auto-select children objects for Supplier when creating actual expense
  useEffect(() => {
    if (userRole === 'Supplier' && category === 'actual' && expenseObjectsOptions.length > 0 && !isEdit) {
      // Tìm workshop parent object
      const workshopParent = expenseObjectsOptions.find(o => 
        o.is_parent && (o.name.includes('Xưởng') || o.name.includes('xuong') || o.name.includes('sản xuất'))
      )
      
      if (workshopParent) {
        setWorkshopParentObject(workshopParent)
        // Auto-select tất cả children objects (không chọn parent)
        const childrenIds = expenseObjectsOptions.filter(o => o.parent_id === workshopParent.id).map(o => o.id)
        if (childrenIds.length > 0) {
          setSelectedExpenseObjectIds(childrenIds)
          console.log(`✅ Auto-selected ${childrenIds.length} children objects for Supplier:`, childrenIds)
        }
      }
    }
  }, [userRole, category, expenseObjectsOptions, isEdit])

  // Auto-select children objects for all roles when expense objects are loaded and no selection exists
  useEffect(() => {
    if (expenseObjectsOptions.length > 0 && selectedExpenseObjectIds.length === 0 && userRole && category === 'actual' && !isEdit) {
      console.log(`🔄 Auto-selecting children objects for ${userRole} after expense objects loaded`)
      
      // Tự động chọn tất cả đối tượng con cho actual expenses
      const childrenObjects = expenseObjectsOptions.filter(o => o.parent_id)
      if (childrenObjects.length > 0) {
        const childrenIds = childrenObjects.map(o => o.id)
        setSelectedExpenseObjectIds(childrenIds)
        console.log('🎯 Auto-selected all children objects:', childrenIds)
      }
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
          const rows: InvoiceItemRow[] = data.invoice_items.map((it: any, idx: number) => {
            const componentsPct = it.components_pct || {}
            const componentsAmt: Record<string, number> = {}
            
            // Calculate componentsAmt from componentsPct and lineTotal
            Object.keys(componentsPct).forEach(id => {
              const pct = Number(componentsPct[id]) || 0
              const lineTotal = Number(it.line_total) || 0
              componentsAmt[id] = Math.round((lineTotal * pct) / 100)
            })
            
            return {
              section: '',
              index: idx + 1,
              productCode: '',
              productName: it.product_name || it.description || '',
              unitPrice: Number(it.unit_price) || 0,
              quantity: Number(it.quantity) || 0,
              unit: it.unit || 'cái',
              lineTotal: Number(it.line_total) || 0,
              componentsPct,
              componentsAmt
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
      newErrors.description = 'Vui lòng nhập mô tả chi phí'
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
    if (!validateForm()) {
      return
    }

    // Kiểm tra nếu có parent object và children được chọn
    console.log('🔍 Debug dialog trigger:', { 
      workshopParentObject: workshopParentObject?.name, 
      selectedExpenseObjectIds: selectedExpenseObjectIds.length,
      category,
      userRole
    })
    
    if (workshopParentObject && selectedExpenseObjectIds.length > 0 && category === 'actual') {
      console.log('✅ Creating new expense directly')
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
        grandAllocationTotal
      }
      
      console.log('📊 Setting pending expense data:', expenseData)
      setPendingExpenseData(expenseData)
      
      // Wait for state to be updated or pass data directly
      await createNewExpense(expenseData)
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
      invoice_items: getInvoiceItems()
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
      const result = await apiPost('http://localhost:8000/api/project-expenses/quotes', expenseData)
      console.log('✅ Planned expense created:', result)
    }
    
    // Update parent if exists
    if (expenseData.id_parent) {
      console.log('🔄 Updating parent expense amount...')
      await updateParentExpenseAmount(expenseData.id_parent, 'project_expenses_quote')
    }
    
    // Reset form
    setDirectObjectTotals({})
    
    // Removed success notification
    onSuccess()
    onClose()
    resetForm()
  }
  
  // ========================================
  // FUNCTION TẠO CHI PHÍ THỰC TẾ (ACTUAL)
  // ========================================
  const createActualExpense = async () => {
    console.log('💰 ===== CREATING ACTUAL EXPENSE =====')
    
    const createdExpenses = []
    
    for (const expenseObjectId of selectedExpenseObjectIds) {
      console.log('🔄 Processing expense object:', expenseObjectId)
      
      const amount = Object.values(directObjectTotals).some(val => val > 0)
        ? (directObjectTotals[expenseObjectId] || 0)
        : (expenseObjectTotals[expenseObjectId] || 0)
      
      console.log('📊 Amount for object:', amount)
      
      if (amount <= 0) {
        console.log('⚠️ Skipping expense object with zero amount:', expenseObjectId)
        continue
      }
      
      const expenseData: any = {
        id: crypto.randomUUID(),
        project_id: formData.project_id,
        description: formData.description,
        expense_object_id: expenseObjectId,
        role: selectedRole,
        amount: amount,
        currency: formData.currency,
        expense_date: formData.expense_date,
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expense_object_columns: selectedExpenseObjectIds,
        expense_object_totals: Object.values(directObjectTotals).some(val => val > 0) ? directObjectTotals : undefined,
        invoice_items: getInvoiceItems()
      }
      
      // Add optional fields
      if (formData.employee_id) expenseData.employee_id = formData.employee_id
      if (formData.notes) expenseData.notes = formData.notes
      if (formData.receipt_url) expenseData.receipt_url = formData.receipt_url
      if (formData.id_parent) expenseData.id_parent = formData.id_parent
      
      console.log('📤 Expense data for object:', expenseData)
      
      if (isEdit && editId) {
        console.log('📤 Updating actual expense:', editId)
        const updateData = { ...expenseData }
        delete (updateData as any).id
        delete (updateData as any).created_at
        const { error } = await supabase
          .from('project_expenses')
          .update(updateData)
          .eq('id', editId)
        if (error) {
          console.error('❌ Error updating actual expense:', error)
          throw error
        }
        console.log('✅ Actual expense updated successfully')
      } else {
        console.log('📤 Creating actual expense for object:', expenseObjectId, 'amount:', amount)
        const { data, error } = await supabase
          .from('project_expenses')
          .insert(expenseData)
          .select()
        if (error) {
          console.error('❌ Error creating actual expense:', error)
          throw error
        }
        console.log('✅ Actual expense created:', data)
        createdExpenses.push(data[0])
      }
    }
    
    console.log('📊 Total created expenses:', createdExpenses.length)
    
    // Update parent if exists
    if (createdExpenses.length > 0 && createdExpenses[0].id_parent) {
      console.log('🔄 Updating parent expense amount...')
      await updateParentExpenseAmount(createdExpenses[0].id_parent, 'project_expenses')
    }
    
    // Reset form
    setDirectObjectTotals({})
    
    // Removed success notification
    onSuccess()
    onClose()
    resetForm()
  }
  
  // ========================================
  // HELPER FUNCTION: LẤY INVOICE ITEMS
  // ========================================
  const getInvoiceItems = () => {
    const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
    const hasProductDetails = invoiceItems.some(row => 
      row.productName.trim() !== '' || row.unitPrice > 0 || row.quantity > 0
    )
    
    if (hasDirectObjectInputs && !hasProductDetails) {
      return []
    }
    
    return invoiceItems.map(r => ({
      product_name: r.productName,
      unit_price: r.unitPrice,
      quantity: r.quantity,
      unit: r.unit,
      line_total: r.lineTotal,
      components_pct: r.componentsPct
    }))
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
            status: 'approved',
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
      
      let totalAmount = (Object.values(dataToUse.directObjectTotals || {}) as number[]).reduce((sum: number, val: number) => sum + (val || 0), 0)
      console.log('💰 Total amount calculated from directObjectTotals:', totalAmount)
      
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
        status: 'approved',
        employee_id: dataToUse.formData.employee_id || null,
        id_parent: null, // This is a parent expense, so no parent
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expense_object_columns: Object.keys(dataToUse.directObjectTotals || {}),
        invoice_items: dataToUse.invoiceItems || []
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
          status: 'approved',
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
      
      // Removed success notification
      
      console.log('🔄 Calling onSuccess callback...')
      onSuccess()
      onClose()
      resetForm()
      console.log('✅ Create new expense completed successfully')
      
    } catch (error) {
      console.error('❌ Error creating new expense:', error)
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
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${category === 'actual' ? 'bg-green-100' : 'bg-blue-100'}`}>
              <DollarSign className={`h-6 w-6 ${category === 'actual' ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {category === 'actual' ? 'Tạo chi phí thực tế' : 'Tạo chi phí kế hoạch'}
              </h2>
              <p className="text-sm text-black mt-1">
                {category === 'actual' 
                  ? 'Tạo chi phí thực tế đã phát sinh cho dự án'
                  : 'Tạo chi phí dự kiến cho dự án'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6 text-gray-900 flex flex-col">
          <div className="space-y-6 flex-none">
            {/* Basic Information Section */}
            <div className="bg-white border border-gray-200 rounded-lg">
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
                    <div>
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
                            setFormData({ ...formData, project_id: value })
                            if (value) {
                              await loadInvoiceItemsForProject(value)
                            } else {
                              setInvoiceItems([])
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

                    <div>
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Chi phí cha (tuỳ chọn)
                    </label>
                    <select
                      value={formData.id_parent}
                      onChange={(e) => setFormData({ ...formData, id_parent: e.target.value })}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 text-gray-900 ${
                        category === 'actual' ? 'focus:ring-green-500 border-gray-300' : 'focus:ring-blue-500 border-gray-300'
                      }`}
                    >
                      <option value="">Không chọn</option>
                      {(category === 'planned' ? parentQuotes : parentExpenses).map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {(parent.expense_code ? parent.expense_code + ' - ' : '') + parent.description} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parent.amount || 0)})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {category === 'planned' 
                        ? 'Chọn chi phí kế hoạch làm cha (từ project_expenses_quote)'
                        : 'Chọn chi phí thực tế làm cha (từ project_expenses)'}
                    </p>
                    
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
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

                    <div>
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

                  {/* Role field - hiển thị lại để user có thể thấy role của mình */}
                  <div className="space-y-2">
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Đối tượng chi phí (có thể chọn nhiều)
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <ExpenseObjectMultiSelector
                        values={selectedExpenseObjectIds}
                        onChange={setSelectedExpenseObjectIds}
                        placeholder="Chọn nhiều đối tượng chi phí để phân bổ"
                        expenseObjects={expenseObjectsOptions}
                      />
                      {/* Removed primary object optional selection per request */}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                        errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="Mô tả chi tiết về chi phí dự án..."
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

                </div>

          {/* Split area: Left invoice details, Right amount/additional sections */}
          <div className="flex-1 overflow-hidden mt-6">
            <div className="grid grid-cols-1 gap-6 h-full">
              {/* Invoice-like details full width */}
              <div className="h-full overflow-auto bg-white border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Chi tiết hóa đơn</h3>
                    <div className="text-sm text-gray-600">100% Đối tượng chi phí</div>
                  </div>
                  
                  
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-gray-900">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th rowSpan={2} className="px-3 py-2 text-left font-semibold w-16">STT</th>
                        <th rowSpan={2} className="px-3 py-2 text-left font-semibold w-64">Tên sản phẩm</th>
                        <th rowSpan={2} className="px-3 py-2 text-right font-semibold w-24">Đơn giá</th>
                        <th rowSpan={2} className="px-3 py-2 text-right font-semibold w-12">Số lượng</th>
                        <th rowSpan={2} className="px-3 py-2 text-left font-semibold w-16">Đơn vị</th>
                        <th rowSpan={2} className="px-3 py-2 text-right font-semibold w-28">Thành tiền</th>
                        {selectedExpenseObjectIds.length > 0 && selectedExpenseObjectIds.map((id) => (
                          <th key={`${id}-group`} colSpan={2} className="px-3 py-2 text-center font-semibold w-32">
                            {(expenseObjectsOptions.find(o => o.id === id)?.name) || 'Đối tượng'}
                          </th>
                        ))}
                        {selectedExpenseObjectIds.length > 0 && (
                        <th rowSpan={2} className="px-3 py-2 text-right font-semibold w-28">Tổng phân bổ</th>
                        )}
                        <th rowSpan={2} className="px-3 py-2 text-right font-semibold w-16"></th>
                      </tr>
                      <tr>
                        {selectedExpenseObjectIds.length > 0 && selectedExpenseObjectIds.map((id) => (
                          <React.Fragment key={`${id}-header`}>
                            <th className="px-3 py-2 text-right font-semibold w-16">%</th>
                            <th className="px-3 py-2 text-right font-semibold w-20">VND</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((row, i) => (
                        <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                          <td className="px-3 py-2">
                            {row.index}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                              value={row.productName}
                              onChange={(e) => updateRow(i, r => ({ ...r, productName: e.target.value }))}
                              disabled
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="text"
                              className="w-full border-2 border-gray-400 rounded px-2 py-1 text-sm text-right text-black font-medium bg-gray-100 cursor-not-allowed"
                              value={formattedUnitPrices[i] || formatNumber(row.unitPrice)}
                              onChange={(e) => handleUnitPriceChange(i, e.target.value)}
                              placeholder="0"
                              disabled
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              className="w-full border-2 border-gray-400 rounded px-2 py-1 text-sm text-right text-black font-medium bg-gray-100 cursor-not-allowed"
                              value={row.quantity}
                              onChange={(e) => updateRow(i, r => ({ ...r, quantity: parseFloat(e.target.value) || 0 }))}
                              step="1"
                              min="0"
                              disabled
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-full border-2 border-gray-400 rounded px-2 py-1 text-sm text-black font-medium bg-gray-100 cursor-not-allowed"
                              value={row.unit}
                              onChange={(e) => updateRow(i, r => ({ ...r, unit: e.target.value }))}
                              disabled
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            {new Intl.NumberFormat('vi-VN').format(row.lineTotal)}
                          </td>
                          {selectedExpenseObjectIds.length > 0 && selectedExpenseObjectIds.map((id) => (
                            <React.Fragment key={`${id}-row-${i}`}>
                              <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                className="w-full border-2 border-gray-400 rounded px-1 py-1 text-xs text-right text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="text"
                                className="w-full border-2 border-gray-400 rounded px-1 py-1 text-xs text-right text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  value={formattedObjectAmounts[id]?.[i] || formatNumber(row.componentsAmt[id] ?? 0)}
                                  onChange={(e) => handleObjectAmountChange(id, i, e.target.value)}
                                  placeholder="0"
                                />
                              </td>
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
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td className="px-3 py-2 text-left font-semibold" colSpan={6 + (selectedExpenseObjectIds.length * 2)}>Doanh thu</td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(projectRevenueTotal)}
                        </td>
                        <td className="px-3 py-2"></td>
                      </tr>
                      {selectedExpenseObjectIds.length > 0 && (
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 text-left font-semibold" colSpan={6 + (selectedExpenseObjectIds.length * 2)}>Tổng chi phí</td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal)}
                        </td>
                        <td className="px-3 py-2"></td>
                      </tr>
                      )}
                      {selectedExpenseObjectIds.length > 0 && (
                      <tr className="bg-gray-100">
                        <td className="px-3 py-2 text-left font-bold" colSpan={6 + (selectedExpenseObjectIds.length * 2)}>Lợi nhuận</td>
                        <td className="px-3 py-2 text-right font-bold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(profitComputed)}
                        </td>
                        <td className="px-3 py-2"></td>
                      </tr>
                      )}
                    </tfoot>
                  </table>
                  </div>
                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                  <button onClick={addRow} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Thêm dòng</button>
                  <div className="text-sm text-gray-700">
                    Tổng thành tiền: <span className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plannedAmountComputed)}</span>
                </div>
                </div>
            </div>

              {/* Right panel removed for full-width invoice table */}
                  </div>
                </div>
            </div>

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
                    <div className="text-sm text-gray-700">Đối tượng cha = Tổng các đối tượng con</div>
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
                      <div className="text-sm text-gray-600">Tổng chi phí</div>
                    </div>
                  </div>
                  
                  {/* Breakdown chi tiết các đối tượng con */}
                  {selectedExpenseObjectIds.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="text-sm text-black font-medium mb-2">📋 Chi tiết các đối tượng chi phí con:</div>
                      <div className="space-y-2">
                        {selectedExpenseObjectIds.map((id) => {
                          const expenseObject = ExpenseObjectDisplayUtils.getById(expenseObjectsOptions, id)
                          const totalAmount = directObjectTotals[id] || expenseObjectTotals[id] || 0
                          const parentTotal = (() => {
                            const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
                            return hasDirectObjectInputs 
                              ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                              : grandAllocationTotal
                          })()
                          const percentage = parentTotal > 0 ? (totalAmount / parentTotal * 100) : 0
                          
                          return (
                            <div key={id} className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                                <span className="text-black font-medium">{expenseObject?.name || 'Đối tượng'}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-gray-600 text-xs">Tỷ lệ</div>
                                  <div className="font-medium text-black">{percentage.toFixed(1)}%</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-gray-600 text-xs">Số tiền</div>
                                  <div className="font-bold text-black">
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
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
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
                    // Use direct input value if available, otherwise use calculated total
                    const totalAmount = directObjectTotals[id] || expenseObjectTotals[id] || 0
                    
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
                    <div className="border-t-2 border-gray-400 pt-3 mt-3 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                          <span className="text-black font-bold text-base">{workshopParentObject.name} (Tổng)</span>
                          <span className="text-xs text-gray-700 bg-gray-200 px-2 py-1 rounded-full">
                            Cha = Tổng các con
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-black font-medium">100.0%</span>
                          <span className="font-bold text-black text-lg">
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
                      <div className="text-xs text-gray-600 mt-1 italic">
                        Tổng chi phí đối tượng cha = Tổng các chi phí đối tượng con
                      </div>
                    </div>
                  )}
                  
                  {/* Total Summary */}
                  <div className="border-t border-gray-300 pt-1 mt-2">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                        <span className="text-black">Tổng cộng</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-black font-bold">100.0%</span>
                        <span className="font-bold text-black">
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
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                            <span className="text-black font-medium">📊 Tổng đối tượng cha = Tổng đối tượng con</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-600 text-xs">Cha = Con</span>
                            <span className="font-semibold text-black">
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
                        <div className="mt-1 text-xs text-gray-600">
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
                      URL hóa đơn/chứng từ
                    </label>
                    <input
                      type="url"
                      value={formData.receipt_url}
                      onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="https://example.com/receipt.pdf"
                    />
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent rounded-md disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Cập nhật</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 focus:outline-none focus:ring-2 flex items-center space-x-2 ${
                category === 'actual' 
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>
                {submitting 
                  ? 'Đang lưu...' 
                  : (category === 'actual' ? 'Tạo chi phí thực tế' : 'Tạo chi phí kế hoạch')
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

    </div>
  )
}



