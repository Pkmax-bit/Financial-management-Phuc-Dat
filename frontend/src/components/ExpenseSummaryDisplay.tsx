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

    // Calculate level 2 totals - check if directly selected first, then calculate from children
    displayObjects
      .filter(obj => obj.level === 2)
      .forEach(obj => {
        // If this level 2 object is directly selected and has amount, use it directly
        const isDirectlySelected = selectedObjects.some(sel => sel.id === obj.id)
        if (isDirectlySelected && expenseAmounts[obj.id]) {
          level2Totals[obj.id] = expenseAmounts[obj.id]
        } else {
          // Otherwise, calculate from children
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
        }
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

    // Calculate level 1 totals - check if directly selected first, then calculate from children
    displayObjects
      .filter(obj => obj.level === 1)
      .forEach(obj => {
        // If this level 1 object is directly selected and has amount, use it directly (unless only level 1 selected)
        const isDirectlySelected = selectedObjects.some(sel => sel.id === obj.id)
        if (isDirectlySelected && expenseAmounts[obj.id] && onlyLevel1Selected) {
          level1Totals[obj.id] = expenseAmounts[obj.id]
        } else if (!onlyLevel1Selected) {
          // Otherwise, calculate from level 2 children
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
        }
      })

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
    <div className="space-y-3">
      {/* Grand Total */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-800">Tổng chi phí</h3>
          </div>
          <div className="text-lg font-bold text-blue-900">
            {formatCurrency(grandTotal)}
          </div>
        </div>
      </div>

      {/* Object Cost Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-2">
        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center space-x-1">
          <Calculator className="w-4 h-4 text-green-600" />
          <span>Tổng chi phí theo đối tượng</span>
        </h4>
        <div className="space-y-2">
          {/* Level 1 Objects */}
          {level1Objects.map(obj => {
            const amount = calculatedTotals.level1[obj.id] || 0
            const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0
            const colorScheme = getParentBasedColor(obj, 1)
            
            return (
              <div key={obj.id} className={`p-2 rounded-lg border ${colorScheme.bg} ${colorScheme.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className={`p-1 rounded ${colorScheme.accent} flex-shrink-0`}>
                      {getRoleIcon(obj.role)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className={`text-sm font-medium ${colorScheme.text} truncate`}>{obj.name}</h5>
                      <p className="text-xs text-gray-500">Cấp 1 - Tổng hợp</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`text-sm font-semibold ${colorScheme.text}`}>
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-xs text-gray-500">
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
              <div key={obj.id} className={`p-2 rounded-lg border ${colorScheme.bg} ${colorScheme.border} ml-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className={`p-1 rounded ${colorScheme.accent} flex-shrink-0`}>
                      {getRoleIcon(obj.role)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className={`text-sm font-medium ${colorScheme.text} truncate`}>{obj.name}</h5>
                      <p className="text-xs text-gray-500">Cấp 2 - Loại vật liệu</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`text-sm font-semibold ${colorScheme.text}`}>
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-xs text-gray-500">
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
              <div key={obj.id} className={`p-2 rounded-lg border ${colorScheme.bg} ${colorScheme.border} ml-8`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className={`p-1 rounded ${colorScheme.accent} flex-shrink-0`}>
                      {getRoleIcon(obj.role)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className={`text-sm font-medium ${colorScheme.text} truncate`}>{obj.name}</h5>
                      <p className="text-xs text-gray-500">Cấp 3 - Nhà cung cấp cụ thể</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`text-sm font-semibold ${colorScheme.text}`}>
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Total */}
          <div className="border-t border-gray-300 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded bg-blue-100 flex-shrink-0">
                  <Calculator className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-gray-900">Tổng cộng</h5>
                  <p className="text-xs text-gray-500">Tất cả đối tượng</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-base font-bold text-blue-600">
                  {formatCurrency(grandTotal)}
                </div>
                <div className="text-xs text-gray-500">
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
