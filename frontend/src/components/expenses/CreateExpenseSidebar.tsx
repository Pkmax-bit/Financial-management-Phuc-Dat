'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Save, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Calendar,
  User,
  DollarSign,
  Receipt,
  Minus,
  Plus as PlusIcon,
  Upload,
  Camera,
  FileText
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'

interface Employee {
  id: string
  full_name: string
  email?: string
  position?: string
}

interface Project {
  id: string
  name: string
  project_code: string
  status: string
}

interface CostCategory {
  id: string
  name: string
  type: string
}

interface CreateExpenseSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateExpenseSidebar({ isOpen, onClose, onSuccess }: CreateExpenseSidebarProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<CostCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    details: true,
    additional: false
  })

  // Form data
  const [formData, setFormData] = useState({
    expense_code: '',
    employee_id: '',
    project_id: '',
    category: '',
    description: '',
    amount: 0,
    currency: 'VND',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_url: '',
    status: 'pending',
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchEmployees()
      fetchProjects()
      fetchCategories()
      generateExpenseCode()
    }
  }, [isOpen])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching employees from database...')
      
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, position')
        .eq('status', 'active')
        .order('full_name', { ascending: true })
      
      if (error) {
        console.error('❌ Supabase error fetching employees:', error)
        throw error
      }
      
      console.log('✅ Employees fetched successfully:', data?.length || 0)
      setEmployees(data || [])
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      console.log('🔍 Fetching projects from database...')
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, project_code, status')
        .in('status', ['planning', 'active'])
        .order('name', { ascending: true })
      
      if (error) {
        console.error('❌ Supabase error fetching projects:', error)
        throw error
      }
      
      console.log('✅ Projects fetched successfully:', data?.length || 0)
      setProjects(data || [])
    } catch (error) {
      console.error('❌ Error fetching projects:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('🔍 Fetching cost categories from database...')
      
      const { data, error } = await supabase
        .from('cost_categories')
        .select('id, name, type')
        .order('name', { ascending: true })
      
      if (error) {
        console.error('❌ Supabase error fetching categories:', error)
        throw error
      }
      
      console.log('✅ Categories fetched successfully:', data?.length || 0)
      setCategories(data || [])
    } catch (error) {
      console.error('❌ Error fetching categories:', error)
    }
  }

  const generateExpenseCode = () => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    setFormData(prev => ({
      ...prev,
      expense_code: `EXP-${dateStr}-${randomStr}`
    }))
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount.toString()),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const result = await apiPost(getApiEndpoint('/api/expenses'), expenseData)
        
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('Có lỗi xảy ra khi tạo chi phí: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      expense_code: '',
      employee_id: '',
      project_id: '',
      category: '',
      description: '',
      amount: 0,
      currency: 'VND',
      expense_date: new Date().toISOString().split('T')[0],
      receipt_url: '',
      status: 'pending',
      notes: ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-2xl">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tạo chi phí mới</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý và theo dõi chi phí dự án</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
            <div className="space-y-4">
              {/* Basic Information Section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('basic')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">Thông tin cơ bản</span>
                  </div>
                  {expandedSections.basic ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.basic && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Mã chi phí</label>
                      <input
                        type="text"
                        value={formData.expense_code}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black bg-gray-50"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Nhân viên *</label>
                      {loading ? (
                        <div className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-gray-50">
                          <span className="text-xs text-black">Đang tải...</span>
                        </div>
                      ) : employees.length === 0 ? (
                        <div className="w-full border border-red-300 rounded-md px-2 py-1.5 bg-red-50">
                          <span className="text-xs text-red-600">Không có nhân viên</span>
                        </div>
                      ) : (
                        <select
                          value={formData.employee_id}
                          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                          required
                        >
                          <option value="">Chọn nhân viên</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.full_name} {employee.position ? `(${employee.position})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Dự án</label>
                      <select
                        value={formData.project_id}
                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">Chọn dự án (tùy chọn)</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.project_code} - {project.name} ({project.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Danh mục chi phí *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                        required
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name} ({category.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Ngày chi phí *</label>
                      <input
                        type="date"
                        value={formData.expense_date}
                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('details')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-900">Chi tiết chi phí</span>
                  </div>
                  {expandedSections.details ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.details && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Mô tả *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                        rows={3}
                        placeholder="Mô tả chi tiết về chi phí..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-black mb-1">Số tiền *</label>
                        <input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-black mb-1">Tiền tệ</label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="VND">VND</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">URL đơn hàng</label>
                      <input
                        type="url"
                        value={formData.receipt_url}
                        onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="https://example.com/receipt.pdf"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information Section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('additional')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-gray-900">Thông tin bổ sung</span>
                  </div>
                  {expandedSections.additional ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.additional && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Ghi chú</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                        rows={3}
                        placeholder="Ghi chú thêm về chi phí..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? 'Đang lưu...' : 'Tạo chi phí'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}