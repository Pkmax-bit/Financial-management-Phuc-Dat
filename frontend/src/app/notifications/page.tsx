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
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  entity_type?: string
  entity_id?: string
  read: boolean
  read_at?: string
  action_url?: string
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showSystemAlertModal, setShowSystemAlertModal] = useState(false)
  const [showCreateNotificationModal, setShowCreateNotificationModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [employees, setEmployees] = useState<Array<{ id: string, user_id?: string | null, first_name?: string, last_name?: string, email?: string, role?: string }>>([])
  const [selectedEmployeeUserIds, setSelectedEmployeeUserIds] = useState<string[]>([])
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [user, setUser] = useState<unknown>(null)
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchNotifications()
    fetchEmployees()
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

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, 
          user_id, 
          first_name, 
          last_name, 
          email,
          users!inner(role)
        `)
        .order('first_name', { ascending: true })
      if (error) throw error
      
      // Flatten the data to include role from users table
      const flattenedData = (data || []).map(emp => ({
        ...emp,
        role: (emp as any).users?.role || 'employee'
      }))
      
      setEmployees(flattenedData)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleCreateNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim() || selectedEmployeeUserIds.length === 0) return
    try {
      setCreating(true)
      // Get session token for backend auth
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Create notifications for each selected employee
      for (const uid of selectedEmployeeUserIds) {
        const res = await fetch(getApiEndpoint('/api/notifications/notifications'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: uid,
            title: notifTitle,
            message: notifMessage,
            type: 'info'
          })
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Create notification failed: ${res.status} ${text}`)
        }
      }

      // Optionally send emails
      if (sendEmail) {
        for (const uid of selectedEmployeeUserIds) {
          const emp = employees.find(e => e.user_id === uid)
          if (emp?.email) {
            const emailRes = await fetch(getApiEndpoint('/api/notifications/notifications/email'), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                to_email: emp.email,
                subject: notifTitle,
                body: notifMessage, // Send plain text, template will handle formatting
                template: 'info' // Use info template for notifications
              })
            })
            if (!emailRes.ok) {
              const text = await emailRes.text()
              throw new Error(`Send email failed: ${emailRes.status} ${text}`)
            }
          }
        }
      }

      // Reset and refresh
      setShowCreateNotificationModal(false)
      setNotifTitle('')
      setNotifMessage('')
      setSelectedEmployeeUserIds([])
      setSendEmail(false)
      fetchNotifications()
    } catch (error) {
      console.error('Error creating notifications:', error)
    } finally {
      setCreating(false)
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
    <LayoutWithSidebar user={user || undefined} onLogout={handleLogout}>
      <div className="w-full">
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
                <p className="mt-1 text-sm text-black">
                  Quản lý thông báo và cảnh báo hệ thống
                </p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowCreateNotificationModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Tạo thông báo
                </button>
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
                  <p className="text-sm font-medium text-black">Tổng thông báo</p>
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
                  <p className="text-sm font-medium text-black">Chưa đọc</p>
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
                  <p className="text-sm font-medium text-black">Đã đọc</p>
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
                    <Search className="h-5 w-5 text-black" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm thông báo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-black font-medium placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black font-medium focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all" className="text-black font-medium">Tất cả thông báo</option>
                  <option value="unread" className="text-black font-medium">Chưa đọc</option>
                  <option value="read" className="text-black font-medium">Đã đọc</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black font-medium focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all" className="text-black font-medium">Tất cả loại</option>
                  <option value="info" className="text-black font-medium">Thông tin</option>
                  <option value="success" className="text-black font-medium">Thành công</option>
                  <option value="warning" className="text-black font-medium">Cảnh báo</option>
                  <option value="error" className="text-black font-medium">Lỗi</option>
                </select>

                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50">
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
              <p className="mt-1 max-w-2xl text-sm text-black">
                Trung tâm thông báo của bạn
              </p>
            </div>
            
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-black" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy thông báo</h3>
                <p className="mt-1 text-sm text-black">
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
                              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-black'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Mới
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-black">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-black">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-black hover:text-green-600"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-black hover:text-red-600"
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
        <div className="fixed inset-0 bg-black bg-opacity-30 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Gửi email thông báo</h3>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Đóng</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email người nhận
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="recipient@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tiêu đề email
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Nhập tiêu đề email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Nội dung
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 resize-none"
                  rows={5}
                  placeholder="Nhập nội dung email..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Gửi email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Notification Drawer (Right side, translucent, non-blocking) */}
      {showCreateNotificationModal && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="fixed right-0 top-0 h-full w-full max-w-md border-l border-gray-200 bg-white/95 backdrop-blur-sm shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Tạo thông báo hệ thống</h3>
              </div>
              <button
                onClick={() => setShowCreateNotificationModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Đóng"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto h-[calc(100%-80px)]">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Tiêu đề thông báo</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Nhập tiêu đề thông báo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nội dung thông báo</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 resize-none"
                  rows={4}
                  placeholder="Nhập nội dung thông báo..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Chọn nhân viên nhận</label>
                    <span className="text-xs text-gray-500">
                      {selectedEmployeeUserIds.length} / {employees.filter(emp => emp.user_id).length} nhân viên được chọn
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allUserIds = employees
                          .filter(emp => emp.user_id)
                          .map(emp => emp.user_id!)
                        setSelectedEmployeeUserIds(allUserIds)
                      }}
                      className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeUserIds([])}
                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                    >
                      Bỏ chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Select only employees with specific roles (admin, manager, etc.)
                        const managerUserIds = employees
                          .filter(emp => emp.user_id && (emp.role === 'admin' || emp.role === 'manager'))
                          .map(emp => emp.user_id!)
                        setSelectedEmployeeUserIds(managerUserIds)
                      }}
                      className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
                    >
                      Chọn quản lý
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Select only visible employees (after filtering)
                        const visibleUserIds = employees
                          .filter(emp => {
                            if (!employeeSearchTerm) return emp.user_id
                            const searchLower = employeeSearchTerm.toLowerCase()
                            const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim().toLowerCase()
                            const email = (emp.email || '').toLowerCase()
                            return emp.user_id && (name.includes(searchLower) || email.includes(searchLower))
                          })
                          .map(emp => emp.user_id!)
                        setSelectedEmployeeUserIds(visibleUserIds)
                      }}
                      className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors"
                    >
                      Chọn hiển thị
                    </button>
                  </div>
                </div>
                
                {/* Employee Search */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 font-medium placeholder-gray-500"
                    placeholder="Tìm kiếm nhân viên..."
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg divide-y">
                  {employees
                    .filter(emp => {
                      if (!employeeSearchTerm) return true
                      const searchLower = employeeSearchTerm.toLowerCase()
                      const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim().toLowerCase()
                      const email = (emp.email || '').toLowerCase()
                      return name.includes(searchLower) || email.includes(searchLower)
                    })
                    .map(emp => {
                    const label = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || emp.id
                    const hasUser = Boolean(emp.user_id)
                    const checked = emp.user_id ? selectedEmployeeUserIds.includes(emp.user_id) : false
                    return (
                      <label key={emp.id} className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                        checked ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                      } ${!hasUser ? 'opacity-50' : ''}`}>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={checked}
                            disabled={!hasUser}
                            onChange={(e) => {
                              if (!emp.user_id) return
                              if (e.target.checked) setSelectedEmployeeUserIds(prev => [...prev, emp.user_id!])
                              else setSelectedEmployeeUserIds(prev => prev.filter(id => id !== emp.user_id))
                            }}
                          />
                          <span className={`ml-3 ${checked ? 'font-medium text-blue-900' : 'text-black'}`}>{label}</span>
                        </div>
                        <span className={`text-xs ${checked ? 'text-blue-600' : 'text-black'}`}>
                          {emp.email}{!hasUser ? ' (chưa liên kết tài khoản)' : ''}
                        </span>
                      </label>
                    )
                  })}
                  {employees.length === 0 && (
                    <div className="px-3 py-4 text-sm text-black">Không có nhân viên</div>
                  )}
                </div>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-black">Gửi kèm email (dùng cùng tiêu đề và nội dung)</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateNotificationModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateNotification}
                  disabled={creating || !notifTitle.trim() || !notifMessage.trim() || selectedEmployeeUserIds.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {creating ? 'Đang tạo...' : 'Tạo thông báo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* System Alert Modal */}
      {showSystemAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Tạo cảnh báo hệ thống</h3>
              </div>
              <button
                onClick={() => setShowSystemAlertModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Đóng</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Tiêu đề cảnh báo</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Nhập tiêu đề cảnh báo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Mức độ cảnh báo</label>
                <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900">
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="critical">Nghiêm trọng</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nội dung cảnh báo</label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500 resize-none"
                  rows={4}
                  placeholder="Nhập nội dung cảnh báo..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowSystemAlertModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Gửi cảnh báo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutWithSidebar>
  )
}