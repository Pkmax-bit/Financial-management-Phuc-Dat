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
  Save,
  Send,
  Package,
  Search
} from 'lucide-react'
import { apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
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
}

interface Product {
  id: string
  name: string
  description?: string
  unit?: string
  unit_price?: number
  category?: string
}

interface CreateInvoiceSidebarProps {
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

export default function CreateInvoiceSidebarFullscreen({ isOpen, onClose, onSuccess }: CreateInvoiceSidebarProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)

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

  const [items, setItems] = useState<InvoiceItem[]>([
    { name_product: '', description: '', quantity: 1, unit: '', unit_price: 0, total_price: 0 }
  ])

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchProducts()
      generateInvoiceNumber()
    } else {
      // Reset when closing sidebar
      setSelectedItemIndex(null)
      resetForm()
    }
  }, [isOpen])

  useEffect(() => {
    calculateSubtotal()
  }, [items, formData.tax_rate, formData.discount_amount])

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
          category: getCategoryDisplayName(product.product_categories?.name) || 'Khác'
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
          },
          {
            id: '4',
            name: 'Máy in Canon',
            description: 'Máy in laser đen trắng, tốc độ 20 trang/phút',
            unit: 'cái',
            unit_price: 4500000,
            category: 'Thiết bị văn phòng'
          },
          {
            id: '5',
            name: 'Ghế văn phòng',
            description: 'Ghế văn phòng có thể điều chỉnh độ cao, màu đen',
            unit: 'cái',
            unit_price: 1200000,
            category: 'Nội thất'
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

  const generateInvoiceNumber = () => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    setFormData(prev => ({
      ...prev,
      invoice_number: `INV-${dateStr}-${randomStr}`
    }))
  }

  const calculateSubtotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
    const tax_amount = subtotal * (formData.tax_rate / 100)
    const total_amount = subtotal + tax_amount - formData.discount_amount
    
    setFormData(prev => ({ 
      ...prev, 
      subtotal, 
      tax_amount, 
      total_amount 
    }))
  }

  const addItem = () => {
    setItems([...items, { name_product: '', description: '', quantity: 1, unit: '', unit_price: 0, total_price: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
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
    if (selectedItemIndex !== null) {
      const updatedItems = [...items]
      updatedItems[selectedItemIndex] = {
        ...updatedItems[selectedItemIndex],
        name_product: product.name,
        description: product.description || '',
        unit: product.unit || '',
        unit_price: product.unit_price || 0,
        total_price: updatedItems[selectedItemIndex].quantity * (product.unit_price || 0)
      }
      setItems(updatedItems)
    }
    setShowProductModal(false)
    setSelectedItemIndex(null)
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
        created_by,
        items: items.map(item => ({
          name_product: item.name_product,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      }

      const result = await apiPost('/api/sales/invoices', invoiceData)
        
      // If sending immediately, also send the invoice
      if (sendImmediately) {
        await apiPost(`/api/sales/invoices/${result.id}/send`, {})
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Có lỗi xảy ra khi tạo hóa đơn: ' + (error as Error).message)
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
    setItems([{ name_product: '', description: '', quantity: 1, unit: '', unit_price: 0, total_price: 0 }])
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
            <h1 className="text-xl font-semibold text-black">Tạo hóa đơn mới</h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <X className="h-5 w-5 text-gray-600" />
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
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-black">Sản phẩm/Dịch vụ</h2>
                <button
                  onClick={addItem}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm sản phẩm
                </button>
              </div>

              <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-black">
                    <div className="col-span-3">Tên sản phẩm</div>
                    <div className="col-span-3">Mô tả</div>
                    <div className="col-span-1">Số lượng</div>
                    <div className="col-span-1">Đơn vị</div>
                    <div className="col-span-2">Đơn giá</div>
                    <div className="col-span-2">Thành tiền</div>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-300">
                  {items.map((item, index) => (
                    <div key={index} className="px-4 py-3">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3">
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
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Mô tả"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            step="1"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="cái"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            step="1000"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-between">
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
                        <span className="text-sm font-medium text-black">Giảm giá:</span>
                        <span className="text-sm font-medium text-black">{formatCurrency(formData.discount_amount)}</span>
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

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-60 bg-gray-500 bg-opacity-20 flex items-end justify-center">
          <div className="bg-white rounded-t-lg shadow-xl w-full max-w-5xl mx-4 max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-700">Chọn sản phẩm</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 hover:bg-gray-200 rounded-md transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
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
                      <div key={category} className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3 px-3 py-2 bg-white rounded-md border border-gray-200 shadow-sm">
                          📁 {category}
                        </h4>
                        <div className="space-y-2">
                          {categoryProducts.map((product) => (
                            <div
                              key={product.id}
                              onClick={() => selectProduct(product)}
                              className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <div className="grid grid-cols-4 gap-4 items-center">
                                <div className="col-span-1">
                                  <h5 className="font-semibold text-gray-800 text-sm mb-1">{product.name}</h5>
                                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded inline-block">
                                    {category}
                                  </div>
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
                                    <span className="font-medium">Mô tả:</span><br/>
                                    {product.description || 'Không có mô tả'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
