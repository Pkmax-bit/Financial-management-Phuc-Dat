'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, RefreshCw, Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'

interface QRLoginModalProps {
  isOpen: boolean
  onClose: () => void
  accessToken: string
}

interface QRSession {
  session_id: string
  qr_code: string
  expires_at: string
}

export default function QRLoginModal({ isOpen, onClose, accessToken }: QRLoginModalProps) {
  const [qrData, setQrData] = useState<QRSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'pending' | 'verified' | 'expired'>('pending')
  const [polling, setPolling] = useState(false)

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && accessToken) {
      generateQRCode()
    }
  }, [isOpen, accessToken])

  // Poll for status updates
  useEffect(() => {
    if (!isOpen || !qrData || status !== 'pending') return

    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          getApiEndpoint(`/api/auth/qr/status/${qrData.session_id}`),
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

        if (response.ok) {
          const statusData = await response.json()
          setStatus(statusData.status as 'pending' | 'verified' | 'expired')
          
          if (statusData.status === 'verified') {
            setPolling(false)
            // Wait a bit then close
            setTimeout(() => {
              onClose()
            }, 2000)
          } else if (statusData.status === 'expired') {
            setPolling(false)
            setError('QR code đã hết hạn. Vui lòng tạo mã mới.')
          }
        }
      } catch (err) {
        console.error('Error polling QR status:', err)
      }
    }, 2000) // Poll every 2 seconds

    return () => {
      clearInterval(interval)
      setPolling(false)
    }
  }, [isOpen, qrData, status, accessToken, onClose])

  const generateQRCode = async () => {
    setLoading(true)
    setError('')
    setStatus('pending')

    try {
      const response = await fetch(getApiEndpoint('/api/auth/qr/generate'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setQrData(data)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Không thể tạo QR code')
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại.')
      console.error('Error generating QR code:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Đăng nhập bằng QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Hướng dẫn:</strong>
            </p>
            <ol className="list-decimal list-inside text-sm text-blue-800 mt-2 space-y-1">
              <li>Mở ứng dụng Android trên điện thoại</li>
              <li>Nhấn nút "📱 Đăng nhập bằng QR"</li>
              <li>Quét mã QR bên dưới</li>
              <li>Đợi xác thực tự động</li>
            </ol>
          </div>

          {/* QR Code Display */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Đang tạo QR code...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
              <p className="text-red-600 text-center mb-4">{error}</p>
              <button
                onClick={generateQRCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : qrData ? (
            <div className="flex flex-col items-center space-y-4">
              {/* Status indicator */}
              {status === 'verified' && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Đăng nhập thành công!</span>
                </div>
              )}

              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCodeSVG
                  value={qrData.qr_code}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Session info */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Mã QR có hiệu lực trong <strong>5 phút</strong>
                </p>
                {polling && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang chờ quét...</span>
                  </div>
                )}
              </div>

              {/* Refresh button */}
              <button
                onClick={generateQRCode}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">Tạo mã mới</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}


