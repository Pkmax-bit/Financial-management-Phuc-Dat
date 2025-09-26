'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { apiGet } from '@/lib/api'

export default function AuthTestPage() {
  const [sessionInfo, setSessionInfo] = useState<unknown>(null)
  const [userInfo, setUserInfo] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [apiTestResult, setApiTestResult] = useState<string>('')

  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('Session:', session)
    console.log('Session error:', error)
    setSessionInfo({ session: session?.user?.email || 'No session', error: error?.message || null })

    if (session?.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setUserInfo({ user: userData, error: userError?.message || null })
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'admin123'
      })
      
      if (error) {
        alert('Login error: ' + (error as Error).message)
      } else {
        alert('Login successful!')
        checkSession()
      }
    } catch (error) {
      alert('Login failed: ' + error)
    }
    setLoading(false)
  }

  const testAPI = async () => {
    try {
      setApiTestResult('Testing...')
      const data = await apiGet('/api/employees')
      setApiTestResult('✅ API Success: ' + JSON.stringify(data, null, 2))
    } catch (error: unknown) {
      setApiTestResult('❌ API Error: ' + (error as Error).message)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSessionInfo(null)
    setUserInfo(null)
    setApiTestResult('')
  }

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Session Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Info</h2>
            <button 
              onClick={checkSession}
              className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Check Session
            </button>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>

          {/* User Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>

          {/* Login Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Login Test</h2>
            <div className="space-y-4">
              <button 
                onClick={testLogin}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login as Admin'}
              </button>
              <button 
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-2"
              >
                Logout
              </button>
            </div>
          </div>

          {/* API Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Test</h2>
            <button 
              onClick={testAPI}
              className="mb-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Test /api/employees
            </button>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-64">
              {apiTestResult}
            </pre>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Test Steps:</h3>
            <ol className="list-decimal list-inside text-yellow-700 space-y-1">
              <li>Check current session status</li>
              <li>Login with admin credentials</li>
              <li>Test API call to protected endpoint</li>
              <li>Logout and verify session is cleared</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}