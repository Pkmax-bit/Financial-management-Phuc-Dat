'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  MoreVertical,
  Clock,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { Project } from '@/types'
import { supabase } from '@/lib/supabase'
import { projectApi } from '@/lib/api'
import Navigation from '@/components/Navigation'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCustomer, setFilterCustomer] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false)
  const [user, setUser] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
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
          // Fetch projects after user is set
          fetchProjects()
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching projects...')
      
      // Try authenticated endpoint first
      try {
        const data = await projectApi.getProjects()
        setProjects(Array.isArray(data) ? data : [])
        console.log('Successfully fetched projects via authenticated API:', data?.length || 0)
        return
      } catch (authError) {
        console.log('Authenticated API failed, trying public endpoint:', authError)
        
        // Fallback to public endpoint
        try {
          const data = await projectApi.getProjectsPublic()
          setProjects(Array.isArray(data) ? data : [])
          setError('Hiển thị dữ liệu mẫu (chưa đăng nhập)')
          console.log('Successfully fetched projects via public API:', data?.length || 0)
          return
        } catch (publicError) {
          console.log('Public API also failed:', publicError)
          throw publicError
        }
      }
      
    } catch (error: unknown) {
      console.error('Error fetching projects:', error)
      setError(`Lỗi không thể tải danh sách dự án: ${(error as Error)?.message || 'Không thể kết nối'}`)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    const matchesCustomer = filterCustomer === 'all' || project.customer_id === filterCustomer

    return matchesSearch && matchesStatus && matchesCustomer
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <AlertCircle className="h-4 w-4" />
      case 'active':
        return <Play className="h-4 w-4" />
      case 'on_hold':
        return <Pause className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <FolderOpen className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getProjectStats = () => {
    const total = projects.length
    const active = projects.filter(p => p.status === 'active').length
    const completed = projects.filter(p => p.status === 'completed').length
    const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0)
    
    return { total, active, completed, totalBudget }
  }

  const stats = getProjectStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user || undefined} onLogout={handleLogout} />

      {/* Main content */}
      <div className="pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Quản lý dự án</h2>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý dự án</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Quản lý dự án, theo dõi thời gian và giám sát lợi nhuận
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      projects.length > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-500">
                      {projects.length > 0 ? `${projects.length} dự án` : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                  {user && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs text-gray-500">Đã đăng nhập: {(user as { email?: string })?.email || 'Unknown'}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchProjects}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { data: { user: authUser } } = await supabase.auth.getUser()
                      
                      console.log('Debug Info:', {
                        authUser: authUser?.email || 'No auth user',
                        userState: (user as { email?: string })?.email || 'No user state'
                      })
                      
                      if (!authUser) {
                        console.log('Attempting login...')
                        const loginResult = await supabase.auth.signInWithPassword({
                          email: 'admin@example.com',
                          password: 'admin123'
                        })
                        
                        if (loginResult.data.session) {
                          console.log('Login successful, reloading...')
                          window.location.reload()
                        } else {
                          console.error('Login failed:', loginResult.error?.message)
                        }
                      }
                    } catch (error) {
                      console.error('Debug error:', error)
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                  {user ? 'Debug Auth' : 'Login & Debug'}
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm dự án
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                  {error.includes('đăng nhập') && (
                    <p className="text-xs text-red-600 mt-1">
                      <button
                        onClick={() => router.push('/login')}
                        className="underline hover:no-underline"
                      >
                        Nhấn vào đây để đăng nhập
                      </button>
                    </p>
                  )}
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={fetchProjects}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gray-500">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</p>
              </div>
            </div>
          </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm dự án..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
            
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="planning">Lập kế hoạch</option>
                  <option value="active">Đang thực hiện</option>
                  <option value="on_hold">Tạm dừng</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Hủy bỏ</option>
                </select>

                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả khách hàng</option>
                  {/* Customer options would be populated from API */}
                </select>

                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Bộ lọc khác
                </button>
              </div>
            </div>
          </div>

          {/* Project List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Dự án ({filteredProjects.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Danh sách tất cả dự án trong hệ thống
              </p>
            </div>
          
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy dự án</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterStatus !== 'all' || filterCustomer !== 'all'
                    ? 'Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc.'
                    : 'Bắt đầu bằng cách thêm dự án mới.'}
                </p>
                {!searchTerm && filterStatus === 'all' && filterCustomer === 'all' && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm dự án
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <li key={project.id}>
                  <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                          <FolderOpen className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {project.name}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {getStatusIcon(project.status)}
                            <span className="ml-1">{project.status}</span>
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          {project.description && (
                            <>
                              <span className="truncate max-w-md">{project.description}</span>
                              <span className="mx-2">•</span>
                            </>
                          )}
                          <Calendar className="h-4 w-4 mr-1" />
                          Start: {formatDate(project.start_date)}
                          {project.end_date && (
                            <>
                              <span className="mx-2">•</span>
                              <Calendar className="h-4 w-4 mr-1" />
                              End: {formatDate(project.end_date)}
                            </>
                          )}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Budget: {formatCurrency(project.budget)}
                          {Boolean(((project as unknown) as Record<string, unknown>).actual_cost) && (
                            <>
                              <span className="mx-2">•</span>
                              <DollarSign className="h-4 w-4 mr-1" />
                              Actual: {formatCurrency(((project as unknown) as Record<string, unknown>).actual_cost as number)}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProject(project)
                          setShowDetailModal(true)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProject(project)
                          setShowTimeEntryModal(true)
                        }}
                        className="text-gray-400 hover:text-blue-600"
                        title="Time Tracking"
                      >
                        <Clock className="h-5 w-5" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600" title="Edit">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button className="text-gray-400 hover:text-red-600" title="Delete">
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600" title="More">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Project</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                This modal will contain the project creation form
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Add Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {showDetailModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Project Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedProject.name}</h4>
                  <p className="text-sm text-gray-500">{selectedProject.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="text-gray-600">{selectedProject.status}</p>
                  </div>
                  <div>
                    <span className="font-medium">Budget:</span>
                    <p className="text-gray-600">{formatCurrency(selectedProject.budget)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Start Date:</span>
                    <p className="text-gray-600">{formatDate(selectedProject.start_date)}</p>
                  </div>
                  <div>
                    <span className="font-medium">End Date:</span>
                    <p className="text-gray-600">{selectedProject.end_date ? formatDate(selectedProject.end_date) : 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Edit Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Entry Modal */}
      {showTimeEntryModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Time Tracking</h3>
                <button
                  onClick={() => setShowTimeEntryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Project: {selectedProject.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hours Worked</label>
                  <input
                    type="number"
                    step="0.25"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter hours"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="What did you work on?"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTimeEntryModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                  Log Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
