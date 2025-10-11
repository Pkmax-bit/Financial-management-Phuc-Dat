'use client'

import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Smile, Share, ThumbsUp, Reply, MoreHorizontal } from 'lucide-react'

interface CompactCommentsProps {
  entityType: string
  entityId: string
  timelineId?: string
  currentUserId?: string | null
  onCommentAdded?: () => void
  onReactionAdded?: () => void
}

interface Comment {
  id: string
  parent_id?: string | null
  author_name: string
  content: string
  created_at: string
  replies: Comment[]
  reactions: { [key: string]: number }
  user_reaction?: string
}

export default function CompactComments({
  entityType,
  entityId,
  timelineId,
  currentUserId,
  onCommentAdded,
  onReactionAdded
}: CompactCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [showAllReplies, setShowAllReplies] = useState<{ [key: string]: boolean }>({})

  // Load comments from database
  useEffect(() => {
    loadComments()
  }, [entityType, entityId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const endpoint = token ? '/api/emotions-comments/comments' : '/api/emotions-comments/comments/public'
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`${endpoint}?entity_type=${entityType}&entity_id=${entityId}`, {
        method: 'GET',
        headers
      })
      
      if (response.ok) {
        const commentsData = await response.json()
        setComments(commentsData)
      } else {
        console.error('Error loading comments:', response.statusText)
        // Fallback to empty array if API fails
        setComments([])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
      // Fallback to empty array if API fails
      setComments([])
    } finally {
      setLoading(false)
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

  // Function to render nested comments recursively
  const renderNestedComments = (comment: Comment, level: number = 0) => {
    const maxLevel = 3 // Maximum nesting level
    const shouldShowAll = showAllReplies[comment.id] || level < maxLevel
    
    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className={`w-8 h-8 bg-gradient-to-br ${
            level === 0 ? 'from-blue-500 to-purple-600' : 
            level === 1 ? 'from-green-500 to-teal-600' : 
            'from-orange-500 to-red-600'
          } rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
            {comment.author_name.charAt(0)}
          </div>
          
          {/* Comment Content */}
          <div className="flex-1">
            <div className="bg-gray-50 rounded-xl px-3 py-2 max-w-md shadow-sm border border-gray-100">
              <div className="font-semibold text-xs text-gray-900 mb-1">{comment.author_name}</div>
              <div className="text-xs text-gray-800 leading-relaxed">{comment.content}</div>
            </div>
            
            {/* Comment Actions */}
            <div className="flex items-center gap-3 mt-1 ml-3">
              <button
                onClick={() => setShowReactions(showReactions === comment.id ? null : comment.id)}
                className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
              >
                😊 Cảm xúc
              </button>
              <button 
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
              >
                💬 Trả lời
              </button>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.created_at)}
              </span>
            </div>
            
            {/* Reaction Picker */}
            {showReactions === comment.id && (
              <div className="mt-2 ml-11 flex gap-2">
                {['like', 'love', 'laugh', 'angry', 'sad', 'wow'].map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => {
                      handleReaction(comment.id, emotion)
                      setShowReactions(null)
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
            )}
            
            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 ml-11">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmitReply(comment.id); }} className="flex gap-2">
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
                        disabled={submitting}
                        autoFocus
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!replyText.trim() || submitting}
                    className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {submitting ? '⏳' : '📤'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                    className="px-3 py-2 bg-gray-500 text-white rounded-full text-xs font-semibold hover:bg-gray-600 transition-all duration-200"
                  >
                    ✕
                  </button>
                </form>
              </div>
            )}
            
            {/* Reactions Count */}
            {Object.keys(comment.reactions).length > 0 && (
              <div className="flex items-center gap-1 mt-1 ml-3">
                <div className="flex -space-x-1">
                  {Object.entries(comment.reactions).map(([type, count]) => (
                    <div key={type} className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs shadow-sm">
                      👍
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-600 font-medium">
                  {Object.values(comment.reactions).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {shouldShowAll ? (
              comment.replies.map((reply) => renderNestedComments(reply, level + 1))
            ) : (
              <>
                {comment.replies.slice(0, 2).map((reply) => renderNestedComments(reply, level + 1))}
                {comment.replies.length > 2 && (
                  <button
                    onClick={() => setShowAllReplies(prev => ({
                      ...prev,
                      [comment.id]: !prev[comment.id]
                    }))}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-1 rounded-full transition-colors"
                  >
                    {showAllReplies[comment.id] 
                      ? `Ẩn ${comment.replies.length - 2} trả lời` 
                      : `Xem thêm ${comment.replies.length - 2} trả lời`
                    }
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

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
          parent_id: null
        })
      })

      if (response.ok) {
        setNewComment('')
        onCommentAdded?.()
        // Reload comments from database
        await loadComments()
      } else {
        console.error('Error creating comment:', response.statusText)
        // Fallback to mock data if API fails
        const comment: Comment = {
          id: Date.now().toString(),
          parent_id: null,
          author_name: 'Khách hàng',
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
        parent_id: null,
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

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || submitting) return

    setSubmitting(true)
    try {
      // Gọi API thực tế để lưu reply
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
          content: replyText,
          entity_type: entityType,
          entity_id: entityId,
          timeline_id: timelineId, // Sử dụng timeline_id thực tế
          parent_id: parentId // Lưu parent_id của comment gốc
        })
      })

      if (response.ok) {
        setReplyText('')
        setReplyingTo(null)
        onCommentAdded?.()
        // Reload comments from database
        await loadComments()
      } else {
        console.error('Error creating reply:', response.statusText)
        // Fallback to mock data if API fails
        const reply: Comment = {
          id: Date.now().toString(),
          parent_id: parentId, // Reply to specific comment
          author_name: 'Khách hàng',
          content: replyText,
          created_at: new Date().toISOString(),
          replies: [],
          reactions: {}
        }
        
        // Add reply to the parent comment
        setComments(prev => prev.map(comment => 
          comment.id === parentId 
            ? { ...comment, replies: [...comment.replies, reply] }
            : comment
        ))
        
        setReplyText('')
        setReplyingTo(null)
        onCommentAdded?.()
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
      // Fallback to mock data if API fails
      const reply: Comment = {
        id: Date.now().toString(),
        parent_id: parentId,
        author_name: 'Khách hàng',
        content: replyText,
        created_at: new Date().toISOString(),
        replies: [],
        reactions: {}
      }
      
      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      ))
      
      setReplyText('')
      setReplyingTo(null)
      onCommentAdded?.()
    } finally {
      setSubmitting(false)
    }
  }

  const handleReaction = async (commentId: string, reactionType: string) => {
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const endpoint = token ? '/api/emotions-comments/reactions' : '/api/emotions-comments/reactions/public'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entity_type: 'comment',
          entity_id: commentId,
          emotion_type: reactionType
        })
      })
      
      if (response.ok) {
        onReactionAdded?.()
        // Reload comments to get updated reactions
        await loadComments()
      } else {
        console.error('Error adding reaction:', response.statusText)
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  return (
    <div className="space-y-3">
      {/* Comments List - Compact */}
      <div className="space-y-3">
        {comments.map((comment) => renderNestedComments(comment, 0))}
          <div key={comment.id} className="flex gap-3">
            {/* Avatar - Smaller */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {comment.author_name.charAt(0)}
            </div>
            
            {/* Comment Content - Compact */}
            <div className="flex-1">
              <div className="bg-gray-50 rounded-xl px-3 py-2 max-w-md shadow-sm border border-gray-100">
                <div className="font-semibold text-xs text-gray-900 mb-1">{comment.author_name}</div>
                <div className="text-xs text-gray-800 leading-relaxed">{comment.content}</div>
              </div>
              
              {/* Comment Actions - Compact */}
              <div className="flex items-center gap-3 mt-1 ml-3">
                <button
                  onClick={() => setShowReactions(showReactions === comment.id ? null : comment.id)}
                  className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
                >
                  😊 Cảm xúc
                </button>
                <button 
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
                >
                  💬 Trả lời
                </button>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(comment.created_at)}
                </span>
              </div>
              
              {/* Reaction Picker */}
              {showReactions === comment.id && (
                <div className="mt-2 ml-11 flex gap-2">
                  {['like', 'love', 'laugh', 'angry', 'sad', 'wow'].map((emotion) => (
                    <button
                      key={emotion}
                      onClick={() => {
                        handleReaction(comment.id, emotion)
                        setShowReactions(null)
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
              )}
              
              {/* Reply Form - Show when replying to this comment */}
              {replyingTo === comment.id && (
                <div className="mt-3 ml-11">
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmitReply(comment.id); }} className="flex gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      👤
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-full px-3 py-2 border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200 transition-all">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Trả lời..."
                          className="w-full bg-transparent text-xs outline-none placeholder-gray-500"
                          disabled={submitting}
                          autoFocus
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!replyText.trim() || submitting}
                      className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {submitting ? '⏳' : '📤'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      className="px-3 py-2 bg-gray-500 text-white rounded-full text-xs font-semibold hover:bg-gray-600 transition-all duration-200"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              )}
              
              {/* Reactions Count - Compact */}
              {Object.keys(comment.reactions).length > 0 && (
                <div className="flex items-center gap-1 mt-1 ml-3">
                  <div className="flex -space-x-1">
                    {Object.entries(comment.reactions).map(([type, count]) => (
                      <div key={type} className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs shadow-sm">
                        👍
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {Object.values(comment.reactions).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              )}
              
              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="mt-3 ml-6 space-y-3 border-l-2 border-gray-100 pl-4">
                  {/* Show limited replies initially */}
                  {(showAllReplies[comment.id] ? comment.replies : comment.replies.slice(0, 2)).map((reply) => (
                    <div key={reply.id} className="flex gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {reply.author_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-xl px-3 py-2 max-w-sm shadow-sm border border-gray-100">
                          <div className="font-semibold text-xs text-gray-900 mb-1">{reply.author_name}</div>
                          <div className="text-xs text-gray-800 leading-relaxed">{reply.content}</div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 ml-3">
                          <button 
                            onClick={() => handleReaction(reply.id, 'like')}
                            className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
                          >
                            👍 Thích
                          </button>
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
                        
                        {/* Reply Form for this reply */}
                        {replyingTo === reply.id && (
                          <div className="mt-3 ml-3">
                            <form onSubmit={(e) => { e.preventDefault(); handleSubmitReply(reply.id); }} className="flex gap-2">
                              <div className="w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
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
                                    disabled={submitting}
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <button
                                type="submit"
                                disabled={!replyText.trim() || submitting}
                                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                {submitting ? '⏳' : '📤'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                className="px-3 py-2 bg-gray-500 text-white rounded-full text-xs font-semibold hover:bg-gray-600 transition-all duration-200"
                              >
                                ✕
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Show More/Less Button */}
                  {comment.replies.length > 2 && (
                    <button
                      onClick={() => setShowAllReplies(prev => ({
                        ...prev,
                        [comment.id]: !prev[comment.id]
                      }))}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-1 rounded-full transition-colors"
                    >
                      {showAllReplies[comment.id] 
                        ? `Ẩn ${comment.replies.length - 2} trả lời` 
                        : `Xem thêm ${comment.replies.length - 2} trả lời`
                      }
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Comment Input - Hiển thị trong khung bình luận */}
      <form onSubmit={handleSubmitComment} className="flex gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
          👤
        </div>
        <div className="flex-1">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full px-3 py-2 border border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-300 focus-within:shadow-md transition-all duration-200">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              className="w-full bg-transparent text-xs outline-none placeholder-blue-400 text-black font-medium"
              disabled={submitting}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
        >
          {submitting ? '⏳' : '📤'}
        </button>
      </form>
    </div>
  )
}
