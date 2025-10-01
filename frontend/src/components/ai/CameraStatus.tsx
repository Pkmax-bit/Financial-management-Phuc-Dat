'use client'

import React, { useState, useEffect } from 'react'
import { Camera, CheckCircle, XCircle, AlertTriangle, Wifi, Shield, Settings } from 'lucide-react'

interface CameraStatusProps {
  onStatusChange?: (status: 'working' | 'error' | 'permission' | 'not-supported') => void
}

export default function CameraStatus({ onStatusChange }: CameraStatusProps) {
  const [cameraSupport, setCameraSupport] = useState<boolean | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<string>('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    checkCameraSupport()
    checkPermissionStatus()
  }, [])

  const checkCameraSupport = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setCameraSupport(true)
    } else {
      setCameraSupport(false)
    }
  }

  const checkPermissionStatus = async () => {
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
        setPermissionStatus(result.state)
      } catch (error) {
        setPermissionStatus('unknown')
      }
    } else {
      setPermissionStatus('unknown')
    }
  }

  const testCamera = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setTestResult('success')
      onStatusChange?.('working')
    } catch (error: any) {
      setTestResult('error')
      
      if (error.name === 'NotAllowedError') {
        onStatusChange?.('permission')
      } else if (error.name === 'NotFoundError') {
        onStatusChange?.('error')
      } else {
        onStatusChange?.('error')
      }
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusIcon = () => {
    if (cameraSupport === false) {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
    if (permissionStatus === 'denied') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
    if (testResult === 'success') {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    if (testResult === 'error') {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
    return <Camera className="h-5 w-5 text-gray-400" />
  }

  const getStatusText = () => {
    if (cameraSupport === false) {
      return 'Không hỗ trợ camera'
    }
    if (permissionStatus === 'denied') {
      return 'Quyền truy cập bị từ chối'
    }
    if (testResult === 'success') {
      return 'Camera hoạt động bình thường'
    }
    if (testResult === 'error') {
      return 'Camera không hoạt động'
    }
    return 'Chưa kiểm tra'
  }

  const getStatusColor = () => {
    if (cameraSupport === false || testResult === 'error') {
      return 'text-red-600'
    }
    if (permissionStatus === 'denied') {
      return 'text-yellow-600'
    }
    if (testResult === 'success') {
      return 'text-green-600'
    }
    return 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Trạng Thái Camera
        </h3>
        <button
          onClick={testCamera}
          disabled={isTesting || cameraSupport === false}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isTesting ? 'Đang kiểm tra...' : 'Test Camera'}
        </button>
      </div>

      <div className="space-y-3">
        {/* Camera Support */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Hỗ trợ API:</span>
          </div>
          <div className="flex items-center gap-2">
            {cameraSupport === true && <CheckCircle className="h-4 w-4 text-green-500" />}
            {cameraSupport === false && <XCircle className="h-4 w-4 text-red-500" />}
            {cameraSupport === null && <AlertTriangle className="h-4 w-4 text-gray-400" />}
            <span className="text-sm font-medium">
              {cameraSupport === true ? 'Có' : cameraSupport === false ? 'Không' : 'Đang kiểm tra...'}
            </span>
          </div>
        </div>

        {/* Permission Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Quyền truy cập:</span>
          </div>
          <div className="flex items-center gap-2">
            {permissionStatus === 'granted' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {permissionStatus === 'denied' && <XCircle className="h-4 w-4 text-red-500" />}
            {permissionStatus === 'prompt' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
            {permissionStatus === 'unknown' && <AlertTriangle className="h-4 w-4 text-gray-400" />}
            <span className="text-sm font-medium capitalize">
              {permissionStatus || 'Chưa xác định'}
            </span>
          </div>
        </div>

        {/* Test Result */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Kết quả test:</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {cameraSupport === false && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            ❌ Trình duyệt không hỗ trợ camera API. Vui lòng sử dụng Chrome, Firefox, Safari hoặc Edge.
          </p>
        </div>
      )}

      {permissionStatus === 'denied' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            ⚠️ Quyền truy cập camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.
          </p>
        </div>
      )}

      {testResult === 'error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            ❌ Camera không hoạt động. Kiểm tra camera có bị ứng dụng khác sử dụng không.
          </p>
        </div>
      )}

      {testResult === 'success' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Camera hoạt động bình thường! Bạn có thể sử dụng tính năng AI Analysis.
          </p>
        </div>
      )}
    </div>
  )
}
