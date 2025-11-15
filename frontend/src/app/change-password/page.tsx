'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'
import { supabase } from '@/lib/supabase'

type RequestState = 'idle' | 'loading' | 'success' | 'error'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState<RequestState>('idle')
  const [message, setMessage] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
    } catch (error) {
      router.push('/login')
    }
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    if (password.length > 128) {
      return 'Mật khẩu không được vượt quá 128 ký tự'
    }
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('idle')
    setMessage('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus('error')
      setMessage('Vui lòng điền đầy đủ thông tin')
      return
    }

    const currentPasswordError = validatePassword(currentPassword)
    if (currentPasswordError) {
      setStatus('error')
      setMessage(currentPasswordError)
      return
    }

    const newPasswordError = validatePassword(newPassword)
    if (newPasswordError) {
      setStatus('error')
      setMessage(newPasswordError)
      return
    }

    if (newPassword !== confirmPassword) {
      setStatus('error')
      setMessage('Mật khẩu mới và xác nhận mật khẩu không khớp')
      return
    }

    if (currentPassword === newPassword) {
      setStatus('error')
      setMessage('Mật khẩu mới phải khác mật khẩu hiện tại')
      return
    }

    setStatus('loading')

    try {
      // Get access token from Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.')
      }

      const response = await fetch(getApiEndpoint('/api/auth/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Đổi mật khẩu thất bại')
      }

      setStatus('success')
      setMessage(data.message || 'Mật khẩu đã được cập nhật thành công')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Change password error:', error)
      setStatus('error')
      setMessage(error.message || 'Đổi mật khẩu thất bại, vui lòng thử lại sau.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-full font-medium hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Trở về trang chủ</span>
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Đổi mật khẩu</h2>
          <p className="mt-2 text-sm text-gray-600">
            Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-green-800 font-medium">{message}</p>
                <p className="text-xs text-green-600 mt-1">Đang chuyển hướng về trang chủ...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{message}</p>
            </div>
          )}

          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
              Mật khẩu hiện tại
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="current-password"
                name="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập mật khẩu hiện tại"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
              Mật khẩu mới
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="new-password"
                name="new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Mật khẩu phải có ít nhất 6 ký tự
            </p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Xác nhận mật khẩu mới
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirm-password"
                name="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập lại mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                Mật khẩu xác nhận không khớp
              </p>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'loading' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Cập nhật mật khẩu</span>
                </>
              )}
            </button>

            <Link
              href="/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

