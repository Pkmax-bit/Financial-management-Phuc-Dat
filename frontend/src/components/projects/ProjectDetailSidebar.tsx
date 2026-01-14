'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  CheckSquare,
  Clock,
  DollarSign,
  Edit,
  Edit2,
  MessageSquare,
  Pause,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'
import ProjectTeam from './ProjectTeam'
import ProjectTasksTab from './ProjectTasksTab'
import ProjectStatusBar from './ProjectStatusBar'
import CreateQuoteSidebarFullscreen from '@/components/sales/CreateQuoteSidebarFullscreen'
import CreateProjectExpenseDialog from '@/components/expenses/CreateProjectExpenseDialog'
import { apiGet } from '@/lib/api'
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
  status_id?: string // ID của trạng thái từ bảng project_statuses
  category_id?: string // ID của nhóm dự án
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  billing_type: 'fixed' | 'hourly' | 'milestone'
  hourly_rate?: number
  created_at: string
  updated_at: string
}

interface ProjectDetailSidebarProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

const statusConfig = {
  planning: { label: 'Lập kế hoạch', color: 'bg-blue-100 text-blue-800', icon: Target },
  active: { label: 'Đang thực hiện', color: 'bg-green-100 text-green-800', icon: Activity },
  on_hold: { label: 'Tạm dừng', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  completed: { label: 'Hoàn thành', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: AlertCircle },
}

const priorityConfig = {
  low: { label: 'Thấp', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' },
}

export default function ProjectDetailSidebar(props: ProjectDetailSidebarProps) {
  const { isOpen, onClose, project, onEdit, onDelete } = props

  const [collapsed, setCollapsed] = useState({
    overview: false,
    timeline: true, // Ẩn timeline mặc định
    team: true,     // Ẩn đội ngũ mặc định
    tasks: false,
    quotes: false,
    expenses: false,
  })
  const [financialData, setFinancialData] = useState<any>(null)
  const [responsibleName, setResponsibleName] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const [showCreateQuote, setShowCreateQuote] = useState(false)
  const [showCreateExpense, setShowCreateExpense] = useState(false)
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null)
  const [quoteDetails, setQuoteDetails] = useState<Record<string, any>>({})
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(50) // Percentage
  const [isResizing, setIsResizing] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [editingProgress, setEditingProgress] = useState(false)
  const [progressValue, setProgressValue] = useState('')

  // Check if desktop on mount and resize
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  useEffect(() => {
    if (!isOpen || !project) return

    const fetchFinancial = async () => {
      try {
        const res = await fetch(getApiEndpoint(`/api/projects/${project.id}/financial-summary`))
        if (res.ok) {
          const data = await res.json()
          setFinancialData(data)
        }
      } catch (e) {
        console.error('Failed to fetch project financial summary', e)
      }
    }

    const fetchResponsible = async () => {
      try {
        const res = await fetch(getApiEndpoint(`/api/projects/${project.id}/team`))
        if (!res.ok) return
        const data = await res.json()
        const members = data?.team_members || data || []
        // Ưu tiên người có responsibility_type = 'accountable', sau đó 'responsible'
        const accountable = members.find((m: any) => m.responsibility_type === 'accountable')
        const responsible = members.find((m: any) => m.responsibility_type === 'responsible')
        const name =
          accountable?.name ||
          responsible?.name ||
          project.manager_name ||
          null
        setResponsibleName(name)
      } catch (e) {
        console.error('Failed to fetch project team for responsible member', e)
      }
    }

    fetchFinancial()
    fetchResponsible()
    fetchQuotes()
  }, [isOpen, project])

  const fetchQuotes = async () => {
    if (!project?.id) return
    try {
      setLoadingQuotes(true)
      // Fetch quotes directly from Supabase filtered by project_id
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setQuotes(data || [])
    } catch (e) {
      console.error('Failed to fetch project quotes', e)
      setQuotes([])
    } finally {
      setLoadingQuotes(false)
    }
  }

  const fetchQuoteDetails = async (quoteId: string) => {
    if (quoteDetails[quoteId]) return // Already fetched
    
    try {
      const { data, error } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setQuoteDetails(prev => ({
        ...prev,
        [quoteId]: data || []
      }))
    } catch (e) {
      console.error('Failed to fetch quote details', e)
      setQuoteDetails(prev => ({
        ...prev,
        [quoteId]: []
      }))
    }
  }

  const handleQuoteClick = (quoteId: string) => {
    if (expandedQuoteId === quoteId) {
      setExpandedQuoteId(null)
    } else {
      setExpandedQuoteId(quoteId)
      fetchQuoteDetails(quoteId)
    }
  }

  useEffect(() => {
    const handleClose = () => {
      if (isOpen) onClose()
    }

    window.addEventListener('closeProjectDetailSidebar', handleClose)
    return () => window.removeEventListener('closeProjectDetailSidebar', handleClose)
  }, [isOpen, onClose])

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const sidebar = document.querySelector('[data-sidebar-container]') as HTMLElement
      if (!sidebar) return
      
      const rect = sidebar.getBoundingClientRect()
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100
      
      // Limit between 30% and 70%
      const clampedWidth = Math.max(30, Math.min(70, newWidth))
      setLeftPanelWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  if (!isOpen || !project) return null

  const statusInfo = statusConfig[project.status] || {
    label: project.status,
    color: 'bg-gray-100 text-gray-800',
    icon: AlertCircle,
  }
  const priorityInfo = priorityConfig[project.priority] || {
    label: project.priority,
    color: 'bg-gray-100 text-gray-800',
  }
  const StatusIcon = statusInfo.icon

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)

  const formatDate = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : '—'

  const handleDeleteClick = async () => {
    if (!project) return
    if (!confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}"?`)) return

    try {
      const res = await fetch(getApiEndpoint(`/api/projects/${project.id}`), { method: 'DELETE' })
      if (res.ok) {
        onDelete(project)
        onClose()
      } else {
        alert('Không thể xóa dự án')
      }
    } catch (e) {
      console.error('Failed to delete project', e)
      alert('Không thể xóa dự án')
    }
  }

  const handleStartProgressEdit = () => {
    setProgressValue(project.progress.toString())
    setEditingProgress(true)
  }

  const handleCancelProgressEdit = () => {
    setEditingProgress(false)
    setProgressValue('')
  }

  const handleSaveProgress = async () => {
    const newProgress = parseInt(progressValue)
    if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
      alert('Tiến độ phải là số từ 0 đến 100')
      return
    }

    try {
      // Backend will automatically update status based on progress:
      // - progress >= 99.9% -> status = 'completed'
      // - 0% < progress < 100% -> status = 'active'
      // - progress = 0% -> status = 'planning'
      // Database trigger will also handle this automatically
      const res = await fetch(getApiEndpoint(`/api/projects/${project.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress: newProgress  // Backend will normalize to 0-1 scale and auto-update status
        })
      })

      if (res.ok) {
        setEditingProgress(false)
        setProgressValue('')
        // Dispatch custom event to refresh project data (status will be auto-updated)
        window.dispatchEvent(new CustomEvent('projectUpdated', { detail: { projectId: project.id } }))
      } else {
        alert('Không thể cập nhật tiến độ')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      alert('Không thể cập nhật tiến độ. Vui lòng thử lại.')
    }
  }

  const handleProgressKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveProgress()
    } else if (e.key === 'Escape') {
      handleCancelProgressEdit()
    }
  }

  return (
    <div>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel bên phải: có thể resize */}
      <div className="fixed inset-y-0 right-0 z-50 flex max-w-full items-stretch">
        <div 
          className="h-full w-screen max-w-7xl bg-white shadow-2xl rounded-l-lg overflow-hidden flex flex-col"
          data-sidebar-container
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h2>
              <p className="text-sm text-gray-600 mt-1">#{project.project_code}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => onEdit(project)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Chỉnh sửa"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Đóng"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Project Status Bar */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <ProjectStatusBar
              projectId={project.id}
              currentStatusId={project.status_id}
              currentStatusName={project.status}
              categoryId={project.category_id}
              onStatusChange={async (newStatus) => {
                console.log('Status changed to:', newStatus)
                // Refresh project data to show updated status and progress
                try {
                  const updatedProject = await apiGet(`/api/projects/${project.id}`)
                  // Update the project prop if the parent component supports it
                  // For now, we'll reload the page to ensure all data is updated
                  window.location.reload()
                } catch (error) {
                  console.error('Failed to refresh project data:', error)
                  // Fallback to page reload
                  window.location.reload()
                }
              }}
            />
          </div>

          {/* Main layout */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 border-t border-gray-200 relative">
            {/* LEFT Panel: Thông tin dự án (có thể resize) */}
            <div 
              className="flex flex-col min-h-0 bg-gray-50/40 transition-all"
              style={{ 
                width: isDesktop ? `${leftPanelWidth}%` : '100%',
                borderRight: isDesktop ? '1px solid #e5e7eb' : 'none'
              }}
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Tổng quan */}
                <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, overview: !prev.overview }))}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">Tổng quan</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {collapsed.overview ? 'Hiển thị' : 'Ẩn bớt'}
                    </span>
                  </button>
                  {!collapsed.overview && (
                    <div className="p-4 space-y-6">
                      {/* Status / Priority / Progress */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <StatusIcon className="h-5 w-5 text-gray-600" />
                            <h3 className="text-sm font-medium text-gray-700">Trạng thái</h3>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Target className="h-5 w-5 text-gray-600" />
                            <h3 className="text-sm font-medium text-gray-700">Ưu tiên</h3>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="h-5 w-5 text-gray-600" />
                            <h3 className="text-sm font-medium text-gray-700">Tiến độ</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingProgress ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={progressValue}
                                  onChange={(e) => setProgressValue(e.target.value)}
                                  onKeyPress={handleProgressKeyPress}
                                  className="w-16 px-2 py-1 text-sm !text-black border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  autoFocus
                                />
                                <button
                                  onClick={handleSaveProgress}
                                  className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                  title="Lưu"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={handleCancelProgressEdit}
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                  title="Hủy"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-2xl font-bold text-blue-600">{project.progress}%</span>
                                <button
                                  onClick={handleStartProgressEdit}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Chỉnh sửa tiến độ"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Thanh tiến độ */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-700">Tiến độ dự án</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{project.progress}%</span>
                            {!editingProgress && (
                              <button
                                onClick={handleStartProgressEdit}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Chỉnh sửa tiến độ"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {project.progress === 0
                            ? 'Dự án mới bắt đầu - Có thể nhập % để thay đổi tiến độ nhanh'
                            : project.progress < 25
                              ? 'Dự án mới bắt đầu'
                              : project.progress < 50
                                ? 'Đang triển khai'
                                : project.progress < 75
                                  ? 'Tiến triển tốt'
                                  : project.progress < 100
                                    ? 'Gần hoàn thành'
                                    : 'Đã hoàn thành'}
                        </p>
                        {editingProgress && (
                          <div className="mt-2 text-xs text-gray-500">
                            Nhấn Enter để lưu, Escape để hủy
                          </div>
                        )}
                      </div>

                      {/* Mô tả - chỉ hiển thị khi hover */}
                      {project.description && (
                        <div className="group relative bg-white rounded-lg border border-gray-200 p-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">Mô tả dự án</h3>
                          <div className="relative">
                            <p className="text-sm text-gray-600 break-words line-clamp-2 group-hover:line-clamp-none group-hover:max-h-none max-h-[3rem] overflow-hidden transition-all duration-200">
                              {project.description}
                            </p>
                            {project.description.length > 100 && (
                              <div className="absolute bottom-0 right-0 bg-gradient-to-l from-white via-white to-transparent px-2 text-xs text-gray-500 opacity-0 group-hover:opacity-0 transition-opacity pointer-events-none">
                                Hover để xem đầy đủ
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Thông tin cơ bản + tài chính */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Thông tin cơ bản</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Khách hàng:</span>
                              <span className="font-medium text-gray-900">
                                {project.customer_name || 'Chưa có'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Người chịu trách nhiệm:</span>
                              <span className="font-medium text-gray-900">
                                {responsibleName || project.manager_name || 'Chưa có'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Bắt đầu:</span>
                              <span className="font-medium text-gray-900">
                                {formatDate(project.start_date)}
                              </span>
                            </div>
                            {project.end_date && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Kết thúc:</span>
                                <span className="font-medium text-gray-900">
                                  {formatDate(project.end_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Thông tin tài chính</h3>
                          <div className="space-y-3">
                            {project.budget && (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Ngân sách:</span>
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(project.budget)}
                                </span>
                              </div>
                            )}
                            {project.actual_cost && (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Chi phí thực tế:</span>
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(project.actual_cost)}
                                </span>
                              </div>
                            )}
                            {project.budget && project.actual_cost && (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Chênh lệch:</span>
                                <span
                                  className={`font-medium ${project.actual_cost > project.budget ? 'text-red-600' : 'text-green-600'
                                    }`}
                                >
                                  {formatCurrency(project.actual_cost - project.budget)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Loại thanh toán:</span>
                              <span className="font-medium text-gray-900">
                                {project.billing_type === 'fixed'
                                  ? 'Cố định'
                                  : project.billing_type === 'hourly'
                                    ? 'Theo giờ'
                                    : 'Theo milestone'}
                              </span>
                            </div>
                            {project.hourly_rate && (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Giá/giờ:</span>
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(project.hourly_rate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tóm tắt tài chính */}
                      {financialData && (
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="h-5 w-5 text-gray-700" />
                            <h4 className="font-semibold text-gray-900">Tóm tắt tài chính</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Tổng doanh thu</p>
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(financialData.total_revenue || 0)}
                              </p>
                            </div>
                            <div className="text-center bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Tổng chi phí</p>
                              <p className="text-lg font-bold text-red-600">
                                {formatCurrency(financialData.total_costs || 0)}
                              </p>
                            </div>
                            <div className="text-center bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Lợi nhuận</p>
                              <p
                                className={`text-lg font-bold ${(financialData.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                              >
                                {formatCurrency(financialData.profit || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Timeline */}
                <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, timeline: !prev.timeline }))}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-semibold text-gray-900">Timeline</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {collapsed.timeline ? 'Hiển thị' : 'Ẩn bớt'}
                    </span>
                  </button>
                  {!collapsed.timeline && (
                    <div className="p-4">
                      <p className="text-sm text-gray-500 italic">
                        Timeline chi tiết sẽ hiển thị tại đây (có thể mở sang màn Timeline riêng).
                      </p>
                    </div>
                  )}
                </section>

                {/* Đội ngũ */}
                <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, team: !prev.team }))}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-semibold text-gray-900">Đội ngũ</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {collapsed.team ? 'Hiển thị' : 'Ẩn bớt'}
                    </span>
                  </button>
                  {!collapsed.team && project && (
                    <div className="p-4">
                      <ProjectTeam projectId={project.id} projectName={project.name} />
                    </div>
                  )}
                </section>

                {/* Nhiệm vụ */}
                <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, tasks: !prev.tasks }))}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-900">Nhiệm vụ</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {collapsed.tasks ? 'Hiển thị' : 'Ẩn bớt'}
                    </span>
                  </button>
                  {!collapsed.tasks && project && (
                    <div className="p-4">
                      <ProjectTasksTab projectId={project.id} projectName={project.name} />
                    </div>
                  )}
                </section>

                {/* Báo giá */}
                <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, quotes: !prev.quotes }))}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-900">Báo giá</span>
                      {quotes.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {quotes.length}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {collapsed.quotes ? 'Hiển thị' : 'Ẩn bớt'}
                    </span>
                  </button>
                  {!collapsed.quotes && project && (
                    <div className="p-4 space-y-4">
                      {/* Nút tạo báo giá */}
                      <button
                        onClick={() => setShowCreateQuote(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tạo báo giá mới</span>
                      </button>

                      {/* Danh sách báo giá */}
                      {loadingQuotes ? (
                        <div className="text-center py-4 text-sm text-gray-500">Đang tải...</div>
                      ) : quotes.length === 0 ? (
                        <div className="text-center py-8 text-sm text-gray-500">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Chưa có báo giá nào</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {quotes.map((quote) => {
                            const isExpanded = expandedQuoteId === quote.id
                            const items = quoteDetails[quote.id] || []
                            
                            return (
                              <div
                                key={quote.id}
                                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                              >
                                {/* Quote Header - Clickable */}
                                <div
                                  onClick={() => handleQuoteClick(quote.id)}
                                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <button className="p-0.5 hover:bg-gray-200 rounded transition-colors">
                                          {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-gray-600" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                          )}
                                        </button>
                                        <span className="font-semibold text-gray-900">
                                          #{quote.quote_number}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            quote.status === 'accepted'
                                              ? 'bg-green-100 text-green-700'
                                              : quote.status === 'sent'
                                                ? 'bg-blue-100 text-blue-700'
                                                : quote.status === 'declined'
                                                  ? 'bg-red-100 text-red-700'
                                                  : 'bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {quote.status === 'accepted'
                                            ? 'Đã chấp nhận'
                                            : quote.status === 'sent'
                                              ? 'Đã gửi'
                                              : quote.status === 'declined'
                                                ? 'Đã từ chối'
                                                : quote.status === 'draft'
                                                  ? 'Nháp'
                                                  : quote.status}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-600 space-y-1 ml-6">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3 w-3" />
                                          <span>
                                            Ngày phát hành: {formatDate(quote.issue_date)}
                                          </span>
                                        </div>
                                        {quote.valid_until && (
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                              Có hiệu lực đến: {formatDate(quote.valid_until)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-purple-600">
                                        {formatCurrency(quote.total_amount)}
                                      </div>
                                      {quote.subtotal && quote.total_amount !== quote.subtotal && (
                                        <div className="text-xs text-gray-500 line-through">
                                          {formatCurrency(quote.subtotal)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {quote.notes && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 ml-6">
                                      <p className="text-xs text-gray-600 line-clamp-2">{quote.notes}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Quote Details - Expandable */}
                                {isExpanded && (
                                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                                    {items.length === 0 ? (
                                      <div className="text-center py-4 text-sm text-gray-500">
                                        Đang tải chi tiết...
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        {/* Items Table */}
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr className="border-b border-gray-300">
                                                <th className="text-left py-2 px-2 font-semibold text-gray-700">Sản phẩm</th>
                                                <th className="text-left py-2 px-2 font-semibold text-gray-700">Kích thước</th>
                                                <th className="text-right py-2 px-2 font-semibold text-gray-700">Số lượng</th>
                                                <th className="text-right py-2 px-2 font-semibold text-gray-700">Đơn giá</th>
                                                <th className="text-right py-2 px-2 font-semibold text-gray-700">Thành tiền</th>
                                                <th className="text-center py-2 px-2 font-semibold text-gray-700">Thuế</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {items.map((item: any, index: number) => {
                                                // Format số với dấu phẩy phân cách hàng nghìn
                                                const formatNumber = (num: number | null | undefined) => {
                                                  if (!num) return ''
                                                  return new Intl.NumberFormat('vi-VN', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2
                                                  }).format(num)
                                                }
                                                
                                                const dimensions = []
                                                if (item.length) {
                                                  dimensions.push({ label: 'Ngang', value: formatNumber(item.length), unit: 'mm' })
                                                }
                                                if (item.height) {
                                                  dimensions.push({ label: 'Cao', value: formatNumber(item.height), unit: 'mm' })
                                                }
                                                if (item.depth) {
                                                  dimensions.push({ label: 'Sâu', value: formatNumber(item.depth), unit: 'mm' })
                                                }
                                                if (item.area) {
                                                  dimensions.push({ label: 'Diện tích', value: formatNumber(item.area), unit: 'm²' })
                                                }
                                                if (item.volume) {
                                                  dimensions.push({ label: 'Thể tích', value: formatNumber(item.volume), unit: 'm³' })
                                                }
                                                
                                                return (
                                                  <tr key={item.id || index} className="border-b border-gray-200">
                                                    <td className="py-2 px-2">
                                                      <div>
                                                        <div className="font-medium text-gray-900">
                                                          {item.name_product || item.description || 'Không có tên'}
                                                        </div>
                                                        {item.description && item.description !== item.name_product && (
                                                          <div className="text-xs text-gray-500 mt-0.5">
                                                            {item.description}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-gray-700">
                                                      {dimensions.length > 0 ? (
                                                        <div className="text-xs space-y-1">
                                                          {dimensions.map((dim, i) => (
                                                            <div key={i} className="flex items-center gap-1">
                                                              <span className="font-medium text-gray-700">{dim.label}:</span>
                                                              <span className="text-gray-900">{dim.value}</span>
                                                              <span className="text-gray-500">{dim.unit}</span>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      ) : (
                                                        <span className="text-gray-400">—</span>
                                                      )}
                                                    </td>
                                                    <td className="py-2 px-2 text-right text-gray-700">
                                                      {item.quantity || 0} {item.unit || ''}
                                                    </td>
                                                    <td className="py-2 px-2 text-right text-gray-700">
                                                      {formatCurrency(item.unit_price || 0)}
                                                    </td>
                                                    <td className="py-2 px-2 text-right font-medium text-gray-900">
                                                      {formatCurrency(item.total_price || 0)}
                                                    </td>
                                                    <td className="py-2 px-2 text-center">
                                                      {item.tax_rate ? (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                          {item.tax_rate}%
                                                        </span>
                                                      ) : (
                                                        <span className="text-xs text-gray-400">Không</span>
                                                      )}
                                                    </td>
                                                  </tr>
                                                )
                                              })}
                                            </tbody>
                                          </table>
                                        </div>

                                        {/* Summary */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tổng tiền hàng:</span>
                                            <span className="font-medium text-gray-900">
                                              {formatCurrency(quote.subtotal || 0)}
                                            </span>
                                          </div>
                                          {quote.tax_rate && quote.tax_rate > 0 && (
                                            <div className="flex justify-between text-sm">
                                              <span className="text-gray-600">
                                                Thuế:
                                              </span>
                                              <span className="font-medium text-gray-900">
                                                {formatCurrency(quote.tax_amount || 0)}
                                              </span>
                                            </div>
                                          )}
                                          {quote.discount_amount && quote.discount_amount > 0 && (
                                            <div className="flex justify-between text-sm">
                                              <span className="text-gray-600">Giảm giá:</span>
                                              <span className="font-medium text-red-600">
                                                -{formatCurrency(quote.discount_amount)}
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex justify-between pt-2 border-t border-gray-200">
                                            <span className="font-semibold text-gray-900">Tổng cộng:</span>
                                            <span className="text-lg font-bold text-purple-600">
                                              {formatCurrency(quote.total_amount || 0)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Chi phí dự án kế hoạch */}
                <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, expenses: !prev.expenses }))}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-900">Chi phí dự án kế hoạch</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {collapsed.expenses ? 'Hiển thị' : 'Ẩn bớt'}
                    </span>
                  </button>
                  {!collapsed.expenses && project && (
                    <div className="p-4 space-y-4">
                      {/* Hiển thị chi phí dự án kế hoạch */}
                      {project.budget && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-semibold text-gray-900">Tổng chi phí kế hoạch</span>
                            </div>
                            <span className="text-lg font-bold text-green-700">
                              {formatCurrency(project.budget)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Nút tạo chi phí dự án kế hoạch */}
                      <button
                        onClick={() => setShowCreateExpense(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tạo chi phí dự án kế hoạch</span>
                      </button>
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Resizer Bar */}
            {isDesktop && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize z-10 transition-colors"
                style={{ left: `${leftPanelWidth}%`, transform: 'translateX(-50%)' }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsResizing(true)
                }}
              />
            )}

            {/* RIGHT Panel: Chat - Zalo style (có thể resize) */}
            <aside 
              className="flex flex-col min-h-0 bg-[#e5ddd5] transition-all"
              style={{ 
                width: isDesktop ? `${100 - leftPanelWidth}%` : '100%'
              }}
            >
              {/* Zalo-style header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-sm backdrop-blur-sm">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Trao đổi dự án</h2>
                    <p className="text-xs text-blue-100">Chat nội bộ • Online</p>
                  </div>
                </div>
              </div>

              {/* Chat messages area with Zalo background pattern */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#e5ddd5]">
                {project && (
                  <ProjectTasksTab projectId={project.id} projectName={project.name} mode="chat-only" />
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Create Quote Modal */}
      {showCreateQuote && project && (
        <CreateQuoteSidebarFullscreen
          isOpen={showCreateQuote}
          onClose={() => {
            setShowCreateQuote(false)
            fetchQuotes() // Refresh quotes after closing
          }}
          onSuccess={() => {
            setShowCreateQuote(false)
            fetchQuotes() // Refresh quotes after success
          }}
          initialProjectId={project.id}
          initialCustomerId={project.customer_id}
        />
      )}

      {/* Create Project Expense Dialog */}
      {showCreateExpense && project && (
        <CreateProjectExpenseDialog
          isOpen={showCreateExpense}
          onClose={() => {
            setShowCreateExpense(false)
            // Refresh project data to get updated budget
            if (isOpen && project) {
              fetch(getApiEndpoint(`/api/projects/${project.id}`))
                .then(res => res.json())
                .then(data => {
                  // Update project budget if available
                  if (data && data.budget) {
                    // Trigger re-render by updating state if needed
                  }
                })
                .catch(err => console.error('Failed to refresh project data', err))
            }
          }}
          onSuccess={() => {
            setShowCreateExpense(false)
            // Refresh project data to get updated budget
            if (isOpen && project) {
              fetch(getApiEndpoint(`/api/projects/${project.id}`))
                .then(res => res.json())
                .then(data => {
                  // Update project budget if available
                  if (data && data.budget) {
                    // Trigger re-render by updating state if needed
                  }
                })
                .catch(err => console.error('Failed to refresh project data', err))
            }
          }}
          category="planned"
          initialProjectId={project.id}
        />
      )}
    </div>
  )
}

