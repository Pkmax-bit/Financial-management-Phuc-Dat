'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Save,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
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

interface Employee {
  id: string
  user_id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department_id?: string
  position_id?: string
  hire_date: string
  salary?: number
  status: string
  manager_id?: string
  created_at: string
  updated_at: string
}

interface EditEmployeeSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  employee: Employee | null
}

export default function EditEmployeeSidebar({ isOpen, onClose, onSuccess, employee }: EditEmployeeSidebarProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    position_id: '',
    hire_date: '',
    salary: '',
    status: 'active'
  })

  useEffect(() => {
    if (isOpen && employee) {
      // Populate form with employee data
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department_id: employee.department_id || '',
        position_id: employee.position_id || '',
        hire_date: employee.hire_date || '',
        salary: employee.salary?.toString() || '',
        status: employee.status || 'active'
      })
      
      // Set avatar preview if employee has avatar_url
      const employeeWithAvatar = employee as Employee & { avatar_url?: string }
      if (employeeWithAvatar.avatar_url) {
        setAvatarPreview(employeeWithAvatar.avatar_url)
      } else {
        setAvatarPreview(null)
      }
      setAvatarFile(null)
      
      fetchDepartments()
      fetchPositions()
    }
  }, [isOpen, employee])

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      
      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!employee?.id) {
      setError('Không tìm thấy thông tin nhân viên')
      return
    }

    if (!formData.first_name || !formData.last_name || !formData.email) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (!formData.hire_date) {
      setError('Ngày vào làm là bắt buộc')
      return
    }

    try {
      setSubmitting(true)

      // Prepare update data
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        department_id: formData.department_id || undefined,
        position_id: formData.position_id || undefined,
        hire_date: formData.hire_date,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        status: formData.status
      }

      console.log('Updating employee via API with data:', updateData)

      // Upload avatar if provided
      if (avatarFile) {
        try {
          setUploadingAvatar(true)
          const avatarResult = await employeeApi.uploadAvatar(employee.id, avatarFile)
          console.log('Avatar uploaded successfully:', avatarResult)
          
          // Update employee with avatar_url
          if (avatarResult.url) {
            updateData.avatar_url = avatarResult.url
          }
        } catch (avatarError: any) {
          console.error('Error uploading avatar:', avatarError)
          setError(`Có lỗi khi upload ảnh đại diện: ${avatarError.message}`)
          setUploadingAvatar(false)
          return
        } finally {
          setUploadingAvatar(false)
        }
      }

      // Use API to update employee
      const result = await employeeApi.updateEmployee(employee.id, updateData)
      
      console.log('Employee updated successfully via API:', result)
      
      alert('Thông tin nhân viên đã được cập nhật thành công!')
      
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating employee:', error)
      
      // Handle specific error cases
      if (error.message?.includes('Email already exists')) {
        setError('Email này đã được sử dụng. Vui lòng chọn email khác.')
      } else if (error.message?.includes('Employee code already exists')) {
        setError('Mã nhân viên đã tồn tại. Vui lòng thử lại.')
      } else if (error.message?.includes('Invalid email')) {
        setError('Email không hợp lệ. Vui lòng kiểm tra lại.')
      } else if (error.message?.includes('not-null constraint')) {
        setError('Thiếu thông tin bắt buộc. Vui lòng kiểm tra lại form.')
      } else if (error.message?.includes('foreign key constraint')) {
        setError('Có lỗi xảy ra với dữ liệu liên kết. Vui lòng thử lại.')
      } else {
        setError(error.message || 'Có lỗi xảy ra khi cập nhật nhân viên')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !employee) return null

  return (
    <div className="fixed top-16 right-0 z-50 w-full max-w-2xl h-full">
      <div className="bg-white rounded-l-lg shadow-2xl border border-gray-200 h-full overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa thông tin nhân viên</h2>
            <p className="text-sm font-semibold text-gray-700">
              Cập nhật thông tin cho {employee.first_name} {employee.last_name}
            </p>
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

          {/* Avatar Upload */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ảnh đại diện</h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null)
                        // Reset to original avatar if exists
                        const employeeWithAvatar = employee as Employee & { avatar_url?: string }
                        setAvatarPreview(employeeWithAvatar.avatar_url || null)
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      disabled={submitting || uploadingAvatar}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-300 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Chọn ảnh đại diện (tùy chọn)
                </label>
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  <Upload className="w-4 h-4 mr-2" />
                  {avatarFile ? 'Đổi ảnh' : 'Chọn ảnh'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={submitting || uploadingAvatar}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Hỗ trợ: JPG, PNG, GIF. Kích thước tối đa: 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin cơ bản</h3>
            <div className="space-y-4">
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
            <div className="space-y-4">
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

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2 text-purple-600" />
                  Ngày vào làm *
                </label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-semibold"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-2 text-orange-600" />
                  Lương (VND)
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 font-semibold placeholder-gray-500"
                  placeholder="Nhập lương..."
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Trạng thái</h3>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Trạng thái làm việc
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-semibold"
                disabled={submitting}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
                <option value="terminated">Đã nghỉ việc</option>
                <option value="on_leave">Nghỉ phép</option>
              </select>
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
                    Mã nhân viên: <span className="text-green-600 font-bold">{employee.employee_code}</span>
                  </p>
                  <p className="text-xs text-gray-700 mt-1 font-medium">
                    Mã nhân viên không thể thay đổi sau khi tạo.
                  </p>
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
              disabled={submitting || uploadingAvatar}
            >
              <Save className="h-4 w-4 mr-2" />
              {uploadingAvatar ? 'Đang upload ảnh...' : submitting ? 'Đang cập nhật...' : 'Cập nhật nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
