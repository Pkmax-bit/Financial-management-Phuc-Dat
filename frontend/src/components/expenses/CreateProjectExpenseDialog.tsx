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
  Building2,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  name: string
  project_code: string
  status: string
  budget?: number
}

interface Employee {
  id: string
  full_name: string
  email?: string
}

interface CreateProjectExpenseDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  category?: 'planned' | 'actual' // Add category prop to specify expense type
}

export default function CreateProjectExpenseDialog({ isOpen, onClose, onSuccess, category = 'planned' }: CreateProjectExpenseDialogProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [parentQuotes, setParentQuotes] = useState<{ id: string; expense_code?: string; description: string; amount: number }[]>([])
  const [parentExpenses, setParentExpenses] = useState<{ id: string; expense_code?: string; description: string; amount: number }[]>([])
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
    notes: '',
    receipt_url: '',
    currency: 'VND',
    id_parent: ''
  })

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
      fetchEmployees()
      resetForm()
    }
  }, [isOpen])

  // Load parent expenses based on category
  useEffect(() => {
    const loadParents = async () => {
      if (!formData.project_id) {
        setParentQuotes([])
        setParentExpenses([])
        return
      }
      try {
        if (category === 'planned') {
          // Load from project_expenses_quote for planned expenses
          const { data, error } = await supabase
            .from('project_expenses_quote')
            .select('id, expense_code, description, amount')
            .eq('project_id', formData.project_id)
            .order('created_at', { ascending: false })
          if (error) throw error
          setParentQuotes(data || [])
        } else {
          // Load from project_expenses for actual expenses
          const { data, error } = await supabase
            .from('project_expenses')
            .select('id, expense_code, description, amount')
            .eq('project_id', formData.project_id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
          if (error) throw error
          setParentExpenses(data || [])
        }
      } catch (e) {
        console.error('❌ Error fetching parent expenses:', e)
        setParentQuotes([])
        setParentExpenses([])
      }
    }
    loadParents()
  }, [formData.project_id, category])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching projects from database...')
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, project_code, status, budget')
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
        .select('id, user_id, first_name, last_name, email')
        .order('first_name', { ascending: true })
      
      if (error) {
        console.error('❌ Supabase error fetching employees:', error)
        throw error
      }
      
      const mapped: Employee[] = (data || []).map((e: any) => ({
        id: e.id,
        full_name: ((e.first_name || '') + ' ' + (e.last_name || '')).trim() || e.email || e.id,
        email: e.email
      }))
      
      console.log('✅ Employees fetched successfully:', mapped.length)
      setEmployees(mapped)
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.project_id) {
      newErrors.project_id = 'Vui lòng chọn dự án'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả chi phí'
    }

    if (!formData.expense_date) {
      newErrors.expense_date = 'Vui lòng chọn ngày chi phí'
    }

    if (formData.planned_amount <= 0) {
      newErrors.planned_amount = 'Số tiền kế hoạch phải lớn hơn 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    
    try {
      if (category === 'planned') {
        // Create planned expense (quote)
        const expenseData = {
          project_id: formData.project_id,
          employee_id: formData.employee_id || null,
          description: formData.description,
          amount: parseFloat(formData.planned_amount.toString()) || 0,
          currency: formData.currency,
          expense_date: formData.expense_date,
          status: 'pending',
          notes: formData.notes || null,
          receipt_url: formData.receipt_url || null,
          id_parent: formData.id_parent || null,
        }

        console.log('📤 Submitting project expense quote (planned):', expenseData)
        const result = await apiPost('http://localhost:8000/api/project-expenses/quotes', expenseData)
        console.log('✅ Project expense quote created successfully:', result)
        
        // After create, if has parent, update parent quote amount = sum(children)
        if (expenseData.id_parent) {
          try {
            const parentId = expenseData.id_parent as string
            const { data: children } = await supabase
              .from('project_expenses_quote')
              .select('amount')
              .eq('id_parent', parentId)
            const total = (children || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0)
            await supabase
              .from('project_expenses_quote')
              .update({ amount: total, updated_at: new Date().toISOString() })
              .eq('id', parentId)
          } catch (e) {
            console.error('❌ Error updating parent quote amount:', e)
          }
        }
      } else {
        // Create actual expense directly
        const expenseData: any = {
          id: crypto.randomUUID(),
          project_id: formData.project_id,
          description: formData.description,
          amount: parseFloat(formData.planned_amount.toString()) || 0,
          currency: formData.currency,
          expense_date: formData.expense_date,
          status: 'approved', // Actual expenses are automatically approved
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Add optional fields
        if (formData.employee_id) expenseData.employee_id = formData.employee_id
        if (formData.notes) expenseData.notes = formData.notes
        if (formData.receipt_url) expenseData.receipt_url = formData.receipt_url
        if (formData.id_parent) expenseData.id_parent = formData.id_parent
        
        console.log('📤 Submitting project expense (actual):', expenseData)
        
        const { data, error } = await supabase
          .from('project_expenses')
          .insert(expenseData)
          .select()
        
        if (error) throw error
        
        console.log('✅ Project expense (actual) created successfully:', data)
        
        // After create, if has parent, update parent expense amount = sum(children)
        if (expenseData.id_parent) {
          try {
            const parentId = expenseData.id_parent as string
            const { data: children } = await supabase
              .from('project_expenses')
              .select('amount')
              .eq('id_parent', parentId)
            const total = (children || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0)
            await supabase
              .from('project_expenses')
              .update({ amount: total, updated_at: new Date().toISOString() })
              .eq('id', parentId)
          } catch (e) {
            console.error('❌ Error updating parent expense amount:', e)
          }
        }
      }
        
      alert(category === 'planned' ? 'Tạo chi phí kế hoạch thành công!' : 'Tạo chi phí thực tế thành công!')
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('❌ Error creating project expense:', error)
      alert('Có lỗi xảy ra khi tạo chi phí: ' + (error as Error).message)
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
      notes: '',
      receipt_url: '',
      currency: 'VND',
      id_parent: ''
    })
    setErrors({})
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600'
    if (variance < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <BarChart3 className="h-4 w-4" />
    if (variance < 0) return <Target className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-4xl">
      <div className="bg-white shadow-2xl border border-gray-200 rounded-lg max-h-[85vh] overflow-hidden animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${category === 'actual' ? 'bg-green-100' : 'bg-blue-100'}`}>
              <DollarSign className={`h-6 w-6 ${category === 'actual' ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {category === 'actual' ? 'Tạo chi phí thực tế' : 'Tạo chi phí kế hoạch'}
              </h2>
              <p className="text-sm text-black mt-1">
                {category === 'actual' 
                  ? 'Tạo chi phí thực tế đã phát sinh cho dự án'
                  : 'Tạo chi phí dự kiến cho dự án'}
              </p>
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
        <div className="flex-1 overflow-y-auto p-6 text-gray-900">
          <div className="space-y-6">
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
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Dự án <span className="text-red-500">*</span>
                      </label>
                      {loading ? (
                        <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                          <span className="text-sm text-black">Đang tải...</span>
                        </div>
                      ) : projects.length === 0 ? (
                        <div className="w-full border border-red-300 rounded-md px-3 py-2 bg-red-50">
                          <span className="text-sm text-red-600">Không có dự án</span>
                        </div>
                      ) : (
                        <select
                          value={formData.project_id}
                          onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                          className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                            errors.project_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Chọn dự án</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.project_code} - {project.name} ({project.status})
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.project_id && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.project_id}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nhân viên
                      </label>
                      <select
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="">Chọn nhân viên (tùy chọn)</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Chi phí cha (tuỳ chọn)
                    </label>
                    <select
                      value={formData.id_parent}
                      onChange={(e) => setFormData({ ...formData, id_parent: e.target.value })}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 text-gray-900 ${
                        category === 'actual' ? 'focus:ring-green-500 border-gray-300' : 'focus:ring-blue-500 border-gray-300'
                      }`}
                    >
                      <option value="">Không chọn</option>
                      {(category === 'planned' ? parentQuotes : parentExpenses).map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {(parent.expense_code ? parent.expense_code + ' - ' : '') + parent.description} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parent.amount || 0)})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {category === 'planned' 
                        ? 'Chọn chi phí kế hoạch làm cha (từ project_expenses_quote)'
                        : 'Chọn chi phí thực tế làm cha (từ project_expenses)'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Loại chi phí <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={category}
                        className={`w-full border rounded-md px-3 py-2 text-sm bg-gray-50 cursor-not-allowed ${
                          category === 'actual' ? 'text-green-700 border-green-300' : 'text-blue-700 border-blue-300'
                        }`}
                        disabled
                      >
                        <option value="planned">Kế hoạch</option>
                        <option value="actual">Thực tế</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Ngày chi phí <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.expense_date}
                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                          errors.expense_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.expense_date && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.expense_date}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                        errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="Mô tả chi tiết về chi phí dự án..."
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Amount Section - planned only */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('amounts')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className={`h-4 w-4 ${category === 'actual' ? 'text-green-600' : 'text-blue-600'}`} />
                  <span className="font-medium text-gray-900">
                    {category === 'actual' ? 'Số tiền thực tế' : 'Số tiền kế hoạch'}
                  </span>
                </div>
                {expandedSections.amounts ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {expandedSections.amounts && (
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {category === 'actual' ? 'Số tiền thực tế (VND)' : 'Số tiền kế hoạch (VND)'}
                    </label>
                    <input
                      type="number"
                      value={formData.planned_amount}
                      onChange={(e) => setFormData({ ...formData, planned_amount: parseFloat(e.target.value) || 0 })}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        category === 'actual' ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                      } text-gray-900 ${
                        errors.planned_amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                    {errors.planned_amount && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.planned_amount}
                      </p>
                    )}
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
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Trạng thái
                      </label>
                      <input
                        value="Chờ duyệt"
                        readOnly
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Đơn vị tiền tệ
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="VND">VND (Việt Nam Đồng)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      URL hóa đơn/chứng từ
                    </label>
                    <input
                      type="url"
                      value={formData.receipt_url}
                      onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="https://example.com/receipt.pdf"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 focus:outline-none focus:ring-2 flex items-center space-x-2 ${
                category === 'actual' 
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>
                {submitting 
                  ? 'Đang lưu...' 
                  : (category === 'actual' ? 'Tạo chi phí thực tế' : 'Tạo chi phí kế hoạch')
                }
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



