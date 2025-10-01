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
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
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

interface DepartmentManagerSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function DepartmentManagerSidebar({ isOpen, onClose }: DepartmentManagerSidebarProps) {
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
      
      const { data, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          code,
          description,
          budget,
          is_active,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get employee count for each department
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
    } catch (error) {
      console.error('Error fetching departments:', error)
      setError(error instanceof Error ? (error as Error).message : 'Không thể tải danh sách phòng ban')
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
    } catch (error) {
      console.error('Error deleting department:', error)
      alert(error instanceof Error ? (error as Error).message : 'Không thể xóa phòng ban')
    }
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalEmployees = departments.reduce((sum, dept) => sum + (dept.employee_count || 0), 0)
  const totalBudget = departments.reduce((sum, dept) => sum + (dept.budget || 0), 0)
  const activeDepartments = departments.filter(dept => dept.is_active).length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-full max-w-4xl">
      {/* Right Sidebar - No overlay to not block interface */}
      <div className="bg-white shadow-2xl border border-gray-200 rounded-lg max-h-[85vh] overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quản lý phòng ban</h2>
            <p className="text-sm text-black mt-1">Quản lý tất cả phòng ban trong công ty</p>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-black p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Tổng phòng ban</p>
                  <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Tổng nhân viên</p>
                  <p className="text-2xl font-bold text-green-600">{totalEmployees}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-purple-600">{activeDepartments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo phòng ban mới
            </button>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
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
              <p className="mt-2 text-black">Đang tải...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDepartments.length === 0 ? (
                <div className="text-center py-8 text-black">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>Không có phòng ban nào</p>
                </div>
              ) : (
                filteredDepartments.map((department) => (
                  <div key={department.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {department.name}
                            </h3>
                            <span className="text-sm text-black font-mono">
                              {department.code}
                            </span>
                          </div>
                          
                          {department.description && (
                            <p className="text-sm text-black mt-1 line-clamp-2">
                              {department.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center text-sm text-black">
                              <Users className="h-4 w-4 mr-1" />
                              {department.employee_count || 0} nhân viên
                            </div>
                            
                            {department.budget && (
                              <div className="flex items-center text-sm text-black">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {formatCurrency(department.budget)}
                              </div>
                            )}
                            
                            <div className="flex items-center text-sm text-black">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(department.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          department.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {department.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
                        
                        <button
                          onClick={() => {
                            setSelectedDepartment(department)
                            setShowEditModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(department.id)}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-black">
            <span>Tổng cộng {filteredDepartments.length} phòng ban</span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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