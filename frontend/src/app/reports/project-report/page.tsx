'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  FolderOpen, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  FileText,
  Filter,
  RefreshCw,
  Users,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface ProjectReportData {
  projectId: string
  projectCode: string
  projectName: string
  customerName: string
  managerName: string
  startDate: string
  endDate: string
  budget: number
  actualCost: number
  status: string
  priority: string
  progress: number
  billingType: string
  hourlyRate: number
  profit: number
  profitMargin: number
  daysRemaining: number
  isOverdue: boolean
}

export default function ProjectReportPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ProjectReportData[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch data from database - only real data, no mock/hardcode
      const [projectsResult, timeEntriesResult, expensesResult] = await Promise.all([
        // Get projects with customer and manager info
        supabase
          .from('projects')
          .select(`
            id,
            project_code,
            name,
            start_date,
            end_date,
            budget,
            actual_cost,
            status,
            priority,
            progress,
            billing_type,
            hourly_rate,
            created_at,
            customers!inner(name),
            employees!projects_manager_id_fkey(first_name, last_name)
          `)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59'),
        
        // Get time entries for project costs
        supabase
          .from('time_entries')
          .select('project_id, hours, hourly_rate, billable')
          .eq('billable', true)
          .gte('date', startDate)
          .lte('date', endDate),
        
        // Get expenses for project costs
        supabase
          .from('expenses')
          .select('project_id, amount, status')
          .eq('status', 'approved')
          .gte('expense_date', startDate)
          .lte('expense_date', endDate)
      ])

      // Process project data from real database
      const projectReports: ProjectReportData[] = []

      if (projectsResult.data) {
        for (const project of projectsResult.data) {
          // Calculate actual costs from time entries and expenses
          const projectTimeEntries = timeEntriesResult.data?.filter(entry => 
            entry.project_id === project.id) || []
          
          const projectExpenses = expensesResult.data?.filter(expense => 
            expense.project_id === project.id) || []
          
          const timeCosts = projectTimeEntries.reduce((sum, entry) => 
            sum + ((entry.hours || 0) * (entry.hourly_rate || 0)), 0)
          
          const expenseCosts = projectExpenses.reduce((sum, expense) => 
            sum + (expense.amount || 0), 0)
          
          const totalActualCost = (project.actual_cost || 0) + timeCosts + expenseCosts
          
          // Calculate profit and margin
          const profit = (project.budget || 0) - totalActualCost
          const profitMargin = (project.budget || 0) > 0 ? (profit / (project.budget || 0)) * 100 : 0
          
          // Calculate days remaining
          const today = new Date()
          const endDate = new Date(project.end_date || project.start_date)
          const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          const isOverdue = daysRemaining < 0
          
          // Get manager name
          const managerName = project.employees ? 
            `${project.employees.first_name || ''} ${project.employees.last_name || ''}`.trim() : 
            'Chưa phân công'
          
          projectReports.push({
            projectId: project.id,
            projectCode: project.project_code,
            projectName: project.name,
            customerName: project.customers?.name || 'Không có khách hàng',
            managerName: managerName,
            startDate: project.start_date,
            endDate: project.end_date || '',
            budget: project.budget || 0,
            actualCost: totalActualCost,
            status: project.status,
            priority: project.priority,
            progress: project.progress || 0,
            billingType: project.billing_type || 'fixed',
            hourlyRate: project.hourly_rate || 0,
            profit: profit,
            profitMargin: profitMargin,
            daysRemaining: daysRemaining,
            isOverdue: isOverdue
          })
        }
      }

      // Sort by profit margin descending
      projectReports.sort((a, b) => b.profitMargin - a.profitMargin)
      setData(projectReports)
    } catch (err) {
      console.error('Error fetching project report data:', err)
      setError('Không thể tải dữ liệu báo cáo từ cơ sở dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      fetchData()
    }
  }, [startDate, endDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'planning': 'Lập kế hoạch',
      'active': 'Đang hoạt động',
      'on_hold': 'Tạm dừng',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    }
    return statusMap[status] || status
  }

  const getPriorityText = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'low': 'Thấp',
      'medium': 'Trung bình',
      'high': 'Cao',
      'urgent': 'Khẩn cấp'
    }
    return priorityMap[priority] || priority
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExport = () => {
    console.log('Exporting Project report...')
  }

  const getTotalBudget = () => {
    return data.reduce((sum, project) => sum + project.budget, 0)
  }

  const getTotalActualCost = () => {
    return data.reduce((sum, project) => sum + project.actualCost, 0)
  }

  const getTotalProfit = () => {
    return data.reduce((sum, project) => sum + project.profit, 0)
  }

  const getAverageProfitMargin = () => {
    if (data.length === 0) return 0
    return data.reduce((sum, project) => sum + project.profitMargin, 0) / data.length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8 lg:ml-64 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-xl">
                <FolderOpen className="h-8 w-8 text-teal-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Báo cáo Dự án</h1>
                <p className="text-gray-600">Phân tích hiệu quả và tiến độ dự án</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Bộ lọc thời gian:</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Data */}
        {data && !loading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <FolderOpen className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng dự án</p>
                    <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng ngân sách</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalBudget())}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng chi phí</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalActualCost())}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Target className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lợi nhuận</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalProfit())}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Report Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Chi tiết báo cáo dự án</h2>
                <p className="text-gray-600">Từ {startDate} đến {endDate}</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dự án
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quản lý
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngân sách
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chi phí
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lợi nhuận
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Biên lợi nhuận
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiến độ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((project, index) => (
                      <tr key={project.projectId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                <FolderOpen className="h-5 w-5 text-teal-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{project.projectName}</div>
                              <div className="text-sm text-gray-500">{project.projectCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.managerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(project.budget)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(project.actualCost)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          project.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(project.profit)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          project.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {project.profitMargin.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-teal-600 h-2 rounded-full" 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                            {getStatusText(project.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.isOverdue ? (
                            <span className="text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Quá hạn {Math.abs(project.daysRemaining)} ngày
                            </span>
                          ) : (
                            <span className="text-gray-600">
                              {project.daysRemaining > 0 ? `Còn ${project.daysRemaining} ngày` : 'Hoàn thành'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
