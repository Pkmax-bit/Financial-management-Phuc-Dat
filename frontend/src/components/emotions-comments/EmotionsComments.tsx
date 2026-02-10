import React, { useState, useEffect } from 'react';
import { getApiEndpoint } from '@/lib/apiUrl'
import { 
  ThumbsUp, 
  Heart, 
  Laugh, 
  Frown, 
  Angry, 
  ThumbsDown, 
  PartyPopper,
  MessageCircle,
  Reply,
  Edit,
  Trash2,
  MoreHorizontal,
  Send
} from 'lucide-react';

interface EmotionType {
  id: string;
  name: string;
  display_name: string;
  emoji: string;
  color?: string;
  is_active: boolean;
}

interface Comment {
  id: string;
  parent_id?: string;
  entity_type: string;
  entity_id: string;
  user_id?: string;
  author_name: string;
  content: string;
  is_edited: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  replies: Comment[];
  reactions: { [key: string]: number };
  user_reaction?: string;
  total_replies: number;
  total_reactions: number;
}

interface EmotionsCommentsProps {
  entityType: string;
  entityId: string;
  timelineId?: string;
  currentUserId?: string;
  onCommentAdded?: () => void;
  onReactionAdded?: () => void;
}

const emotionIcons: { [key: string]: React.ReactNode } = {
  like: <ThumbsUp className="w-4 h-4" />,
  love: <Heart className="w-4 h-4" />,
  laugh: <Laugh className="w-4 h-4" />,
  wow: <MessageCircle className="w-4 h-4" />,
  sad: <Frown className="w-4 h-4" />,
  angry: <Angry className="w-4 h-4" />,
  dislike: <ThumbsDown className="w-4 h-4" />,
  celebrate: <PartyPopper className="w-4 h-4" />
};

export default function EmotionsComments({ 
  entityType, 
  entityId, 
  timelineId,
  currentUserId,
  onCommentAdded,
  onReactionAdded 
}: EmotionsCommentsProps) {
  const [emotionTypes, setEmotionTypes] = useState<EmotionType[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [showAllReplies, setShowAllReplies] = useState<{ [key: string]: boolean }>({});
  const [authorName, setAuthorName] = useState('');

  // Load emotion types
  useEffect(() => {
    loadEmotionTypes();
  }, []);

  // Load comments
  useEffect(() => {
    loadComments();
  }, [entityType, entityId]);

  const loadEmotionTypes = async () => {
    try {
      const response = await fetch(getApiEndpoint('/api/emotions-comments/emotion-types'));
      if (response.ok) {
        const data = await response.json();
        setEmotionTypes(data);
      }
    } catch (error) {
      console.error('Error loading emotion types:', error);
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiEndpoint(`/api/emotions-comments/comments/${entityType}/${entityId}`));
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !authorName.trim()) return;

    try {
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
          parent_id: replyingTo,
          author_name: authorName.trim() // Gửi tên tác giả
        })
      });

      if (response.ok) {
        setNewComment('');
        setReplyingTo(null);
        loadComments();
        onCommentAdded?.();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleAddReaction = async (entityType: string, entityId: string, emotionTypeId: string) => {
    try {
      const response = await fetch('/api/emotions-comments/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          emotion_type_id: emotionTypeId
        })
      });

      if (response.ok) {
        loadComments();
        onReactionAdded?.();
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleRemoveReaction = async (entityType: string, entityId: string) => {
    try {
      const response = await fetch(`/api/emotions-comments/reactions/${entityType}/${entityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        loadComments();
        onReactionAdded?.();
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/emotions-comments/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: editContent
        })
      });

      if (response.ok) {
        setEditingComment(null);
        setEditContent('');
        loadComments();
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

    try {
      const response = await fetch(`/api/emotions-comments/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        loadComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const renderReactions = (comment: Comment) => {
    const hasReactions = Object.keys(comment.reactions).length > 0;
    if (!hasReactions) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(comment.reactions).map(([emotionName, count]) => {
          const emotionType = emotionTypes.find(et => et.name === emotionName);
          if (!emotionType || count === 0) return null;

          return (
            <button
              key={emotionName}
              onClick={() => {
                if (comment.user_reaction === emotionName) {
                  handleRemoveReaction('comment', comment.id);
                } else {
                  handleAddReaction('comment', comment.id, emotionType.id);
                }
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                comment.user_reaction === emotionName
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{emotionType.emoji}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    if (comment.is_deleted) {
      return (
        <div className={`p-3 bg-gray-50 rounded-lg ${isReply ? 'ml-8' : ''}`}>
          <p className="text-gray-500 italic">Bình luận đã bị xóa</p>
        </div>
      );
    }

    return (
      <div className={`p-3 border rounded-lg ${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.author_name}</span>
              <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
              {comment.is_edited && (
                <span className="text-xs text-gray-400">(đã chỉnh sửa)</span>
              )}
            </div>
            
            {editingComment === comment.id ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditComment(comment.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            )}
            
            {renderReactions(comment)}
          </div>
          
          {currentUserId === comment.user_id && !editingComment && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setEditingComment(comment.id);
                  setEditContent(comment.content);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <Reply className="w-3 h-3" />
            Trả lời
          </button>
          
          {/* Reaction buttons with hover effect */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
              <span className="text-sm">😊</span>
              Cảm xúc
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
                {emotionTypes.slice(0, 6).map((emotionType) => (
                  <button
                    key={emotionType.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleAddReaction('comment', comment.id, emotionType.id)
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                      comment.user_reaction === emotionType.name
                        ? 'bg-blue-100 text-blue-600 scale-110'
                        : 'bg-white border border-gray-200 hover:bg-gray-50 hover:scale-110'
                    }`}
                    title={emotionType.display_name}
                  >
                    <span className="text-sm">{emotionType.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-3 p-3 bg-gray-50 rounded">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết phản hồi..."
              className="w-full p-2 border rounded resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || !authorName.trim()}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gửi
              </button>
              <button
                onClick={() => setReplyingTo(null)}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply) => (
              <div key={reply.id}>
                {renderComment(reply, true)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
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

      {/* Comment form - Hiển thị trong khung bình luận */}
      <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Viết bình luận..."
          className="w-full p-3 border border-blue-200 rounded resize-none bg-white text-black font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all duration-200"
          rows={3}
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            {emotionTypes.slice(0, 6).map((emotionType) => (
              <button
                key={emotionType.id}
                onClick={() => handleAddReaction(entityType, entityId, emotionType.id)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title={emotionType.display_name}
              >
                <span className="text-lg">{emotionType.emoji}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || !authorName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Gửi
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Chưa có bình luận nào</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id}>
              {renderComment(comment)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
