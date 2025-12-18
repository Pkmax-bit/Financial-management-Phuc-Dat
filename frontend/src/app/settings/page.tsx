'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Smartphone, Palette, ArrowLeft, QrCode } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import QRLoginModal from '@/components/QRLoginModal'
import BackgroundSettings from '@/components/BackgroundSettings'

export default function SettingsPage() {
  const router = useRouter()
  const [showQRLogin, setShowQRLogin] = useState(false)
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false)
  const [accessToken, setAccessToken] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const { data: { user: authUser }, data: { session } } = await supabase.auth.getUser()
        if (authUser) {
          setCurrentUserId(authUser.id)
          if (session?.access_token) {
            setAccessToken(session.access_token)
          } else {
            const storedToken = localStorage.getItem('access_token')
            if (storedToken) {
              setAccessToken(storedToken)
            }
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }
    getCurrentUserId()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id)
        if (session.access_token) {
          setAccessToken(session.access_token)
        }
      } else {
        setCurrentUserId('')
        setAccessToken('')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* QR Login Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <QrCode className="h-5 w-5 mr-2 text-blue-600" />
              Đăng nhập bằng QR Code
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Sử dụng QR code để đăng nhập trên các thiết bị khác
            </p>
            
            {/* Web to Mobile QR */}
            <button
              onClick={() => setShowQRLogin(true)}
              className="w-full flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="p-3 bg-blue-100 rounded-lg">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Đăng nhập Mobile bằng QR</h3>
                <p className="text-sm text-gray-600">Tạo QR code để đăng nhập trên điện thoại</p>
              </div>
            </button>
          </div>

          {/* Background Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Palette className="h-5 w-5 mr-2 text-purple-600" />
              Cài đặt nền
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Tùy chỉnh giao diện nền của ứng dụng
            </p>
            <button
              onClick={() => setShowBackgroundSettings(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Mở cài đặt nền
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {accessToken && (
        <QRLoginModal
          isOpen={showQRLogin}
          onClose={() => setShowQRLogin(false)}
          accessToken={accessToken}
        />
      )}
      {showBackgroundSettings && (
        <BackgroundSettings
          isOpen={showBackgroundSettings}
          onClose={() => setShowBackgroundSettings(false)}
        />
      )}
    </div>
  )
}

