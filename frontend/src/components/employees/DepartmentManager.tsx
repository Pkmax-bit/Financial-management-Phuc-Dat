'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Calendar,
  X,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { employeeApi } from '@/lib/api'
import CreateDepartmentModal from './CreateDepartmentModal'
import DepartmentModal from './DepartmentModal'

interface Department {
  id: string
  name: string
  code: string
  description: string | null
  budget: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  employee_count?: number
}

interface DepartmentManagerProps {
  isOpen: boolean
  onClose: () => void
}

export default function DepartmentManager({ isOpen, onClose }: DepartmentManagerProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
    }
  }, [isOpen])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await employeeApi.getDepartments()
      
      // Get employee count for each department using direct supabase call
      const departmentsWithCount = await Promise.all(
        (data || []).map(async (dept) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id)
          
          return {
            ...dept,
            employee_count: count || 0
          }
        })
      )

      setDepartments(departmentsWithCount)
    } catch (error: unknown) {
      console.error('Error fetching departments:', error)
      setError((error as Error).message || 'Không thể tải danh sách phòng ban')
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (departmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
      return
    }

    try {
      // Check if department has employees
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', departmentId)

      if (count && count > 0) {
        alert(`Không thể xóa phòng ban này vì có ${count} nhân viên. Vui lòng chuyển nhân viên sang phòng ban khác trước.`)
        return
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId)

      if (error) throw error
      
      fetchDepartments()
    } catch (error: unknown) {
      console.error('Error deleting department:', error)
      alert((error as Error).message || 'Không thể xóa phòng ban')
    }
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalEmployees = departments.reduce((sum, dept) => sum + (dept.employee_count || 0), 0)
  const totalBudget = departments.reduce((sum, dept) => sum + (dept.budget || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-4xl">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quản lý phòng ban</h2>
            <p className="text-sm text-gray-500 mt-1">Tạo và quản lý các phòng ban trong công ty</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Tổng phòng ban</p>
                  <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Tổng nhân viên</p>
                  <p className="text-2xl font-bold text-green-600">{totalEmployees}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Tổng ngân sách</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalBudget)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo phòng ban mới
            </button>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm phòng ban..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Departments List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phòng ban
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã PB
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhân viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngân sách
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDepartments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          Không có phòng ban nào
                        </td>
                      </tr>
                    ) : (
                      filteredDepartments.map((department) => (
                        <tr key={department.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {department.name}
                                </div>
                                {department.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {department.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {department.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Users className="h-4 w-4 text-gray-400 mr-1" />
                              {department.employee_count || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {department.budget ? formatCurrency(department.budget) : 'Chưa set'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              department.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {department.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedDepartment(department)
                                  setShowEditModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(department.id)}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Create Department Modal */}
      <CreateDepartmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchDepartments()
          setShowCreateModal(false)
        }}
      />

      {/* Edit Department Modal */}
      <DepartmentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedDepartment(null)
        }}
        onSuccess={() => {
          fetchDepartments()
          setShowEditModal(false)
          setSelectedDepartment(null)
        }}
        department={selectedDepartment}
        isEdit={true}
      />
    </div>
  )
}