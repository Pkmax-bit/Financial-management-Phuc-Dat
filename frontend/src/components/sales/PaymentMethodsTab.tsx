'use client'

import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Search,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  FileText,
  ChevronRight,
  X,
  ArrowLeft
} from 'lucide-react'
import { apiGet } from '@/lib/api'
import { getApiEndpoint } from '@/lib/apiUrl'

interface Project {
  id: string
  name: string
  project_code?: string
  customer_id: string
  customer_name?: string
  total_invoice_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: 'paid' | 'partial' | 'pending'
  invoices_count: number
  payments_count: number
}

interface Payment {
  id: string
  payment_number: string
  payment_date: string
  amount: number
  payment_method: string
  reference_number?: string
  notes?: string
  invoice_id?: string
  invoice_number?: string
}

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  paid_amount: number
  payment_status: 'paid' | 'partial' | 'pending' | 'overdue'
  issue_date: string
  due_date: string
}

interface PaymentMethodsTabProps {
  searchTerm?: string
}

export default function PaymentMethodsTab({ searchTerm = '' }: PaymentMethodsTabProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([]) // Store all projects for filtering
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [projectPayments, setProjectPayments] = useState<Payment[]>([])
  const [projectInvoices, setProjectInvoices] = useState<Invoice[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [projectPaymentMethods, setProjectPaymentMethods] = useState<Record<string, string[]>>({}) // Store payment methods for each project

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const data = await apiGet(getApiEndpoint('/api/sales/payment-methods/projects'))
      setAllProjects(data)
      setProjects(data)
      
      // Fetch payment methods for all projects in parallel (optimized)
      const paymentMethodsMap: Record<string, string[]> = {}
      const paymentPromises = data.map(async (project: Project) => {
        try {
          const payments = await apiGet(getApiEndpoint(`/api/sales/payment-methods/projects/${project.id}/payments`))
          const methods = [...new Set((payments || []).map((p: Payment) => p.payment_method).filter(Boolean))]
          return { projectId: project.id, methods }
        } catch (error) {
          console.error(`Error fetching payment methods for project ${project.id}:`, error)
          return { projectId: project.id, methods: [] }
        }
      })
      
      const results = await Promise.all(paymentPromises)
      results.forEach(({ projectId, methods }) => {
        paymentMethodsMap[projectId] = methods
      })
      setProjectPaymentMethods(paymentMethodsMap)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Filter projects based on payment method
  useEffect(() => {
    if (paymentMethodFilter === 'all') {
      setProjects(allProjects)
    } else {
      const filtered = allProjects.filter(project => {
        const methods = projectPaymentMethods[project.id] || []
        return methods.includes(paymentMethodFilter)
      })
      setProjects(filtered)
    }
  }, [paymentMethodFilter, allProjects, projectPaymentMethods])

  const fetchProjectDetails = async (projectId: string) => {
    try {
      setLoadingDetails(true)
      const [payments, invoices] = await Promise.all([
        apiGet(getApiEndpoint(`/api/sales/payment-methods/projects/${projectId}/payments`)),
        apiGet(getApiEndpoint(`/api/sales/payment-methods/projects/${projectId}/invoices`))
      ])
      setProjectPayments(payments || [])
      setProjectInvoices(invoices || [])
    } catch (error) {
      console.error('Error fetching project details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const openDetailModal = async (project: Project) => {
    setSelectedProject(project)
    setShowDetailModal(true)
    await fetchProjectDetails(project.id)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedProject(null)
    setProjectPayments([])
    setProjectInvoices([])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // Format: "DD/MM/YYYY HH:mm"
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán'
      case 'partial':
        return 'Thanh toán một nửa'
      case 'pending':
        return 'Chưa thanh toán'
      default:
        return status
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'partial':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Tiền mặt'
      case 'card':
        return 'Thẻ'
      case 'bank_transfer':
        return 'Chuyển khoản'
      case 'check':
        return 'Séc'
      case 'digital_wallet':
        return 'Ví điện tử'
      case 'other':
        return 'Khác'
      default:
        return method
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.project_code && project.project_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.customer_name && project.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'paid' && project.payment_status === 'paid') ||
      (filter === 'partial' && project.payment_status === 'partial') ||
      (filter === 'pending' && project.payment_status === 'pending')

    return matchesSearch && matchesFilter
  })
  
  // Calculate statistics based on filtered projects (after payment method filter)
  const statsProjects = filteredProjects

  // Calculate statistics based on filtered projects (after payment method filter)
  const totalProjects = statsProjects.length
  const paidProjects = statsProjects.filter(p => p.payment_status === 'paid').length
  const partialProjects = statsProjects.filter(p => p.payment_status === 'partial').length
  const pendingProjects = statsProjects.filter(p => p.payment_status === 'pending').length
  const totalAmount = statsProjects.reduce((sum, p) => sum + p.total_invoice_amount, 0)
  const totalPaid = statsProjects.reduce((sum, p) => sum + p.paid_amount, 0)
  const totalRemaining = statsProjects.reduce((sum, p) => sum + p.remaining_amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black">Tổng dự án</p>
              <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black">Đã thanh toán</p>
              <p className="text-2xl font-bold text-green-600">{paidProjects}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black">Thanh toán một nửa</p>
              <p className="text-2xl font-bold text-yellow-600">{partialProjects}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black">Chưa thanh toán</p>
              <p className="text-2xl font-bold text-red-600">{pendingProjects}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black">Tổng giá trị</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black">Đã thu</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black">Còn lại</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalRemaining)}</p>
            </div>
            <Clock className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'paid' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã thanh toán
            </button>
            <button
              onClick={() => setFilter('partial')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'partial' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Thanh toán một nửa
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'pending' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chưa thanh toán
            </button>
          </div>
          
          {/* Payment Method Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-black">Phương thức thanh toán:</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="cash">Tiền mặt</option>
              <option value="bank_transfer">Chuyển khoản</option>
              <option value="card">Thẻ</option>
              <option value="check">Séc</option>
              <option value="digital_wallet">Ví điện tử</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table and Detail Sidebar Container - Flex layout */}
      <div className={`flex gap-4 transition-all duration-300 ${showDetailModal ? '' : ''}`}>
        {/* Projects Table */}
        <div className={`bg-white rounded-lg border overflow-hidden transition-all duration-300 ${showDetailModal ? 'flex-1 min-w-0' : 'w-full'}`}>
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Dự án
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Tổng giá trị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Đã thu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Còn lại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <tr 
                  key={project.id} 
                  onClick={() => openDetailModal(project)}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedProject?.id === project.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-black mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.name}
                        </div>
                        {project.project_code && (
                          <div className="text-xs text-black">
                            {project.project_code}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {project.customer_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(project.total_invoice_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(project.paid_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {formatCurrency(project.remaining_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPaymentStatusIcon(project.payment_status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(project.payment_status)}`}>
                        {getPaymentStatusText(project.payment_status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => openDetailModal(project)}
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredProjects.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-black" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có dự án</h3>
              <p className="mt-1 text-sm text-black">
                Không tìm thấy dự án nào phù hợp với bộ lọc.
              </p>
            </div>
          )}
          </div>
        </div>

        {/* Detail Sidebar - Right side, shows alongside project list */}
        {showDetailModal && selectedProject && (
          <div className="flex-1 min-w-0 bg-white rounded-lg border shadow-lg overflow-hidden max-h-[calc(100vh-300px)]">
            <div className="overflow-y-auto max-h-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Đóng"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedProject.name}</h2>
                  {selectedProject.project_code && (
                    <p className="text-sm text-black">{selectedProject.project_code}</p>
                  )}
                </div>
              </div>
              <button
                onClick={closeDetailModal}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
              </div>

              <div className="p-6 space-y-6">
              {/* Project Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-black">Tổng giá trị</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedProject.total_invoice_amount)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-black">Đã thu</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedProject.paid_amount)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-black">Còn lại</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedProject.remaining_amount)}
                  </p>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Lịch sử thanh toán ({projectPayments.length})
                </h3>
                {loadingDetails ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : projectPayments.length > 0 ? (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Số thanh toán</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Ngày</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Số tiền</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Phương thức</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Đơn hàng</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {projectPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-3 text-sm text-black">{payment.payment_number}</td>
                            <td className="px-4 py-3 text-sm text-black">{formatDate(payment.payment_date)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-black">
                              {getPaymentMethodText(payment.payment_method)}
                            </td>
                            <td className="px-4 py-3 text-sm text-black">
                              {payment.invoice_number || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <CreditCard className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-black">Chưa có lịch sử thanh toán</p>
                  </div>
                )}
              </div>

              {/* Invoices */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Đơn hàng ({projectInvoices.length})
                </h3>
                {loadingDetails ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : projectInvoices.length > 0 ? (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Số đơn hàng</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Ngày phát hành</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Hạn thanh toán</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Tổng tiền</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Đã thu</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {projectInvoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-4 py-3 text-sm font-medium text-black">{invoice.invoice_number}</td>
                            <td className="px-4 py-3 text-sm text-black">{formatDate(invoice.issue_date)}</td>
                            <td className="px-4 py-3 text-sm text-black">{formatDate(invoice.due_date)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formatCurrency(invoice.total_amount)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600">
                              {formatCurrency(invoice.paid_amount)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.payment_status)}`}>
                                {getPaymentStatusText(invoice.payment_status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-black">Chưa có đơn hàng</p>
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

