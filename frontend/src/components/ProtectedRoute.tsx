'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        console.log('No valid session, redirecting to login')
        router.push('/login')
        return
      }

      // Verify user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', session.user.id)
        .single()

      if (userError || !userData) {
        console.log('User not found in database, redirecting to login')
        router.push('/login')
        return
      }

      setAuthenticated(true)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xác thực...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null // Router will handle redirect
  }

  return <>{children}</>
}