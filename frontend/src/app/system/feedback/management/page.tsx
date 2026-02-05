'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import FeedbackManagementTab from '@/components/system/FeedbackManagementTab'

interface User {
  id: string
  full_name?: string
  role?: string
  email?: string
}

export default function FeedbackManagementPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
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
          // Check if user is admin or manager
          if (userData.role === 'admin' || userData.role === 'manager') {
            setUser(userData)
          } else {
            router.push('/system/feedback')
          }
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="w-full">
        <div className="px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
          <FeedbackManagementTab />
        </div>
      </div>
    </LayoutWithSidebar>
  )
}
