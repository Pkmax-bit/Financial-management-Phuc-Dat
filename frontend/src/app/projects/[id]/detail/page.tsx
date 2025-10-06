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
  Pause
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import ProjectFinancialDashboard from '@/components/projects/ProjectFinancialDashboard'
import ProjectCostBreakdown from '@/components/projects/ProjectCostBreakdown'
import ProjectRevenueAnalysis from '@/components/projects/ProjectRevenueAnalysis'

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
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'costs' | 'revenue' | 'timeline' | 'team' | 'documents'>('overview')

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
      const response = await fetch(`/api/projects/${projectId}`)
      
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
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
    )
  }

  const statusInfo = statusConfig[project.status]
  const priorityInfo = priorityConfig[project.priority]
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/projects')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600">#{project.project_code}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Edit className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Project Status and Info */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-5 w-5 text-gray-600" />
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityInfo.color}`}>
              {priorityInfo.label}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Bắt đầu: {formatDate(project.start_date)}</span>
            </div>
            {project.end_date && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Kết thúc: {formatDate(project.end_date)}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Tiến độ dự án</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              ></div>
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
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {[
              { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
              { id: 'financials', label: 'Tài chính', icon: DollarSign },
              { id: 'costs', label: 'Chi phí', icon: TrendingDown },
              { id: 'revenue', label: 'Doanh thu', icon: TrendingUp },
              { id: 'timeline', label: 'Timeline', icon: Calendar },
              { id: 'team', label: 'Đội ngũ', icon: Users },
              { id: 'documents', label: 'Tài liệu', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin dự án</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Khách hàng:</span>
                        <span className="font-medium">{project.customer_name || 'Chưa có'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Quản lý:</span>
                        <span className="font-medium">{project.manager_name || 'Chưa có'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Loại thanh toán:</span>
                        <span className="font-medium">
                          {project.billing_type === 'fixed' ? 'Cố định' : 
                           project.billing_type === 'hourly' ? 'Theo giờ' : 'Theo milestone'}
                        </span>
                      </div>
                      {project.hourly_rate && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Giá/giờ:</span>
                          <span className="font-medium">{formatCurrency(project.hourly_rate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Budget Info */}
                {(project.budget || project.actual_cost) && (
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin ngân sách</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê nhanh</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Trạng thái</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ưu tiên</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tiến độ</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ngày tạo</span>
                      <span className="text-sm">{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors">
                      Chỉnh sửa dự án
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors">
                      Thêm thành viên
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors">
                      Tạo báo cáo
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors">
                      Xuất dữ liệu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financials Tab */}
          {activeTab === 'financials' && (
            <ProjectFinancialDashboard projectId={projectId} projectName={project.name} />
          )}

          {/* Costs Tab */}
          {activeTab === 'costs' && (
            <ProjectCostBreakdown projectId={projectId} projectName={project.name} />
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <ProjectRevenueAnalysis projectId={projectId} projectName={project.name} />
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline dự án</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Dự án được tạo</p>
                    <p className="text-sm text-gray-600">{formatDate(project.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Dự án bắt đầu</p>
                    <p className="text-sm text-gray-600">{formatDate(project.start_date)}</p>
                  </div>
                </div>
                {project.end_date && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Dự án kết thúc</p>
                      <p className="text-sm text-gray-600">{formatDate(project.end_date)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Đội ngũ dự án</h3>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Chức năng quản lý đội ngũ sẽ được phát triển trong phiên bản tiếp theo</p>
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
    </div>
  )
}
