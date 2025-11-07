'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'

export default function DebugSessionPage() {
  const [sessionInfo, setSessionInfo] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      setLoading(true)
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      setSessionInfo({
        hasSession: !!session,
        session: session ? {
          user_email: session.user?.email,
          expires_at: session.expires_at,
          access_token_preview: session.access_token?.substring(0, 30) + '...',
          refresh_token_preview: session.refresh_token?.substring(0, 30) + '...',
          token_type: session.token_type,
          provider_token: session.provider_token,
          provider_refresh_token: session.provider_refresh_token
        } : null,
        error
      })
    } catch (err) {
      setSessionInfo({
        error: err instanceof Error ? (err as Error).message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const clearSession = async () => {
    try {
      await supabase.auth.signOut()
      console.log('Session cleared')
      await checkSession()
    } catch (err) {
      console.error('Error clearing session:', err)
    }
  }

  const testPublicEndpoint = async () => {
    try {
      const response = await fetch(getApiEndpoint('/api/employees/public-list'))
      const data = await response.json()
      alert(`Public endpoint test: ${JSON.stringify(data, null, 2)}`)
    } catch (err) {
      alert(`Public endpoint error: ${err}`)
    }
  }

  const testAuthEndpoint = async () => {
    if (!(sessionInfo as { session?: { access_token_preview?: string } })?.session?.access_token_preview) {
      alert('No access token available')
      return
    }

    try {
      // Get full token
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(getApiEndpoint('/api/employees'), {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`Auth endpoint success: ${JSON.stringify(data, null, 2)}`)
      } else {
        const errorText = await response.text()
        alert(`Auth endpoint error (${response.status}): ${errorText}`)
      }
    } catch (err) {
      alert(`Auth endpoint error: ${err}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-black">Loading session info...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Debug Session Information</h1>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Session Status</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={checkSession}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Session Info
              </button>
              
              <button
                onClick={clearSession}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear Session
              </button>
              
              <button
                onClick={testPublicEndpoint}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Test Public Endpoint
              </button>
              
              <button
                onClick={testAuthEndpoint}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Test Auth Endpoint
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/employees')}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Go to Employees Page
                </button>
                
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Go to Login Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}