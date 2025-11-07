'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { apiGet } from '@/lib/api'
import { getApiEndpoint } from '@/lib/apiUrl'

export default function AuthFixPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const createTestUser = async () => {
    setLoading(true)
    try {
      // First try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@phucdat.com',
        password: 'Admin123456!',
        options: {
          data: {
            full_name: 'Administrator',
            role: 'admin'
          }
        }
      })

      if (signUpError && !(signUpError as Error).message.includes('already registered')) {
        throw signUpError
      }

      setResult(`✅ User created or already exists: ${signUpData.user?.email || 'admin@phucdat.com'}`)
    } catch (error: unknown) {
      setResult(`❌ Error creating user: ${(error as Error).message}`)
    }
    setLoading(false)
  }

  const loginTestUser = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@phucdat.com',
        password: 'Admin123456!'
      })

      if (error) throw error

      setResult(`✅ Login successful: ${data.user?.email}, Token: ${data.session?.access_token?.substring(0, 30)}...`)
    } catch (error: unknown) {
      setResult(`❌ Login error: ${(error as Error).message}`)
    }
    setLoading(false)
  }

  const testAuthAPI = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setResult('❌ No session found. Please login first.')
        setLoading(false)
        return
      }

      setResult(`🔍 Testing API with token: ${session.access_token.substring(0, 30)}...`)
      
      // Test token info endpoint
      try {
        const tokenInfo = await apiGet('/api/auth-test/token-info')
        setResult(prev => prev + `\n\n✅ Token Info: ${JSON.stringify(tokenInfo, null, 2)}`)
      } catch (error: unknown) {
        setResult(prev => prev + `\n\n❌ Token Info Error: ${(error as Error).message}`)
      }
      
      // Test simple auth endpoint
      try {
        const simpleAuth = await apiGet('/api/auth-test/simple-auth')
        setResult(prev => prev + `\n\n✅ Simple Auth: ${JSON.stringify(simpleAuth, null, 2)}`)
      } catch (error: unknown) {
        setResult(prev => prev + `\n\n❌ Simple Auth Error: ${(error as Error).message}`)
      }
      
      // Test employees simple endpoint
      try {
        const employeesSimple = await apiGet('/api/employees/simple-test')
        setResult(prev => prev + `\n\n✅ Employees Simple: ${JSON.stringify(employeesSimple, null, 2)}`)
      } catch (error: unknown) {
        setResult(prev => prev + `\n\n❌ Employees Simple Error: ${(error as Error).message}`)
      }
      
      // Test employees original endpoint
      try {
        const employees = await apiGet('/api/employees')
        setResult(prev => prev + `\n\n✅ Employees API: ${Array.isArray(employees) ? `Found ${employees.length} employees` : JSON.stringify(employees)}`)
      } catch (error: unknown) {
        setResult(prev => prev + `\n\n❌ Employees API Error: ${(error as Error).message}`)
      }
      
    } catch (error: unknown) {
      setResult(prev => prev + `\n\n❌ API Test Error: ${(error as Error).message}`)
    }
    setLoading(false)
  }

  const testPublicEmployees = async () => {
    setLoading(true)
    try {
      setResult('🔍 Testing public employees endpoint (no auth required)...')
      
      // Test public employees endpoint
      const response = await fetch(getApiEndpoint('/api/employees/public-list')
      const data = await response.json()
      
      setResult(prev => prev + `\n\n✅ Public Employees: ${JSON.stringify(data, null, 2)}`)
      
    } catch (error: unknown) {
      setResult(prev => prev + `\n\n❌ Public Employees Error: ${(error as Error).message}`)
    }
    setLoading(false)
  }

  const checkCurrentAuth = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()

      setResult(`🔍 Current Auth Status:
- Session: ${session ? 'Active' : 'None'}
- User: ${user ? user.email : 'None'}  
- Access Token: ${session?.access_token ? 'Present' : 'Missing'}
- Token Preview: ${session?.access_token?.substring(0, 50)}...`)
    } catch (error: unknown) {
      setResult(`❌ Auth check error: ${(error as Error).message}`)
    }
    setLoading(false)
  }

  const fixUserInDatabase = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setResult('❌ Please login first')
        setLoading(false)
        return
      }

      const user = session.user
      
      // Check if user exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (existingUser) {
        setResult(`✅ User already exists in database: ${existingUser.email}`)
      } else {
        // Insert user into users table
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Administrator',
            role: 'admin',
            is_active: true
          })
          .select()
          .single()

        if (error) throw error
        
        setResult(`✅ User created in database: ${JSON.stringify(newUser, null, 2)}`)
      }
    } catch (error: unknown) {
      setResult(`❌ Database error: ${(error as Error).message}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔧 Fix Authentication Issues
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button
              onClick={createTestUser}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              1. Create Test User
            </button>
            
            <button
              onClick={loginTestUser}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              2. Login Test User
            </button>
            
            <button
              onClick={fixUserInDatabase}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              3. Fix User in DB
            </button>
            
            <button
              onClick={checkCurrentAuth}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              Check Auth Status
            </button>
            
            <button
              onClick={testAuthAPI}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Test API Auth
            </button>
            
            <button
              onClick={testPublicEmployees}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Test Public Employees
            </button>
            
            <button
              onClick={() => setResult('')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>

          {result && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {result}
            </div>
          )}
          
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-black">Processing...</span>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">📋 Các bước sửa lỗi:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Tạo user test với email admin@phucdat.com</li>
            <li>2. Đăng nhập để có session và access token</li>
            <li>3. Thêm user vào database users table nếu chưa có</li>
            <li>4. Test các API endpoints để kiểm tra authentication</li>
            <li>5. Kiểm tra lại employees page</li>
          </ol>
        </div>
      </div>
    </div>
  )
}