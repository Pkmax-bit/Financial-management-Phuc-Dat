'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Edit,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Download,
  Info
} from 'lucide-react'
import { useMemo } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { TaskChecklist, TaskChecklistItem, TaskComment } from '@/types/task'
import { supabase } from '@/lib/supabase'
import CreateTodoModal from '@/components/CreateTodoModal'
import { getFileIconByType, getFileIconFromUrl } from '@/utils/fileIconUtils'

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

// Get file icon path from icon folder based on file type or filename
const getFileIconPath = (fileType: string, fileName?: string): string | null => {
  return getFileIconByType(fileType, fileName)
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  group_id?: string
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
  mode?: 'full' | 'chat-only'
}

export default function ProjectTasksTab({ projectId, projectName, mode = 'full' }: ProjectTasksTabProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed' | 'cancelled'>('all')
  const [project, setProject] = useState<any>(null)
  const [projectStatuses, setProjectStatuses] = useState<any[]>([])
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [allComments, setAllComments] = useState<TaskComment[]>([])
  const allCommentsRef = useRef<TaskComment[]>([]) // Ref to track previous comments without causing re-renders
  const [loadingComments, setLoadingComments] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [replyingTo, setReplyingTo] = useState<TaskComment | null>(null)
  const [messageLimit, setMessageLimit] = useState(20)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [sendingMessageIds, setSendingMessageIds] = useState<Set<string>>(new Set()) // Track messages being sent
  const [isTyping, setIsTyping] = useState(false) // Track if user is typing (for local UI - not shown to self)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Timeout for typing indicator
  const [typingUsers, setTypingUsers] = useState<Map<string, { userId: string; userName: string; timestamp: number }>>(new Map()) // Track other users typing
  const typingChannelRef = useRef<any>(null) // Realtime channel for typing indicators
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null) // Polling interval for new messages
  const lastCommentCountRef = useRef<number>(0) // Track last comment count for polling
  const lastRealtimeUpdateRef = useRef<number>(Date.now()) // Track last realtime update time
  const pollingAttemptsRef = useRef<number>(0) // Track polling attempts for exponential backoff
  const isPollingRef = useRef<boolean>(false) // Prevent concurrent polling requests
  const typingBroadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Throttle typing broadcasts
  const lastTypingBroadcastRef = useRef<number>(0) // Last time we broadcasted typing
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
  const groupMembersRef = useRef<Array<{
    employee_id: string;
    employee_name?: string;
    employee_email?: string;
    responsibility_type?: 'accountable' | 'responsible' | 'consulted' | 'informed';
    avatar?: string;
    phone?: string;
    status?: string;
  }>>([]) // Ref to avoid dependency issues
  const [newMessageNotification, setNewMessageNotification] = useState<{ id: string; message: string } | null>(null)
  const mentionInputRef = useRef<HTMLTextAreaElement | null>(null)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [quickTaskDescription, setQuickTaskDescription] = useState('')
  const [quickCreating, setQuickCreating] = useState(false)
  const [quickParentTaskId, setQuickParentTaskId] = useState<string | null>(null)
  const [quickTaskFiles, setQuickTaskFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Information Panel States
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showAllImages, setShowAllImages] = useState(false)
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [showAllLinks, setShowAllLinks] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<{ url: string; index: number } | null>(null)

  // Function to scroll chat to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior })
    }
  }

  const getDisplayName = useCallback((comment: TaskComment) => {
    if (comment.user_name) return comment.user_name
    if (comment.employee_name) return comment.employee_name

    // Check if it's current user
    if (user && (
      (comment.user_id && user.id === comment.user_id) ||
      (comment.employee_id && user.id === comment.employee_id)
    )) {
      return user.full_name || 'Tôi'
    }

    // Try to find in groupMembers using ref to avoid dependency
    const members = groupMembersRef.current
    if (members.length > 0) {
      const member = members.find(m => m.employee_id === comment.employee_id)
      if (member?.employee_name) return member.employee_name
    }

    return 'Người dùng'
  }, [user]) // Removed groupMembers from dependencies

  // Auto scroll to bottom when comments change
  useEffect(() => {
    if (allComments.length > 0) {
      // Use 'auto' for initial load, 'smooth' for new messages
      const behavior = loadingComments ? 'auto' : 'smooth'
      // Small timeout to ensure DOM has updated
      setTimeout(() => scrollToBottom(behavior), 100)
    }
  }, [allComments, loadingComments])

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
  const [selectedChecklistAssigneeId, setSelectedChecklistAssigneeId] = useState<string | null>(null)
  const checklistItemFileInputRef = useRef<HTMLInputElement | null>(null)
  const [showCreateTodoModal, setShowCreateTodoModal] = useState(false)
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<string | null>(null)
  const [editingChecklistItemContent, setEditingChecklistItemContent] = useState<string>('')
  const [editingChecklistItemFiles, setEditingChecklistItemFiles] = useState<File[]>([])
  const [editingChecklistItemExistingFileUrls, setEditingChecklistItemExistingFileUrls] = useState<string[]>([])
  const [editingChecklistItemAssigneeId, setEditingChecklistItemAssigneeId] = useState<string | null>(null)
  const [editingChecklistItemAssignments, setEditingChecklistItemAssignments] = useState<Array<{ employee_id: string; responsibility_type: 'accountable' | 'responsible' | 'consulted' | 'informed' }>>([])
  const [showEditingAssignmentDropdown, setShowEditingAssignmentDropdown] = useState<boolean>(false)
  const editingChecklistItemFileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Multi-assignment states for checklist items
  const [checklistItemAssignments, setChecklistItemAssignments] = useState<Record<string, Array<{ employee_id: string; responsibility_type: 'accountable' | 'responsible' | 'consulted' | 'informed' }>>>({})
  const [showAssignmentDropdown, setShowAssignmentDropdown] = useState<Record<string, boolean>>({})

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

  const fetchAllComments = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoadingComments(true)
      }

      // Use the new project-level endpoint for much better performance
      const allCommentsFlat: TaskComment[] = await apiGet(`/api/tasks/project/${projectId}/comments`)

      if (!allCommentsFlat) return

      // Sort by created_at ascending (oldest first, like a chat)
      allCommentsFlat.sort((a: TaskComment, b: TaskComment) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      // Check for new messages (not from current user)
      // Use ref to avoid dependency on allComments state
      const previousComments = allCommentsRef.current
      if (silent && user && previousComments.length > 0) {
        const newComments = allCommentsFlat.filter((newComment: TaskComment) => {
          const isNew = !previousComments.find(oldComment => oldComment.id === newComment.id)
          const isNotFromMe = newComment.user_id !== user.id && newComment.employee_id !== user.id
          return isNew && isNotFromMe
        })

        if (newComments.length > 0) {
          // Show notification
          const latestComment = newComments[0]
          setNewMessageNotification({
            id: latestComment.id,
            message: `${getDisplayName(latestComment)}: ${latestComment.comment?.substring(0, 50) || 'đã gửi tin nhắn'}...`
          })
          // Auto-hide after 5 seconds
          setTimeout(() => {
            setNewMessageNotification(null)
          }, 5000)
        }
      }

      // Merge with existing state (preserve all real messages, add new ones, keep optimistic)
      setAllComments(prev => {
        // Create a map of existing real messages (by ID) to preserve them
        const existingRealMessages = new Map<string, TaskComment>()
        prev.forEach(c => {
          // Keep all real messages (not temp IDs)
          if (!c.id?.startsWith('temp-')) {
            existingRealMessages.set(c.id, c)
          }
        })
        
        // Add/update with messages from server
        allCommentsFlat.forEach(serverComment => {
          existingRealMessages.set(serverComment.id, serverComment)
        })
        
        // Keep optimistic messages that are still being sent
        const optimisticMessages = prev.filter(c => 
          c.id?.startsWith('temp-') && sendingMessageIds.has(c.id)
        )
        
        // Check which optimistic messages have been replaced by real messages
        optimisticMessages.forEach(optMsg => {
          // Check if there's a real message with same content and task_id
          const hasRealMatch = allCommentsFlat.some(real => 
            real.comment === optMsg.comment &&
            real.task_id === optMsg.task_id &&
            real.type === (optMsg.type || 'text')
          )
          
          if (hasRealMatch) {
            // Real message exists, remove from sendingMessageIds
            setSendingMessageIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(optMsg.id)
              return newSet
            })
          }
        })
        
        // Combine: real messages + optimistic messages that haven't been replaced
        const merged: TaskComment[] = []
        
        // Add all real messages
        existingRealMessages.forEach(msg => merged.push(msg))
        
        // Add optimistic messages that don't have a real replacement yet
        optimisticMessages.forEach(optMsg => {
          const hasRealMatch = allCommentsFlat.some(real => 
            real.comment === optMsg.comment &&
            real.task_id === optMsg.task_id &&
            real.type === (optMsg.type || 'text')
          )
          if (!hasRealMatch) {
            merged.push(optMsg)
          }
        })
        
        // Remove duplicates by ID (keep real messages over optimistic)
        const unique = merged.filter((c, index, self) => 
          index === self.findIndex(cc => cc.id === c.id)
        )
        
        // Sort again after merge
        unique.sort((a: TaskComment, b: TaskComment) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        allCommentsRef.current = unique
        console.log('[fetchAllComments] Merged comments. Total:', unique.length, 
          'Real:', existingRealMessages.size, 
          'Optimistic:', optimisticMessages.filter(opt => {
            const hasRealMatch = allCommentsFlat.some(real => 
              real.comment === opt.comment &&
              real.task_id === opt.task_id &&
              real.type === (opt.type || 'text')
            )
            return !hasRealMatch
          }).length)
        return unique
      })
    } catch (err: any) {
      console.error('Error fetching comments:', err)
      
      // Only show error if it's not an authentication error (auth errors will redirect)
      // Don't redirect here - let API client handle it
      if (err?.status !== 401 && err?.status !== 403) {
        // For non-auth errors, just log - don't show alert to avoid spam
        console.warn('Failed to fetch comments, will retry later')
      }
      // If it's an auth error, API client will handle redirect
    } finally {
      if (!silent) {
        setLoadingComments(false)
      }
    }
  }, [projectId, user]) // Removed getDisplayName and allComments from dependencies to avoid infinite loop

  // Load group members function - defined before useEffect that uses it
  const loadGroupMembers = useCallback(async () => {
    if (!projectId) return
    
    try {
      // Lấy nhân viên từ đội ngũ dự án (project team)
      try {
        const teamResponse = await apiGet(`/api/projects/${projectId}/team`)
        const teamMembers = teamResponse?.team_members || []

        // Convert to format expected by mentions and assignments
        // Chỉ lấy các thành viên có employee_id và status = 'active'
        const members = teamMembers
          .filter((member: any) => member.employee_id && member.status === 'active')
          .map((member: any) => ({
            employee_id: member.employee_id, // Use actual employee ID from employees table
            employee_name: member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Thành viên',
            employee_email: member.email
          }))

        setGroupMembers(members)
        groupMembersRef.current = members // Update ref
      } catch (teamErr) {
        console.error('Error fetching project team members:', teamErr)
        // Fallback: Get group members from all tasks (use current tasks from state)
        const currentTasks = tasks // Use tasks from closure, but this should be stable
        const groupIds = [...new Set(currentTasks.map(t => t.group_id).filter(id => id && id !== 'null' && id !== 'undefined' && typeof id === 'string'))]
        if (groupIds.length === 0) {
          setGroupMembers([])
          groupMembersRef.current = []
          return
        }

        const membersPromises = groupIds.map(async (groupId) => {
          try {
            // Validate groupId before making API call
            if (!groupId || groupId === 'null' || groupId === 'undefined') {
              console.warn(`Skipping invalid groupId: ${groupId}`)
              return []
            }
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
        // Remove duplicates and filter to only include members with valid employee IDs
        const uniqueMembers = Array.from(
          new Map(allMembers.map(m => [m.employee_id, m])).values()
        ).filter((member: any) => member.employee_id) // Only include members with employee_id
        setGroupMembers(uniqueMembers)
        groupMembersRef.current = uniqueMembers // Update ref
      }
    } catch (err) {
      console.error('Error loading group members:', err)
      setGroupMembers([])
      groupMembersRef.current = []
    }
  }, [projectId]) // Only depend on projectId - tasks will be accessed from closure when needed

  // Load comments and set up when tasks are loaded
  useEffect(() => {
    if (tasks.length > 0) {
      fetchAllComments()
      // Set selected task to first task if available
      if (!selectedTaskId) {
        setSelectedTaskId(tasks[0].id)
      }
    }
  }, [tasks, selectedTaskId, fetchAllComments])

  // Load group members separately - only when projectId changes or when tasks are first loaded
  const hasLoadedGroupMembers = useRef(false)
  useEffect(() => {
    if (projectId && !hasLoadedGroupMembers.current) {
      loadGroupMembers()
      hasLoadedGroupMembers.current = true
    }
    // Reset flag when projectId changes
    return () => {
      hasLoadedGroupMembers.current = false
    }
  }, [projectId, loadGroupMembers])

  // Realtime subscription for new messages
  useEffect(() => {
    if (tasks.length === 0 || !projectId) return

    let channel: any = null

    const setupRealtime = async () => {
      try {
        // Check if user is authenticated before subscribing
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.warn('[Realtime] No session available, skipping realtime subscription')
          return
        }

    const taskIds = tasks.map(t => t.id)
        console.log('[Realtime] Setting up subscription for project:', projectId, 'Tasks:', taskIds)

    // Subscribe to task_comments changes for all tasks in this project
        // Note: Subscribe to each event type separately to avoid "mismatch" error
        // Supabase Realtime doesn't support IN filter, so we filter in callback
        channel = supabase
          .channel(`project-comments-${projectId}`, {
            config: {
              broadcast: { self: true },
              presence: { key: projectId }
            }
          })
          // Subscribe to INSERT events
      .on(
        'postgres_changes',
        {
              event: 'INSERT',
          schema: 'public',
          table: 'task_comments'
        },
        (payload) => {
              console.log('[Realtime] Comment INSERT event received:', payload)
              const newComment = payload.new as any
              const taskId = newComment?.task_id
              
              console.log('[Realtime] New comment details:', {
                id: newComment.id,
                task_id: taskId,
                comment: newComment.comment?.substring(0, 50),
                user_id: newComment.user_id,
                employee_id: newComment.employee_id
              })
              console.log('[Realtime] Task IDs in project:', taskIds)
              console.log('[Realtime] Task ID matches?', taskId && taskIds.includes(taskId))

              if (taskId && taskIds.includes(taskId)) {
                console.log('[Realtime] Processing comment for task:', taskId)
                // Check if this is from current user (might be replacing optimistic message)
                const isFromCurrentUser = user && (
                  (newComment.user_id && user.id === newComment.user_id) ||
                  (newComment.employee_id && user.id === newComment.employee_id)
                )
                
                // If from current user, replace optimistic message with real one
                if (isFromCurrentUser) {
                  console.log('[Realtime] ✅ Received own message, replacing optimistic:', newComment.id)
                  
                  // Remove from sendingMessageIds FIRST (to hide "đang gửi" immediately)
                  setSendingMessageIds(prev => {
                    const newSet = new Set(prev)
                    // Find and remove all temp IDs that match this comment
                    prev.forEach(tempId => {
                      // Check if this temp ID's message matches the new real comment
                      const tempComment = allCommentsRef.current.find(c => c.id === tempId)
                      if (tempComment) {
                        // Match by exact content OR by task_id + timestamp (within 10s)
                        const contentMatch = tempComment.comment === newComment.comment && 
                                           tempComment.task_id === newComment.task_id &&
                                           tempComment.type === (newComment.type || 'text')
                        
                        // Also match by timestamp if content doesn't match exactly (for files)
                        const tempTime = new Date(tempComment.created_at || Date.now()).getTime()
                        const realTime = new Date(newComment.created_at).getTime()
                        const timeDiff = Math.abs(realTime - tempTime)
                        const timeMatch = tempComment.task_id === newComment.task_id && 
                                        timeDiff < 10000 && // Within 10 seconds
                                        tempComment.type === (newComment.type || 'text')
                        
                        if (contentMatch || timeMatch) {
                          console.log('[Realtime] ✅ Removing from sendingMessageIds:', tempId, 
                            contentMatch ? '(content match)' : '(time match)')
                          newSet.delete(tempId)
                        }
                      }
                    })
                    return newSet
                  })
                  
                  // Then update comments - replace optimistic with real
                  setAllComments(prev => {
                    // Find optimistic messages that match this real comment
                    const matchingTempIds: string[] = []
                    const filtered = prev.filter(c => {
                      // If this is the real comment we're adding, keep it (update if exists)
                      if (c.id === newComment.id) {
                        // Don't remove - we'll update it below
                        return true
                      }
                      
                      // Keep all real messages (not temp IDs)
                      if (!c.id?.startsWith('temp-')) {
                        return true
                      }
                      
                      // Check if optimistic message matches this real comment
                      // Match by exact content OR by task_id + timestamp (within 10s)
                      const contentMatch = c.comment === newComment.comment && 
                                         c.task_id === newComment.task_id &&
                                         c.type === (newComment.type || 'text')
                      
                      // Also match by timestamp if content doesn't match exactly (for files)
                      const tempTime = new Date(c.created_at || Date.now()).getTime()
                      const realTime = new Date(newComment.created_at).getTime()
                      const timeDiff = Math.abs(realTime - tempTime)
                      const timeMatch = c.task_id === newComment.task_id && 
                                      timeDiff < 10000 && // Within 10 seconds
                                      c.type === (newComment.type || 'text')
                      
                      const matches = contentMatch || timeMatch
                      if (matches) {
                        matchingTempIds.push(c.id)
                        console.log('[Realtime] ✅ Removing optimistic message:', c.id, 
                          contentMatch ? '(content match)' : '(time match)')
                      }
                      return !matches
                    })
                    
                    // Check if real comment already exists
                    const existingRealCommentIndex = filtered.findIndex(c => c.id === newComment.id)
                    if (existingRealCommentIndex !== -1) {
                      // Update existing comment with new data
                      filtered[existingRealCommentIndex] = { ...filtered[existingRealCommentIndex], ...newComment } as TaskComment
                    } else {
                      // Add the new real comment if it doesn't exist
                      filtered.push(newComment as TaskComment)
                    }
                    
                    // Sort by created_at
                    filtered.sort((a: TaskComment, b: TaskComment) =>
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                    allCommentsRef.current = filtered
                    console.log('[Realtime] ✅ Updated comments. Total:', filtered.length, 'Removed temp IDs:', matchingTempIds)
                    return filtered
                  })
                  
                  // Scroll to bottom to show new message
                  setTimeout(() => scrollToBottom('smooth'), 50)
                } else {
                  // From another user - add the new comment immediately
                  console.log('[Realtime] ✅ Received new comment from another user:', {
                    id: newComment.id,
                    comment: newComment.comment?.substring(0, 50),
                    user_id: newComment.user_id,
                    employee_id: newComment.employee_id,
                    task_id: newComment.task_id
                  })
                  
                  // Add immediately to state
                  setAllComments(prev => {
                    // Check if comment already exists
                    const existingIndex = prev.findIndex(c => c.id === newComment.id)
                    if (existingIndex !== -1) {
                      // Update existing comment instead of skipping (to preserve state and prevent disappearing)
                      const updated = [...prev]
                      updated[existingIndex] = { ...updated[existingIndex], ...newComment } as TaskComment
                      updated.sort((a: TaskComment, b: TaskComment) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                      )
                      allCommentsRef.current = updated
                      console.log('[Realtime] ✅ Updated existing comment in state:', newComment.id)
                      return updated
                    }
                    
                    // Add new comment immediately
                    const updated = [...prev, newComment as TaskComment]
                    updated.sort((a: TaskComment, b: TaskComment) =>
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                    allCommentsRef.current = updated
                    console.log('[Realtime] ✅ Added new comment to state. Total comments:', updated.length)
                    console.log('[Realtime] Comment data:', newComment)
                    return updated
                  })
                  
                  // Update last realtime update time (to prevent unnecessary polling)
                  lastRealtimeUpdateRef.current = Date.now()
                  
                  // Scroll to bottom immediately (no delay)
                  scrollToBottom('smooth')
                  
                  // Show notification for new message
                  if (user) {
                    const displayName = getDisplayName(newComment as TaskComment)
                    console.log('[Realtime] Showing notification for:', displayName)
                    setNewMessageNotification({
                      id: newComment.id,
                      message: `${displayName}: ${newComment.comment?.substring(0, 50) || 'đã gửi tin nhắn'}...`
                    })
                    setTimeout(() => {
                      setNewMessageNotification(null)
                    }, 5000)
                  }
                  
                  // DON'T call fetchAllComments here - it will overwrite the state and cause messages to disappear
                  // The Realtime event already has all the data we need
                  // Only fetch if we're missing user_name or employee_name, and do it carefully
                  if (!newComment.user_name && !newComment.employee_name) {
                    // Only fetch if we're missing display names, and do it after a delay to avoid race conditions
                    setTimeout(() => {
                      // Check if comment still exists before fetching
                      const commentStillExists = allCommentsRef.current.find(c => c.id === newComment.id)
                      if (commentStillExists) {
                        fetchAllComments(true).catch(err => {
                          console.warn('[Realtime] Failed to fetch full comments after new message:', err)
                        })
                      }
                    }, 2000) // Increased delay to avoid race conditions
                  }
                }
              }
            }
          )
          // Subscribe to UPDATE events
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'task_comments'
            },
            (payload) => {
              console.log('[Realtime] Comment UPDATE in project:', payload)
          const newComment = payload.new as any
              const taskId = newComment?.task_id

              if (taskId && taskIds.includes(taskId)) {
                // Update the specific comment in state instead of fetching all
                // This prevents overwriting the entire state and losing messages
                setAllComments(prev => {
                  const updated = prev.map(c => {
                    if (c.id === newComment.id) {
                      // Merge new data with existing comment
                      return { ...c, ...newComment } as TaskComment
                    }
                    return c
                  })
                  
                  // If comment doesn't exist yet, add it
                  const exists = updated.find(c => c.id === newComment.id)
                  if (!exists) {
                    updated.push(newComment as TaskComment)
                    updated.sort((a: TaskComment, b: TaskComment) =>
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                  }
                  
                  allCommentsRef.current = updated
                  return updated
                })
                
                // Update last realtime update time
                lastRealtimeUpdateRef.current = Date.now()
              }
            }
          )
          // Subscribe to DELETE events
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'task_comments'
            },
            (payload) => {
              console.log('[Realtime] Comment DELETE in project:', payload)
          const oldComment = payload.old as any
              const taskId = oldComment?.task_id

          if (taskId && taskIds.includes(taskId)) {
                // Remove the specific comment from state instead of fetching all
                // This prevents overwriting the entire state and losing messages
                setAllComments(prev => {
                  const filtered = prev.filter(c => c.id !== oldComment.id)
                  allCommentsRef.current = filtered
                  return filtered
                })
                
                // Update last realtime update time
                lastRealtimeUpdateRef.current = Date.now()
              }
            }
      )
          .subscribe((status, err) => {
            console.log('[Realtime] 📡 Subscription status changed:', status, err)
        if (status === 'SUBSCRIBED') {
              console.log('[Realtime] ✅ Successfully subscribed to project comments for project:', projectId)
              console.log('[Realtime] ✅ Listening for INSERT, UPDATE, DELETE events on task_comments table')
              console.log('[Realtime] ✅ Task IDs being monitored:', taskIds)
              // Reset last update time when subscribed
              lastRealtimeUpdateRef.current = Date.now()
        } else if (status === 'CHANNEL_ERROR') {
              // Log error but don't spam console - polling will handle it
              console.warn('[Realtime] ⚠️ Realtime subscription failed, using polling fallback:', err?.message || err)
              console.info('[Realtime] 💡 Polling will check for new messages every 3 seconds')
              console.info('[Realtime] 💡 To enable realtime: Supabase Dashboard → Database → Replication → Enable for task_comments')
              // Don't throw error - app should continue working without realtime
              // Polling fallback will handle message updates
            } else if (status === 'TIMED_OUT') {
              console.warn('[Realtime] ⏱️ Subscription timed out for project:', projectId)
              console.warn('[Realtime] Will retry automatically...')
            } else if (status === 'CLOSED') {
              console.log('[Realtime] 🔒 Subscription closed for project:', projectId)
            } else {
              console.log('[Realtime] 📡 Subscription status:', status)
            }
          })

      } catch (error) {
        console.error('[Realtime] Failed to setup realtime subscription:', error)
        // Don't throw - app should work without realtime
      }
    }

    setupRealtime()

    return () => {
      if (channel) {
        console.log('[Realtime] Unsubscribing from project comments for project:', projectId)
      supabase.removeChannel(channel)
      }
    }
  }, [tasks, projectId, fetchAllComments])

  // Polling fallback: Fetch new messages periodically if realtime is not working
  // Optimized to reduce server load:
  // - Only polls when realtime is not working
  // - Uses exponential backoff (5s -> 10s -> 15s, max 15s)
  // - Only polls when tab is visible
  // - Prevents concurrent requests
  useEffect(() => {
    if (tasks.length === 0 || !projectId || !selectedTaskId) {
      // Clear polling if conditions not met
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        pollingAttemptsRef.current = 0
      }
      return
    }

    const startPolling = () => {
      // Clear any existing polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }

      // Calculate polling interval with exponential backoff
      // Start at 5 seconds, increase to max 15 seconds
      const baseInterval = 5000 // 5 seconds
      const maxInterval = 15000 // 15 seconds
      const backoffMultiplier = Math.min(1 + (pollingAttemptsRef.current * 0.5), 3) // Max 3x
      const pollingInterval = Math.min(baseInterval * backoffMultiplier, maxInterval)

      pollingIntervalRef.current = setInterval(() => {
        // Only poll if tab is visible (to save resources)
        if (document.hidden) return

        // Check if realtime has updated recently (within last 10 seconds)
        // If yes, stop polling (realtime is working)
        const timeSinceLastRealtimeUpdate = Date.now() - lastRealtimeUpdateRef.current
        if (timeSinceLastRealtimeUpdate < 10000) {
          // Realtime is working, stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
            pollingAttemptsRef.current = 0
            console.info('[Polling] ✅ Realtime working, stopped polling')
          }
          return
        }

        // Prevent concurrent polling requests
        if (isPollingRef.current) {
          console.log('[Polling] ⏭️ Skipping poll - previous request still in progress')
          return
        }

        // Check current comment count
        const currentCount = allCommentsRef.current.filter(
          c => c.task_id === selectedTaskId
        ).length

        // Fetch comments to check for new messages (silent mode)
        isPollingRef.current = true
        fetchAllComments(true)
          .then(() => {
            const newCount = allCommentsRef.current.filter(
              c => c.task_id === selectedTaskId
            ).length
            
            if (newCount > currentCount) {
              console.log('[Polling] ✅ Found', newCount - currentCount, 'new messages via polling')
              scrollToBottom('smooth')
              // Reset backoff on success
              pollingAttemptsRef.current = 0
            } else {
              // Increment attempts for backoff (only if no new messages)
              pollingAttemptsRef.current++
            }
            
            lastCommentCountRef.current = newCount
          })
          .catch(err => {
            console.warn('[Polling] ⚠️ Failed to poll for new messages:', err)
            // Increase backoff on error
            pollingAttemptsRef.current++
          })
          .finally(() => {
            isPollingRef.current = false
          })
      }, pollingInterval)

      console.info(`[Polling] 🔄 Started polling fallback (interval: ${pollingInterval/1000}s)`)
    }

    // Check if realtime is working before starting polling
    const timeSinceLastRealtimeUpdate = Date.now() - lastRealtimeUpdateRef.current
    if (timeSinceLastRealtimeUpdate > 10000) {
      // Realtime not working, start polling
      startPolling()
    } else {
      // Realtime is working, don't poll
      console.info('[Polling] ℹ️ Realtime working, polling not needed')
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        pollingAttemptsRef.current = 0
      }
    }
  }, [projectId, tasks, selectedTaskId, fetchAllComments])

  // Also poll when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && tasks.length > 0 && projectId && selectedTaskId) {
        // Tab became visible, check for new messages if realtime is not working
        const timeSinceLastUpdate = Date.now() - lastRealtimeUpdateRef.current
        if (timeSinceLastUpdate > 10000) {
          // Realtime hasn't updated recently, fetch immediately (but only once)
          if (!isPollingRef.current) {
            console.log('[Polling] 👁️ Tab visible, checking for new messages...')
            isPollingRef.current = true
            fetchAllComments(true)
              .then(() => {
                scrollToBottom('smooth')
              })
              .finally(() => {
                isPollingRef.current = false
              })
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [projectId, tasks, selectedTaskId, fetchAllComments])

  // Setup typing indicator realtime channel
  useEffect(() => {
    if (!projectId || !user) return

    const setupTypingChannel = async () => {
      try {
        // Create a channel for typing indicators
        const typingChannel = supabase.channel(`typing:project:${projectId}`, {
          config: {
            presence: {
              key: user.id
            }
          }
        })

        // Listen for typing events from other users
        typingChannel
          .on('broadcast', { event: 'typing' }, (payload) => {
            const { userId, userName, taskId: typingTaskId, isTyping: typingStatus } = payload.payload as any
            
            // Only show typing indicator for other users and if they're typing in the selected task
            if (userId !== user.id && typingTaskId === selectedTaskId && typingStatus) {
              setTypingUsers(prev => {
                const newMap = new Map(prev)
                newMap.set(userId, {
                  userId,
                  userName: userName || 'Người dùng',
                  timestamp: Date.now()
                })
                return newMap
              })
            } else if (userId !== user.id && (!typingStatus || typingTaskId !== selectedTaskId)) {
              // Remove typing indicator when user stops typing or switches task
              setTypingUsers(prev => {
                const newMap = new Map(prev)
                newMap.delete(userId)
                return newMap
              })
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('[Typing] Successfully subscribed to typing channel for project:', projectId)
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Typing] Error subscribing to typing channel')
            }
          })

        typingChannelRef.current = typingChannel

        return () => {
          if (typingChannel) {
            supabase.removeChannel(typingChannel)
          }
        }
      } catch (error) {
        console.error('[Typing] Failed to setup typing channel:', error)
      }
    }

    setupTypingChannel()

    // Cleanup on unmount
    return () => {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current)
      }
    }
  }, [projectId, user, selectedTaskId])

  // Cleanup typing indicators that are too old (user stopped typing)
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        const now = Date.now()
        let updated = false
        
        newMap.forEach((value, key) => {
          // Remove typing indicator if it's older than 3 seconds (user likely stopped typing)
          if (now - value.timestamp > 3000) {
            newMap.delete(key)
            updated = true
          }
        })
        
        return updated ? newMap : prev
      })
    }, 1000) // Check every second

    return () => clearInterval(interval)
  }, [])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (typingBroadcastTimeoutRef.current) {
        clearTimeout(typingBroadcastTimeoutRef.current)
      }
    }
  }, [])

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

  // Helper function to extract file name from URL
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

  // Extract shared content from comments
  const sharedContent = useMemo(() => {
    const images: Array<{ url: string; name: string; date: string; taskId: string }> = []
    const files: Array<{ url: string; name: string; size?: number; date: string; taskId: string }> = []
    const links: Array<{ url: string; title: string; date: string; taskId: string }> = []
    const urlRegex = /(https?:\/\/[^\s]+)/g

    allComments.forEach(comment => {
      const taskId = comment.task_id || ''

      // 1. Process explicit images/files
      if (comment.file_url) {
        const url = comment.file_url
        const name = comment.comment || getFileNameFromUrl(url)
        const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)

        if (isImage) {
          images.push({ url, name, date: comment.created_at, taskId })
        } else {
          files.push({
            url,
            name,
            size: (comment as any).file_size,
            date: comment.created_at,
            taskId
          })
        }
      }

      // 2. Process [FILE_URLS: ...] pattern
      if (comment.comment) {
        const fileUrlsMatch = comment.comment.match(/\[FILE_URLS:\s*([^\]]+)\]/)
        if (fileUrlsMatch) {
          const urls = fileUrlsMatch[1].trim().split(/\s+/)
          urls.forEach(url => {
            const name = getFileNameFromUrl(url)
            const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)
            if (isImage) {
              images.push({ url, name, date: comment.created_at, taskId })
            } else {
              files.push({ url, name, date: comment.created_at, taskId })
            }
          })
        }

        // 3. Extract links (excluding file URL blocks)
        const cleanComment = comment.comment.replace(/\[FILE_URLS:[^\]]+\]/g, '')
        const matches = cleanComment.match(urlRegex)
        if (matches) {
          matches.forEach(url => {
            links.push({
              url,
              title: url.split('/').pop() || url,
              date: comment.created_at,
              taskId
            })
          })
        }
      }

      // 4. Also check nested replies if any
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(reply => {
          if (reply.file_url) {
            const url = reply.file_url
            const name = reply.comment || getFileNameFromUrl(url)
            const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)
            if (isImage) {
              images.push({ url, name, date: reply.created_at, taskId })
            } else {
              files.push({
                url,
                name,
                size: (reply as any).file_size,
                date: reply.created_at,
                taskId
              })
            }
          }
        })
      }
    })

    // Sort by date descending
    const sortByDate = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()

    return {
      images: images.sort(sortByDate),
      files: files.sort(sortByDate),
      links: links.sort(sortByDate)
    }
  }, [allComments])

  // Filter tasks: only show top-level tasks (no parent_id) and group subtasks with their parents
  const filteredTasks = tasks.filter(task => {
    // Only show top-level tasks (no parent_id)
    if (task.parent_id) return false
    // Apply status filter
    if (statusFilter === 'all') return true
    return task.status === statusFilter
  })

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

    // Broadcast typing status to other users (throttled to avoid spam)
    if (value.trim().length > 0 && selectedTaskId && user && typingChannelRef.current) {
      const now = Date.now()
      // Throttle: only broadcast every 1 second
      if (now - lastTypingBroadcastRef.current > 1000) {
        lastTypingBroadcastRef.current = now
        
        // Broadcast typing status
        typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            userName: user.full_name || user.email || 'Người dùng',
            taskId: selectedTaskId,
            isTyping: true
          }
        })
      } else {
        // Schedule a delayed broadcast if we're throttling
        if (typingBroadcastTimeoutRef.current) {
          clearTimeout(typingBroadcastTimeoutRef.current)
        }
        typingBroadcastTimeoutRef.current = setTimeout(() => {
          if (chatMessage.trim().length > 0 && selectedTaskId && user && typingChannelRef.current) {
            lastTypingBroadcastRef.current = Date.now()
            typingChannelRef.current.send({
              type: 'broadcast',
              event: 'typing',
              payload: {
                userId: user.id,
                userName: user.full_name || user.email || 'Người dùng',
                taskId: selectedTaskId,
                isTyping: true
              }
            })
          }
        }, 1000 - (now - lastTypingBroadcastRef.current))
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Broadcast "stopped typing" after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        if (typingChannelRef.current && user && selectedTaskId) {
          typingChannelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              userId: user.id,
              userName: user.full_name || user.email || 'Người dùng',
              taskId: selectedTaskId,
              isTyping: false
            }
          })
        }
      }, 2000)
    } else {
      // User stopped typing - broadcast immediately
      if (typingChannelRef.current && user && selectedTaskId) {
        typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            userName: user.full_name || user.email || 'Người dùng',
            taskId: selectedTaskId,
            isTyping: false
          }
        })
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (typingBroadcastTimeoutRef.current) {
        clearTimeout(typingBroadcastTimeoutRef.current)
      }
    }

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
      ? `@[${item.name}](member:${item.id})`
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

  const getFileIcon = (url: string): string | null => {
    return getFileIconFromUrl(url)
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

      // Get assignments for this checklist item
      const assignments = checklistItemAssignments[`create_${checklistId}`] || []

      const newItem = await apiPost(`/api/tasks/checklists/${checklistId}/items`, {
        content: itemContent,
        assignee_id: selectedChecklistAssigneeId,
        assignments: assignments.length > 0 ? assignments : undefined
      })

      // Reset states
      setChecklistItemContent('')
      setChecklistItemFiles([])
      setSelectedChecklistAssigneeId(null)
      setChecklistItemAssignments(prev => {
        const newAssignments = { ...prev }
        delete newAssignments[`create_${checklistId}`]
        return newAssignments
      })
      setShowAssignmentDropdown(prev => {
        const newDropdown = { ...prev }
        delete newDropdown[`create_${checklistId}`]
        return newDropdown
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

  const updateChecklistItemAssignee = async (itemId: string, assigneeId: string | null, taskId: string) => {
    try {
      const updatedItem = await apiPut(`/api/tasks/checklist-items/${itemId}`, {
        assignee_id: assigneeId
      })

      // Update tasks state
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            checklists: task.checklists?.map(checklist => ({
              ...checklist,
              items: checklist.items?.map(item =>
                item.id === itemId ? { ...item, assignee_id: assigneeId || undefined, assignee_name: updatedItem.assignee_name } : item
              )
            }))
          }
        }
        return task
      }))
    } catch (error) {
      console.error('Error updating checklist item assignee:', error)
      alert('Không thể cập nhật người được gán')
    }
  }

  const deleteChecklistItemAssignment = async (itemId: string, employeeId: string, taskId: string) => {
    try {
      // Tìm item để lấy danh sách assignments hiện tại
      const task = tasks.find(t => t.id === taskId)
      const checklist = task?.checklists?.find(c => c.items?.some(i => i.id === itemId))
      const item = checklist?.items?.find(i => i.id === itemId)
      
      if (!item) {
        alert('Không tìm thấy việc cần làm')
        return
      }

      // Lọc bỏ assignment cần xóa
      const updatedAssignments = (item.assignments || []).filter(
        (assignment: any) => assignment.employee_id !== employeeId
      )

      // Gọi API để cập nhật assignments
      const updatedItem = await apiPut(`/api/tasks/checklist-items/${itemId}`, {
        assignments: updatedAssignments.map((a: any) => ({
          employee_id: a.employee_id,
          responsibility_type: a.responsibility_type
        }))
      })

      // Update tasks state
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            checklists: task.checklists?.map(checklist => ({
              ...checklist,
              items: checklist.items?.map(item =>
                item.id === itemId ? { ...item, assignments: updatedItem.assignments || [] } : item
              )
            }))
          }
        }
        return task
      }))
    } catch (error) {
      console.error('Error deleting checklist item assignment:', error)
      alert('Không thể xóa phân công nhiệm vụ')
    }
  }

  const updateChecklistItemAssignment = async (itemId: string, employeeId: string, newResponsibilityType: string, taskId: string) => {
    try {
      // Tìm item để lấy danh sách assignments hiện tại
      const task = tasks.find(t => t.id === taskId)
      const checklist = task?.checklists?.find(c => c.items?.some(i => i.id === itemId))
      const item = checklist?.items?.find(i => i.id === itemId)
      
      if (!item) {
        alert('Không tìm thấy việc cần làm')
        return
      }

      // Cập nhật responsibility_type của assignment
      const updatedAssignments = (item.assignments || []).map((assignment: any) => {
        if (assignment.employee_id === employeeId) {
          return {
            ...assignment,
            responsibility_type: newResponsibilityType
          }
        }
        return assignment
      })

      // Gọi API để cập nhật assignments
      const updatedItem = await apiPut(`/api/tasks/checklist-items/${itemId}`, {
        assignments: updatedAssignments.map((a: any) => ({
          employee_id: a.employee_id,
          responsibility_type: a.responsibility_type
        }))
      })

      // Update tasks state
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            checklists: task.checklists?.map(checklist => ({
              ...checklist,
              items: checklist.items?.map(item =>
                item.id === itemId ? { ...item, assignments: updatedItem.assignments || [] } : item
              )
            }))
          }
        }
        return task
      }))
    } catch (error) {
      console.error('Error updating checklist item assignment:', error)
      alert('Không thể cập nhật phân công nhiệm vụ')
    }
  }

  const deleteChecklistItem = async (itemId: string, taskId: string) => {
    try {
      await apiDelete(`/api/tasks/checklist-items/${itemId}`)

      // Update tasks state - xóa item khỏi checklist
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            checklists: task.checklists?.map(checklist => ({
              ...checklist,
              items: checklist.items?.filter(item => item.id !== itemId)
            }))
          }
        }
        return task
      }))
    } catch (error) {
      console.error('Error deleting checklist item:', error)
      alert('Không thể xóa việc cần làm')
    }
  }

  const updateChecklistItemContent = async (itemId: string, newContent: string, taskId: string, files?: File[], existingFileUrls?: string[], assigneeId?: string | null, assignments?: Array<{ employee_id: string; responsibility_type: 'accountable' | 'responsible' | 'consulted' | 'informed' }>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('Thiếu token xác thực, vui lòng đăng nhập lại')
      }

      // Upload files if any
      let fileUrls: string[] = []
      if (files && files.length > 0) {
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

      // Combine existing file URLs (that weren't deleted) with new file URLs
      const allFileUrls = [...(existingFileUrls || []), ...fileUrls]

      // Append file URLs to content
      let itemContent = newContent.trim() || ''
      if (allFileUrls.length > 0) {
        const fileUrlsText = allFileUrls.join(' ')
        itemContent = itemContent
          ? `${itemContent} [FILE_URLS: ${fileUrlsText}]`
          : `📎 ${allFileUrls.length} file(s) [FILE_URLS: ${fileUrlsText}]`
      }

      // Prepare update payload
      const updatePayload: any = {
        content: itemContent
      }

      // Luôn dùng assignments (không dùng assignee_id nữa)
      // Nếu assignments được truyền vào (undefined hoặc array), luôn cập nhật
      if (assignments !== undefined) {
        updatePayload.assignments = assignments // Có thể là mảng rỗng để xóa assignments
        // Luôn xóa assignee_id khi dùng assignments
        updatePayload.assignee_id = null
      }

      const updatedItem = await apiPut(`/api/tasks/checklist-items/${itemId}`, updatePayload)

      // Update tasks state
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            checklists: task.checklists?.map(checklist => ({
              ...checklist,
              items: checklist.items?.map(item =>
                item.id === itemId ? {
                  ...item,
                  content: updatedItem.content,
                  assignee_id: updatedItem.assignee_id,
                  assignee_name: updatedItem.assignee_name,
                  assignments: updatedItem.assignments || []
                } : item
              )
            }))
          }
        }
        return task
      }))

      // Reset editing states
      setEditingChecklistItemId(null)
      setEditingChecklistItemContent('')
      setEditingChecklistItemFiles([])
      setEditingChecklistItemExistingFileUrls([])
      setEditingChecklistItemAssigneeId(null)
      setEditingChecklistItemAssignments([])
      setShowEditingAssignmentDropdown(false)
      if (editingChecklistItemFileInputRef.current) {
        editingChecklistItemFileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error updating checklist item:', error)
      alert('Không thể cập nhật việc cần làm')
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
      const formData = new FormData()
      formData.append('file', file)

      // Use apiPost with FormData - apiClient will handle authentication
      const { apiClient } = await import('@/lib/api/client')
      
      const data = await apiClient.request(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData
      })

      return data.file_url || data.url
    } catch (err: any) {
      console.error('Error uploading file:', err)
      
      // Handle authentication errors gracefully - don't redirect immediately
      // Let the API client handle redirects, but provide user-friendly error
      if (err?.status === 401 || err?.status === 403) {
        const errorMessage = err?.message || err?.data?.detail || ''
        if (errorMessage.toLowerCase().includes('not authenticated') || 
            errorMessage.toLowerCase().includes('unauthorized') ||
            errorMessage.toLowerCase().includes('token')) {
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        }
      }
      
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

    // Create optimistic messages immediately (before API calls)
    const tempMessageIds: string[] = []
    const optimisticMessages: TaskComment[] = []

    try {
      setSendingMessage(true)

      // Upload tất cả files song song (parallel) để tăng tốc
      const uploadedFiles: Array<{ file: File; url: string }> = []
      if (pendingFiles.length > 0) {
        const uploadPromises = pendingFiles.map(async (file) => {
        try {
          const fileUrl = await uploadChatFile(file, selectedTaskId)
            return { file, url: fileUrl }
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError)
          alert(`Không thể gửi file "${file.name}": ${getErrorMessage(fileError, 'Lỗi không xác định')}`)
            return null
        }
        })
        
        const results = await Promise.all(uploadPromises)
        uploadedFiles.push(...results.filter((r): r is { file: File; url: string } => r !== null))
      }

      // Nếu có cả text và file: gộp thành 1 tin nhắn
      if (trimmedMessage && uploadedFiles.length > 0) {
        const firstFile = uploadedFiles[0]
        const messageType: 'file' | 'image' = firstFile.file.type.startsWith('image/') ? 'image' : 'file'
        const tempId = `temp-${Date.now()}-${Math.random()}`
        tempMessageIds.push(tempId)

        const tempComment: TaskComment = {
          id: tempId,
          task_id: selectedTaskId,
          user_id: user?.id,
          comment: trimmedMessage,
          type: messageType,
          file_url: firstFile.url,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: user?.full_name,
          parent_id: replyingTo?.id || null
        }
        optimisticMessages.push(tempComment)

        // ADD OPTIMISTIC MESSAGE IMMEDIATELY (before API call)
        setSendingMessageIds(prev => {
          const newSet = new Set(prev)
          tempMessageIds.forEach(id => newSet.add(id))
          return newSet
        })
        setAllComments(prev => {
          const updated = [...prev, ...optimisticMessages]
          allCommentsRef.current = updated
          return updated
        })
        
        // Scroll to show new message immediately
        scrollToBottom('smooth')

        // Gửi API request và xử lý response ngay lập tức
        // Không chỉ dựa vào realtime - thêm real message từ API response
        apiPost(`/api/tasks/${selectedTaskId}/comments`, {
          comment: trimmedMessage,
          type: messageType,
          file_url: firstFile.url,
          is_pinned: false,
          parent_id: replyingTo?.id || null
        }).then(response => {
          console.log('[Send] ✅ API Response received:', {
            response,
            hasId: !!response?.id,
            responseKeys: response ? Object.keys(response) : [],
            tempMessageIds
          })
          
          // Handle different response formats
          let realComment: TaskComment | null = null
          if (response) {
            if (response.id) {
              realComment = response as TaskComment
            } else if (Array.isArray(response) && response.length > 0 && response[0]?.id) {
              realComment = response[0] as TaskComment
            } else if (response.data && response.data.id) {
              realComment = response.data as TaskComment
            } else if (response.comment && response.comment.id) {
              realComment = response.comment as TaskComment
            }
          }
          
          if (realComment && realComment.id) {
            console.log('[Send] ✅ Found real comment from API, replacing optimistic:', realComment.id)
            
            // Remove from sendingMessageIds
            setSendingMessageIds(prev => {
              const newSet = new Set(prev)
              tempMessageIds.forEach(id => newSet.delete(id))
              return newSet
            })
            
            // Replace optimistic with real message
            setAllComments(prev => {
              // Remove optimistic messages
              const filtered = prev.filter(c => !tempMessageIds.includes(c.id))
              // Check if real comment already exists (from realtime)
              const exists = filtered.find(c => c.id === realComment!.id)
              if (exists) {
                // Update existing
                return filtered.map(c => c.id === realComment!.id ? { ...c, ...realComment } : c)
              } else {
                // Add real comment
                return [...filtered, realComment!]
              }
            })
          } else {
            console.warn('[Send] ⚠️ No valid comment in API response, keeping optimistic and waiting for realtime')
            // Don't remove optimistic - wait for realtime
          }
        }).catch(err => {
          console.error('[Send] ❌ Error sending message:', err)
          // Remove optimistic message on error
          setAllComments(prev => prev.filter(c => !tempMessageIds.includes(c.id)))
          setSendingMessageIds(prev => {
            const newSet = new Set(prev)
            tempMessageIds.forEach(id => newSet.delete(id))
            return newSet
          })
          alert('Không thể gửi tin nhắn. Vui lòng thử lại.')
        })

        // Gửi các file còn lại song song (nếu có nhiều file)
        if (uploadedFiles.length > 1) {
          const additionalFilePromises = uploadedFiles.slice(1).map(async (fileData) => {
          const fileMessageType: 'file' | 'image' = fileData.file.type.startsWith('image/') ? 'image' : 'file'
            const tempId = `temp-${Date.now()}-${Math.random()}`
            tempMessageIds.push(tempId)

            const tempComment: TaskComment = {
              id: tempId,
              task_id: selectedTaskId,
              user_id: user?.id,
            comment: fileData.file.name || 'File đính kèm',
            type: fileMessageType,
            file_url: fileData.url,
            is_pinned: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_name: user?.full_name,
            parent_id: replyingTo?.id || null
            }
            optimisticMessages.push(tempComment)

            // ADD OPTIMISTIC MESSAGE IMMEDIATELY
            setSendingMessageIds(prev => {
              const newSet = new Set(prev)
              newSet.add(tempId)
              return newSet
            })
            setAllComments(prev => {
              const updated = [...prev, tempComment]
              allCommentsRef.current = updated
              return updated
            })

            // Gửi API request và xử lý response
            return apiPost(`/api/tasks/${selectedTaskId}/comments`, {
              comment: fileData.file.name || 'File đính kèm',
              type: fileMessageType,
              file_url: fileData.url,
              is_pinned: false,
              parent_id: replyingTo?.id || null
            }).then(response => {
              console.log('[Send] ✅ API Response for file:', {
                response,
                hasId: !!response?.id,
                tempId
              })
              
              // Handle different response formats
              let realComment: TaskComment | null = null
              if (response) {
                if (response.id) {
                  realComment = response as TaskComment
                } else if (Array.isArray(response) && response.length > 0 && response[0]?.id) {
                  realComment = response[0] as TaskComment
                } else if (response.data && response.data.id) {
                  realComment = response.data as TaskComment
                } else if (response.comment && response.comment.id) {
                  realComment = response.comment as TaskComment
                }
              }
              
              if (realComment && realComment.id) {
                console.log('[Send] ✅ Found real comment for file, replacing optimistic:', realComment.id)
                
                // Remove from sendingMessageIds
                setSendingMessageIds(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(tempId)
                  return newSet
                })
                
                // Replace optimistic with real message
                setAllComments(prev => {
                  const filtered = prev.filter(c => c.id !== tempId)
                  const exists = filtered.find(c => c.id === realComment!.id)
                  if (exists) {
                    return filtered.map(c => c.id === realComment!.id ? { ...c, ...realComment } : c)
                  } else {
                    return [...filtered, realComment!]
                  }
                })
              } else {
                console.warn('[Send] ⚠️ No valid comment in API response for file, keeping optimistic')
              }
            }).catch(err => {
              console.error(`[Send] ❌ Error sending file message ${fileData.file.name}:`, err)
              // Remove optimistic message on error
              setAllComments(prev => prev.filter(c => c.id !== tempId))
              setSendingMessageIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(tempId)
                return newSet
              })
            })
          })

          // Gửi tất cả file messages song song (không đợi)
          Promise.all(additionalFilePromises).catch(err => {
            console.error('Error sending additional file messages:', err)
          })
        }
      } else if (trimmedMessage) {
        // Chỉ có text, không có file
        const tempId = `temp-${Date.now()}-${Math.random()}`
        tempMessageIds.push(tempId)

        const tempComment: TaskComment = {
          id: tempId,
          task_id: selectedTaskId,
          user_id: user?.id,
          comment: trimmedMessage,
          type: 'text',
          file_url: undefined,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: user?.full_name,
          parent_id: replyingTo?.id || null
        }
        optimisticMessages.push(tempComment)

        // ADD OPTIMISTIC MESSAGE IMMEDIATELY (before API call)
        setSendingMessageIds(prev => {
          const newSet = new Set(prev)
          newSet.add(tempId)
          return newSet
        })
        setAllComments(prev => {
          const updated = [...prev, tempComment]
          allCommentsRef.current = updated
          return updated
        })
        // Scroll immediately
        scrollToBottom('smooth')

        // Gửi API request và xử lý response ngay lập tức
        apiPost(`/api/tasks/${selectedTaskId}/comments`, {
          comment: trimmedMessage,
          type: 'text',
          file_url: undefined,
            is_pinned: false,
            parent_id: replyingTo?.id || null
        }).then(response => {
          console.log('[Send] ✅ API Response for text:', {
            response,
            hasId: !!response?.id,
            tempId
          })
          
          // Handle different response formats
          let realComment: TaskComment | null = null
          if (response) {
            if (response.id) {
              realComment = response as TaskComment
            } else if (Array.isArray(response) && response.length > 0 && response[0]?.id) {
              realComment = response[0] as TaskComment
            } else if (response.data && response.data.id) {
              realComment = response.data as TaskComment
            } else if (response.comment && response.comment.id) {
              realComment = response.comment as TaskComment
            }
          }
          
          if (realComment && realComment.id) {
            console.log('[Send] ✅ Found real comment for text, replacing optimistic:', realComment.id)
            
            // Remove from sendingMessageIds
            setSendingMessageIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(tempId)
              return newSet
            })
            
            // Replace optimistic with real message
            setAllComments(prev => {
              const filtered = prev.filter(c => c.id !== tempId)
              const exists = filtered.find(c => c.id === realComment!.id)
              if (exists) {
                return filtered.map(c => c.id === realComment!.id ? { ...c, ...realComment } : c)
              } else {
                return [...filtered, realComment!]
              }
            })
          } else {
            console.warn('[Send] ⚠️ No valid comment in API response for text, keeping optimistic')
          }
        }).catch(err => {
          console.error('[Send] ❌ Error sending message:', err)
          // Remove optimistic message on error
          setAllComments(prev => prev.filter(c => c.id !== tempId))
          setSendingMessageIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(tempId)
            return newSet
          })
          alert('Không thể gửi tin nhắn. Vui lòng thử lại.')
        })
      } else if (uploadedFiles.length > 0) {
        // Chỉ có file, không có text - gửi tất cả file song song
        const filePromises = uploadedFiles.map(async (fileData) => {
          const messageType: 'file' | 'image' = fileData.file.type.startsWith('image/') ? 'image' : 'file'
          const tempId = `temp-${Date.now()}-${Math.random()}`
          tempMessageIds.push(tempId)

        const tempComment: TaskComment = {
            id: tempId,
          task_id: selectedTaskId,
          user_id: user?.id,
            comment: fileData.file.name || 'File đính kèm',
            type: messageType,
            file_url: fileData.url,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: user?.full_name,
          parent_id: replyingTo?.id || null
        }
          optimisticMessages.push(tempComment)

          // ADD OPTIMISTIC MESSAGE IMMEDIATELY
          setSendingMessageIds(prev => {
            const newSet = new Set(prev)
            newSet.add(tempId)
            return newSet
          })
          setAllComments(prev => {
            const updated = [...prev, tempComment]
            allCommentsRef.current = updated
            return updated
          })

          // Gửi API request (không đợi)
          return apiPost(`/api/tasks/${selectedTaskId}/comments`, {
            comment: fileData.file.name || 'File đính kèm',
            type: messageType,
            file_url: fileData.url,
            is_pinned: false,
            parent_id: replyingTo?.id || null
          }).catch(err => {
            console.error(`Error sending file message ${fileData.file.name}:`, err)
            // Remove optimistic message on error
            setAllComments(prev => prev.filter(c => c.id !== tempId))
            setSendingMessageIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(tempId)
              return newSet
            })
          })
        })

        // Gửi tất cả file messages song song (không đợi)
        Promise.all(filePromises).catch(err => {
          console.error('Error sending file messages:', err)
        })
        
        // Scroll once after all optimistic messages added
        scrollToBottom('smooth')
      }

      // Clear input and broadcast "stopped typing"
      setChatMessage('')
      if (typingChannelRef.current && user && selectedTaskId) {
        typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            userName: user.full_name || user.email || 'Người dùng',
            taskId: selectedTaskId,
            isTyping: false
          }
        })
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (typingBroadcastTimeoutRef.current) {
        clearTimeout(typingBroadcastTimeoutRef.current)
      }
      setPendingFiles([])
      setPendingPreview(null)
      setReplyingTo(null)

      // Fallback mechanism: If realtime doesn't work, fetch comments after delay
      // This ensures messages are synced even if realtime subscription fails
      const fallbackTimeout = setTimeout(() => {
        setSendingMessageIds(prev => {
          const stillSending = tempMessageIds.filter(id => prev.has(id))
          if (stillSending.length > 0) {
            console.log('[Send] ⚠️ Fallback: Still have sending messages after 3s:', stillSending)
            console.log('[Send] ⚠️ Realtime may not be working. Fetching comments as fallback...')
            
            // Fetch comments to sync with server
            fetchAllComments(true).then(() => {
              console.log('[Send] ✅ Fallback: Fetched comments, checking for matches...')
              
              // After fetch, check if real messages exist and match
              setSendingMessageIds(prev2 => {
                const newSet = new Set(prev2)
                stillSending.forEach(tempId => {
                  const tempMsg = allCommentsRef.current.find(c => c.id === tempId)
                  if (tempMsg) {
                    // Try to find matching real message
                    // Match by: task_id + similar content + recent timestamp (within 10 seconds)
                    const tempTime = new Date(tempMsg.created_at || Date.now()).getTime()
                    const matchingReal = allCommentsRef.current.find(c => {
                      if (c.id?.startsWith('temp-')) return false
                      if (c.task_id !== tempMsg.task_id) return false
                      
                      const realTime = new Date(c.created_at).getTime()
                      const timeDiff = Math.abs(realTime - tempTime)
                      
                      // Match by exact content OR by task_id + timestamp (within 10s)
                      const contentMatch = c.comment === tempMsg.comment && c.type === tempMsg.type
                      const timeMatch = timeDiff < 10000 // 10 seconds
                      
                      return contentMatch || (timeMatch && c.type === tempMsg.type)
                    })
                    
                    if (matchingReal) {
                      console.log('[Send] ✅ Fallback: Found matching real message:', matchingReal.id, 'for temp:', tempId)
                      newSet.delete(tempId)
                      
                      // Also remove the temp message from comments
                      setAllComments(prevComments => {
                        const filtered = prevComments.filter(c => c.id !== tempId)
                        allCommentsRef.current = filtered
                        return filtered
                      })
                    }
                  }
                })
                
                if (newSet.size < prev2.size) {
                  console.log('[Send] ✅ Fallback: Removed', prev2.size - newSet.size, 'temp IDs')
                }
                return newSet
              })
            }).catch(err => {
              console.error('[Send] ❌ Fallback: Failed to fetch comments:', err)
            })
          }
          return prev
        })
      }, 3000) // Fallback after 3 seconds
      
      // Store timeout for cleanup
      return () => {
        clearTimeout(fallbackTimeout)
      }
    } catch (err: any) {
      // Remove failed optimistic messages
      const failedIds = optimisticMessages.map(m => m.id)
      setAllComments(prev => prev.filter(c => !failedIds.includes(c.id)))
      allCommentsRef.current = allCommentsRef.current.filter(c => !failedIds.includes(c.id))
      setSendingMessageIds(prev => {
        const newSet = new Set(prev)
        tempMessageIds.forEach(id => newSet.delete(id))
        return newSet
      })
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

  // Check if user is admin or manager
  const isAdminOrManager = () => {
    if (!user) return false
    const role = user.role?.toLowerCase()
    return role && ['admin', 'manager'].includes(role)
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



  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length
  }

  return (
    <div className={mode === 'chat-only' ? 'h-full flex flex-col' : 'space-y-6'}>
      {/* Header - Only show in full mode */}
      {mode !== 'chat-only' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg shrink-0">
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
            <div className="flex flex-wrap gap-2 items-center">
              {/* Project Status Selector */}
              {project && (
                <div className="relative min-w-[160px]">
                  <select
                    value={project.status_id || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleUpdateProjectStatus(e.target.value)
                      }
                    }}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="h-px bg-gray-100 w-full mb-6" />

          {/* Status Filter */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Bộ lọc trạng thái</p>
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === filter.value
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {filter.label} <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === filter.value ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{filter.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tasks List - Only show in full mode */}
      {mode !== 'chat-only' && (filteredTasks.length === 0 ? (
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
            <div
              className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
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
                className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
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
                                <div
                                  className="mb-4 p-3 bg-gray-50 rounded-lg border border-blue-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                                    
                                    {/* Multi-assignment section */}
                                    <div className="relative flex items-center gap-2 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => setShowAssignmentDropdown(prev => ({ ...prev, [`create_${checklist.id}`]: !prev[`create_${checklist.id}`] }))}
                                        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                                        title="Thêm nhân viên chịu trách nhiệm"
                                      >
                                        <UserIcon className="h-3.5 w-3.5" />
                                        <span>Gán nhân viên</span>
                                        {(checklistItemAssignments[`create_${checklist.id}`] || []).length > 0 && (
                                          <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                            {(checklistItemAssignments[`create_${checklist.id}`] || []).length}
                                          </span>
                                        )}
                                      </button>
                                      
                                      {/* Selected Assignments Display */}
                                      {(checklistItemAssignments[`create_${checklist.id}`] || []).length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {(checklistItemAssignments[`create_${checklist.id}`] || []).map((assignment, idx) => {
                                            const member = groupMembers.find(m => m.employee_id === assignment.employee_id)
                                            const responsibilityLabels: Record<string, string> = {
                                              accountable: 'Chịu trách nhiệm',
                                              responsible: 'Thực hiện',
                                              consulted: 'Tư vấn',
                                              informed: 'Thông báo'
                                            }
                                            return member ? (
                                              <div key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md text-xs">
                                                <span className="text-gray-700 font-medium">{member.employee_name}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-gray-600">{responsibilityLabels[assignment.responsibility_type] || assignment.responsibility_type}</span>
                                                <button
                                                  onClick={() => {
                                                    const newAssignments = (checklistItemAssignments[`create_${checklist.id}`] || []).filter((_, i) => i !== idx)
                                                    setChecklistItemAssignments(prev => ({ ...prev, [`create_${checklist.id}`]: newAssignments }))
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
                                      {showAssignmentDropdown[`create_${checklist.id}`] && (
                                        <div className="absolute top-full left-0 z-50 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                                          <div className="space-y-3">
                                            <div>
                                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Chọn nhân viên</label>
                                              <select
                                                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                                onChange={(e) => {
                                                  const employeeId = e.target.value
                                                  if (employeeId) {
                                                    const currentAssignments = checklistItemAssignments[`create_${checklist.id}`] || []
                                                    if (!currentAssignments.find(a => a.employee_id === employeeId)) {
                                                      setChecklistItemAssignments(prev => ({
                                                        ...prev,
                                                        [`create_${checklist.id}`]: [...currentAssignments, { employee_id: employeeId, responsibility_type: 'responsible' }]
                                                      }))
                                                    }
                                                    e.target.value = ''
                                                  }
                                                }}
                                              >
                                                <option value="">-- Chọn nhân viên --</option>
                                                {groupMembers.map(member => (
                                                  <option key={member.employee_id} value={member.employee_id}>
                                                    {member.employee_name}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>
                                            
                                            {(checklistItemAssignments[`create_${checklist.id}`] || []).length > 0 && (
                                              <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phân công nhiệm vụ</label>
                                                <div className="space-y-2">
                                                  {(checklistItemAssignments[`create_${checklist.id}`] || []).map((assignment, idx) => {
                                                    const member = groupMembers.find(m => m.employee_id === assignment.employee_id)
                                                    return member ? (
                                                      <div key={idx} className="flex items-center gap-2">
                                                        <div className="flex-1">
                                                          <span className="text-xs text-gray-700 font-medium">{member.employee_name}</span>
                                                        </div>
                                                        <select
                                                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                                                          value={assignment.responsibility_type}
                                                          onChange={(e) => {
                                                            const newAssignments = [...(checklistItemAssignments[`create_${checklist.id}`] || [])]
                                                            newAssignments[idx].responsibility_type = e.target.value as 'accountable' | 'responsible' | 'consulted' | 'informed'
                                                            setChecklistItemAssignments(prev => ({ ...prev, [`create_${checklist.id}`]: newAssignments }))
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
                                                onClick={() => setShowAssignmentDropdown(prev => ({ ...prev, [`create_${checklist.id}`]: false }))}
                                                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                              >
                                                Xong
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-2 flex-1">
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
                                          <span>File</span>
                                        </label>
                                      </div>
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
                                          setChecklistItemAssignments(prev => {
                                            const newAssignments = { ...prev }
                                            delete newAssignments[`create_${checklist.id}`]
                                            return newAssignments
                                          })
                                          setShowAssignmentDropdown(prev => {
                                            const newDropdown = { ...prev }
                                            delete newDropdown[`create_${checklist.id}`]
                                            return newDropdown
                                          })
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
                                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${item.is_completed
                                            ? 'bg-blue-600 border-blue-600 hover:bg-blue-700'
                                            : 'border-gray-300 hover:border-blue-500'
                                            }`}
                                        >
                                          {item.is_completed && <Check className="h-3 w-3 text-white" />}
                                        </button>
                                        <div className="flex-1 space-y-2 min-w-0">
                                          {/* Content text - Edit mode or Display mode */}
                                          {editingChecklistItemId === item.id ? (
                                            <div className="space-y-3">
                                              {/* Nội dung */}
                                              <div className="flex items-center gap-2">
                                                <input
                                                  type="text"
                                                  value={editingChecklistItemContent}
                                                  onChange={(e) => setEditingChecklistItemContent(e.target.value)}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                                                  placeholder="Nội dung việc cần làm"
                                                  autoFocus
                                                />
                                              </div>

                                              {/* File management */}
                                              <div className="space-y-2">
                                                <label className="text-xs font-medium text-gray-700">File đính kèm:</label>
                                                
                                                {/* File hiện có */}
                                                {editingChecklistItemExistingFileUrls.length > 0 && (
                                                  <div className="flex flex-wrap gap-2">
                                                    {editingChecklistItemExistingFileUrls.map((url, idx) => {
                                                      const fileName = getFileNameFromUrl(url)
                                                      return (
                                                        <div
                                                          key={idx}
                                                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs"
                                                        >
                                                          <File className="h-3 w-3 text-gray-600" />
                                                          <span className="max-w-[120px] truncate text-black">{fileName}</span>
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation()
                                                              setEditingChecklistItemExistingFileUrls(prev => prev.filter((_, i) => i !== idx))
                                                            }}
                                                            className="ml-1 text-gray-500 hover:text-red-600"
                                                            title="Xóa file"
                                                          >
                                                            <X className="h-3 w-3" />
                                                          </button>
                                                        </div>
                                                      )
                                                    })}
                                                  </div>
                                                )}

                                                {/* Thêm file mới */}
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    ref={editingChecklistItemFileInputRef}
                                                    type="file"
                                                    multiple
                                                    onChange={(e) => {
                                                      const files = Array.from(e.target.files || [])
                                                      setEditingChecklistItemFiles(prev => [...prev, ...files])
                                                    }}
                                                    className="hidden"
                                                    id={`edit-checklist-item-file-${item.id}`}
                                                  />
                                                  <label
                                                    htmlFor={`edit-checklist-item-file-${item.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-gray-700"
                                                  >
                                                    <Plus className="h-3 w-3" />
                                                    <span>Thêm file</span>
                                                  </label>
                                                  {editingChecklistItemFiles.length > 0 && (
                                                    <div className="flex-1 flex items-center gap-1 flex-wrap">
                                                      {editingChecklistItemFiles.map((file, idx) => (
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
                                                              setEditingChecklistItemFiles(prev => prev.filter((_, i) => i !== idx))
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

                                              {/* Phân công nhiệm vụ */}
                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <label className="text-xs font-medium text-gray-700">Phân công nhiệm vụ:</label>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      setShowEditingAssignmentDropdown(!showEditingAssignmentDropdown)
                                                    }}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                                  >
                                                    <Plus className="h-3 w-3" />
                                                    <span>Thêm</span>
                                                  </button>
                                                </div>

                                                {/* Dropdown thêm assignment */}
                                                {showEditingAssignmentDropdown && (
                                                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                                                    <select
                                                      onChange={(e) => {
                                                        const employeeId = e.target.value
                                                        if (employeeId && !editingChecklistItemAssignments.find(a => a.employee_id === employeeId)) {
                                                          setEditingChecklistItemAssignments(prev => [...prev, { employee_id: employeeId, responsibility_type: 'responsible' }])
                                                          e.target.value = ''
                                                          setShowEditingAssignmentDropdown(false)
                                                        }
                                                      }}
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white"
                                                    >
                                                      <option value="">-- Chọn nhân viên --</option>
                                                      {groupMembers.map((member) => (
                                                        <option key={member.employee_id} value={member.employee_id}>
                                                          {member.employee_name}
                                                        </option>
                                                      ))}
                                                    </select>
                                                  </div>
                                                )}

                                                {/* Danh sách assignments */}
                                                {editingChecklistItemAssignments.length > 0 && (
                                                  <div className="space-y-2">
                                                    {editingChecklistItemAssignments.map((assignment, idx) => {
                                                      const member = groupMembers.find(m => m.employee_id === assignment.employee_id)
                                                      const responsibilityLabels: Record<string, string> = {
                                                        accountable: 'Chịu trách nhiệm',
                                                        responsible: 'Thực hiện',
                                                        consulted: 'Tư vấn',
                                                        informed: 'Thông báo'
                                                      }
                                                      return (
                                                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                          <span className="flex-1 text-xs text-black font-medium">{member?.employee_name || 'Nhân viên'}</span>
                                                          <select
                                                            value={assignment.responsibility_type}
                                                            onChange={(e) => {
                                                              const newAssignments = [...editingChecklistItemAssignments]
                                                              newAssignments[idx].responsibility_type = e.target.value as 'accountable' | 'responsible' | 'consulted' | 'informed'
                                                              setEditingChecklistItemAssignments(newAssignments)
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white"
                                                          >
                                                            <option value="accountable">Chịu trách nhiệm</option>
                                                            <option value="responsible">Thực hiện</option>
                                                            <option value="consulted">Tư vấn</option>
                                                            <option value="informed">Thông báo</option>
                                                          </select>
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation()
                                                              setEditingChecklistItemAssignments(prev => prev.filter((_, i) => i !== idx))
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-red-600"
                                                            title="Xóa"
                                                          >
                                                            <X className="h-3 w-3" />
                                                          </button>
                                                        </div>
                                                      )
                                                    })}
                                                  </div>
                                                )}
                                              </div>

                                              {/* Nút lưu và hủy */}
                                              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditingChecklistItemId(null)
                                                    setEditingChecklistItemContent('')
                                                    setEditingChecklistItemFiles([])
                                                    setEditingChecklistItemExistingFileUrls([])
                                                    setEditingChecklistItemAssigneeId(null)
                                                    setEditingChecklistItemAssignments([])
                                                    setShowEditingAssignmentDropdown(false)
                                                    if (editingChecklistItemFileInputRef.current) {
                                                      editingChecklistItemFileInputRef.current.value = ''
                                                    }
                                                  }}
                                                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                                >
                                                  Hủy
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    updateChecklistItemContent(
                                                      item.id,
                                                      editingChecklistItemContent,
                                                      task.id,
                                                      editingChecklistItemFiles.length > 0 ? editingChecklistItemFiles : undefined,
                                                      editingChecklistItemExistingFileUrls.length > 0 ? editingChecklistItemExistingFileUrls : undefined,
                                                      undefined, // Không dùng assignee_id nữa, chỉ dùng assignments
                                                      editingChecklistItemAssignments // Luôn truyền assignments (có thể là mảng rỗng để xóa)
                                                    )
                                                  }}
                                                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                  Lưu
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-between gap-2">
                                              {displayContent && (
                                                <span className={`text-sm leading-snug flex-1 ${item.is_completed
                                                  ? 'text-gray-400 line-through'
                                                  : 'text-gray-700'
                                                  }`}>
                                                  {displayContent}
                                                </span>
                                              )}

                                              {/* Chỉ hiển thị select khi chưa gán nhân viên */}
                                              {!item.assignee_id && (
                                                <div className="flex-shrink-0 relative group/assignee">
                                                  <select
                                                    value={item.assignee_id || ''}
                                                    onChange={(e) => updateChecklistItemAssignee(item.id, e.target.value || null, task.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="appearance-none bg-transparent pl-6 pr-2 py-0.5 text-[11px] rounded border transition-all cursor-pointer outline-none text-gray-400 border-transparent hover:border-gray-200 hover:text-gray-600"
                                                  >
                                                    <option value="">Chưa gán</option>
                                                    {groupMembers.map((member) => (
                                                      <option key={member.employee_id} value={member.employee_id}>
                                                        {member.employee_name}
                                                      </option>
                                                    ))}
                                                  </select>
                                                  <UserIcon className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                </div>
                                              )}

                                              {/* Nút chỉnh sửa và xóa */}
                                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    // Parse content để loại bỏ file URLs
                                                    let content = item.content || ''
                                                    const fileUrls: string[] = []
                                                    const fileUrlsMatch = content.match(/\[FILE_URLS:\s*([^\]]+)\]/)
                                                    if (fileUrlsMatch) {
                                                      const urlsText = fileUrlsMatch[1].trim()
                                                      const urls = urlsText.split(/\s+/).filter(url =>
                                                        url.length > 0 && (url.startsWith('http://') || url.startsWith('https://'))
                                                      )
                                                      fileUrls.push(...urls)
                                                      content = content.replace(/\[FILE_URLS:[^\]]+\]/g, '').trim()
                                                      content = content.replace(/^📎 \d+ file\(s\)\s*$/g, '').trim()
                                                    }
                                                    
                                                    setEditingChecklistItemId(item.id)
                                                    setEditingChecklistItemContent(content)
                                                    setEditingChecklistItemFiles([])
                                                    setEditingChecklistItemExistingFileUrls(fileUrls)
                                                    // Nếu có assignments thì dùng assignments, nếu không thì convert assignee_id thành assignment
                                                    if (item.assignments && item.assignments.length > 0) {
                                                      setEditingChecklistItemAssignments(item.assignments.map((a: any) => ({
                                                        employee_id: a.employee_id,
                                                        responsibility_type: a.responsibility_type
                                                      })))
                                                    } else if (item.assignee_id) {
                                                      // Convert assignee_id thành assignment với vai trò "responsible"
                                                      setEditingChecklistItemAssignments([{
                                                        employee_id: item.assignee_id,
                                                        responsibility_type: 'responsible'
                                                      }])
                                                    } else {
                                                      setEditingChecklistItemAssignments([])
                                                    }
                                                    setShowEditingAssignmentDropdown(false)
                                                  }}
                                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                  title="Chỉnh sửa"
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (confirm('Bạn có chắc muốn xóa việc cần làm này?')) {
                                                      deleteChecklistItem(item.id, task.id)
                                                    }
                                                  }}
                                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                  title="Xóa"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </button>
                                              </div>
                                            </div>
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

                                          {/* Display assigned employees with roles */}
                                          {item.assignments && item.assignments.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                              {item.assignments.map((assignment, idx) => {
                                                const responsibilityLabels: Record<string, string> = {
                                                  accountable: 'Chịu trách nhiệm',
                                                  responsible: 'Thực hiện',
                                                  consulted: 'Tư vấn',
                                                  informed: 'Thông báo'
                                                }
                                                
                                                // Tìm employee_name từ groupMembers nếu không có trong assignment
                                                const employeeName = assignment.employee_name || 
                                                  (assignment.employee_id 
                                                    ? groupMembers.find(m => m.employee_id === assignment.employee_id)?.employee_name 
                                                    : null) || 
                                                  'Nhân viên'
                                                
                                                // Chỉ hiển thị nút xóa cho vai trò "accountable" (Chịu trách nhiệm)
                                                const isAccountable = assignment.responsibility_type === 'accountable'
                                                // Admin và manager có thể xóa và sửa tất cả assignments
                                                const canEdit = isAdminOrManager()
                                                
                                                return (
                                                  <div 
                                                    key={`${item.id}-assignment-${idx}`}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md text-xs group/assignment"
                                                  >
                                                    <UserIcon className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                                    <span className="text-gray-700 font-medium">
                                                      {employeeName}
                                                    </span>
                                                    {assignment.responsibility_type && (
                                                      <>
                                                        <span className="text-gray-400">•</span>
                                                        {canEdit ? (
                                                          <select
                                                            value={assignment.responsibility_type}
                                                            onChange={(e) => {
                                                              e.stopPropagation()
                                                              updateChecklistItemAssignment(item.id, assignment.employee_id, e.target.value, task.id)
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-gray-600 bg-transparent border-none outline-none cursor-pointer text-xs py-0 px-1 rounded hover:bg-blue-100 transition-colors"
                                                            title="Sửa vai trò"
                                                          >
                                                            <option value="accountable">Chịu trách nhiệm</option>
                                                            <option value="responsible">Thực hiện</option>
                                                            <option value="consulted">Tư vấn</option>
                                                            <option value="informed">Thông báo</option>
                                                          </select>
                                                        ) : (
                                                          <span className="text-gray-600">
                                                            {responsibilityLabels[assignment.responsibility_type] || assignment.responsibility_type}
                                                          </span>
                                                        )}
                                                      </>
                                                    )}
                                                    {/* Hiển thị nút xóa cho accountable hoặc admin/manager */}
                                                    {(isAccountable || canEdit) && assignment.employee_id && (
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          if (confirm('Bạn có chắc muốn xóa phân công nhiệm vụ này?')) {
                                                            deleteChecklistItemAssignment(item.id, assignment.employee_id, task.id)
                                                          }
                                                        }}
                                                        className="ml-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover/assignment:opacity-100"
                                                        title="Xóa phân công"
                                                      >
                                                        <X className="h-3 w-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                          
                                          {/* Assignee name - only show if no assignments */}
                                          {!item.assignments?.length && item.assignee_name && (
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTaskClick(task.id)
                    }}
                    className="ml-4 p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Xem chi tiết nhiệm vụ"
                  >
                    <ArrowRight className="h-5 w-5 text-gray-400 hover:text-blue-600" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {mode === 'chat-only' && (
        <div className="flex flex-col h-full w-full overflow-hidden bg-transparent">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Trao đổi</h3>
              <span className="text-sm text-gray-500">({allComments.length})</span>
            </div>
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className={`p-2 rounded-lg transition-colors ${showInfoPanel ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
              title="Thông tin hội thoại"
            >
              <Info className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100">
              {loadingComments ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : allComments.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-500">Chưa có tin nhắn nào</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4" data-chat-container>
                  {allComments.length > messageLimit && (
                    <div className="text-center pb-2">
                      <button
                        onClick={() => setMessageLimit(prev => prev + 20)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Xem thêm tin nhắn cũ ({allComments.length - messageLimit} tin nhắn khác)
                      </button>
                    </div>
                  )}
                  {allComments
                    .slice(-messageLimit) // Show last N comments (most recent)
                    .map((comment, index, arr) => {
                      const prevComment = index > 0 ? arr[index - 1] : null
                      const nextComment = index < arr.length - 1 ? arr[index + 1] : null

                      const isMine = user && (
                        (comment.user_id && user.id === comment.user_id) ||
                        (comment.employee_id && user.id === comment.employee_id) ||
                        (comment.id?.startsWith('temp-'))
                      )

                      const isSameSenderAsPrev = prevComment && (
                        (prevComment.user_id && prevComment.user_id === comment.user_id) ||
                        (prevComment.employee_id && prevComment.employee_id === comment.employee_id)
                      )

                      const isGroupedWithPrev = isSameSenderAsPrev && (new Date(comment.created_at).getTime() - new Date(prevComment.created_at).getTime()) / 1000 / 60 < 5
                      const isGroupedWithNext = nextComment && ((nextComment.user_id && nextComment.user_id === comment.user_id) || (nextComment.employee_id && nextComment.employee_id === comment.employee_id)) && (new Date(nextComment.created_at).getTime() - new Date(comment.created_at).getTime()) / 1000 / 60 < 5

                      const isFirstInGroup = !isGroupedWithPrev
                      const isLastInGroup = !isGroupedWithNext

                      const task = tasks.find(t => t.id === comment.task_id)
                      const isSending = comment.id?.startsWith('temp-') && sendingMessageIds.has(comment.id)
                      const isNewMessage = comment.id?.startsWith('temp-') || (index === arr.length - 1 && new Date(comment.created_at).getTime() > Date.now() - 10000)

                      // Parent comment for Quote logic
                      const parentComment = comment.parent_id ? allComments.find(c => c.id === comment.parent_id) : null

                      return (
                        <div
                          key={comment.id}
                          data-comment-id={comment.id}
                          className={`flex w-full mb-1 ${isMine ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'}`}
                        >
                          <div className={`flex max-w-[85%] md:max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group`}>
                            {/* Avatar - Only show for others and only for the last message in a group */}
                            {!isMine ? (
                              <div className="w-8 shrink-0 flex flex-col items-center">
                                {isLastInGroup ? (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                                    title={getDisplayName(comment)}>
                                    {getDisplayName(comment).charAt(0).toUpperCase()}
                                  </div>
                                ) : (
                                  <div className="w-8" />
                                )}
                              </div>
                            ) : null}

                            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} min-w-0`}>
                              {/* Name - Only show for others and only for the first message in a group */}
                              {!isMine && isFirstInGroup && (
                                <span className="text-[11px] font-semibold text-gray-500 mb-1 ml-1 px-1">
                                  {getDisplayName(comment)}
                                </span>
                              )}

                              <div className="relative group">
                                <div
                                  className={`
                                    relative p-3 text-sm shadow-sm transition-all duration-200
                                    ${isMine
                                      ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm'
                                      : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'
                                    }
                                    ${isSending ? 'opacity-80 ring-1 ring-blue-300' : ''}
                                    ${isNewMessage && !isSending ? 'animate-pulse ring-2 ring-blue-400' : ''}
                                    ${isMine && !isLastInGroup ? 'rounded-br-sm' : ''}
                                    ${isMine && !isFirstInGroup ? 'rounded-tr-sm' : ''}
                                    ${!isMine && !isLastInGroup ? 'rounded-bl-sm' : ''}
                                    ${!isMine && !isFirstInGroup ? 'rounded-tl-sm' : ''}
                                  `}
                                >
                                  {/* Facebook/Zalo Style Quote Box */}
                                  {parentComment && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const el = document.querySelector(`[data-comment-id="${parentComment.id}"]`)
                                        if (el) {
                                          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                          el.classList.add('animate-pulse-brief')
                                          setTimeout(() => el.classList.remove('animate-pulse-brief'), 2000)
                                        }
                                      }}
                                      className={`
                                        mb-2 p-2 rounded-lg border-l-2 text-[11px] flex flex-col gap-0.5 cursor-pointer transition-all hover:bg-opacity-80 active:scale-[0.98]
                                        ${isMine
                                          ? 'bg-blue-600/30 border-blue-200/50 text-blue-50'
                                          : 'bg-gray-100 border-gray-300 text-gray-500'}
                                      `}
                                    >
                                      <div className="font-bold flex items-center gap-1">
                                        <Reply className="h-2.5 w-2.5 rotate-180" />
                                        <span>{getDisplayName(parentComment)}</span>
                                      </div>
                                      <div className="line-clamp-1 italic opacity-80">
                                        {parentComment.type === 'image' ? 'Đã gửi một ảnh' :
                                          parentComment.type === 'file' ? 'Đã gửi một tệp' :
                                            parentComment.comment}
                                      </div>
                                    </div>
                                  )}


                                  {/* Media Content */}
                                  {comment.type === 'image' && comment.file_url && (
                                    <div className="mb-2 -mx-1 -mt-1 overflow-hidden rounded-lg">
                                      <img
                                        src={comment.file_url}
                                        alt="Attachment"
                                        className="max-w-full max-h-64 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                          const imgIdx = sharedContent.images.findIndex(img => img.url === comment.file_url)
                                          if (imgIdx !== -1) setZoomedImage({ url: comment.file_url!, index: imgIdx })
                                        }}
                                      />
                                    </div>
                                  )}

                                  {comment.type === 'file' && comment.file_url && (
                                    <a
                                      href={comment.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`
                                        flex items-center gap-3 p-2 rounded-lg mb-2 transition-colors
                                        ${isMine ? 'bg-blue-700/50 hover:bg-blue-700/70' : 'bg-gray-50 hover:bg-gray-100'}
                                      `}
                                    >
                                      <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 ${isMine ? 'bg-white/20' : 'bg-blue-50'}`}>
                                        {(() => {
                                          let fileName = comment.comment || (comment as any).file_name || ''
                                          if (comment.file_url) {
                                            const urlParts = comment.file_url.split('/')
                                            const nameFromUrl = urlParts[urlParts.length - 1].split('?')[0]
                                            if (nameFromUrl.includes('.')) fileName = nameFromUrl
                                          }
                                          const iconPath = getFileIconPath('', fileName)
                                          return iconPath ? <img src={iconPath} className="h-5 w-5" /> : <Paperclip className={`h-4 w-4 ${isMine ? 'text-white' : 'text-blue-500'}`} />
                                        })()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className={`text-xs font-medium truncate ${isMine ? 'text-white' : 'text-gray-900'}`}>
                                          {comment.comment || 'File đính kèm'}
                                        </p>
                                        <p className={`text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                                          Tải xuống
                                        </p>
                                      </div>
                                    </a>
                                  )}

                                  {/* Text Content */}
                                  {comment.comment && comment.type === 'text' && (
                                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                                      {(() => {
                                        const text = comment.comment
                                        // Match both custom @[Name](type:id) format and basic @Name format
                                        const mentionRegex = /(@|#)?\[([^\]]+)\]\(([^)]+)\)|(@\w+)/g
                                        const parts = []
                                        let lastIndex = 0
                                        let match

                                        while ((match = mentionRegex.exec(text)) !== null) {
                                          // Add plain text before match
                                          if (match.index > lastIndex) {
                                            parts.push({ type: 'text', content: text.substring(lastIndex, match.index) })
                                          }

                                          if (match[2]) {
                                            // Handle @[Name](type:id) format
                                            const name = match[2]
                                            const info = match[3] // e.g. "member:uuid" or "checklist:uuid"
                                            const [type, id] = info.includes(':') ? info.split(':') : ['member', info]
                                            parts.push({ type: type as any, content: name, id })
                                          } else if (match[4]) {
                                            // Handle @Name format
                                            parts.push({ type: 'member', content: match[4].substring(1) })
                                          }

                                          lastIndex = mentionRegex.lastIndex
                                        }

                                        // Add remaining text
                                        if (lastIndex < text.length) {
                                          parts.push({ type: 'text', content: text.substring(lastIndex) })
                                        }

                                        return parts.map((part, idx) => {
                                          if (part.type === 'member') {
                                            return (
                                              <span
                                                key={idx}
                                                className={`font-semibold cursor-pointer underline-offset-2 hover:underline ${isMine ? 'text-blue-100' : 'text-blue-600'}`}
                                                title={part.id ? `ID: ${part.id}` : undefined}
                                              >
                                                @{part.content}
                                              </span>
                                            )
                                          }
                                          if (part.type === 'checklist') {
                                            return (
                                              <span
                                                key={idx}
                                                onClick={() => {
                                                  if (part.id) {
                                                    const el = document.querySelector(`[data-checklist-item-id="${part.id}"]`)
                                                    if (el) {
                                                      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                      el.classList.add('animate-highlight')
                                                      setTimeout(() => el.classList.remove('animate-highlight'), 3000)
                                                    }
                                                  }
                                                }}
                                                className={`font-semibold cursor-pointer italic underline-offset-2 hover:underline ${isMine ? 'bg-blue-500/30 text-blue-50 px-1 rounded' : 'bg-blue-50 text-blue-700 px-1 rounded'}`}
                                              >
                                                #{part.content}
                                              </span>
                                            )
                                          }
                                          return <span key={idx}>{part.content}</span>
                                        })
                                      })()}
                                    </p>
                                  )}

                                  {/* Pinned Indicator */}
                                  {comment.is_pinned && (
                                    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'text-blue-100' : 'text-blue-600'} text-[10px]`}>
                                      <Pin className="h-2.5 w-2.5 fill-current" />
                                      <span>Đã ghim</span>
                                    </div>
                                  )}
                                </div>

                                {/* Floating Actions - Show on hover next to bubble */}
                                <div className={`
                                  absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10
                                  ${isMine ? 'right-full mr-2 flex-row-reverse' : 'left-full ml-2 flex-row'}
                                `}>
                                  <button
                                    onClick={() => handleReply(comment)}
                                    className="p-1.5 bg-white shadow-md border border-gray-100 rounded-full text-gray-500 hover:text-blue-600 hover:scale-110 transition-all"
                                    title="Trả lời"
                                  >
                                    <Reply className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleTogglePin(comment)}
                                    className={`p-1.5 bg-white shadow-md border border-gray-100 rounded-full ${comment.is_pinned ? 'text-blue-600' : 'text-gray-500'} hover:scale-110 transition-all`}
                                    title={comment.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                                  >
                                    <Pin className="h-3.5 w-3.5" />
                                  </button>
                                  {canManageComment(comment) && (
                                    <button
                                      onClick={() => handleDeleteComment(comment)}
                                      className="p-1.5 bg-white shadow-md border border-gray-100 rounded-full text-red-400 hover:text-red-600 hover:scale-110 transition-all"
                                      title="Xóa"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Footer - Time or Sending Status - Only show for last message in group */}
                              {isLastInGroup && (
                                <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  {isSending ? (
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                      <div className="flex gap-0.5">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                      </div>
                                      <span className="text-blue-500 font-medium">Đang gửi...</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-400">
                                  {formatDate(comment.created_at, true)}
                                </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  }
                  
                  {/* Typing Indicator - Only show for OTHER users */}
                  {typingUsers.size > 0 && Array.from(typingUsers.values()).map((typingUser) => {
                    // Find user info from group members
                    const member = groupMembersRef.current.find(m => m.employee_id === typingUser.userId)
                    const displayName = member?.employee_name || typingUser.userName || 'Người dùng'
                    
                    return (
                      <div key={typingUser.userId} className="flex w-full justify-start mb-1">
                        <div className="flex max-w-[85%] md:max-w-[70%] flex-row items-end gap-2">
                          <div className="w-8 shrink-0 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                              title={displayName}>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex flex-col items-start min-w-0">
                            <div className="relative group">
                              <div className="relative p-3 text-sm shadow-sm bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm">
                                <div className="flex items-center gap-1.5">
                                  <div className="flex gap-0.5">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                  <span className="text-xs text-gray-500 ml-1">{displayName} đang nhập...</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  <div ref={messagesEndRef} />
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
                    className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Information Panel */}
            {
              showInfoPanel && (
                <div className="w-80 border-l border-gray-200 overflow-y-auto bg-gray-50/50 flex flex-col">
                  <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <h4 className="font-semibold text-gray-900">Thông tin hội thoại</h4>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Images Section */}
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-semibold text-gray-700">Ảnh/Video đã gửi</h5>
                        {sharedContent.images.length > 6 && (
                          <button
                            onClick={() => setShowAllImages(!showAllImages)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {showAllImages ? 'Thu gọn' : 'Xem tất cả'}
                          </button>
                        )}
                      </div>
                      {sharedContent.images.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Chưa có ảnh/video nào</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-1">
                          {sharedContent.images.slice(0, showAllImages ? undefined : 6).map((img, idx) => (
                            <div
                              key={idx}
                              className="aspect-square rounded overflow-hidden cursor-pointer border border-gray-200 hover:opacity-90 transition-opacity bg-gray-100"
                              onClick={() => setZoomedImage({ url: img.url, index: idx })}
                            >
                              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Files Section */}
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-semibold text-gray-700">File đã gửi</h5>
                        {sharedContent.files.length > 3 && (
                          <button
                            onClick={() => setShowAllFiles(!showAllFiles)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {showAllFiles ? 'Thu gọn' : 'Xem tất cả'}
                          </button>
                        )}
                      </div>
                      {sharedContent.files.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Chưa có file nào</p>
                      ) : (
                        <div className="space-y-2">
                          {sharedContent.files.slice(0, showAllFiles ? undefined : 3).map((file, idx) => (
                            <a
                              key={idx}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors group"
                            >
                              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
                                {(() => {
                                  const fileName = file.name || getFileNameFromUrl(file.url)
                                  const iconPath = getFileIconPath('', fileName)
                                  if (iconPath) return <img src={iconPath} alt="" className="h-6 w-6" />
                                  return <File className="h-5 w-5 text-gray-500" />
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                                <p className="text-[10px] text-gray-500">{formatDate(file.date, false)}</p>
                              </div>
                              <Download className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Links Section */}
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-semibold text-gray-700">Link đã gửi</h5>
                        {sharedContent.links.length > 3 && (
                          <button
                            onClick={() => setShowAllLinks(!showAllLinks)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {showAllLinks ? 'Thu gọn' : 'Xem tất cả'}
                          </button>
                        )}
                      </div>
                      {sharedContent.links.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Chưa có link nào</p>
                      ) : (
                        <div className="space-y-2">
                          {sharedContent.links.slice(0, showAllLinks ? undefined : 3).map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors group"
                            >
                              <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                                <ExternalLink className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{link.title}</p>
                                <p className="text-[10px] text-gray-500 truncate">{link.url}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              )
            }
          </div >
        </div >
      )
      }

      {/* Image Zoom Modal */}
      {
        zoomedImage && sharedContent.images[zoomedImage.index] && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10"
            onClick={() => setZoomedImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setZoomedImage(null)}
            >
              <X className="h-8 w-8" />
            </button>

            <div className="relative max-w-full max-h-full flex items-center justify-center group" onClick={(e) => e.stopPropagation()}>
              <img
                src={sharedContent.images[zoomedImage.index].url}
                alt={sharedContent.images[zoomedImage.index].name}
                className="max-w-full max-h-[90vh] object-contain shadow-2xl"
              />

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                <h4 className="text-lg font-semibold">{sharedContent.images[zoomedImage.index].name}</h4>
                <p className="text-sm opacity-80">{formatDate(sharedContent.images[zoomedImage.index].date, true)}</p>
              </div>

              {zoomedImage.index > 0 && (
                <button
                  className="absolute left-4 p-3 text-white bg-black/20 hover:bg-black/40 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => setZoomedImage({ ...zoomedImage, index: zoomedImage.index - 1 })}
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
              )}

              {zoomedImage.index < sharedContent.images.length - 1 && (
                <button
                  className="absolute right-4 p-3 text-white bg-black/20 hover:bg-black/40 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => setZoomedImage({ ...zoomedImage, index: zoomedImage.index + 1 })}
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              )}
            </div>
          </div>
        )
      }

      {/* Create Todo Modal */}
      {
        showCreateTodoModal && (
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
        )
      }
    </div >
  )
}




