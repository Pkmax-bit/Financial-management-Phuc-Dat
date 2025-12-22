"use client"

import React from 'react'
import { Building2, Mail, Phone, DollarSign, MoreVertical, MapPin } from 'lucide-react'

interface Customer {
  id: string
  customer_code?: string
  name: string
  email?: string
  phone?: string
  address?: string
  type?: 'individual' | 'company' | 'government'
  credit_limit?: number
  status?: 'prospect' | 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

interface CustomerKanbanCardProps {
  customer: Customer
  statusColor: string
  onClick?: () => void
  onDragStart?: () => void
  onMenuClick?: (e: React.MouseEvent) => void
}

export default function CustomerKanbanCard({
  customer,
  statusColor,
  onClick,
  onDragStart,
  onMenuClick
}: CustomerKanbanCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', customer.id)
    onDragStart?.()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'individual':
        return 'Cá nhân'
      case 'company':
        return 'Công ty'
      case 'government':
        return 'Cơ quan nhà nước'
      default:
        return '—'
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="group cursor-pointer rounded-md border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
      style={{
        borderLeft: `4px solid ${statusColor}`
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
            {getInitials(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{customer.name}</h4>
            {customer.customer_code && (
              <div className="text-xs text-gray-500 mt-0.5">
                Mã: {customer.customer_code}
              </div>
            )}
          </div>
        </div>
        {/* Menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMenuClick?.(e)
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Type badge */}
      {customer.type && (
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {getTypeLabel(customer.type)}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="space-y-1.5 mb-2">
        {customer.email && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Mail className="h-3 w-3 text-gray-400" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Phone className="h-3 w-3 text-gray-400" />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.address && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="truncate">{customer.address}</span>
          </div>
        )}
        {customer.credit_limit !== undefined && customer.credit_limit > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
            <DollarSign className="h-3 w-3 text-gray-400" />
            <span>Hạn mức: {formatCurrency(customer.credit_limit)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {customer.created_at && new Date(customer.created_at).toLocaleDateString('vi-VN')}
        </div>
      </div>
    </div>
  )
}

