'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Building2, 
  Save,
  FileText,
  DollarSign,
  Hash
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Department {
  id: string
  name: string
  code: string
  description: string | null
  budget: number | null
  is_active: boolean
}

interface DepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  department?: Department | null
  isEdit?: boolean
}

export default function DepartmentModal({ isOpen, onClose, onSuccess, department, isEdit = false }: DepartmentModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    budget: '',
    is_active: true
  })

  useEffect(() => {
    if (isOpen && department && isEdit) {
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || '',
        budget: department.budget?.toString() || '',
        is_active: department.is_active
      })
    } else if (isOpen && !isEdit) {
      resetForm()
    }
  }, [isOpen, department, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên phòng ban')
      return
    }

    if (!formData.code.trim()) {
      setError('Vui lòng nhập mã phòng ban')
      return
    }

    try {
      setSubmitting(true)

      // Check if code already exists (for create) or exists for other departments (for edit)
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id')
        .eq('code', formData.code.trim())
        .neq('id', isEdit && department ? department.id : '')
        .single()

      if (existingDept) {
        setError('Mã phòng ban đã tồn tại. Vui lòng chọn mã khác.')
        return
      }

      const departmentData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        is_active: formData.is_active
      }

      if (isEdit && department) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update(departmentData)
          .eq('id', department.id)

        if (error) throw error
        alert('Phòng ban đã được cập nhật thành công!')
      } else {
        // Create new department
        const { error } = await supabase
          .from('departments')
          .insert([departmentData])

        if (error) throw error
        alert('Phòng ban đã được tạo thành công!')
      }
      
      onSuccess()
      onClose()
      resetForm()
    } catch (err) {
      console.error('Error saving department:', err)
      setError((err as Error).message || 'Có lỗi xảy ra khi lưu phòng ban')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      budget: '',
      is_active: true
    })
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-md">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Sửa phòng ban' : 'Tạo phòng ban mới'}
          </h2>
          <button
            onClick={handleClose}
            className="text-black hover:text-black"
            disabled={submitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Department Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              Tên phòng ban *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Ví dụ: Phòng Nhân sự"
              required
              maxLength={255}
              disabled={submitting}
            />
          </div>

          {/* Department Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="h-4 w-4 inline mr-1" />
              Mã phòng ban *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Ví dụ: HR, IT, SALES"
              required
              maxLength={50}
              disabled={submitting}
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Ngân sách (VND)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Ví dụ: 100000000"
              min="0"
              step="1000"
              disabled={submitting}
            />
          </div>

          {/* Department Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Mô tả ngắn gọn về chức năng và nhiệm vụ của phòng ban..."
              maxLength={1000}
              disabled={submitting}
            />
            <p className="text-xs text-black mt-1">
              {formData.description.length}/1000 ký tự
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={submitting}
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Phòng ban đang hoạt động
            </label>
          </div>

          {/* Information note */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Sau khi tạo phòng ban, bạn có thể tạo các chức vụ thuộc phòng ban này và phân công nhân viên.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              disabled={submitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? (isEdit ? 'Đang cập nhật...' : 'Đang tạo...') : (isEdit ? 'Cập nhật phòng ban' : 'Tạo phòng ban')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
