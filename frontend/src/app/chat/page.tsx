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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          await loadUserData(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUserId('')
        setCurrentUserName('')
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const [user, setUser] = useState<{ full_name?: string; role?: string; email?: string } | null>(null)

  const loadUserData = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, full_name, role, email')
        .eq('id', userId)
        .single()

      if (error || !userData) {
        console.error('Error fetching user:', error)
        router.push('/login')
        return
      }

      setCurrentUserId(userData.id)
      setCurrentUserName(userData.full_name || 'User')
      setUser({
        full_name: userData.full_name || 'User',
        role: userData.role || 'employee',
        email: userData.email
      })
      setLoading(false)
    } catch (error) {
      console.error('Error loading user data:', error)
      router.push('/login')
    }
  }

  const checkAuth = async () => {
    try {
      // Use getUser() instead of getSession() for better reliability
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        console.error('Auth error:', authError)
        router.push('/login')
        return
      }

      await loadUserData(authUser.id)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading || !currentUserId) {
    return (
      <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải thông tin đăng nhập...</p>
          </div>
        </div>
      </LayoutWithSidebar>
    )
  }

  return (
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="h-[calc(100vh-4rem)]">
        <InternalChat 
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      </div>
    </LayoutWithSidebar>
  )
}

