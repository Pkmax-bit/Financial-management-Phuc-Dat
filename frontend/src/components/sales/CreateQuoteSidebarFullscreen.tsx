'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  FileText,
  User,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  Send,
  Package,
  Search,
  Eye,
  AlertTriangle,
  CircleHelp
} from 'lucide-react'
import { apiPost, apiGet } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ColumnVisibilityDialog from './ColumnVisibilityDialog'
import { useSidebar } from '@/components/LayoutWithSidebar'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Employee {
  id: string
  name: string
  email?: string
  user_id?: string
}

const normalizeDateInput = (value: string | null | undefined) => {
  if (!value) return null
  return String(value).slice(0, 10)
}

interface QuoteItem {
  id?: string
  product_service_id?: string
  expense_object_id?: string
  component_name?: string
  name_product: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  tax_rate?: number  // Tax rate for this specific item (defaults to form tax_rate)
  area?: number | null
  baseline_area?: number | null
  volume?: number | null
  baseline_volume?: number | null
  height?: number | null
  length?: number | null
  depth?: number | null
  // UI-only flags to avoid overwriting manual inputs
  area_is_manual?: boolean
  volume_is_manual?: boolean
// values sourced strictly from product components (hiện tại lấy từ actual_material_components của sản phẩm)
  component_unit?: string
  component_unit_price?: number
  component_quantity?: number
  component_total_price?: number
  components?: Array<{
    expense_object_id: string
    name?: string
    unit: string
    unit_price: number
    quantity: number
    total_price: number
  }>
  product_category_id?: string | null
}

interface Product {
  id: string
  name: string
  description?: string
  unit?: string
  unit_price?: number
  category?: string
  category_id?: string | null
  area?: number | null
  volume?: number | null
  height?: number | null
  length?: number | null
  depth?: number | null
}

interface CreateQuoteSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  quoteId?: string // Optional: if provided, load and edit existing quote
}

// Helper function to convert category names to Vietnamese with diacritics
const getCategoryDisplayName = (categoryName: string | undefined) => {
  if (!categoryName) return 'Khác'

  const categoryMap: Record<string, string> = {
    'Thiet bi dien tu': 'Thiết bị điện tử',
    'Noi that': 'Nội thất',
    'Dich vu': 'Dịch vụ',
    'Thiet bi van phong': 'Thiết bị văn phòng',
    'Phan mem': 'Phần mềm'
  }

  return categoryMap[categoryName] || categoryName
}

