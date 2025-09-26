'use client'

import { useState } from 'react'
import { 
  X, 
  Building2, 
  Save,
  
  DollarSign,
  Hash,
  AlertCircle,
  FileText
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CreateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateDepartmentModal({ isOpen, onClose, onSuccess }: CreateDepartmentModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    budget: ''
  })

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
    if (!submitting) {
      resetForm()
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Vui lòng điền tên và mã phòng ban')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

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
      onClose()
      resetForm()
    } catch (err) {
      console.error('Error creating department:', err)
      setError((err as Error).message || 'Không thể tạo phòng ban')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-md">
      {/* Right Sidebar - No overlay to not block interface */}
      <div className="bg-white shadow-2xl border border-gray-200 rounded-lg max-h-[85vh] overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tạo phòng ban mới</h2>
              <p className="text-sm text-gray-500 mt-1">Thêm phòng ban mới vào hệ thống</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Tên phòng ban *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập tên phòng ban..."
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
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="VD: IT, HR, SALES..."
                required
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mã phòng ban sẽ được tự động viết hoa
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mô tả vai trò và chức năng của phòng ban..."
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
                onChange={(e) => handleInputChange('budget', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập ngân sách phòng ban..."
                min="0"
                step="1000"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Để trống nếu chưa có ngân sách
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting || !formData.name.trim() || !formData.code.trim()}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Tạo phòng ban
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
