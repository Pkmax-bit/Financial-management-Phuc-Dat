'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FolderOpen, 
  Plus, 
  Search, 
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import ProjectsTab from '@/components/projects/ProjectsTab'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import EditProjectSidebar from '@/components/projects/EditProjectSidebar'
import ProjectDetailSidebar from '@/components/projects/ProjectDetailSidebar'

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

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState('projects')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    onHold: 0
  })
  const router = useRouter()

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditSidebar, setShowEditSidebar] = useState(false)
  const [showDetailSidebar, setShowDetailSidebar] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    checkUser()
    fetchStats()
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
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('status')

      if (error) throw error

      const total = projects?.length || 0
      const active = projects?.filter(p => p.status === 'active').length || 0
      const completed = projects?.filter(p => p.status === 'completed').length || 0
      const onHold = projects?.filter(p => p.status === 'on_hold').length || 0

      setStats({
        total,
        active,
        completed,
        onHold
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Event handlers
  const handleCreateProject = () => {
    setShowCreateModal(true)
  }

  const handleEditProject = (project: Project) => {
    setSelectedProject(project)
    setShowEditSidebar(true)
  }

  const handleViewProject = (project: Project) => {
    setSelectedProject(project)
    setShowDetailSidebar(true)
  }

  const handleDeleteProject = (project: Project) => {
    // This will be handled in the ProjectsTab component
    console.log('Delete project:', project)
  }

  const handleProjectSuccess = () => {
    // Refresh stats when project is created/updated
    fetchStats()
    console.log('Project operation successful')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm">
                <FolderOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dự án</h1>
                <p className="text-gray-600 mt-1">Quản lý và theo dõi dự án một cách hiệu quả</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('reports')}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <BarChart3 className="h-4 w-4" />
                Báo cáo
              </button>
              <button
                onClick={handleCreateProject}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl font-medium"
              >
                <Plus className="h-5 w-5" />
                Dự án mới
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng dự án</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dự án đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                <Target className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tạm dừng</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.onHold}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {activeTab === 'projects' && (
            <ProjectsTab
              onCreateProject={handleCreateProject}
              onEditProject={handleEditProject}
              onViewProject={handleViewProject}
              onDeleteProject={handleDeleteProject}
            />
          )}
          
          {activeTab === 'reports' && (
            <div className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Project Reports</h3>
                <p className="text-gray-600 mb-4">
                  View detailed reports and analytics for your projects
                </p>
                <button
                  onClick={() => router.push('/projects/reports')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Reports
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectSuccess}
      />

      <EditProjectSidebar
        isOpen={showEditSidebar}
        onClose={() => setShowEditSidebar(false)}
        project={selectedProject}
        onSuccess={handleProjectSuccess}
      />

      <ProjectDetailSidebar
        isOpen={showDetailSidebar}
        onClose={() => setShowDetailSidebar(false)}
        project={selectedProject}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
      />
    </div>
  )
}