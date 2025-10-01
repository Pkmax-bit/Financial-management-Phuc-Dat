'use client'

import { useState } from 'react'
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react'

interface VideoGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function VideoGuideModal({ isOpen, onClose }: VideoGuideModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(0)

  const videos = [
    {
      title: 'Tạo báo giá mới',
      description: 'Hướng dẫn tạo báo giá cho khách hàng tiềm năng',
      duration: '2:30',
      steps: [
        'Nhấn nút "Tạo báo giá"',
        'Điền thông tin khách hàng',
        'Thêm sản phẩm/dịch vụ',
        'Kiểm tra tổng tiền',
        'Lưu báo giá'
      ]
    },
    {
      title: 'Gửi hóa đơn',
      description: 'Cách gửi hóa đơn và ghi nhận thanh toán',
      duration: '3:15',
      steps: [
        'Chuyển báo giá thành hóa đơn',
        'Gửi hóa đơn cho khách hàng',
        'Ghi nhận thanh toán',
        'Theo dõi trạng thái'
      ]
    },
    {
      title: 'Bán hàng trực tiếp',
      description: 'Tạo phiếu thu cho bán hàng tại chỗ',
      duration: '2:45',
      steps: [
        'Chọn tab Sales Receipts',
        'Tạo phiếu thu mới',
        'Chọn khách hàng',
        'Thêm sản phẩm',
        'Chọn phương thức thanh toán'
      ]
    },
    {
      title: 'Xử lý trả hàng',
      description: 'Tạo credit memo cho trả hàng',
      duration: '2:20',
      steps: [
        'Chọn tab Credit Memos',
        'Tạo credit memo',
        'Áp dụng vào hóa đơn',
        'Hoặc hoàn tiền trực tiếp'
      ]
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Hướng dẫn video Sales</h2>
            <p className="text-sm text-black">Xem video hướng dẫn từng bước</p>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-black"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Video Player */}
          <div className="flex-1 p-6">
            <div className="bg-gray-900 rounded-lg aspect-video relative overflow-hidden">
              {/* Video Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">{videos[currentVideo].title}</p>
                  <p className="text-sm opacity-75">{videos[currentVideo].description}</p>
                  <p className="text-xs opacity-50 mt-2">Thời lượng: {videos[currentVideo].duration}</p>
                </div>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white hover:text-gray-300"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </button>
                  
                  <div className="flex-1 bg-gray-600 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }} />
                  </div>
                  
                  <span className="text-white text-sm">1:30 / {videos[currentVideo].duration}</span>
                  
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:text-gray-300"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-white hover:text-gray-300"
                  >
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900">{videos[currentVideo].title}</h3>
              <p className="text-black mt-1">{videos[currentVideo].description}</p>
            </div>
          </div>

          {/* Video List */}
          <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Danh sách video</h4>
            <div className="space-y-3">
              {videos.map((video, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentVideo(index)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    currentVideo === index
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{video.title}</span>
                    <span className="text-xs text-black">{video.duration}</span>
                  </div>
                  <p className="text-sm text-black mb-3">{video.description}</p>
                  <div className="flex items-center text-xs text-black">
                    <Play className="h-3 w-3 mr-1" />
                    {index === currentVideo ? 'Đang phát' : 'Nhấn để phát'}
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Steps */}
            <div className="mt-6">
              <h5 className="text-sm font-semibold text-gray-900 mb-3">Các bước trong video:</h5>
              <ul className="space-y-2">
                {videos[currentVideo].steps.map((step, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentVideo(Math.max(0, currentVideo - 1))}
              disabled={currentVideo === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Video trước
            </button>
            <button
              onClick={() => setCurrentVideo(Math.min(videos.length - 1, currentVideo + 1))}
              disabled={currentVideo === videos.length - 1}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Video tiếp theo
              <Play className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div className="text-sm text-black">
            Video {currentVideo + 1} / {videos.length}
          </div>
        </div>
      </div>
    </div>
  )
}
