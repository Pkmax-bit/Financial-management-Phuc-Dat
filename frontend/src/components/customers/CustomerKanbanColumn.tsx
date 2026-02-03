"use client"

import React from 'react'
import { Plus } from 'lucide-react'
import CustomerKanbanCard from './CustomerKanbanCard'
import type { Customer } from '@/types'

interface CustomerKanbanColumnProps {
  title: string
  count: number
  colorClass: string
  customers: Customer[]
  onCardClick?: (customer: Customer) => void
  onDragStart?: (customer: Customer) => void
  onCardEdit?: (customer: Customer) => void
  onCardDelete?: (customer: Customer) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
  isDragOver?: boolean
  onAddStatus?: () => void
  statusId?: string
}

// Convert hex color to Tailwind color class
const hexToColorClass = (hex: string): string => {
  // Map common hex colors to Tailwind classes
  const colorMap: Record<string, string> = {
    '#2FC6F6': 'bg-cyan-100 text-cyan-800',
    '#2066B0': 'bg-blue-200 text-blue-900',
    '#9ECF00': 'bg-lime-100 text-lime-800',
    '#FFA900': 'bg-yellow-100 text-yellow-800',
    '#FF5752': 'bg-red-100 text-red-800',
    '#9CA3AF': 'bg-gray-100 text-gray-800',
    '#6B7280': 'bg-gray-200 text-gray-900',
    '#A855F7': 'bg-purple-100 text-purple-800'
  }
  return colorMap[hex] || 'bg-gray-100 text-gray-800'
}

export default function CustomerKanbanColumn({ 
  title, 
  count, 
  colorClass, 
  customers,
  onCardClick,
  onDragStart,
  onCardEdit,
  onCardDelete,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  onAddStatus,
  statusId
}: CustomerKanbanColumnProps) {
  // If colorClass is a hex color, convert it
  const finalColorClass = colorClass.startsWith('#') ? hexToColorClass(colorClass) : colorClass

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
      <div className={`rounded-t-lg ${finalColorClass}`}>
        <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
          <span>{title}</span>
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
      </div>
      <div className="flex-1 space-y-3 p-3 overflow-y-auto">
        {customers.map(customer => (
          <CustomerKanbanCard
            key={customer.id}
            customer={customer}
            statusColor={colorClass.startsWith('#') ? colorClass : undefined}
            onClick={() => onCardClick?.(customer)}
            onDragStart={() => onDragStart?.(customer)}
            onEdit={onCardEdit}
            onDelete={onCardDelete}
          />
        ))}
        {customers.length === 0 && (
          <div className="rounded-md border border-dashed bg-white p-6 text-center text-sm text-gray-500">Không có khách hàng</div>
        )}
      </div>
    </div>
  )
}

