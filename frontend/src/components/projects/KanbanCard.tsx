"use client"

import React from 'react'

interface ProjectCardProps {
  id: string
  name: string
  projectCode: string
  customerName?: string
  progress?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  onClick?: () => void
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-700'
}

export default function KanbanCard({
  name,
  projectCode,
  customerName,
  progress,
  priority,
  onClick
}: ProjectCardProps) {
  return (
    <div
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
      <div className="mt-1 text-xs text-gray-500">{projectCode}</div>
      {customerName && (
        <div className="mt-1 text-xs text-gray-600">{customerName}</div>
      )}
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



