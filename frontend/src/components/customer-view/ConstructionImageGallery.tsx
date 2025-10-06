'use client'

import { useState } from 'react'
import { 
  Image, 
  Download, 
  Eye, 
  Calendar, 
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Grid,
  List,
  Filter,
  Search
} from 'lucide-react'

interface ConstructionImage {
  id: string
  name: string
  url: string
  size: number
  uploaded_at: string
  timeline_entry?: {
    title: string
    date: string
    type: string
  }
}

interface ConstructionImageGalleryProps {
  images: ConstructionImage[]
  projectName?: string
}

export default function ConstructionImageGallery({ images, projectName }: ConstructionImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return '🏗️'
      case 'update':
        return '📋'
      case 'issue':
        return '⚠️'
      case 'meeting':
        return '🤝'
      default:
        return '📷'
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

  const filteredImages = images.filter(image => {
    const matchesSearch = image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.timeline_entry?.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || image.timeline_entry?.type === filterType
    return matchesSearch && matchesType
  })

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    const index = filteredImages.findIndex(img => img.url === imageUrl)
    setCurrentImageIndex(index >= 0 ? index : 0)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  const nextImage = () => {
    if (currentImageIndex < filteredImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
      setSelectedImage(filteredImages[currentImageIndex + 1].url)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
      setSelectedImage(filteredImages[currentImageIndex - 1].url)
    }
  }

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có hình ảnh</h3>
        <p className="text-gray-600">Chưa có hình ảnh nào được upload lên Storage.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Hình ảnh quá trình thi công</h2>
            <p className="text-gray-600 text-sm mt-1">
              {projectName && `${projectName} • `}
              {filteredImages.length} hình ảnh từ Storage
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

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm hình ảnh..."
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

      {/* Images Grid/List */}
      <div className="p-6">
        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy hình ảnh</h3>
            <p className="text-gray-600">Không có hình ảnh nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-4'}>
            {filteredImages.map((image, index) => (
              <div key={image.id} className="group relative">
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                       onClick={() => openImageModal(image.url)}>
                    <img 
                      src={image.url} 
                      alt={image.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    
                    {/* Image Info Overlay */}
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
                ) : (
                  // List View
                  <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={image.url} 
                        alt={image.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openImageModal(image.url)}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{image.name}</h4>
                        {image.timeline_entry && (
                          <span className="text-xs text-gray-500">
                            {getTypeIcon(image.timeline_entry.type)} {getTypeText(image.timeline_entry.type)}
                          </span>
                        )}
                      </div>
                      {image.timeline_entry && (
                        <p className="text-xs text-gray-600 mb-1">{image.timeline_entry.title}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(image.uploaded_at)}
                        </span>
                        <span>{formatFileSize(image.size)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openImageModal(image.url)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem hình ảnh"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Tải xuống"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
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
            
            {filteredImages.length > 1 && (
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
                  disabled={currentImageIndex === filteredImages.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
            
            <img
              src={selectedImage}
              alt="Construction image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {filteredImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                {currentImageIndex + 1} / {filteredImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
