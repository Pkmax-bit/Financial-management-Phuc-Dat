'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Edit, Search, Upload, X, Image as ImageIcon, FileText, Loader2, MessageCircle, Eye, Send, User, Maximize2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Feedback = {
  id: string
  submitted_by: string
  title: string
  content: string
  category: 'bug' | 'idea' | 'uiux' | 'performance' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
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

export default function SystemFeedbackTab() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    id: '' as string | '',
    title: '',
    content: '',
    category: 'other' as Feedback['category'],
    priority: 'medium' as Feedback['priority'],
    status: 'open' as Feedback['status'],
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [replies, setReplies] = useState<Record<string, any[]>>({})
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyFiles, setReplyFiles] = useState<Record<string, File[]>>({})
  const [uploadingReplyAttachments, setUploadingReplyAttachments] = useState<Record<string, boolean>>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    // Reset to page 1 when search changes
    setCurrentPage(1)
  }, [search])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Recursive component to render threaded replies (giống CompactComments)
  const ReplyItem = ({ reply, feedbackId, depth = 0 }: { reply: any, feedbackId: string, depth?: number }) => {
    const isReplying = replyingTo === reply.id
    
    return (
      <div key={reply.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className={`w-8 h-8 bg-gradient-to-br ${
            depth === 0 ? 'from-blue-500 to-purple-600' : 
            depth === 1 ? 'from-green-500 to-teal-600' : 
            'from-orange-500 to-red-600'
          } rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
            {(reply.replied_by_name || 'Người dùng').charAt(0)}
          </div>
          
          {/* Comment Content */}
          <div className="flex-1">
            <div className="bg-gray-50 rounded-xl px-3 py-2 max-w-md shadow-sm border border-gray-100">
              <div className="font-semibold text-xs text-gray-900 mb-1">{reply.replied_by_name || 'Người dùng'}</div>
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
              <span className="text-xs text-gray-500">
                {formatTimeAgo(reply.created_at)}
              </span>
            </div>
            
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

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return items
    return items.filter(it => it.title.toLowerCase().includes(s) || it.content.toLowerCase().includes(s))
  }, [items, search])

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filtered.slice(startIndex, endIndex)

  const resetForm = () => {
    setForm({ id: '', title: '', content: '', category: 'other', priority: 'medium', status: 'open' })
    setSelectedFiles([])
  }

  const submit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
      }
      
      let feedbackId = form.id
      
      if (form.id) {
        const res = await fetch(`/api/feedback/system/${form.id}`, {
          method: 'PUT', headers,
          body: JSON.stringify({
            title: form.title,
            content: form.content,
            category: form.category,
            priority: form.priority,
            status: form.status,
          })
        })
        if (!res.ok) throw new Error('Update failed')
      } else {
        const res = await fetch(`/api/feedback/system`, {
          method: 'POST', headers,
          body: JSON.stringify({
            title: form.title,
            content: form.content,
            category: form.category,
            priority: form.priority,
          })
        })
        if (!res.ok) throw new Error('Create failed')
        const newFeedback = await res.json()
        feedbackId = newFeedback.id
      }
      
      // Upload attachments if any
      if (selectedFiles.length > 0 && feedbackId) {
        setUploadingAttachments(true)
        try {
          // Upload files one by one to avoid issues with multiple file upload
          const uploadPromises = selectedFiles.map(async (file) => {
            const formData = new FormData()
            formData.append('file', file)
            
            const uploadRes = await fetch(`/api/feedback/system/${feedbackId}/attachments`, {
              method: 'POST',
              headers: {
                ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
              },
              body: formData
            })
            
            if (!uploadRes.ok) {
              let errorData
              try {
                errorData = await uploadRes.json()
              } catch {
                errorData = { detail: `HTTP ${uploadRes.status}: ${uploadRes.statusText}` }
              }
              throw new Error(errorData.detail || `Upload failed for ${file.name}: ${uploadRes.status}`)
            }
            
            return await uploadRes.json()
          })
          
          const results = await Promise.all(uploadPromises)
          console.log('All attachments uploaded successfully:', results)
        } catch (error) {
          console.error('Error uploading attachments:', error)
          const errorMsg = error instanceof Error ? error.message : 'Lỗi khi upload file đính kèm'
          alert(`Lỗi upload file: ${errorMsg}\n\nGóp ý đã được tạo/cập nhật, nhưng một số file đính kèm có thể chưa được upload. Bạn có thể thêm lại sau.`)
        } finally {
          setUploadingAttachments(false)
        }
      }
      
      await load()
      setShowForm(false)
      resetForm()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Lỗi khi tạo/cập nhật góp ý. Vui lòng thử lại.')
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      // Validate file size (max 10MB)
      const validFiles = files.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} quá lớn. Kích thước tối đa là 10MB.`)
          return false
        }
        return true
      })
      setSelectedFiles([...selectedFiles, ...validFiles])
    }
  }
  
  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const remove = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/feedback/system/${id}`, {
      method: 'DELETE',
      headers: { ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }
    })
    if (!res.ok) throw new Error('Delete failed')
    await load()
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Góp Ý Hệ Thống</h2>
            <p className="text-gray-600">Chia sẻ ý kiến, báo cáo lỗi hoặc đề xuất cải tiến hệ thống</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
              <span className="text-sm text-gray-500">Tổng góp ý:</span>
              <span className="ml-2 font-semibold text-blue-600">{items.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm góp ý hệ thống..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <button 
          onClick={() => { setShowForm(true); resetForm(); }} 
          className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          Thêm Góp Ý Mới
        </button>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Đang tải...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có góp ý nào</h3>
            <p className="text-gray-500 mb-4">Hãy là người đầu tiên chia sẻ ý kiến về hệ thống</p>
            <button 
              onClick={() => { setShowForm(true); resetForm(); }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo góp ý đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {paginatedItems.map((it, index) => (
              <div key={it.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{it.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        it.category === 'bug' ? 'bg-red-100 text-red-800' :
                        it.category === 'idea' ? 'bg-green-100 text-green-800' :
                        it.category === 'uiux' ? 'bg-purple-100 text-purple-800' :
                        it.category === 'performance' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {it.category === 'bug' ? 'Lỗi' :
                         it.category === 'idea' ? 'Ý tưởng' :
                         it.category === 'uiux' ? 'Giao diện' :
                         it.category === 'performance' ? 'Hiệu năng' : 'Khác'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        it.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        it.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        it.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {it.priority === 'urgent' ? 'Nghiêm trọng' :
                         it.priority === 'high' ? 'Cao' :
                         it.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        it.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        it.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        it.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {it.status === 'open' ? '🔵 Mở' :
                         it.status === 'in_progress' ? '🟡 Đang xử lý' :
                         it.status === 'resolved' ? '🟢 Đã xử lý' : '⚫ Đóng'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{it.content}</p>
                    
                    {/* Attachments */}
                    {it.attachments && it.attachments.length > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-xs text-gray-500">Đính kèm:</span>
                        <div className="flex items-center space-x-2">
                          {it.attachments.slice(0, 3).map((attachment) => (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                            >
                              {attachment.type === 'image' ? (
                                <ImageIcon className="w-3 h-3" />
                              ) : (
                                <FileText className="w-3 h-3" />
                              )}
                              <span>{attachment.name}</span>
                            </a>
                          ))}
                          {it.attachments.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{it.attachments.length - 3} file khác
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <span>Tạo lúc: {new Date(it.created_at).toLocaleString('vi-VN')}</span>
                      {it.updated_at !== it.created_at && (
                        <span className="ml-4">Cập nhật: {new Date(it.updated_at).toLocaleString('vi-VN')}</span>
                      )}
                    </div>

                    {/* Replies Section */}
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => toggleReplies(it.id)}
                          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Phản hồi ({replies[it.id]?.length || 0})</span>
                          {expandedReplies.has(it.id) ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        {replies[it.id] && replies[it.id].length > 0 && !expandedReplies.has(it.id) && (
                          <span className="text-xs text-gray-500">
                            Click để xem {replies[it.id].length} phản hồi
                          </span>
                        )}
                      </div>

                      {expandedReplies.has(it.id) && (
                        <div className="space-y-4">
                          {/* Existing Replies (Threaded) */}
                          {replies[it.id] && replies[it.id].length > 0 ? (
                            <div className="space-y-3">
                              {replies[it.id].map((reply) => (
                                <ReplyItem key={reply.id} reply={reply} feedbackId={it.id} />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-sm text-gray-500">
                              Chưa có phản hồi nào. Hãy là người đầu tiên trả lời!
                            </div>
                          )}

                          {/* Reply Form (Top-level) - Giống CompactComments */}
                          {(() => {
                            const replyKey = `top-${it.id}`
                            const currentFiles = replyFiles[replyKey] || []
                            const isUploading = uploadingReplyAttachments[replyKey] || false
                            return (
                              <form onSubmit={(e) => { e.preventDefault(); handleReply(it.id, null); }} className="space-y-2">
                                <div className="flex gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    👤
                                  </div>
                                  <div className="flex-1">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full px-3 py-2 border border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-300 focus-within:shadow-md transition-all duration-200">
                                      <input
                                        type="text"
                                        value={replyContent[it.id] || ''}
                                        onChange={(e) => setReplyContent(prev => ({ ...prev, [it.id]: e.target.value }))}
                                        placeholder="Viết bình luận..."
                                        className="w-full bg-transparent text-xs outline-none placeholder-blue-400 text-black font-medium"
                                        disabled={isUploading}
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="submit"
                                    disabled={!replyContent[it.id]?.trim() || isUploading}
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
                  <div className="flex items-center space-x-2 ml-4">
                    <button 
                      onClick={() => { setShowForm(true); setForm({ id: it.id, title: it.title, content: it.content, category: it.category as any, priority: it.priority as any, status: it.status as any }); }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="h-3 w-3 mr-1"/>
                      Sửa
                    </button>
                    <button 
                      onClick={() => remove(it.id)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3 w-3 mr-1"/>
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
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

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowForm(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {form.id ? 'Sửa Góp Ý Hệ Thống' : 'Thêm Góp Ý Mới'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {form.id ? 'Chỉnh sửa thông tin góp ý' : 'Chia sẻ ý kiến về hệ thống'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
        </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* Title */}
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={form.title} 
                    onChange={(e) => setForm({ ...form, title: e.target.value })} 
                    placeholder="Nhập tiêu đề góp ý..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  />
          </div>

                {/* Content */}
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    value={form.content} 
                    onChange={(e) => setForm({ ...form, content: e.target.value })} 
                    rows={4} 
                    placeholder="Mô tả chi tiết góp ý của bạn..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none" 
                  />
          </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đính kèm hình ảnh/tài liệu
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={uploadingAttachments}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click để chọn file hoặc kéo thả vào đây
                      </span>
                      <span className="text-xs text-gray-500">
                        Hỗ trợ: JPG, PNG, GIF, WebP, PDF (Tối đa 10MB/file)
                      </span>
                    </label>
                    
                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              {file.type.startsWith('image/') ? (
                                <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              ) : (
                                <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              )}
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Category, Priority, Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại góp ý</label>
                    <select 
                      value={form.category} 
                      onChange={(e) => setForm({ ...form, category: e.target.value as any })} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="bug">🐛 Báo lỗi</option>
                      <option value="idea">💡 Ý tưởng mới</option>
                      <option value="uiux">🎨 Giao diện/Trải nghiệm</option>
                      <option value="performance">⚡ Hiệu năng</option>
                      <option value="other">📝 Khác</option>
              </select>
            </div>
                  
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ ưu tiên</label>
                    <select 
                      value={form.priority} 
                      onChange={(e) => setForm({ ...form, priority: e.target.value as any })} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="low">🟢 Thấp</option>
                      <option value="medium">🟡 Trung bình</option>
                      <option value="high">🟠 Cao</option>
                      <option value="critical">🔴 Nghiêm trọng</option>
              </select>
            </div>
                  
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                    <select 
                      value={form.status} 
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="open">🔵 Mở</option>
                      <option value="in_progress">🟡 Đang xử lý</option>
                      <option value="resolved">🟢 Đã xử lý</option>
                      <option value="closed">⚫ Đóng</option>
              </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                <button 
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={submit}
                  disabled={uploadingAttachments}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {uploadingAttachments ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang upload...
                    </>
                  ) : (
                    form.id ? 'Cập nhật' : 'Tạo góp ý'
                  )}
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
              src={selectedImage || ''}
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



