'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react'
import { budgetingApi } from '@/lib/api'

interface Budget {
  id: string
  budget_name: string
  period: string
  start_date: string
  end_date: string
  total_budget_amount: number
  currency: string
  status: string
  description?: string
  created_by?: string
  created_by_email?: string
  created_by_name?: string
  approved_by?: string
  approved_by_email?: string
  approved_by_name?: string
  approved_at?: string
  created_at: string
  updated_at: string
  line_count: number
  total_actual_amount: number
  total_variance_amount: number
}

interface BudgetStats {
  total_budgets: number
  total_budgeted_amount: number
  total_actual_amount: number
  total_variance_amount: number
  active_budgets: number
  draft_budgets: number
  closed_budgets: number
  by_period: Record<string, number>
  by_status: Record<string, number>
}

export default function BudgetingTab() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [stats, setStats] = useState<BudgetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    fetchBudgets()
    fetchStats()
  }, [])

  const fetchBudgets = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (searchTerm) params.search = searchTerm
      if (filterStatus) params.status = filterStatus
      if (filterPeriod) params.period = filterPeriod
      
      const response = await budgetingApi.getBudgets(params)
      setBudgets(response)
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await budgetingApi.getBudgetStats()
      setStats(response)
    } catch (error) {
      console.error('Error fetching budget stats:', error)
    }
  }

  const handleSearch = () => {
    fetchBudgets()
  }

  const handleFilter = () => {
    fetchBudgets()
  }

  const handleApprove = async (budgetId: string, action: 'approve' | 'close') => {
    try {
      await budgetingApi.approveBudget(budgetId, { action, notes: '' })
      fetchBudgets()
      fetchStats()
    } catch (error) {
      console.error('Error approving budget:', error)
    }
  }

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ngân sách này?')) return
    
    try {
      await budgetingApi.deleteBudget(budgetId)
      fetchBudgets()
      fetchStats()
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const handleViewReport = async (budget: Budget) => {
    setSelectedBudget(budget)
    setShowReportModal(true)
  }

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Nháp'
      case 'active': return 'Hoạt động'
      case 'closed': return 'Đóng'
      default: return status
    }
  }

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'monthly': return 'Hàng tháng'
      case 'quarterly': return 'Hàng quý'
      case 'yearly': return 'Hàng năm'
      default: return period
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Ngân sách</h2>
          <p className="text-black">Thiết lập và theo dõi ngân sách chi tiêu</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tạo ngân sách
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Tổng ngân sách</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_budgets}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Tổng ngân sách</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.total_budgeted_amount)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Thực tế</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.total_actual_amount)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stats.total_variance_amount >= 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                {stats.total_variance_amount >= 0 ? (
                  <TrendingUp className={`h-6 w-6 text-red-600`} />
                ) : (
                  <TrendingDown className={`h-6 w-6 text-green-600`} />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Chênh lệch</p>
                <p className={`text-2xl font-bold ${stats.total_variance_amount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(stats.total_variance_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm ngân sách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="active">Hoạt động</option>
            <option value="closed">Đóng</option>
          </select>
          
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tất cả chu kỳ</option>
            <option value="monthly">Hàng tháng</option>
            <option value="quarterly">Hàng quý</option>
            <option value="yearly">Hàng năm</option>
          </select>
          
          <button
            onClick={handleFilter}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Lọc
          </button>
        </div>
      </div>

      {/* Budgets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Tên ngân sách
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Chu kỳ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Ngân sách
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Thực tế
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Chênh lệch
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
              {budgets.map((budget) => (
                <tr key={budget.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{budget.budget_name}</div>
                      {budget.description && (
                        <div className="text-sm text-black">{budget.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{getPeriodText(budget.period)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(budget.start_date).toLocaleDateString('vi-VN')} - {new Date(budget.end_date).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(budget.total_budget_amount, budget.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(budget.total_actual_amount, budget.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${budget.total_variance_amount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(budget.total_variance_amount, budget.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(budget.status)}`}>
                      {getStatusText(budget.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewReport(budget)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Xem báo cáo"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      
                      {budget.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleApprove(budget.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                            title="Phê duyệt"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {budget.status === 'active' && (
                        <button
                          onClick={() => handleApprove(budget.id, 'close')}
                          className="text-orange-600 hover:text-orange-900"
                          title="Đóng"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {budgets.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-black" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có ngân sách</h3>
          <p className="mt-1 text-sm text-black">Bắt đầu bằng cách tạo ngân sách đầu tiên.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Tạo ngân sách
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
