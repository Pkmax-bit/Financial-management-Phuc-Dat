'use client'

import React, { useMemo } from 'react'
import { Building2, Package, Truck, DollarSign, Calculator } from 'lucide-react'

interface ExpenseObject {
  id: string
  name: string
  description?: string
  is_active: boolean
  level?: number
  parent_id?: string
  role?: string
}

interface ExpenseAmount {
  [objectId: string]: number
}

interface ExpenseSummaryDisplayProps {
  selectedObjectIds: string[]
  expenseObjects: ExpenseObject[]
  expenseAmounts: ExpenseAmount
}

export default function ExpenseSummaryDisplay({
  selectedObjectIds,
  expenseObjects,
  expenseAmounts
}: ExpenseSummaryDisplayProps) {
  
  // Get all objects to display (selected + their parents + all levels)
  const displayObjects = useMemo(() => {
    const selectedObjects = selectedObjectIds
      .map(id => expenseObjects.find(obj => obj.id === id))
      .filter(Boolean) as ExpenseObject[]

    const displaySet = new Set<string>()
    
    // Add all selected objects
    selectedObjects.forEach(obj => displaySet.add(obj.id))
    
    // Add all parents of selected objects (full hierarchy)
    selectedObjects.forEach(obj => {
      let current = obj
      while (current.parent_id) {
        const parent = expenseObjects.find(p => p.id === current.parent_id)
        if (parent) {
          displaySet.add(parent.id)
          current = parent
        } else {
          break
        }
      }
    })

    // Add all children of selected objects (if any)
    selectedObjects.forEach(obj => {
      const children = expenseObjects.filter(child => child.parent_id === obj.id)
      children.forEach(child => displaySet.add(child.id))
    })

    return Array.from(displaySet)
      .map(id => expenseObjects.find(obj => obj.id === id))
      .filter(Boolean) as ExpenseObject[]
  }, [selectedObjectIds, expenseObjects])

  // Get objects that should be displayed in hierarchy (exclude leaf objects that have parents selected)
  const hierarchyObjects = useMemo(() => {
    const selectedObjects = selectedObjectIds
      .map(id => expenseObjects.find(obj => obj.id === id))
      .filter(Boolean) as ExpenseObject[]

    const hierarchyObjects: ExpenseObject[] = []
    
    selectedObjects.forEach(obj => {
      // Check if this object has any children in the selected list
      const hasSelectedChildren = selectedObjects.some(child => child.parent_id === obj.id)
      
      if (hasSelectedChildren) {
        // This object has selected children, so it should be in hierarchy
        hierarchyObjects.push(obj)
      }
    })

    return hierarchyObjects
  }, [selectedObjectIds, expenseObjects])

  // Calculate totals for each level
  const calculatedTotals = useMemo(() => {
    const level1Totals: { [objectId: string]: number } = {}
    const level2Totals: { [objectId: string]: number } = {}
    const level3Totals: { [objectId: string]: number } = {}

    // Get selected objects (only directly selected ones)
    const selectedObjects = selectedObjectIds
      .map(id => expenseObjects.find(obj => obj.id === id))
      .filter(Boolean) as ExpenseObject[]

    // Calculate level 3 totals (direct amounts from selected objects only)
    selectedObjects
      .filter(obj => obj.level === 3)
      .forEach(obj => {
        const amount = expenseAmounts[obj.id] || 0
        level3Totals[obj.id] = amount
      })

    // Special case: If only level 1 objects are selected, use their direct amounts
    const selectedLevels = [...new Set(selectedObjects.map(obj => obj.level || 0))]
    const onlyLevel1Selected = selectedLevels.length === 1 && selectedLevels[0] === 1
    
    if (onlyLevel1Selected) {
      selectedObjects
        .filter(obj => obj.level === 1)
        .forEach(obj => {
          const amount = expenseAmounts[obj.id] || 0
          level1Totals[obj.id] = amount
        })
    }

    // Calculate level 2 totals (sum of their level 3 children) - skip if only level 1 selected
    if (!onlyLevel1Selected) {
      displayObjects
        .filter(obj => obj.level === 2)
        .forEach(obj => {
          const children = selectedObjects.filter(child => child.parent_id === obj.id)
          if (children.length === 1) {
            // If only 1 child, use that child's amount directly
            level2Totals[obj.id] = level3Totals[children[0].id] || 0
          } else if (children.length > 1) {
            // If multiple children, sum them up
            const total = children.reduce((sum, child) => sum + (level3Totals[child.id] || 0), 0)
            level2Totals[obj.id] = total
          } else {
            // If no direct children selected, check if there are any level 3 children in displayObjects
            const allChildren = displayObjects.filter(child => child.parent_id === obj.id && child.level === 3)
            if (allChildren.length > 0) {
              const total = allChildren.reduce((sum, child) => sum + (level3Totals[child.id] || 0), 0)
              level2Totals[obj.id] = total
            }
          }
        })
    }

    // Calculate level 1 totals (sum of their level 2 children) - skip if only level 1 selected
    if (!onlyLevel1Selected) {
      displayObjects
        .filter(obj => obj.level === 1)
        .forEach(obj => {
          const children = displayObjects.filter(child => child.parent_id === obj.id && child.level === 2)
          if (children.length === 1) {
            // If only 1 child, use that child's amount directly
            level1Totals[obj.id] = level2Totals[children[0].id] || 0
          } else if (children.length > 1) {
            // If multiple children, sum them up
            const total = children.reduce((sum, child) => sum + (level2Totals[child.id] || 0), 0)
            level1Totals[obj.id] = total
          } else {
            // If no direct children, check if there are any level 2 children in displayObjects
            const allChildren = displayObjects.filter(child => child.parent_id === obj.id && child.level === 2)
            if (allChildren.length > 0) {
              const total = allChildren.reduce((sum, child) => sum + (level2Totals[child.id] || 0), 0)
              level1Totals[obj.id] = total
            }
          }
        })
    }

    return {
      level1: level1Totals,
      level2: level2Totals,
      level3: level3Totals
    }
  }, [selectedObjectIds, displayObjects, expenseObjects, expenseAmounts])

  // Get total amount across all levels
  const grandTotal = useMemo(() => {
    return Object.values(calculatedTotals.level1).reduce((sum, amount) => sum + amount, 0)
  }, [calculatedTotals])

  // Get role icon
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'supplier_root': return <Building2 className="w-5 h-5" />
      case 'material_category': return <Package className="w-5 h-5" />
      case 'supplier': return <Truck className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  // Get role color
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'supplier_root': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'material_category': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'supplier': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Get level color
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-purple-100 text-purple-700'
      case 2: return 'bg-blue-100 text-blue-700'
      case 3: return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Get parent-based color scheme
  const getParentBasedColor = (obj: ExpenseObject, level: number) => {
    // Color schemes for different parent groups
    const colorSchemes = [
      // Level 1 colors
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', accent: 'bg-purple-100' },
      // Level 2 colors  
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', accent: 'bg-blue-100' },
      { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', accent: 'bg-indigo-100' },
      { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', accent: 'bg-cyan-100' },
      { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', accent: 'bg-teal-100' },
      { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', accent: 'bg-emerald-100' },
      { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-800', accent: 'bg-lime-100' },
      // Level 3 colors
      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', accent: 'bg-green-100' },
      { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', accent: 'bg-yellow-100' },
      { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', accent: 'bg-orange-100' },
      { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', accent: 'bg-red-100' },
      { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', accent: 'bg-pink-100' },
      { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', accent: 'bg-rose-100' }
    ]

    // Get parent ID for grouping
    let parentId = obj.parent_id
    if (level === 1) {
      parentId = obj.id // Level 1 groups by itself
    } else if (level === 2) {
      parentId = obj.parent_id // Level 2 groups by level 1 parent
    } else if (level === 3) {
      // Level 3 groups by level 2 parent
      const level2Parent = expenseObjects.find(p => p.id === obj.parent_id)
      parentId = level2Parent?.parent_id
    }

    // Generate consistent color index based on parent ID
    if (parentId) {
      const hash = parentId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      const colorIndex = Math.abs(hash) % colorSchemes.length
      return colorSchemes[colorIndex]
    }

    // Default color
    return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', accent: 'bg-gray-100' }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Get display objects grouped by level
  const level1Objects = displayObjects.filter(obj => obj.level === 1)
  const level2Objects = displayObjects.filter(obj => obj.level === 2)
  const level3Objects = displayObjects.filter(obj => obj.level === 3)

  // Get directly selected objects for highlighting
  const selectedObjects = selectedObjectIds
    .map(id => expenseObjects.find(obj => obj.id === id))
    .filter(Boolean) as ExpenseObject[]

  // Get leaf objects (only directly selected objects) for invoice details
  const leafObjects = useMemo(() => {
    const selectedObjects = selectedObjectIds
      .map(id => expenseObjects.find(obj => obj.id === id))
      .filter(Boolean) as ExpenseObject[]

    // Only return directly selected objects, not their parents
    return selectedObjects
  }, [selectedObjectIds, expenseObjects])

  return (
    <div className="space-y-6">
      {/* Grand Total */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">Tổng chi phí</h3>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {formatCurrency(grandTotal)}
          </div>
        </div>
        <div className="mt-3 text-sm text-blue-700">
          Hiển thị đầy đủ các cấp cha khi chọn đối tượng con
        </div>
        <div className="mt-2 text-xs text-blue-600">
          💡 Các đối tượng có cùng cha sẽ có cùng màu sắc để dễ phân biệt
        </div>
        <div className="mt-1 text-xs text-blue-500">
          📋 Chi tiết hóa đơn chỉ hiển thị đối tượng được chọn trực tiếp
        </div>
      </div>

      {/* Invoice Details - Only Leaf Objects */}
      {leafObjects.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span>Chi tiết hóa đơn</span>
            <span className="text-sm text-gray-500 font-normal">(Chỉ hiển thị đối tượng được chọn trực tiếp)</span>
          </h4>
          <div className="grid gap-3">
            {leafObjects.map(obj => {
              const colorScheme = getParentBasedColor(obj, obj.level || 1)
              return (
                <div key={obj.id} className={`border rounded-lg p-4 ${colorScheme.bg} ${colorScheme.border} shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${colorScheme.accent}`}>
                        {getRoleIcon(obj.role)}
                      </div>
                      <div>
                        <h5 className={`font-medium ${colorScheme.text}`}>
                          {obj.name}
                        </h5>
                        {obj.description && (
                          <p className="text-sm text-gray-500">{obj.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs border ${getRoleColor(obj.role)}`}>
                            {obj.role?.replace('_', ' ')}
                          </span>
                          {obj.level !== undefined && obj.level !== null && (
                            <span className={`px-2 py-1 rounded-full text-xs ${getLevelColor(obj.level)}`}>
                              Cấp {obj.level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${colorScheme.text}`}>
                        {formatCurrency(expenseAmounts[obj.id] || 0)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Số liệu trực tiếp
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hierarchy Overview */}
      {selectedObjects.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <span>Tổng quan phân cấp</span>
          </h4>
          <div className="space-y-2 text-sm">
            {selectedObjects.map(obj => {
              const parents = []
              let current = obj
              while (current.parent_id) {
                const parent = expenseObjects.find(p => p.id === current.parent_id)
                if (parent) {
                  parents.unshift(parent)
                  current = parent
                } else {
                  break
                }
              }
              
              return (
                <div key={obj.id} className="flex items-center space-x-2 text-gray-600">
                  <span className="font-medium text-gray-800">{obj.name}</span>
                  {parents.length > 0 && (
                    <>
                      <span>←</span>
                      <span className="text-gray-500">
                        {parents.map(p => p.name).join(' ← ')}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Level 1 - Root Objects */}
      {level1Objects.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            <span>Cấp 1 - Tổng hợp</span>
          </h4>
          <div className="grid gap-3">
            {level1Objects.map(obj => {
              const isDirectlySelected = selectedObjects.some(selected => selected.id === obj.id)
              const colorScheme = getParentBasedColor(obj, 1)
              return (
                <div key={obj.id} className={`border rounded-lg p-4 ${
                  isDirectlySelected 
                    ? `${colorScheme.bg} ${colorScheme.border} shadow-md` 
                    : `${colorScheme.bg} ${colorScheme.border}`
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${colorScheme.accent}`}>
                        {getRoleIcon(obj.role)}
                      </div>
                      <div>
                        <h5 className={`font-medium ${
                          isDirectlySelected ? colorScheme.text : colorScheme.text
                        }`}>
                          {obj.name}
                          {isDirectlySelected && (
                            <span className={`ml-2 text-xs ${colorScheme.accent} ${colorScheme.text} px-2 py-1 rounded-full`}>
                              Đã chọn
                            </span>
                          )}
                        </h5>
                        {obj.description && (
                          <p className="text-sm text-gray-500">{obj.description}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm border ${getRoleColor(obj.role)}`}>
                        {obj.role?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${colorScheme.text}`}>
                        {formatCurrency(calculatedTotals.level1[obj.id] || 0)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(() => {
                          const children = level2Objects.filter(child => child.parent_id === obj.id)
                          if (children.length === 1) {
                            return `Từ 1 cấp 2 (trực tiếp)`
                          } else {
                            return `Tổng từ ${children.length} cấp 2`
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Level 2 - Material Categories */}
      {level2Objects.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Cấp 2 - Loại vật liệu</span>
          </h4>
          <div className="grid gap-3">
            {level2Objects.map(obj => {
              const isDirectlySelected = selectedObjects.some(selected => selected.id === obj.id)
              const colorScheme = getParentBasedColor(obj, 2)
              return (
                <div key={obj.id} className={`border rounded-lg p-4 ${
                  isDirectlySelected 
                    ? `${colorScheme.bg} ${colorScheme.border} shadow-md` 
                    : `${colorScheme.bg} ${colorScheme.border}`
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${colorScheme.accent}`}>
                        {getRoleIcon(obj.role)}
                      </div>
                      <div>
                        <h5 className={`font-medium ${colorScheme.text}`}>
                          {obj.name}
                          {isDirectlySelected && (
                            <span className={`ml-2 text-xs ${colorScheme.accent} ${colorScheme.text} px-2 py-1 rounded-full`}>
                              Đã chọn
                            </span>
                          )}
                        </h5>
                        {obj.description && (
                          <p className="text-sm text-gray-500">{obj.description}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm border ${getRoleColor(obj.role)}`}>
                        {obj.role?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${colorScheme.text}`}>
                        {formatCurrency(calculatedTotals.level2[obj.id] || 0)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(() => {
                          const children = level3Objects.filter(child => child.parent_id === obj.id)
                          if (children.length === 1) {
                            return `Từ 1 cấp 3 (trực tiếp)`
                          } else {
                            return `Tổng từ ${children.length} cấp 3`
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Level 3 - Specific Suppliers */}
      {level3Objects.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-green-600" />
            <span>Cấp 3 - Nhà cung cấp cụ thể</span>
          </h4>
          <div className="grid gap-3">
            {level3Objects.map(obj => {
              const isDirectlySelected = selectedObjects.some(selected => selected.id === obj.id)
              const colorScheme = getParentBasedColor(obj, 3)
              return (
                <div key={obj.id} className={`border rounded-lg p-4 ${
                  isDirectlySelected 
                    ? `${colorScheme.bg} ${colorScheme.border} shadow-md` 
                    : `${colorScheme.bg} ${colorScheme.border}`
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${colorScheme.accent}`}>
                        {getRoleIcon(obj.role)}
                      </div>
                      <div>
                        <h5 className={`font-medium ${colorScheme.text}`}>
                          {obj.name}
                          {isDirectlySelected && (
                            <span className={`ml-2 text-xs ${colorScheme.accent} ${colorScheme.text} px-2 py-1 rounded-full`}>
                              Đã chọn
                            </span>
                          )}
                        </h5>
                        {obj.description && (
                          <p className="text-sm text-gray-500">{obj.description}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm border ${getRoleColor(obj.role)}`}>
                        {obj.role?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${colorScheme.text}`}>
                        {formatCurrency(calculatedTotals.level3[obj.id] || 0)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Số liệu trực tiếp
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-gray-600" />
          <span>Tóm tắt tính toán</span>
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tổng cấp 3 (trực tiếp):</span>
            <span className="font-medium">
              {formatCurrency(Object.values(calculatedTotals.level3).reduce((sum, amount) => sum + amount, 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tổng cấp 2 (từ cấp 3):</span>
            <span className="font-medium">
              {formatCurrency(Object.values(calculatedTotals.level2).reduce((sum, amount) => sum + amount, 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tổng cấp 1 (từ cấp 2):</span>
            <span className="font-medium">
              {formatCurrency(Object.values(calculatedTotals.level1).reduce((sum, amount) => sum + amount, 0))}
            </span>
          </div>
          <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
            <span>Tổng cộng:</span>
            <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Object Cost Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-green-600" />
          <span>Tổng chi phí theo đối tượng</span>
        </h4>
        <div className="space-y-3">
          {/* Level 1 Objects */}
          {level1Objects.map(obj => {
            const amount = calculatedTotals.level1[obj.id] || 0
            const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0
            const colorScheme = getParentBasedColor(obj, 1)
            
            return (
              <div key={obj.id} className={`p-3 rounded-lg border ${colorScheme.bg} ${colorScheme.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorScheme.accent}`}>
                      {getRoleIcon(obj.role)}
                    </div>
                    <div>
                      <h5 className={`font-medium ${colorScheme.text}`}>{obj.name}</h5>
                      <p className="text-sm text-gray-500">Cấp 1 - Tổng hợp</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${colorScheme.text}`}>
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Level 2 Objects */}
          {level2Objects.map(obj => {
            const amount = calculatedTotals.level2[obj.id] || 0
            const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0
            const colorScheme = getParentBasedColor(obj, 2)
            
            return (
              <div key={obj.id} className={`p-3 rounded-lg border ${colorScheme.bg} ${colorScheme.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorScheme.accent}`}>
                      {getRoleIcon(obj.role)}
                    </div>
                    <div>
                      <h5 className={`font-medium ${colorScheme.text}`}>{obj.name}</h5>
                      <p className="text-sm text-gray-500">Cấp 2 - Loại vật liệu</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${colorScheme.text}`}>
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Level 3 Objects */}
          {level3Objects.map(obj => {
            const amount = calculatedTotals.level3[obj.id] || 0
            const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0
            const colorScheme = getParentBasedColor(obj, 3)
            
            return (
              <div key={obj.id} className={`p-3 rounded-lg border ${colorScheme.bg} ${colorScheme.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorScheme.accent}`}>
                      {getRoleIcon(obj.role)}
                    </div>
                    <div>
                      <h5 className={`font-medium ${colorScheme.text}`}>{obj.name}</h5>
                      <p className="text-sm text-gray-500">Cấp 3 - Nhà cung cấp cụ thể</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${colorScheme.text}`}>
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Total */}
          <div className="border-t border-gray-300 pt-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Calculator className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">Tổng cộng</h5>
                  <p className="text-sm text-gray-500">Tất cả đối tượng</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(grandTotal)}
                </div>
                <div className="text-sm text-gray-500">
                  100.0%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
