'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Building2,
  FolderOpen,
  FileText,
  Send,
  DollarSign,
  Receipt,
  CreditCard,
  CheckCircle2,
  Circle,
  ChevronDown,
  Loader2,
  Minimize2,
  Maximize2,
  MessageCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WorkflowPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface Project {
  id: string
  name: string
  project_code?: string
  customer_id?: string
}

interface WorkflowStepStatus {
  step: number
  completed: boolean
  inProgress: boolean
  data?: any
}

interface WorkflowStep {
  id: number
  title: string
  description: string
  icon: any
  checkStatus: (projectId: string) => Promise<WorkflowStepStatus>
  actions?: {
    label: string
    icon: any
    href: string
    color: string
  }[]
}

interface PanelState {
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  isOpen?: boolean // Track if panel should be open
  selectedProjectId?: string // Track selected project
}

const STORAGE_KEY = 'workflow-panel-state'

const getDefaultState = (): PanelState => {
  if (typeof window === 'undefined') {
    return {
      x: 1000,
      y: 80,
      width: 400,
      height: 600,
      minimized: false
    }
  }
  return {
    x: window.innerWidth - 420,
    y: 80,
    width: 400,
    height: 600,
    minimized: false
  }
}

const getMinMaxDimensions = () => {
  if (typeof window === 'undefined') {
    return {
      minWidth: 350,
      minHeight: 400,
      maxWidth: 1200,
      maxHeight: 800
    }
  }
  return {
    minWidth: 350,
    minHeight: 400,
    maxWidth: window.innerWidth * 0.9,
    maxHeight: window.innerHeight * 0.9
  }
}

