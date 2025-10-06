'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import AIImageAnalysis from '@/components/ai/AIImageAnalysis'

export default function AIAnalysisPage() {
  const [user, setUser] = useState<{ full_name?: string; role?: string; email?: string; id?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser({
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: user.user_metadata?.role || 'user',
            email: user.email || '',
            id: user.id
          })
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleExpenseSaved = (expense: any) => {
    console.log('Expense saved:', expense)
    // You can add additional logic here, like showing a success message
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
        <AIImageAnalysis onExpenseSaved={handleExpenseSaved} />
      </div>
    </LayoutWithSidebar>
  )
}
