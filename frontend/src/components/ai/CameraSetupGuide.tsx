'use client'

import React, { useState } from 'react'
import { Camera, Monitor, Smartphone, Tablet, HelpCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface CameraSetupGuideProps {
  onClose: () => void
}

export default function CameraSetupGuide({ onClose }: CameraSetupGuideProps) {
  const [activeTab, setActiveTab] = useState('browsers')

  const supportedBrowsers = [
    { name: 'Chrome', icon: '🟢', status: 'Tốt nhất', description: 'Hỗ trợ đầy đủ tất cả tính năng' },
    { name: 'Firefox', icon: '🦊', status: 'Tốt', description: 'Hỗ trợ đầy đủ camera và AI' },
    { name: 'Safari', icon: '🧭', status: 'Tốt', description: 'Hoạt động tốt trên Mac và iOS' },
    { name: 'Edge', icon: '🌐', status: 'Tốt', description: 'Hỗ trợ đầy đủ tính năng' },
    { name: 'Opera', icon: '🎭', status: 'Khá', description: 'Hỗ trợ cơ bản' }
  ]

  const unsupportedBrowsers = [
    { name: 'Internet Explorer', icon: '❌', status: 'Không hỗ trợ', description: 'Quá cũ, không hỗ trợ camera API' }
  ]

  const platformSteps = {
    windows: [
      { step: 1, title: 'Kiểm tra quyền camera', description: 'Settings → Privacy → Camera → Allow apps to access camera' },
      { step: 2, title: 'Cài đặt trình duyệt', description: 'Chrome: Settings → Site Settings → Camera → Allow' },
      { step: 3, title: 'Refresh trang web', description: 'F5 hoặc Ctrl+R để tải lại trang' }
    ],
    mac: [
      { step: 1, title: 'Kiểm tra quyền hệ thống', description: 'System Preferences → Security & Privacy → Camera' },
      { step: 2, title: 'Cài đặt Safari', description: 'Safari → Preferences → Websites → Camera → Allow' },
      { step: 3, title: 'Restart trình duyệt', description: 'Đóng và mở lại trình duyệt' }
    ],
    android: [
      { step: 1, title: 'Kiểm tra quyền app', description: 'Settings → Apps → Chrome → Permissions → Camera' },
      { step: 2, title: 'Cài đặt trình duyệt', description: 'Chrome → Settings → Site Settings → Camera → Allow' },
      { step: 3, title: 'Refresh trang web', description: 'Kéo xuống để refresh hoặc F5' }
    ],
    ios: [
      { step: 1, title: 'Kiểm tra quyền hệ thống', description: 'Settings → Privacy & Security → Camera' },
      { step: 2, title: 'Cài đặt Safari', description: 'Settings → Safari → Camera → Allow' },
      { step: 3, title: 'Restart Safari', description: 'Đóng và mở lại Safari' }
    ]
  }

  const commonIssues = [
    {
      issue: 'Camera not found',
      solution: 'Kiểm tra camera có hoạt động không, thử ứng dụng khác',
      icon: <XCircle className="h-5 w-5 text-red-500" />
    },
    {
      issue: 'Permission denied',
      solution: 'Click vào 🔒 icon → Camera → Allow → Refresh trang',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
    },
    {
      issue: 'Camera already in use',
      solution: 'Đóng tất cả ứng dụng khác sử dụng camera',
      icon: <HelpCircle className="h-5 w-5 text-blue-500" />
    },
    {
      issue: 'HTTPS required',
      solution: 'Đảm bảo trang web sử dụng HTTPS (https://...)',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Hướng Dẫn Kích Hoạt Camera</h2>
                <p className="text-blue-100">Cài đặt camera cho AI phân tích đơn hàng</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'browsers', label: 'Trình Duyệt', icon: <Monitor className="h-4 w-4" /> },
              { id: 'platforms', label: 'Nền Tảng', icon: <Smartphone className="h-4 w-4" /> },
              { id: 'issues', label: 'Xử Lý Lỗi', icon: <HelpCircle className="h-4 w-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Browsers Tab */}
          {activeTab === 'browsers' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Trình Duyệt Được Hỗ Trợ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportedBrowsers.map((browser, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{browser.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-800">{browser.name}</h4>
                          <p className="text-sm text-green-600 font-medium">{browser.status}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{browser.description}</p>
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
                <div key={platform} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize flex items-center gap-2">
                    {platform === 'windows' && <Monitor className="h-5 w-5" />}
                    {platform === 'mac' && <Monitor className="h-5 w-5" />}
                    {platform === 'android' && <Smartphone className="h-5 w-5" />}
                    {platform === 'ios' && <Tablet className="h-5 w-5" />}
                    {platform === 'windows' ? 'Windows' : platform === 'mac' ? 'macOS' : platform === 'android' ? 'Android' : 'iOS'}
                  </h3>
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {step.step}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{step.title}</h4>
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
                      <h4 className="font-semibold text-gray-800 mb-1">{issue.issue}</h4>
                      <p className="text-sm text-gray-600">{issue.solution}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Mẹo Kiểm Tra Camera</h4>
                <p className="text-sm text-blue-700">
                  Mở Console (F12) và chạy: <code className="bg-blue-100 px-1 rounded">navigator.mediaDevices.getUserMedia({'{'}video: true{'}'})</code>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Cần hỗ trợ? Liên hệ: support@company.com
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
