'use client'

import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign,
  User,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  company: string
  created_at: string
  updated_at: string
  projects_count: number
  total_projects_value: number
}

interface Project {
  id: string
  name: string
  project_code: string
  status: string
  progress: number
  start_date: string
  end_date: string
  budget: number
  actual_cost: number
  customer_id: string
  customer_name: string
  manager_name: string
}

interface CustomerInfoProps {
  customer: Customer
  projects: Project[]
}

export default function CustomerInfo({ customer, projects }: CustomerInfoProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'active':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành'
      case 'active':
        return 'Đang hoạt động'
      case 'pending':
        return 'Chờ xử lý'
      default:
        return 'Không xác định'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0)
  const totalActualCost = projects.reduce((sum, project) => sum + project.actual_cost, 0)
  const averageProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
    : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
              <p className="text-gray-600">{customer.company}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Tham gia: {new Date(customer.created_at).toLocaleDateString('vi-VN')}
                </span>
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {customer.projects_count} dự án
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {customer.total_projects_value.toLocaleString()} VNĐ
            </div>
            <p className="text-sm text-gray-600">Tổng giá trị dự án</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{customer.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Điện thoại</p>
              <p className="font-medium text-gray-900">{customer.phone}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 md:col-span-2">
            <MapPin className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-600">Địa chỉ</p>
              <p className="font-medium text-gray-900">{customer.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê dự án</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{projects.length}</div>
            <p className="text-sm text-gray-600">Tổng dự án</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{averageProgress}%</div>
            <p className="text-sm text-gray-600">Tiến độ trung bình</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {totalBudget.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Tổng ngân sách (VNĐ)</p>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách dự án</h3>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có dự án nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <span className="text-sm text-gray-500">#{project.project_code}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Quản lý: {project.manager_name}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Tiến độ</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Ngân sách</p>
                        <p className="font-medium">{project.budget.toLocaleString()} VNĐ</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Chi phí thực tế</p>
                        <p className="font-medium">{project.actual_cost.toLocaleString()} VNĐ</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bắt đầu</p>
                        <p className="font-medium">{new Date(project.start_date).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Kết thúc</p>
                        <p className="font-medium">{new Date(project.end_date).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                      <span className="ml-1">{getStatusText(project.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
