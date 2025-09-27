'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar,
  User,
  DollarSign,
  FileText,
  Save,
  Send,
  ChevronRight,
  ChevronDown,
  Minus,
  Plus as PlusIcon
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  tax_code?: string
}

interface QuoteItem {
  id?: string
  quote_id?: string
  product_service_id?: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  name_product?: string
}

interface CreateQuoteSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateQuoteSidebar({ isOpen, onClose, onSuccess }: CreateQuoteSidebarProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    items: true,
    totals: true,
    additional: false
  })

  // Form data
  const [formData, setFormData] = useState({
    quote_number: '',
    customer_id: '',
    project_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    tax_rate: 10,
    tax_amount: 0,
    total_amount: 0,
    currency: 'VND',
    status: 'draft',
    notes: '',
    terms: 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.',
    created_by: ''
  })

  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unit_price: 0, total_price: 0, name_product: '' }
  ])

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      generateQuoteNumber()
    }
  }, [isOpen])

  useEffect(() => {
    calculateSubtotal()
  }, [items])

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
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price
      return sum + itemTotal
    }, 0)
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
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total_price: 0, name_product: '' }])
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

  const incrementQuantity = (index: number) => {
    const updatedItems = [...items]
    updatedItems[index].quantity += 1
    updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    setItems(updatedItems)
  }

  const decrementQuantity = (index: number) => {
    const updatedItems = [...items]
    if (updatedItems[index].quantity > 0.01) {
      updatedItems[index].quantity = Math.max(0.01, updatedItems[index].quantity - 1)
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
      setItems(updatedItems)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSubmit = async (sendImmediately = false) => {
    setSubmitting(true)
    
    try {
      console.log('🔍 Creating quote with data:', {
        formData,
        items,
        sendImmediately
      })
      
      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser()
      
      // Check if user exists in employees table
      let created_by = null
      if (user?.id) {
        console.log('🔍 Looking for employee with user_id:', user.id)
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (employeeError) {
          console.log('🔍 Employee not found or error:', employeeError)
        } else {
          console.log('🔍 Employee found:', employee)
          created_by = employee.id
        }
      } else {
        console.log('🔍 No user found in auth')
      }
      
      console.log('🔍 Final created_by value:', created_by)
      
      const quoteData = {
        quote_number: formData.quote_number,
        customer_id: formData.customer_id,
        project_id: formData.project_id || null,
        issue_date: formData.issue_date,
        valid_until: formData.valid_until,
        subtotal: formData.subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: formData.tax_amount,
        total_amount: formData.total_amount,
        currency: formData.currency,
        status: sendImmediately ? 'sent' : formData.status,
        notes: formData.notes,
        terms: formData.terms,
        created_by: created_by,
        quote_date: new Date().toISOString()
      }

      console.log('🔍 Quote data to send:', quoteData)
      
      // Create quote first
      const { data: quoteResult, error: quoteError } = await supabase
        .from('quotes')
        .insert([quoteData])
        .select()
        .single()
      
      if (quoteError) {
        console.error('❌ Supabase quote error:', quoteError)
        throw quoteError
      }
      
      console.log('🔍 Quote created successfully:', quoteResult)
      
      // Create quote items
      const quoteItems = items.map(item => ({
        quote_id: quoteResult.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        name_product: item.name_product || item.description
      }))
      
      const { data: itemsResult, error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems)
        .select()
      
      if (itemsError) {
        console.error('❌ Supabase items error:', itemsError)
        throw itemsError
      }
      
      console.log('🔍 Quote items created successfully:', itemsResult)
      alert('Báo giá đã được tạo thành công trong database!')
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('❌ Error creating quote:', error)
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
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 0,
      tax_rate: 10,
      tax_amount: 0,
      total_amount: 0,
      currency: 'VND',
      status: 'draft',
      notes: '',
      terms: 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.',
      created_by: ''
    })
    setItems([{ description: '', quantity: 1, unit_price: 0, total_price: 0, name_product: '' }])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (!isOpen) return null

  const tax_amount = formData.subtotal * (formData.tax_rate / 100)
  const total_amount = formData.subtotal + tax_amount

  return (
    <>
      {/* Invisible backdrop for click detection - no visual blocking */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Panel - No visual backdrop to not block interface */}
      <div className={`fixed top-0 right-0 h-full w-[1200px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Tạo báo giá mới</h2>
              <p className="text-blue-100 mt-1">Tạo và gửi báo giá chuyên nghiệp cho khách hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 relative">
          {/* Scroll indicator */}
          <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm border">
            Cuộn để xem thêm
          </div>
          
          {/* Basic Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('basic')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Thông tin cơ bản
              </h3>
              {expandedSections.basic ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.basic && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Số báo giá</label>
                    <input
                      type="text"
                      value={formData.quote_number}
                      onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="QUO-20241225-ABC123"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Khách hàng</label>
                    {loading ? (
                      <div className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-gray-50">
                        <span className="text-xs text-gray-500">Đang tải...</span>
                      </div>
                    ) : customers.length === 0 ? (
                      <div className="w-full border border-red-300 rounded-md px-2 py-1.5 bg-red-50">
                        <span className="text-xs text-red-600">Không có khách hàng</span>
                      </div>
                    ) : (
                      <select
                        value={formData.customer_id}
                        onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    <label className="block text-xs font-semibold text-black mb-1">Trạng thái</label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="draft">Nháp</option>
                      <option value="sent">Đã gửi</option>
                      <option value="viewed">Đã xem</option>
                      <option value="accepted">Đã chấp nhận</option>
                      <option value="declined">Đã từ chối</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Tiền tệ</label>
                    <select
                      value={formData.currency || 'VND'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Ngày phát hành</label>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Ngày hết hạn</label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Thời hạn (ngày)</label>
                    <input
                      type="number"
                      value={Math.ceil((new Date(formData.valid_until).getTime() - new Date(formData.issue_date).getTime()) / (1000 * 60 * 60 * 24))}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 30
                        const issueDate = new Date(formData.issue_date)
                        const validUntilDate = new Date(issueDate.getTime() + days * 24 * 60 * 60 * 1000)
                        setFormData({ ...formData, valid_until: validUntilDate.toISOString().split('T')[0] })
                      }}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="30"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('items')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Chi tiết báo giá ({items.length} mục)
              </h3>
              {expandedSections.items ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.items && (
              <div className="px-4 pb-4">
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm dòng mới
                  </button>
                </div>

                        {/* Scrollable items container */}
                        <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 hover:scrollbar-thumb-blue-400">
                          {items.map((item, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-semibold text-black">Mục {index + 1}</span>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    {formatCurrency(item.total_price)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  disabled={items.length === 1}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs font-semibold text-black mb-1">Mô tả sản phẩm/dịch vụ</label>
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập mô tả sản phẩm hoặc dịch vụ..."
                                  />
                                </div>
                                
                                <div className="grid grid-cols-4 gap-2">
                                  <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Số lượng</label>
                                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() => decrementQuantity(index)}
                                        className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
                                        disabled={item.quantity <= 0.01}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="flex-1 border-0 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-0 text-center"
                                        placeholder="1"
                                        min="0"
                                        step="0.01"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => incrementQuantity(index)}
                                        className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
                                      >
                                        <PlusIcon className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Đơn giá</label>
                                    <input
                                      type="number"
                                      value={item.unit_price}
                                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="0"
                                      min="0"
                                      step="1000"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-black mb-1">Tên sản phẩm</label>
                                    <input
                                      type="text"
                                      value={item.name_product || ''}
                                      onChange={(e) => updateItem(index, 'name_product', e.target.value)}
                                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Tên sản phẩm"
                                    />
                                  </div>
                                </div>

                                <div className="bg-blue-50 rounded-md p-2 border border-blue-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-black">Thành tiền:</span>
                                    <span className="text-sm font-bold text-blue-600">
                                      {formatCurrency(item.total_price)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600 mt-0.5">
                                    {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.quantity * item.unit_price)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
              </div>
            )}
          </div>

          {/* Totals Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('totals')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Tổng cộng
              </h3>
              {expandedSections.totals ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
                    {expandedSections.totals && (
                      <div className="px-4 pb-4 space-y-3">
                        {/* Summary Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Subtotal */}
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-black">Tổng phụ:</span>
                              <span className="text-sm font-bold text-black">{formatCurrency(formData.subtotal)}</span>
                            </div>
                          </div>
                          
                          {/* VAT Section */}
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-black">Thuế VAT</span>
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={formData.tax_rate}
                                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                                  className="w-16 border border-blue-300 rounded-md px-2 py-1 text-xs text-center font-semibold text-black focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  placeholder="10"
                                />
                                <span className="text-xs font-semibold text-black">%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-black">Số tiền thuế:</span>
                              <span className="text-sm font-bold text-black">
                                {formatCurrency(tax_amount)}
                              </span>
                            </div>
                          </div>
                        </div>


                        {/* Total Section */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Tổng cộng:</span>
                            <span className="text-2xl font-bold">
                              {formatCurrency(total_amount)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm opacity-90">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <span>Tổng phụ: {formatCurrency(formData.subtotal)}</span>
                              <span>+ Thuế: {formatCurrency(tax_amount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
          </div>

          {/* Additional Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('additional')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Thông tin bổ sung
              </h3>
              {expandedSections.additional ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.additional && (
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Điều khoản & Điều kiện</label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Điều khoản và điều kiện..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Ghi chú thêm..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-col space-y-3">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting || !formData.customer_id || items.some(item => !item.description)}
              className="w-full py-3 px-4 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Đang gửi...' : 'Lưu & Gửi báo giá'}
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting || !formData.customer_id || items.some(item => !item.description)}
                className="flex-1 py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {submitting ? 'Đang lưu...' : 'Lưu nháp'}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}