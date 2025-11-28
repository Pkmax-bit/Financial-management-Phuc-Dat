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
  FileText,
  File,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  Send,
  StickyNote,
  Trash2,
  User,
  Users,
  FileSpreadsheet,
  FileType
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
  const [checklistError, setChecklistError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [groupMembers, setGroupMembers] = useState<Array<{ employee_id: string; employee_name?: string; employee_email?: string }>>([])

  const [chatMessage, setChatMessage] = useState('')
  const [chatFilter, setChatFilter] = useState<'all' | 'pinned'>('all')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

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

  const canModerateComments = useMemo(() => {
    const role = user?.role?.toLowerCase()
    return role ? MODERATOR_ROLES.includes(role) : false
  }, [user])

  useEffect(() => {
    if (pendingFile && pendingFile.type.startsWith('image/')) {
      const preview = URL.createObjectURL(pendingFile)
      setPendingPreview(preview)
      return () => URL.revokeObjectURL(preview)
    }
    setPendingPreview(null)
  }, [pendingFile])

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
    if (!content) return
    try {
      const newItem = await apiPost(`/api/tasks/checklists/${checklistId}/items`, { content })
      setChecklistItemsDraft(prev => ({ ...prev, [checklistId]: '' }))
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
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Thiếu token xác thực')
      }
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/attachments`, {
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

  const handleSendMessage = async () => {
    if (!chatMessage.trim() && !pendingFile) return
    try {
      setSendingMessage(true)
      let fileUrl: string | undefined
      let messageType: 'text' | 'file' | 'image' = 'text'

      if (pendingFile) {
        fileUrl = await uploadChatFile(pendingFile)
        messageType = pendingFile.type.startsWith('image/') ? 'image' : 'file'
      }

      await apiPost(`/api/tasks/${taskId}/comments`, {
        comment: chatMessage.trim() || pendingFile?.name || 'File đính kèm',
        type: messageType,
        file_url: fileUrl,
        is_pinned: false
      })

      setChatMessage('')
      setPendingFile(null)
      setPendingPreview(null)
      loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể gửi tin nhắn'))
    } finally {
      setSendingMessage(false)
    }
  }

  const handleTogglePin = async (comment: TaskComment) => {
    try {
      await apiPut(`/api/tasks/comments/${comment.id}`, { is_pinned: !comment.is_pinned })
      loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể ghim tin nhắn'))
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Xóa tin nhắn này?')) return
    try {
      await apiDelete(`/api/tasks/comments/${commentId}`)
      loadTaskDetails()
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể xóa tin nhắn'))
    }
  }

  const filteredComments = useMemo(() => {
    if (!taskData?.comments) return []
    if (chatFilter === 'pinned') {
      return taskData.comments.filter(comment => comment.is_pinned)
    }
    return taskData.comments
  }, [taskData, chatFilter])

  const pendingAttachmentName = pendingFile ? `${pendingFile.name} (${formatFileSize(pendingFile.size)})` : null
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

      {/* Main 3-Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 gap-0">

        {/* LEFT COLUMN: INFO (~25%) */}
        <aside className="hidden lg:block lg:col-span-3 border-r border-gray-200 bg-gray-50/50 flex flex-col min-h-0">
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
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Người phụ trách</p>
                  <p className="font-medium text-gray-900 truncate">{task?.assigned_to_name || 'Thành viên được chọn làm nhiệm vụ'}</p>
                </div>
              </div>

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

            {/* Assignees (Người phụ trách) */}
            {(() => {
              // Lấy danh sách người phụ trách từ assignments hoặc group members
              const assignees: Array<{ id: string; name: string; email?: string }> = []

              // Ưu tiên lấy từ assignments (nếu có)
              if (assignments && assignments.length > 0) {
                assignments.forEach(assignment => {
                  if (assignment.assigned_to_name) {
                    assignees.push({
                      id: assignment.assigned_to,
                      name: assignment.assigned_to_name
                    })
                  }
                })
              }
              // Nếu không có assignments, lấy từ group members có role là 'responsible' hoặc tất cả nếu không có role
              else if (groupMembers.length > 0) {
                groupMembers.forEach(member => {
                  if (member.employee_name) {
                    assignees.push({
                      id: member.employee_id,
                      name: member.employee_name,
                      email: member.employee_email
                    })
                  }
                })
              }
              // Fallback: dùng assigned_to_name từ task
              else if (task?.assigned_to_name) {
                assignees.push({
                  id: task.assigned_to || '',
                  name: task.assigned_to_name
                })
              }

              const assigneeTotal = assignees.length

              if (assigneeTotal === 0) {
                return (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Người phụ trách</h3>
                      <span className="text-[11px] font-semibold text-gray-500">0 thành viên</span>
                    </div>
                    <p className="text-sm text-gray-500 italic">Thành viên được chọn làm nhiệm vụ</p>
                  </div>
                )
              }

              return (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Người phụ trách</h3>
                    <span className="text-[11px] font-semibold text-gray-600">{assigneeTotal} thành viên</span>
                  </div>
                  <div className="space-y-3">
                    {assignees.map((assignee) => (
                      <div key={assignee.id} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0" title={assignee.name}>
                          {assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{assignee.name}</p>
                          {assignee.email && (
                            <p className="text-xs text-gray-500 truncate">{assignee.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

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
                <button className="text-xs text-blue-600 hover:underline">Thêm</button>
              </div>
              <div className="space-y-2">
                {attachments?.map(file => {
                  const FileIcon = getFileIcon(file.file_type || '')
                  const displayName = getDisplayFileName(file)
                  return (
                    <a key={file.id} href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors group">
                      <FileIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1" title={displayName}>{displayName}</span>
                      <Download className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </a>
                  )
                })}
                {attachments?.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có tài liệu</p>}
              </div>
            </div>
          </div>
        </aside>

        {/* MIDDLE COLUMN: WORK AREA (~50%) */}
        <main className="col-span-1 lg:col-span-6 flex flex-col min-h-0 bg-white relative border-x border-gray-200">

          {/* TOP HALF: CHECKLISTS & DESCRIPTION */}
          <div className="flex-1 min-h-0 overflow-y-auto border-b border-gray-200 p-6 custom-scrollbar space-y-6">
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
                        <div key={item.id} className="group flex items-start gap-3 py-1.5 hover:bg-gray-50 rounded-md px-2 -mx-2 transition-colors">
                          <button
                            onClick={() => handleToggleChecklistItem(item)}
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.is_completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-500'}`}
                          >
                            {item.is_completed && <Check className="h-3 w-3 text-white" />}
                          </button>
                          <span className={`text-sm flex-1 leading-snug ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {item.content}
                          </span>
                          <button onClick={() => handleDeleteChecklistItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add Item Input */}
                      <div className="flex items-center gap-3 px-2 py-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => handleAddChecklistItem(checklist.id)}
                          className="p-1 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Thêm việc cần làm"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <input
                          type="text"
                          placeholder="Thêm việc cần làm..."
                          className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-black placeholder:text-gray-500"
                          value={checklistItemsDraft[checklist.id] || ''}
                          onChange={(e) => setChecklistItemsDraft(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddChecklistItem(checklist.id)
                          }}
                        />
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

          {/* BOTTOM HALF: CHAT (~50%) */}
          <div className="flex-1 min-h-0 flex flex-col bg-gray-50/30 border-t border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" /> Trao đổi
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setChatFilter(chatFilter === 'all' ? 'pinned' : 'all')} className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${chatFilter === 'pinned' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {chatFilter === 'pinned' ? 'Đang xem ghim' : 'Ghim'}
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">
              {filteredComments?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Chưa có tin nhắn nào</p>
                </div>
              ) : (
                filteredComments?.map(comment => (
                  <div key={comment.id} className={`flex gap-3 ${comment.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                      {comment.user_name?.charAt(0)}
                    </div>
                    <div className={`max-w-[80%] space-y-1 ${comment.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-center gap-2 text-xs text-gray-500 ${comment.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                        <span className="font-medium text-gray-900">{comment.user_name}</span>
                        <span>{formatDate(comment.created_at, true)}</span>
                      </div>
                      <div className={`p-3 rounded-2xl text-sm ${comment.user_id === user?.id
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                        }`}>
                        {comment.type === 'image' && comment.file_url && (
                          <img src={comment.file_url} alt="Attachment" className="max-w-full rounded-lg mb-2" />
                        )}
                        <p className="whitespace-pre-wrap">{comment.comment}</p>
                      </div>
                      {/* Actions */}
                      <div className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${comment.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                        {canManageComment(comment) && (
                          <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-red-500 hover:underline">Xóa</button>
                        )}
                        <button onClick={() => handleTogglePin(comment)} className="text-xs text-gray-500 hover:text-blue-600">
                          {comment.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
              {pendingPreview && (
                <div className="mb-2 relative inline-block">
                  <img src={pendingPreview} alt="Preview" className="h-20 rounded-lg border border-gray-200" />
                  <button onClick={() => { setPendingFile(null); setPendingPreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <label className="p-2 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">
                  <Paperclip className="h-5 w-5" />
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setPendingFile(file)
                      if (file.type.startsWith('image/')) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setPendingPreview(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      } else {
                        setPendingPreview(null)
                      }
                    }
                  }} />
                </label>
                <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="w-full bg-transparent border-none focus:ring-0 text-sm max-h-24 resize-none p-0 text-black placeholder:text-gray-500"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || (!chatMessage.trim() && !pendingFile)}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: NOTES (~25%) */}
        <aside className="hidden lg:block lg:col-span-3 border-l border-gray-200 bg-gray-50/50 flex flex-col min-h-0">
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
