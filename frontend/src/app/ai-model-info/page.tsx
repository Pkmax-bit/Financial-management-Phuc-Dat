'use client'

import { useState, useEffect } from 'react'
import { Brain, Eye, Zap, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { getApiEndpoint } from '@/lib/apiUrl'

interface ModelInfo {
  name: string
  type: string
  capabilities: string[]
  cost: string
  description: string
  icon: any
}

export default function AIModelInfoPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [apiStatus, setApiStatus] = useState<string>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadModelInfo()
    checkAPIStatus()
  }, [])

  const loadModelInfo = () => {
    const info: ModelInfo = {
      name: "GPT-4o (GPT-4 Omni)",
      type: "Multimodal AI Model",
      capabilities: [
        "Phân tích hình ảnh (Image Analysis)",
        "OCR - Đọc văn bản từ hình ảnh (Optical Character Recognition)",
        "Trích xuất thông tin từ hóa đơn (Receipt Information Extraction)",
        "Nhận diện ngôn ngữ tiếng Việt",
        "Phân tích cấu trúc dữ liệu phức tạp",
        "Tự động phân loại chi phí (Expense Categorization)"
      ],
      cost: "$0.005 per 1K tokens (Input) + $0.015 per 1K tokens (Output)",
      description: "GPT-4o (GPT-4 Omni) - Model AI mới nhất và mạnh nhất của OpenAI, có khả năng xử lý cả văn bản và hình ảnh với tốc độ nhanh hơn và chi phí thấp hơn. Được sử dụng để phân tích hóa đơn, trích xuất thông tin tài chính và tự động hóa quy trình quản lý chi phí.",
      icon: Eye
    }
    setModelInfo(info)
  }

  const checkAPIStatus = async () => {
    try {
      setApiStatus('checking')
      const response = await fetch(getApiEndpoint('/api/ai-simple'))
      const data = await response.json()
      
      if (data.success) {
        setApiStatus('connected')
      } else {
        setApiStatus('error')
        setError(data.error || 'Unknown error')
      }
    } catch (err) {
      setApiStatus('error')
      setError('Failed to connect to AI API')
    }
  }

  const testModelCapabilities = async () => {
    try {
      // Tạo một test image đơn giản (base64 encoded 1x1 pixel)
      const testImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      
      const response = await fetch('/api/ai-simple', {
        method: 'POST',
        body: new FormData().append('image', new Blob([Buffer.from(testImage, 'base64')], { type: 'image/png' }))
      })
      
      const result = await response.json()
      return result
    } catch (err) {
      console.error('Test failed:', err)
      return null
    }
  }

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected':
        return 'Kết nối thành công'
      case 'error':
        return 'Lỗi kết nối'
      default:
        return 'Đang kiểm tra...'
    }
  }

  if (!modelInfo) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Đang tải thông tin model AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Model Information</h1>
              <p className="text-gray-600">Thông tin chi tiết về model AI đang sử dụng trong hệ thống</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <modelInfo.icon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Model Details</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Model Name</label>
                <p className="text-lg font-semibold text-gray-900">{modelInfo.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Model Type</label>
                <p className="text-gray-900">{modelInfo.type}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-700">{modelInfo.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Cost</label>
                <p className="text-gray-900 font-mono text-sm">{modelInfo.cost}</p>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">API Status</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <span className="font-medium">{getStatusText()}</span>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              
              <button
                onClick={checkAPIStatus}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kiểm tra lại API
              </button>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Capabilities</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelInfo.capabilities.map((capability, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{capability}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Implementation</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">API Endpoint</h3>
              <code className="text-sm text-gray-700">/api/ai-simple</code>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Request Format</h3>
              <pre className="text-xs text-gray-700 overflow-x-auto">
{`POST /api/ai-simple
Content-Type: multipart/form-data

FormData:
- image: File (image/jpeg, image/png, image/webp)`}
              </pre>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Response Format</h3>
              <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "success": true,
  "analysis": {
    "amount": 35000,
    "vendor": "TAXI ABC COMPANY",
    "date": "2024-01-15",
    "description": "Chi phí đi lại taxi"
  }
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Cách sử dụng</h2>
          <div className="space-y-3 text-blue-800">
            <p><strong>1. Upload hình ảnh:</strong> Chọn file hình ảnh từ thiết bị hoặc chụp ảnh trực tiếp</p>
            <p><strong>2. AI phân tích:</strong> Model sẽ tự động đọc và trích xuất thông tin từ hóa đơn</p>
            <p><strong>3. Kết quả:</strong> Hiển thị số tiền, nhà cung cấp, ngày, mô tả chi phí</p>
            <p><strong>4. Lưu chi phí:</strong> Tự động lưu vào hệ thống quản lý chi phí</p>
          </div>
        </div>
      </div>
    </div>
  )
}
