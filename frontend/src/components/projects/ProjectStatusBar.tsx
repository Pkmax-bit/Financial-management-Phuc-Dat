'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import { apiPut, apiGet } from '@/lib/api'

interface DatabaseProjectStatus {
  id: string
  name: string
  display_order: number
  color_class?: string
  description?: string
  is_active: boolean
}

interface ProjectStatusBarProps {
  projectId: string
  currentStatusId?: string
  currentStatusName?: string
  categoryId?: string // ID của nhóm dự án để filter trạng thái
  onStatusChange?: (newStatus: string) => void
}

// Parse color_class từ Tailwind CSS (ví dụ: "bg-blue-100 text-blue-800")
const parseColorClass = (colorClass?: string) => {
  if (!colorClass) {
    return {
      bgColor: '#e5e7eb', // gray default
      textColor: '#374151',
    }
  }

  // Map Tailwind colors to hex - mở rộng với nhiều màu hơn
  const colorMap: Record<string, string> = {
    // Blue shades
    'blue-50': '#eff6ff',
    'blue-100': '#dbeafe',
    'blue-200': '#bfdbfe',
    'blue-500': '#3b82f6',
    'blue-600': '#2563eb',
    'blue-700': '#1d4ed8',
    'blue-800': '#1e40af',
    'blue-900': '#1e3a8a',
    // Green shades
    'green-50': '#f0fdf4',
    'green-100': '#dcfce7',
    'green-200': '#bbf7d0',
    'green-500': '#22c55e',
    'green-600': '#16a34a',
    'green-700': '#15803d',
    'green-800': '#166534',
    'green-900': '#14532d',
    // Yellow/Orange shades
    'yellow-50': '#fefce8',
    'yellow-100': '#fef9c3',
    'yellow-200': '#fef08a',
    'yellow-500': '#eab308',
    'yellow-600': '#ca8a04',
    'yellow-700': '#a16207',
    'yellow-800': '#854d0e',
    'orange-100': '#ffedd5',
    'orange-500': '#f97316',
    'orange-600': '#ea580c',
    'orange-800': '#9a3412',
    // Red shades
    'red-50': '#fef2f2',
    'red-100': '#fee2e2',
    'red-200': '#fecaca',
    'red-500': '#ef4444',
    'red-600': '#dc2626',
    'red-700': '#b91c1c',
    'red-800': '#991b1b',
    'red-900': '#7f1d1d',
    // Gray shades
    'gray-50': '#f9fafb',
    'gray-100': '#f3f4f6',
    'gray-200': '#e5e7eb',
    'gray-300': '#d1d5db',
    'gray-400': '#9ca3af',
    'gray-500': '#6b7280',
    'gray-600': '#4b5563',
    'gray-700': '#374151',
    'gray-800': '#1f2937',
    'gray-900': '#111827',
    // Teal/Cyan shades (cho màu Bitrix24 style)
    'teal-100': '#ccfbf1',
    'teal-200': '#99f6e4',
    'teal-500': '#14b8a6',
    'teal-600': '#0d9488',
    'teal-700': '#0f766e',
    'teal-800': '#115e59',
    'cyan-100': '#cffafe',
    'cyan-500': '#06b6d4',
    'cyan-600': '#0891b2',
    'cyan-800': '#155e75',
    // Indigo/Purple shades
    'indigo-100': '#e0e7ff',
    'indigo-500': '#6366f1',
    'indigo-600': '#4f46e5',
    'indigo-800': '#3730a3',
    'purple-100': '#f3e8ff',
    'purple-500': '#a855f7',
    'purple-600': '#9333ea',
    'purple-800': '#6b21a8',
  }

  // Extract bg and text colors
  const bgMatch = colorClass.match(/bg-(\w+-\d+)/)
  const textMatch = colorClass.match(/text-(\w+-\d+)/)

  const bgColor = bgMatch ? colorMap[bgMatch[1]] || '#e5e7eb' : '#e5e7eb'
  const textColor = textMatch ? colorMap[textMatch[1]] || '#374151' : '#374151'

  return { bgColor, textColor }
}

