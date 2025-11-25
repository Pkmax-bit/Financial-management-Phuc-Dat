'use client'

interface Customer {
    id: string
    name: string
    email: string
}

interface Employee {
    id: string
    name: string
    email: string
}

interface ProjectBasicInfoProps {
    formData: any
    onChange: (field: string, value: any) => void
    customers: Customer[]
    employees: Employee[]
}

export default function ProjectBasicInfo({ formData, onChange, customers, employees }: ProjectBasicInfoProps) {
    return (
        <div className="space-y-4">
            {/* Project Code */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã dự án <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.project_code}
                    onChange={(e) => onChange('project_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: PRJ001"
                    required
                />
            </div>

            {/* Project Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên dự án <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên dự án"
                    required
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => onChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mô tả chi tiết về dự án"
                    rows={3}
                />
            </div>

            {/* Customer Select */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khách hàng <span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.customer_id}
                    onChange={(e) => onChange('customer_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                >
                    <option value="">Chọn khách hàng</option>
                    {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                            {customer.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Manager Select */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quản lý dự án
                </label>
                <select
                    value={formData.manager_id}
                    onChange={(e) => onChange('manager_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300  rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Chọn người quản lý</option>
                    {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                            {employee.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái
                    </label>
                    <select
                        value={formData.status}
                        onChange={(e) => onChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="planning">Lập kế hoạch</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="on_hold">Tạm dừng</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mức ưu tiên
                    </label>
                    <select
                        value={formData.priority}
                        onChange={(e) => onChange('priority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="low">Thấp</option>
                        <option value="medium">Trung bình</option>
                        <option value="high">Cao</option>
                        <option value="urgent">Khẩn cấp</option>
                    </select>
                </div>
            </div>
        </div>
    )
}
