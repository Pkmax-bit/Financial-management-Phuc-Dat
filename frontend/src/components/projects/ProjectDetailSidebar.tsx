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
  MessageSquare,
  Pause,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'
import ProjectTeam from './ProjectTeam'
import ProjectTasksTab from './ProjectTasksTab'

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
    timeline: false,
    team: false,
    tasks: false,
  })
  const [financialData, setFinancialData] = useState<any>(null)
  const [responsibleName, setResponsibleName] = useState<string | null>(null)

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
  }, [isOpen, project])

  useEffect(() => {
    const handleClose = () => {
      if (isOpen) onClose()
    }

    window.addEventListener('closeProjectDetailSidebar', handleClose)
    return () => window.removeEventListener('closeProjectDetailSidebar', handleClose)
  }, [isOpen, onClose])

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

  return (
    <div>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel bên phải: 50% info + 50% chat */}
      <div className="fixed inset-y-0 right-0 z-50 flex max-w-full items-stretch">
        <div className="h-full w-screen max-w-7xl bg-white shadow-2xl rounded-l-lg overflow-hidden flex flex-col">
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

          {/* Main layout */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 border-t border-gray-200">
            {/* LEFT 50%: Thông tin dự án (gộp tất cả tab) */}
            <div className="w-full lg:w-1/2 flex flex-col min-h-0 border-r border-gray-200 bg-gray-50/40">
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
                          <span className="text-2xl font-bold text-blue-600">{project.progress}%</span>
                        </div>
                      </div>

                      {/* Thanh tiến độ */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-700">Tiến độ dự án</span>
                          <span className="font-medium text-gray-900">{project.progress}%</span>
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
                      </div>

                      {/* Mô tả */}
                      {project.description && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">Mô tả dự án</h3>
                          <p className="text-sm text-gray-600 break-words">{project.description}</p>
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
              </div>
            </div>

            {/* RIGHT 50%: Chat - Zalo style */}
            <aside className="w-full lg:w-1/2 flex flex-col min-h-0 bg-[#e5ddd5]">
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
              <div className="flex-1 overflow-y-auto bg-[#e5ddd5]">
                {project && (
                  <ProjectTasksTab projectId={project.id} projectName={project.name} mode="chat-only" />
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

