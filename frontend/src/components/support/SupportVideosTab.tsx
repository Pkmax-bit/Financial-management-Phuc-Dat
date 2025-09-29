'use client'

import React, { useState } from 'react'
import { Play, Pause, Clock } from 'lucide-react'

interface SupportVideosTabProps {
  searchTerm: string
  onCreateGuide?: () => void
}

const videoTutorials = [
  {
    id: 1,
    title: 'Tổng quan hệ thống',
    duration: '5:30',
    thumbnail: '/videos/overview-thumb.jpg',
    description: 'Giới thiệu tổng quan về các chức năng chính'
  },
  {
    id: 2,
    title: 'Hướng dẫn Bán hàng',
    duration: '8:15',
    thumbnail: '/videos/sales-thumb.jpg',
    description: 'Từ tạo hóa đơn đến thu tiền'
  },
  {
    id: 3,
    title: 'Quản lý Chi phí',
    duration: '7:45',
    thumbnail: '/videos/expenses-thumb.jpg',
    description: 'Thiết lập ngân sách và quản lý chi phí'
  },
  {
    id: 4,
    title: 'Báo cáo & Phân tích',
    duration: '6:20',
    thumbnail: '/videos/reports-thumb.jpg',
    description: 'Tạo và xem các báo cáo tài chính'
  }
]

export default function SupportVideosTab({ searchTerm, onCreateGuide }: SupportVideosTabProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Video Hướng dẫn</h3>
        <p className="text-gray-600 mb-6">
          Xem video minh họa để hiểu rõ cách sử dụng hệ thống
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoTutorials.map((video) => (
          <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="relative bg-gray-200 h-48 flex items-center justify-center">
              <button
                onClick={() => {
                  setCurrentVideo(currentVideo === video.id ? null : video.id)
                  setIsPlaying(currentVideo === video.id ? !isPlaying : true)
                }}
                className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all"
              >
                {currentVideo === video.id && isPlaying ? (
                  <Pause className="h-8 w-8 text-gray-700" />
                ) : (
                  <Play className="h-8 w-8 text-gray-700" />
                )}
              </button>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {video.duration}
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{video.title}</h4>
              <p className="text-gray-600 text-sm">{video.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Video Categories */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Danh mục Video</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="text-2xl font-bold text-blue-600">4</div>
            <div className="text-sm text-gray-500">Tổng quan</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-gray-500">Bán hàng</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="text-2xl font-bold text-orange-600">6</div>
            <div className="text-sm text-gray-500">Chi phí</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="text-2xl font-bold text-purple-600">5</div>
            <div className="text-sm text-gray-500">Báo cáo</div>
          </div>
        </div>
      </div>

      {/* Video Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-green-900 mb-3">Mẹo xem Video</h4>
        <ul className="space-y-2 text-sm text-green-800">
          <li>• Xem video theo thứ tự để hiểu rõ luồng hoạt động</li>
          <li>• Tạm dừng video để thực hành theo từng bước</li>
          <li>• Sử dụng chức năng tua nhanh/chậm nếu cần</li>
          <li>• Ghi chú lại các điểm quan trọng</li>
        </ul>
      </div>
    </div>
  )
}
