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
  Send
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
  unit?: string
}

interface CreateQuoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateQuoteModal({ isOpen, onClose, onSuccess }: CreateQuoteModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
    { description: '', quantity: 1, unit_price: 0, subtotal: 0, unit: '' }
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
    setItems([...items, { description: '', quantity: 1, unit_price: 0, subtotal: 0, unit: '' }])
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
          subtotal: item.subtotal,
          unit: item.unit || null
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
    setItems([{ description: '', quantity: 1, unit_price: 0, subtotal: 0, unit: '' }])
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
    <div className="fixed top-16 right-4 z-50 w-full max-w-4xl">
      {/* Right Sidebar - No overlay to not block interface */}
      <div className="bg-white shadow-2xl border border-gray-200 rounded-lg max-h-[85vh] overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tạo Báo giá mới</h2>
              <p className="text-sm text-black mt-1">Tạo và gửi báo giá cho khách hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-black hover:text-black p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Số báo giá</label>
              <input
                type="text"
                value={formData.quote_number}
                onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                placeholder="QUO-20241225-ABC123"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Khách hàng</label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
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

            <div>
              <label className="block text-sm font-semibold text-gray-900">Ngày phát hành</label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Ngày hết hạn</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Chi tiết báo giá</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Thêm dòng
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Mô tả</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Số lượng</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Đơn vị</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Đơn giá</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Thành tiền</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
                          placeholder="Mô tả sản phẩm/dịch vụ"
                        />
                      </td>
                    <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right text-gray-900"
                          min="0"
                          step="0.01"
                        />
                      </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.unit || ''}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
                        placeholder="m, m2, cái..."
                      />
                    </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right text-gray-900"
                          min="0"
                          step="1000"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="text-red-600 hover:text-red-800 disabled:text-black"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-900">Tổng phụ:</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(formData.subtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">Thuế VAT:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right text-gray-900"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-sm">%</span>
                  <span className="text-sm font-medium w-20 text-right">
                    {formatCurrency(tax_amount)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">Giảm giá:</span>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                  className="w-32 border border-gray-300 rounded px-2 py-1 text-sm text-right text-gray-900"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Điều khoản & Điều kiện</label>
              <textarea
                value={formData.terms_and_conditions}
                onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                rows={3}
                placeholder="Điều khoản và điều kiện..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Ghi chú</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                rows={2}
                placeholder="Ghi chú thêm..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 p-6">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting || !formData.customer_id || items.some(item => !item.description)}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang tạo...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Tạo báo giá
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting || !formData.customer_id || items.some(item => !item.description)}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu nháp
          </button>
          
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  )
}