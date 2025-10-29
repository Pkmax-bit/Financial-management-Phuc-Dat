'use client'

import { useState, useEffect } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import NotificationCenter from './NotificationCenter'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const fetchUnreadCount = async () => {
    try {
      setIsLoading(true)
      setHasError(false)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setUnreadCount(0)
        return
      }

      // Lấy dữ liệu trực tiếp từ bảng notifications trong database (giống trang thông báo)
      // RLS thường yêu cầu lọc theo user_id
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('id, is_read')
        .eq('is_read', false)
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error fetching notifications from database:', error)
        console.error('Error details:', {
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code
        })
        setHasError(true)
        return
      }

      setUnreadCount(notifications?.length || 0)
    } catch (error: any) {
      console.error('Error fetching unread count:', error)
      console.error('Error message:', error?.message)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 ${
          unreadCount > 0 ? 'animate-pulse' : ''
        } ${hasError ? 'text-red-500' : ''} ${isLoading ? 'opacity-50' : ''}`}
        title={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}${hasError ? ' - Lỗi tải' : ''}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        ) : (
          unreadCount > 0 ? (
            <BellRing className="w-4 h-4 text-blue-600" />
          ) : (
            <Bell className="w-4 h-4" />
          )
        )}
        
        {unreadCount > 0 && !isLoading && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {hasError && !isLoading && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
            !
          </span>
        )}
      </button>

      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        onNotificationRead={() => {
          // Refresh count when notification is marked as read
          fetchUnreadCount()
        }}
      />
    </>
  )
}
