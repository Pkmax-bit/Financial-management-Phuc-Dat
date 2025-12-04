'use client'

import { useState, useEffect } from 'react'
import {
  Receipt,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react'
import CreateInvoiceSidebarFullscreen from './CreateInvoiceSidebarFullscreen'
import EditInvoiceModal from './EditInvoiceModal'
import PaymentModal from './PaymentModal'
import { apiGet, apiPost, apiPut } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { PROJECT_STATUS_FILTER_OPTIONS } from '@/config/projectStatus'

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  customer_name?: string
  project_id?: string
  project_name?: string
  project_code?: string
  projects?: {
    name: string
    project_code: string
  }
  quote_id?: string
  invoice_type: 'standard' | 'recurring' | 'proforma' | 'credit_note'
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'voided'
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded'
  paid_amount: number
  payment_terms?: string
  items: unknown[]
  notes?: string
  terms_and_conditions?: string
  product_components?: Array<{
    unit: string
    quantity: number
    unit_price: number
    expense_object_id: string
  }>
  sent_at?: string
  viewed_at?: string
  last_reminder_sent?: string
  reminder_count: number
  is_recurring: boolean
  recurring_frequency?: string
  recurring_end_date?: string
  next_recurring_date?: string
  created_by: string
  created_at: string
  updated_at: string
}

interface InvoicesTabProps {
  searchTerm?: string
  onCreateInvoice: () => void
  shouldOpenCreateModal?: boolean // Prop to control modal opening from parent
}

