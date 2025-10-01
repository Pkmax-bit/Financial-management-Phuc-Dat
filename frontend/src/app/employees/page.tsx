'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Building2,
  Briefcase,
  Mail,
  DollarSign
} from 'lucide-react'
import { Employee } from '@/types'
import { supabase } from '@/lib/supabase'
import { employeeApi } from '@/lib/api'
import Navigation from '@/components/Navigation'
import CreateEmployeeModal from '@/components/employees/CreateEmployeeModal'
import EditEmployeeSidebar from '@/components/employees/EditEmployeeSidebar'
import EmployeeDetailSidebar from '@/components/employees/EmployeeDetailSidebar'

import DepartmentManagerSidebar from '@/components/employees/DepartmentManagerSidebar'
import CreateDepartmentModalSidebar from '@/components/employees/CreateDepartmentModalSidebar'
import PositionManager from '@/components/employees/PositionManager'
import PositionManagerSidebar from '@/components/employees/PositionManagerSidebar'
import DepartmentSidebar from '@/components/employees/DepartmentSidebar'
import PositionSidebar from '@/components/employees/PositionSidebar'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditSidebar, setShowEditSidebar] = useState(false)
  const [showDetailSidebar, setShowDetailSidebar] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const [showPositionManager, setShowPositionManager] = useState(false)
  const [showDepartmentSidebar, setShowDepartmentSidebar] = useState(false)
  const [showPositionSidebar, setShowPositionSidebar] = useState(false)
  // New sidebar states
  const [showDepartmentManagerSidebar, setShowDepartmentManagerSidebar] = useState(false)
  const [showCreateDepartmentSidebar, setShowCreateDepartmentSidebar] = useState(false)
  const [showPositionManagerSidebar, setShowPositionManagerSidebar] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
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
          // Fetch employees after user is set
          fetchEmployees()
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const fetchEmployees = async () => {
    try {
      setError(null)
      console.log('Fetching employees...')
      
      // Try authenticated endpoint first
      try {
      const data = await employeeApi.getEmployees()
      setEmployees(Array.isArray(data) ? data.map(emp => ({
        ...emp,
        status: emp.status as 'active' | 'inactive' | 'terminated' | 'on_leave'
      })) : [])
        console.log('Successfully fetched employees via authenticated API:', data?.length || 0)
        return
      } catch (authError) {
        console.log('Authenticated API failed, trying public endpoint:', authError)
        
        // Fallback to public endpoint
        try {
          const data = await employeeApi.getEmployeesPublic()
          setEmployees(Array.isArray(data) ? data.map(emp => ({
            ...emp,
            status: emp.status as 'active' | 'inactive' | 'terminated' | 'on_leave'
          })) : [])
          setError('Hiển thị dữ liệu mẫu (chưa đăng nhập)')
          console.log('Successfully fetched employees via public API:', data?.length || 0)
          return
        } catch (publicError) {
          console.log('Public API also failed:', publicError)
          throw publicError
        }
      }
      
    } catch (error: unknown) {
      console.error('Error fetching employees:', error)
      setError(`Lỗi không thể tải danh sách nhân viên: ${(error as Error)?.message || 'Không thể kết nối'}`)
      setEmployees([])
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
    const employee = employees.find(e => e.id === employeeId)
    if (employee) {
      setSelectedEmployee(employee)
      setShowDetailSidebar(true)
    }
  }

  const handleEditEmployee = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    if (employee) {
      setSelectedEmployee(employee)
      setShowEditSidebar(true)
    }
  }

  const handleEditFromDetail = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowEditSidebar(true)
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return

    try {
      if (typeof window !== 'undefined' && 
          window.confirm(`Bạn có chắc chắn muốn xóa nhân viên ${employee.first_name} ${employee.last_name}?\n\nHành động này không thể hoàn tác!`)) {
        console.log('Delete employee:', employeeId)
        
        await employeeApi.deleteEmployee(employeeId)
        console.log('Employee deleted successfully')
        
        // Refresh the employee list
        await fetchEmployees()
        
        // Close any open sidebars
        setShowDetailSidebar(false)
        setShowEditSidebar(false)
        setSelectedEmployee(null)
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      setError(`Có lỗi xảy ra khi xóa nhân viên: ${(error as Error)?.message || 'Không thể xóa nhân viên'}`)
    }
  }

  const handleDeleteFromDetail = (employeeId: string) => {
    handleDeleteEmployee(employeeId)
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Đang tải...</p>
        </div>
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
                <p className="mt-1 text-sm text-black">
                  Quản lý thông tin nhân viên, phòng ban và chức vụ
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      employees.length > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-black">
                      {employees.length > 0 ? `${employees.length} nhân viên` : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                  {user && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs text-black">Đã đăng nhập: {(user as { email?: string })?.email || 'Unknown'}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchEmployees}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { data: { user: authUser } } = await supabase.auth.getUser()
                      
                      console.log('Debug Info:', {
                        authUser: authUser?.email || 'No auth user',
                        userState: (user as { email?: string })?.email || 'No user state'
                      })
                      
                      if (!authUser) {
                        console.log('Attempting login...')
                        const loginResult = await supabase.auth.signInWithPassword({
                          email: 'admin@example.com',
                          password: 'admin123'
                        })
                        
                        if (loginResult.data.session) {
                          console.log('Login successful, reloading...')
                          window.location.reload()
                        } else {
                          console.error('Login failed:', loginResult.error?.message)
                        }
                      }
                    } catch (error) {
                      console.error('Debug error:', error)
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                  {user ? 'Debug Auth' : 'Login & Debug'}
                </button>
                <button
                  onClick={fetchEmployees}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Làm mới
                </button>
            <button
              onClick={() => setShowCreateDepartmentSidebar(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Tạo phòng ban
            </button>
            <button
              onClick={() => setShowPositionSidebar(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Tạo chức vụ
            </button>
            <button
              onClick={() => setShowDepartmentManagerSidebar(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Quản lý phòng ban
                </button>
            <button
              onClick={() => setShowPositionManagerSidebar(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Quản lý chức vụ
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
                  <p className="text-sm font-medium text-black">Tổng nhân viên</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredEmployees.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-black">Nhân viên hoạt động</p>
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
                  <p className="text-sm font-medium text-black">Tổng lương</p>
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
                  <p className="text-sm font-medium text-black">Phòng ban</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(filteredEmployees.map(e => e.department_id).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                  {error.includes('đăng nhập') && (
                    <p className="text-xs text-red-600 mt-1">
                <button
                        onClick={() => router.push('/login')}
                        className="underline hover:no-underline"
                      >
                        Nhấn vào đây để đăng nhập
                </button>
                    </p>
                  )}
                </div>
                <div className="ml-auto pl-3">
                <button
                    onClick={fetchEmployees}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Thử lại
                </button>
                </div>
            </div>
            </div>
          )}

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
                        <Search className="h-5 w-5 text-black" />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Nhân viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Chức vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Lương
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Ngày vào làm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
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
                              <span className="text-sm font-medium text-black">
                                {employee.first_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                                  {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-black">Mã: {employee.employee_code}</div>
                          </div>
                              </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-black" />
                                {employee.email}
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center mt-1">
                              <span className="h-3 w-3 mr-1 text-black">📞</span>
                              {employee.phone}
                              </div>
                          )}
                          {!employee.email && !employee.phone && (
                            <div className="text-sm text-black">—</div>
                                )}
                              </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{employee.position_id || 'N/A'}</div>
                          <div className="text-xs text-black">{employee.department_id || 'N/A'}</div>
                            </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.salary ? formatCurrency(employee.salary) : 'N/A'}
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {formatDate(employee.hire_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                          {getStatusLabel(employee.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
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

              {/* Empty State */}
              {!loading && filteredEmployees.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-black" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Không có nhân viên</h3>
                  <p className="mt-1 text-sm text-black">
                    {employees.length === 0 
                      ? 'Bắt đầu bằng việc tạo nhân viên đầu tiên.' 
                      : 'Không tìm thấy nhân viên nào phù hợp với bộ lọc.'
                    }
                  </p>
                  {employees.length === 0 && (
                    <div className="mt-6">
                <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm nhân viên đầu tiên
                </button>
              </div>
                )}
                </div>
              )}
                  </div>
            
            {/* Summary */}
            <div className="flex justify-between items-center text-sm text-black px-6 py-4 border-t border-gray-200">
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

      {showEditSidebar && selectedEmployee && (
        <EditEmployeeSidebar
          isOpen={showEditSidebar}
          onClose={() => {
            setShowEditSidebar(false)
            setSelectedEmployee(null)
          }}
          onSuccess={fetchEmployees}
          employee={selectedEmployee}
        />
      )}

      {showDetailSidebar && selectedEmployee && (
        <EmployeeDetailSidebar
          isOpen={showDetailSidebar}
          onClose={() => {
            setShowDetailSidebar(false)
            setSelectedEmployee(null)
          }}
          onEdit={handleEditFromDetail}
          onDelete={handleDeleteFromDetail}
          employee={selectedEmployee ? {
            ...selectedEmployee,
            status: selectedEmployee.status as 'active' | 'inactive' | 'terminated' | 'on_leave'
          } : null}
        />
      )}

      {/* Department Manager Modal - Disabled, using sidebar version instead */}
      {/* {showDepartmentManager && (
        <DepartmentManager
          isOpen={showDepartmentManager}
          onClose={() => setShowDepartmentManager(false)}
        />
      )} */}

      {/* Position Manager Modal */}
      {showPositionManager && (
        <PositionManager
          isOpen={showPositionManager}
          onClose={() => setShowPositionManager(false)}
        />
      )}

      {/* Department Sidebar */}
      {showDepartmentSidebar && (
        <DepartmentSidebar
          isOpen={showDepartmentSidebar}
          onClose={() => setShowDepartmentSidebar(false)}
          onSuccess={() => {
            setShowDepartmentSidebar(false)
            // Refresh data if needed
          }}
        />
      )}

      {/* Position Sidebar */}
      {showPositionSidebar && (
        <PositionSidebar
          isOpen={showPositionSidebar}
          onClose={() => setShowPositionSidebar(false)}
          onSuccess={() => {
            setShowPositionSidebar(false)
            // Refresh data if needed
          }}
        />
      )}

      {/* New Right Sidebar Components */}
      {/* Department Manager Sidebar */}
      {showDepartmentManagerSidebar && (
        <DepartmentManagerSidebar
          isOpen={showDepartmentManagerSidebar}
          onClose={() => setShowDepartmentManagerSidebar(false)}
        />
      )}

      {/* Create Department Sidebar */}
      {showCreateDepartmentSidebar && (
        <CreateDepartmentModalSidebar
          isOpen={showCreateDepartmentSidebar}
          onClose={() => setShowCreateDepartmentSidebar(false)}
          onSuccess={() => {
            setShowCreateDepartmentSidebar(false)
            fetchEmployees() // Refresh employees data
          }}
        />
      )}

      {/* Position Manager Sidebar */}
      {showPositionManagerSidebar && (
        <PositionManagerSidebar
          isOpen={showPositionManagerSidebar}
          onClose={() => setShowPositionManagerSidebar(false)}
        />
      )}
    </div>
  )
}
