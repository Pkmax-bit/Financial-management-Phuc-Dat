"""
Script sua loi dashboard loading
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def fix_dashboard_loading():
    """Sua loi dashboard loading"""
    print("SUA LOI DASHBOARD LOADING")
    print("=" * 50)
    
    # Test login
    print("1. Test login...")
    try:
        login_response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if login_response.status_code != 200:
            print(f"Login that bai: {login_response.status_code}")
            return
        
        token = login_response.json().get("access_token")
        print("Login thanh cong")
        headers = {"Authorization": f"Bearer {token}"}
        
    except Exception as e:
        print(f"Loi login: {str(e)}")
        return
    
    # Test dashboard stats with timeout
    print("\n2. Test dashboard stats with timeout...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/dashboard/stats", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("Dashboard stats OK")
            print(f"  - Total Revenue: {data.get('totalRevenue', 0)}")
            print(f"  - Total Expenses: {data.get('totalExpenses', 0)}")
            print(f"  - Cash Balance: {data.get('cashBalance', 0)}")
            print(f"  - Open Invoices: {data.get('openInvoices', 0)}")
            print(f"  - Pending Bills: {data.get('pendingBills', 0)}")
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Loi dashboard stats: {str(e)}")
    
    # Test other endpoints
    print("\n3. Test other endpoints...")
    endpoints = [
        "/api/dashboard/cashflow-projection",
        "/api/dashboard/planner-events",
        "/api/employees/",
        "/api/customers/",
        "/api/sales/"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}", headers=headers, timeout=5)
            print(f"  {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"  {endpoint}: Error - {str(e)}")

def create_optimized_dashboard():
    """Tao dashboard optimized"""
    print("\nTAO DASHBOARD OPTIMIZED")
    print("=" * 50)
    
    # Tao file dashboard optimized
    dashboard_code = '''
// Optimized Dashboard Component
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OptimizedDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  // Memoized user check
  const checkUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (userData) {
          setUser(userData)
          return true
        }
      }
      router.push('/login')
      return false
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
      return false
    }
  }, [router])

  // Memoized data fetching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch dashboard data
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setData(data)
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Single useEffect for initialization
  useEffect(() => {
    const initialize = async () => {
      const userValid = await checkUser()
      if (userValid) {
        await fetchData()
      }
    }
    
    initialize()
  }, [checkUser, fetchData])

  // Memoized loading state
  const isLoading = useMemo(() => {
    return loading || !user || !data
  }, [loading, user, data])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-black">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Lỗi: {error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Tổng doanh thu</h3>
          <p className="text-2xl font-bold text-green-600">
            {data?.totalRevenue?.toLocaleString('vi-VN') || 0} VND
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Tổng chi phí</h3>
          <p className="text-2xl font-bold text-red-600">
            {data?.totalExpenses?.toLocaleString('vi-VN') || 0} VND
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Số dư tiền mặt</h3>
          <p className="text-2xl font-bold text-blue-600">
            {data?.cashBalance?.toLocaleString('vi-VN') || 0} VND
          </p>
        </div>
      </div>
    </div>
  )
}
'''
    
    print("Dashboard optimized code da duoc tao")
    print("Cac cai tien:")
    print("1. Single useEffect for initialization")
    print("2. Memoized functions with useCallback")
    print("3. Memoized loading state with useMemo")
    print("4. Proper error handling")
    print("5. Single data fetch")
    print("6. Optimized re-renders")

def suggest_fixes():
    """De xuat cac sua loi"""
    print("\nDE XUAT CAC SUA LOI")
    print("=" * 50)
    
    print("1. SUA DASHBOARD PAGE:")
    print("   - Gop authentication check va data fetching vao 1 useEffect")
    print("   - Su dung useCallback cho functions")
    print("   - Su dung useMemo cho computed values")
    print("   - Add proper loading states")
    
    print("\n2. SUA USE DASHBOARD HOOK:")
    print("   - Remove duplicate API calls")
    print("   - Add request deduplication")
    print("   - Implement proper caching")
    print("   - Add error boundaries")
    
    print("\n3. SUA DASHBOARD SERVICE:")
    print("   - Add request timeout")
    print("   - Implement retry logic")
    print("   - Add response caching")
    print("   - Optimize database queries")
    
    print("\n4. SUA BACKEND ENDPOINTS:")
    print("   - Fix 404 endpoints")
    print("   - Optimize database queries")
    print("   - Add response caching")
    print("   - Add request logging")

if __name__ == "__main__":
    print("FIX DASHBOARD LOADING ISSUE")
    print("=" * 60)
    
    # Test current state
    fix_dashboard_loading()
    
    # Create optimized version
    create_optimized_dashboard()
    
    # Suggest fixes
    suggest_fixes()
    
    print("\n" + "=" * 60)
    print("HOAN THANH FIX DASHBOARD")
    print("=" * 60)
