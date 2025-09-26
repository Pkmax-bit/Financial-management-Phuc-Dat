'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Mail,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Settings,
  Send,
  Eye,
  EyeOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  created_at: string
  data?: unknown
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showSystemAlertModal, setShowSystemAlertModal] = useState(false)
  const [user, setUser] = useState<unknown>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchNotifications()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (userData) {
          setUser(userData)
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read)
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter

    return matchesSearch && matchesFilter && matchesType
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'error':
        return 'border-l-red-500 bg-red-50'
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds)

      if (error) throw error

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Vừa xong'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`
    } else if (diffInHours < 48) {
      return 'Hôm qua'
    } else {
      return date.toLocaleDateString('vi-VN')
    }
  }

  const getStats = () => {
    const total = notifications.length
    const unread = notifications.filter(n => !n.read).length
    const read = total - unread

    return { total, unread, read }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user || undefined} onLogout={handleLogout} />

      {/* Main content */}
      <div className="pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Thông báo</h2>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Quản lý thông báo và cảnh báo hệ thống
                </p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowEmailModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Gửi email
                </button>
                <button 
                  onClick={() => setShowSystemAlertModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Cảnh báo hệ thống
                </button>
                <button 
                  onClick={markAllAsRead}
                  disabled={stats.unread === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Đánh dấu tất cả đã đọc
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng thông báo</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-500">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chưa đọc</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đã đọc</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.read}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm thông báo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả thông báo</option>
                  <option value="unread">Chưa đọc</option>
                  <option value="read">Đã đọc</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="info">Thông tin</option>
                  <option value="success">Thành công</option>
                  <option value="warning">Cảnh báo</option>
                  <option value="error">Lỗi</option>
                </select>

                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Bộ lọc khác
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Thông báo ({filteredNotifications.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Trung tâm thông báo của bạn
              </p>
            </div>
            
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy thông báo</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filter !== 'all' || typeFilter !== 'all'
                    ? 'Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc.'
                    : 'Bạn đã cập nhật tất cả! Không có thông báo mới.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <li key={notification.id}>
                    <div className={`px-4 py-4 border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'bg-white' : 'bg-gray-50'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Mới
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-gray-400 hover:text-green-600"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Send Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Gửi thông báo email</h3>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email người nhận</label>
                  <input
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tiêu đề email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nội dung</label>
                  <textarea
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Nội dung email"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2 inline" />
                  Gửi email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Alert Modal */}
      {showSystemAlertModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tạo cảnh báo hệ thống</h3>
                <button
                  onClick={() => setShowSystemAlertModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiêu đề cảnh báo</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tiêu đề cảnh báo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mức độ</label>
                  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="critical">Nghiêm trọng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nội dung</label>
                  <textarea
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Nội dung cảnh báo"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSystemAlertModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                  <AlertTriangle className="h-4 w-4 mr-2 inline" />
                  Gửi cảnh báo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}