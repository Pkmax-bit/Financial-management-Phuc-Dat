'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  Building2,
  Briefcase,
  
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'

interface Department {
  id: string
  name: string
  description?: string
}

interface Position {
  id: string
  title: string
  description?: string
  department_id?: string
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
}

interface CreateEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateEmployeeModal({ isOpen, onClose, onSuccess }: CreateEmployeeModalProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [managers, setManagers] = useState<Employee[]>([])
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    position_id: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary: '',
    manager_id: '',
    password: '123456' // Default password
  })

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
      fetchPositions()
      fetchManagers()
    }
  }, [isOpen])

  useEffect(() => {
    // Filter positions by selected department
    if (formData.department_id) {
      const filtered = positions.filter(pos => pos.department_id === formData.department_id)
      setFilteredPositions(filtered)
      
      // Reset position if current selection is not in the filtered list
      if (formData.position_id && !filtered.find(pos => pos.id === formData.position_id)) {
        setFormData(prev => ({ ...prev, position_id: '' }))
      }
    } else {
      setFilteredPositions(positions)
    }
  }, [formData.department_id, positions])

  const fetchDepartments = async () => {
    try {
      const data = await apiGet('/api/employees/departments/')
      setDepartments(data)
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchPositions = async () => {
    try {
      const data = await apiGet('/api/employees/positions/')
      setPositions(data)
      setFilteredPositions(data)
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const fetchManagers = async () => {
    try {
      const data = await apiGet('/api/employees/')
      // Filter only active employees who can be managers
      const activeEmployees = data.filter((emp: unknown) => (emp as { status: string }).status === 'active')
      setManagers(activeEmployees)
    } catch (error) {
      console.error('Error fetching managers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.hire_date) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    try {
      setSubmitting(true)

      const employeeData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        department_id: formData.department_id || null,
        position_id: formData.position_id || null,
        hire_date: formData.hire_date,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        manager_id: formData.manager_id || null,
        password: formData.password
      }

      await apiPost('/api/employees/', employeeData)
      
      // Show success message with password info
      alert(`Nhân viên đã được tạo thành công!\n\nThông tin đăng nhập:\nEmail: ${formData.email}\nMật khẩu mặc định: ${formData.password}\n\nVui lòng thông báo cho nhân viên thay đổi mật khẩu sau lần đăng nhập đầu tiên.`)
      
      onSuccess()
      onClose()
      resetForm()
    } catch (error: unknown) {
      console.error('Error creating employee:', error)
      alert('Có lỗi xảy ra khi tạo nhân viên: ' + ((error as Error).message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department_id: '',
      position_id: '',
      hire_date: new Date().toISOString().split('T')[0],
      salary: '',
      manager_id: '',
      password: '123456'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-4xl">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tạo nhân viên mới</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={submitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Họ *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Tên *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin công việc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Phòng ban
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Chức vụ
                </label>
                <select
                  value={formData.position_id}
                  onChange={(e) => setFormData({...formData, position_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={!formData.department_id}
                >
                  <option value="">Chọn chức vụ</option>
                  {filteredPositions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Ngày vào làm *
                </label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Mức lương (VND)
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  min="0"
                  step="100000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Quản lý trực tiếp
                </label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Chọn quản lý</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Login Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin đăng nhập</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Tài khoản đăng nhập sẽ được tạo tự động với email và mật khẩu mặc định.
                    Nhân viên nên thay đổi mật khẩu sau lần đăng nhập đầu tiên.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email đăng nhập
                </label>
                <input
                  type="text"
                  value={formData.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mặc định
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              disabled={submitting}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {submitting ? 'Đang tạo...' : 'Tạo nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
