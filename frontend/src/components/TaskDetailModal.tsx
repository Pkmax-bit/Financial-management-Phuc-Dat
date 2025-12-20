/* eslint-disable @next/next/no-img-element */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api'
import {
    TaskResponse,
    TaskChecklistItem,
    TaskComment,
    TaskNote,
    TaskStatus,
    TaskPriority,
    Task
} from '@/types/task'
import {
    AlertCircle,
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
    Plus,
    Send,
    StickyNote,
    Trash2,
    User,
    X,
    FileSpreadsheet,
    FileType,
    Pause,
    Play
} from 'lucide-react'
import CreateTodoModal from './CreateTodoModal'

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

const formatDuration = (minutes?: number) => {
    if (!minutes) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
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

interface TaskDetailModalProps {
    taskId: string
    onClose: () => void
    onUpdate?: () => void
}

export default function TaskDetailModal({ taskId, onClose, onUpdate }: TaskDetailModalProps) {
    const router = useRouter()

    const [user, setUser] = useState<UserProfile | null>(null)
    const [loadingUser, setLoadingUser] = useState(true)
    const [taskData, setTaskData] = useState<TaskResponse | null>(null)
    const [loadingTask, setLoadingTask] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [newChecklistTitle, setNewChecklistTitle] = useState('')
    const [checklistItemsDraft, setChecklistItemsDraft] = useState<Record<string, string>>({})
    const [newNote, setNewNote] = useState('')
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
    const [editingNoteContent, setEditingNoteContent] = useState('')
    const [groupMembers, setGroupMembers] = useState<Array<{ 
      employee_id: string; 
      employee_name?: string; 
      employee_email?: string;
      responsibility_type?: 'accountable' | 'responsible' | 'consulted' | 'informed';
      avatar?: string;
      phone?: string;
      status?: string;
    }>>([])

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

    const [showCreateTodoModal, setShowCreateTodoModal] = useState(false)
    const [editingSubTask, setEditingSubTask] = useState<Task | null>(null)

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
            } finally {
                setLoadingUser(false)
            }
        }
        loadUser()
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

            // Load group members if task has group_id
            if (data?.task?.group_id) {
                try {
                    // Pass project_id if available to get project team information
                    const projectId = data?.task?.project_id
                    const url = projectId 
                        ? `/api/tasks/groups/${data.task.group_id}/members?project_id=${projectId}`
                        : `/api/tasks/groups/${data.task.group_id}/members`
                    const members = await apiGet(url)
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

    // PLACEHOLDER_FOR_HANDLERS

    // PLACEHOLDER_FOR_RENDER
    return null
}
