'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Briefcase, 
  Save,
  DollarSign,
  Hash,
  Building2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Position {
  id: string
  name: string
  code: string
  description: string | null
  department_id: string | null
  salary_range_min: number | null
  salary_range_max: number | null
  is_active: boolean
}

interface PositionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  position?: Position | null
  isEdit?: boolean
}

export default function PositionModal({ isOpen, onClose, onSuccess, position, isEdit = false }: PositionModalProps) {
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
    salary_range_max: '',
    is_active: true
  })

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
      if (position && isEdit) {
        setFormData({
          name: position.name,
          code: position.code,
          description: position.description || '',
          department_id: position.department_id || '',
          salary_range_min: position.salary_range_min?.toString() || '',
          salary_range_max: position.salary_range_max?.toString() || '',
          is_active: position.is_active
        })
      } else if (!isEdit) {
        resetForm()
      }
    }
  }, [isOpen, position, isEdit])

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

      // Check if code already exists (for create) or exists for other positions (for edit)
      const { data: existingPos } = await supabase
        .from('positions')
        .select('id')
        .eq('code', formData.code.trim())
        .neq('id', isEdit && position ? position.id : '')
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
        is_active: formData.is_active
      }

      if (isEdit && position) {
        // Update existing position
        const { error } = await supabase
          .from('positions')
          .update(positionData)
          .eq('id', position.id)

        if (error) throw error
        alert('Chức vụ đã được cập nhật thành công!')
      } else {
        // Create new position
        const { error } = await supabase
          .from('positions')
          .insert([positionData])

        if (error) throw error
        alert('Chức vụ đã được tạo thành công!')
      }
      
      onSuccess()
      onClose()
      resetForm()
    } catch (err) {
      console.error('Error saving position:', err)
      setError((err as Error).message || 'Có lỗi xảy ra khi lưu chức vụ')
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
      salary_range_max: '',
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
            {isEdit ? 'Sửa chức vụ' : 'Tạo chức vụ mới'}
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

          {/* Position Name */}
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
              maxLength={255}
              disabled={submitting}
            />
          </div>

          {/* Position Code */}
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
              maxLength={50}
              disabled={submitting}
            />
          </div>

          {/* Department */}
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

          {/* Salary Range */}
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
              placeholder="Mô tả về trách nhiệm và yêu cầu của chức vụ..."
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
              Chức vụ đang hoạt động
            </label>
          </div>

          {/* Information note */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Sau khi tạo chức vụ, bạn có thể phân công nhân viên vào chức vụ này.
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
              {submitting ? (isEdit ? 'Đang cập nhật...' : 'Đang tạo...') : (isEdit ? 'Cập nhật chức vụ' : 'Tạo chức vụ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
