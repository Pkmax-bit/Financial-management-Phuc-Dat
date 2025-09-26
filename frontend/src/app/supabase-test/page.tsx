'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TestResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  data?: unknown
  timestamp: string
}

export default function SupabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Checking...')
  const [authStatus, setAuthStatus] = useState<string>('Not tested')
  const [databaseStatus, setDatabaseStatus] = useState<string>('Not tested')
  const [configStatus, setConfigStatus] = useState<unknown>({})
  const [sessionInfo, setSessionInfo] = useState<unknown>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const addTestResult = (test: string, status: 'success' | 'error' | 'warning', message: string, data?: unknown) => {
    setTestResults(prev => [...prev, { test, status, message, data, timestamp: new Date().toLocaleTimeString() }])
  }

  const testSupabaseConnection = async () => {
    // Test 1: Configuration
    addTestResult('Config Check', 'success', 'Checking environment variables...')
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    setConfigStatus({
      url: url ? `${url.substring(0, 30)}...` : 'Missing',
      key: key ? `${key.substring(0, 20)}...` : 'Missing',
      hasUrl: !!url,
      hasKey: !!key
    })

    if (!url || !key) {
      addTestResult('Config Check', 'error', 'Missing environment variables!')
      setConnectionStatus('❌ Config Error')
      return
    }

    addTestResult('Config Check', 'success', 'Environment variables found')

    // Test 2: Basic Connection
    try {
      addTestResult('Connection Test', 'success', 'Testing basic Supabase connection...')
      
      const { data, error } = await supabase.from('users').select('count').limit(1)
      
      if (error) {
        addTestResult('Connection Test', 'warning', `Connection works but query failed: ${(error as Error).message}`, error)
        setConnectionStatus('⚠️ Connected (RLS Active)')
      } else {
        addTestResult('Connection Test', 'success', 'Connection and basic query successful')
        setConnectionStatus('✅ Connected')
      }
    } catch (error: unknown) {
      addTestResult('Connection Test', 'error', `Connection failed: ${(error as Error).message}`, error)
      setConnectionStatus('❌ Connection Failed')
    }

    // Test 3: Auth Status
    try {
      addTestResult('Auth Test', 'success', 'Checking authentication status...')
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        addTestResult('Auth Test', 'error', `Auth error: ${(error as Error).message}`, error)
        setAuthStatus('❌ Auth Error')
      } else if (session) {
        addTestResult('Auth Test', 'success', `User authenticated: ${session.user.email}`)
        setAuthStatus('✅ Authenticated')
        setSessionInfo({
          user: session.user.email,
          role: session.user.role || 'user',
          tokenExpiry: new Date(session.expires_at! * 1000).toLocaleString()
        })
      } else {
        addTestResult('Auth Test', 'warning', 'No active session')
        setAuthStatus('⚠️ Not Authenticated')
      }
    } catch (error: unknown) {
      addTestResult('Auth Test', 'error', `Auth check failed: ${(error as Error).message}`, error)
      setAuthStatus('❌ Auth Check Failed')
    }

    // Test 4: Database Tables
    try {
      addTestResult('Database Test', 'success', 'Testing database table access...')
      
      const tables = ['users', 'employees', 'customers', 'projects', 'expenses', 'invoices']
      const tableResults = []

      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('count').limit(1)
          
          if (error) {
            tableResults.push(`${table}: ❌ ${(error as Error).message}`)
          } else {
            tableResults.push(`${table}: ✅ Accessible`)
          }
        } catch (e: unknown) {
          tableResults.push(`${table}: ❌ ${(e as Error).message}`)
        }
      }

      addTestResult('Database Test', 'success', 'Table access test completed', tableResults)
      setDatabaseStatus('✅ Tables Checked')
    } catch (error: unknown) {
      addTestResult('Database Test', 'error', `Database test failed: ${(error as Error).message}`, error)
      setDatabaseStatus('❌ Database Error')
    }
  }

  const testLogin = async () => {
    try {
      addTestResult('Login Test', 'success', 'Attempting login with demo credentials...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'admin123'
      })

      if (error) {
        addTestResult('Login Test', 'error', `Login failed: ${(error as Error).message}`, error)
      } else {
        addTestResult('Login Test', 'success', `Login successful: ${data.user.email}`)
        // Refresh connection test
        setTimeout(() => testSupabaseConnection(), 1000)
      }
    } catch (error: unknown) {
      addTestResult('Login Test', 'error', `Login error: ${(error as Error).message}`, error)
    }
  }

  const testLogout = async () => {
    try {
      await supabase.auth.signOut()
      addTestResult('Logout Test', 'success', 'Logged out successfully')
      setSessionInfo(null)
      setTimeout(() => testSupabaseConnection(), 1000)
    } catch (error: unknown) {
      addTestResult('Logout Test', 'error', `Logout error: ${(error as Error).message}`, error)
    }
  }

  const getStatusColor = (status: string) => {
    if (status.includes('✅')) return 'text-green-600'
    if (status.includes('⚠️')) return 'text-yellow-600'
    if (status.includes('❌')) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Supabase Connection Test</h1>
        
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700 mb-2">Connection</h3>
            <p className={getStatusColor(connectionStatus)}>{connectionStatus}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700 mb-2">Authentication</h3>
            <p className={getStatusColor(authStatus)}>{authStatus}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700 mb-2">Database</h3>
            <p className={getStatusColor(databaseStatus)}>{databaseStatus}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700 mb-2">Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={testSupabaseConnection}
                className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Retest
              </button>
              <button 
                onClick={testLogin}
                className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Login
              </button>
              <button 
                onClick={testLogout}
                className="w-full bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(configStatus, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {sessionInfo ? JSON.stringify(sessionInfo, null, 2) : 'No active session'}
            </pre>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded border-l-4 ${
                  result.status === 'success' ? 'border-green-500 bg-green-50' :
                  result.status === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold">{result.test}</span>
                    <span className="text-gray-500 text-sm ml-2">{result.timestamp}</span>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${
                    result.status === 'success' ? 'bg-green-200 text-green-800' :
                    result.status === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <p className="text-sm mt-1">{result.message}</p>
                {Boolean(result.data) && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer">Show Details</summary>
                    <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}