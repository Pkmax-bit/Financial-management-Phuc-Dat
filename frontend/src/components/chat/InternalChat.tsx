'use client'

import { useState, useEffect, useRef } from 'react'
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
  Users
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { Conversation, Message, ConversationWithParticipants, MessageCreate } from '@/types/chat'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface InternalChatProps {
  currentUserId: string
  currentUserName: string
}

export default function InternalChat({ currentUserId, currentUserName }: InternalChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithParticipants | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Check for conversation ID in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const conversationId = urlParams.get('conversation')
    if (conversationId) {
      // Load the specific conversation
      handleSelectConversationById(conversationId)
    } else {
      loadConversations()
    }
  }, [])

  const handleSelectConversationById = async (conversationId: string) => {
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
  }

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      markAsRead(selectedConversation.id)
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel(`conversation:${selectedConversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        }, (payload) => {
          // Add new message to list
          const newMessage = payload.new as any
          // Fetch full message with sender info
          fetchMessageDetails(newMessage.id)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedConversation?.id])

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      setLoading(true)
      const response = await apiGet('/api/chat/conversations')
      setConversations(response.conversations || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true)
      const response = await apiGet(`/api/chat/conversations/${conversationId}/messages`)
      setMessages(response.messages || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessageDetails = async (messageId: string) => {
    try {
      // Reload all messages to get updated data
      if (selectedConversation) {
        loadMessages(selectedConversation.id)
      }
    } catch (error) {
      console.error('Error fetching message details:', error)
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      await apiPost(`/api/chat/conversations/${conversationId}/read`)
      // Update conversation unread count
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      ))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      const response = await apiGet(`/api/chat/conversations/${conversation.id}`)
      setSelectedConversation(response)
      setReplyingTo(null)
      setEditingMessage(null)
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || (!messageText.trim() && !replyingTo)) return

    try {
      setSending(true)
      const messageData: MessageCreate = {
        message_text: messageText.trim() || '[Đã gửi file]',
        reply_to_id: replyingTo?.id
      }

      await apiPost(`/api/chat/conversations/${selectedConversation.id}/messages`, messageData)
      
      setMessageText('')
      setReplyingTo(null)
      
      // Reload messages
      await loadMessages(selectedConversation.id)
      await loadConversations() // Refresh conversation list to update last message
    } catch (error) {
      console.error('Error sending message:', error)
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

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      conv.name?.toLowerCase().includes(query) ||
      conv.last_message_preview?.toLowerCase().includes(query)
    )
  })

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi })
    } catch {
      return dateString
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations List - Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Tin nhắn</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Đang tải...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {conv.type === 'group' ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {conv.name || 'Cuộc trò chuyện'}
                      </h3>
                      {conv.last_message_at && (
                        <span className="text-xs text-gray-500 ml-2">
                          {formatTime(conv.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conv.last_message_preview || 'Chưa có tin nhắn'}
                      </p>
                      {conv.unread_count && conv.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area - Right Side */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {selectedConversation.type === 'group' ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedConversation.name || 'Cuộc trò chuyện'}
                    </h3>
                    {selectedConversation.type === 'group' && (
                      <p className="text-sm text-gray-500">
                        {selectedConversation.participant_count} thành viên
                      </p>
                    )}
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 bg-gray-50"
            >
              {loading && messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Đang tải tin nhắn...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Chưa có tin nhắn nào</div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === currentUserId
                    const isDeleted = message.is_deleted
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar (only for others) */}
                          {!isOwn && (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {message.sender_name?.charAt(0) || 'U'}
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            {!isOwn && (
                              <span className="text-xs text-gray-500 mb-1 px-2">
                                {message.sender_name || 'Unknown'}
                              </span>
                            )}
                            
                            {/* Reply Preview */}
                            {message.reply_to && (
                              <div className={`mb-1 px-3 py-2 rounded-lg bg-gray-200 text-sm text-gray-600 border-l-4 border-blue-500 ${
                                isOwn ? 'ml-auto' : 'mr-auto'
                              }`} style={{ maxWidth: '100%' }}>
                                <div className="font-semibold text-xs mb-1">
                                  {message.reply_to.sender_name}
                                </div>
                                <div className="truncate">
                                  {message.reply_to.message_text}
                                </div>
                              </div>
                            )}
                            
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-blue-500 text-white rounded-tr-sm'
                                  : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                              } ${isDeleted ? 'opacity-60 italic' : ''}`}
                            >
                              {isDeleted ? (
                                <span className="text-sm">Tin nhắn đã bị xóa</span>
                              ) : (
                                <>
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.message_text}
                                  </p>
                                  {message.is_edited && (
                                    <span className="text-xs opacity-70 ml-2">(đã chỉnh sửa)</span>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {/* Time and Actions */}
                            <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                              <span className="text-xs text-gray-500">
                                {formatTime(message.created_at)}
                              </span>
                              {!isDeleted && isOwn && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingMessage(message)
                                      setMessageText(message.message_text)
                                      setReplyingTo(null)
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded"
                                    title="Chỉnh sửa"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                    title="Xóa"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              {!isDeleted && !isOwn && (
                                <button
                                  onClick={() => {
                                    setReplyingTo(message)
                                    setEditingMessage(null)
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  title="Trả lời"
                                >
                                  <Reply className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              {/* Reply Preview */}
              {replyingTo && (
                <div className="mb-2 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-500 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-blue-700 mb-1">
                      Đang trả lời {replyingTo.sender_name}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {replyingTo.message_text}
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-blue-100 rounded"
                  >
                    <X className="w-4 h-4 text-blue-700" />
                  </button>
                </div>
              )}
              
              {/* Edit Preview */}
              {editingMessage && (
                <div className="mb-2 p-2 bg-yellow-50 rounded-lg border-l-4 border-yellow-500 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-yellow-700">
                      Đang chỉnh sửa tin nhắn
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingMessage(null)
                      setMessageText('')
                    }}
                    className="p-1 hover:bg-yellow-100 rounded"
                  >
                    <X className="w-4 h-4 text-yellow-700" />
                  </button>
                </div>
              )}
              
              <div className="flex items-end gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={editingMessage ? "Chỉnh sửa tin nhắn..." : "Nhập tin nhắn..."}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                </div>
                
                <button
                  onClick={editingMessage ? () => handleEditMessage(editingMessage) : handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

