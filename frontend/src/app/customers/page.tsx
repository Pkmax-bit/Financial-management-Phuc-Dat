'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Customer } from '@/types'
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Users,
  FileText,
  Receipt,
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  Building,
  Truck,
  FileImage,
  Settings,
  BarChart3,
  PieChart,
  TrendingDown,
  CircleHelp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { customerApi } from '@/lib/api'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import CustomerKanbanBoard, { CustomerKanbanBoardRef } from '@/components/customers/CustomerKanbanBoard'

const TOUR_STORAGE_KEY = 'customers-page-tour-status-v1'
const CUSTOMER_FORM_TOUR_STORAGE_KEY = 'customer-form-tour-status-v1'
const TOUR_COUNTDOWN_SECONDS = 5
type CustomersShepherdModule = typeof import('shepherd.js')
type CustomersShepherdType = CustomersShepherdModule & { Tour: new (...args: any[]) => any }
type CustomersShepherdTour = InstanceType<CustomersShepherdType['Tour']>

interface Transaction {
  id: string
  type: 'estimate' | 'invoice' | 'receipt' | 'payment' | 'credit' | 'refund'
  number: string
  date: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partial' | 'cancelled'
  description?: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('active')
  const [filterLevel, setFilterLevel] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showQuickActionModal, setShowQuickActionModal] = useState(false)
  const [quickActionType, setQuickActionType] = useState<'invoice' | 'payment' | 'estimate' | 'reminder'>('invoice')
  const [user, setUser] = useState<{ email?: string; full_name?: string; role?: string } | null>(null)
  const router = useRouter()
  const [showTourCompletionPrompt, setShowTourCompletionPrompt] = useState(false)
  const [tourCountdown, setTourCountdown] = useState(TOUR_COUNTDOWN_SECONDS)
  const [isTourRunning, setIsTourRunning] = useState(false)
  const [isFormTourRunning, setIsFormTourRunning] = useState(false)
  const shepherdRef = useRef<CustomersShepherdType | null>(null)
  const tourRef = useRef<CustomersShepherdTour | null>(null)
  const formTourRef = useRef<CustomersShepherdTour | null>(null)
  const currentTourModeRef = useRef<'auto' | 'manual'>('manual')
  const isBrowser = typeof window !== 'undefined'

  const defaultCustomerForm = {
    customer_code: '',
    name: '',
    type: 'individual',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Vietnam',
    tax_id: '',
    credit_limit: 0,
    payment_terms: 30,
    notes: '',
    assigned_to: '',
    status: 'active'
  }

  const [addForm, setAddForm] = useState(defaultCustomerForm)
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState(defaultCustomerForm)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const kanbanBoardRef = useRef<CustomerKanbanBoardRef>(null)

  // Mock transaction data
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'invoice',
      number: 'INV-2024-001',
      date: '2024-01-15',
      amount: 2500000,
      status: 'overdue',
      description: 'Dịch vụ tư vấn tháng 1'
    },
    {
      id: '2',
      type: 'payment',
      number: 'PAY-2024-001',
      date: '2024-01-10',
      amount: 1500000,
      status: 'paid',
      description: 'Thanh toán một phần'
    },
    {
      id: '3',
      type: 'estimate',
      number: 'EST-2024-001',
      date: '2024-01-05',
      amount: 3000000,
      status: 'sent',
      description: 'Báo giá dự án mới'
    }
  ]

  useEffect(() => {
    checkUser()
  }, [])

  // Handle action=create from query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const action = urlParams.get('action')
      if (action === 'create') {
        setShowAddModal(true)
      }
    }
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (userData) {
          setUser(userData)
          // Fetch customers after user is set
          fetchCustomers()
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching customers...')
      
      // Try authenticated endpoint first
      try {
        const data = await customerApi.getCustomers()
        setCustomers(Array.isArray(data) ? data : [])
        console.log('Successfully fetched customers via authenticated API:', data?.length || 0)
        return
      } catch (authError) {
        console.log('Authenticated API failed, trying public endpoint:', authError)
        
        // Fallback to public endpoint
        try {
          const data = await customerApi.getCustomersPublic()
          setCustomers(Array.isArray(data) ? data : [])
          setError('Hiển thị dữ liệu mẫu (chưa đăng nhập)')
          console.log('Successfully fetched customers via public API:', data?.length || 0)
          return
        } catch (publicError) {
          console.log('Public API also failed:', publicError)
          throw publicError
        }
      }
      
    } catch (error: unknown) {
      console.error('Error fetching customers:', error)
      setError(`Lỗi không thể tải danh sách khách hàng: ${(error as Error)?.message || 'Không thể kết nối'}`)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const refreshCustomers = async () => {
    setLoading(true)
    await fetchCustomers()
    setLoading(false)
  }

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleAddTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleEditTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const openAddModal = async () => {
    setAddForm(defaultCustomerForm)
    setAddError('')
    setShowAddModal(true)
    
    // Auto-fill customer code when opening modal
    try {
      const token = localStorage.getItem('access_token');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/customers/next-customer-code', {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setAddForm(prev => ({ ...prev, customer_code: data.next_customer_code }));
      }
    } catch (error) {
      console.error('Error auto-filling customer code:', error);
      // Set a fallback code if API fails
      setAddForm(prev => ({ ...prev, customer_code: 'CUS001' }));
    }
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm({
      customer_code: customer.customer_code || '',
      name: customer.name || '',
      type: customer.type || 'individual',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || 'Vietnam',
      tax_id: customer.tax_id || '',
      credit_limit: customer.credit_limit || 0,
      payment_terms: customer.payment_terms || 30,
      notes: customer.notes || '',
      assigned_to: customer.assigned_to || '',
      status: customer.status || 'active'
    })
    setEditError('')
    setShowEditModal(true)
  }

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddSaving(true)
    setAddError('')
    try {
      // Prepare customer data according to API schema
      const customerData = {
        customer_code: addForm.customer_code,
        name: addForm.name,
        type: addForm.type as 'individual' | 'company' | 'government',
        email: addForm.email || undefined,
        phone: addForm.phone || undefined,
        address: addForm.address || undefined,
        city: addForm.city || undefined,
        country: addForm.country || 'Vietnam',
        tax_id: addForm.tax_id || undefined,
        status: 'active' as 'active' | 'inactive' | 'prospect',
        credit_limit: addForm.credit_limit || 0,
        payment_terms: addForm.payment_terms || 30,
        notes: addForm.notes || undefined,
        assigned_to: addForm.assigned_to || undefined
      }
      
      await customerApi.createCustomer(customerData)
      setShowAddModal(false)
      setNotice({ type: 'success', text: 'Thêm khách hàng thành công' })
      await fetchCustomers()
      kanbanBoardRef.current?.refresh()
    } catch (err: unknown) {
      setAddError((err as Error)?.message || 'Không thể thêm khách hàng')
    } finally {
      setAddSaving(false)
    }
  }

  const updateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return
    setEditSaving(true)
    setEditError('')
    try {
      // Prepare update data according to API schema
      const updateData = {
        customer_code: editForm.customer_code,
        name: editForm.name,
        type: editForm.type,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        address: editForm.address || undefined,
        city: editForm.city || undefined,
        country: editForm.country || 'Vietnam',
        tax_id: editForm.tax_id || undefined,
        status: editForm.status || 'active',
        credit_limit: editForm.credit_limit || 0,
        payment_terms: editForm.payment_terms || 30,
        notes: editForm.notes || undefined,
        assigned_to: editForm.assigned_to || undefined
      }
      
      await customerApi.updateCustomer(selectedCustomer.id, updateData)
      setShowEditModal(false)
      setNotice({ type: 'success', text: 'Cập nhật khách hàng thành công' })
      await fetchCustomers()
      kanbanBoardRef.current?.refresh()
    } catch (err: unknown) {
      setEditError((err as Error)?.message || 'Không thể cập nhật khách hàng')
    } finally {
      setEditSaving(false)
    }
  }

  const deleteCustomer = async (customer: Customer) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.name}"?\n\nHành động này sẽ xóa vĩnh viễn khách hàng khỏi hệ thống và không thể hoàn tác!\n\nLưu ý: Không thể xóa khách hàng có dự án đang hoạt động hoặc có hóa đơn.`)) return
    try {
      await customerApi.deleteCustomer(customer.id)
      setNotice({ type: 'success', text: 'Đã xóa khách hàng khỏi hệ thống' })
      await fetchCustomers()
      kanbanBoardRef.current?.refresh()
    } catch (err: unknown) {
      setNotice({ type: 'error', text: (err as Error)?.message || 'Không thể xóa khách hàng' })
    }
  }

  const togglePotentialCustomer = async (customer: Customer) => {
    try {
      const newStatus = customer.status === 'prospect' ? 'active' : 'prospect'
      await customerApi.updateCustomer(customer.id, { status: newStatus })
      setNotice({ 
        type: 'success', 
        text: newStatus === 'prospect' 
          ? 'Đã đánh dấu khách hàng tiềm năng' 
          : 'Đã bỏ đánh dấu khách hàng tiềm năng' 
      })
      await fetchCustomers()
      kanbanBoardRef.current?.refresh()
      // Auto-hide notice after 3 seconds
      setTimeout(() => setNotice(null), 3000)
    } catch (err: unknown) {
      setNotice({ type: 'error', text: (err as Error)?.message || 'Không thể cập nhật trạng thái' })
      // Auto-hide error notice after 5 seconds
      setTimeout(() => setNotice(null), 5000)
    }
  }

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return customers.filter((customer: unknown) => {
      const c = customer as { name?: string; email?: string; phone?: string; status?: string; type?: string }
      
      // Filter by status (default: active)
      if (filterStatus !== 'all' && c.status !== filterStatus) {
        return false
      }
      
      // Filter by type
      if (filterType !== 'all' && c.type !== filterType) {
        return false
      }
      
      // Filter by search term
      const matchesSearch =
        (c.name || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.phone || '').toLowerCase().includes(term)
      return matchesSearch
    })
  }, [customers, searchTerm, filterStatus, filterType])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'prospect':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'individual':
        return 'bg-purple-100 text-purple-800'
      case 'company':
        return 'bg-blue-100 text-blue-800'
      case 'government':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze':
        return 'bg-orange-100 text-orange-800'
      case 'silver':
        return 'bg-gray-100 text-gray-800'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800'
      case 'platinum':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-100 text-blue-800'
      case 'payment':
        return 'bg-green-100 text-green-800'
      case 'estimate':
        return 'bg-yellow-100 text-yellow-800'
      case 'receipt':
        return 'bg-purple-100 text-purple-800'
      case 'credit':
        return 'bg-orange-100 text-orange-800'
      case 'refund':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCustomerLevel = (customerId: string) => {
    // This would be calculated based on revenue in a real implementation
    return 'bronze' // Placeholder
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getCustomerStats = () => {
    const total = customers.filter(c => c.status === 'active').length // Chỉ đếm khách hàng đang hoạt động
    const active = customers.filter(c => c.status === 'active').length
    const prospects = customers.filter(c => c.status === 'prospect').length
    const companies = customers.filter(c => c.type === 'company').length
    const totalRevenue = 0 // TODO: Calculate from invoices when available
    const overdueCount = 0 // TODO: Calculate from invoices when available
    
    return { total, active, prospects, companies, totalRevenue, overdueCount }
  }

  const getOpenBalance = (customerId: string) => {
    // Mock calculation - in real app, this would be calculated from transactions
    return Math.floor(Math.random() * 10000000)
  }

  const handleTourComplete = useCallback(() => {
    setIsTourRunning(false)
    setShowDetailModal(false)
    if (isBrowser) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'completed')
    }
    setTourCountdown(TOUR_COUNTDOWN_SECONDS)
    setShowTourCompletionPrompt(true)
  }, [isBrowser])

  const handleTourCancel = useCallback(() => {
    setIsTourRunning(false)
    setShowDetailModal(false)
    if (isBrowser && currentTourModeRef.current === 'auto') {
      localStorage.setItem(TOUR_STORAGE_KEY, 'dismissed')
    }
  }, [isBrowser])

  const startCustomersTour = useCallback(async (options?: { auto?: boolean }) => {
    if (!isBrowser || !filteredCustomers.length) return

    currentTourModeRef.current = options?.auto ? 'auto' : 'manual'

    if (tourRef.current) {
      tourRef.current.cancel()
      tourRef.current = null
    }

    setShowTourCompletionPrompt(false)
    setTourCountdown(TOUR_COUNTDOWN_SECONDS)

    const firstCustomer = filteredCustomers[0] as Customer | undefined

    if (!shepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance =
          (module as unknown as { default?: CustomersShepherdType })?.default ??
          (module as unknown as CustomersShepherdType)
        shepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = shepherdRef.current
    if (!Shepherd) return

    const waitForElement = async (selector: string, retries = 15, delay = 120) => {
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

    await waitForElement('[data-tour-id="customers-header"]')
    await waitForElement('[data-tour-id="customers-guide-button"]')
    await waitForElement('[data-tour-id="customers-add-button"]')
    await waitForElement('[data-tour-id="customers-stats"]')
    await waitForElement('[data-tour-id="customers-filters"]')
    await waitForElement('[data-tour-id="customers-table"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'customers-intro',
      title: 'Trung tâm Khách hàng',
      text: 'Trang này giúp bạn quản lý hồ sơ khách hàng, công nợ và các giao dịch đi kèm.',
      attachTo: { element: '[data-tour-id="customers-header"]', on: 'bottom' },
      buttons: [
        {
          text: 'Bỏ qua',
          action: () => tour.cancel(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'customers-guide-button',
      title: 'Nút Bắt đầu hướng dẫn',
      text: 'Bạn có thể khởi chạy lại tour bất cứ lúc nào bằng nút này.',
      attachTo: { element: '[data-tour-id="customers-guide-button"]', on: 'left' },
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
      id: 'customers-create-button',
      title: 'Tạo khách hàng mới',
      text: 'Nhấn nút này để mở form tạo khách hàng với mã tự động và các thông tin cần thiết.',
      attachTo: { element: '[data-tour-id="customers-add-button"]', on: 'left' },
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
      id: 'customers-create-modal',
      title: 'Điền thông tin khách hàng',
      text: 'Form này hướng dẫn bạn nhập thông tin cơ bản, liên hệ và hạn mức tín dụng. Sau khi lưu, khách hàng sẽ xuất hiện trong danh sách.',
      attachTo: { element: '[data-tour-id="customers-add-modal"]', on: 'left' },
      beforeShowPromise: async () => {
        if (!showAddModal) {
          await openAddModal()
        }
        await waitForElement('[data-tour-id="customers-add-modal"]')
      },
      when: {
        hide: () => {
          setShowAddModal(false)
        }
      },
      buttons: [
        {
          text: 'Quay lại',
          action: async () => {
            await waitForElement('[data-tour-id="customers-add-button"]')
            tour.back()
          },
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: async () => {
            setShowAddModal(false)
            await new Promise((resolve) => setTimeout(resolve, 200))
            tour.next()
          }
        }
      ]
    })

    tour.addStep({
      id: 'customers-stats',
      title: 'Tổng quan nhanh',
      text: 'Các thẻ thống kê giúp bạn nắm nhanh tình trạng khách hàng và doanh thu.',
      attachTo: { element: '[data-tour-id="customers-stats"]', on: 'top' },
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
      id: 'customers-filters',
      title: 'Tìm kiếm & bộ lọc',
      text: 'Sử dụng ô tìm kiếm và các thao tác lọc để thu hẹp danh sách khách hàng.',
      attachTo: { element: '[data-tour-id="customers-filters"]', on: 'top' },
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
      id: 'customers-table',
      title: 'Danh sách khách hàng',
      text: 'Danh sách hiển thị đầy đủ thông tin và hành động nhanh cho từng khách hàng.',
      attachTo: { element: '[data-tour-id="customers-table"]', on: 'top' },
      when: {
        show: () => {
          if (firstCustomer) {
            setSelectedCustomer(firstCustomer)
            setShowDetailModal(true)
          }
        }
      },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: async () => {
            await waitForElement('[data-tour-id="customers-detail-modal"]')
            tour.next()
          }
        }
      ]
    })

    tour.addStep({
      id: 'customers-detail',
      title: 'Chi tiết khách hàng',
      text: 'Cửa sổ chi tiết cung cấp cái nhìn sâu hơn về thông tin và lịch sử của khách hàng.',
      attachTo: { element: '[data-tour-id="customers-detail-modal"]', on: 'top' },
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
      handleTourComplete()
      tourRef.current = null
    })

    tour.on('cancel', () => {
      handleTourCancel()
      tourRef.current = null
    })

    tourRef.current = tour
    setIsTourRunning(true)
    tour.start()
  }, [filteredCustomers, handleTourCancel, handleTourComplete, isBrowser, openAddModal, showAddModal])

  const handleRestartTour = useCallback(() => {
    setShowTourCompletionPrompt(false)
    setTourCountdown(TOUR_COUNTDOWN_SECONDS)
    startCustomersTour()
  }, [startCustomersTour])

  const startCustomerFormTour = useCallback(async () => {
    if (!isBrowser || !showAddModal) return

    if (formTourRef.current) {
      formTourRef.current.cancel()
      formTourRef.current = null
    }

    if (!shepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: CustomersShepherdType })?.default ?? (module as unknown as CustomersShepherdType)
        shepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = shepherdRef.current
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

    await waitForElement('[data-tour-id="customer-form-basic-info"]')
    await waitForElement('[data-tour-id="customer-form-financial-info"]')
    await waitForElement('[data-tour-id="customer-form-additional-info"]')
    await waitForElement('[data-tour-id="customer-form-submit"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'customer-form-intro',
      title: 'Hướng dẫn tạo khách hàng',
      text: 'Form này gồm 3 phần chính: Thông tin cơ bản, Thông tin tài chính và Thông tin bổ sung. Hãy điền đầy đủ để tạo khách hàng mới.',
      attachTo: { element: '[data-tour-id="customers-add-modal"]', on: 'bottom' },
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
      id: 'customer-form-basic-info',
      title: 'Thông tin cơ bản',
      text: 'Điền mã khách hàng (tự động tạo), loại khách hàng, tên/công ty, email, điện thoại, địa chỉ và mã số thuế. Các trường có dấu * là bắt buộc.',
      attachTo: { element: '[data-tour-id="customer-form-basic-info"]', on: 'top' },
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
      id: 'customer-form-financial-info',
      title: 'Thông tin tài chính',
      text: 'Thiết lập hạn mức tín dụng (VND) và điều khoản thanh toán (số ngày). Đây là thông tin quan trọng để quản lý công nợ.',
      attachTo: { element: '[data-tour-id="customer-form-financial-info"]', on: 'top' },
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
      id: 'customer-form-additional-info',
      title: 'Thông tin bổ sung',
      text: 'Thêm ghi chú hoặc thông tin bổ sung về khách hàng nếu cần. Phần này không bắt buộc nhưng có thể hữu ích cho việc quản lý sau này.',
      attachTo: { element: '[data-tour-id="customer-form-additional-info"]', on: 'top' },
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
      id: 'customer-form-submit',
      title: 'Hoàn tất',
      text: 'Sau khi điền đầy đủ thông tin, nhấn nút "Tạo khách hàng" để lưu. Khách hàng mới sẽ xuất hiện trong danh sách ngay sau đó.',
      attachTo: { element: '[data-tour-id="customer-form-submit"]', on: 'top' },
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
      setIsFormTourRunning(false)
      if (isBrowser) {
        localStorage.setItem(CUSTOMER_FORM_TOUR_STORAGE_KEY, 'completed')
      }
      formTourRef.current = null
    })

    tour.on('cancel', () => {
      setIsFormTourRunning(false)
      formTourRef.current = null
    })

    formTourRef.current = tour
    setIsFormTourRunning(true)
    tour.start()
  }, [isBrowser, showAddModal])

  useEffect(() => {
    if (!isBrowser) return
    if (!showTourCompletionPrompt) return

    if (tourCountdown <= 0) {
      setShowTourCompletionPrompt(false)
      setTourCountdown(TOUR_COUNTDOWN_SECONDS)
      return
    }

    const timer = window.setTimeout(() => {
      setTourCountdown((prev) => prev - 1)
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isBrowser, showTourCompletionPrompt, tourCountdown])

  useEffect(() => {
    return () => {
      tourRef.current?.cancel()
      tourRef.current?.destroy()
      tourRef.current = null
      formTourRef.current?.cancel()
      formTourRef.current?.destroy?.()
      formTourRef.current = null
    }
  }, [])

  const stats = getCustomerStats()

  const handleQuickAction = (actionType: 'invoice' | 'payment' | 'estimate' | 'reminder') => {
    setQuickActionType(actionType)
    setShowQuickActionModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="w-full">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Trung tâm Khách hàng</h2>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between" data-tour-id="customers-header">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trung tâm Khách hàng</h1>
                <p className="mt-1 text-sm text-black">
                  Quản lý toàn diện khách hàng, công nợ và giao dịch
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        customers.length > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <span className="text-xs text-black">
                      {customers.length > 0 ? `${customers.length} khách hàng` : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                  {user && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs text-black">
                        Đã đăng nhập: {user?.email || 'Unknown'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => startCustomersTour()}
                  disabled={isTourRunning}
                  data-tour-id="customers-guide-button"
                  className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    isTourRunning
                      ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title="Bắt đầu tour hướng dẫn"
                >
                  <CircleHelp className="h-5 w-5 mr-2" />
                  <span>Bắt đầu hướng dẫn</span>
                </button>
                {/* View toggle: Kanban | List (Bitrix24 style) */}
                <div className="inline-flex rounded-[2px] border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    aria-label="Chuyển sang xem Kanban"
                    onClick={() => setViewMode('kanban')}
                    className={`flex h-8 w-10 items-center justify-center border-r border-gray-300 text-xs transition-colors ${
                      viewMode === 'kanban'
                        ? 'bg-[#E8F4FD] text-[#2066B0] border-[#2066B0]'
                        : 'bg-white text-[#535C69] hover:bg-[#F5F7F8]'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-[2px]">
                      <span className="h-2 w-2 rounded-[2px] border border-current" />
                      <span className="h-2 w-2 rounded-[2px] border border-current" />
                      <span className="h-2 w-2 rounded-[2px] border border-current" />
                      <span className="h-2 w-2 rounded-[2px] border border-current" />
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label="Chuyển sang xem danh sách"
                    onClick={() => setViewMode('list')}
                    className={`flex h-8 w-10 items-center justify-center text-xs transition-colors ${
                      viewMode === 'list'
                        ? 'bg-[#E8F4FD] text-[#2066B0] border-l border-[#2066B0]'
                        : 'bg-white text-[#535C69] hover:bg-[#F5F7F8] border-l border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col gap-[2px]">
                      <span className="h-[2px] w-4 rounded-full bg-current" />
                      <span className="h-[2px] w-4 rounded-full bg-current" />
                      <span className="h-[2px] w-4 rounded-full bg-current" />
                    </div>
                  </button>
                </div>
                <button
                  onClick={fetchCustomers}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
                <button
                  onClick={openAddModal}
                  data-tour-id="customers-add-button"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm khách hàng
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                  {error.includes('đăng nhập') && (
                    <p className="text-xs text-red-600 mt-1">
                      <button
                        onClick={() => router.push('/login')}
                        className="underline hover:no-underline"
                      >
                        Nhấn vào đây để đăng nhập
                      </button>
                    </p>
                  )}
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={fetchCustomers}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notice Message */}
          {notice && (
            <div className={`mb-6 border rounded-lg p-4 ${
              notice.type === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {notice.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${
                      notice.type === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {notice.text}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNotice(null)}
                  className={`ml-4 ${
                    notice.type === 'success' 
                      ? 'text-green-600 hover:text-green-500' 
                      : 'text-red-600 hover:text-red-500'
                  }`}
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6" data-tour-id="customers-stats">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Tổng khách hàng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Hoạt động</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-500">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Tiềm năng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.prospects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Công ty</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-500">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-500">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Quá hạn</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdueCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-6" data-tour-id="customers-filters">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-black" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, email, điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-3 justify-end">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Filter className="h-4 w-4 mr-2" />
                    Bộ lọc
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer View: Kanban or List */}
          {viewMode === 'kanban' ? (
            <div className="bg-white rounded-lg shadow-sm border p-6" data-tour-id="customers-kanban">
              <CustomerKanbanBoard
                ref={kanbanBoardRef}
                onViewCustomer={(customer) => {
                  // Navigate to projects page filtered by customer
                  router.push(`/projects?customer_id=${customer.id}`)
                }}
                onAddCustomer={() => setShowAddModal(true)}
              />
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md" data-tour-id="customers-table">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Danh sách Khách hàng ({filteredCustomers.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-black">Thông tin cơ bản khách hàng</p>
            </div>
          
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-black" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy khách hàng</h3>
                <p className="mt-1 text-sm text-black">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterLevel !== 'all'
                    ? 'Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc.'
                    : 'Bắt đầu bằng cách thêm khách hàng mới.'}
                </p>
                {!searchTerm && filterType === 'all' && filterStatus === 'all' && filterLevel === 'all' && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm khách hàng
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        KHÁCH HÀNG
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        LOẠI
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        LIÊN HỆ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        TÀI CHÍNH
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        TRẠNG THÁI
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                        TIỀM NĂNG
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Hành động</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* eslint-disable @typescript-eslint/no-explicit-any */}
                    {filteredCustomers.map((customer: any) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.name}
                                </div>
                                <div className="text-sm text-black">Mã: {customer.customer_code || customer.id.slice(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(customer.type)}`}>
                            {customer.type === 'individual' ? 'Cá nhân' :
                             customer.type === 'company' ? 'Công ty' : 'Cơ quan nhà nước'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1 text-black" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center mt-1">
                                <Phone className="h-3 w-3 mr-1 text-black" />
                                {customer.phone}
                              </div>
                            )}
                            {!customer.email && !customer.phone && <span className="text-black">—</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>Hạn mức: {formatCurrency(customer.credit_limit || 0)}</div>
                            <div className="text-xs text-black">Thanh toán: {customer.payment_terms || 30} ngày</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                            {customer.status === 'active' ? 'Hoạt động' :
                             customer.status === 'inactive' ? 'Ngừng hoạt động' : 'Tiềm năng'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePotentialCustomer(customer)
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title={customer.status === 'prospect' ? 'Bỏ đánh dấu khách hàng tiềm năng' : 'Đánh dấu khách hàng tiềm năng'}
                          >
                            <Star 
                              className={`h-5 w-5 ${
                                customer.status === 'prospect' 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300 hover:text-yellow-400'
                              } transition-colors`} 
                            />
                          </button>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  // Navigate to projects page filtered by customer
                                  router.push(`/projects?customer_id=${customer.id}`)
                                }}
                                className="text-black hover:text-black"
                                title="Xem chi tiết"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setShowTransactionModal(true)
                                }}
                                className="text-black hover:text-blue-600"
                                title="Lịch sử giao dịch"
                              >
                                <FileText className="h-5 w-5" />
                              </button>
                              <button onClick={() => openEditModal(customer)} className="text-black hover:text-black" title="Sửa">
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => deleteCustomer(customer)}
                                className="text-black hover:text-red-600"
                                title="Xóa"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                              <button className="text-black hover:text-black" title="Thêm">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}

          {/* Quick Action Bar */}
          {selectedCustomer && (
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Hành động nhanh cho {selectedCustomer.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => handleQuickAction('invoice')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Tạo Hóa đơn
                </button>
                <button
                  onClick={() => handleQuickAction('payment')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Ghi nhận Thanh toán
                </button>
                <button
                  onClick={() => handleQuickAction('estimate')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Receipt className="h-5 w-5 mr-2" />
                  Tạo Báo giá
                </button>
                <button
                  onClick={() => handleQuickAction('reminder')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Gửi email nhắc nợ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal - Right Sidebar */}
      {showAddModal && (
        <div className="fixed top-16 right-4 z-50 w-full max-w-2xl">
          <div
            className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right"
            data-tour-id="customers-add-modal"
          >
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tạo khách hàng mới</h2>
                <p className="text-sm font-semibold text-gray-700">Thêm khách hàng vào hệ thống</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startCustomerFormTour()}
                  disabled={isFormTourRunning || addSaving}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    isFormTourRunning || addSaving
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-white bg-blue-600 hover:bg-blue-700'
                  }`}
                  title="Bắt đầu hướng dẫn form"
                >
                  <CircleHelp className="h-4 w-4" />
                  <span>Hướng dẫn</span>
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-black hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  disabled={addSaving}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={createCustomer} className="p-6 space-y-6">
              {/* Success/Error Messages */}
              {addForm.customer_code && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-800 font-semibold">
                      Mã khách hàng đã được tự động tạo: <span className="font-bold">{addForm.customer_code}</span>
                    </p>
                  </div>
                </div>
              )}
              
              {addError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800 font-semibold">{addError}</p>
                </div>
              )}

              {/* Basic Information */}
              <div data-tour-id="customer-form-basic-info">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Mã khách hàng *
                    </label>
                    <div className="flex items-center space-x-2">
                      <input 
                        name="customer_code" 
                        value={addForm.customer_code} 
                        onChange={handleAddChange} 
                        required
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                        placeholder="CUS001 (tự động tạo)"
                        disabled={addSaving}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('access_token');
                            
                            // Create AbortController for timeout
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                            
                            const response = await fetch('/api/customers/next-customer-code', {
                              headers: { 'Authorization': `Bearer ${token}` },
                              signal: controller.signal
                            });
                            
                            clearTimeout(timeoutId);
                            
                            if (response.ok) {
                              const data = await response.json();
                              setAddForm(prev => ({ ...prev, customer_code: data.next_customer_code }));
                            }
                          } catch (error) {
                            console.error('Error generating customer code:', error);
                          }
                        }}
                        disabled={addSaving}
                        className="px-3 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                        title="Tự động tạo mã khách hàng"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Mã khách hàng sẽ được tự động tạo theo định dạng CUS000
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Loại khách hàng
                    </label>
                    <select 
                      name="type" 
                      value={addForm.type} 
                      onChange={handleAddChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold"
                      disabled={addSaving}
                    >
                      <option value="individual">Cá nhân</option>
                      <option value="company">Công ty</option>
                      <option value="government">Cơ quan nhà nước</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Tên/Công ty *
                    </label>
                    <input 
                      name="name" 
                      value={addForm.name} 
                      onChange={handleAddChange} 
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập tên khách hàng..."
                      disabled={addSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Email
                    </label>
                    <input 
                      name="email" 
                      type="email" 
                      value={addForm.email} 
                      onChange={handleAddChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập email..."
                      disabled={addSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Điện thoại
                    </label>
                    <input 
                      name="phone" 
                      value={addForm.phone} 
                      onChange={handleAddChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập số điện thoại..."
                      disabled={addSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Thành phố
                    </label>
                    <input 
                      name="city" 
                      value={addForm.city} 
                      onChange={handleAddChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập thành phố..."
                      disabled={addSaving}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Địa chỉ
                    </label>
                    <input 
                      name="address" 
                      value={addForm.address} 
                      onChange={handleAddChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập địa chỉ..."
                      disabled={addSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Mã số thuế
                    </label>
                    <input 
                      name="tax_id" 
                      value={addForm.tax_id} 
                      onChange={handleAddChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập mã số thuế..."
                      disabled={addSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Quốc gia
                    </label>
                    <input 
                      name="country" 
                      value={addForm.country} 
                      onChange={handleAddChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập quốc gia..."
                      disabled={addSaving}
                    />
                  </div>
                </div>
              </div>
              
              {/* Financial Information */}
              <div data-tour-id="customer-form-financial-info">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin tài chính</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Hạn mức tín dụng (VND)
                    </label>
                    <input 
                      name="credit_limit" 
                      type="number" 
                      value={addForm.credit_limit} 
                      onChange={handleAddChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập hạn mức tín dụng..."
                      disabled={addSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Điều khoản thanh toán (ngày)
                    </label>
                    <input 
                      name="payment_terms" 
                      type="number" 
                      value={addForm.payment_terms} 
                      onChange={handleAddChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập số ngày thanh toán..."
                      disabled={addSaving}
                    />
                  </div>
                </div>
              </div>
              
              {/* Additional Information */}
              <div data-tour-id="customer-form-additional-info">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin bổ sung</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Ghi chú
                    </label>
                    <textarea 
                      name="notes" 
                      value={addForm.notes} 
                      onChange={handleAddTextareaChange} 
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập ghi chú..."
                      disabled={addSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200" data-tour-id="customer-form-submit">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  disabled={addSaving}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                  disabled={addSaving}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {addSaving ? 'Đang tạo...' : 'Tạo khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          data-tour-id="customers-detail-modal"
        >
          <div className="relative top-20 mx-auto p-5 border w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Hồ sơ Khách hàng Chi tiết</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-black hover:text-black"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact & Billing Info */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Thông tin liên hệ & Hóa đơn</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mã khách hàng</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.customer_code || selectedCustomer.id.slice(0, 8)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tên/Công ty</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Loại khách hàng</label>
                        <p className="text-sm text-gray-900">
                          {selectedCustomer.type === 'individual' ? 'Cá nhân' :
                           selectedCustomer.type === 'company' ? 'Công ty' : 'Cơ quan nhà nước'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.email || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Điện thoại</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.address || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Thành phố</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.city || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quốc gia</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.country || 'Vietnam'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial & Tax Info */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Thông tin Tài chính & Thuế</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Hạn mức tín dụng</label>
                        <p className="text-sm text-gray-900">{formatCurrency(selectedCustomer.credit_limit || 0)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Điều khoản thanh toán</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.payment_terms || 30} ngày</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
                        <p className="text-sm text-gray-900">{selectedCustomer.tax_id || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedCustomer.status)}`}>
                          {selectedCustomer.status === 'active' ? 'Hoạt động' :
                           selectedCustomer.status === 'inactive' ? 'Ngừng hoạt động' : 'Tiềm năng'}
                        </span>
                      </div>
                      {selectedCustomer.notes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                          <p className="text-sm text-gray-900">{selectedCustomer.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Đóng
                </button>
                <button
                  onClick={() => { setShowDetailModal(false); if (selectedCustomer) openEditModal(selectedCustomer) }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Sửa khách hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Lịch sử Giao dịch - {selectedCustomer.name}</h3>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-black hover:text-black"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-black">
                  Lịch sử kiểm toán đầy đủ về mọi tương tác tài chính
                </p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          LOẠI
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          SỐ
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          NGÀY
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          SỐ TIỀN
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          TRẠNG THÁI
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          MÔ TẢ
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Hành động</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                              {transaction.type === 'invoice' ? 'Hóa đơn' :
                               transaction.type === 'payment' ? 'Thanh toán' :
                               transaction.type === 'estimate' ? 'Báo giá' :
                               transaction.type === 'receipt' ? 'Phiếu bán hàng' :
                               transaction.type === 'credit' ? 'Ghi có' : 'Hoàn tiền'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(transaction.status)}`}>
                              {transaction.status === 'paid' ? 'Đã thanh toán' :
                               transaction.status === 'overdue' ? 'Quá hạn' :
                               transaction.status === 'partial' ? 'Thanh toán một phần' :
                               transaction.status === 'sent' ? 'Đã gửi' :
                               transaction.status === 'draft' ? 'Nháp' : 'Đã hủy'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-black">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Modal */}
      {showQuickActionModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {quickActionType === 'invoice' ? 'Tạo Hóa đơn' :
                   quickActionType === 'payment' ? 'Ghi nhận Thanh toán' :
                   quickActionType === 'estimate' ? 'Tạo Báo giá' : 'Gửi email nhắc nợ'}
                </h3>
                <button
                  onClick={() => setShowQuickActionModal(false)}
                  className="text-black hover:text-black"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-black">
                  Khách hàng: <span className="font-medium">{selectedCustomer.name}</span>
                </p>
                <p className="text-sm text-black">
                  Form {quickActionType === 'invoice' ? 'tạo hóa đơn' :
                        quickActionType === 'payment' ? 'ghi nhận thanh toán' :
                        quickActionType === 'estimate' ? 'tạo báo giá' : 'gửi email nhắc nợ'} sẽ được phát triển.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowQuickActionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  {quickActionType === 'invoice' ? 'Tạo hóa đơn' :
                   quickActionType === 'payment' ? 'Ghi nhận' :
                   quickActionType === 'estimate' ? 'Tạo báo giá' : 'Gửi email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal - Right Sidebar */}
      {showEditModal && selectedCustomer && (
        <div className="fixed top-16 right-4 z-50 w-full max-w-2xl">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sửa thông tin khách hàng</h2>
                <p className="text-sm font-semibold text-gray-700">Cập nhật thông tin khách hàng</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-black hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                disabled={editSaving}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={updateCustomer} className="p-6 space-y-6">
              {/* Error Message */}
              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800 font-semibold">{editError}</p>
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Mã khách hàng
                    </label>
                    <input 
                      name="customer_code" 
                      value={editForm.customer_code} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập mã khách hàng..."
                      disabled={editSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Loại khách hàng
                    </label>
                    <select 
                      name="type" 
                      value={editForm.type} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold"
                      disabled={editSaving}
                    >
                      <option value="individual">Cá nhân</option>
                      <option value="company">Công ty</option>
                      <option value="government">Cơ quan nhà nước</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Tên/Công ty
                    </label>
                    <input 
                      name="name" 
                      value={editForm.name} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập tên khách hàng..."
                      disabled={editSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Email
                    </label>
                    <input 
                      name="email" 
                      type="email" 
                      value={editForm.email} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập email..."
                      disabled={editSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Điện thoại
                    </label>
                    <input 
                      name="phone" 
                      value={editForm.phone} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập số điện thoại..."
                      disabled={editSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Thành phố
                    </label>
                    <input 
                      name="city" 
                      value={editForm.city} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập thành phố..."
                      disabled={editSaving}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Địa chỉ
                    </label>
                    <input 
                      name="address" 
                      value={editForm.address} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập địa chỉ..."
                      disabled={editSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Mã số thuế
                    </label>
                    <input 
                      name="tax_id" 
                      value={editForm.tax_id} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập mã số thuế..."
                      disabled={editSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Quốc gia
                    </label>
                    <input 
                      name="country" 
                      value={editForm.country} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập quốc gia..."
                      disabled={editSaving}
                    />
                  </div>
                </div>
              </div>
              
              {/* Financial Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin tài chính</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Hạn mức tín dụng (VND)
                    </label>
                    <input 
                      name="credit_limit" 
                      type="number" 
                      value={editForm.credit_limit} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập hạn mức tín dụng..."
                      disabled={editSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Điều khoản thanh toán (ngày)
                    </label>
                    <input 
                      name="payment_terms" 
                      type="number" 
                      value={editForm.payment_terms} 
                      onChange={handleEditChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập số ngày thanh toán..."
                      disabled={editSaving}
                    />
                  </div>
                </div>
              </div>
              
              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin bổ sung</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Ghi chú
                    </label>
                    <textarea 
                      name="notes" 
                      value={editForm.notes} 
                      onChange={handleEditTextareaChange} 
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                      placeholder="Nhập ghi chú..."
                      disabled={editSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  disabled={editSaving}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-blue-600 border border-transparent rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
                  disabled={editSaving}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showTourCompletionPrompt && (
        <div className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 max-w-sm bg-white border border-gray-200 rounded-xl shadow-xl p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bạn cần hướng dẫn lại phần nào?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Tour sẽ đóng sau {tourCountdown}s. Bạn có thể khởi động lại ngay để xem lại các bước hướng dẫn.
          </p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setShowTourCompletionPrompt(false)
                setTourCountdown(TOUR_COUNTDOWN_SECONDS)
              }}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Để sau
            </button>
            <button
              onClick={handleRestartTour}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Bắt đầu lại tour
            </button>
          </div>
        </div>
      )}
    </LayoutWithSidebar>
  )
}
