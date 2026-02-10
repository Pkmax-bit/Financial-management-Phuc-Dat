'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import NotificationCenter from './NotificationCenter'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    try {
      setIsLoading(true)
      setHasError(false)
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        setUnreadCount(0)
        setHasError(false) // Don't show error for session issues
        return
      }
      
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
        // Chỉ log error nếu không phải lỗi "relation does not exist" hoặc RLS
        // Vì có thể bảng notifications chưa được tạo hoặc RLS chưa được setup
        const errorCode = (error as any)?.code
        const errorMessage = (error as any)?.message || String(error)
        
        // Bỏ qua lỗi nếu bảng không tồn tại hoặc RLS chưa setup
        if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('permission denied')) {
          console.warn('Notifications table may not exist or RLS not configured:', errorMessage)
          setUnreadCount(0)
          setHasError(false) // Don't show error UI for missing table
          return
        }
        
        console.error('Error fetching notifications from database:', {
          error,
          code: errorCode,
          message: errorMessage,
          details: (error as any)?.details,
          hint: (error as any)?.hint
        })
        setHasError(true)
        return
      }

      setUnreadCount(notifications?.length || 0)
      setHasError(false)
    } catch (error: any) {
      console.error('Unexpected error fetching unread count:', error)
      console.error('Error type:', typeof error)
      console.error('Error message:', error?.message)
      console.error('Error stack:', error?.stack)
      
      // Chỉ set error nếu không phải lỗi về missing table
      const errorMessage = error?.message || String(error)
      if (!errorMessage.includes('does not exist') && !errorMessage.includes('permission denied')) {
        setHasError(true)
      } else {
        setUnreadCount(0)
        setHasError(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Callback khi user bấm "Đánh dấu đã đọc": cập nhật số ngay (optimistic) rồi refetch để đồng bộ server
  const handleNotificationRead = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1))
    fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

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
        onNotificationRead={handleNotificationRead}
        onRefetchUnreadCount={fetchUnreadCount}
      />
    </>
  )
}
