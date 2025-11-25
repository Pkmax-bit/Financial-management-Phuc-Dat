'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, Edit, Trash2, Calendar, DollarSign, Users, Target, MoreVertical, Filter, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  project_code: string
  name: string
  description?: string
  customer_id: string
  customer_name?: string
  manager_id: string
  manager_name?: string
  start_date: string
  end_date?: string
  budget?: number
  actual_cost?: number
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  billing_type: 'fixed' | 'hourly' | 'milestone'
  hourly_rate?: number
  created_at: string
  updated_at: string
}

interface ProjectsTabProps {
  onCreateProject: () => void
  onEditProject: (project: Project) => void
  onViewProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

const statusColors: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700'
}

const statusLabels: Record<string, string> = {
  planning: 'Lập kế hoạch',
  active: 'Đang hoạt động',
  on_hold: 'Tạm dừng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy'
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-700'
}

const priorityLabels: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp'
}

export default function ProjectsTab({
  onCreateProject,
  onEditProject,
  onViewProject,
  onDeleteProject
}: ProjectsTabProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [projects, searchQuery, statusFilter, dateFilter])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          project_code,
          name,
          description,
          customer_id,
          manager_id,
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
          updated_at,
          customers(name),
          employees!manager_id(
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mappedProjects: Project[] = (data || []).map((p: any) => ({
        id: p.id,
        project_code: p.project_code,
        name: p.name,
        description: p.description,
        customer_id: p.customer_id,
        customer_name: p.customers?.name,
        manager_id: p.manager_id,
        manager_name: p.employees
          ? `${p.employees.first_name || ''} ${p.employees.last_name || ''}`.trim()
          : undefined,
        start_date: p.start_date,
        end_date: p.end_date,
        budget: p.budget,
        actual_cost: p.actual_cost,
        status: p.status,
        priority: p.priority,
        progress: typeof p.progress === 'number' ? p.progress : Number(p.progress ?? 0),
        billing_type: p.billing_type,
        hourly_rate: p.hourly_rate,
        created_at: p.created_at,
        updated_at: p.updated_at
      }))

      setProjects(mappedProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = [...projects]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.project_code.toLowerCase().includes(query) ||
          p.customer_name?.toLowerCase().includes(query) ||
          p.manager_name?.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Filter by date range (start_date and end_date)
    if (dateFilter.from || dateFilter.to) {
      filtered = filtered.filter((p) => {
        // Check if project's start_date or end_date falls within the range
        const projectStartDate = p.start_date ? new Date(p.start_date) : null
        const projectEndDate = p.end_date ? new Date(p.end_date) : null
        const fromDate = dateFilter.from ? new Date(dateFilter.from) : null
        const toDate = dateFilter.to ? new Date(dateFilter.to) : null

        // Normalize dates (ignore time)
        if (projectStartDate) projectStartDate.setHours(0, 0, 0, 0)
        if (projectEndDate) projectEndDate.setHours(0, 0, 0, 0)
        if (fromDate) fromDate.setHours(0, 0, 0, 0)
        if (toDate) toDate.setHours(0, 0, 0, 0)

        // If both from and to are set, check if project dates overlap with range
        if (fromDate && toDate) {
          // Project is included if:
          // - Project start_date is within range, OR
          // - Project end_date is within range, OR
          // - Project spans the entire range
          const startInRange = projectStartDate && projectStartDate >= fromDate && projectStartDate <= toDate
          const endInRange = projectEndDate && projectEndDate >= fromDate && projectEndDate <= toDate
          const spansRange = projectStartDate && projectEndDate && projectStartDate <= fromDate && projectEndDate >= toDate
          
          return startInRange || endInRange || spansRange
        } else if (fromDate) {
          // Only from date: include projects that start on or after this date
          return projectStartDate && projectStartDate >= fromDate
        } else if (toDate) {
          // Only to date: include projects that end on or before this date
          return projectEndDate && projectEndDate <= toDate
        }
        
        return true
      })
    }

    setFilteredProjects(filtered)
  }

  const handleDelete = async (project: Project) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id)

      if (error) throw error

      setProjects(projects.filter((p) => p.id !== project.id))
      setShowDeleteConfirm(null)
      onDeleteProject(project)
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Lỗi khi xóa dự án')
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6" data-tour-id="projects-grid">
      {/* Header with Search and Filter Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm dự án, mã dự án, khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
            showFilter
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showFilter ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
          {showFilter ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
        </button>
      </div>

      {/* Main Content: Filter + Projects */}
      <div className={`flex gap-6 ${showFilter ? 'flex-row' : ''}`}>
        {/* Filter Sidebar */}
        {showFilter && (
          <div className="w-1/3 bg-white border border-gray-200 rounded-lg p-6 h-fit sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>
            
            {/* Status Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="planning">Lập kế hoạch</option>
                <option value="active">Đang hoạt động</option>
                <option value="on_hold">Tạm dừng</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">Khoảng thời gian</label>
              <div className="space-y-3">
                <input
                  type="date"
                  placeholder="Từ ngày"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter({ 
                    ...dateFilter, 
                    from: e.target.value 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
                <input
                  type="date"
                  placeholder="Đến ngày"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter({ 
                    ...dateFilter, 
                    to: e.target.value 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
                {(dateFilter.from || dateFilter.to) && (
                  <button
                    onClick={() => setDateFilter({ 
                      from: '', 
                      to: '' 
                    })}
                    className="w-full px-3 py-2 text-sm text-black bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Xóa bộ lọc thời gian
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Projects Section */}
        <div className={`${showFilter ? 'w-2/3' : 'w-full'}`}>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' || dateFilter.from || dateFilter.to ? 'Không tìm thấy dự án' : 'Chưa có dự án nào'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' || dateFilter.from || dateFilter.to
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                  : 'Bắt đầu bằng cách tạo dự án mới'}
              </p>
              {!searchQuery && statusFilter === 'all' && !dateFilter.from && !dateFilter.to && (
                <button
                  onClick={onCreateProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tạo dự án mới
                </button>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${showFilter ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow ${
                    showFilter ? 'p-6' : 'p-6'
                  }`}
                >
                  {showFilter ? (
                    // Horizontal card layout when filter is shown
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 whitespace-normal break-words">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-500">{project.project_code}</p>
                          </div>
                          <div className="relative group ml-4">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <MoreVertical className="h-5 w-5 text-gray-400" />
                            </button>
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                              <button
                                onClick={() => onViewProject(project)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Xem chi tiết
                              </button>
                              <button
                                onClick={() => onEditProject(project)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Chỉnh sửa
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(project.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || statusColors.planning}`}
                          >
                            {statusLabels[project.status] || project.status}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[project.priority] || priorityColors.medium}`}
                          >
                            {priorityLabels[project.priority] || project.priority}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          {project.customer_name && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="break-words">{project.customer_name}</span>
                            </div>
                          )}
                          {project.manager_name && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="break-words">QL: {project.manager_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>{formatDate(project.start_date)}</span>
                            {project.end_date && <span> - {formatDate(project.end_date)}</span>}
                          </div>
                          {project.budget && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span>{formatCurrency(project.budget)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lg:w-80 flex-shrink-0">
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Tiến độ</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => onViewProject(project)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => onEditProject(project)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Sửa
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Vertical card layout when filter is hidden (3 cards per row)
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 whitespace-normal break-words">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500">{project.project_code}</p>
                        </div>
                        <div className="relative group">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="h-5 w-5 text-gray-400" />
                          </button>
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                            <button
                              onClick={() => onViewProject(project)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Xem chi tiết
                            </button>
                            <button
                              onClick={() => onEditProject(project)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Chỉnh sửa
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(project.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || statusColors.planning}`}
                        >
                          {statusLabels[project.status] || project.status}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[project.priority] || priorityColors.medium}`}
                        >
                          {priorityLabels[project.priority] || project.priority}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Tiến độ</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        {project.customer_name && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="break-words">{project.customer_name}</span>
                          </div>
                        )}
                        {project.manager_name && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="break-words">QL: {project.manager_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{formatDate(project.start_date)}</span>
                          {project.end_date && <span> - {formatDate(project.end_date)}</span>}
                        </div>
                        {project.budget && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>{formatCurrency(project.budget)}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={() => onViewProject(project)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Xem
                        </button>
                        <button
                          onClick={() => onEditProject(project)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const project = projects.find((p) => p.id === showDeleteConfirm)
                  if (project) handleDelete(project)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

