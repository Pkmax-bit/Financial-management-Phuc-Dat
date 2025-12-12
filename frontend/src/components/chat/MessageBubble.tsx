'use client'

import { Message } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Edit2, Trash2, Reply, Copy, Forward, Download, FileText } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  currentUserId: string
  onEdit?: (message: Message) => void
  onDelete?: (messageId: string) => void
  onReply?: (message: Message) => void
  onCopy?: (text: string) => void
  onForward?: (message: Message) => void
  onDownload?: (url: string, filename: string) => void
  showAvatar?: boolean
  showSenderName?: boolean
  maxWidth?: string
}

export default function MessageBubble({
  message,
  isOwn,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
  onCopy,
  onForward,
  onDownload,
  showAvatar = false,
  showSenderName = true,
  maxWidth = '75%'
}: MessageBubbleProps) {
  const isDeleted = message.is_deleted

  return (
    <div className={`flex group ${isOwn ? 'justify-end' : 'justify-start'} w-full px-1`}>
      <div 
        className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        style={{ 
          maxWidth: maxWidth, 
          width: '100%',
          minWidth: 0
        }}
      >
        {/* Avatar (only for others and when showAvatar is true) */}
        {!isOwn && showAvatar && (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm">
            {message.sender_name?.charAt(0) || 'U'}
          </div>
        )}

        {/* Message Bubble Container */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
          {/* Sender Name (only for others) */}
          {!isOwn && showSenderName && (
            <span className="text-xs text-gray-500 mb-1 px-1 font-medium">
              {message.sender_name || 'Unknown'}
            </span>
          )}

          {/* Reply Preview */}
          {message.reply_to && (
            <div 
              className={`mb-1.5 px-3 py-1.5 rounded-lg text-xs ${
                isOwn 
                  ? 'bg-white/20 text-white/90 border-l-3 border-white/40' 
                  : 'bg-gray-100 text-gray-700 border-l-3 border-[#0084ff]'
              }`}
              style={{ 
                maxWidth: '100%',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              <div className={`font-semibold mb-0.5 ${isOwn ? 'text-white/80' : 'text-[#0084ff]'}`}>
                {message.reply_to.sender_name}
              </div>
              <div 
                className="break-words whitespace-pre-wrap truncate"
                style={{ 
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {message.reply_to.message_text}
              </div>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`px-3 py-2 rounded-2xl border shadow-sm ${
              isOwn
                ? 'bg-[#0084ff] text-white rounded-tr-sm border-blue-200'
                : 'bg-white text-gray-800 rounded-tl-sm border-gray-200'
            } ${isDeleted ? 'opacity-60 italic' : ''}`}
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: '100%',
              minWidth: 0,
              width: 'fit-content'
            }}
          >
            {isDeleted ? (
              <span className="text-sm">Tin nhắn đã bị xóa</span>
            ) : (
              <>
                {/* File/Image Preview */}
                {message.file_url && (
                  <div className="mb-2 -mx-1">
                    {message.message_type === 'image' ? (
                      <div className="relative group">
                        <img 
                          src={message.file_url} 
                          alt={message.file_name || 'Image'}
                          className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ 
                            maxWidth: '100%',
                            height: 'auto',
                            display: 'block'
                          }}
                          onClick={() => window.open(message.file_url, '_blank')}
                        />
                        {onDownload && (
                          <button
                            onClick={() => onDownload(message.file_url!, message.file_name || 'image')}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Tải xuống"
                          >
                            <Download className="w-4 h-4 text-white" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm ${
                        isOwn ? 'bg-white/30 border-blue-200' : 'bg-gray-100 border-gray-200'
                      }`}>
                        <FileText className="w-5 h-5 flex-shrink-0 text-gray-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-900">
                            {message.file_name || 'File'}
                          </p>
                          {message.file_size && (
                            <p className="text-xs text-gray-500">
                              {(message.file_size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                        {onDownload && (
                          <button
                            onClick={() => onDownload(message.file_url!, message.file_name || 'file')}
                            className="p-1 rounded transition-colors hover:bg-gray-200 flex-shrink-0"
                            title="Tải xuống"
                          >
                            <Download className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Text */}
                {message.message_text && (
                  <div 
                    className="text-sm whitespace-pre-wrap break-words leading-relaxed"
                    style={{ 
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      minWidth: 0,
                      display: 'block',
                      overflow: 'hidden'
                    }}
                  >
                    {message.message_text}
                  </div>
                )}

                {/* Edited Indicator */}
                {message.is_edited && (
                  <span 
                    className={`text-xs opacity-70 ml-1 ${isOwn ? 'text-white/80' : 'text-gray-500'}`}
                    style={{ display: 'inline-block' }}
                  >
                    (đã chỉnh sửa)
                  </span>
                )}
              </>
            )}
          </div>

          {/* Time and Actions */}
          <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className={`text-xs ${isOwn ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date(message.created_at).toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            
            {/* Message Actions */}
            {!isDeleted && (
              <div className={`flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {isOwn && onEdit && (
                  <button
                    onClick={() => onEdit(message)}
                    className="p-1.5 rounded transition-colors hover:bg-gray-200 text-gray-900"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {isOwn && onDelete && (
                  <button
                    onClick={() => onDelete(message.id)}
                    className="p-1.5 rounded transition-colors hover:bg-gray-200 text-gray-900"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onReply && (
                  <button
                    onClick={() => onReply(message)}
                    className="p-1.5 rounded transition-colors hover:bg-gray-200 text-gray-900"
                    title="Trả lời"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                )}
                {onCopy && (
                  <button
                    onClick={() => onCopy(message.message_text)}
                    className="p-1.5 rounded transition-colors hover:bg-gray-200 text-gray-900"
                    title="Sao chép"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
                {onForward && (
                  <button
                    onClick={() => onForward(message)}
                    className="p-1.5 rounded transition-colors hover:bg-gray-200 text-gray-900"
                    title="Chuyển tiếp"
                  >
                    <Forward className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

