'use client'

import React from 'react'
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  AlertCircle 
} from 'lucide-react'

interface SupportContactTabProps {
  searchTerm: string
  onCreateGuide?: () => void
}

export default function SupportContactTab({ searchTerm, onCreateGuide }: SupportContactTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Liên hệ Hỗ trợ</h3>
        <p className="text-black mb-6">
          Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Hỗ trợ Trực tuyến
          </h4>
          <p className="text-black text-sm mb-4">
            Nhận hỗ trợ nhanh chóng qua chat trực tuyến
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            Bắt đầu Chat
          </button>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600" />
            Email Hỗ trợ
          </h4>
          <p className="text-black text-sm mb-4">
            Gửi email để nhận hỗ trợ chi tiết
          </p>
          <a 
            href="mailto:support@company.com"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm inline-block"
          >
            Gửi Email
          </a>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-purple-600" />
            Điện thoại
          </h4>
          <p className="text-black text-sm mb-4">
            Gọi điện để được hỗ trợ trực tiếp
          </p>
          <a 
            href="tel:+84123456789"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm inline-block"
          >
            Gọi ngay
          </a>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Giờ làm việc
          </h4>
          <p className="text-black text-sm mb-2">
            <strong>Thứ 2 - Thứ 6:</strong> 8:00 - 17:00
          </p>
          <p className="text-black text-sm">
            <strong>Thứ 7:</strong> 8:00 - 12:00
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> Để nhận hỗ trợ tốt nhất, vui lòng cung cấp thông tin chi tiết về vấn đề bạn đang gặp phải.
            </p>
          </div>
        </div>
      </div>

      {/* Support Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Thống kê Hỗ trợ</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">98%</div>
            <div className="text-sm text-black">Hài lòng</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">2h</div>
            <div className="text-sm text-black">Phản hồi TB</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">24/7</div>
            <div className="text-sm text-black">Hỗ trợ</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">1000+</div>
            <div className="text-sm text-black">Khách hàng</div>
          </div>
        </div>
      </div>
    </div>
  )
}
