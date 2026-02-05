'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import QuoteExcelUploadAI from '@/components/sales/QuoteExcelUploadAI'
import { supabase } from '@/lib/supabase'

export default function UploadQuotePage() {
  const [user, setUser] = useState<{ full_name?: string; role?: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
          setUser({
            full_name: userData.full_name,
            role: userData.role,
            email: userData.email
          })
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
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleImportSuccess = () => {
    // Redirect to quotes page after successful import
    setTimeout(() => {
      router.push('/sales?tab=quotes')
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="w-full">
        <div className="p-6">
          <QuoteExcelUploadAI onImportSuccess={handleImportSuccess} />
        </div>
      </div>
    </LayoutWithSidebar>
  )
}

