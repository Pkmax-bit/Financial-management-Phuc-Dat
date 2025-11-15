'use client'

import { Suspense, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'

type RequestState = 'idle' | 'loading' | 'success' | 'error'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams])

  const [token, setToken] = useState(initialToken)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<RequestState>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!token) {
      setStatus('error')
      setMessage('Liên kết đặt lại không hợp lệ hoặc đã hết hạn.')
      return
    }

    if (newPassword.length < 6) {
      setStatus('error')
      setMessage('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }

    if (newPassword !== confirmPassword) {
      setStatus('error')
      setMessage('Mật khẩu nhập lại không khớp.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch(getApiEndpoint('/api/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token.trim(),
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Đặt lại mật khẩu thất bại.')
      }

      setStatus('success')
      setMessage(data.message || 'Mật khẩu đã được cập nhật thành công.')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => router.push('/login'), 2500)
    } catch (error: any) {
      console.error('Reset password error:', error)
      setStatus('error')
      setMessage(error.message || 'Đặt lại mật khẩu thất bại, vui lòng thử lại.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <Link
          href="/login"
          className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-full font-medium hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Trở về đăng nhập</span>
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-emerald-100">
            <Lock className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
          <p className="mt-2 text-sm text-gray-600">
            Nhập mật khẩu mới để hoàn tất quá trình đặt lại.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-sm text-red-800">{message}</p>
            </div>
          )}

          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700">
              Mã xác nhận
            </label>
            <input
              id="token"
              name="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Token trong email"
            />
            <p className="mt-1 text-xs text-gray-500">
              Token được tự động điền từ liên kết trong email. Bạn có thể dán lại tại đây nếu cần.
            </p>
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
              Mật khẩu mới
            </label>
            <input
              id="new-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Nhập mật khẩu mới"
              required
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Nhập lại mật khẩu
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Đang cập nhật...</span>
              </>
            ) : (
              <span>Cập nhật mật khẩu</span>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>
            Quay lại{' '}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-500 font-medium">
              trang đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
