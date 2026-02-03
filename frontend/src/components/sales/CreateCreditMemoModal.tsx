'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Calculator } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'

interface Customer {
  id: string
  name: string
  email: string
}

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  customer_id: string
}

interface CreditMemoItem {
  product_id?: string
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  discount_rate?: number
  discount_amount?: number
  line_total: number
  reason?: string
}

interface CreateCreditMemoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  originalInvoiceId?: string
}

export default function CreateCreditMemoModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  originalInvoiceId 
}: CreateCreditMemoModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    customer_id: '',
    original_invoice_id: originalInvoiceId || '',
    issue_date: new Date().toISOString().split('T')[0],
    returned_items: [] as CreditMemoItem[],
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    currency: 'VND',
    reason: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      if (originalInvoiceId) {
        fetchInvoices()
      }
    }
  }, [isOpen, originalInvoiceId])

  const fetchCustomers = async () => {
    try {
      const data = await apiGet('/api/customers')
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const data = await apiGet('/api/sales/invoices')
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const addItem = () => {
    const newItem: CreditMemoItem = {
      product_name: '',
      quantity: 1,
      unit_price: 0,
      discount_rate: 0,
      discount_amount: 0,
      line_total: 0,
      reason: ''
    }
    setFormData({
      ...formData,
      returned_items: [...formData.returned_items, newItem]
    })
  }

  const updateItem = (index: number, field: keyof CreditMemoItem, value: any) => {
    const updatedItems = [...formData.returned_items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate line total
    if (field === 'quantity' || field === 'unit_price' || field === 'discount_rate') {
      const item = updatedItems[index]
      const subtotal = item.quantity * item.unit_price
      const discountAmount = subtotal * (item.discount_rate || 0) / 100
      updatedItems[index].line_total = subtotal - discountAmount
    }
    
    setFormData({ ...formData, returned_items: updatedItems })
    calculateTotals(updatedItems)
  }

  const removeItem = (index: number) => {
    const updatedItems = formData.returned_items.filter((_, i) => i !== index)
    setFormData({ ...formData, returned_items: updatedItems })
    calculateTotals(updatedItems)
  }

  const calculateTotals = (items: CreditMemoItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0)
    const taxAmount = subtotal * formData.tax_rate / 100
    const totalAmount = subtotal + taxAmount - formData.discount_amount
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.returned_items.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm trả lại')
      return
    }

    if (!formData.customer_id) {
      alert('Vui lòng chọn khách hàng')
      return
    }

    try {
      setLoading(true)
      await apiPost('/api/sales/credit-memos', formData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating credit memo:', error)
      alert('Lỗi khi tạo credit memo')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Tạo Credit Memo Mới
          </h2>
          <button
            onClick={onClose}
            className="text-black hover:text-black"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khách hàng *
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Chọn khách hàng</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn hàng gốc (tùy chọn)
              </label>
              <select
                value={formData.original_invoice_id}
                onChange={(e) => setFormData({ ...formData, original_invoice_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Không có đơn hàng gốc</option>
                {invoices
                  .filter(invoice => invoice.customer_id === formData.customer_id)
                  .map(invoice => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {formatCurrency(invoice.total_amount)}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày phát hành *
              </label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do trả lại
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Ví dụ: Hàng bị lỗi, Khách hàng không hài lòng..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Returned Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Sản phẩm trả lại</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm sản phẩm
              </button>
            </div>

            {formData.returned_items.length === 0 ? (
              <div className="text-center py-8 text-black">
                Chưa có sản phẩm nào. Hãy thêm sản phẩm trả lại.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.returned_items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên sản phẩm *
                        </label>
                        <input
                          type="text"
                          value={item.product_name}
                          onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số lượng *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Đơn giá *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Giảm giá (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.discount_rate || 0}
                          onChange={(e) => updateItem(index, 'discount_rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lý do trả lại
                      </label>
                      <input
                        type="text"
                        value={item.reason || ''}
                        onChange={(e) => updateItem(index, 'reason', e.target.value)}
                        placeholder="Lý do cụ thể cho sản phẩm này..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="mt-2 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        Thành tiền: {formatCurrency(item.line_total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tax and Discount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thuế suất (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => {
                  const taxRate = parseFloat(e.target.value) || 0
                  setFormData({ ...formData, tax_rate: taxRate })
                  calculateTotals(formData.returned_items)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giảm giá chung
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) => {
                  const discountAmount = parseFloat(e.target.value) || 0
                  setFormData({ ...formData, discount_amount: discountAmount })
                  calculateTotals(formData.returned_items)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ghi chú thêm..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Tạm tính:</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(formData.subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Thuế:</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(formData.tax_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Giảm giá:</span>
              <span className="text-sm font-semibold text-gray-900">
                -{formatCurrency(formData.discount_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-lg font-bold text-gray-900">Tổng cộng:</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(formData.total_amount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || formData.returned_items.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Tạo Credit Memo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
