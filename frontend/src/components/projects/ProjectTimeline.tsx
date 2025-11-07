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
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import TimelineEntryWithImages from './TimelineEntryWithImages'
import { getApiEndpoint } from '@/lib/apiUrl'

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
  currentUser?: {
    full_name?: string;
    email?: string;
    id?: string;
  };
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

export default function ProjectTimeline({ projectId, projectName, currentUser }: ProjectTimelineProps) {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editingFiles, setEditingFiles] = useState<File[]>([])
  const [uploadingEditFiles, setUploadingEditFiles] = useState(false)
  const [deletingAttachments, setDeletingAttachments] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTimelineEntries()
  }, [projectId])

  const fetchTimelineEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiEndpoint(`/api/projects/${projectId}/timeline`))
      
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

  const uploadFileToAPI = async (file: File): Promise<Attachment> => {
    try {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported. Please upload JPG, PNG, GIF, WebP, or PDF files.')
      }

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Upload via API endpoint
      const response = await fetch(`/api/projects/${projectId}/timeline/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.attachment
    } catch (err) {
      console.error('Upload error:', err)
      throw err
    }
  }

  const handleFileUpload = async (files: FileList | null): Promise<Attachment[]> => {
    if (!files || files.length === 0) return []

    setUploadingFiles(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const attachment = await uploadFileToAPI(file)
        return attachment
      })

      const attachments = await Promise.all(uploadPromises)
      return attachments || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return []
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleEditFileUpload = async (files: FileList | null): Promise<Attachment[]> => {
    if (!files || files.length === 0) return []

    setUploadingEditFiles(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const attachment = await uploadFileToAPI(file)
        return attachment
      })

      const attachments = await Promise.all(uploadPromises)
      return attachments || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return []
    } finally {
      setUploadingEditFiles(false)
    }
  }

  const handleAddEntry = async (entryData: Omit<TimelineEntry, 'id' | 'created_at' | 'attachments'>) => {
    try {
      let attachments: Attachment[] = []
      
      if (selectedFiles.length > 0) {
        const fileList = new DataTransfer()
        selectedFiles.forEach(file => fileList.items.add(file))
        const uploadedAttachments = await handleFileUpload(fileList.files)
        attachments = uploadedAttachments || []
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

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      setDeletingAttachments(prev => new Set(prev).add(attachmentId))
      
      const response = await fetch(`/api/projects/${projectId}/timeline/attachments/${attachmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete attachment')
      }

      // Update local state
      if (editingEntry) {
        setEditingEntry({
          ...editingEntry,
          attachments: editingEntry.attachments.filter(att => att.id !== attachmentId)
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attachment')
    } finally {
      setDeletingAttachments(prev => {
        const newSet = new Set(prev)
        newSet.delete(attachmentId)
        return newSet
      })
    }
  }

  const handleUpdateEntry = async (entryId: string, entryData: Partial<TimelineEntry>) => {
    try {
      let attachments: Attachment[] = []
      
      // Upload new files if any
      if (editingFiles.length > 0) {
        const fileList = new DataTransfer()
        editingFiles.forEach(file => fileList.items.add(file))
        attachments = await handleEditFileUpload(fileList.files)
      }

      // Prepare update data
      const updateData = { ...entryData }
      if (attachments.length > 0) {
        updateData.attachments = attachments
      }

      const response = await fetch(`/api/projects/${projectId}/timeline/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to update timeline entry')
      }

      await fetchTimelineEntries()
      setEditingEntry(null)
      setEditingFiles([])
      setDeletingAttachments(new Set())
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
            .map((entry) => (
              <TimelineEntryWithImages
                key={entry.id}
                entry={entry}
                typeConfig={typeConfig}
                statusConfig={statusConfig}
                formatDate={formatDate}
                formatFileSize={formatFileSize}
                getFileIcon={getFileIcon}
                onEdit={setEditingEntry}
                onDelete={handleDeleteEntry}
                onImageClick={openImagePreview}
                currentUser={currentUser}
              />
            ))
        )}
      </div>

      {/* Add/Edit Entry Form */}
      {(showAddForm || editingEntry) && (
        <div className="fixed top-16 right-4 z-50 w-full max-w-4xl">
          {/* Right Sidebar - No overlay to not block interface */}
          <div className="bg-white shadow-2xl border border-gray-200 rounded-lg max-h-[85vh] overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingEntry ? 'Chỉnh sửa mục timeline' : 'Thêm mục timeline mới'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {editingEntry ? 'Cập nhật thông tin mục timeline' : 'Tạo mục timeline mới cho dự án'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingEntry(null)
                  setSelectedFiles([])
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 text-gray-900">
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const entryData = {
                  project_id: projectId,
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
                        defaultValue={editingEntry?.created_by || currentUser?.full_name || ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {editingEntry ? 'Thêm tệp đính kèm mới' : 'Tệp đính kèm'}
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          ref={editingEntry ? editFileInputRef : fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={(e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files)
                              if (editingEntry) {
                                setEditingFiles(files)
                              } else {
                                setSelectedFiles(files)
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Kéo thả tệp vào đây hoặc{' '}
                          <button
                            type="button"
                            onClick={() => {
                              if (editingEntry) {
                                editFileInputRef.current?.click()
                              } else {
                                fileInputRef.current?.click()
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            chọn tệp
                          </button>
                        </p>
                        {/* Show selected files for add mode */}
                        {!editingEntry && selectedFiles.length > 0 && (
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

                        {/* Show selected files for edit mode */}
                        {editingEntry && editingFiles.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Sẽ thêm {editingFiles.length} tệp mới
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {editingFiles.map((file, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                >
                                  {file.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(uploadingFiles || uploadingEditFiles) && (
                          <div className="mt-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-1">Đang tải lên...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Show existing attachments for edit mode */}
                    {editingEntry && editingEntry.attachments.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Tệp đính kèm hiện tại:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {editingEntry.attachments.map((attachment) => (
                            <div key={attachment.id} className="relative group flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              {attachment.type === 'image' ? (
                                <img 
                                  src={attachment.url} 
                                  alt={attachment.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : (
                                <FileText className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="text-xs text-gray-700 truncate flex-1">{attachment.name}</span>
                              <button
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                disabled={deletingAttachments.has(attachment.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                                title="Xóa tệp"
                              >
                                {deletingAttachments.has(attachment.id) ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={uploadingFiles || uploadingEditFiles}
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
                      setEditingFiles([])
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

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeImagePreview}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
