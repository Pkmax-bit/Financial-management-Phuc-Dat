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
  }
  const [expenseObjectsOptions, setExpenseObjectsOptions] = useState<SimpleExpenseObject[]>([])
  const [selectedExpenseObjectIds, setSelectedExpenseObjectIds] = useState<string[]>([])

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

  // Load expense objects to choose columns
  const loadExpenseObjectsOptions = async () => {
    if (!userRole) {
      console.log('⏳ Waiting for user role to load expense objects...')
      return
    }
    
    try {
      let data
      try {
        console.log('🔍 Trying authenticated endpoint for expense objects options...')
        data = await apiGet(`${API_BASE_URL}/api/expense-objects/?active_only=true`)
        console.log('✅ Authenticated endpoint succeeded for options')
      } catch (err) {
        console.log('⚠️ Authenticated endpoint failed for options, trying public endpoint:', err)
        // fallback public
        data = await apiGet(`${API_BASE_URL}/api/expense-objects/public?active_only=true`)
        console.log('✅ Public endpoint succeeded for options')
      }
      // Map and sort options by preferred order
      const normalizeLower = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
      const preferredOrder = [
        'quan ly',       // quản lý
        'thiet ke',      // thiết kế
        'san xuat',      // sản xuất
        'van chuyen',    // vận chuyển
        'lap dat',       // lắp đặt
        'nha dau tu'     // nhà đầu tư
      ]
      let opts: SimpleExpenseObject[] = Array.isArray(data) ? data.map((o: any) => ({ 
        id: o.id, 
        name: o.name, 
        description: o.description,
        is_active: o.is_active ?? true,
        parent_id: o.parent_id // Added parent_id
      })) : []

      // Role-based filtering of expense objects
      const normalize = (s: string) => (s || '').toLowerCase()
      
      // For planned expenses, only show parent objects (no children)
      if (category === 'planned') {
        opts = opts.filter(o => !o.parent_id) // Only show parent objects
        console.log('📋 Planned expenses - showing only parent objects:', opts.map(o => o.name))
      }
      
      if (userRole === 'workshop_employee') {
        // Workshop employees see only workshop-related objects (materials and workshop labor)
        opts = opts.filter(o => {
          const n = normalize(o.name)
          return n.includes('xưởng') || n.includes('xuong') || 
                 n.includes('nguyên vật liệu') || n.includes('nguyen vat lieu') ||
                 n.includes('vật liệu') || n.includes('vat lieu') ||
                 n.includes('thép') || n.includes('thep') ||
                 n.includes('xi măng') || n.includes('xi mang') ||
                 n.includes('vít') || n.includes('vit') ||
                 n.includes('ốc') || n.includes('oc') ||
                 n.includes('keo') || n.includes('dán') || n.includes('dan') ||
                 n.includes('nhân công xưởng') || n.includes('nhan cong xuong')
        })
        console.log('🔧 Workshop employee filtered objects:', opts.map(o => o.name))
      } else if (userRole === 'worker') {
        // Workers see only general labor-related objects (excluding workshop labor)
        opts = opts.filter(o => {
          const n = normalize(o.name)
          return (n.includes('nhân công') || n.includes('nhan cong')) && 
                 !(n.includes('xưởng') || n.includes('xuong') || n.includes('nhà cung cấp') || n.includes('nha cung cap'))
        })
        console.log('👷 Worker filtered objects:', opts.map(o => o.name))
      } else {
        // Admin/accountant/sales see all objects
        console.log('👑 Admin/accountant/sales see all objects:', opts.map(o => o.name))
      }
      const sortedOpts = [...opts].sort((a, b) => {
        const na = normalizeLower(a.name)
        const nb = normalizeLower(b.name)
        const ia = preferredOrder.indexOf(na)
        const ib = preferredOrder.indexOf(nb)
        const ra = ia === -1 ? Number.MAX_SAFE_INTEGER : ia
        const rb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
        if (ra !== rb) return ra - rb
        return a.name.localeCompare(b.name, 'vi')
      })
      setExpenseObjectsOptions(sortedOpts)
      // Note: Auto-selection is handled by separate useEffect based on role
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
      // Load user role first
      ;(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user?.id) {
            const { data, error } = await supabase.from('users').select('role').eq('id', session.user.id).single()
            if (!error && data?.role) {
              setUserRole(data.role)
              // Load expense objects after role is set
              loadExpenseObjectsOptions()
            }
          }
        } catch (err) {
          console.error('Error loading user role:', err)
        }
      })()
    }
  }, [isOpen])

  // Load expense objects when userRole changes
  useEffect(() => {
    if (userRole && isOpen) {
      loadExpenseObjectsOptions()
    }
  }, [userRole, isOpen])

  // Auto-select expense objects based on role when options are loaded (for create mode)
  useEffect(() => {
    if (expenseObjectsOptions.length > 0 && !isEdit && selectedExpenseObjectIds.length === 0 && userRole) {
      // Auto-select all filtered objects (they are already filtered by role)
      const roleBasedIds = expenseObjectsOptions.map(o => o.id)
      setSelectedExpenseObjectIds(roleBasedIds)
      console.log(`✅ Auto-selected ${roleBasedIds.length} expense objects for ${userRole}:`, expenseObjectsOptions.map(o => o.name))
    }
  }, [expenseObjectsOptions, isEdit, selectedExpenseObjectIds.length, userRole])

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

    setSubmitting(true)
    
    try {
      // Choose primary expense object id: prefer selector, else first selected column
      const primaryExpenseObjectId = formData.expense_object_id || selectedExpenseObjectIds[0] || null

      if (category === 'planned') {
        // Create planned expense (quote)
          const expenseData = {
          project_id: formData.project_id,
          employee_id: formData.employee_id || null,
          description: formData.description,
          expense_object_id: primaryExpenseObjectId,
            amount: (() => {
              const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
              return hasDirectObjectInputs 
                ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                : (Number(grandAllocationTotal) || 0)
            })(),
          currency: formData.currency,
          expense_date: formData.expense_date,
          status: 'pending',
          notes: formData.notes || null,
          receipt_url: formData.receipt_url || null,
          id_parent: formData.id_parent || null,
          // Persist selected expense object columns & per-row percentages
          expense_object_columns: selectedExpenseObjectIds,
          // Save object totals if only object totals are provided
          expense_object_totals: (() => {
            const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
            const hasProductDetails = invoiceItems.some(row => 
              row.productName.trim() !== '' || row.unitPrice > 0 || row.quantity > 0
            )
            
            // If only object totals are provided, save them
            if (hasDirectObjectInputs && !hasProductDetails) {
              return directObjectTotals
            }
            
            return undefined
          })(),
          // Only save invoice items if there are actual product details, not just object totals
          invoice_items: (() => {
            const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
            const hasProductDetails = invoiceItems.some(row => 
              row.productName.trim() !== '' || row.unitPrice > 0 || row.quantity > 0
            )
            
            // If only object totals are provided, don't save invoice items
            if (hasDirectObjectInputs && !hasProductDetails) {
              return []
            }
            
            // Otherwise, save invoice items as usual
            return invoiceItems.map(r => ({
              product_name: r.productName,
              unit_price: r.unitPrice,
              quantity: r.quantity,
              unit: r.unit,
              line_total: r.lineTotal,
              components_pct: r.componentsPct
            }))
          })()
        }

        if (isEdit && editId) {
          console.log('📤 Updating project expense quote (planned):', editId, expenseData)
          const { error } = await supabase
            .from('project_expenses_quote')
            .update(expenseData)
            .eq('id', editId)
          if (error) throw error
        } else {
          console.log('📤 Submitting project expense quote (planned):', expenseData)
          const result = await apiPost('http://localhost:8000/api/project-expenses/quotes', expenseData)
          console.log('✅ Project expense quote created successfully:', result)
        }
        
        // Reset direct object totals after successful creation
        setDirectObjectTotals({})
        
        // After create, if has parent, update parent quote amount = sum(children)
        if (expenseData.id_parent) {
          try {
            const parentId = expenseData.id_parent as string
            const { data: children } = await supabase
              .from('project_expenses_quote')
              .select('amount')
              .eq('id_parent', parentId)
            const total = (children || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0)
            await supabase
              .from('project_expenses_quote')
              .update({ amount: total, updated_at: new Date().toISOString() })
              .eq('id', parentId)
          } catch (e) {
            console.error('❌ Error updating parent quote amount:', e)
          }
        }
      } else {
        // Create actual expense directly
          const expenseData: any = {
          id: crypto.randomUUID(),
          project_id: formData.project_id,
          description: formData.description,
          expense_object_id: primaryExpenseObjectId,
            amount: (() => {
              const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
              return hasDirectObjectInputs 
                ? Object.values(directObjectTotals).reduce((sum, val) => sum + val, 0)
                : (Number(grandAllocationTotal) || 0)
            })(),
          currency: formData.currency,
          expense_date: formData.expense_date,
          status: 'approved', // Actual expenses are automatically approved
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expense_object_columns: selectedExpenseObjectIds,
          // Save object totals if only object totals are provided
          expense_object_totals: (() => {
            const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
            const hasProductDetails = invoiceItems.some(row => 
              row.productName.trim() !== '' || row.unitPrice > 0 || row.quantity > 0
            )
            
            // If only object totals are provided, save them
            if (hasDirectObjectInputs && !hasProductDetails) {
              return directObjectTotals
            }
            
            return undefined
          })(),
          // Only save invoice items if there are actual product details, not just object totals
          invoice_items: (() => {
            const hasDirectObjectInputs = Object.values(directObjectTotals).some(val => val > 0)
            const hasProductDetails = invoiceItems.some(row => 
              row.productName.trim() !== '' || row.unitPrice > 0 || row.quantity > 0
            )
            
            // If only object totals are provided, don't save invoice items
            if (hasDirectObjectInputs && !hasProductDetails) {
              return []
            }
            
            // Otherwise, save invoice items as usual
            return invoiceItems.map(r => ({
              product_name: r.productName,
              unit_price: r.unitPrice,
              quantity: r.quantity,
              unit: r.unit,
              line_total: r.lineTotal,
              components_pct: r.componentsPct
            }))
          })()
        }
        
        // Add optional fields
        if (formData.employee_id) expenseData.employee_id = formData.employee_id
        if (formData.notes) expenseData.notes = formData.notes
        if (formData.receipt_url) expenseData.receipt_url = formData.receipt_url
        if (formData.id_parent) expenseData.id_parent = formData.id_parent
        
        if (isEdit && editId) {
          // Do not override id/created_at when updating
          const updateData = { ...expenseData }
          delete (updateData as any).id
          delete (updateData as any).created_at
          console.log('📤 Updating project expense (actual):', editId, updateData)
          const { error } = await supabase
            .from('project_expenses')
            .update(updateData)
            .eq('id', editId)
          if (error) throw error
        } else {
          console.log('📤 Submitting project expense (actual):', expenseData)
          const { data, error } = await supabase
            .from('project_expenses')
            .insert(expenseData)
            .select()
          if (error) throw error
          console.log('✅ Project expense (actual) created successfully:', data)
        }
        
        // Reset direct object totals after successful creation
        setDirectObjectTotals({})
        
        // After create, if has parent, update parent expense amount = sum(children)
        if (expenseData.id_parent) {
          try {
            const parentId = expenseData.id_parent as string
            const { data: children } = await supabase
              .from('project_expenses')
              .select('amount')
              .eq('id_parent', parentId)
            const total = (children || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0)
            await supabase
              .from('project_expenses')
              .update({ amount: total, updated_at: new Date().toISOString() })
              .eq('id', parentId)
          } catch (e) {
            console.error('❌ Error updating parent expense amount:', e)
          }
        }
      }
        
      alert(isEdit
        ? (category === 'planned' ? 'Cập nhật chi phí kế hoạch thành công!' : 'Cập nhật chi phí thực tế thành công!')
        : (category === 'planned' ? 'Tạo chi phí kế hoạch thành công!' : 'Tạo chi phí thực tế thành công!')
      )
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('❌ Error creating project expense:', error)
      alert('Có lỗi xảy ra khi tạo chi phí: ' + (error as Error).message)
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="">Chọn nhân viên (tùy chọn)</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </option>
                        ))}
                      </select>
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
                        {selectedExpenseObjectIds.map((id) => (
                          <th key={`${id}-group`} colSpan={2} className="px-3 py-2 text-center font-semibold w-32">
                            {(expenseObjectsOptions.find(o => o.id === id)?.name) || 'Đối tượng'}
                          </th>
                        ))}
                        <th rowSpan={2} className="px-3 py-2 text-right font-semibold w-28">Tổng phân bổ</th>
                        <th rowSpan={2} className="px-3 py-2 text-right font-semibold w-16"></th>
                      </tr>
                      <tr>
                        {selectedExpenseObjectIds.map((id) => (
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
                          {selectedExpenseObjectIds.map((id) => (
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
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 text-left font-semibold" colSpan={6 + (selectedExpenseObjectIds.length * 2)}>Tổng chi phí</td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandAllocationTotal)}
                        </td>
                        <td className="px-3 py-2"></td>
                      </tr>
                      <tr className="bg-gray-100">
                        <td className="px-3 py-2 text-left font-bold" colSpan={6 + (selectedExpenseObjectIds.length * 2)}>Lợi nhuận</td>
                        <td className="px-3 py-2 text-right font-bold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(profitComputed)}
                        </td>
                        <td className="px-3 py-2"></td>
                      </tr>
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
            {selectedExpenseObjectIds.length > 0 && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Tổng chi phí theo đối tượng</span>
                </div>

                {/* Direct Input Section */}
                <div className="mb-4 space-y-3">
                  {/* Toggle Buttons */}
                  <div className="flex space-x-2 mb-3">
                    <button
                      onClick={() => setShowObjectTotalInputs(!showObjectTotalInputs)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        showObjectTotalInputs
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {showObjectTotalInputs ? 'Ẩn' : 'Hiện'} Tổng chi phí đối tượng
                    </button>
                  </div>


                  {/* Direct Object Totals Input */}
                  {showObjectTotalInputs && (
                    <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-black font-semibold text-sm">Tổng chi phí từng đối tượng:</span>
                      {selectedExpenseObjectIds.map((id) => {
                        const expenseObject = expenseObjectsOptions.find(obj => obj.id === id)
                        return (
                          <div key={id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-800 text-sm">{expenseObject?.name || 'Đối tượng'}:</span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={directObjectTotals[id] || 0}
                                onChange={(e) => handleDirectObjectTotalChange(id, parseFloat(e.target.value) || 0)}
                                className="w-32 border-2 border-gray-400 rounded px-2 py-1 text-sm text-right text-black font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    const expenseObject = expenseObjectsOptions.find(obj => obj.id === id)
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
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-black font-medium">{expenseObject?.name || 'Đối tượng'}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-800 font-medium">{percentage.toFixed(1)}%</span>
                          <span className="font-semibold text-blue-800">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Total Summary */}
                  <div className="border-t border-gray-300 pt-1 mt-2">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-black">Tổng cộng</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-black font-bold">100.0%</span>
                        <span className="font-bold text-green-800">
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
                    const expenseObject = expenseObjectsOptions.find(obj => obj.id === id)
                    return (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{expenseObject?.name || 'Đối tượng'}</span>
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

    </div>
  )
}



