'use client'

import { useState, useEffect, useRef } from 'react'
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
  Eye
} from 'lucide-react'
import { apiPost, apiGet } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ColumnVisibilityDialog from './ColumnVisibilityDialog'

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
  // values sourced strictly from product_components
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
}

interface Product {
  id: string
  name: string
  description?: string
  unit?: string
  unit_price?: number
  category?: string
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

export default function CreateQuoteSidebarFullscreen({ isOpen, onClose, onSuccess }: CreateQuoteSidebarProps) {
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
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [editingCell, setEditingCell] = useState<{ index: number; field: string } | null>(null)
  const [autoCalcDimensions, setAutoCalcDimensions] = useState(true)
  // Always-on auto adjustment
  const autoAdjustEnabled = true
  
  // Preloaded adjustment rules for instant access
  const adjustmentRulesMap = useRef<Map<string, any[]>>(new Map())
  const [rulesLoaded, setRulesLoaded] = useState(false)
  // Debounce timers for auto adjustment per item+dimension
  const adjustmentTimersRef = useRef<Map<string, any>>(new Map())
  const [showRulesDialog, setShowRulesDialog] = useState(false)
  const [manualAdjusting, setManualAdjusting] = useState(false)

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
      const dims: Array<'area'|'volume'|'height'|'length'|'depth'|'quantity'> = ['area','volume','height','length','depth','quantity']
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
      } catch (_) {}
    } catch (_) {}
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
      ;(['area','volume','height','length','depth','quantity'] as const).forEach(dim => {
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

      for (const d of ['area','volume','height','length','depth','quantity'] as const) {
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
      } catch (_) {}
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
    volume: true,
    height: true,
    length: true,
    depth: true,
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

  // Shared components schema for header/body alignment: union across all items' components
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
    // Include all expense_object_ids that have preload rules to always show their columns
    try {
      adjustmentRulesMap.current.forEach((rulesArr, key) => {
        const eid = String((key || '').split('_')[0] || '')
        if (!eid) return
        if (!seen.has(eid)) {
          seen.add(eid)
          // Try to find a friendly name from existing components
          const nameFromItems = (() => {
            for (const it of items as any[]) {
              const comps: any[] = Array.isArray(it?.components) ? (it.components as any[]) : []
              const hit = comps.find((c: any) => String(c?.expense_object_id) === eid)
              if (hit?.name) return hit.name
            }
            return undefined
          })()
          list.push({ expense_object_id: eid, name: nameFromItems })
        }
      })
    } catch (_) {}
    return list
  })()

  // Compute a single grid template to keep header and body perfectly aligned
  // Align with Project Expense planned table sizing
  // Main columns: name 200, description 150, quantity 80, unit 80, unit_price 100, total 120
  const gridTemplateColumns = [
    visibleColumns.name && 'minmax(200px, auto)',
    visibleColumns.description && 'minmax(150px, auto)',
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
      generateQuoteNumber()
      // Preload all active adjustment rules once when opening
      ;(async () => {
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
  }, [isOpen])

  useEffect(() => {
    calculateSubtotal()
  }, [items])

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
        .select('id, name, product_components')
        .eq('project_id', projectId)
        .limit(1)
        .maybeSingle()
      const components: any[] = Array.isArray(prod?.product_components) ? prod!.product_components as any[] : []
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
          total_price: quantity * unit_price,
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

  // When project changes, load product components and fill items
  useEffect(() => {
    if (formData.project_id) {
      loadProductComponentsForProject(formData.project_id)
    }
  }, [formData.project_id])

  // Update selected project when project_id changes
  useEffect(() => {
    if (formData.project_id && projects.length > 0) {
      const project = projects.find(p => p.id === formData.project_id)
      setSelectedProject(project || null)
    } else {
      setSelectedProject(null)
    }
  }, [formData.project_id, projects])

  // Calculate total amount and budget status
  useEffect(() => {
    const calculatedTotal = formData.subtotal + formData.tax_amount - formData.discount_amount
    setTotalAmount(calculatedTotal)
    
    if (selectedProject && selectedProject.budget) {
      const overBudget = calculatedTotal > selectedProject.budget
      setIsOverBudget(overBudget)
      setBudgetDifference(overBudget ? calculatedTotal - selectedProject.budget : 0)
    } else {
      setIsOverBudget(false)
      setBudgetDifference(0)
    }
  }, [formData.subtotal, formData.tax_amount, formData.discount_amount, selectedProject])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching customers from database...')
      
      // Use Supabase client directly to get real data
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .limit(10)
      
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
        .select('id, project_code, name, status')
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

  const calculateSubtotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
    const tax_amount = subtotal * (formData.tax_rate / 100)
    const total_amount = subtotal + tax_amount
    
    setFormData(prev => ({ 
      ...prev, 
      subtotal, 
      tax_amount, 
      total_amount 
    }))
  }

  const addItem = () => {
    setItems([...items, { 
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
      volume: true,
      height: true,
      length: true,
      depth: true,
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
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
            const applicableRules = rules.filter((rule: any) => {
              const isApplicable = checkRuleApplicable(rule, changeDirection, changePercentage, changeAbsolute)
              if (isApplicable) {
                console.log('[Adjust] Rule applicable', { 
                  ruleId: rule.id || 'unknown', 
                  changeDirection: rule.change_direction, 
                  adjustmentValue: rule.adjustment_value,
                  isInverse: rule.change_direction === 'decrease' && Number(rule.adjustment_value || 0) < 0
                })
              }
              return isApplicable
            })
            console.log('[Adjust] Applicable rules', applicableRules.length)
            if (applicableRules.length === 0) return component

            // Apply adjustments (multiple rules can stack)
            const originalQuantity = Number(component.quantity || 0)
            let adjustedQuantity = originalQuantity
            let adjustedUnitPrice = Number(component.unit_price || 0)
            
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

      // Recalculate item total_price from quantity * unit_price (NOT from components)
      // total_price should always be the product price, not the material cost
      updatedItems[itemIndex].total_price = updatedItems[itemIndex].quantity * updatedItems[itemIndex].unit_price

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
    } catch (_) {}
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
    if (field === 'quantity' || field === 'unit_price') {
      const itemTotal = updatedItems[index].quantity * updatedItems[index].unit_price
      updatedItems[index].total_price = itemTotal
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
    if (field === 'quantity') {
      const newQuantity = Number(value || 0)
      
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
          const rounded = Math.round(computedArea * 1e6) / 1e6
          if (curr.area == null || Math.abs(Number(curr.area) - rounded) > 1e-9) {
            curr.area = rounded
            autoAreaChanged = true
            // Store baseline area per unit (not multiplied by quantity)
            if (curr.baseline_area == null) {
              curr.baseline_area = baselineAreaPerUnit
            }
          }
        } else {
          // If one dim missing, clear auto area (but only if not manual)
          if (curr.area != null) {
            curr.area = null
            autoAreaChanged = true
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
          const baselineAreaPerUnit = curr.baseline_area ?? (curr.area / quantity) // Get per-unit area
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
    if (['area','volume','height','length','depth','quantity'].includes(field as string)) {
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
    ;(updated[itemIndex] as any).components = comps
    // Recalculate item total_price from quantity * unit_price (NOT from components)
    // total_price should always be the product price, not the material cost
    updated[itemIndex].total_price = updated[itemIndex].quantity * updated[itemIndex].unit_price
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
          .select('id, name, description, unit, unit_price, area, volume, height, length, depth, product_components')
          .eq('id', product.id)
          .maybeSingle()
        const components: any[] = Array.isArray(prod?.product_components) ? (prod!.product_components as any[]) : []
        // If no components and no target index, nothing to do
        if (selectedItemIndex === null && components.length === 0) return

        if (components.length === 0) {
          // fallback to original single-line behavior
          if (selectedItemIndex !== null) {
            const updatedItems = [...items]
            const newItem = {
              ...updatedItems[selectedItemIndex],
              name_product: product.name,
              description: product.description || '',
              unit: product.unit || '',
              unit_price: (product as any).unit_price || 0,
              total_price: updatedItems[selectedItemIndex].quantity * ((product as any).unit_price || 0),
              area: (product as any).area ?? null,
              baseline_area: (product as any).area ?? (((product as any).length != null && (product as any).height != null) ? (((Number((product as any).length) * Number((product as any).height)) / 1_000_000)) : null),
              volume: (product as any).volume ?? null,
              baseline_volume: (product as any).volume ?? (((product as any).length != null && (product as any).height != null && (product as any).depth != null) ? (((Number((product as any).length) * Number((product as any).height) * Number((product as any).depth)) / 1_000_000_000)) : null),
              height: (product as any).height ?? null,
              length: (product as any).length ?? null,
              depth: (product as any).depth ?? null
            }
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
            name_product: product.name,
            description: product.description || current.description,
            unit: product.unit || current.unit,
            unit_price: (product as any).unit_price ?? current.unit_price,
            total_price: current.quantity * ((product as any).unit_price ?? current.unit_price),
            area: (product as any).area ?? current.area ?? null,
            baseline_area: (product as any).area ?? current.baseline_area ?? (((product as any).length != null && (product as any).height != null) ? (((Number((product as any).length) * Number((product as any).height)) / 1_000_000)) : current.baseline_area ?? null),
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
            components: components.map((c: any) => ({
              expense_object_id: String(c.expense_object_id || ''),
              name: compNameMap[String(c.expense_object_id)] || String(c.expense_object_id || ''),
              unit: c.unit || '',
              unit_price: Number(c.unit_price || 0),
              quantity: Number(c.quantity || 0),
              total_price: Number(c.quantity || 0) * Number(c.unit_price || 0)
            }))
          }
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

  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      // Validate required fields
      if (!formData.quote_number.trim()) {
        throw new Error('Vui lòng nhập số báo giá')
      }
      if (!formData.customer_id) {
        throw new Error('Vui lòng chọn khách hàng')
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
      
      // Use created_by from form selection
      const created_by = formData.created_by || null
      
      // Create quote directly in Supabase
      const quoteData = {
        quote_number: formData.quote_number,
        customer_id: formData.customer_id || null,
        project_id: formData.project_id || null,
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
        created_by,
        employee_in_charge_id: created_by
      }

      // Debug logging
      console.log('Creating quote with data:', quoteData)
      
      // Insert quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert(quoteData)
        .select()
        .single()

      if (quoteError) {
        console.error('Quote creation error:', quoteError)
        throw new Error(`Lỗi tạo báo giá: ${quoteError.message}`)
      }
      
      console.log('Quote created successfully:', quote)

      // Insert quote items
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
            quote_id: quote.id,
            name_product: item.name_product,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            total_price: item.total_price,
            area: item.area,
            volume: item.volume,
            height: item.height,
            length: item.length,
            depth: item.depth,
            product_components: productComponents.length > 0 ? productComponents : [] // JSONB column - empty array if no components
          }
        })

        const { data: insertedItems, error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems)
          .select('id')

        if (itemsError) {
          console.error('Error creating quote items:', itemsError)
          // Don't throw error here, quote was created successfully
        }
        // Components are already saved in product_components JSONB column, no need to insert separately
      }

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
        ">
          ✅ Báo giá đã được tạo thành công!
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `
      document.body.appendChild(successMessage)
      
      // Auto remove success message after 5 seconds
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage)
        }
      }, 5000)

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating quote:', error)
      alert('Có lỗi xảy ra khi tạo báo giá: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
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
    displayFractionDigits
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
  }) => {
    const [text, setText] = useState<string>('')
    const isEditing = editingCell && editingCell.index === index && editingCell.field === field

    useEffect(() => {
      if (isEditing) {
        setText(value == null ? '' : String(value))
      }
    }, [isEditing])

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
          title={display}
        >
          {display || (placeholder || '')}
        </div>
      )
    }

    return (
      <input
        type={format === 'number' ? 'number' : 'text'}
        value={text}
        onChange={(e) => {
          const nvRaw = e.target.value
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
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const nv = text.trim() === '' ? null : parseNumber(text)
            onChange(nv)
            setEditingCell(null)
          } else if (e.key === 'Escape') {
            setEditingCell(null)
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
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-white flex-shrink-0">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-black mr-3" />
            <h1 className="text-xl font-semibold text-black">Tạo báo giá mới</h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <X className="h-5 w-5 text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="w-full">
            {/* Basic Information */}
            <div className="mb-8">
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
                    <select
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn khách hàng</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.email ? `(${customer.email})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Dự án</label>
                  {!formData.customer_id ? (
                    <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                      <span className="text-sm text-black">Chọn khách hàng trước</span>
                    </div>
                  ) : loadingProjects ? (
                    <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                      <span className="text-sm text-black">Đang tải dự án...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Chọn dự án (tùy chọn)</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project_code} - {project.name}
                        </option>
                      ))}
                    </select>
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
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-black">Sản phẩm/Dịch vụ</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={manualAdjustAll}
                  disabled={!rulesLoaded || manualAdjusting}
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
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Chọn từ danh sách
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[60vh]">
                <div className="bg-white border border-gray-300 rounded-md inline-block min-w-max">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-300 sticky top-0 z-10 shadow-sm">
                    <div className="grid gap-2 text-xs font-medium text-black items-start" style={{ gridTemplateColumns }}>
                      {visibleColumns.name && <div>Tên sản phẩm</div>}
                      {visibleColumns.description && <div>Mô tả</div>}
                      {visibleColumns.quantity && <div className="text-right">Số lượng</div>}
                      {visibleColumns.unit && <div className="text-center">Đơn vị</div>}
                      {visibleColumns.unit_price && <div className="text-right">Đơn giá</div>}
                      {visibleColumns.total_price && <div className="text-right">Thành tiền</div>}
                      {visibleColumns.area && <div>Diện tích (m²)</div>}
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
                              <div key={`hdr-qty-${idx}`} className="px-2">Số lượng</div>,
                              <div key={`hdr-total-${idx}`} className="px-2">Thành tiền</div>
                            ])}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-gray-300">
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
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Mô tả"
                                title={item.description}
                              />
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
                              />
                            </div>
                          )}
                          {visibleColumns.total_price && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-900">
                                {formatCurrency(item.total_price)}
                              </span>
                              {items.length > 1 && (
                                <button
                                  onClick={() => removeItem(index)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                          {visibleColumns.area && (
                            <div>
                              <div
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-right bg-gray-50"
                                title={item.length != null && item.height != null ? `${formatNumber(((Number(item.length) || 0) * (Number(item.height) || 0) * (Number(item.quantity) || 1)) / 1_000_000)} m² (đã nhân với số lượng)` : 'Nhập Dài và Cao để tự tính'}
                              >
                                {item.length != null && item.height != null
                                  ? `${formatNumber(((Number(item.length) || 0) * (Number(item.height) || 0) * (Number(item.quantity) || 1)) / 1_000_000)} m²`
                                  : item.area != null ? `${formatNumber(item.area)} m²` : ''}
                              </div>
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
                                // Body grid for components: fixed widths like header
                                gridTemplateColumns: `repeat(${(headerComponents.length || 1)}, 80px 100px 80px 120px)`
                              }}>
                                {(headerComponents.length > 0 ? headerComponents : [{}]).flatMap((hc: any, idx: number) => {
                                  const match: any = (item.components || []).find((c: any) => String(c.expense_object_id) === String(hc.expense_object_id)) || { unit: '', unit_price: null, quantity: null, total_price: null }
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Thuế suất (%)</label>
                    <input
                      type="number"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full">
                      <div className="flex justify-between items-center py-2 border-b border-gray-300">
                        <span className="text-sm font-medium text-black">Tạm tính:</span>
                        <span className="text-sm font-medium text-black">{formatCurrency(formData.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-300">
                        <span className="text-sm font-medium text-black">Thuế ({formData.tax_rate}%):</span>
                        <span className="text-sm font-medium text-black">{formatCurrency(formData.tax_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-300">
                        <span className="text-base font-semibold text-black">Tổng cộng:</span>
                        <span className={`text-base font-semibold ${
                          isOverBudget ? 'text-red-600' : 'text-black'
                        }`}>
                          {formatCurrency(formData.total_amount)}
                        </span>
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
                                <span className={`font-semibold ${
                                  profit >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(profit)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Tỷ lệ lợi nhuận:</span>
                                <span className={`font-semibold ${
                                  profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
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
                                            <span className={`font-semibold ${
                                              itemProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                              {formatCurrency(itemProfit)}
                                            </span>
                                          </div>
                                          <div>
                                            <span>Tỷ lệ: </span>
                                            <span className={`font-semibold ${
                                              itemProfitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
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
                                  <span className={`font-semibold ml-1 ${
                                    isOverBudget ? 'text-red-600' : 'text-green-600'
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

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-60 bg-transparent flex items-end justify-center">
          <div className="bg-white rounded-t-lg shadow-xl w-full max-w-5xl mx-4 max-h-[60vh] flex flex-col">
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
                                    onClick={() => selectProduct(product)}
                                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                  >
                                    Chọn sản phẩm này
                                  </button>
                                </div>
                                <div className="col-span-1">
                                  <span className="text-sm text-gray-500">
                                    <span className="font-medium">Đơn vị:</span><br/>
                                    {product.unit || 'Chưa có'}
                                  </span>
                                </div>
                                <div className="col-span-1">
                                  {product.unit_price ? (
                                    <span className="text-sm font-bold text-green-600">
                                      <span className="font-medium">Đơn giá:</span><br/>
                                      {formatCurrency(product.unit_price)}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">
                                      <span className="font-medium">Đơn giá:</span><br/>
                                      Chưa có
                                    </span>
                                  )}
                                </div>
                                <div className="col-span-1">
                                  <span className="text-sm text-gray-500">
                                    <span className="font-medium">Kích thước:</span><br/>
                                    <div className="text-xs space-y-1">
                                      {product.area && <div>📐 Diện tích: {product.area} m²</div>}
                                      {product.volume && <div>📦 Thể tích: {product.volume} m³</div>}
                                      {product.height && <div>📏 Cao: {product.height} cm</div>}
                                      {product.length && <div>📏 Dài: {product.length} cm</div>}
                                      {product.depth && <div>📏 Sâu: {product.depth} cm</div>}
                                      {!product.area && !product.volume && !product.height && !product.length && !product.depth && 
                                        <div className="text-gray-400">Chưa có kích thước</div>
                                      }
                                    </div>
                                  </span>
                                </div>
                                <div className="col-span-1">
                                  <span className="text-sm text-gray-500">
                                    <span className="font-medium">Mô tả:</span><br/>
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
                    // Load full products with product_components
                    const productIds = chosen.map(p => p.id)
                    const { data: prods } = await supabase
                      .from('products')
                      .select('id, name, description, unit, price, area, volume, height, length, depth, product_components')
                      .in('id', productIds)

                    const byId: Record<string, any> = {}
                    prods?.forEach((pr: any) => { byId[pr.id] = pr })

                    // Collect all expense_object_ids to batch fetch names
                    const allComponents = (prods || []).flatMap((pr: any) => Array.isArray(pr.product_components) ? pr.product_components : [])
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
                      const components: any[] = Array.isArray(full?.product_components) ? full.product_components : []
                      if (components.length === 0) {
                        // fallback to single product row
                        if (insertIdx !== -1) {
                          newItems[insertIdx] = {
                            ...newItems[insertIdx],
                            name_product: p.name,
                            description: p.description || '',
                            quantity: newItems[insertIdx].quantity || 1,
                            unit: p.unit || '',
                            unit_price: p.unit_price || 0,
                            total_price: (newItems[insertIdx].quantity || 1) * (p.unit_price || 0),
                            area: p.area ?? null,
                            baseline_area: p.area ?? ((p.length != null && p.height != null) ? ((Number(p.length) * Number(p.height)) / 1_000_000) : null),
                            volume: p.volume ?? null,
                            baseline_volume: p.volume ?? ((p.length != null && p.height != null && p.depth != null) ? ((Number(p.length) * Number(p.height) * Number(p.depth)) / 1_000_000_000) : null),
                            height: p.height ?? null,
                            length: p.length ?? null,
                            depth: p.depth ?? null
                          }
                          insertIdx = findEmptyFrom(insertIdx + 1)
                        } else {
                          newItems.push({
                            name_product: p.name,
                            description: p.description || '',
                            quantity: 1,
                            unit: p.unit || '',
                            unit_price: p.unit_price || 0,
                            total_price: (p.unit_price || 0),
                            area: p.area ?? null,
                            baseline_area: p.area ?? ((p.length != null && p.height != null) ? ((Number(p.length) * Number(p.height)) / 1_000_000) : null),
                            volume: p.volume ?? null,
                            baseline_volume: p.volume ?? ((p.length != null && p.height != null && p.depth != null) ? ((Number(p.length) * Number(p.height) * Number(p.depth)) / 1_000_000_000) : null),
                            height: p.height ?? null,
                            length: p.length ?? null,
                            depth: p.depth ?? null
                          })
                        }
                        continue
                      }

                      // single-row presentation: take only first component
                      const first = components[0]
                      const q = Number(first.quantity || 0)
                      const up = Number(first.unit_price || 0)
                      const compName = nameMap[String(first.expense_object_id)] || String(first.expense_object_id || '')
                      if (insertIdx !== -1) {
                        newItems[insertIdx] = {
                          ...newItems[insertIdx],
                          name_product: p.name,
                          description: p.description || '',
                          quantity: newItems[insertIdx].quantity || 1,
                          unit: p.unit || '',
                          unit_price: p.unit_price || 0,
                          total_price: (newItems[insertIdx].quantity || 1) * (p.unit_price || 0),
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
                        }
                        insertIdx = findEmptyFrom(insertIdx + 1)
                      } else {
                        newItems.push({
                          name_product: p.name,
                          description: p.description || '',
                          quantity: 1,
                          unit: p.unit || '',
                          unit_price: p.unit_price || 0,
                          total_price: (p.unit_price || 0),
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
                        })
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
                        const baseArea = it.baseline_area != null ? Number(it.baseline_area) : ((lengthMm != null && heightMm != null) ? Math.round(((lengthMm * heightMm) / 1_000_000) * 1e6) / 1e6 : null)
                        // Area value should include quantity (integrate quantity into calculation)
                        const areaVal = (lengthMm != null && heightMm != null) 
                          ? Math.round(((lengthMm * heightMm * qty) / 1_000_000) * 1e6) / 1e6 
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
                                  <th className="px-2 py-1 text-right">Số lượng</th>
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
    </div>
  )
}
