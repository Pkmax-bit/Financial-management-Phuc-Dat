'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, RefreshCw, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart } from 'lucide-react'
import { budgetingApi } from '@/lib/api'

interface BudgetVariance {
  expense_category: string
  budgeted_amount: number
  actual_amount: number
  variance_amount: number
  variance_percentage: number
}

interface BudgetReport {
  budget_id: string
  budget_name: string
  period: string
  start_date: string
  end_date: string
  total_budgeted: number
  total_actual: number
  total_variance: number
  total_variance_percentage: number
  variances: BudgetVariance[]
  currency: string
}

interface BudgetReportModalProps {
  isOpen: boolean
  onClose: () => void
  budget: {
    id: string
    budget_name: string
    period: string
    start_date: string
    end_date: string
    total_budget_amount: number
    currency: string
  } | null
}

export default function BudgetReportModal({ isOpen, onClose, budget }: BudgetReportModalProps) {
  const [report, setReport] = useState<BudgetReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && budget) {
      fetchReport()
    }
  }, [isOpen, budget])

  const fetchReport = async () => {
    if (!budget) return

    try {
      setLoading(true)
      setError(null)
      const response = await budgetingApi.getBudgetReport(budget.id)
      setReport(response)
    } catch (err) {
      console.error('Error fetching budget report:', err)
      setError('Không thể tải báo cáo ngân sách')
    } finally {
      setLoading(false)
    }
  }

  const updateActuals = async () => {
    if (!budget) return

    try {
      setLoading(true)
      await budgetingApi.updateBudgetActuals(budget.id)
      await fetchReport()
    } catch (err) {
      console.error('Error updating budget actuals:', err)
      setError('Không thể cập nhật dữ liệu thực tế')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600'
    if (variance < 0) return 'text-green-600'
    return 'text-black'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-red-600" />
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-green-600" />
    return null
  }

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'travel': 'Đi lại',
      'meals': 'Ăn uống',
      'office_supplies': 'Văn phòng phẩm',
      'utilities': 'Tiện ích',
      'marketing': 'Marketing',
      'training': 'Đào tạo',
      'equipment': 'Thiết bị',
      'software': 'Phần mềm',
      'consulting': 'Tư vấn',
      'other': 'Khác'
    }
    return categoryMap[category] || category
  }

  if (!isOpen || !budget) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Báo cáo ngân sách: {budget.budget_name}
            </h2>
            <p className="text-sm text-black mt-1">
              {new Date(budget.start_date).toLocaleDateString('vi-VN')} - {new Date(budget.end_date).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={updateActuals}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 flex items-center gap-2"
              title="Cập nhật dữ liệu thực tế"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Cập nhật
            </button>
            <button
              onClick={onClose}
              className="text-black hover:text-black"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && !report ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <X className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải báo cáo</h3>
              <p className="text-black mb-4">{error}</p>
              <button
                onClick={fetchReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Thử lại
              </button>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-black">Ngân sách</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(report.total_budgeted, report.currency)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-black">Thực tế</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(report.total_actual, report.currency)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${report.total_variance >= 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                      {report.total_variance >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-red-600" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-black">Chênh lệch</p>
                      <p className={`text-2xl font-bold ${getVarianceColor(report.total_variance)}`}>
                        {formatCurrency(report.total_variance, report.currency)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <PieChart className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-black">% Chênh lệch</p>
                      <p className={`text-2xl font-bold ${getVarianceColor(report.total_variance)}`}>
                        {formatPercentage(report.total_variance_percentage)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <BarChart3 className="h-12 w-12 text-black mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Biểu đồ ngân sách</h3>
                <p className="text-black">
                  Biểu đồ so sánh ngân sách và thực tế sẽ được hiển thị ở đây
                </p>
                <p className="text-sm text-black mt-2">
                  (Cần tích hợp thư viện biểu đồ như Chart.js hoặc Recharts)
                </p>
              </div>

              {/* Detailed Variances */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Chi tiết theo danh mục</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Danh mục
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Ngân sách
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Thực tế
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Chênh lệch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          % Chênh lệch
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.variances.map((variance, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getCategoryLabel(variance.expense_category)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(variance.budgeted_amount, report.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(variance.actual_amount, report.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium flex items-center gap-1 ${getVarianceColor(variance.variance_amount)}`}>
                              {getVarianceIcon(variance.variance_amount)}
                              {formatCurrency(variance.variance_amount, report.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${getVarianceColor(variance.variance_amount)}`}>
                              {formatPercentage(variance.variance_percentage)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {/* TODO: Implement export functionality */}}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Xuất báo cáo
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
