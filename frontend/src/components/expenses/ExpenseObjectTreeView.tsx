'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  FileText,
  Package,
  Check,
  X
} from 'lucide-react'

interface ExpenseObject {
  id: string
  name: string
  description?: string
  parent_id?: string
  level?: number
  is_active: boolean
  role?: string
  children?: ExpenseObject[]
}

interface ExpenseObjectTreeViewProps {
  expenseObjects: ExpenseObject[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  expenseAmounts?: Record<string, number> // Chi phí cho từng đối tượng
  invoiceItems?: Array<{
    id?: string
    productName: string
    expense_object_id?: string
    componentsAmt?: Record<string, number>
    lineTotal: number
  }>
  onExpand?: (objectId: string) => void
  expandedIds?: Set<string>
}

export default function ExpenseObjectTreeView({
  expenseObjects,
  selectedIds,
  onSelectionChange,
  expenseAmounts = {},
  invoiceItems = [],
  onExpand,
  expandedIds: externalExpandedIds
}: ExpenseObjectTreeViewProps) {
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(new Set())
  
  // Use external expandedIds if provided, otherwise use internal state
  const expandedIds = externalExpandedIds !== undefined ? externalExpandedIds : internalExpandedIds
  
  const handleToggleExpand = (objectId: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(objectId)) {
      newExpanded.delete(objectId)
    } else {
      newExpanded.add(objectId)
    }
    
    if (onExpand) {
      // Call onExpand for each changed ID
      if (expandedIds.has(objectId)) {
        // Collapsing - could add collapse handler if needed
      } else {
        onExpand(objectId)
      }
    }
    
    if (!externalExpandedIds) {
      setInternalExpandedIds(newExpanded)
    }
  }

