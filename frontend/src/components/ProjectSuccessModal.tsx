'use client'

import { CheckCircle, X } from 'lucide-react'

interface ProjectSuccessModalProps {
  isVisible: boolean
  projectName: string
  projectCode: string
  tasksCreated?: {
    count: number
    checklists: number
    checklistItems: number
  }
  onContinue: () => void
  onCancel: () => void
}

export default function ProjectSuccessModal({ 
  isVisible, 
  projectName, 
  projectCode,
  tasksCreated,
  onContinue,
  onCancel
}: ProjectSuccessModalProps) {
  const handleClose = () => {
    onCancel()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-transparent flex items-start justify-start z-50 animate-fade-in pointer-events-none">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 mt-4 ml-8 animate-bounce-in pointer-events-auto" style={{ marginLeft: '30%', marginTop: '30%' }}>
        {/* Header */}
        <div className="bg-green-50 border-b border-green-200 rounded-t-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-green-800">
              Tạo dự án thành công!
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-600 mb-1">Tên dự án:</p>
              <p className="font-semibold text-gray-900">{projectName}</p>
              <p className="text-sm text-gray-600 mb-1 mt-2">Mã dự án:</p>
              <p className="font-semibold text-blue-600">{projectCode}</p>
            </div>
            
            {/* Thông báo về nhiệm vụ được tạo tự động */}
            {tasksCreated ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-3 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 ml-3">
                    <p className="text-sm font-bold text-green-800 mb-2">
                      ✅ Đã tạo nhiệm vụ mẫu tự động thành công!
                    </p>
                    <div className="bg-white rounded-md p-2 mb-2">
                      <ul className="text-xs text-green-700 space-y-1.5">
                        <li className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                          <strong>1 nhiệm vụ chính:</strong> "{projectName}"
                        </li>
                        <li className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                          <strong>{tasksCreated.checklists} danh sách công việc:</strong> Kế hoạch, Sản xuất, Vận chuyển, Chăm sóc
                        </li>
                        <li className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                          <strong>{tasksCreated.checklistItems} việc cần làm</strong> với checkbox hoàn thành
                        </li>
                      </ul>
                    </div>
                    <p className="text-xs text-green-600 font-medium">
                      💡 Bạn có thể xem và quản lý các nhiệm vụ này trong trang chi tiết dự án
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-yellow-700">
                      ⚠️ Nhiệm vụ mẫu chưa được tạo tự động. Bạn có thể tạo thủ công trong trang chi tiết dự án.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
