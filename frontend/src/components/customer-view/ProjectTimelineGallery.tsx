'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Image, 
  FileText, 
  Download, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  X
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  company: string
  created_at: string
  updated_at: string
  projects_count: number
  total_projects_value: number
}

interface Project {
  id: string
  name: string
  project_code: string
  status: string
  progress: number
  start_date: string
  end_date: string
  budget: number
  actual_cost: number
  customer_id: string
  customer_name: string
  manager_name: string
}

interface TimelineEntry {
  id: string
  title: string
  description: string
  date: string
  type: string
  status: string
  created_by?: string
  attachments: TimelineAttachment[]
}

interface TimelineAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploaded_at: string
}

interface ProjectTimelineGalleryProps {
  customer: Customer
  projects: Project[]
  timelineEntries: TimelineEntry[]
}

export default function ProjectTimelineGallery({ customer, projects, timelineEntries }: ProjectTimelineGalleryProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] || null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <Star className="h-4 w-4 text-yellow-500" />
      case 'update':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'issue':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'meeting':
        return <Calendar className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'Cột mốc'
      case 'update':
        return 'Cập nhật'
      case 'issue':
        return 'Vấn đề'
      case 'meeting':
        return 'Cuộc họp'
      default:
        return 'Khác'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành'
      case 'in_progress':
        return 'Đang thực hiện'
      case 'pending':
        return 'Chờ xử lý'
      default:
        return 'Không xác định'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />
    }
    return <FileText className="h-4 w-4 text-gray-500" />
  }

  const filteredEntries = timelineEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || entry.type === filterType
    return matchesSearch && matchesType
  })

  const allImages = timelineEntries
    .flatMap(entry => entry.attachments)
    .filter(attachment => attachment.type === 'image' || attachment.type.startsWith('image/'))

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    const index = allImages.findIndex(img => img.url === imageUrl)
    setCurrentImageIndex(index >= 0 ? index : 0)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  const nextImage = () => {
    if (currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
      setSelectedImage(allImages[currentImageIndex + 1].url)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
      setSelectedImage(allImages[currentImageIndex - 1].url)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Timeline công trình</h2>
            <p className="text-gray-600 text-sm mt-1">
              {timelineEntries.length} mục timeline • {allImages.length} hình ảnh
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={viewMode === 'grid' ? 'Chuyển sang danh sách' : 'Chuyển sang lưới'}
            >
              {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      {projects.length > 1 && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Chọn dự án</h3>
          <div className="flex flex-wrap gap-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedProject?.id === project.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {project.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm timeline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">Tất cả loại</option>
              <option value="milestone">Cột mốc</option>
              <option value="update">Cập nhật</option>
              <option value="issue">Vấn đề</option>
              <option value="meeting">Cuộc họp</option>
            </select>
          </div>
        </div>
      </div>

      {/* All Images Gallery */}
      {allImages.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Hình ảnh quá trình thi công</h3>
              <p className="text-gray-600 text-sm">Tất cả hình ảnh từ timeline ({allImages.length} hình)</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={viewMode === 'grid' ? 'Chuyển sang danh sách' : 'Chuyển sang lưới'}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {/* Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allImages.map((image, index) => (
              <div key={image.id} className="group relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                     onClick={() => openImageModal(image.url)}>
                  <img 
                    src={image.url} 
                    alt={image.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
                
                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-lg">
                  <p className="text-xs text-white truncate">{image.name}</p>
                  <p className="text-xs text-gray-300">{formatFileSize(image.size)}</p>
                </div>
                
                {/* Image Number */}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {index + 1}
                </div>
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openImageModal(image.url)}
                      className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                      title="Xem hình ảnh"
                    >
                      <Eye className="h-3 w-3 text-gray-700" />
                    </button>
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                      title="Tải xuống"
                    >
                      <Download className="h-3 w-3 text-gray-700" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Content */}
      <div className="p-6">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có timeline</h3>
            <p className="text-gray-600">Chưa có mục timeline nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
            {filteredEntries.map((entry) => (
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
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                      {getStatusIcon(entry.status)}
                      <span className="ml-1">{getStatusText(entry.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{entry.title}</h4>
                  <p className="text-gray-700 mb-4">{entry.description}</p>

                  {/* Facebook-style Images */}
                  {entry.attachments.filter(att => att.type === 'image' || att.type.startsWith('image/')).length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-1 gap-4">
                        {entry.attachments
                          .filter(att => att.type === 'image' || att.type.startsWith('image/'))
                          .map((attachment) => (
                            <div key={attachment.id} className="group relative">
                              <div className="bg-gray-100 rounded-lg overflow-hidden">
                                <div className="aspect-[4/3] w-full">
                                  <img 
                                    src={attachment.url} 
                                    alt={attachment.name}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                  />
                                </div>
                              </div>
                              {/* Image info overlay */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-lg">
                                <p className="text-xs text-white truncate">{attachment.name}</p>
                                <p className="text-xs text-gray-300">{formatFileSize(attachment.size)}</p>
                              </div>
                            </div>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  disabled={currentImageIndex === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={nextImage}
                  disabled={currentImageIndex === allImages.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
            
            <img
              src={selectedImage}
              alt="Timeline image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
