'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus, ShoppingCart } from 'lucide-react'
import { purchaseOrdersApi, vendorsApi } from '@/lib/api'

interface CreatePurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
}

interface PurchaseOrderItem {
  product_id?: string
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  discount_rate: number
  discount_amount: number
  line_total: number
}

export default function CreatePurchaseOrderModal({ isOpen, onClose, onSuccess }: CreatePurchaseOrderModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    { product_name: '', description: '', quantity: 1, unit_price: 0, discount_rate: 0, discount_amount: 0, line_total: 0 }
  ])
  const [formData, setFormData] = useState({
    vendor_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    tax_rate: 10,
    discount_amount: 0,
    currency: 'VND',
    notes: '',
    terms: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchVendors()
    }
  }, [isOpen])

  const fetchVendors = async () => {
    try {
      const data = await vendorsApi.getVendors()
      setVendors(data)
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const addItem = () => {
    setItems([...items, { product_name: '', description: '', quantity: 1, unit_price: 0, discount_rate: 0, discount_amount: 0, line_total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate line total
    if (field === 'quantity' || field === 'unit_price' || field === 'discount_rate') {
      const item = updatedItems[index]
      const subtotal = item.quantity * item.unit_price
      const discountAmount = subtotal * (item.discount_rate / 100)
      updatedItems[index].discount_amount = discountAmount
      updatedItems[index].line_total = subtotal - discountAmount
    }
    
    setItems(updatedItems)
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0)
    const taxAmount = subtotal * (formData.tax_rate / 100)
    const totalAmount = subtotal + taxAmount - formData.discount_amount
    
    return { subtotal, taxAmount, totalAmount }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      const { subtotal, taxAmount, totalAmount } = calculateTotals()
      
      const poData = {
        vendor_id: formData.vendor_id,
        issue_date: formData.issue_date,
        delivery_date: formData.delivery_date || undefined,
        line_items: items,
        subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: taxAmount,
        discount_amount: formData.discount_amount,
        total_amount: totalAmount,
        currency: formData.currency,
        notes: formData.notes,
        terms: formData.terms
      }

      await purchaseOrdersApi.createPurchaseOrder(poData)
      
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Có lỗi xảy ra khi tạo đơn đặt hàng: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      vendor_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      tax_rate: 10,
      discount_amount: 0,
      currency: 'VND',
      notes: '',
      terms: ''
    })
    setItems([{ product_name: '', description: '', quantity: 1, unit_price: 0, discount_rate: 0, discount_amount: 0, line_total: 0 }])
  }

  if (!isOpen) return null

  const { subtotal, taxAmount, totalAmount } = calculateTotals()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <ShoppingCart className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tạo đơn đặt hàng mới</h2>
              <p className="text-sm text-black">Tạo đơn đặt hàng cho nhà cung cấp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-black"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhà cung cấp *
                </label>
                <select
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn nhà cung cấp</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày tạo *
                </label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày giao dự kiến
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiền tệ
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Sản phẩm/Dịch vụ</h3>
                <button
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm sản phẩm
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900">Sản phẩm {index + 1}</h4>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên sản phẩm *
                        </label>
                        <input
                          type="text"
                          value={item.product_name}
                          onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số lượng *
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Đơn giá *
                        </label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="1"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Giảm giá (%)
                        </label>
                        <input
                          type="number"
                          value={item.discount_rate}
                          onChange={(e) => updateItem(index, 'discount_rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả
                      </label>
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <div className="text-sm text-black">
                        <span className="font-medium">Tổng dòng: </span>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(item.line_total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thuế suất (%)
                  </label>
                  <input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giảm giá tổng
                  </label>
                  <input
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Tổng phụ:</span>
                  <span className="text-sm text-gray-900">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Thuế:</span>
                  <span className="text-sm text-gray-900">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Giảm giá:</span>
                  <span className="text-sm text-gray-900">
                    -{new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(formData.discount_amount)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập ghi chú cho đơn đặt hàng..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điều khoản
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập điều khoản và điều kiện..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.vendor_id || items.some(item => !item.product_name || item.quantity <= 0 || item.unit_price <= 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang tạo...' : 'Tạo đơn đặt hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
