'use client'

interface ProjectBudgetProps {
    formData: any
    onChange: (field: string, value: any) => void
}

export default function ProjectBudget({ formData, onChange }: ProjectBudgetProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Ngân sách & Thanh toán</h3>

            {/* Budget */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngân sách (VNĐ)
                </label>
                <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => onChange('budget', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                />
                {formData.budget && (
                    <p className="text-xs text-gray-500 mt-1">
                        {parseInt(formData.budget).toLocaleString('vi-VN')} VNĐ
                    </p>
                )}
            </div>

            {/* Billing Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại thanh toán
                </label>
                <select
                    value={formData.billing_type}
                    onChange={(e) => onChange('billing_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="fixed">Giá cố định</option>
                    <option value="hourly">Theo giờ</option>
                    <option value="milestone">Theo mốc</option>
                </select>
            </div>

            {/* Hourly Rate - Show only if billing_type is hourly */}
            {formData.billing_type === 'hourly' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá theo giờ (VNĐ)
                    </label>
                    <input
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => onChange('hourly_rate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                    />
                    {formData.hourly_rate && (
                        <p className="text-xs text-gray-500 mt-1">
                            {parseInt(formData.hourly_rate).toLocaleString('vi-VN')} VNĐ/giờ
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
