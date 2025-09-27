'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Clock,
  UserCheck,
  UserX
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

interface EmployeeDetailSidebarProps {
  isOpen: boolean
  onClose: () => void
  onEdit: (employee: Employee) => void
  onDelete: (employeeId: string) => void
  employee: Employee | null
}

export default function EmployeeDetailSidebar({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  employee 
}: EmployeeDetailSidebarProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
      fetchPositions()
    }
  }, [isOpen])

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
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'Chưa phân công'
    const dept = departments.find(d => d.id === departmentId)
    return dept ? `${dept.name} (${dept.code})` : 'Không xác định'
  }

  const getPositionName = (positionId?: string) => {
    if (!positionId) return 'Chưa phân công'
    const pos = positions.find(p => p.id === positionId)
    return pos ? `${pos.name} (${pos.code})` : 'Không xác định'
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Hoạt động',
          color: 'bg-green-100 text-green-800',
          icon: UserCheck
        }
      case 'inactive':
        return {
          label: 'Ngừng hoạt động',
          color: 'bg-gray-100 text-gray-800',
          icon: UserX
        }
      case 'terminated':
        return {
          label: 'Đã nghỉ việc',
          color: 'bg-red-100 text-red-800',
          icon: UserX
        }
      case 'on_leave':
        return {
          label: 'Nghỉ phép',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock
        }
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: User
        }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEdit = () => {
    if (employee) {
      onEdit(employee)
      onClose()
    }
  }

  const handleDelete = () => {
    if (employee && window.confirm(`Bạn có chắc chắn muốn xóa nhân viên ${employee.first_name} ${employee.last_name}?\n\nHành động này không thể hoàn tác!`)) {
      onDelete(employee.id)
      onClose()
    }
  }

  if (!isOpen || !employee) return null

  const statusInfo = getStatusInfo(employee.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="fixed top-16 right-0 z-50 w-full max-w-2xl h-full">
      <div className="bg-white rounded-l-lg shadow-2xl border border-gray-200 h-full overflow-y-auto animate-slide-in-right">
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết nhân viên</h2>
            <p className="text-sm font-semibold text-gray-700">
              Thông tin chi tiết về {employee.first_name} {employee.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {employee.first_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-lg text-gray-600">Mã: {employee.employee_code}</p>
                <div className="flex items-center mt-2">
                  <StatusIcon className="h-4 w-4 mr-2" />
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Thông tin cá nhân
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{employee.email}</p>
                  </div>
                </div>
                {employee.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-medium text-gray-900">{employee.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                Thông tin công việc
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phòng ban</p>
                    <p className="font-medium text-gray-900">{getDepartmentName(employee.department_id)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Chức vụ</p>
                    <p className="font-medium text-gray-900">{getPositionName(employee.position_id)}</p>
                  </div>
                </div>
                {employee.salary && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Lương</p>
                      <p className="font-medium text-gray-900">{formatCurrency(employee.salary)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Thông tin tuyển dụng
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Ngày vào làm</p>
                    <p className="font-medium text-gray-900">{formatDate(employee.hire_date)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Trạng thái</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-600" />
                Thông tin hệ thống
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Ngày tạo</p>
                    <p className="font-medium text-gray-900">{formatDateTime(employee.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                    <p className="font-medium text-gray-900">{formatDateTime(employee.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {employee.employee_code}
                </div>
                <div className="text-sm text-gray-600">Mã nhân viên</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {employee.salary ? formatCurrency(employee.salary) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Mức lương</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {statusInfo.label}
                </div>
                <div className="text-sm text-gray-600">Trạng thái</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
