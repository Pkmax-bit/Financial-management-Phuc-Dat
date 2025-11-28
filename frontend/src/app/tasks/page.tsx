/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useMemo } from 'react'
import type { DragEvent } from 'react'
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  User,
  Users,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  MessageSquare,
  X,
  Check,
  Paperclip,
  Upload,
  Image as ImageIcon,
  Edit,
  RotateCcw,
  Archive
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const GROUP_COLORS = ['#0ea5e9', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1']
const getRandomGroupColor = () => GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)]

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string
  start_date?: string
  group_id?: string
  created_by?: string
  assigned_to?: string
  project_id?: string
  completed_at?: string
  created_at: string
  updated_at: string
  assigned_to_name?: string
  created_by_name?: string
  group_name?: string
  project_name?: string
  comment_count?: number
  attachment_count?: number
  assignee_count?: number
  assignee_ids?: string[]
  restore_hours_remaining?: number
  estimated_time?: number
}

interface TaskGroup {
  id: string
  name: string
  description?: string
  member_count?: number
  avatar_url?: string
  color?: string
  restore_hours_remaining?: number
}

interface User {
  full_name?: string
  role?: string
  email?: string
}

type NewTaskGroupForm = {
  name: string
  description: string
  member_ids: string[]
  avatar_url: string
  color: string
}

const createEmptyGroup = (): NewTaskGroupForm => ({
  name: '',
  description: '',
  member_ids: [],
  avatar_url: '',
  color: getRandomGroupColor()
})

