"use client"

import React from 'react'
import KanbanCard from './KanbanCard'

interface ProjectItem {
  id: string
  name: string
  project_code: string
  customer_name?: string
  progress?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

interface KanbanColumnProps {
  title: string
  count: number
  colorClass: string
  projects: ProjectItem[]
  onCardClick?: (id: string) => void
  onDragStart?: (project: ProjectItem) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
  isDragOver?: boolean
}

export default function KanbanColumn({ 
  title, 
  count, 
  colorClass, 
  projects, 
  onCardClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver
}: KanbanColumnProps) {
  return (
    <div 
      className={`flex h-full min-h-[540px] flex-col rounded-lg border transition-colors ${
        isDragOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={`flex items-center justify-between rounded-t-lg px-4 py-3 text-sm font-semibold ${colorClass}`}>
        <span>{title}</span>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-gray-700">{count}</span>
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
            onClick={() => onCardClick?.(p.id)}
            onDragStart={onDragStart}
          />
        ))}
        {projects.length === 0 && (
          <div className="rounded-md border border-dashed bg-white p-6 text-center text-sm text-gray-500">Không có dự án</div>
        )}
      </div>
    </div>
  )}



