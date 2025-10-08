'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Save,
  Tag,
  FileText
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CreateExpenseCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateExpenseCategoryDialog({ isOpen, onClose, onSuccess }: CreateExpenseCategoryDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  })

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Tên loại chi phí là bắt buộc'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả là bắt buộc'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    
    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('expense_categories')
        .insert([categoryData])
        .select()

      if (error) throw error

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating expense category:', error)
      alert('Có lỗi xảy ra khi tạo loại chi phí: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true
    })
    setErrors({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-2xl">
      {/* Right Sidebar - No overlay to not block interface */}
      <div className="bg-white shadow-2xl border border-gray-200 rounded-lg max-h-[85vh] overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <Tag className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tạo loại chi phí mới</h2>
              <p className="text-sm text-black mt-1">Thêm loại chi phí vào hệ thống</p>
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
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Tên loại chi phí *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                placeholder="Ví dụ: Đi lại, Ăn uống, Văn phòng phẩm..."
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Mô tả *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                rows={4}
                placeholder="Mô tả chi tiết về loại chi phí này..."
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-semibold text-gray-900">
                  Kích hoạt loại chi phí này
                </span>
              </label>
              <p className="mt-1 text-sm text-gray-600">
                Loại chi phí sẽ được hiển thị trong danh sách khi tạo chi phí mới
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Xem trước:</h3>
            <div className="text-sm text-gray-700">
              <p><strong>Tên:</strong> {formData.name || 'Chưa nhập tên'}</p>
              <p><strong>Mô tả:</strong> {formData.description || 'Chưa nhập mô tả'}</p>
              <p><strong>Trạng thái:</strong> {formData.is_active ? 'Đang hoạt động' : 'Tạm dừng'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 p-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !formData.name.trim() || !formData.description.trim()}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang tạo...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Tạo loại chi phí
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  )
}