type EmployeeRecord = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  users?: { full_name?: string } | Array<{ full_name?: string }>
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [groups, setGroups] = useState<TaskGroup[]>([])
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([])
  const [deletedGroups, setDeletedGroups] = useState<TaskGroup[]>([])
  const [showDeleted, setShowDeleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [groupFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [groupSearchQuery, setGroupSearchQuery] = useState('')

  // Selected group for messenger view
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  // Form states
  const [newTask, setNewTask] = useState<Partial<Task & { assignee_ids?: string[] }>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    start_date: '',
    group_id: '',
    assigned_to: '',
    assignee_ids: [],
    project_id: '',
    estimated_time: undefined
  })
  const [newFiles, setNewFiles] = useState<File[]>([])

  // Set group_id when creating task if group is selected
  useEffect(() => {
    if (selectedGroupId && showCreateModal) {
      setNewTask(prev => ({ ...prev, group_id: selectedGroupId }))
    }
  }, [selectedGroupId, showCreateModal])

  // Load group members when group_id changes in task form
  useEffect(() => {
    if (showCreateModal && newTask.group_id) {
      loadGroupMembers(newTask.group_id).then((members) => {
        // Filter assignee_ids to only include members in the new group
        if (newTask.assignee_ids && newTask.assignee_ids.length > 0 && members && members.length > 0) {
          const memberIds = members.map((m: { employee_id: string }) => m.employee_id)
          const validAssigneeIds = newTask.assignee_ids.filter(id => memberIds.includes(id))
          if (validAssigneeIds.length !== newTask.assignee_ids.length) {
            setNewTask(prev => ({ ...prev, assignee_ids: validAssigneeIds }))
          }
        } else if (newTask.assignee_ids && newTask.assignee_ids.length > 0 && (!members || members.length === 0)) {
          // Reset if group has no members
          setNewTask(prev => ({ ...prev, assignee_ids: [] }))
        }
      })
    } else {
      setGroupMembers([])
    }
  }, [newTask.group_id, showCreateModal])

  const [newGroup, setNewGroup] = useState<NewTaskGroupForm>(createEmptyGroup())
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email?: string }>>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [groupMembers, setGroupMembers] = useState<Array<{ employee_id: string; employee_name?: string; employee_email?: string }>>([])
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadTasks()
      loadGroups()
      loadEmployees()
    }
  }, [statusFilter, groupFilter, priorityFilter, user])

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, user_id, users!employees_user_id_fkey(full_name)')
        .eq('status', 'active')
        .order('first_name')
        .limit(100)

      if (error) throw error

      const transformedEmployees = (data || []).map((emp: EmployeeRecord) => {
        const usersRel = emp.users
        const userFullName = Array.isArray(usersRel) ? usersRel[0]?.full_name : usersRel?.full_name
        return {
          id: emp.id,
          name: userFullName || `${emp.first_name} ${emp.last_name}`.trim(),
          email: emp.email
        }
      })

      setEmployees(transformedEmployees)
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoadingEmployees(false)
    }
  }

  const loadGroupMembers = async (groupId: string) => {
    if (!groupId) {
      setGroupMembers([])
      return []
    }
    try {
      setLoadingGroupMembers(true)
      const members = await apiGet(`/api/tasks/groups/${groupId}/members`)
      setGroupMembers(members || [])
      return members || []
    } catch (err) {
      console.error('Failed to load group members:', err)
      setGroupMembers([])
      return []
    } finally {
      setLoadingGroupMembers(false)
    }
  }

  const checkUser = async () => {
    try {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userData) {
          setUser(userData)
          // Load data after user is set
          await loadTasks()
          await loadGroups()
          // Only load deleted items if user has permission
          if (canDeleteTask()) {
            await loadDeletedTasks()
            await loadDeletedGroups()
          }
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Check permissions based on role
  const canCreateTask = () => {
    if (!user?.role) return false
    const allowedRoles = ['admin', 'sales', 'accountant', 'workshop_employee', 'transport', 'employee', 'worker']
    return allowedRoles.includes(user.role.toLowerCase())
  }

  const canCreateGroup = () => {
    if (!user?.role) return false
    const allowedRoles = ['admin', 'sales', 'accountant']
    return allowedRoles.includes(user.role.toLowerCase())
  }

  const canDeleteTask = () => {
    if (!user?.role) return false
    const allowedRoles = ['admin', 'sales', 'accountant']
    return allowedRoles.includes(user.role.toLowerCase())
  }

  const loadTasks = async () => {
    if (!user) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (groupFilter !== 'all') params.append('group_id', groupFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)

      const url = `/api/tasks${params.toString() ? '?' + params.toString() : ''}`
      const data = await apiGet(url)
      setTasks(data || [])
    } catch (err) {
      const status = typeof err === 'object' && err !== null ? (err as { status?: number }).status : undefined
      const errMessage = typeof err === 'object' && err !== null ? (err as { message?: string }).message : undefined
      if (status === 401 || errMessage?.includes('Unauthorized')) {
        router.push('/login')
        return
      }
      setError(getErrorMessage(err, 'Không thể tải danh sách nhiệm vụ'))
    } finally {
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    if (!user) return

    try {
      const data = await apiGet('/api/tasks/groups')
      setGroups(data || [])
    } catch (err) {
      const status = typeof err === 'object' && err !== null ? (err as { status?: number }).status : undefined
      const errMessage = typeof err === 'object' && err !== null ? (err as { message?: string }).message : undefined
      if (status === 401 || errMessage?.includes('Unauthorized')) {
        router.push('/login')
        return
      }
      console.error('Failed to load groups:', err)
    }
  }

  const loadDeletedTasks = async () => {
    if (!user) return

    try {
      const data = await apiGet('/api/tasks/deleted')
      setDeletedTasks(data || [])
    } catch (err) {
      // Silently fail - deleted tasks are optional
      console.error('Failed to load deleted tasks:', err)
      setDeletedTasks([])
    }
  }

  const loadDeletedGroups = async () => {
    if (!user) return

    try {
      const data = await apiGet('/api/tasks/groups/deleted')
      setDeletedGroups(data || [])
    } catch (err) {
      // Silently fail - deleted groups are optional
      console.error('Failed to load deleted groups:', err)
      setDeletedGroups([])
    }
  }

  const handleRestoreTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc muốn khôi phục nhiệm vụ này?')) return

    try {
      await apiPost(`/api/tasks/${taskId}/restore`)
      setStatusMessage('Đã khôi phục nhiệm vụ thành công')
      setTimeout(() => setStatusMessage(null), 3000)
      await loadTasks()
      await loadDeletedTasks()
    } catch (err) {
      alert('Không thể khôi phục nhiệm vụ: ' + getErrorMessage(err, 'Lỗi không xác định'))
    }
  }

  const handleRestoreGroup = async (groupId: string) => {
    if (!confirm('Bạn có chắc muốn khôi phục nhóm này? Tất cả nhiệm vụ trong nhóm cũng sẽ được khôi phục.')) return

    try {
      await apiPost(`/api/tasks/groups/${groupId}/restore`)
      setStatusMessage('Đã khôi phục nhóm thành công')
      setTimeout(() => setStatusMessage(null), 3000)
      await loadGroups()
      await loadTasks()
      await loadDeletedGroups()
    } catch (err) {
      alert('Không thể khôi phục nhóm: ' + getErrorMessage(err, 'Lỗi không xác định'))
    }
  }

  const handleCreateTask = async () => {
    setIsCreatingTask(true)
    try {
      // Ensure group_id is set if a group is selected
      const taskData = {
        ...newTask,
        group_id: selectedGroupId || newTask.group_id || ''
      }

      // Normalize payload to avoid validation errors (e.g. empty strings)
      const sanitizedTaskData: Record<string, unknown> = {
        ...taskData,
        due_date: taskData.due_date
          ? new Date(taskData.due_date).toISOString()
          : null
      }

      if (taskData.start_date) {
        sanitizedTaskData.start_date = new Date(taskData.start_date).toISOString()
      } else {
        delete sanitizedTaskData.start_date
      }
      if (!sanitizedTaskData.group_id) delete sanitizedTaskData.group_id
      if (!sanitizedTaskData.assigned_to) delete sanitizedTaskData.assigned_to
      // Use assignee_ids if available, otherwise use assigned_to
      if (taskData.assignee_ids && taskData.assignee_ids.length > 0) {
        sanitizedTaskData.assignee_ids = taskData.assignee_ids
        delete sanitizedTaskData.assigned_to
      } else if (!sanitizedTaskData.assigned_to) {
        delete sanitizedTaskData.assigned_to
      }
      if (!sanitizedTaskData.project_id) delete sanitizedTaskData.project_id
      if (!sanitizedTaskData.description) delete sanitizedTaskData.description
      if (typeof sanitizedTaskData.estimated_time !== 'number' || sanitizedTaskData.estimated_time <= 0) {
        delete sanitizedTaskData.estimated_time
      }

      const createdTask = await apiPost('/api/tasks', sanitizedTaskData)

      // Upload files if any
      if (newFiles.length > 0 && createdTask?.id) {
        try {
          // Lấy token từ Supabase session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()

          if (sessionError || !session?.access_token) {
            console.error('Session error:', sessionError)
            alert('Vui lòng đăng nhập lại để upload tài liệu')
          } else {
            await Promise.all(newFiles.map(async (file) => {
              const formData = new FormData()
              formData.append('file', file)

              const response = await fetch(`${API_BASE_URL}/api/tasks/${createdTask.id}/attachments`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
              })

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
                throw new Error(errorData.detail || errorData.message || 'Không thể upload file')
              }

              return await response.json()
            }))
          }
        } catch (uploadError) {
          console.error('File upload error:', uploadError)
          alert(`Đã tạo nhiệm vụ nhưng không thể upload một số tài liệu: ${uploadError instanceof Error ? uploadError.message : 'Lỗi không xác định'}`)
        }
      }

      setShowCreateModal(false)
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        start_date: '',
        group_id: '',
        assigned_to: '',
        assignee_ids: [],
        project_id: '',
        estimated_time: undefined
      })
      setNewFiles([])
      loadTasks()
    } catch (err) {
      alert('Không thể tạo nhiệm vụ: ' + getErrorMessage(err, 'Lỗi không xác định'))
    } finally {
      setIsCreatingTask(false)
    }
  }

  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => setStatusMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [statusMessage])

  const statusLabels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }

  const getStatusLabel = (status: TaskStatus) => statusLabels[status] || status

  const confirmStatusChange = (currentStatus: TaskStatus, targetStatus: TaskStatus) => {
    return window.confirm(
      `Bạn có chắc chắn muốn chuyển nhiệm vụ từ "${getStatusLabel(currentStatus)}" sang "${getStatusLabel(targetStatus)}"?`
    )
  }

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus, taskTitle?: string) => {
    try {
      await apiPut(`/api/tasks/${taskId}`, { status: newStatus })
      const message = taskTitle
        ? `Đã chuyển "${taskTitle}" sang ${getStatusLabel(newStatus)}`
        : `Đã cập nhật trạng thái nhiệm vụ sang ${getStatusLabel(newStatus)}`
      setStatusMessage(message)
      loadTasks()
    } catch (err) {
      alert('Không thể cập nhật trạng thái: ' + getErrorMessage(err, 'Lỗi không xác định'))
    }
  }

  const handleDragStartTask = (taskId: string) => {
    setDraggingTaskId(taskId)
  }

  const handleDragEndTask = () => {
    setDraggingTaskId(null)
    setDragOverStatus(null)
  }

  const handleDropOnStatus = async (targetStatus: TaskStatus) => {
    if (!draggingTaskId) return
    const draggedTask = tasks.find(t => t.id === draggingTaskId)
    if (draggedTask?.status === targetStatus) {
      handleDragEndTask()
      return
    }
    if (!draggedTask || !confirmStatusChange(draggedTask.status, targetStatus)) {
      handleDragEndTask()
      return
    }
    try {
      await handleUpdateStatus(draggingTaskId, targetStatus, draggedTask.title)
    } finally {
      handleDragEndTask()
    }
  }

  const registerDropZoneHandlers = (status: TaskStatus) => ({
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!draggingTaskId) return
      event.preventDefault()
      if (dragOverStatus !== status) {
        setDragOverStatus(status)
      }
    },
    onDragLeave: () => {
      if (dragOverStatus === status) {
        setDragOverStatus(null)
      }
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      if (!draggingTaskId) return
      event.preventDefault()
      setDragOverStatus(null)
      handleDropOnStatus(status)
    }
  })

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) return

    try {
      await apiDelete(`/api/tasks/${taskId}`)
      loadTasks()
    } catch (err) {
      alert('Không thể xóa nhiệm vụ: ' + getErrorMessage(err, 'Lỗi không xác định'))
    }
  }

  const handleDeleteGroup = async (groupId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // Ngăn chặn click event lan ra ngoài
    }
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này? Tất cả nhiệm vụ trong nhóm sẽ bị ảnh hưởng.')) return

    try {
      await apiDelete(`/api/tasks/groups/${groupId}`)
      // Nếu đang xem nhóm bị xóa, reset selection
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null)
      }
      loadGroups()
      loadTasks()
    } catch (err) {
      alert('Không thể xóa nhóm: ' + getErrorMessage(err, 'Lỗi không xác định'))
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      alert('Vui lòng nhập tên nhóm')
      return
    }
    try {
      await apiPost('/api/tasks/groups', {
        ...newGroup,
        color: newGroup.color || getRandomGroupColor(),
        member_ids: newGroup.member_ids
      })
      setShowGroupModal(false)
      setNewGroup(createEmptyGroup())
      loadGroups()
    } catch (err) {
      alert('Không thể tạo nhóm: ' + getErrorMessage(err, 'Lỗi không xác định'))
    }
  }

  const toggleEmployeeSelection = (employeeId: string) => {
    setNewGroup(prev => {
      const memberIds = prev.member_ids || []
      if (memberIds.includes(employeeId)) {
        return { ...prev, member_ids: memberIds.filter(id => id !== employeeId) }
      } else {
        return { ...prev, member_ids: [...memberIds, employeeId] }
      }
    })
  }

  const filteredTasks = tasks.filter(task => {
    // Filter by selected group
    if (selectedGroupId && task.group_id !== selectedGroupId) {
      return false
    }
    // Filter by search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const filteredGroups = groups.filter(group => {
    if (groupSearchQuery && !group.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) &&
      !group.description?.toLowerCase().includes(groupSearchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const selectedGroup = groups.find(g => g.id === selectedGroupId)

  const tasksCountByGroup = useMemo(() => {
    return tasks.reduce<Record<string, number>>((acc, task) => {
      if (task.group_id) {
        acc[task.group_id] = (acc[task.group_id] || 0) + 1
      }
      return acc
    }, {})
  }, [tasks])

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  }

  const getDropZoneClasses = (status: TaskStatus) => {
    if (dragOverStatus === status) {
      return 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/60'
    }
    if (draggingTaskId) {
      return 'border-dashed border-gray-300 bg-gray-50/30'
    }
    return ''
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {statusMessage && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
          {statusMessage}
        </div>
      )}
      {isCreatingTask && (
        <div className="fixed top-32 right-6 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
          Đang tạo nhiệm vụ, vui lòng đợi...
        </div>
      )}
      <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
        <div className="min-h-screen flex flex-col relative">
          {/* Header Section - Quản Lý Nhiệm Vụ, Đã xóa, Tạo Nhóm */}
          <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-xl font-bold text-black flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-black" />
                Quản Lý Nhiệm Vụ
              </h1>
            </div>
            <div className="flex gap-2 items-center">
              {canDeleteTask() && (
                <button
                  onClick={() => {
                    setShowDeleted(!showDeleted)
                    if (!showDeleted) {
                      loadDeletedTasks()
                      loadDeletedGroups()
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors ${showDeleted
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  <Archive className="h-4 w-4" />
                  {showDeleted ? 'Ẩn đã xóa' : 'Đã xóa'}
                  {(deletedTasks.length > 0 || deletedGroups.length > 0) && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {deletedTasks.length + deletedGroups.length}
                    </span>
                  )}
                </button>
              )}
              {canCreateGroup() || canCreateTask() ? (
                <>
                  {canCreateGroup() && (
                    <button
                      onClick={() => setShowGroupModal(true)}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
                    >
                      <Users className="h-4 w-4" />
                      Tạo Nhóm
                    </button>
                  )}
                  {canCreateTask() && selectedGroupId && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm Nhiệm Vụ
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Content Section - Messenger Layout: Left (3 parts) + Right (7 parts) */}
          <div className="flex-1 flex overflow-hidden gap-4" style={{ height: 'calc(100vh - 9rem)' }}>
              {/* Left Sidebar - Groups List (2/10 = 20%) */}
              <div className="w-[20%] min-w-[220px] border-r border-gray-200 bg-white flex flex-col overflow-hidden">
                {/* Group Search */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhóm..."
                      value={groupSearchQuery}
                      onChange={(e) => setGroupSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-sm"
                    />
                  </div>
                </div>

                {selectedGroup && (
                  <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nhóm đang chọn</p>
                    <div className="flex items-center gap-3">
                      {selectedGroup.avatar_url ? (
                        <img src={selectedGroup.avatar_url} alt={selectedGroup.name} className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: selectedGroup.color || '#3b82f6' }}
                        >
                          {selectedGroup.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{selectedGroup.name}</p>
                        {selectedGroup.description && (
                          <p className="text-xs text-gray-500 truncate">{selectedGroup.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                      <span>Thành viên: <strong className="text-gray-800">{selectedGroup.member_count || 0}</strong></span>
                      <span className="text-right">Nhiệm vụ: <strong className="text-gray-800">{tasksCountByGroup[selectedGroup.id] || 0}</strong></span>
                    </div>
                  </div>
                )}

                {/* Groups List */}
                <div className="flex-1 overflow-y-auto p-4">
                  {filteredGroups.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {groupSearchQuery ? 'Không tìm thấy nhóm' : 'Chưa có nhóm nào'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredGroups.map(group => (
                        <div
                          key={group.id}
                          onClick={() => setSelectedGroupId(group.id)}
                          className={`w-full border rounded-2xl cursor-pointer transition-all p-4 group relative ${selectedGroupId === group.id
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {group.avatar_url ? (
                              <img src={group.avatar_url} alt={group.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                style={{ backgroundColor: group.color || '#3b82f6' }}
                              >
                                {group.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                              <span className="font-semibold truncate text-gray-900">{group.name}</span>
                              {group.description && (
                                <span className="text-xs text-gray-500 truncate">{group.description}</span>
                              )}
                            </div>
                            {/* Action buttons - visible on hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // TODO: Implement edit group
                                  alert('Chức năng sửa nhóm sẽ được thêm sau')
                                }}
                                className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                title="Chỉnh sửa nhóm"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteGroup(group.id, e)}
                                className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                title="Xóa nhóm"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500 border-t border-gray-100 pt-2">
                            <span>Thành viên: <strong className="text-gray-800">{group.member_count || 0}</strong></span>
                            <span className="text-right">Nhiệm vụ: <strong className="text-gray-800">{tasksCountByGroup[group.id] || 0}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Content - Group Tasks (7/10 = 70%) */}
              <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
                {showDeleted ? (
                  <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
                    <div className="max-w-4xl mx-auto space-y-6">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nhiệm Vụ & Nhóm Đã Xóa</h2>
                        <p className="text-sm text-gray-600">
                          Các mục đã xóa có thể được khôi phục trong vòng 24 giờ. Sau 24 giờ, chúng sẽ bị xóa vĩnh viễn.
                        </p>
                      </div>

                      {/* Deleted Groups */}
                      {deletedGroups.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Nhóm Đã Xóa ({deletedGroups.length})
                          </h3>
                          <div className="space-y-3">
                            {deletedGroups.map(group => (
                              <div
                                key={group.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    {group.avatar_url ? (
                                      <img src={group.avatar_url} alt={group.name} className="w-12 h-12 rounded-lg object-cover" />
                                    ) : (
                                      <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: group.color || '#3b82f6' }}
                                      >
                                        {group.name.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900">{group.name}</h4>
                                      {group.description && (
                                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span>Thành viên: {group.member_count || 0}</span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          Còn {group.restore_hours_remaining?.toFixed(1) || 0}h để khôi phục
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRestoreGroup(group.id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm transition-colors"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                    Khôi Phục
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deleted Tasks */}
                      {deletedTasks.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <CheckSquare className="h-5 w-5" />
                            Nhiệm Vụ Đã Xóa ({deletedTasks.length})
                          </h3>
                          <div className="space-y-3">
                            {deletedTasks.map(task => (
                              <div
                                key={task.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                                    {task.description && (
                                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      {task.group_name && (
                                        <span className="flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          {task.group_name}
                                        </span>
                                      )}
                                      {task.assigned_to_name && (
                                        <span className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          {task.assigned_to_name}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Còn {task.restore_hours_remaining?.toFixed(1) || 0}h để khôi phục
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRestoreTask(task.id)}
                                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm transition-colors"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                    Khôi Phục
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {deletedGroups.length === 0 && deletedTasks.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                          <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">Không có mục nào đã xóa</p>
                          <p className="text-sm text-gray-500 mt-2">Các mục đã xóa sẽ xuất hiện ở đây trong vòng 24 giờ</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedGroupId ? (
                  <>
                    {/* Group Header */}
                    <div className="p-4 bg-white border-b border-gray-200 relative z-10">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-black truncate">{selectedGroup?.name}</h2>
                          {selectedGroup?.description && (
                            <p className="text-sm text-gray-600 mt-1 truncate">{selectedGroup.description}</p>
                          )}
                        </div>
                        {/* Task Search and Filters */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Tìm nhiệm vụ..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-sm"
                            />
                          </div>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                          >
                            <option value="all">Tất cả</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                          >
                            <option value="all">Ưu tiên</option>
                            <option value="low">Thấp</option>
                            <option value="medium">Trung bình</option>
                            <option value="high">Cao</option>
                            <option value="urgent">Khẩn cấp</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Task List - Kanban Style */}
                    <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                      <div className="grid grid-cols-3 gap-6 h-full">
                        {/* To Do Column */}
                        <div
                          className={`bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200 flex flex-col transition-all overflow-hidden ${getDropZoneClasses('todo')}`}
                          {...registerDropZoneHandlers('todo')}
                        >
                          {/* Column Header */}
                          <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <Circle className="h-4 w-4" />
                              <h2 className="font-bold text-sm">TO DO</h2>
                              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {tasksByStatus.todo.length}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                            {tasksByStatus.todo.map(task => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onDelete={handleDeleteTask}
                                onOpenDetail={() => router.push(`/tasks/${task.id}`)}
                                canDelete={canDeleteTask()}
                                onDragStartTask={handleDragStartTask}
                                onDragEndTask={handleDragEndTask}
                                isDragging={draggingTaskId === task.id}
                              />
                            ))}
                            {tasksByStatus.todo.length === 0 && (
                              <div className="text-center text-gray-400 text-sm py-8">
                                Không có nhiệm vụ
                              </div>
                            )}
                          </div>
                        </div>

                        {/* In Progress Column */}
                        <div
                          className={`bg-gradient-to-b from-blue-50 to-white rounded-lg border border-gray-200 flex flex-col transition-all overflow-hidden ${getDropZoneClasses('in_progress')}`}
                          {...registerDropZoneHandlers('in_progress')}
                        >
                          {/* Column Header */}
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <h2 className="font-bold text-sm">IN PROGRESS</h2>
                              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {tasksByStatus.in_progress.length}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                            {tasksByStatus.in_progress.map(task => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onDelete={handleDeleteTask}
                                onOpenDetail={() => router.push(`/tasks/${task.id}`)}
                                canDelete={canDeleteTask()}
                                onDragStartTask={handleDragStartTask}
                                onDragEndTask={handleDragEndTask}
                                isDragging={draggingTaskId === task.id}
                              />
                            ))}
                            {tasksByStatus.in_progress.length === 0 && (
                              <div className="text-center text-gray-400 text-sm py-8">
                                Không có nhiệm vụ
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Completed Column */}
                        <div
                          className={`bg-gradient-to-b from-green-50 to-white rounded-lg border border-gray-200 flex flex-col transition-all overflow-hidden ${getDropZoneClasses('completed')}`}
                          {...registerDropZoneHandlers('completed')}
                        >
                          {/* Column Header */}
                          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              <h2 className="font-bold text-sm">COMPLETED</h2>
                              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {tasksByStatus.completed.length}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                            {tasksByStatus.completed.map(task => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onDelete={handleDeleteTask}
                                onOpenDetail={() => router.push(`/tasks/${task.id}`)}
                                canDelete={canDeleteTask()}
                                onDragStartTask={handleDragStartTask}
                                onDragEndTask={handleDragEndTask}
                                isDragging={draggingTaskId === task.id}
                              />
                            ))}
                            {tasksByStatus.completed.length === 0 && (
                              <div className="text-center text-gray-400 text-sm py-8">
                                Không có nhiệm vụ
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-500 mb-2">Chọn một nhóm để xem nhiệm vụ</h3>
                      <p className="text-sm text-gray-400">Chọn nhóm từ danh sách bên trái để bắt đầu</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          {/* Create Task Modal */}
          {showCreateModal && (
            <CreateTaskModal
              task={newTask}
              setTask={setNewTask}
              files={newFiles}
              setFiles={setNewFiles}
              groups={groups}
              employees={employees}
              loadingEmployees={loadingEmployees}
              groupMembers={groupMembers}
              loadingGroupMembers={loadingGroupMembers}
              onClose={() => {
                setShowCreateModal(false)
                setGroupMembers([])
              }}
              onSubmit={handleCreateTask}
            />
          )}

          {/* Create Group Modal - Right Sidebar */}
          {showGroupModal && (
            <CreateGroupSidebar
              group={newGroup}
              setGroup={setNewGroup}
              employees={employees}
              loadingEmployees={loadingEmployees}
              onToggleEmployee={toggleEmployeeSelection}
              onClose={() => {
                setShowGroupModal(false)
                setNewGroup(createEmptyGroup())
              }}
              onSubmit={handleCreateGroup}
            />
          )}

        </div>
      </LayoutWithSidebar>
    </>
  )
}

// Task Card Component - Bitrix24 Style
function TaskCard({
  task,
  onDelete,
  onOpenDetail,
  canDelete = false,
  onDragStartTask,
  onDragEndTask,
  isDragging
}: {
  task: Task
  onDelete: (id: string) => void
  onOpenDetail: () => void
  canDelete?: boolean
  onDragStartTask: (id: string) => void
  onDragEndTask: () => void
  isDragging: boolean
}) {
  const handleCardDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.stopPropagation()
    event.dataTransfer.setData('text/plain', task.id)
    onDragStartTask(task.id)
  }

  const handleCardDragEnd = (event: DragEvent<HTMLDivElement>) => {
    event.stopPropagation()
    onDragEndTask()
  }

  // Get priority badge style (Bitrix24 colors)
  const getPriorityBadge = (priority: TaskPriority) => {
    const styles = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      low: 'bg-gray-100 text-gray-600 border-gray-300'
    }
    const labels = {
      urgent: '🔴 Khẩn cấp',
      high: '🟠 Cao',
      medium: '🟡 Trung bình',
      low: '⚪ Thấp'
    }
    return { style: styles[priority], label: labels[priority] }
  }

  // Check if task is overdue
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!task.due_date || task.status === 'completed') return null
    const now = new Date()
    const due = new Date(task.due_date)
    const diffMs = due.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMs < 0) {
      // Overdue
      const overdueHours = Math.abs(diffHours)
      const overdueDays = Math.floor(overdueHours / 24)
      if (overdueDays > 0) {
        return `Quá hạn ${overdueDays} ngày`
      }
      return `Quá hạn ${overdueHours}h`
    }
    
    if (diffDays > 0) {
      return `Còn ${diffDays} ngày`
    }
    if (diffHours > 0) {
      return `Còn ${diffHours}h`
    }
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    if (diffMinutes > 0) {
      return `Còn ${diffMinutes} phút`
    }
    return 'Sắp hết hạn'
  }

  // Get initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const priorityBadge = getPriorityBadge(task.priority)
  const timeRemaining = getTimeRemaining()
  const memberCount = typeof task.assignee_count === 'number'
    ? task.assignee_count
    : task.assignee_ids?.length
      ? task.assignee_ids.length
      : task.assigned_to_name
        ? 1
        : 0

  return (
    <div
      draggable
      onDragStart={handleCardDragStart}
      onDragEnd={handleCardDragEnd}
      className={`bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-all duration-200 cursor-pointer group ${isDragging ? 'ring-2 ring-blue-500 shadow-xl opacity-50' : 'hover:border-blue-300'
        }`}
      onClick={onOpenDetail}
    >
      {/* Header: Priority + Quick Actions */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${priorityBadge.style}`}>
          {priorityBadge.label}
        </span>
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-0.5 rounded transition-opacity"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-xs leading-tight">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-[10px] text-gray-600 mb-1.5 line-clamp-2 leading-snug">
          {task.description}
        </p>
      )}

      {/* Progress Indicators */}
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        {task.comment_count && task.comment_count > 0 && (
          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-blue-200">
            <CheckSquare className="h-2.5 w-2.5" />
            <span className="font-medium">Checklist</span>
          </span>
        )}
        {memberCount > 0 && (
          <span
            className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-teal-200"
            title={`Số thành viên được giao: ${memberCount}`}
          >
            <Users className="h-2.5 w-2.5" />
            <span className="font-medium">TV: {memberCount}</span>
          </span>
        )}
        {task.attachment_count && task.attachment_count > 0 && (
          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-purple-200">
            <Paperclip className="h-2.5 w-2.5" />
            <span className="font-medium">{task.attachment_count}</span>
          </span>
        )}
        {timeRemaining && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border font-medium ${
            isOverdue 
              ? 'bg-red-50 text-red-700 border-red-200' 
              : 'bg-orange-50 text-orange-700 border-orange-200'
          }`}>
            <Clock className="h-2.5 w-2.5" />
            <span>{timeRemaining}</span>
          </span>
        )}
      </div>

      {/* Footer: Assignee + Due Date + Comments */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 mt-1.5">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          {task.assigned_to_name ? (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                {getInitials(task.assigned_to_name)}
              </div>
              <span className="text-[10px] text-gray-700 font-medium truncate max-w-[80px]">
                {task.assigned_to_name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 italic">Chưa giao</span>
          )}
        </div>

        {/* Right side: Due Date + Comments */}
        <div className="flex items-center gap-1.5">
          {task.comment_count && task.comment_count > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-600">
              <MessageSquare className="h-2.5 w-2.5" />
              <span className="font-medium">{task.comment_count}</span>
            </span>
          )}
          {task.due_date && (
            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'
              }`}>
              <Calendar className="h-2.5 w-2.5" />
              {new Date(task.due_date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Create Task Modal Component - Right Sidebar
function CreateTaskModal({
  task,
  setTask,
  files,
  setFiles,
  groups,
  employees,
  loadingEmployees,
  groupMembers,
  loadingGroupMembers,
  onClose,
  onSubmit
}: {
  task: Partial<Task & { assignee_ids?: string[] }>
  setTask: (task: Partial<Task & { assignee_ids?: string[] }>) => void
  files: File[]
  setFiles: (files: File[]) => void
  groups: TaskGroup[]
  employees: Array<{ id: string; name: string; email?: string }>
  loadingEmployees: boolean
  groupMembers: Array<{ employee_id: string; employee_name?: string; employee_email?: string }>
  loadingGroupMembers: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)])
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const estimatedHoursValue = typeof task.estimated_time === 'number'
    ? (task.estimated_time / 60).toString()
    : ''

  const handleEstimatedChange = (value: string) => {
    const hours = parseFloat(value)
    if (Number.isNaN(hours) || hours < 0) {
      setTask({ ...task, estimated_time: undefined })
      return
    }
    setTask({ ...task, estimated_time: Math.round(hours * 60) })
  }

  const datetimeLocalValue = (value?: string) => value || ''

  useEffect(() => {
    if (!task.start_date || !task.due_date) return
    const startMs = Date.parse(task.start_date)
    const endMs = Date.parse(task.due_date)
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return
    const minutes = Math.max(1, Math.round((endMs - startMs) / 60000))
    if (task.estimated_time === minutes) return
    setTask({ ...task, estimated_time: minutes })
  }, [task.start_date, task.due_date, setTask])

  return (
    <>
      {/* Very transparent backdrop - overlay để thấy danh sách nhóm */}
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
      />

      {/* Right Sidebar */}
      <div className="fixed top-16 right-4 z-50 w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div>
              <h2 className="text-xl font-bold text-black">Tạo Nhiệm Vụ Mới</h2>
              <p className="text-sm font-semibold text-black mt-1">Thêm nhiệm vụ vào nhóm</p>
            </div>
            <button
              onClick={onClose}
              className="text-black hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-bold text-black mb-4">Thông tin nhiệm vụ</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => setTask({ ...task, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-semibold placeholder-gray-500"
                    placeholder="Nhập tiêu đề nhiệm vụ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={task.description}
                    onChange={(e) => setTask({ ...task, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-semibold placeholder-gray-500"
                    rows={3}
                    placeholder="Nhập mô tả nhiệm vụ..."
                  />
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div>
              <h3 className="text-lg font-bold text-black mb-4">Chi tiết</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Trạng thái</label>
                  <select
                    value={task.status}
                    onChange={(e) => setTask({ ...task, status: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-semibold"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Độ ưu tiên</label>
                  <select
                    value={task.priority}
                    onChange={(e) => setTask({ ...task, priority: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-semibold"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={datetimeLocalValue(task.start_date)}
                    onChange={(e) => setTask({ ...task, start_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Hạn chót</label>
                  <input
                    type="datetime-local"
                    value={datetimeLocalValue(task.due_date)}
                    onChange={(e) => setTask({ ...task, due_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Thời lượng ước tính (giờ)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedHoursValue}
                    onChange={(e) => handleEstimatedChange(e.target.value)}
                    placeholder="ví dụ: 2 hoặc 2.5"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div>
              <h3 className="text-lg font-bold text-black mb-4">Phân công</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Nhóm</label>
                  <select
                    value={task.group_id}
                    onChange={(e) => {
                      // Reset assignees when group changes
                      setTask({ ...task, group_id: e.target.value, assigned_to: undefined, assignee_ids: [] })
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-semibold"
                  >
                    <option value="">Chọn nhóm</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Người phụ trách {task.assignee_ids && task.assignee_ids.length > 0 && `(${task.assignee_ids.length})`}
                  </label>
                  {loadingEmployees || loadingGroupMembers ? (
                    <div className="text-sm text-gray-500">Đang tải danh sách nhân viên...</div>
                  ) : !task.group_id ? (
                    <div className="text-sm text-gray-500 italic">Vui lòng chọn nhóm trước</div>
                  ) : (
                    <div className="border-2 border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                      {(() => {
                        // Nếu có group_id, chỉ hiển thị members của nhóm đó
                        let availableEmployees = employees
                        if (task.group_id && groupMembers.length > 0) {
                          const memberIds = groupMembers.map(m => m.employee_id)
                          availableEmployees = employees.filter(emp => memberIds.includes(emp.id))
                        }

                        if (availableEmployees.length === 0) {
                          return (
                            <p className="text-sm text-gray-500 text-center py-4">
                              {task.group_id && groupMembers.length === 0
                                ? 'Nhóm này chưa có thành viên nào'
                                : 'Không có nhân viên nào'}
                            </p>
                          )
                        }

                        const assigneeIds = task.assignee_ids || []
                        const memberMap = new Map(groupMembers.map(m => [m.employee_id, m]))

                        return (
                          <div className="space-y-2">
                            {availableEmployees.map((employee) => {
                              const member = memberMap.get(employee.id)
                              const displayName = member?.employee_name || employee.name
                              const displayEmail = member?.employee_email || employee.email
                              const isSelected = assigneeIds.includes(employee.id)

                              return (
                                <label
                                  key={employee.id}
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const currentIds = task.assignee_ids || []
                                      if (e.target.checked) {
                                        setTask({ ...task, assignee_ids: [...currentIds, employee.id] })
                                      } else {
                                        setTask({ ...task, assignee_ids: currentIds.filter(id => id !== employee.id) })
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-900">{displayName}</span>
                                    {displayEmail && (
                                      <span className="text-xs text-gray-500 block">{displayEmail}</span>
                                    )}
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <h3 className="text-lg font-bold text-black mb-4">Tài liệu đính kèm</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors text-center">
                <input
                  type="file"
                  id="create-task-file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="create-task-file" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                    <Paperclip className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Click để tải lên tài liệu
                  </span>
                  <span className="text-xs text-gray-500">
                    Hỗ trợ nhiều file
                  </span>
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-black font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Tạo Nhiệm Vụ
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

// Create Group Sidebar Component - Right Sidebar
function CreateGroupSidebar({
  group,
  setGroup,
  employees,
  loadingEmployees,
  onToggleEmployee,
  onClose,
  onSubmit
}: {
  group: NewTaskGroupForm
  setGroup: (group: NewTaskGroupForm) => void
  employees: Array<{ id: string; name: string; email?: string }>
  loadingEmployees: boolean
  onToggleEmployee: (employeeId: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const [searchEmployee, setSearchEmployee] = useState('')

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchEmployee.toLowerCase())
  )

  return (
    <>
      {/* Very transparent backdrop - overlay để thấy danh sách nhóm */}
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
      />

      {/* Right Sidebar */}
      <div className="fixed top-16 right-4 z-50 w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div>
              <h2 className="text-xl font-bold text-black">Tạo Nhóm Mới</h2>
              <p className="text-sm font-semibold text-black mt-1">Thêm nhóm làm việc và chọn thành viên</p>
            </div>
            <button
              onClick={onClose}
              className="text-black hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-bold text-black mb-4">Thông tin nhóm</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Tên nhóm *
                  </label>
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => setGroup({ ...group, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-semibold placeholder-gray-500"
                    placeholder="Nhập tên nhóm..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={group.description}
                    onChange={(e) => setGroup({ ...group, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black font-semibold placeholder-gray-500"
                    rows={3}
                    placeholder="Nhập mô tả nhóm..."
                  />
                </div>
              </div>
            </div>

            {/* Group Identity (Avatar & Color) */}
            <div>
              <h3 className="text-lg font-bold text-black mb-4">Nhận diện nhóm</h3>
              <div className="flex gap-6">
                {/* Avatar Upload */}
                <div className="flex-1">
                  <label className="block text-sm font-bold text-black mb-2">
                    Ảnh đại diện
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                      {group.avatar_url ? (
                        <img src={group.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="group-avatar-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          const formData = new FormData()
                          formData.append('file', file)

                          try {
                            // Lấy token từ Supabase session
                            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                            if (sessionError || !session?.access_token) {
                              alert('Vui lòng đăng nhập lại để upload ảnh')
                              console.error('Session error:', sessionError)
                              return
                            }

                            const response = await fetch(`${API_BASE_URL}/api/tasks/groups/upload`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${session.access_token}`
                              },
                              body: formData
                            })

                            if (!response.ok) {
                              const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
                              throw new Error(errorData.message || 'Không thể upload ảnh')
                            }

                            const data = await response.json()
                            setGroup({ ...group, avatar_url: data.url || data.avatar_url })
                          } catch (error) {
                            console.error('Upload failed', error)
                            alert(error instanceof Error ? error.message : 'Không thể upload ảnh. Vui lòng thử lại.')
                          }
                        }}
                      />
                      <label
                        htmlFor="group-avatar-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Tải ảnh lên
                      </label>
                    </div>
                  </div>
                </div>

                {/* Color Picker */}
                <div className="flex-1">
                  <label className="block text-sm font-bold text-black mb-2">
                    Màu sắc
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {GROUP_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setGroup({ ...group, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${group.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                          }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Select Employees */}
            <div>
              <h3 className="text-lg font-bold text-black mb-4">Chọn thành viên</h3>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhân viên..."
                    value={searchEmployee}
                    onChange={(e) => setSearchEmployee(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
              </div>

              <div className="border-2 border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {loadingEmployees ? (
                  <div className="p-4 text-center text-black">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p>Đang tải danh sách nhân viên...</p>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-black">
                    <p>Không tìm thấy nhân viên</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredEmployees.map((employee) => {
                      const isSelected = group.member_ids.includes(employee.id)
                      return (
                        <label
                          key={employee.id}
                          className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                            }`}
                        >
                          <div className="flex items-center flex-1">
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 ${isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                              }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-black">{employee.name}</p>
                              {employee.email && (
                                <p className="text-sm text-gray-600">{employee.email}</p>
                              )}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleEmployee(employee.id)}
                            className="sr-only"
                          />
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {group.member_ids.length > 0 && (
                <div className="mt-3 text-sm text-black">
                  Đã chọn: <span className="font-semibold">{group.member_ids.length}</span> nhân viên
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-black font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Tạo Nhóm
              </button>
            </div>
          </form>
        </div >
      </div >
    </>
  )
}

