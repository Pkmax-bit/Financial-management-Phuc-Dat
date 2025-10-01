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
  Pause,
  X,
  Save
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
  const [generatedCode, setGeneratedCode] = useState<string>('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const generateProjectCode = async () => {
    try {
      // Get all existing project codes from database
      const { data, error } = await supabase
        .from('projects')
        .select('project_code')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Extract all existing numbers
      const existingNumbers = new Set<number>()
      if (data && data.length > 0) {
        data.forEach(project => {
          // Check for both #PRJ and PRJ formats
          const match1 = project.project_code.match(/#PRJ(\d+)/)
          const match2 = project.project_code.match(/PRJ(\d+)/)
          if (match1) {
            existingNumbers.add(parseInt(match1[1]))
          } else if (match2) {
            existingNumbers.add(parseInt(match2[1]))
          }
        })
      }

      // Find the next available number
      let nextNumber = 1
      while (existingNumbers.has(nextNumber)) {
        nextNumber++
      }

      // Format as PRJXXX (3 digits)
      const newCode = `PRJ${nextNumber.toString().padStart(3, '0')}`
      setGeneratedCode(newCode)
      
      // Copy to clipboard
      await navigator.clipboard.writeText(newCode)
      
      // Show success message
      alert(`Mã dự án mới: ${newCode}\nĐã sao chép vào clipboard!`)
      
    } catch (error) {
      console.error('Error generating project code:', error)
      // Fallback to timestamp-based code
      const timestamp = Date.now().toString().slice(-6)
      const fallbackCode = `PRJ${timestamp}`
      setGeneratedCode(fallbackCode)
      await navigator.clipboard.writeText(fallbackCode)
      alert(`Mã dự án mới: ${fallbackCode}\nĐã sao chép vào clipboard!`)
    }
  }

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

  const handleQuickSave = async (project: Project) => {
    try {
      // Quick save - just update the project with current data
      const updateData = {
        name: project.name,
        description: project.description,
        customer_id: project.customer_id,
        manager_id: project.manager_id,
        start_date: project.start_date,
        end_date: project.end_date,
        budget: project.budget,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        billing_type: project.billing_type,
        hourly_rate: project.hourly_rate
      }

      await projectApi.updateProject(project.id, updateData)
      alert('Dự án đã được lưu thành công!')
      fetchProjects()
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Có lỗi xảy ra khi lưu dự án')
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
            <p className="text-black mt-1">Quản lý và theo dõi dự án một cách hiệu quả</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-black">
              {sortedProjects.length} dự án
            </div>
            <button
              onClick={generateProjectCode}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
              title="Tạo mã dự án mới"
            >
              <Target className="h-4 w-4" />
              Tạo mã
            </button>
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

      {/* Generated Code Display */}
      {generatedCode && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Mã dự án đã tạo</p>
                <p className="text-lg font-bold text-green-900">{generatedCode}</p>
              </div>
            </div>
            <button
              onClick={() => setGeneratedCode('')}
              className="text-green-600 hover:text-green-800 transition-colors"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Tìm kiếm dự án</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
              <input
                type="text"
                placeholder="Tìm theo tên, mã hoặc khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black mb-2">Trạng thái</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white text-black"
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
            <label className="block text-sm font-medium text-black mb-2">Độ ưu tiên</label>
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white text-black"
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
            <label className="block text-sm font-medium text-black mb-2">Sắp xếp theo</label>
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white text-black"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedProjects.map((project) => {
          const StatusIcon = statusIcons[project.status]
          return (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-300 group">
              <div className="p-4">
                <div className="flex items-start justify-between mb-5 gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:from-blue-200 group-hover:to-blue-300 transition-colors flex-shrink-0">
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-semibold text-gray-900 text-base group-hover:text-blue-700 transition-colors break-words leading-tight"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordWrap: 'break-word',
                          hyphens: 'auto',
                          lineHeight: '1.3',
                          maxHeight: '2.6em'
                        }}
                        title={project.name}
                      >
                        {project.name}
                      </h3>
                      <p className="text-xs text-black font-medium mt-1">#{project.project_code}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1 flex-shrink-0">
                    <button
                      onClick={() => onViewProject(project)}
                      className="p-1.5 text-black hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleQuickSave(project)}
                      className="p-1.5 text-black hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Lưu nhanh"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onEditProject(project)}
                      className="p-1.5 text-black hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Chỉnh sửa dự án"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="p-1.5 text-black hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Xóa dự án"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-3 w-3 text-black" />
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[project.status]} shadow-sm`}>
                      {getStatusText(project.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColors[project.priority]} shadow-sm`}>
                      {getPriorityText(project.priority)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-black bg-blue-50 rounded-lg p-2">
                      <Users className="h-3 w-3 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold truncate block">{project.customer_name || 'Không có khách hàng'}</span>
                        {project.customer_name && (
                          <span className="text-blue-600 text-xs">Khách hàng</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-black bg-gray-50 rounded-lg p-2">
                      <Calendar className="h-3 w-3 text-green-500" />
                      <span className="font-medium">{new Date(project.start_date).toLocaleDateString()}</span>
                    </div>
                    {project.budget && (
                      <div className="flex items-center gap-2 text-xs text-black bg-gray-50 rounded-lg p-2">
                        <DollarSign className="h-3 w-3 text-emerald-500" />
                        <span className="font-medium">VND {project.budget.toLocaleString()}</span>
                      </div>
                    )}
                    {project.manager_name && (
                      <div className="flex items-center gap-2 text-xs text-black bg-gray-50 rounded-lg p-2">
                        <Users className="h-3 w-3 text-purple-500" />
                        <span className="font-medium truncate">Quản lý: {project.manager_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-black font-medium">Tiến độ</span>
                      <span className="font-semibold text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-700 shadow-sm"
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
              <FolderOpen className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy dự án</h3>
            <p className="text-black mb-6">
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
