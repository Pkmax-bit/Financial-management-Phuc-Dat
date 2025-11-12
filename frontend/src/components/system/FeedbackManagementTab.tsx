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
  Edit,
  Image as ImageIcon,
  FileText,
  Maximize2
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
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
    uploaded_at: string
    path: string
  }>
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
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  open: '🔵 Mở',
  in_progress: '🟡 Đang xử lý',
  resolved: '🟢 Đã xử lý',
  closed: '⚫ Đóng'
}

const priorityLabels = {
  low: '🟢 Thấp',
  medium: '🟡 Trung bình',
  high: '🟠 Cao',
  urgent: '🔴 Nghiêm trọng'
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [replies, setReplies] = useState<Record<string, any[]>>({})
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyFiles, setReplyFiles] = useState<Record<string, File[]>>({})
  const [uploadingReplyAttachments, setUploadingReplyAttachments] = useState<Record<string, boolean>>({})
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [editReplyContent, setEditReplyContent] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }, [search, statusFilter, categoryFilter, priorityFilter])

  const loadReplies = async (feedbackId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/feedback/system/${feedbackId}/replies`, {
        headers: { ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }
      })
      if (!res.ok) throw new Error('Failed to load replies')
      const data = await res.json()
      setReplies(prev => ({ ...prev, [feedbackId]: data }))
    } catch (error) {
      console.error('Error loading replies:', error)
    }
  }

  const toggleReplies = (feedbackId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(feedbackId)) {
      newExpanded.delete(feedbackId)
    } else {
      newExpanded.add(feedbackId)
      if (!replies[feedbackId]) {
        loadReplies(feedbackId)
      }
    }
    setExpandedReplies(newExpanded)
  }

  const handleReply = async (feedbackId: string, parentReplyId: string | null = null) => {
    const content = parentReplyId ? replyText.trim() : replyContent[feedbackId]?.trim()
    if (!content) {
      alert('Vui lòng nhập nội dung phản hồi')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token')
      }

      // Upload attachments if any
      let attachments: any[] = []
      const replyKey = parentReplyId ? `reply-${parentReplyId}` : `top-${feedbackId}`
      const files = replyFiles[replyKey] || []
      
      if (files.length > 0) {
        setUploadingReplyAttachments(prev => ({ ...prev, [replyKey]: true }))
        try {
          // Upload files through backend API to avoid RLS issues
          const uploadPromises = files.map(async (file) => {
            try {
              const formData = new FormData()
              formData.append('file', file)
              
              const uploadRes = await fetch(`/api/uploads/SystemFeedbacks/${feedbackId}/replies`, {
                method: 'POST',
                headers: {
                  ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: formData
              })
              
              if (!uploadRes.ok) {
                const errorData = await uploadRes.json().catch(() => ({}))
                throw new Error(errorData.detail || `Upload failed: ${uploadRes.status}`)
              }
              
              const uploadResult = await uploadRes.json()
              
              return {
                id: uploadResult.id,
                name: uploadResult.name,
                url: uploadResult.url,
                type: uploadResult.type,
                size: uploadResult.size,
                uploaded_at: uploadResult.uploaded_at,
                path: uploadResult.path
              }
            } catch (error) {
              console.error('Error uploading attachment:', error)
              return null
            }
          })
          
          const results = await Promise.all(uploadPromises)
          attachments = results.filter(r => r !== null)
        } finally {
          setUploadingReplyAttachments(prev => ({ ...prev, [replyKey]: false }))
        }
      }

      const res = await fetch(`/api/feedback/system/${feedbackId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          content,
          parent_reply_id: parentReplyId || undefined,
          attachments: attachments.length > 0 ? attachments : undefined
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to create reply')
      }

      // Reload replies to get the tree structure
      await loadReplies(feedbackId)
      
      if (parentReplyId) {
        setReplyText('')
        setReplyingTo(null)
        setReplyFiles(prev => {
          const newState = { ...prev }
          delete newState[replyKey]
          return newState
        })
      } else {
        setReplyContent(prev => ({ ...prev, [feedbackId]: '' }))
        setReplyFiles(prev => {
          const newState = { ...prev }
          delete newState[replyKey]
          return newState
        })
      }
    } catch (error) {
      console.error('Error creating reply:', error)
      alert(error instanceof Error ? error.message : 'Lỗi khi tạo phản hồi')
    }
  }

  const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>, replyKey: string) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const validFiles = files.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} quá lớn. Kích thước tối đa là 10MB.`)
          return false
        }
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} không phải là hình ảnh. Chỉ hỗ trợ hình ảnh.`)
          return false
        }
        return true
      })
      setReplyFiles(prev => ({
        ...prev,
        [replyKey]: [...(prev[replyKey] || []), ...validFiles]
      }))
    }
  }

  const removeReplyFile = (replyKey: string, index: number) => {
    setReplyFiles(prev => ({
      ...prev,
      [replyKey]: (prev[replyKey] || []).filter((_, i) => i !== index)
    }))
  }

  const handleDeleteReply = async (feedbackId: string, replyId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token')
      }

      const res = await fetch(`/api/feedback/system/${feedbackId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete reply')
      }

      await loadReplies(feedbackId)
    } catch (error) {
      console.error('Error deleting reply:', error)
      alert(error instanceof Error ? error.message : 'Lỗi khi xóa phản hồi')
    }
  }

  const handleEditReply = async (feedbackId: string, replyId: string) => {
    const content = editReplyContent[replyId]?.trim()
    if (!content) {
      alert('Vui lòng nhập nội dung phản hồi')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token')
      }

      const res = await fetch(`/api/feedback/system/${feedbackId}/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ content })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to update reply')
      }

      await loadReplies(feedbackId)
      setEditingReply(null)
      setEditReplyContent(prev => {
        const newState = { ...prev }
        delete newState[replyId]
        return newState
      })
    } catch (error) {
      console.error('Error updating reply:', error)
      alert(error instanceof Error ? error.message : 'Lỗi khi cập nhật phản hồi')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInSeconds < 60) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    if (diffInDays === 1) return 'Hôm qua'
    if (diffInDays < 7) return `${diffInDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  // Recursive component to render threaded replies (giống CompactComments)
  const ReplyItem = ({ reply, feedbackId, depth = 0 }: { reply: any, feedbackId: string, depth?: number }) => {
    const isReplying = replyingTo === reply.id
    const isEditing = editingReply === reply.id
    
    return (
      <div key={reply.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className={`w-8 h-8 bg-gradient-to-br ${
            depth === 0 ? 'from-blue-500 to-purple-600' : 
            depth === 1 ? 'from-green-500 to-teal-600' : 
            'from-orange-500 to-red-600'
          } rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
            {(reply.replied_by_name || 'Admin').charAt(0)}
          </div>
          
          {/* Comment Content */}
          <div className="flex-1">
            {isEditing ? (
              <div className="mb-3">
                <textarea
                  value={editReplyContent[reply.id] || ''}
                  onChange={(e) => setEditReplyContent(prev => ({ ...prev, [reply.id]: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black placeholder-gray-600 mb-2"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingReply(null)
                      setEditReplyContent(prev => {
                        const newState = { ...prev }
                        delete newState[reply.id]
                        return newState
                      })
                    }}
                    className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleEditReply(feedbackId, reply.id)}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    Lưu
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-xl px-3 py-2 max-w-md shadow-sm border border-gray-100">
                  <div className="font-semibold text-xs text-gray-900 mb-1">{reply.replied_by_name || 'Admin'}</div>
                  <div className="text-xs text-gray-800 leading-relaxed">{reply.content}</div>
                </div>
                
                {reply.attachments && reply.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 mb-3">
                    {reply.attachments.map((attachment: any) => (
                      attachment.type === 'image' ? (
                        <img
                          key={attachment.id}
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-16 h-16 object-cover rounded border border-gray-300 cursor-pointer"
                          onClick={() => setSelectedImage(attachment.url)}
                        />
                      ) : (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <FileText className="h-3 w-3" />
                          {attachment.name}
                        </a>
                      )
                    ))}
                  </div>
                )}
                
                {/* Comment Actions */}
                <div className="flex items-center gap-3 mt-1 ml-3">
                  <button 
                    onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                    className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
                  >
                    💬 Trả lời
                  </button>
                  <button
                    onClick={() => {
                      setEditingReply(reply.id)
                      setEditReplyContent(prev => ({ ...prev, [reply.id]: reply.content }))
                    }}
                    className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteReply(feedbackId, reply.id)}
                    className="text-xs text-gray-600 hover:text-red-600 font-medium hover:bg-red-50 px-2 py-1 rounded-full transition-colors"
                  >
                    🗑️ Xóa
                  </button>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(reply.created_at)}
                  </span>
                </div>
              </>
            )}
            
            {/* Reply Form */}
            {isReplying && (() => {
              const replyKey = `reply-${reply.id}`
              const currentFiles = replyFiles[replyKey] || []
              const isUploading = uploadingReplyAttachments[replyKey] || false
              return (
                <div className="mt-3 ml-11">
                  <form onSubmit={(e) => { e.preventDefault(); handleReply(feedbackId, reply.id); }} className="space-y-2">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full px-3 py-2 border border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-300 focus-within:shadow-md transition-all duration-200">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Trả lời..."
                            className="w-full bg-transparent text-xs outline-none placeholder-blue-400 text-black font-medium"
                            autoFocus
                            disabled={isUploading}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!replyText.trim() || isUploading}
                        className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {isUploading ? '⏳' : '📤'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { 
                          setReplyingTo(null)
                          setReplyText('')
                          setReplyFiles(prev => {
                            const newState = { ...prev }
                            delete newState[replyKey]
                            return newState
                          })
                        }}
                        className="px-3 py-2 bg-gray-500 text-white rounded-full text-xs font-semibold hover:bg-gray-600 transition-all duration-200"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="ml-8 flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleReplyFileSelect(e, replyKey)}
                        className="hidden"
                        id={`reply-image-${replyKey}`}
                        disabled={isUploading}
                        multiple
                      />
                      <label
                        htmlFor={`reply-image-${replyKey}`}
                        className="text-xs text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Thêm hình
                      </label>
                      {currentFiles.length > 0 && (
                        <div className="flex items-center gap-1">
                          {currentFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs">
                              <span className="text-gray-600 truncate max-w-[80px]">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeReplyFile(replyKey, index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              )
            })()}
          </div>
        </div>
        
        {/* Nested Replies */}
        {reply.children && reply.children.length > 0 && (
          <div className="mt-3 space-y-3">
            {reply.children.map((child: any) => (
              <ReplyItem key={child.id} reply={child} feedbackId={feedbackId} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

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
      
      // Load replies count for all feedbacks
      if (data && data.length > 0) {
        const repliesPromises = data.map(async (item: Feedback) => {
          try {
            const repliesRes = await fetch(`/api/feedback/system/${item.id}/replies`, {
              headers: { ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }
            })
            if (repliesRes.ok) {
              const repliesData = await repliesRes.json()
              return { feedbackId: item.id, replies: repliesData }
            }
          } catch (error) {
            console.error(`Error loading replies for feedback ${item.id}:`, error)
          }
          return null
        })
        
        const repliesResults = await Promise.all(repliesPromises)
        const repliesMap: Record<string, any[]> = {}
        repliesResults.forEach(result => {
          if (result) {
            repliesMap[result.feedbackId] = result.replies
          }
        })
        setReplies(repliesMap)
      }
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

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filtered.slice(startIndex, endIndex)

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
          <>
            <div className="divide-y divide-gray-200">
              {paginatedItems.map((item) => (
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
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[item.priority]}`}>
                        {priorityLabels[item.priority]}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-black mb-2">{item.title}</h3>
                    <p className="text-gray-800 mb-4 line-clamp-3">{item.content}</p>

                    {/* Attachments Gallery */}
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Hình ảnh/Tài liệu đính kèm ({item.attachments.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.attachments.map((attachment) => (
                            <div key={attachment.id} className="relative group">
                              {attachment.type === 'image' ? (
                                <div
                                  onClick={() => setSelectedImage(attachment.url)}
                                  className="cursor-pointer relative"
                                >
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-opacity flex items-center justify-center">
                                    <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all shadow-sm hover:shadow-md min-w-[96px]"
                                >
                                  <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                                  <p className="text-xs text-gray-700 truncate text-center max-w-[80px]">
                                    {attachment.name}
                                  </p>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

                    {/* Replies Section */}
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <button
                        onClick={() => toggleReplies(item.id)}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-3"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Phản hồi ({replies[item.id]?.length || 0})</span>
                        {expandedReplies.has(item.id) ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>

                      {expandedReplies.has(item.id) && (
                        <div className="space-y-4">
                          {/* Existing Replies (Threaded) */}
                          {replies[item.id] && replies[item.id].length > 0 && (
                            <div className="space-y-3">
                              {replies[item.id].map((reply) => (
                                <ReplyItem key={reply.id} reply={reply} feedbackId={item.id} />
                              ))}
                            </div>
                          )}

                          {/* Reply Form (Top-level) - Giống CompactComments */}
                          {(() => {
                            const replyKey = `top-${item.id}`
                            const currentFiles = replyFiles[replyKey] || []
                            const isUploading = uploadingReplyAttachments[replyKey] || false
                            return (
                              <form onSubmit={(e) => { e.preventDefault(); handleReply(item.id, null); }} className="space-y-2">
                                <div className="flex gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    👤
                                  </div>
                                  <div className="flex-1">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full px-3 py-2 border border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-300 focus-within:shadow-md transition-all duration-200">
                                      <input
                                        type="text"
                                        value={replyContent[item.id] || ''}
                                        onChange={(e) => setReplyContent(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        placeholder="Viết bình luận..."
                                        className="w-full bg-transparent text-xs outline-none placeholder-blue-400 text-black font-medium"
                                        disabled={isUploading}
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="submit"
                                    disabled={!replyContent[item.id]?.trim() || isUploading}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
                                  >
                                    {isUploading ? '⏳' : '📤'}
                                  </button>
                                </div>
                                <div className="ml-11 flex items-center gap-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleReplyFileSelect(e, replyKey)}
                                    className="hidden"
                                    id={`reply-image-${replyKey}`}
                                    disabled={isUploading}
                                    multiple
                                  />
                                  <label
                                    htmlFor={`reply-image-${replyKey}`}
                                    className="text-xs text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-1"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    Thêm hình
                                  </label>
                                  {currentFiles.length > 0 && (
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {currentFiles.map((file, index) => (
                                        <div key={index} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                                          <span className="text-gray-600 truncate max-w-[80px]">{file.name}</span>
                                          <button
                                            type="button"
                                            onClick={() => removeReplyFile(replyKey, index)}
                                            className="text-red-500 hover:text-red-700"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </form>
                            )
                          })()}
                        </div>
                      )}
                    </div>
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
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 px-6">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{startIndex + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(endIndex, filtered.length)}</span> trong tổng số{' '}
                  <span className="font-medium">{filtered.length}</span> góp ý
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
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

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
            >
              <X className="h-6 w-6 text-gray-800" />
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
