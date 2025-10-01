'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, RotateCcw, Square, Play, Pause, X, Check } from 'lucide-react'

interface MobileCameraProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (imageData: string) => void
  aspectRatio?: 'default' | 'a4'
}

export default function MobileCamera({ 
  isOpen, 
  onClose, 
  onCapture, 
  aspectRatio = 'default' 
}: MobileCameraProps) {
  const [cameraMode, setCameraMode] = useState<'front' | 'rear'>('rear')
  const [isRecording, setIsRecording] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setCameraLoading(true)
      setError(null)

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Get camera constraints
      const constraints = {
        video: {
          facingMode: cameraMode === 'front' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: aspectRatio === 'a4' ? 3/4 : 16/9
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setCameraLoading(false)
    } catch (err: any) {
      console.error('Error accessing camera:', err)
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
      setCameraLoading(false)
    }
  }, [cameraMode, aspectRatio])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas size based on aspect ratio
    const aspectRatioValue = aspectRatio === 'a4' ? 3/4 : 16/9
    const canvasWidth = 800
    const canvasHeight = canvasWidth / aspectRatioValue

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Calculate source dimensions for cropping
    const videoAspectRatio = video.videoWidth / video.videoHeight
    const targetAspectRatio = aspectRatioValue

    let sourceX = 0
    let sourceY = 0
    let sourceWidth = video.videoWidth
    let sourceHeight = video.videoHeight

    if (videoAspectRatio > targetAspectRatio) {
      // Video is wider, crop sides
      sourceWidth = video.videoHeight * targetAspectRatio
      sourceX = (video.videoWidth - sourceWidth) / 2
    } else {
      // Video is taller, crop top/bottom
      sourceHeight = video.videoWidth / targetAspectRatio
      sourceY = (video.videoHeight - sourceHeight) / 2
    }

    // Apply transforms for front camera
    if (cameraMode === 'front') {
      context.scale(-1, 1)
      context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, -canvasWidth, 0, canvasWidth, canvasHeight)
    } else {
      context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvasWidth, canvasHeight)
    }

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
  }, [cameraMode, aspectRatio])

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage)
      setCapturedImage(null)
      stopCamera()
      onClose()
    }
  }, [capturedImage, onCapture, stopCamera, onClose])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
  }, [])

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 text-white p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black bg-opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">Camera</h2>
          <button
            onClick={() => setCameraMode(cameraMode === 'front' ? 'rear' : 'front')}
            className="p-2 rounded-full bg-black bg-opacity-50"
          >
            <RotateCcw className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div className="absolute inset-0 flex items-center justify-center">
        {cameraLoading && (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Đang khởi động camera...</p>
          </div>
        )}

        {error && (
          <div className="text-white text-center p-4">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Thử lại
            </button>
          </div>
        )}

        {!cameraLoading && !error && !capturedImage && (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{
                transform: cameraMode === 'front' ? 'scaleX(-1)' : 'none'
              }}
              playsInline
              muted
            />
            
            {/* Focus Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="border-2 border-white border-dashed rounded-lg"
                style={{
                  width: aspectRatio === 'a4' ? '200px' : '300px',
                  height: aspectRatio === 'a4' ? '267px' : '169px',
                  aspectRatio: aspectRatio === 'a4' ? '3/4' : '16/9'
                }}
              />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-20 left-0 right-0 text-center text-white">
              <p className="text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full inline-block">
                Đặt hóa đơn trong khung để chụp
              </p>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain bg-black"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      {!cameraLoading && !error && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
          <div className="flex items-center justify-center space-x-4">
            {!capturedImage ? (
              <>
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <Square className="h-8 w-8 text-black" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={retakePhoto}
                  className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
                <button
                  onClick={confirmCapture}
                  className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="h-8 w-8 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  )
}
