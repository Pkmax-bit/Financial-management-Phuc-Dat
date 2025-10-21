'use client'

import React, { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface ProjectExpense {
  id: string
  project_id: string
  project_name: string
  project_code: string
  planned_amount: number
  actual_amount: number
  variance: number
  variance_percentage: number
  category: 'planned' | 'actual'
  description: string
  expense_date: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  id_parent?: string | null
  children?: ProjectExpense[]
  level?: number
  hasChildren?: boolean
}

interface HierarchicalExpenseReportProps {
  expenses: ProjectExpense[]
  viewMode: 'planned' | 'actual'
  onViewDetails: (expense: ProjectExpense) => void
}

export default function HierarchicalExpenseReport({ 
  expenses, 
  viewMode, 
  onViewDetails 
}: HierarchicalExpenseReportProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600'
    if (variance < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4" />
    if (variance < 0) return <TrendingDown className="h-4 w-4" />
    return <BarChart3 className="h-4 w-4" />
  }

  // Build tree structure
  const buildTree = (flatList: ProjectExpense[]): ProjectExpense[] => {
    const map = new Map<string, ProjectExpense>()
    const roots: ProjectExpense[] = []

    // First pass: create map of all items
    flatList.forEach(item => {
      map.set(item.id, { ...item, children: [], hasChildren: false })
    })

    // Second pass: build tree
    flatList.forEach(item => {
      const node = map.get(item.id)!
      if (item.id_parent) {
        const parent = map.get(item.id_parent)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
          parent.hasChildren = true
        } else {
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  // Flatten tree for rendering
  const flattenTree = (tree: ProjectExpense[], level = 0): ProjectExpense[] => {
    const result: ProjectExpense[] = []
    
    tree.forEach(item => {
      result.push({ ...item, level })
      
      if (item.hasChildren && item.children && expandedItems.has(item.id)) {
        result.push(...flattenTree(item.children, level + 1))
      }
    })
    
    return result
  }

  const tree = buildTree(expenses)
  const flattenedExpenses = flattenTree(tree)

  // Calculate totals
  const totalPlanned = expenses.filter(e => e.category === 'planned').reduce((sum, e) => sum + e.planned_amount, 0)
  const totalActual = expenses.filter(e => e.category === 'actual').reduce((sum, e) => sum + e.actual_amount, 0)
  const totalVariance = totalActual - totalPlanned

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Kế hoạch</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalPlanned)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Thực tế</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalActual)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500">
              {getVarianceIcon(totalVariance)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Chênh lệch</p>
              <p className={`text-lg font-bold ${getVarianceColor(totalVariance)}`}>
                {formatCurrency(totalVariance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchical Expense List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Báo cáo chi phí phân cấp - {viewMode === 'planned' ? 'Kế hoạch' : 'Thực tế'}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chi phí
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dự án
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chênh lệch
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flattenedExpenses.map((expense) => (
                <tr 
                  key={expense.id} 
                  className={`hover:bg-gray-50 ${
                    expense.level && expense.level > 0 
                      ? 'bg-orange-50' // Child expenses - light orange background
                      : expense.hasChildren
                        ? 'bg-purple-50' // Parent expenses - light purple background
                        : 'bg-white'     // Regular expenses - white background
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {/* Indent based on level */}
                      <div style={{ marginLeft: `${(expense.level || 0) * 24}px` }} className="flex items-center flex-1">
                        {/* Expand/Collapse button for parents */}
                        {expense.hasChildren ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpand(expense.id)
                            }}
                            className="mr-2 p-1 hover:bg-gray-100 rounded"
                            title={expandedItems.has(expense.id) ? 'Thu gọn' : 'Mở rộng'}
                          >
                            {expandedItems.has(expense.id) ? (
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        ) : (
                          <div className="w-6 mr-2" />
                        )}
                        
                        {/* Icon for parent/child with different colors */}
                        {expense.hasChildren ? (
                          <Folder className="h-4 w-4 text-purple-500 mr-2" />
                        ) : (
                          <FileText className={`h-4 w-4 mr-2 ${expense.level && expense.level > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                        )}
                        
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${
                            expense.level && expense.level > 0 
                              ? 'text-orange-700' // Child expenses - orange color
                              : expense.hasChildren
                                ? 'text-purple-700' // Parent expenses - purple color
                                : 'text-gray-900'  // Regular expenses - normal color
                          }`}>
                            {expense.description}
                            {expense.hasChildren && expense.children && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({expense.children.length} mục)
                              </span>
                            )}
                            {/* Show parent indicator */}
                            {expense.hasChildren && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                Tổng từ con
                              </span>
                            )}
                          </div>
                          <div className={`text-xs mt-1 ${
                            expense.level && expense.level > 0 
                              ? 'text-orange-600' // Child expenses - orange color
                              : 'text-gray-500'   // Regular expenses - normal color
                          }`}>
                            Mã: {expense.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {expense.project_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {expense.project_code}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-semibold ${
                      expense.level && expense.level > 0 
                        ? 'text-orange-600' // Child expenses - orange color
                        : expense.hasChildren 
                          ? 'text-purple-600' // Parent expenses - purple color
                          : viewMode === 'planned' 
                            ? 'text-blue-600'   // Planned expenses - blue color
                            : 'text-green-600'  // Actual expenses - green color
                    }`}>
                      {formatCurrency(viewMode === 'planned' ? expense.planned_amount : expense.actual_amount)}
                      {expense.hasChildren && (
                        <div className="text-xs text-purple-500 mt-1">
                          (Tổng từ {expense.children?.length || 0} mục con)
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`flex items-center justify-end text-sm ${getVarianceColor(expense.variance)}`}>
                      {getVarianceIcon(expense.variance)}
                      <span className="ml-1">
                        {formatCurrency(expense.variance)} ({expense.variance_percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => onViewDetails(expense)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Xem chi tiết"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
