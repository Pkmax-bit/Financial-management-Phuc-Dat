'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
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
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="container mx-auto px-6 py-8">
        <AIImageAnalysis onExpenseSaved={handleExpenseSaved} />
      </div>
    </div>
  )
}
