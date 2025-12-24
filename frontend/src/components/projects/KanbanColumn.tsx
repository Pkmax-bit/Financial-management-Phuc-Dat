"use client"

import React from 'react'
import { Plus } from 'lucide-react'
import KanbanCard from './KanbanCard'

interface ProjectItem {
  id: string
  name: string
  project_code: string
  customer_name?: string
  progress: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status: string
  category_name?: string
  category_color?: string
  manager_name?: string
}

interface KanbanColumnProps {
  title: string
  count: number
  colorClass: string
  projects: ProjectItem[]
  totalInvoiceAmount?: number
  onCardClick?: (id: string) => void
  onDragStart?: (project: ProjectItem) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
  isDragOver?: boolean
  onAddStatus?: () => void
  statusId?: string
  onStatusHeaderDragStart?: (e: React.DragEvent) => void
  onStatusHeaderDragOver?: (e: React.DragEvent) => void
  onStatusHeaderDragLeave?: () => void
  onStatusHeaderDrop?: (e: React.DragEvent) => void
  isStatusHeaderDragging?: boolean
  isStatusHeaderDragOver?: boolean
}

export default function KanbanColumn({ 
  title, 
  count, 
  colorClass, 
  projects,
  totalInvoiceAmount = 0,
  onCardClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  onAddStatus,
  statusId,
  onStatusHeaderDragStart,
  onStatusHeaderDragOver,
  onStatusHeaderDragLeave,
  onStatusHeaderDrop,
  isStatusHeaderDragging,
  isStatusHeaderDragOver
}: KanbanColumnProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }
  return (
    <div 
      className={`flex h-full min-h-[540px] w-full flex-shrink-0 flex-col rounded-lg border transition-colors ${
        isDragOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
      }`}
      style={{ width: '320px' }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={`rounded-t-lg ${colorClass}`}>
        <div 
          className={`flex items-center justify-between px-4 py-3 text-sm font-semibold cursor-move select-none ${
            isStatusHeaderDragging ? 'opacity-50' : ''
          } ${isStatusHeaderDragOver ? 'ring-2 ring-white ring-offset-2' : ''}`}
          draggable={!!onStatusHeaderDragStart}
          onDragStart={onStatusHeaderDragStart}
          onDragOver={onStatusHeaderDragOver}
          onDragLeave={onStatusHeaderDragLeave}
          onDrop={onStatusHeaderDrop}
          title={onStatusHeaderDragStart ? "Kéo để thay đổi vị trí trạng thái" : undefined}
        >
          <span className="flex items-center gap-2">
            <span>⋮⋮</span>
            <span>{title}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-gray-700">{count}</span>
            {onAddStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddStatus()
                }}
                className="p-1 rounded hover:bg-white/20 transition-colors"
                title="Thêm trạng thái mới"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {totalInvoiceAmount > 0 && (
          <div className="px-4 pb-2 text-xs text-gray-600 border-t border-white/20">
            <span className="font-medium">Tổng hóa đơn: </span>
            <span className="font-semibold text-gray-800">{formatCurrency(totalInvoiceAmount)}</span>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-3 p-3 overflow-y-auto">
        {projects.map(p => (
          <KanbanCard
            key={p.id}
            id={p.id}
            name={p.name}
            projectCode={p.project_code}
            customerName={p.customer_name}
            progress={p.progress}
            priority={p.priority}
            categoryName={p.category_name}
            categoryColor={p.category_color}
            managerName={p.manager_name}
            onClick={() => onCardClick?.(p.id)}
            onDragStart={() => onDragStart?.(p)}
          />
        ))}
        {projects.length === 0 && (
          <div className="rounded-md border border-dashed bg-white p-6 text-center text-sm text-gray-500">Không có dự án</div>
        )}
      </div>
    </div>
  )}



