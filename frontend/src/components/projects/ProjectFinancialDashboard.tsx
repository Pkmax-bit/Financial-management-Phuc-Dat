'use client'

import { useState, useEffect } from 'react'
import { getApiEndpoint } from '@/lib/apiUrl'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3,
  PieChart,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface FinancialData {
  planned_revenue: number
  actual_revenue: number
  planned_costs: number
  actual_costs: number
  profit_margin_planned: number
  profit_margin_actual: number
  cost_breakdown: {
    labor: number
    materials: number
    overhead: number
    other: number
  }
  revenue_breakdown: {
    invoices: number
    sales_receipts: number
    other: number
  }
  monthly_data: Array<{
    month: string
    planned_revenue: number
    actual_revenue: number
    planned_costs: number
    actual_costs: number
  }>
}

interface ProjectFinancialDashboardProps {
  projectId: string
  projectName: string
}

export default function ProjectFinancialDashboard({ projectId, projectName }: ProjectFinancialDashboardProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'revenue' | 'timeline'>('overview')

  useEffect(() => {
    fetchFinancialData()
  }, [projectId])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiEndpoint(`/api/projects/${projectId}/financial-dashboard`))
      if (response.ok) {
        const data = await response.json()
        setFinancialData(data)
      } else {
        setError('Failed to load financial data')
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
      setError('Error loading financial data')
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

  const calculateVariance = (actual: number, planned: number) => {
    if (planned === 0) return 0
    return ((actual - planned) / planned) * 100
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600'
    if (variance < -10) return 'text-red-600'
    return 'text-yellow-600'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4" />
    if (variance < -10) return <TrendingDown className="h-4 w-4" />
    return <Target className="h-4 w-4" />
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
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!financialData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No financial data available</p>
      </div>
    )
  }

  const revenueVariance = calculateVariance(financialData.actual_revenue, financialData.planned_revenue)
  const costVariance = calculateVariance(financialData.actual_costs, financialData.planned_costs)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{projectName}</h2>
        <p className="text-blue-100">Financial Dashboard - Tổng quan tài chính dự án</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
          { id: 'costs', label: 'Chi phí', icon: TrendingDown },
          { id: 'revenue', label: 'Doanh thu', icon: TrendingUp },
          { id: 'timeline', label: 'Timeline', icon: Calendar }
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex items-center gap-1">
                  {getVarianceIcon(revenueVariance)}
                  <span className={`text-sm font-medium ${getVarianceColor(revenueVariance)}`}>
                    {revenueVariance > 0 ? '+' : ''}{revenueVariance.toFixed(1)}%
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Doanh thu</h3>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(financialData.actual_revenue)}
                </p>
                <p className="text-sm text-gray-500">
                  Kế hoạch: {formatCurrency(financialData.planned_revenue)}
                </p>
              </div>
            </div>

            {/* Costs Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex items-center gap-1">
                  {getVarianceIcon(costVariance)}
                  <span className={`text-sm font-medium ${getVarianceColor(costVariance)}`}>
                    {costVariance > 0 ? '+' : ''}{costVariance.toFixed(1)}%
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Chi phí</h3>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(financialData.actual_costs)}
                </p>
                <p className="text-sm text-gray-500">
                  Kế hoạch: {formatCurrency(financialData.planned_costs)}
                </p>
              </div>
            </div>

            {/* Profit Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-1">
                  {financialData.actual_revenue - financialData.actual_costs >= 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Lợi nhuận</h3>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${
                  financialData.actual_revenue - financialData.actual_costs >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(financialData.actual_revenue - financialData.actual_costs)}
                </p>
                <p className="text-sm text-gray-500">
                  Kế hoạch: {formatCurrency(financialData.planned_revenue - financialData.planned_costs)}
                </p>
              </div>
            </div>

            {/* Margin Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Biên lợi nhuận</h3>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {financialData.profit_margin_actual.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  Kế hoạch: {financialData.profit_margin_planned.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiến độ Doanh thu</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Thực tế</span>
                    <span>{((financialData.actual_revenue / financialData.planned_revenue) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((financialData.actual_revenue / financialData.planned_revenue) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Đã đạt: {formatCurrency(financialData.actual_revenue)} / {formatCurrency(financialData.planned_revenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiến độ Chi phí</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Thực tế</span>
                    <span>{((financialData.actual_costs / financialData.planned_costs) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((financialData.actual_costs / financialData.planned_costs) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Đã chi: {formatCurrency(financialData.actual_costs)} / {formatCurrency(financialData.planned_costs)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Costs Tab */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bổ Chi phí</h3>
              <div className="space-y-4">
                {Object.entries(financialData.cost_breakdown).map(([category, amount]) => {
                  const percentage = (amount / financialData.actual_costs) * 100
                  const categoryNames = {
                    labor: 'Nhân công',
                    materials: 'Vật liệu',
                    overhead: 'Chi phí chung',
                    other: 'Khác'
                  }
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{categoryNames[category as keyof typeof categoryNames]}</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{formatCurrency(amount)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cost Comparison */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">So sánh Chi phí</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Kế hoạch</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(financialData.planned_costs)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Thực tế</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(financialData.actual_costs)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Chênh lệch</span>
                  <span className={`text-lg font-bold ${
                    financialData.actual_costs > financialData.planned_costs ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(financialData.actual_costs - financialData.planned_costs)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bổ Doanh thu</h3>
              <div className="space-y-4">
                {Object.entries(financialData.revenue_breakdown).map(([source, amount]) => {
                  const percentage = (amount / financialData.actual_revenue) * 100
                  const sourceNames = {
                    invoices: 'Đơn hàng',
                    sales_receipts: 'Biên lai bán hàng',
                    other: 'Khác'
                  }
                  return (
                    <div key={source}>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{sourceNames[source as keyof typeof sourceNames]}</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{formatCurrency(amount)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Revenue Comparison */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">So sánh Doanh thu</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Kế hoạch</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(financialData.planned_revenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Thực tế</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(financialData.actual_revenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Chênh lệch</span>
                  <span className={`text-lg font-bold ${
                    financialData.actual_revenue > financialData.planned_revenue ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(financialData.actual_revenue - financialData.planned_revenue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Tài chính</h3>
            <div className="space-y-4">
              {financialData.monthly_data.map((month, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900">{month.month}</h4>
                    <span className="text-sm text-gray-500">
                      Lợi nhuận: {formatCurrency(month.actual_revenue - month.actual_costs)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Doanh thu: {formatCurrency(month.actual_revenue)}</p>
                      <p className="text-gray-500">Kế hoạch: {formatCurrency(month.planned_revenue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Chi phí: {formatCurrency(month.actual_costs)}</p>
                      <p className="text-gray-500">Kế hoạch: {formatCurrency(month.planned_costs)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

