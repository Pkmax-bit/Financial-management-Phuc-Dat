'use client'

import React, { useState, useEffect } from 'react'
import { X, Edit2, Trash2, Plus, Save, AlertCircle } from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { projectCategoryApi } from '@/lib/api'

interface ProjectStatus {
  id: string
  name: string
  display_order: number
  description?: string
  color_class?: string
  is_active: boolean
  category_id?: string
  created_at: string
  updated_at: string
}

interface ProjectCategory {
  id: string
  name: string
  code: string
}

interface ProjectStatusManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onStatusChange: () => void
  categoryId?: string // Filter statuses by category
  editingStatusId?: string | null
}

// Tailwind color class options
const colorClassOptions = [
  { name: 'Xám', class: 'bg-gray-100 text-gray-800' },
  { name: 'Xanh dương', class: 'bg-blue-100 text-blue-800' },
  { name: 'Xanh lá', class: 'bg-green-100 text-green-800' },
  { name: 'Vàng', class: 'bg-yellow-100 text-yellow-800' },
  { name: 'Cam', class: 'bg-orange-100 text-orange-800' },
  { name: 'Đỏ', class: 'bg-red-100 text-red-800' },
  { name: 'Tím', class: 'bg-purple-100 text-purple-800' },
  { name: 'Xanh ngọc', class: 'bg-teal-100 text-teal-800' },
  { name: 'Hồng', class: 'bg-pink-100 text-pink-800' },
  { name: 'Chàm', class: 'bg-indigo-100 text-indigo-800' },
]

