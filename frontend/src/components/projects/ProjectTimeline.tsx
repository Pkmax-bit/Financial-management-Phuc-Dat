'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Calendar, 
  Clock, 
  User, 
  Upload, 
  FileText, 
  Image, 
  Download,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

interface ProjectTimelineProps {
  projectId: string
  projectName: string
}

const typeConfig = {
  milestone: {
    label: 'Mốc quan trọng',
    icon: CheckCircle,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  update: {
    label: 'Cập nhật tiến độ',
    icon: Info,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  issue: {
    label: 'Vấn đề',
    icon: AlertCircle,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700'
  },
  meeting: {
    label: 'Cuộc họp',
    icon: User,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  }
}

const statusConfig = {
  completed: {
    label: 'Hoàn thành',
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500'
  },
  in_progress: {
    label: 'Đang thực hiện',
    color: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500'
  },
  pending: {
    label: 'Chờ xử lý',
    color: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-500'
  }
}

export default function ProjectTimeline({ projectId, projectName }: ProjectTimelineProps) {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `Timeline/${projectId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('minhchung_chiphi')
      .upload(filePath, file)

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('minhchung_chiphi')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingFiles(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadFileToSupabase(file)
        return {
          name: file.name,
          url,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.includes('pdf') || file.type.includes('document') ? 'document' : 'other',
          size: file.size,
          uploaded_at: new Date().toISOString()
        }
      })

      const attachments = await Promise.all(uploadPromises)
      return attachments
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return []
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleAddEntry = async (entryData: Omit<TimelineEntry, 'id' | 'created_at' | 'attachments'>) => {
    try {
      let attachments: Attachment[] = []
      
      if (selectedFiles.length > 0) {
        const fileList = new DataTransfer()
        selectedFiles.forEach(file => fileList.items.add(file))
        attachments = await handleFileUpload(fileList.files)
      }

      const response = await fetch(`/api/projects/${projectId}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entryData,
          attachments
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add timeline entry')
      }

      await fetchTimelineEntries()
      setShowAddForm(false)
      setSelectedFiles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleUpdateEntry = async (entryId: string, entryData: Partial<TimelineEntry>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/timeline/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      })

      if (!response.ok) {
        throw new Error('Failed to update timeline entry')
      }

      await fetchTimelineEntries()
      setEditingEntry(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/timeline/${entryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete timeline entry')
      }

      await fetchTimelineEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image
      case 'document':
        return FileText
      default:
        return FileText
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchTimelineEntries}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Timeline dự án</h3>
          <p className="text-gray-600">Theo dõi tiến độ và ghi nhận thời gian dự án {projectName}</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Thêm mục timeline
        </button>
      </div>

      {/* Timeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng mục</p>
              <p className="text-2xl font-bold text-gray-900">{timelineEntries.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">
                {timelineEntries.filter(e => e.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đang thực hiện</p>
              <p className="text-2xl font-bold text-gray-900">
                {timelineEntries.filter(e => e.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Upload className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tệp đính kèm</p>
              <p className="text-2xl font-bold text-gray-900">
                {timelineEntries.reduce((total, entry) => total + entry.attachments.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Entries */}
      <div className="space-y-4">
        {timelineEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Chưa có mục nào trong timeline</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thêm mục đầu tiên
            </button>
          </div>
        ) : (
          timelineEntries
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((entry) => {
              const typeInfo = typeConfig[entry.type]
              const statusInfo = statusConfig[entry.status]
              const TypeIcon = typeInfo.icon

              return (
                <div key={entry.id} className="bg-white rounded-lg shadow-sm border">
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

                          {/* Attachments */}
                          {entry.attachments.length > 0 && (
                            <div className="border-t pt-4">
                              <h5 className="text-sm font-medium text-gray-900 mb-3">Tệp đính kèm</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {entry.attachments.map((attachment) => {
                                  const FileIcon = getFileIcon(attachment.type)
                                  
                                  return (
                                    <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
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
                                        className="p-1 text-gray-500 hover:text-blue-600"
                                      >
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
        )}
      </div>

      {/* Add/Edit Entry Form */}
      {(showAddForm || editingEntry) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingEntry ? 'Chỉnh sửa mục timeline' : 'Thêm mục timeline mới'}
              </h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const entryData = {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  date: formData.get('date') as string,
                  type: formData.get('type') as TimelineEntry['type'],
                  status: formData.get('status') as TimelineEntry['status'],
                  created_by: formData.get('created_by') as string
                }

                if (editingEntry) {
                  await handleUpdateEntry(editingEntry.id, entryData)
                } else {
                  await handleAddEntry(entryData)
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiêu đề *
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editingEntry?.title || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả *
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingEntry?.description || ''}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày *
                      </label>
                      <input
                        type="datetime-local"
                        name="date"
                        defaultValue={editingEntry?.date || ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại *
                      </label>
                      <select
                        name="type"
                        defaultValue={editingEntry?.type || ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Chọn loại</option>
                        <option value="milestone">Mốc quan trọng</option>
                        <option value="update">Cập nhật tiến độ</option>
                        <option value="issue">Vấn đề</option>
                        <option value="meeting">Cuộc họp</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái *
                      </label>
                      <select
                        name="status"
                        defaultValue={editingEntry?.status || 'pending'}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="in_progress">Đang thực hiện</option>
                        <option value="completed">Hoàn thành</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tạo bởi *
                      </label>
                      <input
                        type="text"
                        name="created_by"
                        defaultValue={editingEntry?.created_by || ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  {!editingEntry && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tệp đính kèm
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              setSelectedFiles(Array.from(e.target.files))
                            }
                          }}
                          className="hidden"
                        />
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Kéo thả tệp vào đây hoặc{' '}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            chọn tệp
                          </button>
                        </p>
                        {selectedFiles.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Đã chọn {selectedFiles.length} tệp
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedFiles.map((file, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {file.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {uploadingFiles && (
                          <div className="mt-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-1">Đang tải lên...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={uploadingFiles}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {editingEntry ? 'Cập nhật' : 'Thêm mục'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingEntry(null)
                      setSelectedFiles([])
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
