"use client"

import React, { useEffect, useMemo, useState } from 'react'
import KanbanColumn from './KanbanColumn'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'

interface ProjectItem {
  id: string
  name: string
  project_code: string
  customer_name?: string
  progress?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status: ProjectStatus
}

const statusMeta: Record<ProjectStatus, { title: string; colorClass: string }> = {
  planning: { title: 'Lên kế hoạch', colorClass: 'bg-gray-100 text-gray-800' },
  active: { title: 'Đang thực hiện', colorClass: 'bg-green-100 text-green-800' },
  on_hold: { title: 'Tạm dừng', colorClass: 'bg-yellow-100 text-yellow-800' },
  completed: { title: 'Hoàn thành', colorClass: 'bg-blue-100 text-blue-800' },
  cancelled: { title: 'Hủy', colorClass: 'bg-red-100 text-red-800' }
}

export default function KanbanBoard() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, project_code, status, priority, progress, customers(name)')

        if (error) throw error

        const mapped: ProjectItem[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          project_code: p.project_code,
          status: p.status,
          priority: p.priority,
          progress: typeof p.progress === 'number' ? p.progress : Number(p.progress ?? 0),
          customer_name: p.customers?.name
        }))

        setProjects(mapped)
      } catch (e: any) {
        setError(e.message || 'Lỗi tải dữ liệu dự án')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const grouped = useMemo(() => {
    const byStatus: Record<ProjectStatus, ProjectItem[]> = {
      planning: [],
      active: [],
      on_hold: [],
      completed: [],
      cancelled: []
    }
    for (const p of projects) {
      byStatus[p.status].push(p)
    }
    return byStatus
  }, [projects])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {(Object.keys(statusMeta) as ProjectStatus[]).map((status) => (
        <KanbanColumn
          key={status}
          title={statusMeta[status].title}
          colorClass={statusMeta[status].colorClass}
          count={grouped[status].length}
          projects={grouped[status]}
          onCardClick={(id) => router.push(`/projects/${id}`)}
        />
      ))}
    </div>
  )
}



