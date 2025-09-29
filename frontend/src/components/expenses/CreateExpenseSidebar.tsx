'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar,
  User,
  DollarSign,
  Receipt,
  Save,
  Send,
  ChevronRight,
  ChevronDown,
  Minus,
  Plus as PlusIcon,
  Building2,
  CreditCard,
  Banknote,
  FileCheck,
  Paperclip
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Employee {
  id: string
  name: string
  email?: string
  department?: string
}

interface Project {
  id: string
  name: string
  description?: string
  status?: string
}

interface CreateExpenseSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateExpenseSidebar({ isOpen, onClose, onSuccess }: CreateExpenseSidebarProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    details: true,
    attachments: false,
    additional: false
  })

  // Form data
  const [formData, setFormData] = useState({
    expense_code: '',
    employee_id: '',
    project_id: '',
    category: 'other',
    description: '',
    amount: 0,
    currency: 'VND',
    expense_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: '',
    receipt_url: '',
    created_by: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchEmployees()
      fetchProjects()
      generateExpenseCode()
    }
  }, [isOpen])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching employees from database...')
      
      // Use Supabase client directly to get real data
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .limit(20)
      
      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      
      console.log('🔍 Real employees data from database:', data)
      setEmployees(data || [])
      
      if (!data || data.length === 0) {
        alert('Không có nhân viên nào trong database. Vui lòng tạo nhân viên trước.')
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
      alert('Không thể tải danh sách nhân viên từ database: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      console.log('🔍 Fetching projects from database...')
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(20)
      
      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      
      console.log('🔍 Real projects data from database:', data)
      setProjects(data || [])
    } catch (error) {
      console.error('❌ Error fetching projects:', error)
      // Don't show alert for projects as it's optional
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

  const handleSubmit = async (submitType: 'draft' | 'submit' = 'draft') => {
    setSubmitting(true)
    
    try {
      console.log('🔍 Creating expense with data:', {
        formData,
        submitType
      })
      
      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser()
      
      // Check if user exists in employees table
      let created_by = null
      if (user?.id) {
        console.log('🔍 Looking for employee with user_id:', user.id)
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (employeeError) {
          console.log('🔍 Employee not found or error:', employeeError)
        } else {
          console.log('🔍 Employee found:', employee)
          created_by = employee.id
        }
      } else {
        console.log('🔍 No user found in auth')
      }
      
      console.log('🔍 Final created_by value:', created_by)
      
      const expenseData = {
        expense_code: formData.expense_code,
        employee_id: formData.employee_id,
        project_id: formData.project_id || null,
        category: formData.category,
        description: formData.description,
        amount: formData.amount,
        currency: formData.currency,
        expense_date: formData.expense_date,
        status: submitType === 'submit' ? 'pending' : 'draft',
        notes: formData.notes,
        receipt_url: formData.receipt_url,
        created_by: created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('🔍 Expense data to send:', expenseData)
      
      // Create expense
      const { data: expenseResult, error: expenseError } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single()
      
      if (expenseError) {
        console.error('❌ Supabase expense error:', expenseError)
        throw expenseError
      }
      
      console.log('🔍 Expense created successfully:', expenseResult)
      alert(`Chi phí đã được ${submitType === 'submit' ? 'gửi duyệt' : 'lưu nháp'} thành công!`)
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('❌ Error creating expense:', error)
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
      category: 'other',
      description: '',
      amount: 0,
      currency: 'VND',
      expense_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: '',
      receipt_url: '',
      created_by: ''
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'travel':
        return <Building2 className="h-4 w-4" />
      case 'meals':
        return <CreditCard className="h-4 w-4" />
      case 'accommodation':
        return <Building2 className="h-4 w-4" />
      case 'transportation':
        return <Banknote className="h-4 w-4" />
      case 'supplies':
        return <Receipt className="h-4 w-4" />
      case 'equipment':
        return <FileCheck className="h-4 w-4" />
      case 'training':
        return <User className="h-4 w-4" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'travel':
        return 'Đi công tác'
      case 'meals':
        return 'Ăn uống'
      case 'accommodation':
        return 'Lưu trú'
      case 'transportation':
        return 'Vận chuyển'
      case 'supplies':
        return 'Vật tư'
      case 'equipment':
        return 'Thiết bị'
      case 'training':
        return 'Đào tạo'
      case 'other':
        return 'Khác'
      default:
        return category
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Invisible backdrop for click detection - no visual blocking */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Panel - No visual backdrop to not block interface */}
      <div className={`fixed top-0 right-0 h-full w-[1200px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <div className="flex items-center">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
              <Receipt className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Tạo chi phí mới</h2>
              <p className="text-orange-100 mt-1">Ghi nhận và quản lý chi phí của nhân viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 relative">
          {/* Scroll indicator */}
          <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm border">
            Cuộn để xem thêm
          </div>
          
          {/* Basic Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('basic')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-orange-600" />
                Thông tin cơ bản
              </h3>
              {expandedSections.basic ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.basic && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Mã chi phí</label>
                    <input
                      type="text"
                      value={formData.expense_code}
                      onChange={(e) => setFormData({ ...formData, expense_code: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="EXP-20241225-ABC123"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Nhân viên</label>
                    {loading ? (
                      <div className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-gray-50">
                        <span className="text-xs text-gray-500">Đang tải...</span>
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
                            {employee.name} {employee.email ? `(${employee.email})` : ''}
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
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Tiền tệ</label>
                    <select
                      value={formData.currency || 'VND'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Ngày chi phí</label>
                    <input
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Trạng thái</label>
                    <select
                      value={formData.status || 'pending'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="draft">Nháp</option>
                      <option value="pending">Chờ duyệt</option>
                      <option value="approved">Đã duyệt</option>
                      <option value="rejected">Từ chối</option>
                      <option value="paid">Đã thanh toán</option>
                    </select>
                  </div>
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
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-indigo-600" />
                Chi tiết chi phí
              </h3>
              {expandedSections.details ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.details && (
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Loại chi phí</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'travel', label: 'Đi công tác', icon: <Building2 className="h-4 w-4" /> },
                      { value: 'meals', label: 'Ăn uống', icon: <CreditCard className="h-4 w-4" /> },
                      { value: 'accommodation', label: 'Lưu trú', icon: <Building2 className="h-4 w-4" /> },
                      { value: 'transportation', label: 'Vận chuyển', icon: <Banknote className="h-4 w-4" /> },
                      { value: 'supplies', label: 'Vật tư', icon: <Receipt className="h-4 w-4" /> },
                      { value: 'equipment', label: 'Thiết bị', icon: <FileCheck className="h-4 w-4" /> },
                      { value: 'training', label: 'Đào tạo', icon: <User className="h-4 w-4" /> },
                      { value: 'other', label: 'Khác', icon: <Receipt className="h-4 w-4" /> }
                    ].map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: category.value })}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          formData.category === category.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {category.icon}
                        </div>
                        <div className="text-xs font-medium">{category.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Mô tả chi phí</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    placeholder="Mô tả chi tiết về chi phí này..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1">Số tiền</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="0"
                        min="0"
                        step="1000"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        {formData.currency}
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-black">Tổng chi phí:</span>
                      <span className="text-lg font-bold text-orange-600">
                        {formatCurrency(formData.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('attachments')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Paperclip className="h-5 w-5 mr-2 text-purple-600" />
                Tài liệu đính kèm
              </h3>
              {expandedSections.attachments ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.attachments && (
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">URL hóa đơn/chứng từ</label>
                  <input
                    type="url"
                    value={formData.receipt_url}
                    onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="https://example.com/receipt.pdf"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Đính kèm link đến hóa đơn, chứng từ hoặc hình ảnh
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Kéo thả file hoặc click để chọn</p>
                  <button className="text-xs text-orange-600 hover:text-orange-700">
                    Chọn file
                  </button>
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
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-purple-600" />
                Thông tin bổ sung
              </h3>
              {expandedSections.additional ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.additional && (
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="Ghi chú thêm về chi phí này..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 p-6">
          <button
            type="button"
            onClick={() => handleSubmit('submit')}
            disabled={submitting || !formData.employee_id || !formData.description || formData.amount <= 0}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang tạo...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Gửi duyệt
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={submitting || !formData.employee_id || !formData.description || formData.amount <= 0}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu nháp
          </button>
          
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </>
  )
}