export default function WorkflowPanel({ isOpen, onClose }: WorkflowPanelProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [stepStatuses, setStepStatuses] = useState<Record<number, WorkflowStepStatus>>({})
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null)
  
  // Panel state
  const [panelState, setPanelState] = useState<PanelState>(getDefaultState())
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  
  const panelRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  
  const dimensions = getMinMaxDimensions()

  // Load saved state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setPanelState(parsed)
          // Restore selected project if exists
          if (parsed.selectedProjectId) {
            setSelectedProjectId(parsed.selectedProjectId)
          }
        } catch (e) {
          console.error('Error loading panel state:', e)
        }
      }
    }
  }, [])

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stateToSave = {
        ...panelState,
        isOpen: isOpen, // Always save isOpen state
        selectedProjectId: selectedProjectId // Save selected project
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('workflow-panel-state-change'))
    }
  }, [panelState, isOpen, selectedProjectId])

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleResize = () => {
      const dims = getMinMaxDimensions()
      setPanelState(prev => {
        const newState = { ...prev }
        // Keep panel within bounds
        if (newState.x + newState.width > window.innerWidth) {
          newState.x = window.innerWidth - newState.width
        }
        if (newState.y + newState.height > window.innerHeight) {
          newState.y = window.innerHeight - newState.height
        }
        if (newState.x < 0) newState.x = 0
        if (newState.y < 0) newState.y = 0
        return newState
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Drag handlers for panel header
  const handleMouseDown = (e: React.MouseEvent) => {
    if (panelState.minimized) return
    if (headerRef.current?.contains(e.target as Node)) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - panelState.x,
        y: e.clientY - panelState.y
      })
    }
  }

  // Drag handler for minimized bubble
  const handleBubbleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Track if this is a drag or click
    let isDrag = false
    const startX = e.clientX
    const startY = e.clientY
    const startTime = Date.now()
    const startPanelX = panelState.x
    const startPanelY = panelState.y
    
    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX)
      const deltaY = Math.abs(moveEvent.clientY - startY)
      
      // If mouse moved more than 5px, consider it a drag
      if (deltaX > 5 || deltaY > 5) {
        if (!isDrag) {
          isDrag = true
          setIsDragging(true)
        }
        
        // Calculate new position
        const newX = moveEvent.clientX - startX + startPanelX
        const newY = moveEvent.clientY - startY + startPanelY
        
        // Keep within bounds
        const maxX = window.innerWidth - 56 // 56 = w-14 (56px)
        const maxY = window.innerHeight - 56
        
        setPanelState(prev => ({
          ...prev,
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        }))
      }
    }

    const handleUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      
      const timeDiff = Date.now() - startTime
      const deltaX = Math.abs(upEvent.clientX - startX)
      const deltaY = Math.abs(upEvent.clientY - startY)
      
      // If it was a quick click (less than 200ms) and didn't move much, toggle minimize
      if (!isDrag && timeDiff < 200 && deltaX < 5 && deltaY < 5) {
        toggleMinimize()
      }
      
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && typeof window !== 'undefined' && !panelState.minimized) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        
        // Keep within bounds
        const maxX = window.innerWidth - panelState.width
        const maxY = window.innerHeight - panelState.height
        
        setPanelState(prev => ({
          ...prev,
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        }))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if ((isDragging || isResizing) && !panelState.minimized) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, panelState.width, panelState.height, panelState.minimized])

  // Resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: panelState.width,
      height: panelState.height
    })
  }

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (isResizing && typeof window !== 'undefined') {
        const dims = getMinMaxDimensions()
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        
        const newWidth = Math.max(dims.minWidth, Math.min(dims.maxWidth, resizeStart.width + deltaX))
        const newHeight = Math.max(dims.minHeight, Math.min(dims.maxHeight, resizeStart.height + deltaY))
        
        // Keep bottom-right corner fixed, adjust top-left position
        const newX = panelState.x + resizeStart.width - newWidth
        const newY = panelState.y + resizeStart.height - newHeight
        
        // Ensure panel stays within bounds
        const finalX = Math.max(0, Math.min(newX, window.innerWidth - newWidth))
        const finalY = Math.max(0, Math.min(newY, window.innerHeight - newHeight))
        
        setPanelState(prev => ({
          ...prev,
          width: newWidth,
          height: newHeight,
          x: finalX,
          y: finalY
        }))
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
      }
    }
  }, [isResizing, resizeStart, panelState.x, panelState.y])

  const toggleMinimize = () => {
    setPanelState(prev => {
      const newMinimized = !prev.minimized
      
      if (newMinimized) {
        // When minimizing, ensure bubble appears on the right side of screen
        // and is within bounds
        if (typeof window !== 'undefined') {
          const bubbleSize = 56 // w-14 = 56px
          const rightMargin = 20 // Margin from right edge
          const topMargin = 20 // Margin from top edge
          
          // Calculate safe position on right side
          let newX = window.innerWidth - bubbleSize - rightMargin
          let newY = prev.y
          
          // If current position is outside screen, use default right position
          if (prev.x < 0 || prev.x + prev.width > window.innerWidth) {
            newY = topMargin
          } else {
            // Keep current Y position but ensure it's within bounds
            newY = Math.max(topMargin, Math.min(prev.y, window.innerHeight - bubbleSize - topMargin))
          }
          
          // Ensure X is within bounds
          newX = Math.max(0, Math.min(newX, window.innerWidth - bubbleSize))
          
          return {
            ...prev,
            minimized: true,
            x: newX,
            y: newY
          }
        }
      } else {
        // When maximizing (opening from bubble), open panel to the left of bubble
        if (typeof window !== 'undefined') {
          const bubbleSize = 56 // w-14 = 56px
          const panelWidth = prev.width || 400
          const panelHeight = prev.height || 600
          
          // Calculate position: panel opens to the left of bubble
          let newX = prev.x - panelWidth
          let newY = prev.y
          
          // If panel would go off screen to the left, position it at left edge
          if (newX < 0) {
            newX = 20 // Margin from left edge
          }
          
          // If panel would go off screen to the right, adjust bubble position
          if (newX + panelWidth > window.innerWidth) {
            newX = window.innerWidth - panelWidth - 20
          }
          
          // Ensure Y position keeps panel within bounds
          const maxY = window.innerHeight - panelHeight
          newY = Math.max(20, Math.min(newY, maxY))
          
          return {
            ...prev,
            minimized: false,
            x: newX,
            y: newY
          }
        }
      }
      
      // Fallback: just toggle minimized state
      return { ...prev, minimized: newMinimized }
    })
  }

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedProjectId) {
      checkAllSteps()
    } else {
      setStepStatuses({})
    }
  }, [selectedProjectId])

  const fetchProjects = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: userData } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', authUser.id)
        .single()

      if (!userData) return

      let query = supabase
        .from('projects')
        .select('id, name, project_code, customer_id')
        .order('created_at', { ascending: false })

      if (userData.role !== 'admin' && userData.role !== 'accountant') {
        const [teamDataByUserId, teamDataByEmail] = await Promise.all([
          supabase
            .from('project_team')
            .select('project_id')
            .eq('status', 'active')
            .eq('user_id', userData.id),
          supabase
            .from('project_team')
            .select('project_id')
            .eq('status', 'active')
            .eq('email', userData.email)
        ])

        const allTeamData = [
          ...(teamDataByUserId.data || []),
          ...(teamDataByEmail.data || [])
        ]

        const allowedProjectIds = [...new Set(allTeamData.map(t => t.project_id))]
        if (allowedProjectIds.length > 0) {
          query = query.in('id', allowedProjectIds)
        } else {
          setProjects([])
          return
        }
      }

      const { data, error } = await query
      if (error) throw error

      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const checkStep1 = async (projectId: string): Promise<WorkflowStepStatus> => {
    const { data: project } = await supabase
      .from('projects')
      .select('customer_id')
      .eq('id', projectId)
      .single()

    return {
      step: 1,
      completed: !!project?.customer_id,
      inProgress: false
    }
  }

  const checkStep2 = async (projectId: string): Promise<WorkflowStepStatus> => {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    return {
      step: 2,
      completed: !!project,
      inProgress: false
    }
  }

  const checkStep3 = async (projectId: string): Promise<WorkflowStepStatus> => {
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id, status')
      .eq('project_id', projectId)
      .limit(1)

    return {
      step: 3,
      completed: (quotes?.length || 0) > 0,
      inProgress: false,
      data: quotes?.[0]
    }
  }

  const checkStep4 = async (projectId: string): Promise<WorkflowStepStatus> => {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('project_id', projectId)
      .limit(1)

    return {
      step: 4,
      completed: (invoices?.length || 0) > 0,
      inProgress: false,
      data: invoices?.[0]
    }
  }

  const checkStep5 = async (projectId: string): Promise<WorkflowStepStatus> => {
    const { data: expenses } = await supabase
      .from('project_expenses_quote')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)

    return {
      step: 5,
      completed: (expenses?.length || 0) > 0,
      inProgress: false,
      data: expenses?.[0]
    }
  }

  const checkStep6 = async (projectId: string): Promise<WorkflowStepStatus> => {
    const { data: expenses } = await supabase
      .from('project_expenses')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)

    return {
      step: 6,
      completed: (expenses?.length || 0) > 0,
      inProgress: false,
      data: expenses?.[0]
    }
  }

  const checkStep7 = async (projectId: string): Promise<WorkflowStepStatus> => {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, payment_status, paid_amount, total_amount')
      .eq('project_id', projectId)
      .in('payment_status', ['paid', 'partial'])
      .limit(1)

    const hasPayment = (invoices?.length || 0) > 0
    const invoice = invoices?.[0]

    return {
      step: 7,
      completed: hasPayment && invoice && invoice.paid_amount > 0,
      inProgress: hasPayment && invoice && invoice.paid_amount < invoice.total_amount,
      data: invoice
    }
  }

  const checkAllSteps = async () => {
    if (!selectedProjectId) return

    setLoading(true)
    try {
      const statuses = await Promise.all([
        checkStep1(selectedProjectId),
        checkStep2(selectedProjectId),
        checkStep3(selectedProjectId),
        checkStep4(selectedProjectId),
        checkStep5(selectedProjectId),
        checkStep6(selectedProjectId),
        checkStep7(selectedProjectId)
      ])

      const statusMap: Record<number, WorkflowStepStatus> = {}
      statuses.forEach(status => {
        statusMap[status.step] = status
      })

      setStepStatuses(statusMap)
    } catch (error) {
      console.error('Error checking steps:', error)
    } finally {
      setLoading(false)
    }
  }

  const workflowSteps: WorkflowStep[] = [
    {
      id: 1,
      title: 'Tạo khách hàng',
      description: 'Thêm thông tin khách hàng mới vào hệ thống',
      icon: Building2,
      checkStatus: checkStep1,
      actions: [
        {
          label: 'Tạo khách hàng',
          icon: Building2,
          href: '/customers?action=create',
          color: 'bg-blue-500 hover:bg-blue-600'
        }
      ]
    },
    {
      id: 2,
      title: 'Tạo dự án',
      description: 'Tạo dự án mới và liên kết với khách hàng',
      icon: FolderOpen,
      checkStatus: checkStep2,
      actions: [
        {
          label: 'Tạo dự án',
          icon: FolderOpen,
          href: '/projects?action=create',
          color: 'bg-green-500 hover:bg-green-600'
        }
      ]
    },
    {
      id: 3,
      title: 'Tạo báo giá',
      description: 'Tạo báo giá cho dự án và gửi cho khách hàng',
      icon: FileText,
      checkStatus: checkStep3,
      actions: [
        {
          label: 'Tạo báo giá',
          icon: FileText,
          href: `/sales?tab=quotes&action=create${selectedProjectId ? `&project=${selectedProjectId}` : ''}`,
          color: 'bg-purple-500 hover:bg-purple-600'
        }
      ]
    },
    {
      id: 4,
      title: 'Xuất PDF và Duyệt thành Hóa đơn',
      description: 'Xuất báo giá ra PDF hoặc duyệt để chuyển thành hóa đơn',
      icon: FileText,
      checkStatus: checkStep4,
      actions: [
        {
          label: 'Xuất PDF',
          icon: Send,
          href: `/sales?tab=quotes&action=preview${selectedProjectId ? `&project=${selectedProjectId}` : ''}`,
          color: 'bg-indigo-500 hover:bg-indigo-600'
        },
        {
          label: 'Duyệt thành Hóa đơn',
          icon: DollarSign,
          href: `/sales?tab=quotes&action=approve${selectedProjectId ? `&project=${selectedProjectId}` : ''}`,
          color: 'bg-green-500 hover:bg-green-600'
        }
      ]
    },
    {
      id: 5,
      title: 'Tạo chi phí kế hoạch',
      description: 'Lập kế hoạch chi phí dự án',
      icon: Receipt,
      checkStatus: checkStep5,
      actions: [
        {
          label: 'Tạo chi phí kế hoạch',
          icon: Receipt,
          href: `/expenses?tab=project-expenses&action=create${selectedProjectId ? `&project=${selectedProjectId}` : ''}`,
          color: 'bg-orange-500 hover:bg-orange-600'
        }
      ]
    },
    {
      id: 6,
      title: 'Xuất PDF và Duyệt thành Chi phí thực tế',
      description: 'Xuất chi phí kế hoạch ra PDF hoặc duyệt để chuyển thành chi phí thực tế',
      icon: Receipt,
      checkStatus: checkStep6,
      actions: [
        {
          label: 'Xuất PDF',
          icon: Send,
          href: `/expenses?tab=project-expenses&action=export-pdf${selectedProjectId ? `&project=${selectedProjectId}` : ''}`,
          color: 'bg-indigo-500 hover:bg-indigo-600'
        },
        {
          label: 'Duyệt thành Chi phí thực tế',
          icon: DollarSign,
          href: `/expenses?tab=project-expenses&action=approve${selectedProjectId ? `&project=${selectedProjectId}` : ''}`,
          color: 'bg-red-500 hover:bg-red-600'
        }
      ]
    },
    {
      id: 7,
      title: 'Ghi nhận thanh toán',
      description: 'Khi khách hàng thanh toán, ghi nhận số tiền đã thanh toán vào hóa đơn',
      icon: CreditCard,
      checkStatus: checkStep7,
      actions: [
        {
          label: 'Ghi nhận thanh toán',
          icon: DollarSign,
          href: `/sales?tab=invoices&action=payment${selectedProjectId ? `&project=${selectedProjectId}` : ''}`,
          color: 'bg-emerald-500 hover:bg-emerald-600'
        }
      ]
    }
  ]

  if (!isOpen) return null

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // Minimized view (bubble icon)
  if (panelState.minimized) {
    return (
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          left: `${panelState.x}px`,
          top: `${panelState.y}px`,
          zIndex: 50
        }}
        className="select-none"
      >
        <div
          onMouseDown={handleBubbleMouseDown}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110 cursor-move active:cursor-grabbing"
          aria-label="Click để mở quy trình, kéo để di chuyển"
          title="Click để mở quy trình, kéo để di chuyển"
        >
          <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform pointer-events-none" />
        </div>
      </div>
    )
  }

  // Full panel view
  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: `${panelState.x}px`,
        top: `${panelState.y}px`,
        width: `${panelState.width}px`,
        height: `${panelState.height}px`,
        zIndex: 50
      }}
      className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
    >
      {/* Header - Draggable */}
      <div
        ref={headerRef}
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 cursor-move select-none"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">Quy trình Quản lý Tài chính</h2>
            <p className="text-xs text-gray-600 truncate">Theo dõi tiến độ dự án</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggleMinimize}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
            aria-label="Thu nhỏ"
            title="Thu nhỏ"
          >
            <Minimize2 className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
            aria-label="Đóng"
            title="Đóng"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Project Selector */}
        <div className="mb-3 pb-3 border-b">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Chọn dự án:
          </label>
           <div className="relative">
             <select
               value={selectedProjectId}
               onChange={(e) => setSelectedProjectId(e.target.value)}
               className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-black"
             >
               <option value="">-- Chọn dự án --</option>
               {projects.map((project) => (
                 <option key={project.id} value={project.id} className="text-black">
                   {project.project_code ? `[${project.project_code}] ` : ''}{project.name}
                 </option>
               ))}
             </select>
             <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
           </div>
          {selectedProject && (
            <p className="mt-1.5 text-xs text-gray-600 truncate">
              Đang xem: <span className="font-medium">{selectedProject.name}</span>
            </p>
          )}
        </div>

        {/* Steps */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Đang kiểm tra...</span>
          </div>
        ) : selectedProjectId ? (
          <div className="space-y-2">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon
              const status = stepStatuses[step.id]
              const isCompleted = status?.completed || false
              const isInProgress = status?.inProgress || false
              const isLast = index === workflowSteps.length - 1

              return (
                <div key={step.id} className="relative">
                  {!isLast && (
                    <div className={`absolute left-4 top-10 bottom-0 w-0.5 ${
                      isCompleted ? 'bg-green-400' : 'bg-gray-300'
                    }`}></div>
                  )}

                  <div className={`relative rounded-lg border p-2.5 ${
                    isCompleted 
                      ? 'bg-green-50 border-green-200' 
                      : isInProgress
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        ) : isInProgress ? (
                          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                            <Circle className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-semibold text-gray-900 truncate">
                              B{step.id}: {step.title}
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{step.description}</p>
                          </div>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ml-2 flex-shrink-0 ${
                            isCompleted
                              ? 'bg-green-100 text-green-700'
                              : isInProgress
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isCompleted ? '✓' : isInProgress ? '...' : '○'}
                          </span>
                        </div>

                        {step.actions && step.actions.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {step.actions.map((action, actionIndex) => {
                              const ActionIcon = action.icon
                              const isApproveAction = action.label.includes('Duyệt') || action.label.includes('duyệt')
                              return (
                                <button
                                  key={actionIndex}
                                  onClick={() => {
                                    // Show notification
                                    if (isApproveAction) {
                                      setNotification({ message: 'Đang xử lý duyệt...', type: 'info' })
                                    } else {
                                      setNotification({ message: 'Đang xử lý...', type: 'info' })
                                    }
                                    
                                    // Navigate after a short delay
                                    setTimeout(() => {
                                      router.push(action.href)
                                      
                                      // Show success notification for approve actions
                                      if (isApproveAction) {
                                        setTimeout(() => {
                                          setNotification({ message: 'Duyệt thành công!', type: 'success' })
                                        }, 500)
                                      }
                                    }, 100)
                                  }}
                                  className={`${action.color} text-white px-2 py-1 rounded text-xs flex items-center gap-1 transition-all duration-200 shadow-sm hover:shadow-md`}
                                >
                                  <ActionIcon className="h-3 w-3" />
                                  <span className="font-medium">{action.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs">Vui lòng chọn một dự án để xem tiến độ quy trình</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t bg-gray-50 flex justify-end gap-2">
        <button
          onClick={() => {
            router.push('/workflow')
            onClose()
          }}
          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Xem chi tiết
        </button>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gray-300 hover:bg-gray-400 transition-colors"
        style={{
          clipPath: 'polygon(100% 0, 0 100%, 100% 100%)'
        }}
        title="Kéo để thay đổi kích thước"
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-5 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : notification.type === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-blue-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}
    </div>
  )
}