export default function ProjectStatusBar({
  projectId,
  currentStatusId,
  currentStatusName,
  categoryId,
  onStatusChange,
}: ProjectStatusBarProps) {
  const [statuses, setStatuses] = useState<DatabaseProjectStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Fetch danh sách trạng thái từ database - filter theo category_id nếu có
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setLoading(true)
        // Nếu có categoryId, thêm vào query parameter
        const url = categoryId
          ? `/api/projects/statuses?category_id=${encodeURIComponent(categoryId)}`
          : '/api/projects/statuses'
        const data = await apiGet<DatabaseProjectStatus[]>(url)
        // Sắp xếp theo display_order
        const sorted = (data || []).sort((a, b) => a.display_order - b.display_order)
        setStatuses(sorted)
      } catch (error) {
        console.error('Failed to fetch project statuses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatuses()
  }, [categoryId]) // Re-fetch khi categoryId thay đổi

  // Tìm trạng thái hiện tại
  // Ưu tiên tìm theo status_id, nếu không có thì tìm theo tên
  const currentStatus = currentStatusId
    ? statuses.find((s) => s.id === currentStatusId)
    : currentStatusName
      ? statuses.find((s) => s.name.toLowerCase() === currentStatusName.toLowerCase())
      : null
  const currentOrder = currentStatus?.display_order || 0

  const handleStatusClick = async (status: DatabaseProjectStatus) => {
    // TẠM THỜI VÔ HIỆU HÓA: Không cho phép chuyển trạng thái
    return
    
    // Cho phép chuyển đến bất kỳ trạng thái nào (không giới hạn)
    if (updating || status.id === currentStatusId) {
      return // Không cho phép click vào trạng thái hiện tại hoặc khi đang update
    }

    setUpdating(status.id)

    try {
      // Gọi API để cập nhật trạng thái dự án
      // Endpoint: PUT /api/projects/{project_id}/status?status={status_name}
      // API sẽ tự động map status name sang status_id
      await apiPut(
        `/api/projects/${projectId}/status?status=${encodeURIComponent(status.name)}`,
        {}
      )

      if (onStatusChange) {
        onStatusChange(status.name)
      }
      // Reload page để cập nhật UI
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to update project status:', error)
      const errorMessage =
        error?.data?.detail || error?.message || 'Không thể cập nhật trạng thái. Vui lòng thử lại.'
      alert(errorMessage)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="w-full bg-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (statuses.length === 0) {
    return (
      <div className="w-full bg-gray-100 rounded-lg p-4">
        <p className="text-sm text-gray-500 text-center">Không có trạng thái nào</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-100 rounded-lg p-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statuses.map((status, index) => {
          const isCompleted = status.display_order <= currentOrder
          const isCurrent = currentStatusId
            ? status.id === currentStatusId
            : currentStatusName
              ? status.name.toLowerCase() === currentStatusName.toLowerCase()
              : false
          // Cho phép click vào bất kỳ trạng thái nào (trừ trạng thái hiện tại)
          const isClickable = !isCurrent
          const isUpdating = updating === status.id

          // Parse màu từ color_class
          const colors = parseColorClass(status.color_class)
          const completedBgColor = colors.bgColor
          const completedTextColor = colors.textColor

          return (
            <div key={status.id} className="flex items-center gap-0 flex-shrink-0">
              {/* Status Segment */}
              <button
                onClick={() => handleStatusClick(status)}
                disabled={true}
                className={`
                  relative px-4 py-2.5 rounded-lg font-semibold text-sm
                  transition-all duration-200 min-w-[120px] text-center
                  ${isCurrent ? 'ring-2 ring-offset-2' : ''}
                  cursor-not-allowed opacity-60
                  ${isUpdating ? 'opacity-50' : ''}
                `}
                style={{
                  backgroundColor: isCompleted ? completedBgColor : '#e5e7eb',
                  color: isCompleted ? completedTextColor : '#6b7280',
                  borderColor: isCurrent ? completedBgColor : 'transparent',
                }}
                title={
                  isCurrent
                    ? 'Trạng thái hiện tại'
                    : 'Chức năng chuyển trạng thái đang tạm thời vô hiệu hóa'
                }
              >
                {/* Check icon for completed statuses */}
                {isCompleted && !isCurrent && (
                  <Check className="absolute top-1 right-1 h-3 w-3" style={{ color: completedTextColor }} />
                )}

                {/* Status text */}
                <div className="flex flex-col items-center gap-1">
                  <span className="font-bold">{status.name}</span>
                </div>

                {/* Loading indicator */}
                {isUpdating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: completedBgColor }} />
                  </div>
                )}
              </button>

              {/* Arrow connector */}
              {index < statuses.length - 1 && (
                <div className="flex items-center">
                  <ChevronRight
                    className={`h-5 w-5 ${isCompleted ? '' : 'text-gray-400'}`}
                    style={isCompleted ? { color: completedBgColor } : {}}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Status indicator text */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        {currentStatus ? (
          <span>
            Trạng thái hiện tại: <strong>{currentStatus.name}</strong>
          </span>
        ) : (
          <span>Chưa có trạng thái</span>
        )}
      </div>
    </div>
  )
}

