'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  FileText, 
  Receipt, 
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  User,
  Building
} from 'lucide-react'

interface RevenueBreakdown {
  invoices: number
  sales_receipts: number
  other: number
}

interface RevenueItem {
  id: string
  type: 'invoice' | 'sales_receipt' | 'other'
  description: string
  amount: number
  date: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  customer?: string
  customer_name?: string
}

interface ProjectRevenueAnalysisProps {
  projectId: string
  projectName: string
}

const typeConfig = {
  invoice: {
    label: 'Hóa đơn',
    icon: FileText,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  sales_receipt: {
    label: 'Biên lai bán hàng',
    icon: Receipt,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
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
  draft: {
    label: 'Nháp',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock
  },
  sent: {
    label: 'Đã gửi',
    color: 'bg-blue-100 text-blue-800',
    icon: FileText
  },
  paid: {
    label: 'Đã thanh toán',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  overdue: {
    label: 'Quá hạn',
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle
  }
}

export default function ProjectRevenueAnalysis({ projectId, projectName }: ProjectRevenueAnalysisProps) {
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null)
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'chart' | 'list'>('chart')
  const [filterType, setFilterType] = useState<'all' | 'invoice' | 'sales_receipt' | 'other'>('all')

  useEffect(() => {
    fetchRevenueData()
  }, [projectId])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/revenue-analysis`)
      if (response.ok) {
        const data = await response.json()
        setRevenueBreakdown(data.breakdown)
        setRevenueItems(data.items || [])
      } else {
        setError('Failed to load revenue data')
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      setError('Error loading revenue data')
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

  const getTotalRevenue = () => {
    if (!revenueBreakdown) return 0
    return revenueBreakdown.invoices + revenueBreakdown.sales_receipts + revenueBreakdown.other
  }

  const getTypePercentage = (amount: number) => {
    const total = getTotalRevenue()
    if (total === 0) return 0
    return (amount / total) * 100
  }

  const getFilteredItems = () => {
    if (filterType === 'all') return revenueItems
    return revenueItems.filter(item => item.type === filterType)
  }

  const getStatusStats = () => {
    const stats = {
      total: revenueItems.length,
      paid: revenueItems.filter(item => item.status === 'paid').length,
      pending: revenueItems.filter(item => item.status === 'sent').length,
      overdue: revenueItems.filter(item => item.status === 'overdue').length
    }
    return stats
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

  if (!revenueBreakdown) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No revenue data available</p>
      </div>
    )
  }

  const statusStats = getStatusStats()
  const filteredItems = getFilteredItems()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Phân tích Doanh thu</h3>
          <p className="text-sm text-gray-600">Chi tiết doanh thu theo nguồn cho dự án {projectName}</p>
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

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng số</p>
              <p className="text-xl font-bold text-gray-900">{statusStats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đã thanh toán</p>
              <p className="text-xl font-bold text-green-600">{statusStats.paid}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Chờ thanh toán</p>
              <p className="text-xl font-bold text-yellow-600">{statusStats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Quá hạn</p>
              <p className="text-xl font-bold text-red-600">{statusStats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(revenueBreakdown).map(([type, amount]) => {
          const config = typeConfig[type as keyof typeof typeConfig]
          const Icon = config.icon
          const percentage = getTypePercentage(amount)
          
          return (
            <div key={type} className="bg-white rounded-lg shadow-sm border p-4">
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
          {/* Revenue Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Phân bổ Doanh thu</h4>
            <div className="space-y-4">
              {Object.entries(revenueBreakdown).map(([type, amount]) => {
                const config = typeConfig[type as keyof typeof typeConfig]
                const percentage = getTypePercentage(amount)
                const Icon = config.icon
                
                return (
                  <div key={type} className="flex items-center gap-4">
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

          {/* Revenue Trends */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan Doanh thu</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Tổng doanh thu</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(getTotalRevenue())}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(revenueBreakdown).map(([type, amount]) => {
                  const config = typeConfig[type as keyof typeof typeConfig]
                  const percentage = getTypePercentage(amount)
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
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
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Lọc theo loại:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="invoice">Hóa đơn</option>
              <option value="sales_receipt">Biên lai</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Revenue Items */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h4 className="text-lg font-semibold text-gray-900">Chi tiết Doanh thu</h4>
              <p className="text-sm text-gray-600">Danh sách các khoản doanh thu theo thời gian</p>
            </div>
            
            {filteredItems.length > 0 ? (
              <div className="divide-y">
                {filteredItems.map((item) => {
                  const config = typeConfig[item.type]
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
                              {item.customer_name && <span>• {item.customer_name}</span>}
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
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có dữ liệu doanh thu</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-green-900">Quản lý Doanh thu</h4>
            <p className="text-sm text-green-700">Tạo hóa đơn và biên lai bán hàng</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Tạo hóa đơn
            </button>
            <button className="px-4 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
              Biên lai bán hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

