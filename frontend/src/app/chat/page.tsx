'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import InternalChat from '@/components/chat/InternalChat'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'

export default function ChatPage() {
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserName, setCurrentUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Get user info
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', session.user.id)
        .single()

      if (error || !userData) {
        console.error('Error fetching user:', error)
        router.push('/login')
        return
      }

      setCurrentUserId(userData.id)
      setCurrentUserName(userData.full_name || 'User')
      setLoading(false)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <LayoutWithSidebar>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải...</p>
          </div>
        </div>
      </LayoutWithSidebar>
    )
  }

  return (
    <LayoutWithSidebar>
      <div className="h-[calc(100vh-4rem)]">
        <InternalChat 
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      </div>
    </LayoutWithSidebar>
  )
}

