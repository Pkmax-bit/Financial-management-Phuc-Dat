'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Wrench, AlertCircle, CheckCircle, Clock, Eye, Plus } from 'lucide-react'
import AIReceiptUpload from '@/components/expenses/AIReceiptUpload'
import { getApiEndpoint } from '@/lib/apiUrl'

interface ProjectCostDashboardProps {
  projectId: string
  projectName: string
  projectCode: string
}

interface CostData {
  totalCost: number
  laborCosts: number
  materialCosts: number
  serviceCosts: number
  overheadCosts: number
  budgetedCost: number
  actualCost: number
  variance: number
  costBreakdown: {
    labor: number
    material: number
    service: number
    overhead: number
  }
  recentExpenses: Array<{
    id: string
    amount: number
    description: string
    vendor: string
    cost_date: string
    status: string
    ai_generated: boolean
    ai_confidence: number
    cost_categories: {
      name: string
      type: string
    }
  }>
}

export default function ProjectCostDashboard({ projectId, projectName, projectCode }: ProjectCostDashboardProps) {
  const [costData, setCostData] = useState<CostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAIUpload, setShowAIUpload] = useState(false)

  useEffect(() => {
    fetchProjectCosts()
  }, [projectId])

  const fetchProjectCosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiEndpoint(`/api/projects/${projectId}/costs`)
      const data = await response.json()
      
      if (data.success) {
        setCostData(data.costData)
      } else {
        console.error('Error fetching project costs:', data.error)
      }
    } catch (error) {
      console.error('Error fetching project costs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExpenseCreated = (expense: any) => {
    // Refresh cost data after new expense is created
    fetchProjectCosts()
    setShowAIUpload(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'rejected': return <AlertCircle className="h-4 w-4" />
      case 'paid': return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Đang tải dữ liệu chi phí...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chi phí dự án</h2>
          <p className="text-gray-600">{projectName} ({projectCode})</p>
        </div>
        <button
          onClick={() => setShowAIUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Thêm chi phí AI
        </button>
      </div>

      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng chi phí</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                VND {costData?.totalCost?.toLocaleString() || 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Chi phí nhân lực</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                VND {costData?.laborCosts?.toLocaleString() || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Chi phí vật liệu</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                VND {costData?.materialCosts?.toLocaleString() || 0}
              </p>
            </div>
            <Package className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Chi phí dịch vụ</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                VND {costData?.serviceCosts?.toLocaleString() || 0}
              </p>
            </div>
            <Wrench className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Budget vs Actual */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">So sánh ngân sách</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Ngân sách dự kiến</p>
            <p className="text-xl font-semibold text-gray-900">
              VND {costData?.budgetedCost?.toLocaleString() || 0}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Chi phí thực tế</p>
            <p className="text-xl font-semibold text-gray-900">
              VND {costData?.actualCost?.toLocaleString() || 0}
            </p>
          </div>
          
          <div className="text-center">
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg mx-auto mb-3 ${
              (costData?.variance || 0) >= 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <TrendingDown className={`h-6 w-6 ${
                (costData?.variance || 0) >= 0 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            <p className="text-sm text-gray-500">Chênh lệch</p>
            <p className={`text-xl font-semibold ${
              (costData?.variance || 0) >= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {(costData?.variance || 0) >= 0 ? '+' : ''}VND {(costData?.variance || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân tích chi phí chi tiết</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Nhân lực</span>
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              VND {costData?.costBreakdown?.labor?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-500">
              {costData?.totalCost ? Math.round(((costData.costBreakdown?.labor || 0) / costData.totalCost) * 100) : 0}% tổng chi phí
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Vật liệu</span>
              <Package className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              VND {costData?.costBreakdown?.material?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-500">
              {costData?.totalCost ? Math.round(((costData.costBreakdown?.material || 0) / costData.totalCost) * 100) : 0}% tổng chi phí
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Dịch vụ</span>
              <Wrench className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              VND {costData?.costBreakdown?.service?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-500">
              {costData?.totalCost ? Math.round(((costData.costBreakdown?.service || 0) / costData.totalCost) * 100) : 0}% tổng chi phí
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Quản lý</span>
              <AlertCircle className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              VND {costData?.costBreakdown?.overhead?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-500">
              {costData?.totalCost ? Math.round(((costData.costBreakdown?.overhead || 0) / costData.totalCost) * 100) : 0}% tổng chi phí
            </p>
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Chi phí gần đây</h3>
          <button
            onClick={() => setShowAIUpload(true)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            <Plus className="h-4 w-4" />
            Thêm chi phí
          </button>
        </div>
        
        <div className="space-y-3">
          {costData?.recentExpenses?.length ? (
            costData.recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-gray-900">{expense.description}</h4>
                    {expense.ai_generated && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        AI Generated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{expense.vendor}</span>
                    <span>{expense.cost_categories?.name}</span>
                    <span>{new Date(expense.cost_date).toLocaleDateString('vi-VN')}</span>
                    {expense.ai_generated && (
                      <span>Confidence: {expense.ai_confidence}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-gray-900">
                    VND {expense.amount.toLocaleString()}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(expense.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(expense.status)}
                      {expense.status}
                    </div>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Chưa có chi phí nào</p>
              <button
                onClick={() => setShowAIUpload(true)}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Thêm chi phí đầu tiên
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Upload Modal */}
      {showAIUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Thêm chi phí bằng AI</h3>
                <button
                  onClick={() => setShowAIUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <AIReceiptUpload onExpenseCreated={handleExpenseCreated} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
