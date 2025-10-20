'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, TreePine, List, ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import ExpenseObjectTree from '@/components/expense-objects/ExpenseObjectTree'

interface ExpenseObject {
  id: string
  name: string
  description?: string
  amount?: number
  parent_id?: string
  hierarchy_level: number
  is_parent: boolean
  total_children_cost: number
  cost_from_children: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  children?: ExpenseObject[]
}

interface ExpenseObjectForm {
  name: string
  description: string
  parent_id?: string
}

export default function ExpenseObjectsPage() {
  const [expenseObjects, setExpenseObjects] = useState<ExpenseObject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedObject, setSelectedObject] = useState<ExpenseObject | null>(null)
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [form, setForm] = useState<ExpenseObjectForm>({
    name: '',
    description: '',
    parent_id: undefined
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

  // Build tree structure from flat list
  const buildTree = (objects: ExpenseObject[]): ExpenseObject[] => {
    const map = new Map<string, ExpenseObject & { children: ExpenseObject[] }>()
    const roots: ExpenseObject[] = []

    // Create map with children arrays
    objects.forEach(obj => {
      map.set(obj.id, { ...obj, children: [] })
    })

    // Build tree
    objects.forEach(obj => {
      const node = map.get(obj.id)!
      if (obj.parent_id && map.has(obj.parent_id)) {
        map.get(obj.parent_id)!.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  // Filter expense objects
  const filteredObjects = expenseObjects.filter(obj =>
    obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (obj.description && obj.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Get tree structure
  const treeObjects = buildTree(filteredObjects)

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
        setForm({ name: '', description: '', parent_id: undefined })
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
      description: obj.description || '',
      parent_id: obj.parent_id
    })
    setShowEditModal(true)
  }

  // Open add modal
  const openAddModal = () => {
    setForm({ name: '', description: '', parent_id: undefined })
    setSelectedObject(null)
    setShowAddModal(true)
  }

  // Open add child modal
  const openAddChildModal = (parentId: string) => {
    setForm({ name: '', description: '', parent_id: parentId })
    setSelectedObject(null)
    setShowAddModal(true)
  }

  // Get available parents for dropdown
  const getAvailableParents = (excludeId?: string) => {
    return expenseObjects.filter(obj => 
      obj.id !== excludeId && 
      (!obj.parent_id || obj.hierarchy_level < 2) // Limit to 2 levels deep
    )
  }

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
          <tr className={`hover:bg-gray-50 ${level > 0 ? 'bg-blue-50/30' : ''}`}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
                {isParent ? (
                  <button
                    onClick={() => toggleParentExpansion(obj.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
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
                  <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
                
                <div className="flex items-center gap-2">
                  <div className={`text-sm font-medium ${level > 0 ? 'text-blue-700' : 'text-gray-900'}`}>
                    {obj.name}
                  </div>
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
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-500 max-w-xs truncate">
                {obj.description || '-'}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">
                {obj.cost_from_children 
                  ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(obj.total_children_cost)
                  : '-'
                }
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-500">
                Cấp {obj.hierarchy_level}
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
          {isExpanded && children.map(child => renderObject(child, level + 1))}
        </React.Fragment>
      )
    }

    return rootObjects.map(obj => renderObject(obj))
  }

  return (
    <LayoutWithSidebar>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Đối tượng chi phí</h1>
            <p className="text-gray-600">Quản lý các đối tượng chi phí với cấu trúc phân cấp</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'tree' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TreePine className="w-4 h-4" />
                Cây
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                Danh sách
              </button>
            </div>
            <button
              onClick={openAddModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Thêm đối tượng
            </button>
          </div>
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
        ) : viewMode === 'tree' ? (
          <ExpenseObjectTree
            objects={treeObjects}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onAddChild={openAddChildModal}
            onAddRoot={openAddModal}
          />
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
                        Chi phí
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cấp độ
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
                    {renderHierarchicalList()}
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
              <h2 className="text-lg font-semibold mb-4">
                {form.parent_id ? 'Thêm đối tượng con' : 'Thêm đối tượng chi phí'}
              </h2>
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
                <div className="mb-4">
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
                {!form.parent_id && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đối tượng cha (tùy chọn)
                    </label>
                    <select
                      value={form.parent_id || ''}
                      onChange={(e) => setForm({ ...form, parent_id: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn đối tượng cha --</option>
                      {getAvailableParents().map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {'  '.repeat(parent.hierarchy_level)} {parent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                <div className="mb-4">
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đối tượng cha (tùy chọn)
                  </label>
                  <select
                    value={form.parent_id || ''}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn đối tượng cha --</option>
                    {getAvailableParents(selectedObject?.id).map(parent => (
                      <option key={parent.id} value={parent.id}>
                        {'  '.repeat(parent.hierarchy_level)} {parent.name}
                      </option>
                    ))}
                  </select>
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
