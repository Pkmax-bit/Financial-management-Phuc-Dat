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
  editExpense?: {
    id: string
    project_id: string
    description: string
    planned_amount: number
    expense_date: string
    notes?: string
    receipt_url?: string
    currency: string
    id_parent?: string
    employee_id?: string
  } | null
}

export default function CreateProjectExpenseDialog({ isOpen, onClose, onSuccess, editExpense }: CreateProjectExpenseDialogProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [parentQuotes, setParentQuotes] = useState<{ id: string; expense_code?: string; description: string; amount: number }[]>([])
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
    planned_amount: '',  // Đổi thành string để xử lý input number tốt hơn
    actual_amount: '',   // Đổi thành string để xử lý input number tốt hơn
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
      if (editExpense) {
        // Nếu là chỉnh sửa, điền dữ liệu vào form
        setFormData({
          project_id: editExpense.project_id,
          employee_id: editExpense.employee_id || '',
          category: 'planned',
          description: editExpense.description,
          planned_amount: editExpense.planned_amount.toString(),
          actual_amount: '',
          expense_date: editExpense.expense_date,
          status: 'pending',
          notes: editExpense.notes || '',
          receipt_url: editExpense.receipt_url || '',
          currency: editExpense.currency,
          id_parent: editExpense.id_parent || ''
        })
      } else {
        // Nếu là tạo mới, reset form
        resetForm()
      }
    }
  }, [isOpen, editExpense])

  // Load parent quotes when a project is selected (only planned quotes without parent or allow any as parent)
  useEffect(() => {
    const loadParents = async () => {
      if (!formData.project_id) {
        setParentQuotes([])
        return
      }
      try {
        const { data, error } = await supabase
          .from('project_expenses_quote')
          .select(`
            id, 
            expense_code, 
            description, 
            amount,
            status
          `)
          .eq('project_id', formData.project_id)
          .not('status', 'eq', 'approved') // Chỉ lấy các chi phí chưa duyệt
          .order('created_at', { ascending: false })
        if (error) throw error
        setParentQuotes(data || [])
      } catch (e) {
        console.error('❌ Error fetching parent quotes:', e)
        setParentQuotes([])
      }
    }
    loadParents()
  }, [formData.project_id])

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

    const amount = Number(formData.planned_amount)
    if (isNaN(amount) || amount <= 0) {
      newErrors.planned_amount = 'Số tiền kế hoạch phải là số dương'
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
      // Chuyển đổi số tiền từ string sang number và đảm bảo là số dương
      const amount = Math.max(0, Number(formData.planned_amount) || 0)
      
      // Chỉ lưu số tiền kế hoạch → map vào amount; luôn là kế hoạch (planned)
      const expenseData = {
        project_id: formData.project_id,
        employee_id: formData.employee_id || null,
        description: formData.description.trim(),
        amount: amount,
        currency: formData.currency,
        expense_date: formData.expense_date,
        status: 'pending',
        notes: formData.notes?.trim() || null,
        receipt_url: formData.receipt_url?.trim() || null,
        id_parent: formData.id_parent || null,
      }
      
      console.log('💰 Amount being saved:', amount, typeof amount)

      console.log('📤 Submitting project expense quote:', expenseData)
      
      if (editExpense) {
        // Nếu là chỉnh sửa, gọi API PUT
        const result = await fetch(`http://localhost:8000/api/project-expenses/quotes/${editExpense.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expenseData)
        })
        if (!result.ok) {
          const error = await result.json()
          throw new Error(error.message || 'Failed to update expense')
        }
        console.log('✅ Project expense updated successfully')
      } else {
        // Nếu là tạo mới, gọi API POST
        const result = await apiPost('http://localhost:8000/api/project-expenses/quotes', expenseData)
        console.log('✅ Project expense created successfully:', result)
      }
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
        
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('❌ Error creating project expense:', error)
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
      planned_amount: '',
      actual_amount: '',
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
            <div className="p-2 rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{editExpense ? 'Chỉnh sửa chi phí dự án' : 'Tạo chi phí dự án'}</h2>
              <p className="text-sm text-black mt-1">Quản lý chi phí kế hoạch và thực tế cho dự án</p>
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="">Không chọn</option>
                      {parentQuotes.map((pq) => (
                        <option key={pq.id} value={pq.id}>
                          {(pq.expense_code ? pq.expense_code + ' - ' : '') + pq.description} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pq.amount || 0)}) - {pq.status === 'pending' ? 'Chờ duyệt' : pq.status === 'rejected' ? 'Từ chối' : 'Đã duyệt'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Loại chi phí <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: 'planned' })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                        disabled
                      >
                        <option value="planned">Kế hoạch</option>
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
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-gray-900">Số tiền kế hoạch</span>
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
                      Số tiền kế hoạch (VND)
                    </label>
                    <input
                      type="number"
                      value={formData.planned_amount}
                      onChange={(e) => {
                        const value = e.target.value
                        // Chỉ cho phép số và dấu chấm
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setFormData({ ...formData, planned_amount: value })
                        }
                      }}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                        errors.planned_amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      type="text"
                      inputMode="decimal"
                      placeholder="Nhập số tiền..."
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? 'Đang lưu...' : editExpense ? 'Lưu thay đổi' : 'Tạo chi phí dự án'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



