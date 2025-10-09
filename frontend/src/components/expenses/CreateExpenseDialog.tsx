'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar,
  User,
  DollarSign,
  FileText,
  Save,
  Send,
  Building2,
  Receipt
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Employee {
  id: string
  user_id?: string
  first_name?: string
  last_name?: string
  email?: string
  users?: {
    full_name: string
    email: string
  }
}

// Removed Project interface as we're not using projects anymore

// Removed Vendor interface as we're not using vendors anymore

interface ExpenseCategory {
  id: string
  name: string
  description?: string
  is_active: boolean
}

interface ParentExpense {
  id: string
  expense_code: string
  description: string
  amount: number
}

interface CreateExpenseDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultParentId?: string
  // Edit mode support
  mode?: 'create' | 'edit'
  expense?: {
    id: string
    expense_code: string
    employee_id: string
    description: string
    amount: number
    currency: string
    expense_date: string
    receipt_url?: string
    status: string
    notes?: string
    id_parent?: string | null
    category_id?: string | null
  }
  isLeaf?: boolean
}

export default function CreateExpenseDialog({ isOpen, onClose, onSuccess, defaultParentId, mode = 'create', expense, isLeaf = true }: CreateExpenseDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [parentExpenses, setParentExpenses] = useState<ParentExpense[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    expense_code: '',
    employee_id: '',
    description: '',
    amount: '',
    currency: 'VND',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_url: '',
    status: 'pending',
    notes: '',
    id_parent: '',
    category_id: ''
  })

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      const initializeForm = async () => {
        // Reset form first
        resetForm()
        // Prefill parent id if provided
        if (defaultParentId) {
          setFormData(prev => ({ ...prev, id_parent: defaultParentId }))
        }
        
        // Fetch supporting data
        await Promise.all([
          fetchEmployees(),
          fetchExpenseCategories(),
          fetchParentExpenses(),
        ])
        
        // In edit mode, prefill from expense and skip generating code
        if (mode === 'edit' && expense) {
          setFormData({
            expense_code: expense.expense_code || '',
            employee_id: expense.employee_id || '',
            description: expense.description || '',
            amount: String(expense.amount ?? ''),
            currency: expense.currency || 'VND',
            expense_date: expense.expense_date ? expense.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
            receipt_url: expense.receipt_url || '',
            status: expense.status || 'pending',
            notes: expense.notes || '',
            id_parent: expense.id_parent || '',
            category_id: expense.category_id || ''
          })
        } else {
          // Create mode: generate code
          await generateExpenseCode()
        }
      }
      initializeForm()
    }
  }, [isOpen, defaultParentId, mode, expense])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, 
          user_id,
          first_name,
          last_name,
          email,
          users!employees_user_id_fkey (
            full_name,
            email
          )
        `)
      
      if (error) {
        console.error('Supabase error fetching employees:', error)
        throw error
      }
      
      const sorted = (data || []).sort((a: Employee, b: Employee) =>
        (a.users?.full_name || '').localeCompare(b.users?.full_name || '')
      )
      console.log('Employees fetched successfully:', sorted.length)
      setEmployees(sorted)
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenseCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      setExpenseCategories(data || [])
    } catch (error) {
      console.error('Error fetching expense categories:', error)
    }
  }

  const fetchParentExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, expense_code, description, amount')
        .order('expense_code', { ascending: false })
        .limit(50)
      
      if (error) {
        console.error('Supabase error fetching parent expenses:', error)
        throw error
      }
      
      console.log('Parent expenses fetched successfully:', data?.length || 0)
      setParentExpenses(data || [])
    } catch (error) {
      console.error('Error fetching parent expenses:', error)
    }
  }

  const generateExpenseCode = async () => {
    try {
      setGeneratingCode(true)
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const startOfNextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
      
      // Count expenses created today to create sequential number
      const { count } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay)
        .lt('created_at', startOfNextDay)
      
      const sequenceNumber = (count || 0) + 1
      const paddedSequence = sequenceNumber.toString().padStart(3, '0')
      const generatedCode = `EXP-${dateStr}-${paddedSequence}`
      
      console.log('Generated expense code:', generatedCode)
      
      setFormData(prev => ({
        ...prev,
        expense_code: generatedCode
      }))
      
      return generatedCode
    } catch (error) {
      console.error('Error generating expense code:', error)
      // Fallback to random code
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
      const fallbackCode = `EXP-${dateStr}-${randomStr}`
      
      setFormData(prev => ({
        ...prev,
        expense_code: fallbackCode
      }))
      
      return fallbackCode
    } finally {
      setGeneratingCode(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả chi phí là bắt buộc'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Số tiền phải lớn hơn 0'
    }

    if (!formData.employee_id) {
      newErrors.employee_id = 'Nhân viên là bắt buộc'
    }

    if (!formData.expense_date) {
      newErrors.expense_date = 'Ngày chi phí là bắt buộc'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (saveAsDraft = false) => {
    if (!validateForm()) return

    setSubmitting(true)
    
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        status: saveAsDraft ? 'pending' : 'pending',
        receipt_url: formData.receipt_url || null,
        id_parent: formData.id_parent || null,
        category_id: formData.category_id || null
      }
      if (mode === 'edit' && expense?.id) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expense.id)
        if (error) throw error
      } else {
        // Create new expense
        const { error } = await supabase
          .from('expenses')
          .insert([expenseData])
        if (error) throw error
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Có lỗi xảy ra khi lưu chi phí: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      expense_code: '',
      employee_id: '',
      description: '',
      amount: '',
      currency: 'VND',
      expense_date: new Date().toISOString().split('T')[0],
      receipt_url: '',
      status: 'pending',
      notes: '',
      id_parent: '',
      category_id: ''
    })
    setErrors({})
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-4xl">
      {/* Right Sidebar - No overlay to not block interface */}
      <div className="bg-white shadow-2xl border border-gray-200 rounded-lg max-h-[85vh] overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{mode === 'edit' ? 'Chỉnh sửa chi phí' : 'Tạo chi phí mới'}</h2>
              <p className="text-sm textblack mt-1">{mode === 'edit' ? 'Cập nhật thông tin chi phí' : 'Tạo và quản lý chi phí công ty'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-black hover:text-black p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Mã chi phí</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={formData.expense_code}
                  onChange={(e) => setFormData({ ...formData, expense_code: e.target.value })}
                  className="flex-1 block w-full border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                  placeholder="EXP-20241225-001"
                />
                <button
                  type="button"
                  onClick={generateExpenseCode}
                  disabled={generatingCode}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Tạo mã mới"
                >
                  {generatingCode ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Mã sẽ được tạo tự động theo format: EXP-YYYYMMDD-XXX
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Nhân viên *</label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                required
              >
                <option value="">Chọn nhân viên</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.users?.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.email || employee.id.slice(0,8)}
                  </option>
                ))}
              </select>
              {errors.employee_id && (
                <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
              )}
            </div>



            <div>
              <label className="block text-sm font-semibold text-gray-900">Mô tả chi phí *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                placeholder="Mô tả chi phí..."
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Số tiền *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                placeholder="0"
                min="0"
                step="1000"
                required
                disabled={mode === 'edit' && !isLeaf}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Ngày chi phí *</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                required
              />
              {errors.expense_date && (
                <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Loại chi phí</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Chọn loại chi phí</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Chi phí cha</label>
              <select
                value={formData.id_parent}
                onChange={(e) => setFormData({ ...formData, id_parent: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Chọn chi phí cha (tùy chọn)</option>
                {parentExpenses.map((expense) => (
                  <option key={expense.id} value={expense.id}>
                    {expense.expense_code} - {expense.description} ({formatCurrency(expense.amount)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">URL hóa đơn</label>
              <input
                type="url"
                value={formData.receipt_url}
                onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                placeholder="https://example.com/receipt.pdf"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 gap-6 mt-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Ghi chú</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                rows={3}
                placeholder="Ghi chú thêm về chi phí..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 p-6">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting || !formData.description || !formData.amount || !formData.employee_id}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === 'edit' ? 'Lưu thay đổi' : 'Tạo chi phí'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  )
}