export default function CreateQuoteSidebarFullscreen({ isOpen, onClose, onSuccess, quoteId }: CreateQuoteSidebarProps) {
  const { hideSidebar } = useSidebar()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [showColumnDialog, setShowColumnDialog] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showVariantDialog, setShowVariantDialog] = useState(false)
  const [selectedProductVariants, setSelectedProductVariants] = useState<Product[]>([])
  const [pendingProductClick, setPendingProductClick] = useState<Product | null>(null)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [editingCell, setEditingCell] = useState<{ index: number; field: string } | null>(null)
  const [autoCalcDimensions, setAutoCalcDimensions] = useState(true)
  // Always-on auto adjustment
  const autoAdjustEnabled = true
  const [descriptionModal, setDescriptionModal] = useState<{ isOpen: boolean; index: number; description: string; productName: string }>({ 
    isOpen: false, 
    index: -1, 
    description: '', 
    productName: '' 
  })

  // Preloaded adjustment rules for instant access
  const adjustmentRulesMap = useRef<Map<string, any[]>>(new Map())
  const [rulesLoaded, setRulesLoaded] = useState(false)
  // Debounce timers for auto adjustment per item+dimension
  const adjustmentTimersRef = useRef<Map<string, any>>(new Map())
  const [showRulesDialog, setShowRulesDialog] = useState(false)
  const [manualAdjusting, setManualAdjusting] = useState(false)

  // Tour state
  const QUOTE_FORM_TOUR_STORAGE_KEY = 'quote-form-tour-status-v1'
  const [isQuoteTourRunning, setIsQuoteTourRunning] = useState(false)
  const quoteTourRef = useRef<any>(null)
  const quoteShepherdRef = useRef<any>(null)
  const quoteTourAutoStartAttemptedRef = useRef(false)
  type QuoteShepherdModule = typeof import('shepherd.js')
  type QuoteShepherdType = QuoteShepherdModule & { Tour: new (...args: any[]) => any }
  type QuoteShepherdTour = InstanceType<QuoteShepherdType['Tour']>
  const [showProfitWarningDialog, setShowProfitWarningDialog] = useState(false)
  const [lowProfitItems, setLowProfitItems] = useState<Array<{ name: string; percentage: number }>>([])

  const manualAdjustAll = async () => {
    try {
      console.log('[Adjust] Manual apply clicked')
      if (!rulesLoaded) return
      // Clear pending timers to avoid double-apply
      adjustmentTimersRef.current.forEach((t) => clearTimeout(t))
      adjustmentTimersRef.current.clear()
      setManualAdjusting(true)
      // Snapshot quantities before
      const beforeMap = new Map<string, number>()
      items.forEach((it, iIdx) => {
        const comps: any[] = Array.isArray((it as any).components) ? ((it as any).components as any[]) : []
        comps.forEach((c: any) => {
          const key = `${iIdx}__${String(c.expense_object_id)}`
          beforeMap.set(key, Number(c.quantity || 0))
        })
      })
      const dims: Array<'area' | 'volume' | 'height' | 'length' | 'depth' | 'quantity'> = ['area', 'volume', 'height', 'length', 'depth', 'quantity']
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        const comps: any[] = Array.isArray((it as any).components) ? ((it as any).components as any[]) : []
        if (comps.length === 0) continue
        for (const d of dims) {
          const curr = (it as any)[d]
          const currNum = curr == null ? null : Number(curr)
          if (currNum == null || !isFinite(currNum)) continue
          // Use product baseline area/volume as old value when available
          let oldNum = 0
          if (d === 'area') oldNum = Number((it as any).baseline_area ?? 0)
          else if (d === 'volume') oldNum = Number((it as any).baseline_volume ?? 0)
          console.log('[Adjust] Item', i, 'dimension', d, 'old→new', oldNum, '→', currNum)
          await applyMaterialAdjustmentRules(i, d, oldNum, currNum)
        }
      }
      // Small success toast
      try {
        // Build per-component delta list after (use freshest state ref)
        const lines: string[] = []
        const afterItems = itemsRef.current
        afterItems.forEach((it, iIdx) => {
          const comps: any[] = Array.isArray((it as any).components) ? ((it as any).components as any[]) : []
          comps.forEach((c: any) => {
            const key = `${iIdx}__${String(c.expense_object_id)}`
            const prev = beforeMap.get(key) ?? 0
            const now = Number(c.quantity || 0)
            const delta = now - prev
            console.log('[Adjust] Component result', { line: iIdx, name: c.name || c.expense_object_id, prev, now, delta })
            if (delta !== 0) {
              const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
              lines.push(`${c.name || c.expense_object_id}: ${fmt(prev)} → ${fmt(now)} (Δ ${delta > 0 ? '+' : ''}${fmt(delta)})`)
            }
          })
        })
        console.log('[Adjust] Manual apply done. Changes count:', lines.length)
        const msg = document.createElement('div')
        msg.innerHTML = `<div style="position:fixed;bottom:20px;right:20px;background:#1f9d55;color:#fff;padding:12px 14px;border-radius:6px;z-index:10000;box-shadow:0 4px 10px rgba(0,0,0,.15);max-width:360px;font-size:12px;line-height:1.4">
          <div style="font-weight:600;margin-bottom:6px">Đã áp dụng điều chỉnh thủ công</div>
          ${lines.length > 0 ? `<ul style="padding-left:16px;margin:0">${lines.map(l => `<li>${l}</li>`).join('')}</ul>` : '<div>Không có thay đổi số lượng vật tư.</div>'}
        </div>`
        document.body.appendChild(msg)
        setTimeout(() => { if (document.body.contains(msg)) document.body.removeChild(msg) }, 2500)
      } catch (_) { }
    } catch (_) { }
    finally {
      setManualAdjusting(false)
    }
  }

  // Apply adjustments for a single item (row)
  const manualAdjustItem = async (rowIndex: number) => {
    try {
      console.log('[Adjust] Manual row apply clicked', rowIndex)
      if (!rulesLoaded) return
        // Clear pending timers for this row
        ; (['area', 'volume', 'height', 'length', 'depth', 'quantity'] as const).forEach(dim => {
          const key = `${rowIndex}_${dim}`
          const t = adjustmentTimersRef.current.get(key)
          if (t) clearTimeout(t)
          adjustmentTimersRef.current.delete(key)
        })

      // Snapshot before
      const beforeMap = new Map<string, number>()
      const it = itemsRef.current[rowIndex]
      const compsBefore: any[] = Array.isArray((it as any)?.components) ? ((it as any).components as any[]) : []
      compsBefore.forEach((c: any) => beforeMap.set(`${rowIndex}__${String(c.expense_object_id)}`, Number(c.quantity || 0)))

      for (const d of ['area', 'volume', 'height', 'length', 'depth', 'quantity'] as const) {
        const curr = (it as any)[d]
        const currNum = curr == null ? null : Number(curr)
        if (currNum == null || !isFinite(currNum)) continue
        let oldNum = 0
        if (d === 'area') oldNum = Number((it as any).baseline_area ?? 0)
        else if (d === 'volume') oldNum = Number((it as any).baseline_volume ?? 0)
        console.log('[Adjust] Row item', rowIndex, 'dimension', d, 'old→new', oldNum, '→', currNum)
        await applyMaterialAdjustmentRules(rowIndex, d, oldNum, currNum)
      }

      // Build toast lines for this row
      const lines: string[] = []
      const afterItem = itemsRef.current[rowIndex]
      const compsAfter: any[] = Array.isArray((afterItem as any)?.components) ? ((afterItem as any).components as any[]) : []
      compsAfter.forEach((c: any) => {
        const key = `${rowIndex}__${String(c.expense_object_id)}`
        const prev = beforeMap.get(key) ?? 0
        const now = Number(c.quantity || 0)
        const delta = now - prev
        console.log('[Adjust] Row component result', { line: rowIndex, name: c.name || c.expense_object_id, prev, now, delta })
        if (delta !== 0) {
          const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
          lines.push(`${c.name || c.expense_object_id}: ${fmt(prev)} → ${fmt(now)} (Δ ${delta > 0 ? '+' : ''}${fmt(delta)})`)
        }
      })

      try {
        const msg = document.createElement('div')
        msg.innerHTML = `<div style="position:fixed;bottom:20px;right:20px;background:#1f9d55;color:#fff;padding:12px 14px;border-radius:6px;z-index:10000;box-shadow:0 4px 10px rgba(0,0,0,.15);max-width:360px;font-size:12px;line-height:1.4">
          <div style=\"font-weight:600;margin-bottom:6px\">Đã áp dụng điều chỉnh cho dòng #${rowIndex + 1}</div>
          ${lines.length > 0 ? `<ul style=\"padding-left:16px;margin:0\">${lines.map(l => `<li>${l}</li>`).join('')}</ul>` : '<div>Không có thay đổi số lượng vật tư.</div>'}
        </div>`
        document.body.appendChild(msg)
        setTimeout(() => { if (document.body.contains(msg)) document.body.removeChild(msg) }, 2500)
      } catch (_) { }
    } catch (e) {
      console.error('[Adjust] Row apply failed', e)
    }
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // Filter products based on search
  const filteredProducts = products.filter(product => {
    const searchTerm = productSearch.toLowerCase()
    return product.name.toLowerCase().includes(searchTerm) ||
      (product.description || '').toLowerCase().includes(searchTerm) ||
      (product.category || '').toLowerCase().includes(searchTerm)
  })

  // Helper function to extract base product name (remove size/dimension info)
  // Example: "Cửa 4 cánh ngang 2 cao 2" → "Cửa 4 cánh"
  // Example: "Cửa 4 cánh ngang 3 cao 2" → "Cửa 4 cánh"
  const getBaseProductName = (productName: string): string => {
    // Remove common size patterns: "ngang X", "cao X", "dài X", "rộng X", "sâu X"
    let baseName = productName
      .replace(/\s+ngang\s+\d+/gi, '')
      .replace(/\s+cao\s+\d+/gi, '')
      .replace(/\s+dài\s+\d+/gi, '')
      .replace(/\s+rộng\s+\d+/gi, '')
      .replace(/\s+sâu\s+\d+/gi, '')
      .replace(/\s+\d+x\d+/gi, '') // Remove patterns like "2x2", "3x2"
      .replace(/\s+\d+\s*x\s*\d+/gi, '') // Remove patterns like "2 x 2", "3 x 2"
      .trim()

    // If after removing size info, name is too short, use original name
    if (baseName.length < 3) {
      return productName
    }

    return baseName
  }

  // Group products by base name
  const groupProductsByName = (products: Product[]): Map<string, Product[]> => {
    const grouped = new Map<string, Product[]>()
    products.forEach(product => {
      const baseName = getBaseProductName(product.name)
      if (!grouped.has(baseName)) {
        grouped.set(baseName, [])
      }
      grouped.get(baseName)!.push(product)
    })
    return grouped
  }

  // Handle product click - check if has variants
  const handleProductClick = (product: Product) => {
    const baseName = getBaseProductName(product.name)
    const variants = filteredProducts.filter(p => getBaseProductName(p.name) === baseName)

    if (variants.length > 1) {
      // Has multiple variants, show dialog
      setSelectedProductVariants(variants)
      setPendingProductClick(product)
      setShowVariantDialog(true)
    } else {
      // Single product, select directly
      selectProduct(product)
    }
  }

  // Calculate total amount and check budget - using state to avoid initialization issues
  const [totalAmount, setTotalAmount] = useState(0)
  const [isOverBudget, setIsOverBudget] = useState(false)
  const [budgetDifference, setBudgetDifference] = useState(0)


  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    description: true,
    quantity: true,
    unit: true,
    unit_price: true,
    total_price: true,
    area: true,
    volume: false, // Mặc định ẩn thể tích
    height: true,
    length: true,
    depth: false, // Mặc định ẩn độ sâu
    components_block: true
  })

  // Form data
  const [formData, setFormData] = useState({
    quote_number: '',
    customer_id: '',
    project_id: '',
    created_by: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    tax_rate: 10,
    tax_amount: 0,
    total_amount: 0,
    discount_amount: 0,
    currency: 'VND',
    status: 'draft',
    notes: '',
    terms: 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.'
  })

  // New customer/project data (when not selecting from existing)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    type: 'individual' as 'individual' | 'company' | 'government',
    address: '',
    city: '',
    country: 'Vietnam',
    phone: '',
    email: '',
    tax_id: '',
    credit_limit: 0,
    payment_terms: 30,
    notes: ''
  })

  const [newProject, setNewProject] = useState({
    name: ''
  })
  const [taskGroups, setTaskGroups] = useState<Array<{ id: string; name: string }>>([])
  const [loadingTaskGroups, setLoadingTaskGroups] = useState(false)
  const [selectedTaskGroupId, setSelectedTaskGroupId] = useState<string>('')

  // Auto-generate project name from customer name and address
  useEffect(() => {
    if (!formData.customer_id && newCustomer.name && newCustomer.address) {
      // New customer: use newCustomer data
      const projectName = `${newCustomer.name} - ${newCustomer.address}`
      setNewProject(prev => ({ ...prev, name: projectName }))
    } else if (formData.customer_id) {
      // Existing customer: use selected customer
      const selectedCustomer = customers.find(c => c.id === formData.customer_id)
      if (selectedCustomer && selectedCustomer.address) {
        const projectName = `${selectedCustomer.name} - ${selectedCustomer.address}`
        setNewProject(prev => ({ ...prev, name: projectName }))
      } else if (selectedCustomer) {
        const projectName = selectedCustomer.name
        setNewProject(prev => ({ ...prev, name: projectName }))
      }
    }
  }, [newCustomer.name, newCustomer.address, formData.customer_id, customers])

  const [items, setItems] = useState<QuoteItem[]>([
    {
      name_product: '',
      description: '',
      quantity: 1,
      unit: '',
      unit_price: 0,
      total_price: 0,
      area: null,
      baseline_area: null,
      volume: null,
      baseline_volume: null,
      height: null,
      length: null,
      depth: null,
      area_is_manual: false,
      volume_is_manual: false
    }
  ])
  // Keep latest items snapshot for post-update reads
  const itemsRef = useRef<QuoteItem[]>([])
  useEffect(() => { itemsRef.current = items }, [items])

  // Dispatch event when dialog opens to close project detail sidebar
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('closeProjectDetailSidebar'))
    }
  }, [isOpen])

  // Hide sidebar when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to ensure sidebar is hidden after component renders
      const timer = setTimeout(() => {
        hideSidebar(true)
      }, 0)
      return () => {
        clearTimeout(timer)
        hideSidebar(false)
      }
    } else {
      hideSidebar(false)
      return undefined
    }
  }, [isOpen, hideSidebar])

  // Shared components schema cho phần vật tư: chỉ lấy từ components thực tế của từng dòng
  const headerComponents = (() => {
    const seen = new Set<string>()
    const list: Array<{ expense_object_id: string; name?: string }> = []
    items.forEach(it => {
      const comps: any[] = Array.isArray((it as any)?.components) ? ((it as any).components as any[]) : []
      comps.forEach(c => {
        const id = String(c?.expense_object_id || '')
        if (!id) return
        if (!seen.has(id)) {
          seen.add(id)
          list.push({ expense_object_id: id, name: c?.name })
        }
      })
    })
    return list
  })()

  // Compute a single grid template to keep header and body perfectly aligned
  // Align with Project Expense planned table sizing
  // Main columns: name 200, description 150, quantity 80, unit 80, unit_price 100, total 120
  const gridTemplateColumns = [
    visibleColumns.name && 'minmax(200px, auto)',
    visibleColumns.description && '150px',
    visibleColumns.quantity && 'minmax(80px, auto)',
    visibleColumns.unit && '80px',
    visibleColumns.unit_price && 'minmax(100px, auto)',
    visibleColumns.total_price && 'minmax(120px, auto)',
    visibleColumns.area && 'minmax(80px, auto)',
    visibleColumns.volume && 'minmax(80px, auto)',
    visibleColumns.height && 'minmax(80px, auto)',
    visibleColumns.length && 'minmax(80px, auto)',
    visibleColumns.depth && 'minmax(80px, auto)',
    // Components block width per component: unit 80 + unit_price 100 + quantity 80 + total 120 = 380
    visibleColumns.components_block && `minmax(${(headerComponents.length || 1) * (80 + 100 + 80 + 120)}px, auto)`
  ].filter(Boolean).join(' ')

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchProducts()
      fetchEmployees()
      fetchTaskGroups()
      if (quoteId) {
        loadQuoteData()
      } else {
        generateQuoteNumber()
      }
      // Preload all active adjustment rules once when opening
      ; (async () => {
        try {
          adjustmentRulesMap.current.clear()
          const { data: allRules } = await supabase
            .from('material_adjustment_rules')
            .select('*')
            .eq('is_active', true)
          const list = Array.isArray(allRules) ? allRules : []
          for (const r of list) {
            const key = `${r.expense_object_id}_${r.dimension_type}`
            const arr = adjustmentRulesMap.current.get(key) || []
            arr.push(r)
            adjustmentRulesMap.current.set(key, arr)
          }
          setRulesLoaded(true)
        } catch (_) {
          setRulesLoaded(true)
        }
      })()
    } else {
      // Reset all fields when closing
      setSelectedItemIndex(null)
      setSelectedProductIds([])
      resetForm()
      // Clear preloaded rules when closing
      adjustmentRulesMap.current.clear()
      setRulesLoaded(false)
      // Clear any pending adjustment timers
      adjustmentTimersRef.current.forEach((t) => clearTimeout(t))
      adjustmentTimersRef.current.clear()
    }
  }, [isOpen, quoteId])

  useEffect(() => {
    calculateSubtotal()
  }, [items])

  // Auto-fill project info when modal opens with project from query params
  useEffect(() => {
    if (isOpen && !quoteId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const projectId = urlParams.get('project')
      
      if (projectId && !formData.project_id) {
        // Fetch project details
        supabase
          .from('projects')
          .select('id, name, customer_id, start_date, end_date')
          .eq('id', projectId)
          .single()
          .then(({ data: project, error }) => {
            if (!error && project) {
              console.log('✅ Auto-filling project info:', project)
              // Auto-fill customer and project
              setFormData(prev => ({
                ...prev,
                customer_id: project.customer_id || prev.customer_id,
                project_id: project.id,
                issue_date: project.start_date ? normalizeDateInput(project.start_date) || new Date().toISOString().split('T')[0] : prev.issue_date,
                valid_until: project.end_date ? normalizeDateInput(project.end_date) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : prev.valid_until
              }))
              
              // Fetch projects for this customer
              if (project.customer_id) {
                fetchProjectsByCustomer(project.customer_id)
              }
            }
          })
      }
    }
  }, [isOpen, quoteId, formData.project_id])

  // Fetch projects when customer changes
  useEffect(() => {
    if (formData.customer_id) {
      fetchProjectsByCustomer(formData.customer_id)
    } else {
      setProjects([])
      setFormData(prev => ({ ...prev, project_id: '' }))
    }
  }, [formData.customer_id])

  // Load product components for selected project and convert to quote items
  const loadProductComponentsForProject = async (projectId: string) => {
    try {
      if (!projectId) return
      // Try to find a product tied to this project (by project_id); fallback: none
      const { data: prod } = await supabase
        .from('products')
        .select('id, name, actual_material_components, product_components')
        .eq('project_id', projectId)
        .limit(1)
        .maybeSingle()
      const actualComps: any[] = Array.isArray(prod?.actual_material_components) ? (prod!.actual_material_components as any[]) : []
      const plannedComps: any[] = Array.isArray(prod?.product_components) ? (prod!.product_components as any[]) : []
      // Ưu tiên dùng vật tư thực tế; nếu chưa có thì fallback vật tư kế hoạch
      const components: any[] = actualComps.length > 0 ? actualComps : plannedComps
      if (components.length === 0) return

      // Fetch names for expense_object_ids
      const ids = Array.from(new Set(components.map(c => String(c.expense_object_id)).filter(Boolean)))
      let nameMap: Record<string, string> = {}
      if (ids.length > 0) {
        const { data: exp } = await supabase
          .from('expense_objects')
          .select('id, name')
          .in('id', ids)
        if (exp) {
          exp.forEach((e: any) => { nameMap[e.id] = e.name })
        }
      }

      // Convert to quote items
      const converted = components.map(c => {
        const quantity = Number(c.quantity || 0)
        const unit_price = Number(c.unit_price || 0)
        return {
          expense_object_id: String(c.expense_object_id || ''),
          name_product: nameMap[String(c.expense_object_id)] || String(c.expense_object_id || ''),
          description: '',
          quantity,
          unit: c.unit || '',
          unit_price,
          total_price: computeItemTotal({
            expense_object_id: String(c.expense_object_id || ''),
            name_product: nameMap[String(c.expense_object_id)] || String(c.expense_object_id || ''),
            description: '',
            quantity,
            unit: c.unit || '',
            unit_price,
            total_price: 0,
            area: null,
            baseline_area: null,
            volume: null,
            baseline_volume: null,
            height: null,
            length: null,
            depth: null
          } as any),
          area: null,
          volume: null,
          height: null,
          length: null,
          depth: null,
          component_unit: c.unit || '',
          component_unit_price: unit_price,
          component_quantity: quantity,
          component_total_price: quantity * unit_price
        } as QuoteItem
      })
      if (converted.length > 0) setItems(converted)
    } catch (_) {
      // ignore silently
    }
  }

  const startQuoteTour = useCallback(async () => {
    if (!isOpen || typeof window === 'undefined') return

    if (quoteTourRef.current) {
      quoteTourRef.current.cancel()
      quoteTourRef.current = null
    }

    if (!quoteShepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: QuoteShepherdType })?.default ?? (module as unknown as QuoteShepherdType)
        quoteShepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = quoteShepherdRef.current
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

    await waitForElement('[data-tour-id="quote-form-basic-info"]')
    await waitForElement('[data-tour-id="quote-form-items"]')
    await waitForElement('[data-tour-id="quote-select-product-button"]')
    await waitForElement('[data-tour-id="quote-form-area-info"]')
    await waitForElement('[data-tour-id="quote-form-totals"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'quote-form-intro',
      title: 'Hướng dẫn tạo báo giá',
      text: 'Tạo báo giá với tính năng tự động tính diện tích và điều chỉnh vật tư khi thay đổi kích thước.',
      attachTo: { element: '[data-tour-id="quote-form-header"]', on: 'bottom' },
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
      id: 'quote-form-basic-info',
      title: 'Thông tin cơ bản',
      text: 'Điền: Số báo giá, Khách hàng (bắt buộc), Dự án (tùy chọn), Ngày phát hành, Ngày hết hạn, Ghi chú.\n\nLưu ý: Dự án tự động tải khi chọn khách hàng.',
      attachTo: { element: '[data-tour-id="quote-form-basic-info"]', on: 'top' },
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
      id: 'quote-form-items',
      title: 'Thêm sản phẩm',
      text: 'Cách thêm: "Chọn từ danh sách" hoặc "Thêm sản phẩm tự do".\n\nĐiền: Tên, Mô tả, Số lượng, Đơn vị, Đơn giá.\nThành tiền = Đơn giá × Số lượng × Diện tích (tự động).',
      attachTo: { element: '[data-tour-id="quote-form-items"]', on: 'top' },
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
      id: 'quote-select-product',
      title: 'Chọn sản phẩm từ danh sách',
      text: 'Nhấn nút "Chọn từ danh sách" để mở modal chọn sản phẩm.\n\nTrong modal:\n• Tìm kiếm sản phẩm theo tên, mô tả hoặc loại\n• Chọn sản phẩm bằng checkbox (có thể chọn nhiều)\n• Mở/đóng từng loại sản phẩm để xem chi tiết\n• Nhấn "Thêm đã chọn" để thêm vào báo giá\n\nLưu ý: Sản phẩm được chọn sẽ tự động điền thông tin (tên, mô tả, đơn giá, kích thước).',
      attachTo: { element: '[data-tour-id="quote-select-product-button"]', on: 'bottom' },
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
      id: 'quote-form-area-info',
      title: 'Nhập kích thước và diện tích',
      text: 'Điền: Chiều dài (mm), Chiều cao (mm), Chiều sâu (mm, tùy chọn).\nDiện tích (m²) = (Dài × Cao) / 1,000,000 (tự động).\nThể tích (m³) tự động tính nếu có chiều sâu.\n\nLưu ý: Có thể nhập trực tiếp diện tích nếu đã biết.',
      attachTo: { element: '[data-tour-id="quote-form-area-info"]', on: 'top' },
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
      id: 'quote-form-area-rules',
      title: 'Quy tắc khi tăng diện tích',
      text: 'Khi tăng diện tích, hệ thống tự động điều chỉnh số lượng vật tư theo quy tắc đã thiết lập (phần trăm hoặc giá trị tuyệt đối).\n\nNhấn "Áp dụng điều chỉnh" để cập nhật ngay.\nQuản lý quy tắc tại mục "Quy tắc điều chỉnh vật tư".',
      attachTo: { element: '[data-tour-id="quote-form-area-rules"]', on: 'left' },
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
      id: 'quote-form-totals',
      title: 'Tổng tiền và lưu',
      text: 'Hiển thị: Tổng tiền, Thuế VAT, Tổng cộng (tự động tính).\n\nHành động:\n• "Lưu nháp": Lưu để chỉnh sửa sau\n• "Gửi ngay": Lưu và gửi cho khách hàng',
      attachTo: { element: '[data-tour-id="quote-form-totals"]', on: 'top' },
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
      setIsQuoteTourRunning(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem(QUOTE_FORM_TOUR_STORAGE_KEY, 'completed')
      }
      quoteTourRef.current = null
    })

    tour.on('cancel', () => {
      setIsQuoteTourRunning(false)
      quoteTourRef.current = null
    })

    quoteTourRef.current = tour
    setIsQuoteTourRunning(true)
    tour.start()
  }, [isOpen])

  // When project changes, load product components and fill items
  useEffect(() => {
    if (formData.project_id) {
      loadProductComponentsForProject(formData.project_id)
    }
  }, [formData.project_id])

  // Auto-start tour when form opens for the first time
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isOpen) return
    if (quoteTourAutoStartAttemptedRef.current) return

    const storedStatus = localStorage.getItem(QUOTE_FORM_TOUR_STORAGE_KEY)
    quoteTourAutoStartAttemptedRef.current = true

    if (!storedStatus) {
      // Delay to ensure form is fully rendered
      setTimeout(() => {
        startQuoteTour()
      }, 800)
    }
  }, [isOpen, startQuoteTour])

  // Reset tour auto-start when form closes
  useEffect(() => {
    if (!isOpen) {
      quoteTourAutoStartAttemptedRef.current = false
    }
  }, [isOpen])

  // Cleanup tour on unmount
  useEffect(() => {
    return () => {
      quoteTourRef.current?.cancel()
      quoteTourRef.current?.destroy?.()
      quoteTourRef.current = null
    }
  }, [])

  // Update selected project when project_id changes
  useEffect(() => {
    if (formData.project_id && projects.length > 0) {
      const project = projects.find(p => p.id === formData.project_id)
      setSelectedProject(project || null)
    } else {
      setSelectedProject(null)
    }
  }, [formData.project_id, projects])

  // Autofill issue_date and valid_until based on selected project's timeline
  useEffect(() => {
    if (!selectedProject) return

    const projectStart = normalizeDateInput(selectedProject.start_date)
    const projectEnd = normalizeDateInput(selectedProject.end_date)

    setFormData(prev => {
      const nextIssue = projectStart ?? prev.issue_date
      const nextValid = projectEnd ?? prev.valid_until

      if (nextIssue === prev.issue_date && nextValid === prev.valid_until) {
        return prev
      }

      return {
        ...prev,
        issue_date: nextIssue,
        valid_until: nextValid
      }
    })
  }, [selectedProject])

  // Calculate total amount and budget status
  useEffect(() => {
    // Calculate total tax from all items (each item has its own tax_rate)
    const total_tax = items.reduce((sum, item) => {
      const itemTaxRate = item.tax_rate ?? formData.tax_rate ?? 10
      return sum + (item.total_price * (itemTaxRate / 100))
    }, 0)
    // Total = subtotal + total tax - discount
    const calculatedTotal = formData.subtotal + total_tax - formData.discount_amount
    setTotalAmount(calculatedTotal)

    if (selectedProject && selectedProject.budget) {
      const overBudget = calculatedTotal > selectedProject.budget
      setIsOverBudget(overBudget)
      setBudgetDifference(overBudget ? calculatedTotal - selectedProject.budget : 0)
    } else {
      setIsOverBudget(false)
      setBudgetDifference(0)
    }
  }, [formData.subtotal, formData.tax_rate, formData.discount_amount, selectedProject, items])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching customers from database...')

      // Use Supabase client directly to get real data - only active customers
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('🔍 Real customers data from database:', data)
      setCustomers(data || [])

      if (!data || data.length === 0) {
        alert('Không có khách hàng nào trong database. Vui lòng tạo khách hàng trước.')
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
      alert('Không thể tải danh sách khách hàng từ database: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectsByCustomer = async (customerId: string) => {
    if (!customerId) {
      setProjects([])
      return
    }

    try {
      setLoadingProjects(true)
      console.log('🔍 Fetching projects for customer:', customerId)

      // Use Supabase directly to get projects for the customer
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, project_code, name, status, start_date, end_date')
        .eq('customer_id', customerId)
        .in('status', ['planning', 'active'])
        .order('name')

      if (error) {
        console.error('❌ Supabase error fetching projects:', error)
        throw error
      }

      console.log('🔍 Projects data for customer:', projects)
      setProjects(projects || [])
    } catch (error) {
      console.error('❌ Error fetching projects:', error)
      // Don't show alert for projects as it's not critical
      setProjects([])
    } finally {
      setLoadingProjects(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      console.log('🔍 Fetching products from database...')

      // Use Supabase client directly to get products with categories
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories:category_id(name)
        `)
        .eq('is_active', true)
        .order('name')
        .limit(50)

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('🔍 Products data from database:', data)

      if (data && data.length > 0) {
        // Transform data to match the expected format
        const transformedProducts = data.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          unit: product.unit || 'cái',
          unit_price: product.price || 0,
          category: getCategoryDisplayName(product.product_categories?.name) || 'Khác',
          category_id: product.category_id || null,
          area: product.area !== undefined ? product.area : null,
          volume: product.volume !== undefined ? product.volume : null,
          height: product.height !== undefined ? product.height : null,
          length: product.length !== undefined ? product.length : null,
          depth: product.depth !== undefined ? product.depth : null
        }))
        setProducts(transformedProducts)
        console.log('🔍 Using real products data:', transformedProducts)
      }

    } catch (error) {
      console.error('❌ Error fetching products:', error)
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchTaskGroups = async () => {
    try {
      setLoadingTaskGroups(true)
      const groups = await apiGet('/api/tasks/groups')
      setTaskGroups(groups || [])
      
      // Tìm nhóm "Dự án cửa" và set làm mặc định
      const duAnCuaGroup = groups.find((g: any) => 
        g.name && (g.name.toLowerCase().includes('dự án cửa') || g.name.toLowerCase().includes('du an cua'))
      )
      if (duAnCuaGroup) {
        setSelectedTaskGroupId(duAnCuaGroup.id)
      }
    } catch (error) {
      console.error('Error fetching task groups:', error)
    } finally {
      setLoadingTaskGroups(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      console.log('🔍 Fetching employees from database...')

      // Use Supabase client directly to get employees with user info
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          user_id,
          users!employees_user_id_fkey(full_name)
        `)
        .eq('status', 'active')
        .order('first_name')
        .limit(50)

      if (error) {
        console.error('❌ Supabase error fetching employees:', error)
        throw error
      }

      if (data && data.length > 0) {
        const transformedEmployees = data.map((emp: any) => {
          const usersRel = emp.users
          const userFullName = Array.isArray(usersRel) ? usersRel[0]?.full_name : usersRel?.full_name
          return {
            id: emp.id,
            name: userFullName || `${emp.first_name} ${emp.last_name}`.trim(),
            email: emp.email,
            user_id: emp.user_id
          }
        })
        setEmployees(transformedEmployees)
        console.log('🔍 Employees data:', transformedEmployees)
      } else {
        console.log('🔍 No employees found')
        setEmployees([])
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  const generateQuoteNumber = () => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    setFormData(prev => ({
      ...prev,
      quote_number: `QUO-${dateStr}-${randomStr}`
    }))
  }

  const loadQuoteData = async () => {
    if (!quoteId) return

    try {
      setLoading(true)
      console.log('🔍 Loading quote data for ID:', quoteId)

      // Load quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (quoteError) {
        console.error('❌ Error loading quote:', quoteError)
        alert('Không thể tải báo giá: ' + quoteError.message)
        return
      }

      console.log('✅ Quote loaded:', quote)

      // Fill form data
      setFormData({
        quote_number: quote.quote_number || '',
        customer_id: quote.customer_id || '',
        project_id: quote.project_id || '',
        created_by: quote.created_by || quote.employee_in_charge_id || '',
        issue_date: quote.issue_date ? normalizeDateInput(quote.issue_date) || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        valid_until: quote.valid_until ? normalizeDateInput(quote.valid_until) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: quote.subtotal || 0,
        tax_rate: quote.tax_rate || 10,
        tax_amount: quote.tax_amount || 0,
        total_amount: quote.total_amount || 0,
        discount_amount: quote.discount_amount || 0,
        currency: quote.currency || 'VND',
        status: quote.status || 'draft',
        notes: quote.notes || '',
        terms: quote.terms || 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.'
      })

      // Load quote items
      const { data: quoteItems, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true })

      if (itemsError) {
        console.error('❌ Error loading quote items:', itemsError)
      } else {
        console.log('✅ Quote items loaded:', quoteItems?.length || 0)

        if (quoteItems && quoteItems.length > 0) {
          const loadedItems: QuoteItem[] = quoteItems.map((item: any) => ({
            id: item.id,
            product_service_id: item.product_service_id,
            expense_object_id: item.expense_object_id,
            component_name: item.component_name,
            name_product: item.name_product || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unit: item.unit || '',
            unit_price: item.unit_price || 0,
            total_price: item.total_price || 0,
            tax_rate: item.tax_rate ?? formData.tax_rate ?? 10,  // Load tax_rate from item or use form default
            area: item.area,
            baseline_area: item.area, // Use current area as baseline
            volume: item.volume,
            baseline_volume: item.volume, // Use current volume as baseline
            height: item.height,
            length: item.length,
            depth: item.depth,
            area_is_manual: false,
            volume_is_manual: false,
            // Load components từ product_components JSONB column (đang được fill từ actual_material_components của sản phẩm)
            components: Array.isArray(item.product_components) ? item.product_components.map((comp: any) => ({
              expense_object_id: comp.expense_object_id,
              name: comp.name,
              unit: comp.unit || '',
              unit_price: comp.unit_price || 0,
              quantity: comp.quantity || 0,
              total_price: comp.total_price || 0,
              baseline_quantity: comp.quantity || 0 // Store baseline for quantity adjustments
            })) : []
          }))

          setItems(loadedItems)
        } else {
          // No items, start with empty item
          setItems([{
            name_product: '',
            description: '',
            quantity: 1,
            unit: '',
            unit_price: 0,
            total_price: 0,
            area: null,
            baseline_area: null,
            volume: null,
            baseline_volume: null,
            height: null,
            length: null,
            depth: null,
            area_is_manual: false,
            volume_is_manual: false
          }])
        }
      }

      // Load projects for the customer
      if (quote.customer_id) {
        await fetchProjectsByCustomer(quote.customer_id)
      }
    } catch (error) {
      console.error('❌ Error loading quote data:', error)
      alert('Không thể tải dữ liệu báo giá: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const calculateSubtotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
    // Calculate total tax from all items (each item has its own tax_rate)
    const total_tax = items.reduce((sum, item) => {
      const itemTaxRate = item.tax_rate ?? formData.tax_rate ?? 10
      return sum + (item.total_price * (itemTaxRate / 100))
    }, 0)
    // Total amount = subtotal + total tax from all items
    const total_amount = subtotal + total_tax

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: total_tax,  // Store total tax for reference
      total_amount
    }))
  }

  const computeItemTotal = (item: QuoteItem): number => {
    const unitPrice = Number(item.unit_price || 0) // Đơn giá / m²
    const areaVal = item.area != null ? Number(item.area) : null // Diện tích (m²)
    // Thành tiền = (Đơn giá / m²) × Diện tích (m²) nếu có diện tích
    if (areaVal != null && isFinite(areaVal) && areaVal >= 0) {
      return Math.round(unitPrice * areaVal * 100) / 100 // Round to 2 decimal places
    }
    // Nếu không có diện tích, fallback về đơn giá × số lượng
    const quantity = Number(item.quantity || 0)
    return Math.round(unitPrice * quantity * 100) / 100 // Round to 2 decimal places
  }

  const addItem = () => {
    setItems([...items, {
      name_product: '',
      description: '',
      quantity: 1,
      unit: '',
      unit_price: 0,
      total_price: 0,
      tax_rate: formData.tax_rate || 10,  // Default tax rate from form
      area: null,
      baseline_area: null,
      volume: null,
      baseline_volume: null,
      height: null,
      length: null,
      depth: null,
      area_is_manual: false,
      volume_is_manual: false
    }])
  }

  type VisibleColumns = typeof visibleColumns
  const toggleColumn = (column: keyof VisibleColumns | string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column as keyof VisibleColumns]: !prev[column as keyof VisibleColumns]
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
      area: true,
      volume: false, // Mặc định ẩn thể tích
      height: true,
      length: true,
      depth: false, // Mặc định ẩn độ sâu
      components_block: true
    })
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  // Helper functions for different rule types

  // Check if a rule is applicable based on change direction and threshold
  const checkRuleApplicable = (
    rule: any,
    changeDirection: 'increase' | 'decrease',
    changePercentage: number,
    changeAbsolute: number
  ): boolean => {
    // Special case: if rule has negative adjustment_value and change_direction is 'decrease',
    // it likely means "apply when dimension increases" (e.g., area increases → labor decreases)
    const isInverseRule = rule.change_direction === 'decrease' && Number(rule.adjustment_value || 0) < 0

    if (isInverseRule) {
      // Apply when dimension INCREASES (opposite of change_direction)
      if (changeDirection !== 'increase') {
        return false
      }
    } else {
      // Normal logic: check change direction
      if (rule.change_direction !== 'both' && rule.change_direction !== changeDirection) {
        return false
      }
    }

    // Check change threshold
    if (rule.change_type === 'percentage') {
      return Math.abs(changePercentage) >= Math.abs(rule.change_value)
    } else if (rule.change_type === 'absolute') {
      return Math.abs(changeAbsolute) >= Math.abs(rule.change_value)
    }
    return false
  }

  // Apply rule for increase direction
  const applyIncreaseRule = (
    adjustedQuantity: number,
    rule: any
  ): number => {
    const adjustmentValue = Number(rule.adjustment_value || 0)

    if (rule.adjustment_type === 'percentage') {
      const adjustmentFactor = 1 + (adjustmentValue / 100)
      return adjustedQuantity * adjustmentFactor
    } else if (rule.adjustment_type === 'absolute') {
      return adjustedQuantity + adjustmentValue
    }
    return adjustedQuantity
  }

  // Apply rule for decrease direction
  const applyDecreaseRule = (
    adjustedQuantity: number,
    rule: any
  ): number => {
    const adjustmentValue = Number(rule.adjustment_value || 0)

    if (rule.adjustment_type === 'percentage') {
      const adjustmentFactor = 1 + (adjustmentValue / 100)
      return adjustedQuantity * adjustmentFactor
    } else if (rule.adjustment_type === 'absolute') {
      return adjustedQuantity + adjustmentValue
    }
    return adjustedQuantity
  }

  // Apply rule for both directions
  const applyBothRule = (
    adjustedQuantity: number,
    rule: any,
    changeDirection: 'increase' | 'decrease'
  ): number => {
    const adjustmentValue = Number(rule.adjustment_value || 0)

    if (rule.adjustment_type === 'percentage') {
      const adjustmentFactor = 1 + (adjustmentValue / 100)
      return adjustedQuantity * adjustmentFactor
    } else if (rule.adjustment_type === 'absolute') {
      // For absolute, adjust based on direction
      return adjustedQuantity + adjustmentValue
    }
    return adjustedQuantity
  }

  // Apply adjustment based on rule type
  const applyRuleAdjustment = (
    adjustedQuantity: number,
    rule: any,
    changeDirection: 'increase' | 'decrease'
  ): number => {
    // Check if this is an inverse rule (e.g., area increases → material decreases)
    const isInverseRule = rule.change_direction === 'decrease' && Number(rule.adjustment_value || 0) < 0

    if (rule.change_direction === 'increase') {
      return applyIncreaseRule(adjustedQuantity, rule)
    } else if (rule.change_direction === 'decrease' && !isInverseRule) {
      return applyDecreaseRule(adjustedQuantity, rule)
    } else if (rule.change_direction === 'both') {
      return applyBothRule(adjustedQuantity, rule, changeDirection)
    } else if (isInverseRule) {
      // Inverse rule: apply when dimension increases but material decreases
      return applyDecreaseRule(adjustedQuantity, rule)
    }

    return adjustedQuantity
  }

  // Helper function to apply material adjustment rules
  const applyMaterialAdjustmentRules = async (
    itemIndex: number,
    dimensionType: 'area' | 'volume' | 'height' | 'length' | 'depth' | 'quantity',
    oldValue: number | null,
    newValue: number | null
  ) => {
    if (oldValue === null || newValue === null || oldValue === newValue) {
      return // No change or invalid values
    }

    // Always read from latest snapshot to avoid stale overwrites
    const item = itemsRef.current[itemIndex]
    const components = Array.isArray(item.components) ? item.components : []
    if (components.length === 0) return

    try {
      // Apply adjustments for each component
      const adjustedComponents = await Promise.all(
        components.map(async (component: any) => {
          const expenseObjectId = component.expense_object_id
          if (!expenseObjectId) return component

          // Use preloaded rules only (no fetching during edits)
          try {
            const rules = adjustmentRulesMap.current.get(`${expenseObjectId}_${dimensionType}`) || []
            console.log('[Adjust] Rules lookup', { itemIndex, expenseObjectId, dimensionType, rulesCount: rules.length, oldValue, newValue })
            if (rules.length === 0) return component

            // Calculate change based on baseline (for area/volume) or previous value (for other dimensions)
            // This ensures each product calculates adjustment based on its own baseline
            const changePercentage = oldValue > 0 ? ((newValue - oldValue) / oldValue) * 100 : 0
            const changeAbsolute = newValue - oldValue
            const changeDirection = changeAbsolute > 0 ? 'increase' : 'decrease'
            console.log('[Adjust] Calculate change', {
              itemIndex,
              expenseObjectId,
              dimensionType,
              baselineValue: oldValue,
              currentValue: newValue,
              changePercentage: `${changePercentage.toFixed(2)}%`,
              changeAbsolute: changeAbsolute,
              changeDirection
            })

            // Find applicable rules using the new checkRuleApplicable function
            const prodCatId = (item as any).product_category_id || null
            const applicableRules = rules.filter((rule: any) => {
              // Category constraint: if rule has allowed_category_ids, product must belong to one of them
              const allowedCats = Array.isArray(rule.allowed_category_ids) ? rule.allowed_category_ids : null
              if (allowedCats && allowedCats.length > 0) {
                // Rule có giới hạn category, chỉ áp dụng cho sản phẩm thuộc category đó
                if (!prodCatId || !allowedCats.includes(prodCatId)) {
                  console.log('[Adjust] Rule skipped due to category mismatch', {
                    ruleId: rule.id || 'unknown',
                    ruleName: rule.name,
                    allowedCategories: allowedCats,
                    productCategoryId: prodCatId
                  })
                  return false
                }
                console.log('[Adjust] Rule category match', {
                  ruleId: rule.id || 'unknown',
                  ruleName: rule.name,
                  productCategoryId: prodCatId,
                  allowedCategories: allowedCats
                })
              }
              const isApplicable = checkRuleApplicable(rule, changeDirection, changePercentage, changeAbsolute)
              if (isApplicable) {
                console.log('[Adjust] Rule applicable', {
                  ruleId: rule.id || 'unknown',
                  ruleName: rule.name,
                  changeDirection: rule.change_direction,
                  adjustmentValue: rule.adjustment_value,
                  productCategoryId: prodCatId,
                  allowedCategories: allowedCats,
                  isInverse: rule.change_direction === 'decrease' && Number(rule.adjustment_value || 0) < 0
                })
              }
              return isApplicable
            })
            console.log('[Adjust] Applicable rules', applicableRules.length)
            if (applicableRules.length === 0) return component

            // Apply adjustments (multiple rules can stack)
            // Luôn tính từ baseline_quantity (số lượng vật tư cho 1 đơn vị sản phẩm) × số lượng sản phẩm hiện tại
            // để tránh cộng dồn khi bấm "Áp dụng" nhiều lần
            // baseline_quantity là số lượng vật tư cho 1 đơn vị sản phẩm (từ product)
            // Cần nhân với số lượng sản phẩm hiện tại để có số lượng vật tư cơ sở
            const currentProductQuantity = Number(item.quantity || 1)

            // Lấy baseline_quantity (số lượng vật tư cho 1 đơn vị sản phẩm)
            // Nếu không có, tính từ quantity hiện tại chia cho số lượng sản phẩm
            const baselineQuantityPerUnit = component.baseline_quantity != null
              ? Number(component.baseline_quantity)
              : (Number(component.quantity || 0) / currentProductQuantity)

            // Tính số lượng vật tư cơ sở = số lượng vật tư cho 1 đơn vị × số lượng sản phẩm hiện tại
            const baselineQuantity = baselineQuantityPerUnit * currentProductQuantity
            const originalQuantity = baselineQuantity
            let adjustedQuantity = originalQuantity
            let adjustedUnitPrice = Number(component.unit_price || 0)

            console.log('[Adjust] Using baseline quantity', {
              expenseObjectId,
              currentQuantity: Number(component.quantity || 0),
              baselineQuantityPerUnit,
              currentProductQuantity,
              baselineQuantity,
              hasBaseline: component.baseline_quantity != null
            })

            // Track total adjustment percentage for max limit
            let totalAdjustmentPercentage = 0

            for (const rule of applicableRules.sort((a: any, b: any) => a.priority - b.priority)) {
              const beforeAdjustment = adjustedQuantity
              const adjustmentValue = Number(rule.adjustment_value || 0)

              // Check if rule has max_adjustment_value or max_adjustment_percentage limit
              const maxAdjustmentPercentage = rule.max_adjustment_percentage != null ? Number(rule.max_adjustment_percentage) : null
              const maxAdjustmentValue = rule.max_adjustment_value != null ? Number(rule.max_adjustment_value) : null

              // Apply adjustment
              let newAdjustedQuantity = applyRuleAdjustment(adjustedQuantity, rule, changeDirection)

              // Calculate adjustment percentage applied
              let adjustmentPercentageApplied = 0
              if (rule.adjustment_type === 'percentage' && adjustedQuantity > 0) {
                adjustmentPercentageApplied = ((newAdjustedQuantity - adjustedQuantity) / adjustedQuantity) * 100
              }

              // Apply max limit if specified
              if (rule.adjustment_type === 'percentage') {
                // For percentage adjustments, check max_adjustment_percentage
                // Example: If area increases 20%, decrease 10%, but max decrease is 30%
                // This means total decrease cannot exceed 30%
                if (maxAdjustmentPercentage != null && maxAdjustmentPercentage > 0) {
                  // Calculate how much adjustment has been applied so far (from original)
                  const adjustmentFromOriginal = ((adjustedQuantity - originalQuantity) / originalQuantity) * 100
                  const newAdjustmentFromOriginal = ((newAdjustedQuantity - originalQuantity) / originalQuantity) * 100

                  // Check if adding this adjustment would exceed the max limit
                  // Max limit is based on the sign of the adjustment (increase or decrease)
                  if (adjustmentValue < 0) {
                    // For decrease adjustments, check if total decrease exceeds max
                    // maxAdjustmentPercentage is positive (e.g., 30), so compare with absolute value
                    if (Math.abs(newAdjustmentFromOriginal) > maxAdjustmentPercentage) {
                      // Limit to max decrease
                      const maxDecreaseFactor = 1 - (maxAdjustmentPercentage / 100)
                      newAdjustedQuantity = originalQuantity * maxDecreaseFactor
                      adjustmentPercentageApplied = ((newAdjustedQuantity - adjustedQuantity) / adjustedQuantity) * 100
                      console.log('[Adjust] Max limit applied (decrease)', { maxAdjustmentPercentage, adjustmentFromOriginal, newAdjustmentFromOriginal })
                    }
                  } else {
                    // For increase adjustments, check if total increase exceeds max
                    if (newAdjustmentFromOriginal > maxAdjustmentPercentage) {
                      // Limit to max increase
                      const maxIncreaseFactor = 1 + (maxAdjustmentPercentage / 100)
                      newAdjustedQuantity = originalQuantity * maxIncreaseFactor
                      adjustmentPercentageApplied = ((newAdjustedQuantity - adjustedQuantity) / adjustedQuantity) * 100
                      console.log('[Adjust] Max limit applied (increase)', { maxAdjustmentPercentage, adjustmentFromOriginal, newAdjustmentFromOriginal })
                    }
                  }
                  totalAdjustmentPercentage = ((newAdjustedQuantity - originalQuantity) / originalQuantity) * 100
                }
              } else if (rule.adjustment_type === 'absolute' && maxAdjustmentValue != null) {
                // For absolute adjustments, check max_adjustment_value
                const currentAdjustment = Math.abs(newAdjustedQuantity - originalQuantity)
                if (currentAdjustment > Math.abs(maxAdjustmentValue)) {
                  // Limit the adjustment
                  newAdjustedQuantity = originalQuantity + (maxAdjustmentValue > 0 ? Math.abs(maxAdjustmentValue) : -Math.abs(maxAdjustmentValue))
                  console.log('[Adjust] Max limit applied (absolute)', { maxAdjustmentValue, currentAdjustment })
                }
              }

              adjustedQuantity = newAdjustedQuantity
              console.log('[Adjust] Apply rule', {
                expenseObjectId,
                ruleId: rule.id || 'unknown',
                ruleDirection: rule.change_direction,
                ruleType: rule.adjustment_type,
                adjustmentValue,
                priority: rule.priority,
                before: beforeAdjustment,
                after: adjustedQuantity,
                isInverse: rule.change_direction === 'decrease' && adjustmentValue < 0,
                maxAdjustmentPercentage,
                maxAdjustmentValue,
                adjustmentPercentageApplied
              })
            }

            const finalQty = Math.max(0, adjustedQuantity)
            return {
              ...component,
              // tracking fields for UI
              adjustment_prev_quantity: originalQuantity,
              adjustment_delta_quantity: finalQty - originalQuantity,
              quantity: finalQty, // Ensure non-negative
              total_price: finalQty * adjustedUnitPrice
            }
          } catch (error) {
            console.error('Error fetching adjustment rules:', error)
            return component
          }
        })
      )

      // Update item with adjusted components
      const currentItems = itemsRef.current
      const updatedItems = [...currentItems]
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        components: adjustedComponents
      }

      // Recalculate item total_price using unit price × quantity × area logic
      updatedItems[itemIndex].total_price = computeItemTotal(updatedItems[itemIndex])

      setItems(updatedItems)
      // Sync snapshot immediately so subsequent applies in the same tick see latest state
      itemsRef.current = updatedItems
    } catch (error) {
      console.error('Error applying material adjustment rules:', error)
      // Continue without adjustment on error
    }
  }

  const scheduleAutoAdjust = (
    index: number,
    dimension: 'area' | 'volume' | 'height' | 'length' | 'depth' | 'quantity',
    oldVal: number | null | undefined,
    newVal: number | null | undefined
  ) => {
    try {
      const key = `${index}_${dimension}`
      const prevTimer = adjustmentTimersRef.current.get(key)
      if (prevTimer) clearTimeout(prevTimer)
      const t = setTimeout(async () => {
        // For area and volume, always use baseline values for comparison (like manualAdjustItem does)
        // This ensures each product calculates adjustment based on its own baseline
        let oldNum: number
        if (dimension === 'area') {
          const item = itemsRef.current[index]
          const baselineArea = Number((item as any)?.baseline_area ?? 0)
          oldNum = baselineArea > 0 ? baselineArea : (oldVal == null ? 0 : Number(oldVal))
        } else if (dimension === 'volume') {
          const item = itemsRef.current[index]
          const baselineVolume = Number((item as any)?.baseline_volume ?? 0)
          oldNum = baselineVolume > 0 ? baselineVolume : (oldVal == null ? 0 : Number(oldVal))
        } else {
          oldNum = oldVal == null ? 0 : Number(oldVal)
        }
        const newNum = newVal == null ? 0 : Number(newVal)
        if (!autoAdjustEnabled) return
        const comps = Array.isArray(items[index]?.components) ? (items[index].components as any[]) : []
        if (comps.length === 0) return
        if (!isFinite(oldNum) || !isFinite(newNum) || oldNum === newNum) return
        await applyMaterialAdjustmentRules(index, dimension, oldNum, newNum)
      }, 5000)
      adjustmentTimersRef.current.set(key, t)
    } catch (_) { }
  }

  const updateItem = async (index: number, field: keyof QuoteItem, value: string | number | null) => {
    const updatedItems = [...items]
    const oldItem = { ...updatedItems[index] }

    // Store old values for dimension fields
    const oldArea = oldItem.area
    const oldVolume = oldItem.volume
    const oldHeight = oldItem.height
    const oldLength = oldItem.length
    const oldDepth = oldItem.depth
    const oldQuantity = oldItem.quantity

    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Mark manual overrides for area/volume
    if (field === 'area') {
      updatedItems[index].area_is_manual = value != null
    } else if (field === 'volume') {
      updatedItems[index].volume_is_manual = value != null
    }

    // Recalculate total_price for this item
    if (field === 'quantity' || field === 'unit_price' || field === 'area') {
      updatedItems[index].total_price = computeItemTotal(updatedItems[index])
    }

    // Auto-calc area (m²) and volume (m³) from dimensions (length, depth, height in mm)
    // Only auto-update when the respective field is not marked as manual
    const curr = updatedItems[index]
    let autoAreaChanged = false
    let autoVolumeChanged = false
    const lengthMm = curr.length != null && isFinite(Number(curr.length)) ? Number(curr.length) : null
    const depthMm = curr.depth != null && isFinite(Number(curr.depth)) ? Number(curr.depth) : null
    const heightMm = curr.height != null && isFinite(Number(curr.height)) ? Number(curr.height) : null

    // When quantity changes, adjust area and volume proportionally (if baseline exists)
    // Also adjust components quantity proportionally
    if (field === 'quantity') {
      const newQuantity = Number(value || 0)
      const oldQty = Number(oldQuantity || 1)

      // Adjust area proportionally to quantity (if baseline_area exists)
      // area = baseline_area * quantity (e.g., if quantity x2, area x2)
      if (curr.baseline_area != null && curr.baseline_area > 0 && !curr.area_is_manual) {
        const newArea = curr.baseline_area * newQuantity
        const roundedArea = Math.round(newArea * 1e6) / 1e6
        if (curr.area == null || Math.abs(Number(curr.area) - roundedArea) > 1e-9) {
          curr.area = roundedArea
          autoAreaChanged = true
        }
      }
      // After auto area update, refresh total
      updatedItems[index].total_price = computeItemTotal(updatedItems[index])

      // Adjust volume proportionally to quantity (if baseline_volume exists)
      // volume = baseline_volume * quantity (e.g., if quantity x2, volume x2)
      if (curr.baseline_volume != null && curr.baseline_volume > 0 && !curr.volume_is_manual) {
        const newVolume = curr.baseline_volume * newQuantity
        const roundedVolume = Math.round(newVolume * 1e9) / 1e9
        if (curr.volume == null || Math.abs(Number(curr.volume) - roundedVolume) > 1e-12) {
          curr.volume = roundedVolume
          autoVolumeChanged = true
        }
      }

      // Adjust components quantity proportionally to product quantity
      // Công thức: Khi số lượng sản phẩm tăng thì số lượng vật tư tăng theo tỷ lệ
      // Ví dụ: Sản phẩm A số lượng 1, vật tư số lượng 1
      // Khi tăng sản phẩm A lên 2 → số lượng vật tư = 1 × 2 = 2
      // QUAN TRỌNG: Luôn tính từ baseline_quantity (số lượng vật tư cho 1 đơn vị sản phẩm) để tránh cộng dồn
      if (oldQty > 0 && newQuantity > 0 && curr.components && Array.isArray(curr.components) && curr.components.length > 0) {
        const updatedComponents = curr.components.map((component: any) => {
          // Lấy baseline_quantity (số lượng vật tư cho 1 đơn vị sản phẩm)
          // Nếu chưa có baseline_quantity, tính từ quantity hiện tại chia cho số lượng sản phẩm cũ
          const baselineQuantityPerUnit = component.baseline_quantity != null
            ? Number(component.baseline_quantity)
            : Number(component.quantity || 0) / oldQty

          // Tính số lượng vật tư mới = số lượng vật tư cho 1 đơn vị × số lượng sản phẩm mới
          const newComponentQuantity = baselineQuantityPerUnit * newQuantity
          const adjustedUnitPrice = Number(component.unit_price || 0)

          console.log('[Quantity] Adjusting component quantity from baseline', {
            expenseObjectId: component.expense_object_id,
            name: component.name,
            oldProductQuantity: oldQty,
            newProductQuantity: newQuantity,
            baselineQuantityPerUnit,
            oldComponentQuantity: Number(component.quantity || 0),
            newComponentQuantity
          })

          return {
            ...component,
            // Giữ nguyên baseline_quantity (số lượng vật tư cho 1 đơn vị sản phẩm)
            baseline_quantity: baselineQuantityPerUnit,
            // Cập nhật số lượng mới = số lượng vật tư cho 1 đơn vị × số lượng sản phẩm mới
            quantity: Math.max(0, newComponentQuantity),
            // Cập nhật thành tiền
            total_price: Math.max(0, newComponentQuantity) * adjustedUnitPrice
          }
        })

        // Cập nhật components với số lượng mới
        curr.components = updatedComponents
      }
    }

    if (autoCalcDimensions) {
      // When user edits kích thước, ưu tiên tự tính lại: bỏ cờ manual
      if (field === 'length' || field === 'height') {
        curr.area_is_manual = false
      }
      if (field === 'height') {
        curr.volume_is_manual = false
      }

      // Recompute area when length/height changes and area is not manual
      // Formula: area = (length × height / 1_000_000) × quantity (integrate quantity into calculation)
      if ((field === 'length' || field === 'height') && !curr.area_is_manual) {
        if (lengthMm != null && heightMm != null) {
          const quantity = Number(curr.quantity || 1)
          const baselineAreaPerUnit = (lengthMm * heightMm) / 1_000_000 // mm^2 -> m^2 per unit
          const computedArea = baselineAreaPerUnit * quantity // Multiply by quantity
          const rounded = Math.round(computedArea * 100) / 100 // Round to 2 decimal places
          if (curr.area == null || Math.abs(Number(curr.area) - rounded) > 0.01) {
            curr.area = rounded
            autoAreaChanged = true
            // Store baseline area per unit (not multiplied by quantity) - round to 2 decimal places
            if (curr.baseline_area == null) {
              curr.baseline_area = Math.round(baselineAreaPerUnit * 100) / 100
            }
            // Recalculate total_price after auto area update
            updatedItems[index].total_price = computeItemTotal(updatedItems[index])
          }
        } else {
          // If one dim missing, clear auto area (but only if not manual)
          if (curr.area != null) {
            curr.area = null
            autoAreaChanged = true
            // Recalculate total_price after clearing area
            updatedItems[index].total_price = computeItemTotal(updatedItems[index])
          }
        }
      }

      // Recompute volume when any of area/height/length/depth changes and volume is not manual
      // Formula: volume = (length × height × depth / 1_000_000_000) × quantity (integrate quantity into calculation)
      if ((field === 'height' || field === 'length' || field === 'depth' || field === 'area') && !curr.volume_is_manual) {
        const quantity = Number(curr.quantity || 1)
        let computedVolume: number | null = null
        let baselineVolumePerUnit: number | null = null

        if (lengthMm != null && heightMm != null && depthMm != null) {
          baselineVolumePerUnit = (lengthMm * heightMm * depthMm) / 1_000_000_000 // mm^3 -> m^3 per unit
          computedVolume = baselineVolumePerUnit * quantity // Multiply by quantity
        } else if (curr.area != null && heightMm != null) {
          // If using area, calculate volume per unit first
          const baselineAreaPerUnit = curr.baseline_area ?? Math.round((curr.area / quantity) * 100) / 100 // Get per-unit area, round to 2 decimal places
          baselineVolumePerUnit = baselineAreaPerUnit * (heightMm / 1000)
          computedVolume = baselineVolumePerUnit * quantity // Multiply by quantity
        }

        if (computedVolume != null && isFinite(computedVolume)) {
          const roundedV = Math.round(computedVolume * 1e9) / 1e9
          if (curr.volume == null || Math.abs(Number(curr.volume) - roundedV) > 1e-12) {
            curr.volume = roundedV
            autoVolumeChanged = true
            // Store baseline volume per unit (not multiplied by quantity)
            if (curr.baseline_volume == null && baselineVolumePerUnit != null) {
              curr.baseline_volume = baselineVolumePerUnit
            }
          }
        } else {
          if (curr.volume != null) {
            curr.volume = null
            autoVolumeChanged = true
          }
        }
      }
    }

    setItems(updatedItems)

    // Apply material adjustment rules when dimensions or quantity change (if enabled)
    // Avoid running while the user is actively editing the same field to prevent UI resets
    const newValue = value !== null ? Number(value) : null
    const isEditingSameField = !!editingCell && editingCell.index === index && editingCell.field === field
    if (autoAdjustEnabled && !isEditingSameField && newValue !== null && oldItem.components && oldItem.components.length > 0) {
      // For area and volume, always use baseline values for comparison (like manualAdjustItem does)
      // This ensures each product calculates adjustment based on its own baseline, not previous value
      if (field === 'area' && oldArea !== newValue) {
        const baselineArea = Number((curr as any).baseline_area ?? 0)
        const currArea = newValue
        if (baselineArea > 0) {
          await applyMaterialAdjustmentRules(index, 'area', baselineArea, currArea)
        }
      } else if (field === 'volume' && oldVolume !== null && oldVolume !== undefined && oldVolume !== newValue) {
        const baselineVolume = Number((curr as any).baseline_volume ?? 0)
        const currVolume = newValue
        if (baselineVolume > 0) {
          await applyMaterialAdjustmentRules(index, 'volume', baselineVolume, currVolume)
        }
      } else if (field === 'height' && oldHeight !== null && oldHeight !== undefined && oldHeight !== newValue) {
        await applyMaterialAdjustmentRules(index, 'height', oldHeight, newValue)
      } else if (field === 'length' && oldLength !== null && oldLength !== undefined && oldLength !== newValue) {
        await applyMaterialAdjustmentRules(index, 'length', oldLength, newValue)
      } else if (field === 'depth' && oldDepth !== null && oldDepth !== undefined && oldDepth !== newValue) {
        await applyMaterialAdjustmentRules(index, 'depth', oldDepth, newValue)
      } else if (field === 'quantity' && oldQuantity !== null && oldQuantity !== undefined && oldQuantity !== newValue) {
        await applyMaterialAdjustmentRules(index, 'quantity', oldQuantity, newValue)
      }

      // Also trigger rules if auto-calculated area/volume changed due to dimension edits
      // Use baseline values for area/volume comparisons
      if (autoCalcDimensions && autoAdjustEnabled && autoAreaChanged && curr.area != null && oldArea !== curr.area) {
        const baselineArea = Number((curr as any).baseline_area ?? 0)
        const currArea = Number(curr.area)
        if (baselineArea > 0) {
          await applyMaterialAdjustmentRules(index, 'area', baselineArea, currArea)
        }
      }
      if (autoCalcDimensions && autoAdjustEnabled && autoVolumeChanged && curr.volume != null && oldVolume !== curr.volume) {
        const baselineVolume = Number((curr as any).baseline_volume ?? 0)
        const currVolume = Number(curr.volume)
        if (baselineVolume > 0) {
          await applyMaterialAdjustmentRules(index, 'volume', baselineVolume, currVolume)
        }
      }
    }

    // Schedule auto adjust 5s after last change
    if (['area', 'volume', 'height', 'length', 'depth', 'quantity'].includes(field as string)) {
      if (field === 'length' || field === 'height') {
        // if area auto-changed, schedule for area using baseline
        if (autoAreaChanged && curr.area != null) {
          const baselineArea = Number((curr as any).baseline_area ?? 0)
          if (baselineArea > 0) {
            scheduleAutoAdjust(index, 'area', baselineArea, curr.area as any)
          }
        }
      }
      if (autoVolumeChanged && curr.volume != null) {
        // Use baseline for volume
        const baselineVolume = Number((curr as any).baseline_volume ?? 0)
        if (baselineVolume > 0) {
          scheduleAutoAdjust(index, 'volume', baselineVolume, curr.volume as any)
        }
      }
      // also schedule for the direct field change (dimension-based rules)
      // For area/volume, use baseline values; for others, use old values
      let oldValueForSchedule: any
      if (field === 'area') {
        const baselineArea = Number((curr as any).baseline_area ?? 0)
        oldValueForSchedule = baselineArea > 0 ? baselineArea : oldArea
      } else if (field === 'volume') {
        const baselineVolume = Number((curr as any).baseline_volume ?? 0)
        oldValueForSchedule = baselineVolume > 0 ? baselineVolume : oldVolume
      } else {
        const oldMap: any = { area: oldArea, volume: oldVolume, height: oldHeight, length: oldLength, depth: oldDepth, quantity: oldQuantity }
        oldValueForSchedule = oldMap[field as any]
      }
      scheduleAutoAdjust(index, field as any, oldValueForSchedule, newValue as any)
    }
  }

  // Editable components (vật tư) fields per quote item
  const updateComponentField = (
    itemIndex: number,
    expenseObjectId: string,
    field: 'unit' | 'unit_price' | 'quantity',
    value: string | number
  ) => {
    const updated = [...items]
    const comps = Array.isArray(updated[itemIndex].components) ? [...(updated[itemIndex].components as any[])] : []
    const idx = comps.findIndex((c: any) => String(c.expense_object_id) === String(expenseObjectId))
    let comp: any
    if (idx >= 0) {
      comp = { ...comps[idx] }
    } else {
      comp = { expense_object_id: String(expenseObjectId), name: headerComponents.find(h => h.expense_object_id === expenseObjectId)?.name || expenseObjectId, unit: '', unit_price: 0, quantity: 0, total_price: 0 }
    }
    comp[field] = value
    const qty = Number(comp.quantity || 0)
    const price = Number(comp.unit_price || 0)
    comp.total_price = qty * price
    if (idx >= 0) comps[idx] = comp
    else comps.push(comp)
      ; (updated[itemIndex] as any).components = comps
    // Recalculate item total_price using unit price × quantity × area logic
    updated[itemIndex].total_price = computeItemTotal(updated[itemIndex])
    setItems(updated)
  }

  const openProductModal = (itemIndex: number) => {
    setSelectedItemIndex(itemIndex)
    setShowProductModal(true)
  }

  const selectProduct = (product: Product) => {
    console.log('🔍 selectProduct called with:', product)
    console.log('🔍 Product dimensions:', {
      area: product.area,
      volume: product.volume,
      height: product.height,
      length: product.length,
      depth: product.depth
    })

        const fillFromProductComponents = async () => {
      try {
        // Load product with components (in case not included)
        const { data: prod } = await supabase
          .from('products')
              .select('id, name, description, unit, price, area, volume, height, length, depth, actual_material_components, product_components')
          .eq('id', product.id)
          .maybeSingle()
            const actualComps: any[] = Array.isArray(prod?.actual_material_components) ? (prod!.actual_material_components as any[]) : []
            const plannedComps: any[] = Array.isArray(prod?.product_components) ? (prod!.product_components as any[]) : []
            // Ưu tiên dùng vật tư thực tế; nếu chưa có thì fallback vật tư kế hoạch
            const components: any[] = actualComps.length > 0 ? actualComps : plannedComps
        // If no components and no target index, nothing to do
        if (selectedItemIndex === null && components.length === 0) return

        if (components.length === 0) {
          // fallback to original single-line behavior
          if (selectedItemIndex !== null) {
            const updatedItems = [...items]
            const newItem = {
              ...updatedItems[selectedItemIndex],
              product_service_id: product.id, // Lưu id của sản phẩm
              name_product: product.name,
              description: product.description || '',
              unit: product.unit || '',
              unit_price: (product as any).unit_price || 0,
              total_price: 0, // will compute below after area fields are set
              area: (product as any).area ?? null,
              baseline_area: (product as any).area ?? (((product as any).length != null && (product as any).height != null) ? Math.round(((Number((product as any).length) * Number((product as any).height)) / 1_000_000) * 100) / 100 : null),
              volume: (product as any).volume ?? null,
              baseline_volume: (product as any).volume ?? (((product as any).length != null && (product as any).height != null && (product as any).depth != null) ? (((Number((product as any).length) * Number((product as any).height) * Number((product as any).depth)) / 1_000_000_000)) : null),
              height: (product as any).height ?? null,
              length: (product as any).length ?? null,
              depth: (product as any).depth ?? null
            }
            newItem.total_price = computeItemTotal({
              ...newItem,
              total_price: 0
            } as any)
            updatedItems[selectedItemIndex] = newItem
            setItems(updatedItems)
          }
          return
        }

        // Populate only the first component onto the current row (single-row presentation)
        const first = components[0]
        const cQty = Number(first.quantity || 0)
        const cPrice = Number(first.unit_price || 0)
        // fetch names for all components
        const compIds = Array.from(new Set(components.map((c: any) => String(c.expense_object_id)).filter(Boolean)))
        let compNameMap: Record<string, string> = {}
        if (compIds.length > 0) {
          const { data: expAll } = await supabase
            .from('expense_objects')
            .select('id, name')
            .in('id', compIds)
          expAll?.forEach((e: any) => { compNameMap[e.id] = e.name })
        }
        const compNameSingle = compNameMap[String(first.expense_object_id)]
        if (selectedItemIndex !== null) {
          const updatedItems = [...items]
          const current = updatedItems[selectedItemIndex]
          updatedItems[selectedItemIndex] = {
            ...current,
            // keep base product values
            product_service_id: product.id, // Lưu id của sản phẩm
            name_product: product.name,
            description: product.description || current.description,
            unit: product.unit || current.unit,
            unit_price: (product as any).unit_price ?? current.unit_price,
            total_price: 0, // compute after area fields below
            area: (product as any).area ?? current.area ?? null,
            baseline_area: (product as any).area ?? current.baseline_area ?? (((product as any).length != null && (product as any).height != null) ? Math.round(((Number((product as any).length) * Number((product as any).height)) / 1_000_000) * 100) / 100 : current.baseline_area ?? null),
            volume: (product as any).volume ?? current.volume ?? null,
            baseline_volume: (product as any).volume ?? current.baseline_volume ?? (((product as any).length != null && (product as any).height != null && (product as any).depth != null) ? (((Number((product as any).length) * Number((product as any).height) * Number((product as any).depth)) / 1_000_000_000)) : current.baseline_volume ?? null),
            height: (product as any).height ?? current.height ?? null,
            length: (product as any).length ?? current.length ?? null,
            depth: (product as any).depth ?? current.depth ?? null,
            // component-sourced fields
            expense_object_id: String(first.expense_object_id || ''),
            component_name: compNameSingle,
            component_unit: first.unit || '',
            component_unit_price: cPrice,
            component_quantity: cQty,
            component_total_price: cQty * cPrice,
            components: components.map((c: any) => {
              const qty = Number(c.quantity || 0)
              return {
                expense_object_id: String(c.expense_object_id || ''),
                name: compNameMap[String(c.expense_object_id)] || String(c.expense_object_id || ''),
                unit: c.unit || '',
                unit_price: Number(c.unit_price || 0),
                quantity: qty,
                total_price: qty * Number(c.unit_price || 0),
                // Lưu baseline_quantity (số lượng ban đầu từ product) để tính lại từ baseline mỗi lần áp dụng
                // Đảm bảo không cộng dồn khi bấm "Áp dụng" nhiều lần
                baseline_quantity: qty
              }
            })
          }
          updatedItems[selectedItemIndex].total_price = computeItemTotal(updatedItems[selectedItemIndex] as any)
          setItems(updatedItems)
        }
      } catch (_) {
        // ignore
      }
    }

    fillFromProductComponents().finally(() => {
      setShowProductModal(false)
      setSelectedItemIndex(null)
    })
  }

  // Hàm kiểm tra tỷ lệ lợi nhuận thấp
  const checkLowProfitItems = (): Array<{ name: string; percentage: number }> => {
    const lowProfit: Array<{ name: string; percentage: number }> = []

    items.forEach((item) => {
      const components = Array.isArray(item.components) ? item.components : []
      const materialCost = components.reduce((sum, comp) => sum + (Number(comp.total_price) || 0), 0)
      const productPrice = Number(item.total_price) || 0
      const itemProfit = productPrice - materialCost
      const itemProfitPercentage = productPrice > 0 ? (itemProfit / productPrice) * 100 : 0

      // Kiểm tra nếu tỷ lệ lợi nhuận < 10%
      if (itemProfitPercentage < 10) {
        lowProfit.push({
          name: item.name_product || item.description || 'Sản phẩm không tên',
          percentage: itemProfitPercentage
        })
      }
    })

    return lowProfit
  }

  // Hàm thực hiện tạo báo giá (tách ra để có thể gọi lại sau khi cảnh báo)
  const doCreateQuote = async () => {
    setSubmitting(true)

    try {
      // Use created_by from form selection
      const created_by = formData.created_by || null

      // Helper function to generate customer code
      const generateCustomerCode = async (): Promise<string> => {
        try {
          // Try to get next customer code from API
          const token = localStorage.getItem('access_token')
          const response = await fetch('/api/customers/next-customer-code', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            return data.next_customer_code || 'CUS001'
          }
        } catch (error) {
          console.warn('Failed to get customer code from API, generating locally:', error)
        }
        
        // Fallback: generate locally
        try {
          const { data: existingCustomers } = await supabase
            .from('customers')
            .select('customer_code')
            .order('customer_code', { ascending: false })
            .limit(1)
          
          if (existingCustomers && existingCustomers.length > 0) {
            const lastCode = existingCustomers[0].customer_code || 'CUS000'
            const match = lastCode.match(/CUS(\d+)/)
            if (match) {
              const nextNum = parseInt(match[1]) + 1
              return `CUS${nextNum.toString().padStart(3, '0')}`
            }
          }
        } catch (error) {
          console.warn('Failed to generate customer code locally:', error)
        }
        
        // Final fallback
        return 'CUS001'
      }

      // Create customer if new customer data is provided
      let customerId = formData.customer_id
      let newCustomerCreated = false
      let newCustomerName = ''
      if (!customerId && newCustomer.name && newCustomer.address) {
        // Generate customer code first
        const customerCode = await generateCustomerCode()
        
        const { data: newCustomerData, error: customerError } = await supabase
          .from('customers')
          .insert({
            customer_code: customerCode,
            name: newCustomer.name.trim(),
            type: newCustomer.type,
            address: newCustomer.address.trim() || null,
            city: newCustomer.city.trim() || null,
            country: newCustomer.country.trim() || 'Vietnam',
            phone: newCustomer.phone.trim() || null,
            email: newCustomer.email.trim() || null,
            tax_id: newCustomer.tax_id.trim() || null,
            credit_limit: newCustomer.credit_limit || 0,
            payment_terms: newCustomer.payment_terms || 30,
            notes: newCustomer.notes.trim() || null,
            status: 'active'
          })
          .select()
          .single()

        if (customerError) {
          throw new Error(`Lỗi tạo khách hàng: ${customerError.message}`)
        }

        customerId = newCustomerData.id
        newCustomerCreated = true
        newCustomerName = newCustomerData.name
        console.log('Created new customer:', newCustomerData)
        
        // Refresh customers list to include the new customer
        await fetchCustomers()
      }

      // Helper function to generate project code
      const generateProjectCode = async (): Promise<string> => {
        try {
          const { data: existingProjects } = await supabase
            .from('projects')
            .select('project_code')
            .order('created_at', { ascending: false })
            .limit(1)
          
          if (existingProjects && existingProjects.length > 0) {
            const lastCode = existingProjects[0].project_code || 'PRJ000'
            const match1 = lastCode.match(/#PRJ(\d+)/)
            const match2 = lastCode.match(/PRJ(\d+)/)
            
            if (match1) {
              const nextNum = parseInt(match1[1]) + 1
              return `PRJ${nextNum.toString().padStart(3, '0')}`
            } else if (match2) {
              const nextNum = parseInt(match2[1]) + 1
              return `PRJ${nextNum.toString().padStart(3, '0')}`
            }
          }
        } catch (error) {
          console.warn('Failed to generate project code:', error)
        }
        
        // Fallback
        return 'PRJ001'
      }

      // Create project if new project data is provided OR if customer exists but project is new
      let projectId = formData.project_id
      let newProjectCreated = false
      let newProjectName = ''
      if (!projectId && newProject.name && customerId) {
        // Use project name from form (already auto-generated)
        const projectName = newProject.name.trim() || (newCustomer.name || 'Dự án mới')
        newProjectName = projectName

        // Generate project code
        const projectCode = await generateProjectCode()

        const { data: newProjectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            project_code: projectCode,
            name: projectName,
            customer_id: customerId,
            status: 'planning',
            priority: 'medium',
            start_date: new Date().toISOString().split('T')[0] // Add start_date (required field)
          })
          .select()
          .single()

        if (projectError) {
          throw new Error(`Lỗi tạo dự án: ${projectError.message}`)
        }

        projectId = newProjectData.id
        newProjectCreated = true
        console.log('Created new project:', newProjectData)
        
        // Tạo task trong nhóm nhiệm vụ sau khi tạo project thành công
        if (selectedTaskGroupId) {
          try {
            const taskData = {
              title: projectName,
              description: `Nhiệm vụ cho dự án ${projectName}`,
              status: 'todo',
              priority: 'medium',
              group_id: selectedTaskGroupId,
              project_id: newProjectData.id,
              start_date: new Date().toISOString().split('T')[0]
            }

            await apiPost('/api/tasks', taskData)
            console.log('Task created successfully for project')
          } catch (taskError) {
            console.error('Error creating task:', taskError)
            // Không throw error để không làm gián đoạn việc tạo project
          }
        }
        
        // Refresh projects list to include the new project
        if (customerId) {
          await fetchProjectsByCustomer(customerId)
        }
      }

      // Create or update quote directly in Supabase
      const quoteData = {
        quote_number: formData.quote_number,
        customer_id: customerId || null,
        project_id: projectId || null,
        issue_date: formData.issue_date || null,
        valid_until: formData.valid_until,
        subtotal: formData.subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: formData.tax_amount,
        total_amount: formData.total_amount,
        currency: formData.currency,
        status: formData.status,
        notes: formData.notes || null,
        terms: formData.terms || null,
        created_by: quoteId ? undefined : created_by, // Don't update created_by when editing
        employee_in_charge_id: created_by
      }

      // Debug logging
      console.log(quoteId ? 'Updating quote with data:' : 'Creating quote with data:', quoteData)

      let quote: any
      if (quoteId) {
        // Update existing quote
        const { data: updatedQuote, error: quoteError } = await supabase
          .from('quotes')
          .update(quoteData)
          .eq('id', quoteId)
          .select()
          .single()

        if (quoteError) {
          console.error('Quote update error:', quoteError)
          throw new Error(`Lỗi cập nhật báo giá: ${quoteError.message}`)
        }

        quote = updatedQuote
        console.log('Quote updated successfully:', quote)
      } else {
        // Insert new quote
        const { data: newQuote, error: quoteError } = await supabase
          .from('quotes')
          .insert(quoteData)
          .select()
          .single()

        if (quoteError) {
          console.error('Quote creation error:', quoteError)
          throw new Error(`Lỗi tạo báo giá: ${quoteError.message}`)
        }

        quote = newQuote
        console.log('Quote created successfully:', quote)
      }

      const currentQuoteId = quoteId || quote.id

      // Delete existing quote items if updating
      if (quoteId) {
        const { error: deleteError } = await supabase
          .from('quote_items')
          .delete()
          .eq('quote_id', currentQuoteId)

        if (deleteError) {
          console.error('Error deleting old quote items:', deleteError)
          // Continue anyway
        }
      }

      // Insert/update quote items
      if (items.length > 0) {
        const quoteItems = items.map(item => {
          // Format components as JSONB array for product_components column
          // Structure: [{"expense_object_id":"<uuid>", "quantity":0, "unit_price":0, "unit":"", "total_price":0, "name":""}]
          const comps: any[] = Array.isArray((item as any).components) ? ((item as any).components as any[]) : []
          const productComponents = comps.map((c: any) => ({
            expense_object_id: c.expense_object_id || null,
            name: c.name || null,
            unit: c.unit || '',
            unit_price: Number(c.unit_price || 0),
            quantity: Number(c.quantity || 0),
            total_price: Number(c.total_price || 0)
          }))

          return {
            quote_id: currentQuoteId,
            product_service_id: item.product_service_id || null, // Lưu id của sản phẩm
            name_product: item.name_product,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            total_price: item.total_price,
            tax_rate: item.tax_rate ?? formData.tax_rate ?? 10,  // Save tax_rate for each item
            area: item.area,
            volume: item.volume,
            height: item.height,
            length: item.length,
            depth: item.depth,
            product_components: productComponents.length > 0 ? productComponents : [] // JSONB column - empty array if no components
          }
        })

        // Insert quote items with tax_rate
        const { data: insertedItems, error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems)
          .select('id')

        if (itemsError) {
          const errorMessage = itemsError.message || JSON.stringify(itemsError)
          console.error('Error saving quote items:', itemsError)
          console.error('Items data:', JSON.stringify(quoteItems, null, 2))
          
          // If error is about tax_rate column not existing, log warning but continue
          if (errorMessage.includes('tax_rate') || errorMessage.includes('column') || errorMessage.includes('does not exist')) {
            console.warn('⚠️ tax_rate column may not exist in quote_items table. Please run migration: database/migrations/add_tax_rate_to_quote_items.sql')
            // Try inserting without tax_rate as fallback
            const quoteItemsWithoutTax = quoteItems.map(item => {
              const { tax_rate, ...itemWithoutTaxRate } = item
              return itemWithoutTaxRate
            })
            
            const retryResult = await supabase
              .from('quote_items')
              .insert(quoteItemsWithoutTax)
              .select('id')
            
            if (retryResult.error) {
              console.error('Error saving quote items (retry without tax_rate):', retryResult.error)
            } else {
              console.log('Quote items saved successfully (without tax_rate):', retryResult.data)
            }
          }
        } else {
          console.log('✅ Quote items saved successfully with tax_rate:', insertedItems)
        }
        // Components are already saved in product_components JSONB column, no need to insert separately
      }

      // Build success message with created customer/project info
      let successDetails = []
      if (newCustomerCreated) {
        successDetails.push(`✅ Đã tạo khách hàng mới: <strong>${newCustomerName}</strong>`)
      }
      if (newProjectCreated) {
        successDetails.push(`✅ Đã tạo dự án mới: <strong>${newProjectName}</strong>`)
      }
      
      const detailsHtml = successDetails.length > 0 
        ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 13px; line-height: 1.6;">
            ${successDetails.join('<br>')}
          </div>`
        : ''

      // Show success notification
      const successMessage = document.createElement('div')
      successMessage.innerHTML = `
        <div style="
          position: fixed; 
          top: 20px; 
          right: 20px; 
          background: #27ae60; 
          color: white; 
          padding: 15px 20px; 
          border-radius: 5px; 
          z-index: 10000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          animation: slideIn 0.3s ease-out;
          max-width: 400px;
        ">
          <div style="font-size: 15px; font-weight: 600; margin-bottom: ${successDetails.length > 0 ? '8px' : '0'};">
            ✅ Báo giá đã được ${quoteId ? 'cập nhật' : 'tạo'} thành công!
          </div>
          ${detailsHtml}
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `
      document.body.appendChild(successMessage)

      // Auto remove success message after 7 seconds (longer if there are details)
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage)
        }
      }, successDetails.length > 0 ? 7000 : 5000)

      onSuccess()
      onClose()
      resetForm()
      setShowProfitWarningDialog(false)
      setLowProfitItems([])
    } catch (error) {
      console.error(`Error ${quoteId ? 'updating' : 'creating'} quote:`, error)
      alert(`Có lỗi xảy ra khi ${quoteId ? 'cập nhật' : 'tạo'} báo giá: ` + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.quote_number.trim()) {
        throw new Error('Vui lòng nhập số báo giá')
      }
      if (!formData.customer_id && (!newCustomer.name || !newCustomer.address)) {
        throw new Error('Vui lòng chọn khách hàng hoặc nhập thông tin khách hàng mới')
      }
      if (!formData.valid_until) {
        throw new Error('Vui lòng chọn ngày hết hạn')
      }
      if (items.length === 0 || items.every(item => !item.name_product.trim())) {
        throw new Error('Vui lòng thêm ít nhất một sản phẩm')
      }
      // Dimensions are optional - allow null values for length and depth
      if (!formData.created_by) {
        throw new Error('Vui lòng chọn nhân viên tạo báo giá')
      }

      // Kiểm tra tỷ lệ lợi nhuận thấp
      const lowProfit = checkLowProfitItems()

      if (lowProfit.length > 0) {
        // Hiển thị dialog cảnh báo
        setLowProfitItems(lowProfit)
        setShowProfitWarningDialog(true)
        return // Dừng lại, không tạo báo giá
      }

      // Nếu không có cảnh báo, tiếp tục tạo báo giá
      await doCreateQuote()
    } catch (error) {
      console.error('Error validating quote:', error)
      alert('Có lỗi xảy ra: ' + (error as Error).message)
    }
  }

  const resetForm = () => {
    setFormData({
      quote_number: '',
      customer_id: '',
      project_id: '',
      created_by: '',
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 0,
      tax_rate: 10,
      tax_amount: 0,
      total_amount: 0,
      discount_amount: 0,
      currency: 'VND',
      status: 'draft',
      notes: '',
      terms: 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.'
    })
    setNewCustomer({ 
      name: '', 
      type: 'individual',
      address: '', 
      city: '',
      country: 'Vietnam',
      phone: '', 
      email: '',
      tax_id: '',
      credit_limit: 0,
      payment_terms: 30,
      notes: ''
    })
    setNewProject({ name: '' })
    setItems([{
      name_product: '',
      description: '',
      quantity: 1,
      unit: '',
      unit_price: 0,
      total_price: 0,
      area: null,
      volume: null,
      height: null,
      length: null,
      depth: null,
      area_is_manual: false,
      volume_is_manual: false
    }])
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 3
    }).format(value)
  }

  const parseNumber = (raw: string) => {
    const cleaned = raw.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(/,/g, '.')
    const n = Number(cleaned)
    return isNaN(n) ? 0 : n
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Hàm xác định màu cảnh báo cho tỷ lệ lợi nhuận
  const getProfitPercentageColor = (percentage: number): string => {
    if (percentage < 0) {
      return 'text-red-600' // Âm: màu đỏ
    } else if (percentage < 10) {
      return 'text-red-600' // Dưới 10%: màu đỏ
    } else if (percentage < 15) {
      return 'text-yellow-600' // Dưới 15%: màu vàng
    } else {
      return 'text-green-600' // >= 15%: màu xanh lá
    }
  }

  const EditableNumberCell = ({
    value,
    onChange,
    format,
    step,
    min,
    placeholder,
    index,
    field,
    commitOnChange,
    displayFractionDigits,
    tabIndex
  }: {
    value: number | null
    onChange: (v: number | null) => void
    format: 'currency' | 'number'
    step?: number
    min?: number
    placeholder?: string
    index: number
    field: string
    commitOnChange?: boolean
    displayFractionDigits?: number
    tabIndex?: number
  }) => {
    const [text, setText] = useState<string>('')
    const inputRef = useRef<HTMLInputElement>(null)
    const cursorPositionRef = useRef<number | null>(null)
    const isInitializedRef = useRef(false)
    const isEditing = editingCell && editingCell.index === index && editingCell.field === field

    // Initialize text when starting to edit (only once when entering edit mode)
    useEffect(() => {
      if (isEditing && !isInitializedRef.current) {
        const initialValue = value == null ? '' : String(value)
        setText(initialValue)
        isInitializedRef.current = true
        // Focus and set cursor at end
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
            // Only set selection range for text inputs, not number inputs
            if (inputRef.current.type === 'text') {
              const len = initialValue.length
              inputRef.current.setSelectionRange(len, len)
            }
          }
        }, 0)
      } else if (!isEditing) {
        // Reset when exiting edit mode
        isInitializedRef.current = false
        cursorPositionRef.current = null
      }
    }, [isEditing, value])

    // Restore focus and cursor position after re-render when commitOnChange is enabled
    useEffect(() => {
      if (isEditing && inputRef.current && cursorPositionRef.current !== null) {
        const pos = cursorPositionRef.current
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
            // Only set selection range for text inputs, not number inputs
            if (inputRef.current.type === 'text') {
              inputRef.current.setSelectionRange(pos, pos)
            }
            cursorPositionRef.current = null
          }
        }, 0)
      }
    }, [text, isEditing])

    if (!isEditing) {
      const display = value == null
        ? ''
        : (format === 'currency'
          ? formatCurrency(value)
          : (displayFractionDigits != null
            ? new Intl.NumberFormat('vi-VN', { minimumFractionDigits: displayFractionDigits, maximumFractionDigits: displayFractionDigits }).format(value)
            : formatNumber(value)))
      return (
        <div
          className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-right bg-white cursor-text"
          onClick={() => setEditingCell({ index, field })}
          onFocus={(e) => {
            // Auto-open edit mode when focused via Tab
            if (!isEditing) {
              const targetElement = e.currentTarget
              setEditingCell({ index, field })
              // Focus the input after state update
              setTimeout(() => {
                // Find the input in the same container (the div will be replaced by input)
                // Look for input that is a direct child of the parent container
                const parentContainer = targetElement.parentElement
                if (parentContainer) {
                  const input = parentContainer.querySelector('input')
                  if (input) {
                    input.focus()
                    // Set cursor to end
                    if (input instanceof HTMLInputElement && input.type === 'text') {
                      const len = input.value.length
                      input.setSelectionRange(len, len)
                    }
                  }
                }
              }, 50)
            }
          }}
          tabIndex={tabIndex ?? 0}
          title={display}
        >
          {display || (placeholder || '')}
        </div>
      )
    }

    return (
      <input
        ref={inputRef}
        type={format === 'number' ? 'number' : 'text'}
        value={text}
        tabIndex={tabIndex}
        onChange={(e) => {
          const nvRaw = e.target.value
          // Save cursor position before state update
          if (e.target instanceof HTMLInputElement) {
            cursorPositionRef.current = e.target.selectionStart
          }
          setText(nvRaw)
          if (commitOnChange) {
            const parsed = nvRaw.trim() === '' ? null : (format === 'number' ? Number(nvRaw) : parseNumber(nvRaw))
            onChange(parsed)
          }
        }}
        onBlur={() => {
          const nv = text.trim() === '' ? null : parseNumber(text)
          onChange(nv)
          setEditingCell(null)
          cursorPositionRef.current = null
          isInitializedRef.current = false
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const nv = text.trim() === '' ? null : parseNumber(text)
            onChange(nv)
            setEditingCell(null)
            cursorPositionRef.current = null
            isInitializedRef.current = false
          } else if (e.key === 'Tab') {
            // Commit value on Tab and move to next input
            const nv = text.trim() === '' ? null : parseNumber(text)
            onChange(nv)
            // Find next focusable input using tabIndex
            const currentInput = e.target as HTMLInputElement
            const currentTabIndex = currentInput.tabIndex || 0
            const isShiftTab = e.shiftKey
            setEditingCell(null)
            cursorPositionRef.current = null
            isInitializedRef.current = false
            // Move to next/previous input after a short delay to allow state update
            setTimeout(() => {
              // Find all focusable elements sorted by tabIndex
              const allFocusable = Array.from(document.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
                .filter(el => {
                  const tabIdx = (el as HTMLElement).tabIndex
                  return tabIdx >= 0
                })
                .sort((a, b) => {
                  const aIdx = (a as HTMLElement).tabIndex
                  const bIdx = (b as HTMLElement).tabIndex
                  return aIdx - bIdx
                }) as HTMLElement[]
              
              const currentIndex = allFocusable.findIndex(el => {
                // Match by tabIndex, or if it's the same element
                return el.tabIndex === currentTabIndex || el === currentInput
              })
              if (currentIndex >= 0) {
                let targetInput: HTMLElement | null = null
                if (isShiftTab && currentIndex > 0) {
                  // Shift+Tab: move to previous input
                  targetInput = allFocusable[currentIndex - 1]
                } else if (!isShiftTab && currentIndex < allFocusable.length - 1) {
                  // Tab: move to next input
                  targetInput = allFocusable[currentIndex + 1]
                }
                if (targetInput) {
                  targetInput.focus()
                  // If it's an EditableNumberCell div (has cursor-text class), trigger edit mode
                  if (targetInput.classList.contains('cursor-text')) {
                    setTimeout(() => targetInput.click(), 0)
                  }
                }
              }
            }, 10)
          } else if (e.key === 'Escape') {
            setEditingCell(null)
            cursorPositionRef.current = null
            isInitializedRef.current = false
          }
        }}
        className="w-full border border-blue-400 rounded-md px-2 py-1 text-xs text-black text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder={placeholder}
        inputMode="decimal"
        step={format === 'number' ? step : undefined}
        min={format === 'number' ? min : undefined}
      />
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      {/* Full screen container */}
      <div className="fixed inset-0 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-white flex-shrink-0" data-tour-id="quote-form-header">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-black mr-3" />
            <h1 className="text-xl font-semibold text-black">{quoteId ? 'Chỉnh sửa báo giá' : 'Tạo báo giá mới'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => startQuoteTour()}
              disabled={isQuoteTourRunning || submitting}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${isQuoteTourRunning || submitting
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-white bg-blue-600 hover:bg-blue-700'
                }`}
              title="Bắt đầu hướng dẫn tạo báo giá"
            >
              <CircleHelp className="h-4 w-4" />
              <span>Hướng dẫn</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <X className="h-5 w-5 text-black" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="w-full">
            {/* Basic Information */}
            <div className="mb-8" data-tour-id="quote-form-basic-info">
              <h2 className="text-lg font-medium text-black mb-4">Thông tin cơ bản</h2>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Số báo giá</label>
                  <input
                    type="text"
                    value={formData.quote_number}
                    onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="QUO-20241225-ABC123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Khách hàng</label>
                  {loading ? (
                    <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                      <span className="text-sm text-black">Đang tải...</span>
                    </div>
                  ) : (
                    <>
                      <select
                        value={formData.customer_id}
                        onChange={(e) => {
                          setFormData({ ...formData, customer_id: e.target.value })
                          if (e.target.value) {
                            // Reset new customer when selecting existing
                            setNewCustomer({ 
                              name: '', 
                              type: 'individual',
                              address: '', 
                              city: '',
                              country: 'Vietnam',
                              phone: '', 
                              email: '',
                              tax_id: '',
                              credit_limit: 0,
                              payment_terms: 30,
                              notes: ''
                            })
                          }
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                        required
                      >
                        <option value="">Chọn khách hàng hoặc nhập mới</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} {customer.email ? `(${customer.email})` : ''}
                          </option>
                        ))}
                      </select>
                      {!formData.customer_id && (
                        <div className="mt-2 space-y-3 p-4 border border-gray-300 rounded-md bg-gray-50 max-h-96 overflow-y-auto">
                          <div className="text-xs font-semibold text-gray-800 mb-2">Thông tin cơ bản</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Loại khách hàng</label>
                              <select
                                value={newCustomer.type}
                                onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value as 'individual' | 'company' | 'government' })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="individual">Cá nhân</option>
                                <option value="company">Công ty</option>
                                <option value="government">Cơ quan nhà nước</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Tên khách hàng *</label>
                              <input
                                type="text"
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Nhập tên khách hàng"
                                required={!formData.customer_id}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Địa chỉ *</label>
                            <input
                              type="text"
                              value={newCustomer.address}
                              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Nhập địa chỉ"
                              required={!formData.customer_id}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Thành phố</label>
                              <input
                                type="text"
                                value={newCustomer.city}
                                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Thành phố"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Quốc gia</label>
                              <input
                                type="text"
                                value={newCustomer.country}
                                onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Quốc gia"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Số điện thoại</label>
                              <input
                                type="text"
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="SĐT"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                              <input
                                type="email"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Email"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Mã số thuế</label>
                            <input
                              type="text"
                              value={newCustomer.tax_id}
                              onChange={(e) => setNewCustomer({ ...newCustomer, tax_id: e.target.value })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Mã số thuế"
                            />
                          </div>
                          <div className="text-xs font-semibold text-gray-800 mb-2 mt-3">Thông tin tài chính</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Hạn mức tín dụng (VND)</label>
                              <input
                                type="number"
                                value={newCustomer.credit_limit}
                                onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: Number(e.target.value) || 0 })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Điều khoản thanh toán (ngày)</label>
                              <input
                                type="number"
                                value={newCustomer.payment_terms}
                                onChange={(e) => setNewCustomer({ ...newCustomer, payment_terms: Number(e.target.value) || 30 })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="30"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
                            <textarea
                              value={newCustomer.notes}
                              onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                              rows={2}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Ghi chú"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Dự án</label>
                  {loadingProjects && formData.customer_id ? (
                    <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                      <span className="text-sm text-black">Đang tải dự án...</span>
                    </div>
                  ) : (
                    <>
                      {formData.customer_id && (
                        <select
                          value={formData.project_id}
                          onChange={(e) => {
                            setFormData({ ...formData, project_id: e.target.value })
                            if (e.target.value) {
                              // Reset new project when selecting existing
                              setNewProject({ name: '' })
                            }
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                        >
                          <option value="">Chọn dự án hoặc nhập mới</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.project_code} - {project.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {(!formData.project_id || !formData.customer_id) && (
                        <div className="mt-2 space-y-2 p-3 border border-gray-300 rounded-md bg-gray-50">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tên dự án *</label>
                            <input
                              type="text"
                              value={newProject.name}
                              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Tự động tạo từ khách hàng - địa chỉ"
                              required={!formData.project_id}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nhóm nhiệm vụ *</label>
                            <select
                              value={selectedTaskGroupId}
                              onChange={(e) => setSelectedTaskGroupId(e.target.value)}
                              disabled={loadingTaskGroups}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              required={!formData.project_id}
                            >
                              <option value="">{loadingTaskGroups ? 'Đang tải...' : 'Chọn nhóm'}</option>
                              {taskGroups.map(group => (
                                <option key={group.id} value={group.id}>
                                  {group.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Nhiệm vụ sẽ được tạo tự động trong nhóm này khi tạo dự án
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Tiền tệ</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Nhân viên tạo báo giá</label>
                  {loadingEmployees ? (
                    <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                      <span className="text-sm text-black">Đang tải nhân viên...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.created_by}
                      onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Chọn nhân viên</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} {employee.email ? `(${employee.email})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Ngày phát hành</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Ngày hết hạn</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="draft">Nháp</option>
                    <option value="sent">Đã gửi</option>
                    <option value="viewed">Đã xem</option>
                    <option value="accepted">Đã chấp nhận</option>
                    <option value="declined">Đã từ chối</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-8" data-tour-id="quote-form-items">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-black">Sản phẩm/Dịch vụ</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={manualAdjustAll}
                    disabled={!rulesLoaded || manualAdjusting}
                    data-tour-id="quote-form-area-rules"
                    className={`flex items-center px-3 py-2 rounded-md text-sm ${(!rulesLoaded || manualAdjusting) ? 'bg-purple-400 text-white opacity-70 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                    title="Áp dụng điều chỉnh ngay cho tất cả dòng"
                  >
                    {manualAdjusting ? 'Đang áp dụng...' : 'Áp dụng điều chỉnh'}
                  </button>
                  {rulesLoaded && (
                    <button
                      onClick={() => setShowRulesDialog(true)}
                      className="flex items-center px-3 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm border"
                      title="Xem các quy tắc điều chỉnh đã tải"
                    >
                      Quy tắc đã tải: {Array.from(adjustmentRulesMap.current.values()).reduce((sum, arr) => sum + (arr?.length || 0), 0)}
                    </button>
                  )}
                  <button
                    onClick={() => setShowColumnDialog(true)}
                    className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Hiện/Ẩn cột
                  </button>
                  <button
                    onClick={addItem}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm sản phẩm tự do
                  </button>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    data-tour-id="quote-select-product-button"
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Chọn từ danh sách
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[60vh]">
                <div className="bg-white border-2 border-gray-500 rounded-md inline-block min-w-max">
                  <div className="bg-gray-50 px-4 py-3 border-b-2 border-gray-500 sticky top-0 z-10 shadow-sm">
                    <div className="grid gap-2 text-xs font-medium text-black items-start" style={{ gridTemplateColumns }}>
                      {visibleColumns.name && <div>Tên sản phẩm</div>}
                      {visibleColumns.description && <div>Mô tả</div>}
                      {visibleColumns.quantity && <div className="text-right">Số lượng</div>}
                      {visibleColumns.unit && <div className="text-center">Đơn vị</div>}
                      {visibleColumns.unit_price && <div className="text-right">Đơn giá / m²</div>}
                      {visibleColumns.total_price && <div className="text-right">Thành tiền</div>}
                      {visibleColumns.area && <div data-tour-id="quote-form-area-info">Diện tích (m²)</div>}
                      {visibleColumns.volume && <div>Thể tích (m³)</div>}
                      {visibleColumns.height && <div>Cao (mm)</div>}
                      {visibleColumns.length && <div>Dài (mm)</div>}
                      {visibleColumns.depth && <div>Sâu (mm)</div>}
                      {visibleColumns.components_block && (
                        <div className="w-full">
                          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(headerComponents.length || 1) * 4}, minmax(auto, auto))` }}>
                            {(headerComponents.length > 0 ? headerComponents : [{}]).map((c: any, idx: number) => (
                              <div key={`hdr-comp-name-${idx}`} className="col-span-4 font-semibold text-gray-800 whitespace-nowrap px-2">
                                {c?.name || c?.expense_object_id || 'Vật tư'}
                              </div>
                            ))}
                          </div>
                          <div className="mt-1 grid gap-2 text-xs text-gray-600" style={{
                            // Repeat 4 fixed columns per component to match expense layout
                            gridTemplateColumns: `repeat(${(headerComponents.length || 1)}, 80px 100px 80px 120px)`
                          }}>
                            {(headerComponents.length > 0 ? headerComponents : [{}]).flatMap((_, idx) => [
                              <div key={`hdr-unit-${idx}`} className="px-2">Đơn vị</div>,
                              <div key={`hdr-price-${idx}`} className="px-2">Đơn giá</div>,
                              <div key={`hdr-qty-${idx}`} className="px-2">Đơn vị</div>,
                              <div key={`hdr-total-${idx}`} className="px-2">Thành tiền</div>
                            ])}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="divide-y-2 divide-gray-500">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors px-4 py-3`}
                      >
                        <div className="grid gap-2 items-start text-xs" style={{ gridTemplateColumns }}>
                          {visibleColumns.name && (
                            <div>
                              <div className="flex gap-2 text-xs">
                                <input
                                  type="text"
                                  value={item.name_product}
                                  onChange={(e) => updateItem(index, 'name_product', e.target.value)}
                                  className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Tên sản phẩm"
                                  title={item.name_product}
                                  tabIndex={index * 100 + 1}
                                />
                                <button
                                  type="button"
                                  onClick={() => openProductModal(index)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs flex items-center"
                                  title="Chọn sản phẩm từ danh sách"
                                >
                                  <Search className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                          {visibleColumns.description && (
                            <div>
                              <div
                                onClick={() => {
                                  setDescriptionModal({
                                    isOpen: true,
                                    index: index,
                                    description: item.description || '',
                                    productName: item.name_product || 'Sản phẩm'
                                  })
                                }}
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black cursor-pointer hover:bg-gray-50 transition-colors flex items-center h-[28px] overflow-hidden"
                                title={item.description || "Click để chỉnh sửa mô tả"}
                                tabIndex={index * 100 + 2}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    setDescriptionModal({
                                      isOpen: true,
                                      index: index,
                                      description: item.description || '',
                                      productName: item.name_product || 'Sản phẩm'
                                    })
                                  }
                                }}
                              >
                                <span className="truncate flex-1 block">
                                  {item.description || <span className="text-gray-400">Mô tả</span>}
                                </span>
                              </div>
                            </div>
                          )}
                          {visibleColumns.quantity && (
                            <div>
                              <EditableNumberCell
                                value={item.quantity}
                                onChange={(v) => updateItem(index, 'quantity', Number(v || 0))}
                                format="number"
                                step={1}
                                min={0}
                                placeholder="0"
                                index={index}
                                field={'quantity'}
                                commitOnChange
                                tabIndex={index * 100 + 3}
                              />
                            </div>
                          )}
                          {visibleColumns.unit && (
                            <div>
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-1 py-1 text-xs text-black text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="cái"
                                maxLength={5}
                                tabIndex={index * 100 + 4}
                              />
                            </div>
                          )}
                          {visibleColumns.unit_price && (
                            <div>
                              <EditableNumberCell
                                value={item.unit_price}
                                onChange={(v) => updateItem(index, 'unit_price', Number(v || 0))}
                                format="currency"
                                step={1000}
                                min={0}
                                placeholder="0 ₫"
                                index={index}
                                field={'unit_price'}
                                commitOnChange
                                tabIndex={index * 100 + 5}
                              />
                            </div>
                          )}
                          {visibleColumns.total_price && (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs font-semibold text-gray-900">
                                    {formatCurrency(item.total_price)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">+ Thuế:</span>
                                    <input
                                      type="number"
                                      value={item.tax_rate ?? formData.tax_rate ?? 10}
                                      onChange={(e) => {
                                        const newTaxRate = parseFloat(e.target.value) || 0
                                        const updatedItems = [...items]
                                        updatedItems[index] = { ...updatedItems[index], tax_rate: newTaxRate }
                                        setItems(updatedItems)
                                      }}
                                      className="w-12 border border-gray-300 rounded px-1 py-0.5 text-xs text-center text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      tabIndex={index * 100 + 6}
                                    />
                                    <span className="text-xs text-gray-500">%</span>
                                    <span className="text-xs text-gray-500">
                                      = {formatCurrency(item.total_price * ((item.tax_rate ?? formData.tax_rate ?? 10) / 100))}
                                    </span>
                                  </div>
                                </div>
                                {items.length > 1 && (
                                  <button
                                    onClick={() => removeItem(index)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          {visibleColumns.area && (
                            <div>
                              <EditableNumberCell
                                value={(() => {
                                  if (item.area != null) return Number(item.area)
                                  if (item.length != null && item.height != null) {
                                    return ((Number(item.length) || 0) * (Number(item.height) || 0) * (Number(item.quantity) || 1)) / 1_000_000
                                  }
                                  return null
                                })()}
                                onChange={(v) => updateItem(index, 'area', v == null ? null : Number(v))}
                                format="number"
                                step={0.000001}
                                min={0}
                                placeholder="m²"
                                index={index}
                                field={'area'}
                                commitOnChange
                                tabIndex={index * 100 + 7}
                              />
                            </div>
                          )}
                          {visibleColumns.volume && (
                            <div>
                              <EditableNumberCell
                                value={item.volume ?? null}
                                onChange={(v) => updateItem(index, 'volume', v == null ? null : Number(v))}
                                format="number"
                                step={0.001}
                                min={0}
                                placeholder="m³"
                                index={index}
                                field={'volume'}
                                commitOnChange
                              />
                            </div>
                          )}
                          {visibleColumns.height && (
                            <div>
                              <EditableNumberCell
                                value={item.height ?? null}
                                onChange={(v) => updateItem(index, 'height', v == null ? null : Number(v))}
                                format="number"
                                step={100}
                                min={0}
                                placeholder="mm"
                                index={index}
                                field={'height'}
                                commitOnChange
                                tabIndex={index * 100 + 8}
                              />
                            </div>
                          )}
                          {visibleColumns.length && (
                            <div>
                              <EditableNumberCell
                                value={item.length ?? null}
                                onChange={(v) => updateItem(index, 'length', v == null ? null : Number(v))}
                                format="number"
                                step={100}
                                min={0}
                                placeholder="mm"
                                index={index}
                                field={'length'}
                                commitOnChange
                                tabIndex={index * 100 + 9}
                              />
                            </div>
                          )}
                          {visibleColumns.depth && (
                            <div>
                              <EditableNumberCell
                                value={item.depth ?? null}
                                onChange={(v) => updateItem(index, 'depth', v == null ? null : Number(v))}
                                format="number"
                                step={100}
                                min={0}
                                placeholder="mm"
                                index={index}
                                field={'depth'}
                                commitOnChange
                              />
                            </div>
                          )}
                          {visibleColumns.components_block && (
                            <div className="text-sm text-black w-full">
                              <div className="grid gap-2" style={{
                                // Body grid cho vật tư: vẫn giữ số cột như header
                                gridTemplateColumns: `repeat(${(headerComponents.length || 1)}, 80px 100px 80px 120px)`
                              }}>
                                {(headerComponents.length > 0 ? headerComponents : [{}]).flatMap((hc: any, idx: number) => {
                                  // Chỉ hiển thị cho những đối tượng chi phí mà dòng sản phẩm này thực sự có
                                  const realMatch: any = (item.components || []).find(
                                    (c: any) => String(c.expense_object_id) === String(hc.expense_object_id)
                                  )
                                  if (!realMatch) {
                                    // Không có vật tư cho expense_object này ở dòng hiện tại -> không render 4 ô rỗng
                                    return []
                                  }
                                  const match = realMatch
                                  const editIndex = index * 1000 + idx
                                  return [
                                    <div key={`val-unit-${idx}`} className="px-2 py-1 text-xs text-gray-800">
                                      <input
                                        type="text"
                                        value={match.unit || ''}
                                        onChange={(e) => updateComponentField(index, String(hc.expense_object_id), 'unit', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-0.5 py-1 text-xs text-black text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Đơn vị"
                                        maxLength={3}
                                      />
                                    </div>,
                                    <div key={`val-price-${idx}`} className="px-2 py-1 text-xs text-gray-800">
                                      <EditableNumberCell
                                        value={match.unit_price != null ? Number(match.unit_price) : null}
                                        onChange={(v) => updateComponentField(index, String(hc.expense_object_id), 'unit_price', Number(v || 0))}
                                        format="currency"
                                        step={1000}
                                        min={0}
                                        placeholder="0 ₫"
                                        index={editIndex}
                                        field={`comp-${idx}-unit_price`}
                                      />
                                    </div>,
                                    <div key={`val-qty-${idx}`} className="px-2 py-1 text-xs text-gray-800">
                                      <EditableNumberCell
                                        value={match.quantity != null ? Number(match.quantity) : null}
                                        onChange={(v) => updateComponentField(index, String(hc.expense_object_id), 'quantity', Number(v || 0))}
                                        format="number"
                                        step={1}
                                        min={0}
                                        placeholder="0"
                                        index={editIndex}
                                        field={`comp-${idx}-quantity`}
                                        displayFractionDigits={2}
                                      />
                                    </div>,
                                    <div key={`val-total-${idx}`} className="px-2 py-1 text-xs text-gray-800">
                                      {match.total_price != null ? formatCurrency(Number(match.total_price)) : ''}
                                    </div>
                                  ]
                                })}
                              </div>
                              <div className="mt-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => manualAdjustItem(index)}
                                  className="px-2 py-1 text-[10px] bg-purple-600 text-white rounded hover:bg-purple-700"
                                  title="Áp dụng điều chỉnh cho dòng này"
                                >
                                  Áp dụng dòng
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Totals Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-black mb-4">Tổng kết</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="w-full" data-tour-id="quote-form-totals">
                      <div className="flex justify-between items-center py-2 border-b border-gray-300">
                        <span className="text-sm font-medium text-black">Tạm tính:</span>
                        <span className="text-sm font-medium text-black">{formatCurrency(formData.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-300">
                        <span className="text-sm font-medium text-black">Tổng cộng:</span>
                        <span className={`text-base font-semibold ${isOverBudget ? 'text-red-600' : 'text-black'
                          }`}>
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        * Thuế đã được tính và cộng vào tổng cộng
                      </div>

                      {/* Profit Analysis */}
                      {(() => {
                        // Calculate total material cost (from components)
                        const totalMaterialCost = items.reduce((sum, item) => {
                          const components = Array.isArray(item.components) ? item.components : []
                          const materialCost = components.reduce((compSum, comp) => {
                            return compSum + (Number(comp.total_price) || 0)
                          }, 0)
                          return sum + materialCost
                        }, 0)

                        // Calculate total product price
                        const totalProductPrice = items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)

                        // Calculate profit
                        const profit = totalProductPrice - totalMaterialCost
                        const profitPercentage = totalProductPrice > 0 ? (profit / totalProductPrice) * 100 : 0

                        return (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="text-sm font-medium text-blue-800 mb-2">Phân tích lợi nhuận</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Tổng giá vật tư:</span>
                                <span className="font-medium text-gray-900">{formatCurrency(totalMaterialCost)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Tổng giá sản phẩm:</span>
                                <span className="font-medium text-gray-900">{formatCurrency(totalProductPrice)}</span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-blue-200">
                                <span className="text-gray-700 font-medium">Lợi nhuận:</span>
                                <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                  {formatCurrency(profit)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Tỷ lệ lợi nhuận:</span>
                                <span className={`font-semibold ${getProfitPercentageColor(profitPercentage)}`}>
                                  {profitPercentage.toFixed(2)}%
                                </span>
                              </div>
                            </div>

                            {/* Per-product breakdown */}
                            {items.length > 0 && items.some(item => {
                              const components = Array.isArray(item.components) ? item.components : []
                              return components.length > 0
                            }) && (
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                  <div className="text-xs font-medium text-blue-800 mb-2">Chi tiết theo sản phẩm:</div>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {items.map((item, idx) => {
                                      const components = Array.isArray(item.components) ? item.components : []
                                      const materialCost = components.reduce((sum, comp) => sum + (Number(comp.total_price) || 0), 0)
                                      const productPrice = Number(item.total_price) || 0
                                      const itemProfit = productPrice - materialCost
                                      const itemProfitPercentage = productPrice > 0 ? (itemProfit / productPrice) * 100 : 0

                                      if (components.length === 0) return null

                                      return (
                                        <div key={idx} className="text-xs bg-white p-2 rounded border border-blue-100">
                                          <div className="font-medium text-gray-800 mb-1">
                                            {item.name_product || item.description || `Sản phẩm #${idx + 1}`}
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-gray-600">
                                            <div>
                                              <span>Vật tư: </span>
                                              <span className="font-medium">{formatCurrency(materialCost)}</span>
                                            </div>
                                            <div>
                                              <span>Giá SP: </span>
                                              <span className="font-medium">{formatCurrency(productPrice)}</span>
                                            </div>
                                            <div>
                                              <span>Lợi nhuận: </span>
                                              <span className={`font-semibold ${itemProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {formatCurrency(itemProfit)}
                                              </span>
                                            </div>
                                            <div>
                                              <span>Tỷ lệ: </span>
                                              <span className={`font-semibold ${getProfitPercentageColor(itemProfitPercentage)}`}>
                                                {itemProfitPercentage.toFixed(2)}%
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>
                        )
                      })()}

                      {/* Budget Warning */}
                      {selectedProject && selectedProject.budget && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">
                                Thông báo ngân sách dự án
                              </h3>
                              <div className="mt-1 text-sm text-yellow-700">
                                <p>
                                  Ngân sách dự án <strong>{selectedProject.name}</strong>:
                                  <span className="font-semibold ml-1">
                                    {formatCurrency(selectedProject.budget)}
                                  </span>
                                </p>
                                <p className="mt-1">
                                  Tổng báo giá hiện tại:
                                  <span className={`font-semibold ml-1 ${isOverBudget ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                    {formatCurrency(totalAmount)}
                                  </span>
                                </p>
                                {isOverBudget && (
                                  <p className="mt-1 text-red-600 font-medium">
                                    ⚠️ Tổng báo giá vượt quá ngân sách dự án!
                                  </p>
                                )}
                                {isOverBudget && (
                                  <p className="mt-1 text-red-600 text-sm">
                                    Chênh lệch: {formatCurrency(budgetDifference)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-black mb-4">Ghi chú và điều khoản</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Ghi chú thêm..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Điều khoản và điều kiện</label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Điều khoản và điều kiện..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 bg-white p-4 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-black hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo báo giá'}
            </button>
          </div>
        </div>
      </div>

      {/* Profit Warning Dialog */}
      {showProfitWarningDialog && (
        <div className="fixed inset-0 z-70 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-2xl w-full max-w-md mx-4 border border-gray-200">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Cảnh báo tỷ lệ lợi nhuận</h3>
                  <p className="text-sm text-gray-600">Có sản phẩm có tỷ lệ lợi nhuận dưới 10%</p>
                </div>
              </div>

              <div className="mb-4 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {lowProfitItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-red-50/80 border border-red-200 rounded-md backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        <span className={`text-sm font-semibold ${getProfitPercentageColor(item.percentage)}`}>
                          {item.percentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowProfitWarningDialog(false)
                    setLowProfitItems([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white/80 backdrop-blur-sm"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowProfitWarningDialog(false)
                    doCreateQuote()
                  }}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-60 bg-transparent flex items-end justify-center">
          <div className="bg-white rounded-t-lg shadow-xl w-full max-w-5xl mx-4 max-h-[60vh] flex flex-col" data-tour-id="quote-product-selection-modal">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-700">Chọn sản phẩm</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm theo tên, mô tả hoặc loại..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50">
              {loadingProducts ? (
                <div className="text-center py-8">
                  <span className="text-gray-500">Đang tải sản phẩm...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-gray-500">
                    {productSearch ? 'Không có sản phẩm phù hợp' : 'Không có sản phẩm nào'}
                  </span>
                </div>
              ) : (
                <div className="p-4">
                  {(() => {
                    // Group filtered products by category
                    const groupedProducts = filteredProducts.reduce((acc, product) => {
                      const category = product.category || 'Khác'
                      if (!acc[category]) {
                        acc[category] = []
                      }
                      acc[category].push(product)
                      return acc
                    }, {} as Record<string, Product[]>)

                    return Object.entries(groupedProducts).map(([category, categoryProducts]) => {
                      const isExpanded = expandedCategories.has(category)

                      return (
                        <div key={category} className="mb-4">
                          <div
                            className="text-sm font-semibold text-gray-600 mb-2 px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                            onClick={() => toggleCategory(category)}
                          >
                            <div className="flex items-center">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                              )}
                              <span>📁 {category}</span>
                              <span className="ml-2 text-xs text-gray-500">({categoryProducts.length} sản phẩm)</span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="space-y-2">
                              {categoryProducts.map((product) => (
                                <label
                                  key={product.id}
                                  className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-3"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedProductIds.includes(product.id)}
                                    onChange={(e) => {
                                      setSelectedProductIds(prev => e.target.checked ? [...prev, product.id] : prev.filter(id => id !== product.id))
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <div className="grid grid-cols-6 gap-3 items-center w-full">
                                    <div className="col-span-2">
                                      <h5 className="font-semibold text-gray-800 text-sm mb-1">{product.name}</h5>
                                      <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded inline-block">
                                        {category}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleProductClick(product)
                                        }}
                                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                      >
                                        {(() => {
                                          const baseName = getBaseProductName(product.name)
                                          const variants = filteredProducts.filter(p => getBaseProductName(p.name) === baseName)
                                          return variants.length > 1 ? `Chọn biến thể (${variants.length})` : 'Chọn sản phẩm này'
                                        })()}
                                      </button>
                                    </div>
                                    <div className="col-span-1">
                                      <span className="text-sm text-gray-500">
                                        <span className="font-medium">Đơn vị:</span><br />
                                        {product.unit || 'Chưa có'}
                                      </span>
                                    </div>
                                    <div className="col-span-1">
                                      {product.unit_price ? (
                                        <span className="text-sm font-bold text-green-600">
                                          <span className="font-medium">Đơn giá:</span><br />
                                          {formatCurrency(product.unit_price)}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-gray-400">
                                          <span className="font-medium">Đơn giá:</span><br />
                                          Chưa có
                                        </span>
                                      )}
                                    </div>
                                    <div className="col-span-1">
                                      <span className="text-sm text-gray-500">
                                        <span className="font-medium">Kích thước:</span><br />
                                        <div className="text-xs space-y-1">
                                          {product.area && <div>📐 Diện tích: {product.area} m²</div>}
                                          {product.volume && <div>📦 Thể tích: {product.volume} m³</div>}
                                          {product.height && <div>📏 Cao: {product.height} mm</div>}
                                          {product.length && <div>📏 Dài: {product.length} mm</div>}
                                          {product.depth && <div>📏 Sâu: {product.depth} mm</div>}
                                          {!product.area && !product.volume && !product.height && !product.length && !product.depth &&
                                            <div className="text-gray-400">Chưa có kích thước</div>
                                          }
                                        </div>
                                      </span>
                                    </div>
                                    <div className="col-span-1">
                                      <span className="text-sm text-gray-500">
                                        <span className="font-medium">Mô tả:</span><br />
                                        {product.description || 'Không có mô tả'}
                                      </span>
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-white flex justify-between items-center">
              <button
                onClick={() => { setSelectedProductIds([]); setShowProductModal(false) }}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  const map = new Map(products.map(p => [p.id, p]))
                  const chosen = selectedProductIds.map(id => map.get(id)).filter(Boolean) as Product[]
                  if (chosen.length > 0) {
                    // Load full products with components (ưu tiên vật tư thực tế từ actual_material_components)
                    const productIds = chosen.map(p => p.id)
                    const { data: prods } = await supabase
                      .from('products')
                      .select('id, name, description, unit, price, category_id, area, volume, height, length, depth, actual_material_components, product_components')
                      .in('id', productIds)

                    const byId: Record<string, any> = {}
                    prods?.forEach((pr: any) => { byId[pr.id] = pr })

                    // Collect all expense_object_ids to batch fetch names (dùng components đã ưu tiên vật tư thực tế)
                    const allComponents = (prods || []).flatMap((pr: any) => {
                      const actualComps = Array.isArray(pr.actual_material_components) ? pr.actual_material_components : []
                      const plannedComps = Array.isArray(pr.product_components) ? pr.product_components : []
                      const comps = actualComps.length > 0 ? actualComps : plannedComps
                      return comps
                    })
                    const ids = Array.from(new Set(allComponents.map((c: any) => String(c.expense_object_id)).filter(Boolean)))
                    let nameMap: Record<string, string> = {}
                    if (ids.length > 0) {
                      const { data: exp } = await supabase
                        .from('expense_objects')
                        .select('id, name')
                        .in('id', ids)
                      exp?.forEach((e: any) => { nameMap[e.id] = e.name })
                    }

                    const newItems = [...items]
                    const findEmptyFrom = (startIdx: number) => {
                      for (let i = Math.max(0, startIdx); i < newItems.length; i++) {
                        if (!newItems[i].name_product || newItems[i].name_product.trim() === '') return i
                      }
                      return -1
                    }
                    let insertIdx = selectedItemIndex !== null ? selectedItemIndex : findEmptyFrom(0)

                    for (const p of chosen) {
                      const full = byId[p.id]
                      const actualComps: any[] = Array.isArray(full?.actual_material_components) ? full.actual_material_components : []
                      const plannedComps: any[] = Array.isArray(full?.product_components) ? full.product_components : []
                      const components: any[] = actualComps.length > 0 ? actualComps : plannedComps
                      if (components.length === 0) {
                        // fallback to single product row
                        if (insertIdx !== -1) {
                          const newItem = {
                            ...newItems[insertIdx],
                            product_service_id: p.id, // Lưu id của sản phẩm
                            name_product: p.name,
                            description: p.description || '',
                            quantity: newItems[insertIdx].quantity || 1,
                            unit: p.unit || '',
                            unit_price: p.unit_price || 0,
                            total_price: 0, // Will compute below
                            tax_rate: formData.tax_rate || 10,  // Default tax rate from form
                            product_category_id: p.category_id || null,
                            area: p.area ?? null,
                            baseline_area: p.area ?? ((p.length != null && p.height != null) ? Math.round(((Number(p.length) * Number(p.height)) / 1_000_000) * 100) / 100 : null),
                            volume: p.volume ?? null,
                            baseline_volume: p.volume ?? ((p.length != null && p.height != null && p.depth != null) ? ((Number(p.length) * Number(p.height) * Number(p.depth)) / 1_000_000_000) : null),
                            height: p.height ?? null,
                            length: p.length ?? null,
                            depth: p.depth ?? null
                          }
                          newItem.total_price = computeItemTotal(newItem as QuoteItem)
                          newItems[insertIdx] = newItem
                          insertIdx = findEmptyFrom(insertIdx + 1)
                        } else {
                          const newItem = {
                            product_service_id: p.id, // Lưu id của sản phẩm
                            name_product: p.name,
                            description: p.description || '',
                            quantity: 1,
                            unit: p.unit || '',
                            unit_price: p.unit_price || 0,
                            total_price: 0, // Will compute below
                            tax_rate: formData.tax_rate || 10,  // Default tax rate from form
                            product_category_id: p.category_id || null,
                            area: p.area ?? null,
                            baseline_area: p.area ?? ((p.length != null && p.height != null) ? Math.round(((Number(p.length) * Number(p.height)) / 1_000_000) * 100) / 100 : null),
                            volume: p.volume ?? null,
                            baseline_volume: p.volume ?? ((p.length != null && p.height != null && p.depth != null) ? ((Number(p.length) * Number(p.height) * Number(p.depth)) / 1_000_000_000) : null),
                            height: p.height ?? null,
                            length: p.length ?? null,
                            depth: p.depth ?? null
                          } as QuoteItem
                          newItem.total_price = computeItemTotal(newItem)
                          newItems.push(newItem)
                        }
                        continue
                      }

                      // single-row presentation: take only first component
                      const first = components[0]
                      const q = Number(first.quantity || 0)
                      const up = Number(first.unit_price || 0)
                      const compName = nameMap[String(first.expense_object_id)] || String(first.expense_object_id || '')
                      if (insertIdx !== -1) {
                        const newItem = {
                          ...newItems[insertIdx],
                          product_service_id: p.id, // Lưu id của sản phẩm
                          name_product: p.name,
                          description: p.description || '',
                          quantity: newItems[insertIdx].quantity || 1,
                          unit: p.unit || '',
                          unit_price: p.unit_price || 0,
                          total_price: 0, // Will compute below
                          product_category_id: p.category_id || null,
                          area: p.area ?? null,
                          baseline_area: p.area ?? ((p.length != null && p.height != null) ? ((Number(p.length) * Number(p.height)) / 1_000_000) : null),
                          volume: p.volume ?? null,
                          baseline_volume: p.volume ?? ((p.length != null && p.height != null && p.depth != null) ? ((Number(p.length) * Number(p.height) * Number(p.depth)) / 1_000_000_000) : null),
                          height: p.height ?? null,
                          length: p.length ?? null,
                          depth: p.depth ?? null,
                          expense_object_id: String(first.expense_object_id || ''),
                          component_name: compName,
                          component_unit: first.unit || '',
                          component_unit_price: up,
                          component_quantity: q,
                          component_total_price: q * up,
                          components: components.map((c: any) => ({
                            expense_object_id: String(c.expense_object_id || ''),
                            name: nameMap[String(c.expense_object_id)] || String(c.expense_object_id || ''),
                            unit: c.unit || '',
                            unit_price: Number(c.unit_price || 0),
                            quantity: Number(c.quantity || 0),
                            total_price: Number(c.quantity || 0) * Number(c.unit_price || 0)
                          }))
                        } as QuoteItem
                        newItem.total_price = computeItemTotal(newItem)
                        newItems[insertIdx] = newItem
                        insertIdx = findEmptyFrom(insertIdx + 1)
                      } else {
                        const newItem = {
                          product_service_id: p.id, // Lưu id của sản phẩm
                          name_product: p.name,
                          description: p.description || '',
                          quantity: 1,
                          unit: p.unit || '',
                          unit_price: p.unit_price || 0,
                          total_price: 0, // Will compute below
                          product_category_id: p.category_id || null,
                          area: p.area ?? null,
                          baseline_area: p.area ?? ((p.length != null && p.height != null) ? ((Number(p.length) * Number(p.height)) / 1_000_000) : null),
                          volume: p.volume ?? null,
                          baseline_volume: p.volume ?? ((p.length != null && p.height != null && p.depth != null) ? ((Number(p.length) * Number(p.height) * Number(p.depth)) / 1_000_000_000) : null),
                          height: p.height ?? null,
                          length: p.length ?? null,
                          depth: p.depth ?? null,
                          expense_object_id: String(first.expense_object_id || ''),
                          component_name: compName,
                          component_unit: first.unit || '',
                          component_unit_price: up,
                          component_quantity: q,
                          component_total_price: q * up,
                          components: components.map((c: any) => ({
                            expense_object_id: String(c.expense_object_id || ''),
                            name: nameMap[String(c.expense_object_id)] || String(c.expense_object_id || ''),
                            unit: c.unit || '',
                            unit_price: Number(c.unit_price || 0),
                            quantity: Number(c.quantity || 0),
                            total_price: Number(c.quantity || 0) * Number(c.unit_price || 0)
                          }))
                        } as QuoteItem
                        newItem.total_price = computeItemTotal(newItem)
                        newItems.push(newItem)
                      }
                    }
                    setItems(newItems)
                  }
                  setSelectedItemIndex(null)
                  setSelectedProductIds([])
                  setShowProductModal(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Thêm sản phẩm đã chọn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Visibility Dialog */}
      <ColumnVisibilityDialog
        isOpen={showColumnDialog}
        onClose={() => setShowColumnDialog(false)}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onReset={resetColumns}
      />

      {/* Product Variant Selection Dialog */}
      {showVariantDialog && selectedProductVariants.length > 0 && (
        <div className="fixed inset-0 z-70 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Chọn biến thể sản phẩm
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Có {selectedProductVariants.length} biến thể của "{selectedProductVariants.length > 0 ? getBaseProductName(selectedProductVariants[0].name) : ''}"
                </p>
              </div>
              <button
                onClick={() => {
                  setShowVariantDialog(false)
                  setSelectedProductVariants([])
                  setPendingProductClick(null)
                }}
                className="p-2 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {selectedProductVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => {
                      selectProduct(variant)
                      setShowVariantDialog(false)
                      setSelectedProductVariants([])
                      setPendingProductClick(null)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-base mb-2">
                          {variant.name}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Đơn vị:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {variant.unit || 'Chưa có'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Đơn giá:</span>
                            <span className="ml-2 font-medium text-green-600">
                              {variant.unit_price ? formatCurrency(variant.unit_price) : 'Chưa có'}
                            </span>
                          </div>
                          {variant.area && (
                            <div>
                              <span className="text-gray-500">Diện tích:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {variant.area} m²
                              </span>
                            </div>
                          )}
                          {variant.volume && (
                            <div>
                              <span className="text-gray-500">Thể tích:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {variant.volume} m³
                              </span>
                            </div>
                          )}
                        </div>
                        {(variant.height || variant.length || variant.depth) && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Kích thước:</span>
                            {variant.height && <span className="ml-2">Cao: {variant.height} mm</span>}
                            {variant.length && <span className="ml-2">Dài: {variant.length} mm</span>}
                            {variant.depth && <span className="ml-2">Sâu: {variant.depth} mm</span>}
                          </div>
                        )}
                        {variant.description && (
                          <p className="mt-2 text-sm text-gray-600">
                            {variant.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          selectProduct(variant)
                          setShowVariantDialog(false)
                          setSelectedProductVariants([])
                          setPendingProductClick(null)
                        }}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Chọn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowVariantDialog(false)
                  setSelectedProductVariants([])
                  setPendingProductClick(null)
                }}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Rules Loaded Dialog */}
      {showRulesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowRulesDialog(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Quy tắc điều chỉnh đã tải</h3>
              <button onClick={() => setShowRulesDialog(false)} className="p-2 hover:bg-gray-100 rounded-md">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 text-sm text-black max-h-[65vh] overflow-auto space-y-4">
              <div className="text-xs text-gray-600">
                Tổng số quy tắc: {Array.from(adjustmentRulesMap.current.values()).reduce((sum, arr) => sum + (arr?.length || 0), 0)}
              </div>
              {/* Số liệu thực tế đang tính */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded">
                <div className="font-medium mb-2">Số liệu hiện tại (đầu vào áp dụng quy tắc)</div>
                <div className="overflow-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-gray-600">
                        <th className="px-2 py-1 text-left">Dòng</th>
                        <th className="px-2 py-1 text-left">Sản phẩm</th>
                        <th className="px-2 py-1 text-right">Dài (mm)</th>
                        <th className="px-2 py-1 text-right">Cao (mm)</th>
                        <th className="px-2 py-1 text-right">Sâu (mm)</th>
                        <th className="px-2 py-1 text-right">Diện tích chuẩn (m²)</th>
                        <th className="px-2 py-1 text-right">Diện tích (m²)</th>
                        <th className="px-2 py-1 text-right">Thể tích (m³)</th>
                        <th className="px-2 py-1 text-right">Số lượng</th>
                        <th className="px-2 py-1 text-left">Vật tư (ids)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((it, idx) => {
                        const lengthMm = it.length != null ? Number(it.length) : null
                        const heightMm = it.height != null ? Number(it.height) : null
                        const depthMm = it.depth != null ? Number(it.depth) : null
                        const qty = Number(it.quantity || 1)
                        // Baseline area is per unit, so no multiplication needed for display
                        const baseArea = it.baseline_area != null ? Number(it.baseline_area) : ((lengthMm != null && heightMm != null) ? Math.round(((lengthMm * heightMm) / 1_000_000) * 100) / 100 : null)
                        // Area value should include quantity (integrate quantity into calculation)
                        const areaVal = (lengthMm != null && heightMm != null)
                          ? Math.round(((lengthMm * heightMm * qty) / 1_000_000) * 100) / 100
                          : (it.area ?? null)
                        // Volume value should include quantity (integrate quantity into calculation)
                        const volumeVal = (lengthMm != null && heightMm != null && depthMm != null)
                          ? Math.round(((lengthMm * heightMm * depthMm * qty) / 1_000_000_000) * 1e9) / 1e9
                          : (it.area != null && heightMm != null ? Math.round((Number(it.area) * (heightMm / 1000)) * 1e9) / 1e9 : (it.volume ?? null))
                        const compIds = Array.isArray((it as any).components) ? ((it as any).components as any[]).map(c => c.expense_object_id).filter(Boolean) : []
                        return (
                          <tr key={`snap-${idx}`}>
                            <td className="px-2 py-1">#{idx + 1}</td>
                            <td className="px-2 py-1">{it.name_product || ''}</td>
                            <td className="px-2 py-1 text-right">{lengthMm ?? ''}</td>
                            <td className="px-2 py-1 text-right">{heightMm ?? ''}</td>
                            <td className="px-2 py-1 text-right">{depthMm ?? ''}</td>
                            <td className="px-2 py-1 text-right">{baseArea != null ? baseArea : ''}</td>
                            <td className="px-2 py-1 text-right">{areaVal != null ? areaVal : ''}</td>
                            <td className="px-2 py-1 text-right">{volumeVal != null ? volumeVal : ''}</td>
                            <td className="px-2 py-1 text-right">{it.quantity}</td>
                            <td className="px-2 py-1">{compIds.join(', ')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Component deltas per item */}
                <div className="mt-3">
                  <div className="font-medium mb-1">Tăng/giảm vật tư theo dòng</div>
                  <div className="space-y-2">
                    {items.map((it, idx) => {
                      const comps: any[] = Array.isArray((it as any).components) ? ((it as any).components as any[]) : []
                      if (comps.length === 0) return null
                      return (
                        <div key={`comp-deltas-${idx}`} className="border rounded">
                          <div className="px-2 py-1 text-xs bg-gray-50 border-b">Dòng #{idx + 1} · {it.name_product || ''}</div>
                          <div className="overflow-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="text-gray-600">
                                  <th className="px-2 py-1 text-left">Vật tư</th>
                                  <th className="px-2 py-1 text-right">SL trước</th>
                                  <th className="px-2 py-1 text-right">SL sau</th>
                                  <th className="px-2 py-1 text-right">Δ SL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {comps.map((c: any, cidx: number) => {
                                  const prevQ = Number(c.adjustment_prev_quantity ?? c.quantity)
                                  const delta = Number(c.adjustment_delta_quantity ?? 0)
                                  const afterQ = prevQ + delta
                                  const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
                                  return (
                                    <tr key={`comp-${idx}-${cidx}`}>
                                      <td className="px-2 py-1">{c.name || c.expense_object_id}</td>
                                      <td className="px-2 py-1 text-right">{isFinite(prevQ) ? fmt(prevQ) : ''}</td>
                                      <td className="px-2 py-1 text-right">{isFinite(afterQ) ? fmt(afterQ) : ''}</td>
                                      <td className={`px-2 py-1 text-right ${delta > 0 ? 'text-green-600' : (delta < 0 ? 'text-red-600' : '')}`}>{isFinite(delta) ? (delta > 0 ? `+${fmt(delta)}` : fmt(delta)) : ''}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Full components snapshot per item */}
                <div className="mt-4">
                  <div className="font-medium mb-1">Chi tiết vật tư theo dòng (đầy đủ số liệu)</div>
                  <div className="space-y-2">
                    {items.map((it, idx) => {
                      const comps: any[] = Array.isArray((it as any).components) ? ((it as any).components as any[]) : []
                      if (comps.length === 0) return (
                        <div key={`comp-full-${idx}`} className="text-xs text-gray-500">Dòng #{idx + 1} · {it.name_product || ''}: Không có vật tư</div>
                      )
                      const fmtNum = (n: number) => new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
                      return (
                        <div key={`comp-full-${idx}`} className="border rounded">
                          <div className="px-2 py-1 text-xs bg-gray-50 border-b">Dòng #{idx + 1} · {it.name_product || ''}</div>
                          <div className="overflow-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="text-gray-600">
                                  <th className="px-2 py-1 text-left">Vật tư</th>
                                  <th className="px-2 py-1 text-center">Đơn vị</th>
                                  <th className="px-2 py-1 text-right">Đơn giá</th>
                                  <th className="px-2 py-1 text-right">Đơn vị</th>
                                  <th className="px-2 py-1 text-right">Thành tiền</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {comps.map((c: any, cidx: number) => (
                                  <tr key={`comp-full-row-${idx}-${cidx}`}>
                                    <td className="px-2 py-1">{c.name || c.expense_object_id}</td>
                                    <td className="px-2 py-1 text-center">{c.unit || ''}</td>
                                    <td className="px-2 py-1 text-right">{c.unit_price != null ? formatCurrency(Number(c.unit_price)) : ''}</td>
                                    <td className="px-2 py-1 text-right">{c.quantity != null ? fmtNum(Number(c.quantity)) : ''}</td>
                                    <td className="px-2 py-1 text-right">{c.total_price != null ? formatCurrency(Number(c.total_price)) : ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 border rounded">
                <div className="font-medium mb-1">Cách áp dụng (công thức)</div>
                <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                  <li>Thay đổi tuyệt đối: Δ = giá trị_mới − giá trị_cũ</li>
                  <li>Thay đổi phần trăm: Δ% = (giá trị_mới − giá trị_cũ) / giá trị_cũ × 100</li>
                  <li>Chiều thay đổi: tăng/giảm/cả hai; phải khớp với hướng Δ</li>
                  <li>Ngưỡng: so với Δ (absolute) hoặc Δ% (percentage)</li>
                  <li>Điều chỉnh vật tư:
                    <ul className="list-disc list-inside ml-4">
                      <li>Phần trăm: số_lượng_vật_tư = số_lượng_vật_tư × (1 + điều_chỉnh/100)</li>
                      <li>Tuyệt đối: số_lượng_vật_tư = số_lượng_vật_tư + điều_chỉnh</li>
                    </ul>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                {Array.from(adjustmentRulesMap.current.entries()).map(([key, list]) => (
                  <div key={key} className="border rounded">
                    <div className="px-3 py-2 text-xs text-gray-600 border-b bg-gray-50">{key} · {list?.length || 0} quy tắc</div>
                    <div className="divide-y">
                      {(list || []).map((r: any, idx: number) => (
                        <div key={r.id || idx} className="p-3 text-xs">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div><span className="text-gray-500">Vật tư:</span> <span className="font-medium">{r.expense_object_id}</span></div>
                            <div><span className="text-gray-500">Kích thước:</span> <span className="font-medium">{r.dimension_type}</span></div>
                            <div><span className="text-gray-500">Chiều thay đổi:</span> <span className="font-medium">{r.change_direction}</span></div>
                            <div><span className="text-gray-500">Loại thay đổi:</span> <span className="font-medium">{r.change_type}</span></div>
                            <div><span className="text-gray-500">Ngưỡng:</span> <span className="font-medium">{r.change_value}</span></div>
                            <div><span className="text-gray-500">Cách điều chỉnh:</span> <span className="font-medium">{r.adjustment_type}</span></div>
                            <div><span className="text-gray-500">Giá trị điều chỉnh:</span> <span className="font-medium">{r.adjustment_value}</span></div>
                            <div><span className="text-gray-500">Ưu tiên:</span> <span className="font-medium">{r.priority}</span></div>
                            <div><span className="text-gray-500">Kích hoạt:</span> <span className="font-medium">{String(r.is_active)}</span></div>
                          </div>
                          {(r.name || r.description) && (
                            <div className="mt-2 text-gray-700">
                              {r.name && <div className="font-medium">{r.name}</div>}
                              {r.description && <div className="text-gray-600">{r.description}</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button onClick={() => setShowRulesDialog(false)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Description Modal */}
      {descriptionModal.isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          onClick={() => setDescriptionModal({ isOpen: false, index: -1, description: '', productName: '' })}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl border-2 border-blue-500 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Mô tả: {descriptionModal.productName}
              </h3>
              <button
                onClick={() => setDescriptionModal({ isOpen: false, index: -1, description: '', productName: '' })}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <textarea
                value={descriptionModal.description}
                onChange={(e) => {
                  setDescriptionModal(prev => ({ ...prev, description: e.target.value }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-black min-h-[200px]"
                placeholder="Nhập mô tả sản phẩm..."
                autoFocus
              />
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setDescriptionModal({ isOpen: false, index: -1, description: '', productName: '' })}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (descriptionModal.index >= 0) {
                    updateItem(descriptionModal.index, 'description', descriptionModal.description)
                  }
                  setDescriptionModal({ isOpen: false, index: -1, description: '', productName: '' })
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
