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

  // Auto-generate simple code (3 digits only)
  const generateCode = (name: string) => {
    if (!name.trim()) return ''
    
    // Generate simple 3-digit code
    return String(Math.floor(Math.random() * 900) + 100)
  }

  // Auto-fill code when name changes (simple 3-digit code)
  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const generatedCode = generateCode(name)
    
    setFormData(prev => ({
      ...prev,
      name: name,
      code: generatedCode
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên phòng ban')
      return
    }

    // Auto-generate code if not set
    if (!formData.code.trim()) {
      const generatedCode = generateCode(formData.name.trim())
      setFormData(prev => ({ ...prev, code: generatedCode }))
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
          <div className="flex items-center justify-between border-b-2 border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tạo phòng ban mới</h2>
              <p className="text-sm font-semibold text-gray-700">Thêm phòng ban mới vào hệ thống</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
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
              <label className="block text-sm font-bold text-gray-900 mb-2">
                <Building2 className="h-4 w-4 inline mr-2 text-blue-600" />
                Tên phòng ban *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameInputChange}
                  className="w-full px-4 py-3 pr-20 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                  placeholder="Nhập tên phòng ban..."
                  required
                  disabled={submitting}
                />
                {formData.code && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded">
                      {formData.code}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-700 mt-1 font-medium">
                Mã phòng ban sẽ được tạo tự động: <span className="text-green-600 font-bold">{formData.code || '...'}</span>
              </p>
            </div>


            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                placeholder="Mô tả vai trò và chức năng của phòng ban..."
                disabled={submitting}
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                <DollarSign className="h-4 w-4 inline mr-2 text-purple-600" />
                Ngân sách (VND)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold placeholder-gray-500"
                placeholder="Nhập ngân sách phòng ban..."
                min="0"
                step="1000"
                disabled={submitting}
              />
              <p className="text-xs text-gray-700 mt-1 font-medium">
                Để trống nếu chưa có ngân sách
              </p>
            </div>

            {/* Information note */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Building2 className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Sau khi tạo phòng ban, bạn có thể tạo các chức vụ thuộc phòng ban này.
                  </p>
                  <p className="text-xs text-gray-700 mt-1 font-medium">
                    Mã phòng ban sẽ được sử dụng để liên kết với các chức vụ và nhân viên.
                  </p>
                </div>
              </div>
            </div>

            </div>
          </form>

          {/* Footer */}
          <div className="border-t-2 border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
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
