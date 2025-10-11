'use client'

import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Smile, Share, ThumbsUp, Reply, MoreHorizontal } from 'lucide-react'

interface FacebookStyleCommentsProps {
  entityType: string
  entityId: string
  timelineId?: string
  currentUserId?: string | null
  onCommentAdded?: () => void
  onReactionAdded?: () => void
}

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
  replies: Comment[]
  reactions: { [key: string]: number }
  user_reaction?: string
}

export default function FacebookStyleComments({
  entityType,
  entityId,
  timelineId,
  currentUserId,
  onCommentAdded,
  onReactionAdded
}: FacebookStyleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [authorName, setAuthorName] = useState('')

  // Mock data for demonstration
  useEffect(() => {
    setComments([
      {
        id: '1',
        author_name: 'Khách hàng A',
        content: 'Hình ảnh rất đẹp, công việc tiến triển tốt!',
        created_at: '2024-01-15T10:30:00Z',
        replies: [
          {
            id: '2',
            author_name: 'Nhân viên B',
            content: 'Cảm ơn bạn đã phản hồi tích cực!',
            created_at: '2024-01-15T11:00:00Z',
            replies: [],
            reactions: { like: 2 }
          }
        ],
        reactions: { like: 5, love: 1 }
      },
      {
        id: '3',
        author_name: 'Khách hàng C',
        content: 'Có thể chụp thêm góc khác được không?',
        created_at: '2024-01-15T14:20:00Z',
        replies: [],
        reactions: { like: 1 }
      }
    ])
  }, [entityId])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Vừa xong'
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    if (diffInHours < 48) return 'Hôm qua'
    return date.toLocaleDateString('vi-VN')
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting || !authorName.trim()) return

    setSubmitting(true)
    try {
      // Gọi API thực tế để lưu bình luận
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Chỉ thêm Authorization header nếu có token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      // Sử dụng endpoint public nếu không có token
      const endpoint = token ? '/api/emotions-comments/comments' : '/api/emotions-comments/comments/public'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: newComment,
          entity_type: entityType,
          entity_id: entityId,
          timeline_id: timelineId, // Sử dụng timeline_id thực tế
          parent_id: null,
          author_name: authorName.trim() // Gửi tên tác giả
        })
      })

      if (response.ok) {
        const newCommentData = await response.json()
        
        const comment: Comment = {
          id: newCommentData.id,
          author_name: newCommentData.author_name,
          content: newCommentData.content,
          created_at: newCommentData.created_at,
          replies: [],
          reactions: {}
        }
        
        setComments(prev => [...prev, comment])
        setNewComment('')
        onCommentAdded?.()
      } else {
        console.error('Error creating comment:', response.statusText)
        // Fallback to mock data if API fails
        const comment: Comment = {
          id: Date.now().toString(),
          author_name: 'Bạn',
          content: newComment,
          created_at: new Date().toISOString(),
          replies: [],
          reactions: {}
        }
        
        setComments(prev => [...prev, comment])
        setNewComment('')
        onCommentAdded?.()
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      // Fallback to mock data if API fails
      const comment: Comment = {
        id: Date.now().toString(),
        author_name: 'Bạn',
        content: newComment,
        created_at: new Date().toISOString(),
        replies: [],
        reactions: {}
      }
      
      setComments(prev => [...prev, comment])
      setNewComment('')
      onCommentAdded?.()
    } finally {
      setSubmitting(false)
    }
  }

  const handleReaction = async (commentId: string, reactionType: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      onReactionAdded?.()
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Author Name Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên của bạn
        </label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Nhập tên của bạn..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
              {comment.author_name.charAt(0)}
            </div>
            
            {/* Comment Content */}
            <div className="flex-1">
              <div className="bg-gray-50 rounded-2xl px-4 py-3 max-w-md shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="font-semibold text-sm text-gray-900 mb-1">{comment.author_name}</div>
                <div className="text-sm text-gray-800 leading-relaxed">{comment.content}</div>
              </div>
              
              {/* Comment Actions */}
              <div className="flex items-center gap-4 mt-2 ml-4">
                <div className="relative group">
                  <button className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors">
                    😊 Cảm xúc
                  </button>
                  
                  {/* Hover Reaction Picker */}
                  <div className="absolute bottom-full left-0 mb-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto hover:pointer-events-auto z-20"
                       onMouseEnter={(e) => {
                         e.stopPropagation()
                         e.currentTarget.style.opacity = '1'
                       }}
                       onMouseLeave={(e) => {
                         e.stopPropagation()
                         e.currentTarget.style.opacity = '0'
                       }}>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1">
                      {['like', 'love', 'laugh', 'angry', 'sad', 'wow'].map((emotion) => (
                        <button
                          key={emotion}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleReaction(comment.id, emotion)
                          }}
                          className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all duration-200 shadow-sm"
                          title={emotion}
                        >
                          {emotion === 'like' && '👍'}
                          {emotion === 'love' && '❤️'}
                          {emotion === 'laugh' && '😂'}
                          {emotion === 'angry' && '😠'}
                          {emotion === 'sad' && '😢'}
                          {emotion === 'wow' && '😮'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors">
                  💬 Trả lời
                </button>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(comment.created_at)}
                </span>
              </div>
              
              {/* Reactions Count */}
              {Object.keys(comment.reactions).length > 0 && (
                <div className="flex items-center gap-2 mt-2 ml-4">
                  <div className="flex gap-1">
                    {Object.entries(comment.reactions).map(([type, count]) => {
                      // Map emotion type to emoji
                      const emotionEmoji = {
                        'like': '👍',
                        'love': '❤️',
                        'laugh': '😂',
                        'angry': '😠',
                        'sad': '😢',
                        'wow': '😮'
                      }[type] || '👍'
                      
                      return (
                        <div key={type} className="flex items-center gap-1 bg-blue-50 rounded-full px-2 py-1 border border-blue-200" title={`${type}: ${count}`}>
                          <span className="text-sm">{emotionEmoji}</span>
                          <span className="text-xs text-gray-600 font-medium">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="mt-3 ml-6 space-y-3 border-l-2 border-gray-100 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {reply.author_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-2xl px-3 py-2 max-w-sm shadow-sm border border-gray-100">
                          <div className="font-semibold text-sm text-gray-900 mb-1">{reply.author_name}</div>
                          <div className="text-sm text-gray-800 leading-relaxed">{reply.content}</div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 ml-3">
                          <button className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors">
                            👍 Thích
                          </button>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(reply.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Comment Input - Hiển thị trong khung bình luận */}
      <form onSubmit={handleSubmitComment} className="flex gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
          👤
        </div>
        <div className="flex-1">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full px-4 py-3 border border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-300 focus-within:shadow-md transition-all duration-200">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              className="w-full bg-transparent text-sm outline-none placeholder-blue-400 text-black font-medium"
              disabled={submitting}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!newComment.trim() || submitting || !authorName.trim()}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
        >
          {submitting ? '⏳ Đang gửi...' : '📤 Gửi'}
        </button>
      </form>
    </div>
  )
}