export default function ProjectStatusManagementModal({
  isOpen,
  onClose,
  onStatusChange,
  categoryId,
  editingStatusId,
}: ProjectStatusManagementModalProps) {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([])
  const [categories, setCategories] = useState<ProjectCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    display_order: 1,
    description: '',
    color_class: 'bg-gray-100 text-gray-800',
    category_id: categoryId || '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchStatuses()
      fetchCategories()
    }
  }, [isOpen, categoryId])

  useEffect(() => {
    if (isOpen && editingStatusId && statuses.length > 0) {
      const statusToEdit = statuses.find((s) => s.id === editingStatusId)
      if (statusToEdit) {
        setEditingStatus(statusToEdit)
        setIsAddingNew(false)
        setFormData({
          name: statusToEdit.name,
          display_order: statusToEdit.display_order,
          description: statusToEdit.description || '',
          color_class: statusToEdit.color_class || 'bg-gray-100 text-gray-800',
          category_id: statusToEdit.category_id || categoryId || '',
          is_active: statusToEdit.is_active,
        })
      }
    } else if (isOpen && !editingStatusId) {
      setEditingStatus(null)
      setIsAddingNew(false)
      const maxOrder =
        statuses.length > 0 ? Math.max(...statuses.map((s) => s.display_order)) + 1 : 1
      setFormData({
        name: '',
        display_order: maxOrder,
        description: '',
        color_class: 'bg-gray-100 text-gray-800',
        category_id: categoryId || '',
        is_active: true,
      })
    }
  }, [editingStatusId, isOpen, statuses, categoryId])

  const fetchStatuses = async () => {
    try {
      setLoading(true)
      const url = categoryId
        ? `/api/projects/statuses?category_id=${encodeURIComponent(categoryId)}`
        : '/api/projects/statuses'
      const data = await apiGet<ProjectStatus[]>(url)
      setStatuses(data || [])
    } catch (err: any) {
      console.error('Error fetching statuses:', err)
      setError('Không thể tải danh sách trạng thái')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await projectCategoryApi.getCategories()
      setCategories((data || []) as ProjectCategory[])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const handleAddNew = () => {
    setEditingStatus(null)
    setIsAddingNew(true)
    const maxOrder =
      statuses.length > 0 ? Math.max(...statuses.map((s) => s.display_order)) + 1 : 1
    setFormData({
      name: '',
      display_order: maxOrder,
      description: '',
      color_class: 'bg-gray-100 text-gray-800',
      category_id: categoryId || '',
      is_active: true,
    })
    setError(null)
  }

  const handleEdit = (status: ProjectStatus) => {
    setEditingStatus(status)
    setIsAddingNew(false)
    setFormData({
      name: status.name,
      display_order: status.display_order,
      description: status.description || '',
      color_class: status.color_class || 'bg-gray-100 text-gray-800',
      category_id: status.category_id || categoryId || '',
      is_active: status.is_active,
    })
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Vui lòng điền tên trạng thái')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload: any = {
        name: formData.name,
        display_order: formData.display_order,
        description: formData.description || null,
        color_class: formData.color_class,
        is_active: formData.is_active,
      }

      // Chỉ gửi category_id nếu có giá trị (không phải empty string)
      if (formData.category_id && formData.category_id.trim() !== '') {
        payload.category_id = formData.category_id
      }
      // Nếu category_id là empty string và đang edit, không gửi category_id để giữ nguyên giá trị cũ

      if (editingStatus) {
        // Update existing
        await apiPut(`/api/projects/statuses/${editingStatus.id}`, payload)
      } else {
        // Create new - Backend sẽ tự động shift các trạng thái có display_order >= display_order mới
        // Chỉ cần gọi API, backend sẽ xử lý shift
        await apiPost('/api/projects/statuses', payload)
      }

      await fetchStatuses()
      onStatusChange()
      setEditingStatus(null)
      setIsAddingNew(false)
      const maxOrder =
        statuses.length > 0 ? Math.max(...statuses.map((s) => s.display_order)) + 1 : 1
      setFormData({
        name: '',
        display_order: maxOrder,
        description: '',
        color_class: 'bg-gray-100 text-gray-800',
        category_id: categoryId || '',
        is_active: true,
      })
    } catch (err: any) {
      const errorMessage =
        err?.data?.detail || err?.message || 'Không thể lưu trạng thái'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (status: ProjectStatus) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa trạng thái "${status.name}"?\n\nLưu ý: Không thể xóa trạng thái đang được sử dụng bởi dự án.`
      )
    ) {
      return
    }

    try {
      // Xóa trạng thái - Backend sẽ tự động shift các trạng thái có display_order > deletedOrder xuống 1
      await apiDelete(`/api/projects/statuses/${status.id}`)
      
      await fetchStatuses()
      onStatusChange()
    } catch (err: any) {
      const errorMessage =
        err?.data?.detail || err?.message || 'Không thể xóa trạng thái'
      alert(errorMessage)
    }
  }

  const handleCancel = () => {
    setEditingStatus(null)
    setIsAddingNew(false)
    const maxOrder =
      statuses.length > 0 ? Math.max(...statuses.map((s) => s.display_order)) + 1 : 1
    setFormData({
      name: '',
      display_order: maxOrder,
      description: '',
      color_class: 'bg-gray-100 text-gray-800',
      category_id: categoryId || '',
      is_active: true,
    })
    setError(null)
  }

  // Parse color class để hiển thị preview
  const getColorPreview = (colorClass: string) => {
    const bgMatch = colorClass.match(/bg-(\w+-\d+)/)
    if (bgMatch) {
      const colorMap: Record<string, string> = {
        'gray-100': '#f3f4f6',
        'blue-100': '#dbeafe',
        'green-100': '#dcfce7',
        'yellow-100': '#fef9c3',
        'orange-100': '#ffedd5',
        'red-100': '#fee2e2',
        'purple-100': '#f3e8ff',
        'teal-100': '#ccfbf1',
        'pink-100': '#fce7f3',
        'indigo-100': '#e0e7ff',
      }
      return colorMap[bgMatch[1]] || '#f3f4f6'
    }
    return '#f3f4f6'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quản lý trạng thái dự án</h2>
            {categoryId && (
              <p className="text-sm text-gray-600 mt-1">
                Đang lọc theo nhóm dự án
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-white rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          {(editingStatus !== null || isAddingNew) && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingStatus ? 'Sửa trạng thái' : 'Thêm trạng thái mới'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên trạng thái *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ví dụ: TIẾP NHẬN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thứ tự hiển thị *
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_order: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Màu sắc
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {colorClassOptions.map((color) => {
                        const bgColor = getColorPreview(color.class)
                        return (
                          <button
                            key={color.class}
                            type="button"
                            onClick={() => setFormData({ ...formData, color_class: color.class })}
                            className={`w-10 h-10 rounded border-2 ${
                              formData.color_class === color.class
                                ? 'border-gray-900 ring-2 ring-blue-500'
                                : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: bgColor }}
                            title={color.name}
                          />
                        )
                      })}
                    </div>
                    <input
                      type="text"
                      value={formData.color_class}
                      onChange={(e) =>
                        setFormData({ ...formData, color_class: e.target.value })
                      }
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="bg-blue-100 text-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhóm dự án (tùy chọn)
                    </label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, category_id: e.target.value || undefined })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả nhóm (Global)</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Mô tả trạng thái..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Kích hoạt trạng thái này
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Lưu
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Button */}
          {!isAddingNew && editingStatus === null && (
            <div className="mb-6">
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Thêm trạng thái mới
              </button>
            </div>
          )}

          {/* Status List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {statuses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Chưa có trạng thái nào</p>
                </div>
              ) : (
                statuses
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((status) => {
                    const bgColor = getColorPreview(status.color_class || 'bg-gray-100 text-gray-800')
                    return (
                      <div
                        key={status.id}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        style={{
                          borderLeft: `4px solid ${bgColor}`,
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: bgColor,
                                color: status.color_class?.includes('text-gray-800')
                                  ? '#1f2937'
                                  : status.color_class?.includes('text-blue-800')
                                    ? '#1e40af'
                                    : status.color_class?.includes('text-green-800')
                                      ? '#166534'
                                      : '#374151',
                              }}
                            >
                              {status.name}
                            </span>
                            {!status.is_active && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                Đã vô hiệu hóa
                              </span>
                            )}
                            {status.category_id && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                                Nhóm riêng
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Thứ tự: {status.display_order}
                            {status.description && ` • ${status.description}`}
                            {status.category_id &&
                              categories.find((c) => c.id === status.category_id) && (
                                <span>
                                  {' '}
                                  • Nhóm:{' '}
                                  {categories.find((c) => c.id === status.category_id)?.name}
                                </span>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(status)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(status)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

