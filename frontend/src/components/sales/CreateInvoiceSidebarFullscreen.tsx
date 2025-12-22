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
  Save,
  Send,
  Package,
  Search,
  Eye,
  CircleHelp,
  ChevronDown,
  ChevronRight
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

interface InvoiceItem {
  id?: string
  product_service_id?: string
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
  // UI-only flag: when true, total_price was set manually and should not auto-sync unit_price
  total_is_manual?: boolean
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

interface CreateInvoiceSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invoiceId?: string // Optional: if provided, load and edit existing invoice
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

export default function CreateInvoiceSidebarFullscreen({ isOpen, onClose, onSuccess, invoiceId }: CreateInvoiceSidebarProps) {
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
  const [productSearch, setProductSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showVariantDialog, setShowVariantDialog] = useState(false)
  const [selectedProductVariants, setSelectedProductVariants] = useState<Product[]>([])
  const [pendingProductClick, setPendingProductClick] = useState<Product | null>(null)
  const [showColumnDialog, setShowColumnDialog] = useState(false)
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
  const INVOICE_FORM_TOUR_STORAGE_KEY = 'invoice-form-tour-status-v1'
  const [isInvoiceTourRunning, setIsInvoiceTourRunning] = useState(false)
  const invoiceTourRef = useRef<any>(null)
  const invoiceShepherdRef = useRef<any>(null)
  const invoiceTourAutoStartAttemptedRef = useRef(false)
  type InvoiceShepherdModule = typeof import('shepherd.js')
  type InvoiceShepherdType = InvoiceShepherdModule & { Tour: new (...args: any[]) => any }
  type InvoiceShepherdTour = InstanceType<InvoiceShepherdType['Tour']>
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    description: false,
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
    invoice_number: '',
    customer_id: '',
    project_id: '',
    invoice_type: 'standard',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    tax_rate: 10,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    currency: 'VND',
    status: 'draft',
    payment_status: 'pending',
    payment_terms: 'Thanh toán trong vòng 30 ngày',
    notes: '',
    terms_and_conditions: 'Hóa đơn có hiệu lực từ ngày phát hành.',
    created_by: ''
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

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      name_product: '',
      description: '',
      quantity: 1,
      unit: '',
      unit_price: 0,
      total_price: 0,
      tax_rate: 10,  // Default tax rate for new items
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
  const itemsRef = useRef<InvoiceItem[]>([])
  useEffect(() => { itemsRef.current = items }, [items])

  // Filter products based on search
  const filteredProducts = products.filter(product => {
    const searchTerm = productSearch.toLowerCase()
    return product.name.toLowerCase().includes(searchTerm) ||
      (product.description || '').toLowerCase().includes(searchTerm) ||
      (product.category || '').toLowerCase().includes(searchTerm)
  })

  // Helper function to extract base product name (remove size/dimension info)
  const getBaseProductName = (productName: string): string => {
    let baseName = productName
      .replace(/\s+ngang\s+\d+/gi, '')
      .replace(/\s+cao\s+\d+/gi, '')
      .replace(/\s+dài\s+\d+/gi, '')
      .replace(/\s+rộng\s+\d+/gi, '')
      .replace(/\s+sâu\s+\d+/gi, '')
      .replace(/\s+\d+x\d+/gi, '')
      .replace(/\s+\d+\s*x\s*\d+/gi, '')
      .trim()

    if (baseName.length < 3) {
      return productName
    }

    return baseName
  }

  // Group products by base name (để xử lý biến thể kích thước)
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

  // Toggle category expansion in product modal
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

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

  // Grid dùng chung cho bảng sản phẩm + block vật tư để header/body luôn thẳng cột
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

  // Hide sidebar when modal opens/closes
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

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchProducts()
      fetchEmployees()
      fetchTaskGroups()
      if (invoiceId) {
        loadInvoiceData()
      } else {
        generateInvoiceNumber()
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
      // Reset when closing sidebar
      setSelectedItemIndex(null)
      resetForm()
      // Clear preloaded rules when closing
      adjustmentRulesMap.current.clear()
      setRulesLoaded(false)
      // Clear any pending adjustment timers
      adjustmentTimersRef.current.forEach((t) => clearTimeout(t))
      adjustmentTimersRef.current.clear()
    }
  }, [isOpen, invoiceId])

  useEffect(() => {
    calculateSubtotal()
  }, [items, formData.discount_amount])

  const startInvoiceTour = useCallback(async () => {
    if (!isOpen || typeof window === 'undefined') return

    if (invoiceTourRef.current) {
      invoiceTourRef.current.cancel()
      invoiceTourRef.current = null
    }

    if (!invoiceShepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: InvoiceShepherdType })?.default ?? (module as unknown as InvoiceShepherdType)
        invoiceShepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = invoiceShepherdRef.current
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

    await waitForElement('[data-tour-id="invoice-form-basic-info"]')
    await waitForElement('[data-tour-id="invoice-form-items"]')
    await waitForElement('[data-tour-id="invoice-form-area-info"]')
    await waitForElement('[data-tour-id="invoice-form-totals"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'invoice-form-intro',
      title: 'Hướng dẫn tạo hóa đơn',
      text: 'Form này giúp bạn tạo hóa đơn với tính năng tự động tính diện tích và điều chỉnh vật tư khi thay đổi kích thước sản phẩm.',
      attachTo: { element: '[data-tour-id="invoice-form-header"]', on: 'bottom' },
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
      id: 'invoice-form-basic-info',
      title: 'Thông tin cơ bản',
      text: 'Điền các trường sau:\n• Số hóa đơn: Nhập số hóa đơn (có thể tự động tạo)\n• Khách hàng (bắt buộc *): Chọn khách hàng từ danh sách\n• Dự án (tùy chọn): Chọn dự án liên quan (tự động tải khi chọn khách hàng)\n• Loại hóa đơn: Chọn loại (Tiêu chuẩn, ...)\n• Ngày phát hành: Ngày phát hành hóa đơn\n• Ngày đến hạn: Ngày đến hạn thanh toán\n• Ghi chú: Ghi chú bổ sung\n\nLưu ý: Hệ thống sẽ tự động tải danh sách dự án khi bạn chọn khách hàng.',
      attachTo: { element: '[data-tour-id="invoice-form-basic-info"]', on: 'top' },
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
      id: 'invoice-form-items',
      title: 'Thêm sản phẩm',
      text: 'Các cách thêm sản phẩm:\n1. Chọn từ danh sách: Nhấn "Chọn từ danh sách" để chọn sản phẩm có sẵn\n2. Thêm sản phẩm tự do: Nhấn "Thêm sản phẩm tự do" để nhập thủ công\n\nThông tin sản phẩm cần điền:\n• Tên sản phẩm: Tên sản phẩm\n• Mô tả: Mô tả chi tiết\n• Số lượng: Số lượng sản phẩm\n• Đơn vị: Đơn vị tính (cái, bộ, m², ...)\n• Đơn giá: Giá bán một đơn vị\n• Thành tiền: Tự động tính = Đơn giá × Số lượng × Diện tích\n\nLưu ý: Bạn có thể thêm nhiều sản phẩm vào hóa đơn.',
      attachTo: { element: '[data-tour-id="invoice-form-items"]', on: 'top' },
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
      id: 'invoice-form-area-info',
      title: 'Nhập kích thước và diện tích',
      text: 'Các trường cần điền:\n• Chiều dài (mm): Nhập chiều dài sản phẩm (đơn vị: mm)\n• Chiều cao (mm): Nhập chiều cao sản phẩm (đơn vị: mm)\n• Diện tích (m²): Tự động tính = (Chiều dài × Chiều cao) / 1,000,000\n• Thể tích (m³): Tự động tính nếu có chiều sâu\n• Chiều sâu (mm): Nhập chiều sâu (nếu cần)\n\nLưu ý:\n• Bạn có thể nhập trực tiếp diện tích nếu đã biết\n• Hệ thống tự động tính diện tích khi nhập chiều dài và chiều cao',
      attachTo: { element: '[data-tour-id="invoice-form-area-info"]', on: 'top' },
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
      id: 'invoice-form-totals',
      title: 'Tổng tiền và lưu',
      text: 'Thông tin hiển thị:\n• Tổng tiền: Tự động tính dựa trên đơn giá và diện tích\n• Thuế VAT: Tự động tính (nếu có)\n• Tổng cộng: Tổng tiền sau thuế\n\nCác nút hành động:\n• Lưu nháp: Lưu hóa đơn ở trạng thái nháp (có thể chỉnh sửa sau)\n• Gửi ngay: Lưu và gửi hóa đơn cho khách hàng ngay lập tức\n\nLưu ý: Sau khi kiểm tra, nhấn "Lưu nháp" để lưu hoặc "Gửi ngay" để gửi hóa đơn cho khách hàng.',
      attachTo: { element: '[data-tour-id="invoice-form-totals"]', on: 'top' },
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
      setIsInvoiceTourRunning(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem(INVOICE_FORM_TOUR_STORAGE_KEY, 'completed')
      }
      invoiceTourRef.current = null
    })

    tour.on('cancel', () => {
      setIsInvoiceTourRunning(false)
      invoiceTourRef.current = null
    })

    invoiceTourRef.current = tour
    setIsInvoiceTourRunning(true)
    tour.start()
  }, [isOpen])

  // Fetch projects when customer changes (but only if not loading invoice data)
  useEffect(() => {
    // Skip if we're currently loading invoice data to avoid interfering
    if (loading && invoiceId) {
      return
    }
    
    if (formData.customer_id) {
      fetchProjectsByCustomer(formData.customer_id)
    } else {
      setProjects([])
      // Only reset project_id if we're not loading invoice data
      if (!invoiceId || !loading) {
        setFormData(prev => ({ ...prev, project_id: '' }))
      }
    }
  }, [formData.customer_id, loading, invoiceId])

  // Auto-start tour when form opens for the first time
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isOpen) return
    if (invoiceTourAutoStartAttemptedRef.current) return

    const storedStatus = localStorage.getItem(INVOICE_FORM_TOUR_STORAGE_KEY)
    invoiceTourAutoStartAttemptedRef.current = true

    if (!storedStatus) {
      // Delay to ensure form is fully rendered
      setTimeout(() => {
        startInvoiceTour()
      }, 800)
    }
  }, [isOpen, startInvoiceTour])

  // Reset tour auto-start when form closes
  useEffect(() => {
    if (!isOpen) {
      invoiceTourAutoStartAttemptedRef.current = false
    }
  }, [isOpen])

  // Cleanup tour on unmount
  useEffect(() => {
    return () => {
      invoiceTourRef.current?.cancel()
      invoiceTourRef.current?.destroy?.()
      invoiceTourRef.current = null
    }
  }, [])

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
      
      // Use Supabase client directly to get products
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
      } else {
        // If no data from database, use sample data
        const sampleProducts = [
          {
            id: '1',
            name: 'Laptop Dell XPS 13',
            description: 'Laptop cao cấp với màn hình 13 inch, RAM 16GB, SSD 512GB',
            unit: 'cái',
            unit_price: 25000000,
            category: 'Thiết bị điện tử',
            area: 0.2,
            volume: 0.005,
            height: 2.5,
            length: 35.0,
            depth: 25.0
          },
          {
            id: '2',
            name: 'Bàn làm việc gỗ',
            description: 'Bàn làm việc gỗ tự nhiên, kích thước 120x60cm',
            unit: 'cái',
            unit_price: 3500000,
            category: 'Nội thất',
            area: 0.72,
            volume: 0.18,
            height: 75.0,
            length: 120.0,
            depth: 60.0
          },
          {
            id: '3',
            name: 'Dịch vụ tư vấn IT',
            description: 'Dịch vụ tư vấn công nghệ thông tin cho doanh nghiệp',
            unit: 'giờ',
            unit_price: 500000,
            category: 'Dịch vụ',
            area: null,
            volume: null,
            height: null,
            length: null,
            depth: null
          },
          {
            id: '4',
            name: 'Máy in Canon',
            description: 'Máy in laser đen trắng, tốc độ 20 trang/phút',
            unit: 'cái',
            unit_price: 4500000,
            category: 'Thiết bị văn phòng',
            area: 0.3,
            volume: 0.08,
            height: 40.0,
            length: 50.0,
            depth: 40.0
          },
          {
            id: '5',
            name: 'Ghế văn phòng',
            description: 'Ghế văn phòng có thể điều chỉnh độ cao, màu đen',
            unit: 'cái',
            unit_price: 1200000,
            category: 'Nội thất',
            area: 0.25,
            volume: 0.05,
            height: 100.0,
            length: 50.0,
            depth: 50.0
          }
        ]
        setProducts(sampleProducts)
        console.log('🔍 Using sample products data:', sampleProducts)
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error)
      // Use sample data as fallback
      const sampleProducts = [
        {
          id: '1',
          name: 'Laptop Dell XPS 13',
          description: 'Laptop cao cấp với màn hình 13 inch, RAM 16GB, SSD 512GB',
          unit: 'cái',
          unit_price: 25000000,
          category: 'Thiết bị điện tử'
        },
        {
          id: '2',
          name: 'Bàn làm việc gỗ',
          description: 'Bàn làm việc gỗ tự nhiên, kích thước 120x60cm',
          unit: 'cái',
          unit_price: 3500000,
          category: 'Nội thất'
        },
        {
          id: '3',
          name: 'Dịch vụ tư vấn IT',
          description: 'Dịch vụ tư vấn công nghệ thông tin cho doanh nghiệp',
          unit: 'giờ',
          unit_price: 500000,
          category: 'Dịch vụ'
        }
      ]
      setProducts(sampleProducts)
      console.log('🔍 Using fallback sample products data:', sampleProducts)
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

  const generateInvoiceNumber = () => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    setFormData(prev => ({
      ...prev,
      invoice_number: `INV-${dateStr}-${randomStr}`
    }))
  }

  const loadInvoiceData = async () => {
    if (!invoiceId) return
    
    try {
      setLoading(true)
      console.log('🔍 Loading invoice data for ID:', invoiceId)
      
      // Load invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()
      
      if (invoiceError) {
        console.error('❌ Error loading invoice:', invoiceError)
        alert('Không thể tải hóa đơn: ' + invoiceError.message)
        return
      }
      
      console.log('✅ Invoice loaded:', invoice)
      
      // Load invoice items FIRST before setting formData to avoid race conditions
      const { data: invoiceItems, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true })
      
      console.log('🔍 Invoice items query result:', { invoiceItems, itemsError, count: invoiceItems?.length || 0 })
      
      if (itemsError) {
        console.error('❌ Error loading invoice items:', itemsError)
        alert('Không thể tải danh sách sản phẩm: ' + itemsError.message)
      } else {
        console.log('✅ Invoice items loaded successfully:', invoiceItems?.length || 0, 'items')
        
        if (invoiceItems && invoiceItems.length > 0) {
          console.log('🔍 Raw invoice items data:', invoiceItems)
          
          const loadedItems: InvoiceItem[] = invoiceItems.map((item: any) => {
            console.log('🔍 Mapping invoice item:', {
              id: item.id,
              name_product: item.name_product,
              quantity: item.quantity,
              unit_price: item.unit_price,
              product_service_id: item.product_service_id
            })
            
            return {
              id: item.id,
              invoice_id: item.invoice_id,
              product_service_id: item.product_service_id || null,
              name_product: item.name_product || '',
              description: item.description || '',
              quantity: Number(item.quantity) || 1,
              unit: item.unit || '',
              unit_price: Number(item.unit_price) || 0,
              total_price: Number(item.total_price) || 0,
              tax_rate: item.tax_rate != null ? Number(item.tax_rate) : (invoice.tax_rate != null ? Number(invoice.tax_rate) : 10),  // Load tax_rate from item or use invoice default
              area: item.area != null ? Number(item.area) : null,
              baseline_area: item.area != null ? Number(item.area) : null, // Use current area as baseline
              volume: item.volume != null ? Number(item.volume) : null,
              baseline_volume: item.volume != null ? Number(item.volume) : null, // Use current volume as baseline
              height: item.height != null ? Number(item.height) : null,
              length: item.length != null ? Number(item.length) : null,
              depth: item.depth != null ? Number(item.depth) : null,
              area_is_manual: false,
              volume_is_manual: false,
              // Load components from product_components JSONB column if exists
              components: Array.isArray(item.product_components) && item.product_components.length > 0
                ? item.product_components.map((comp: any) => ({
                    expense_object_id: comp.expense_object_id,
                    name: comp.name,
                    unit: comp.unit || '',
                    unit_price: Number(comp.unit_price || 0),
                    quantity: Number(comp.quantity || 0),
                    total_price: Number(comp.total_price || 0),
                    baseline_quantity: comp.quantity != null ? Number(comp.quantity) : 0 // Store baseline for quantity adjustments
                  }))
                : []
            }
          })
          
          console.log('🔍 Mapped invoice items:', loadedItems)
          console.log('🔍 Setting items with', loadedItems.length, 'items')
          
          // Set items immediately after mapping
          setItems(loadedItems)
          
          // Verify items were set
          setTimeout(() => {
            console.log('🔍 Items state after setItems:', loadedItems.length)
          }, 100)
        } else {
          console.log('⚠️ No invoice items found, setting empty item')
          // No items, start with empty item
          setItems([{ 
            name_product: '', 
            description: '', 
            quantity: 1, 
            unit: '', 
            unit_price: 0, 
            total_price: 0,
            tax_rate: invoice.tax_rate ?? 10,  // Use invoice tax_rate as default
            area: null,
            volume: null,
            height: null,
            length: null,
            depth: null
          }])
        }
      }
      
      // Fill form data AFTER loading items to avoid race conditions
      // Use setTimeout to ensure items are set before formData triggers other useEffects
      await new Promise(resolve => setTimeout(resolve, 50))
      
      setFormData({
        invoice_number: invoice.invoice_number || '',
        customer_id: invoice.customer_id || '',
        project_id: invoice.project_id || '',
        invoice_type: invoice.invoice_type || 'standard',
        issue_date: invoice.issue_date ? String(invoice.issue_date).slice(0, 10) : new Date().toISOString().split('T')[0],
        due_date: invoice.due_date ? String(invoice.due_date).slice(0, 10) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: invoice.subtotal || 0,
        tax_rate: invoice.tax_rate || 10,
        tax_amount: invoice.tax_amount || 0,
        discount_amount: invoice.discount_amount || 0,
        total_amount: invoice.total_amount || 0,
        currency: invoice.currency || 'VND',
        status: invoice.status || 'draft',
        payment_status: invoice.payment_status || 'pending',
        payment_terms: invoice.payment_terms || 'Thanh toán trong vòng 30 ngày',
        notes: invoice.notes || '',
        terms_and_conditions: invoice.terms_and_conditions || 'Hóa đơn có hiệu lực từ ngày phát hành.',
        created_by: invoice.created_by || ''
      })
      
      // Double-check items are still set after formData update
      if (invoiceItems && invoiceItems.length > 0) {
        setTimeout(() => {
          console.log('🔍 Final check - items should be set:', invoiceItems.length)
        }, 200)
      }
      
      // Load projects for the customer
      if (invoice.customer_id) {
        // Fetch projects for customer
        try {
          setLoadingProjects(true)
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('id, project_code, name, status, start_date, end_date')
            .eq('customer_id', invoice.customer_id)
            .in('status', ['planning', 'active'])
            .order('name')
          
          if (!projectsError && projectsData) {
            setProjects(projectsData || [])
          }
        } catch (error) {
          console.error('Error loading projects:', error)
        } finally {
          setLoadingProjects(false)
        }
      }
    } catch (error) {
      console.error('❌ Error loading invoice data:', error)
      alert('Không thể tải dữ liệu hóa đơn: ' + (error as Error).message)
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
    // Total amount = subtotal + total tax from all items - discount
    const total_amount = subtotal + total_tax - formData.discount_amount
    
    setFormData(prev => ({ 
      ...prev, 
      subtotal, 
      tax_amount: total_tax,  // Store total tax for reference
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
      tax_rate: formData.tax_rate ?? 10,  // Use form tax_rate as default for new items
      area: null,
      volume: null,
      height: null,
      length: null,
      depth: null
    }])
  }

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const resetColumns = () => {
    setVisibleColumns({
      name: true,
      description: false,
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

  const computeItemTotal = (item: InvoiceItem) => {
    const unitPrice = Number(item.unit_price || 0) // Đơn giá / m²
    const areaVal = item.area != null ? Number(item.area) : null // Diện tích (m²)

    if (areaVal != null && isFinite(areaVal) && areaVal > 0) {
      // Có diện tích: thành tiền = (Đơn giá / m²) × Diện tích (m²)
      return unitPrice * areaVal
    }

    // Không có diện tích: thành tiền = đơn giá × số lượng
    const quantity = Number(item.quantity || 0)
    return unitPrice * quantity
  }

  // Check if a rule is applicable based on change direction and threshold
  const checkRuleApplicable = (
    rule: any,
    changeDirection: 'increase' | 'decrease',
    changePercentage: number,
    changeAbsolute: number
  ): boolean => {
    const isInverseRule = rule.change_direction === 'decrease' && Number(rule.adjustment_value || 0) < 0

    if (isInverseRule) {
      if (changeDirection !== 'increase') {
        return false
      }
    } else {
      if (rule.change_direction !== 'both' && rule.change_direction !== changeDirection) {
        return false
      }
    }

    if (rule.change_type === 'percentage') {
      return Math.abs(changePercentage) >= Math.abs(rule.change_value)
    } else if (rule.change_type === 'absolute') {
      return Math.abs(changeAbsolute) >= Math.abs(rule.change_value)
    }
    return false
  }

  // Apply rule for increase direction
  const applyIncreaseRule = (adjustedQuantity: number, rule: any): number => {
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
  const applyDecreaseRule = (adjustedQuantity: number, rule: any): number => {
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
  const applyBothRule = (adjustedQuantity: number, rule: any, changeDirection: 'increase' | 'decrease'): number => {
    const adjustmentValue = Number(rule.adjustment_value || 0)
    if (rule.adjustment_type === 'percentage') {
      const adjustmentFactor = 1 + (adjustmentValue / 100)
      return adjustedQuantity * adjustmentFactor
    } else if (rule.adjustment_type === 'absolute') {
      return adjustedQuantity + adjustmentValue
    }
    return adjustedQuantity
  }

  // Apply adjustment based on rule type
  const applyRuleAdjustment = (adjustedQuantity: number, rule: any, changeDirection: 'increase' | 'decrease'): number => {
    const isInverseRule = rule.change_direction === 'decrease' && Number(rule.adjustment_value || 0) < 0
    if (rule.change_direction === 'increase') {
      return applyIncreaseRule(adjustedQuantity, rule)
    } else if (rule.change_direction === 'decrease' && !isInverseRule) {
      return applyDecreaseRule(adjustedQuantity, rule)
    } else if (rule.change_direction === 'both') {
      return applyBothRule(adjustedQuantity, rule, changeDirection)
    } else if (isInverseRule) {
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
    if (oldValue === null || newValue === null || oldValue === newValue) return
    const item = itemsRef.current[itemIndex]
    const components = Array.isArray(item.components) ? item.components : []
    if (components.length === 0) return

    try {
      const adjustedComponents = await Promise.all(
        components.map(async (component: any) => {
          const expenseObjectId = component.expense_object_id
          if (!expenseObjectId) return component
          try {
            const rules = adjustmentRulesMap.current.get(`${expenseObjectId}_${dimensionType}`) || []
            if (rules.length === 0) return component
            const changePercentage = oldValue > 0 ? ((newValue - oldValue) / oldValue) * 100 : 0
            const changeAbsolute = newValue - oldValue
            const changeDirection = changeAbsolute > 0 ? 'increase' : 'decrease'
            const prodCatId = (item as any).product_category_id || null
            const applicableRules = rules.filter((rule: any) => {
              const allowedCats = Array.isArray(rule.allowed_category_ids) ? rule.allowed_category_ids : null
              if (allowedCats && allowedCats.length > 0) {
                if (!prodCatId || !allowedCats.includes(prodCatId)) return false
              }
              return checkRuleApplicable(rule, changeDirection, changePercentage, changeAbsolute)
            })
            if (applicableRules.length === 0) return component
            const currentProductQuantity = Number(item.quantity || 1)
            const baselineQuantityPerUnit = component.baseline_quantity != null
              ? Number(component.baseline_quantity)
              : (component.quantity != null && currentProductQuantity > 0
                ? Number(component.quantity) / currentProductQuantity
                : 0)
            let adjustedQuantity = baselineQuantityPerUnit * currentProductQuantity
            for (const rule of applicableRules) {
              adjustedQuantity = applyRuleAdjustment(adjustedQuantity, rule, changeDirection)
            }
            adjustedQuantity = Math.max(0, adjustedQuantity)
            return {
              ...component,
              quantity: adjustedQuantity,
              total_price: adjustedQuantity * Number(component.unit_price || 0)
            }
          } catch (err) {
            console.error('[Adjust] Error applying rules for component', err)
            return component
          }
        })
      )
      setItems(prev => {
        const updated = [...prev]
        updated[itemIndex] = {
          ...updated[itemIndex],
          components: adjustedComponents
        }
        updated[itemIndex].total_price = computeItemTotal(updated[itemIndex])
        return updated
      })
    } catch (error) {
      console.error('[Adjust] Error in applyMaterialAdjustmentRules', error)
    }
  }

  const updateItem = async (index: number, field: keyof InvoiceItem, value: string | number | null) => {
    const updatedItems = [...items]
    const oldItem = { ...updatedItems[index] }
    const oldQuantity = oldItem.quantity
    const oldArea = oldItem.area
    const oldVolume = oldItem.volume
    const oldHeight = oldItem.height
    const oldLength = oldItem.length
    const oldDepth = oldItem.depth
    
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    const curr = updatedItems[index]
    
    // Convert dimensions from mm to meters for calculations
    const lengthMm = curr.length != null ? Number(curr.length) : null
    const heightMm = curr.height != null ? Number(curr.height) : null
    const depthMm = curr.depth != null ? Number(curr.depth) : null
    
    let autoAreaChanged = false
    let autoVolumeChanged = false
    
    // Mark manual overrides for total_price
    if (field === 'total_price') {
      updatedItems[index].total_is_manual = value != null
    }
    
    // Recalculate total_price cho dòng sản phẩm khi thay đổi các trường nguồn
    if (field === 'quantity' || field === 'unit_price' || field === 'area') {
      updatedItems[index].total_price = computeItemTotal(updatedItems[index])
      updatedItems[index].total_is_manual = false
    }
    
    // When quantity changes, adjust components quantity proportionally
    if (field === 'quantity') {
      const newQuantity = Number(value || 0)
      const oldQty = Number(oldQuantity || 1)
      
      if (oldQty > 0 && newQuantity > 0 && curr.components && Array.isArray(curr.components) && curr.components.length > 0) {
        const updatedComponents = curr.components.map((component: any) => {
          const currentComponentQuantity = Number(component.quantity || 0)
          const baseComponentQuantityPerUnit = currentComponentQuantity / oldQty
          const newComponentQuantity = baseComponentQuantityPerUnit * newQuantity
          const adjustedUnitPrice = Number(component.unit_price || 0)
          
          return {
            ...component,
            quantity: Math.max(0, newComponentQuantity),
            total_price: Math.max(0, newComponentQuantity) * adjustedUnitPrice
          }
        })
        
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
      if ((field === 'length' || field === 'height') && !curr.area_is_manual) {
        if (lengthMm != null && heightMm != null) {
          const quantity = Number(curr.quantity || 1)
          const baselineAreaPerUnit = (lengthMm * heightMm) / 1_000_000
          const computedArea = baselineAreaPerUnit * quantity
          const rounded = Math.round(computedArea * 100) / 100
          if (curr.area == null || Math.abs(Number(curr.area) - rounded) > 0.01) {
            curr.area = rounded
            autoAreaChanged = true
            if (curr.baseline_area == null) {
              curr.baseline_area = Math.round(baselineAreaPerUnit * 100) / 100
            }
            updatedItems[index].total_price = computeItemTotal(updatedItems[index])
          }
        } else {
          if (curr.area != null) {
            curr.area = null
            autoAreaChanged = true
            updatedItems[index].total_price = computeItemTotal(updatedItems[index])
          }
        }
      }

      // Recompute volume when any of area/height/length/depth changes and volume is not manual
      if ((field === 'height' || field === 'length' || field === 'depth' || field === 'area') && !curr.volume_is_manual) {
        const quantity = Number(curr.quantity || 1)
        let computedVolume: number | null = null
        let baselineVolumePerUnit: number | null = null

        if (lengthMm != null && heightMm != null && depthMm != null) {
          baselineVolumePerUnit = (lengthMm * heightMm * depthMm) / 1_000_000_000
          computedVolume = baselineVolumePerUnit * quantity
        } else if (curr.area != null && heightMm != null) {
          const baselineAreaPerUnit = curr.baseline_area ?? Math.round((curr.area / quantity) * 100) / 100
          baselineVolumePerUnit = baselineAreaPerUnit * (heightMm / 1000)
          computedVolume = baselineVolumePerUnit * quantity
        }

        if (computedVolume != null && isFinite(computedVolume)) {
          const roundedV = Math.round(computedVolume * 1e9) / 1e9
          if (curr.volume == null || Math.abs(Number(curr.volume) - roundedV) > 1e-12) {
            curr.volume = roundedV
            autoVolumeChanged = true
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
    const newValue = value !== null ? Number(value) : null
    const isEditingSameField = !!editingCell && editingCell.index === index && editingCell.field === field
    if (autoAdjustEnabled && !isEditingSameField && newValue !== null && oldItem.components && oldItem.components.length > 0) {
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
  }

  // Editable components (vật tư) fields per invoice item – giống giao diện Báo giá
  const updateComponentField = (
    itemIndex: number,
    expenseObjectId: string,
    field: 'unit' | 'unit_price' | 'quantity',
    value: string | number
  ) => {
    const updated = [...items]
    const comps = Array.isArray((updated[itemIndex] as any).components)
      ? ([...(updated[itemIndex] as any).components] as any[])
      : []
    const idx = comps.findIndex((c: any) => String(c.expense_object_id) === String(expenseObjectId))
    let comp: any
    if (idx >= 0) {
      comp = { ...comps[idx] }
    } else {
      comp = {
        expense_object_id: String(expenseObjectId),
        name: headerComponents.find(h => h.expense_object_id === expenseObjectId)?.name || expenseObjectId,
        unit: '',
        unit_price: 0,
        quantity: 0,
        total_price: 0
      }
    }
    comp[field] = value
    const qty = Number(comp.quantity || 0)
    const price = Number(comp.unit_price || 0)
    comp.total_price = qty * price
    if (idx >= 0) comps[idx] = comp
    else comps.push(comp)
    ;(updated[itemIndex] as any).components = comps
    // Cập nhật lại thành tiền dòng hóa đơn sau khi thay đổi vật tư
    updated[itemIndex].total_price = computeItemTotal(updated[itemIndex])
    setItems(updated)
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
            const len = initialValue.length
            inputRef.current.setSelectionRange(len, len)
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
            inputRef.current.setSelectionRange(pos, pos)
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
      
      // Truncate display to 15 characters for total_price and unit_price fields
      const truncatedDisplay = (field === 'total_price' || field === 'unit_price') && display.length > 15 
        ? display.substring(0, 15) + '...' 
        : display
      
      return (
        <div
          className={`w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-right bg-white cursor-text ${(field === 'total_price' || field === 'unit_price') ? 'max-w-[15ch] truncate' : ''}`}
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
          tabIndex={0}
          title={display}
        >
          {truncatedDisplay || (placeholder || '')}
        </div>
      )
    }

    return (
      <input
        ref={inputRef}
        type={format === 'number' ? 'number' : 'text'}
        value={text}
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
            // Find next focusable input before closing edit mode
            const currentInput = e.target as HTMLInputElement
            const allInputs = Array.from(document.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled])'))
            const currentIndex = allInputs.indexOf(currentInput)
            const isShiftTab = e.shiftKey
            setEditingCell(null)
            cursorPositionRef.current = null
            isInitializedRef.current = false
            // Move to next/previous input after a short delay to allow state update
            setTimeout(() => {
              if (currentIndex >= 0) {
                let targetInput: HTMLElement | null = null
                if (isShiftTab && currentIndex > 0) {
                  // Shift+Tab: move to previous input
                  targetInput = allInputs[currentIndex - 1] as HTMLElement
                } else if (!isShiftTab && currentIndex < allInputs.length - 1) {
                  // Tab: move to next input
                  targetInput = allInputs[currentIndex + 1] as HTMLElement
                }
                if (targetInput) {
                  targetInput.focus()
                  // If it's an EditableNumberCell (parent div with cursor-text class), trigger edit mode
                  const parentDiv = targetInput.parentElement
                  if (parentDiv && parentDiv.classList.contains('cursor-text')) {
                    setTimeout(() => parentDiv.click(), 0)
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

  const openProductModal = (itemIndex: number) => {
    setSelectedItemIndex(itemIndex)
    setShowProductModal(true)
  }

  // Khi click "Chọn sản phẩm này" hoặc biến thể trong modal
  const selectProduct = (product: Product) => {
    console.log('🔍 selectProduct (Invoice) called with:', product)
    // Giữ lại để dùng cho logic thêm hàng nếu cần – hiện modal chính dùng multi-select
    if (selectedItemIndex !== null) {
      const updatedItems = [...items]
      const base = updatedItems[selectedItemIndex]
      const unitPrice = product.unit_price || 0
      const areaVal = product.area != null ? Number(product.area) : null
      const newItem: InvoiceItem = {
        ...base,
        product_service_id: product.id,
        name_product: product.name,
        description: product.description || '',
        quantity: base.quantity || 1,
        unit: product.unit || base.unit || '',
        unit_price: unitPrice,
        total_price: areaVal != null && isFinite(areaVal) && areaVal > 0
          ? unitPrice * areaVal
          : (base.quantity || 1) * unitPrice,
        tax_rate: base.tax_rate ?? formData.tax_rate ?? 10,  // Keep existing tax_rate or use form default
        area: product.area ?? null,
        volume: product.volume ?? null,
        height: product.height ?? null,
        length: product.length ?? null,
        depth: product.depth ?? null
      }
      updatedItems[selectedItemIndex] = newItem
      setItems(updatedItems)
    }
    setShowProductModal(false)
    setSelectedItemIndex(null)
  }

  // Xử lý click chọn sản phẩm trong modal: nếu có nhiều biến thể sẽ mở dialog biến thể
  const handleProductClick = (product: Product) => {
    const baseName = getBaseProductName(product.name)
    const variants = filteredProducts.filter(p => getBaseProductName(p.name) === baseName)

    if (variants.length > 1) {
      setSelectedProductVariants(variants)
      setPendingProductClick(product)
      setShowVariantDialog(true)
    } else {
      selectProduct(product)
    }
  }

  const handleSubmit = async (sendImmediately = false) => {
    setSubmitting(true)
    
    try {
      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser()
      
      let created_by = null
      if (user?.id) {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (employee) {
          created_by = employee.id
        }
      }
      
      const invoiceData = {
        invoice_number: formData.invoice_number,
        customer_id: formData.customer_id,
        project_id: formData.project_id || null,
        invoice_type: formData.invoice_type,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        subtotal: formData.subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: formData.tax_amount,
        discount_amount: formData.discount_amount,
        total_amount: formData.total_amount,
        currency: formData.currency,
        status: sendImmediately ? 'sent' : formData.status,
        payment_status: formData.payment_status,
        payment_terms: formData.payment_terms,
        notes: formData.notes,
        terms_and_conditions: formData.terms_and_conditions,
        created_by: invoiceId ? undefined : created_by, // Don't update created_by when editing
        items: [] // Empty JSONB field, items will be in invoice_items table
      }

      let invoice: any
      if (invoiceId) {
        // Update existing invoice
        const { data: updatedInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoiceId)
          .select()
          .single()

        if (invoiceError) {
          console.error('Invoice update error:', invoiceError)
          throw new Error(`Lỗi cập nhật hóa đơn: ${invoiceError.message}`)
        }
        
        invoice = updatedInvoice
        console.log('Invoice updated successfully:', invoice)
        
        // Delete existing invoice items
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoiceId)

        if (deleteError) {
          console.error('Error deleting old invoice items:', deleteError)
          // Continue anyway
        }
      } else {
        // Create new invoice
        const result = await apiPost('/api/sales/invoices', {
          ...invoiceData,
          created_by,
          items: items.map(item => ({
            name_product: item.name_product,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            total_price: item.total_price,
            tax_rate: item.tax_rate ?? formData.tax_rate ?? 10,  // Include tax_rate for each item
            area: item.area ?? null,
            volume: item.volume ?? null,
            height: item.height ?? null,
            length: item.length ?? null,
            depth: item.depth ?? null
          }))
        })
        
        invoice = result
        console.log('Invoice created successfully:', invoice)
      }

      const currentInvoiceId = invoiceId || invoice.id

      // Save invoice items
      if (items.length > 0) {
        const invoiceItems = items.map(item => {
          // Format components as JSONB array for product_components column
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
            invoice_id: currentInvoiceId,
            product_service_id: item.product_service_id || null,
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
            product_components: productComponents.length > 0 ? productComponents : []
          }
        })

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems)

        if (itemsError) {
          console.error('Error saving invoice items:', itemsError)
          // Don't throw error here, invoice was saved successfully
        }
      }
        
      // If sending immediately, also send the invoice
      if (sendImmediately) {
        await apiPost(`/api/sales/invoices/${currentInvoiceId}/send`, {})
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
          ✅ Hóa đơn đã được ${invoiceId ? 'cập nhật' : 'tạo'} thành công!
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
      console.error(`Error ${invoiceId ? 'updating' : 'creating'} invoice:`, error)
      alert(`Có lỗi xảy ra khi ${invoiceId ? 'cập nhật' : 'tạo'} hóa đơn: ` + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      invoice_number: '',
      customer_id: '',
      project_id: '',
      invoice_type: 'standard',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 0,
      tax_rate: 10,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 0,
      currency: 'VND',
      status: 'draft',
      payment_status: 'pending',
      payment_terms: 'Thanh toán trong vòng 30 ngày',
      notes: '',
      terms_and_conditions: 'Hóa đơn có hiệu lực từ ngày phát hành.',
      created_by: ''
    })
    setItems([{ 
      name_product: '', 
      description: '', 
      quantity: 1, 
      unit: '', 
      unit_price: 0, 
      total_price: 0,
      tax_rate: formData.tax_rate ?? 10,  // Use form tax_rate as default
      area: null,
      volume: null,
      height: null,
      length: null,
      depth: null
    }])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      {/* Full screen container */}
      <div className="fixed inset-0 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-white flex-shrink-0" data-tour-id="invoice-form-header">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-black mr-3" />
            <h1 className="text-xl font-semibold text-black">{invoiceId ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => startInvoiceTour()}
              disabled={isInvoiceTourRunning || submitting}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isInvoiceTourRunning || submitting
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-white bg-blue-600 hover:bg-blue-700'
              }`}
              title="Bắt đầu hướng dẫn tạo hóa đơn"
            >
              <CircleHelp className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="w-full">
            {/* Basic Information */}
            <div className="mb-8" data-tour-id="invoice-form-basic-info">
              <h2 className="text-lg font-medium text-black mb-4">Thông tin cơ bản</h2>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Số hóa đơn</label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="INV-20241225-ABC123"
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
                  <label className="block text-sm font-medium text-black mb-1">Loại hóa đơn</label>
                  <select
                    value={formData.invoice_type}
                    onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="standard">Hóa đơn thường</option>
                    <option value="proforma">Hóa đơn proforma</option>
                    <option value="credit">Hóa đơn tín dụng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
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
                  <label className="block text-sm font-medium text-black mb-1">Ngày đến hạn</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
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
                  <label className="block text-sm font-medium text-black mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="draft">Nháp</option>
                    <option value="sent">Đã gửi</option>
                    <option value="viewed">Đã xem</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="overdue">Quá hạn</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-8" data-tour-id="invoice-form-items">
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

              <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
                  <div className="grid gap-4 text-sm font-medium text-black" style={{
                    gridTemplateColumns: [
                      visibleColumns.name && '2fr',
                      visibleColumns.description && '150px', 
                      visibleColumns.quantity && '1fr',
                      visibleColumns.unit && '1fr',
                      visibleColumns.unit_price && '1.5fr',
                      visibleColumns.total_price && '1.5fr',
                      visibleColumns.area && '1fr',
                      visibleColumns.volume && '1fr',
                      visibleColumns.height && '1fr',
                      visibleColumns.length && '1fr',
                      visibleColumns.depth && '1fr'
                    ].filter(Boolean).join(' ')
                  }}>
                    {visibleColumns.name && <div>Tên sản phẩm</div>}
                    {visibleColumns.description && <div>Mô tả</div>}
                    {visibleColumns.quantity && <div>Số lượng</div>}
                    {visibleColumns.unit && <div>Đơn vị</div>}
                    {visibleColumns.unit_price && <div>Đơn giá / m²</div>}
                    {visibleColumns.total_price && <div>Thành tiền</div>}
                    {visibleColumns.area && <div data-tour-id="invoice-form-area-info">Diện tích (m²)</div>}
                    {visibleColumns.volume && <div>Thể tích</div>}
                    {visibleColumns.height && <div>Cao</div>}
                    {visibleColumns.length && <div>Dài</div>}
                    {visibleColumns.depth && <div>Sâu</div>}
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-300">
                  {items.map((item, index) => (
                    <div key={index} className="px-4 py-3">
                      <div className="grid gap-4 items-center" style={{
                        gridTemplateColumns: [
                          visibleColumns.name && '2fr',
                          visibleColumns.description && '150px', 
                          visibleColumns.quantity && '1fr',
                          visibleColumns.unit && '1fr',
                          visibleColumns.unit_price && '1.5fr',
                          visibleColumns.total_price && '1.5fr',
                          visibleColumns.area && '1fr',
                          visibleColumns.volume && '1fr',
                          visibleColumns.height && '1fr',
                          visibleColumns.length && '1fr',
                          visibleColumns.depth && '1fr'
                        ].filter(Boolean).join(' ')
                      }}>
                        {visibleColumns.name && (
                          <div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={item.name_product}
                                onChange={(e) => updateItem(index, 'name_product', e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Tên sản phẩm"
                              />
                              <button
                                type="button"
                                onClick={() => openProductModal(index)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
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
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black cursor-pointer hover:bg-gray-50 transition-colors flex items-center h-[36px] overflow-hidden"
                              title={item.description || "Click để chỉnh sửa mô tả"}
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
                          <div className="max-w-[15ch]">
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
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-col items-end gap-1 max-w-[15ch]">
                                <EditableNumberCell
                                  value={item.total_price}
                                  onChange={(v) => updateItem(index, 'total_price', Number(v || 0))}
                                  format="currency"
                                  step={1000}
                                  min={0}
                                  placeholder="0 ₫"
                                  index={index}
                                  field={'total_price'}
                                  commitOnChange
                                  tabIndex={index * 100 + 6}
                                />
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">+ Thuế:</span>
                                  <input
                                    type="number"
                                    value={item.tax_rate != null ? item.tax_rate : (formData.tax_rate != null ? formData.tax_rate : 10)}
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
                                    tabIndex={index * 100 + 16}
                                  />
                                  <span className="text-xs text-gray-500">%</span>
                                  <span className="text-xs text-gray-500">
                                    = {formatCurrency(item.total_price * ((item.tax_rate != null ? item.tax_rate : (formData.tax_rate != null ? formData.tax_rate : 10)) / 100))}
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
                              value={item.area ?? null}
                              onChange={(v) => updateItem(index, 'area', v == null ? null : Number(v))}
                              format="number"
                              step={0.000001}
                              min={0}
                              placeholder="m²"
                              index={index}
                              field={'area'}
                              commitOnChange
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
                      </div>

                      {/* Vật tư (components) - trình bày giống layout Báo giá */}
                      {Array.isArray((item as any).components) && (item as any).components.length > 0 && (
                        <div className="mt-3 border-t border-gray-200 pt-3">
                          <div className="text-xs font-semibold text-gray-900 mb-1">Vật tư</div>
                          <div className="w-full">
                            {/* Hàng 1: tên vật tư theo từng đối tượng chi phí */}
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(headerComponents.length || 1) * 4}, minmax(auto, auto))` }}>
                              {(headerComponents.length > 0 ? headerComponents : [{}]).map((c: any, idx: number) => (
                                <div key={`hdr-comp-name-${idx}`} className="col-span-4 font-semibold text-gray-800 whitespace-nowrap px-2">
                                  {c?.name || c?.expense_object_id || 'Vật tư'}
                                </div>
                              ))}
                            </div>
                            {/* Hàng 2: tên 4 cột Đơn vị / Đơn giá / Số lượng / Thành tiền */}
                            <div
                              className="mt-1 grid gap-2 text-xs text-gray-600"
                              style={{
                                gridTemplateColumns: `repeat(${(headerComponents.length || 1)}, 80px 100px 80px 120px)`
                              }}
                            >
                              {(headerComponents.length > 0 ? headerComponents : [{}]).flatMap((_, idx) => [
                                <div key={`hdr-unit-${idx}`} className="px-2">Đơn vị</div>,
                                <div key={`hdr-price-${idx}`} className="px-2">Đơn giá</div>,
                                <div key={`hdr-qty-${idx}`} className="px-2">Đơn vị</div>,
                                <div key={`hdr-total-${idx}`} className="px-2">Thành tiền</div>
                              ])}
                            </div>
                            {/* Hàng 3: giá trị vật tư trên 1 hàng, giống báo giá */}
                            <div
                              className="mt-1 grid gap-2 text-xs text-gray-800"
                              style={{
                                gridTemplateColumns: `repeat(${(headerComponents.length || 1)}, 80px 100px 80px 120px)`
                              }}
                            >
                              {(headerComponents.length > 0 ? headerComponents : [{}]).flatMap((hc: any, idx: number) => {
                                const realMatch: any =
                                  (item as any).components &&
                                  Array.isArray((item as any).components)
                                    ? (item as any).components.find(
                                        (c: any) => String(c.expense_object_id) === String(hc.expense_object_id)
                                      )
                                    : null
                                if (!realMatch) {
                                  return []
                                }
                                const match = realMatch
                                const editIndex = index * 1000 + idx
                                return [
                                  <div key={`val-unit-${idx}`} className="px-2 py-1">
                                    <input
                                      type="text"
                                      value={match.unit || ''}
                                      onChange={(e) =>
                                        updateComponentField(index, String(hc.expense_object_id), 'unit', e.target.value)
                                      }
                                      className="w-full border border-gray-300 rounded-md px-1 py-1 text-xs text-black text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      placeholder="ĐV"
                                      maxLength={3}
                                    />
                                  </div>,
                                  <div key={`val-price-${idx}`} className="px-2 py-1">
                                    <EditableNumberCell
                                      value={match.unit_price != null ? Number(match.unit_price) : null}
                                      onChange={(v) =>
                                        updateComponentField(
                                          index,
                                          String(hc.expense_object_id),
                                          'unit_price',
                                          v == null ? 0 : Number(v)
                                        )
                                      }
                                      format="currency"
                                      step={1000}
                                      min={0}
                                      placeholder="0 ₫"
                                      index={editIndex}
                                      field={`comp-${idx}-unit_price`}
                                    />
                                  </div>,
                                  <div key={`val-qty-${idx}`} className="px-2 py-1">
                                    <EditableNumberCell
                                      value={match.quantity != null ? Number(match.quantity) : null}
                                      onChange={(v) =>
                                        updateComponentField(
                                          index,
                                          String(hc.expense_object_id),
                                          'quantity',
                                          v == null ? 0 : Number(v)
                                        )
                                      }
                                      format="number"
                                      step={1}
                                      min={0}
                                      placeholder="0"
                                      index={editIndex}
                                      field={`comp-${idx}-quantity`}
                                      displayFractionDigits={2}
                                    />
                                  </div>,
                                  <div key={`val-total-${idx}`} className="px-2 py-1 text-right font-semibold text-gray-900">
                                    {match.total_price != null ? formatCurrency(Number(match.total_price)) : ''}
                                  </div>
                                ]
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Totals Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-black mb-4">Tổng kết</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Giảm giá</label>
                    <input
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                      step="1000"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full" data-tour-id="invoice-form-totals">
                      <div className="flex justify-between items-center py-2 border-b border-gray-300">
                        <span className="text-sm font-medium text-black">Tạm tính:</span>
                        <span className="text-sm font-medium text-black">{formatCurrency(formData.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-300">
                        <span className="text-sm font-medium text-black">Giảm giá:</span>
                        <span className="text-sm font-medium text-black">{formatCurrency(formData.discount_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-base font-semibold text-black">Tổng cộng:</span>
                        <span className="text-base font-semibold text-black">{formatCurrency(formData.total_amount)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        * Thuế đã được tính và cộng vào tổng cộng
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-black mb-4">Điều khoản thanh toán</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Điều khoản thanh toán</label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Thanh toán trong vòng 30 ngày"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Trạng thái thanh toán</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="pending">Chưa thanh toán</option>
                    <option value="partial">Thanh toán một phần</option>
                    <option value="paid">Đã thanh toán</option>
                  </select>
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
                    value={formData.terms_and_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
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
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Lưu nháp'}
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi hóa đơn'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Selection Modal – làm giống báo giá */}
      {showProductModal && (
        <div className="fixed inset-0 z-60 bg-transparent flex items-end justify-center">
          <div className="bg-white rounded-t-lg shadow-xl w-full max-w-5xl mx-4 max-h-[60vh] flex flex-col" data-tour-id="invoice-product-selection-modal">
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
                                      setSelectedProductIds(prev =>
                                        e.target.checked ? [...prev, product.id] : prev.filter(id => id !== product.id)
                                      )
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
                                          {!product.area && !product.volume && !product.height && !product.length && !product.depth && (
                                        <div className="text-gray-400">Chưa có kích thước</div>
                                          )}
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
                    const productIds = chosen.map(p => p.id)
                    const { data: prods } = await supabase
                      .from('products')
                      .select('id, name, description, unit, price, category_id, area, volume, height, length, depth, actual_material_components, product_components')
                      .in('id', productIds)

                    const byId: Record<string, any> = {}
                    prods?.forEach((pr: any) => { byId[pr.id] = pr })

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
                      const componentsSource: any[] = actualComps.length > 0 ? actualComps : plannedComps

                      const components = componentsSource.map((c: any) => ({
                        expense_object_id: String(c.expense_object_id),
                        name: nameMap[String(c.expense_object_id)] || c.name || '',
                        unit: c.unit || '',
                        unit_price: Number(c.unit_price || 0),
                        quantity: Number(c.quantity || 0),
                        total_price: Number(c.total_price || 0)
                      }))

                      const baseItem = insertIdx !== -1 ? newItems[insertIdx] : null

                      if (baseItem) {
                        const merged: InvoiceItem = {
                          ...baseItem,
                          product_service_id: p.id,
                          name_product: p.name,
                          description: p.description || '',
                          quantity: baseItem.quantity || 1,
                          unit: p.unit || baseItem.unit || '',
                          unit_price: p.unit_price || 0,
                          area: full?.area ?? p.area ?? null,
                          volume: full?.volume ?? p.volume ?? null,
                          height: full?.height ?? p.height ?? null,
                          length: full?.length ?? p.length ?? null,
                          depth: full?.depth ?? p.depth ?? null,
                          components
                        }
                        merged.total_price = computeItemTotal(merged)
                        newItems[insertIdx] = merged
                        insertIdx = findEmptyFrom(insertIdx + 1)
                      } else {
                        const created: InvoiceItem = {
                          product_service_id: p.id,
                          name_product: p.name,
                          description: p.description || '',
                          quantity: 1,
                          unit: p.unit || '',
                          unit_price: p.unit_price || 0,
                          total_price: 0,
                          area: full?.area ?? p.area ?? null,
                          volume: full?.volume ?? p.volume ?? null,
                          height: full?.height ?? p.height ?? null,
                          length: full?.length ?? p.length ?? null,
                          depth: full?.depth ?? p.depth ?? null,
                          components
                        }
                        created.total_price = computeItemTotal(created)
                        newItems.push(created)
                      }
                    }

                    setItems(newItems)
                  }
                  setSelectedProductIds([])
                  setShowProductModal(false)
                  setSelectedItemIndex(null)
                }}
                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Thêm đã chọn
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
