'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import StickyTopNav from '@/components/StickyTopNav'
import KanbanBoard, { KanbanBoardRef } from '@/components/projects/KanbanBoard'
import ProjectDetailSidebar from '@/components/projects/ProjectDetailSidebar'
import EditProjectSidebar from '@/components/projects/EditProjectSidebar'

interface Project {
  id: string
  project_code: string
  name: string
  description?: string
  customer_id: string
  customer_name?: string
  manager_id: string
  manager_name?: string
  start_date: string
  end_date?: string
  budget?: number
  actual_cost?: number
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  billing_type: 'fixed' | 'hourly' | 'milestone'
  hourly_rate?: number
  created_at: string
  updated_at: string
}

export default function ProjectsKanbanPage() {
  const router = useRouter()
  const kanbanBoardRef = useRef<KanbanBoardRef>(null)
  const [user, setUser] = useState<{ full_name?: string, role?: string, email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetailSidebar, setShowDetailSidebar] = useState(false)
  const [showEditSidebar, setShowEditSidebar] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (userData) {
          setUser(userData)
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Đang tải...</span>
        </div>
      </div>
    )
  }

  return (
    <LayoutWithSidebar 
      user={user}
      onLogout={() => router.push('/login')}
    >
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
          <KanbanBoard 
            ref={kanbanBoardRef}
            onViewProject={(project) => {
              setSelectedProject(project as Project)
              setShowDetailSidebar(true)
            }}
          />
        </div>
      </div>

      {/* Project Detail Sidebar */}
      <ProjectDetailSidebar
        isOpen={showDetailSidebar}
        onClose={() => {
          setShowDetailSidebar(false)
          setSelectedProject(null)
        }}
        project={selectedProject}
        onEdit={(project) => {
          setShowDetailSidebar(false)
          setSelectedProject(project)
          setShowEditSidebar(true)
        }}
        onDelete={(project) => {
          setShowDetailSidebar(false)
          setSelectedProject(null)
          // Refresh kanban board
          kanbanBoardRef.current?.refresh()
        }}
      />

      {/* Edit Project Sidebar */}
      <EditProjectSidebar
        isOpen={showEditSidebar}
        onClose={() => {
          setShowEditSidebar(false)
          setSelectedProject(null)
        }}
        project={selectedProject}
        onSuccess={() => {
          setShowEditSidebar(false)
          setSelectedProject(null)
          // Refresh kanban board
          kanbanBoardRef.current?.refresh()
        }}
      />
    </LayoutWithSidebar>
  )
}



