/* eslint-disable @next/next/no-img-element */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

// Component for previewing pending files
const PendingFilePreview = ({ file, index, isImage, onRemove }: {
  file: File
  index: number
  isImage: boolean
  onRemove: (index: number) => void
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file, isImage])

  return (
    <div className="relative group">
      {isImage && previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt={file.name}
            className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm"
          />
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="relative h-20 w-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center group">
          <FileText className="h-6 w-6 text-gray-400" />
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-1 truncate max-w-[80px]" title={file.name}>
        {file.name}
      </p>
    </div>
  )
}
import { useParams, useRouter } from 'next/navigation'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import { supabase } from '@/lib/supabase'
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api'
import {
  TaskResponse,
  TaskChecklist,
  TaskChecklistItem,
  TaskComment,
  TaskNote,
  TaskStatus,
  TaskPriority,
  TaskAssignment
} from '@/types/task'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckSquare,
  Clock,
  Download,
  Edit,
  Edit2,
  FileText,
  File,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  Reply,
  Send,
  StickyNote,
  Trash2,
  User,
  Users,
  FileSpreadsheet,
  FileType,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const MODERATOR_ROLES = ['admin', 'sales', 'accountant']
const COLOR_BADGES: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
}
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-gray-500',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600'
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

// Get file icon path from icon folder based on file type or filename
const getFileIconPath = (fileType: string, fileName?: string): string | null => {
  if (!fileName && !fileType) return null

  const type = fileType?.toLowerCase() || ''
  const name = fileName?.toLowerCase() || ''

  // Extract file extension from name (handle query params and spaces)
  const getExtension = (filename: string): string => {
    // Remove query params and decode if needed
    const cleanName = filename.split('?')[0].trim()
    const match = cleanName.match(/\.([a-z0-9]+)$/i)
    return match ? match[1].toLowerCase() : ''
  }
  const extension = getExtension(name)

  // Check by file extension first (more reliable)
  // PDF
  if (extension === 'pdf' || type === 'application/pdf' || name.includes('.pdf')) {
    return '/icon/pdf.png'
  }

  // Excel files - check extension first
  if (['xls', 'xlsx', 'xlsm', 'xlsb'].includes(extension) || name.includes('.xls')) {
    return '/icon/Excel.png'
  }
  // Then check MIME type
  if (type.includes('spreadsheet') ||
    type === 'application/vnd.ms-excel' ||
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'application/vnd.ms-excel.sheet.macroenabled.12') {
    return '/icon/Excel.png'
  }

  // Word files - check extension first
  if (['doc', 'docx', 'docm'].includes(extension) || name.includes('.doc')) {
    return '/icon/doc.png'
  }
  // Then check MIME type
  if (type.includes('word') ||
    type === 'application/msword' ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/vnd.ms-word.document.macroenabled.12') {
    return '/icon/doc.png'
  }

  // Images - return null to use ImageIcon component
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(extension) ||
    type.startsWith('image/')) {
    return null
  }

  // Default - return null to use File icon component
  return null
}

// Get file icon component (fallback when no icon path available)
const getFileIconComponent = (fileType: string) => {
  if (!fileType) return FileText

  const type = fileType.toLowerCase()

  // Images
  if (type.startsWith('image/')) {
    return ImageIcon
  }

  // Text files
  if (type.startsWith('text/')) {
    return FileText
  }

  // Default
  return File
}

// Get display filename (original or fallback to storage filename)
const getDisplayFileName = (attachment: { original_file_name?: string; file_name: string }) => {
  return attachment.original_file_name || attachment.file_name
}

const formatEstimatedTime = (minutes?: number) => {
  if (!minutes || minutes <= 0) return 'Chưa đặt'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours && mins) return `${hours}h ${mins}m`
  if (hours) return `${hours}h`
  return `${mins}m`
}

const calculateTimeRemaining = (dueDate?: string) => {
  if (!dueDate) return null
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  return diffHours
}

const formatTimeLimit = (estimatedTime?: number) => {
  if (!estimatedTime || estimatedTime <= 0) return 'Chưa đặt'
  const hours = Math.floor(estimatedTime / 60)
  return `${hours}h`
}

interface UserProfile {
  id: string
  full_name?: string
  role?: string
  email?: string
}

const formatDate = (date?: string, withTime = false) => {
  if (!date) return 'Không có'
  const options: Intl.DateTimeFormatOptions = withTime
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }
  return new Date(date).toLocaleString('vi-VN', options)
}

const formatFileSize = (size?: number) => {
  if (!size) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  let value = size
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index++
  }
  return `${value.toFixed(1)} ${units[index]}`
}

