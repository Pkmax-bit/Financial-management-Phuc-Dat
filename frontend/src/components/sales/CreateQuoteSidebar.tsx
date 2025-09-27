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
  ChevronDown
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  tax_code?: string
}

interface QuoteItem {
  description: string
  quantity: number
  unit_price: number
  subtotal: number
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
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    tax_rate: 10,
    discount_amount: 0,
    notes: '',
    terms_and_conditions: 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.'
  })

  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unit_price: 0, subtotal: 0 }
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
      const data = await apiGet('/api/customers')
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
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
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    setFormData(prev => ({ ...prev, subtotal }))
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, subtotal: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate subtotal for this item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].subtotal = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    setItems(updatedItems)
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
      const tax_amount = formData.subtotal * (formData.tax_rate / 100)
      const total_amount = formData.subtotal + tax_amount - formData.discount_amount

      const quoteData = {
        ...formData,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal
        })),
        tax_amount,
        total_amount,
        currency: 'VND',
        status: sendImmediately ? 'sent' : 'draft'
      }

      const result = await apiPost('/api/sales/quotes', quoteData)
        
      // If sending immediately, also send the quote
      if (sendImmediately) {
        await apiPost(`/api/sales/quotes/${result.id}/send`, {})
      }

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
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 0,
      tax_rate: 10,
      discount_amount: 0,
      notes: '',
      terms_and_conditions: 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.'
    })
    setItems([{ description: '', quantity: 1, unit_price: 0, subtotal: 0 }])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (!isOpen) return null

  const tax_amount = formData.subtotal * (formData.tax_rate / 100)
  const total_amount = formData.subtotal + tax_amount - formData.discount_amount

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
      <div className={`fixed top-0 right-0 h-full w-[600px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tạo báo giá mới</h2>
              <p className="text-sm text-gray-600">Tạo và gửi báo giá cho khách hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
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
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số báo giá</label>
                    <input
                      type="text"
                      value={formData.quote_number}
                      onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="QUO-20241225-ABC123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                    <select
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn khách hàng</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.email ? `(${customer.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày phát hành</label>
                      <input
                        type="date"
                        value={formData.issue_date}
                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                      <input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
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

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-700">Mục {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          placeholder="Mô tả sản phẩm/dịch vụ"
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="Số lượng"
                            min="0"
                            step="0.01"
                          />
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="Đơn giá"
                            min="0"
                            step="1000"
                          />
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900">
                            Thành tiền: {formatCurrency(item.subtotal)}
                          </span>
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
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tổng phụ:</span>
                  <span className="text-sm font-medium">{formatCurrency(formData.subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Thuế VAT:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-sm">%</span>
                    <span className="text-sm font-medium min-w-[80px] text-right">
                      {formatCurrency(tax_amount)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Giảm giá:</span>
                  <input
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                    min="0"
                    step="1000"
                    placeholder="0"
                  />
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {formatCurrency(total_amount)}
                    </span>
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
                    value={formData.terms_and_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
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