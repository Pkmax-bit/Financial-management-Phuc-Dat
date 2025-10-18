'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import StickyTopNav from '@/components/StickyTopNav'
import KanbanBoard from '@/components/projects/KanbanBoard'

export default function ProjectsKanbanPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ full_name?: string, role?: string, email?: string } | null>(null)
  const [loading, setLoading] = useState(true)

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
          <KanbanBoard />
        </div>
      </div>
    </LayoutWithSidebar>
  )
}



