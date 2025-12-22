'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Circle,
  MessageSquare,
  Paperclip,
  AlertCircle,
  ArrowRight,
  ListChecks,
  Check,
  FileText,
  File,
  FileSpreadsheet,
  FileType,
  Image as ImageIcon,
  Reply,
  Pin,
  Send,
  X,
  Trash2,
  Plus
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { TaskChecklist, TaskChecklistItem, TaskComment } from '@/types/task'
import { supabase } from '@/lib/supabase'
import CreateTodoModal from '@/components/CreateTodoModal'

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

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  start_date?: string
  assigned_to_name?: string
  created_by_name?: string
  group_name?: string
  comment_count?: number
  attachment_count?: number
  assignee_count?: number
  checklists?: TaskChecklist[]
  parent_id?: string | null
  created_at: string
}

const statusConfig = {
  todo: { label: 'Cần làm', color: 'bg-gray-100 text-gray-800', icon: Circle },
  in_progress: { label: 'Đang làm', color: 'bg-blue-100 text-blue-800', icon: Clock },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: AlertCircle }
}

const priorityConfig = {
  low: { label: 'Thấp', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Cao', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' }
}

interface ProjectTasksTabProps {
  projectId: string
  projectName?: string
}

export default function ProjectTasksTab({ projectId, projectName }: ProjectTasksTabProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed' | 'cancelled'>('all')
  const [project, setProject] = useState<any>(null)
  const [projectStatuses, setProjectStatuses] = useState<any[]>([])
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [allComments, setAllComments] = useState<TaskComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [replyingTo, setReplyingTo] = useState<TaskComment | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null)
  const [groupMembers, setGroupMembers] = useState<Array<{ 
    employee_id: string; 
    employee_name?: string; 
    employee_email?: string;
    responsibility_type?: 'accountable' | 'responsible' | 'consulted' | 'informed';
    avatar?: string;
    phone?: string;
    status?: string;
  }>>([])
  const [newMessageNotification, setNewMessageNotification] = useState<{ id: string; message: string } | null>(null)
  const mentionInputRef = useRef<HTMLTextAreaElement | null>(null)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [quickTaskDescription, setQuickTaskDescription] = useState('')
  const [quickCreating, setQuickCreating] = useState(false)
  const [quickParentTaskId, setQuickParentTaskId] = useState<string | null>(null)
  const [quickTaskFiles, setQuickTaskFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Checklist creation states
  const [showCreateChecklist, setShowCreateChecklist] = useState(false)
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [creatingChecklist, setCreatingChecklist] = useState(false)
  const [targetTaskId, setTargetTaskId] = useState<string | null>(null)
  
  // Checklist item creation states
  const [showCreateChecklistItem, setShowCreateChecklistItem] = useState<string | null>(null)
  const [checklistItemContent, setChecklistItemContent] = useState('')
  const [checklistItemFiles, setChecklistItemFiles] = useState<File[]>([])
  const [creatingChecklistItem, setCreatingChecklistItem] = useState<string | null>(null)
  const checklistItemFileInputRef = useRef<HTMLInputElement | null>(null)
  const [showCreateTodoModal, setShowCreateTodoModal] = useState(false)

  useEffect(() => {
    fetchUser()
    fetchProject()
    fetchTasks()
  }, [projectId, statusFilter])

  useEffect(() => {
    // Fetch statuses when project is loaded or category changes
    if (project) {
      if (project.category_id) {
        fetchProjectStatuses(project.category_id)
      } else {
        fetchProjectStatuses()
      }
    }
  }, [project?.category_id, project?.id])

  useEffect(() => {
    if (tasks.length > 0) {
      fetchAllComments()
      // Set selected task to first task if available
      if (!selectedTaskId) {
        setSelectedTaskId(tasks[0].id)
      }
      // Load group members for mentions
      loadGroupMembers()
    }
  }, [tasks, selectedTaskId])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (tasks.length === 0) return
    
    const interval = setInterval(() => {
      fetchAllComments(true) // silent update
    }, 5000)

    return () => clearInterval(interval)
  }, [tasks])

  useEffect(() => {
    // Auto-create preview for first image file
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

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        setUser(userData)
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const fetchProject = async () => {
    try {
      const data = await apiGet(`/api/projects/${projectId}`)
      setProject(data)
    } catch (err) {
      console.error('Error fetching project:', err)
    }
  }

  const fetchProjectStatuses = async (categoryId?: string) => {
    try {
      const url = categoryId && categoryId !== 'all' 
        ? `/api/projects/statuses?category_id=${categoryId}`
        : '/api/projects/statuses'
      const data = await apiGet(url)
      setProjectStatuses(data || [])
    } catch (err) {
      console.error('Error fetching project statuses:', err)
    }
  }

  const handleUpdateProjectStatus = async (statusId: string) => {
    if (!project || updatingStatus) return
    
    try {
      setUpdatingStatus(true)
      await apiPut(`/api/projects/${projectId}`, {
        status_id: statusId
      })
      // Refresh project data
      await fetchProject()
      // Optionally refresh page to show updated status
      window.location.reload()
    } catch (err: any) {
      console.error('Error updating project status:', err)
      alert(err.message || 'Không thể cập nhật trạng thái dự án')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const queryParams = new URLSearchParams({ project_id: projectId })
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter)
      }
      const data = await apiGet(`/api/tasks?${queryParams.toString()}`)
      setTasks(data || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError('Không thể tải danh sách nhiệm vụ')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllComments = async (silent = false) => {
    try {
      if (!silent) {
        setLoadingComments(true)
      }
      const commentsPromises = tasks.map(async (task) => {
        try {
          const comments = await apiGet(`/api/tasks/${task.id}/comments`)
          return (comments || []).map((comment: TaskComment) => ({
            ...comment,
            task_id: task.id,
            task_title: task.title
          }))
        } catch (err) {
          console.error(`Error fetching comments for task ${task.id}:`, err)
          return []
        }
      })
      const commentsArrays = await Promise.all(commentsPromises)
      const allCommentsFlat = commentsArrays.flat()
      // Sort by created_at descending
      allCommentsFlat.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      // Check for new messages (not from current user)
      if (silent && user && allComments.length > 0) {
        const newComments = allCommentsFlat.filter(newComment => {
          const isNew = !allComments.find(oldComment => oldComment.id === newComment.id)
          const isNotFromMe = newComment.user_id !== user.id && newComment.employee_id !== user.id
          return isNew && isNotFromMe
        })
        
        if (newComments.length > 0) {
          // Show notification
          const latestComment = newComments[0]
          setNewMessageNotification({
            id: latestComment.id,
            message: `${latestComment.user_name || latestComment.employee_name || 'Ai đó'}: ${latestComment.comment?.substring(0, 50) || 'đã gửi tin nhắn'}...`
          })
          // Auto-hide after 5 seconds
          setTimeout(() => {
            setNewMessageNotification(null)
          }, 5000)
        }
      }
      
      setAllComments(allCommentsFlat)
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      if (!silent) {
        setLoadingComments(false)
      }
    }
  }

  const loadGroupMembers = async () => {
    try {
      // Get project team members for mentions
      try {
        const teamData = await apiGet(`/api/projects/${projectId}/team`)
        const teamMembers = teamData?.team_members || []
        
        // Convert to format expected by mentions
        const members = teamMembers
          .filter((member: any) => member.status === 'active')
          .map((member: any) => ({
            employee_id: member.user_id || member.id, // Use user_id if available, fallback to id
            employee_name: member.name,
            employee_email: member.email
          }))
        
        setGroupMembers(members)
      } catch (teamErr) {
        console.error('Error fetching project team members:', teamErr)
        // Fallback: Get group members from all tasks
        const groupIds = [...new Set(tasks.map(t => t.group_id).filter(Boolean))]
        if (groupIds.length === 0) {
          setGroupMembers([])
          return
        }
        
        const membersPromises = groupIds.map(async (groupId) => {
          try {
            // Pass project_id to get project team information
            const members = await apiGet(`/api/tasks/groups/${groupId}/members?project_id=${projectId}`)
            return members || []
          } catch (err) {
            console.error(`Error fetching members for group ${groupId}:`, err)
            return []
          }
        })
        
        const membersArrays = await Promise.all(membersPromises)
        const allMembers = membersArrays.flat()
        // Remove duplicates
        const uniqueMembers = Array.from(
          new Map(allMembers.map(m => [m.employee_id, m])).values()
        )
        setGroupMembers(uniqueMembers)
      }
    } catch (err) {
      console.error('Error loading group members:', err)
      setGroupMembers([])
    }
  }

  const getMentionMembers = () => {
    const members: Array<{ id: string; name: string; type: 'member' }> = []
    
    groupMembers.forEach(member => {
      const name = member.employee_name || member.employee_email || 'Thành viên'
      members.push({
        id: member.employee_id,
        name: name,
        type: 'member'
      })
    })
    
    return members
  }

  const getMentionChecklistItems = () => {
    const items: Array<{ id: string; name: string; type: 'checklist' }> = []
    
    tasks.forEach(task => {
      task.checklists?.forEach(checklist => {
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
    })
    
    return items
  }

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
      if (mentionInputRef.current) {
        mentionInputRef.current.focus()
        const newCursorPos = beforeMention.length + mentionText.length + 1
        mentionInputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const getFilteredMentions = () => {
    const members = getMentionMembers()
    const checklistItems = getMentionChecklistItems()
    
    const allMentions = [...members, ...checklistItems]
    
    if (!mentionQuery) {
      return allMentions
    }
    
    const query = mentionQuery.toLowerCase()
    return allMentions.filter(item => 
      item.name.toLowerCase().includes(query)
    )
  }

  const formatDate = (dateString: string | undefined, includeTime = false) => {
    if (!dateString) return 'Chưa có'
    try {
      const date = new Date(dateString)
      if (includeTime) {
        return date.toLocaleDateString('vi-VN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Chưa có'
    }
  }


  const getFileNameFromUrl = (url: string): string => {
    try {
      // Remove query parameters
      const urlWithoutParams = url.split('?')[0]
      // Get the last part of the path
      const fileName = urlWithoutParams.split('/').pop() || 'File'
      // Decode URL encoding
      return decodeURIComponent(fileName)
    } catch {
      return 'File'
    }
  }

  const getFileIcon = (url: string): string | null => {
    const fileName = getFileNameFromUrl(url).toLowerCase()
    
    // PDF
    if (fileName.endsWith('.pdf')) {
      return '/icon/pdf.png'
    }
    
    // Excel files
    if (fileName.match(/\.(xls|xlsx|xlsm)(\?|$)/i)) {
      return '/icon/Excel.png'
    }
    
    // Word files
    if (fileName.match(/\.(doc|docx)(\?|$)/i)) {
      return '/icon/doc.png'
    }
    
    // Images - return null to use ImageIcon component
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i) || url.includes('image')) {
      return null
    }
    
    // Default - return null to use File icon component
    return null
  }
  
  const getFileIconComponent = (url: string) => {
    const fileName = getFileNameFromUrl(url).toLowerCase()
    
    // Images
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i) || url.includes('image')) {
      return ImageIcon
    }
    
    // Text files
    if (fileName.match(/\.(txt|md|rtf)(\?|$)/i)) {
      return FileText
    }
    
    // Default
    return File
  }

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
  }

  const openQuickCreate = (parentTaskId?: string) => {
    setQuickParentTaskId(parentTaskId || null)
    setShowQuickCreate(true)
  }

  const openCreateChecklist = (taskId: string) => {
    setTargetTaskId(taskId)
    setShowCreateChecklist(true)
  }

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim() || !targetTaskId) {
      alert('Vui lòng nhập tên việc cần làm')
      return
    }
    try {
      setCreatingChecklist(true)
      const created = await apiPost(`/api/tasks/${targetTaskId}/checklists`, {
        title: newChecklistTitle.trim()
      })
      if (created) {
        // Update tasks state to include new checklist
        setTasks(prev => prev.map(task => {
          if (task.id === targetTaskId) {
            return {
              ...task,
              checklists: [...(task.checklists || []), {
                ...created,
                items: []
              }]
            }
          }
          return task
        }))
      }
      setNewChecklistTitle('')
      setShowCreateChecklist(false)
      setTargetTaskId(null)
    } catch (err: any) {
      console.error('Failed to create checklist:', err)
      alert(err?.message || 'Không thể tạo việc cần làm')
    } finally {
      setCreatingChecklist(false)
    }
  }

  const handleCreateChecklistItem = async (checklistId: string, taskId: string) => {
    if (!checklistItemContent.trim() && checklistItemFiles.length === 0) {
      alert('Vui lòng nhập nội dung hoặc chọn file')
      return
    }
    try {
      setCreatingChecklistItem(checklistId)
      let fileUrls: string[] = []
      
      // Upload files if any
      if (checklistItemFiles.length > 0) {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          throw new Error('Thiếu token xác thực, vui lòng đăng nhập lại')
        }

        for (const file of checklistItemFiles) {
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
      let itemContent = checklistItemContent.trim() || ''
      if (fileUrls.length > 0) {
        const fileUrlsText = fileUrls.join(' ')
        itemContent = itemContent 
          ? `${itemContent} [FILE_URLS: ${fileUrlsText}]`
          : `📎 ${fileUrls.length} file(s) [FILE_URLS: ${fileUrlsText}]`
      }

      const newItem = await apiPost(`/api/tasks/checklists/${checklistId}/items`, {
        content: itemContent
      })
      
      // Update tasks state
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            checklists: task.checklists?.map(checklist => {
              if (checklist.id !== checklistId) return checklist
              const updatedItems = [...(checklist.items || []), newItem]
              return {
                ...checklist,
                items: updatedItems
              }
            }) || []
          }
        }
        return task
      }))

      setChecklistItemContent('')
      setChecklistItemFiles([])
      setShowCreateChecklistItem(null)
      if (checklistItemFileInputRef.current) {
        checklistItemFileInputRef.current.value = ''
      }
    } catch (err: any) {
      console.error('Failed to create checklist item:', err)
      alert(err?.message || 'Không thể tạo việc cần làm nhỏ')
    } finally {
      setCreatingChecklistItem(null)
    }
  }

  const handleQuickCreateTask = async () => {
    if (!quickTaskTitle.trim()) {
      alert('Vui lòng nhập tiêu đề nhiệm vụ')
      return
    }
    try {
      setQuickCreating(true)
      const payload: any = {
        title: quickTaskTitle.trim(),
        description: quickTaskDescription.trim() || null,
        status: 'todo',
        priority: 'medium',
        project_id: projectId
      }
      if (quickParentTaskId) {
        payload.parent_id = quickParentTaskId
      }

      const created = await apiPost('/api/tasks', payload)
      if (created) {
        setTasks(prev => [created, ...prev])
        
        // Upload files if any
        if (quickTaskFiles.length > 0 && created.id) {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) {
              throw new Error('Thiếu token xác thực, vui lòng đăng nhập lại')
            }

            await Promise.all(quickTaskFiles.map(async (file) => {
              const formData = new FormData()
              formData.append('file', file)

              const response = await fetch(`/api/tasks/${created.id}/attachments`, {
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

              return await response.json()
            }))
          } catch (uploadError) {
            console.error('File upload error:', uploadError)
            alert(`Đã tạo nhiệm vụ nhưng không thể upload một số tài liệu: ${uploadError instanceof Error ? uploadError.message : 'Lỗi không xác định'}`)
          }
        }
      }

      setQuickTaskTitle('')
      setQuickTaskDescription('')
      setQuickTaskFiles([])
      setQuickParentTaskId(null)
      setShowQuickCreate(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      console.error('Failed to create task from project view', err)
      alert(err?.message || 'Không thể tạo nhiệm vụ')
    } finally {
      setQuickCreating(false)
    }
  }

  const toggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    try {
      // Optimistic update
      setTasks(prev =>
        prev.map(task => ({
          ...task,
          checklists: task.checklists?.map(cl => ({
            ...cl,
            items: cl.items?.map(it =>
              it.id === itemId ? { ...it, is_completed: !isCompleted } : it
            ) || []
          })) || []
        }))
      )

      await apiPut(`/api/tasks/checklist-items/${itemId}`, {
        is_completed: !isCompleted
      })
    } catch (err) {
      // Revert on error
      setTasks(prev =>
        prev.map(task => ({
          ...task,
          checklists: task.checklists?.map(cl => ({
            ...cl,
            items: cl.items?.map(it =>
              it.id === itemId ? { ...it, is_completed: isCompleted } : it
            ) || []
          })) || []
        }))
      )
      console.error('Failed to toggle checklist item', err)
      alert('Không thể cập nhật việc cần làm')
    }
  }

  const uploadChatFile = async (file: File, taskId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('Thiếu token xác thực, vui lòng đăng nhập lại')
      }
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
        throw new Error('Không thể tải file')
      }
      const data = await response.json()
      return data.file_url || data.url
    } catch (err) {
      console.error('Error uploading file:', err)
      throw err
    }
  }

  const handleSendMessage = async () => {
    if (!selectedTaskId) {
      alert('Vui lòng chọn nhiệm vụ để gửi tin nhắn')
      return
    }
    const trimmedMessage = chatMessage.trim()
    if (!trimmedMessage && pendingFiles.length === 0) return
    
    try {
      setSendingMessage(true)

      // Upload tất cả files trước
      const uploadedFiles: Array<{ file: File; url: string }> = []
      for (const file of pendingFiles) {
        try {
          const fileUrl = await uploadChatFile(file, selectedTaskId)
          uploadedFiles.push({ file, url: fileUrl })
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError)
          alert(`Không thể gửi file "${file.name}": ${getErrorMessage(fileError, 'Lỗi không xác định')}`)
        }
      }

      // Nếu có cả text và file: gộp thành 1 tin nhắn
      if (trimmedMessage && uploadedFiles.length > 0) {
        // Gửi 1 comment với text và file đầu tiên
        const firstFile = uploadedFiles[0]
        const messageType: 'file' | 'image' = firstFile.file.type.startsWith('image/') ? 'image' : 'file'
        
        await apiPost(`/api/tasks/${selectedTaskId}/comments`, {
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
          await apiPost(`/api/tasks/${selectedTaskId}/comments`, {
            comment: fileData.file.name || 'File đính kèm',
            type: fileMessageType,
            file_url: fileData.url,
            is_pinned: false,
            parent_id: replyingTo?.id || null
          })
        }
      } else if (trimmedMessage) {
        // Chỉ có text, không có file
        await apiPost(`/api/tasks/${selectedTaskId}/comments`, {
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
          await apiPost(`/api/tasks/${selectedTaskId}/comments`, {
            comment: fileData.file.name || 'File đính kèm',
            type: messageType,
            file_url: fileData.url,
            is_pinned: false,
            parent_id: replyingTo?.id || null
          })
        }
      }

      // Optimistic update - add message immediately (only if we have text or first file)
      if (trimmedMessage || uploadedFiles.length > 0) {
        const firstFile = uploadedFiles[0]
        const tempComment: TaskComment = {
          id: `temp-${Date.now()}`,
          task_id: selectedTaskId,
          user_id: user?.id,
          comment: trimmedMessage || firstFile?.file.name || 'File đính kèm',
          type: firstFile ? (firstFile.file.type.startsWith('image/') ? 'image' : 'file') : 'text',
          file_url: firstFile?.url,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: user?.full_name,
          parent_id: replyingTo?.id || null
        }
        
        // Add to top of comments list
        setAllComments(prev => [tempComment, ...prev])
      }
      
      // Scroll to top to show new message
      setTimeout(() => {
        const chatContainer = document.querySelector('[data-chat-container]')
        if (chatContainer) {
          chatContainer.scrollTop = 0
        }
      }, 100)
      
      setChatMessage('')
      setPendingFiles([])
      setPendingPreview(null)
      setReplyingTo(null)
      
      // Then fetch real comments
      await fetchAllComments()
    } catch (err: any) {
      alert(err?.message || 'Không thể gửi tin nhắn')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleReply = (comment: TaskComment) => {
    setReplyingTo(comment)
    setSelectedTaskId(comment.task_id)
    // Scroll to input area
    setTimeout(() => {
      const inputArea = document.querySelector('[data-input-area]')
      inputArea?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  const handleTogglePin = async (comment: TaskComment) => {
    try {
      await apiPut(`/api/tasks/${comment.task_id}/comments/${comment.id}`, {
        is_pinned: !comment.is_pinned
      })
      await fetchAllComments()
    } catch (err: any) {
      alert(err?.message || 'Không thể cập nhật trạng thái ghim')
    }
  }

  const handleDeleteComment = async (comment: TaskComment) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return
    try {
      await apiDelete(`/api/tasks/${comment.task_id}/comments/${comment.id}`)
      await fetchAllComments()
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa bình luận')
    }
  }

  const canManageComment = (comment: TaskComment) => {
    if (!user) return false
    // User can delete their own comments or if they are admin/sales/accountant
    const role = user.role?.toLowerCase()
    const isModerator = role && ['admin', 'sales', 'accountant'].includes(role)
    return comment.user_id === user.id || isModerator
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Filter tasks: only show top-level tasks (no parent_id) and group subtasks with their parents
  const filteredTasks = tasks.filter(task => {
    // Only show top-level tasks (no parent_id)
    if (task.parent_id) return false
    // Apply status filter
    if (statusFilter === 'all') return true
    return task.status === statusFilter
  })

  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Nhiệm vụ dự án</h3>
              <p className="text-sm text-gray-600">
                {project?.name 
                  ? `Danh sách các nhiệm vụ của dự án "${project.name}"`
                  : 'Danh sách các nhiệm vụ liên quan đến dự án này'}
              </p>
              {tasks.length > 0 && tasks[0]?.group_name && (
                <p className="text-xs text-gray-500 mt-1">
                  Nhóm: {tasks[0].group_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {/* Project Status Selector */}
            {project && (
              <div className="relative">
                <select
                  value={project.status_id || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleUpdateProjectStatus(e.target.value)
                    }
                  }}
                  disabled={updatingStatus}
                  className="px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn trạng thái...</option>
                  {projectStatuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
                {updatingStatus && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                )}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowCreateTodoModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Thêm việc cần làm</span>
            </button>
            <button
              onClick={() => router.push(`/tasks?project_id=${projectId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="text-sm font-medium">Xem tất cả</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Tất cả', count: taskCounts.all },
            { value: 'todo', label: 'Cần làm', count: taskCounts.todo },
            { value: 'in_progress', label: 'Đang làm', count: taskCounts.in_progress },
            { value: 'completed', label: 'Hoàn thành', count: taskCounts.completed },
            { value: 'cancelled', label: 'Đã hủy', count: taskCounts.cancelled }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center py-8">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Không có nhiệm vụ nào</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Quick Create Task Inline Form */}
          {showQuickCreate && (
            <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {quickParentTaskId ? 'Thêm nhiệm vụ con' : 'Thêm nhiệm vụ mới cho dự án'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Nhiệm vụ sẽ được gắn với dự án {project?.name || projectName}
                    {quickParentTaskId && ' và liên quan đến nhiệm vụ được chọn'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQuickCreate(false)
                    setQuickTaskTitle('')
                    setQuickTaskDescription('')
                    setQuickTaskFiles([])
                    setQuickParentTaskId(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder="Tiêu đề nhiệm vụ..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <textarea
                    value={quickTaskDescription}
                    onChange={(e) => setQuickTaskDescription(e.target.value)}
                    placeholder="Mô tả (không bắt buộc)..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Đính kèm file (tùy chọn)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        setQuickTaskFiles(prev => [...prev, ...files])
                      }}
                      className="hidden"
                      id="quick-task-file-input"
                    />
                    <label
                      htmlFor="quick-task-file-input"
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-gray-700"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>Chọn file</span>
                    </label>
                    {quickTaskFiles.length > 0 && (
                      <div className="flex-1 flex items-center gap-2 flex-wrap">
                        {quickTaskFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            <File className="h-3 w-3" />
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setQuickTaskFiles(prev => prev.filter((_, i) => i !== idx))
                              }}
                              className="ml-1 text-blue-700 hover:text-blue-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickCreate(false)
                      setQuickTaskTitle('')
                      setQuickTaskDescription('')
                      setQuickTaskFiles([])
                      setQuickParentTaskId(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="px 3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickCreateTask}
                    disabled={quickCreating || !quickTaskTitle.trim()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quickCreating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang tạo...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Tạo nhiệm vụ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Task Button - Floating */}
          {!showQuickCreate && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                openQuickCreate()
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-200 p-4 hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Tạo nhiệm vụ mới</span>
            </button>
          )}

          {filteredTasks.map((task) => {
            const statusInfo = statusConfig[task.status]
            const priorityInfo = priorityConfig[task.priority]
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusIcon className={`h-5 w-5 ${statusInfo.color.replace('bg-', 'text-').replace('-100', '-600')}`} />
                      <h4 className="text-lg font-semibold text-gray-900">{task.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openCreateChecklist(task.id)
                        }}
                        className="ml-auto flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        title="Tạo nhiệm vụ lớn"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Tạo nhiệm vụ lớn</span>
                      </button>
                    </div>
                    
                    {/* Create Checklist Form - Inside Task Card */}
                    {showCreateChecklist && targetTaskId === task.id && (
                      <div 
                        className="mt-3 mb-3 p-3 bg-gray-50 rounded-lg border border-blue-200"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              Thêm việc cần làm lớn (Checklist)
                            </h4>
                            <p className="text-xs text-gray-500">
                              Việc cần làm lớn sẽ được gắn với nhiệm vụ này
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowCreateChecklist(false)
                              setNewChecklistTitle('')
                              setTargetTaskId(null)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <input
                              type="text"
                              value={newChecklistTitle}
                              onChange={(e) => setNewChecklistTitle(e.target.value)}
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                              onFocus={(e) => {
                                e.stopPropagation()
                              }}
                              placeholder="Tên việc cần làm lớn..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                              onKeyDown={(e) => {
                                e.stopPropagation()
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleCreateChecklist()
                                }
                              }}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowCreateChecklist(false)
                                setNewChecklistTitle('')
                                setTargetTaskId(null)
                              }}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCreateChecklist()
                              }}
                              disabled={creatingChecklist || !newChecklistTitle.trim()}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {creatingChecklist ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Đang tạo...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  <span>Tạo việc cần làm</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {task.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                    )}
                    
                    {/* Checklist Items */}
                    {task.checklists && task.checklists.length > 0 && (
                      <div className="mb-3 space-y-4">
                        {task.checklists.map((checklist) => {
                          const completedItems = checklist.items?.filter(item => item.is_completed).length || 0
                          const totalItems = checklist.items?.length || 0
                          const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
                          
                          return (
                            <div key={checklist.id} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-800 text-sm">{checklist.title}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowCreateChecklistItem(checklist.id)
                                      setChecklistItemContent('')
                                      setChecklistItemFiles([])
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                                    title="Thêm việc cần làm nhỏ"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Thêm</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Create Checklist Item Form */}
                              {showCreateChecklistItem === checklist.id && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-blue-200">
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={checklistItemContent}
                                      onChange={(e) => setChecklistItemContent(e.target.value)}
                                      placeholder="Nhập nội dung việc cần làm nhỏ..."
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault()
                                          handleCreateChecklistItem(checklist.id, task.id)
                                        }
                                      }}
                                    />
                                    <div className="flex items-center gap-2">
                                      <input
                                        ref={checklistItemFileInputRef}
                                        type="file"
                                        multiple
                                        onChange={(e) => {
                                          const files = Array.from(e.target.files || [])
                                          setChecklistItemFiles(prev => [...prev, ...files])
                                        }}
                                        className="hidden"
                                        id={`checklist-item-file-${checklist.id}`}
                                      />
                                      <label
                                        htmlFor={`checklist-item-file-${checklist.id}`}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-gray-700"
                                      >
                                        <Paperclip className="h-3 w-3" />
                                        <span>Chọn file</span>
                                      </label>
                                      {checklistItemFiles.length > 0 && (
                                        <div className="flex-1 flex items-center gap-1 flex-wrap">
                                          {checklistItemFiles.map((file, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                                            >
                                              <File className="h-3 w-3" />
                                              <span className="max-w-[100px] truncate">{file.name}</span>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setChecklistItemFiles(prev => prev.filter((_, i) => i !== idx))
                                                }}
                                                className="ml-1 text-blue-700 hover:text-blue-900"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setShowCreateChecklistItem(null)
                                          setChecklistItemContent('')
                                          setChecklistItemFiles([])
                                          if (checklistItemFileInputRef.current) {
                                            checklistItemFileInputRef.current.value = ''
                                          }
                                        }}
                                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCreateChecklistItem(checklist.id, task.id)
                                        }}
                                        disabled={creatingChecklistItem === checklist.id || (!checklistItemContent.trim() && checklistItemFiles.length === 0)}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {creatingChecklistItem === checklist.id ? (
                                          <>
                                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Đang tạo...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="h-3 w-3" />
                                            <span>Tạo</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 transition-all duration-300" 
                                  style={{ width: `${progress}%` }} 
                                />
                              </div>

                              {checklist.items && checklist.items.length > 0 && (
                                <div className="space-y-2">
                                  {checklist.items.map((item: TaskChecklistItem) => {
                                    // Parse file URLs from content (similar to task detail page)
                                    const fileUrls: string[] = []
                                    let displayContent = item.content || ''
                                    
                                    // Extract file URLs from [FILE_URLS: ...] pattern
                                    const fileUrlsMatch = displayContent.match(/\[FILE_URLS:\s*([^\]]+)\]/)
                                    if (fileUrlsMatch) {
                                      const urlsText = fileUrlsMatch[1].trim()
                                      const urls = urlsText.split(/\s+/).filter(url => 
                                        url.length > 0 && (url.startsWith('http://') || url.startsWith('https://'))
                                      )
                                      fileUrls.push(...urls)
                                      displayContent = displayContent.replace(/\[FILE_URLS:[^\]]+\]/g, '').trim()
                                      displayContent = displayContent.replace(/^📎 \d+ file\(s\)\s*$/g, '').trim()
                                    }

                                    return (
                                      <div 
                                        key={item.id}
                                        data-checklist-item-id={item.id}
                                        className="group flex items-start gap-3 py-1.5 hover:bg-gray-50 rounded-md px-2 -mx-2 transition-colors"
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleChecklistItem(item.id, item.is_completed)
                                          }}
                                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                            item.is_completed 
                                              ? 'bg-blue-600 border-blue-600 hover:bg-blue-700' 
                                              : 'border-gray-300 hover:border-blue-500'
                                          }`}
                                        >
                                          {item.is_completed && <Check className="h-3 w-3 text-white" />}
                                        </button>
                                        <div className="flex-1 space-y-2 min-w-0">
                                          {/* Content text */}
                                          {displayContent && (
                                            <span className={`text-sm leading-snug block ${
                                              item.is_completed 
                                                ? 'text-gray-400 line-through' 
                                                : 'text-gray-700'
                                            }`}>
                                              {displayContent}
                                            </span>
                                          )}
                                          
                                          {/* Display files/images */}
                                          {fileUrls.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                              {fileUrls.map((url, idx) => {
                                                const fileName = getFileNameFromUrl(url)
                                                const iconPath = getFileIcon(url)
                                                const FileIconComponent = iconPath ? null : getFileIconComponent(url)
                                                
                                                return (
                                                  <div key={idx} className="relative group/file">
                                                    <a
                                                      href={url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="flex flex-col items-center gap-1"
                                                    >
                                                      <div className="h-12 w-12 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-colors cursor-pointer flex items-center justify-center overflow-hidden">
                                                        {iconPath ? (
                                                          <img 
                                                            src={iconPath} 
                                                            alt={fileName}
                                                            className="h-full w-full object-contain"
                                                          />
                                                        ) : (
                                                          FileIconComponent && (
                                                            <FileIconComponent className="h-6 w-6 text-gray-600" />
                                                          )
                                                        )}
                                                      </div>
                                                      <span 
                                                        className="text-[10px] text-gray-600 truncate max-w-[60px] text-center" 
                                                        title={fileName}
                                                      >
                                                        {fileName}
                                                      </span>
                                                    </a>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                          
                                          {/* Assignee name */}
                                          {item.assignee_name && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                              <User className="h-3 w-3" />
                                              <span>{item.assignee_name}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {task.assigned_to_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{task.assigned_to_name}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Hạn: {formatDate(task.due_date, false) || 'Chưa có'}</span>
                        </div>
                      )}
                      {task.comment_count !== undefined && task.comment_count > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{task.comment_count}</span>
                        </div>
                      )}
                      {task.attachment_count !== undefined && task.attachment_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-4 w-4" />
                          <span>{task.attachment_count}</span>
                        </div>
                      )}
                      {task.checklists && task.checklists.length > 0 && (
                        <div className="flex items-center gap-1">
                          <ListChecks className="h-4 w-4" />
                          <span>{task.checklists.reduce((sum, c) => sum + (c.items?.length || 0), 0)} việc cần làm</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 ml-4" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Chat Section */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Trao đổi</h3>
            <span className="text-sm text-gray-500">({allComments.length})</span>
          </div>
        </div>

        {loadingComments ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : allComments.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto" data-chat-container>
            {allComments
              .filter(comment => !comment.parent_id) // Only show top-level comments
              .slice(0, 20) // Show max 20 comments
              .map((comment, index) => {
                const task = tasks.find(t => t.id === comment.task_id)
                const isNewMessage = comment.id?.startsWith('temp-') || (index === 0 && new Date(comment.created_at).getTime() > Date.now() - 10000)
                return (
                  <div 
                    key={comment.id} 
                    className={`group ${isNewMessage ? 'animate-fade-in bg-blue-50/30 border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0" 
                           title={comment.user_name || comment.employee_name || 'Người dùng'}>
                        {(comment.user_name || comment.employee_name || 'U')?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-900">
                            {comment.user_name || comment.employee_name || 'Người dùng'}
                          </span>
                          <span className="text-gray-500">
                            {formatDate(comment.created_at, true)}
                          </span>
                          {comment.is_pinned && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Pin className="h-3 w-3" />
                              <span className="text-xs">Đã ghim</span>
                            </span>
                          )}
                          {task && (
                            <span 
                              className="text-xs text-blue-600 hover:underline cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/tasks/${comment.task_id}`)
                              }}
                            >
                              • {task.title}
                            </span>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-200">
                          {comment.type === 'image' && comment.file_url && (
                            <img 
                              src={comment.file_url} 
                              alt="Attachment" 
                              className="max-w-full max-h-48 rounded mb-2" 
                            />
                          )}
                          {comment.type === 'file' && comment.file_url && (
                            <a
                              href={comment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-2 px-3 py-2 mb-2 rounded-lg text-xs font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                            >
                              {(() => {
                                // Get file name from comment (which usually contains the file name) or file_name field
                                // Extract file name from URL if needed
                                let fileName = comment.comment || (comment as any).file_name || ''
                                
                                // Always try to extract from URL if we have it (most reliable)
                                if (comment.file_url) {
                                  const urlParts = comment.file_url.split('/')
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
                                
                                const fileType = (comment as any).file_type || ''
                                const iconPath = getFileIconPath(fileType, fileName)
                                
                                if (iconPath) {
                                  return <img src={iconPath} alt={fileName} className="h-4 w-4 object-contain flex-shrink-0" onError={(e) => {
                                    console.error('Failed to load icon:', iconPath)
                                    e.currentTarget.style.display = 'none'
                                  }} />
                                }
                                return <Paperclip className="h-3.5 w-3.5" />
                              })()}
                              <span className="truncate max-w-[200px]">
                                {comment.comment || 'File đính kèm'}
                              </span>
                            </a>
                          )}
                          {comment.comment && comment.type === 'text' && (
                            <p className="whitespace-pre-wrap">
                              {(() => {
                                let text = comment.comment
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
                                      const memberParts = beforeText.split(/(@\s*\w+)/g)
                                      memberParts.forEach((part) => {
                                        if (part && part.trim().startsWith('@') && part.trim().length > 1) {
                                          const memberName = part.trim().substring(1).trim()
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
                                    const memberParts = remainingText.split(/(@\s*\w+)/g)
                                    memberParts.forEach((part) => {
                                      if (part && part.trim().startsWith('@') && part.trim().length > 1) {
                                        const memberName = part.trim().substring(1).trim()
                                        parts.push({ type: 'member', content: part, name: memberName })
                                      } else if (part) {
                                        parts.push({ type: 'text', content: part })
                                      }
                                    })
                                  }
                                }
                                
                                // If no mentions found, check for member mentions only
                                if (parts.length === 0) {
                                  const memberParts = text.split(/(@\s*\w+)/g)
                                  memberParts.forEach((part) => {
                                    if (part && part.trim().startsWith('@') && part.trim().length > 1) {
                                      const memberName = part.trim().substring(1).trim()
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
                                            checklistItemElement.classList.add('ring-2', 'ring-green-500', 'ring-offset-2', 'rounded-md')
                                            setTimeout(() => {
                                              checklistItemElement.classList.remove('ring-2', 'ring-green-500', 'ring-offset-2', 'rounded-md')
                                            }, 2000)
                                          }
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md font-bold cursor-pointer hover:bg-green-200 transition-colors"
                                        title="Click để xem việc cần làm"
                                      >
                                        <CheckSquare className="h-3 w-3" />
                                        {part.name}
                                      </span>
                                    )
                                  } else if (part.type === 'member' && part.name) {
                                    return (
                                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold">
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
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReply(comment)
                            }} 
                            className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                          >
                            <Reply className="h-3 w-3" />
                            Trả lời
                          </button>
                          {canManageComment(comment) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteComment(comment)
                              }} 
                              className="text-xs text-red-500 hover:underline"
                            >
                              Xóa
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTogglePin(comment)
                            }} 
                            className="text-xs text-gray-500 hover:text-blue-600"
                          >
                            {comment.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                          </button>
                        </div>
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-4 mt-2 space-y-2">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0">
                                  {(reply.user_name || reply.employee_name || 'U')?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 text-xs mb-1">
                                    <span className="font-semibold text-gray-900">
                                      {reply.user_name || reply.employee_name || 'Người dùng'}
                                    </span>
                                    <span className="text-gray-500">
                                      {formatDate(reply.created_at, true)}
                                    </span>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-700 border border-gray-200">
                                    {reply.type === 'image' && reply.file_url && (
                                      <img 
                                        src={reply.file_url} 
                                        alt="Attachment" 
                                        className="max-w-full max-h-32 rounded mb-1" 
                                      />
                                    )}
                                    {reply.type === 'file' && reply.file_url && (
                                      <a
                                        href={reply.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 px-2 py-1 mb-1 rounded text-xs font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
                                      >
                                        {(() => {
                                          // Get file name from comment (which usually contains the file name) or file_name field
                                          // Extract file name from URL if needed
                                          let fileName = reply.comment || (reply as any).file_name || ''
                                          
                                          // Always try to extract from URL if we have it (most reliable)
                                          if (reply.file_url) {
                                            const urlParts = reply.file_url.split('/')
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
                                          
                                          const fileType = (reply as any).file_type || ''
                                          const iconPath = getFileIconPath(fileType, fileName)
                                          
                                          if (iconPath) {
                                            return <img src={iconPath} alt={fileName} className="h-3.5 w-3.5 object-contain flex-shrink-0" onError={(e) => {
                                              console.error('Failed to load icon:', iconPath)
                                              e.currentTarget.style.display = 'none'
                                            }} />
                                          }
                                          return <Paperclip className="h-3 w-3" />
                                        })()}
                                        <span className="truncate max-w-[150px]">
                                          {reply.comment || 'File đính kèm'}
                                        </span>
                                      </a>
                                    )}
                                    {reply.comment && reply.type === 'text' && (
                                      <p className="whitespace-pre-wrap">
                                        {(() => {
                                          let text = reply.comment
                                          const parts: Array<{ type: 'text' | 'checklist' | 'member'; content: string; name?: string; checklistId?: string }> = []
                                          
                                          // Find all checklist mentions: @[name](checklist:id)
                                          const checklistRegex = /@\[([^\]]+)\]\(checklist:([^)]+)\)/g
                                          let checklistMatch
                                          let lastIndex = 0
                                          
                                          while ((checklistMatch = checklistRegex.exec(text)) !== null) {
                                            if (checklistMatch.index > lastIndex) {
                                              const beforeText = text.substring(lastIndex, checklistMatch.index)
                                              if (beforeText) {
                                                const memberParts = beforeText.split(/(@\s*\w+)/g)
                                                memberParts.forEach((part) => {
                                                  if (part && part.trim().startsWith('@') && part.trim().length > 1) {
                                                    const memberName = part.trim().substring(1).trim()
                                                    parts.push({ type: 'member', content: part, name: memberName })
                                                  } else if (part) {
                                                    parts.push({ type: 'text', content: part })
                                                  }
                                                })
                                              }
                                            }
                                            
                                            const [, name, checklistId] = checklistMatch
                                            parts.push({ type: 'checklist', content: checklistMatch[0], name, checklistId })
                                            lastIndex = checklistRegex.lastIndex
                                          }
                                          
                                          if (lastIndex < text.length) {
                                            const remainingText = text.substring(lastIndex)
                                            if (remainingText) {
                                              const memberParts = remainingText.split(/(@\s*\w+)/g)
                                              memberParts.forEach((part) => {
                                                if (part && part.trim().startsWith('@') && part.trim().length > 1) {
                                                  const memberName = part.trim().substring(1).trim()
                                                  parts.push({ type: 'member', content: part, name: memberName })
                                                } else if (part) {
                                                  parts.push({ type: 'text', content: part })
                                                }
                                              })
                                            }
                                          }
                                          
                                          if (parts.length === 0) {
                                            const memberParts = text.split(/(@\s*\w+)/g)
                                            memberParts.forEach((part) => {
                                              if (part && part.trim().startsWith('@') && part.trim().length > 1) {
                                                const memberName = part.trim().substring(1).trim()
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
                                                    const checklistItemElement = document.querySelector(`[data-checklist-item-id="${part.checklistId}"]`)
                                                    if (checklistItemElement) {
                                                      checklistItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                      checklistItemElement.classList.add('ring-2', 'ring-green-500', 'ring-offset-2', 'rounded-md')
                                                      setTimeout(() => {
                                                        checklistItemElement.classList.remove('ring-2', 'ring-green-500', 'ring-offset-2', 'rounded-md')
                                                      }, 2000)
                                                    }
                                                  }}
                                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md font-bold text-xs cursor-pointer hover:bg-green-200 transition-colors"
                                                  title="Click để xem việc cần làm"
                                                >
                                                  <CheckSquare className="h-2.5 w-2.5" />
                                                  {part.name}
                                                </span>
                                              )
                                            } else if (part.type === 'member' && part.name) {
                                              return (
                                                <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold text-xs">
                                                  <User className="h-2.5 w-2.5" />
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
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            {allComments.filter(c => !c.parent_id).length > 20 && (
              <div className="text-center pt-4 text-sm text-gray-500">
                +{allComments.filter(c => !c.parent_id).length - 20} tin nhắn khác
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200" data-input-area>
          {/* Task Selection */}
          {tasks.length > 1 && (
            <div className="mb-3">
              <label className="text-xs text-gray-600 mb-1 block">Gửi tin nhắn vào nhiệm vụ:</label>
              <select
                value={selectedTaskId || ''}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reply Preview */}
          {replyingTo && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg relative">
              <div className="flex items-start gap-2">
                <Reply className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-blue-900 mb-1">
                    Trả lời {replyingTo.user_name || replyingTo.employee_name || 'Người dùng'}
                  </div>
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
              <button 
                onClick={() => { 
                  setPendingFiles([])
                  setPendingPreview(null)
                }} 
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
          {!pendingPreview && pendingFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingFiles.map((file, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-xs text-gray-700">
                  <Paperclip className="h-3.5 w-3.5 text-gray-500" />
                  <span className="truncate max-w-[220px]" title={file.name}>{file.name}</span>
                  <button
                    onClick={() => {
                      const newFiles = [...pendingFiles]
                      newFiles.splice(idx, 1)
                      setPendingFiles(newFiles)
                    }}
                    className="ml-1 text-gray-400 hover:text-red-500"
                    title="Xóa file đính kèm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
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
                  e.target.value = ''
                }}
              />
            </label>
            <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all relative">
              <textarea
                data-chat-textarea
                ref={mentionInputRef}
                value={chatMessage}
                onChange={handleMentionInput}
                placeholder={replyingTo ? `Trả lời ${replyingTo.user_name || replyingTo.employee_name}...` : "Nhập tin nhắn... (dùng @ để mention)"}
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
              disabled={sendingMessage || (!chatMessage.trim() && pendingFiles.length === 0) || !selectedTaskId}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Todo Modal */}
      {showCreateTodoModal && (
        <CreateTodoModal
          parentTaskId=""
          projectId={projectId}
          onClose={() => setShowCreateTodoModal(false)}
          onSuccess={(newTask) => {
            setShowCreateTodoModal(false)
            // Refresh tasks after creating new task
            fetchTasks()
          }}
          groupMembers={[]}
        />
      )}
    </div>
  )
}