export default function InvoicesTab({ searchTerm, onCreateInvoice, shouldOpenCreateModal }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [projects, setProjects] = useState<Array<{ id: string; name: string; project_code?: string; status?: string }>>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all') // Mặc định: Tất cả
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(10)
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string, name: string, email?: string, user_id?: string, project_id?: string, project_ids?: string[], hasProjects?: boolean }>>([])
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>('all')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchInvoices()
    fetchProjects()
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      // Lấy user đang đăng nhập
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Lấy thông tin user từ bảng users
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', authUser.id)
        .single()

      if (!userData) return

      // Lấy danh sách project_ids mà user có quyền truy cập
      let allowedProjectIds: string[] = []

      // Nếu là admin hoặc accountant, xem tất cả dự án
      if (userData.role === 'admin' || userData.role === 'accountant') {
        const { data: allProjects } = await supabase
          .from('projects')
          .select('id')
        allowedProjectIds = (allProjects || []).map(p => p.id)
      } else {
        // Lấy project_ids từ project_team theo user_id hoặc email
        // Thử query riêng biệt để đảm bảo chính xác
        const [teamDataByUserId, teamDataByEmail] = await Promise.all([
          supabase
            .from('project_team')
            .select('project_id')
            .eq('status', 'active')
            .eq('user_id', userData.id),
          supabase
            .from('project_team')
            .select('project_id')
            .eq('status', 'active')
            .eq('email', userData.email)
        ])

        // Gộp kết quả từ cả hai query
        const allTeamData = [
          ...(teamDataByUserId.data || []),
          ...(teamDataByEmail.data || [])
        ]

        allowedProjectIds = [...new Set(allTeamData.map(t => t.project_id))]
      }

      if (allowedProjectIds.length === 0) {
        setTeamMembers([])
        return
      }

      // Lấy tất cả nhân viên từ employees và users
      const [employeesRes, usersRes] = await Promise.all([
        supabase
          .from('employees')
          .select('id, first_name, last_name, email, user_id')
          .eq('status', 'active'),
        supabase
          .from('users')
          .select('id, full_name, email, is_active')
          .eq('is_active', true)
      ])

      const allEmployees = [
        ...(employeesRes.data || []).map((emp: any) => ({
          id: emp.id,
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || 'Không có tên',
          email: emp.email,
          user_id: emp.user_id,
          type: 'employee' as const
        })),
        ...(usersRes.data || []).map((user: any) => ({
          id: user.id,
          name: user.full_name || user.email || 'Không có tên',
          email: user.email,
          user_id: user.id,
          type: 'user' as const
        }))
      ]

      // Loại bỏ trùng lặp theo email
      const uniqueEmployees = Array.from(
        new Map(allEmployees.map(emp => [emp.email, emp])).values()
      )

      // Lấy thành viên dự án từ các dự án mà user có quyền
      const { data: teamMembersData } = await supabase
        .from('project_team')
        .select('id, name, email, project_id, user_id')
        .eq('status', 'active')
        .in('project_id', allowedProjectIds)

      // Tạo map từ user_id -> employee_id
      const userIdToEmployeeIdMap = new Map<string, string>()
      for (const emp of uniqueEmployees) {
        if (emp.user_id && emp.type === 'employee') {
          userIdToEmployeeIdMap.set(emp.user_id, emp.id)
        }
      }

      // Tạo map để match: user_id -> employee_id -> name -> email -> project_ids
      const memberProjectMap = new Map<string, string[]>()
        ; (teamMembersData || []).forEach((member: any) => {
          // Ưu tiên: user_id -> employee_id (từ user_id) -> name -> email
          const keys: string[] = []

          if (member.user_id) {
            keys.push(`user_${member.user_id}`)
            // Tìm employee_id từ user_id
            const empId = userIdToEmployeeIdMap.get(member.user_id)
            if (empId) {
              keys.push(`emp_${empId}`)
            }
          }
          if (member.name) {
            // Normalize name: lowercase, trim, remove extra spaces
            const normalizedName = member.name.toLowerCase().trim().replace(/\s+/g, ' ')
            keys.push(`name_${normalizedName}`)
          }
          if (member.email) {
            keys.push(`email_${member.email.toLowerCase().trim()}`)
          }

          keys.forEach(key => {
            if (!memberProjectMap.has(key)) {
              memberProjectMap.set(key, [])
            }
            memberProjectMap.get(key)!.push(member.project_id)
          })
        })

      // Hiển thị TẤT CẢ nhân viên trong dropdown
      // Nhưng chỉ lọc theo project_ids của những nhân viên có trong project_team của các dự án user có quyền
      const allMembersWithProjects = uniqueEmployees
        .map(emp => {
          // Lấy project_ids theo thứ tự ưu tiên: user_id -> employee_id -> name -> email
          let projectIds: string[] = []

          if (emp.user_id) {
            projectIds = memberProjectMap.get(`user_${emp.user_id}`) || []
          }
          if (projectIds.length === 0 && emp.type === 'employee') {
            projectIds = memberProjectMap.get(`emp_${emp.id}`) || []
          }
          if (projectIds.length === 0 && emp.name) {
            const normalizedName = emp.name.toLowerCase().trim().replace(/\s+/g, ' ')
            projectIds = memberProjectMap.get(`name_${normalizedName}`) || []
          }
          if (projectIds.length === 0 && emp.email) {
            projectIds = memberProjectMap.get(`email_${emp.email.toLowerCase().trim()}`) || []
          }

          // Lọc project_ids: chỉ giữ những project_ids mà user đang đăng nhập có quyền
          const filteredProjectIds = projectIds.filter(pid => allowedProjectIds.includes(pid))

          return {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            user_id: emp.user_id,
            project_ids: [...new Set(filteredProjectIds)], // Chỉ giữ project_ids mà user có quyền
            project_id: filteredProjectIds[0] || '',
            hasProjects: filteredProjectIds.length > 0
          }
        })

      // CHỈ hiển thị những nhân viên có trong project_team của các dự án user có quyền
      const filteredMembers = allMembersWithProjects.filter(m => m.hasProjects)
      setTeamMembers(filteredMembers)
    } catch (error) {
      console.error('Error fetching team members:', error)
      setTeamMembers([])
    }
  }

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, project_code, status')
        .order('name', { ascending: true })

      if (error) throw error

      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  useEffect(() => {
    if (shouldOpenCreateModal) {
      setShowCreateModal(true)
    }
  }, [shouldOpenCreateModal])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching invoices from database...')

      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        console.log('❌ No auth user found')
        setInvoices([])
        setLoading(false)
        return
      }

      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', authUser.id)
        .single()

      if (!userData) {
        console.log('❌ No user data found')
        setInvoices([])
        setLoading(false)
        return
      }

      // Save user role for UI display logic
      setUserRole(userData.role)

      console.log('🔍 Fetching invoices for user:', userData.email, 'role:', userData.role)

      // Build query
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customers:customer_id(name, email),
          projects:project_id(name, project_code, status)
        `)

      // Admin and accountant see all invoices
      if (userData.role === 'admin' || userData.role === 'accountant') {
        console.log('👑 Admin/Accountant: Fetching all invoices')
      } else {
        // Regular users: only see invoices for projects where they are in project_team
        console.log('👤 Regular user: Fetching invoices from accessible projects')

        // Get project_ids where user is in team
        const [teamDataByUserId, teamDataByEmail] = await Promise.all([
          supabase
            .from('project_team')
            .select('project_id')
            .eq('status', 'active')
            .eq('user_id', userData.id),
          supabase
            .from('project_team')
            .select('project_id')
            .eq('status', 'active')
            .eq('email', userData.email)
        ])

        const allTeamData = [
          ...(teamDataByUserId.data || []),
          ...(teamDataByEmail.data || [])
        ]

        const allowedProjectIds = [...new Set(allTeamData.map(t => t.project_id))]

        console.log(`✅ User has access to ${allowedProjectIds.length} projects:`, allowedProjectIds)

        if (allowedProjectIds.length === 0) {
          console.log('⚠️ User has no project access')
          setInvoices([])
          setLoading(false)
          return
        }

        // Filter invoices by allowed project IDs
        query = query.in('project_id', allowedProjectIds)
      }

      const { data: invoices, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Supabase error fetching invoices:', error)
        throw error
      }

      console.log(`✅ Fetched ${invoices?.length || 0} invoices`)
      const transformed = (invoices || []).map((inv: any) => ({
        ...inv,
        customer_name: inv.customers?.name,
        project_name: inv.projects?.name,
        project_code: inv.projects?.project_code,
        project_status: inv.projects?.status
      }))
      setInvoices(transformed)
    } catch (error) {
      console.error('❌ Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendInvoice = async (invoiceId: string) => {
    try {
      console.log('🔍 Sending invoice:', invoiceId)

      // Update invoice status to 'sent' using Supabase
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', invoiceId)

      if (error) {
        console.error('❌ Supabase error sending invoice:', error)
        throw error
      }

      console.log('🔍 Invoice sent successfully')
      fetchInvoices() // Refresh list
      alert('✅ Hóa đơn đã được gửi thành công!')
    } catch (error) {
      console.error('❌ Error sending invoice:', error)
      alert('❌ Lỗi khi gửi hóa đơn. Vui lòng thử lại.')
    }
  }

  const recordPayment = async (invoiceId: string, amount: number) => {
    try {
      console.log('🔍 Recording payment for invoice:', invoiceId, 'Amount:', amount)

      // First get the current invoice to check payment status
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('paid_amount, total_amount, payment_status')
        .eq('id', invoiceId)
        .single()

      if (fetchError || !invoice) {
        throw new Error('Không thể tìm thấy hóa đơn')
      }

      const newPaidAmount = invoice.paid_amount + amount
      const isFullyPaid = newPaidAmount >= invoice.total_amount

      // Update payment information
      const { error } = await supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          payment_status: isFullyPaid ? 'paid' : 'partial',
          status: isFullyPaid ? 'paid' : invoice.status,
          payment_date: isFullyPaid ? new Date().toISOString() : null
        })
        .eq('id', invoiceId)

      if (error) {
        console.error('❌ Supabase error recording payment:', error)
        throw error
      }

      console.log('🔍 Payment recorded successfully')
      fetchInvoices() // Refresh list

      if (isFullyPaid) {
        alert('✅ Hóa đơn đã được thanh toán đầy đủ!')
      } else {
        alert(`✅ Đã ghi nhận thanh toán ${formatCurrency(amount)}. Còn lại: ${formatCurrency(invoice.total_amount - newPaidAmount)}`)
      }
    } catch (error) {
      console.error('❌ Error recording payment:', error)
      alert('❌ Lỗi khi ghi nhận thanh toán. Vui lòng thử lại.')
    }
  }

  const openEditModal = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id)
    setShowCreateModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedInvoice(null)
  }

  const handleEditSuccess = () => {
    fetchInvoices() // Refresh the invoices list
    closeEditModal()
  }

  const openPaymentModal = (invoice: Invoice) => {
    setPaymentInvoice(invoice)
    setShowPaymentModal(true)
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setPaymentInvoice(null)
  }

  const handlePaymentSuccess = () => {
    fetchInvoices() // Refresh the invoices list
    closePaymentModal()
  }

  const deleteInvoice = async (invoiceId: string) => {
    try {
      console.log('🔍 Deleting invoice:', invoiceId)

      // Show confirmation dialog
      const confirmed = window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác.')
      if (!confirmed) {
        return
      }

      // Show loading state
      const loadingMessage = document.createElement('div')
      loadingMessage.innerHTML = `
        <div style="
          position: fixed; 
          top: 20px; 
          right: 20px; 
          background: #e74c3c; 
          color: white; 
          padding: 15px 20px; 
          border-radius: 5px; 
          z-index: 10000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
          🗑️ Đang xóa hóa đơn...
        </div>
      `
      document.body.appendChild(loadingMessage)

      // Delete invoice items first
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)

      if (itemsError) {
        console.error('❌ Error deleting invoice items:', itemsError)
        throw new Error('Failed to delete invoice items')
      }

      // Delete invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

      // Remove loading message
      document.body.removeChild(loadingMessage)

      if (invoiceError) {
        console.error('❌ Error deleting invoice:', invoiceError)
        throw new Error(invoiceError.message || 'Failed to delete invoice')
      }

      console.log('🔍 Invoice deleted successfully')

      // Show success notification
      const successMessage = document.createElement('div')
      successMessage.innerHTML = `
        <div style="
          position: fixed; 
          top: 20px; 
          right: 20px; 
          background: #27ae60; 
          color: white; 
          padding: 15px 20px; 
          border-radius: 5px; 
          z-index: 10000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          animation: slideIn 0.3s ease-out;
        ">
          ✅ Hóa đơn đã được xóa thành công!
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `
      document.body.appendChild(successMessage)

      // Remove success message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage)
        }
      }, 3000)

      // Refresh invoices list
      await fetchInvoices()

    } catch (error) {
      console.error('❌ Error deleting invoice:', error)

      // Show error notification
      const errorMessage = document.createElement('div')
      errorMessage.innerHTML = `
        <div style="
          position: fixed; 
          top: 20px; 
          right: 20px; 
          background: #e74c3c; 
          color: white; 
          padding: 15px 20px; 
          border-radius: 5px; 
          z-index: 10000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          animation: slideIn 0.3s ease-out;
        ">
          ❌ Lỗi khi xóa hóa đơn: ${error instanceof Error ? error.message : 'Lỗi không xác định'}
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `
      document.body.appendChild(errorMessage)

      // Remove error message after 5 seconds
      setTimeout(() => {
        if (document.body.contains(errorMessage)) {
          document.body.removeChild(errorMessage)
        }
      }, 5000)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'viewed':
        return 'bg-purple-100 text-purple-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      case 'voided':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'partial':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Nháp'
      case 'sent':
        return 'Đã gửi'
      case 'viewed':
        return 'Đã xem'
      case 'paid':
        return 'Đã thanh toán'
      case 'overdue':
        return 'Quá hạn'
      case 'cancelled':
        return 'Đã hủy'
      case 'voided':
        return 'Vô hiệu'
      default:
        return status
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ thanh toán'
      case 'partial':
        return 'Thanh toán 1 phần'
      case 'paid':
        return 'Đã thanh toán'
      case 'overdue':
        return 'Quá hạn'
      case 'refunded':
        return 'Đã hoàn tiền'
      default:
        return status
    }
  }

  const isOverdue = (dueDate: string, paymentStatus: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    return due < today && paymentStatus !== 'paid'
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer_name && invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))

    let matchesFilter = true
    if (filter === 'overdue') {
      matchesFilter = isOverdue(invoice.due_date, invoice.payment_status)
    } else if (filter !== 'all') {
      matchesFilter = invoice.status === filter || invoice.payment_status === filter
    }

    const matchesProject = selectedProjectId === 'all' || invoice.project_id === selectedProjectId

    // Filter by team member
    const matchesTeamMember = selectedTeamMemberId === 'all' || (() => {
      const selectedMember = teamMembers.find(m => {
        return m.id === selectedTeamMemberId || m.user_id === selectedTeamMemberId
      })
      if (selectedMember) {
        if (selectedMember.project_ids && selectedMember.project_ids.length > 0 && invoice.project_id) {
          return selectedMember.project_ids.includes(invoice.project_id)
        } else {
          // Nếu nhân viên không có project trong danh sách allowed, không hiển thị gì
          return false
        }
      }
      return true
    })()

    const matchesProjectStatus = projectStatusFilter === 'all' || (invoice as any).project_status === projectStatusFilter

    return matchesSearch && matchesFilter && matchesProject && matchesTeamMember && matchesProjectStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, selectedProjectId, selectedTeamMemberId, projectStatusFilter, searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Calculate invoice status totals
  const overdueAmount = invoices
    .filter(invoice => isOverdue(invoice.due_date, invoice.payment_status))
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)

  const notDueYetAmount = invoices
    .filter(invoice => !isOverdue(invoice.due_date, invoice.payment_status) && invoice.payment_status !== 'paid')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)

  const paidAmount = invoices
    .filter(invoice => invoice.payment_status === 'paid')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)

  return (
    <div className="space-y-4">
      {/* Invoice Status Bar - QuickBooks Style */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái hóa đơn</h3>

        {/* Visual Status Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-black mb-2">
            <span>Tổng giá trị hóa đơn</span>
            <span>Tổng: {formatCurrency(overdueAmount + notDueYetAmount + paidAmount)}</span>
          </div>
          <div className="flex h-8 rounded-lg overflow-hidden">
            <div
              className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(overdueAmount + notDueYetAmount + paidAmount) > 0 ? (overdueAmount / (overdueAmount + notDueYetAmount + paidAmount)) * 100 : 0}%` }}
            >
              {overdueAmount > 0 && 'Overdue'}
            </div>
            <div
              className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(overdueAmount + notDueYetAmount + paidAmount) > 0 ? (notDueYetAmount / (overdueAmount + notDueYetAmount + paidAmount)) * 100 : 0}%` }}
            >
              {notDueYetAmount > 0 && 'Not due yet'}
            </div>
            <div
              className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(overdueAmount + notDueYetAmount + paidAmount) > 0 ? (paidAmount / (overdueAmount + notDueYetAmount + paidAmount)) * 100 : 0}%` }}
            >
              {paidAmount > 0 && 'Paid'}
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
            <div className="text-sm text-black">Overdue</div>
            <div className="text-xs text-black">Quá hạn thanh toán</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(notDueYetAmount)}</div>
            <div className="text-sm text-black">Not due yet</div>
            <div className="text-xs text-black">Chưa tới hạn</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
            <div className="text-sm text-black">Paid</div>
            <div className="text-xs text-black">Đã thanh toán</div>
          </div>
        </div>
      </div>

      {/* Header with Help Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Hóa đơn</h2>
          <button
            onClick={() => setShowHelpModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Hướng dẫn sử dụng"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Hướng dẫn
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex space-x-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'all'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'draft'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Nháp
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'sent'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Đã gửi
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'pending'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Chờ thanh toán
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'overdue'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Quá hạn
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1 rounded-md text-sm ${filter === 'paid'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Đã thanh toán
          </button>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1 rounded-md text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả dự án</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project_code ? `${project.project_code} - ` : ''}{project.name}
              </option>
            ))}
          </select>

          {/* Team Member Filter - Only show for admin and accountant */}
          {(userRole === 'admin' || userRole === 'accountant') && (
            <select
              value={selectedTeamMemberId}
              onChange={(e) => setSelectedTeamMemberId(e.target.value)}
              className="px-3 py-1 rounded-md text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả thành viên</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.user_id || member.id}>
                  {member.name} {member.email ? `(${member.email})` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Project Status Filter */}
          <select
            value={projectStatusFilter}
            onChange={(e) => setProjectStatusFilter(e.target.value)}
            className="px-3 py-1 rounded-md text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROJECT_STATUS_FILTER_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo hóa đơn
        </button>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Tên dự án
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Số tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Thanh toán
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Hạn thanh toán
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Receipt className="h-4 w-4 text-black mr-2" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {invoice.project_name ? (
                          <>{invoice.project_code ? `${invoice.project_code} - ` : ''}{invoice.project_name}</>
                        ) : <span className="text-gray-400">Không có dự án</span>}
                      </span>
                      {invoice.is_recurring && (
                        <div className="text-xs text-purple-600">Định kỳ</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {invoice.customer_name || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.total_amount)}
                  </div>
                  {invoice.paid_amount > 0 && (
                    <div className="text-xs text-green-600">
                      Đã thu: {formatCurrency(invoice.paid_amount)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.payment_status)}`}>
                    {getPaymentStatusText(invoice.payment_status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-black mr-1" />
                    <span className={isOverdue(invoice.due_date, invoice.payment_status) ? 'text-red-600 font-medium' : ''}>
                      {formatDate(invoice.due_date)}
                    </span>
                    {isOverdue(invoice.due_date, invoice.payment_status) && (
                      <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      className="text-black hover:text-black"
                      title="Xem chi tiết"
                      onClick={() => window.open(`/sales/invoices/${invoice.id}`, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {invoice.status === 'draft' && (
                      <>
                        <button
                          onClick={() => openEditModal(invoice)}
                          className="text-black hover:text-blue-600"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => sendInvoice(invoice.id)}
                          className="text-black hover:text-green-600"
                          title="Gửi hóa đơn"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {(invoice.payment_status === 'pending' || invoice.payment_status === 'partial') && (
                      <button
                        onClick={() => openPaymentModal(invoice)}
                        className="text-black hover:text-green-600"
                        title="Ghi nhận thanh toán"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                    )}

                    {invoice.payment_status === 'paid' && (
                      <div title="Đã thanh toán">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    )}

                    <button
                      onClick={() => deleteInvoice(invoice.id)}
                      className="text-black hover:text-red-600"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInvoices.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="mx-auto h-12 w-12 text-black" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có hóa đơn</h3>
            <p className="mt-1 text-sm text-black">
              Bắt đầu bằng cách tạo hóa đơn mới.
            </p>
          </div>
        ) : (
          <>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-700">
                  <span>
                    Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredInvoices.length)} trong tổng số {filteredInvoices.length} hóa đơn
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                  >
                    Trước
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md text-sm ${currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Invoice Sidebar */}
      <CreateInvoiceSidebarFullscreen
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingInvoiceId(null)
        }}
        onSuccess={() => {
          fetchInvoices()
          setShowCreateModal(false)
          setEditingInvoiceId(null)
        }}
        invoiceId={editingInvoiceId || undefined}
      />

      {/* Help Sidebar */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0" onClick={() => setShowHelpModal(false)}></div>
          <div className="absolute left-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  📚 Hướng dẫn sử dụng Hóa đơn
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Overview */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-2">🎯 Tổng quan</h4>
                  <p className="text-sm text-gray-600">
                    Module Hóa đơn giúp bạn quản lý các hóa đơn bán hàng, theo dõi thanh toán và tình trạng thu tiền từ khách hàng.
                  </p>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">✨ Tính năng chính</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Plus className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tạo hóa đơn</p>
                          <p className="text-xs text-gray-500">Tạo hóa đơn mới từ báo giá hoặc từ đầu</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Send className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Gửi hóa đơn</p>
                          <p className="text-xs text-gray-500">Gửi hóa đơn qua email cho khách hàng</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Ghi nhận thanh toán</p>
                          <p className="text-xs text-gray-500">Cập nhật trạng thái thanh toán</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Xem chi tiết</p>
                          <p className="text-xs text-gray-500">Xem thông tin chi tiết hóa đơn</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Edit className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Chỉnh sửa</p>
                          <p className="text-xs text-gray-500">Chỉnh sửa hóa đơn (chỉ khi ở trạng thái nháp)</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Trash2 className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Xóa hóa đơn</p>
                          <p className="text-xs text-gray-500">Xóa hóa đơn (chỉ khi ở trạng thái nháp)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Guide */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">📊 Trạng thái hóa đơn</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Nháp</span>
                      <span className="text-sm text-gray-600">Hóa đơn đang được soạn thảo, có thể chỉnh sửa</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Đã gửi</span>
                      <span className="text-sm text-gray-600">Đã gửi cho khách hàng, chờ phản hồi</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Đã thanh toán</span>
                      <span className="text-sm text-gray-600">Khách hàng đã thanh toán đầy đủ</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Quá hạn</span>
                      <span className="text-sm text-gray-600">Hóa đơn đã quá hạn thanh toán</span>
                    </div>
                  </div>
                </div>

                {/* Workflow */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">🔄 Quy trình làm việc</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                      <li><strong>Tạo hóa đơn:</strong> Tạo hóa đơn mới hoặc chuyển từ báo giá</li>
                      <li><strong>Kiểm tra thông tin:</strong> Xem lại thông tin khách hàng, sản phẩm, giá cả</li>
                      <li><strong>Gửi hóa đơn:</strong> Gửi hóa đơn cho khách hàng qua email</li>
                      <li><strong>Theo dõi thanh toán:</strong> Cập nhật trạng thái khi khách hàng thanh toán</li>
                      <li><strong>Hoàn tất:</strong> Đánh dấu hóa đơn đã thanh toán đầy đủ</li>
                    </ol>
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">💡 Mẹo sử dụng</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>Sử dụng bộ lọc để tìm hóa đơn theo trạng thái</li>
                      <li>Kiểm tra hóa đơn quá hạn thường xuyên</li>
                      <li>Gửi nhắc nhở thanh toán cho khách hàng</li>
                      <li>Lưu trữ hóa đơn đã thanh toán để báo cáo</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        onSuccess={handleEditSuccess}
        invoice={selectedInvoice}
      />

      {paymentInvoice && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={closePaymentModal}
          onSuccess={handlePaymentSuccess}
          invoice={paymentInvoice}
        />
      )}
    </div>
  )
}