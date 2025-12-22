'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, Save, Tag, Palette, ArrowRight, Settings } from 'lucide-react'
import { projectCategoryApi, projectStatusFlowRulesApi, projectApi } from '@/lib/api'

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
  initialTab?: 'categories' | 'flow-rules'
}

interface ProjectStatus {
  id: string
  name: string
  display_order: number
  category_id?: string
}

interface FlowRule {
  id: string
  status_id: string
  category_id: string
  action_type: 'add' | 'remove'
  is_active: boolean
  priority: number
  description?: string
  project_statuses?: { id: string; name: string }
  project_categories?: { id: string; name: string; code: string }
}

export default function ProjectCategoriesManager({ isOpen, onClose, onSuccess, initialTab = 'categories' }: ProjectCategoriesManagerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'flow-rules'>(initialTab)
  const [categories, setCategories] = useState<ProjectCategory[]>([])
  const [statuses, setStatuses] = useState<ProjectStatus[]>([])
  const [flowRules, setFlowRules] = useState<FlowRule[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showFlowRuleForm, setShowFlowRuleForm] = useState(false)
  const [editingFlowRuleId, setEditingFlowRuleId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#4ECDC4',
    icon: '',
    display_order: 0,
    is_active: true
  })
  const [flowRuleForm, setFlowRuleForm] = useState({
    status_category_id: '', // Nhóm để lọc trạng thái
    status_id: '',
    category_id: '', // Nhóm sẽ được thêm/xóa
    action_type: 'add' as 'add' | 'remove',
    is_active: true,
    priority: 0,
    description: ''
  })
  const [filteredStatuses, setFilteredStatuses] = useState<ProjectStatus[]>([])
  const [showQuickCreateCategory, setShowQuickCreateCategory] = useState(false)
  const [quickCategoryName, setQuickCategoryName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      if (activeTab === 'flow-rules') {
        fetchStatuses()
        fetchFlowRules()
      }
    }
  }, [isOpen, activeTab])

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

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

  const fetchStatuses = async (categoryId?: string) => {
    try {
      const data = await projectApi.getProjectStatuses(categoryId)
      setStatuses(data || [])
      // Nếu có categoryId, cũng cập nhật filteredStatuses
      if (categoryId && categoryId !== 'all') {
        setFilteredStatuses(data || [])
      } else if (categoryId === 'all') {
        // Nếu chọn "Tất cả", lấy tất cả statuses (global)
        setFilteredStatuses(data || [])
      }
    } catch (error) {
      console.error('Error fetching statuses:', error)
    }
  }

  // Khi chọn nhóm trạng thái, lọc statuses
  useEffect(() => {
    if (flowRuleForm.status_category_id && flowRuleForm.status_category_id !== 'all') {
      fetchStatuses(flowRuleForm.status_category_id)
      // Reset status_id khi đổi nhóm
      setFlowRuleForm(prev => ({ ...prev, status_id: '' }))
    } else if (flowRuleForm.status_category_id === 'all') {
      // Nếu chọn "Tất cả", lấy tất cả statuses (global)
      fetchStatuses()
      setFlowRuleForm(prev => ({ ...prev, status_id: '' }))
    }
  }, [flowRuleForm.status_category_id])

  const handleQuickCreateCategory = async () => {
    if (!quickCategoryName.trim()) {
      alert('Vui lòng nhập tên nhóm')
      return
    }

    try {
      setLoading(true)
      const code = generateCodeFromName(quickCategoryName)
      const newCategory = await projectCategoryApi.createCategory({
        name: quickCategoryName.trim(),
        code: code,
        description: '',
        color: '#4ECDC4',
        display_order: categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) + 1 : 0,
        is_active: true
      })
      
      // Refresh categories
      await fetchCategories()
      
      // Auto-select the new category
      setFlowRuleForm(prev => ({ ...prev, category_id: newCategory.id }))
      
      // Reset form
      setQuickCategoryName('')
      setShowQuickCreateCategory(false)
    } catch (error: any) {
      console.error('Error creating category:', error)
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi tạo nhóm')
    } finally {
      setLoading(false)
    }
  }

  const fetchFlowRules = async () => {
    try {
      setLoading(true)
      const data = await projectStatusFlowRulesApi.getFlowRules()
      setFlowRules(data || [])
    } catch (error) {
      console.error('Error fetching flow rules:', error)
      alert('Có lỗi xảy ra khi tải danh sách flow rules')
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

  const handleCreateFlowRule = async () => {
    if (!flowRuleForm.status_category_id || !flowRuleForm.status_id || !flowRuleForm.category_id) {
      alert('Vui lòng chọn đầy đủ: nhóm trạng thái, trạng thái và nhóm dự án')
      return
    }

    try {
      setLoading(true)
      await projectStatusFlowRulesApi.createFlowRule(flowRuleForm)
      setShowFlowRuleForm(false)
      setFlowRuleForm({
        status_category_id: '',
        status_id: '',
        category_id: '',
        action_type: 'add',
        is_active: true,
        priority: 0,
        description: ''
      })
      setFilteredStatuses([])
      fetchFlowRules()
      onSuccess()
    } catch (error: any) {
      console.error('Error creating flow rule:', error)
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi tạo flow rule')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateFlowRule = async (id: string) => {
    if (!flowRuleForm.status_category_id || !flowRuleForm.status_id || !flowRuleForm.category_id) {
      alert('Vui lòng chọn đầy đủ: nhóm trạng thái, trạng thái và nhóm dự án')
      return
    }

    try {
      setLoading(true)
      await projectStatusFlowRulesApi.updateFlowRule(id, flowRuleForm)
      setEditingFlowRuleId(null)
      setFlowRuleForm({
        status_category_id: '',
        status_id: '',
        category_id: '',
        action_type: 'add',
        is_active: true,
        priority: 0,
        description: ''
      })
      setFilteredStatuses([])
      fetchFlowRules()
      onSuccess()
    } catch (error: any) {
      console.error('Error updating flow rule:', error)
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật flow rule')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFlowRule = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa flow rule này?')) {
      return
    }

    try {
      setLoading(true)
      await projectStatusFlowRulesApi.deleteFlowRule(id)
      // Refresh flow rules list
      await fetchFlowRules()
      onSuccess()
    } catch (error: any) {
      console.error('Error deleting flow rule:', error)
      // Check if it's a 404 error (rule not found)
      // ApiError has status property, or check error.message
      const isNotFound = error.status === 404 || 
                        error.message?.toLowerCase().includes('not found') ||
                        error.message?.toLowerCase().includes('không tìm thấy')
      
      if (isNotFound) {
        // Rule might have been deleted already, just refresh the list
        await fetchFlowRules()
        // Don't show error alert for 404, just refresh silently
        // The list will update and the rule will disappear
        return
      }
      
      // For other errors, show alert
      const errorMessage = error.message || 
                          error.data?.detail || 
                          error.response?.data?.detail || 
                          'Có lỗi xảy ra khi xóa flow rule'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
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
          {/* Flow Rules Tab */}
          {activeTab === 'flow-rules' && (
            <div className="space-y-4">
              {/* Flow Rule Form */}
              {(showFlowRuleForm || editingFlowRuleId) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingFlowRuleId ? 'Chỉnh sửa flow rule' : 'Tạo flow rule mới'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nhóm trạng thái *
                      </label>
                      <select
                        value={flowRuleForm.status_category_id}
                        onChange={(e) => setFlowRuleForm({ ...flowRuleForm, status_category_id: e.target.value, status_id: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      >
                        <option value="">Chọn nhóm trạng thái...</option>
                        <option value="all">Tất cả (Trạng thái toàn cục)</option>
                        {categories.filter(c => c.is_active).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Chọn nhóm để lọc trạng thái</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái *
                      </label>
                      <select
                        value={flowRuleForm.status_id}
                        onChange={(e) => setFlowRuleForm({ ...flowRuleForm, status_id: e.target.value })}
                        disabled={!flowRuleForm.status_category_id}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{flowRuleForm.status_category_id ? 'Chọn trạng thái...' : 'Chọn nhóm trạng thái trước'}</option>
                        {(flowRuleForm.status_category_id ? filteredStatuses : []).map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                      {!flowRuleForm.status_category_id && (
                        <p className="text-xs text-gray-500 mt-1">Vui lòng chọn nhóm trạng thái trước</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Nhóm dự án (sẽ được thêm/xóa) *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowQuickCreateCategory(true)}
                          disabled={!flowRuleForm.status_id}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3 w-3" />
                          Tạo mới
                        </button>
                      </div>
                      <select
                        value={flowRuleForm.category_id}
                        onChange={(e) => setFlowRuleForm({ ...flowRuleForm, category_id: e.target.value })}
                        disabled={!flowRuleForm.status_id}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{flowRuleForm.status_id ? 'Chọn nhóm dự án...' : 'Chọn trạng thái trước'}</option>
                        {categories.filter(c => c.is_active && c.id !== flowRuleForm.status_category_id).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {!flowRuleForm.status_id && (
                        <p className="text-xs text-gray-500 mt-1">Vui lòng chọn trạng thái trước</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hành động *
                      </label>
                      <select
                        value={flowRuleForm.action_type}
                        onChange={(e) => setFlowRuleForm({ ...flowRuleForm, action_type: e.target.value as 'add' | 'remove' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      >
                        <option value="add">Thêm vào nhóm</option>
                        <option value="remove">Xóa khỏi nhóm</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Độ ưu tiên
                      </label>
                      <input
                        type="number"
                        value={flowRuleForm.priority}
                        onChange={(e) => setFlowRuleForm({ ...flowRuleForm, priority: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Số càng cao càng ưu tiên</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả
                      </label>
                      <textarea
                        value={flowRuleForm.description}
                        onChange={(e) => setFlowRuleForm({ ...flowRuleForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        rows={2}
                        placeholder="Mô tả về flow rule này..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={flowRuleForm.is_active}
                          onChange={(e) => setFlowRuleForm({ ...flowRuleForm, is_active: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Kích hoạt flow rule này</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={editingFlowRuleId ? () => handleUpdateFlowRule(editingFlowRuleId) : handleCreateFlowRule}
                      disabled={loading || !flowRuleForm.status_id || !flowRuleForm.category_id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Đang lưu...' : (editingFlowRuleId ? 'Cập nhật' : 'Tạo mới')}
                    </button>
                    <button
                      onClick={() => {
                        setShowFlowRuleForm(false)
                        setEditingFlowRuleId(null)
                        setFlowRuleForm({
                          status_category_id: '',
                          status_id: '',
                          category_id: '',
                          action_type: 'add',
                          is_active: true,
                          priority: 0,
                          description: ''
                        })
                        setFilteredStatuses([])
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Create Category Modal */}
              {showQuickCreateCategory && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tạo nhóm mới</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên nhóm *
                          </label>
                          <input
                            type="text"
                            value={quickCategoryName}
                            onChange={(e) => setQuickCategoryName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            placeholder="VD: Dự án cửa"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && quickCategoryName.trim()) {
                                handleQuickCreateCategory()
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleQuickCreateCategory}
                            disabled={loading || !quickCategoryName.trim()}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Đang tạo...' : 'Tạo'}
                          </button>
                          <button
                            onClick={() => {
                              setShowQuickCreateCategory(false)
                              setQuickCategoryName('')
                            }}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Flow Rule Button */}
              {!showFlowRuleForm && !editingFlowRuleId && (
                <button
                  onClick={() => {
                    setShowFlowRuleForm(true)
                    setEditingFlowRuleId(null)
                    setFlowRuleForm({
                      status_category_id: '',
                      status_id: '',
                      category_id: '',
                      action_type: 'add',
                      is_active: true,
                      priority: 0,
                      description: ''
                    })
                    setFilteredStatuses([])
                  }}
                  className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm flow rule mới
                </button>
              )}

              {/* Flow Rules List */}
              {loading && !flowRules.length ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : flowRules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có flow rule nào. Hãy tạo flow rule đầu tiên.
                </div>
              ) : (
                <div className="space-y-3">
                  {flowRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {rule.project_statuses?.name || 'N/A'}
                            </span>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              rule.action_type === 'add' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {rule.action_type === 'add' ? 'Thêm vào' : 'Xóa khỏi'}
                            </span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              {rule.project_categories?.name || 'N/A'}
                            </span>
                            {!rule.is_active && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                Tạm dừng
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {rule.description && <p><strong>Mô tả:</strong> {rule.description}</p>}
                            <p><strong>Độ ưu tiên:</strong> {rule.priority}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={async () => {
                              setEditingFlowRuleId(rule.id)
                              setShowFlowRuleForm(false)
                              // Tìm category_id của status để set status_category_id
                              const status = statuses.find(s => s.id === rule.status_id)
                              const statusCategoryId = status?.category_id || 'all'
                              
                              // Fetch statuses cho category đó
                              if (statusCategoryId && statusCategoryId !== 'all') {
                                await fetchStatuses(statusCategoryId)
                              } else {
                                await fetchStatuses()
                              }
                              
                              setFlowRuleForm({
                                status_category_id: statusCategoryId || 'all',
                                status_id: rule.status_id,
                                category_id: rule.category_id,
                                action_type: rule.action_type,
                                is_active: rule.is_active,
                                priority: rule.priority,
                                description: rule.description || ''
                              })
                            }}
                            disabled={loading}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFlowRule(rule.id)}
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
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <>
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
            </>
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