  // Build tree structure
  const tree = useMemo(() => {
    const map = new Map<string, ExpenseObject>()
    const roots: ExpenseObject[] = []

    // Create map of all objects
    expenseObjects.forEach(obj => {
      map.set(obj.id, { ...obj, children: [] })
    })

    // Build tree
    expenseObjects.forEach(obj => {
      const node = map.get(obj.id)!
      if (obj.parent_id && map.has(obj.parent_id)) {
        const parent = map.get(obj.parent_id)!
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }, [expenseObjects])

  // Calculate totals for each object (parent = sum of children)
  // Ưu tiên tính từ invoiceItems (chi phí thực tế được nhập), sau đó từ expenseAmounts
  const calculatedTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    
    // Bước 1: Tính tổng trực tiếp từ invoice items (chi phí được nhập trong bảng)
    // Đây là nguồn dữ liệu chính xác nhất
    invoiceItems.forEach(item => {
      if (item.componentsAmt) {
        Object.entries(item.componentsAmt).forEach(([id, amount]) => {
          totals[id] = (totals[id] || 0) + (Number(amount) || 0)
        })
      }
    })

    // Bước 2: Nếu có expenseAmounts (từ directObjectTotals), cộng thêm vào
    // Chỉ cộng thêm nếu chưa có trong totals từ invoiceItems
    Object.entries(expenseAmounts).forEach(([id, amount]) => {
      // Chỉ cộng thêm nếu chưa có trong totals (từ invoiceItems)
      // Hoặc nếu expenseAmounts có giá trị lớn hơn (ưu tiên direct input)
      if (!totals[id] || (expenseAmounts[id] && expenseAmounts[id] > totals[id])) {
        totals[id] = (totals[id] || 0) + (Number(amount) || 0)
      }
    })

    // Bước 3: Tính tổng cha từ con (bottom-up approach)
    // Chi phí cha = tổng tất cả chi phí con
    const calculateParentTotals = (node: ExpenseObject): number => {
      // Nếu node không có con, trả về tổng trực tiếp của nó
      if (!node.children || node.children.length === 0) {
        return totals[node.id] || 0
      }

      // Tính tổng từ tất cả các con (đệ quy)
      const childrenTotal = node.children.reduce((sum, child) => {
        return sum + calculateParentTotals(child)
      }, 0)

      // Chi phí cha = tổng tất cả chi phí con
      // Luôn cập nhật tổng cha = tổng con, kể cả khi = 0
      totals[node.id] = childrenTotal

      return totals[node.id]
    }

    // Tính cho tất cả các node gốc (sẽ đệ quy tính tất cả các cha)
    tree.forEach(root => {
      calculateParentTotals(root)
    })

    return totals
  }, [expenseAmounts, invoiceItems, tree])

  // Toggle selection
  const toggleSelection = (objectId: string) => {
    const obj = expenseObjects.find(o => o.id === objectId)
    if (!obj) return

    let newSelectedIds: string[]

    if (selectedIds.includes(objectId)) {
      // Deselect: remove this object and all its children
      const childrenIds = getAllChildrenIds(objectId)
      newSelectedIds = selectedIds.filter(id => id !== objectId && !childrenIds.includes(id))
    } else {
      // Select: add this object and all its children
      const childrenIds = getAllChildrenIds(objectId)
      newSelectedIds = [...new Set([...selectedIds, objectId, ...childrenIds])]
    }

    // DISABLED: Auto-select parents when all children are selected
    // Users can manually select parent if needed, and parent total will be auto-calculated from children
    // newSelectedIds = autoSelectParents(newSelectedIds)
    
    onSelectionChange(newSelectedIds)
  }

  // Get all children IDs recursively
  const getAllChildrenIds = (parentId: string): string[] => {
    const children = expenseObjects.filter(obj => obj.parent_id === parentId)
    let allChildren: string[] = []
    
    children.forEach(child => {
      allChildren.push(child.id)
      allChildren = [...allChildren, ...getAllChildrenIds(child.id)]
    })
    
    return allChildren
  }

  // Auto-select parents when all children are selected
  const autoSelectParents = (currentIds: string[]): string[] => {
    let updatedIds = [...currentIds]
    let changed = true
    
    while (changed) {
      changed = false
      
      const parentsToSelect = expenseObjects.filter(parent => {
        if (updatedIds.includes(parent.id)) return false
        
        const children = expenseObjects.filter(child => child.parent_id === parent.id)
        if (children.length === 0) return false
        
        return children.every(child => updatedIds.includes(child.id))
      })
      
      if (parentsToSelect.length > 0) {
        updatedIds = [...updatedIds, ...parentsToSelect.map(p => p.id)]
        changed = true
      }
    }
    
    return updatedIds
  }

  // Toggle expand/collapse - use handleToggleExpand

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Render tree node
  const renderTreeNode = (node: ExpenseObject, level: number = 0): React.ReactNode => {
    const isExpanded = expandedIds.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedIds.includes(node.id)
    const total = calculatedTotals[node.id] || 0
    const hasAmount = total > 0

    // Check if all children are selected
    const allChildrenSelected = hasChildren && node.children!.every(child => selectedIds.includes(child.id))
    const someChildrenSelected = hasChildren && node.children!.some(child => selectedIds.includes(child.id))

    // Get invoice items for this object
    const objectInvoiceItems = invoiceItems.filter(item => 
      item.expense_object_id === node.id || 
      (item.componentsAmt && item.componentsAmt[node.id])
    )

    return (
      <div key={node.id} className="select-none">
        {/* Main node row */}
        <div 
          className={`
            flex items-center py-2 px-3 hover:bg-gray-50 border-b border-gray-100
            ${isSelected ? 'bg-blue-50' : ''}
            ${level > 0 ? 'bg-gray-50/50' : ''}
          `}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {/* Expand/Collapse button */}
          <div className="flex items-center mr-2">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleExpand(node.id)
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6" />
            )}
          </div>

          {/* Folder/File icon */}
          <div className="flex items-center mr-3">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-5 h-5 text-blue-500" />
              ) : (
                <Folder className="w-5 h-5 text-blue-500" />
              )
            ) : (
              <FileText className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Object info */}
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => toggleSelection(node.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                  {node.name}
                  {node.level !== undefined && (
                    <span className="ml-2 text-xs text-gray-500">(Cấp {node.level})</span>
                  )}
                </div>
                {node.description && (
                  <div className="text-sm text-gray-500 mt-1">{node.description}</div>
                )}
              </div>

              {/* Amount display */}
              {hasAmount && (
                <div className="ml-4 text-right">
                  <div className="text-sm font-semibold text-blue-700">
                    {formatCurrency(total)}
                  </div>
                  {hasChildren && (
                    <div className="text-xs text-gray-500">(tổng từ con)</div>
                  )}
                </div>
              )}

              {/* Checkbox */}
              <div 
                className={`ml-4 w-6 h-6 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600' 
                    : allChildrenSelected
                    ? 'bg-blue-100 border-blue-400'
                    : someChildrenSelected
                    ? 'bg-blue-50 border-blue-300'
                    : 'border-gray-300'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSelection(node.id)
                }}
              >
                {isSelected && <Check className="w-4 h-4 text-white" />}
                {!isSelected && allChildrenSelected && (
                  <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                )}
                {!isSelected && someChildrenSelected && !allChildrenSelected && (
                  <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                )}
              </div>
            </div>
          </div>

          {/* Expand arrow button (for showing children on the right) */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleExpand(node.id)
              }}
              className="ml-2 p-2 hover:bg-blue-100 rounded transition-colors"
              title="Mở rộng hiển thị chi phí con"
            >
              <ChevronRight className={`w-4 h-4 text-blue-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}

        {/* Show invoice items for this object when expanded */}
        {isExpanded && objectInvoiceItems.length > 0 && (
          <div className="bg-gray-50 border-l-4 border-blue-400" style={{ paddingLeft: `${(level + 1) * 24 + 12}px` }}>
            <div className="px-3 py-2 border-b border-gray-200">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <Package className="w-4 h-4 mr-2 text-blue-500" />
                Vật tư ({objectInvoiceItems.length})
              </div>
            </div>
            {objectInvoiceItems.map((item, idx) => (
              <div key={idx} className="px-3 py-2 border-b border-gray-100 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{item.productName}</span>
                  <span className="text-gray-600 font-medium">
                    {formatCurrency(item.lineTotal || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white max-h-[600px] overflow-y-auto">
      {tree.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <div>Chưa có đối tượng chi phí</div>
        </div>
      ) : (
        <div>
          {tree.map(root => renderTreeNode(root, 0))}
        </div>
      )}
    </div>
  )
}

