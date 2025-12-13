'use client'

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  MessageSquare, 
  Send, 
  Search, 
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
  X,
  Edit2,
  Trash2,
  Reply,
  User,
  Users,
  Copy,
  Forward,
  Pin,
  Smile,
  Download,
  FileText,
  Video,
  Phone,
  Settings,
  FolderOpen,
  Briefcase,
  Grid3x3,
  Cloud,
  FileText as FileTextIcon,
  Heart,
  ThumbsUp,
  ChevronRight,
  Plus,
  Check,
  Upload
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { Conversation, Message, ConversationWithParticipants, MessageCreate, ConversationCreate } from '@/types/chat'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import MessageBubble from './MessageBubble'

interface InternalChatProps {
  currentUserId: string
  currentUserName: string
}

interface Employee {
  id: string
  user_id: string
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string
  department_name?: string
  position_name?: string
  status?: string
}

export default function InternalChat({ currentUserId, currentUserName }: InternalChatProps) {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithParticipants | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [activeTab, setActiveTab] = useState<'conversations' | 'employees'>('conversations')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview?: string }>>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null)
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [projects, setProjects] = useState<Array<{id: string; name: string; project_code?: string}>>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [showManageGroupDialog, setShowManageGroupDialog] = useState(false)
  const [editingGroupName, setEditingGroupName] = useState('')
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null)
  const [uploadingBackground, setUploadingBackground] = useState(false)
  const [newParticipants, setNewParticipants] = useState<string[]>([])
  const [showAddParticipants, setShowAddParticipants] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiGet('/api/chat/conversations')
      const conversationsList = response.conversations || []
      
      // Backend already returns participants via _enrich_conversation_with_participants
      // No need to make additional API calls for each conversation
      setConversations(conversationsList)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelectConversationById = useCallback(async (conversationId: string) => {
    try {
      const response = await apiGet(`/api/chat/conversations/${conversationId}`)
      setSelectedConversation(response)
      setReplyingTo(null)
      setEditingMessage(null)
    } catch (error) {
      console.error('Error loading conversation:', error)
      // Fallback to loading all conversations
      loadConversations()
    }
  }, [loadConversations])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Message cache to avoid reloading
  const messageCacheRef = useRef<Map<string, { messages: Message[], timestamp: number }>>(new Map())
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  // Load messages - Optimized with parallel loading and caching
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoading(true)
      
      // Check cache first
      const cached = messageCacheRef.current.get(conversationId)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`📦 Using cached messages (${cached.messages.length} messages) for conversation ${conversationId}`)
        setMessages(cached.messages)
        setLoading(false)
        // Load in background to update cache
        loadMessagesInBackground(conversationId)
        return
      }

      console.log(`🔄 Loading messages for conversation ${conversationId}...`)
      
      // Load first batch immediately (most recent messages)
      const firstBatch = await apiGet(`/api/chat/conversations/${conversationId}/messages?skip=0&limit=100`)
      const firstMessages = firstBatch.messages || []
      
      console.log(`📥 First batch: ${firstMessages.length} messages, total: ${firstBatch.total || 0}, has_more: ${firstBatch.has_more}`)
      
      // Display first batch immediately for fast UI
      if (firstMessages.length > 0) {
        setMessages(firstMessages)
        // Don't set loading to false yet if there are more messages to load
        if (!firstBatch.has_more || firstMessages.length < 100) {
          setLoading(false)
        }
      } else {
        // No messages at all
        setMessages([])
        setLoading(false)
        messageCacheRef.current.set(conversationId, {
          messages: [],
          timestamp: Date.now()
        })
        console.log(`✅ No messages found for conversation ${conversationId}`)
        return
      }

      // If there are more messages, load them in parallel batches
      if (firstBatch.has_more && firstMessages.length === 100) {
        const totalCount = firstBatch.total || 0
        const remainingMessages = totalCount - firstMessages.length
        
        if (remainingMessages > 0) {
          // Calculate how many batches we need
          const batchesNeeded = Math.ceil(remainingMessages / 100)
          console.log(`📦 Loading ${batchesNeeded} additional batches (${remainingMessages} messages)...`)
          
          // Load all remaining batches in parallel (but limit to reasonable number to avoid overwhelming)
          // Load in chunks of 5 batches at a time
          const MAX_PARALLEL_BATCHES = 5
          let allMessages = [...firstMessages]
          
          // Load batches in chunks
          for (let chunkStart = 1; chunkStart <= batchesNeeded; chunkStart += MAX_PARALLEL_BATCHES) {
            const chunkEnd = Math.min(chunkStart + MAX_PARALLEL_BATCHES - 1, batchesNeeded)
            const batchPromises: Promise<any>[] = []
            
            console.log(`📥 Loading chunk ${chunkStart}-${chunkEnd} of ${batchesNeeded} batches...`)
            
            // Create promises for this chunk
            for (let i = chunkStart; i <= chunkEnd; i++) {
              const skip = i * 100
              batchPromises.push(
                apiGet(`/api/chat/conversations/${conversationId}/messages?skip=${skip}&limit=100`)
                  .catch(err => {
                    console.error(`❌ Error loading batch ${i}:`, err)
                    return { messages: [], has_more: false }
                  })
              )
            }
            
            // Wait for this chunk to complete
            const chunkResults = await Promise.all(batchPromises)
            
            // Combine messages from this chunk
            let chunkMessageCount = 0
            for (const result of chunkResults) {
              if (result.messages && result.messages.length > 0) {
                allMessages = [...allMessages, ...result.messages]
                chunkMessageCount += result.messages.length
              }
            }
            
            console.log(`✅ Chunk ${chunkStart}-${chunkEnd} loaded: ${chunkMessageCount} messages (total so far: ${allMessages.length})`)
            
            // Update UI progressively as we load more batches
            if (chunkStart === 1) {
              // First chunk: update immediately
              setMessages([...allMessages])
            } else {
              // Subsequent chunks: update to show progress
              setMessages([...allMessages])
            }
          }
          
          // Sort by created_at (oldest first, newest last)
          allMessages.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime()
            const timeB = new Date(b.created_at).getTime()
            return timeA - timeB
          })
          
          // Final update with all messages
          setMessages(allMessages)
          setLoading(false) // Make sure loading is turned off
          
          // Cache the result
          messageCacheRef.current.set(conversationId, {
            messages: allMessages,
            timestamp: Date.now()
          })
          
          console.log(`✅ Loaded all ${allMessages.length} messages (${batchesNeeded} batches) for conversation ${conversationId}`)
        } else {
          // Cache first batch if no more messages
          setLoading(false)
          messageCacheRef.current.set(conversationId, {
            messages: firstMessages,
            timestamp: Date.now()
          })
          console.log(`✅ Loaded ${firstMessages.length} messages (no more batches) for conversation ${conversationId}`)
        }
      } else {
        // Cache first batch if no more messages
        setLoading(false)
        messageCacheRef.current.set(conversationId, {
          messages: firstMessages,
          timestamp: Date.now()
        })
        console.log(`✅ Loaded ${firstMessages.length} messages (no more batches) for conversation ${conversationId}`)
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error)
      setMessages([])
      setLoading(false)
    }
  }, [])

  // Load messages in background to update cache
  const loadMessagesInBackground = useCallback(async (conversationId: string) => {
    try {
      const response = await apiGet(`/api/chat/conversations/${conversationId}/messages?skip=0&limit=100`)
      const messages = response.messages || []
      
      if (messages.length > 0) {
        messageCacheRef.current.set(conversationId, {
          messages,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('Error loading messages in background:', error)
    }
  }, [])

  const fetchMessageDetails = useCallback(async (conversationId: string) => {
    try {
      // Reload all messages to get updated data
      loadMessages(conversationId)
    } catch (error) {
      console.error('Error fetching message details:', error)
    }
  }, [loadMessages])

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await apiPost(`/api/chat/conversations/${conversationId}/read`, {})
      // Update conversation unread count
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      ))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [])

  const loadEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true)
      const response = await apiGet('/api/employees?status=active&limit=1000')
      setEmployees(response || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoadingEmployees(false)
    }
  }, [])

  const handleStartConversationWithEmployee = useCallback(async (employee: Employee) => {
    if (!employee.user_id) {
      alert('Nhân viên này chưa có tài khoản')
      return
    }

    if (employee.user_id === currentUserId) {
      alert('Bạn không thể chat với chính mình')
      return
    }

    try {
      setLoading(true)
      // Check if direct conversation already exists
      const existingConvs = conversations.filter(conv => conv.type === 'direct')
      
      // Try to find existing conversation with this employee
      for (const conv of existingConvs) {
        const convDetails = await apiGet(`/api/chat/conversations/${conv.id}`)
        const hasEmployee = convDetails.participants?.some(
          (p: any) => p.user_id === employee.user_id
        )
        if (hasEmployee && convDetails.participants?.length === 2) {
          // Found existing conversation
          setSelectedConversation(convDetails)
          setActiveTab('conversations')
          setLoading(false)
          return
        }
      }

      // Create new direct conversation
      const conversationData = {
        type: 'direct' as const,
        participant_ids: [employee.user_id],
        name: employee.full_name || `${employee.first_name} ${employee.last_name}`.trim()
      }

      const newConversation = await apiPost('/api/chat/conversations', conversationData)
      
      // Reload conversations and select the new one
      await loadConversations()
      const convDetails = await apiGet(`/api/chat/conversations/${newConversation.id}`)
      setSelectedConversation(convDetails)
      setActiveTab('conversations')
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Không thể tạo cuộc trò chuyện')
    } finally {
      setLoading(false)
    }
  }, [conversations, currentUserId, loadConversations])

  // Check for conversation ID in URL params - only load when user is available
  useEffect(() => {
    if (!currentUserId || !searchParams) {
      return // Don't load if user info is not available yet
    }
    
    const conversationId = searchParams.get('conversation')
    if (conversationId) {
      // Load the specific conversation
      handleSelectConversationById(conversationId)
    } else {
      loadConversations()
    }
  }, [searchParams, handleSelectConversationById, loadConversations, currentUserId])

  // Load employees when switching to employees tab or when no conversations
  useEffect(() => {
    if ((activeTab === 'employees' || (activeTab === 'conversations' && conversations.length === 0)) && employees.length === 0 && !loadingEmployees) {
      loadEmployees()
    }
  }, [activeTab, employees.length, loadingEmployees, loadEmployees, conversations.length])

  // Subscribe to all new messages to update conversation list order
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('all-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'internal_messages',
        filter: `sender_id=neq.${currentUserId}` // Only listen to messages from others
      }, (payload) => {
        // Reload conversations to update last_message_at and sort order
        loadConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, loadConversations])

  // Load messages when conversation changes - Optimized parallel loading
  useEffect(() => {
    if (selectedConversation) {
      // Clear old messages first to avoid showing stale data
      setMessages([])
      
      // Load messages and mark as read in parallel for faster response
      Promise.all([
        loadMessages(selectedConversation.id),
        markAsRead(selectedConversation.id)
      ]).catch(error => {
        console.error('Error loading conversation data:', error)
      })
      
      // Save selected conversation to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('internal_chat_selected_conversation', selectedConversation.id)
      }
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel(`conversation:${selectedConversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        }, async (payload) => {
          // Immediately add new message to list for instant display
          const newMessage = payload.new as any
          if (newMessage) {
            // Check if message already exists to avoid duplicates
            setMessages(prev => {
              const exists = prev.find(m => m.id === newMessage.id)
              if (exists) {
                return prev // Message already exists, don't add duplicate
              }
              
              // Add new message to the end (newest messages at the end)
              // We'll enrich it with sender info below
              return [...prev, newMessage as Message]
            })
            
            // Enrich message with sender info without reloading all messages
            try {
              // Get sender name from users table
              const { data: userData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', newMessage.sender_id)
                .single()
              
              if (userData) {
                setMessages(prev => prev.map(msg => 
                  msg.id === newMessage.id 
                    ? { ...msg, sender_name: userData.full_name || 'Unknown' }
                    : msg
                ))
              }
            } catch (error) {
              console.error('Error enriching message with sender info:', error)
            }
            
            // Reload conversations to update last_message_at and sort order
            loadConversations()
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'internal_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        }, (payload) => {
          // Update message in real-time (for edits/deletes)
          const updatedMessage = payload.new as any
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          ))
          loadConversations() // Update conversation list
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'internal_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        }, (payload) => {
          // Remove deleted message
          const deletedId = payload.old.id
          setMessages(prev => prev.filter(msg => msg.id !== deletedId))
          loadConversations()
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription active for conversation:', selectedConversation.id)
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time subscription error for conversation:', selectedConversation.id)
          }
        })

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedConversation?.id, loadMessages, markAsRead, fetchMessageDetails, loadConversations])

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmojiPicker) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.emoji-picker-container') && !target.closest('button[title="Emoji"]')) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      // Load conversation details and messages in parallel for faster response
      const [convResponse] = await Promise.all([
        apiGet(`/api/chat/conversations/${conversation.id}`),
        // Preload messages immediately
        loadMessages(conversation.id).catch(err => {
          console.error('Error preloading messages:', err)
        })
      ])
      
      setSelectedConversation(convResponse)
      setReplyingTo(null)
      setEditingMessage(null)
      
      // Save selected conversation to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('internal_chat_selected_conversation', conversation.id)
      }
      
      // Update conversation in list with participants info
      setConversations(prev => prev.map(conv => 
        conv.id === conversation.id ? { ...conv, ...convResponse } : conv
      ))
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || (!messageText.trim() && selectedFiles.length === 0 && !replyingTo)) return

    const tempMessageId = `temp-${Date.now()}-${Math.random()}`
    const messageTextToSend = messageText.trim()
    
    // Create optimistic message for immediate display
    const optimisticMessage: Message = {
      id: tempMessageId,
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      sender_name: currentUserName,
      message_text: messageTextToSend,
      message_type: 'text',
      file_url: undefined,
      file_name: undefined,
      file_size: undefined,
      is_deleted: false,
      is_edited: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reply_to: replyingTo ? {
        id: replyingTo.id,
        sender_name: replyingTo.sender_name || 'Unknown',
        message_text: replyingTo.message_text
      } : undefined,
      reply_to_id: replyingTo?.id || undefined
    }

    // Add optimistic message to state immediately
    setMessages(prev => [...prev, optimisticMessage])
    
    // Clear input immediately for better UX
    const textToClear = messageTextToSend
    const replyingToToClear = replyingTo
    setMessageText('')
    setReplyingTo(null)

    try {
      setSending(true)
      
      // If there are selected files, upload them first
      if (selectedFiles.length > 0) {
        await handleUploadFiles()
        // If there's also text, send it separately
        if (textToClear) {
          const messageData: MessageCreate = {
            message_text: textToClear,
            reply_to_id: replyingToToClear?.id
          }
          await apiPost(`/api/chat/conversations/${selectedConversation.id}/messages`, messageData)
        }
        setSelectedFiles([])
      } else {
        // Send text message only
        const messageData: MessageCreate = {
          message_text: textToClear,
          reply_to_id: replyingToToClear?.id
        }

        await apiPost(`/api/chat/conversations/${selectedConversation.id}/messages`, messageData)
      }
      
      // Reload messages to get the real message from server (replaces optimistic one)
      await loadMessages(selectedConversation.id)
      await loadConversations() // Refresh conversation list to update last message
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId))
      // Restore input on error
      setMessageText(textToClear)
      if (replyingToToClear) {
        setReplyingTo(replyingToToClear)
      }
      alert('Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  const handleEditMessage = async (message: Message) => {
    if (!messageText.trim()) return

    try {
      setSending(true)
      await apiPut(`/api/chat/messages/${message.id}`, { message_text: messageText.trim() })
      
      setMessageText('')
      setEditingMessage(null)
      
      // Reload messages
      if (selectedConversation) {
        await loadMessages(selectedConversation.id)
      }
    } catch (error) {
      console.error('Error editing message:', error)
      alert('Không thể chỉnh sửa tin nhắn')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return

    try {
      await apiDelete(`/api/chat/messages/${messageId}`)
      
      // Reload messages
      if (selectedConversation) {
        await loadMessages(selectedConversation.id)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Không thể xóa tin nhắn')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (editingMessage) {
        handleEditMessage(editingMessage)
      } else {
        handleSendMessage()
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check file sizes (max 10MB each)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert(`Có ${oversizedFiles.length} file quá lớn. Vui lòng chọn file nhỏ hơn 10MB`)
      return
    }

    // Add new files to selected files with previews
    const newFileItems = files.map(file => {
      const item: { file: File; preview?: string } = { file }
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setSelectedFiles(prev => 
            prev.map(prevItem => 
              prevItem.file === file 
                ? { ...prevItem, preview: e.target?.result as string }
                : prevItem
            )
          )
        }
        reader.readAsDataURL(file)
      }
      
      return item
    })

    setSelectedFiles(prev => [...prev, ...newFileItems])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0 || !selectedConversation) return

    // Create optimistic messages for all files immediately
    const tempMessageIds: string[] = []
    const optimisticMessages: Message[] = selectedFiles.map((fileItem, index) => {
      const file = fileItem.file
      const tempId = `temp-file-${Date.now()}-${index}-${Math.random()}`
      tempMessageIds.push(tempId)
      
      return {
        id: tempId,
        conversation_id: selectedConversation.id,
        sender_id: currentUserId,
        sender_name: currentUserName,
        message_text: file.name,
        message_type: file.type.startsWith('image/') ? 'image' : 'file',
        file_url: fileItem.preview || undefined,
        file_name: file.name,
        file_size: file.size,
        is_deleted: false,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reply_to: replyingTo ? {
          id: replyingTo.id,
          sender_name: replyingTo.sender_name || 'Unknown',
          message_text: replyingTo.message_text
        } : undefined,
        reply_to_id: replyingTo?.id || undefined
      }
    })

    // Add optimistic messages to state immediately
    setMessages(prev => [...prev, ...optimisticMessages])
    
    // Clear file selection immediately for better UX
    const filesToClear = [...selectedFiles]
    const replyingToToClear = replyingTo
    setSelectedFiles([])
    setReplyingTo(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''

    try {
      setUploadingFile(true)
      
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (!token) {
        throw new Error('Không có token xác thực')
      }

      // Upload all files and send messages
      const uploadPromises = filesToClear.map(async (fileItem) => {
        const file = fileItem.file
        // Upload file via API
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat/conversations/${selectedConversation.id}/upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          }
        )

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.detail || 'Upload failed')
        }

        const uploadData = await uploadResponse.json()

        // Send message with file
        const messageData: MessageCreate = {
          message_text: file.name,
          message_type: file.type.startsWith('image/') ? 'image' : 'file',
          file_url: uploadData.url,
          file_name: uploadData.file_name,
          file_size: uploadData.file_size,
          reply_to_id: replyingToToClear?.id
        }

        return apiPost(`/api/chat/conversations/${selectedConversation.id}/messages`, messageData)
      })

      // Wait for all uploads to complete
      await Promise.all(uploadPromises)
      
      // Reload messages to get the real messages from server (replaces optimistic ones)
      await loadMessages(selectedConversation.id)
      await loadConversations()
    } catch (error) {
      console.error('Error uploading files:', error)
      // Remove optimistic messages on error
      setMessages(prev => prev.filter(msg => !tempMessageIds.includes(msg.id)))
      // Restore file selection on error
      setSelectedFiles(filesToClear)
      if (replyingToToClear) {
        setReplyingTo(replyingToToClear)
      }
      alert('Không thể gửi file. Vui lòng thử lại.')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
    // Show toast notification (you can add a toast library later)
    alert('Đã sao chép tin nhắn')
  }

  const handleForwardMessage = async (message: Message) => {
    // TODO: Implement forward message functionality
    alert('Tính năng chuyển tiếp tin nhắn đang được phát triển')
  }

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const loadProjects = useCallback(async () => {
    try {
      setLoadingProjects(true)
      const data = await apiGet('/api/chat/projects')
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }, [])


  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Vui lòng nhập tên nhóm')
      return
    }

    if (selectedParticipants.length === 0) {
      alert('Vui lòng chọn ít nhất một thành viên')
      return
    }

    try {
      const conversationData: ConversationCreate = {
        name: groupName.trim(),
        type: 'group',
        participant_ids: selectedParticipants,
        project_id: selectedProject || undefined
      }

      const newConversation = await apiPost('/api/chat/conversations', conversationData)
      
      // Reset form
      setGroupName('')
      setSelectedParticipants([])
      setSelectedProject('')
      setShowCreateGroupDialog(false)
      
      // Reload conversations and select new one
      await loadConversations()
      if (newConversation.id) {
        handleSelectConversationById(newConversation.id)
      }
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Không thể tạo nhóm. Vui lòng thử lại.')
    }
  }

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const filteredConversations = useMemo(() => {
    const filtered = conversations.filter(conv => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        conv.name?.toLowerCase().includes(query) ||
        conv.last_message_preview?.toLowerCase().includes(query)
      )
    })
    
    // Sort by last_message_at (newest first), then by updated_at if last_message_at is not available
    return filtered.sort((a, b) => {
      // Get timestamp for comparison - prefer last_message_at, fallback to updated_at
      const getTimestamp = (conv: Conversation) => {
        if (conv.last_message_at) {
          return new Date(conv.last_message_at).getTime()
        }
        if (conv.updated_at) {
          return new Date(conv.updated_at).getTime()
        }
        if (conv.created_at) {
          return new Date(conv.created_at).getTime()
        }
        return 0
      }
      
      const timeA = getTimestamp(a)
      const timeB = getTimestamp(b)
      
      // Sort descending (newest first)
      return timeB - timeA
    })
  }, [conversations, searchQuery])

  const filteredEmployees = useMemo(() => employees.filter(emp => {
    if (!employeeSearchQuery) return true
    const query = employeeSearchQuery.toLowerCase()
    const fullName = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
    return (
      fullName.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.department_name?.toLowerCase().includes(query) ||
      emp.position_name?.toLowerCase().includes(query)
    )
  }), [employees, employeeSearchQuery])

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi })
    } catch {
      return dateString
    }
  }

  // Don't render if user info is not available
  if (!currentUserId || !currentUserName) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải thông tin đăng nhập...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations List - Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Tin nhắn</h2>
            <button 
              onClick={() => {
                setShowCreateGroupDialog(true)
                loadProjects()
              }}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              title="Tạo nhóm chat"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* User Info */}
          {currentUserId && currentUserName && (
            <div className="mb-2 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {currentUserName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1.5 mb-2">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'conversations'
                  ? 'bg-[#0068ff] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cuộc trò chuyện
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'employees'
                  ? 'bg-[#0068ff] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nhân viên
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 z-10" />
            <input
              type="text"
              placeholder={activeTab === 'conversations' ? 'Tìm kiếm...' : 'Tìm nhân viên...'}
              value={activeTab === 'conversations' ? searchQuery : employeeSearchQuery}
              onChange={(e) => {
                if (activeTab === 'conversations') {
                  setSearchQuery(e.target.value)
                } else {
                  setEmployeeSearchQuery(e.target.value)
                }
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0068ff] focus:border-[#0068ff] transition-all text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'conversations' ? (
            <>
              {!currentUserId ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm">Đang tải thông tin đăng nhập...</p>
                </div>
              ) : loading && conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Đang tải...</div>
              ) : filteredConversations.length === 0 && !searchQuery ? (
                // Show employees list when no conversations
                <>
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">Chưa có cuộc trò chuyện nào</p>
                    <p className="text-xs text-gray-500">Chọn nhân viên bên dưới để bắt đầu chat</p>
                  </div>
                  {loadingEmployees ? (
                    <div className="p-4 text-center text-gray-500">Đang tải nhân viên...</div>
                  ) : employees.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Chưa có nhân viên nào</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {employees
                        .filter(emp => emp.user_id && emp.user_id !== currentUserId)
                        .map((employee) => {
                          const fullName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Nhân viên'
                          
                          return (
                            <div
                              key={employee.id}
                              onClick={() => handleStartConversationWithEmployee(employee)}
                              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                  {fullName.charAt(0).toUpperCase()}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-gray-800 truncate">
                                      {fullName}
                                    </h3>
                                  </div>
                                  <div className="space-y-1">
                                    {employee.email && (
                                      <p className="text-sm text-gray-600 truncate">
                                        {employee.email}
                                      </p>
                                    )}
                                    {(employee.department_name || employee.position_name) && (
                                      <p className="text-xs text-gray-500 truncate">
                                        {[employee.department_name, employee.position_name].filter(Boolean).join(' • ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {/* Chat icon */}
                                <div className="flex-shrink-0">
                                  <MessageSquare className="w-5 h-5 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </>
              ) : filteredConversations.length === 0 && searchQuery ? (
                <div className="p-4 text-center text-gray-500">
                  Không tìm thấy cuộc trò chuyện
                </div>
              ) : (
                filteredConversations.map((conv: any) => {
                  // Get participants from conversation (may be loaded or not)
                  const participants = conv.participants || []
                  const otherParticipants = participants.filter((p: any) => p.user_id !== currentUserId)
                  
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar - Zalo Style */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {conv.type === 'group' ? (
                            <Users className="w-6 h-6" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="text-sm font-semibold text-gray-800 truncate">
                              {conv.name || 'Cuộc trò chuyện'}
                            </h3>
                            {conv.last_message_at && (
                              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap flex-shrink-0">
                                {formatTime(conv.last_message_at)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-gray-500 truncate flex-1">
                              {conv.last_message_preview || 'Chưa có tin nhắn'}
                            </p>
                            {conv.unread_count && conv.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center flex-shrink-0 font-bold">
                                {conv.unread_count > 9 ? '9+' : conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </>
          ) : (
            <>
              {loadingEmployees ? (
                <div className="p-4 text-center text-gray-500">Đang tải nhân viên...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {employeeSearchQuery ? 'Không tìm thấy nhân viên' : 'Chưa có nhân viên nào'}
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                  const fullName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Nhân viên'
                  const isCurrentUser = employee.user_id === currentUserId
                  
                  return (
                    <div
                      key={employee.id}
                      onClick={() => !isCurrentUser && handleStartConversationWithEmployee(employee)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-800 truncate">
                              {fullName}
                              {isCurrentUser && <span className="text-gray-400 ml-2">(Bạn)</span>}
                            </h3>
                          </div>
                          <div className="space-y-1">
                            {employee.email && (
                              <p className="text-sm text-gray-600 truncate">
                                {employee.email}
                              </p>
                            )}
                            {(employee.department_name || employee.position_name) && (
                              <p className="text-xs text-gray-500 truncate">
                                {[employee.department_name, employee.position_name].filter(Boolean).join(' • ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Area - Right Side */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedConversation ? (
          <div className="flex flex-col h-full min-h-0">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm">
                    {selectedConversation.type === 'group' ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                      {selectedConversation.name || 'Cuộc trò chuyện'}
                    </h3>
                    {selectedConversation.type === 'group' && selectedConversation.participants ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-gray-500">
                          {selectedConversation.participant_count} thành viên:
                        </p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {selectedConversation.participants.slice(0, 2).map((participant: any) => (
                            <span 
                              key={participant.user_id}
                              className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full"
                            >
                              {participant.user_name || 'Unknown'}
                            </span>
                          ))}
                          {selectedConversation.participants.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{selectedConversation.participants.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : selectedConversation.type === 'direct' && selectedConversation.participants ? (
                      <p className="text-xs text-gray-500 truncate">
                        {selectedConversation.participants.find((p: any) => p.user_id !== currentUserId)?.user_name || 'Unknown'}
                      </p>
                    ) : null}
                  </div>
                </div>
                {selectedConversation.type === 'group' && (
                  <button 
                    onClick={() => {
                      setEditingGroupName(selectedConversation.name || '')
                      setBackgroundPreview(selectedConversation.background_url || null)
                      setShowManageGroupDialog(true)
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-full flex-shrink-0 transition-colors"
                    title="Quản lý nhóm"
                  >
                    <Settings className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-3 bg-[#f0f2f5] relative min-h-0"
              style={{
                backgroundImage: selectedConversation.background_url 
                  ? `url(${selectedConversation.background_url})` 
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Overlay for better readability */}
              {selectedConversation.background_url && (
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
              )}
              <div className="relative z-10">
              {loading && messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Đang tải tin nhắn...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Chưa có tin nhắn nào</div>
              ) : (
                <div className="space-y-2">
                  {messages.length > 0 && (
                    <div className="text-xs text-gray-400 text-center py-1">
                      Hiển thị {messages.length} tin nhắn
                    </div>
                  )}
                  {messages.map((message, index) => {
                    const isOwn = message.sender_id === currentUserId
                    const isDeleted = message.is_deleted
                    
                    // Check if we need a date separator
                    const currentDate = new Date(message.created_at).toDateString()
                    const prevDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null
                    const showDateSeparator = prevDate !== currentDate
                    
                    return (
                      <div key={message.id}>
                        {/* Date Separator - Zalo Style */}
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {new Date(message.created_at).toLocaleDateString('vi-VN', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        )}
                        
                        <MessageBubble
                          message={message}
                          isOwn={isOwn}
                          currentUserId={currentUserId}
                          onEdit={(msg) => {
                            setEditingMessage(msg)
                            setMessageText(msg.message_text)
                            setReplyingTo(null)
                          }}
                          onDelete={handleDeleteMessage}
                          onReply={(msg) => {
                            setReplyingTo(msg)
                            setEditingMessage(null)
                          }}
                          onCopy={handleCopyMessage}
                          onForward={handleForwardMessage}
                          onDownload={handleDownloadFile}
                          showAvatar={!isOwn}
                          showSenderName={!isOwn}
                          maxWidth="70%"
                        />
                    </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
              </div>
            </div>

              {/* Input Area - Zalo Style */}
            <div className="bg-white border-t border-gray-200 relative flex-shrink-0">
              {/* Scroll to bottom button */}
              {messages.length > 0 && (
                <button
                  onClick={scrollToBottom}
                  className="absolute -top-10 right-4 p-2 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
                  title="Cuộn xuống"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 rotate-90" />
                </button>
              )}
              {/* Reply Preview */}
              {replyingTo && (
                <div className="px-4 pt-2 pb-1 bg-[#e5f3ff] border-l-4 border-[#0068ff] flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#0068ff] mb-0.5">
                      Đang trả lời {replyingTo.sender_name}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {replyingTo.message_text}
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-blue-100 rounded ml-2 flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-[#0068ff]" />
                  </button>
                </div>
              )}
              
              {/* Edit Preview */}
              {editingMessage && (
                <div className="px-4 pt-2 pb-1 bg-[#fff4e5] border-l-4 border-[#ff9800] flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-[#ff9800]">
                      Đang chỉnh sửa tin nhắn
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingMessage(null)
                      setMessageText('')
                    }}
                    className="p-1 hover:bg-yellow-100 rounded ml-2 flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-[#ff9800]" />
                  </button>
                </div>
              )}
              
              {/* Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="px-4 pt-2 pb-1 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((fileItem, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm"
                      >
                        {fileItem.preview ? (
                          <img 
                            src={fileItem.preview} 
                            alt={`Preview ${index + 1}`} 
                            className="w-12 h-12 object-cover rounded flex-shrink-0" 
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 max-w-[200px]">
                          <p className="text-sm font-medium text-gray-800 truncate">{fileItem.file.name}</p>
                          <p className="text-xs text-gray-500">{(fileItem.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                          title="Xóa"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Đã chọn {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2 p-3 flex-shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                  multiple
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*"
                  multiple
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Đính kèm file"
                  disabled={uploadingFile}
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Gửi ảnh"
                  disabled={uploadingFile}
                >
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Emoji"
                >
                  <Smile className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={editingMessage ? "Chỉnh sửa tin nhắn..." : `Nhập @, tin nhắn tới ${selectedConversation.name || 'người dùng'}...`}
                    className="w-full px-4 py-2.5 bg-[#f0f2f5] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0068ff] focus:bg-white resize-none transition-all text-gray-900 placeholder:text-gray-400"
                    rows={1}
                    style={{ 
                      minHeight: '40px', 
                      maxHeight: '120px',
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#111827'
                    }}
                    onKeyDown={(e) => {
                      // Enter to send, Shift+Enter for new line
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (editingMessage) {
                          handleEditMessage(editingMessage)
                        } else if (messageText.trim() || selectedFiles.length > 0) {
                          handleSendMessage()
                        }
                      }
                    }}
                  />
                </div>
                
                {/* Emoji Picker - Simple version */}
                {showEmojiPicker && (
                  <div className="emoji-picker-container absolute bottom-16 left-3 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-1">
                      {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setMessageText(prev => prev + emoji)
                            setShowEmojiPicker(false)
                          }}
                          className="p-1 hover:bg-gray-100 rounded text-lg transition-colors"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={editingMessage ? () => handleEditMessage(editingMessage) : handleSendMessage}
                  disabled={sending || uploadingFile || (!messageText.trim() && selectedFiles.length === 0)}
                  className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
                    (messageText.trim() || selectedFiles.length > 0) && !sending && !uploadingFile
                      ? 'bg-[#0068ff] text-white hover:bg-[#0056d6] shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={editingMessage ? "Lưu chỉnh sửa" : uploadingFile ? `Đang tải lên ${selectedFiles.length} file...` : "Gửi tin nhắn (Enter)"}
                >
                  {uploadingFile ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Dialog */}
      {showCreateGroupDialog && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/30">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Tạo nhóm chat mới</h3>
              <button
                onClick={() => {
                  setShowCreateGroupDialog(false)
                  setGroupName('')
                  setSelectedParticipants([])
                  setSelectedProject('')
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/30 backdrop-blur-sm">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên nhóm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Nhập tên nhóm..."
                  className="w-full px-3 py-2 bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0068ff] focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Link to Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liên kết với dự án (tùy chọn)
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0068ff] focus:border-transparent text-gray-900"
                >
                  <option value="">-- Chọn dự án --</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} {project.project_code ? `(${project.project_code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note about @mention feature */}
              {selectedProject && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Mẹo:</strong> Khi liên kết với dự án, thành viên có thể bấm <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">@dự án</code> để xem:
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 ml-4 list-disc space-y-1">
                    <li>Hóa đơn của dự án</li>
                    <li>Báo giá đã gửi</li>
                    <li>Chi phí thực tế</li>
                    <li>Danh sách nhiệm vụ</li>
                  </ul>
                </div>
              )}

              {/* Select Participants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn thành viên <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-2">
                  {employees
                    .filter(emp => emp.user_id && emp.user_id !== currentUserId)
                    .map((employee) => {
                      const fullName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Nhân viên'
                      const isSelected = selectedParticipants.includes(employee.user_id!)
                      
                      return (
                        <div
                          key={employee.id}
                          onClick={() => toggleParticipant(employee.user_id!)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${
                            isSelected ? 'bg-transparent border-blue-300' : 'bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
                            {employee.email && (
                              <p className="text-xs text-gray-600 truncate">{employee.email}</p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-[#0068ff] flex-shrink-0" />
                          )}
                        </div>
                      )
                    })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Đã chọn: {selectedParticipants.length} thành viên
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateGroupDialog(false)
                  setGroupName('')
                  setSelectedParticipants([])
                  setSelectedProject('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedParticipants.length === 0}
                className="px-4 py-2 bg-[#0068ff] text-white rounded-lg hover:bg-[#0056d6] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Tạo nhóm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Group Dialog */}
      {showManageGroupDialog && selectedConversation && selectedConversation.type === 'group' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Quản lý nhóm</h3>
              <button
                onClick={() => {
                  setShowManageGroupDialog(false)
                  setEditingGroupName('')
                  setBackgroundFile(null)
                  setBackgroundPreview(null)
                  setNewParticipants([])
                  setShowAddParticipants(false)
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Edit Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên nhóm
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    placeholder="Nhập tên nhóm..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0068ff] text-gray-900"
                  />
                  <button
                    onClick={async () => {
                      try {
                        await apiPut(`/api/chat/conversations/${selectedConversation.id}`, {
                          name: editingGroupName
                        })
                        await loadConversations()
                        if (selectedConversation) {
                          const updated = await apiGet(`/api/chat/conversations/${selectedConversation.id}`)
                          setSelectedConversation(updated)
                        }
                        alert('Đã cập nhật tên nhóm')
                      } catch (error: any) {
                        alert(`Lỗi: ${error.message || 'Không thể cập nhật tên nhóm'}`)
                      }
                    }}
                    className="px-4 py-2 bg-[#0068ff] text-white rounded-lg hover:bg-[#0056d6] transition-colors"
                  >
                    Lưu
                  </button>
                </div>
              </div>

              {/* Upload Background */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình nền nhóm
                </label>
                {backgroundPreview && (
                  <div className="mb-3 relative">
                    <img
                      src={backgroundPreview}
                      alt="Background preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => {
                        setBackgroundFile(null)
                        setBackgroundPreview(selectedConversation.background_url || null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  <Upload className="w-4 h-4 mr-2" />
                  {backgroundPreview ? 'Đổi hình nền' : 'Chọn hình nền'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (!file.type.startsWith('image/')) {
                          alert('Vui lòng chọn file ảnh')
                          return
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Kích thước ảnh không được vượt quá 5MB')
                          return
                        }
                        setBackgroundFile(file)
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setBackgroundPreview(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="hidden"
                    disabled={uploadingBackground}
                  />
                </label>
                {backgroundFile && (
                  <button
                    onClick={async () => {
                      try {
                        setUploadingBackground(true)
                        const formData = new FormData()
                        formData.append('file', backgroundFile)
                        
                        const { data: { session } } = await supabase.auth.getSession()
                        if (!session?.access_token) {
                          throw new Error('No authentication token')
                        }

                        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                        const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${selectedConversation.id}/background`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: formData
                        })

                        if (!response.ok) {
                          const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
                          throw new Error(error.detail || 'Failed to upload background')
                        }

                        const result = await response.json()
                        await loadConversations()
                        if (selectedConversation) {
                          const updated = await apiGet(`/api/chat/conversations/${selectedConversation.id}`)
                          setSelectedConversation(updated)
                        }
                        alert('Đã upload hình nền thành công')
                        setBackgroundFile(null)
                      } catch (error: any) {
                        alert(`Lỗi: ${error.message || 'Không thể upload hình nền'}`)
                      } finally {
                        setUploadingBackground(false)
                      }
                    }}
                    disabled={uploadingBackground}
                    className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
                  >
                    {uploadingBackground ? 'Đang upload...' : 'Upload'}
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Hỗ trợ: JPG, PNG, GIF. Kích thước tối đa: 5MB
                </p>
              </div>

              {/* Manage Participants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Thành viên ({selectedConversation.participants?.length || 0})
                  </label>
                  <button
                    onClick={() => setShowAddParticipants(!showAddParticipants)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Thêm thành viên
                  </button>
                </div>

                {/* Add Participants */}
                {showAddParticipants && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
                      {employees
                        .filter(emp => {
                          const empUserId = emp.user_id
                          return empUserId && 
                                 empUserId !== currentUserId && 
                                 !selectedConversation.participants?.some((p: any) => p.user_id === empUserId)
                        })
                        .map((employee) => {
                          const fullName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Nhân viên'
                          const isSelected = newParticipants.includes(employee.user_id!)
                          return (
                            <div
                              key={employee.id}
                              onClick={() => {
                                if (isSelected) {
                                  setNewParticipants(prev => prev.filter(id => id !== employee.user_id))
                                } else {
                                  setNewParticipants(prev => [...prev, employee.user_id!])
                                }
                              }}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50 border border-blue-300' : 'bg-white hover:bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-semibold">
                                {fullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-gray-900">{fullName}</p>
                                {employee.email && (
                                  <p className="text-xs text-gray-600 truncate">{employee.email}</p>
                                )}
                              </div>
                              {isSelected && (
                                <Check className="w-5 h-5 text-[#0068ff]" />
                              )}
                            </div>
                          )
                        })}
                    </div>
                    {newParticipants.length > 0 && (
                      <button
                        onClick={async () => {
                          try {
                            await apiPost(`/api/chat/conversations/${selectedConversation.id}/participants`, newParticipants)
                            await loadConversations()
                            if (selectedConversation) {
                              const updated = await apiGet(`/api/chat/conversations/${selectedConversation.id}`)
                              setSelectedConversation(updated)
                            }
                            setNewParticipants([])
                            setShowAddParticipants(false)
                            alert(`Đã thêm ${newParticipants.length} thành viên`)
                          } catch (error: any) {
                            alert(`Lỗi: ${error.message || 'Không thể thêm thành viên'}`)
                          }
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Thêm {newParticipants.length} thành viên
                      </button>
                    )}
                  </div>
                )}

                {/* List Participants */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedConversation.participants?.map((participant: any) => {
                    const isCurrentUser = participant.user_id === currentUserId
                    const isAdmin = participant.role === 'admin'
                    const currentUserIsAdmin = selectedConversation.participants?.find((p: any) => p.user_id === currentUserId)?.role === 'admin'
                    
                    return (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                            {participant.user_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900">
                              {participant.user_name || 'Unknown'}
                              {isCurrentUser && <span className="text-gray-500 ml-1">(Bạn)</span>}
                            </p>
                            {isAdmin && (
                              <p className="text-xs text-blue-600">Quản trị viên</p>
                            )}
                          </div>
                        </div>
                        {!isCurrentUser && currentUserIsAdmin && (
                          <button
                            onClick={async () => {
                              if (confirm(`Bạn có chắc muốn xóa ${participant.user_name} khỏi nhóm?`)) {
                                try {
                                  await apiDelete(`/api/chat/conversations/${selectedConversation.id}/participants/${participant.user_id}`)
                                  await loadConversations()
                                  if (selectedConversation) {
                                    const updated = await apiGet(`/api/chat/conversations/${selectedConversation.id}`)
                                    setSelectedConversation(updated)
                                  }
                                  alert('Đã xóa thành viên khỏi nhóm')
                                } catch (error: any) {
                                  alert(`Lỗi: ${error.message || 'Không thể xóa thành viên'}`)
                                }
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa thành viên"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {isCurrentUser && !isAdmin && (
                          <button
                            onClick={async () => {
                              if (confirm('Bạn có chắc muốn rời khỏi nhóm này?')) {
                                try {
                                  await apiDelete(`/api/chat/conversations/${selectedConversation.id}/participants/${currentUserId}`)
                                  setSelectedConversation(null)
                                  await loadConversations()
                                  alert('Đã rời khỏi nhóm')
                                } catch (error: any) {
                                  alert(`Lỗi: ${error.message || 'Không thể rời nhóm'}`)
                                }
                              }
                            }}
                            className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                          >
                            Rời nhóm
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Delete Group */}
              {selectedConversation.participants?.find((p: any) => p.user_id === currentUserId)?.role === 'admin' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      if (confirm('Bạn có chắc muốn xóa nhóm này? Hành động này không thể hoàn tác!')) {
                        try {
                          await apiDelete(`/api/chat/conversations/${selectedConversation.id}`)
                          setSelectedConversation(null)
                          await loadConversations()
                          setShowManageGroupDialog(false)
                          alert('Đã xóa nhóm')
                        } catch (error: any) {
                          alert(`Lỗi: ${error.message || 'Không thể xóa nhóm'}`)
                        }
                      }
                    }}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 inline mr-2" />
                    Xóa nhóm
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

