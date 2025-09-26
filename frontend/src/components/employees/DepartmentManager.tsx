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
  X
} from 'lucide-react'
import { apiGet, apiDelete } from '@/lib/api'
import CreateDepartmentModal from './CreateDepartmentModal'

interface Department {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export default function DepartmentManager() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/employees/departments/')
      setDepartments(data || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng ban "${name}"?`)) {
      try {
        await apiDelete(`/api/employees/departments/${id}`)
        alert('Phòng ban đã được xóa thành công!')
        fetchDepartments()
      } catch (error: any) {
        console.error('Error deleting department:', error)
        alert('Có lỗi xảy ra khi xóa phòng ban: ' + (error.message || 'Unknown error'))
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
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

        <div className="p-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng ban..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo phòng ban
            </button>
          </div>

          {/* Departments List */}
          <div className="overflow-y-auto max-h-96">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'Không tìm thấy phòng ban' : 'Chưa có phòng ban'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Bắt đầu bằng cách tạo phòng ban đầu tiên.'}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo phòng ban đầu tiên
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="text-lg font-medium text-gray-900">{dept.name}</h3>
                        </div>
                        {dept.description && (
                          <p className="mt-1 text-sm text-gray-600">{dept.description}</p>
                        )}
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          Tạo ngày {formatDate(dept.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Sửa phòng ban"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Xóa phòng ban"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
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
    </div>
  )
}