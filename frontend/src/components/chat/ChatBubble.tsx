'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { useNewMessages } from '@/hooks/useNewMessages'
import { supabase } from '@/lib/supabase'
import ChatWidget from './ChatWidget'

interface ChatBubbleProps {
  currentUserId: string
}

export default function ChatBubble({ currentUserId }: ChatBubbleProps) {
  const pathname = usePathname()
  const [showWidget, setShowWidget] = useState(false)
  const [userName, setUserName] = useState('')
  const { unreadCount, hasNewMessages, latestMessage, markAsRead } = useNewMessages({
    currentUserId,
    enabled: !!currentUserId && pathname !== '/chat',
  })

  useEffect(() => {
    if (currentUserId) {
      loadUserName()
    }
  }, [currentUserId])

  const loadUserName = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', currentUserId)
        .single()

      if (!error && data) {
        setUserName(data.full_name || 'User')
      }
    } catch (error) {
      console.error('Error loading user name:', error)
    }
  }

  const handleClick = () => {
    if (showWidget) {
      setShowWidget(false)
    } else {
      markAsRead()
      setShowWidget(true)
    }
  }

  if (pathname === '/chat') {
    return null
  }

  return (
    <>
      {showWidget && (
        <ChatWidget
          currentUserId={currentUserId}
          currentUserName={userName}
          onClose={() => {
            setShowWidget(false)
            markAsRead()
          }}
        />
      )}
      
      {/* Chat Bubble Button - Always visible when widget is closed */}
      {!showWidget && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleClick}
            className="relative group bg-[#0068ff] hover:bg-[#0056d6] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            aria-label="Mở chat"
          >
            <MessageSquare className="w-6 h-6" />
            
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {latestMessage ? (
                <div>
                  <div className="font-semibold mb-1">Tin nhắn mới</div>
                  <div className="text-xs text-gray-300 truncate max-w-[200px]">
                    {latestMessage.message_text || 'Có tin nhắn mới'}
                  </div>
                </div>
              ) : (
                'Mở chat'
              )}
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>

          {/* Pulse animation ring */}
          {hasNewMessages && (
            <div className="absolute inset-0 rounded-full bg-[#0068ff] animate-ping opacity-20 pointer-events-none"></div>
          )}
        </div>
      )}
    </>
  )
}

