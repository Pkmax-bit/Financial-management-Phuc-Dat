'use client'

import { useState } from 'react'
import ExpensesDirectTab from '@/components/expenses/ExpensesDirectTab'
import { Search } from 'lucide-react'

export default function ExpenseComparisonPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'direct' | 'api'>('direct')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              So sánh phương pháp kết nối Supabase
            </h1>
            <p className="mt-2 text-black">
              Test cả hai phương pháp: Trực tiếp Supabase và thông qua API Backend
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('direct')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'direct'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Supabase Trực tiếp
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'api'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              API Backend (Hiện tại lỗi 403)
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm chi phí..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'direct' && (
              <div>
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">
                    ✅ Phương pháp Supabase Trực tiếp
                  </h3>
                  <p className="text-sm text-green-700">
                    Kết nối trực tiếp với Supabase từ frontend, không thông qua backend API. 
                    Phương pháp này bypass hoàn toàn backend và sử dụng Supabase JS client.
                  </p>
                  <div className="mt-2 text-xs text-green-600">
                    <strong>Ưu điểm:</strong> Nhanh, không phụ thuộc backend, real-time
                    <br />
                    <strong>Nhược điểm:</strong> Logic business ở frontend, khó kiểm soát quyền
                  </div>
                </div>
                <ExpensesDirectTab searchTerm={searchTerm} />
              </div>
            )}

            {activeTab === 'api' && (
              <div>
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-800 mb-2">
                    ❌ Phương pháp API Backend (Hiện tại lỗi)
                  </h3>
                  <p className="text-sm text-red-700">
                    Kết nối thông qua FastAPI backend. Hiện tại đang gặp lỗi 403 Forbidden 
                    vì backend chưa được khởi động hoặc có vấn đề với authentication.
                  </p>
                  <div className="mt-2 text-xs text-red-600">
                    <strong>Ưu điểm:</strong> Kiểm soát tốt, logic business ở backend, bảo mật cao
                    <br />
                    <strong>Nhược điểm:</strong> Phụ thuộc backend, chậm hơn, phức tạp hơn
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <div className="text-yellow-800 mb-4">
                    <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-lg font-medium">Backend không hoạt động</h3>
                    <p className="text-sm mt-1">
                      API endpoint đang trả về 403 Forbidden. 
                      Cần khởi động backend để test phương pháp này.
                    </p>
                  </div>
                  
                  <div className="text-xs text-yellow-700 bg-yellow-100 rounded p-3 mt-4">
                    <strong>Để khởi động backend:</strong>
                    <br />
                    1. Mở terminal trong thư mục backend
                    <br />
                    2. Chạy: <code>python main.py</code> hoặc <code>uvicorn main:app --reload --port 8000</code>
                    <br />
                    3. Đảm bảo file .env có đủ thông tin Supabase
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-green-700 mb-3">✅ Supabase Trực tiếp</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Không cần backend chạy
              </li>
              <li className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Phản hồi nhanh
              </li>
              <li className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Real-time subscriptions
              </li>
              <li className="flex items-center text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Đơn giản, ít layer
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-blue-700 mb-3">🔧 API Backend</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Kiểm soát logic business tốt
              </li>
              <li className="flex items-center text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Validation và security cao
              </li>
              <li className="flex items-center text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Caching và optimization
              </li>
              <li className="flex items-center text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Cần backend hoạt động
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}