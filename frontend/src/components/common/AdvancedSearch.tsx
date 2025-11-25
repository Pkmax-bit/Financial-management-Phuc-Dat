'use client'

import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'

interface AdvancedSearchProps {
    onSearch: (filters: SearchFilters) => void
    onClear: () => void
}

export interface SearchFilters {
    query?: string
    status?: string[]
    priority?: string[]
    dateFrom?: string
    dateTo?: string
    budgetMin?: number
    budgetMax?: number
    customerId?: string
    managerId?: string
}

export default function AdvancedSearch({ onSearch, onClear }: AdvancedSearchProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [filters, setFilters] = useState<SearchFilters>({})

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
    }

    const handleSearch = () => {
        onSearch(filters)
    }

    const handleClearAll = () => {
        setFilters({})
        onClear()
    }

    const activeFiltersCount = Object.values(filters).filter(v =>
        v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
    ).length

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Search Bar */}
            <div className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            value={filters.query || ''}
                            onChange={(e) => handleFilterChange('query', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Tìm kiếm theo tên, mã dự án, khách hàng..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-2.5 border rounded-lg transition-colors ${isExpanded ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Filter className="h-5 w-5" />
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={handleSearch}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Tìm kiếm
                    </button>

                    {activeFiltersCount > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="p-2.5 text-gray-600 hover:text-red-600 transition-colors"
                            title="Xóa bộ lọc"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Advanced Filters */}
            {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <select
                                multiple
                                value={filters.status || []}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                                    handleFilterChange('status', selected)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                size={4}
                            >
                                <option value="planning">Lập kế hoạch</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="on_hold">Tạm dừ</option>
                                <option value="completed">Hoàn thành</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mức ưu tiên
                            </label>
                            <select
                                multiple
                                value={filters.priority || []}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                                    handleFilterChange('priority', selected)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                size={4}
                            >
                                <option value="low">Thấp</option>
                                <option value="medium">Trung bình</option>
                                <option value="high">Cao</option>
                                <option value="urgent">Khẩn cấp</option>
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thời gian
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="date"
                                    value={filters.dateFrom || ''}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                    placeholder="Từ ngày"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="date"
                                    value={filters.dateTo || ''}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                    placeholder="Đến ngày"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Budget Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngân sách từ (VNĐ)
                            </label>
                            <input
                                type="number"
                                value={filters.budgetMin || ''}
                                onChange={(e) => handleFilterChange('budgetMin', parseFloat(e.target.value))}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngân sách đến (VNĐ)
                            </label>
                            <input
                                type="number"
                                value={filters.budgetMax || ''}
                                onChange={(e) => handleFilterChange('budgetMax', parseFloat(e.target.value))}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
