'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { 
  Bell, 
  X, 
  FileText, 
  Send, 
  Eye,
  Clock,
  CheckCircle2,
  List,
  Users,
  CheckSquare,
  ListChecks
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  entity_type?: string
  entity_id?: string
  read: boolean
  read_at?: string
  action_url?: string
  created_at: string
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  onNotificationRead?: () => void
  onRefetchUnreadCount?: () => void
}

export default function NotificationCenter({ isOpen, onClose, onNotificationRead, onRefetchUnreadCount }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])


  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Lấy dữ liệu trực tiếp từ bảng notifications trong database (lọc theo user_id)
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications from database:', error)
        throw new Error('Failed to fetch notifications from database')
      }

      // Map database fields to frontend format
      const mappedNotifications = notifications?.map(notification => ({
        ...notification,
        read: notification.is_read || false,
        // Remove is_read field as we use 'read' in frontend
        ...(notification.is_read !== undefined && { is_read: undefined })
      })) || []

      setNotifications(mappedNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError('Không thể tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    // Optimistic: cập nhật UI ngay (card chuyển sang trạng thái đã đọc, badge giảm)
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true, read_at: new Date().toISOString() }
          : notif
      )
    )
    onNotificationRead?.()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error marking notification as read:', error)
        // Revert UI khi backend lỗi (RLS / quyền)
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: false, read_at: undefined } : notif
          )
        )
        onRefetchUnreadCount?.()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: false, read_at: undefined } : notif
        )
      )
      onRefetchUnreadCount?.()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote_created':
        return <FileText className="w-5 h-5 text-blue-500" />
      case 'quote_sent':
        return <Send className="w-5 h-5 text-green-500" />
      case 'added_to_team':
        return <Users className="w-5 h-5 text-indigo-500" />
      case 'task_assigned':
      case 'employee_assigned_to_task':
        return <CheckSquare className="w-5 h-5 text-amber-500" />
      case 'checklist_created':
      case 'checklist_updated':
      case 'checklist_deleted':
        return <ListChecks className="w-5 h-5 text-teal-500" />
      case 'checklist_item_created':
      case 'checklist_item_updated':
      case 'checklist_item_deleted':
        return <List className="w-5 h-5 text-violet-500" />
      case 'team_member_added':
        return <Users className="w-5 h-5 text-indigo-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Vừa xong'
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`
    } else {
      return date.toLocaleDateString('vi-VN')
    }
  }

  if (!isOpen || !mounted) return null

  const content = (
    <div 
      ref={dropdownRef}
      className="fixed top-16 right-4 z-[100] w-96 max-h-[80vh] overflow-hidden animate-in slide-in-from-top-2 duration-200"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-white bg-opacity-20 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Thông Báo</h2>
                <p className="text-blue-100 text-xs">
                  {notifications.filter(n => !n.read).length} chưa đọc
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <span className="mt-4 text-gray-600 font-medium">Đang tải thông báo...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không thể tải thông báo</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={fetchNotifications}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Thử lại
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có thông báo nào</h3>
              <p className="text-gray-600">Bạn sẽ nhận được thông báo khi có hoạt động mới</p>
            </div>
          ) : (() => {
            const unreadOnly = notifications.filter(n => !n.read)
            if (unreadOnly.length === 0) {
              return (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Không còn thông báo chưa đọc</h3>
                  <p className="text-sm text-gray-600 mb-4">Xem tất cả thông báo (đã đọc và chưa đọc) tại trang Thông báo.</p>
                  <Link
                    href="/notifications"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <List className="w-4 h-4" />
                    Mở trang Thông báo
                  </Link>
                </div>
              )
            }
            return (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1" style={{ minHeight: '240px' }}>
              {unreadOnly.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border border-blue-200 bg-blue-50/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-3 flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="p-1.5 rounded-lg bg-blue-100">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <h3 className="font-semibold text-sm truncate text-gray-900" title={notification.title}>
                        {notification.title}
                      </h3>
                      <p className="text-xs leading-snug line-clamp-2 text-gray-800" title={notification.message}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] text-gray-500 flex items-center shrink-0">
                          <Clock className="w-3 h-3 mr-0.5" />
                          {formatDate(notification.created_at)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                            title="Đánh dấu đã đọc"
                          >
                            <CheckCircle2 className="w-3 h-3 inline mr-0.5 align-middle" />
                            Đã đọc
                          </button>
                          {notification.action_url && (
                            <a
                              href={notification.action_url}
                              className="inline-flex items-center px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                            >
                              <Eye className="w-3 h-3 mr-0.5" />
                              Chi tiết
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )
          })()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {notifications.filter(n => !n.read).length} chưa đọc
              </span>
              <Link
                href="/notifications"
                onClick={onClose}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Xem tất cả
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                className="px-2 py-1 text-xs font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 rounded transition-colors"
              >
                Làm mới
              </button>
              <button
                onClick={onClose}
                className="px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
