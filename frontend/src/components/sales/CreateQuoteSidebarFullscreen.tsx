'use client'

import { useState, useEffect } from 'react'
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
  volume?: number | null
  height?: number | null
  length?: number | null
  depth?: number | null
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
      volume: null,
      height: null,
      length: null,
      depth: null
    }
  ])

  // Shared components schema for header/body alignment
  const headerComponents = (Array.isArray(items?.[0]?.components) ? (items[0].components as any[]) : [])

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
    } else {
      // Reset all fields when closing
      setSelectedItemIndex(null)
      setSelectedProductIds([])
      resetForm()
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
      volume: null,
      height: null,
      length: null,
      depth: null
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

    const item = items[itemIndex]
    const components = Array.isArray(item.components) ? item.components : []
    if (components.length === 0) return

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      // Apply adjustments for each component
      const adjustedComponents = await Promise.all(
        components.map(async (component: any) => {
          const expenseObjectId = component.expense_object_id
          if (!expenseObjectId) return component

          // Get applicable rules using apiGet for authentication
          try {
            const rules = await apiGet(
              `${API_BASE_URL}/api/material-adjustment-rules?expense_object_id=${expenseObjectId}&dimension_type=${dimensionType}&is_active=true`
            )
            if (!Array.isArray(rules) || rules.length === 0) return component

            // Calculate change
            const changePercentage = ((newValue - oldValue) / oldValue) * 100
            const changeAbsolute = newValue - oldValue
            const changeDirection = changeAbsolute > 0 ? 'increase' : 'decrease'

              // Find applicable rules
            const applicableRules = rules.filter((rule: any) => {
              // Check change direction
              if (rule.change_direction !== 'both' && rule.change_direction !== changeDirection) {
                return false
              }

              // Check change threshold
              if (rule.change_type === 'percentage') {
                return Math.abs(changePercentage) >= Math.abs(rule.change_value)
              } else if (rule.change_type === 'absolute') {
                return Math.abs(changeAbsolute) >= Math.abs(rule.change_value)
              }
              return false
            })

            if (applicableRules.length === 0) return component

            // Apply adjustments (multiple rules can stack)
            let adjustedQuantity = Number(component.quantity || 0)
            let adjustedUnitPrice = Number(component.unit_price || 0)

            for (const rule of applicableRules.sort((a: any, b: any) => a.priority - b.priority)) {
              const adjustmentValue = Number(rule.adjustment_value || 0)
              
              if (rule.adjustment_type === 'percentage') {
                // Apply percentage adjustment to quantity
                const adjustmentFactor = 1 + (adjustmentValue / 100)
                adjustedQuantity = adjustedQuantity * adjustmentFactor
              } else if (rule.adjustment_type === 'absolute') {
                // Apply absolute adjustment to quantity
                adjustedQuantity = adjustedQuantity + adjustmentValue
              }
            }

            return {
              ...component,
              quantity: Math.max(0, adjustedQuantity), // Ensure non-negative
              total_price: Math.max(0, adjustedQuantity) * adjustedUnitPrice
            }
          } catch (error) {
            console.error('Error fetching adjustment rules:', error)
            return component
          }
        })
      )

      // Update item with adjusted components
      const updatedItems = [...items]
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        components: adjustedComponents
      }

      // Recalculate item total from components
      const compSum = adjustedComponents.reduce(
        (sum: number, c: any) => sum + (Number(c.total_price) || 0),
        0
      )
      updatedItems[itemIndex].total_price = compSum > 0 
        ? compSum 
        : updatedItems[itemIndex].quantity * updatedItems[itemIndex].unit_price

      setItems(updatedItems)
    } catch (error) {
      console.error('Error applying material adjustment rules:', error)
      // Continue without adjustment on error
    }
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
    
    // Recalculate total_price for this item
    if (field === 'quantity' || field === 'unit_price') {
      const itemTotal = updatedItems[index].quantity * updatedItems[index].unit_price
      updatedItems[index].total_price = itemTotal
    }
    
    setItems(updatedItems)

    // Apply material adjustment rules when dimensions or quantity change
    const newValue = value !== null ? Number(value) : null
    if (newValue !== null && oldItem.components && oldItem.components.length > 0) {
      if (field === 'area' && oldArea !== null && oldArea !== undefined && oldArea !== newValue) {
        await applyMaterialAdjustmentRules(index, 'area', oldArea, newValue)
      } else if (field === 'volume' && oldVolume !== null && oldVolume !== undefined && oldVolume !== newValue) {
        await applyMaterialAdjustmentRules(index, 'volume', oldVolume, newValue)
      } else if (field === 'height' && oldHeight !== null && oldHeight !== undefined && oldHeight !== newValue) {
        await applyMaterialAdjustmentRules(index, 'height', oldHeight, newValue)
      } else if (field === 'length' && oldLength !== null && oldLength !== undefined && oldLength !== newValue) {
        await applyMaterialAdjustmentRules(index, 'length', oldLength, newValue)
      } else if (field === 'depth' && oldDepth !== null && oldDepth !== undefined && oldDepth !== newValue) {
        await applyMaterialAdjustmentRules(index, 'depth', oldDepth, newValue)
      } else if (field === 'quantity' && oldQuantity !== null && oldQuantity !== undefined && oldQuantity !== newValue) {
        await applyMaterialAdjustmentRules(index, 'quantity', oldQuantity, newValue)
      }
    }
  }

  // Editable components (vật tư) fields per quote item
  const updateComponentField = (
    itemIndex: number,
    compIndex: number,
    field: 'unit' | 'unit_price' | 'quantity',
    value: string | number
  ) => {
    const updated = [...items]
    const comps = Array.isArray(updated[itemIndex].components) ? [...(updated[itemIndex].components as any[])] : []
    if (!comps[compIndex]) return
    const comp = { ...comps[compIndex], [field]: value }
    const qty = Number(comp.quantity || 0)
    const price = Number(comp.unit_price || 0)
    comp.total_price = qty * price
    comps[compIndex] = comp
    ;(updated[itemIndex] as any).components = comps
    const compSum = comps.reduce((s: number, c: any) => s + (Number(c.total_price) || 0), 0)
    updated[itemIndex].total_price = compSum > 0 ? compSum : (updated[itemIndex].quantity * updated[itemIndex].unit_price)
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
              volume: (product as any).volume ?? null,
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
            volume: (product as any).volume ?? current.volume ?? null,
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
        const quoteItems = items.map(item => ({
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
          depth: item.depth
        }))

        const { data: insertedItems, error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems)
          .select('id')

        if (itemsError) {
          console.error('Error creating quote items:', itemsError)
          // Don't throw error here, quote was created successfully
        } else if (insertedItems && insertedItems.length === items.length) {
          // Insert components for each quote item if any
          const componentRows = items.flatMap((item, idx) => {
            const quote_item_id = insertedItems[idx].id
            const comps: any[] = Array.isArray((item as any).components) ? ((item as any).components as any[]) : []
            return comps.map((c: any) => ({
              quote_item_id,
              expense_object_id: c.expense_object_id || null,
              name: c.name || null,
              unit: c.unit || null,
              unit_price: Number(c.unit_price || 0),
              quantity: Number(c.quantity || 0),
              total_price: Number(c.total_price || 0)
            }))
          })

          if (componentRows.length > 0) {
            const { error: compsError } = await supabase
              .from('quote_item_components')
              .insert(componentRows)

            if (compsError) {
              console.error('Error creating quote item components:', compsError)
            }
          }
        }
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
      depth: null
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
    field
  }: {
    value: number | null
    onChange: (v: number | null) => void
    format: 'currency' | 'number'
    step?: number
    min?: number
    placeholder?: string
    index: number
    field: string
  }) => {
    const [text, setText] = useState<string>('')
    const isEditing = editingCell && editingCell.index === index && editingCell.field === field

    useEffect(() => {
      if (isEditing) {
        setText(value == null ? '' : String(value))
      }
    }, [isEditing])

    if (!isEditing) {
      const display = value == null ? '' : (format === 'currency' ? formatCurrency(value) : formatNumber(value))
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
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
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
                              <EditableNumberCell
                                value={item.area ?? null}
                                onChange={(v) => updateItem(index, 'area', v == null ? null : Number(v))}
                                format="number"
                                step={0.01}
                                min={0}
                                placeholder="m²"
                                index={index}
                                field={'area'}
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
                              />
                            </div>
                          )}
                          {visibleColumns.height && (
                            <div>
                              <EditableNumberCell
                                value={item.height ?? null}
                                onChange={(v) => updateItem(index, 'height', v == null ? null : Number(v))}
                                format="number"
                                step={1}
                                min={0}
                                placeholder="mm"
                                index={index}
                                field={'height'}
                              />
                            </div>
                          )}
                          {visibleColumns.length && (
                            <div>
                              <EditableNumberCell
                                value={item.length ?? null}
                                onChange={(v) => updateItem(index, 'length', v == null ? null : Number(v))}
                                format="number"
                                step={1}
                                min={0}
                                placeholder="mm"
                                index={index}
                                field={'length'}
                              />
                            </div>
                          )}
                          {visibleColumns.depth && (
                            <div>
                              <EditableNumberCell
                                value={item.depth ?? null}
                                onChange={(v) => updateItem(index, 'depth', v == null ? null : Number(v))}
                                format="number"
                                step={1}
                                min={0}
                                placeholder="mm"
                                index={index}
                                field={'depth'}
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
                                  const match = (item.components || []).find((c: any) => c.expense_object_id === hc.expense_object_id) || (item.components || [])[idx] || {}
                                  const editIndex = index * 1000 + idx
                                  return [
                                    <div key={`val-unit-${idx}`} className="px-2 py-1 text-xs text-gray-800">
                                      <input
                                        type="text"
                                        value={match.unit || ''}
                                        onChange={(e) => updateComponentField(index, idx, 'unit', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-0.5 py-1 text-xs text-black text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Đơn vị"
                                        maxLength={3}
                                      />
                                    </div>,
                                    <div key={`val-price-${idx}`} className="px-2 py-1 text-xs text-gray-800">
                                      <EditableNumberCell
                                        value={match.unit_price != null ? Number(match.unit_price) : null}
                                        onChange={(v) => updateComponentField(index, idx, 'unit_price', Number(v || 0))}
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
                                        onChange={(v) => updateComponentField(index, idx, 'quantity', Number(v || 0))}
                                        format="number"
                                        step={1}
                                        min={0}
                                        placeholder="0"
                                        index={editIndex}
                                        field={`comp-${idx}-quantity`}
                                      />
                                    </div>,
                                    <div key={`val-total-${idx}`} className="px-2 py-1 text-xs text-gray-800">
                                      {match.total_price != null ? formatCurrency(Number(match.total_price)) : ''}
                                    </div>
                                  ]
                                })}
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
                      <div className="flex justify-between items-center py-2">
                        <span className="text-base font-semibold text-black">Tổng cộng:</span>
                        <span className={`text-base font-semibold ${
                          isOverBudget ? 'text-red-600' : 'text-black'
                        }`}>
                          {formatCurrency(formData.total_amount)}
                        </span>
                      </div>
                      
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
                            volume: p.volume ?? null,
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
                            volume: p.volume ?? null,
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
                          volume: p.volume ?? null,
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
                          volume: p.volume ?? null,
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
    </div>
  )
}
