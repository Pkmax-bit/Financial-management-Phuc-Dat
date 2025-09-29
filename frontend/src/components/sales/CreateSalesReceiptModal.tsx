'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Calculator } from 'lucide-react'
import { apiGet, salesReceiptsApi } from '@/lib/api'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  unit?: string
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
}

interface SalesReceiptItem {
  product_id?: string
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  discount_rate: number
  discount_amount: number
  line_total: number
}

interface CreateSalesReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateSalesReceiptModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateSalesReceiptModalProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [lineItems, setLineItems] = useState<SalesReceiptItem[]>([
    {
      product_id: '',
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_rate: 0,
      discount_amount: 0,
      line_total: 0
    }
  ])
  const [subtotal, setSubtotal] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchCustomers()
    }
  }, [isOpen])

  useEffect(() => {
    calculateTotals()
  }, [lineItems, taxRate, discountAmount])

  const fetchProducts = async () => {
    try {
      const data = await apiGet('/api/products')
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const data = await apiGet('/api/customers')
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const calculateTotals = () => {
    const newSubtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)
    setSubtotal(newSubtotal)
    
    const newTaxAmount = (newSubtotal - discountAmount) * (taxRate / 100)
    setTaxAmount(newTaxAmount)
    
    const newTotal = newSubtotal - discountAmount + newTaxAmount
    setTotalAmount(newTotal)
  }

  const addLineItem = () => {
    setLineItems([...lineItems, {
      product_id: '',
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_rate: 0,
      discount_amount: 0,
      line_total: 0
    }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (index: number, field: keyof SalesReceiptItem, value: any) => {
    const newLineItems = [...lineItems]
    newLineItems[index] = { ...newLineItems[index], [field]: value }
    
    // Recalculate line total
    const item = newLineItems[index]
    const lineSubtotal = item.quantity * item.unit_price
    const lineDiscount = lineSubtotal * (item.discount_rate / 100)
    item.discount_amount = lineDiscount
    item.line_total = lineSubtotal - lineDiscount
    
    setLineItems(newLineItems)
  }

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      updateLineItem(index, 'product_id', productId)
      updateLineItem(index, 'product_name', product.name)
      updateLineItem(index, 'description', product.description || '')
      updateLineItem(index, 'unit_price', product.price)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (lineItems.some(item => !item.product_name || item.quantity <= 0 || item.unit_price <= 0)) {
      alert('Vui lòng điền đầy đủ thông tin sản phẩm')
      return
    }

    if (totalAmount <= 0) {
      alert('Tổng tiền phải lớn hơn 0')
      return
    }

    try {
      setLoading(true)
      
      const receiptData = {
        customer_id: selectedCustomer || null,
        issue_date: issueDate,
        line_items: lineItems,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        notes: notes || null
      }

      await salesReceiptsApi.createSalesReceipt(receiptData)
      
      onSuccess()
      onClose()
      
      // Reset form
      setSelectedCustomer('')
      setIssueDate(new Date().toISOString().split('T')[0])
      setLineItems([{
        product_id: '',
        product_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_rate: 0,
        discount_amount: 0,
        line_total: 0
      }])
      setSubtotal(0)
      setTaxRate(0)
      setTaxAmount(0)
      setDiscountAmount(0)
      setTotalAmount(0)
      setPaymentMethod('Cash')
      setNotes('')
      
    } catch (error) {
      console.error('Error creating sales receipt:', error)
      alert('Lỗi khi tạo phiếu thu')
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tạo Phiếu Thu Bán Hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khách hàng
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn khách hàng (tùy chọn)</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.email && `(${customer.email})`}
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
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Sản phẩm/Dịch vụ</h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm sản phẩm
              </button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Sản phẩm {index + 1}</h4>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sản phẩm *
                      </label>
                      <select
                        value={item.product_id}
                        onChange={(e) => selectProduct(index, e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Chọn sản phẩm</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        value={item.discount_rate}
                        onChange={(e) => updateLineItem(index, 'discount_rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Mô tả: {item.description || 'Không có mô tả'}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Thành tiền: {formatCurrency(item.line_total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tạm tính:</span>
                  <span className="text-sm font-medium">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Giảm giá:</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Thuế (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Thuế:</span>
                  <span className="text-sm font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Giảm giá:</span>
                  <span className="text-sm font-medium">{formatCurrency(discountAmount)}</span>
                </div>
                
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="text-base font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-base font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phương thức thanh toán *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Cash">Tiền mặt</option>
                <option value="Credit Card">Thẻ tín dụng</option>
                <option value="Bank Transfer">Chuyển khoản</option>
                <option value="Debit Card">Thẻ ghi nợ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ghi chú thêm về giao dịch..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Tạo Phiếu Thu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
