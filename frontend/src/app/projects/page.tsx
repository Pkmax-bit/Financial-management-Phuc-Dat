'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  AlertCircle,
  CircleHelp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import StickyTopNav from '@/components/StickyTopNav'
import ProjectsTab from '@/components/projects/ProjectsTab'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import EditProjectSidebar from '@/components/projects/EditProjectSidebar'
import ProjectDetailSidebar from '@/components/projects/ProjectDetailSidebar'

const TOUR_STORAGE_KEY = 'projects-page-tour-status-v1'
const TOUR_COUNTDOWN_SECONDS = 5
type ProjectsShepherdModule = typeof import('shepherd.js')
type ProjectsShepherdType = ProjectsShepherdModule & { Tour: new (...args: any[]) => any }
type ProjectsShepherdTour = InstanceType<ProjectsShepherdType['Tour']>

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
  const [showTourCompletionPrompt, setShowTourCompletionPrompt] = useState(false)
  const [tourCountdown, setTourCountdown] = useState(TOUR_COUNTDOWN_SECONDS)
  const [isTourRunning, setIsTourRunning] = useState(false)
  const shepherdRef = useRef<ProjectsShepherdType | null>(null)
  const tourRef = useRef<ProjectsShepherdTour | null>(null)
  const autoStartAttemptedRef = useRef(false)
  const currentTourModeRef = useRef<'auto' | 'manual'>('manual')
  const isBrowser = typeof window !== 'undefined'

  const handleTourComplete = useCallback(() => {
    setIsTourRunning(false)
    if (isBrowser) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'completed')
    }
    setTourCountdown(TOUR_COUNTDOWN_SECONDS)
    setShowTourCompletionPrompt(true)
  }, [isBrowser])

  const handleTourCancel = useCallback(() => {
    setIsTourRunning(false)
    if (isBrowser && currentTourModeRef.current === 'auto') {
      localStorage.setItem(TOUR_STORAGE_KEY, 'dismissed')
    }
  }, [isBrowser])

  const startProjectsTour = useCallback(async (options?: { auto?: boolean }) => {
    if (!isBrowser) return

    currentTourModeRef.current = options?.auto ? 'auto' : 'manual'

    if (tourRef.current) {
      tourRef.current.cancel()
      tourRef.current = null
    }

    setShowTourCompletionPrompt(false)
    setTourCountdown(TOUR_COUNTDOWN_SECONDS)
    setShowCreateModal(false)

    if (!shepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: ProjectsShepherdType })?.default ?? (module as unknown as ProjectsShepherdType)
        shepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = shepherdRef.current
    if (!Shepherd) return

    const waitForElement = async (selector: string, retries = 15, delay = 120) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        if (document.querySelector(selector)) {
          return true
        }
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      return false
    }

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )

    await waitForElement('[data-tour-id="projects-header"]')
    await waitForElement('[data-tour-id="projects-guide-button"]')
    await waitForElement('[data-tour-id="projects-stats"]')
    await waitForElement('[data-tour-id="projects-tab"]')
    await waitForElement('[data-tour-id="projects-create-button"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'projects-intro',
      title: 'Trung tâm Dự án',
      text: 'Trang này giúp bạn quản lý tiến độ dự án, theo dõi số liệu và mở nhanh công cụ lập kế hoạch.',
      attachTo: { element: '[data-tour-id="projects-header"]', on: 'bottom' },
      buttons: [
        {
          text: 'Bỏ qua',
          action: () => tour.cancel(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'projects-guide-button',
      title: 'Hướng dẫn từng bước',
      text: 'Bạn có thể mở lại tour hướng dẫn bất cứ lúc nào bằng nút này.',
      attachTo: { element: '[data-tour-id="projects-guide-button"]', on: 'left' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'projects-stats',
      title: 'Số liệu tổng quan',
      text: 'Các thẻ chỉ số giúp bạn nắm tình trạng dự án trước khi tạo mới hoặc cập nhật.',
      attachTo: { element: '[data-tour-id="projects-stats"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'projects-create-button',
      title: 'Tạo dự án mới',
      text: 'Nhấn nút này để mở form tạo dự án với mã tự động và thông tin chi tiết.',
      attachTo: { element: '[data-tour-id="projects-create-button"]', on: 'left' },
      when: {
        show: () => {
          setShowCreateModal(false)
        }
      },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: async () => {
            setShowCreateModal(true)
            await waitForElement('[data-tour-id="projects-create-modal"]', 25, 160)
            tour.next()
          }
        }
      ]
    })

    tour.addStep({
      id: 'projects-create-modal',
      title: 'Điền thông tin dự án',
      text: 'Form này hướng dẫn bạn nhập mã, khách hàng, đội ngũ và ngân sách. Đừng quên đặt trạng thái và tiến độ ban đầu.',
      attachTo: { element: '[data-tour-id="projects-create-modal"]', on: 'left' },
      when: {
        show: async () => {
          if (!showCreateModal) {
            setShowCreateModal(true)
            await new Promise((resolve) => setTimeout(resolve, 150))
          }
          await waitForElement('[data-tour-id="projects-create-modal"]', 25, 160)
        },
        hide: () => {
          setShowCreateModal(false)
        }
      },
      buttons: [
        {
          text: 'Quay lại',
          action: async () => {
            setShowCreateModal(false)
            await new Promise((resolve) => setTimeout(resolve, 150))
            await waitForElement('[data-tour-id="projects-create-button"]', 25, 160)
            tour.back()
          },
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: async () => {
            setShowCreateModal(false)
            await new Promise((resolve) => setTimeout(resolve, 150))
            await waitForElement('[data-tour-id="projects-grid"]', 25, 160)
            tour.next()
          }
        }
      ]
    })

    tour.addStep({
      id: 'projects-grid',
      title: 'Danh sách dự án',
      text: 'Sau khi lưu, dự án mới sẽ xuất hiện tại đây. Bạn có thể mở chi tiết, cập nhật tiến độ hoặc phân công đội ngũ.',
      attachTo: { element: '[data-tour-id="projects-grid"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Hoàn tất',
          action: () => tour.complete()
        }
      ]
    })

    tour.on('complete', () => {
      handleTourComplete()
      tourRef.current = null
    })

    tour.on('cancel', () => {
      handleTourCancel()
      tourRef.current = null
      setShowCreateModal(false)
    })

    tourRef.current = tour
    setIsTourRunning(true)
    tour.start()
  }, [handleTourCancel, handleTourComplete, isBrowser, showCreateModal])

  const handleRestartTour = useCallback(() => {
    setShowTourCompletionPrompt(false)
    setTourCountdown(TOUR_COUNTDOWN_SECONDS)
    startProjectsTour()
  }, [startProjectsTour])

  useEffect(() => {
    checkUser()
    fetchStats()
  }, [])

  useEffect(() => {
    if (!isBrowser) return
    if (autoStartAttemptedRef.current) return

    const storedStatus = localStorage.getItem(TOUR_STORAGE_KEY)
    autoStartAttemptedRef.current = true

    if (!storedStatus) {
      startProjectsTour({ auto: true })
    }
  }, [isBrowser, startProjectsTour])

  useEffect(() => {
    if (!showTourCompletionPrompt) return

    if (tourCountdown <= 0) {
      setShowTourCompletionPrompt(false)
      setTourCountdown(TOUR_COUNTDOWN_SECONDS)
      return
    }

    const timer = window.setTimeout(() => {
      setTourCountdown((prev) => prev - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [showTourCompletionPrompt, tourCountdown])

  useEffect(() => {
    return () => {
      tourRef.current?.cancel()
      tourRef.current?.destroy?.()
      tourRef.current = null
    }
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
    <LayoutWithSidebar user={user || undefined} onLogout={() => router.push('/login')}>
      <div className="w-full">
        {/* Sticky Top Navigation */}
        <div data-tour-id="projects-header">
          <StickyTopNav 
            title="Dự án" 
            subtitle="Quản lý và theo dõi dự án"
          >
            <button
              onClick={() => startProjectsTour()}
              disabled={isTourRunning}
              data-tour-id="projects-guide-button"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                isTourRunning
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title="Bắt đầu tour hướng dẫn tạo dự án"
            >
              <CircleHelp className="h-5 w-5" />
              Hướng dẫn
            </button>
            <button
              onClick={() => router.push('/projects/kanban')}
              className="flex items-center gap-2 px-4 py-2 text-black bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Kanban
            </button>
            <button
              onClick={handleCreateProject}
              data-tour-id="projects-create-button"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="h-5 w-5" />
              Dự án mới
            </button>
          </StickyTopNav>
        </div>

        {/* Page content */}
        <div className="px-2 sm:px-4 lg:px-6 xl:px-8 py-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-tour-id="projects-stats">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Tổng dự án</p>
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
                <p className="text-sm font-medium text-black">Dự án đang hoạt động</p>
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
                <p className="text-sm font-medium text-black">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-black">{stats.completed}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                <Target className="h-6 w-6 text-black" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Tạm dừng</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.onHold}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border" data-tour-id="projects-tab">
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
                <BarChart3 className="mx-auto h-12 w-12 text-black mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Project Reports</h3>
                <p className="text-black mb-4">
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

      {showTourCompletionPrompt && (
        <div className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 max-w-sm bg-white border border-gray-200 rounded-xl shadow-xl p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bạn cần hướng dẫn lại phần nào?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Tour sẽ đóng sau {tourCountdown}s. Bạn có thể khởi động lại ngay để xem lại các bước tạo dự án.
          </p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setShowTourCompletionPrompt(false)
                setTourCountdown(TOUR_COUNTDOWN_SECONDS)
              }}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Để sau
            </button>
            <button
              onClick={handleRestartTour}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Bắt đầu lại tour
            </button>
          </div>
        </div>
      )}

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
  </LayoutWithSidebar>
  )
}