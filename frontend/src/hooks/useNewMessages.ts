import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { apiGet } from '@/lib/api'
import { Message } from '@/types/chat'

interface UseNewMessagesOptions {
  currentUserId: string
  enabled?: boolean
}

export function useNewMessages({ currentUserId, enabled = true }: UseNewMessagesOptions) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestMessage, setLatestMessage] = useState<Message | null>(null)
  const [hasNewMessages, setHasNewMessages] = useState(false)

  // Load initial unread count
  const loadUnreadCount = useCallback(async () => {
    if (!currentUserId || !enabled) return

    try {
      const response = await apiGet('/api/chat/conversations')
      const conversations = response?.conversations || []
      const totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0)
      setUnreadCount(totalUnread)
    } catch (error) {
      console.error('Error in loadUnreadCount:', error)
    }
  }, [currentUserId, enabled])

  useEffect(() => {
    if (!currentUserId || !enabled) return

    loadUnreadCount()

    // Subscribe to all new messages for this user
    const channel = supabase
      .channel('new-messages-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
        },
        async (payload) => {
          const newMessage = payload.new as any
          
          // Only process if message is not from current user
          if (newMessage.sender_id !== currentUserId) {
            // Check if user is a participant in this conversation
            const { data: participants, error } = await supabase
              .from('internal_conversation_participants')
              .select('user_id')
              .eq('conversation_id', newMessage.conversation_id)
              .eq('user_id', currentUserId)

            if (!error && participants && participants.length > 0) {
              setHasNewMessages(true)
              setLatestMessage(newMessage as Message)
              
              // Update unread count
              await loadUnreadCount()
              
              // Get conversation details for notification
              try {
                const convResponse = await apiGet(`/api/chat/conversations/${newMessage.conversation_id}`)
                const conversation = convResponse
                const conversationName = conversation?.name || 'Cuộc trò chuyện'
                const senderName = newMessage.sender_name || 'Người dùng'
                
                // Show browser notification if permission granted
                if ('Notification' in window && Notification.permission === 'granted') {
                  const notificationTitle = conversation?.type === 'group' 
                    ? `${senderName} trong ${conversationName}`
                    : senderName
                  
                  new Notification(notificationTitle, {
                    body: newMessage.message_text || (newMessage.file_url ? 'Đã gửi file' : 'Có tin nhắn mới'),
                    icon: '/favicon.ico',
                    tag: `message-${newMessage.id}`,
                    badge: '/favicon.ico',
                    requireInteraction: false,
                  })
                }
              } catch (error) {
                // Fallback notification if can't get conversation details
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Tin nhắn mới', {
                    body: newMessage.message_text || 'Có tin nhắn mới',
                    icon: '/favicon.ico',
                    tag: `message-${newMessage.id}`,
                  })
                }
              }
            }
          }
        }
      )
      .subscribe()

    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, enabled, loadUnreadCount])

  const markAsRead = useCallback(() => {
    setHasNewMessages(false)
    setLatestMessage(null)
  }, [])

  return {
    unreadCount,
    hasNewMessages,
    latestMessage,
    markAsRead,
    refreshUnreadCount: loadUnreadCount,
  }
}

