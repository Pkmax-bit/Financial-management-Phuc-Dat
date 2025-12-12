'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare, X, Plus, Users } from 'lucide-react'
import { useNewMessages } from '@/hooks/useNewMessages'
import { apiGet } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ChatWidget from './ChatWidget'
import EmployeeSelector from './EmployeeSelector'
import { Conversation } from '@/types/chat'

interface MultiChatBubblesProps {
  currentUserId: string
}

interface ChatBubbleState {
  conversationId: string
  conversationName: string
  avatar: string | null
  unreadCount: number
  isOpen: boolean
  isClosed: boolean // User manually closed this bubble
  isGroup?: boolean // Whether this is a group conversation
  lastMessagePreview?: string // Preview of the last message
}

export default function MultiChatBubbles({ currentUserId }: MultiChatBubblesProps) {
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [chatBubbles, setChatBubbles] = useState<ChatBubbleState[]>([])
  const [openWidgets, setOpenWidgets] = useState<Set<string>>(new Set())
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [userName, setUserName] = useState('')
  const { unreadCount, latestMessage, markAsRead } = useNewMessages({
    currentUserId,
    enabled: !!currentUserId && pathname !== '/chat',
  })

  // Load user name
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

  // Helper function to get avatar and group status from conversation data
  const getConversationAvatar = (convData: any, conv?: any): { avatar: string | null; isGroup: boolean } => {
    const isGroup = convData?.type === 'group' || conv?.type === 'group'
    
    if (isGroup) {
      // For group conversations, use group avatar_url
      return {
        avatar: convData?.avatar_url || conv?.avatar_url || null,
        isGroup: true
      }
    } else {
      // For direct conversations, find other participant's avatar
      if (convData?.participants && convData.participants.length > 0) {
        const otherParticipant = convData.participants.find(
          (p: any) => p.user_id !== currentUserId
        )
        return {
          avatar: otherParticipant?.user_avatar || convData.avatar_url || null,
          isGroup: false
        }
      }
      return {
        avatar: convData?.avatar_url || null,
        isGroup: false
      }
    }
  }

  // Load conversations and create bubbles
  const loadConversations = useCallback(async () => {
    try {
      const response = await apiGet('/api/chat/conversations')
      const conversationsList = response?.conversations || []
      setConversations(conversationsList)

      // Create bubbles for conversations with unread messages
      const newBubbles: ChatBubbleState[] = []
      
      for (const conv of conversationsList) {
        if (conv.unread_count && conv.unread_count > 0) {
          // Get conversation details for avatar
          let avatar: string | null = null
          let isGroup = false
          try {
            const convDetails = await apiGet(`/api/chat/conversations/${conv.id}`)
            const avatarData = getConversationAvatar(convDetails, conv)
            avatar = avatarData.avatar
            isGroup = avatarData.isGroup
          } catch (error) {
            console.error('Error loading conversation details:', error)
            // Fallback: use avatar_url from conversation list
            isGroup = conv.type === 'group'
            avatar = isGroup ? (conv.avatar_url || null) : null
          }

          newBubbles.push({
            conversationId: conv.id,
            conversationName: conv.name || 'Cuộc trò chuyện',
            avatar,
            unreadCount: conv.unread_count || 0,
            isOpen: false,
            isClosed: false,
            isGroup: isGroup, // Store group flag for rendering
            lastMessagePreview: conv.last_message_preview || undefined, // Store last message preview
          })
        }
      }

      // Update bubbles: keep existing closed state, add new ones, remove ones without unread
      setChatBubbles(prev => {
        const updated = [...prev]
        
        // Update existing bubbles
        newBubbles.forEach(newBubble => {
          const existing = updated.find(b => b.conversationId === newBubble.conversationId)
          if (existing) {
            // Update unread count and avatar, but keep isClosed state
            existing.unreadCount = newBubble.unreadCount
            existing.avatar = newBubble.avatar
            existing.conversationName = newBubble.conversationName
            existing.lastMessagePreview = newBubble.lastMessagePreview
            // If was closed but has new messages, show it again
            if (existing.isClosed && newBubble.unreadCount > 0) {
              existing.isClosed = false
            }
          } else {
            // Add new bubble
            updated.push(newBubble)
          }
        })

        // Remove bubbles for conversations without unread (but keep if manually opened)
        return updated.filter(b => {
          const hasUnread = newBubbles.some(nb => nb.conversationId === b.conversationId)
          return hasUnread || b.isOpen
        })
      })
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }, [currentUserId])

  // Load conversations periodically
  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [loadConversations])

  // Update bubbles when new message arrives
  useEffect(() => {
    if (latestMessage) {
      loadConversations()
    }
  }, [latestMessage, loadConversations])

  const handleBubbleClick = (conversationId: string) => {
    setOpenWidgets(prev => {
      const newSet = new Set(prev)
      // If widget is already open, just bring it to front
      if (newSet.has(conversationId)) {
        // Remove and re-add to bring to front
        newSet.delete(conversationId)
        newSet.add(conversationId)
        return newSet
      }
      
      // If we already have 2 widgets open, remove the oldest one
      if (newSet.size >= 2) {
        const widgetsArray = Array.from(newSet)
        newSet.delete(widgetsArray[0]) // Remove oldest widget
      }
      
      // Add new widget
      newSet.add(conversationId)
      return newSet
    })
    setChatBubbles(prev =>
      prev.map(b =>
        b.conversationId === conversationId ? { ...b, isOpen: true, isClosed: false } : b
      )
    )
    markAsRead()
  }

  const handleCloseBubble = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Close widget but keep bubble visible
    setOpenWidgets(prev => {
      const newSet = new Set(prev)
      newSet.delete(conversationId)
      return newSet
    })
    setChatBubbles(prev =>
      prev.map(b =>
        b.conversationId === conversationId
          ? { ...b, isOpen: false }
          : b
      )
    )
  }

  const handleCloseWidget = (conversationId: string) => {
    // Close widget but keep bubble visible (don't set isClosed)
    setOpenWidgets(prev => {
      const newSet = new Set(prev)
      newSet.delete(conversationId)
      return newSet
    })
    setChatBubbles(prev =>
      prev.map(b =>
        b.conversationId === conversationId ? { ...b, isOpen: false } : b
      )
    )
    markAsRead()
  }

  // Ensure bubble exists for a conversation
  const ensureBubbleExists = useCallback(async (conversationId: string) => {
    setChatBubbles(prev => {
      const exists = prev.find(b => b.conversationId === conversationId)
      if (exists) {
        // Bubble exists, just make sure it's not closed
        return prev.map(b =>
          b.conversationId === conversationId ? { ...b, isClosed: false } : b
        )
      }
      
      // Bubble doesn't exist, load conversation details
      apiGet(`/api/chat/conversations/${conversationId}`)
        .then(convData => {
          const { avatar, isGroup } = getConversationAvatar(convData)
          
          setChatBubbles(prevBubbles => {
            const alreadyExists = prevBubbles.find(b => b.conversationId === conversationId)
            if (!alreadyExists) {
              return [...prevBubbles, {
                conversationId,
                conversationName: convData?.name || 'Cuộc trò chuyện',
                avatar,
                unreadCount: 0,
                isOpen: false,
                isClosed: false,
                isGroup,
                lastMessagePreview: convData?.last_message_preview || undefined
              }]
            }
            return prevBubbles
          })
        })
        .catch(error => {
          console.error('Error loading conversation:', error)
          // Still create bubble even if loading fails
          setChatBubbles(prevBubbles => {
            const exists = prevBubbles.find(b => b.conversationId === conversationId)
            if (!exists) {
              return [...prevBubbles, {
                conversationId,
                conversationName: 'Cuộc trò chuyện',
                avatar: null,
                unreadCount: 0,
                isOpen: false,
                isClosed: false,
                isGroup: false,
                lastMessagePreview: undefined
              }]
            }
            return prevBubbles
          })
        })
      
      return prev
    })
  }, [currentUserId])

  const handleMinimize = useCallback(async (conversationId: string) => {
    // Close widget but keep bubble visible
    setOpenWidgets(prev => {
      const newSet = new Set(prev)
      newSet.delete(conversationId)
      return newSet
    })

    // Check if bubble exists
    setChatBubbles(prev => {
      const exists = prev.find(b => b.conversationId === conversationId)
      if (exists) {
        // Bubble exists, just update it to be visible and not closed
        return prev.map(b =>
          b.conversationId === conversationId ? { ...b, isOpen: false, isClosed: false } : b
        )
      }
      return prev
    })

    // Load conversation details to get avatar (outside setState)
    try {
      const convData = await apiGet(`/api/chat/conversations/${conversationId}`)
      const { avatar, isGroup } = getConversationAvatar(convData)
      let conversationName = 'Cuộc trò chuyện'
      
      if (isGroup) {
        conversationName = convData?.name || 'Cuộc trò chuyện'
      } else {
        if (convData?.participants && convData.participants.length > 0) {
          const otherParticipant = convData.participants.find(
            (p: any) => p.user_id !== currentUserId
          )
          conversationName = otherParticipant?.user_name || convData.name || 'Cuộc trò chuyện'
        } else {
          conversationName = convData?.name || 'Cuộc trò chuyện'
        }
      }
      
      // Update or create bubble with avatar
      setChatBubbles(prevBubbles => {
        const exists = prevBubbles.find(b => b.conversationId === conversationId)
        if (exists) {
          // Update existing bubble with avatar if missing
          return prevBubbles.map(b =>
            b.conversationId === conversationId
              ? { ...b, avatar: b.avatar || avatar, conversationName, isOpen: false, isClosed: false, lastMessagePreview: convData?.last_message_preview || b.lastMessagePreview }
              : b
          )
        }
        
        // Create new bubble, but ensure we don't exceed 5 bubbles
        const nonClosedBubbles = prevBubbles.filter(b => !b.isClosed)
        const newBubbles = [...prevBubbles]
        
        if (nonClosedBubbles.length >= 5) {
          const oldestBubble = nonClosedBubbles.sort((a, b) => a.unreadCount - b.unreadCount)[0]
          const oldestIndex = newBubbles.findIndex(b => b.conversationId === oldestBubble.conversationId)
          if (oldestIndex !== -1) {
            newBubbles.splice(oldestIndex, 1)
          }
        }
        
        newBubbles.push({
          conversationId,
          conversationName,
          avatar,
          unreadCount: 0,
          isOpen: false,
          isClosed: false,
          isGroup,
          lastMessagePreview: convData?.last_message_preview || undefined
        })
        
        return newBubbles
      })
    } catch (error) {
      console.error('Error loading conversation:', error)
      // Still create bubble even if loading fails
      setChatBubbles(prevBubbles => {
        const exists = prevBubbles.find(b => b.conversationId === conversationId)
        if (!exists) {
          const nonClosedBubbles = prevBubbles.filter(b => !b.isClosed)
          const newBubbles = [...prevBubbles]
          
          if (nonClosedBubbles.length >= 5) {
            const oldestBubble = nonClosedBubbles.sort((a, b) => a.unreadCount - b.unreadCount)[0]
            const oldestIndex = newBubbles.findIndex(b => b.conversationId === oldestBubble.conversationId)
            if (oldestIndex !== -1) {
              newBubbles.splice(oldestIndex, 1)
            }
          }
          
          newBubbles.push({
            conversationId,
            conversationName: 'Cuộc trò chuyện',
            avatar: null,
            unreadCount: 0,
            isOpen: false,
            isClosed: false,
            isGroup: false
          })
          
          return newBubbles
        }
        return prevBubbles.map(b =>
          b.conversationId === conversationId ? { ...b, isOpen: false, isClosed: false } : b
        )
      })
    }
    
    markAsRead()
  }, [currentUserId])

  // Expose function to open chat widget from outside
  const openChatWidget = useCallback(async (conversationId: string) => {
    // Open widget immediately
    setOpenWidgets(prev => new Set(prev).add(conversationId))
    
    // Check if bubble already exists and update it
    setChatBubbles(prev => {
      const exists = prev.find(b => b.conversationId === conversationId)
      if (exists) {
        // Bubble exists, just open widget
        return prev.map(b =>
          b.conversationId === conversationId ? { ...b, isOpen: true, isClosed: false } : b
        )
      }
      
      // Bubble doesn't exist, load conversation details asynchronously
      apiGet(`/api/chat/conversations/${conversationId}`)
        .then(convData => {
          const { avatar, isGroup } = getConversationAvatar(convData)
          
          setChatBubbles(prevBubbles => {
            const alreadyExists = prevBubbles.find(b => b.conversationId === conversationId)
            if (!alreadyExists) {
              return [...prevBubbles, {
                conversationId,
                conversationName: convData?.name || 'Cuộc trò chuyện',
                avatar,
                unreadCount: 0,
                isOpen: true,
                isClosed: false,
                isGroup,
                lastMessagePreview: convData?.last_message_preview || undefined
              }]
            }
            return prevBubbles.map(b =>
              b.conversationId === conversationId ? { ...b, isOpen: true, isClosed: false } : b
            )
          })
        })
        .catch(error => {
          console.error('Error loading conversation:', error)
          // Still try to open widget even if loading fails
          setChatBubbles(prevBubbles => {
            const exists = prevBubbles.find(b => b.conversationId === conversationId)
            if (!exists) {
              return [...prevBubbles, {
                conversationId,
                conversationName: 'Cuộc trò chuyện',
                avatar: null,
                unreadCount: 0,
                isOpen: true,
                isClosed: false,
                isGroup: false,
                lastMessagePreview: undefined
              }]
            }
            return prevBubbles.map(b =>
              b.conversationId === conversationId ? { ...b, isOpen: true, isClosed: false } : b
            )
          })
        })
      
      return prev
    })
  }, [currentUserId])

  // Expose openChatWidget via window for external access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).openChatWidget = openChatWidget
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).openChatWidget
      }
    }
  }, [openChatWidget])

  const handleNewChatClick = () => {
    // Show dialog to select user
    setShowNewChatDialog(true)
  }

  const handleSelectUser = async (data: any, conversationId?: string) => {
    if (!conversationId) {
      console.error('No conversation ID provided')
      return
    }

    setShowNewChatDialog(false)

    // Load conversation details to get avatar
    try {
      const convData = await apiGet(`/api/chat/conversations/${conversationId}`)
      const { avatar, isGroup } = getConversationAvatar(convData)
      let conversationName = 'Cuộc trò chuyện'

      if (isGroup) {
        conversationName = convData?.name || 'Cuộc trò chuyện'
      } else {
        if (convData?.participants && convData.participants.length > 0) {
          const otherParticipant = convData.participants.find(
            (p: any) => p.user_id !== currentUserId
          )
          conversationName = otherParticipant?.user_name || data.full_name || convData.name || 'Cuộc trò chuyện'
        } else {
          conversationName = convData?.name || data.full_name || 'Cuộc trò chuyện'
        }
      }

      // Check if bubble already exists
      setChatBubbles(prev => {
        const exists = prev.find(b => b.conversationId === conversationId)
        if (exists) {
          // Bubble exists, just make sure it's visible
          return prev.map(b =>
            b.conversationId === conversationId
              ? { ...b, isOpen: true, isClosed: false, avatar, conversationName, isGroup, lastMessagePreview: convData?.last_message_preview || b.lastMessagePreview }
              : b
          )
        }

        // Create new bubble, but ensure we don't exceed 5 bubbles
        const nonClosedBubbles = prev.filter(b => !b.isClosed)
        const newBubbles = [...prev]

        // If we already have 5 non-closed bubbles, remove the oldest one
        if (nonClosedBubbles.length >= 5) {
          // Find the oldest bubble (lowest unread count or oldest by index)
          const oldestBubble = nonClosedBubbles.sort((a, b) => a.unreadCount - b.unreadCount)[0]
          const oldestIndex = newBubbles.findIndex(b => b.conversationId === oldestBubble.conversationId)
          if (oldestIndex !== -1) {
            newBubbles.splice(oldestIndex, 1)
          }
        }

        // Add new bubble
        newBubbles.push({
          conversationId,
          conversationName,
          avatar,
          unreadCount: 0,
          isOpen: true,
          isClosed: false,
          isGroup,
          lastMessagePreview: convData?.last_message_preview || undefined
        })

        return newBubbles
      })

      // Open widget for this conversation
      setOpenWidgets(prevWidgets => new Set(prevWidgets).add(conversationId))
    } catch (error) {
      console.error('Error loading conversation details:', error)
      // Still create bubble even if loading fails
      setChatBubbles(prev => {
        const exists = prev.find(b => b.conversationId === conversationId)
        if (exists) {
          return prev.map(b =>
            b.conversationId === conversationId
              ? { ...b, isOpen: true, isClosed: false }
              : b
          )
        }

        const nonClosedBubbles = prev.filter(b => !b.isClosed)
        const newBubbles = [...prev]

        if (nonClosedBubbles.length >= 5) {
          const oldestBubble = nonClosedBubbles.sort((a, b) => a.unreadCount - b.unreadCount)[0]
          const oldestIndex = newBubbles.findIndex(b => b.conversationId === oldestBubble.conversationId)
          if (oldestIndex !== -1) {
            newBubbles.splice(oldestIndex, 1)
          }
        }

        newBubbles.push({
          conversationId,
          conversationName: data.full_name || 'Cuộc trò chuyện',
          avatar: null,
          unreadCount: 0,
          isOpen: true,
          isClosed: false,
          isGroup: false,
          lastMessagePreview: undefined
        })

        return newBubbles
      })

      // Open widget for this conversation
      setOpenWidgets(prevWidgets => new Set(prevWidgets).add(conversationId))
    }
  }

  if (pathname === '/chat') {
    return null
  }

  // Filter bubbles: show only non-closed ones, max 5
  // Sort by unread count first, then take top 5
  const visibleBubbles = chatBubbles
    .filter(b => !b.isClosed)
    .sort((a, b) => b.unreadCount - a.unreadCount) // Sort by unread count (highest first)
    .slice(0, 5) // Take top 5

  // Expose getBubbleCount to window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).getBubbleCount = () => visibleBubbles.length
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).getBubbleCount
      }
    }
  }, [visibleBubbles.length])

  return (
    <>
      {/* Employee Selector Dialog */}
      {showNewChatDialog && (
        <EmployeeSelector
          currentUserId={currentUserId}
          onSelect={handleSelectUser}
          onClose={() => setShowNewChatDialog(false)}
        />
      )}

      {/* Render open widgets - Position them to avoid overlap, max 2 widgets */}
      {Array.from(openWidgets).slice(-2).reverse().map((conversationId, index) => {
        const bubble = chatBubbles.find(b => b.conversationId === conversationId)
        if (!bubble) return null

        return (
          <div
            key={conversationId}
            className="fixed"
            style={{
              bottom: `${24 + (index * 620)}px`, // 24px from bottom, 620px spacing between widgets
              right: '24px',
              zIndex: 50 + index, // Newer widgets (at bottom) have higher z-index
            }}
          >
            <ChatWidget
              currentUserId={currentUserId}
              currentUserName={userName}
              conversationId={conversationId}
              onClose={() => handleCloseWidget(conversationId)}
              onMinimize={() => handleMinimize(conversationId)}
            />
          </div>
        )
      })}

      {/* Chat Bubbles Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* New Chat Button */}
        <button
          onClick={handleNewChatClick}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group mb-3"
          aria-label="Chat mới"
          title="Chat mới"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Chat Bubbles - Show up to 5, stacked on top of each other */}
        {visibleBubbles.map((bubble, index) => (
          <div
            key={bubble.conversationId}
            className="relative animate-in slide-in-from-bottom-2 duration-300"
            style={{ 
              animationDelay: `${index * 50}ms`,
              marginBottom: index < visibleBubbles.length - 1 ? '-12px' : '0',
              zIndex: visibleBubbles.length - index // Newer bubbles on top
            }}
          >
            <button
              onClick={() => handleBubbleClick(bubble.conversationId)}
              className="relative group bg-[#0068ff] hover:bg-[#0056d6] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 overflow-hidden"
              aria-label={`Mở chat với ${bubble.conversationName}`}
            >
              {bubble.avatar ? (
                <img
                  src={bubble.avatar}
                  alt={bubble.conversationName}
                  className="w-6 h-6 rounded-full object-cover border-2 border-white/30"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const fallback = target.parentElement?.querySelector('.avatar-fallback')
                    if (fallback) {
                      fallback.classList.remove('hidden')
                    }
                  }}
                />
              ) : null}
              <div className={`w-6 h-6 rounded-full bg-white/20 flex items-center justify-center avatar-fallback ${bubble.avatar ? 'hidden' : ''}`}>
                {bubble.isGroup ? (
                  <Users className="w-4 h-4" />
                ) : bubble.conversationName ? (
                  <span className="text-xs font-semibold text-white">
                    {bubble.conversationName.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
              </div>

              {/* Unread badge */}
              {bubble.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse border-2 border-white shadow-lg">
                  {bubble.unreadCount > 99 ? '99+' : bubble.unreadCount}
                </span>
              )}

              {/* Close button - Half inside, half outside bubble */}
              <div
                onClick={(e) => handleCloseBubble(bubble.conversationId, e)}
                className="absolute top-0 left-0 bg-black hover:bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCloseBubble(bubble.conversationId, e as any)
                  }
                }}
                aria-label="Đóng"
                title="Đóng"
              >
                <X className="w-3 h-3" />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-xs">
                <div className="font-semibold mb-1 whitespace-nowrap">
                  {bubble.conversationName}
                </div>
                {bubble.lastMessagePreview && (
                  <div className="text-xs text-gray-300 mb-1 line-clamp-2 break-words">
                    {bubble.lastMessagePreview}
                  </div>
                )}
                {bubble.unreadCount > 0 && (
                  <div className="text-xs text-gray-400">
                    {bubble.unreadCount} tin nhắn mới
                  </div>
                )}
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </button>

            {/* Pulse animation for new messages */}
            {bubble.unreadCount > 0 && (
              <div className="absolute inset-0 rounded-full bg-[#0068ff] animate-ping opacity-20 pointer-events-none"></div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

