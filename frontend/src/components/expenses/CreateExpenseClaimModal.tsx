'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus, Receipt, Upload, FileText } from 'lucide-react'
import { expenseClaimsApi } from '@/lib/api'

interface CreateExpenseClaimModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ExpenseClaimItem {
  expense_category: string
  description: string
  expense_date: string
  amount: number
  receipt_url?: string
  receipt_filename?: string
  receipt_size?: number
  notes?: string
}

const EXPENSE_CATEGORIES = [
  { value: 'travel', label: 'Đi lại/Công tác' },
  { value: 'meals', label: 'Ăn uống' },
  { value: 'office_supplies', label: 'Văn phòng phẩm' },
  { value: 'transportation', label: 'Vận chuyển' },
  { value: 'accommodation', label: 'Lưu trú' },
  { value: 'entertainment', label: 'Giải trí' },
  { value: 'communication', label: 'Viễn thông' },
  { value: 'training', label: 'Đào tạo' },
  { value: 'other', label: 'Khác' }
]

export default function CreateExpenseClaimModal({ isOpen, onClose, onSuccess }: CreateExpenseClaimModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [items, setItems] = useState<ExpenseClaimItem[]>([
    { 
      expense_category: 'travel', 
      description: '', 
      expense_date: new Date().toISOString().split('T')[0], 
      amount: 0, 
      notes: '' 
    }
  ])
  const [formData, setFormData] = useState({
    submission_date: new Date().toISOString().split('T')[0],
    description: '',
    currency: 'VND',
    notes: ''
  })

  const addItem = () => {
    setItems([...items, { 
      expense_category: 'travel', 
      description: '', 
      expense_date: new Date().toISOString().split('T')[0], 
      amount: 0, 
      notes: '' 
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof ExpenseClaimItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      const totalAmount = calculateTotal()
      
      const claimData = {
        employee_id: 'current-user-id', // This will be set by the backend
        submission_date: formData.submission_date,
        description: formData.description,
        line_items: items,
        total_amount: totalAmount,
        currency: formData.currency,
        notes: formData.notes
      }

      await expenseClaimsApi.createExpenseClaim(claimData)
      
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating expense claim:', error)
      alert('Có lỗi xảy ra khi tạo đề nghị hoàn ứng: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      submission_date: new Date().toISOString().split('T')[0],
      description: '',
      currency: 'VND',
      notes: ''
    })
    setItems([{ 
      expense_category: 'travel', 
      description: '', 
      expense_date: new Date().toISOString().split('T')[0], 
      amount: 0, 
      notes: '' 
    }])
  }

  if (!isOpen) return null

  const totalAmount = calculateTotal()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tạo đề nghị hoàn ứng mới</h2>
              <p className="text-sm text-black">Tạo đề nghị hoàn ứng cho chi phí cá nhân</p>
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
                  Ngày gửi *
                </label>
                <input
                  type="date"
                  value={formData.submission_date}
                  onChange={(e) => setFormData({ ...formData, submission_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiền tệ
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chung *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Mô tả tổng quan về đề nghị hoàn ứng..."
                required
              />
            </div>

            {/* Expense Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Chi tiết chi phí</h3>
                <button
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm khoản chi
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900">Khoản chi {index + 1}</h4>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Loại chi phí *
                        </label>
                        <select
                          value={item.expense_category}
                          onChange={(e) => updateItem(index, 'expense_category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        >
                          {EXPENSE_CATEGORIES.map(category => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày chi phí *
                        </label>
                        <input
                          type="date"
                          value={item.expense_date}
                          onChange={(e) => updateItem(index, 'expense_date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số tiền *
                        </label>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả chi tiết *
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={2}
                        placeholder="Mô tả chi tiết về khoản chi này..."
                        required
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ghi chú
                      </label>
                      <textarea
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={2}
                        placeholder="Ghi chú thêm (tùy chọn)..."
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hóa đơn/Chứng từ
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          id={`receipt-${index}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              updateItem(index, 'receipt_filename', file.name)
                              updateItem(index, 'receipt_size', file.size)
                              // In a real app, you would upload the file and get a URL
                              updateItem(index, 'receipt_url', 'uploaded-file-url')
                            }
                          }}
                        />
                        <label
                          htmlFor={`receipt-${index}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Tải lên
                        </label>
                        {item.receipt_filename && (
                          <span className="text-sm text-black flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {item.receipt_filename}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <div className="text-sm text-black">
                        <span className="font-medium">Số tiền: </span>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(item.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(totalAmount)}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú bổ sung
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Nhập ghi chú bổ sung (tùy chọn)..."
              />
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
              disabled={submitting || !formData.description || items.some(item => !item.description || item.amount <= 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang tạo...' : 'Tạo đề nghị hoàn ứng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
