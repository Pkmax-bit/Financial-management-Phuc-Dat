'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Target, Edit, Trash2, Search, ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react'
import { apiGet, apiPost, apiDelete } from '@/lib/api'
import { getExpenseObjectsByRole } from '@/utils/expenseObjectPermissions'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ExpenseObject {
  id: string
  name: string
  description?: string
  parent_id?: string
  amount?: number
  hierarchy_level: number
  is_parent: boolean
  total_children_cost: number
  cost_from_children: boolean
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
    description: '',
    parent_id: ''
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expenseObjects, setExpenseObjects] = useState<ExpenseObject[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [userRole, setUserRole] = useState<string>('employee')

  // Load expense objects
  const loadExpenseObjects = async () => {
    try {
      setLoading(true)
      let data
      try {
        console.log('🔍 Trying authenticated endpoint for expense objects...')
        data = await apiGet(`${API_BASE_URL}/api/expense-objects/?active_only=true`)
        console.log('✅ Authenticated endpoint succeeded')
      } catch (authErr) {
        console.log('⚠️ Authenticated endpoint failed, trying public endpoint:', authErr)
        // Fallback to public endpoint on 401/403
        data = await apiGet(`${API_BASE_URL}/api/expense-objects/public?active_only=true`)
        console.log('✅ Public endpoint succeeded')
      }
      setExpenseObjects(data || [])
    } catch (err) {
      console.error('❌ Error loading expense objects:', err)
      setExpenseObjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadExpenseObjects()
      // Lấy role của user từ localStorage hoặc context
      const role = localStorage.getItem('userRole') || 'employee'
      setUserRole(role)
    }
  }, [isOpen])

  // Filter expense objects by role and search term
  const filteredObjects = getExpenseObjectsByRole(expenseObjects, userRole).filter(obj =>
    obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (obj.description && obj.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Toggle parent expansion
  const toggleParentExpansion = (parentId: string) => {
    const newExpanded = new Set(expandedParents)
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId)
    } else {
      newExpanded.add(parentId)
    }
    setExpandedParents(newExpanded)
  }

  // Get children of a parent
  const getChildren = (parentId: string) => {
    return filteredObjects.filter(obj => obj.parent_id === parentId)
  }

  // Render hierarchical list
  const renderHierarchicalList = () => {
    const rootObjects = filteredObjects.filter(obj => !obj.parent_id)
    
    const renderObject = (obj: ExpenseObject, level: number = 0) => {
      const children = getChildren(obj.id)
      const isExpanded = expandedParents.has(obj.id)
      const isParent = children.length > 0
      
      return (
        <React.Fragment key={obj.id}>
          <div className={`p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${level > 0 ? 'bg-blue-50/30' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center flex-1 min-w-0" style={{ paddingLeft: `${level * 20}px` }}>
                {isParent ? (
                  <button
                    onClick={() => toggleParentExpansion(obj.id)}
                    className="mr-1 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                ) : (
                  <div className="w-6 h-6 flex-shrink-0"></div>
                )}
                
                {isParent ? (
                  <Folder className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${level > 0 ? 'text-blue-700' : 'text-gray-900'} truncate`}>
                      {obj.name}
                    </span>
                    {obj.is_parent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Parent
                      </span>
                    )}
                    {obj.cost_from_children && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Calculated
                      </span>
                    )}
                  </div>
                  {obj.description && (
                    <p className="text-xs text-gray-500 truncate mt-1">{obj.description}</p>
                  )}
                  <div className="flex items-center mt-2 gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      obj.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {obj.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                      Cấp {obj.hierarchy_level}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button
                  onClick={() => handleDelete(obj.id)}
                  disabled={deletingId === obj.id}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Xóa đối tượng chi phí"
                >
                  {deletingId === obj.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          {isExpanded && children.map(child => renderObject(child, level + 1))}
        </React.Fragment>
      )
    }

    return rootObjects.map(obj => renderObject(obj))
  }

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
      const payload = {
        name: formData.name,
        description: formData.description,
        parent_id: formData.parent_id || null
      }
      const response = await apiPost(`${API_BASE_URL}/api/expense-objects/`, payload)

      if (response) {
        alert('Tạo đối tượng chi phí thành công!')
        onSuccess()
        setFormData({ name: '', description: '', parent_id: '' })
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

  const handleDelete = async (objectId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đối tượng chi phí này?')) {
      return
    }

    try {
      setDeletingId(objectId)
      await apiDelete(`${API_BASE_URL}/api/expense-objects/${objectId}`)
      alert('Xóa đối tượng chi phí thành công!')
      await loadExpenseObjects() // Reload the list
    } catch (err) {
      console.error('Error deleting expense object:', err)
      alert('Lỗi khi xóa đối tượng chi phí. Vui lòng thử lại.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', description: '', parent_id: '' })
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
                  {renderHierarchicalList()}
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

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Đối tượng cha (tùy chọn)
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">-- Chọn đối tượng cha --</option>
                  {expenseObjects.map(obj => (
                    <option key={obj.id} value={obj.id}>
                      {obj.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Chọn đối tượng cha để tạo đối tượng con. Để trống nếu là đối tượng gốc.
                </p>
              </div>

              {/* Removed amount input by request */}
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
