'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QrCode, Loader2, CheckCircle, XCircle, Camera, CameraOff, RefreshCw } from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle')
  const scannerRef = useRef<HTMLDivElement>(null)
  const qrCodeScannerRef = useRef<any>(null)

  useEffect(() => {
    if (isOpen) {
      startScanner()
    } else {
      stopScanner()
    }
    return () => {
      stopScanner()
    }
  }, [isOpen])

  const startScanner = async () => {
    if (!scannerRef.current) return

    try {
      // Dynamically import html5-qrcode
      const { Html5Qrcode } = await import('html5-qrcode')
      
      setScanning(true)
      setStatus('scanning')
      setError(null)

      const html5QrCode = new Html5Qrcode(scannerRef.current.id)
      qrCodeScannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          // QR code detected
          handleQRCodeDetected(decodedText)
        },
        (errorMessage: string) => {
          // Ignore scanning errors (they're frequent during scanning)
          // Only log if it's not a "not found" error
          if (!errorMessage.includes('No QR code found')) {
            // Silent - don't spam console
          }
        }
      )
    } catch (err: any) {
      console.error('Error starting scanner:', err)
      setError(err.message || 'Không thể khởi động camera')
      setStatus('error')
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (qrCodeScannerRef.current) {
      try {
        await qrCodeScannerRef.current.stop()
        qrCodeScannerRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
      qrCodeScannerRef.current = null
    }
    setScanning(false)
    setStatus('idle')
  }

  const handleQRCodeDetected = async (qrData: string) => {
    try {
      // Stop scanning
      await stopScanner()
      setStatus('verifying')

      // Parse QR data (should be JSON)
      const qrJson = JSON.parse(qrData)
      
      if (qrJson.type !== 'mobile_to_web_login') {
        throw new Error('Mã QR không hợp lệ cho đăng nhập web')
      }

      const sessionId = qrJson.session_id
      const secretToken = qrJson.secret_token

      if (!sessionId || !secretToken) {
        throw new Error('Mã QR không đầy đủ thông tin')
      }

      // Verify QR code
      const verifyResponse = await fetch(getApiEndpoint('/api/auth/qr/web/verify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          secret_token: secretToken,
        }),
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json()
        throw new Error(errorData.detail || 'Lỗi xác thực QR code')
      }

      // Complete login
      const completeResponse = await fetch(getApiEndpoint('/api/auth/qr/web/complete'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          secret_token: secretToken,
        }),
      })

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.detail || 'Lỗi hoàn tất đăng nhập')
      }

      const completeData = await completeResponse.json()

      if (completeData.success && completeData.access_token) {
        // Save token to localStorage
        // The app uses this token for API calls
        localStorage.setItem('access_token', completeData.access_token)
        
        // Also try to set it in Supabase session if possible
        // Note: This is a custom JWT, not a Supabase session token
        // But we'll try to use it for compatibility
        try {
          const tokenParts = completeData.access_token.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            // Store user ID for reference
            if (payload.sub) {
              localStorage.setItem('user_id', payload.sub)
            }
          }
        } catch (tokenError) {
          console.warn('Could not decode token:', tokenError)
        }

        setStatus('success')

        // Close modal and redirect to dashboard
        // The page will reload and check for the token
        setTimeout(() => {
          onClose()
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        throw new Error('Đăng nhập thất bại')
      }
    } catch (err: any) {
      console.error('Error processing QR code:', err)
      setError(err.message || 'Lỗi xử lý QR code')
      setStatus('error')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold text-gray-900">
            <QrCode className="mr-2 h-6 w-6 text-blue-600" /> Quét QR Code từ điện thoại
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Mở ứng dụng trên điện thoại, vào menu "Đăng nhập Web bằng QR" để hiển thị mã QR, sau đó quét mã QR đó bằng camera web này.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
          {status === 'scanning' && (
            <>
              <div
                id="qr-reader"
                ref={scannerRef}
                className="w-full max-w-md"
                style={{ minHeight: '300px' }}
              />
              <p className="text-sm text-gray-700 mt-4 font-medium">
                Đang quét... Đưa camera vào mã QR trên điện thoại
              </p>
            </>
          )}

          {status === 'verifying' && (
            <div className="flex flex-col items-center text-blue-600 py-8">
              <Loader2 className="h-12 w-12 mb-3 animate-spin" />
              <p className="text-lg font-semibold">Đang xác thực...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center text-green-600 py-8">
              <CheckCircle className="h-12 w-12 mb-3" />
              <p className="text-lg font-semibold">Đăng nhập thành công!</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center text-red-600 py-8">
              <XCircle className="h-12 w-12 mb-3" />
              <p className="text-lg font-semibold">Lỗi</p>
              <p className="text-sm text-center mt-1">{error || 'Vui lòng thử lại.'}</p>
            </div>
          )}

          {status === 'idle' && !scanning && (
            <div className="flex flex-col items-center text-gray-600 py-8">
              <Camera className="h-12 w-12 mb-3" />
              <p className="text-lg font-semibold">Sẵn sàng quét</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          {status === 'error' && (
            <Button onClick={startScanner} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

