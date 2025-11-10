'use client'

import { ReactNode } from 'react'

interface MobileTableCardProps {
  children: ReactNode
  className?: string
}

/**
 * Utility component để hiển thị table dưới dạng card trên mobile
 * Sử dụng: Wrap table content với component này
 */
export default function MobileTableCard({ children, className = '' }: MobileTableCardProps) {
  return (
    <div className={`block md:hidden ${className}`}>
      {children}
    </div>
  )
}

interface TableCardRowProps {
  title: string
  value: ReactNode
  className?: string
  highlight?: boolean
}

/**
 * Component để hiển thị một row trong card layout
 */
export function TableCardRow({ title, value, className = '', highlight = false }: TableCardRowProps) {
  return (
    <div className={`flex items-start justify-between py-2 border-b border-gray-100 ${highlight ? 'bg-gray-50' : ''} ${className}`}>
      <span className="text-sm font-medium text-gray-600 flex-shrink-0 mr-4">{title}:</span>
      <span className="text-sm text-gray-900 text-right flex-1">{value}</span>
    </div>
  )
}

interface TableCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

/**
 * Component card để hiển thị table row trên mobile
 */
export function TableCard({ children, className = '', onClick }: TableCardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}


