'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, Crown, DollarSign, Wrench, Truck, Users, Home, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Test accounts with different roles - Updated with real accounts
const testAccounts = [
  {
    name: 'Admin Test',
    email: 'admin@test.com',
    password: '123456',
    role: 'ADMIN',
    icon: Crown,
    color: 'bg-red-500',
    description: 'Toàn quyền - Quản lý hệ thống'
  },
  {
    name: 'Admin Example',
    email: 'admin@example.com',
    password: '123456',
    role: 'ADMIN',
    icon: Crown,
    color: 'bg-red-600',
    description: 'Toàn quyền - Quản lý hệ thống'
  },
  {
    name: 'Sales Manager',
    email: 'sales@example.com',
    password: '123456',
    role: 'SALES',
    icon: DollarSign,
    color: 'bg-blue-500',
    description: 'Quản lý báo giá và chi phí'
  },
  {
    name: 'Workshop Employee',
    email: 'workshop@test.com',
    password: '123456',
    role: 'WORKSHOP_EMPLOYEE',
    icon: Wrench,
    color: 'bg-orange-500',
    description: 'Nhân viên xưởng - Tạo chi phí sản xuất'
  },
  {
    name: 'Transport Employee',
    email: 'transport@test.com',
    password: '123456',
    role: 'TRANSPORT',
    icon: Truck,
    color: 'bg-yellow-500',
    description: 'Nhân viên vận chuyển - Tạo chi phí vận chuyển'
  },
  {
    name: 'Customer',
    email: 'customer@test.com',
    password: '123456',
    role: 'CUSTOMER',
    icon: Users,
    color: 'bg-indigo-500',
    description: 'Khách hàng - Portal khách hàng'
  },
  {
    name: 'Worker',
    email: 'worker@test.com',
    password: '123456',
    role: 'WORKER',
    icon: User,
    color: 'bg-purple-500',
    description: 'Công nhân - Tạo chi phí cơ bản'
  },
  {
    name: 'Test Employee',
    email: 'test.employee.new@company.com',
    password: '123456',
    role: 'EMPLOYEE',
    icon: User,
    color: 'bg-green-500',
    description: 'Nhân viên test - Tạo chi phí cơ bản'
  },
  {
    name: 'Test Employee Auth',
    email: 'test.employee.auth@company.com',
    password: '123456',
    role: 'EMPLOYEE',
    icon: User,
    color: 'bg-green-600',
    description: 'Nhân viên test - Tạo chi phí cơ bản'
  }
]

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate form data
    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu')
      setLoading(false)
      return
    }

    if (!formData.email.includes('@')) {
      setError('Email không hợp lệ')
      setLoading(false)
      return
    }

    try {
      // Try Supabase auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      })

      if (error) {
        console.log('Supabase auth error:', error)
        
        // If Supabase auth fails, try backend API
        try {
          console.log('Trying backend API with:', { email: formData.email, password: formData.password })
          
          const response = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email.trim(),
              password: formData.password,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            console.log('Backend auth success:', result)
            
            // Store token and user info
            if (result.access_token) {
              localStorage.setItem('access_token', result.access_token)
              localStorage.setItem('user', JSON.stringify(result.user))
              
              // Redirect to dashboard
              router.push('/dashboard')
            }
          } else {
            console.log('Backend API error:', response.status, response.statusText)
            const errorData = await response.json()
            console.log('Backend API error details:', errorData)
            setError(errorData.detail || `Login failed: ${response.status}`)
          }
        } catch (apiError) {
          console.log('Backend API error:', apiError)
          setError('Login failed. Please check your credentials.')
        }
      } else if (data.user) {
        // Supabase auth successful
        console.log('Supabase auth success:', data)
        router.push('/dashboard')
      }
    } catch (err) {
      console.log('General error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleTestAccountClick = (account: typeof testAccounts[0]) => {
    setFormData({
      email: account.email,
      password: account.password
    })
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button */}
      <div className="absolute top-4 left-4">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-full font-medium hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Trở về trang chủ</span>
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập vào tài khoản
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Địa chỉ email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-black" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Nhập email của bạn"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-black" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Nhập mật khẩu của bạn"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-black hover:text-black"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-black mb-4">
              Hoặc chọn tài khoản test để đăng nhập nhanh:
            </p>
          </div>
        </form>

        {/* Test Accounts Section */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            Tài khoản Test
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {testAccounts.map((account, index) => {
              const IconComponent = account.icon
              return (
                <button
                  key={index}
                  onClick={() => handleTestAccountClick(account)}
                  className={`relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 ${
                    formData.email === account.email ? 'border-blue-500 bg-blue-50' : 'bg-white'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 ${account.color} rounded-full flex items-center justify-center text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="ml-4 flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{account.name}</h4>
                      <span className="text-xs font-mono text-gray-500">{account.role}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{account.description}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {account.email} / {account.password}
                    </p>
                  </div>
                  {formData.email === account.email && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 Bấm vào tài khoản để tự động điền thông tin đăng nhập
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
