'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Camera, FileText, Search, Save, Loader2, AlertCircle, X, HelpCircle } from 'lucide-react'
import CameraSetupGuide from './CameraSetupGuide'
import CameraStatus from './CameraStatus'
import CameraGuidePopup from './CameraGuidePopup'
import MobileCamera from './MobileCamera'

interface ExpenseItem {
  id: string
  amount: number
  description: string
  vendor: string
  category: string
  date: string
  confidence: number
}

interface Project {
  id: string
  name: string
  project_code: string
  status: string
  priority: string
  budget: number
  start_date: string
  end_date: string
  customer_name?: string
  customer_id?: string
  manager?: string
  billing_type?: string
  hourly_rate?: number
  progress?: number
  actual_cost?: number
}

export default function AIImageAnalysis() {
  // State for image handling
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageSource, setImageSource] = useState<'file' | 'camera' | null>(null)
  
  // State for camera
  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<'front' | 'rear'>('rear')
  const [cameraLoading, setCameraLoading] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<'default' | 'a4'>('default')
  const [flipImage, setFlipImage] = useState(false)
  const [flipCapturedImage, setFlipCapturedImage] = useState(false)
  const [mirrorImage, setMirrorImage] = useState(false)
  const [mirrorCapturedImage, setMirrorCapturedImage] = useState(false)
  const [showCameraGuide, setShowCameraGuide] = useState(false)
  const [showCameraGuidePopup, setShowCameraGuidePopup] = useState(false)
  const [showMobileCamera, setShowMobileCamera] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Callback ref to ensure video element is set
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      videoRef.current = node
      console.log('Video ref set:', node)
    }
  }, [])
  
  // State for expenses
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // State for projects
  const [projects, setProjects] = useState<Project[]>([])
  const [matchedProject, setMatchedProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load projects on mount
  useEffect(() => {
    loadAllProjects()
    
    // Detect mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            window.innerWidth <= 768
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Ensure video element is ready when showCamera changes
  useEffect(() => {
    if (showCamera && videoRef.current) {
      console.log('Video element is ready:', videoRef.current)
    }
  }, [showCamera])

  const loadAllProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        // API returns { success: true, projects: [...], total: number }
        const projectsArray = data.projects || []
        setProjects(projectsArray)
        console.log('Loaded all projects:', projectsArray.length)
      } else {
        console.error('Failed to load projects:', response.status)
        setProjects([])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      setProjects([])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      setImageSource('file')
      handleImageAnalysis(result)
    }
    reader.readAsDataURL(file)
  }

  const handleImageAnalysis = async (imageBase64: string) => {
    setAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageBase64 }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('AI Analysis Result:', result)

      setAnalysis(result.analysis)

      // Process expenses from AI analysis
      if (result.analysis?.expenses && Array.isArray(result.analysis.expenses)) {
        const newExpenseItems: ExpenseItem[] = result.analysis.expenses.map((expense: any, index: number) => ({
          id: `expense-${Date.now()}-${index}`,
          amount: expense.amount || 0,
          description: expense.description || '',
          vendor: result.analysis.vendor || '',
          category: expense.category || 'other',
          date: result.analysis.date || new Date().toISOString().split('T')[0],
          confidence: expense.confidence || 0
        }))
        
        setExpenseItems(newExpenseItems)
        
        // Auto-match projects for each expense
        autoMatchProjects(newExpenseItems)
      }

    } catch (error) {
      console.error('Error analyzing image:', error)
      setError(`Lỗi phân tích hóa đơn: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const autoMatchProjects = (expenses: ExpenseItem[]) => {
    console.log('Auto-matching projects for expenses...')
    
    expenses.forEach(expense => {
      const bestMatch = findBestMatchProject({ description: expense.description, vendor: expense.vendor })
      if (bestMatch) {
        console.log(`Auto-matched project: ${bestMatch.name} for expense: ${expense.description}`)
        setMatchedProject(bestMatch)
      }
    })
  }

  const findBestMatchProject = (analysis: any): Project | null => {
    if (!analysis.description || !projects || (projects || []).length === 0) return null

    const description = analysis.description.toLowerCase()
    const vendor = analysis.vendor?.toLowerCase() || ''
    let bestMatch: Project | null = null
    let bestScore = 0

    console.log('Finding best match for description:', description)
    console.log('Vendor:', vendor)
    console.log('Available projects:', (projects || []).length)

    for (const project of (projects || [])) {
      const projectName = project.name.toLowerCase()
      const projectCode = project.project_code.toLowerCase()

      let score = 0

      // Exact match in project name
      if (description.includes(projectName)) {
        score += 100
        console.log(`Exact name match: ${project.name} (+100)`)
      }

      // Partial match in project name
      const nameWords = projectName.split(' ')
      for (const word of nameWords) {
        if (word.length > 2 && description.includes(word)) {
          score += 50
          console.log(`Partial name match: ${word} in ${project.name} (+50)`)
        }
      }

      // Project code match
      if (description.includes(projectCode)) {
        score += 80
        console.log(`Code match: ${projectCode} (+80)`)
      }

      // Vendor name match with project name
      if (vendor && projectName.includes(vendor)) {
        score += 90
        console.log(`Vendor match: ${vendor} in ${project.name} (+90)`)
      }

      // Customer name matching (if project has customer info)
      if (project.customer_name && description.includes(project.customer_name.toLowerCase())) {
        score += 85
        console.log(`Customer match: ${project.customer_name} (+85)`)
      }

      // Keyword matching
      const keywords = ['mobile', 'app', 'website', 'web', 'crm', 'banking', 'iot', 'smart', 'abc', 'xyz', 'company', 'corp', 'ltd']
      for (const keyword of keywords) {
        if (description.includes(keyword) && projectName.includes(keyword)) {
          score += 30
          console.log(`Keyword match: ${keyword} in ${project.name} (+30)`)
        }
      }

      // AI detected project name match
      if (analysis.project_name && analysis.project_name.toLowerCase() === projectName) {
        score += 120
        console.log(`AI detected project match: ${analysis.project_name} (+120)`)
      }

      // AI detected project code match
      if (analysis.project_code && analysis.project_code.toLowerCase() === projectCode) {
        score += 100
        console.log(`AI detected code match: ${analysis.project_code} (+100)`)
      }

      console.log(`Project ${project.name} score: ${score}`)

      if (score > bestScore) {
        bestScore = score
        bestMatch = project
      }
    }

    console.log(`Best match: ${bestMatch?.name} with score: ${bestScore}`)
    return bestScore >= 30 ? bestMatch : null
  }

  const selectProject = (project: Project) => {
    setMatchedProject(project)
    console.log('Selected project:', project.name)
  }

  const updateExpenseItem = (id: string, field: keyof ExpenseItem, value: any) => {
    setExpenseItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const addExpenseItem = () => {
    const newItem: ExpenseItem = {
      id: `expense-${Date.now()}`,
      amount: 0,
      description: '',
      vendor: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      confidence: 0
    }
    setExpenseItems(prev => [...prev, newItem])
  }

  const removeExpenseItem = (id: string) => {
    setExpenseItems(prev => prev.filter(item => item.id !== id))
  }

  const saveExpense = async () => {
    if (expenseItems.length === 0) return

    setLoading(true)
    try {
      for (const item of expenseItems) {
        const expenseData = {
          amount: item.amount,
          description: item.description,
          vendor: item.vendor,
          category: item.category,
          expense_date: item.date,
          project_id: matchedProject?.id || null,
          status: 'pending'
        }
        
        console.log('Sending expense data:', expenseData)

        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expenseData),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error Response:', errorText)
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
        }
      }

      alert(`Đã lưu thành công ${expenseItems.length} chi phí!`)
      resetForm()
    } catch (error) {
      console.error('Error saving expenses:', error)
      setError(`Lỗi lưu chi phí: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async () => {
    console.log('startCamera called, cameraMode:', cameraMode)
    setCameraLoading(true)
    setError(null)
    
    try {
      const constraints = {
        video: { 
          facingMode: cameraMode === 'front' ? 'user' : 'environment',
          width: { ideal: aspectRatio === 'a4' ? 1080 : 1280 },
          height: { ideal: aspectRatio === 'a4' ? 1440 : 720 },
          aspectRatio: aspectRatio === 'a4' ? { ideal: 3/4 } : undefined
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Set showCamera first to render video element
      setShowCamera(true)
      
      // Wait for video element to be rendered
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Retry logic for videoRef
      let retries = 0
      const maxRetries = 10
      
      while (retries < maxRetries && !videoRef.current) {
        console.log(`Waiting for videoRef, attempt ${retries + 1}`)
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        console.log('Camera started successfully, video element found')
      } else {
        console.error('videoRef.current is still null after retries')
        setError('Không thể khởi tạo video element. Vui lòng thử lại.')
        setShowCamera(false)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
      setShowCamera(false)
    } finally {
      setCameraLoading(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      setShowCamera(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        if (aspectRatio === 'a4') {
          // Set canvas size to A4 ratio (3:4)
          const targetWidth = 1080
          const targetHeight = 1440
          canvas.width = targetWidth
          canvas.height = targetHeight
          
          // Calculate scaling to fit video into A4 ratio
          const videoAspect = video.videoWidth / video.videoHeight
          const targetAspect = targetWidth / targetHeight
          
          let sourceX = 0, sourceY = 0, sourceWidth = video.videoWidth, sourceHeight = video.videoHeight
          
          if (videoAspect > targetAspect) {
            // Video is wider than target, crop sides
            sourceWidth = video.videoHeight * targetAspect
            sourceX = (video.videoWidth - sourceWidth) / 2
          } else {
            // Video is taller than target, crop top/bottom
            sourceHeight = video.videoWidth / targetAspect
            sourceY = (video.videoHeight - sourceHeight) / 2
          }
          
          // Apply transforms for front camera and flip/mirror if enabled
          if (cameraMode === 'front') {
            context.scale(-1, 1) // Front camera mirror
            if (flipImage) {
              context.scale(1, -1) // Vertical flip
            }
            if (mirrorImage) {
              context.scale(-1, 1) // Additional horizontal mirror
            }
            context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, -targetWidth, flipImage ? -targetHeight : 0, targetWidth, targetHeight)
          } else {
            if (flipImage) {
              context.scale(1, -1) // Vertical flip
            }
            if (mirrorImage) {
              context.scale(-1, 1) // Horizontal mirror
            }
            context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, mirrorImage ? -targetWidth : 0, flipImage ? -targetHeight : 0, targetWidth, targetHeight)
          }
        } else {
          // Set canvas size to match video (default)
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          // Apply transforms for front camera and flip/mirror if enabled
          if (cameraMode === 'front') {
            context.scale(-1, 1) // Front camera mirror
            if (flipImage) {
              context.scale(1, -1) // Vertical flip
            }
            if (mirrorImage) {
              context.scale(-1, 1) // Additional horizontal mirror
            }
            context.drawImage(video, -canvas.width, flipImage ? -canvas.height : 0)
          } else {
            if (flipImage) {
              context.scale(1, -1) // Vertical flip
            }
            if (mirrorImage) {
              context.scale(-1, 1) // Horizontal mirror
            }
            context.drawImage(video, mirrorImage ? -canvas.width : 0, flipImage ? -canvas.height : 0)
          }
        }
        
        // Get image data with high quality
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        
        // Show captured image
        setPreview(imageData)
        setImageSource('camera')
        setShowCamera(false)
        stopCamera()
        
        // Start AI analysis
        handleImageAnalysis(imageData)
        
        console.log('Photo captured successfully, size:', imageData.length)
      }
    }
  }

  const resetForm = () => {
    setPreview(null)
    setAnalysis(null)
    setExpenseItems([])
    setMatchedProject(null)
    setError(null)
    setImageSource(null)
    setAspectRatio('default')
    setFlipImage(false)
    setFlipCapturedImage(false)
    setMirrorImage(false)
    setMirrorCapturedImage(false)
  }

  const handleMobileCameraCapture = (imageData: string) => {
    setPreview(imageData)
    setImageSource('camera')
    handleImageAnalysis(imageData)
  }

  const filteredProjects = (projects || []).filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.project_code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">AI Phân tích Hóa đơn</h2>
              <button
                onClick={() => setShowCameraGuidePopup(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-semibold"
              >
                <Camera className="h-4 w-4" />
                Hướng dẫn Camera
              </button>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-700 hover:text-red-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Phân tích Hóa đơn</h1>
                <p className="mt-1 text-sm text-black">
                  Upload hình ảnh để AI tự động phân tích và tìm dự án phù hợp
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      expenseItems.length > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-black">
                      {expenseItems.length > 0 ? `${expenseItems.length} chi phí` : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                  {matchedProject && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs text-black">Dự án: {matchedProject.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Side - Analysis Results */}
            <div className="space-y-6">
              {/* Camera Status */}
              <CameraStatus onStatusChange={(status) => {
                console.log('Camera status changed:', status)
              }} />

              {/* AI Analysis Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Kết quả Phân tích AI
                </h2>
                
                {!analysis ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Chưa có kết quả phân tích</p>
                      <p className="text-gray-400 text-sm">Upload hình ảnh để bắt đầu</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* AI Analysis Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-black mb-3">Thông tin AI đã phân tích:</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Tổng số tiền:</p>
                          <p className="font-bold text-black">VND {analysis.total_amount?.toLocaleString() || '0'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Nhà cung cấp:</p>
                          <p className="font-bold text-black">{analysis.vendor || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Ngày:</p>
                          <p className="font-bold text-black">{analysis.date || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Số chi phí:</p>
                          <p className="font-bold text-black">{expenseItems.length} chi phí</p>
                        </div>
                      </div>
                      
                      {/* Project Information */}
                      {(analysis.project_mention || analysis.project_name) && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-semibold text-green-800 mb-1">Dự án được phát hiện:</p>
                          <p className="font-bold text-black">{analysis.project_name || 'N/A'}</p>
                          {analysis.project_code && (
                            <p className="text-sm text-green-700 font-mono">{analysis.project_code}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Project Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Search className="h-5 w-5 text-green-600" />
                  Chọn Dự án
                </h2>
                
                {!analysis ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Chưa có dự án để chọn</p>
                      <p className="text-gray-400 text-sm">Phân tích hình ảnh trước</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Project Selection */}
                    <div>
                      <h3 className="font-semibold text-black mb-3">Dự án được gợi ý:</h3>
                      
                      {matchedProject ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-black">{matchedProject.name}</p>
                              <p className="text-sm text-blue-600 font-mono font-semibold">{matchedProject.project_code}</p>
                              <p className="text-xs text-gray-700 capitalize font-medium">{matchedProject.status} • {matchedProject.priority}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-black">VND {matchedProject.budget?.toLocaleString() || '0'}</p>
                              <p className="text-xs text-gray-700 font-medium">
                                {matchedProject.start_date ? new Date(matchedProject.start_date).toLocaleDateString('vi-VN') : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800 font-semibold">Không tìm thấy dự án phù hợp</p>
                          <p className="text-sm text-yellow-700">Bạn có thể chọn dự án khác hoặc để trống</p>
                        </div>
                      )}

                      {/* Project Search */}
                      <div className="mt-3">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Tìm kiếm dự án khác..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black font-semibold"
                            />
                          </div>
                          <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <Search className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Project List */}
                        <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                          {filteredProjects.map((project) => (
                            <button
                              key={project.id}
                              onClick={() => selectProject(project)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                matchedProject?.id === project.id 
                                  ? 'bg-green-100 border-green-300' 
                                  : 'hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-black">{project.name}</p>
                                  <p className="text-sm text-blue-600 font-mono font-medium">{project.project_code}</p>
                                  <p className="text-xs text-gray-700 capitalize font-medium">{project.status} • {project.priority}</p>
                                </div>
                                <div className="text-right ml-3">
                                  <p className="text-sm font-bold text-black">VND {project.budget?.toLocaleString() || '0'}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Upload Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Upload Hình ảnh
                </h2>
                {!preview ? (
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center bg-blue-50 hover:border-blue-400 transition-colors">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-8 w-8 text-blue-500" />
                      </div>
                      <p className="text-gray-700 mb-2 font-semibold">Kéo thả file vào đây</p>
                      <p className="text-gray-500 text-sm mb-4">hoặc click để chọn file</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        📁 Chọn File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className="hidden"
                      />
                    </div>

                    {/* Camera Options */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="text-center mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Camera className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Hoặc chụp ảnh trực tiếp</p>
                        
                        {/* Mobile Camera Button */}
                        {isMobile && (
                          <button
                            onClick={() => setShowMobileCamera(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold mt-2"
                          >
                            <Camera className="h-4 w-4" />
                            Camera Mobile
                          </button>
                        )}
                      </div>
                      
                      {/* Aspect Ratio Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tỉ lệ khung hình:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setAspectRatio('default')}
                            className={`px-3 py-2 rounded-lg border-2 font-semibold text-sm ${
                              aspectRatio === 'default'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            📱 Mặc định (16:9)
                          </button>
                          <button
                            onClick={() => setAspectRatio('a4')}
                            className={`px-3 py-2 rounded-lg border-2 font-semibold text-sm ${
                              aspectRatio === 'a4'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            📄 A4 (3:4)
                          </button>
                        </div>
                      </div>

                      {/* Flip Image Toggle */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Lật ngược hình ảnh:
                        </label>
                        <button
                          onClick={() => setFlipImage(!flipImage)}
                          className={`w-full px-3 py-2 rounded-lg border-2 font-semibold text-sm ${
                            flipImage
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {flipImage ? '🔄 Đã lật ngược' : '🔄 Lật ngược hình ảnh'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          console.log('Rear camera button clicked')
                          setCameraMode('rear')
                          startCamera()
                        }}
                        disabled={cameraLoading}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
                      >
                          {cameraLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                          📷 Camera Sau
                        </button>
                        
                        <button
                          onClick={() => {
                            console.log('Front camera button clicked')
                            setCameraMode('front')
                            startCamera()
                          }}
                          disabled={cameraLoading}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
                        >
                          {cameraLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                          🤳 Camera Trước
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="relative">
                         <img 
                           src={preview} 
                           alt="Preview" 
                           className={`w-full object-contain rounded-lg border border-gray-200 ${
                             aspectRatio === 'a4' ? 'h-64' : 'h-48'
                           }`}
                           style={{
                             aspectRatio: aspectRatio === 'a4' ? '3/4' : '16/9',
                             transform: (() => {
                               let transforms = []
                               if (flipCapturedImage) transforms.push('scaleY(-1)')
                               if (mirrorCapturedImage) transforms.push('scaleX(-1)')
                               return transforms.length > 0 ? transforms.join(' ') : 'none'
                             })()
                           }}
                          />
                        
                        {/* Image info overlay */}
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          📷 Đã chụp
                        </div>
                        
                        {/* Image control buttons */}
                        <div className="absolute bottom-2 right-2 flex gap-2">
                          <button
                            onClick={() => setFlipCapturedImage(!flipCapturedImage)}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                              flipCapturedImage
                                ? 'bg-green-600 text-white'
                                : 'bg-black bg-opacity-70 text-white hover:bg-opacity-80'
                            }`}
                          >
                            {flipCapturedImage ? '🔄 Đã lật' : '🔄 Lật'}
                          </button>
                          
                          <button
                            onClick={() => setMirrorCapturedImage(!mirrorCapturedImage)}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                              mirrorCapturedImage
                                ? 'bg-blue-600 text-white'
                                : 'bg-black bg-opacity-70 text-white hover:bg-opacity-80'
                            }`}
                          >
                            {mirrorCapturedImage ? '🪞 Đã gương' : '🪞 Gương'}
                          </button>
                        </div>
                        
                        {/* Image size info */}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          {preview ? `${Math.round(preview.length / 1024)}KB` : '0KB'}
                        </div>
                      </div>
                      
                      {/* Image details */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Nguồn:</span>
                            <span className="font-semibold text-black ml-1">
                              {imageSource === 'camera' ? '📷 Camera' : 
                               imageSource === 'file' ? '📁 File' : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Kích thước:</span>
                            <span className="font-semibold text-black ml-1">
                              {preview ? `${Math.round(preview.length / 1024)}KB` : '0KB'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Định dạng:</span>
                            <span className="font-semibold text-black ml-1">JPEG</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Trạng thái:</span>
                            <span className={`font-semibold ml-1 ${
                              analyzing ? 'text-blue-600' : 
                              analysis ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {analyzing ? 'Đang phân tích...' : 
                               analysis ? 'Đã phân tích' : 'Chờ phân tích'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={resetForm}
                        className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold text-sm"
                      >
                        🔄 Chọn ảnh khác
                      </button>
                      {analyzing && (
                        <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg border border-blue-200">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="font-semibold text-sm">🤖 AI đang phân tích...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Camera Interface */}
                {showCamera && (
                  <div className="mt-4 space-y-3">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={setVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full object-cover ${
                          aspectRatio === 'a4' ? 'h-80' : 'h-64'
                        }`}
                        style={{ 
                          transform: (() => {
                            let transforms = []
                            
                            // Front camera always has mirror effect
                            if (cameraMode === 'front') {
                              transforms.push('scaleX(-1)')
                            }
                            
                            // Apply vertical flip if enabled
                            if (flipImage) {
                              transforms.push('scaleY(-1)')
                            }
                            
                            // Apply horizontal mirror if enabled
                            if (mirrorImage) {
                              transforms.push('scaleX(-1)')
                            }
                            
                            return transforms.length > 0 ? transforms.join(' ') : 'none'
                          })(),
                          backgroundColor: '#000',
                          aspectRatio: aspectRatio === 'a4' ? '3/4' : '16/9'
                        }}
                        onLoadedMetadata={() => console.log('Video metadata loaded')}
                        onCanPlay={() => console.log('Video can play')}
                        onLoadStart={() => console.log('Video load started')}
                        onError={(e) => console.error('Video error:', e)}
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none"></div>
                      {cameraLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                          <div className="text-white text-center">
                            <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin" />
                            <p className="text-sm">Đang khởi động camera...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Camera overlay with capture guide */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            📷 Camera {cameraMode === 'front' ? 'Trước' : 'Sau'}
                          </div>
                          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            {cameraMode === 'front' ? '🤳' : '📷'}
                          </div>
                        </div>
                        
                        {/* Center focus guide */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div 
                            className="border-2 border-white border-dashed rounded-lg opacity-50"
                            style={{
                              width: aspectRatio === 'a4' ? '96px' : '128px',
                              height: aspectRatio === 'a4' ? '128px' : '72px',
                              aspectRatio: aspectRatio === 'a4' ? '3/4' : '16/9'
                            }}
                          ></div>
                        </div>
                        
                        {/* Bottom status */}
                        <div className="absolute bottom-4 left-4 right-4 text-center">
                          <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-xs">
                            Đặt hóa đơn trong khung để chụp
                          </div>
                        </div>
                        
                        {/* Flip and mirror toggles in camera */}
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={() => setFlipImage(!flipImage)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                              flipImage
                                ? 'bg-green-600 text-white'
                                : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                            }`}
                          >
                            {flipImage ? '🔄 Đã lật' : '🔄 Lật'}
                          </button>
                          
                          <button
                            onClick={() => setMirrorImage(!mirrorImage)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                              mirrorImage
                                ? 'bg-blue-600 text-white'
                                : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
                            }`}
                          >
                            {mirrorImage ? '🪞 Đã gương' : '🪞 Gương'}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={capturePhoto}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm shadow-lg"
                      >
                        <Camera className="h-5 w-5" />
                        📸 Chụp ảnh
                      </button>
                      
                      <button
                        onClick={() => setFlipImage(!flipImage)}
                        className={`px-4 py-3 rounded-lg font-semibold text-sm shadow-lg transition-all duration-200 ${
                          flipImage
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        {flipImage ? '🔄 Đã lật' : '🔄 Lật'}
                      </button>
                      
                      <button
                        onClick={() => setMirrorImage(!mirrorImage)}
                        className={`px-4 py-3 rounded-lg font-semibold text-sm shadow-lg transition-all duration-200 ${
                          mirrorImage
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        {mirrorImage ? '🪞 Đã gương' : '🪞 Gương'}
                      </button>
                      
                      <button
                        onClick={stopCamera}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm shadow-lg"
                      >
                        ❌ Hủy
                      </button>
                    </div>
                    
                    {/* Camera Status */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        📷 Camera {cameraMode === 'front' ? 'Trước' : 'Sau'} đang hoạt động
                      </p>
                      <p className="text-xs text-gray-500">Nhấn "Chụp ảnh" để chụp hoặc "Hủy" để thoát</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section - Expense Analysis */}
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Chi phí Phân tích ({expenseItems.length})
              </h2>
              
              {expenseItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="font-semibold">Chưa có chi phí nào</p>
                  <p className="text-sm">Upload hình ảnh để AI phân tích chi phí</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Expense Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {expenseItems.map((item, index) => (
                      <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-black">Chi phí #{index + 1}</h4>
                          <div className="flex items-center gap-2">
                            {item.confidence > 0 && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                {item.confidence}% tin cậy
                              </span>
                            )}
                            {item.confidence > 0 && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                AI Generated
                              </span>
                            )}
                            {expenseItems.length > 1 && (
                              <button
                                onClick={() => removeExpenseItem(item.id)}
                                className="text-red-600 hover:text-red-800 font-bold text-sm"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Mô tả và Giá */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-black mb-1">Mô tả</label>
                              <textarea
                                value={item.description}
                                onChange={(e) => updateExpenseItem(item.id, 'description', e.target.value)}
                                placeholder="Mô tả chi phí..."
                                rows={2}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500 text-black font-bold resize-none"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-black mb-1">Số tiền (VND)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={item.amount}
                                  onChange={(e) => updateExpenseItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                  placeholder="Số tiền..."
                                  className="w-full px-2 py-1 pr-6 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500 text-black font-bold"
                                />
                                <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-xs">
                                  VND
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Nhà cung cấp và Danh mục */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-black mb-1">Nhà cung cấp</label>
                              <input
                                type="text"
                                value={item.vendor}
                                onChange={(e) => updateExpenseItem(item.id, 'vendor', e.target.value)}
                                placeholder="Nhà cung cấp..."
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500 text-black font-bold"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-black mb-1">Danh mục</label>
                              <select
                                value={item.category}
                                onChange={(e) => updateExpenseItem(item.id, 'category', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500 text-black font-bold"
                              >
                                <option value="travel">🚗 Đi lại</option>
                                <option value="meals">🍽️ Ăn uống</option>
                                <option value="accommodation">🏨 Chỗ ở</option>
                                <option value="transportation">🚚 Vận chuyển</option>
                                <option value="supplies">📦 Vật tư</option>
                                <option value="equipment">💻 Thiết bị</option>
                                <option value="training">🎓 Đào tạo</option>
                                <option value="other">📋 Khác</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Ngày */}
                          <div>
                            <label className="block text-xs font-semibold text-black mb-1">Ngày chi phí</label>
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => updateExpenseItem(item.id, 'date', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500 text-black font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Expense Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={addExpenseItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                      + Thêm chi phí
                    </button>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={saveExpense}
                      disabled={loading || expenseItems.length === 0}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Save className="h-5 w-5" />
                      )}
                      {loading ? 'Đang lưu...' : `💾 Lưu ${expenseItems.length} chi phí`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Camera Setup Guide Modal */}
      {showCameraGuide && (
        <CameraSetupGuide onClose={() => setShowCameraGuide(false)} />
      )}
      
      {/* Camera Guide Popup */}
      <CameraGuidePopup 
        isOpen={showCameraGuidePopup} 
        onClose={() => setShowCameraGuidePopup(false)} 
      />
      
      {/* Mobile Camera */}
      <MobileCamera
        isOpen={showMobileCamera}
        onClose={() => setShowMobileCamera(false)}
        onCapture={handleMobileCameraCapture}
        aspectRatio={aspectRatio}
      />
    </div>
  )
}