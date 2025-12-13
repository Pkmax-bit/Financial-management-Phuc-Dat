/* eslint-disable @next/next/no-img-element */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
  ExternalLink
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

// Get file icon based on file type
const getFileIcon = (fileType: string) => {
  if (!fileType) return FileText

  const type = fileType.toLowerCase()

  // Images
  if (type.startsWith('image/')) {
    return ImageIcon
  }

  // PDF
  if (type === 'application/pdf') {
    return FileText
  }

  // Excel files
  if (type.includes('spreadsheet') || type === 'application/vnd.ms-excel' ||
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return FileSpreadsheet
  }

  // Word files
  if (type.includes('word') || type === 'application/msword' ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return FileType
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
  const taskId = params?.taskId as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [taskData, setTaskData] = useState<TaskResponse | null>(null)
  const [loadingTask, setLoadingTask] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [checklistItemsDraft, setChecklistItemsDraft] = useState<Record<string, string>>({})
  const [checklistItemFiles, setChecklistItemFiles] = useState<Record<string, File[]>>({})
  const [checklistItemPreviews, setChecklistItemPreviews] = useState<Record<string, string[]>>({})
  const [uploadingChecklistItem, setUploadingChecklistItem] = useState<string | null>(null)
  const [checklistError, setChecklistError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<string | null>(null)
  const [editingChecklistItemContent, setEditingChecklistItemContent] = useState('')
  const [editingChecklistItemFiles, setEditingChecklistItemFiles] = useState<File[]>([])
  const [editingChecklistItemFileUrls, setEditingChecklistItemFileUrls] = useState<string[]>([])
  const [editingChecklistItemPreviews, setEditingChecklistItemPreviews] = useState<string[]>([])
  const [uploadingEditChecklistItem, setUploadingEditChecklistItem] = useState(false)
  const [groupMembers, setGroupMembers] = useState<Array<{ employee_id: string; employee_name?: string; employee_email?: string }>>([])

  const [chatMessage, setChatMessage] = useState('')
  const [chatFilter, setChatFilter] = useState<'all' | 'pinned'>('all')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [replyingTo, setReplyingTo] = useState<TaskComment | null>(null)  // Comment being replied to
  const [draggedComment, setDraggedComment] = useState<TaskComment | null>(null)  // Comment being dragged
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null)
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const mentionInputRef = useRef<HTMLTextAreaElement | null>(null)

  // Resizable layout states
  const [leftColumnWidth, setLeftColumnWidth] = useState(320)
  const [rightColumnWidth, setRightColumnWidth] = useState(320)
  const [middleSplitRatio, setMiddleSplitRatio] = useState(0.55)
  const middleColumnRef = useRef<HTMLDivElement | null>(null)
  const resizeStateRef = useRef<{
    type: 'left' | 'right' | 'middle'
    startX: number
    startY: number
    startLeftWidth: number
    startRightWidth: number
    startSplit: number
    containerHeight: number
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
    if (state.type === 'left') {
      const delta = event.clientX - state.startX
      const newWidth = clamp(state.startLeftWidth + delta, 240, 520)
      setLeftColumnWidth(newWidth)
    } else if (state.type === 'right') {
      const delta = state.startX - event.clientX
      const newWidth = clamp(state.startRightWidth + delta, 240, 520)
      setRightColumnWidth(newWidth)
    } else if (state.type === 'middle') {
      if (!state.containerHeight || state.containerHeight <= 0) return
      const delta = event.clientY - state.startY
      const newRatio = clamp(state.startSplit + delta / state.containerHeight, 0.2, 0.8)
      setMiddleSplitRatio(newRatio)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    resizeStateRef.current = null
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const startResize = (type: 'left' | 'right' | 'middle', event: React.MouseEvent) => {
    event.preventDefault()
    if (type === 'middle' && middleColumnRef.current) {
      const rect = middleColumnRef.current.getBoundingClientRect()
      resizeStateRef.current = {
        type,
        startX: event.clientX,
        startY: event.clientY,
        startLeftWidth: leftColumnWidth,
        startRightWidth: rightColumnWidth,
        startSplit: middleSplitRatio,
        containerHeight: rect.height
      }
    } else {
      resizeStateRef.current = {
        type,
        startX: event.clientX,
        startY: event.clientY,
        startLeftWidth: leftColumnWidth,
        startRightWidth: rightColumnWidth,
        startSplit: middleSplitRatio,
        containerHeight: middleColumnRef.current?.getBoundingClientRect().height || 0
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

      // Load group members if task has group_id
      if (data?.task?.group_id) {
        try {
          const members = await apiGet(`/api/tasks/groups/${data.task.group_id}/members`)
          setGroupMembers(members || [])
        } catch (err) {
          console.error('Failed to load group members', err)
          setGroupMembers([])
        }
      } else {
        setGroupMembers([])
      }
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
  }, [taskId])

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

  useEffect(() => {
    loadTaskDetails()
  }, [loadTaskDetails])

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
      const payload: any = { content: itemContent }

      const newItem = await apiPost(`/api/tasks/checklists/${checklistId}/items`, payload)
      
      // Clear draft and files
      setChecklistItemsDraft(prev => ({ ...prev, [checklistId]: '' }))
      setChecklistItemFiles(prev => ({ ...prev, [checklistId]: [] }))
      setChecklistItemPreviews(prev => ({ ...prev, [checklistId]: [] }))
      
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
        throw new Error('Không thể tải file')
      }
      const data = await response.json()
      return data.file_url || data.url
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

      // Gửi file trước (mỗi file là 1 comment riêng)
      for (const file of pendingFiles) {
        const fileUrl = await uploadChatFile(file)
        const messageType: 'file' | 'image' = file.type.startsWith('image/') ? 'image' : 'file'

        await apiPost(`/api/tasks/${taskId}/comments`, {
          comment: file.name || 'File đính kèm',
          type: messageType,
          file_url: fileUrl,
          is_pinned: false,
          parent_id: replyingTo?.id || null
        })
      }

      // Sau đó gửi tin nhắn text (nếu có)
      let createdComment: any = null
      if (trimmedMessage) {
        createdComment = await apiPost(`/api/tasks/${taskId}/comments`, {
          comment: trimmedMessage,
          type: 'text',
          file_url: undefined,
          is_pinned: false,
          parent_id: replyingTo?.id || null
        })
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

      setChatMessage('')
      setPendingFiles([])
      setPendingPreview(null)
      setReplyingTo(null)
      // Only reload comments, not the entire task
      await loadComments()
    } catch (err) {
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
    } else if (groupMembers.length > 0) {
      groupMembers.forEach(member => {
        if (member.employee_name) {
          members.push({
            id: member.employee_id,
            name: member.employee_name,
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
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

        {/* LEFT COLUMN: INFO */}
        <aside
          className="hidden lg:flex flex-col border-r border-gray-200 bg-gray-50/50 min-h-0"
          style={{ width: leftColumnWidth, minWidth: 240, maxWidth: 520 }}
        >
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Title & Status */}
            <div className="pb-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{task?.title}</h1>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${COLOR_BADGES[task?.status || 'todo']}`}>
                  {task?.status?.replace('_', ' ').toUpperCase()}
                </span>
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
                  const FileIcon = getFileIcon(file.file_type || '')
                  const displayName = getDisplayFileName(file)
                  const isImage = file.file_type?.startsWith('image/')
                  return (
                    <div key={file.id} className="group relative">
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        {isImage ? (
                          <img src={file.file_url} alt={displayName} className="h-10 w-10 object-cover rounded flex-shrink-0" />
                        ) : (
                          <FileIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
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

        {/* Left Resize Handle */}
        <div
          className="hidden lg:block w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize"
          onMouseDown={(e) => startResize('left', e)}
        ></div>

        {/* MIDDLE COLUMN */}
        <main ref={middleColumnRef} className="flex flex-1 min-w-0 flex-col bg-white relative">

          {/* TOP HALF: CHECKLISTS & DESCRIPTION */}
          <div
            className="flex flex-col min-h-0 border-b border-gray-200 p-6 custom-scrollbar space-y-6 bg-white overflow-y-auto"
            style={{ flex: middleSplitRatio, minHeight: 220 }}
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
                                
                                return (
                                  <>
                                    {/* Content text */}
                                    {displayContent && (
                                      <span className={`text-sm leading-snug block ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {displayContent}
                                      </span>
                                    )}
                                    
                                    {/* Display files/images */}
                                    {fileUrls.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {fileUrls.map((url, idx) => {
                                          const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i) || url.includes('image') || url.includes('storage')
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
                                                  <Paperclip className="h-4 w-4 text-gray-600" />
                                                  <span className="text-xs text-gray-700 font-medium">File {idx + 1}</span>
                                                  <Download className="h-3 w-3 text-gray-400" />
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
          <div
            className="hidden lg:block h-1 bg-gray-200 hover:bg-gray-300 cursor-row-resize"
            onMouseDown={(e) => startResize('middle', e)}
          ></div>

          {/* BOTTOM HALF: CHAT */}
          <div
            className="flex min-h-0 flex-col border-t border-gray-200 bg-white overflow-y-auto"
            style={{ flex: 1 - middleSplitRatio, minHeight: 220 }}
          >
            <div className="p-4 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" /> Trao đổi
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        // Get or create conversation for this task
                        const conversation = await apiGet(`/api/chat/tasks/${taskId}/conversation`)
                        // Open chat page with conversation ID
                        router.push(`/chat?conversation=${conversation.id}`)
                      } catch (error) {
                        console.error('Error opening chat:', error)
                        alert('Không thể mở chat. Vui lòng thử lại.')
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600"
                    title="Mở chat nội bộ cho nhiệm vụ này"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Mở Chat
                  </button>
                  <button onClick={() => setChatFilter(chatFilter === 'all' ? 'pinned' : 'all')} className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${chatFilter === 'pinned' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {chatFilter === 'pinned' ? 'Đang xem ghim' : 'Ghim'}
                  </button>
                </div>
              </div>
              {/* Thành viên của nhiệm vụ */}
              {(() => {
                // Lấy danh sách thành viên từ assignments hoặc group members
                const members: Array<{ id: string; name: string; email?: string }> = []
                
                if (assignments && assignments.length > 0) {
                  assignments.forEach(assignment => {
                    if (assignment.assigned_to_name) {
                      members.push({
                        id: assignment.assigned_to,
                        name: assignment.assigned_to_name
                      })
                    }
                  })
                } else if (groupMembers.length > 0) {
                  groupMembers.forEach(member => {
                    if (member.employee_name) {
                      members.push({
                        id: member.employee_id,
                        name: member.employee_name,
                        email: member.employee_email
                      })
                    }
                  })
                } else if (task?.assigned_to_name) {
                  members.push({
                    id: task.assigned_to || '',
                    name: task.assigned_to_name
                  })
                }
                
                if (members.length === 0) return null
                
                return (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-gray-500 font-medium">Thành viên:</span>
                      {members.map((member, index) => (
                        <div key={member.id} className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm" title={member.name}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-700 font-medium">{member.name}</span>
                          {index < members.length - 1 && <span className="text-gray-300">•</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0 bg-white">
              {filteredComments?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Chưa có tin nhắn nào</p>
                </div>
              ) : (
                filteredComments?.map(comment => {
                  // Helper function to find parent comment
                  const findParentComment = (parentId: string | null | undefined): TaskComment | null => {
                    if (!parentId || !taskData?.comments) return null
                    // Search in all comments (including nested replies)
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

                  const renderComment = (c: TaskComment, isReply = false) => {
                    const parentComment = isReply && c.parent_id ? findParentComment(c.parent_id) : null
                    
                    return (
                      <div key={c.id} className={`group ${isReply ? 'ml-8 mt-2' : ''}`}>
                        <div className={`flex gap-3 ${c.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0" title={c.user_name || c.employee_name || 'Người dùng'}>
                          {(c.user_name || c.employee_name || 'U')?.charAt(0).toUpperCase()}
                        </div>
                          <div className={`max-w-[80%] space-y-1 ${c.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                            {/* Parent comment preview (Messenger style) */}
                            {parentComment && (
                              <div className={`mb-1.5 ${c.user_id === user?.id ? 'flex justify-end' : 'flex justify-start'}`}>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50/70 border-l-[3px] border-gray-300/60 rounded-md text-xs text-gray-500 max-w-[85%] hover:bg-gray-100/70 transition-colors">
                                  <Reply className="h-3 w-3 text-gray-400 shrink-0 opacity-70" />
                                  <span className="font-medium text-gray-600/80">{parentComment.user_name || parentComment.employee_name || 'Người dùng'}</span>
                                  <span className="text-gray-400/70 line-clamp-1">: {parentComment.comment.length > 40 ? parentComment.comment.substring(0, 40) + '...' : parentComment.comment}</span>
                                </div>
                              </div>
                            )}
                            <div className={`flex items-center gap-2 text-xs mb-1 ${c.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                              <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{c.user_name || c.employee_name || 'Người dùng'}</span>
                              <span className="text-gray-500">{formatDate(c.created_at, true)}</span>
                            </div>
                            <div 
                              className={`p-3 rounded-2xl text-sm relative transition-all cursor-pointer hover:shadow-md ${c.user_id === user?.id
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                              } ${draggedComment?.id === c.id ? 'translate-x-2 opacity-80' : ''}`}
                            onMouseDown={(e) => {
                              // Enable drag to reply (swipe right)
                              if (e.button === 0) { // Left mouse button
                                setDraggedComment(c)
                              }
                            }}
                            onMouseUp={(e) => {
                              if (draggedComment?.id === c.id) {
                                // Check if dragged enough to trigger reply
                                const element = e.currentTarget
                                const rect = element.getBoundingClientRect()
                                const dragDistance = e.clientX - rect.left
                                if (dragDistance > 50) {
                                  handleReply(c)
                                }
                                setDraggedComment(null)
                              }
                            }}
                            onMouseLeave={() => {
                              if (draggedComment?.id === c.id) {
                                setDraggedComment(null)
                              }
                            }}
                          >
                            {c.type === 'image' && c.file_url && (
                              <img src={c.file_url} alt="Attachment" className="max-w-full rounded-lg mb-2" />
                            )}
                            {c.type === 'file' && c.file_url && (
                              <a
                                href={c.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-xs font-medium ${
                                  c.user_id === user?.id
                                    ? 'bg-blue-500/90 text-white hover:bg-blue-400'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                } transition-colors`}
                              >
                                <Paperclip className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[160px]">
                                  {c.comment || 'File đính kèm'}
                                </span>
                              </a>
                            )}
                            {/* Nội dung text */}
                            {c.comment && (
                              <p className="whitespace-pre-wrap">
                                {(() => {
                                  let text = c.comment
                                  const parts: Array<{ type: 'text' | 'checklist' | 'member'; content: string; name?: string; checklistId?: string }> = []
                                  
                                  // Find all checklist mentions: @[name](checklist:id)
                                  const checklistRegex = /@\[([^\]]+)\]\(checklist:([^)]+)\)/g
                                  let checklistMatch
                                  let lastIndex = 0
                                  
                                  while ((checklistMatch = checklistRegex.exec(text)) !== null) {
                                    // Add text before mention
                                    if (checklistMatch.index > lastIndex) {
                                      const beforeText = text.substring(lastIndex, checklistMatch.index)
                                      if (beforeText) {
                                        // Check for member mentions in before text
                                        const memberParts = beforeText.split(/(@\w+)/g)
                                        memberParts.forEach((part, partIdx) => {
                                          if (part && part.startsWith('@') && part.length > 1) {
                                            const memberName = part.substring(1)
                                            parts.push({ type: 'member', content: part, name: memberName })
                                          } else if (part) {
                                            parts.push({ type: 'text', content: part })
                                          }
                                        })
                                      }
                                    }
                                    
                                    // Add checklist mention with ID
                                    const [, name, checklistId] = checklistMatch
                                    parts.push({ type: 'checklist', content: checklistMatch[0], name, checklistId })
                                    lastIndex = checklistRegex.lastIndex
                                  }
                                  
                                  // Add remaining text
                                  if (lastIndex < text.length) {
                                    const remainingText = text.substring(lastIndex)
                                    if (remainingText) {
                                      // Check for member mentions in remaining text
                                      const memberParts = remainingText.split(/(@\w+)/g)
                                      memberParts.forEach((part) => {
                                        if (part && part.startsWith('@') && part.length > 1) {
                                          const memberName = part.substring(1)
                                          parts.push({ type: 'member', content: part, name: memberName })
                                        } else if (part) {
                                          parts.push({ type: 'text', content: part })
                                        }
                                      })
                                    }
                                  }
                                  
                                  // If no mentions found, check for member mentions only
                                  if (parts.length === 0) {
                                    const memberParts = text.split(/(@\w+)/g)
                                    memberParts.forEach((part) => {
                                      if (part && part.startsWith('@') && part.length > 1) {
                                        const memberName = part.substring(1)
                                        parts.push({ type: 'member', content: part, name: memberName })
                                      } else if (part) {
                                        parts.push({ type: 'text', content: part })
                                      }
                                    })
                                  }
                                  
                                  return parts.map((part, idx) => {
                                    if (part.type === 'checklist' && part.name && part.checklistId) {
                                      return (
                                        <span 
                                          key={idx} 
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            // Scroll to checklist item
                                            const checklistItemElement = document.querySelector(`[data-checklist-item-id="${part.checklistId}"]`)
                                            if (checklistItemElement) {
                                              checklistItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                              // Highlight briefly
                                              checklistItemElement.classList.add('ring-2', 'ring-green-500', 'ring-offset-2')
                                              setTimeout(() => {
                                                checklistItemElement.classList.remove('ring-2', 'ring-green-500', 'ring-offset-2')
                                              }, 2000)
                                            }
                                          }}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md font-medium cursor-pointer hover:bg-green-200 transition-colors"
                                          title="Click để xem việc cần làm"
                                        >
                                          <CheckSquare className="h-3 w-3" />
                                          {part.name}
                                        </span>
                                      )
                                    } else if (part.type === 'member' && part.name) {
                                      return (
                                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-medium">
                                          <User className="h-3 w-3" />
                                          {part.name}
                                        </span>
                                      )
                                    } else {
                                      return <span key={idx}>{part.content}</span>
                                    }
                                  })
                                })()}
                              </p>
                            )}
                            {/* Reply button - appears on hover */}
                            <button
                              onClick={() => handleReply(c)}
                              className={`absolute ${c.user_id === user?.id ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-white shadow-md hover:bg-gray-50 border border-gray-200`}
                              title="Trả lời"
                            >
                              <Reply className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                          </div>
                          {/* Actions */}
                          <div className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${c.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                            <button 
                              onClick={() => handleReply(c)} 
                              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                            >
                              <Reply className="h-3 w-3" />
                              Trả lời
                            </button>
                            {canManageComment(c) && (
                              <button onClick={() => handleDeleteComment(c)} className="text-xs text-red-500 hover:underline">Xóa</button>
                            )}
                            <button onClick={() => handleTogglePin(c)} className="text-xs text-gray-500 hover:text-blue-600">
                              {c.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Render replies */}
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

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 shrink-0" data-input-area>
              {/* Reply Preview */}
              {replyingTo && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg relative">
                  <div className="flex items-start gap-2">
                    <Reply className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-blue-900 mb-1">Trả lời {replyingTo.user_name || replyingTo.employee_name || 'Người dùng'}</div>
                      <p className="text-xs text-gray-600 line-clamp-2">{replyingTo.comment}</p>
                    </div>
                    <button
                      onClick={handleCancelReply}
                      className="p-1 hover:bg-blue-100 rounded-full transition-colors shrink-0"
                      title="Hủy trả lời"
                    >
                      <X className="h-3.5 w-3.5 text-blue-600" />
                    </button>
                  </div>
                </div>
              )}
              {/* Preview file đang chọn */}
              {pendingPreview && (
                <div className="mb-2 relative inline-block">
                  <img src={pendingPreview} alt="Preview" className="h-20 rounded-lg border border-gray-200" />
                  <button onClick={() => { setPendingFiles([]); setPendingPreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              {!pendingPreview && pendingAttachmentName && (
                <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-xs text-gray-700">
                  <Paperclip className="h-3.5 w-3.5 text-gray-500" />
                  <span className="truncate max-w-[220px]" title={pendingAttachmentName}>{pendingAttachmentName}</span>
                  <button
                    onClick={() => { setPendingFiles([]); setPendingPreview(null); }}
                    className="ml-1 text-gray-400 hover:text-red-500"
                    title="Xóa file đính kèm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <label className="p-2 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">
                  <Paperclip className="h-5 w-5" />
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) {
                        setPendingFiles(prev => [...prev, ...files])
                      }
                      // Cho phép chọn lại cùng 1 file sau khi xóa
                      e.target.value = ''
                    }}
                  />
                </label>
                <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all relative">
                  <textarea
                    ref={mentionInputRef}
                    value={chatMessage}
                    onChange={handleMentionInput}
                    placeholder={replyingTo ? `Trả lời ${replyingTo.user_name}...` : "Nhập tin nhắn... (dùng @ để mention)"}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm max-h-24 resize-none p-0 text-black placeholder:text-gray-500"
                    rows={1}
                    onKeyDown={(e) => {
                      if (showMentionDropdown) {
                        const filtered = getFilteredMentions()
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          // Could add keyboard navigation here
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          // Could add keyboard navigation here
                        } else if (e.key === 'Enter' && filtered.length > 0 && !e.shiftKey) {
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
                  
                  {/* Mention Dropdown */}
                  {showMentionDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {getFilteredMentions().length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy</div>
                        ) : (
                          getFilteredMentions().map((item, idx) => (
                            <button
                              key={`${item.type}-${item.id}`}
                              onClick={() => insertMention(item)}
                              className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 transition-colors flex items-center gap-2"
                            >
                              {item.type === 'member' ? (
                                <>
                                  <User className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm text-gray-900">{item.name}</span>
                                  <span className="text-xs text-gray-500 ml-auto">Thành viên</span>
                                </>
                              ) : (
                                <>
                                  <CheckSquare className="h-4 w-4 text-green-600" />
                                  <span className="text-sm text-gray-900">{item.name}</span>
                                  <span className="text-xs text-gray-500 ml-auto">Việc cần làm</span>
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
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Right Resize Handle */}
        <div
          className="hidden lg:block w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize"
          onMouseDown={(e) => startResize('right', e)}
        ></div>

        {/* RIGHT COLUMN: NOTES */}
        <aside
          className="hidden lg:flex flex-col border-l border-gray-200 bg-gray-50/50 min-h-0"
          style={{ width: rightColumnWidth, minWidth: 240, maxWidth: 520 }}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
              <StickyNote className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-gray-900">Ghi chú nhanh</h2>
            </div>

            {/* Add Note */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-yellow-400 transition-all">
                  <textarea
                    placeholder="Viết ghi chú mới..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full text-sm border-none focus:ring-0 resize-none p-0 text-black placeholder:text-gray-500"
                    rows={3}
                  />
                <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                  <button onClick={handleCreateNote} disabled={!newNote.trim()} className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50">
                    Lưu ghi chú
                  </button>
                </div>
              </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
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
                <div className="text-center text-gray-700 mt-10">
                  <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">Chưa có ghi chú nào</p>
                </div>
              )}
            </div>
          </div>
        </aside>

      </div>

      {/* Edit Task Modal */}
      {isEditingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsEditingTask(false)}>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsEditingGroup(false)}>
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
