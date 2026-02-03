'use client'

import React, { useState, useEffect } from 'react'
import { Camera, Monitor, Smartphone, Tablet, HelpCircle, CheckCircle, XCircle, AlertTriangle, X, Settings, Shield, Wifi } from 'lucide-react'

interface CameraGuidePopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function CameraGuidePopup({ isOpen, onClose }: CameraGuidePopupProps) {
  const [activeTab, setActiveTab] = useState('browsers')
  const [userAgent, setUserAgent] = useState('')
  const [cameraSupport, setCameraSupport] = useState<boolean | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      // Detect user agent
      setUserAgent(navigator.userAgent)
      
      // Check camera support
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setCameraSupport(true)
      } else {
        setCameraSupport(false)
      }

      // Check camera permission
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'camera' as PermissionName }).then((result) => {
          setPermissionStatus(result.state)
        }).catch(() => {
          setPermissionStatus('unknown')
        })
      }
    }
  }, [isOpen])

  const supportedBrowsers = [
    { name: 'Chrome', icon: '🟢', status: 'Tốt nhất', description: 'Hỗ trợ đầy đủ tất cả tính năng', version: '88+' },
    { name: 'Firefox', icon: '🦊', status: 'Tốt', description: 'Hỗ trợ đầy đủ camera và AI', version: '85+' },
    { name: 'Safari', icon: '🧭', status: 'Tốt', description: 'Hoạt động tốt trên Mac và iOS', version: '14+' },
    { name: 'Edge', icon: '🌐', status: 'Tốt', description: 'Hỗ trợ đầy đủ tính năng', version: '88+' },
    { name: 'Opera', icon: '🎭', status: 'Khá', description: 'Hỗ trợ cơ bản', version: '74+' }
  ]

  const unsupportedBrowsers = [
    { name: 'Internet Explorer', icon: '❌', status: 'Không hỗ trợ', description: 'Quá cũ, không hỗ trợ camera API' }
  ]

  const platformSteps = {
    windows: [
      { step: 1, title: 'Kiểm tra quyền camera', description: 'Settings → Privacy → Camera → Allow apps to access camera', icon: <Shield className="h-5 w-5" /> },
      { step: 2, title: 'Cài đặt trình duyệt', description: 'Chrome: Settings → Site Settings → Camera → Allow', icon: <Settings className="h-5 w-5" /> },
      { step: 3, title: 'Refresh trang web', description: 'F5 hoặc Ctrl+R để tải lại trang', icon: <Wifi className="h-5 w-5" /> }
    ],
    mac: [
      { step: 1, title: 'Kiểm tra quyền hệ thống', description: 'System Preferences → Security & Privacy → Camera', icon: <Shield className="h-5 w-5" /> },
      { step: 2, title: 'Cài đặt Safari', description: 'Safari → Preferences → Websites → Camera → Allow', icon: <Settings className="h-5 w-5" /> },
      { step: 3, title: 'Restart trình duyệt', description: 'Đóng và mở lại trình duyệt', icon: <Wifi className="h-5 w-5" /> }
    ],
    android: [
      { step: 1, title: 'Kiểm tra quyền app', description: 'Settings → Apps → Chrome → Permissions → Camera', icon: <Shield className="h-5 w-5" /> },
      { step: 2, title: 'Cài đặt trình duyệt', description: 'Chrome → Settings → Site Settings → Camera → Allow', icon: <Settings className="h-5 w-5" /> },
      { step: 3, title: 'Refresh trang web', description: 'Kéo xuống để refresh hoặc F5', icon: <Wifi className="h-5 w-5" /> }
    ],
    ios: [
      { step: 1, title: 'Kiểm tra quyền hệ thống', description: 'Settings → Privacy & Security → Camera', icon: <Shield className="h-5 w-5" /> },
      { step: 2, title: 'Cài đặt Safari', description: 'Settings → Safari → Camera → Allow', icon: <Settings className="h-5 w-5" /> },
      { step: 3, title: 'Restart Safari', description: 'Đóng và mở lại Safari', icon: <Wifi className="h-5 w-5" /> }
    ]
  }

  const commonIssues = [
    {
      issue: 'Camera not found',
      solution: 'Kiểm tra camera có hoạt động không, thử ứng dụng khác',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      severity: 'high'
    },
    {
      issue: 'Permission denied',
      solution: 'Click vào 🔒 icon → Camera → Allow → Refresh trang',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      severity: 'medium'
    },
    {
      issue: 'Camera already in use',
      solution: 'Đóng tất cả ứng dụng khác sử dụng camera',
      icon: <HelpCircle className="h-5 w-5 text-blue-500" />,
      severity: 'medium'
    },
    {
      issue: 'HTTPS required',
      solution: 'Đảm bảo trang web sử dụng HTTPS (https://...)',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
      severity: 'high'
    }
  ]

  const getCurrentPlatform = () => {
    if (userAgent.includes('Windows')) return 'windows'
    if (userAgent.includes('Mac')) return 'mac'
    if (userAgent.includes('Android')) return 'android'
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'ios'
    return 'unknown'
  }

  const getCurrentBrowser = () => {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    if (userAgent.includes('Opera')) return 'Opera'
    return 'Unknown'
  }

  const testCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      alert('✅ Camera hoạt động bình thường!')
    } catch (error) {
      alert('❌ Camera không hoạt động hoặc bị từ chối quyền truy cập')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop - transparent */}
      <div className="flex-1"></div>
      
      {/* Popup - positioned on the right, similar to employee form */}
      <div className="w-[500px] h-full bg-white shadow-xl border-l border-gray-200 overflow-hidden">
        {/* Header - similar to employee form */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Hướng Dẫn Camera</h2>
                <p className="text-sm text-gray-600">Setup camera cho AI phân tích đơn hàng</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* System Status - similar to employee form sections */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            Thông Tin Hệ Thống
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-bold text-gray-900 text-sm mb-2">Nền Tảng</h4>
              <p className="text-sm text-gray-700 capitalize font-semibold">{getCurrentPlatform()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-bold text-gray-900 text-sm mb-2">Trình Duyệt</h4>
              <p className="text-sm text-gray-700 font-semibold">{getCurrentBrowser()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-bold text-gray-900 text-sm mb-2">Hỗ Trợ Camera</h4>
              <div className="flex items-center gap-2">
                {cameraSupport === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                {cameraSupport === false && <XCircle className="h-4 w-4 text-red-500" />}
                {cameraSupport === null && <HelpCircle className="h-4 w-4 text-gray-400" />}
                <span className="text-sm text-gray-700 font-semibold">
                  {cameraSupport === true ? 'Được hỗ trợ' : cameraSupport === false ? 'Không hỗ trợ' : 'Đang kiểm tra...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - similar to employee form sections */}
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap">
            {[
              { id: 'browsers', label: 'Trình Duyệt', icon: <Monitor className="h-4 w-4" /> },
              { id: 'platforms', label: 'Nền Tảng', icon: <Smartphone className="h-4 w-4" /> },
              { id: 'issues', label: 'Xử Lý Lỗi', icon: <HelpCircle className="h-4 w-4" /> },
              { id: 'test', label: 'Kiểm Tra', icon: <Settings className="h-4 w-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-bold transition-colors text-sm ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content - similar to employee form with enhanced scrollbar */}
        <div className="p-6 overflow-y-auto flex-1 popup-scroll relative h-[calc(100vh-200px)]" 
             onWheel={(e) => {
               const element = e.currentTarget;
               const delta = e.deltaY;
               const scrollAmount = delta * 0.5; // Slower scroll for better control
               element.scrollTop += scrollAmount;
               e.preventDefault();
             }}
             style={{ scrollbarWidth: 'thin' }}>
          {/* Scroll indicators */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
          
          {/* Scrollbar indicator */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-16 bg-blue-200 rounded-full opacity-50 pointer-events-none z-20"></div>
          
          {/* Content with padding for scroll indicators */}
          <div className="pt-2 pb-2">
          {/* Browsers Tab */}
          {activeTab === 'browsers' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Trình Duyệt Được Hỗ Trợ
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {supportedBrowsers.map((browser, index) => (
                    <div key={index} className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{browser.icon}</span>
                        <div>
                          <h4 className="font-bold text-gray-900">{browser.name}</h4>
                          <p className="text-sm text-gray-600 font-semibold">v{browser.version}</p>
                        </div>
                      </div>
                      <p className="text-sm text-green-600 font-bold mb-1">{browser.status}</p>
                      <p className="text-sm text-gray-700 font-semibold">{browser.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Trình Duyệt Không Được Hỗ Trợ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unsupportedBrowsers.map((browser, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{browser.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-800">{browser.name}</h4>
                          <p className="text-sm text-red-600 font-medium">{browser.status}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{browser.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Platforms Tab */}
          {activeTab === 'platforms' && (
            <div className="space-y-6">
              {Object.entries(platformSteps).map(([platform, steps]) => (
                <div key={platform} className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize flex items-center gap-2">
                    {platform === 'windows' && <Monitor className="h-5 w-5" />}
                    {platform === 'mac' && <Monitor className="h-5 w-5" />}
                    {platform === 'android' && <Smartphone className="h-5 w-5" />}
                    {platform === 'ios' && <Tablet className="h-5 w-5" />}
                    {platform === 'windows' ? 'Windows' : platform === 'mac' ? 'macOS' : platform === 'android' ? 'Android' : 'iOS'}
                  </h3>
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {step.icon}
                            <h4 className="font-semibold text-gray-800">{step.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Issues Tab */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Lỗi Thường Gặp & Cách Khắc Phục
              </h3>
              {commonIssues.map((issue, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {issue.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{issue.issue}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {issue.severity === 'high' ? 'Nghiêm trọng' : issue.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{issue.solution}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Mẹo Kiểm Tra Camera</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Mở Console (F12) và chạy lệnh này để kiểm tra:
                </p>
                <code className="bg-blue-100 px-2 py-1 rounded text-sm block">
                  navigator.mediaDevices.getUserMedia({'{'}video: true{'}'})
                </code>
              </div>
            </div>
          )}

          {/* Test Tab */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Kiểm Tra Camera
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-700 mb-4">Thông Tin Hiện Tại</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Hỗ trợ Camera API:</p>
                    <div className="flex items-center gap-2">
                      {cameraSupport === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {cameraSupport === false && <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="font-semibold">
                        {cameraSupport === true ? 'Có' : cameraSupport === false ? 'Không' : 'Đang kiểm tra...'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quyền truy cập:</p>
                    <span className="font-semibold capitalize">{permissionStatus || 'Chưa xác định'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-blue-800 mb-4">Test Camera</h4>
                <p className="text-sm text-blue-700 mb-4">
                  Click nút bên dưới để kiểm tra camera có hoạt động không:
                </p>
                <button
                  onClick={testCamera}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Test Camera
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer - similar to employee form */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 font-semibold">
              Cần hỗ trợ? support@company.com
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
