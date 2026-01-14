'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Smartphone, Palette, ArrowLeft, QrCode, Download, Phone } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import QRLoginModal from '@/components/QRLoginModal'
import BackgroundSettings from '@/components/BackgroundSettings'
// import dynamic from 'next/dynamic'

// Tạm thời tắt QR code để tránh lỗi
// Dynamic import AppDownloadQRCode để tránh SSR issues
// const AppDownloadQRCode = dynamic(() => import('@/components/AppDownloadQRCode'), {
//   ssr: false,
//   loading: () => (
//     <div className="w-[200px] h-[200px] bg-gray-100 rounded animate-pulse flex items-center justify-center">
//       <span className="text-gray-400 text-sm">Đang tải QR code...</span>
//     </div>
//   ),
// })

export default function SettingsPage() {
  const router = useRouter()
  const [showQRLogin, setShowQRLogin] = useState(false)
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false)
  const [showAppDownload, setShowAppDownload] = useState(false) // reserved for future QR modal
  const [accessToken, setAccessToken] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  
  // App version state
  const [appVersion, setAppVersion] = useState<{
    version_name: string
    download_url: string | null
    file_size: number | null
    release_notes: string | null
  } | null>(null)
  const [loadingVersion, setLoadingVersion] = useState(true)
  
  // App download configuration
  const APP_DOWNLOAD_URL = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || '/api/app/download'
  
  // Format file size
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '~XX MB'
    const mb = bytes / (1024 * 1024)
    return `~${mb.toFixed(1)} MB`
  }
  
  // Get full URL for QR code
  const getFullDownloadUrl = () => {
    if (typeof window === 'undefined') return APP_DOWNLOAD_URL
    if (APP_DOWNLOAD_URL.startsWith('http')) return APP_DOWNLOAD_URL
    return window.location.origin + APP_DOWNLOAD_URL
  }

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

  // Fetch latest app version (chỉ để dùng download_url cho nút "Tải App Ngay")
  useEffect(() => {
    const fetchLatestVersion = async () => {
      try {
        setLoadingVersion(true)
        const endpoint = '/api/app/latest'
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) throw new Error(`Failed to fetch app version: ${response.status}`)
        const data = await response.json()
        setAppVersion({
          version_name: data.version_name || '1.0',
          download_url: data.download_url || null,
          file_size: data.file_size || null,
          release_notes: data.release_notes || null,
        })
      } catch (error) {
        console.error('Error fetching app version:', error)
        setAppVersion({
          version_name: '1.0',
          download_url: null,
          file_size: null,
          release_notes: null,
        })
      } finally {
        setLoadingVersion(false)
      }
    }
    fetchLatestVersion()
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

          {/* App Download Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-green-600" />
              Tải App Android
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Tải ứng dụng Financial Management cho điện thoại Android
            </p>
            
            <div className="space-y-4">
              {/* App Info - ẩn phần chi tiết Version/Kích thước theo yêu cầu */}

              {/* Download Button - Chỉ dùng download_url từ database */}
              <a
                href={appVersion?.download_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center space-x-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium ${
                  (!appVersion?.download_url && !loadingVersion) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={(e) => {
                  // Chỉ cho phép click nếu có download_url từ database
                  if (loadingVersion) {
                    e.preventDefault()
                    return
                  }
                  
                  // Bắt buộc phải có download_url từ database
                  const downloadUrl = appVersion?.download_url
                  
                  if (!downloadUrl) {
                    e.preventDefault()
                    alert('Link tải app chưa được cấu hình trong database. Vui lòng liên hệ quản trị viên để cập nhật thông tin phiên bản.')
                    return
                  }
                  
                  // Mở link từ database
                  window.open(downloadUrl, '_blank', 'noopener,noreferrer')
                }}
              >
                <Download className="h-5 w-5" />
                <span>
                  {loadingVersion ? 'Đang tải thông tin...' : 'Tải App Ngay'}
                </span>
              </a>

              {/* QR Code Section - Tạm thời tắt */}
              {/* <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowAppDownload(true)}
                  className="w-full flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                >
                  <div className="p-3 bg-green-100 rounded-lg">
                    <QrCode className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Quét QR Code để tải</h3>
                    <p className="text-sm text-gray-600">Quét bằng camera điện thoại để tải app</p>
                  </div>
                </button>
              </div> */}

              {/* Installation Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Hướng dẫn cài đặt:</h4>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Tải file APK về điện thoại</li>
                  <li>Mở file APK đã tải</li>
                  <li>Bật "Cài đặt từ nguồn không xác định" nếu được yêu cầu</li>
                  <li>Click "Cài đặt" và đợi hoàn tất</li>
                </ol>
              </div>
            </div>
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

      {/* App Download QR Modal - Tạm thời tắt */}
      {/* {showAppDownload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Quét QR Code để tải App</h3>
              <button
                onClick={() => setShowAppDownload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                <AppDownloadQRCode
                  value={getFullDownloadUrl()}
                  size={200}
                />
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                Quét QR code này bằng camera điện thoại Android để tải ứng dụng
              </p>
              
              <div className="w-full bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-2">Hoặc copy link:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={getFullDownloadUrl()}
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded bg-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getFullDownloadUrl())
                      alert('Đã copy link!')
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
}

