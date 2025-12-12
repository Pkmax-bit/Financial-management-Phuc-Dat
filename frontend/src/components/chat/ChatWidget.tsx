'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, X, Minimize2, Maximize2, Send, Paperclip, Image as ImageIcon, Smile, ArrowLeft } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Conversation, Message, MessageCreate } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface ChatWidgetProps {
  currentUserId: string
  currentUserName: string
  onClose: () => void
}

export default function ChatWidget({ currentUserId, currentUserName, onClose }: ChatWidgetProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
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
      
      // Auto-select first conversation if none selected
      if (!selectedConversation && conversationsWithParticipants.length > 0) {
        setSelectedConversation(conversationsWithParticipants[0])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedConversation])

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
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isMinimized])

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageText.trim()) return

    const tempMessageId = `temp-${Date.now()}-${Math.random()}`
    const messageTextToSend = messageText.trim()
    
    // Optimistic update
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
      reply_to: null,
      reply_to_id: null
    }

    setMessages(prev => [...prev, optimisticMessage])
    setMessageText('')

    try {
      setSending(true)
      const messageData: MessageCreate = {
        message_text: messageTextToSend
      }
      await apiPost(`/api/chat/conversations/${selectedConversation.id}/messages`, messageData)
      await loadMessages(selectedConversation.id)
      await loadConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId))
      setMessageText(messageTextToSend)
      alert('Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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
    <div className="fixed bottom-6 right-6 z-50 w-80 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-[#0068ff] text-white rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedConversation && (
            <button
              onClick={() => setSelectedConversation(null)}
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
            onClick={() => setIsMinimized(true)}
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
      <div className="flex-1 overflow-hidden flex">
        {!selectedConversation ? (
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="text-center text-gray-500 py-4">Đang tải...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-4">Chưa có cuộc trò chuyện</div>
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
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">Chưa có tin nhắn</div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === currentUserId
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-[#0068ff] text-white rounded-tr-sm'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'
                          }`}
                        >
                          {!isOwn && (
                            <div className="text-xs font-semibold mb-1 opacity-80">
                              {message.sender_name || 'Unknown'}
                            </div>
                          )}
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {message.message_text}
                          </div>
                          {message.file_url && (
                            <div className="mt-2">
                              {message.message_type === 'image' ? (
                                <img
                                  src={message.file_url}
                                  alt={message.file_name || 'Image'}
                                  className="max-w-full max-h-32 rounded"
                                />
                              ) : (
                                <div className="flex items-center gap-2 text-xs">
                                  <Paperclip className="w-3 h-3" />
                                  <span className="truncate">{message.file_name || 'File'}</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: vi
                            })}
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
            <div className="border-t border-gray-200 p-2 bg-white">
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={() => {}}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  className="hidden"
                  onChange={() => {}}
                  accept="image/*"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Đính kèm file"
                >
                  <Paperclip className="w-4 h-4 text-gray-600" />
                </button>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0068ff] resize-none text-sm"
                  rows={1}
                  style={{ maxHeight: '100px' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className={`p-2 rounded-lg transition-colors ${
                    messageText.trim() && !sending
                      ? 'bg-[#0068ff] text-white hover:bg-[#0056d6]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Gửi (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

