'use client'

import { useState } from 'react'
import { 
  X, 
  Building2, 
  Save,
  FileText
} from 'lucide-react'
import { apiPost } from '@/lib/api'

interface CreateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateDepartmentModal({ isOpen, onClose, onSuccess }: CreateDepartmentModalProps) {
  const [submitting, setSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên phòng ban')
      return
    }

    try {
      setSubmitting(true)

      const departmentData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null
      }

      await apiPost('/api/employees/departments/', departmentData)
      
      alert('Phòng ban đã được tạo thành công!')
      
      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      console.error('Error creating department:', error)
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('already exists')) {
        alert('Tên phòng ban đã tồn tại, vui lòng chọn tên khác')
      } else {
        alert('Có lỗi xảy ra khi tạo phòng ban: ' + errorMessage)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tạo phòng ban mới</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={submitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Nhân sự, Kế toán, IT..."
              required
              maxLength={255}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả ngắn gọn về chức năng và nhiệm vụ của phòng ban..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 ký tự
            </p>
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
              {submitting ? 'Đang tạo...' : 'Tạo phòng ban'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}