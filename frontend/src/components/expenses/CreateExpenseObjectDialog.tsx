'use client'

import { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Target, Edit, Trash2, Search } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ExpenseObject {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CreateExpenseObjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateExpenseObjectDialog({ isOpen, onClose, onSuccess }: CreateExpenseObjectDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expenseObjects, setExpenseObjects] = useState<ExpenseObject[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Load expense objects
  const loadExpenseObjects = async () => {
    try {
      setLoading(true)
      let data
      try {
        data = await apiGet(`${API_BASE_URL}/api/expense-objects/?active_only=true`)
      } catch (authErr) {
        // Fallback to public endpoint on 401/403
        data = await apiGet(`${API_BASE_URL}/api/expense-objects/public?active_only=true`)
      }
      setExpenseObjects(data || [])
    } catch (err) {
      console.error('Error loading expense objects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadExpenseObjects()
    }
  }, [isOpen])

  // Filter expense objects
  const filteredObjects = expenseObjects.filter(obj =>
    obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (obj.description && obj.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên đối tượng chi phí'
    }
    
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      setSaving(true)
      const response = await apiPost(`${API_BASE_URL}/api/expense-objects/`, formData)

      if (response) {
        alert('Tạo đối tượng chi phí thành công!')
        onSuccess()
        setFormData({ name: '', description: '' })
        setErrors({})
        await loadExpenseObjects() // Reload the list
        onClose()
      }
    } catch (err) {
      setErrors({ submit: 'Lỗi xác thực hoặc kết nối: Không thể tạo đối tượng chi phí' })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', description: '' })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-6xl">
      <div className="bg-white shadow-2xl border border-gray-200 rounded-lg max-h-[85vh] overflow-hidden animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tạo đối tượng chi phí</h2>
              <p className="text-sm text-black mt-1">
                Tạo đối tượng chi phí mới để phân loại chi phí dự án
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - 2 columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left side - List of existing objects */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Danh sách đối tượng chi phí</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm đối tượng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredObjects.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'Không tìm thấy đối tượng nào' : 'Chưa có đối tượng chi phí'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredObjects.map((obj) => (
                    <div key={obj.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{obj.name}</h4>
                          {obj.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{obj.description}</p>
                          )}
                          <div className="flex items-center mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              obj.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {obj.is_active ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Create form */}
          <div className="w-1/2 flex flex-col">

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-1 h-6 bg-blue-500 rounded"></div>
                <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tên đối tượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ví dụ: Vật liệu xây dựng, Nhân công, Máy móc thiết bị..."
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={4}
                  placeholder="Mô tả chi tiết về đối tượng chi phí này..."
                />
              </div>
            </div>

            {/* Error message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {errors.submit}
                </div>
              </div>
            )}
          </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t-2 border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Tạo đối tượng
                  </>
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  )
}
