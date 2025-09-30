/**
 * Dashboard Widgets
 * Reusable widget components for dashboard
 */

import React from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Bell
} from 'lucide-react'
import { CashflowProjection, PlannerEvent, MonthlyData } from '@/services/dashboardService'

interface CashflowWidgetProps {
  projection: CashflowProjection | null
  loading: boolean
  error: string | null
}

export function CashflowWidget({ projection, loading, error }: CashflowWidgetProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dự báo dòng tiền</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dự báo dòng tiền</h3>
        <div className="text-center text-gray-500 py-4">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Dự báo dòng tiền</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {projection?.confidence || 'medium'}
        </span>
      </div>
      
      {projection?.projections && projection.projections.length > 0 ? (
        <div className="space-y-3">
          {projection.projections.slice(0, 3).map((month, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm font-medium">{month.month}</span>
              </div>
              <div className="text-right">
                <div className={`flex items-center ${month.projectedCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {month.projectedCashFlow >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  <span className="font-medium text-sm">
                    {formatCurrency(Math.abs(month.projectedCashFlow))}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Doanh thu: {formatCurrency(month.projectedRevenue)}
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Dự báo dựa trên: {projection.basedOn}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Không đủ dữ liệu để dự báo</p>
        </div>
      )}
    </div>
  )
}

interface EventsWidgetProps {
  events: PlannerEvent[]
  loading: boolean
  error: string | null
}

export function EventsWidget({ events, loading, error }: EventsWidgetProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sự kiện sắp tới</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sự kiện sắp tới</h3>
        <div className="text-center text-gray-500 py-4">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'bill':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'payment':
        return <DollarSign className="h-4 w-4 text-blue-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'border-l-green-400 bg-green-50'
      case 'bill':
        return 'border-l-red-400 bg-red-50'
      case 'payment':
        return 'border-l-blue-400 bg-blue-50'
      default:
        return 'border-l-gray-400 bg-gray-50'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Sự kiện sắp tới</h3>
        <Bell className="h-5 w-5 text-gray-400" />
      </div>
      
      {events && events.length > 0 ? (
        <div className="space-y-3">
          {events.slice(0, 5).map((event, index) => (
            <div
              key={event.id}
              className={`border-l-4 pl-3 py-2 ${getEventColor(event.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {getEventIcon(event.type)}
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-900">
                      {event.title}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(event.date)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(event.amount)}
                  </span>
                  <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                    event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    event.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {event.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm">Không có sự kiện nào sắp tới</p>
        </div>
      )}
    </div>
  )
}

interface MonthlyChartProps {
  monthlyData: MonthlyData[]
  loading: boolean
}

export function MonthlyChartWidget({ monthlyData, loading }: MonthlyChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Biểu đồ theo tháng</h3>
        <div className="animate-pulse">
          <div className="flex space-x-2 h-32 items-end">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-1 bg-gray-200 rounded" style={{height: `${Math.random() * 100 + 20}%`}}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(amount)
  }

  const maxValue = Math.max(
    ...monthlyData.map(d => Math.max(d.revenue, d.expenses))
  )

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Doanh thu & Chi phí theo tháng</h3>
      
      {monthlyData && monthlyData.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span>Doanh thu</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span>Chi phí</span>
            </div>
          </div>
          
          <div className="flex items-end space-x-2 h-32">
            {monthlyData.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full flex flex-col justify-end h-24 space-y-1">
                  <div
                    className="bg-blue-500 rounded-t"
                    style={{
                      height: maxValue > 0 ? `${(month.revenue / maxValue) * 100}%` : '0%'
                    }}
                    title={`Doanh thu: ${formatCurrency(month.revenue)}`}
                  ></div>
                  <div
                    className="bg-red-500 rounded-t"
                    style={{
                      height: maxValue > 0 ? `${(month.expenses / maxValue) * 100}%` : '0%'
                    }}
                    title={`Chi phí: ${formatCurrency(month.expenses)}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{month.month}</span>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Dữ liệu 6 tháng gần nhất
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Chưa có dữ liệu để hiển thị</p>
        </div>
      )}
    </div>
  )
}