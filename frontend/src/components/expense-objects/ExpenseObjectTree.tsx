'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, Folder, FolderOpen } from 'lucide-react'

interface ExpenseObject {
  id: string
  name: string
  description?: string
  amount?: number
  parent_id?: string
  hierarchy_level: number
  is_parent: boolean
  total_children_cost: number
  cost_from_children: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  children?: ExpenseObject[]
}

interface ExpenseObjectTreeProps {
  objects: ExpenseObject[]
  onEdit: (obj: ExpenseObject) => void
  onDelete: (id: string) => void
  onAddChild: (parentId: string) => void
  onAddRoot: () => void
}

export default function ExpenseObjectTree({ 
  objects, 
  onEdit, 
  onDelete, 
  onAddChild, 
  onAddRoot 
}: ExpenseObjectTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const renderTreeNode = (node: ExpenseObject, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const indent = level * 24

    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center py-2 px-3 hover:bg-gray-50 border-b border-gray-100"
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          {/* Expand/Collapse Button */}
          <div className="flex items-center">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(node.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6" />
            )}
          </div>

          {/* Folder Icon */}
          <div className="flex items-center mr-3">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-5 h-5 text-blue-500" />
              ) : (
                <Folder className="w-5 h-5 text-blue-500" />
              )
            ) : (
              <div className="w-5 h-5" />
            )}
          </div>

          {/* Object Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {node.name}
                  </h3>
                  {node.is_parent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Parent
                    </span>
                  )}
                  {node.cost_from_children && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Calculated
                    </span>
                  )}
                </div>
                {node.description && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {node.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-4 ml-4">
                {/* Cost Display */}
                <div className="text-right">
                  {node.cost_from_children ? (
                    <div>
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(node.total_children_cost)}
                      </div>
                      <div className="text-xs text-gray-500">Từ con</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {node.amount ? formatCurrency(node.amount) : '0 ₫'}
                      </div>
                      <div className="text-xs text-gray-500">Trực tiếp</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {node.is_parent && (
                    <button
                      onClick={() => onAddChild(node.id)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Thêm con"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(node)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                    title="Sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(node.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children?.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Cây đối tượng chi phí</h2>
          <button
            onClick={onAddRoot}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm gốc
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="max-h-96 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có đối tượng chi phí
            </h3>
            <p className="text-gray-500 mb-4">
              Hãy thêm đối tượng chi phí đầu tiên
            </p>
            <button
              onClick={onAddRoot}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thêm đối tượng
            </button>
          </div>
        ) : (
          <div>
            {objects.map(node => renderTreeNode(node))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>📁 Đối tượng cha</span>
            <span>💰 Tính từ con</span>
            <span>📊 Trực tiếp</span>
          </div>
          <div>
            Tổng: {objects.length} đối tượng
          </div>
        </div>
      </div>
    </div>
  )
}
