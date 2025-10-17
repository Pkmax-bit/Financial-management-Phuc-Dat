'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Check, 
  X, 
  FileText, 
  Send, 
  Eye,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  entity_type?: string
  entity_id?: string
  is_read: boolean
  read_at?: string
  action_url?: string
  created_at: string
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('http://localhost:8000/api/sales/notifications', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError('Không thể tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`http://localhost:8000/api/sales/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote_created':
        return <FileText className="w-5 h-5 text-blue-500" />
      case 'quote_sent':
        return <Send className="w-5 h-5 text-green-500" />
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Thông Báo</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải thông báo...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">❌</div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchNotifications}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 transition-all duration-200 ${
                    notification.is_read
                      ? 'bg-gray-50 border-gray-300'
                      : 'bg-blue-50 border-blue-500 shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          notification.is_read ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(notification.created_at)}
                          </span>
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Đánh dấu đã đọc"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className={`mt-1 text-sm ${
                        notification.is_read ? 'text-gray-600' : 'text-gray-800'
                      }`}>
                        {notification.message}
                      </p>
                      
                      {notification.action_url && (
                        <div className="mt-3">
                          <a
                            href={notification.action_url}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Xem chi tiết
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {notifications.filter(n => !n.is_read).length} thông báo chưa đọc
            </span>
            <button
              onClick={fetchNotifications}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Làm mới
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
