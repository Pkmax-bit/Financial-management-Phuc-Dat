'use client'

export type ProjectStatusValue = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'

export interface ProjectStatusOption {
  value: ProjectStatusValue
  label: string
}

export interface ProjectStatusFilterOption {
  value: 'all' | ProjectStatusValue
  label: string
}

export const PROJECT_STATUS_VALUES: ProjectStatusValue[] = [
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled'
]

export const PROJECT_STATUS_LABELS: Record<ProjectStatusValue, string> = {
  planning: 'Lập kế hoạch',
  active: 'Đang hoạt động',
  on_hold: 'Tạm dừng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy'
}

export const PROJECT_STATUS_BADGE_COLORS: Record<ProjectStatusValue, string> = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

export const PROJECT_STATUS_FILTER_OPTIONS: ProjectStatusFilterOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  ...PROJECT_STATUS_VALUES.map((status) => ({
    value: status,
    label: PROJECT_STATUS_LABELS[status]
  }))
]

export const PROJECT_STATUS_DEFAULT: ProjectStatusValue = 'planning'

export const getProjectStatusLabel = (status: string): string => {
  return PROJECT_STATUS_LABELS[status as ProjectStatusValue] || status
}

export const getProjectStatusBadgeClass = (status: string): string => {
  return PROJECT_STATUS_BADGE_COLORS[status as ProjectStatusValue] || 'bg-gray-100 text-gray-800'
}


