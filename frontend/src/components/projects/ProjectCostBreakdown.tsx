'use client'

import { useState, useEffect } from 'react'
import { getApiEndpoint } from '@/lib/apiUrl'
import { 
  TrendingDown, 
  Users, 
  Package, 
  Building, 
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  PieChart,
  BarChart3
} from 'lucide-react'

interface CostBreakdown {
  labor: number
  materials: number
  overhead: number
  other: number
}

interface CostItem {
  id: string
  category: string
  description: string
  amount: number
  date: string
  status: 'pending' | 'approved' | 'paid'
  vendor?: string
}

interface ProjectCostBreakdownProps {
  projectId: string
  projectName: string
}

const categoryConfig = {
  labor: {
    label: 'Nhân công',
    icon: Users,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  materials: {
    label: 'Vật liệu',
    icon: Package,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  overhead: {
    label: 'Chi phí chung',
    icon: Building,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  other: {
    label: 'Khác',
    icon: MoreHorizontal,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700'
  }
}

const statusConfig = {
  pending: {
    label: 'Chờ duyệt',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  approved: {
    label: 'Đã duyệt',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle
  },
  paid: {
    label: 'Đã thanh toán',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  }
}

export default function ProjectCostBreakdown({ projectId, projectName }: ProjectCostBreakdownProps) {
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [costItems, setCostItems] = useState<CostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'chart' | 'list'>('chart')

  useEffect(() => {
    fetchCostData()
  }, [projectId])

  const fetchCostData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiEndpoint(`/api/projects/${projectId}/cost-breakdown`)
      if (response.ok) {
        const data = await response.json()
        setCostBreakdown(data.breakdown)
        setCostItems(data.items || [])
      } else {
        setError('Failed to load cost data')
      }
    } catch (error) {
      console.error('Error fetching cost data:', error)
      setError('Error loading cost data')
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
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getTotalCosts = () => {
    if (!costBreakdown) return 0
    return costBreakdown.labor + costBreakdown.materials + costBreakdown.overhead + costBreakdown.other
  }

  const getCategoryPercentage = (amount: number) => {
    const total = getTotalCosts()
    if (total === 0) return 0
    return (amount / total) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!costBreakdown) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No cost data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Phân tích Chi phí</h3>
          <p className="text-sm text-gray-600">Chi tiết chi phí theo danh mục cho dự án {projectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('chart')}
            className={`p-2 rounded-lg transition-colors ${
              activeView === 'chart' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Xem biểu đồ"
          >
            <PieChart className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`p-2 rounded-lg transition-colors ${
              activeView === 'list' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Xem danh sách"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(costBreakdown).map(([category, amount]) => {
          const config = categoryConfig[category as keyof typeof categoryConfig]
          const Icon = config.icon
          const percentage = getCategoryPercentage(amount)
          
          return (
            <div key={category} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <Icon className={`h-5 w-5 ${config.textColor}`} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{config.label}</h4>
                  <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${config.color}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart View */}
      {activeView === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart Representation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Phân bổ Chi phí</h4>
            <div className="space-y-4">
              {Object.entries(costBreakdown).map(([category, amount]) => {
                const config = categoryConfig[category as keyof typeof categoryConfig]
                const percentage = getCategoryPercentage(amount)
                const Icon = config.icon
                
                return (
                  <div key={category} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-4 h-4 rounded ${config.color}`}></div>
                      <span className="text-sm font-medium text-gray-900">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(amount)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cost Trends */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng Chi phí</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Tổng chi phí</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(getTotalCosts())}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(costBreakdown).map(([category, amount]) => {
                  const config = categoryConfig[category as keyof typeof categoryConfig]
                  const percentage = getCategoryPercentage(amount)
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{config.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${config.color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-20 text-right">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {activeView === 'list' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h4 className="text-lg font-semibold text-gray-900">Chi tiết Chi phí</h4>
            <p className="text-sm text-gray-600">Danh sách các khoản chi phí theo thời gian</p>
          </div>
          
          {costItems.length > 0 ? (
            <div className="divide-y">
              {costItems.map((item) => {
                const config = categoryConfig[item.category as keyof typeof categoryConfig]
                const statusInfo = statusConfig[item.status]
                const StatusIcon = statusInfo.icon
                const Icon = config.icon
                
                return (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <Icon className={`h-4 w-4 ${config.textColor}`} />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{item.description}</h5>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{config.label}</span>
                            {item.vendor && <span>• {item.vendor}</span>}
                            <span>• {formatDate(item.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <StatusIcon className="h-4 w-4" />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có dữ liệu chi phí</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Quản lý Chi phí</h4>
            <p className="text-sm text-blue-700">Thêm và theo dõi chi phí dự án</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Thêm chi phí
            </button>
            <button className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              Xuất báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

