'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  FolderOpen, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  BarChart3
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import StickyTopNav from '@/components/StickyTopNav'

interface ProjectSummary {
  id: string
  project_code: string
  name: string
  customer_name: string
  status: string
  
  // Planned (Kế hoạch)
  planned_revenue: number // From quotes
  planned_costs: number // From project budget
  
  // Actual (Thực tế)
  actual_revenue: number // From invoices
  actual_costs: number // From expenses
  
  // Profit
  planned_profit: number
  actual_profit: number
  profit_margin: number
  
  // Counts
  invoice_count: number
  expense_count: number
  quote_count: number
  unpaid_invoice_count: number
  partial_invoice_count: number
}

export default function ProjectsDetailedReportPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchProjectsData()
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
      }
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  const fetchProjectsData = async () => {
    setLoading(true)
    try {
      // Fetch projects with related data
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          project_code,
          name,
          status,
          budget,
          customers!inner(name)
        `)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // For each project, fetch financial data
      const projectSummaries: ProjectSummary[] = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Fetch invoices (actual revenue) - Hóa đơn đã phát hành
          const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('total_amount, payment_status')
            .eq('project_id', project.id)
            .in('status', ['sent', 'paid'])  // sent = đã gửi, paid = đã thanh toán đầy đủ
          
          // Debug log
          if (invoicesError) {
            console.error('Error fetching invoices for project:', project.id, invoicesError)
          }
          if (invoices && invoices.length > 0) {
            console.log('Invoices found for project:', project.name, invoices)
          }
          
          // Đếm số hóa đơn chưa thanh toán
          const unpaidInvoices = invoices?.filter(i => i.payment_status === 'pending').length || 0
          const partialInvoices = invoices?.filter(i => i.payment_status === 'partial').length || 0

          // Fetch project expenses (actual costs) - Chi phí dự án đã duyệt
          const { data: projectExpenses } = await supabase
            .from('project_expenses')
            .select('amount')
            .eq('project_id', project.id)
            .eq('status', 'approved')

          // Calculate totals - Tính toán từ dữ liệu thực tế
          const actual_revenue = invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0
          const actual_costs = projectExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
          
          // Lợi nhuận = Hóa đơn - Chi phí dự án đã duyệt
          const actual_profit = actual_revenue - actual_costs
          
          // Biên lợi nhuận = (Lợi nhuận / Doanh thu) * 100
          const profit_margin = actual_revenue > 0 ? (actual_profit / actual_revenue) * 100 : 0

          // Kế hoạch chỉ để hiển thị so sánh (không dùng tính lợi nhuận)
          const planned_revenue = project.budget || 0
          const planned_costs = project.budget ? project.budget * 0.7 : 0
          const planned_profit = planned_revenue - planned_costs

          return {
            id: project.id,
            project_code: project.project_code,
            name: project.name,
            customer_name: project.customers?.name || 'N/A',
            status: project.status,
            planned_revenue,
            planned_costs,
            actual_revenue,
            actual_costs,
            planned_profit,
            actual_profit,
            profit_margin,
            invoice_count: invoices?.length || 0,
            expense_count: projectExpenses?.length || 0,
            quote_count: 0,
            unpaid_invoice_count: unpaidInvoices,
            partial_invoice_count: partialInvoices
          }
        })
      )

      setProjects(projectSummaries)
    } catch (error) {
      console.error('Error fetching projects data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'planning': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'planning': 'Lập kế hoạch',
      'active': 'Đang hoạt động',
      'on_hold': 'Tạm dừng',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    }
    return texts[status] || status
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate totals
  const totalPlannedRevenue = filteredProjects.reduce((sum, p) => sum + p.planned_revenue, 0)
  const totalActualRevenue = filteredProjects.reduce((sum, p) => sum + p.actual_revenue, 0)
  const totalActualCosts = filteredProjects.reduce((sum, p) => sum + p.actual_costs, 0)
  const totalActualProfit = filteredProjects.reduce((sum, p) => sum + p.actual_profit, 0)

  return (
    <LayoutWithSidebar user={user} onLogout={handleLogout}>
      <div className="w-full">
        <StickyTopNav 
          title="Báo cáo Dự án Chi tiết" 
          subtitle="Phân tích chi tiết kế hoạch và thực tế của từng dự án"
        />

        <div className="px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng dự án</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredProjects.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalActualRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng chi phí</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalActualCosts)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${totalActualProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <TrendingUp className={`h-5 w-5 ${totalActualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lợi nhuận</p>
                  <p className={`text-2xl font-bold ${totalActualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalActualProfit)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm dự án..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="planning">Lập kế hoạch</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="on_hold">Tạm dừng</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Danh sách dự án</h2>
              <p className="text-gray-600">Click vào dự án để xem báo cáo chi tiết</p>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            ) : (
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
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hóa đơn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chi phí
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lợi nhuận
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Biên LN
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                <FolderOpen className="h-5 w-5 text-teal-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{project.name}</div>
                              <div className="text-sm text-gray-500">{project.project_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                            {getStatusText(project.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">{formatCurrency(project.actual_revenue)}</div>
                          <div className="text-xs text-gray-500">
                            {project.invoice_count} hóa đơn
                            {project.unpaid_invoice_count > 0 && (
                              <span className="ml-1 text-orange-600 font-semibold">
                                ({project.unpaid_invoice_count} chưa TT)
                              </span>
                            )}
                            {project.partial_invoice_count > 0 && (
                              <span className="ml-1 text-yellow-600 font-semibold">
                                ({project.partial_invoice_count} TT 1 phần)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-red-600">{formatCurrency(project.actual_costs)}</div>
                          <div className="text-xs text-gray-500">{project.expense_count} chi phí</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${project.actual_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(project.actual_profit)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {project.actual_profit >= 0 ? 'Lãi' : 'Lỗ'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${project.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {project.profit_margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => router.push(`/reports/projects-detailed/${project.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Không tìm thấy dự án nào</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  )
}

