'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  CheckCircle, 
  X, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  User, 
  Calendar,
  Filter,
  Search,
  Send,
  Bell,
  Eye,
  Edit
} from 'lucide-react'

type Feedback = {
  id: string
  title: string
  content: string
  category: 'bug' | 'idea' | 'uiux' | 'performance' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_by: string
  created_by_name?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  resolved_by?: string
  admin_notes?: string
}

const categoryIcons = {
  bug: <AlertTriangle className="h-4 w-4" />,
  idea: <MessageSquare className="h-4 w-4" />,
  uiux: <Edit className="h-4 w-4" />,
  performance: <Clock className="h-4 w-4" />,
  other: <MessageSquare className="h-4 w-4" />
}

const categoryLabels = {
  bug: 'Báo lỗi',
  idea: 'Ý tưởng',
  uiux: 'Giao diện',
  performance: 'Hiệu năng',
  other: 'Khác'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const statusColors = {
  open: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800'
}

export default function FeedbackManagementTab() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/feedback/system`, {
        headers: { ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }
      })
      if (!res.ok) throw new Error('Failed to load system feedbacks')
      const data = await res.json()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let filteredItems = items

    // Search filter
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      filteredItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(s) || 
        item.content.toLowerCase().includes(s) ||
        item.created_by_name?.toLowerCase().includes(s)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filteredItems = filteredItems.filter(item => item.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filteredItems = filteredItems.filter(item => item.category === categoryFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filteredItems = filteredItems.filter(item => item.priority === priorityFilter)
    }

    return filteredItems
  }, [items, search, statusFilter, categoryFilter, priorityFilter])

  const handleResolve = async () => {
    if (!selectedFeedback) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const res = await fetch(`/api/feedback/system/${selectedFeedback.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          admin_notes: adminNotes,
          notification_message: notificationMessage
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(`Failed to resolve feedback: ${res.status} ${errorData.detail || res.statusText}`)
      }

      const result = await res.json()
      console.log('Feedback resolved successfully:', result)

      // Show success notification
      setSuccessMessage('✅ Góp ý đã được xử lý thành công!\n\nThông báo đã được gửi đến tất cả người dùng trong hệ thống.')
      setShowSuccessNotification(true)
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        setShowSuccessNotification(false)
      }, 5000)

      await load()
      setShowResolveDialog(false)
      setSelectedFeedback(null)
      setAdminNotes('')
      setNotificationMessage('')
    } catch (error) {
      console.error('Error resolving feedback:', error)
      
      // Show more specific error messages
      let errorMessage = 'Lỗi không xác định'
      
      if (error.message.includes('No authentication token')) {
        errorMessage = 'Bạn cần đăng nhập lại để thực hiện thao tác này'
      } else if (error.message.includes('403')) {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này (chỉ admin/manager)'
      } else if (error.message.includes('404')) {
        errorMessage = 'Không tìm thấy góp ý này'
      } else if (error.message.includes('500')) {
        errorMessage = 'Lỗi server, vui lòng thử lại sau'
      } else {
        errorMessage = `Lỗi khi xử lý góp ý: ${error.message}`
      }
      
      alert(errorMessage)
    }
  }

  const handleClose = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const res = await fetch(`/api/feedback/system/${id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(`Failed to close feedback: ${res.status} ${errorData.detail || res.statusText}`)
      }

      const result = await res.json()
      console.log('Feedback closed successfully:', result)

      // Show success notification
      setSuccessMessage('✅ Góp ý đã được đóng thành công!')
      setShowSuccessNotification(true)
      
      // Auto hide after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false)
      }, 3000)

      await load()
    } catch (error) {
      console.error('Error closing feedback:', error)
      
      // Show more specific error messages
      let errorMessage = 'Lỗi không xác định'
      
      if (error.message.includes('No authentication token')) {
        errorMessage = 'Bạn cần đăng nhập lại để thực hiện thao tác này'
      } else if (error.message.includes('403')) {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này (chỉ admin/manager)'
      } else if (error.message.includes('404')) {
        errorMessage = 'Không tìm thấy góp ý này'
      } else if (error.message.includes('500')) {
        errorMessage = 'Lỗi server, vui lòng thử lại sau'
      } else {
        errorMessage = `Lỗi khi đóng góp ý: ${error.message}`
      }
      
      alert(errorMessage)
    }
  }

  const openResolveDialog = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setAdminNotes(feedback.admin_notes || '')
    setNotificationMessage(`Góp ý "${feedback.title}" đã được xử lý. Cảm ơn bạn đã đóng góp!`)
    setShowResolveDialog(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-black">Quản lý góp ý hệ thống</h2>
            <p className="text-gray-800">Xem và xử lý góp ý từ nhân viên</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{items.filter(i => i.status === 'open').length}</div>
              <div className="text-sm font-medium text-black">Chờ xử lý</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{items.filter(i => i.status === 'resolved').length}</div>
              <div className="text-sm font-medium text-black">Đã xử lý</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm góp ý..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium placeholder-gray-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
          >
            <option value="all" className="text-black font-medium">Tất cả trạng thái</option>
            <option value="open" className="text-black font-medium">Mở</option>
            <option value="in_progress" className="text-black font-medium">Đang xử lý</option>
            <option value="resolved" className="text-black font-medium">Đã xử lý</option>
            <option value="closed" className="text-black font-medium">Đã đóng</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
          >
            <option value="all" className="text-black font-medium">Tất cả danh mục</option>
            <option value="bug" className="text-black font-medium">Báo lỗi</option>
            <option value="idea" className="text-black font-medium">Ý tưởng</option>
            <option value="uiux" className="text-black font-medium">Giao diện</option>
            <option value="performance" className="text-black font-medium">Hiệu năng</option>
            <option value="other" className="text-black font-medium">Khác</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
          >
            <option value="all" className="text-black font-medium">Tất cả ưu tiên</option>
            <option value="low" className="text-black font-medium">Thấp</option>
            <option value="medium" className="text-black font-medium">Trung bình</option>
            <option value="high" className="text-black font-medium">Cao</option>
            <option value="urgent" className="text-black font-medium">Khẩn cấp</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {categoryIcons[item.category]}
                         <span className="text-sm font-medium text-black">
                           {categoryLabels[item.category]}
                         </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[item.priority]}`}>
                        {item.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-black mb-2">{item.title}</h3>
                    <p className="text-gray-800 mb-4 line-clamp-3">{item.content}</p>

                     <div className="flex items-center gap-4 text-sm text-black">
                       <div className="flex items-center gap-1">
                         <User className="h-4 w-4" />
                         <span className="font-medium">{item.created_by_name || 'Ẩn danh'}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <Calendar className="h-4 w-4" />
                         <span className="font-medium">{formatDate(item.created_at)}</span>
                       </div>
                     </div>

                    {item.admin_notes && (
                       <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                         <p className="text-sm font-bold text-black mb-1">Ghi chú admin:</p>
                         <p className="text-sm font-medium text-black">{item.admin_notes}</p>
                       </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {item.status === 'open' && (
                      <button
                        onClick={() => openResolveDialog(item)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Xử lý
                      </button>
                    )}
                    {item.status === 'resolved' && (
                      <button
                        onClick={() => handleClose(item.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        <X className="h-4 w-4" />
                        Đóng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

             {filtered.length === 0 && (
               <div className="text-center py-12">
                 <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                 <p className="text-black font-medium">Không có góp ý nào</p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Resolve Dialog */}
      {showResolveDialog && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-end justify-end">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-200 border-l-4 border-l-green-500">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-black">
                  Xử lý góp ý: {selectedFeedback.title}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Ghi chú admin
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-600"
                    placeholder="Nhập ghi chú về cách xử lý góp ý này..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Thông báo cho tất cả mọi người
                  </label>
                  <textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-600"
                    placeholder="Thông báo sẽ được gửi đến tất cả người dùng trong hệ thống..."
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    💡 Thông báo này sẽ được gửi đến tất cả người dùng trong hệ thống
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowResolveDialog(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-black font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </button>
                <button
                  onClick={handleResolve}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  Xác nhận và thông báo cho tất cả
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 whitespace-pre-line">
                  {successMessage}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowSuccessNotification(false)}
                  className="inline-flex text-green-400 hover:text-green-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
