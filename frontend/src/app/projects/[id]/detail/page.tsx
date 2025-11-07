'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Edit,
  Settings,
  Users,
  Calendar,
  Target,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Receipt,
  CreditCard
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import ProjectTeam from '@/components/projects/ProjectTeam'
import ProjectTimeline from '@/components/projects/ProjectTimeline'
import ProjectInvoices from '@/components/projects/ProjectInvoices'
import ProjectExpenses from '@/components/projects/ProjectExpenses'
import EditProjectSidebar from '@/components/projects/EditProjectSidebar'
import { getApiEndpoint } from '@/lib/apiUrl'

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

interface User {
  full_name?: string
  role?: string
  email?: string
}

const statusConfig = {
  planning: { 
    label: 'Lập kế hoạch', 
    color: 'bg-blue-100 text-blue-800', 
    icon: Target,
    bgColor: 'bg-blue-50'
  },
  active: { 
    label: 'Đang thực hiện', 
    color: 'bg-green-100 text-green-800', 
    icon: Activity,
    bgColor: 'bg-green-50'
  },
  on_hold: { 
    label: 'Tạm dừng', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Pause,
    bgColor: 'bg-yellow-50'
  },
  completed: { 
    label: 'Hoàn thành', 
    color: 'bg-gray-100 text-gray-800', 
    icon: CheckCircle,
    bgColor: 'bg-gray-50'
  },
  cancelled: { 
    label: 'Đã hủy', 
    color: 'bg-red-100 text-red-800', 
    icon: XCircle,
    bgColor: 'bg-red-50'
  }
}

