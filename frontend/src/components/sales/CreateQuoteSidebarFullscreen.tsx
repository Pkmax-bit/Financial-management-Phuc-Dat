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
  Eye,
  CircleHelp,
  Package
} from 'lucide-react'
import { apiPost, apiGet } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ColumnVisibilityDialog from './ColumnVisibilityDialog'
import CustomProductSelectionModal from './CustomProductSelectionModal'
import { useSidebar } from '@/components/LayoutWithSidebar'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
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
  // UI-only flag: when true, total_price was set manually and should not auto-sync unit_price
  total_is_manual?: boolean
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
  initialProjectId?: string // Optional: if provided, pre-fill project_id
  initialCustomerId?: string // Optional: if provided, pre-fill customer_id
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

export default function CreateQuoteSidebarFullscreen({ isOpen, onClose, onSuccess, quoteId, initialProjectId, initialCustomerId }: CreateQuoteSidebarProps) {
  const { hideSidebar } = useSidebar()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showColumnDialog, setShowColumnDialog] = useState(false)
  const [showCustomProductModal, setShowCustomProductModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [editingCell, setEditingCell] = useState<{ index: number; field: string } | null>(null)
  const [autoCalcDimensions, setAutoCalcDimensions] = useState(true)
  const [descriptionModal, setDescriptionModal] = useState<{ isOpen: boolean; index: number; description: string; productName: string }>({
    isOpen: false,
    index: -1,
    description: '',
    productName: ''
  })

  // Tour state
  const QUOTE_FORM_TOUR_STORAGE_KEY = 'quote-form-tour-status-v1'
  const [isQuoteTourRunning, setIsQuoteTourRunning] = useState(false)
  const quoteTourRef = useRef<any>(null)
  const quoteShepherdRef = useRef<any>(null)
  const quoteTourAutoStartAttemptedRef = useRef(false)
  const itemsSectionRef = useRef<HTMLDivElement>(null)
  type QuoteShepherdModule = typeof import('shepherd.js')
  type QuoteShepherdType = QuoteShepherdModule & { Tour: new (...args: any[]) => any }
  type QuoteShepherdTour = InstanceType<QuoteShepherdType['Tour']>

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
    depth: true
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
    tax_rate: 0,
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

  useEffect(() => {
    itemsRef.current = items
    console.log('🔄 Items state updated:', items.length, 'items')
    console.log('📋 Items content:', items.map((item, i) => ({
      index: i,
      name: item.name_product?.substring(0, 50) + '...',
      total: item.total_price,
      unit_price: item.unit_price
    })))
  }, [items])

  // Note: Removed auto-close ProjectDetailSidebar to allow both to be visible
  // CreateQuoteSidebarFullscreen will display on top with z-[60]

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

  // Compute a single grid template to keep header and body perfectly aligned
  const gridTemplateColumns = [
    visibleColumns.name && 'minmax(250px, 2fr)',
    visibleColumns.description && 'minmax(200px, 3fr)',
    visibleColumns.quantity && 'minmax(80px, 1fr)',
    visibleColumns.unit && 'minmax(80px, 0.5fr)',
    visibleColumns.unit_price && 'minmax(120px, 1fr)',
    visibleColumns.total_price && 'minmax(120px, 1fr)',
    visibleColumns.area && 'minmax(90px, 0.8fr)',
    visibleColumns.volume && 'minmax(90px, 0.8fr)',
    visibleColumns.height && 'minmax(90px, 0.8fr)',
    visibleColumns.length && 'minmax(90px, 0.8fr)',
    visibleColumns.depth && 'minmax(90px, 0.8fr)'
  ].filter(Boolean).join(' ')

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchEmployees()
      fetchTaskGroups()
      if (quoteId) {
        loadQuoteData()
      } else {
        generateQuoteNumber()
      }
    } else {
      resetForm()
    }
  }, [isOpen, quoteId])

  useEffect(() => {
    calculateSubtotal()
  }, [items])

  // Auto-fill project info when modal opens with project from query params or props
  useEffect(() => {
    if (isOpen && !quoteId) {
      // Priority: initialProjectId prop > URL param
      const projectId = initialProjectId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('project') : null)

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
              // Use initialCustomerId if provided, otherwise use project's customer_id
              const customerId = initialCustomerId || project.customer_id
              setFormData(prev => ({
                ...prev,
                customer_id: customerId || prev.customer_id,
                project_id: project.id,
                issue_date: project.start_date ? normalizeDateInput(project.start_date) || new Date().toISOString().split('T')[0] : prev.issue_date,
                valid_until: project.end_date ? normalizeDateInput(project.end_date) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : prev.valid_until
              }))

              // Fetch projects for this customer
              if (customerId) {
                fetchProjectsByCustomer(customerId)
              }
            }
          })
      } else if (initialCustomerId && !formData.customer_id) {
        // If only customer_id is provided (no project_id)
        setFormData(prev => ({
          ...prev,
          customer_id: initialCustomerId
        }))
        fetchProjectsByCustomer(initialCustomerId)
      }
    }
  }, [isOpen, quoteId, formData.project_id, initialProjectId, initialCustomerId])

  // Fetch projects when customer changes
  useEffect(() => {
    if (formData.customer_id) {
      fetchProjectsByCustomer(formData.customer_id)
    } else {
      setProjects([])
      setFormData(prev => ({ ...prev, project_id: '' }))
    }
  }, [formData.customer_id])

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
      text: 'Tạo báo giá với tính năng tự động tính diện tích khi thay đổi kích thước.',
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
      text: 'Nhấn "Thêm sản phẩm tự do" để thêm dòng. Điền: Tên, Mô tả, Số lượng, Đơn vị, Đơn giá. Thành tiền = Đơn giá × Số lượng (hoặc × Diện tích nếu có).',
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
      const itemTaxRate = item.tax_rate ?? formData.tax_rate ?? 0
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

  const fetchTaskGroups = async () => {
    try {
      console.log('🔍 Fetching task groups from database...')
      setLoadingTaskGroups(true)
      const groups = await apiGet('/api/tasks/groups')
      console.log('🔍 Task groups data:', groups)
      setTaskGroups(groups || [])

      // Tìm nhóm "Dự án cửa" và set làm mặc định
      const duAnCuaGroup = groups.find((g: any) =>
        g.name && (g.name.toLowerCase().includes('dự án cửa') || g.name.toLowerCase().includes('du an cua'))
      )
      if (duAnCuaGroup) {
        console.log('✅ Found "Dự án cửa" group:', duAnCuaGroup)
        setSelectedTaskGroupId(duAnCuaGroup.id)
      }
    } catch (error) {
      console.error('❌ Error fetching task groups:', error)
      // Set empty array to prevent infinite loading
      setTaskGroups([])
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
        tax_rate: quote.tax_rate || 0,
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
            tax_rate: item.tax_rate ?? formData.tax_rate ?? 0,  // Load tax_rate from item or use form default
            area: item.area,
            baseline_area: item.area, // Use current area as baseline
            volume: item.volume,
            baseline_volume: item.volume, // Use current volume as baseline
            height: item.height,
            length: item.length,
            depth: item.depth,
            area_is_manual: false,
            volume_is_manual: false,
            components: [] // Vật tư/chi phí vật tư đã bỏ - giữ cấu trúc sản phẩm
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
      const itemTaxRate = item.tax_rate ?? formData.tax_rate ?? 0
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
      tax_rate: formData.tax_rate || 0,  // Default tax rate from form
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

  const addCustomProductToQuote = (productData: {
    name: string
    description: string
    unit_price: number
    width?: number
    height?: number
    depth?: number
    area?: number
    volume?: number
    quantity?: number
    total_price?: number
  }) => {
    const qty = productData.quantity ?? 1
    const areaVal = productData.area ?? null
    const volVal = productData.volume ?? null
    const total = productData.total_price ?? (productData.unit_price * (areaVal ?? qty))
    const newItem: QuoteItem = {
      name_product: productData.name,
      description: productData.description,
      quantity: qty,
      unit: 'm²',
      unit_price: productData.unit_price,
      total_price: total,
      tax_rate: formData.tax_rate ?? 0,
      area: areaVal ?? null,
      baseline_area: areaVal ?? null,
      volume: volVal ?? null,
      baseline_volume: volVal ?? null,
      height: productData.height ?? null,
      length: productData.width ?? null,
      depth: productData.depth ?? null,
      area_is_manual: false,
      volume_is_manual: false
    }
    setItems(prev => [newItem, ...prev])
    // Cuộn tới phần Sản phẩm/Dịch vụ để người dùng thấy sản phẩm vừa thêm
    setTimeout(() => itemsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
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
      volume: false,
      height: true,
      length: true,
      depth: false
    })
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }
  const formatNumber = (n: number) => new Intl.NumberFormat('vi-VN').format(n)
  const parseNumber = (s: string): number | null => {
    const v = parseFloat(String(s).replace(/,/g, ''))
    return isNaN(v) ? null : v
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
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 0,
      discount_amount: 0,
      currency: 'VND',
      status: 'draft',
      notes: '',
      terms: 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.'
    })
    setItems([{ name_product: '', description: '', quantity: 1, unit: '', unit_price: 0, total_price: 0, area: null, baseline_area: null, volume: null, baseline_volume: null, height: null, length: null, depth: null, area_is_manual: false, volume_is_manual: false }])
    setNewCustomer({ name: '', type: 'individual', address: '', city: '', country: 'Vietnam', phone: '', email: '', tax_id: '', credit_limit: 0, payment_terms: 30, notes: '' })
    setNewProject({ name: '' })
  }

  const doCreateQuote = async () => {
    setSubmitting(true)
    try {
      const created_by = formData.created_by || null
      const customerId = formData.customer_id || null
      const projectId = formData.project_id || null
      const quoteData = {
        quote_number: formData.quote_number,
        customer_id: customerId,
        project_id: projectId,
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
        created_by: quoteId ? undefined : created_by,
        employee_in_charge_id: created_by
      }
      let quote: any
      if (quoteId) {
        const { data: updatedQuote, error: quoteError } = await supabase.from('quotes').update(quoteData).eq('id', quoteId).select().single()
        if (quoteError) throw new Error(`Lỗi cập nhật báo giá: ${quoteError.message}`)
        quote = updatedQuote
      } else {
        const { data: newQuote, error: quoteError } = await supabase.from('quotes').insert(quoteData).select().single()
        if (quoteError) throw new Error(`Lỗi tạo báo giá: ${quoteError.message}`)
        quote = newQuote
      }
      const currentQuoteId = quoteId || quote.id
      if (quoteId) {
        await supabase.from('quote_items').delete().eq('quote_id', currentQuoteId)
      }
      if (items.length > 0) {
        const quoteItems = items.map(item => ({
          quote_id: currentQuoteId,
          product_service_id: item.product_service_id || null,
          name_product: item.name_product,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
          tax_rate: item.tax_rate ?? formData.tax_rate ?? 0,
          area: item.area,
          volume: item.volume,
          height: item.height,
          length: item.length,
          depth: item.depth,
          product_components: []
        }))
        const { error: itemsError } = await supabase.from('quote_items').insert(quoteItems)
        if (itemsError) throw new Error(`Lỗi lưu chi tiết: ${itemsError.message}`)
      }
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating/updating quote:', error)
      alert('Có lỗi xảy ra: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.quote_number.trim()) throw new Error('Vui lòng nhập số báo giá')
      if (!formData.customer_id && (!newCustomer.name || !newCustomer.address)) throw new Error('Vui lòng chọn khách hàng hoặc nhập thông tin khách hàng mới')
      if (!formData.valid_until) throw new Error('Vui lòng chọn ngày hết hạn')
      if (items.length === 0 || items.every(item => !item.name_product.trim())) throw new Error('Vui lòng thêm ít nhất một sản phẩm')
      if (!formData.created_by) throw new Error('Vui lòng chọn nhân viên tạo báo giá')
      await doCreateQuote()
    } catch (error) {
      console.error('Error validating quote:', error)
      alert('Có lỗi xảy ra: ' + (error as Error).message)
    }
  }

  const updateItem = async (index: number, field: keyof QuoteItem, value: string | number | null) => {
    const updatedItems = [...items]
    const oldItem = { ...updatedItems[index] }
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    const curr = updatedItems[index]
    if (field === 'area') (curr as any).area_is_manual = value != null
    else if (field === 'volume') (curr as any).volume_is_manual = value != null
    else if (field === 'total_price') (curr as any).total_is_manual = value != null
    if (field === 'quantity' || field === 'unit_price' || field === 'area') {
      updatedItems[index].total_price = computeItemTotal(updatedItems[index])
    }
    if (autoCalcDimensions) {
      const lengthMm = curr.length != null && isFinite(Number(curr.length)) ? Number(curr.length) : null
      const depthMm = curr.depth != null && isFinite(Number(curr.depth)) ? Number(curr.depth) : null
      const heightMm = curr.height != null && isFinite(Number(curr.height)) ? Number(curr.height) : null
      if ((field === 'length' || field === 'height') && !(curr as any).area_is_manual && lengthMm != null && heightMm != null) {
        const quantity = Number(curr.quantity || 1)
        const baselineAreaPerUnit = (lengthMm * heightMm) / 1_000_000
        curr.area = Math.round(baselineAreaPerUnit * quantity * 100) / 100
        if ((curr as any).baseline_area == null) (curr as any).baseline_area = Math.round(baselineAreaPerUnit * 100) / 100
        updatedItems[index].total_price = computeItemTotal(updatedItems[index])
      }
      if ((field === 'height' || field === 'length' || field === 'depth') && !(curr as any).volume_is_manual && lengthMm != null && heightMm != null && depthMm != null) {
        const quantity = Number(curr.quantity || 1)
        const baselineVolumePerUnit = (lengthMm * heightMm * depthMm) / 1_000_000_000
        curr.volume = Math.round(baselineVolumePerUnit * quantity * 1e9) / 1e9
        if ((curr as any).baseline_volume == null) (curr as any).baseline_volume = baselineVolumePerUnit
      }
    }
    setItems(updatedItems)
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

      // Truncate display to 15 characters for total_price field
      const truncatedDisplay = field === 'total_price' && display.length > 15
        ? display.substring(0, 15) + '...'
        : display

      return (
        <div
          className={`w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black text-right bg-white cursor-text ${field === 'total_price' ? 'max-w-[15ch] truncate' : ''}`}
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
          {truncatedDisplay || (placeholder || '')}
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
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-50">
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
            <div className="mb-8" data-tour-id="quote-form-items" ref={itemsSectionRef}>
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
                    onClick={() => setShowCustomProductModal(true)}
                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Chọn cấu trúc sản phẩm
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[60vh]">
                <div className="bg-white border-2 border-gray-500 rounded-md w-full">
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
                    </div>
                  </div>

                  <div className="divide-y-2 divide-gray-500">
                    {items.map((item, index) => (
                      <div
                        key={`${item.name_product}-${item.description}-${index}-${Date.now()}`}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors px-4 py-3`}
                      >
                        <div className="grid gap-2 items-start text-xs" style={{ gridTemplateColumns }}>
                          {visibleColumns.name && (
                            <div>
                              <input
                                type="text"
                                value={item.name_product}
                                onChange={(e) => updateItem(index, 'name_product', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Tên sản phẩm"
                                title={item.name_product}
                                tabIndex={index * 100 + 1}
                              />
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
                                      tabIndex={index * 100 + 16}
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

      {/* Column Visibility Dialog */}
      <ColumnVisibilityDialog
        isOpen={showColumnDialog}
        onClose={() => setShowColumnDialog(false)}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onReset={resetColumns}
      />

      {/* Custom Product Selection Modal (cấu trúc sản phẩm) */}
      <CustomProductSelectionModal
        isOpen={showCustomProductModal}
        onClose={() => setShowCustomProductModal(false)}
        onAddToQuote={addCustomProductToQuote}
      />
    </div>
  )
}
