'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, Save, Tag, Palette } from 'lucide-react'
import { projectCategoryApi } from '@/lib/api'

interface ProjectCategory {
  id: string
  name: string
  code: string
  description?: string
  color?: string
  icon?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProjectCategoriesManagerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ProjectCategoriesManager({ isOpen, onClose, onSuccess }: ProjectCategoriesManagerProps) {
  const [categories, setCategories] = useState<ProjectCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#4ECDC4',
    icon: '',
    display_order: 0,
    is_active: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await projectCategoryApi.getCategories()
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      alert('Có lỗi xảy ra khi tải danh sách nhóm phân loại')
    } finally {
      setLoading(false)
    }
  }

  const generateCodeFromName = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      code: generateCodeFromName(name)
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Tên nhóm phân loại là bắt buộc'
    }

    // Mã nhóm được tạo tự động, không cần validate

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      await projectCategoryApi.createCategory({
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color || undefined,
        icon: formData.icon.trim() || undefined,
        display_order: formData.display_order,
        is_active: formData.is_active
      })
      
      resetForm()
      fetchCategories()
      onSuccess()
    } catch (error: any) {
      console.error('Error creating category:', error)
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi tạo nhóm phân loại')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!validateForm()) return

    try {
      setLoading(true)
      await projectCategoryApi.updateCategory(id, {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color || undefined,
        icon: formData.icon.trim() || undefined,
        display_order: formData.display_order,
        is_active: formData.is_active
      })
      
      setEditingId(null)
      resetForm()
      fetchCategories()
      onSuccess()
    } catch (error: any) {
      console.error('Error updating category:', error)
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật nhóm phân loại')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm phân loại này? Không thể xóa nếu đang có dự án sử dụng.')) {
      return
    }

    try {
      setLoading(true)
      await projectCategoryApi.deleteCategory(id)
      fetchCategories()
      onSuccess()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi xóa nhóm phân loại. Có thể nhóm này đang được sử dụng bởi một hoặc nhiều dự án.')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (category: ProjectCategory) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
      color: category.color || '#4ECDC4',
      icon: category.icon || '',
      display_order: category.display_order,
      is_active: category.is_active
    })
    setShowCreateForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      color: '#4ECDC4',
      icon: '',
      display_order: 0,
      is_active: true
    })
    setErrors({})
    setShowCreateForm(false)
  }

  if (!isOpen) return null

  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Tag className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Quản lý nhóm phân loại dự án</h2>
              <p className="text-sm text-gray-600">Tạo, chỉnh sửa và xóa các nhóm phân loại dự án</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create/Edit Form */}
          {(showCreateForm || editingId) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingId ? 'Chỉnh sửa nhóm phân loại' : 'Tạo nhóm phân loại mới'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên nhóm phân loại *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="VD: Dự án cửa"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Mã nhóm được tạo tự động từ tên */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    rows={2}
                    placeholder="Mô tả về nhóm phân loại này..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Màu sắc
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="#4ECDC4"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    min="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Kích hoạt nhóm phân loại này</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={editingId ? () => handleUpdate(editingId) : handleCreate}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Tạo mới')}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Add Button */}
          {!showCreateForm && !editingId && (
            <button
              onClick={() => {
                resetForm()
                setShowCreateForm(true)
              }}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm nhóm phân loại mới
            </button>
          )}

          {/* Categories List */}
          {loading && !categories.length ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có nhóm phân loại nào. Hãy tạo nhóm phân loại đầu tiên.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: category.color ? `${category.color}20` : '#E5E7EB',
                            color: category.color || '#374151'
                          }}
                        >
                          {category.name}
                        </span>
                        {!category.is_active && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            Tạm dừng
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Mã:</strong> {category.code}</p>
                        {category.description && <p><strong>Mô tả:</strong> {category.description}</p>}
                        <p><strong>Thứ tự:</strong> {category.display_order}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEdit(category)}
                        disabled={loading}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
