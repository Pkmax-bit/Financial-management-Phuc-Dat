'use client'

import React, { useState } from 'react'
import { X, Plus, Trash2, Calendar, DollarSign, BarChart3 } from 'lucide-react'
import { budgetingApi } from '@/lib/api'

interface BudgetLine {
  expense_category: string
  expense_category_name: string
  budgeted_amount: number
  notes?: string
}

interface CreateBudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const EXPENSE_CATEGORIES = [
  { value: 'travel', label: 'Đi lại', name: 'Chi phí đi lại' },
  { value: 'meals', label: 'Ăn uống', name: 'Chi phí ăn uống' },
  { value: 'office_supplies', label: 'Văn phòng phẩm', name: 'Văn phòng phẩm' },
  { value: 'utilities', label: 'Tiện ích', name: 'Chi phí tiện ích' },
  { value: 'marketing', label: 'Marketing', name: 'Chi phí marketing' },
  { value: 'training', label: 'Đào tạo', name: 'Chi phí đào tạo' },
  { value: 'equipment', label: 'Thiết bị', name: 'Chi phí thiết bị' },
  { value: 'software', label: 'Phần mềm', name: 'Chi phí phần mềm' },
  { value: 'consulting', label: 'Tư vấn', name: 'Chi phí tư vấn' },
  { value: 'other', label: 'Khác', name: 'Chi phí khác' }
]

export default function CreateBudgetModal({ isOpen, onClose, onSuccess }: CreateBudgetModalProps) {
  const [formData, setFormData] = useState({
    budget_name: '',
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    start_date: '',
    end_date: '',
    description: '',
    currency: 'VND'
  })
  
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([
    {
      expense_category: '',
      expense_category_name: '',
      budgeted_amount: 0,
      notes: ''
    }
  ])
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleLineChange = (index: number, field: string, value: string | number) => {
    const newLines = [...budgetLines]
    newLines[index] = { ...newLines[index], [field]: value }
    
    // Update category name when category changes
    if (field === 'expense_category') {
      const category = EXPENSE_CATEGORIES.find(cat => cat.value === value)
      if (category) {
        newLines[index].expense_category_name = category.name
      }
    }
    
    setBudgetLines(newLines)
  }

  const addBudgetLine = () => {
    setBudgetLines([...budgetLines, {
      expense_category: '',
      expense_category_name: '',
      budgeted_amount: 0,
      notes: ''
    }])
  }

  const removeBudgetLine = (index: number) => {
    if (budgetLines.length > 1) {
      setBudgetLines(budgetLines.filter((_, i) => i !== index))
    }
  }

  const calculateTotal = () => {
    return budgetLines.reduce((sum, line) => sum + (line.budgeted_amount || 0), 0)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.budget_name.trim()) {
      newErrors.budget_name = 'Tên ngân sách là bắt buộc'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Ngày bắt đầu là bắt buộc'
    }

    if (!formData.end_date) {
      newErrors.end_date = 'Ngày kết thúc là bắt buộc'
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu'
    }

    // Validate budget lines
    budgetLines.forEach((line, index) => {
      if (!line.expense_category) {
        newErrors[`line_${index}_category`] = 'Danh mục chi phí là bắt buộc'
      }
      if (!line.budgeted_amount || line.budgeted_amount <= 0) {
        newErrors[`line_${index}_amount`] = 'Số tiền ngân sách phải lớn hơn 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const totalAmount = calculateTotal()
      
      await budgetingApi.createBudget({
        ...formData,
        budget_lines: budgetLines,
        total_budget_amount: totalAmount
      })

      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error creating budget:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      budget_name: '',
      period: 'monthly',
      start_date: '',
      end_date: '',
      description: '',
      currency: 'VND'
    })
    setBudgetLines([{
      expense_category: '',
      expense_category_name: '',
      budgeted_amount: 0,
      notes: ''
    }])
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tạo ngân sách mới
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên ngân sách *
              </label>
              <input
                type="text"
                value={formData.budget_name}
                onChange={(e) => handleInputChange('budget_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.budget_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ví dụ: Ngân sách Q1 2024"
              />
              {errors.budget_name && (
                <p className="mt-1 text-sm text-red-600">{errors.budget_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chu kỳ *
              </label>
              <select
                value={formData.period}
                onChange={(e) => handleInputChange('period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Hàng tháng</option>
                <option value="quarterly">Hàng quý</option>
                <option value="yearly">Hàng năm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày bắt đầu *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.start_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày kết thúc *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.end_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mô tả về ngân sách này..."
            />
          </div>

          {/* Budget Lines */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Dòng ngân sách</h3>
              <button
                type="button"
                onClick={addBudgetLine}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Thêm dòng
              </button>
            </div>

            <div className="space-y-4">
              {budgetLines.map((line, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Danh mục chi phí *
                    </label>
                    <select
                      value={line.expense_category}
                      onChange={(e) => handleLineChange(index, 'expense_category', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[`line_${index}_category`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Chọn danh mục</option>
                      {EXPENSE_CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {errors[`line_${index}_category`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`line_${index}_category`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền ngân sách *
                    </label>
                    <input
                      type="number"
                      value={line.budgeted_amount}
                      onChange={(e) => handleLineChange(index, 'budgeted_amount', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[`line_${index}_amount`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                    {errors[`line_${index}_amount`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`line_${index}_amount`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      value={line.notes || ''}
                      onChange={(e) => handleLineChange(index, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ghi chú..."
                    />
                  </div>

                  <div className="flex items-end">
                    {budgetLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBudgetLine(index)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Xóa dòng"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Tổng ngân sách:</span>
              <span className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(calculateTotal())}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Tạo ngân sách
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
