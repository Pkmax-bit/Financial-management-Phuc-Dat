'use client'

import React from 'react'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import StickyTopNav from '@/components/StickyTopNav'
import KanbanBoard from '@/components/projects/KanbanBoard'
import { useRouter } from 'next/navigation'

export default function ProjectsKanbanPage() {
  const router = useRouter()
  return (
    <LayoutWithSidebar onLogout={() => router.push('/login')}>
      <div className="w-full">
        <StickyTopNav title="Kanban dự án" subtitle="Nhìn tổng quan theo trạng thái">
          <button
            onClick={() => router.push('/projects')}
            className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-black transition-colors hover:bg-gray-200"
          >
            Quay lại danh sách
          </button>
        </StickyTopNav>

        <div className="px-2 py-6 sm:px-4 lg:px-6 xl:px-8">
          <KanbanBoard />
        </div>
      </div>
    </LayoutWithSidebar>
  )
}