const priorityConfig = {
  low: { label: 'Thấp', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'team' | 'documents' | 'invoices' | 'expenses'>('overview')
  const [showEditSidebar, setShowEditSidebar] = useState(false)

  useEffect(() => {
    checkUser()
    fetchProject()
  }, [projectId])

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
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    }
  }

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiEndpoint(`/api/projects/${projectId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        setError('Project not found')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Error loading project')
    } finally {
      setLoading(false)
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
      month: 'long',
      day: 'numeric'
    })
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleEditProject = () => {
    setShowEditSidebar(true)
  }

  const handleEditSuccess = () => {
    setShowEditSidebar(false)
    fetchProject() // Refresh project data
  }

  if (loading) {
    return (
      <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
        <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </LayoutWithSidebar>
    )
  }

  if (error || !project) {
    return (
      <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
        <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error || 'Project not found'}</p>
              <button
                onClick={() => router.push('/projects')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Quay lại danh sách dự án
              </button>
            </div>
          </div>
        </div>
      </LayoutWithSidebar>
    )
  }

  const statusInfo = statusConfig[project.status]
  const priorityInfo = priorityConfig[project.priority]
  const StatusIcon = statusInfo.icon

  return (
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Quay lại</span>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">#{project.project_code}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(project.start_date)}
                </span>
                {project.end_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.end_date)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleEditProject}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span className="text-sm font-medium">Chỉnh sửa</span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Progress and Priority Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Progress Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tiến độ</h3>
                <span className="text-2xl font-bold text-blue-600">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {project.progress < 25 ? 'Dự án mới bắt đầu' :
                 project.progress < 50 ? 'Đang triển khai' :
                 project.progress < 75 ? 'Tiến triển tốt' :
                 project.progress < 100 ? 'Gần hoàn thành' : 'Đã hoàn thành'}
              </p>
            </div>

            {/* Priority Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${priorityInfo.color.replace('text-', 'bg-').replace('100', '50')}`}>
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ưu tiên</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityInfo.color}`}>
                    {priorityInfo.label}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {project.priority === 'urgent' ? 'Cần xử lý ngay lập tức' :
                 project.priority === 'high' ? 'Ưu tiên cao' :
                 project.priority === 'medium' ? 'Ưu tiên trung bình' : 'Ưu tiên thấp'}
              </p>
            </div>

            {/* Budget Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-50">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ngân sách</h3>
                  <p className="text-sm text-gray-600">
                    {project.budget ? formatCurrency(project.budget) : 'Chưa xác định'}
                  </p>
                </div>
              </div>
              {project.actual_cost && (
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Đã chi:</span>
                    <span className="font-medium">{formatCurrency(project.actual_cost)}</span>
                  </div>
                  {project.budget && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Còn lại:</span>
                      <span className={`font-medium ${project.actual_cost > project.budget ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(project.budget - project.actual_cost)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="bg-white rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mô tả dự án</h3>
              <p className="text-gray-600">{project.description}</p>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-2">
            <div className="flex space-x-1 overflow-x-auto">
              {[
                { id: 'overview', label: 'Tổng quan', icon: BarChart3, color: 'blue' },
                { id: 'timeline', label: 'Timeline', icon: Calendar, color: 'orange' },
                { id: 'team', label: 'Đội ngũ', icon: Users, color: 'indigo' },
                { id: 'invoices', label: 'Hóa đơn', icon: Receipt, color: 'green' },
                { id: 'expenses', label: 'Chi phí', icon: CreditCard, color: 'red' },
                { id: 'documents', label: 'Tài liệu', icon: FileText, color: 'gray' }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                      isActive
                        ? `bg-${tab.color}-50 text-${tab.color}-700 border border-${tab.color}-200 shadow-sm`
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? `text-${tab.color}-600` : ''}`} />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Thông tin dự án</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-gray-900">Khách hàng</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-800">{project.customer_name || 'Chưa có'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-gray-900">Quản lý dự án</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-800">{project.manager_name || 'Chưa có'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-gray-900">Loại thanh toán</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-800">
                          {project.billing_type === 'fixed' ? 'Cố định' : 
                           project.billing_type === 'hourly' ? 'Theo giờ' : 'Theo milestone'}
                        </p>
                      </div>
                      {project.hourly_rate && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-gray-900">Giá/giờ</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-800">{formatCurrency(project.hourly_rate)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Budget Info */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin ngân sách</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {project.budget && (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Ngân sách dự kiến</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(project.budget)}</p>
                      </div>
                    )}
                    {project.actual_cost && (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Chi phí thực tế</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(project.actual_cost)}</p>
                      </div>
                    )}
                    {project.budget && project.actual_cost && (
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Chênh lệch</p>
                        <p className={`text-2xl font-bold ${project.actual_cost > project.budget ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(project.actual_cost - project.budget)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Details */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết dự án</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã dự án</label>
                        <p className="text-lg font-mono text-gray-900">#{project.project_code}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án</label>
                        <p className="text-lg text-gray-900">{project.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <p className="text-gray-900">{project.description || 'Không có mô tả'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                        <p className="text-gray-900">{formatDate(project.start_date)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                        <p className="text-gray-900">{project.end_date ? formatDate(project.end_date) : 'Chưa xác định'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                        <p className="text-gray-900">{formatDate(project.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Thống kê nhanh</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Trạng thái</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Ưu tiên</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Tiến độ</span>
                        <span className="text-lg font-bold text-blue-600">{project.progress}%</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Loại thanh toán</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {project.billing_type === 'fixed' ? 'Cố định' : 
                           project.billing_type === 'hourly' ? 'Theo giờ' : 'Theo milestone'}
                        </span>
                      </div>
                    </div>
                    {project.hourly_rate && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Giá/giờ</span>
                          <span className="text-sm font-semibold text-gray-800">{formatCurrency(project.hourly_rate)}</span>
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Ngày tạo</span>
                        <span className="text-sm font-semibold text-gray-800">{formatDate(project.created_at)}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Cập nhật cuối</span>
                        <span className="text-sm font-semibold text-gray-800">{formatDate(project.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Settings className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Hành động</h3>
                  </div>
                  <div className="space-y-3">
                    <button 
                      onClick={handleEditProject}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 rounded-lg transition-colors group"
                    >
                      <Edit className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                      <span className="font-medium text-gray-900">Chỉnh sửa dự án</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <div className="bg-white rounded-xl shadow-sm border p-4">
                  <ProjectTimeline projectId={projectId} projectName={project.name} currentUser={user || undefined} />
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="bg-white rounded-xl shadow-sm border p-4 lg:sticky lg:top-6">
                  <h3 className="text-base font-semibold text-gray-900">Hỗ trợ Timeline</h3>
                  <p className="text-sm text-gray-600 mt-1">Xem và theo dõi tiến độ thi công, hình ảnh và mô tả cập nhật.</p>
                  <ul className="mt-3 text-sm text-gray-700 list-disc list-inside space-y-1">
                    <li>Nhấp vào từng mục để xem chi tiết.</li>
                    <li>Dùng bình luận để trao đổi nhanh.</li>
                    <li>Ảnh minh chứng lưu ở kho `minhchung_chiphi`.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-5 py-4 border-b">
                <h3 className="text-base font-semibold text-gray-900">Đội ngũ dự án</h3>
                <p className="text-sm text-gray-600">Danh sách thành viên, vai trò và thông tin liên hệ.</p>
              </div>
              <div className="p-4">
                <ProjectTeam projectId={projectId} projectName={project.name} currentUser={user || undefined} />
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Receipt className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Hóa đơn dự án</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">Chi tiết các hóa đơn và sản phẩm đã duyệt</p>
              </div>
              <div className="p-6">
                <ProjectInvoices projectId={projectId} projectName={project.name} />
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <CreditCard className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Chi phí dự án</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">Chi phí kế hoạch và thực tế với chi tiết từng khoản</p>
              </div>
              <div className="p-6">
                <ProjectExpenses projectId={projectId} projectName={project.name} />
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tài liệu dự án</h3>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Chức năng quản lý tài liệu sẽ được phát triển trong phiên bản tiếp theo</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Sidebar */}
      {project && (
        <EditProjectSidebar
          isOpen={showEditSidebar}
          onClose={() => setShowEditSidebar(false)}
          onSuccess={handleEditSuccess}
          project={project}
        />
      )}
    </LayoutWithSidebar>
  )
}
