'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Camera, FileText, Loader2, CheckCircle, AlertCircle, X, Download, Copy, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import CameraGuideButton from '@/components/CameraGuideButton'
import { getApiEndpoint } from '@/lib/apiUrl'

interface AIAnalysis {
  amount: number
  vendor: string
  date: string
  description: string
  project_name?: string
  project_code?: string
  project_mention: boolean
  category: string
  confidence: number
}

interface MatchedProject {
  id: string
  name: string
  project_code: string
}

export default function AIImageReaderPage() {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [matchedProject, setMatchedProject] = useState<MatchedProject | null>(null)
  const [availableProjects, setAvailableProjects] = useState<MatchedProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [editing, setEditing] = useState(false)
  const [editedData, setEditedData] = useState<AIAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLVideoElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [user, setUser] = useState<{ full_name?: string; role?: string; email?: string; id?: string } | null>(null)

  // Load user and projects on mount
  useEffect(() => {
    fetchUser()
    loadAvailableProjects()
  }, [])

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: user.user_metadata?.role || 'user',
          email: user.email || '',
          id: user.id
        })
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const loadAvailableProjects = async () => {
    try {
      const response = await fetch(getApiEndpoint('/api/projects')
      const projects = await response.json()
      setAvailableProjects(projects.data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setAnalyzing(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Preview image
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
      
      // Upload and analyze
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/ai-simple', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        setAnalysis(result.analysis)
        setMatchedProject(result.matchedProject)
        setEditedData(result.analysis)
        setSuccess('AI đã phân tích thành công!')
      } else {
        setError('Lỗi phân tích hóa đơn: ' + result.error)
      }
    } catch (error) {
      console.error('Error analyzing receipt:', error)
      setError('Có lỗi xảy ra khi phân tích hóa đơn')
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera
      })
      setCameraStream(stream)
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Không thể truy cập camera')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const capturePhoto = () => {
    if (cameraRef.current) {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      canvas.width = cameraRef.current.videoWidth
      canvas.height = cameraRef.current.videoHeight
      
      context?.drawImage(cameraRef.current, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'captured-receipt.jpg', { type: 'image/jpeg' })
          handleFileUpload(file)
          stopCamera()
        }
      }, 'image/jpeg', 0.8)
    }
  }

  const handleEditField = (field: keyof AIAnalysis, value: any) => {
    if (editedData) {
      setEditedData({
        ...editedData,
        [field]: value
      })
    }
  }

  const handleSaveExpense = async () => {
    if (!editedData) return
    
    try {
      const expenseData = {
        amount: editedData.amount,
        description: editedData.description,
        category: editedData.category,
        expense_date: editedData.date,
        vendor: editedData.vendor,
        project_id: matchedProject?.id || selectedProjectId || null,
        status: 'pending',
        ai_generated: true,
        ai_confidence: editedData.confidence
      }
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess('Chi phí đã được lưu thành công!')
        setTimeout(() => {
          resetForm()
        }, 2000)
      } else {
        setError('Lỗi lưu chi phí: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      setError('Có lỗi xảy ra khi lưu chi phí')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Đã sao chép vào clipboard!')
    setTimeout(() => setSuccess(null), 2000)
  }

  const downloadAnalysis = () => {
    if (!analysis) return
    
    const dataStr = JSON.stringify(analysis, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-analysis-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    setPreview(null)
    setAnalysis(null)
    setMatchedProject(null)
    setEditedData(null)
    setSelectedProjectId('')
    setEditing(false)
    setError(null)
    setSuccess(null)
    stopCamera()
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Image Reader</h1>
              <p className="text-sm text-gray-600">Upload hình ảnh và xem kết quả AI đọc dữ liệu</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CameraGuideButton size="md" variant="secondary" />
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Hình Ảnh</h2>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {preview ? (
                <div className="space-y-4">
                  <img src={preview} alt="Receipt preview" className="max-w-full h-64 object-contain mx-auto rounded-lg" />
                  {analyzing && (
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>AI đang phân tích hình ảnh...</span>
                    </div>
                  )}
                </div>
              ) : cameraStream ? (
                <div className="space-y-4">
                  <video
                    ref={cameraRef}
                    autoPlay
                    playsInline
                    className="max-w-full h-64 mx-auto rounded-lg"
                  />
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={capturePhoto}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Chụp ảnh
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4" />
                      Tải lên từ thiết bị
                    </button>
                    
                    <button
                      onClick={startCamera}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Camera className="h-4 w-4" />
                      Chụp ảnh
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Hỗ trợ: JPG, PNG, PDF. AI sẽ tự động đọc và trích xuất thông tin
                  </p>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* AI Analysis Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Kết Quả AI Analysis</h2>
              {analysis && (
                <div className="flex gap-2">
                  <button
                    onClick={downloadAnalysis}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Tải xuống kết quả"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(analysis, null, 2))}
                    className="p-2 text-gray-400 hover:text-green-600"
                    title="Sao chép kết quả"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            {analysis ? (
              <div className="space-y-4">
                {/* Confidence Score */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Độ tin cậy AI</span>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      analysis.confidence >= 80 ? 'bg-green-100 text-green-800' :
                      analysis.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {analysis.confidence}%
                    </span>
                  </div>
                </div>

                {/* Project Matching */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {matchedProject ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-700 font-medium">Đã tìm thấy dự án</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <span className="text-yellow-700 font-medium">Chưa tìm thấy dự án</span>
                      </>
                    )}
                  </div>
                  
                  {matchedProject ? (
                    <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        <strong>Dự án:</strong> {matchedProject.name} ({matchedProject.project_code})
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 mb-2">
                        Không tìm thấy dự án phù hợp. Bạn có thể chọn thủ công:
                      </p>
                      <select 
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Chọn dự án</option>
                        {availableProjects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name} ({project.project_code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Analysis Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                      <input
                        type="number"
                        value={editing ? editedData?.amount : analysis.amount}
                        onChange={(e) => editing && handleEditField('amount', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        readOnly={!editing}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                      <input
                        type="text"
                        value={editing ? editedData?.vendor : analysis.vendor}
                        onChange={(e) => editing && handleEditField('vendor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        readOnly={!editing}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                      value={editing ? editedData?.description : analysis.description}
                      onChange={(e) => editing && handleEditField('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      readOnly={!editing}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                      <input
                        type="date"
                        value={editing ? editedData?.date : analysis.date}
                        onChange={(e) => editing && handleEditField('date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        readOnly={!editing}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                      <select
                        value={editing ? editedData?.category : analysis.category}
                        onChange={(e) => editing && handleEditField('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!editing}
                      >
                        <option value="travel">Đi lại</option>
                        <option value="meals">Ăn uống</option>
                        <option value="accommodation">Lưu trú</option>
                        <option value="transportation">Vận chuyển</option>
                        <option value="supplies">Vật tư</option>
                        <option value="equipment">Thiết bị</option>
                        <option value="training">Đào tạo</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setEditing(!editing)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    {editing ? 'Xem' : 'Chỉnh sửa'}
                  </button>
                  <button
                    onClick={handleSaveExpense}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Lưu chi phí
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có kết quả phân tích</h3>
                <p className="text-gray-500">Upload hình ảnh để xem kết quả AI đọc dữ liệu</p>
              </div>
            )}
          </div>
        </div>

        {/* Raw JSON Output */}
        {analysis && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw JSON Output</h3>
            <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
