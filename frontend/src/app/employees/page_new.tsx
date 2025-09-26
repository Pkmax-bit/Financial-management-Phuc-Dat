'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Building2,
  Mail,
  Calendar,
  DollarSign
} from 'lucide-react'
import { Employee } from '@/types'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import CreateEmployeeModal from '@/components/employees/CreateEmployeeModal'
import DepartmentModal from '@/components/employees/DepartmentModal'
import { apiGet } from '@/lib/api'

// Temporary DepartmentManager component
function DepartmentManager() {
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Quản lý phòng ban</h3>
          <p className="text-sm text-gray-500">Tạo và quản lý các phòng ban trong công ty</p>
        </div>
        <button 
          onClick={() => setShowDepartmentModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo phòng ban
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">Danh sách phòng ban</h4>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500">Chức năng quản lý phòng ban sẽ được phát triển trong tương lai.</p>
        </div>
      </div>

      {showDepartmentModal && (
        <DepartmentModal 
          isOpen={showDepartmentModal}
          onClose={() => setShowDepartmentModal(false)}
          onSuccess={() => setShowDepartmentModal(false)}
        />
      )}
    </div>
  )
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDepartmentManager, setShowDepartmentManager] = useState(false)
  const [user, setUser] = useState<unknown>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchEmployees()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (userData) {
          setUser(userData)
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          user_id,
          employee_code,
          first_name,
          last_name,
          email,
          phone,
          department_id,
          position_id,
          salary,
          hire_date,
          status,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
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
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'terminated':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động'
      case 'inactive':
        return 'Ngừng hoạt động'
      case 'terminated':
        return 'Đã nghỉ việc'
      default:
        return status
    }
  }

  const handleViewEmployee = (employeeId: string) => {
    console.log('View employee:', employeeId)
    // Navigate to employee detail page
  }

  const handleEditEmployee = (employeeId: string) => {
    console.log('Edit employee:', employeeId)
    // Open edit modal or navigate to edit page
  }

  const handleDeleteEmployee = (employeeId: string) => {
    console.log('Delete employee:', employeeId)
    // Show confirmation dialog and delete
  }

  // Filter and sort employees
  const filteredEmployees = employees
    .filter(employee => {
      const matchesSearch = searchTerm === '' || 
        employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = filterStatus === 'all' || employee.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'salary':
          aValue = a.salary || 0
          bValue = b.salary || 0
          break
        case 'department':
          aValue = a.department_id?.toLowerCase() || ''
          bValue = b.department_id?.toLowerCase() || ''
          break
        case 'hire_date':
          aValue = a.hire_date ? new Date(a.hire_date).getTime() : 0
          bValue = b.hire_date ? new Date(b.hire_date).getTime() : 0
          break
        default:
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user || undefined} onLogout={handleLogout} />

      {/* Main content */}
      <div className="pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Quản lý nhân viên</h2>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Quản lý thông tin nhân viên, phòng ban và chức vụ
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDepartmentManager(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Quản lý phòng ban
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm nhân viên
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Tổng nhân viên</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredEmployees.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Nhân viên hoạt động</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredEmployees.filter(e => e.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Tổng lương</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(filteredEmployees.reduce((sum, e) => sum + (e.salary || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Phòng ban</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(filteredEmployees.map(e => e.department_id).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                  <option value="terminated">Đã nghỉ việc</option>
                </select>
                
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field)
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name-asc">Tên (A-Z)</option>
                  <option value="name-desc">Tên (Z-A)</option>
                  <option value="department-asc">Phòng ban (A-Z)</option>
                  <option value="department-desc">Phòng ban (Z-A)</option>
                  <option value="salary-desc">Lương (Cao nhất)</option>
                  <option value="salary-asc">Lương (Thấp nhất)</option>
                  <option value="hire_date-desc">Mới nhất</option>
                  <option value="hire_date-asc">Cũ nhất</option>
                </select>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nhân viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chức vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lương
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày vào làm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {employee.first_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500">Mã: {employee.employee_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              {employee.email}
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center mt-1">
                              <span className="h-3 w-3 mr-1 text-gray-400">📞</span>
                              {employee.phone}
                            </div>
                          )}
                          {!employee.email && !employee.phone && (
                            <div className="text-sm text-gray-400">—</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{employee.position_id || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{employee.department_id || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.salary ? formatCurrency(employee.salary) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(employee.hire_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                          {getStatusLabel(employee.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewEmployee(employee.id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditEmployee(employee.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Summary */}
            <div className="flex justify-between items-center text-sm text-gray-600 px-6 py-4 border-t border-gray-200">
              <span>Hiển thị {filteredEmployees.length} nhân viên</span>
              <span>
                Tổng lương: {formatCurrency(filteredEmployees.reduce((sum, e) => sum + (e.salary || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEmployeeModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchEmployees}
        />
      )}

      {showDepartmentManager && (
        <DepartmentManager />
      )}
    </div>
  )
}
