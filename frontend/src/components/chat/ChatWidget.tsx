'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  MessageSquare, X, Minimize2, Maximize2, Send, Paperclip, 
  Image as ImageIcon, Smile, ArrowLeft, Edit2, Trash2, 
  Reply, Copy, Forward, Download, FileText, ChevronRight 
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Conversation, Message, MessageCreate, ConversationWithParticipants } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import MessageBubble from './MessageBubble'
import { useRealtimeChat } from '@/hooks/useRealtimeChat'

interface ChatWidgetProps {
  currentUserId: string
  currentUserName: string
  conversationId?: string // Optional: if provided, auto-select this conversation
  onClose: () => void
  onMinimize?: () => void // Optional: callback when minimize button is clicked
}

interface FileItem {
  file: File
  preview?: string
}

export default function ChatWidget({ currentUserId, currentUserName, conversationId, onClose, onMinimize }: ChatWidgetProps) {
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithParticipants | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Message cache to avoid reloading
  const messageCacheRef = useRef<Map<string, { messages: Message[], timestamp: number }>>(new Map())
  const CACHE_TTL = 2 * 60 * 1000 // 2 minutes (reduced for fresher data, but still cache for performance)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState<Map<string, { userId: string; userName: string; timestamp: number }>>(new Map())
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingBroadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingBroadcastRef = useRef<number>(0)

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiGet('/api/chat/conversations')
      const conversationsList = response.conversations || []
      
      // Backend already returns participants via _enrich_conversation_with_participants
      // No need to make additional API calls for each conversation
      setConversations(conversationsList as ConversationWithParticipants[])
      
      // Auto-select conversation if provided, otherwise first conversation
      if (conversationsList.length > 0) {
        if (conversationId) {
          const targetConv = conversationsList.find((c: Conversation) => c.id === conversationId) as ConversationWithParticipants | undefined
          if (targetConv) {
            setSelectedConversation(targetConv)
          } else if (!selectedConversation) {
            setSelectedConversation(conversationsList[0] as ConversationWithParticipants)
          }
        } else if (!selectedConversation) {
          setSelectedConversation(conversationsList[0] as ConversationWithParticipants)
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [conversationId])
  
  // Debounce loadConversations to avoid too many calls
  const loadConversationsDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const debouncedLoadConversations = useCallback(() => {
    if (loadConversationsDebounceRef.current) {
      clearTimeout(loadConversationsDebounceRef.current)
    }
    loadConversationsDebounceRef.current = setTimeout(() => {
      loadConversations()
    }, 500) // Debounce 500ms
  }, [loadConversations])

  // Load messages - Optimized with parallel loading and caching
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoadingMessages(true)
      
      // Check cache first
      const cached = messageCacheRef.current.get(conversationId)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setMessages(cached.messages)
        setLoadingMessages(false)
        // Load in background to update cache
        loadMessagesInBackground(conversationId)
        return
      }

      console.log(`🔄 Loading messages for conversation ${conversationId}...`)
      
      // Load first batch immediately (most recent messages)
      // Optimized: Load 50 messages first for faster initial render
      const firstBatch = await apiGet(`/api/chat/conversations/${conversationId}/messages?skip=0&limit=50`)
      const firstMessages = firstBatch.messages || []
      
      console.log(`📥 First batch: ${firstMessages.length} messages, total: ${firstBatch.total || 0}, has_more: ${firstBatch.has_more}`)
      
      // Display first batch immediately for fast UI
      if (firstMessages.length > 0) {
        console.log(`✅ Setting ${firstMessages.length} messages to state`)
        console.log('📋 Sample message:', firstMessages[0] ? {
          id: firstMessages[0].id,
          text: firstMessages[0].message_text,
          sender: firstMessages[0].sender_name,
          type: firstMessages[0].message_type
        } : 'No messages')
        setMessages(firstMessages)
        // Don't set loading to false yet if there are more messages to load
        if (!firstBatch.has_more || firstMessages.length < 50) {
          setLoadingMessages(false)
        }
      } else {
        // No messages at all
        setMessages([])
        setLoadingMessages(false)
        messageCacheRef.current.set(conversationId, {
          messages: [],
          timestamp: Date.now()
        })
        console.log(`✅ No messages found for conversation ${conversationId}`)
        return
      }

      // If there are more messages, load them in parallel batches
      // Optimized: Load in smaller batches (50) for faster progressive loading
      if (firstBatch.has_more && firstMessages.length === 50) {
        const totalCount = firstBatch.total || 0
        const remainingMessages = totalCount - firstMessages.length
        
        if (remainingMessages > 0) {
          // Calculate how many batches we need (50 messages per batch)
          const batchesNeeded = Math.ceil(remainingMessages / 50)
          
          // Load all remaining batches in parallel (but limit to reasonable number to avoid overwhelming)
          // Load in chunks of 10 batches at a time (increased for faster loading)
          const MAX_PARALLEL_BATCHES = 10
          let allMessages = [...firstMessages]
          
          // Load batches in chunks
          for (let chunkStart = 1; chunkStart <= batchesNeeded; chunkStart += MAX_PARALLEL_BATCHES) {
            const chunkEnd = Math.min(chunkStart + MAX_PARALLEL_BATCHES - 1, batchesNeeded)
            const batchPromises: Promise<any>[] = []
            
            // Create promises for this chunk (50 messages per batch)
            for (let i = chunkStart; i <= chunkEnd; i++) {
              const skip = i * 50
              batchPromises.push(
                apiGet(`/api/chat/conversations/${conversationId}/messages?skip=${skip}&limit=50`)
                  .catch(err => {
                    console.error(`Error loading batch ${i}:`, err)
                    return { messages: [], has_more: false }
                  })
              )
            }
            
            // Wait for this chunk to complete
            const chunkResults = await Promise.all(batchPromises)
            
            // Combine messages from this chunk
            for (const result of chunkResults) {
              if (result.messages && result.messages.length > 0) {
                allMessages = [...allMessages, ...result.messages]
              }
            }
            
            // Update UI progressively as we load more batches
            if (chunkStart === 1) {
              // First chunk: update immediately
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
          setLoadingMessages(false)
          
          // Cache the result
          messageCacheRef.current.set(conversationId, {
            messages: allMessages,
            timestamp: Date.now()
          })
          
          console.log(`✅ Loaded all ${allMessages.length} messages (${batchesNeeded} batches) for conversation ${conversationId}`)
        } else {
          // No more messages, just cache first batch
          setLoadingMessages(false)
          messageCacheRef.current.set(conversationId, {
            messages: firstMessages,
            timestamp: Date.now()
          })
          console.log(`✅ Loaded ${firstMessages.length} messages (no more) for conversation ${conversationId}`)
        }
      } else {
        // No more messages, just cache first batch
        setLoadingMessages(false)
        messageCacheRef.current.set(conversationId, {
          messages: firstMessages,
          timestamp: Date.now()
        })
        console.log(`✅ Loaded ${firstMessages.length} messages (no more) for conversation ${conversationId}`)
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error)
      setMessages([])
      setLoadingMessages(false)
    }
  }, [])

  // Load messages in background to update cache
  const loadMessagesInBackground = useCallback(async (conversationId: string) => {
    try {
      const response = await apiGet(`/api/chat/conversations/${conversationId}/messages?skip=0&limit=50`)
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

  // Load saved conversation from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !conversationId) {
      const savedConversationId = localStorage.getItem('chat_widget_selected_conversation')
      if (savedConversationId) {
        // Will be handled by auto-select effect below
      }
    }
  }, [])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Auto-select conversation when conversationId prop changes or from localStorage
  useEffect(() => {
    const targetId = conversationId || (typeof window !== 'undefined' ? localStorage.getItem('chat_widget_selected_conversation') : null)
    
    if (targetId) {
      // First check if conversation is already in the list
      const targetConv = conversations.find(c => c.id === targetId)
      if (targetConv && targetConv.id !== selectedConversation?.id) {
        setSelectedConversation(targetConv as ConversationWithParticipants)
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('chat_widget_selected_conversation', targetId)
        }
      } else if (!targetConv && conversations.length > 0) {
        // If conversation not in list, load it directly
        const loadConversation = async () => {
          try {
            const convDetails = await apiGet(`/api/chat/conversations/${targetId}`)
            if (convDetails) {
              setSelectedConversation(convDetails)
              // Save to localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('chat_widget_selected_conversation', targetId)
              }
              // Also add to conversations list if not already there
              setConversations(prev => {
                const exists = prev.find(c => c.id === targetId)
                if (!exists) {
                  return [...prev, convDetails]
                }
                return prev
              })
            }
          } catch (error) {
            console.error('Error loading conversation:', error)
          }
        }
        loadConversation()
      }
    } else if (!targetId && conversations.length > 0 && !selectedConversation) {
      // If no conversationId and no saved, select first conversation
      const firstConv = conversations[0]
      if (firstConv) {
        setSelectedConversation(firstConv as ConversationWithParticipants)
        if (typeof window !== 'undefined') {
          localStorage.setItem('chat_widget_selected_conversation', firstConv.id)
        }
      }
    }
  }, [conversationId, conversations, selectedConversation])

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await apiPost(`/api/chat/conversations/${conversationId}/read`, {})
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      ))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [])

  // Debug: Log messages state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Messages state:', {
        count: messages.length,
        selectedConversation: selectedConversation?.id,
        loadingMessages: loadingMessages,
        sampleMessage: messages[0] ? {
          id: messages[0].id,
          text: messages[0].message_text?.substring(0, 50),
          sender: messages[0].sender_name
        } : null
      })
    }
  }, [messages, selectedConversation, loadingMessages])

  // Load messages when conversation changes - Optimized parallel loading
  useEffect(() => {
    if (selectedConversation) {
      console.log(`🔄 Conversation selected: ${selectedConversation.id}, loading messages...`)
      // Clear old messages first to avoid showing stale data
      setMessages([])
      
      // Load messages and mark as read in parallel for faster response
      Promise.all([
        loadMessages(selectedConversation.id),
        markAsRead(selectedConversation.id)
      ]).catch(error => {
        console.error('❌ Error loading conversation data:', error)
        setLoadingMessages(false)
      })
    } else {
      // Clear messages when no conversation selected
      console.log('🔄 No conversation selected, clearing messages')
      setMessages([])
      setLoadingMessages(false)
    }
  }, [selectedConversation?.id, loadMessages, markAsRead])

  const fetchMessageDetails = useCallback(async (conversationId: string) => {
    try {
      // Reload messages to get updated data with sender info
      // This ensures we have the latest messages with all metadata
      await loadMessages(conversationId)
      await loadConversations()
    } catch (error) {
      console.error('Error fetching message details:', error)
    }
  }, [loadMessages, loadConversations])

  // Handlers for realtime messages
  const handleNewMessage = useCallback((message: Message) => {
    const receiveTime = performance.now()
    const receiveTimestamp = Date.now()
    
    // Calculate delay if message has created_at timestamp
    let delay = null
    if (message.created_at) {
      const messageTime = new Date(message.created_at).getTime()
      delay = receiveTimestamp - messageTime
    }
    
    console.log('📨 handleNewMessage called (widget) with:', {
      messageId: message.id,
      conversationId: message.conversation_id,
      currentConversationId: selectedConversation?.id,
      senderId: message.sender_id,
      currentUserId,
      messageText: message.message_text?.substring(0, 50),
      delay: delay ? `${delay}ms (${(delay/1000).toFixed(2)}s)` : 'unknown',
      messageCreatedAt: message.created_at,
      receiveTimestamp
    })
    
    // Only process messages for current conversation
    if (message.conversation_id !== selectedConversation?.id) {
      console.log('⚠️ Ignoring message from different conversation (widget):', {
        messageConversationId: message.conversation_id,
        currentConversationId: selectedConversation?.id
      })
      return
    }
    
    // Check if message already exists to avoid duplicates
    setMessages(prev => {
      const exists = prev.find(m => m.id === message.id)
      if (exists) {
        console.log('⚠️ Message already exists, updating instead (widget):', message.id)
        // Update existing message instead of ignoring (in case data changed)
        return prev.map(m => m.id === message.id ? { ...m, ...message } : m)
      }
      console.log('✅ Adding new message to list (widget):', message.id)
      // Add new message to the end (newest messages at the end)
      return [...prev, message]
    })
    
    // Debounced reload conversations to update last_message_at and sort order
    debouncedLoadConversations()
  }, [debouncedLoadConversations, selectedConversation?.id, currentUserId])

  const handleMessageUpdate = useCallback((message: Message) => {
    setMessages(prev => prev.map(msg => 
      msg.id === message.id ? { ...msg, ...message } : msg
    ))
    debouncedLoadConversations()
  }, [debouncedLoadConversations])

  const handleMessageDelete = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
    debouncedLoadConversations()
  }, [debouncedLoadConversations])

  // Use optimized realtime chat hook
  const { isConnected, connectionStatus, error: realtimeError } = useRealtimeChat({
    conversationId: selectedConversation?.id || null,
    currentUserId,
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate,
    onMessageDelete: handleMessageDelete,
    onConnectionChange: (connected) => {
      if (connected) {
        console.log('✅ Realtime chat connected (widget)')
      } else {
        console.warn('⚠️ Realtime chat disconnected (widget)')
      }
    },
  })

  // Polling fallback: Poll for new messages every 2 seconds if realtime is not connected
  // This ensures messages are received even if realtime fails (20-45s delay issue)
  useEffect(() => {
    if (!selectedConversation) return
    
    // Only poll if realtime is not connected or has errors
    // This prevents unnecessary API calls when realtime is working
    if (isConnected && connectionStatus === 'connected') {
      console.log('✅ Realtime connected, skipping polling fallback (widget)')
      return
    }
    
    console.warn('⚠️ Realtime not connected, using polling fallback (every 2s) - widget')
    
    // Poll every 2 seconds to get new messages
    const pollingInterval = setInterval(() => {
      if (selectedConversation && (!isConnected || connectionStatus !== 'connected')) {
        console.log('🔄 Polling for new messages (realtime fallback - widget)')
        loadMessages(selectedConversation.id).catch(err => {
          console.error('Error polling messages:', err)
        })
      }
    }, 2000) // Poll every 2 seconds (faster fallback)
    
    return () => {
      clearInterval(pollingInterval)
    }
  }, [selectedConversation?.id, isConnected, connectionStatus, loadMessages])

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom()
    }
  }, [messages, isMinimized, scrollToBottom])

  // Setup typing indicator channel for realtime typing status
  useEffect(() => {
    if (!selectedConversation || !currentUserId) {
      // Cleanup typing channel when no conversation selected
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe()
        supabase.removeChannel(typingChannelRef.current)
        typingChannelRef.current = null
      }
      setTypingUsers(new Map())
      return
    }

    const setupTypingChannel = async () => {
      try {
        await supabase.realtime.setAuth()
        
        // Create typing channel for this conversation
        const typingChannel = supabase.channel(`typing:conversation:${selectedConversation.id}`, {
          config: {
            broadcast: {
              self: false, // Don't receive own typing broadcasts
              ack: false
            }
          }
        })

        // Listen for typing events from other users
        typingChannel
          .on('broadcast', { event: 'typing' }, (payload) => {
            const { userId, userName, isTyping: typingStatus } = payload.payload as any
            
            // Only show typing indicator for other users
            if (userId !== currentUserId && typingStatus) {
              setTypingUsers(prev => {
                const newMap = new Map(prev)
                newMap.set(userId, {
                  userId,
                  userName: userName || 'Người dùng',
                  timestamp: Date.now()
                })
                return newMap
              })
            } else if (userId !== currentUserId && !typingStatus) {
              // Remove typing indicator when user stops typing
              setTypingUsers(prev => {
                const newMap = new Map(prev)
                newMap.delete(userId)
                return newMap
              })
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Typing indicator channel subscribed (widget):', selectedConversation.id)
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Typing indicator channel error (widget):', selectedConversation.id)
            }
          })

        typingChannelRef.current = typingChannel

        return () => {
          if (typingChannelRef.current) {
            typingChannelRef.current.unsubscribe()
            supabase.removeChannel(typingChannelRef.current)
            typingChannelRef.current = null
          }
        }
      } catch (error) {
        console.error('Error setting up typing channel (widget):', error)
      }
    }

    setupTypingChannel()

    // Cleanup on unmount or conversation change
    return () => {
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe()
        supabase.removeChannel(typingChannelRef.current)
        typingChannelRef.current = null
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (typingBroadcastTimeoutRef.current) {
        clearTimeout(typingBroadcastTimeoutRef.current)
      }
      setTypingUsers(new Map())
    }
  }, [selectedConversation?.id, currentUserId])

  // Cleanup old typing indicators (older than 3 seconds)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        const now = Date.now()
        let hasChanges = false
        
        newMap.forEach((value, key) => {
          // Remove typing indicator if it's older than 3 seconds (user likely stopped typing)
          if (now - value.timestamp > 3000) {
            newMap.delete(key)
            hasChanges = true
          }
        })
        
        return hasChanges ? newMap : prev
      })
    }, 1000) // Check every second

    return () => clearInterval(cleanupInterval)
  }, [])

  const handleSendMessage = async () => {
    if (!selectedConversation || (!messageText.trim() && selectedFiles.length === 0 && !replyingTo)) return

    const tempMessageId = `temp-${Date.now()}-${Math.random()}`
    const messageTextToSend = messageText.trim()
    
    // Optimistic update
    if (messageTextToSend) {
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

      setMessages(prev => [...prev, optimisticMessage])
    }
    
    setMessageText('')
    const replyingToToClear = replyingTo
    setReplyingTo(null)
    
    // Clear typing indicator and broadcast "stopped typing"
    if (typingChannelRef.current && selectedConversation) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          userName: currentUserName,
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

    try {
      setSending(true)
      
      // If there are selected files, upload them first
      if (selectedFiles.length > 0) {
        await handleUploadFiles()
        // If there's also text, send it separately
        if (messageTextToSend) {
          const messageData: MessageCreate = {
            message_text: messageTextToSend,
            reply_to_id: replyingToToClear?.id
          }
          await apiPost(`/api/chat/conversations/${selectedConversation.id}/messages`, messageData)
        }
      } else {
        // Send text message only
        const messageData: MessageCreate = {
          message_text: messageTextToSend,
          reply_to_id: replyingToToClear?.id
        }
        const sendStartTime = performance.now()
        const sendTimestamp = Date.now()
        
        const response = await apiPost(`/api/chat/conversations/${selectedConversation.id}/messages`, messageData)
        
        const apiResponseTime = performance.now() - sendStartTime
        
        console.log('📤 API Response after sending message (widget):', {
          response,
          hasId: !!response?.id,
          responseKeys: response ? Object.keys(response) : [],
          tempMessageId,
          apiResponseTime: `${apiResponseTime.toFixed(2)}ms`,
          sendTimestamp
        })
        
        // Replace optimistic message with real message from server
        // IMPORTANT: Always add the real message even if realtime might deliver it
        // This ensures User A sees their own message immediately
        if (response && response.id) {
          setMessages(prev => {
            // Remove optimistic message (temp ID)
            const filtered = prev.filter(msg => msg.id !== tempMessageId)
            // Check if real message already exists (from realtime broadcast - unlikely but possible)
            const exists = filtered.find(msg => msg.id === response.id)
            if (exists) {
              console.log('✅ Message already exists from realtime, updating (widget):', response.id)
              // Message already exists from realtime, just update it with server response
              return filtered.map(msg => 
                msg.id === response.id ? { ...msg, ...response } : msg
              )
            } else {
              console.log('✅ Adding real message from API response (widget):', response.id)
              // Add real message immediately - this ensures User A sees their message
              // Realtime will also deliver it, but we handle duplicates in handleNewMessage
              return [...filtered, response as Message]
            }
          })
        } else {
          console.warn('⚠️ No valid response from API (widget), keeping optimistic message and waiting for realtime')
          // Don't remove optimistic message if API response is invalid
          // Keep it and wait for realtime broadcast to deliver the real message
          // This prevents message from disappearing
        }
      }
      
      // Don't reload all messages - realtime will handle new messages
      // Only reload conversations list to update last_message_at
      await loadConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      if (messageTextToSend) {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId))
        setMessageText(messageTextToSend)
      }
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
      const item: FileItem = { file }
      
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

    setMessages(prev => [...prev, ...optimisticMessages])
    
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

      const uploadPromises = filesToClear.map(async (fileItem) => {
        const file = fileItem.file
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

      await Promise.all(uploadPromises)
      
      await loadMessages(selectedConversation.id)
      await loadConversations()
    } catch (error) {
      console.error('Error uploading files:', error)
      setMessages(prev => prev.filter(msg => !tempMessageIds.includes(msg.id)))
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
    alert('Đã sao chép tin nhắn')
  }

  const handleDownloadFile = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleForwardMessage = async (message: Message) => {
    alert('Tính năng chuyển tiếp tin nhắn đang được phát triển')
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-lg shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-[#0068ff] text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-semibold">Chat</span>
            {selectedConversation && selectedConversation.unread_count && selectedConversation.unread_count > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {selectedConversation.unread_count > 9 ? '9+' : selectedConversation.unread_count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Mở rộng"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-[#0068ff] text-white rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedConversation && (
            <button
              onClick={() => {
                setSelectedConversation(null)
                setReplyingTo(null)
                setEditingMessage(null)
                setMessageText('')
                setSelectedFiles([])
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold truncate">
            {selectedConversation?.name || 'Chat'}
          </span>
          {selectedConversation && selectedConversation.unread_count && selectedConversation.unread_count > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
              {selectedConversation.unread_count > 9 ? '9+' : selectedConversation.unread_count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => {
              if (onMinimize) {
                onMinimize()
              } else {
                setIsMinimized(true)
              }
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Thu nhỏ"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversations List / Messages */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="text-center text-gray-500 py-4 text-sm">Đang tải...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-4 text-sm">Chưa có cuộc trò chuyện</div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv: ConversationWithParticipants) => {
                  const selectedId = selectedConversation ? (selectedConversation as ConversationWithParticipants).id : null
                  const isSelected = selectedId === conv.id
                  return (
                    <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv)
                      // Save to localStorage
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('chat_widget_selected_conversation', conv.id)
                      }
                    }}
                    className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {conv.name || 'Cuộc trò chuyện'}
                        </div>
                        {conv.last_message_preview && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {conv.last_message_preview}
                          </div>
                        )}
                      </div>
                      {conv.unread_count && conv.unread_count > 0 && (
                        <span className="bg-[#0068ff] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 bg-gray-50 min-h-0">
              {loadingMessages ? (
                <div className="text-center text-gray-500 py-8 text-sm">Đang tải tin nhắn...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">Chưa có tin nhắn</div>
              ) : (
                <div className="space-y-2">
                  {messages.length > 0 && (
                    <div className="text-xs text-gray-400 text-center py-1">
                      Hiển thị {messages.length} tin nhắn
                    </div>
                  )}
                  {messages.map((message) => {
                    const isOwn = message.sender_id === currentUserId
                    
                    // Debug log
                    if (process.env.NODE_ENV === 'development') {
                      console.log('📨 Rendering message:', {
                        id: message.id,
                        text: message.message_text,
                        sender: message.sender_name,
                        type: message.message_type,
                        isDeleted: message.is_deleted
                      })
                    }
                    
                    return (
                      <MessageBubble
                        key={message.id}
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
                        showAvatar={false}
                        showSenderName={!isOwn}
                        maxWidth="85%"
                      />
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
              
              {/* Typing Indicator - Show who is typing */}
              {typingUsers.size > 0 && (
                <div className="px-3 py-1.5 bg-white border-t border-gray-100">
                  {Array.from(typingUsers.values()).map((typingUser) => (
                    <div key={typingUser.userId} className="flex items-center gap-2 text-xs text-gray-500 italic">
                      <div className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span>{typingUser.userName} đang soạn...</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white flex-shrink-0">
              {/* Reply Preview */}
              {replyingTo && (
                <div className="px-3 pt-2 pb-1 bg-[#e5f3ff] border-l-4 border-[#0068ff] flex items-center justify-between">
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
                    <X className="w-3 h-3 text-[#0068ff]" />
                  </button>
                </div>
              )}
              
              {/* Edit Preview */}
              {editingMessage && (
                <div className="px-3 pt-2 pb-1 bg-[#fff4e5] border-l-4 border-[#ff9800] flex items-center justify-between">
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
                    <X className="w-3 h-3 text-[#ff9800]" />
                  </button>
                </div>
              )}
              
              {/* Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="px-3 pt-2 pb-1 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((fileItem, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-1.5 bg-white rounded border border-gray-200 shadow-sm"
                      >
                        {fileItem.preview ? (
                          <img 
                            src={fileItem.preview} 
                            alt={`Preview ${index + 1}`} 
                            className="w-10 h-10 object-cover rounded flex-shrink-0" 
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 max-w-[150px]">
                          <p className="text-xs font-medium text-gray-800 truncate">{fileItem.file.name}</p>
                          <p className="text-xs text-gray-500">{(fileItem.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
                          title="Xóa"
                        >
                          <X className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-1.5 p-2 relative flex-shrink-0">
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
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Đính kèm file"
                  disabled={uploadingFile}
                >
                  <Paperclip className="w-4 h-4 text-gray-600" />
                </button>
                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Gửi ảnh"
                  disabled={uploadingFile}
                >
                  <ImageIcon className="w-4 h-4 text-gray-600" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Emoji"
                  >
                    <Smile className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-1">
                      {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setMessageText(prev => prev + emoji)
                            setShowEmojiPicker(false)
                          }}
                          className="p-1 hover:bg-gray-100 rounded text-base transition-colors"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}
                </div>
                
                <textarea
                  value={messageText}
                  onChange={(e) => {
                    const value = e.target.value
                    setMessageText(value)
                    
                    // Broadcast typing status to other users (throttled to avoid spam)
                    if (value.trim().length > 0 && selectedConversation && typingChannelRef.current) {
                      const now = Date.now()
                      // Throttle: only broadcast every 1 second
                      if (now - lastTypingBroadcastRef.current > 1000) {
                        lastTypingBroadcastRef.current = now
                        
                        // Broadcast typing status
                        typingChannelRef.current.send({
                          type: 'broadcast',
                          event: 'typing',
                          payload: {
                            userId: currentUserId,
                            userName: currentUserName,
                            isTyping: true
                          }
                        })
                      } else {
                        // Schedule a delayed broadcast if we're throttling
                        if (typingBroadcastTimeoutRef.current) {
                          clearTimeout(typingBroadcastTimeoutRef.current)
                        }
                        typingBroadcastTimeoutRef.current = setTimeout(() => {
                          if (messageText.trim().length > 0 && selectedConversation && typingChannelRef.current) {
                            lastTypingBroadcastRef.current = Date.now()
                            typingChannelRef.current.send({
                              type: 'broadcast',
                              event: 'typing',
                              payload: {
                                userId: currentUserId,
                                userName: currentUserName,
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
                        if (typingChannelRef.current && selectedConversation) {
                          typingChannelRef.current.send({
                            type: 'broadcast',
                            event: 'typing',
                            payload: {
                              userId: currentUserId,
                              userName: currentUserName,
                              isTyping: false
                            }
                          })
                        }
                      }, 2000)
                    } else {
                      // User stopped typing - broadcast immediately
                      if (typingChannelRef.current && selectedConversation) {
                        typingChannelRef.current.send({
                          type: 'broadcast',
                          event: 'typing',
                          payload: {
                            userId: currentUserId,
                            userName: currentUserName,
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
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder={editingMessage ? "Chỉnh sửa tin nhắn..." : replyingTo ? "Trả lời..." : "Nhập tin nhắn..."}
                  className="flex-1 px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0068ff] resize-none text-sm"
                  rows={1}
                  style={{ maxHeight: '100px', minHeight: '36px' }}
                />
                
                <button
                  onClick={editingMessage ? () => handleEditMessage(editingMessage) : handleSendMessage}
                  disabled={sending || uploadingFile || (!messageText.trim() && selectedFiles.length === 0)}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    (messageText.trim() || selectedFiles.length > 0) && !sending && !uploadingFile
                      ? 'bg-[#0068ff] text-white hover:bg-[#0056d6]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={editingMessage ? "Lưu chỉnh sửa" : uploadingFile ? `Đang tải lên ${selectedFiles.length} file...` : "Gửi tin nhắn (Enter)"}
                >
                  {uploadingFile ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
