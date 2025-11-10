'use client'

import { useState, useEffect } from 'react'
import { X, Edit, Trash2, Calendar, DollarSign, Users, Target, Clock, TrendingUp, BarChart3, Receipt, CreditCard, FileText, Activity, AlertCircle, CheckCircle, Pause } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { projectApi } from '@/lib/api'
import { getApiEndpoint } from '@/lib/apiUrl'
import ProjectTeam from './ProjectTeam'
import ProjectTimeline from './ProjectTimeline'
import ProjectInvoices from './ProjectInvoices'
import ProjectExpenses from './ProjectExpenses'

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

const statusConfig = {
  planning: { label: 'Lập kế hoạch', color: 'bg-blue-100 text-blue-800', icon: Target },
  active: { label: 'Đang thực hiện', color: 'bg-green-100 text-green-800', icon: Activity },
  on_hold: { label: 'Tạm dừng', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  completed: { label: 'Hoàn thành', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: AlertCircle }
}

const priorityConfig = {
  low: { label: 'Thấp', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' }
}

export default function ProjectDetailSidebar({ isOpen, onClose, project, onEdit, onDelete }: ProjectDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'team' | 'invoices' | 'expenses'>('overview')
  const [financialData, setFinancialData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (isOpen && project) {
      fetchFinancialData()
      fetchUser()
    }
  }, [isOpen, project])

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview')
    }
  }, [isOpen])

  // Listen for events to close sidebar when create quote dialog opens
  useEffect(() => {
    const handleCloseSidebar = () => {
      if (isOpen) {
        onClose()
      }
    }

    // Listen for custom events when create quote dialog opens
    window.addEventListener('closeProjectDetailSidebar', handleCloseSidebar)

    return () => {
      window.removeEventListener('closeProjectDetailSidebar', handleCloseSidebar)
    }
  }, [isOpen, onClose])

  const fetchUser = async () => {
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
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchFinancialData = async () => {
    if (!project) return

    try {
      setLoading(true)
      const response = await fetch(getApiEndpoint(`/api/projects/${project.id}/financial-summary`))
      if (response.ok) {
        const data = await response.json()
        setFinancialData(data)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    if (window.confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}"?`)) {
      try {
        const response = await fetch(getApiEndpoint(`/api/projects/${project.id}`), {
          method: 'DELETE'
        })
        
        if (response.ok) {
          onDelete(project)
          onClose()
        } else {
          alert('Không thể xóa dự án')
        }
      } catch (error) {
        console.error('Error deleting project:', error)
        alert('Không thể xóa dự án')
      }
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

  if (!isOpen || !project) return null

  const statusInfo = statusConfig[project.status]
  const priorityInfo = priorityConfig[project.priority]
  const StatusIcon = statusInfo.icon

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 transition-opacity duration-300 "
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
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
                onClick={handleDelete}
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

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white flex-shrink-0 overflow-x-auto">
            <div className="flex space-x-1 px-4">
              {[
                { id: 'overview', label: 'Tổng quan', icon: BarChart3, color: 'blue' },
                { id: 'timeline', label: 'Timeline', icon: Calendar, color: 'orange' },
                { id: 'team', label: 'Đội ngũ', icon: Users, color: 'indigo' },
                { id: 'invoices', label: 'Hóa đơn', icon: Receipt, color: 'green' },
                { id: 'expenses', label: 'Chi phí', icon: CreditCard, color: 'red' }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium whitespace-nowrap ${
                      isActive
                        ? `bg-${tab.color}-50 text-${tab.color}-700 border border-${tab.color}-200 shadow-sm`
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? `text-${tab.color}-600` : ''}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Status and Priority Cards */}
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

                  {/* Progress Bar */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700">Tiến độ dự án</span>
                      <span className="font-medium text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {project.progress === 0 ? 'Dự án mới bắt đầu - Có thể nhập % để thay đổi tiến độ nhanh' :
                       project.progress < 25 ? 'Dự án mới bắt đầu' :
                       project.progress < 50 ? 'Đang triển khai' :
                       project.progress < 75 ? 'Tiến triển tốt' :
                       project.progress < 100 ? 'Gần hoàn thành' : 'Đã hoàn thành'}
                    </p>
                  </div>

                  {/* Project Info */}
                  {project.description && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Mô tả dự án</h3>
                      <p className="text-sm text-gray-600 break-words">{project.description}</p>
                    </div>
                  )}

                  {/* Project Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Thông tin cơ bản</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Khách hàng:</span>
                          <span className="font-medium text-gray-900">{project.customer_name || 'Chưa có'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Quản lý:</span>
                          <span className="font-medium text-gray-900">{project.manager_name || 'Chưa có'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Bắt đầu:</span>
                          <span className="font-medium text-gray-900">{formatDate(project.start_date)}</span>
                        </div>
                        {project.end_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Kết thúc:</span>
                            <span className="font-medium text-gray-900">{formatDate(project.end_date)}</span>
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
                            <span className="font-medium text-gray-900">{formatCurrency(project.budget)}</span>
                          </div>
                        )}
                        {project.actual_cost && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Chi phí thực tế:</span>
                            <span className="font-medium text-gray-900">{formatCurrency(project.actual_cost)}</span>
                          </div>
                        )}
                        {project.budget && project.actual_cost && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Chênh lệch:</span>
                            <span className={`font-medium ${
                              project.actual_cost > project.budget ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatCurrency(project.actual_cost - project.budget)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Loại thanh toán:</span>
                          <span className="font-medium text-gray-900">
                            {project.billing_type === 'fixed' ? 'Cố định' : 
                             project.billing_type === 'hourly' ? 'Theo giờ' : 'Theo milestone'}
                          </span>
                        </div>
                        {project.hourly_rate && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Giá/giờ:</span>
                            <span className="font-medium text-gray-900">{formatCurrency(project.hourly_rate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
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
                          <p className={`text-lg font-bold ${
                            (financialData.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(financialData.profit || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Transactions */}
                  {financialData?.recent_transactions && financialData.recent_transactions.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Giao dịch gần đây</h4>
                      <div className="space-y-2">
                        {financialData.recent_transactions.slice(0, 5).map((transaction: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{transaction.type}</p>
                              <p className="text-xs text-gray-600">{transaction.description}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${
                                transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                              </p>
                              <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && project && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <ProjectTimeline projectId={project.id} projectName={project.name} currentUser={user} />
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && project && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <ProjectTeam projectId={project.id} projectName={project.name} currentUser={user} />
                </div>
              )}

              {/* Invoices Tab */}
              {activeTab === 'invoices' && project && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <ProjectInvoices projectId={project.id} projectName={project.name} />
                </div>
              )}

              {/* Expenses Tab */}
              {activeTab === 'expenses' && project && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <ProjectExpenses projectId={project.id} projectName={project.name} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
