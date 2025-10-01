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

interface PositionSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Department {
  id: string
  name: string
}

export default function PositionSidebar({ isOpen, onClose, onSuccess }: PositionSidebarProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department_id: '',
    salary_range_min: '',
    salary_range_max: ''
  })

  // Auto-generate position code
  const generatePositionCode = async (positionName: string, departmentId: string) => {
    if (!positionName.trim() || !departmentId) return ''

    try {
      // Get department info
      const department = departments.find(dept => dept.id === departmentId)
      if (!department) return ''

      // Create base code from department and position
      const deptCode = department.name
        .replace(/[^A-Za-z]/g, '') // Remove non-letters
        .substring(0, 3)
        .toUpperCase()

      const posCode = positionName
        .replace(/[^A-Za-z]/g, '') // Remove non-letters
        .substring(0, 3)
        .toUpperCase()

      // Check existing codes to avoid duplicates
      const { data: existingPositions } = await supabase
        .from('positions')
        .select('code')
        .like('code', `${deptCode}${posCode}%`)

      const existingCodes = existingPositions?.map(p => p.code) || []
      
      // Find next available number
      let counter = 1
      let newCode = `${deptCode}${posCode}${counter.toString().padStart(3, '0')}`
      
      while (existingCodes.includes(newCode)) {
        counter++
        newCode = `${deptCode}${posCode}${counter.toString().padStart(3, '0')}`
      }

      return newCode
    } catch (error) {
      console.error('Error generating position code:', error)
      return ''
    }
  }

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


    if (!formData.department_id) {
      setError('Vui lòng chọn phòng ban')
      return
    }

    if (!formData.code) {
      setError('Mã chức vụ chưa được tạo. Vui lòng kiểm tra lại thông tin.')
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

      console.log('Creating position with data:', positionData)
      
      const { error } = await supabase
        .from('positions')
        .insert([positionData])

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      alert('Chức vụ đã được tạo thành công!')
      
      onSuccess()
      resetForm()
    } catch (err) {
      console.error('Error creating position:', err)
      setError(err instanceof Error ? (err as Error).message : 'Có lỗi xảy ra khi tạo chức vụ')
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

  // Auto-generate code when name or department changes
  const handleNameChange = async (name: string) => {
    setFormData(prev => ({ ...prev, name }))
    
    if (name.trim() && formData.department_id) {
      const generatedCode = await generatePositionCode(name, formData.department_id)
      if (generatedCode) {
        setFormData(prev => ({ ...prev, code: generatedCode }))
      }
    } else {
      // Clear code if not enough info
      setFormData(prev => ({ ...prev, code: '' }))
    }
  }

  const handleDepartmentChange = async (departmentId: string) => {
    setFormData(prev => ({ ...prev, department_id: departmentId }))
    
    if (departmentId && formData.name.trim()) {
      const generatedCode = await generatePositionCode(formData.name, departmentId)
      if (generatedCode) {
        setFormData(prev => ({ ...prev, code: generatedCode }))
      }
    } else {
      // Clear code if not enough info
      setFormData(prev => ({ ...prev, code: '' }))
    }
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tạo chức vụ mới</h2>
            <p className="text-sm text-black">Thêm chức vụ vào hệ thống</p>
          </div>
          <button
            onClick={handleClose}
            className="text-black hover:text-black p-2 hover:bg-gray-100 rounded-lg"
            disabled={submitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[60vh] px-6 py-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
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
                   onChange={(e) => handleNameChange(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   placeholder="Ví dụ: Nhân viên Marketing"
                   required
                   disabled={submitting}
                 />
              </div>

              {/* Auto-generated Position Code Display */}
              {formData.code ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Mã chức vụ tự động</p>
                      <p className="text-lg font-bold text-blue-800">{formData.code}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Mã được tạo tự động từ tên chức vụ và phòng ban
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 text-black mr-2" />
                    <div>
                      <p className="text-sm font-medium text-black">Mã chức vụ</p>
                      <p className="text-sm text-black">
                        📝 Mã sẽ được tạo tự động khi bạn nhập tên chức vụ và chọn phòng ban
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Phòng ban *
                </label>
                 <select
                   value={formData.department_id}
                   onChange={(e) => handleDepartmentChange(e.target.value)}
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
                  disabled={submitting}
                />
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
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
              disabled={submitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              {submitting ? 'Đang tạo...' : 'Tạo chức vụ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}