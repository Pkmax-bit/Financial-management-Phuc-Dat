'use client'

import React, { useState } from 'react'
import { Eye, Download, Calendar } from 'lucide-react'
import EmotionsComments from '@/components/emotions-comments/EmotionsComments'
import ReactionButton from '@/components/emotions-comments/ReactionButton'
import FacebookStyleComments from '@/components/emotions-comments/FacebookStyleComments'
import CompactComments from '@/components/emotions-comments/CompactComments'

interface Attachment {
  id: string
  name: string
  url: string
  type: 'image' | 'document' | 'other'
  size: number
  uploaded_at: string
}

interface ImageWithReactionsProps {
  attachment: Attachment
  timelineId?: string
  onImageClick?: (url: string) => void
  authorName?: string
}

export default function ImageWithReactions({ 
  attachment, 
  timelineId,
  onImageClick,
  authorName 
}: ImageWithReactionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
      {/* Image - Full width, no click required */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <div className="aspect-[16/9] w-full relative">
          <img 
            src={attachment.url} 
            alt={attachment.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
          {/* Subtle overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
        </div>
      </div>
      
      {/* Image Info - Beautiful design */}
      <div className="px-8 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {new Date(attachment.uploaded_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-indigo-600">
                <span className="text-sm font-semibold">
                  📏 {formatFileSize(attachment.size)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={() => onImageClick?.(attachment.url)}
              className="p-3 rounded-xl bg-white hover:bg-blue-50 hover:shadow-lg text-blue-600 hover:text-blue-700 transition-all duration-300 border border-blue-200"
              title="Xem toàn màn hình"
            >
              <Eye className="h-5 w-5" />
            </button>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-white hover:bg-green-50 hover:shadow-lg text-green-600 hover:text-green-700 transition-all duration-300 border border-green-200"
              title="Tải xuống"
            >
              <Download className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      
      {/* Reactions - Beautiful design */}
      <div className="px-8 py-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        <ReactionButton
          entityType="attachment"
          entityId={attachment.id}
          currentUserId={null} // Khách hàng có thể không có user ID
          compact={true}
        />
      </div>
      
      {/* Beautiful Comment Toggle Button */}
      <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold">
            {isExpanded ? 'Ẩn bình luận' : 'Xem bình luận'}
          </span>
        </button>
        
        {/* Comments Content - Only when expanded */}
        {isExpanded && (
          <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-lg">
            <CompactComments
              entityType="attachment"
              entityId={attachment.id}
              timelineId={timelineId}
              currentUserId={null} // Khách hàng có thể không có user ID
              authorName={authorName}
              onCommentAdded={() => {
                console.log('Có bình luận mới cho hình ảnh:', attachment.id);
              }}
              onReactionAdded={() => {
                console.log('Có phản ứng mới cho hình ảnh:', attachment.id);
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
