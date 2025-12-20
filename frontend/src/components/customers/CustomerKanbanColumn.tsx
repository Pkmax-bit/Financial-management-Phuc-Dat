"use client"

import React from 'react'
import CustomerKanbanCard from './CustomerKanbanCard'

interface Customer {
  id: string
  customer_code?: string
  name: string
  email?: string
  phone?: string
  type?: 'individual' | 'company' | 'government'
  credit_limit?: number
  status?: 'prospect' | 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

interface CustomerKanbanColumnProps {
  title: string
  count: number
  statusColor: string
  customers: Customer[]
  onCardClick?: (customer: Customer) => void
  onDragStart?: (customer: Customer) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
  isDragOver?: boolean
  onAddClick?: () => void
}

export default function CustomerKanbanColumn({
  title,
  count,
  statusColor,
  customers,
  onCardClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  onAddClick
}: CustomerKanbanColumnProps) {
  return (
    <div
      className={`flex h-full min-h-[540px] w-full flex-shrink-0 flex-col rounded-md border border-gray-200 bg-white transition-colors ${
        isDragOver ? 'border-blue-300 bg-blue-50' : ''
      }`}
      style={{ width: '300px' }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header - Bitrix24 style with tab-like appearance */}
      <div className="rounded-t-md bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Tab-like status name with arrow pointing right */}
            <div
              className="relative px-3 py-1 rounded-tl rounded-tr text-sm font-semibold text-gray-700"
              style={{
                backgroundColor: statusColor + '20', // 20% opacity
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%)'
              }}
            >
              <span>{title}</span>
            </div>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
              {count}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-2 p-3 overflow-y-auto bg-gray-50">
        {customers.map((customer) => (
          <CustomerKanbanCard
            key={customer.id}
            customer={customer}
            statusColor={statusColor}
            onClick={() => onCardClick?.(customer)}
            onDragStart={() => onDragStart?.(customer)}
          />
        ))}
        {customers.length === 0 && (
          <div className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            Chưa có khách hàng
          </div>
        )}
      </div>

      {/* Footer - Add button */}
      <div className="px-3 py-2 border-t border-gray-200 bg-white rounded-b-md">
        <button
          onClick={onAddClick}
          className="w-full text-left text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1.5 rounded transition-colors"
        >
          + Thêm khách hàng
        </button>
      </div>
    </div>
  )
}

