'use client'

import { useState, useEffect } from 'react'
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Calendar,
  X,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Building2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { employeeApi } from '@/lib/api'
import CreatePositionModal from './CreatePositionModal'
import PositionModal from './PositionModal'

interface Position {
  id: string
  name: string
  code: string
  description: string | null
  department_id: string | null
  salary_range_min: number | null
  salary_range_max: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  employee_count?: number
  department_name?: string
}

interface PositionManagerProps {
  isOpen: boolean
  onClose: () => void
}

export default function PositionManager({ isOpen, onClose }: PositionManagerProps) {
  const [positions, setPositions] = useState<Position[]>([])
    const [departments, setDepartments] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchPositions()
      fetchDepartments()
    }
  }, [isOpen])

  const fetchDepartments = async () => {
    try {
      const data = await employeeApi.getDepartments()
      setDepartments(data || [])
    } catch (err: unknown) {
      console.error('Error fetching departments:', err)
    }
  }

  const fetchPositions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await employeeApi.getPositions()

      // Get employee count for each position using direct supabase call
      const positionsWithCount = await Promise.all(
        (data || []).map(async (pos) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('position_id', pos.id)
            .eq('status', 'active')
          
          return {
            ...pos,
            employee_count: count || 0,
            department_name: pos.department_name || 'Không xác định'
          }
        })
      )

      setPositions(positionsWithCount)
    } catch (err: unknown) {
      console.error('Error fetching positions:', err)
      setError((err as Error).message || 'Không thể tải danh sách chức vụ')
    } finally {
      setLoading(false)
    }
  }

  const handleEditPosition = (position: Position) => {
    setSelectedPosition(position)
    setShowEditModal(true)
  }

  const handleDeletePosition = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chức vụ "${name}"?`)) {
      try {
        setError(null)
        
        // Check if position has employees
        const { count } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('position_id', id)
        
        if (count && count > 0) {
          alert('Không thể xóa chức vụ có nhân viên. Vui lòng chuyển nhân viên sang chức vụ khác trước.')
          return
        }

        const { error } = await supabase
          .from('positions')
          .delete()
          .eq('id', id)

        if (error) throw error

        alert('Chức vụ đã được xóa thành công!')
        fetchPositions()
      } catch (err: unknown) {
        console.error('Error deleting position:', err)
        alert('Có lỗi xảy ra khi xóa chức vụ: ' + ((err as Error).message || 'Unknown error'))
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredPositions = positions.filter(pos =>
    pos.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pos.description && pos.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalEmployees = positions.reduce((sum, pos) => sum + (pos.employee_count || 0), 0)
  const activePositions = positions.filter(pos => pos.is_active).length
  const avgSalary = positions.length > 0 
    ? positions.reduce((sum, pos) => sum + ((pos.salary_range_min || 0) + (pos.salary_range_max || 0)) / 2, 0) / positions.length
    : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quản lý chức vụ</h2>
            <p className="text-sm text-gray-500 mt-1">Tạo và quản lý các chức vụ trong công ty</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Tổng chức vụ</p>
                  <p className="text-2xl font-bold text-blue-600">{positions.length}</p>
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
                  <p className="text-sm font-medium text-purple-900">Lương trung bình</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(avgSalary)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm chức vụ..."
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
              Tạo chức vụ
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Positions List */}
          <div className="overflow-y-auto max-h-96">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPositions.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'Không tìm thấy chức vụ' : 'Chưa có chức vụ'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Bắt đầu bằng cách tạo chức vụ đầu tiên.'}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo chức vụ đầu tiên
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPositions.map((pos) => (
                  <div
                    key={pos.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{pos.name}</h3>
                            <p className="text-sm text-gray-500">Mã: {pos.code}</p>
                          </div>
                          {!pos.is_active && (
                            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Không hoạt động
                            </span>
                          )}
                        </div>
                        {pos.description && (
                          <p className="mt-1 text-sm text-gray-600">{pos.description}</p>
                        )}
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <Building2 className="h-4 w-4 mr-1" />
                            {pos.department_name}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            {pos.employee_count || 0} nhân viên
                          </div>
                        </div>
                        {pos.salary_range_min && pos.salary_range_max && (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatCurrency(pos.salary_range_min)} - {formatCurrency(pos.salary_range_max)}
                          </div>
                        )}
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          Tạo ngày {formatDate(pos.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditPosition(pos)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Sửa chức vụ"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePosition(pos.id, pos.name)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Xóa chức vụ"
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

      {/* Create Position Modal */}
      <CreatePositionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchPositions()
          setShowCreateModal(false)
        }}
      />

      {/* Edit Position Modal */}
      <PositionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedPosition(null)
        }}
        onSuccess={() => {
          fetchPositions()
          setShowEditModal(false)
          setSelectedPosition(null)
        }}
        position={selectedPosition}
        isEdit={true}
      />
    </div>
  )
}
