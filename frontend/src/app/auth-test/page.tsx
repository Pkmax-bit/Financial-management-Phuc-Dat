'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { apiGet } from '@/lib/api'
import { getApiEndpoint } from '@/lib/apiUrl'

export default function AuthTestPage() {
  const [session, setSession] = useState<unknown>(null)
  const [user, setUser] = useState<unknown>(null)
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()
    setSession(session)
    setUser(user)
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const result = await supabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'admin123'
      })
      
      if (result.error) {
        setTestResult(`Login Error: ${(result.error as Error).message}`)
      } else {
        setTestResult('Login Successful!')
        await checkAuth()
      }
    } catch (error: unknown) {
      setTestResult(`Login Exception: ${(error as Error).message}`)
    }
    setLoading(false)
  }

  const testPublicAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch(getApiEndpoint('/api/auth-test/public')
      const data = await response.json()
      setTestResult(`Public API Success: ${JSON.stringify(data, null, 2)}`)
    } catch (error: unknown) {
      setTestResult(`Public API Error: ${(error as Error).message}`)
    }
    setLoading(false)
  }

  const testTokenInfo = async () => {
    setLoading(true)
    try {
      const data = await apiGet('/api/auth-test/token-info')
      setTestResult(`Token Info Success: ${JSON.stringify(data, null, 2)}`)
    } catch (error: unknown) {
      setTestResult(`Token Info Error: ${(error as Error).message}`)
    }
    setLoading(false)
  }

  const testProtectedAPI = async () => {
    setLoading(true)
    try {
      const data = await apiGet('/api/employees')
      setTestResult(`Protected API Success: Found ${data.length} employees`)
    } catch (error: unknown) {
      setTestResult(`Protected API Error: ${(error as Error).message}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
              <p><strong>User:</strong> {user ? (user as { email?: string }).email : 'None'}</p>
              <p><strong>Access Token:</strong> {(session as { access_token?: string })?.access_token ? 'Present' : 'Missing'}</p>
            </div>
            <button
              onClick={checkAuth}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Status
            </button>
          </div>

          {/* Test Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Test Actions</h2>
            <div className="space-y-2">
              <button
                onClick={testLogin}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Test Login
              </button>
              <button
                onClick={testPublicAPI}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                Test Public API
              </button>
              <button
                onClick={testTokenInfo}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                Test Token Info
              </button>
              <button
                onClick={testProtectedAPI}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                Test Protected API
              </button>
            </div>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className="mt-6 bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-sm">
            <pre>{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
