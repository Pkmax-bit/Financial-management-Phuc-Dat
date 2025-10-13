'use client'

import React, { useState } from 'react'
import { 
  Calendar, 
  User, 
  Download,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Image as ImageIcon,
  EyeOff
} from 'lucide-react'
import ImageWithReactions from '@/components/customer-view/ImageWithReactions'

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

interface TimelineEntryWithImagesProps {
  entry: TimelineEntry
  typeConfig: any
  statusConfig: any
  formatDate: (dateString: string) => string
  formatFileSize: (bytes: number) => string
  getFileIcon: (type: string) => any
  onEdit: (entry: TimelineEntry) => void
  onDelete: (entryId: string) => void
  onImageClick: (imageUrl: string) => void
  currentUser?: {
    full_name?: string;
    email?: string;
    id?: string;
  };
}

export default function TimelineEntryWithImages({
  entry,
  typeConfig,
  statusConfig,
  formatDate,
  formatFileSize,
  getFileIcon,
  onEdit,
  onDelete,
  onImageClick,
  currentUser
}: TimelineEntryWithImagesProps) {
  const [showImages, setShowImages] = useState(false)
  const [expandedAttachments, setExpandedAttachments] = useState(false)

  const typeInfo = typeConfig[entry.type]
  const statusInfo = statusConfig[entry.status]
  const TypeIcon = typeInfo.icon

  const imageAttachments = entry.attachments.filter(att => att.type === 'image' || att.type.startsWith('image/'))
  const otherAttachments = entry.attachments.filter(att => att.type !== 'image' && !att.type.startsWith('image/'))

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Timeline dot */}
            <div className="relative">
              <div className={`w-4 h-4 rounded-full ${typeInfo.color}`}></div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${statusInfo.dotColor}`}></div>
            </div>

            {/* Entry content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${typeInfo.bgColor}`}>
                  <TypeIcon className={`h-4 w-4 ${typeInfo.textColor}`} />
                  <span className={`text-sm font-medium ${typeInfo.textColor}`}>
                    {typeInfo.label}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-2">{entry.title}</h4>
              <p className="text-gray-600 mb-3">{entry.description}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(entry.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Tạo bởi: {entry.created_by}</span>
                </div>
              </div>

              {/* Images Section with Toggle */}
              {imageAttachments.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Hình ảnh ({imageAttachments.length})
                      </span>
                    </div>
                    <button
                      onClick={() => setShowImages(!showImages)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                    >
                      {showImages ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          <span className="text-sm">Ẩn hình ảnh</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">Hiện hình ảnh</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {showImages && (
                    <div className="space-y-6">
                      {imageAttachments.map((attachment) => (
                        <ImageWithReactions
                          key={attachment.id}
                          attachment={attachment}
                          timelineId={entry.id}
                          onImageClick={onImageClick}
                          authorName={currentUser?.full_name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Other Attachments */}
              {otherAttachments.length > 0 && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setExpandedAttachments(!expandedAttachments)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3 hover:text-blue-600 transition-colors"
                  >
                    <span>Tệp đính kèm khác ({otherAttachments.length})</span>
                    {expandedAttachments ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedAttachments && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {otherAttachments.map((attachment) => {
                        const FileIcon = getFileIcon(attachment.type)
                        
                        return (
                          <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <FileIcon className="h-5 w-5 text-gray-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Tải xuống"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(entry)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
