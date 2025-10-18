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
import { apiPost } from '@/lib/api'
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
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    description: false,
    quantity: true,
    unit: true,
    unit_price: true,
    total_price: true,
    area: true,
    volume: true,
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
    tax_rate: 10,
    tax_amount: 0,
    total_amount: 0,
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
        const transformedEmployees = data.map(emp => ({
          id: emp.id,
          name: emp.users?.full_name || `${emp.first_name} ${emp.last_name}`.trim(),
          email: emp.email,
          user_id: emp.user_id
        }))
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

  const toggleColumn = (column: string) => {
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
      volume: true,
      height: true,
      length: true,
      depth: true
    })
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate total_price for this item
    if (field === 'quantity' || field === 'unit_price') {
      const itemTotal = updatedItems[index].quantity * updatedItems[index].unit_price
      updatedItems[index].total_price = itemTotal
    }
    
    setItems(updatedItems)
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
    
    if (selectedItemIndex !== null) {
      const updatedItems = [...items]
      const newItem = {
        ...updatedItems[selectedItemIndex],
        name_product: product.name,
        description: product.description || '',
        unit: product.unit || '',
        unit_price: product.unit_price || 0,
        total_price: updatedItems[selectedItemIndex].quantity * (product.unit_price || 0),
        area: product.area !== undefined ? product.area : null,
        volume: product.volume !== undefined ? product.volume : null,
        height: product.height !== undefined ? product.height : null,
        length: product.length !== undefined ? product.length : null,
        depth: product.depth !== undefined ? product.depth : null
      }
      console.log('🔍 New item after selection:', newItem)
      updatedItems[selectedItemIndex] = newItem
      setItems(updatedItems)
    }
    setShowProductModal(false)
    setSelectedItemIndex(null)
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
        created_by
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

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems)

        if (itemsError) {
          console.error('Error creating quote items:', itemsError)
          // Don't throw error here, quote was created successfully
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
        <div className="flex-1 overflow-y-auto p-6">
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

              <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
                  <div className="grid gap-4 text-sm font-medium text-black" style={{
                    gridTemplateColumns: [
                      visibleColumns.name && '2fr',
                      visibleColumns.description && '2fr', 
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
                    {visibleColumns.unit_price && <div>Đơn giá</div>}
                    {visibleColumns.total_price && <div>Thành tiền</div>}
                    {visibleColumns.area && <div>Diện tích</div>}
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
                          visibleColumns.description && '2fr', 
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
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Mô tả"
                            />
                          </div>
                        )}
                        {visibleColumns.quantity && (
                          <div>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="0"
                              step="1"
                            />
                          </div>
                        )}
                        {visibleColumns.unit && (
                          <div>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => updateItem(index, 'unit', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="cái"
                            />
                          </div>
                        )}
                        {visibleColumns.unit_price && (
                          <div>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="0"
                              step="1000"
                            />
                          </div>
                        )}
                        {visibleColumns.total_price && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-black">
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
                            <input
                              type="number"
                              value={item.area ?? ''}
                              onChange={(e) => updateItem(index, 'area', e.target.value ? Number(e.target.value) : null)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="m²"
                              step="0.01"
                            />
                          </div>
                        )}
                        {visibleColumns.volume && (
                          <div>
                            <input
                              type="number"
                              value={item.volume ?? ''}
                              onChange={(e) => updateItem(index, 'volume', e.target.value ? Number(e.target.value) : null)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="m³"
                              step="0.001"
                            />
                          </div>
                        )}
                        {visibleColumns.height && (
                          <div>
                            <input
                              type="number"
                              value={item.height ?? ''}
                              onChange={(e) => updateItem(index, 'height', e.target.value ? Number(e.target.value) : null)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="cm"
                              step="0.1"
                            />
                          </div>
                        )}
                        {visibleColumns.length && (
                          <div>
                            <input
                              type="number"
                              value={item.length ?? ''}
                              onChange={(e) => updateItem(index, 'length', e.target.value ? Number(e.target.value) : null)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="cm"
                              step="0.1"
                            />
                          </div>
                        )}
                        {visibleColumns.depth && (
                          <div>
                            <input
                              type="number"
                              value={item.depth ?? ''}
                              onChange={(e) => updateItem(index, 'depth', e.target.value ? Number(e.target.value) : null)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="cm"
                              step="0.1"
                            />
                          </div>
                        )}
                      </div>
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
                        <span className="text-base font-semibold text-black">{formatCurrency(formData.total_amount)}</span>
                      </div>
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
        <div className="fixed inset-0 z-60 bg-gray-500 bg-opacity-20 flex items-end justify-center">
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
            
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {loadingProducts ? (
                <div className="text-center py-8">
                  <span className="text-gray-500">Đang tải sản phẩm...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-gray-500">Không có sản phẩm nào</span>
                </div>
              ) : (
                <div className="p-4">
                  {(() => {
                    // Group products by category
                    const groupedProducts = products.reduce((acc, product) => {
                      const category = product.category || 'Khác'
                      if (!acc[category]) {
                        acc[category] = []
                      }
                      acc[category].push(product)
                      return acc
                    }, {} as Record<string, Product[]>)

                    return Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                      <div key={category} className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2 px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm">
                          📁 {category}
                        </h4>
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
                      </div>
                    ))
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
                onClick={() => {
                  // Map selected products into quote items, starting at current/first empty row
                  const map = new Map(products.map(p => [p.id, p]))
                  const chosen = selectedProductIds.map(id => map.get(id)).filter(Boolean) as Product[]
                  if (chosen.length > 0) {
                    const newItems = [...items]
                    // Determine starting index: selected row or first empty row
                    const findEmptyFrom = (startIdx: number) => {
                      for (let i = Math.max(0, startIdx); i < newItems.length; i++) {
                        if (!newItems[i].name_product || newItems[i].name_product.trim() === '') return i
                      }
                      return -1
                    }
                    let insertIdx = selectedItemIndex !== null ? selectedItemIndex : findEmptyFrom(0)
                    for (const p of chosen) {
                      if (insertIdx !== -1) {
                        // Fill existing empty row
                        newItems[insertIdx] = {
                          ...newItems[insertIdx],
                          name_product: p.name,
                          description: p.description || '',
                          quantity: newItems[insertIdx].quantity || 1,
                          unit: p.unit || '',
                          unit_price: p.unit_price || 0,
                          total_price: (newItems[insertIdx].quantity || 1) * (p.unit_price || 0),
                          area: p.area !== undefined ? p.area : null,
                          volume: p.volume !== undefined ? p.volume : null,
                          height: p.height !== undefined ? p.height : null,
                          length: p.length !== undefined ? p.length : null,
                          depth: p.depth !== undefined ? p.depth : null
                        }
                        insertIdx = findEmptyFrom(insertIdx + 1)
                      } else {
                        // Append new row
                        newItems.push({
                          name_product: p.name,
                          description: p.description || '',
                          quantity: 1,
                          unit: p.unit || '',
                          unit_price: p.unit_price || 0,
                          total_price: (p.unit_price || 0),
                          area: p.area !== undefined ? p.area : null,
                          volume: p.volume !== undefined ? p.volume : null,
                          height: p.height !== undefined ? p.height : null,
                          length: p.length !== undefined ? p.length : null,
                          depth: p.depth !== undefined ? p.depth : null
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
