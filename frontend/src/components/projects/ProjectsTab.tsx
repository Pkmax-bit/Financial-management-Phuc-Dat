'use client'

import { useState, useEffect } from 'react'
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  DollarSign,
  Users,
  Target,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { projectApi } from '@/lib/api'

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

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const statusIcons = {
  planning: Target,
  active: CheckCircle,
  on_hold: Pause,
  completed: CheckCircle,
  cancelled: XCircle
}

export default function ProjectsTab({ 
  onCreateProject, 
  onEditProject, 
  onViewProject, 
  onDeleteProject 
}: ProjectsTabProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try API first, fallback to Supabase
      try {
        const data = await projectApi.getProjects()
        setProjects(data || [])
      } catch (apiError) {
        console.log('API failed, falling back to Supabase:', apiError)
        
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            customers:customer_id(name),
            employees:manager_id(first_name, last_name)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        const projects = data?.map(project => ({
          ...project,
          customer_name: project.customers?.name,
          manager_name: project.employees ? `${project.employees.first_name} ${project.employees.last_name}` : 'Unknown'
        })) || []

        setProjects(projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
      try {
        // Try API first, fallback to Supabase
        try {
          await projectApi.deleteProject(project.id)
        } catch (apiError) {
          console.log('API failed, falling back to Supabase:', apiError)
          
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', project.id)

          if (error) throw error
        }

        setProjects(projects.filter(p => p.id !== project.id))
      } catch (error) {
        console.error('Error deleting project:', error)
        alert('Failed to delete project')
      }
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aValue = a[sortBy as keyof Project] || ''
    let bValue = b[sortBy as keyof Project] || ''
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase()
    if (typeof bValue === 'string') bValue = bValue.toLowerCase()
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchProjects}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tất cả dự án</h2>
            <p className="text-gray-600 mt-1">Quản lý và theo dõi dự án một cách hiệu quả</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {sortedProjects.length} dự án
            </div>
            <button
              onClick={onCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Dự án mới
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm dự án</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, mã hoặc khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Độ ưu tiên</label>
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
              >
                <option value="all">Tất cả độ ưu tiên</option>
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
              >
                <option value="name-asc">Tên (A-Z)</option>
                <option value="name-desc">Tên (Z-A)</option>
                <option value="start_date-asc">Ngày bắt đầu (Cũ nhất)</option>
                <option value="start_date-desc">Ngày bắt đầu (Mới nhất)</option>
                <option value="budget-asc">Ngân sách (Thấp đến cao)</option>
                <option value="budget-desc">Ngân sách (Cao đến thấp)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProjects.map((project) => {
          const StatusIcon = statusIcons[project.status]
          return (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-300 group">
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:from-blue-200 group-hover:to-blue-300 transition-colors">
                      <FolderOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">{project.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">#{project.project_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewProject(project)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEditProject(project)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Chỉnh sửa dự án"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Xóa dự án"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4 text-gray-500" />
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusColors[project.status]} shadow-sm`}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${priorityColors[project.priority]} shadow-sm`}>
                      {project.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{project.customer_name || 'Không có khách hàng'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{new Date(project.start_date).toLocaleDateString()}</span>
                    </div>
                    {project.budget && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium">${project.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-gray-600 font-medium">Tiến độ</span>
                      <span className="font-semibold text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-700 shadow-sm"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        </div>
      </div>

      {sortedProjects.length === 0 && (
        <div className="p-6">
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <FolderOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy dự án</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? 'Thử điều chỉnh bộ lọc của bạn' 
                : 'Bắt đầu bằng cách tạo dự án đầu tiên'
              }
            </p>
            {(!searchTerm && statusFilter === 'all' && priorityFilter === 'all') && (
              <button
                onClick={onCreateProject}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Tạo dự án
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
