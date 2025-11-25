'use client'

interface BatchActionsProps {
    selectedIds: string[]
    onDelete: () => void
    onStatusChange: (status: string) => void
    onClear: () => void
}

export default function BatchActions({ selectedIds, onDelete, onStatusChange, onClear }: BatchActionsProps) {
    if (selectedIds.length === 0) return null

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        if (value) {
            onStatusChange(value)
            e.target.value = '' // Reset select
        }
    }

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-lg p-4 flex items-center gap-4 border border-gray-300 z-50 animate-slide-up">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="font-semibold text-gray-900">
                    {selectedIds.length} mục đã chọn
                </span>
            </div>

            <div className="h-6 w-px bg-gray-300"></div>

            <select
                onChange={handleStatusChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
                <option value="">Đổi trạng thái...</option>
                <option value="planning">📋 Lập kế hoạch</option>
                <option value="active">✅ Đang hoạt động</option>
                <option value="on_hold">⏸️ Tạm dừng</option>
                <option value="completed">🎉 Hoàn thành</option>
                <option value="cancelled">❌ Đã hủy</option>
            </select>

            <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm shadow-sm hover:shadow-md"
            >
                🗑️ Xóa
            </button>

            <button
                onClick={onClear}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium text-sm"
            >
                Hủy
            </button>
        </div>
    )
}
