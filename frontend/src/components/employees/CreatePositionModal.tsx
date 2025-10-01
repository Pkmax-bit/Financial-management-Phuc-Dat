'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Briefcase, 
  
  Plus,
  DollarSign,
  Hash,
  Building2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CreatePositionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreatePositionModal({ isOpen, onClose, onSuccess }: CreatePositionModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department_id: '',
    salary_range_min: '',
    salary_range_max: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
    }
  }, [isOpen])

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setDepartments(data || [])
    } catch (err) {
      console.error('Error fetching departments:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên chức vụ')
      return
    }

    if (!formData.code.trim()) {
      setError('Vui lòng nhập mã chức vụ')
      return
    }

    if (!formData.department_id) {
      setError('Vui lòng chọn phòng ban')
      return
    }

    try {
      setSubmitting(true)

      // Check if code already exists
      const { data: existingPos } = await supabase
        .from('positions')
        .select('id')
        .eq('code', formData.code.trim())
        .single()

      if (existingPos) {
        setError('Mã chức vụ đã tồn tại. Vui lòng chọn mã khác.')
        return
      }

      const positionData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || null,
        department_id: formData.department_id,
        salary_range_min: formData.salary_range_min ? parseFloat(formData.salary_range_min) : null,
        salary_range_max: formData.salary_range_max ? parseFloat(formData.salary_range_max) : null,
        is_active: true
      }

      const { error } = await supabase
        .from('positions')
        .insert([positionData])

      if (error) throw error
      
      alert('Chức vụ đã được tạo thành công!')
      
      onSuccess()
      onClose()
      resetForm()
    } catch (err) {
      console.error('Error creating position:', err)
      setError((err as Error).message || 'Có lỗi xảy ra khi tạo chức vụ')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      department_id: '',
      salary_range_min: '',
      salary_range_max: ''
    })
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-md">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tạo chức vụ mới</h2>
          <button
            onClick={onClose}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="h-4 w-4 inline mr-1" />
              Tên chức vụ *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Ví dụ: Nhân viên Marketing"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="h-4 w-4 inline mr-1" />
              Mã chức vụ *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Ví dụ: MKT001, DEV001"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              Phòng ban *
            </label>
            <select
              value={formData.department_id}
              onChange={(e) => setFormData({...formData, department_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
              disabled={submitting}
            >
              <option value="">Chọn phòng ban</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Lương tối thiểu
              </label>
              <input
                type="number"
                value={formData.salary_range_min}
                onChange={(e) => setFormData({...formData, salary_range_min: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Ví dụ: 5000000"
                min="0"
                step="1000"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Lương tối đa
              </label>
              <input
                type="number"
                value={formData.salary_range_max}
                onChange={(e) => setFormData({...formData, salary_range_max: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Ví dụ: 10000000"
                min="0"
                step="1000"
                disabled={submitting}
              />
            </div>
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
              placeholder="Mô tả về trách nhiệm và yêu cầu của chức vụ..."
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
              {submitting ? 'Đang tạo...' : 'Tạo chức vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
