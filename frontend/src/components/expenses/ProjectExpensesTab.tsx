'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Target,
  BarChart3
} from 'lucide-react'
import CreateProjectExpenseModal from './CreateProjectExpenseModal'

interface ProjectExpense {
  id: string
  project_id: string
  project_name: string
  project_code: string
  planned_amount: number
  actual_amount: number
  variance: number
  variance_percentage: number
  category: 'planned' | 'actual'
  description: string
  expense_date: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

interface ProjectExpensesTabProps {
  searchTerm: string
  onCreateExpense: () => void
  shouldOpenCreateModal?: boolean
}

export default function ProjectExpensesTab({ searchTerm, onCreateExpense, shouldOpenCreateModal }: ProjectExpensesTabProps) {
  const [expenses, setExpenses] = useState<ProjectExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'planned' | 'actual'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchProjectExpenses()
  }, [])

  useEffect(() => {
    if (shouldOpenCreateModal) {
      setShowCreateModal(true)
    }
  }, [shouldOpenCreateModal])

  const fetchProjectExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for now - replace with actual API call
      const mockExpenses: ProjectExpense[] = [
        {
          id: '1',
          project_id: 'proj-001',
          project_name: 'Dự án Website',
          project_code: 'WEB-2024',
          planned_amount: 5000000,
          actual_amount: 4500000,
          variance: -500000,
          variance_percentage: -10,
          category: 'planned',
          description: 'Chi phí phát triển website',
          expense_date: '2024-12-01',
          status: 'approved',
          created_at: '2024-12-01T09:00:00Z',
          updated_at: '2024-12-01T09:00:00Z'
        },
        {
          id: '2',
          project_id: 'proj-001',
          project_name: 'Dự án Website',
          project_code: 'WEB-2024',
          planned_amount: 0,
          actual_amount: 3200000,
          variance: 3200000,
          variance_percentage: 100,
          category: 'actual',
          description: 'Chi phí thực tế phát triển',
          expense_date: '2024-12-01',
          status: 'approved',
          created_at: '2024-12-01T10:00:00Z',
          updated_at: '2024-12-01T10:00:00Z'
        },
        {
          id: '3',
          project_id: 'proj-002',
          project_name: 'Dự án Mobile App',
          project_code: 'MOB-2024',
          planned_amount: 8000000,
          actual_amount: 0,
          variance: -8000000,
          variance_percentage: -100,
          category: 'planned',
          description: 'Chi phí kế hoạch mobile app',
          expense_date: '2024-12-01',
          status: 'pending',
          created_at: '2024-12-01T11:00:00Z',
          updated_at: '2024-12-01T11:00:00Z'
        }
      ]
      
      setExpenses(mockExpenses)
    } catch (error) {
      console.error('Error fetching project expenses:', error)
      setError('Không thể tải chi phí dự án')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt'
      case 'pending': return 'Chờ duyệt'
      case 'rejected': return 'Từ chối'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600'
    if (variance < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4" />
    if (variance < 0) return <TrendingDown className="h-4 w-4" />
    return <BarChart3 className="h-4 w-4" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const handleCreateExpense = () => {
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
  }

  const handleCreateSuccess = () => {
    fetchProjectExpenses()
    setShowCreateModal(false)
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesView = viewMode === 'all' || expense.category === viewMode
    
    return matchesSearch && matchesView
  })

  // Calculate summary statistics
  const totalPlanned = expenses.filter(e => e.category === 'planned').reduce((sum, e) => sum + e.planned_amount, 0)
  const totalActual = expenses.filter(e => e.category === 'actual').reduce((sum, e) => sum + e.actual_amount, 0)
  const totalVariance = totalActual - totalPlanned
  const variancePercentage = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Kế hoạch</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalPlanned)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Thực tế</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalActual)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Chênh lệch</p>
              <p className={`text-lg font-bold ${getVarianceColor(totalVariance)}`}>
                {formatCurrency(totalVariance)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-500">
              {getVarianceIcon(totalVariance)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tỷ lệ %</p>
              <p className={`text-lg font-bold ${getVarianceColor(totalVariance)}`}>
                {variancePercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setViewMode('all')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            viewMode === 'all' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setViewMode('planned')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            viewMode === 'planned' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Kế hoạch
        </button>
        <button
          onClick={() => setViewMode('actual')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            viewMode === 'actual' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Thực tế
        </button>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải chi phí dự án...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProjectExpenses}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có chi phí dự án nào</h3>
          <p className="text-gray-600 mb-4">Bắt đầu bằng cách thêm chi phí dự án đầu tiên</p>
          <button
            onClick={handleCreateExpense}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm chi phí dự án</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dự án
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kế hoạch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thực tế
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chênh lệch
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
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {expense.project_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {expense.project_code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      expense.category === 'planned' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {expense.category === 'planned' ? 'Kế hoạch' : 'Thực tế'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(expense.planned_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(expense.actual_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm ${getVarianceColor(expense.variance)}`}>
                      {getVarianceIcon(expense.variance)}
                      <span className="ml-1">
                        {formatCurrency(expense.variance)} ({expense.variance_percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                      {getStatusIcon(expense.status)}
                      <span className="ml-1">{getStatusText(expense.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
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
      )}

      {/* Create Project Expense Modal */}
      <CreateProjectExpenseModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
