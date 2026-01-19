'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, Users, Target, Clock, AlertCircle, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { projectApi, customerApi, employeeApi } from '@/lib/api'
import { DatePicker } from '@/components/ui/calendar'

interface Project {
  id: string
  project_code: string
  name: string
  description?: string
  customer_id: string
  customer_name?: string
  manager_id: string
  manager_name?: string
  created_by?: string
  start_date: string
  end_date?: string
  budget?: number
  actual_cost?: number
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  billing_type: 'fixed' | 'hourly' | 'milestone'
  hourly_rate?: number
  created_at: string
  updated_at: string
}

interface Customer {
  id: string
  name: string
  email: string
}

interface Employee {
  id: string
  name: string
  email: string
  user_id?: string
}

interface EditProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  onSuccess: () => void
}

export default function EditProjectSidebar({ isOpen, onClose, project, onSuccess }: EditProjectSidebarProps) {
  const [formData, setFormData] = useState({
    project_code: '',
    name: '',
    description: '',
    customer_id: '',
    manager_id: '',
    start_date: null as Date | null,
    end_date: null as Date | null,
    budget: '',
    status: 'planning' as const,
    priority: 'medium' as const,
    progress: 0,
    billing_type: 'fixed' as const,
    hourly_rate: ''
  })

  const [customers, setCustomers] = useState<Customer[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && project) {
      console.log('📝 Loading project data into form:', project)
      console.log('👤 Project manager_id:', project.manager_id)
      console.log('👤 Project created_by:', project.created_by)

      // Initialize form data
      const initialManagerId = project.manager_id ? String(project.manager_id) : ''
      setFormData({
        project_code: project.project_code || '',
        name: project.name || '',
        description: project.description || '',
        customer_id: project.customer_id || '',
        manager_id: initialManagerId,
        start_date: project.start_date ? new Date(project.start_date) : null,
        end_date: project.end_date ? new Date(project.end_date) : null,
        budget: project.budget?.toString() || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        progress: project.progress || 0,
        billing_type: project.billing_type || 'fixed',
        hourly_rate: project.hourly_rate?.toString() || ''
      })
      console.log('✅ Form data set successfully')
      console.log('👤 Initial form manager_id:', initialManagerId)
    }
  }, [isOpen, project])

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchEmployees()
    }
  }, [isOpen])

  const fetchCustomers = async () => {
    try {
      // Try API first, fallback to Supabase
      try {
        const data = await customerApi.getCustomers()
        setCustomers(data || [])
      } catch (apiError) {
        console.log('API failed, falling back to Supabase:', apiError)
        
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, email')
          .order('name')

        if (error) throw error
        setCustomers(data || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      // Try API first, fallback to Supabase
      try {
        const data = await employeeApi.getEmployees()
        console.log('📋 Employees from API:', data)
        // Map API response to Employee interface format
        const mappedApiEmployees = (data || []).map((emp: any) => ({
          id: emp.id,
          name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
          email: emp.email || '',
          user_id: emp.user_id
        }))
        setEmployees(mappedApiEmployees)
      } catch (apiError) {
        console.log('API failed, falling back to Supabase:', apiError)
        
        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email, employee_code, user_id')
          .order('first_name')

        if (error) throw error
        
        // Map to Employee format with combined name
        const mappedEmployees = (data || []).map((emp: any) => ({
          id: emp.id,
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
          email: emp.email || '',
          employee_code: emp.employee_code,
          user_id: emp.user_id
        }))
        
        console.log('📋 Employees from Supabase:', mappedEmployees)
        console.log('🔍 Employee IDs:', mappedEmployees.map(emp => emp.id))
        setEmployees(mappedEmployees)

        // If no manager is set and we have project data with created_by, try to find the creator's employee
        if (project && !formData.manager_id && project.created_by && mappedEmployees.length > 0) {
          const creatorEmployee = mappedEmployees.find(emp => emp.user_id === project.created_by)
          if (creatorEmployee) {
            console.log('👤 Found creator employee:', creatorEmployee.name, 'Setting as default manager')
            setFormData(prev => ({
              ...prev,
              manager_id: creatorEmployee.id
            }))
          } else {
            console.log('⚠️ Creator employee not found for user_id:', project.created_by)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    setLoading(true)
    setError(null)

    try {
      const updateData = {
        ...formData,
        start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : null,
        end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        progress: Number(formData.progress)
        // Note: Backend will automatically update status based on progress:
        // - progress >= 99.9% -> status = 'completed'
        // - 0% < progress < 100% -> status = 'active'
        // - progress = 0% -> status = 'planning'
        // Database trigger will also handle this automatically
      }

      await projectApi.updateProject(project.id, updateData)
      
      // Dispatch custom event to refresh project data (without reloading page)
      window.dispatchEvent(new CustomEvent('projectUpdated', { 
        detail: { projectId: project.id } 
      }))
      
      // Show success message
      alert('Dự án đã được cập nhật thành công!')
      
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating project:', error)

      // Better error handling for validation errors
      let errorMessage = 'Có lỗi xảy ra khi cập nhật dự án'
      if (error?.response?.data) {
        const errorData = error.response.data
        if (Array.isArray(errorData)) {
          // Handle array of errors
          errorMessage = errorData.map(err =>
            typeof err === 'string' ? err : (err.message || err.detail || JSON.stringify(err))
          ).join(', ')
        } else if (typeof errorData === 'object') {
          if (errorData.detail) {
            errorMessage = errorData.detail
          } else if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.errors) {
            // Handle nested errors object
            errorMessage = Object.values(errorData.errors).flat().join(', ')
          } else {
            // Fallback for other object structures
            errorMessage = Object.values(errorData).map(val =>
              typeof val === 'string' ? val : JSON.stringify(val)
            ).join(', ')
          }
        }
      } else if (error?.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/20" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-[60] transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa dự án</h2>
              <p className="text-sm text-black">Cập nhật thông tin dự án</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="edit-project-form"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Lưu</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-black" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="edit-project-form" onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800 font-semibold">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Mã dự án *
                </label>
                <input
                  type="text"
                  name="project_code"
                  value={formData.project_code}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                    placeholder="VD: PRJ001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Tên dự án *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                  placeholder="Nhập tên dự án"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-black mb-2">
                  Mô tả dự án
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                  placeholder="Mô tả chi tiết về dự án..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Khách hàng *
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                >
                  <option value="">Chọn khách hàng</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Nhân viên * {employees.length > 0 && `(${employees.length} nhân viên)`}
                </label>
                <select
                  key={`manager-${formData.manager_id}-${employees.length}`}
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                >
                  <option value="">
                    {employees.length === 0 ? 'Đang tải nhân viên...' : 'Chọn nhân viên'}
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                {employees.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Không tìm thấy nhân viên. Kiểm tra console để debug.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Ngày bắt đầu *
                </label>
                <DatePicker
                  date={formData.start_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date || null }))}
                  placeholder="Chọn ngày bắt đầu"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Ngày kết thúc
                </label>
                <DatePicker
                  date={formData.end_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, end_date: date || null }))}
                  placeholder="Chọn ngày kết thúc"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Ngân sách (VND)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Tiến độ (%)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                  <input
                    type="number"
                    name="progress"
                    value={formData.progress}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                >
                  <option value="planning">Lập kế hoạch</option>
                  <option value="active">Đang thực hiện</option>
                  <option value="on_hold">Tạm dừng</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Hủy bỏ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Ưu tiên
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Khẩn cấp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Loại thanh toán
                </label>
                <select
                  name="billing_type"
                  value={formData.billing_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                >
                  <option value="fixed">Cố định</option>
                  <option value="hourly">Theo giờ</option>
                  <option value="milestone">Theo mốc</option>
                </select>
              </div>

              {formData.billing_type === 'hourly' && (
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Giá theo giờ (VND/giờ)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                    <input
                      type="number"
                      name="hourly_rate"
                      value={formData.hourly_rate}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Lưu chỉnh sửa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}