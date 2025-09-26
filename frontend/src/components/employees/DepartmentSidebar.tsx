'use client'

import { useState } from 'react'
import { 
  X, 
  Building2, 
  Plus,
  DollarSign,
  Hash
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DepartmentSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function DepartmentSidebar({ isOpen, onClose, onSuccess }: DepartmentSidebarProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    budget: ''
  })

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

      // Check if code already exists
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id')
        .eq('code', formData.code.trim())
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
        is_active: true
      }

      const { error } = await supabase
        .from('departments')
        .insert([departmentData])

      if (error) throw error
      
      alert('Phòng ban đã được tạo thành công!')
      
      onSuccess()
      resetForm()
    } catch (err) {
      console.error('Error creating department:', err)
      setError(err instanceof Error ? (err as Error).message : 'Có lỗi xảy ra khi tạo phòng ban')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      budget: ''
    })
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-lg">
      {/* Right Sidebar - No overlay to not block interface */}
      <div className="bg-white shadow-2xl border border-gray-200 rounded-lg max-h-[85vh] overflow-hidden animate-slide-in-right">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tạo phòng ban mới</h2>
              <p className="text-sm text-gray-500">Thêm phòng ban vào hệ thống</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={submitting}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Mô tả về chức năng và vai trò của phòng ban..."
                disabled={submitting}
              />
            </div>

            {/* Information note */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Sau khi tạo phòng ban, bạn có thể tạo các chức vụ thuộc phòng ban này.
                  </p>
                </div>
              </div>
            </div>

            </div>
          </form>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                disabled={submitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                {submitting ? 'Đang tạo...' : 'Tạo phòng ban'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
