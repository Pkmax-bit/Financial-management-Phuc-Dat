'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  MessageSquare, X, Minimize2, Maximize2, Send, Paperclip, 
  Image as ImageIcon, Smile, ArrowLeft, Edit2, Trash2, 
  Reply, Copy, Forward, Download, FileText, ChevronRight 
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Conversation, Message, MessageCreate } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
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

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiGet('/api/chat/conversations')
      const conversationsList = response.conversations || []
      
      // Load participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        conversationsList.map(async (conv: Conversation) => {
          try {
            const convDetails = await apiGet(`/api/chat/conversations/${conv.id}`)
            return { ...conv, participants: convDetails.participants || [] }
          } catch {
            return conv
          }
        })
      )
      
      setConversations(conversationsWithParticipants)
      
      // Auto-select conversation if provided, otherwise first conversation
      if (conversationsWithParticipants.length > 0) {
        if (conversationId) {
          const targetConv = conversationsWithParticipants.find(c => c.id === conversationId)
          if (targetConv) {
            setSelectedConversation(targetConv)
          } else if (!selectedConversation) {
            setSelectedConversation(conversationsWithParticipants[0])
          }
        } else if (!selectedConversation) {
          setSelectedConversation(conversationsWithParticipants[0])
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  // Load messages
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await apiGet(`/api/chat/conversations/${conversationId}/messages`)
      setMessages(response.messages || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Auto-select conversation when conversationId prop changes
  useEffect(() => {
    if (conversationId) {
      // First check if conversation is already in the list
      const targetConv = conversations.find(c => c.id === conversationId)
      if (targetConv && targetConv.id !== selectedConversation?.id) {
        setSelectedConversation(targetConv)
      } else if (!targetConv) {
        // If conversation not in list, load it directly
        const loadConversation = async () => {
          try {
            const convDetails = await apiGet(`/api/chat/conversations/${conversationId}`)
            if (convDetails) {
              setSelectedConversation(convDetails)
              // Also add to conversations list if not already there
              setConversations(prev => {
                const exists = prev.find(c => c.id === conversationId)
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
    }
  }, [conversationId, conversations, selectedConversation])

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      markAsRead(selectedConversation.id)
    }
  }, [selectedConversation, loadMessages])

  // Subscribe to real-time messages
  useEffect(() => {
    if (!selectedConversation) return

    const channel = supabase
      .channel(`conversation-widget:${selectedConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'internal_messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, (payload) => {
        fetchMessageDetails(selectedConversation.id)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation])

  const fetchMessageDetails = useCallback(async (conversationId: string) => {
    try {
      await loadMessages(conversationId)
      await loadConversations()
    } catch (error) {
      console.error('Error fetching message details:', error)
    }
  }, [loadMessages, loadConversations])

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

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom()
    }
  }, [messages, isMinimized, scrollToBottom])

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
        file_url: null,
        file_name: null,
        file_size: null,
        is_deleted: false,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reply_to: replyingTo ? {
          id: replyingTo.id,
          sender_id: replyingTo.sender_id,
          sender_name: replyingTo.sender_name,
          message_text: replyingTo.message_text
        } : null,
        reply_to_id: replyingTo?.id || null
      }

      setMessages(prev => [...prev, optimisticMessage])
    }
    
    setMessageText('')
    const replyingToToClear = replyingTo
    setReplyingTo(null)

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
        await apiPost(`/api/chat/conversations/${selectedConversation.id}/messages`, messageData)
      }
      
      await loadMessages(selectedConversation.id)
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
        file_url: fileItem.preview || null,
        file_name: file.name,
        file_size: file.size,
        is_deleted: false,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reply_to: replyingTo ? {
          id: replyingTo.id,
          sender_id: replyingTo.sender_id,
          sender_name: replyingTo.sender_name,
          message_text: replyingTo.message_text
        } : null,
        reply_to_id: replyingTo?.id || null
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
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 bg-gray-50 min-h-0">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">Chưa có tin nhắn</div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === currentUserId
                    const isDeleted = message.is_deleted
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex group ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} flex gap-1`}>
                          <div
                            className={`px-3 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-[#0068ff] text-white rounded-tr-sm'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'
                            } ${isDeleted ? 'opacity-60 italic' : ''}`}
                          >
                            {!isOwn && (
                              <div className="text-xs font-semibold mb-1 opacity-80">
                                {message.sender_name || 'Unknown'}
                              </div>
                            )}
                            
                            {/* Reply Preview */}
                            {message.reply_to && (
                              <div className={`mb-1.5 px-2 py-1 rounded text-xs border-l-2 ${
                                isOwn 
                                  ? 'bg-white/20 border-white/40' 
                                  : 'bg-gray-100 border-[#0068ff]'
                              }`}>
                                <div className={`font-semibold ${isOwn ? 'text-white/90' : 'text-[#0068ff]'}`}>
                                  {message.reply_to.sender_name}
                                </div>
                                <div className="truncate">
                                  {message.reply_to.message_text}
                                </div>
                              </div>
                            )}
                            
                            {isDeleted ? (
                              <span className="text-sm">Tin nhắn đã bị xóa</span>
                            ) : (
                              <>
                                {/* File/Image Preview */}
                                {message.file_url && (
                                  <div className="mb-2">
                                    {message.message_type === 'image' ? (
                                      <img
                                        src={message.file_url}
                                        alt={message.file_name || 'Image'}
                                        className="max-w-full max-h-40 rounded cursor-pointer hover:opacity-90"
                                        onClick={() => window.open(message.file_url, '_blank')}
                                      />
                                    ) : (
                                      <div className={`flex items-center gap-2 p-2 rounded ${
                                        isOwn ? 'bg-white/20' : 'bg-gray-100'
                                      }`}>
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs font-medium truncate">
                                            {message.file_name || 'File'}
                                          </div>
                                          {message.file_size && (
                                            <div className="text-xs opacity-70">
                                              {(message.file_size / 1024).toFixed(1)} KB
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Message Text */}
                                {message.message_text && (
                                  <div className="text-sm whitespace-pre-wrap break-words">
                                    {message.message_text}
                                  </div>
                                )}
                                
                                {message.is_edited && (
                                  <span className={`text-xs ml-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                                    (đã chỉnh sửa)
                                  </span>
                                )}
                              </>
                            )}
                            
                            <div className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                                locale: vi
                              })}
                            </div>
                          </div>
                          
                          {/* Message Actions */}
                          {!isDeleted && (
                            <div className={`flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                              {isOwn && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingMessage(message)
                                      setMessageText(message.message_text)
                                      setReplyingTo(null)
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="Chỉnh sửa"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="Xóa"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setReplyingTo(message)
                                  setEditingMessage(null)
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Trả lời"
                              >
                                <Reply className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleCopyMessage(message.message_text)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Sao chép"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {message.file_url && (
                                <button
                                  onClick={() => handleDownloadFile(message.file_url!, message.file_name || 'file')}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  title="Tải xuống"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
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
                  onChange={(e) => setMessageText(e.target.value)}
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
