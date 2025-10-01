'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  UserPlus,
  Eye,
  EyeOff,
  Building2,
  Briefcase
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { employeeApi } from '@/lib/api'

interface Department {
  id: string
  name: string
  code: string
}

interface Position {
  id: string
  name: string
  code: string
  department_id?: string
}

interface CreateEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateEmployeeModal({ isOpen, onClose, onSuccess }: CreateEmployeeModalProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data - simplified
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    position_id: '',
    hire_date: new Date().toISOString().split('T')[0], // Add hire_date
    password: '123456' // Default password
  })

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
      fetchPositions()
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
      const data = await employeeApi.getDepartments()
      setDepartments(data || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchPositions = async () => {
    try {
      const data = await employeeApi.getPositions()
      setPositions(data || [])
      setFilteredPositions(data || [])
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  // Generate employee code
  const generateEmployeeCode = () => {
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `EMP${timestamp}${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (!formData.hire_date) {
      setError('Ngày vào làm là bắt buộc')
      return
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    try {
      setSubmitting(true)

      // Prepare employee data for API
      const employeeData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        department_id: formData.department_id || undefined,
        position_id: formData.position_id || undefined,
        hire_date: formData.hire_date,
        employee_code: generateEmployeeCode()
      }

      console.log('Creating employee via API with data:', employeeData)

      // Use API to create employee
      const result = await employeeApi.createEmployee(employeeData)
      
      console.log('Employee created successfully via API:', result)
      
      // Show success message with password info
      alert(`Nhân viên đã được tạo thành công!\n\nThông tin nhân viên:\nMã nhân viên: ${result.employee_code || employeeData.employee_code}\nEmail: ${formData.email}\nMật khẩu mặc định: ${formData.password}\n\nVui lòng thông báo cho nhân viên thay đổi mật khẩu sau lần đăng nhập đầu tiên.`)
      
      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      console.error('Error creating employee:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Email already exists')) {
        setError('Email này đã được sử dụng. Vui lòng chọn email khác.')
      } else if (error.message?.includes('Employee code already exists')) {
        setError('Mã nhân viên đã tồn tại. Vui lòng thử lại.')
      } else if (error.message?.includes('Invalid email')) {
        setError('Email không hợp lệ. Vui lòng kiểm tra lại.')
      } else if (error.message?.includes('Password should be at least')) {
        setError('Mật khẩu phải có ít nhất 6 ký tự.')
      } else if (error.message?.includes('not-null constraint')) {
        setError('Thiếu thông tin bắt buộc. Vui lòng kiểm tra lại form.')
      } else if (error.message?.includes('foreign key constraint')) {
        setError('Có lỗi xảy ra với dữ liệu liên kết. Vui lòng thử lại.')
      } else if (error.message?.includes('Failed to create user account')) {
        setError('Không thể tạo tài khoản người dùng. Vui lòng thử lại.')
      } else {
        setError(error.message || 'Có lỗi xảy ra khi tạo nhân viên')
      }
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
      password: '123456'
    })
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-2xl">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tạo nhân viên mới</h2>
            <p className="text-sm font-semibold text-gray-700">Thêm nhân viên vào hệ thống</p>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            disabled={submitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  <User className="h-4 w-4 inline mr-2 text-blue-600" />
                  Họ *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                  placeholder="Nhập họ..."
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  <User className="h-4 w-4 inline mr-2 text-blue-600" />
                  Tên *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                  placeholder="Nhập tên..."
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  <Mail className="h-4 w-4 inline mr-2 text-green-600" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-semibold placeholder-gray-500"
                  placeholder="Nhập email..."
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  <Phone className="h-4 w-4 inline mr-2 text-purple-600" />
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold placeholder-gray-500"
                  placeholder="Nhập số điện thoại..."
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin công việc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  <Building2 className="h-4 w-4 inline mr-2 text-blue-600" />
                  Phòng ban
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold"
                  disabled={submitting}
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  <Briefcase className="h-4 w-4 inline mr-2 text-green-600" />
                  Chức vụ
                </label>
                <select
                  value={formData.position_id}
                  onChange={(e) => setFormData({...formData, position_id: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-semibold"
                  disabled={!formData.department_id || submitting}
                >
                  <option value="">Chọn chức vụ</option>
                  {filteredPositions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name} ({pos.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hidden hire_date field */}
              <div className="hidden">
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Employee Code Display */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Mã nhân viên</h3>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <User className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Mã nhân viên sẽ được tạo tự động khi tạo tài khoản.
                  </p>
                  <p className="text-xs text-gray-700 mt-1 font-medium">
                    Mã nhân viên: <span className="text-green-600 font-bold">{generateEmployeeCode()}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Login Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin đăng nhập</h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Tài khoản đăng nhập sẽ được tạo tự động với email và mật khẩu mặc định.
                  </p>
                  <p className="text-xs text-gray-700 mt-1 font-medium">
                    Nhân viên nên thay đổi mật khẩu sau lần đăng nhập đầu tiên.
                  </p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    ⚠️ Mật khẩu phải có ít nhất 6 ký tự.
                  </p>
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✅ Hệ thống sẽ tự động tạo bản ghi người dùng và nhân viên.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Email đăng nhập
                </label>
                <input
                  type="text"
                  value={formData.email}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Mật khẩu mặc định
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold"
                    minLength={6}
                    placeholder="Nhập mật khẩu (ít nhất 6 ký tự)..."
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={submitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-black" />
                    ) : (
                      <Eye className="h-4 w-4 text-black" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
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
