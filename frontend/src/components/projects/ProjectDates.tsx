'use client'

interface ProjectDatesProps {
    formData: any
    onChange: (field: string, value: any) => void
}

export default function ProjectDates({ formData, onChange }: ProjectDatesProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Thời gian dự án</h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => onChange('start_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* End Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày kết thúc (dự kiến)
                    </label>
                    <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => onChange('end_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Progress */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiến độ (%)
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => onChange('progress', parseInt(e.target.value))}
                        className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                        {formData.progress}%
                    </span>
                </div>
            </div>
        </div>
    )
}
