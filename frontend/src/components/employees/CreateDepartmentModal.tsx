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
      onClose()
      resetForm()
    } catch (err) {
      console.error('Error creating department:', err)
      setError((err as Error).message || 'Có lỗi xảy ra khi tạo phòng ban')
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

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-md">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tạo phòng ban mới</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              Tên phòng ban *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium"
              placeholder="Ví dụ: Phòng Nhân sự"
              required
              disabled={submitting}
            />
            <p className="text-xs text-gray-700 mt-1 font-medium">
              Mã phòng ban sẽ được tạo tự động: <span className="text-green-600 font-bold">{formData.code || '...'}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="h-4 w-4 inline mr-1" />
              Mã phòng ban *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium"
              placeholder="Ví dụ: 123, 456, 789"
              required
              disabled={submitting}
            />
          </div>

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

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
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
              <Plus className="h-4 w-4 mr-2" />
              {submitting ? 'Đang tạo...' : 'Tạo phòng ban'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
