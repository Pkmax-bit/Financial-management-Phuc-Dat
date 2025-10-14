'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'

interface ExpenseObject {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

interface ExpenseObjectForm {
  name: string
  description: string
}

export default function ExpenseObjectsPage() {
  const [expenseObjects, setExpenseObjects] = useState<ExpenseObject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedObject, setSelectedObject] = useState<ExpenseObject | null>(null)
  const [form, setForm] = useState<ExpenseObjectForm>({
    name: '',
    description: ''
  })
  const [saving, setSaving] = useState(false)

  // Load expense objects
  const loadExpenseObjects = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/expense-objects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setExpenseObjects(data)
      } else {
        setError('Không thể tải danh sách đối tượng chi phí')
      }
    } catch (err) {
      setError('Lỗi kết nối: Không thể tải danh sách đối tượng chi phí')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenseObjects()
  }, [])

  // Filter expense objects
  const filteredObjects = expenseObjects.filter(obj =>
    obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (obj.description && obj.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    try {
      setSaving(true)
      const token = localStorage.getItem('access_token')
      
      const url = selectedObject 
        ? `/api/expense-objects/${selectedObject.id}`
        : '/api/expense-objects'
      
      const method = selectedObject ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form)
      })

      if (response.ok) {
        await loadExpenseObjects()
        setShowAddModal(false)
        setShowEditModal(false)
        setForm({ name: '', description: '' })
        setSelectedObject(null)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Có lỗi xảy ra')
      }
    } catch (err) {
      setError('Lỗi kết nối: Không thể lưu đối tượng chi phí')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đối tượng chi phí này?')) return

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/expense-objects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await loadExpenseObjects()
      } else {
        setError('Không thể xóa đối tượng chi phí')
      }
    } catch (err) {
      setError('Lỗi kết nối: Không thể xóa đối tượng chi phí')
    }
  }

  // Open edit modal
  const openEditModal = (obj: ExpenseObject) => {
    setSelectedObject(obj)
    setForm({
      name: obj.name,
      description: obj.description || ''
    })
    setShowEditModal(true)
  }

  // Open add modal
  const openAddModal = () => {
    setForm({ name: '', description: '' })
    setSelectedObject(null)
    setShowAddModal(true)
  }

  return (
    <LayoutWithSidebar>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Đối tượng chi phí</h1>
            <p className="text-gray-600">Quản lý các đối tượng chi phí trong dự án</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm đối tượng
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm đối tượng chi phí..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            {filteredObjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Filter className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Không tìm thấy đối tượng nào' : 'Chưa có đối tượng chi phí'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy thêm đối tượng chi phí đầu tiên'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên đối tượng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredObjects.map((obj) => (
                      <tr key={obj.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{obj.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {obj.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            obj.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {obj.is_active ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(obj)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(obj.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Thêm đối tượng chi phí</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên đối tượng *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Sửa đối tượng chi phí</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên đối tượng *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutWithSidebar>
  )
}
