"use client"

import React from 'react'

interface ProjectCardProps {
  id: string
  name: string
  projectCode: string
  customerName?: string
  progress?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  categoryName?: string
  categoryColor?: string
  managerName?: string
  creatorName?: string
  creatorAvatar?: string
  managerAvatar?: string
  onClick?: () => void
  onDragStart?: () => void
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-700'
}

export default function KanbanCard({
  id,
  name,
  projectCode,
  customerName,
  progress,
  priority,
  categoryName,
  categoryColor,
  managerName,
  creatorName,
  creatorAvatar,
  managerAvatar,
  onClick,
  onDragStart
}: ProjectCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    onDragStart?.()
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900 leading-5 line-clamp-2">{name}</h4>
        {priority && (
          <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[priority]}`}>
            {priority}
          </span>
        )}
      </div>

      {/* Category and Priority Tags */}
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {categoryName && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: categoryColor ? `${categoryColor}20` : '#E5E7EB',
              color: categoryColor || '#374151'
            }}
          >
            {categoryName}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-gray-500">{projectCode}</div>
      {customerName && (
        <div className="mt-1 text-xs text-gray-600">{customerName}</div>
      )}
<<<<<<< HEAD

      {/* Avatar Section */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {creatorAvatar ? (
              <div className="relative group/avatar">
                <img
                  src={creatorAvatar}
                  alt={creatorName || 'Creator'}
                  className="w-6 h-6 rounded-full border border-gray-300 hover:border-blue-400 transition-colors"
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-10">
                  {creatorName || 'Người tạo'}
                </div>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                {(creatorName || 'N')[0]?.toUpperCase()}
              </div>
            )}

            <span className="text-gray-400 text-xs">{'>'}</span>

            {managerAvatar ? (
              <div className="relative group/avatar">
                <img
                  src={managerAvatar}
                  alt={managerName || 'Manager'}
                  className="w-6 h-6 rounded-full border border-blue-300 hover:border-blue-500 transition-colors"
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-10">
                  {managerName || 'Người chịu trách nhiệm'}
                </div>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                {(managerName || 'M')[0]?.toUpperCase()}
              </div>
            )}
          </div>
=======
      {managerName && (
        <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
          <span className="text-gray-400">👤</span>
          <span>Người chịu trách nhiệm: {managerName}</span>
>>>>>>> parent of 9cd810a8 (cập nhật việc vần làm , hiển thị báo giá và chi phí dự án  kế hoạch)
        </div>
      </div>
      {typeof progress === 'number' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Tiến độ</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}



