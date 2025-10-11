'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import CustomerInfo from '@/components/customer-view/CustomerInfo'
import ProjectTimelineGallery from '@/components/customer-view/ProjectTimelineGallery'
import ConstructionImageGallery from '@/components/customer-view/ConstructionImageGallery'
import { 
  Building2, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  User,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Share2,
  DollarSign
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

interface TimelineEntry {
  id: string
  title: string
  description: string
  date: string
  type: string
  status: string
  attachments: TimelineAttachment[]
}

interface TimelineAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploaded_at: string
}

export default function CustomerViewPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Mock user data
  const user = {
    full_name: 'Admin User',
    role: 'admin',
    email: 'admin@example.com'
  }

  const handleLogout = () => {
    router.push('/login')
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerProjects()
      fetchCustomerTimeline()
    }
  }, [selectedCustomer])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      } else {
        // Fallback to mock data
        setCustomers([
          {
            id: '1',
            name: 'Công ty TNHH ABC',
            email: 'contact@abc.com',
            phone: '0123456789',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            company: 'ABC Construction',
            created_at: '2024-01-15',
            updated_at: '2024-01-15',
            projects_count: 3,
            total_projects_value: 1500000000
          },
          {
            id: '2',
            name: 'Công ty XYZ',
            email: 'info@xyz.com',
            phone: '0987654321',
            address: '456 Đường XYZ, Quận 2, TP.HCM',
            company: 'XYZ Development',
            created_at: '2024-02-01',
            updated_at: '2024-02-01',
            projects_count: 2,
            total_projects_value: 800000000
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerProjects = async () => {
    if (!selectedCustomer) return

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}/projects`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        // Mock data
        setProjects([
          {
            id: '1',
            name: 'Dự án nhà ở ABC',
            project_code: 'ABC-001',
            status: 'active',
            progress: 75,
            start_date: '2024-01-01',
            end_date: '2024-06-30',
            budget: 500000000,
            actual_cost: 375000000,
            customer_id: selectedCustomer.id,
            customer_name: selectedCustomer.name,
            manager_name: 'Nguyễn Văn A'
          },
          {
            id: '2',
            name: 'Dự án văn phòng ABC',
            project_code: 'ABC-002',
            status: 'completed',
            progress: 100,
            start_date: '2023-06-01',
            end_date: '2023-12-31',
            budget: 300000000,
            actual_cost: 280000000,
            customer_id: selectedCustomer.id,
            customer_name: selectedCustomer.name,
            manager_name: 'Trần Thị B'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching customer projects:', error)
    }
  }

  const fetchCustomerTimeline = async () => {
    if (!selectedCustomer) return

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}/timeline`)
      if (response.ok) {
        const data = await response.json()
        setTimelineEntries(data)
      } else {
        // Mock data
        setTimelineEntries([
          {
            id: '1',
            title: 'Khởi công dự án',
            description: 'Bắt đầu thi công dự án nhà ở ABC',
            date: '2024-01-01',
            type: 'milestone',
            status: 'completed',
            attachments: [
              {
                id: '1',
                name: 'ground-breaking.jpg',
                url: 'https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/Timeline/1/ground-breaking.jpg',
                type: 'image',
                size: 1024000,
                uploaded_at: '2024-01-01T08:00:00Z'
              }
            ]
          },
          {
            id: '2',
            title: 'Cập nhật tiến độ',
            description: 'Hoàn thành 50% công việc',
            date: '2024-03-15',
            type: 'update',
            status: 'completed',
            attachments: [
              {
                id: '2',
                name: 'progress-report.jpg',
                url: 'https://mfmijckzlhevduwfigkl.supabase.co/storage/v1/object/public/minhchung_chiphi/Timeline/1/progress-report.jpg',
                type: 'image',
                size: 2048000,
                uploaded_at: '2024-03-15T14:30:00Z'
              }
            ]
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching customer timeline:', error)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredProjects = projects.filter(project => {
    if (filterStatus === 'all') return true
    return project.status === filterStatus
  })

  return (
    <LayoutWithSidebar user={user} onLogout={handleLogout}>
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">View khách hàng</h1>
              <p className="text-gray-600 mt-2">Xem thông tin khách hàng và timeline công trình</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={viewMode === 'grid' ? 'Chuyển sang danh sách' : 'Chuyển sang lưới'}
              >
                {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả dự án</option>
              <option value="active">Đang hoạt động</option>
              <option value="completed">Hoàn thành</option>
              <option value="pending">Chờ xử lý</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Danh sách khách hàng</h2>
                <p className="text-gray-600 text-sm mt-1">{filteredCustomers.length} khách hàng</p>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedCustomer?.id === customer.id
                            ? 'border-blue-200 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{customer.name}</h3>
                            <p className="text-sm text-gray-600 truncate">{customer.company}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {customer.projects_count} dự án
                              </span>
                              <span className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {customer.total_projects_value.toLocaleString()} VNĐ
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Details and Timeline */}
          <div className="lg:col-span-2">
            {selectedCustomer ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <CustomerInfo customer={selectedCustomer} projects={filteredProjects} />
                
                {/* Construction Images from Storage */}
                <ConstructionImageGallery 
                  images={timelineEntries
                    .flatMap(entry => entry.attachments)
                    .filter(attachment => attachment.type === 'image' || attachment.type.startsWith('image/'))
                    .map(attachment => ({
                      id: attachment.id,
                      name: attachment.name,
                      url: attachment.url,
                      size: attachment.size,
                      uploaded_at: attachment.uploaded_at,
                      timeline_entry: timelineEntries.find(entry => 
                        entry.attachments.some(att => att.id === attachment.id)
                      ) ? {
                        title: timelineEntries.find(entry => 
                          entry.attachments.some(att => att.id === attachment.id)
                        )?.title || '',
                        date: timelineEntries.find(entry => 
                          entry.attachments.some(att => att.id === attachment.id)
                        )?.date || '',
                        type: timelineEntries.find(entry => 
                          entry.attachments.some(att => att.id === attachment.id)
                        )?.type || ''
                      } : undefined
                    }))
                  }
                  projectName={selectedCustomer.name}
                />
                
                {/* Project Timeline Gallery */}
                <ProjectTimelineGallery 
                  customer={selectedCustomer}
                  projects={filteredProjects}
                  timelineEntries={timelineEntries}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn khách hàng</h3>
                <p className="text-gray-600">Chọn một khách hàng từ danh sách bên trái để xem thông tin chi tiết và timeline công trình.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  )
}
