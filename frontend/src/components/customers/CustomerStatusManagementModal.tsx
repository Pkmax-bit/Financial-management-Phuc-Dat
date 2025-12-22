"use client"

import React, { useState, useEffect } from 'react'
import { X, Edit2, Trash2, Plus, Save } from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

interface CustomerStatus {
  id: string
  code: string
  name: string
  color: string
  display_order: number
  is_default: boolean
  is_system: boolean
  description?: string
  created_at: string
  updated_at: string
}

interface CustomerStatusManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onStatusChange: () => void
  editingStatusId?: string | null
}

// Bảng màu cầu vồng + một số màu trung tính để quản lý trạng thái khách hàng
const colorOptions = [
  { name: 'Đỏ', hex: '#EF4444' },        // red-500
  { name: 'Cam', hex: '#F97316' },       // orange-500
  { name: 'Vàng', hex: '#FACC15' },      // yellow-400
  { name: 'Xanh lá', hex: '#22C55E' },   // green-500
  { name: 'Xanh ngọc', hex: '#14B8A6' }, // teal-500
  { name: 'Xanh dương nhạt', hex: '#0EA5E9' }, // sky-500
  { name: 'Xanh dương', hex: '#3B82F6' },      // blue-500
  { name: 'Chàm', hex: '#6366F1' },      // indigo-500
  { name: 'Tím', hex: '#8B5CF6' },       // violet-500
  { name: 'Hồng', hex: '#EC4899' },      // pink-500
  { name: 'Xám nhạt', hex: '#9CA3AF' },  // gray-400
  { name: 'Xám đậm', hex: '#4B5563' }    // gray-600
]

export default function CustomerStatusManagementModal({
  isOpen,
  onClose,
  onStatusChange,
  editingStatusId
}: CustomerStatusManagementModalProps) {
  const [statuses, setStatuses] = useState<CustomerStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStatus, setEditingStatus] = useState<CustomerStatus | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    color: '#2FC6F6',
    display_order: 1,
    description: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tạo mã tự động từ tên (giống logic generateCodeFromName bên quản lý nhóm / trạng thái)
  const generateCodeFromName = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  useEffect(() => {
    if (isOpen) {
      fetchStatuses()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && editingStatusId && statuses.length > 0) {
      const statusToEdit = statuses.find(s => s.id === editingStatusId)
      if (statusToEdit) {
        setEditingStatus(statusToEdit)
        setIsAddingNew(false)
        setFormData({
          code: statusToEdit.code,
          name: statusToEdit.name,
          color: statusToEdit.color,
          display_order: statusToEdit.display_order,
          description: statusToEdit.description || ''
        })
      }
    } else if (isOpen && !editingStatusId) {
      setEditingStatus(null)
      setIsAddingNew(false)
      setFormData({
        code: '',
        name: '',
        color: '#2FC6F6',
        display_order: statuses.length > 0 ? Math.max(...statuses.map(s => s.display_order)) + 1 : 1,
        description: ''
      })
    }
  }, [editingStatusId, isOpen, statuses])

  const fetchStatuses = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/customers/statuses')
      setStatuses(data || [])
    } catch (err: any) {
      console.error('Error fetching statuses:', err)
      setError('Không thể tải danh sách trạng thái')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingStatus(null)
    setIsAddingNew(true)
    setFormData({
      code: '',
      name: '',
      color: '#2FC6F6',
      display_order: statuses.length > 0 ? Math.max(...statuses.map(s => s.display_order)) + 1 : 1,
      description: ''
    })
    setError(null)
  }

  const handleEdit = (status: CustomerStatus) => {
    setEditingStatus(status)
    setIsAddingNew(false)
    setFormData({
      code: status.code,
      name: status.name,
      color: status.color,
      display_order: status.display_order,
      description: status.description || ''
    })
    setError(null)
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Khi tạo mới, tự động sinh code theo tên
      code: isAddingNew && !editingStatus ? generateCodeFromName(name) : prev.code
    }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Vui lòng điền tên trạng thái')
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (editingStatus) {
        // Update existing - cho phép sửa code nếu cần (trừ trạng thái hệ thống)
        await apiPut(`/api/customers/statuses/${editingStatus.id}`, {
          code: formData.code || undefined,
          name: formData.name,
          color: formData.color,
          display_order: formData.display_order,
          description: formData.description || null
        })
      } else {
        // Create new - để backend tự sinh mã code nếu không gửi hoặc rỗng
        await apiPost('/api/customers/statuses', {
          // Không gửi code để backend tự sinh
          name: formData.name,
          color: formData.color,
          display_order: formData.display_order,
          description: formData.description || null
        })
      }

      await fetchStatuses()
      onStatusChange()
      setEditingStatus(null)
      setIsAddingNew(false)
      setFormData({
        code: '',
        name: '',
        color: '#2FC6F6',
        display_order: statuses.length > 0 ? Math.max(...statuses.map(s => s.display_order)) + 1 : 1,
        description: ''
      })
    } catch (err: any) {
      setError(err.message || 'Không thể lưu trạng thái')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (status: CustomerStatus) => {
    if (status.is_system) {
      alert('Không thể xóa trạng thái hệ thống')
      return
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa trạng thái "${status.name}"?\n\nLưu ý: Không thể xóa trạng thái đang được sử dụng bởi khách hàng.`)) {
      return
    }

    try {
      await apiDelete(`/api/customers/statuses/${status.id}`)
      await fetchStatuses()
      onStatusChange()
    } catch (err: any) {
      alert(err.message || 'Không thể xóa trạng thái')
    }
  }

  const handleCancel = () => {
    setEditingStatus(null)
    setIsAddingNew(false)
    setFormData({
      code: '',
      name: '',
      color: '#2FC6F6',
      display_order: 1,
      description: ''
    })
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Quản lý trạng thái</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          {editingStatus !== null || isAddingNew ? (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingStatus ? 'Sửa trạng thái' : 'Thêm trạng thái mới'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã trạng thái
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="prospect"
                      disabled={editingStatus?.is_system}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên trạng thái *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tiềm năng"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Màu sắc
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {colorOptions.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.hex })}
                          className={`w-8 h-8 rounded border-2 ${
                            formData.color === color.hex
                              ? 'border-gray-900'
                              : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#2FC6F6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thứ tự hiển thị
                    </label>
                    <input
                      type="number"
                      value={formData.display_order ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormData({
                          ...formData,
                          display_order: val === '' ? undefined : parseInt(val) || undefined
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Mô tả trạng thái..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
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
              {statuses
                .sort((a, b) => a.display_order - b.display_order)
                .map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
                    style={{
                      borderLeft: `4px solid ${status.color}`
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{status.name}</span>
                        {status.is_system && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            Hệ thống
                          </span>
                        )}
                        {status.is_default && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Mã: {status.code} • Thứ tự: {status.display_order}
                        {status.description && ` • ${status.description}`}
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
                      {!status.is_system && (
                        <button
                          onClick={() => handleDelete(status)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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

