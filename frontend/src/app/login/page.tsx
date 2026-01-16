'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, Crown, DollarSign, Wrench, Truck, Users, Home, ArrowLeft, Calculator, QrCode, Briefcase, UserCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getApiEndpoint } from '@/lib/apiUrl'
import { QRCodeSVG } from 'qrcode.react'

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
    email: 'xuong@gmail.com',
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
    name: 'Kế Toán (Sales)',
    email: 'sales@example.com',
    password: '123456',
    role: 'SALES',
    icon: Calculator,
    color: 'bg-emerald-500',
    description: 'Kế toán - Quản lý tài chính và báo cáo (dùng tài khoản Sales)'
  },
  {
    name: 'Dương',
    email: 'phucdatdoors7@gmail.com',
    password: '123456',
    role: 'USER',
    icon: Briefcase,
    color: 'bg-cyan-500',
    description: 'Tài khoản Dương'
  },
  {
    name: 'Quân',
    email: 'tranhoangquan2707@gmail.com',
    password: '123456',
    role: 'USER',
    icon: UserCircle,
    color: 'bg-teal-500',
    description: 'Tài khoản Quân'
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
  const [showQRCode, setShowQRCode] = useState(false) // Don't show QR code by default
  const [qrData, setQrData] = useState<{ session_id: string; qr_code: string; expires_at: string } | null>(null)
  const [qrError, setQrError] = useState('')
  const [qrStatus, setQrStatus] = useState<'pending' | 'verified' | 'expired'>('pending')
  const router = useRouter()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
          
          const response = await fetch(getApiEndpoint('/api/auth/login'), {
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
            // Stop any QR polling if running
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            
            const result = await response.json()
            console.log('Backend auth success:', result)
            
            // Store token and user info
            if (result.access_token) {
              localStorage.setItem('access_token', result.access_token)
              localStorage.setItem('user', JSON.stringify(result.user))
              
              // Set Supabase session
              await supabase.auth.setSession({
                access_token: result.access_token,
                refresh_token: result.refresh_token || '',
              })
              
              // Redirect to dashboard immediately
              router.push('/dashboard')
              router.refresh()
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
        // Stop any QR polling if running
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        
        // Supabase auth successful
        console.log('Supabase auth success:', data)
        
        // Store token
        if (data.session?.access_token) {
          localStorage.setItem('access_token', data.session.access_token)
        }
        
        // Redirect to dashboard immediately
        router.push('/dashboard')
        router.refresh()
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

  // Generate anonymous QR code for mobile to scan and login web
  const generateAnonymousQRCode = async () => {
    try {
      setQrError('')
      setQrStatus('pending')
      
      const response = await fetch(getApiEndpoint('/api/auth/qr/generate-anonymous'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setQrData(data)
        setShowQRCode(true)
        startPollingQRStatus(data.session_id)
      } else {
        const errorData = await response.json()
        setQrError(errorData.detail || 'Không thể tạo QR code')
      }
    } catch (err: any) {
      console.error('Error generating QR code:', err)
      setQrError('Lỗi tạo QR code: ' + err.message)
    }
  }

  // Generate QR code for mobile login (after web user logs in)
  const generateQRCode = async () => {
    try {
      setQrError('')
      setQrStatus('pending')
      
      // First, try to get a session token
      const { data: { session } } = await supabase.auth.getSession()
      let token = session?.access_token
      
      // If no session, try localStorage
      if (!token) {
        token = localStorage.getItem('access_token') || ''
      }
      
      if (!token) {
        setQrError('Vui lòng đăng nhập trước để tạo QR code')
        return
      }

      const response = await fetch(getApiEndpoint('/api/auth/qr/generate'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setQrData(data)
        setShowQRCode(true)
        startPollingQRStatus(data.session_id)
      } else {
        const errorData = await response.json()
        setQrError(errorData.detail || 'Không thể tạo QR code')
      }
    } catch (err: any) {
      console.error('Error generating QR code:', err)
      setQrError('Lỗi tạo QR code: ' + err.message)
    }
  }

  // Cleanup polling on unmount or when login succeeds
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [])

  // Poll QR status
  const startPollingQRStatus = (sessionId: string) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    
    const interval = setInterval(async () => {
      try {
        // QR status endpoint doesn't require authentication for anonymous QR
        const response = await fetch(getApiEndpoint(`/api/auth/qr/status/${sessionId}`), {
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.status === 'completed' && data.access_token) {
            // QR login completed successfully
            setQrStatus('verified')
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            
            // Get access token from response
            localStorage.setItem('access_token', data.access_token)
            // Also try to set Supabase session
            try {
              await supabase.auth.setSession({
                access_token: data.access_token,
                refresh_token: '', // QR login doesn't provide refresh token
              })
            } catch (sessionError) {
              console.warn('Could not set Supabase session:', sessionError)
            }
            
            // Redirect to dashboard after successful QR login
            setTimeout(() => {
              router.push('/dashboard')
              router.refresh()
            }, 1000)
          } else if (data.status === 'verified') {
            // QR has been scanned but not completed yet
            setQrStatus('verified')
            // Continue polling until completed
          } else if (data.status === 'expired') {
            setQrStatus('expired')
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
          }
        }
      } catch (err) {
        console.error('Error polling QR status:', err)
      }
    }, 2000) // Poll every 2 seconds

    // Clear interval after 5 minutes
    setTimeout(() => {
      clearInterval(interval)
      if (qrStatus === 'pending') {
        setQrStatus('expired')
      }
    }, 5 * 60 * 1000)
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
              <Link 
                href="/forgot-password" 
                className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <div className="space-y-3">
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
            
            <Link
              href="/forgot-password"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Quên mật khẩu?
            </Link>
            
            {/* QR Login Button */}
            <button
              type="button"
              onClick={() => {
                setShowQRCode(true)
                generateAnonymousQRCode()
              }}
              className="w-full flex justify-center items-center py-2 px-4 border-2 border-blue-500 text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Đăng nhập bằng QR Code
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-black mb-4">
              Hoặc chọn tài khoản test để đăng nhập nhanh:
            </p>
          </div>
        </form>

        {/* QR Code Section for Mobile Login */}
        {showQRCode && qrData && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
            <div className="text-center mb-4">
              <QrCode className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Đăng nhập bằng QR Code
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Mở app Android, vào màn hình đăng nhập, nhấn nút "Đăng nhập bằng QR" và quét mã QR này
              </p>
            </div>
            
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
                <QRCodeSVG
                  value={qrData.qr_code}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            {qrStatus === 'pending' && (
              <div className="text-center">
                <p className="text-sm text-blue-600 mb-2">
                  ⏳ Đang chờ quét mã QR...
                </p>
                <p className="text-xs text-gray-500">
                  Mã QR có hiệu lực trong <strong>5 phút</strong>
                </p>
              </div>
            )}

            {qrStatus === 'verified' && (
              <div className="text-center">
                <p className="text-sm text-green-600 mb-2">
                  ✅ Đã quét thành công! Đang chuyển hướng...
                </p>
              </div>
            )}

            {qrStatus === 'expired' && (
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">
                  ⏰ Mã QR đã hết hạn
                </p>
                <button
                  onClick={generateQRCode}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Tạo mã QR mới
                </button>
              </div>
            )}

            {qrError && (
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">{qrError}</p>
                <button
                  onClick={generateQRCode}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Thử lại
                </button>
              </div>
            )}

          </div>
        )}

        {/* Test Accounts Section */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            Tài khoản Test
          </h3>
          
          {/* Featured Accounts - Hoàn and Quân */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">⭐ Tài khoản nổi bật</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testAccounts.filter(acc => acc.isFeatured).map((account, index) => {
                const IconComponent = account.icon
                return (
                  <button
                    key={`featured-${index}`}
                    onClick={() => handleTestAccountClick(account)}
                    className={`relative w-full flex items-center p-4 rounded-xl border-2 hover:shadow-lg transition-all duration-200 ${
                      formData.email === account.email 
                        ? account.color === 'bg-cyan-500' 
                          ? 'border-cyan-500 bg-cyan-50' 
                          : 'border-teal-500 bg-teal-50'
                        : account.color === 'bg-cyan-500'
                          ? 'border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50'
                          : 'border-teal-200 bg-gradient-to-r from-teal-50 to-green-50'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-12 h-12 ${account.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="ml-4 flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-gray-900">{account.name}</h4>
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                          account.color === 'bg-cyan-500' 
                            ? 'text-cyan-600 bg-cyan-100' 
                            : 'text-teal-600 bg-teal-100'
                        }`}>
                          {account.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 font-medium">{account.description}</p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {account.email} / {account.password}
                      </p>
                    </div>
                    {formData.email === account.email && (
                      <div className="absolute top-3 right-3">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          account.color === 'bg-cyan-500' ? 'bg-cyan-500' : 'bg-teal-500'
                        }`}>
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {testAccounts.filter(acc => !acc.isFeatured).map((account, index) => {
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