function InfoCard({
  icon,
  label,
  value,
  highlight
}: {
  icon: ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`border rounded-xl p-4 flex items-start gap-3 ${highlight ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-600 border border-gray-200">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className={`text-sm font-semibold ${highlight ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  )
}

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams<{ taskId: string }>()
  // Extract taskId immediately to avoid direct params access - destructure to prevent enumeration
  const { taskId: paramTaskId } = params || {}
  const taskId = (paramTaskId ?? '') as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [taskData, setTaskData] = useState<TaskResponse | null>(null)
  const [loadingTask, setLoadingTask] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [projectStatuses, setProjectStatuses] = useState<any[]>([])
  const [updatingProjectStatus, setUpdatingProjectStatus] = useState(false)
  const [availableEmployees, setAvailableEmployees] = useState<Array<{ id: string; name: string }>>([])

  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [checklistItemsDraft, setChecklistItemsDraft] = useState<Record<string, string>>({})
  const [checklistItemFiles, setChecklistItemFiles] = useState<Record<string, File[]>>({})
  const [checklistItemPreviews, setChecklistItemPreviews] = useState<Record<string, string[]>>({})
  const [checklistItemAssignments, setChecklistItemAssignments] = useState<Record<string, Array<{ employee_id: string; responsibility_type: 'accountable' | 'responsible' | 'consulted' | 'informed' }>>>({})
  const [showAssignmentDropdown, setShowAssignmentDropdown] = useState<Record<string, boolean>>({})
  const [uploadingChecklistItem, setUploadingChecklistItem] = useState<string | null>(null)
  const [checklistError, setChecklistError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [showAddNote, setShowAddNote] = useState(false)
  const [showNotesSection, setShowNotesSection] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<string | null>(null)
  const [editingChecklistItemContent, setEditingChecklistItemContent] = useState('')
  const [editingChecklistItemFiles, setEditingChecklistItemFiles] = useState<File[]>([])
  const [editingChecklistItemFileUrls, setEditingChecklistItemFileUrls] = useState<string[]>([])
  const [showAssignEmployeeDropdown, setShowAssignEmployeeDropdown] = useState(false)
  const [editingChecklistItemPreviews, setEditingChecklistItemPreviews] = useState<string[]>([])
  const [uploadingEditChecklistItem, setUploadingEditChecklistItem] = useState(false)
  // Sử dụng participants từ taskData thay vì groupMembers
  // groupMembers đã được thay thế bằng taskData?.participants

  const [chatMessage, setChatMessage] = useState('')
  const [chatFilter, setChatFilter] = useState<'all' | 'pinned'>('all')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [replyingTo, setReplyingTo] = useState<TaskComment | null>(null)  // Comment being replied to
  const [draggedComment, setDraggedComment] = useState<TaskComment | null>(null)  // Comment being dragged
  const [isDragging, setIsDragging] = useState(false)  // File drag & drop state
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null)
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const mentionInputRef = useRef<HTMLTextAreaElement | null>(null)

  // Resizable layout states
  const [leftColumnWidth, setLeftColumnWidth] = useState(320)
  const [rightColumnWidth, setRightColumnWidth] = useState(320)
  const [middleSplitRatio, setMiddleSplitRatio] = useState(0.55)
  const [mainChatRatio, setMainChatRatio] = useState(0.6) // Ratio between main and chat (0.5 = 50:50, 0.6 = 60:40, etc.)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showAllMembers, setShowAllMembers] = useState(false)
  const [showAllImages, setShowAllImages] = useState(false)
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [showAllLinks, setShowAllLinks] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<{ url: string; index: number } | null>(null)
  const middleColumnRef = useRef<HTMLDivElement | null>(null)
  const mainChatContainerRef = useRef<HTMLDivElement | null>(null)
  const resizeStateRef = useRef<{
    type: 'left' | 'right' | 'middle' | 'main-chat'
    startX: number
    startY: number
    startLeftWidth: number
    startRightWidth: number
    startSplit: number
    startMainChatRatio: number
    containerHeight: number
    containerWidth: number
  } | null>(null)

  // Edit/Delete states
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupDescription, setEditGroupDescription] = useState('')

  const quickSections = [
    { id: 'overview', label: 'Thông tin', icon: AlertCircle },
    { id: 'checklists', label: 'Checklist', icon: CheckSquare },
    { id: 'notes', label: 'Ghi chú', icon: StickyNote },
    { id: 'chat', label: 'Trao đổi', icon: MessageSquare }
  ] as const

  type SectionKey = typeof quickSections[number]['id']

  const overviewRef = useRef<HTMLDivElement | null>(null)
  const checklistRef = useRef<HTMLDivElement | null>(null)
  const notesRef = useRef<HTMLDivElement | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)

  const sectionRefs: Record<SectionKey, React.RefObject<HTMLDivElement | null>> = {
    overview: overviewRef,
    checklists: checklistRef,
    notes: notesRef,
    chat: chatRef
  }

  const handleSectionJump = (key: SectionKey) => {
    sectionRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const state = resizeStateRef.current
    if (!state) return
    // Prevent text selection while resizing
    event.preventDefault()
    if (state.type === 'left') {
      const delta = event.clientX - state.startX
      const newWidth = clamp(state.startLeftWidth + delta, 240, 520)
      setLeftColumnWidth(newWidth)
    } else if (state.type === 'right') {
      const delta = state.startX - event.clientX
      const newWidth = clamp(state.startRightWidth + delta, 240, 520)
      setRightColumnWidth(newWidth)
    } else if (state.type === 'main-chat') {
      if (!state.containerWidth || state.containerWidth <= 0) return
      const delta = event.clientX - state.startX
      const ratioDelta = delta / state.containerWidth
      // Clamp ratio between 0.5 (50:50) and 0.9 (90:10) - main can be 50% to 90%, chat can be 10% to 50%
      const newRatio = clamp(state.startMainChatRatio + ratioDelta, 0.5, 0.9)
      setMainChatRatio(newRatio)
    } else if (state.type === 'middle') {
      if (!state.containerHeight || state.containerHeight <= 0) return
      const delta = event.clientY - state.startY
      const newRatio = clamp(state.startSplit + delta / state.containerHeight, 0.2, 0.8)
      setMiddleSplitRatio(newRatio)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    resizeStateRef.current = null
    // Restore cursor and text selection
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      // Cleanup cursor and selection
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [handleMouseMove, handleMouseUp])

  const startResize = (type: 'left' | 'right' | 'middle' | 'main-chat', event: React.MouseEvent) => {
    event.preventDefault()
    // Set cursor and prevent text selection
    document.body.style.userSelect = 'none'
    document.body.style.cursor = type === 'middle' ? 'row-resize' : 'col-resize'

    if (type === 'middle' && middleColumnRef.current) {
      const rect = middleColumnRef.current.getBoundingClientRect()
      resizeStateRef.current = {
        type,
        startX: event.clientX,
        startY: event.clientY,
        startLeftWidth: leftColumnWidth,
        startRightWidth: rightColumnWidth,
        startSplit: middleSplitRatio,
        startMainChatRatio: mainChatRatio,
        containerHeight: rect.height,
        containerWidth: 0
      }
    } else if (type === 'main-chat' && mainChatContainerRef.current) {
      const rect = mainChatContainerRef.current.getBoundingClientRect()
      resizeStateRef.current = {
        type,
        startX: event.clientX,
        startY: event.clientY,
        startLeftWidth: leftColumnWidth,
        startRightWidth: rightColumnWidth,
        startSplit: middleSplitRatio,
        startMainChatRatio: mainChatRatio,
        containerHeight: 0,
        containerWidth: rect.width
      }
    } else {
      resizeStateRef.current = {
        type,
        startX: event.clientX,
        startY: event.clientY,
        startLeftWidth: leftColumnWidth,
        startRightWidth: rightColumnWidth,
        startSplit: middleSplitRatio,
        startMainChatRatio: mainChatRatio,
        containerHeight: middleColumnRef.current?.getBoundingClientRect().height || 0,
        containerWidth: 0
      }
    }
  }

  const canModerateComments = useMemo(() => {
    const role = user?.role?.toLowerCase()
    return role ? MODERATOR_ROLES.includes(role) : false
  }, [user])

  useEffect(() => {
    // Tự động tạo preview cho file ảnh đầu tiên trong danh sách (nếu có)
    if (pendingFiles.length > 0) {
      const firstImage = pendingFiles.find(f => f.type.startsWith('image/'))
      if (firstImage) {
        const preview = URL.createObjectURL(firstImage)
        setPendingPreview(preview)
        return () => URL.revokeObjectURL(preview)
      }
    }
    setPendingPreview(null)
  }, [pendingFiles])

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set isDragging to false if we're leaving the drop zone
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsDragging(false)
    }
  }, [])

  // Handle file input change
  const handleFileInput = useCallback((files: File[]) => {
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files])
    }
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoadingUser(true)
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/login')
          return
        }
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        if (profile) {
          setUser(profile)
        }
      } catch (err) {
        console.error('Failed to load user', err)
        router.push('/login')
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [router])

  const loadProjectInfo = useCallback(async (projectId: string) => {
    try {
      const projectData = await apiGet(`/api/projects/${projectId}`)
      setProject(projectData)

      // Get project categories
      const categories = await apiGet(`/api/project-category-members/projects/${projectId}/categories`)

      // Fetch statuses for each category
      const allStatuses: any[] = []

      // Get global statuses first
      const globalStatuses = await apiGet('/api/projects/statuses')
      if (globalStatuses) {
        allStatuses.push(...globalStatuses.filter((s: any) => !s.category_id))
      }

      // Get statuses for each category
      if (categories && categories.length > 0) {
        for (const category of categories) {
          const categoryStatuses = await apiGet(`/api/projects/statuses?category_id=${category.category_id}`)
          if (categoryStatuses) {
            allStatuses.push(...categoryStatuses)
          }
        }
      }

      // Remove duplicates and sort by display_order
      const uniqueStatuses = Array.from(
        new Map(allStatuses.map(s => [s.id, s])).values()
      ).sort((a, b) => a.display_order - b.display_order)

      setProjectStatuses(uniqueStatuses)

      // Load project team members for assignment
      if (projectId) {
        try {
          const teamMembers = await apiGet(`/api/project-team/projects/${projectId}/team`)
          if (teamMembers && Array.isArray(teamMembers)) {
            const employees = teamMembers.map((member: any) => ({
              id: member.employee_id || member.id,
              name: member.employee_name || member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim()
            })).filter((emp: any) => emp.id && emp.name)
            setAvailableEmployees(employees)
          }
        } catch (err) {
          console.error('Error loading project team:', err)
          // Fallback: try to get all employees if project team fails
          try {
            const { data: employeesData } = await supabase
              .from('employees')
              .select('id, first_name, last_name')
              .limit(100)
            if (employeesData) {
              const employees = employeesData.map((emp: any) => ({
                id: emp.id,
                name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
              })).filter((emp: any) => emp.name)
              setAvailableEmployees(employees)
            }
          } catch (fallbackErr) {
            console.error('Error loading employees fallback:', fallbackErr)
          }
        }
      }
    } catch (err) {
      console.error('Error loading project info:', err)
    }
  }, [])

  const loadTaskDetails = useCallback(async () => {
    if (!taskId) return
    try {
      setLoadingTask(true)
      setError(null)
      const data = await apiGet(`/api/tasks/${taskId}`)

      if (!data || !data.task) {
        setError('Nhiệm vụ không tồn tại hoặc đã bị xóa')
        setTaskData(null)
        return
      }

      setTaskData(data)

      // Load project info if task has project_id
      if (data?.task?.project_id) {
        loadProjectInfo(data.task.project_id)
      } else {
        // Load all employees if no project
        try {
          const { data: employeesData } = await supabase
            .from('employees')
            .select('id, first_name, last_name')
            .limit(100)
          if (employeesData) {
            const employees = employeesData.map((emp: any) => ({
              id: emp.id,
              name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
            })).filter((emp: any) => emp.name)
            setAvailableEmployees(employees)
          }
        } catch (err) {
          console.error('Error loading employees:', err)
        }
      }

      // Participants đã được bao gồm trong TaskResponse từ backend
      // Không cần load group members riêng nữa vì đã chuyển sang task_participants
    } catch (err: any) {
      console.error('Failed to load task', err)
      const status = err?.status || err?.response?.status
      const message = err?.message || err?.response?.data?.detail || 'Không thể tải nhiệm vụ'

      if (status === 404) {
        setError('Nhiệm vụ không tồn tại hoặc đã bị xóa')
      } else if (status === 401 || status === 403) {
        setError('Bạn không có quyền xem nhiệm vụ này')
      } else {
        setError(message)
      }
      setTaskData(null)
    } finally {
      setLoadingTask(false)
    }
  }, [taskId, loadProjectInfo])

  const loadComments = useCallback(async () => {
    if (!taskId) return
    try {
      const comments = await apiGet(`/api/tasks/${taskId}/comments`)
      setTaskData(prev => prev ? { ...prev, comments } : null)
    } catch (err) {
      console.error('Failed to load comments', err)
      // Fallback: reload full task if comments endpoint fails
      if (taskData) {
        loadTaskDetails()
      }
    }
  }, [taskId, loadTaskDetails])

  const handleUpdateProjectStatus = useCallback(async (statusId: string) => {
    if (!project || !project.id || updatingProjectStatus) return

    try {
      setUpdatingProjectStatus(true)
      await apiPut(`/api/projects/${project.id}`, {
        status_id: statusId
      })
      // Refresh project data
      await loadProjectInfo(project.id)
    } catch (err: any) {
      console.error('Error updating project status:', err)
      alert(err.message || 'Không thể cập nhật trạng thái dự án')
    } finally {
      setUpdatingProjectStatus(false)
    }
  }, [project, updatingProjectStatus, loadProjectInfo])

  useEffect(() => {
    loadTaskDetails()
  }, [loadTaskDetails])

  // Supabase Realtime subscription for task comments
  useEffect(() => {
    if (!taskId) return

    // Subscribe to task_comments changes for this specific task
    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}` // Filter by task_id
        },
        (payload) => {
          console.log('Realtime comment update:', payload)
          
          // Reload comments to get latest data including joined fields (user_name, employee_name, etc.)
          loadComments()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to task comments realtime for task:', taskId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to task comments realtime')
        }
      })

    // Cleanup: unsubscribe when component unmounts or taskId changes
    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId, loadComments])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Task edit/delete handlers
  const handleEditTask = () => {
    if (taskData?.task) {
      setEditTaskTitle(taskData.task.title)
      setEditTaskDescription(taskData.task.description || '')
      setIsEditingTask(true)
    }
  }

  const handleSaveTask = async () => {
    if (!editTaskTitle.trim()) {
      alert('Tiêu đề không được để trống')
      return
    }
    try {
      await apiPut(`/api/tasks/${taskId}`, {
        title: editTaskTitle.trim(),
        description: editTaskDescription.trim() || null
      })
      setIsEditingTask(false)
      loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể cập nhật nhiệm vụ'))
    }
  }

  const handleDeleteTask = async () => {
    if (!confirm('Bạn có chắc muốn xóa nhiệm vụ này? Hành động này không thể hoàn tác.')) return
    try {
      await apiDelete(`/api/tasks/${taskId}`)
      router.push('/tasks')
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể xóa nhiệm vụ'))
    }
  }

  // Group edit/delete handlers
  const handleEditGroup = async () => {
    if (!taskData?.task?.group_id) return
    try {
      const groupData = await apiGet(`/api/tasks/groups/${taskData.task.group_id}`)
      setEditGroupName(groupData.name || '')
      setEditGroupDescription(groupData.description || '')
      setIsEditingGroup(true)
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể tải thông tin nhóm'))
    }
  }

  const handleSaveGroup = async () => {
    if (!taskData?.task?.group_id || !editGroupName.trim()) {
      alert('Tên nhóm không được để trống')
      return
    }
    try {
      await apiPut(`/api/tasks/groups/${taskData.task.group_id}`, {
        name: editGroupName.trim(),
        description: editGroupDescription.trim() || null
      })
      setIsEditingGroup(false)
      loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể cập nhật nhóm'))
    }
  }

  const handleDeleteGroup = async () => {
    if (!taskData?.task?.group_id) return
    if (!confirm('Bạn có chắc muốn xóa nhóm này? Tất cả nhiệm vụ trong nhóm sẽ bị ảnh hưởng.')) return
    try {
      // Try to delete group - if endpoint doesn't exist, show error
      await apiDelete(`/api/tasks/groups/${taskData.task.group_id}`)
      router.push('/tasks')
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể xóa nhóm. Có thể endpoint này chưa được tạo.'))
    }
  }

  const calculateChecklistProgress = (items: TaskChecklistItem[]) => {
    if (!items || items.length === 0) return 0
    const completed = items.filter(item => item.is_completed).length
    return completed / items.length
  }

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) {
      setChecklistError('Vui lòng nhập tên nhóm việc trước khi thêm.')
      return
    }
    try {
      const createdChecklist = await apiPost(`/api/tasks/${taskId}/checklists`, { title: newChecklistTitle.trim() })
      setNewChecklistTitle('')
      setChecklistError(null)
      if (createdChecklist) {
        setTaskData(prev => {
          if (!prev) return prev
          const newChecklist = {
            ...createdChecklist,
            items: createdChecklist.items || [],
            progress: typeof createdChecklist.progress === 'number'
              ? createdChecklist.progress
              : calculateChecklistProgress(createdChecklist.items || [])
          }
          return {
            ...prev,
            checklists: [newChecklist, ...prev.checklists]
          }
        })
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể tạo checklist'))
    }
  }

  const handleAddChecklistItem = async (checklistId: string) => {
    const content = checklistItemsDraft[checklistId]?.trim()
    const files = checklistItemFiles[checklistId] || []
    if (!content && files.length === 0) return

    setUploadingChecklistItem(checklistId)
    try {
      let fileUrls: string[] = []

      // Upload files if any
      if (files.length > 0) {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          throw new Error('Thiếu token xác thực, vui lòng đăng nhập lại')
        }

        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch(`/api/tasks/${taskId}/attachments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
            throw new Error(errorData.detail || errorData.message || 'Không thể upload file')
          }

          const data = await response.json()
          fileUrls.push(data.file_url || data.url)
        }
      }

      // Create checklist item with file URLs appended to content
      // Format: "content_text [FILE_URLS: url1 url2 ...]"
      let itemContent = content || ''
      if (fileUrls.length > 0) {
        const fileUrlsText = fileUrls.join(' ')
        itemContent = itemContent
          ? `${itemContent} [FILE_URLS: ${fileUrlsText}]`
          : `📎 ${fileUrls.length} file(s) [FILE_URLS: ${fileUrlsText}]`
      }
      const payload: any = {
        content: itemContent,
        assignments: checklistItemAssignments[checklistId] || []
      }

      const newItem = await apiPost(`/api/tasks/checklists/${checklistId}/items`, payload)

      // Clear draft, files, and assignments
      setChecklistItemsDraft(prev => ({ ...prev, [checklistId]: '' }))
      setChecklistItemFiles(prev => ({ ...prev, [checklistId]: [] }))
      setChecklistItemPreviews(prev => ({ ...prev, [checklistId]: [] }))
      setChecklistItemAssignments(prev => ({ ...prev, [checklistId]: [] }))
      setShowAssignmentDropdown(prev => ({ ...prev, [checklistId]: false }))

      setTaskData(prev => {
        if (!prev) return prev
        const updatedChecklists = prev.checklists.map(checklist => {
          if (checklist.id !== checklistId) return checklist
          const updatedItems = [...(checklist.items || []), newItem]
          return {
            ...checklist,
            items: updatedItems,
            progress: calculateChecklistProgress(updatedItems)
          }
        })
        return { ...prev, checklists: updatedChecklists }
      })
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể thêm mục checklist'))
    } finally {
      setUploadingChecklistItem(null)
    }
  }

  const startEditChecklistItem = (item: TaskChecklistItem) => {
    setEditingChecklistItemId(item.id)

    // Parse content and file URLs
    let displayContent = item.content || ''
    const fileUrls: string[] = []

    // Extract file URLs from [FILE_URLS: ...] pattern
    const fileUrlsMatch = displayContent.match(/\[FILE_URLS:\s*([^\]]+)\]/)
    if (fileUrlsMatch) {
      const urls = fileUrlsMatch[1].trim().split(/\s+/)
      fileUrls.push(...urls)
      // Remove the [FILE_URLS: ...] pattern from display content
      displayContent = displayContent.replace(/\[FILE_URLS:[^\]]+\]/g, '').trim()
      // Remove "📎 X file(s)" if it's the only content
      displayContent = displayContent.replace(/^📎 \d+ file\(s\)\s*$/g, '').trim()
    }

    setEditingChecklistItemContent(displayContent)
    setEditingChecklistItemFileUrls(fileUrls)
    setEditingChecklistItemFiles([])
    setEditingChecklistItemPreviews([])
  }

  const handleSaveChecklistItem = async () => {
    if (!editingChecklistItemId) {
      setEditingChecklistItemId(null)
      setEditingChecklistItemContent('')
      setEditingChecklistItemFiles([])
      setEditingChecklistItemFileUrls([])
      setEditingChecklistItemPreviews([])
      return
    }

    const content = editingChecklistItemContent.trim()
    const files = editingChecklistItemFiles
    const existingFileUrls = editingChecklistItemFileUrls

    if (!content && files.length === 0 && existingFileUrls.length === 0) {
      alert('Vui lòng nhập nội dung hoặc thêm file')
      return
    }

    setUploadingEditChecklistItem(true)
    try {
      let allFileUrls = [...existingFileUrls]

      // Upload new files if any
      if (files.length > 0) {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          throw new Error('Thiếu token xác thực, vui lòng đăng nhập lại')
        }

        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch(`/api/tasks/${taskId}/attachments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
            throw new Error(errorData.detail || errorData.message || 'Không thể upload file')
          }

          const data = await response.json()
          allFileUrls.push(data.file_url || data.url)
        }
      }

      // Create content with file URLs
      let itemContent = content || ''
      if (allFileUrls.length > 0) {
        const fileUrlsText = allFileUrls.join(' ')
        itemContent = itemContent
          ? `${itemContent} [FILE_URLS: ${fileUrlsText}]`
          : `📎 ${allFileUrls.length} file(s) [FILE_URLS: ${fileUrlsText}]`
      }

      const updatedItem = await apiPut(`/api/tasks/checklist-items/${editingChecklistItemId}`, {
        content: itemContent
      })

      setTaskData(prev => {
        if (!prev) return prev
        const updatedChecklists = prev.checklists.map(checklist => {
          if (!checklist.items?.length) return checklist
          const items = checklist.items.map(item => item.id === editingChecklistItemId ? { ...item, ...updatedItem } : item)
          if (items === checklist.items) return checklist
          return { ...checklist, items }
        })
        return { ...prev, checklists: updatedChecklists }
      })

      setEditingChecklistItemId(null)
      setEditingChecklistItemContent('')
      setEditingChecklistItemFiles([])
      setEditingChecklistItemFileUrls([])
      setEditingChecklistItemPreviews([])
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể cập nhật việc cần làm'))
    } finally {
      setUploadingEditChecklistItem(false)
    }
  }

  const handleToggleChecklistItem = async (item: TaskChecklistItem) => {
    try {
      await apiPut(`/api/tasks/checklist-items/${item.id}`, { is_completed: !item.is_completed })
      loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể cập nhật mục'))
    }
  }

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!confirm('Bạn có chắc muốn xóa mục này?')) return
    try {
      await apiDelete(`/api/tasks/checklist-items/${itemId}`)
      loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể xóa mục'))
    }
  }

  const handleCreateNote = async () => {
    if (!newNote.trim()) return
    try {
      await apiPost(`/api/tasks/${taskId}/notes`, { content: newNote.trim() })
      setNewNote('')
      loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể tạo ghi chú'))
    }
  }

  const handleEditNote = (note: TaskNote) => {
    setEditingNoteId(note.id)
    setEditingNoteContent(note.content)
  }

  const handleSaveNote = async () => {
    if (!editingNoteId) return
    try {
      await apiPut(`/api/tasks/notes/${editingNoteId}`, { content: editingNoteContent })
      setEditingNoteId(null)
      setEditingNoteContent('')
      loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể cập nhật ghi chú'))
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Xóa ghi chú này?')) return
    try {
      await apiDelete(`/api/tasks/notes/${noteId}`)
      loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể xóa ghi chú'))
    }
  }

  const uploadChatFile = async (file: File) => {
    setUploadingFile(true)
    try {
      // Lấy token hiện tại từ Supabase (tự xử lý refresh nếu gần hết hạn)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('Thiếu token xác thực, vui lòng đăng nhập lại')
      }
      const formData = new FormData()
      formData.append('file', file)

      // Dùng đường dẫn tương đối để đi qua API backend hiện tại
      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(errorData.detail || errorData.message || `Không thể tải file: ${file.name}`)
      }
      const data = await response.json()
      const fileUrl = data.file_url || data.url
      if (!fileUrl) {
        throw new Error('Không nhận được URL file từ server')
      }
      return fileUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    } finally {
      setUploadingFile(false)
    }
  }

  const handleUploadAttachments = async (files: File[]) => {
    if (!files || files.length === 0) return
    setUploadingAttachment(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('Thiếu token xác thực, vui lòng đăng nhập lại')
      }

      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`/api/tasks/${taskId}/attachments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
          throw new Error(errorData.detail || errorData.message || 'Không thể upload file')
        }
      }

      // Reload task details to show new attachments
      await loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể upload file'))
    } finally {
      setUploadingAttachment(false)
    }
  }

  const handleSendMessage = async () => {
    const trimmedMessage = chatMessage.trim()
    if (!trimmedMessage && pendingFiles.length === 0) return
    try {
      setSendingMessage(true)

      // Parse mentions from message
      const mentionedMemberIds: string[] = []
      if (trimmedMessage) {
        const memberMentions = trimmedMessage.match(/@(\w+)/g)
        if (memberMentions) {
          const members = getMentionMembers()
          memberMentions.forEach(mention => {
            const memberName = mention.substring(1) // Remove @
            const member = members.find(m => m.name === memberName)
            if (member) {
              mentionedMemberIds.push(member.id)
            }
          })
        }
      }

      // Upload tất cả files trước
      const uploadedFiles: Array<{ file: File; url: string; index: number }> = []
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i]
        try {
          const fileUrl = await uploadChatFile(file)
          uploadedFiles.push({ file, url: fileUrl, index: i })
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError)
          alert(`Không thể gửi file "${file.name}": ${getErrorMessage(fileError, 'Lỗi không xác định')}`)
        }
      }

      // Nếu có cả text và file: gộp thành 1 tin nhắn
      let createdComment: any = null
      if (trimmedMessage && uploadedFiles.length > 0) {
        // Gửi 1 comment với text và file đầu tiên
        const firstFile = uploadedFiles[0]
        const messageType: 'file' | 'image' = firstFile.file.type.startsWith('image/') ? 'image' : 'file'

        createdComment = await apiPost(`/api/tasks/${taskId}/comments`, {
          comment: trimmedMessage,
          type: messageType,
          file_url: firstFile.url,
          is_pinned: false,
          parent_id: replyingTo?.id || null
        })

        // Gửi các file còn lại (nếu có nhiều file) như các comment riêng
        for (let i = 1; i < uploadedFiles.length; i++) {
          const fileData = uploadedFiles[i]
          const fileMessageType: 'file' | 'image' = fileData.file.type.startsWith('image/') ? 'image' : 'file'
          await apiPost(`/api/tasks/${taskId}/comments`, {
            comment: fileData.file.name || 'File đính kèm',
            type: fileMessageType,
            file_url: fileData.url,
            is_pinned: false,
            parent_id: replyingTo?.id || null
          })
        }
      } else if (trimmedMessage) {
        // Chỉ có text, không có file
        createdComment = await apiPost(`/api/tasks/${taskId}/comments`, {
          comment: trimmedMessage,
          type: 'text',
          file_url: undefined,
          is_pinned: false,
          parent_id: replyingTo?.id || null
        })
      } else if (uploadedFiles.length > 0) {
        // Chỉ có file, không có text - gửi từng file riêng
        for (const fileData of uploadedFiles) {
          const messageType: 'file' | 'image' = fileData.file.type.startsWith('image/') ? 'image' : 'file'
          await apiPost(`/api/tasks/${taskId}/comments`, {
            comment: fileData.file.name || 'File đính kèm',
            type: messageType,
            file_url: fileData.url,
            is_pinned: false,
            parent_id: replyingTo?.id || null
          })
        }
      }

      // Gửi thông báo cho các nhân viên được mention
      if (mentionedMemberIds.length > 0 && createdComment) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token

          if (token) {
            // Lấy thông tin task và user hiện tại
            const taskTitle = task?.title || 'Nhiệm vụ'
            const currentUserName = user?.full_name || 'Người dùng'

            // Tạo notification cho mỗi member được mention
            for (const memberId of mentionedMemberIds) {
              // Tìm user_id từ employee_id
              const { data: employeeData } = await supabase
                .from('employees')
                .select('user_id')
                .eq('id', memberId)
                .single()

              if (employeeData?.user_id) {
                // Tạo task notification
                await supabase
                  .from('task_notifications')
                  .insert({
                    task_id: taskId,
                    user_id: employeeData.user_id,
                    employee_id: memberId,
                    notification_type: 'comment_added',
                    title: 'Bạn được mention trong bình luận',
                    message: `${currentUserName} đã mention bạn trong nhiệm vụ "${taskTitle}": ${trimmedMessage.substring(0, 100)}${trimmedMessage.length > 100 ? '...' : ''}`
                  })
              }
            }
          }
        } catch (notifError) {
          console.error('Error creating mention notifications:', notifError)
          // Không throw error để không làm gián đoạn việc gửi message
        }
      }

      // Clear messages and files only if at least one message or file was sent successfully
      if (uploadedFiles.length > 0 || createdComment) {
        setChatMessage('')
        // Clear all files since they've been uploaded
        setPendingFiles([])
        setPendingPreview(null)
        setReplyingTo(null)
        // Only reload comments, not the entire task
        await loadComments()
      }
    } catch (err) {
      console.error('Error sending message:', err)
      alert(getErrorMessage(err, 'Không thể gửi tin nhắn'))
    } finally {
      setSendingMessage(false)
    }
  }

  const handleReply = (comment: TaskComment) => {
    setReplyingTo(comment)
    // Scroll to input area
    setTimeout(() => {
      const inputArea = document.querySelector('[data-input-area]')
      inputArea?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  // Hàm map role sang tiếng Việt
  const getRoleLabel = (role: string | undefined): string => {
    if (!role) return ''
    const roleMap: Record<string, string> = {
      'responsible': 'Chịu trách nhiệm',
      'participant': 'Tham gia',
      'observer': 'Theo dõi'
    }
    return roleMap[role] || role
  }

  // Get all available members for assignment (combines task participants + assignments + project team)
  const getAllAvailableMembers = () => {
    const membersMap = new Map<string, { id: string; name: string; email?: string; role?: string }>()

    // Add members from available employees (project team)
    if (availableEmployees.length > 0) {
      availableEmployees.forEach(emp => {
        if (!membersMap.has(emp.id)) {
          membersMap.set(emp.id, {
            id: emp.id,
            name: emp.name
          })
        }
      })
    }

    // Add members from task assignments
    if (assignments && assignments.length > 0) {
      assignments.forEach(assignment => {
        if (assignment.assigned_to_name && assignment.assigned_to) {
          membersMap.set(assignment.assigned_to, {
            id: assignment.assigned_to,
            name: assignment.assigned_to_name
          })
        }
      })
    }

    // Add members from task participants (đã chuyển từ group members sang task participants)
    const participants = taskData?.participants || []
    if (participants.length > 0) {
      participants.forEach(participant => {
        if (participant.employee_name && participant.employee_id) {
          membersMap.set(participant.employee_id, {
            id: participant.employee_id,
            name: participant.employee_name,
            role: participant.role
          })
        }
      })
    }

    // Add task assignee if not already included
    if (task?.assigned_to_name && task.assigned_to) {
      if (!membersMap.has(task.assigned_to)) {
        membersMap.set(task.assigned_to, {
          id: task.assigned_to,
          name: task.assigned_to_name
        })
      }
    }

    return Array.from(membersMap.values())
  }

  // Get members for mention
  const getMentionMembers = () => {
    const members: Array<{ id: string; name: string; type: 'member' }> = []

    if (assignments && assignments.length > 0) {
      assignments.forEach(assignment => {
        if (assignment.assigned_to_name) {
          members.push({
            id: assignment.assigned_to,
            name: assignment.assigned_to_name,
            type: 'member'
          })
        }
      })
    } else {
      // Sử dụng task participants thay vì group members
      const participants = taskData?.participants || []
      if (participants.length > 0) {
        participants.forEach(participant => {
          if (participant.employee_name) {
            members.push({
              id: participant.employee_id,
              name: participant.employee_name,
              type: 'member'
            })
          }
        })
      } else if (task?.assigned_to_name) {
        members.push({
          id: task.assigned_to || '',
          name: task.assigned_to_name,
          type: 'member'
        })
      }
    }

    return members
  }

  // Get checklist items for mention
  const getMentionChecklistItems = () => {
    const items: Array<{ id: string; name: string; type: 'checklist' }> = []

    checklists?.forEach(checklist => {
      checklist.items?.forEach(item => {
        // Extract display content (without file URLs)
        let displayContent = item.content || ''
        const fileUrlsMatch = displayContent.match(/\[FILE_URLS:\s*([^\]]+)\]/)
        if (fileUrlsMatch) {
          displayContent = displayContent.replace(/\[FILE_URLS:[^\]]+\]/g, '').trim()
          displayContent = displayContent.replace(/^📎 \d+ file\(s\)\s*$/g, '').trim()
        }

        if (displayContent) {
          items.push({
            id: item.id,
            name: displayContent.length > 50 ? displayContent.substring(0, 50) + '...' : displayContent,
            type: 'checklist'
          })
        }
      })
    })

    return items
  }

  // Handle mention input
  const handleMentionInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart || 0

    setChatMessage(value)

    // Find @ mention
    const textBeforeCursor = value.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      const query = mentionMatch[1]
      setMentionQuery(query)
      setMentionPosition({
        start: cursorPos - query.length - 1,
        end: cursorPos
      })
      setShowMentionDropdown(true)
    } else {
      setShowMentionDropdown(false)
      setMentionQuery('')
      setMentionPosition(null)
    }
  }

  // Insert mention
  const insertMention = (item: { id: string; name: string; type: 'member' | 'checklist' }) => {
    if (!mentionPosition) return

    const beforeMention = chatMessage.substring(0, mentionPosition.start)
    const afterMention = chatMessage.substring(mentionPosition.end)

    const mentionText = item.type === 'member'
      ? `@${item.name}`
      : `@[${item.name}](checklist:${item.id})`

    const newMessage = beforeMention + mentionText + ' ' + afterMention
    setChatMessage(newMessage)
    setShowMentionDropdown(false)
    setMentionQuery('')
    setMentionPosition(null)

    // Focus back to textarea
    setTimeout(() => {
      mentionInputRef.current?.focus()
      const newCursorPos = beforeMention.length + mentionText.length + 1
      mentionInputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Filter mention options
  const getFilteredMentions = () => {
    const members = getMentionMembers()
    const checklistItems = getMentionChecklistItems()

    const allMentions = [
      ...members,
      ...checklistItems
    ]

    if (!mentionQuery) return allMentions

    const query = mentionQuery.toLowerCase()
    return allMentions.filter(item =>
      item.name.toLowerCase().includes(query)
    )
  }

  const handleTogglePin = async (comment: TaskComment) => {
    try {
      await apiPut(`/api/tasks/comments/${comment.id}`, { is_pinned: !comment.is_pinned })
      // Only reload comments, not the entire task
      loadComments()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể ghim tin nhắn'))
    }
  }

  const handleDeleteComment = async (comment: TaskComment) => {
    const hasAttachment = !!comment.file_url
    const confirmMessage = hasAttachment
      ? 'Xóa tin nhắn này và file đính kèm khỏi hệ thống?'
      : 'Xóa tin nhắn này?'
    if (!confirm(confirmMessage)) return
    try {
      await apiDelete(`/api/tasks/comments/${comment.id}`)
      // Only reload comments, not the entire task
      loadComments()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể xóa tin nhắn'))
    }
  }

  const filteredComments = useMemo(() => {
    if (!taskData?.comments) return []
    // Only show top-level comments (no parent_id)
    const topLevelComments = taskData.comments.filter(comment => !comment.parent_id)
    if (chatFilter === 'pinned') {
      return topLevelComments.filter(comment => comment.is_pinned)
    }
    return topLevelComments
  }, [taskData, chatFilter])

  const pendingAttachmentName = pendingFiles.length
    ? (pendingFiles.length === 1
      ? `${pendingFiles[0].name} (${formatFileSize(pendingFiles[0].size)})`
      : `${pendingFiles.length} file đã chọn`)
    : null
  const pinnedCount = taskData?.comments.filter(comment => comment.is_pinned).length ?? 0

  if (!taskId) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-black">Không tìm thấy nhiệm vụ</div>
  }

  if (loadingUser || loadingTask) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-black">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Đang tải dữ liệu nhiệm vụ...</p>
            </div>
          </div>
        </LayoutWithSidebar>
      </div>
    )
  }

  if (error || !taskData) {
    return (
      <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error || 'Không tìm thấy dữ liệu nhiệm vụ'}
          </div>
          <button
            onClick={() => router.push('/tasks')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách nhiệm vụ
          </button>
        </div>
      </LayoutWithSidebar>
    )
  }

  const { task, attachments, participants, checklists, notes, assignments } = taskData

  const canEditNote = (note: TaskNote) => note.created_by === user?.id
  const canManageComment = (comment: TaskComment) =>
    comment.user_id === user?.id || canModerateComments

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Navigation / Header */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/tasks')}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm breadcrumbs text-gray-500">
            <span>Tasks</span>
            <span>/</span>
            <span className="font-medium text-gray-900 max-w-[200px] truncate">{task?.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Task Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditTask}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors"
              title="Chỉnh sửa nhiệm vụ"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDeleteTask}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
              title="Xóa nhiệm vụ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {/* User Profile */}
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Main Layout with Resizable Panels */}
      <div ref={mainChatContainerRef} className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

        {/* LEFT COLUMN: INFO */}
        {showLeftSidebar && (
          <aside
            className="hidden lg:flex flex-col border-r border-gray-200 bg-gray-50/50 min-h-0 relative flex-shrink-0"
            style={{ width: leftColumnWidth, minWidth: 240, maxWidth: 520 }}
          >
            <button
              onClick={() => setShowLeftSidebar(false)}
              className="absolute top-4 right-4 z-10 p-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600 transition-colors shadow-sm"
              title="Ẩn sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              {/* Title & Status */}
              <div className="pb-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{task?.title}</h1>
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Status Dropdown */}
                  <div className="relative">
                    <select
                      value={task?.status || 'todo'}
                      onChange={async (e) => {
                        const newStatus = e.target.value as TaskStatus
                        if (task && newStatus !== task.status && !updatingStatus) {
                          try {
                            setUpdatingStatus(true)
                            await apiPut(`/api/tasks/${task.id}`, {
                              status: newStatus
                            })
                            // Refresh task data
                            await loadTaskDetails()
                          } catch (err: any) {
                            console.error('Error updating task status:', err)
                            alert(err.message || 'Không thể cập nhật trạng thái nhiệm vụ')
                            // Revert select value on error
                            e.target.value = task.status
                          } finally {
                            setUpdatingStatus(false)
                          }
                        }
                      }}
                      disabled={updatingStatus}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${COLOR_BADGES[task?.status || 'todo']}`}
                    >
                      <option value="todo" className="bg-white text-gray-900">TODO</option>
                      <option value="in_progress" className="bg-white text-gray-900">IN PROGRESS</option>
                      <option value="completed" className="bg-white text-gray-900">COMPLETED</option>
                      <option value="cancelled" className="bg-white text-gray-900">CANCELLED</option>
                    </select>
                    {updatingStatus && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${PRIORITY_COLORS[task?.priority || 'medium']}`}>
                    {task?.priority?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Meta Info List */}
              <div className="space-y-4 pt-4">

                <div className="flex items-center gap-3 text-sm pb-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Hạn chót</p>
                    <p className={`font-medium ${task?.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(task?.due_date, true)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm pb-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Thời gian</p>
                    <p className="font-medium text-gray-900">
                      {(() => {
                        const timeRemaining = calculateTimeRemaining(task?.due_date)
                        const timeLimit = formatTimeLimit(task?.estimated_time)

                        if (timeRemaining !== null) {
                          const remainingText = timeRemaining >= 0 ? `${timeRemaining}h` : `-${Math.abs(timeRemaining)}h`
                          return `${remainingText} / ${timeLimit}`
                        }
                        return `Chưa đặt / ${timeLimit}`
                      })()}
                    </p>
                  </div>
                </div>

                {/* Nhân viên được gán */}
                <div className="flex items-start gap-3 text-sm pb-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Nhân viên được gán</p>
                      <button
                        onClick={() => setShowAssignEmployeeDropdown(!showAssignEmployeeDropdown)}
                        className="flex items-center gap-1 text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Gán nhân viên</span>
                      </button>
                    </div>

                    {/* Dropdown để chọn nhân viên */}
                    {showAssignEmployeeDropdown && (
                      <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                        <select
                          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                          onChange={async (e) => {
                            const employeeId = e.target.value
                            if (employeeId && taskId) {
                              try {
                                await apiPost(`/api/tasks/${taskId}/participants`, {
                                  employee_id: employeeId,
                                  role: 'responsible'
                                })
                                await loadTaskDetails()
                                setShowAssignEmployeeDropdown(false)
                              } catch (err: any) {
                                console.error('Failed to assign employee:', err)
                                alert(err.message || 'Không thể gán nhân viên')
                              }
                            }
                            e.target.value = ''
                          }}
                        >
                          <option value="">Chọn nhân viên...</option>
                          {getAllAvailableMembers().filter(member => {
                            // Lọc ra những nhân viên chưa được gán
                            const isAssigned = assignments?.some(a => a.assigned_to === member.id) ||
                              participants?.some(p => p.employee_id === member.id)
                            return !isAssigned
                          }).map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} {member.role ? `(${getRoleLabel(member.role)})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Hiển thị assignments từ task_assignments */}
                    {assignments && assignments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs"
                          >
                            <User className="h-3 w-3 text-blue-600" />
                            <span className="text-gray-700 font-medium">{assignment.assigned_to_name || 'Nhân viên'}</span>
                            <button
                              onClick={async () => {
                                if (confirm('Bạn có chắc muốn bỏ gán nhân viên này?')) {
                                  try {
                                    // Tìm participant tương ứng để xóa
                                    const participant = participants?.find(p => p.employee_id === assignment.assigned_to)
                                    if (participant) {
                                      await apiDelete(`/api/tasks/participants/${participant.id}`)
                                      await loadTaskDetails()
                                    }
                                  } catch (err: any) {
                                    console.error('Failed to remove assignment:', err)
                                    alert(err.message || 'Không thể bỏ gán nhân viên')
                                  }
                                }
                              }}
                              className="ml-1 text-gray-400 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : participants && participants.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {participants.map((participant) => {
                          const getRoleLabel = (role: string) => {
                            const roleLabels: Record<string, string> = {
                              'responsible': 'Thực hiện',
                              'participant': 'Tham gia',
                              'observer': 'Theo dõi'
                            }
                            return roleLabels[role] || role
                          }
                          return (
                            <div
                              key={participant.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs"
                            >
                              <User className="h-3 w-3 text-blue-600" />
                              <span className="text-gray-700 font-medium">{participant.employee_name || 'Nhân viên'}</span>
                              {participant.role && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600">{getRoleLabel(participant.role)}</span>
                                </>
                              )}
                              <button
                                onClick={async () => {
                                  if (confirm('Bạn có chắc muốn bỏ gán nhân viên này?')) {
                                    try {
                                      await apiDelete(`/api/tasks/participants/${participant.id}`)
                                      await loadTaskDetails()
                                    } catch (err: any) {
                                      console.error('Failed to remove participant:', err)
                                      alert(err.message || 'Không thể bỏ gán nhân viên')
                                    }
                                  }
                                }}
                                className="ml-1 text-gray-400 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : task?.assigned_to_name ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs">
                        <User className="h-3 w-3 text-blue-600" />
                        <span className="text-gray-700 font-medium">{task.assigned_to_name}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Chưa có nhân viên được gán</p>
                    )}
                  </div>
                </div>

                {/* Project Status (if task has project) */}
                {project && projectStatuses.length > 0 && (
                  <div className="flex items-center gap-3 text-sm pb-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                      <CheckSquare className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-2">Trạng thái dự án</p>
                      <div className="relative">
                        <select
                          value={project.status_id || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleUpdateProjectStatus(e.target.value)
                            }
                          }}
                          disabled={updatingProjectStatus}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-medium bg-white text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="" className="text-black">Chọn trạng thái...</option>
                          {projectStatuses.map((status) => (
                            <option key={status.id} value={status.id} className="text-black">
                              {status.name}
                            </option>
                          ))}
                        </select>
                        {updatingProjectStatus && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                          </div>
                        )}
                      </div>
                      {project.name && (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-gray-400">
                            Dự án: <a href={`/projects/${project.id}`} className="text-blue-600 hover:underline font-medium">{project.name}</a>
                          </p>
                          {project.customer_name && (
                            <p className="text-xs text-gray-400">
                              Khách hàng: <span className="text-gray-600 font-medium">{project.customer_name}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>


              {/* Group Info (if exists) */}
              {task?.group_id && task?.group_name && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nhóm</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEditGroup}
                        className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                        title="Chỉnh sửa nhóm"
                      >
                        <Edit className="h-3 w-3" />
                        Sửa
                      </button>
                      <button
                        onClick={handleDeleteGroup}
                        className="px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                        title="Xóa nhóm"
                      >
                        <Trash2 className="h-3 w-3" />
                        Xóa
                      </button>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-sm font-semibold text-gray-900">{task.group_name}</p>
                  </div>
                </div>
              )}

              {/* Attachments (Compact) */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tài liệu</h3>
                  <label className="text-xs text-blue-600 hover:underline cursor-pointer">
                    {uploadingAttachment ? 'Đang tải...' : 'Thêm'}
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length > 0) {
                          await handleUploadAttachments(files)
                        }
                        // Reset input để có thể chọn lại cùng file
                        e.target.value = ''
                      }}
                      disabled={uploadingAttachment}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  {attachments?.map(file => {
                    const displayName = getDisplayFileName(file)
                    const isImage = file.file_type?.startsWith('image/')
                    const iconPath = getFileIconPath(file.file_type || '', displayName)
                    const FileIconComponent = iconPath ? null : getFileIconComponent(file.file_type || '')
                    return (
                      <div key={file.id} className="group relative">
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                          {isImage ? (
                            <img src={file.file_url} alt={displayName} className="h-10 w-10 object-cover rounded flex-shrink-0" />
                          ) : iconPath ? (
                            <img src={iconPath} alt={displayName} className="h-10 w-10 object-contain rounded flex-shrink-0" />
                          ) : (
                            <FileIconComponent className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          )}
                          <span className="text-sm text-gray-700 truncate flex-1" title={displayName}>{displayName}</span>
                          <Download className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                        </a>
                        <button
                          onClick={async () => {
                            if (confirm('Bạn có chắc muốn xóa file này?')) {
                              try {
                                await apiDelete(`/api/tasks/attachments/${file.id}`)
                                loadTaskDetails()
                              } catch (err) {
                                alert(getErrorMessage(err, 'Không thể xóa file'))
                              }
                            }
                          }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
                          title="Xóa file"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                  {attachments?.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có tài liệu</p>}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Left Sidebar Toggle Button (when hidden) */}
        {!showLeftSidebar && (
          <button
            onClick={() => setShowLeftSidebar(true)}
            className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white border border-r-0 border-gray-300 rounded-r-md hover:bg-gray-50 text-gray-600 transition-colors shadow-md"
            title="Hiện sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Left Resize Handle */}
        {showLeftSidebar && (
          <div
            className="hidden lg:flex items-center justify-center w-2 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors relative group select-none"
            onMouseDown={(e) => {
              e.preventDefault()
              startResize('left', e)
            }}
            title="Kéo để thay đổi kích thước"
            style={{ userSelect: 'none' }}
          >
            <div className="w-0.5 h-12 bg-gray-400 group-hover:bg-white rounded-full transition-colors"></div>
          </div>
        )}

        {/* MIDDLE COLUMN */}
        <main
          ref={middleColumnRef}
          className="flex flex-col bg-white relative min-w-0"
          style={{
            flex: mainChatRatio,
            minWidth: '300px'
          }}
        >

          {/* TOP HALF: CHECKLISTS & DESCRIPTION */}
          <div
            className="flex flex-col min-h-0 border-b border-gray-200 p-6 custom-scrollbar space-y-6 bg-white overflow-y-auto"
            style={{ flex: showNotesSection ? middleSplitRatio : 1, minHeight: 220 }}
          >
            {/* Description */}
            {task?.description && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" /> Mô tả
                </h3>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {task.description}
                </div>
              </div>
            )}

            {/* Checklists */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" /> Việc cần làm
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tên nhóm việc..."
                    value={newChecklistTitle}
                    onChange={(e) => {
                      setNewChecklistTitle(e.target.value)
                      if (checklistError) setChecklistError(null)
                    }}
                    className={`px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 text-black placeholder:text-gray-500 ${checklistError ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <button onClick={handleCreateChecklist} className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {checklistError && (
                  <p className="text-red-600 text-xs mt-1">{checklistError}</p>
                )}
              </div>

              <div className="space-y-4">
                {checklists?.map(checklist => (
                  <div key={checklist.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-800 text-sm">{checklist.title}</span>
                      <span className="text-xs text-gray-500">{Math.round((checklist.progress || 0) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(checklist.progress || 0) * 100}%` }} />
                    </div>

                    <div className="space-y-2">
                      {checklist.items.map(item => (
                        <div key={item.id} data-checklist-item-id={item.id} className="group flex items-start gap-3 py-1.5 hover:bg-gray-50 rounded-md px-2 -mx-2 transition-colors">
                          <button
                            onClick={() => handleToggleChecklistItem(item)}
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.is_completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-500'}`}
                          >
                            {item.is_completed && <Check className="h-3 w-3 text-white" />}
                          </button>
                          {editingChecklistItemId === item.id ? (
                            <div className="flex-1 space-y-2">
                              {/* Preview existing files */}
                              {editingChecklistItemFileUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {editingChecklistItemFileUrls.map((url, idx) => {
                                    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i) || url.includes('image') || url.includes('storage')
                                    return (
                                      <div key={idx} className="relative group/file">
                                        {isImage ? (
                                          <img src={url} alt={`File ${idx + 1}`} className="h-16 w-16 object-cover rounded border border-gray-200" />
                                        ) : (
                                          <div className="h-16 w-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                            <Paperclip className="h-6 w-6 text-gray-400" />
                                          </div>
                                        )}
                                        <button
                                          onClick={() => {
                                            const newUrls = [...editingChecklistItemFileUrls]
                                            newUrls.splice(idx, 1)
                                            setEditingChecklistItemFileUrls(newUrls)
                                          }}
                                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 opacity-0 group-hover/file:opacity-100 transition-opacity"
                                          title="Xóa file"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Preview new files */}
                              {editingChecklistItemPreviews.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {editingChecklistItemPreviews.map((preview, idx) => {
                                    const file = editingChecklistItemFiles[idx]
                                    const isImage = file?.type.startsWith('image/')
                                    return (
                                      <div key={idx} className="relative inline-block">
                                        {isImage ? (
                                          <img src={preview} alt={file.name} className="h-16 w-16 object-cover rounded border border-gray-200" />
                                        ) : (
                                          <div className="h-16 w-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                            <Paperclip className="h-6 w-6 text-gray-400" />
                                          </div>
                                        )}
                                        <button
                                          onClick={() => {
                                            const newFiles = [...editingChecklistItemFiles]
                                            const newPreviews = [...editingChecklistItemPreviews]
                                            newFiles.splice(idx, 1)
                                            newPreviews.splice(idx, 1)
                                            setEditingChecklistItemFiles(newFiles)
                                            setEditingChecklistItemPreviews(newPreviews)
                                          }}
                                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                        {!isImage && (
                                          <p className="text-[10px] text-gray-600 mt-1 truncate max-w-[64px]" title={file?.name}>
                                            {file?.name}
                                          </p>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <label className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer" title="Thêm file/hình">
                                  <Paperclip className="h-4 w-4" />
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || [])
                                      if (files.length > 0) {
                                        const newFiles = [...editingChecklistItemFiles, ...files]
                                        setEditingChecklistItemFiles(newFiles)

                                        // Create previews for images
                                        files.forEach(file => {
                                          if (file.type.startsWith('image/')) {
                                            const reader = new FileReader()
                                            reader.onload = (e) => {
                                              const result = e.target?.result as string
                                              setEditingChecklistItemPreviews(prev => [...prev, result])
                                            }
                                            reader.readAsDataURL(file)
                                          } else {
                                            setEditingChecklistItemPreviews(prev => [...prev, ''])
                                          }
                                        })
                                      }
                                      e.target.value = ''
                                    }}
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={editingChecklistItemContent}
                                  onChange={(e) => setEditingChecklistItemContent(e.target.value)}
                                  className="flex-1 text-sm bg-white border border-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                  placeholder="Nhập nội dung..."
                                />
                                <button
                                  onClick={handleSaveChecklistItem}
                                  disabled={uploadingEditChecklistItem}
                                  className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                                >
                                  {uploadingEditChecklistItem ? 'Đang lưu...' : 'Lưu'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingChecklistItemId(null)
                                    setEditingChecklistItemContent('')
                                    setEditingChecklistItemFiles([])
                                    setEditingChecklistItemFileUrls([])
                                    setEditingChecklistItemPreviews([])
                                  }}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 space-y-2">
                              {(() => {
                                // Parse file URLs from content
                                const fileUrls: string[] = []
                                let displayContent = item.content || ''

                                // Debug: log original content
                                if (item.content && item.content.includes('FILE_URLS')) {
                                  console.log('Parsing checklist item content:', item.content)
                                }

                                // Extract file URLs from [FILE_URLS: ...] pattern
                                const fileUrlsMatch = displayContent.match(/\[FILE_URLS:\s*([^\]]+)\]/)
                                if (fileUrlsMatch) {
                                  const urlsText = fileUrlsMatch[1].trim()
                                  // Split by space, but handle URLs that might have spaces in query params
                                  const urls = urlsText.split(/\s+/).filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')))
                                  fileUrls.push(...urls)
                                  console.log('Extracted file URLs:', fileUrls)

                                  // Remove the [FILE_URLS: ...] pattern from display content
                                  displayContent = displayContent.replace(/\[FILE_URLS:[^\]]+\]/g, '').trim()
                                  // Remove "📎 X file(s)" if it's the only content
                                  displayContent = displayContent.replace(/^📎 \d+ file\(s\)\s*$/g, '').trim()
                                }

                                // Get assignments for this item (from item.assignments or from taskData)
                                const itemAssignments = (item as any).assignments || []

                                // Debug log - always log to check
                                console.log('Checklist Item:', {
                                  id: item.id,
                                  content: item.content?.substring(0, 50),
                                  hasAssignments: !!(item as any).assignments,
                                  assignmentsCount: itemAssignments.length,
                                  assignments: itemAssignments
                                })

                                return (
                                  <>
                                    {/* Content text */}
                                    {displayContent && (
                                      <span className={`text-sm leading-snug block ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {displayContent}
                                      </span>
                                    )}

                                    {/* Display assigned employees */}
                                    {itemAssignments && Array.isArray(itemAssignments) && itemAssignments.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {itemAssignments.map((assignment: any, idx: number) => {
                                          const employeeId = assignment.employee_id || assignment.assignee_id
                                          const employeeName = assignment.employee_name || assignment.assignee_name
                                          const responsibilityType = assignment.responsibility_type || assignment.role

                                          // Use employee_name directly if available, otherwise find from available members
                                          let employee: { id: string; name: string } | null = null

                                          if (employeeName && employeeId) {
                                            employee = { id: employeeId, name: employeeName }
                                          } else {
                                            employee = getAllAvailableMembers().find(m => m.id === employeeId) || null
                                          }

                                          if (!employee) {
                                            console.warn('Employee not found for assignment:', assignment)
                                            return null
                                          }

                                          const responsibilityLabels: Record<string, string> = {
                                            accountable: 'Chịu trách nhiệm',
                                            responsible: 'Thực hiện',
                                            consulted: 'Tư vấn',
                                            informed: 'Thông báo'
                                          }

                                          return (
                                            <div
                                              key={`${item.id}-assignment-${idx}`}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md text-xs"
                                            >
                                              <User className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                              <span className="text-gray-700 font-medium">{employee.name}</span>
                                              {responsibilityType && (
                                                <>
                                                  <span className="text-gray-400">•</span>
                                                  <span className="text-gray-600">{responsibilityLabels[responsibilityType] || responsibilityType}</span>
                                                </>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}

                                    {/* Display files/images */}
                                    {fileUrls.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {fileUrls.map((url, idx) => {
                                          const fileName = url.split('/').pop()?.split('?')[0] || ''
                                          // Detect file type from extension
                                          const extension = fileName.split('.').pop()?.toLowerCase() || ''
                                          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension) ||
                                            url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i) ||
                                            url.includes('image')

                                          // Get MIME type from extension
                                          const getMimeType = (ext: string): string => {
                                            const mimeTypes: Record<string, string> = {
                                              'pdf': 'application/pdf',
                                              'xls': 'application/vnd.ms-excel',
                                              'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                              'doc': 'application/msword',
                                              'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                              'txt': 'text/plain',
                                              'csv': 'text/csv'
                                            }
                                            return mimeTypes[ext] || ''
                                          }

                                          const fileType = getMimeType(extension)
                                          const iconPath = !isImage ? getFileIconPath(fileType, fileName) : null
                                          const FileIconComponent = !isImage && !iconPath ? getFileIconComponent(fileType) : null

                                          return (
                                            <div key={idx} className="relative group/file">
                                              {isImage ? (
                                                <a
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="block"
                                                >
                                                  <img
                                                    src={url}
                                                    alt={`Attachment ${idx + 1}`}
                                                    className="h-20 w-20 object-cover rounded border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                                                    onError={(e) => {
                                                      // Fallback to file icon if image fails to load
                                                      const target = e.currentTarget
                                                      target.style.display = 'none'
                                                      const parent = target.parentElement
                                                      if (parent) {
                                                        const fallback = document.createElement('div')
                                                        fallback.className = 'h-20 w-20 rounded border border-gray-200 bg-gray-50 flex items-center justify-center'
                                                        fallback.innerHTML = '<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>'
                                                        parent.appendChild(fallback)
                                                      }
                                                    }}
                                                  />
                                                </a>
                                              ) : (
                                                <a
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-colors"
                                                >
                                                  {iconPath ? (
                                                    <img src={iconPath} alt={fileName} className="h-5 w-5 object-contain flex-shrink-0" onError={(e) => {
                                                      // Fallback if icon image fails to load
                                                      e.currentTarget.style.display = 'none'
                                                      const parent = e.currentTarget.parentElement
                                                      if (parent && FileIconComponent) {
                                                        const iconEl = document.createElement('div')
                                                        iconEl.className = 'flex-shrink-0'
                                                        parent.insertBefore(iconEl, e.currentTarget.nextSibling)
                                                      }
                                                    }} />
                                                  ) : FileIconComponent ? (
                                                    <FileIconComponent className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                                  ) : (
                                                    <Paperclip className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                                  )}
                                                  <span className="text-xs text-gray-700 font-medium truncate max-w-[100px]" title={fileName}>
                                                    {fileName || `File ${idx + 1}`}
                                                  </span>
                                                  <Download className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                                </a>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditChecklistItem(item)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Chỉnh sửa việc cần làm"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDeleteChecklistItem(item.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Xóa việc cần làm">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Item Input */}
                      <div className="px-2 py-1.5 mt-1 space-y-2">
                        {/* Preview files */}
                        {(checklistItemPreviews[checklist.id] || []).length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {checklistItemPreviews[checklist.id].map((preview, idx) => {
                              const file = checklistItemFiles[checklist.id]?.[idx]
                              const isImage = file?.type.startsWith('image/')
                              const iconPath = !isImage && file ? getFileIconPath(file.type || '', file.name) : null
                              const FileIconComponent = !isImage && !iconPath ? getFileIconComponent(file?.type || '') : null
                              return (
                                <div key={idx} className="relative inline-block">
                                  {isImage ? (
                                    <img src={preview} alt={file.name} className="h-16 w-16 object-cover rounded border border-gray-200" />
                                  ) : (
                                    <div className="h-16 w-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                                      {iconPath ? (
                                        <img src={iconPath} alt={file.name} className="h-10 w-10 object-contain" />
                                      ) : FileIconComponent ? (
                                        <FileIconComponent className="h-6 w-6 text-gray-400" />
                                      ) : (
                                        <Paperclip className="h-6 w-6 text-gray-400" />
                                      )}
                                    </div>
                                  )}
                                  <button
                                    onClick={() => {
                                      const newFiles = [...(checklistItemFiles[checklist.id] || [])]
                                      const newPreviews = [...(checklistItemPreviews[checklist.id] || [])]
                                      newFiles.splice(idx, 1)
                                      newPreviews.splice(idx, 1)
                                      setChecklistItemFiles(prev => ({ ...prev, [checklist.id]: newFiles }))
                                      setChecklistItemPreviews(prev => ({ ...prev, [checklist.id]: newPreviews }))
                                    }}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                  {!isImage && (
                                    <p className="text-[10px] text-gray-600 mt-1 truncate max-w-[64px]" title={file?.name}>
                                      {file?.name}
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <label className="p-1 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer" title="Thêm file/hình">
                            <Paperclip className="h-4 w-4" />
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                if (files.length > 0) {
                                  const newFiles = [...(checklistItemFiles[checklist.id] || []), ...files]
                                  setChecklistItemFiles(prev => ({ ...prev, [checklist.id]: newFiles }))

                                  // Create previews for images
                                  const newPreviews = [...(checklistItemPreviews[checklist.id] || [])]
                                  files.forEach(file => {
                                    if (file.type.startsWith('image/')) {
                                      const reader = new FileReader()
                                      reader.onload = (e) => {
                                        const result = e.target?.result as string
                                        setChecklistItemPreviews(prev => {
                                          const current = prev[checklist.id] || []
                                          return { ...prev, [checklist.id]: [...current, result] }
                                        })
                                      }
                                      reader.readAsDataURL(file)
                                    } else {
                                      newPreviews.push('')
                                    }
                                  })
                                  if (files.some(f => !f.type.startsWith('image/'))) {
                                    setChecklistItemPreviews(prev => {
                                      const current = prev[checklist.id] || []
                                      return { ...prev, [checklist.id]: [...current, ...files.filter(f => !f.type.startsWith('image/')).map(() => '')] }
                                    })
                                  }
                                }
                                e.target.value = ''
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddChecklistItem(checklist.id)}
                            disabled={uploadingChecklistItem === checklist.id}
                            className="p-1 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                            title="Thêm việc cần làm"
                          >
                            {uploadingChecklistItem === checklist.id ? (
                              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </button>
                          <input
                            type="text"
                            placeholder="Thêm việc cần làm..."
                            className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-black placeholder:text-gray-500"
                            value={checklistItemsDraft[checklist.id] || ''}
                            onChange={(e) => setChecklistItemsDraft(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleAddChecklistItem(checklist.id)
                              }
                            }}
                          />
                          {/* Send Button */}
                          <button
                            type="button"
                            onClick={() => handleAddChecklistItem(checklist.id)}
                            disabled={
                              uploadingChecklistItem === checklist.id ||
                              (!checklistItemsDraft[checklist.id]?.trim() &&
                                (checklistItemFiles[checklist.id] || []).length === 0 &&
                                (checklistItemAssignments[checklist.id] || []).length === 0)
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Gửi việc cần làm"
                          >
                            {uploadingChecklistItem === checklist.id ? (
                              <>
                                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Đang gửi...</span>
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5" />
                                <span>Gửi</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Assignment Section */}
                        <div className="relative flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setShowAssignmentDropdown(prev => ({ ...prev, [checklist.id]: !prev[checklist.id] }))}
                            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                            title="Thêm nhân viên chịu trách nhiệm"
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>Gán nhân viên</span>
                            {(checklistItemAssignments[checklist.id] || []).length > 0 && (
                              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {(checklistItemAssignments[checklist.id] || []).length}
                              </span>
                            )}
                          </button>

                          {/* Selected Assignments Display */}
                          {(checklistItemAssignments[checklist.id] || []).length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(checklistItemAssignments[checklist.id] || []).map((assignment, idx) => {
                                const member = getAllAvailableMembers().find(m => m.id === assignment.employee_id)
                                const responsibilityLabels: Record<string, string> = {
                                  accountable: 'Chịu trách nhiệm',
                                  responsible: 'Thực hiện',
                                  consulted: 'Tư vấn',
                                  informed: 'Thông báo'
                                }
                                return member ? (
                                  <div key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md text-xs">
                                    <span className="text-gray-700 font-medium">{member.name}</span>
                                    {member.role && (
                                      <>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500 italic">{getRoleLabel(member.role)}</span>
                                      </>
                                    )}
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-600">{responsibilityLabels[assignment.responsibility_type] || assignment.responsibility_type}</span>
                                    <button
                                      onClick={() => {
                                        const newAssignments = (checklistItemAssignments[checklist.id] || []).filter((_, i) => i !== idx)
                                        setChecklistItemAssignments(prev => ({ ...prev, [checklist.id]: newAssignments }))
                                      }}
                                      className="ml-1 text-gray-400 hover:text-red-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : null
                              })}
                            </div>
                          )}

                          {/* Assignment Dropdown */}
                          {showAssignmentDropdown[checklist.id] && (
                            <div className="absolute top-full left-0 z-50 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Chọn nhân viên</label>
                                  <select
                                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                    onChange={(e) => {
                                      const employeeId = e.target.value
                                      if (employeeId) {
                                        const currentAssignments = checklistItemAssignments[checklist.id] || []
                                        // Check if already assigned
                                        if (!currentAssignments.find(a => a.employee_id === employeeId)) {
                                          setChecklistItemAssignments(prev => ({
                                            ...prev,
                                            [checklist.id]: [...currentAssignments, { employee_id: employeeId, responsibility_type: 'responsible' }]
                                          }))
                                        }
                                        e.target.value = ''
                                      }
                                    }}
                                  >
                                    <option value="">-- Chọn nhân viên --</option>
                                    {getAllAvailableMembers().map(member => (
                                      <option key={member.id} value={member.id}>
                                        {member.name} {member.role ? `- ${getRoleLabel(member.role)}` : ''} {member.email ? `(${member.email})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {(checklistItemAssignments[checklist.id] || []).length > 0 && (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phân công nhiệm vụ</label>
                                    <div className="space-y-2">
                                      {(checklistItemAssignments[checklist.id] || []).map((assignment, idx) => {
                                        const member = getAllAvailableMembers().find(m => m.id === assignment.employee_id)
                                        return member ? (
                                          <div key={idx} className="flex items-center gap-2">
                                            <div className="flex-1">
                                              <span className="text-xs text-gray-700 font-medium">{member.name}</span>
                                              {member.role && (
                                                <span className="text-xs text-gray-500 ml-1 italic">({getRoleLabel(member.role)})</span>
                                              )}
                                            </div>
                                            <select
                                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                                              value={assignment.responsibility_type}
                                              onChange={(e) => {
                                                const newAssignments = [...(checklistItemAssignments[checklist.id] || [])]
                                                newAssignments[idx].responsibility_type = e.target.value as 'accountable' | 'responsible' | 'consulted' | 'informed'
                                                setChecklistItemAssignments(prev => ({ ...prev, [checklist.id]: newAssignments }))
                                              }}
                                            >
                                              <option value="accountable">Chịu trách nhiệm</option>
                                              <option value="responsible">Thực hiện</option>
                                              <option value="consulted">Tư vấn</option>
                                              <option value="informed">Thông báo</option>
                                            </select>
                                          </div>
                                        ) : null
                                      })}
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end pt-2 border-t border-gray-200">
                                  <button
                                    onClick={() => setShowAssignmentDropdown(prev => ({ ...prev, [checklist.id]: false }))}
                                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    Xong
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {checklists?.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-sm text-gray-500">Chưa có công việc nào.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Resize Handle */}
          {showNotesSection && (
            <div
              className="hidden lg:block h-1 bg-gray-200 hover:bg-gray-300 cursor-row-resize"
              onMouseDown={(e) => startResize('middle', e)}
            ></div>
          )}

          {/* BOTTOM HALF: NOTES */}
          {showNotesSection ? (
            <div
              className="flex min-h-0 flex-col border-t border-gray-200 bg-white overflow-y-auto"
              style={{ flex: 1 - middleSplitRatio, minHeight: 220 }}
            >
              <div className="p-4 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-bold text-gray-900">Ghi chú nhanh</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {!showAddNote && (
                      <button
                        onClick={() => setShowAddNote(true)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm ghi chú
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotesSection(false)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      title="Ẩn ghi chú"
                    >
                      <ChevronRight className="h-4 w-4 rotate-90" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Note */}
              {showAddNote && (
                <div className="p-4 border-b border-gray-200 bg-white shrink-0">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-yellow-400 transition-all">
                    <textarea
                      placeholder="Viết ghi chú mới..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full text-sm border-none focus:ring-0 resize-none p-0 text-black placeholder:text-gray-500"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setShowAddNote(false)
                          setNewNote('')
                        }}
                        className="text-xs font-semibold text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={async () => {
                          await handleCreateNote()
                          setShowAddNote(false)
                        }}
                        disabled={!newNote.trim()}
                        className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                      >
                        Lưu ghi chú
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0 bg-white">
                {notes?.map(note => (
                  <div key={note.id} className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-4 hover:shadow-sm transition-shadow group relative">
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          className="w-full text-sm bg-white border-yellow-200 rounded-md p-2 focus:ring-yellow-400 text-black placeholder:text-gray-500"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingNoteId(null)} className="text-xs text-gray-500">Hủy</button>
                          <button onClick={handleSaveNote} className="text-xs font-semibold text-blue-600">Lưu</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900 font-medium whitespace-pre-line leading-relaxed">{note.content}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(note.created_at)}</span>
                          {canEditNote(note) && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditNote(note)} className="hover:text-blue-600">Sửa</button>
                              <button onClick={() => handleDeleteNote(note.id)} className="hover:text-red-600">Xóa</button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {notes?.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <StickyNote className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">Chưa có ghi chú nào</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 bg-white shrink-0 flex items-center justify-center py-1.5">
              <button
                onClick={() => setShowNotesSection(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Hiện ghi chú"
              >
                <ChevronRight className="h-4 w-4 -rotate-90" />
              </button>
            </div>
          )}
        </main>

        {/* Right Resize Handle (between main and chat) */}
        {showRightSidebar && (
          <div
            className="hidden lg:flex items-center justify-center w-2 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors relative group select-none"
            onMouseDown={(e) => {
              e.preventDefault()
              startResize('main-chat', e)
            }}
            title="Kéo để thay đổi kích thước (tối đa 5:5)"
            style={{ userSelect: 'none' }}
          >
            <div className="w-0.5 h-12 bg-gray-400 group-hover:bg-white rounded-full transition-colors"></div>
          </div>
        )}

        {/* RIGHT COLUMN: CHAT */}
        {showRightSidebar && (
          <aside
            className="hidden lg:flex flex-col border-l border-gray-200 bg-white min-h-0 relative"
            style={{
              flex: 1 - mainChatRatio,
              minWidth: '240px',
              flexShrink: 0
            }}
          >
            <button
              onClick={() => setShowRightSidebar(false)}
              className="absolute top-3 left-3 z-10 p-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-gray-500 transition-colors shadow-sm"
              title="Ẩn sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="h-full flex flex-col">
              {/* Header - Zalo Style */}
              <div className="px-4 py-3 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">Trao đổi</h2>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowInfoPanel(!showInfoPanel)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                      title="Thông tin hội thoại"
                    >
                      <ChevronLeft className={`h-4 w-4 transition-transform ${showInfoPanel ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => setChatFilter(chatFilter === 'all' ? 'pinned' : 'all')}
                      className={`p-2 rounded-full transition-colors ${chatFilter === 'pinned' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                      title={chatFilter === 'pinned' ? 'Xem tất cả' : 'Chỉ xem ghim'}
                    >
                      <Pin className={`h-4 w-4 ${chatFilter === 'pinned' ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Info Panel */}
              {showInfoPanel && (
                <div className="absolute inset-0 bg-white border-l border-gray-200 z-50 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900">Thông tin hội thoại</h3>
                    <button
                      onClick={() => setShowInfoPanel(false)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      title="Đóng"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Members Section */}
                    {(() => {
                      const members: Array<{ id: string; name: string; email?: string }> = []
                      const assignments = taskData?.assignments || []
                      if (assignments && assignments.length > 0) {
                        assignments.forEach(assignment => {
                          if (assignment.assigned_to_name) {
                            members.push({
                              id: assignment.assigned_to,
                              name: assignment.assigned_to_name
                            })
                          }
                        })
                      } else {
                        // Sử dụng task participants thay vì group members
                        const participants = taskData?.participants || []
                        if (participants.length > 0) {
                          participants.forEach(participant => {
                            if (participant.employee_name) {
                              members.push({
                                id: participant.employee_id,
                                name: participant.employee_name
                              })
                            }
                          })
                        } else if (task?.assigned_to_name) {
                          members.push({
                            id: task.assigned_to || '',
                            name: task.assigned_to_name
                          })
                        }
                      }
                      const displayMembers = showAllMembers ? members : members.slice(0, 3)
                      return (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Thành viên</h4>
                          {members.length === 0 ? (
                            <p className="text-sm text-gray-500">Chưa có thành viên</p>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {displayMembers.map((member) => (
                                  <div key={member.id} className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                      {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                      {member.email && (
                                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {members.length > 3 && (
                                <button
                                  onClick={() => setShowAllMembers(!showAllMembers)}
                                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                  {showAllMembers ? 'Ẩn bớt' : `Xem thêm (${members.length - 3})`}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })()}

                    {/* Images Section */}
                    {(() => {
                      const images: Array<{ url: string; comment: TaskComment; date: string }> = []
                      const extractFromComments = (comments: TaskComment[]) => {
                        comments.forEach(comment => {
                          // Check file_url for images
                          if (comment.file_url) {
                            const url = comment.file_url
                            const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i) ||
                              comment.file_name?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)
                            if (isImage) {
                              images.push({
                                url,
                                comment,
                                date: comment.created_at
                              })
                            }
                          }
                          // Extract from FILE_URLS pattern
                          if (comment.comment) {
                            const fileUrlsMatch = comment.comment.match(/\[FILE_URLS:\s*([^\]]+)\]/)
                            if (fileUrlsMatch) {
                              const urls = fileUrlsMatch[1].trim().split(/\s+/)
                              urls.forEach(url => {
                                const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)
                                if (isImage) {
                                  images.push({
                                    url,
                                    comment,
                                    date: comment.created_at
                                  })
                                }
                              })
                            }
                          }
                          if (comment.replies) {
                            extractFromComments(comment.replies)
                          }
                        })
                      }
                      if (taskData?.comments) {
                        extractFromComments(taskData.comments)
                      }
                      const displayImages = showAllImages ? images : images.slice(0, 6)
                      return (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Ảnh/Video</h4>
                          {images.length === 0 ? (
                            <p className="text-sm text-gray-500">Chưa có ảnh/video nào</p>
                          ) : (
                            <>
                              <div className="grid grid-cols-3 gap-2">
                                {displayImages.map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setZoomedImage({ url: img.url, index: idx })}
                                  >
                                    <img
                                      src={img.url}
                                      alt={`Image ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                              {images.length > 6 && (
                                <button
                                  onClick={() => setShowAllImages(!showAllImages)}
                                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                  {showAllImages ? 'Ẩn bớt' : `Xem thêm (${images.length - 6})`}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })()}

                    {/* Files Section */}
                    {(() => {
                      const files: Array<{ url: string; name: string; size?: number; date: string }> = []
                      const extractFromComments = (comments: TaskComment[]) => {
                        comments.forEach(comment => {
                          // Check file_url for non-image files
                          if (comment.file_url && comment.file_name) {
                            const url = comment.file_url
                            const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i) ||
                              comment.file_name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)
                            if (!isImage) {
                              files.push({
                                url,
                                name: comment.file_name,
                                size: comment.file_size,
                                date: comment.created_at
                              })
                            }
                          }
                          // Extract from FILE_URLS pattern
                          if (comment.comment) {
                            const fileUrlsMatch = comment.comment.match(/\[FILE_URLS:\s*([^\]]+)\]/)
                            if (fileUrlsMatch) {
                              const urls = fileUrlsMatch[1].trim().split(/\s+/)
                              urls.forEach(url => {
                                const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)
                                if (!isImage) {
                                  const fileName = url.split('/').pop() || url.split('?')[0] || 'File'
                                  files.push({
                                    url,
                                    name: fileName,
                                    date: comment.created_at
                                  })
                                }
                              })
                            }
                          }
                          if (comment.replies) {
                            extractFromComments(comment.replies)
                          }
                        })
                      }
                      if (taskData?.comments) {
                        extractFromComments(taskData.comments)
                      }
                      const displayFiles = showAllFiles ? files : files.slice(0, 5)
                      return (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">File</h4>
                          {files.length === 0 ? (
                            <p className="text-sm text-gray-500">Chưa có file nào</p>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {displayFiles.map((file, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg">
                                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-900 truncate">{file.name}</p>
                                      {file.size && (
                                        <p className="text-xs text-gray-500">
                                          {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {files.length > 5 && (
                                <button
                                  onClick={() => setShowAllFiles(!showAllFiles)}
                                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                  {showAllFiles ? 'Ẩn bớt' : `Xem thêm (${files.length - 5})`}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })()}

                    {/* Links Section */}
                    {(() => {
                      const links: Array<{ url: string; title?: string; date: string }> = []
                      const urlRegex = /(https?:\/\/[^\s]+)/g
                      const extractFromComments = (comments: TaskComment[]) => {
                        comments.forEach(comment => {
                          if (comment.comment) {
                            const matches = comment.comment.match(urlRegex)
                            if (matches) {
                              matches.forEach(url => {
                                // Skip FILE_URLS pattern
                                if (!url.includes('[FILE_URLS:')) {
                                  links.push({
                                    url,
                                    date: comment.created_at
                                  })
                                }
                              })
                            }
                          }
                          if (comment.replies) {
                            extractFromComments(comment.replies)
                          }
                        })
                      }
                      if (taskData?.comments) {
                        extractFromComments(taskData.comments)
                      }
                      const displayLinks = showAllLinks ? links : links.slice(0, 5)
                      return (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Link</h4>
                          {links.length === 0 ? (
                            <p className="text-sm text-gray-500">Chưa có link nào</p>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {displayLinks.map((link, idx) => {
                                  try {
                                    const domain = new URL(link.url).hostname.replace('www.', '')
                                    return (
                                      <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-lg"
                                      >
                                        <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm text-gray-900 truncate">{domain}</p>
                                          <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                        </div>
                                      </a>
                                    )
                                  } catch {
                                    return null
                                  }
                                })}
                              </div>
                              {links.length > 5 && (
                                <button
                                  onClick={() => setShowAllLinks(!showAllLinks)}
                                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                  {showAllLinks ? 'Ẩn bớt' : `Xem thêm (${links.length - 5})`}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Image Zoom Modal */}
              {zoomedImage && (
                <div
                  className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
                  onClick={() => setZoomedImage(null)}
                >
                  <button
                    onClick={() => setZoomedImage(null)}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                    title="Đóng"
                  >
                    <X className="h-6 w-6" />
                  </button>
                  <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
                    <img
                      src={zoomedImage.url}
                      alt="Zoomed image"
                      className="max-w-full max-h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {/* Navigation arrows if there are multiple images */}
                  {(() => {
                    const images: Array<{ url: string }> = []
                    const extractFromComments = (comments: TaskComment[]) => {
                      comments.forEach(comment => {
                        if (comment.file_url) {
                          const url = comment.file_url
                          const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i) ||
                            comment.file_name?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)
                          if (isImage) {
                            images.push({ url })
                          }
                        }
                        if (comment.comment) {
                          const fileUrlsMatch = comment.comment.match(/\[FILE_URLS:\s*([^\]]+)\]/)
                          if (fileUrlsMatch) {
                            const urls = fileUrlsMatch[1].trim().split(/\s+/)
                            urls.forEach(url => {
                              const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)
                              if (isImage) {
                                images.push({ url })
                              }
                            })
                          }
                        }
                        if (comment.replies) {
                          extractFromComments(comment.replies)
                        }
                      })
                    }
                    if (taskData?.comments) {
                      extractFromComments(taskData.comments)
                    }
                    const currentIndex = images.findIndex(img => img.url === zoomedImage.url)
                    const hasPrev = currentIndex > 0
                    const hasNext = currentIndex < images.length - 1

                    return (
                      <>
                        {hasPrev && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setZoomedImage({ url: images[currentIndex - 1].url, index: currentIndex - 1 })
                            }}
                            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                            title="Ảnh trước"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                        )}
                        {hasNext && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setZoomedImage({ url: images[currentIndex + 1].url, index: currentIndex + 1 })
                            }}
                            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                            title="Ảnh tiếp"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        )}
                        {images.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm z-10">
                            {currentIndex + 1} / {images.length}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Messages List - Zalo Style with Drag & Drop */}
              <div
                className={`flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-[#f0f2f5] relative transition-colors ${isDragging ? 'bg-blue-50/50' : ''
                  }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {isDragging && (
                  <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <Paperclip className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-blue-600 font-semibold text-lg">Thả file vào đây để gửi</p>
                      <p className="text-blue-500 text-sm mt-1">Hoặc chọn file từ máy tính</p>
                    </div>
                  </div>
                )}
                <div className="px-4 py-3 space-y-3">
                  {filteredComments?.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                      <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                      <p className="text-sm text-gray-500">Chưa có tin nhắn nào</p>
                    </div>
                  ) : (
                    filteredComments?.map(comment => {
                      const findParentComment = (parentId: string | null | undefined): TaskComment | null => {
                        if (!parentId || !taskData?.comments) return null
                        const searchInComments = (comments: TaskComment[]): TaskComment | null => {
                          for (const c of comments) {
                            if (c.id === parentId) return c
                            if (c.replies && c.replies.length > 0) {
                              const found = searchInComments(c.replies)
                              if (found) return found
                            }
                          }
                          return null
                        }
                        return searchInComments(taskData.comments)
                      }

                      // Helper function to render comment text with mentions
                      const renderCommentText = (text: string, isOwnMessage: boolean) => {
                        if (!text) return null

                        // Parse mentions: @[name](checklist:id), @[name](task:id), or @name
                        // First, find all matches (checklist, task, and user mentions) with their positions
                        const matches: Array<{ type: 'checklist' | 'task' | 'mention'; start: number; end: number; name: string; id?: string }> = []

                        // Match @[name](checklist:id) pattern
                        const checklistPattern = /@\[([^\]]+)\]\(checklist:([^)]+)\)/g
                        let match
                        while ((match = checklistPattern.exec(text)) !== null) {
                          matches.push({
                            type: 'checklist',
                            start: match.index,
                            end: match.index + match[0].length,
                            name: match[1],
                            id: match[2]
                          })
                        }

                        // Match @[name](task:id) pattern
                        const taskPattern = /@\[([^\]]+)\]\(task:([^)]+)\)/g
                        while ((match = taskPattern.exec(text)) !== null) {
                          matches.push({
                            type: 'task',
                            start: match.index,
                            end: match.index + match[0].length,
                            name: match[1],
                            id: match[2]
                          })
                        }

                        // Match @name pattern (user mentions) - but skip if it's part of a checklist or task mention
                        const userPattern = /@([a-zA-Z0-9_\u00C0-\u1EF9\s]+)/g
                        while ((match = userPattern.exec(text)) !== null) {
                          // Check if this match is inside a checklist or task mention
                          const isInsideOther = matches.some(m =>
                            (m.type === 'checklist' || m.type === 'task') && match.index >= m.start && match.index < m.end
                          )
                          if (!isInsideOther) {
                            matches.push({
                              type: 'mention',
                              start: match.index,
                              end: match.index + match[0].length,
                              name: match[1]
                            })
                          }
                        }

                        // Sort matches by position
                        matches.sort((a, b) => a.start - b.start)

                        // Build parts array
                        const parts: Array<{ type: 'text' | 'mention' | 'checklist' | 'task'; content: string; name?: string; id?: string }> = []
                        let lastIndex = 0

                        matches.forEach(m => {
                          // Add text before match
                          if (m.start > lastIndex) {
                            parts.push({ type: 'text', content: text.substring(lastIndex, m.start) })
                          }
                          // Add the mention
                          parts.push({
                            type: m.type,
                            content: text.substring(m.start, m.end),
                            name: m.name,
                            id: m.id
                          })
                          lastIndex = m.end
                        })

                        // Add remaining text
                        if (lastIndex < text.length) {
                          parts.push({ type: 'text', content: text.substring(lastIndex) })
                        }

                        // If no mentions found, add all text
                        if (parts.length === 0) {
                          parts.push({ type: 'text', content: text })
                        }

                        return (
                          <span className="whitespace-pre-wrap break-words">
                            {parts.map((part, idx) => {
                              if (part.type === 'checklist') {
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium ${isOwnMessage
                                        ? 'bg-white/25 text-white'
                                        : 'bg-green-100 text-green-700'
                                      }`}
                                    title={`Checklist: ${part.name}`}
                                  >
                                    <CheckSquare className="h-3 w-3" />
                                    {part.name}
                                  </span>
                                )
                              } else if (part.type === 'task') {
                                return (
                                  <span
                                    key={idx}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      if (part.id) {
                                        router.push(`/tasks/${part.id}`)
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium cursor-pointer hover:opacity-80 transition-opacity ${isOwnMessage
                                        ? 'bg-white/30 text-white'
                                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                      }`}
                                    title={`Nhiệm vụ: ${part.name} (Click để xem)`}
                                  >
                                    <FileText className="h-3 w-3" />
                                    {part.name}
                                  </span>
                                )
                              } else if (part.type === 'mention') {
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium ${isOwnMessage
                                        ? 'bg-white/25 text-white'
                                        : 'bg-blue-100 text-blue-700'
                                      }`}
                                  >
                                    <User className="h-3 w-3" />
                                    {part.name}
                                  </span>
                                )
                              } else {
                                return <span key={idx} className={isOwnMessage ? 'text-white' : 'text-gray-900'}>{part.content}</span>
                              }
                            })}
                          </span>
                        )
                      }

                      const renderComment = (c: TaskComment, isReply = false) => {
                        const parentComment = isReply && c.parent_id ? findParentComment(c.parent_id) : null
                        const isOwnMessage = c.user_id === user?.id

                        // Extract task ID from comment if it contains task mention
                        const extractTaskIdFromComment = (text: string): string | null => {
                          if (!text) return null
                          const taskPattern = /@\[([^\]]+)\]\(task:([^)]+)\)/
                          const match = text.match(taskPattern)
                          return match ? match[2] : null
                        }

                        const mentionedTaskId = c.comment ? extractTaskIdFromComment(c.comment) : null
                        const hasTaskMention = mentionedTaskId !== null

                        return (
                          <div key={c.id} className={`group ${isReply ? 'ml-12 mt-2' : 'mt-3 first:mt-0'}`}>
                            <div className={`flex gap-2.5 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm shrink-0 flex-shrink-0" title={c.user_name || c.employee_name || 'Người dùng'}>
                                {(c.user_name || c.employee_name || 'U')?.charAt(0).toUpperCase()}
                              </div>
                              <div className={`flex-1 max-w-[75%] ${isOwnMessage ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                                {parentComment && (
                                  <div className={`mb-1.5 w-full ${isOwnMessage ? 'flex justify-end' : 'flex justify-start'}`}>
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 border-l-[3px] ${isOwnMessage ? 'border-blue-400' : 'border-gray-300'} rounded-md text-xs text-gray-600 max-w-[90%] shadow-sm`}>
                                      <Reply className="h-3 w-3 text-gray-400 shrink-0" />
                                      <span className="font-medium text-gray-700">{parentComment.user_name || parentComment.employee_name || 'Người dùng'}</span>
                                      <span className="text-gray-500 line-clamp-1">: {parentComment.comment.length > 35 ? parentComment.comment.substring(0, 35) + '...' : parentComment.comment}</span>
                                    </div>
                                  </div>
                                )}
                                <div className={`flex items-center gap-2 text-xs mb-1 px-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                                  <span className="font-medium text-gray-700">{c.user_name || c.employee_name || 'Người dùng'}</span>
                                  <span className="text-gray-400">{formatDate(c.created_at, true)}</span>
                                  {c.is_pinned && (
                                    <Pin className="h-3 w-3 text-blue-500 fill-current" title="Đã ghim" />
                                  )}
                                </div>
                                <div
                                  onClick={(e) => {
                                    // Only navigate if clicking on the message bubble itself, not on interactive elements inside
                                    const target = e.target as HTMLElement
                                    if (hasTaskMention && mentionedTaskId &&
                                      !target.closest('a') &&
                                      !target.closest('button') &&
                                      !target.closest('[role="button"]')) {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      router.push(`/tasks/${mentionedTaskId}`)
                                    }
                                  }}
                                  className={`relative px-3 py-2.5 text-sm shadow-sm ${isOwnMessage
                                    ? 'bg-[#00B2FF] text-white rounded-2xl rounded-tr-none'
                                    : 'bg-white text-gray-900 rounded-2xl rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
                                    } ${hasTaskMention ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                                  style={isOwnMessage ? {} : { boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
                                  title={hasTaskMention ? 'Click để xem nhiệm vụ được mention' : undefined}
                                >
                                  {c.type === 'image' && c.file_url && (
                                    <div className="mb-1 -mx-1">
                                      <img src={c.file_url} alt="Attachment" className="max-w-full max-h-64 rounded-xl border-0" />
                                    </div>
                                  )}
                                  {c.type === 'file' && c.file_url && (
                                    <a
                                      href={c.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-xs font-medium ${isOwnMessage
                                          ? 'bg-white/20 text-white hover:bg-white/30'
                                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                        } transition-colors`}
                                    >
                                      {(() => {
                                        // Get file name from comment (which usually contains the file name) or file_name field
                                        // Extract file name from URL if needed
                                        let fileName = c.comment || (c as any).file_name || ''

                                        // Always try to extract from URL if we have it (most reliable)
                                        if (c.file_url) {
                                          const urlParts = c.file_url.split('/')
                                          const lastPart = urlParts[urlParts.length - 1]
                                          const nameFromUrl = lastPart.split('?')[0] // Remove query params
                                          if (nameFromUrl && nameFromUrl.includes('.')) {
                                            fileName = nameFromUrl
                                          } else if (!fileName && nameFromUrl) {
                                            fileName = nameFromUrl
                                          }
                                        }

                                        // Fallback to generic name if still empty
                                        if (!fileName || fileName === 'File đính kèm') {
                                          fileName = 'File đính kèm'
                                        }

                                        const fileType = (c as any).file_type || ''
                                        const iconPath = getFileIconPath(fileType, fileName)

                                        // Debug logging (remove in production)
                                        if (process.env.NODE_ENV === 'development') {
                                          console.log('File icon debug:', {
                                            fileName,
                                            fileType,
                                            iconPath,
                                            fileUrl: c.file_url,
                                            comment: c.comment
                                          })
                                        }

                                        if (iconPath) {
                                          return <img src={iconPath} alt={fileName} className="h-4 w-4 object-contain flex-shrink-0" onError={(e) => {
                                            console.error('Failed to load icon:', iconPath)
                                            e.currentTarget.style.display = 'none'
                                          }} />
                                        }
                                        return <Paperclip className="h-3.5 w-3.5" />
                                      })()}
                                      <span className="truncate max-w-[180px]">
                                        {c.comment || 'File đính kèm'}
                                      </span>
                                    </a>
                                  )}
                                  {c.comment && c.type !== 'image' && !(c.file_url && c.file_url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)) && (
                                    <div className={`leading-relaxed ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                                      {renderCommentText(c.comment, isOwnMessage)}
                                    </div>
                                  )}
                                </div>
                                <div className={`flex gap-1 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs ${isOwnMessage ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                                  <button
                                    onClick={() => handleReply(c)}
                                    className="text-gray-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                                  >
                                    <Reply className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Trả lời</span>
                                  </button>
                                  {canManageComment(c) && (
                                    <button
                                      onClick={() => handleDeleteComment(c)}
                                      className="text-gray-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="hidden sm:inline">Xóa</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleTogglePin(c)}
                                    className="text-gray-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                                  >
                                    {c.is_pinned ? (
                                      <>
                                        <PinOff className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Bỏ ghim</span>
                                      </>
                                    ) : (
                                      <>
                                        <Pin className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Ghim</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                            {c.replies && c.replies.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {c.replies.map(reply => renderComment(reply, true))}
                              </div>
                            )}
                          </div>
                        )
                      }
                      return renderComment(comment)
                    })
                  )}
                </div>
              </div>

              {/* Input Area - Zalo Style */}
              <div className="border-t border-gray-200 bg-white shrink-0 px-4 py-3">
                {replyingTo && (
                  <div className="mb-2.5 p-2.5 bg-blue-50 border-l-3 border-blue-500 rounded-lg relative">
                    <div className="flex items-start gap-2">
                      <Reply className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-blue-900 mb-0.5">Trả lời {replyingTo.user_name || replyingTo.employee_name || 'Người dùng'}</div>
                        <p className="text-xs text-gray-600 line-clamp-2">{replyingTo.comment}</p>
                      </div>
                      <button
                        onClick={handleCancelReply}
                        className="p-1 hover:bg-blue-100 rounded-full transition-colors shrink-0"
                        title="Hủy trả lời"
                      >
                        <X className="h-3 w-3 text-blue-600" />
                      </button>
                    </div>
                  </div>
                )}
                {/* Pending Files Preview */}
                {pendingFiles.length > 0 && (
                  <div className="mb-2.5 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {pendingFiles.map((file, index) => {
                        const isImage = file.type.startsWith('image/')

                        return (
                          <PendingFilePreview
                            key={`${file.name}-${index}`}
                            file={file}
                            index={index}
                            isImage={isImage}
                            onRemove={(idx) => {
                              const newFiles = pendingFiles.filter((_, i) => i !== idx)
                              setPendingFiles(newFiles)
                              if (newFiles.length === 0) {
                                setPendingPreview(null)
                              }
                            }}
                          />
                        )
                      })}
                    </div>
                    <button
                      onClick={() => {
                        setPendingFiles([])
                        setPendingPreview(null)
                      }}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Xóa tất cả ({pendingFiles.length})
                    </button>
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <label className="p-2.5 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors rounded-full hover:bg-gray-100">
                    <Paperclip className="h-5 w-5" />
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        handleFileInput(files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all relative">
                    <textarea
                      ref={mentionInputRef}
                      value={chatMessage}
                      onChange={handleMentionInput}
                      placeholder={replyingTo ? `Trả lời ${replyingTo.user_name}...` : "Nhập tin nhắn..."}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm max-h-32 resize-none p-0 text-gray-900 placeholder:text-gray-400"
                      rows={1}
                      onKeyDown={(e) => {
                        if (showMentionDropdown) {
                          const filtered = getFilteredMentions()
                          if (e.key === 'Enter' && filtered.length > 0 && !e.shiftKey) {
                            e.preventDefault()
                            insertMention(filtered[0])
                          } else if (e.key === 'Escape') {
                            setShowMentionDropdown(false)
                          }
                        } else {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          } else if (e.key === 'Escape' && replyingTo) {
                            handleCancelReply()
                          }
                        }
                      }}
                    />
                    {showMentionDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
                        <div className="p-2 space-y-1">
                          {getFilteredMentions().length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy</div>
                          ) : (
                            getFilteredMentions().map((item) => (
                              <button
                                key={`${item.type}-${item.id}`}
                                onClick={() => insertMention(item)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm"
                              >
                                {item.type === 'member' ? (
                                  <>
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span className="text-gray-900 font-medium">{item.name}</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckSquare className="h-4 w-4 text-green-600" />
                                    <span className="text-gray-900 font-medium">{item.name}</span>
                                  </>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (!chatMessage.trim() && pendingFiles.length === 0)}
                    className="p-2.5 bg-[#00B2FF] text-white rounded-full hover:bg-[#0099e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    title="Gửi tin nhắn"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Right Sidebar Toggle Button (when hidden) */}
        {!showRightSidebar && (
          <button
            onClick={() => setShowRightSidebar(true)}
            className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white border border-l-0 border-gray-300 rounded-l-md hover:bg-gray-50 text-gray-600 transition-colors shadow-md"
            title="Hiện sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}


      </div>

      {/* Edit Task Modal */}
      {isEditingTask && (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={() => setIsEditingTask(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chỉnh sửa nhiệm vụ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Nhập tiêu đề nhiệm vụ"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  rows={4}
                  placeholder="Nhập mô tả nhiệm vụ"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditingTask(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveTask}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {isEditingGroup && (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={() => setIsEditingGroup(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chỉnh sửa nhóm</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên nhóm *</label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Nhập tên nhóm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  rows={4}
                  placeholder="Nhập mô tả nhóm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditingGroup(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveGroup}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditingTask && (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={() => setIsEditingTask(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chỉnh sửa nhiệm vụ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Nhập tiêu đề nhiệm vụ"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  rows={4}
                  placeholder="Nhập mô tả nhiệm vụ"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditingTask(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveTask}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {isEditingGroup && (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={() => setIsEditingGroup(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chỉnh sửa nhóm</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên nhóm *</label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Nhập tên nhóm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  rows={4}
                  placeholder="Nhập mô tả nhóm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditingGroup(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveGroup}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
