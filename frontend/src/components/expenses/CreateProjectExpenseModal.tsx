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
  Target,
  BarChart3,
  Minus,
  Plus as PlusIcon,
  Building2,
  FileText
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  name: string
  project_code: string
  status: string
}

interface Employee {
  id: string
  full_name: string
  email?: string
  position?: string
}

interface CreateProjectExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateProjectExpenseModal({ isOpen, onClose, onSuccess }: CreateProjectExpenseModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    amounts: true,
    additional: false
  })

  // Form data
  const [formData, setFormData] = useState({
    project_id: '',
    employee_id: '',
    category: 'planned', // 'planned' or 'actual'
    description: '',
    planned_amount: 0,
    actual_amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
      fetchEmployees()
    }
  }, [isOpen])

  const fetchProjects = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
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
    }
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
        planned_amount: parseFloat(formData.planned_amount.toString()),
        actual_amount: parseFloat(formData.actual_amount.toString()),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const result = await apiPost('http://localhost:8000/api/project-expenses', expenseData)
        
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating project expense:', error)
      alert('Có lỗi xảy ra khi tạo chi phí dự án: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      project_id: '',
      employee_id: '',
      category: 'planned',
      description: '',
      planned_amount: 0,
      actual_amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-2xl">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tạo chi phí dự án</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý chi phí kế hoạch và thực tế cho dự án</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {/* Basic Information Section */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
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
                    <label className="block text-xs font-semibold text-black mb-1">Dự án *</label>
                    {loading ? (
                      <div className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-gray-50">
                        <span className="text-xs text-black">Đang tải...</span>
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="w-full border border-red-300 rounded-md px-2 py-1.5 bg-red-50">
                        <span className="text-xs text-red-600">Không có dự án</span>
                      </div>
                    ) : (
                      <select
                        value={formData.project_id}
                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="">Chọn dự án</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.project_code} - {project.name} ({project.status})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Nhân viên</label>
                    <select
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Chọn nhân viên (tùy chọn)</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name} {employee.position ? `(${employee.position})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Loại chi phí *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="planned">Kế hoạch</option>
                      <option value="actual">Thực tế</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Mô tả *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={3}
                      placeholder="Mô tả chi tiết về chi phí dự án..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Ngày chi phí *</label>
                    <input
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Amounts Section */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('amounts')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-gray-900">Số tiền</span>
                </div>
                {expandedSections.amounts ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {expandedSections.amounts && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Số tiền kế hoạch (VND)</label>
                      <input
                        type="number"
                        value={formData.planned_amount}
                        onChange={(e) => setFormData({ ...formData, planned_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-black mb-1">Số tiền thực tế (VND)</label>
                      <input
                        type="number"
                        value={formData.actual_amount}
                        onChange={(e) => setFormData({ ...formData, actual_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Variance Display */}
                  {formData.planned_amount > 0 && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Chênh lệch:</span>
                        <span className={`font-medium ${
                          (formData.actual_amount - formData.planned_amount) > 0 ? 'text-red-600' : 
                          (formData.actual_amount - formData.planned_amount) < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {(formData.actual_amount - formData.planned_amount).toLocaleString('vi-VN')} VND
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tỷ lệ %:</span>
                        <span className={`font-medium ${
                          ((formData.actual_amount - formData.planned_amount) / formData.planned_amount * 100) > 0 ? 'text-red-600' : 
                          ((formData.actual_amount - formData.planned_amount) / formData.planned_amount * 100) < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {((formData.actual_amount - formData.planned_amount) / formData.planned_amount * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
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
                    <label className="block text-xs font-semibold text-black mb-1">Trạng thái</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="pending">Chờ duyệt</option>
                      <option value="approved">Đã duyệt</option>
                      <option value="rejected">Từ chối</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Ghi chú</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={3}
                      placeholder="Ghi chú thêm về chi phí dự án..."
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? 'Đang lưu...' : 'Tạo chi phí dự án'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
