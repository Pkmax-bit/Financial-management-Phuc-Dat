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

export default function PositionManagerSidebar({ isOpen, onClose }: PositionManagerProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchPositions()
    }
  }, [isOpen])

  const fetchPositions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('positions')
        .select(`
          id,
          name,
          code,
          description,
          department_id,
          salary_range_min,
          salary_range_max,
          is_active,
          created_at,
          updated_at,
          departments(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get employee count for each position
      const positionsWithCount = await Promise.all(
        (data || []).map(async (pos) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('position_id', pos.id)
          
          return {
            ...pos,
            employee_count: count || 0,
            department_name: (pos.departments as { name?: string })?.name || 'Chưa phân bổ'
          }
        })
      )

      setPositions(positionsWithCount)
    } catch (error: unknown) {
      console.error('Error fetching positions:', error)
      setError((error as Error).message || 'Không thể tải danh sách chức vụ')
      setPositions([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (positionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chức vụ này?')) {
      return
    }

    try {
      // Check if position has employees
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('position_id', positionId)

      if (count && count > 0) {
        alert(`Không thể xóa chức vụ này vì có ${count} nhân viên. Vui lòng chuyển nhân viên sang chức vụ khác trước.`)
        return
      }

      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', positionId)

      if (error) throw error
      
      fetchPositions()
    } catch (error: unknown) {
      console.error('Error deleting position:', error)
      alert((error as Error).message || 'Không thể xóa chức vụ')
    }
  }

  const filteredPositions = positions.filter(pos =>
    pos.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalEmployees = positions.reduce((sum, pos) => sum + (pos.employee_count || 0), 0)
  const avgSalaryMin = positions.length > 0 ? 
    positions.reduce((sum, pos) => sum + (pos.salary_range_min || 0), 0) / positions.length : 0
  const avgSalaryMax = positions.length > 0 ? 
    positions.reduce((sum, pos) => sum + (pos.salary_range_max || 0), 0) / positions.length : 0

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
            <h2 className="text-xl font-semibold text-gray-900">Quản lý chức vụ</h2>
            <p className="text-sm text-black mt-1">Tạo và quản lý các chức vụ trong công ty</p>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-black p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Tổng chức vụ</p>
                  <p className="text-2xl font-bold text-purple-600">{positions.length}</p>
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
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Lương TB</p>
                  <p className="text-lg font-bold text-blue-600">
                    {avgSalaryMin > 0 && avgSalaryMax > 0 ? 
                      `${formatCurrency(avgSalaryMin)} - ${formatCurrency(avgSalaryMax)}` : 
                      'Chưa set'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo chức vụ mới
            </button>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm chức vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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

          {/* Positions List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-black">Đang tải...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Chức vụ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Mã CV
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Phòng ban
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Nhân viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Mức lương
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPositions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-black">
                          Không có chức vụ nào
                        </td>
                      </tr>
                    ) : (
                      filteredPositions.map((position) => (
                        <tr key={position.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Briefcase className="h-5 w-5 text-black mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {position.name}
                                </div>
                                {position.description && (
                                  <div className="text-sm text-black truncate max-w-xs">
                                    {position.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {position.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Building2 className="h-4 w-4 text-black mr-1" />
                              {position.department_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Users className="h-4 w-4 text-black mr-1" />
                              {position.employee_count || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {position.salary_range_min && position.salary_range_max ? 
                              `${formatCurrency(position.salary_range_min)} - ${formatCurrency(position.salary_range_max)}` : 
                              'Chưa set'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              position.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {position.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedPosition(position)
                                  setShowEditModal(true)
                                }}
                                className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(position.id)}
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
    </div>
  )
}