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
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  tax_code?: string
}

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
  unit?: string
}

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    tax_rate: 10,
    discount_amount: 0,
    payment_terms: '30 ngày',
    notes: '',
    terms_and_conditions: ''
  })

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0, unit: '' }
  ])

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      generateInvoiceNumber()
    }
  }, [isOpen])

  useEffect(() => {
    calculateSubtotal()
  }, [items])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const data = await apiGet(getApiEndpoint('/api/customers'))
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
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
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    setFormData(prev => ({ ...prev, subtotal }))
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0, unit: '' }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    setItems(updatedItems)
  }

  const handleSubmit = async (sendImmediately = false) => {
    setSubmitting(true)
    
    try {
      const tax_amount = formData.subtotal * (formData.tax_rate / 100)
      const total_amount = formData.subtotal + tax_amount - formData.discount_amount

      const invoiceData = {
        ...formData,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          unit: item.unit || null
        })),
        tax_amount,
        total_amount,
        currency: 'VND',
        status: sendImmediately ? 'sent' : 'draft'
      }

      const result = await apiPost(getApiEndpoint('/api/sales/invoices'), invoiceData)
        
      // If sending immediately, also send the invoice
      if (sendImmediately) {
        await apiPost(getApiEndpoint(`/api/sales/invoices/${result.id}/send`), {})
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Có lỗi xảy ra khi tạo đơn hàng: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      invoice_number: '',
      customer_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 0,
      tax_rate: 10,
      discount_amount: 0,
      payment_terms: '30 ngày',
      notes: '',
      terms_and_conditions: ''
    })
    setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }])
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tạo Đơn hàng mới</h2>
            <p className="text-sm text-black">Tạo và gửi đơn hàng cho khách hàng</p>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-black"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Số đơn hàng</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="INV-20241225-ABC123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700">Ngày phát hành</label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hạn thanh toán</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Chi tiết đơn hàng</h3>
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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Mô tả</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Số lượng</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Đơn vị</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Đơn giá</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Thành tiền</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Hành động</th>
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
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          placeholder="Mô tả sản phẩm/dịch vụ"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.unit || ''}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          placeholder="m, m2, cái..."
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right"
                          min="0"
                          step="1000"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        {formatCurrency(item.total)}
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
                <span className="text-sm text-black">Tổng phụ:</span>
                <span className="text-sm font-medium">{formatCurrency(formData.subtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-black">Thuế VAT:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right"
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
                <span className="text-sm text-black">Giảm giá:</span>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                  className="w-32 border border-gray-300 rounded px-2 py-1 text-sm text-right"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Điều kiện thanh toán</label>
              <input
                type="text"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="30 ngày, thanh toán ngay..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                placeholder="Ghi chú thêm..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting || !formData.customer_id || items.some(item => !item.description)}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-1" />
            {submitting ? 'Đang lưu...' : 'Lưu nháp'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting || !formData.customer_id || items.some(item => !item.description)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Send className="w-4 h-4 mr-1" />
            {submitting ? 'Đang gửi...' : 'Lưu & Gửi'}
          </button>
        </div>
      </div>
    </div>
  )
}