'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Eye, 
  Download, 
  ChevronDown, 
  ChevronUp,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  MessageCircle,
  Smile,
  Share
} from 'lucide-react'
import EmotionsComments from '@/components/emotions-comments/EmotionsComments'
import ReactionButton from '@/components/emotions-comments/ReactionButton'
import ImageWithReactions from './ImageWithReactions'

interface TimelineEntry {
  id: string
  project_id: string
  title: string
  description: string
  date: string
  type: 'milestone' | 'update' | 'issue' | 'meeting'
  status: 'completed' | 'in_progress' | 'pending'
  created_by: string
  created_at: string
  attachments: Attachment[]
}

interface Attachment {
  id: string
  name: string
  url: string
  type: 'image' | 'document' | 'other'
  size: number
  uploaded_at: string
}

interface CustomerProjectTimelineProps {
  projectId: string
  projectName: string
}

const statusConfig = {
  completed: { 
    label: 'Hoàn thành', 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle,
    dotColor: 'bg-green-500'
  },
  in_progress: { 
    label: 'Đang thực hiện', 
    color: 'bg-blue-100 text-blue-800', 
    icon: Clock,
    dotColor: 'bg-blue-500'
  },
  pending: { 
    label: 'Chờ xử lý', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: AlertCircle,
    dotColor: 'bg-yellow-500'
  }
}

const typeConfig = {
  milestone: { label: 'Cột mốc', color: 'text-yellow-600' },
  update: { label: 'Cập nhật', color: 'text-blue-600' },
  issue: { label: 'Vấn đề', color: 'text-red-600' },
  meeting: { label: 'Cuộc họp', color: 'text-green-600' }
}

export default function CustomerProjectTimeline({ projectId, projectName }: CustomerProjectTimelineProps) {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [authorName, setAuthorName] = useState('')

  useEffect(() => {
    fetchTimelineEntries()
  }, [projectId])

  const fetchTimelineEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/timeline`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch timeline entries')
      }
      
      const data = await response.json()
      setTimelineEntries(data.entries || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }

  const openImagePreview = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  const closeImagePreview = () => {
    setSelectedImage(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type === 'image' || type.startsWith('image/')) {
      return <Eye className="h-4 w-4 text-blue-500" />
    }
    return <Download className="h-4 w-4 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 font-medium">Đang tải timeline...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Lỗi tải timeline</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchTimelineEntries}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (timelineEntries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có cập nhật tiến độ</h3>
          <p className="text-gray-600 mb-4">
            Dự án này chưa có cập nhật tiến độ nào. Nhân viên sẽ cập nhật tiến độ thi công tại đây.
          </p>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Tiến độ sẽ được cập nhật khi có hoạt động mới</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Author Name Input - Global for all comments */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên của bạn (áp dụng cho tất cả bình luận)
        </label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Nhập tên của bạn..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-black font-medium placeholder-gray-600"
        />
        <p className="text-xs text-gray-500 mt-1">
          Tên này sẽ được sử dụng cho tất cả bình luận trong timeline này
        </p>
      </div>

      {timelineEntries.map((entry) => (
        <div key={entry.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          {/* Facebook-style Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {entry.created_by ? entry.created_by.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{entry.created_by || 'Người dùng'}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(entry.date).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[entry.status].color}`}>
                  {React.createElement(statusConfig[entry.status].icon, { className: "h-3 w-3 mr-1" })}
                  {statusConfig[entry.status].label}
                </span>
                <button
                  onClick={() => toggleExpanded(entry.id)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label={expandedEntries.has(entry.id) ? 'Thu gọn' : 'Mở rộng'}
                >
                  {expandedEntries.has(entry.id) ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${typeConfig[entry.type].color}`}>
                {typeConfig[entry.type].label}
              </span>
              <span className="text-gray-300">•</span>
              <h4 className="text-lg font-semibold text-gray-900">{entry.title}</h4>
            </div>
            <p className="text-gray-700 mb-4">{entry.description}</p>

            {/* Images with Individual Reactions and Comments - Full Width */}
            {entry.attachments.filter(att => att.type === 'image' || att.type.startsWith('image/')).length > 0 && (
              <div className="mt-6">
                <div className="space-y-6">
                  {entry.attachments
                    .filter(att => att.type === 'image' || att.type.startsWith('image/'))
                    .map((attachment) => (
                      <ImageWithReactions
                        key={attachment.id}
                        attachment={attachment}
                        timelineId={entry.id}
                        onImageClick={setSelectedImage}
                        authorName={authorName}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Other Files */}
            {entry.attachments.filter(att => !(att.type === 'image' || att.type.startsWith('image/'))).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Tệp đính kèm khác</h5>
                <div className="space-y-2">
                  {entry.attachments
                    .filter(att => !(att.type === 'image' || att.type.startsWith('image/')))
                    .map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        {getFileIcon(attachment.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Tải xuống"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Reactions and Comments Section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {/* Reactions */}
              <div className="mb-4">
                <ReactionButton
                  entityType="timeline_entry"
                  entityId={entry.id}
                  currentUserId={null} // Khách hàng có thể không có user ID
                  compact={true}
                />
              </div>
              
              {/* Comments Section - Hidden */}
              {/* Phần bình luận đã được ẩn theo yêu cầu */}
            </div>
          </div>
        </div>
      ))}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
             onClick={closeImagePreview}>
          <div className="relative max-w-4xl max-h-full overflow-hidden rounded-lg shadow-xl">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain" 
            />
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 text-white bg-gray-800 bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-opacity"
              aria-label="Đóng"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
