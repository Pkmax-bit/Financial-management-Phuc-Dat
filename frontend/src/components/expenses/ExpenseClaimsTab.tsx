'use client'

import { useState, useEffect } from 'react'
import { 
  Receipt, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  User,
  Calendar
} from 'lucide-react'
import { expenseClaimsApi } from '@/lib/api'

interface ExpenseClaim {
  id: string
  claim_number: string
  employee_id: string
  employee_email?: string
  employee_name?: string
  submission_date: string
  description: string
  total_amount: number
  currency: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
  notes?: string
  rejection_reason?: string
  approved_by?: string
  approved_by_email?: string
  approved_by_name?: string
  approved_at?: string
  paid_by?: string
  paid_by_email?: string
  paid_by_name?: string
  paid_at?: string
  payment_method?: string
  payment_reference?: string
  created_at: string
  updated_at: string
  item_count: number
}

interface ExpenseClaimsTabProps {
  searchTerm: string
  onCreateExpenseClaim: () => void
}

export default function ExpenseClaimsTab({ searchTerm, onCreateExpenseClaim }: ExpenseClaimsTabProps) {
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<ExpenseClaim | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'check',
    payment_reference: '',
    notes: ''
  })

  useEffect(() => {
    fetchExpenseClaims()
  }, [])

  const fetchExpenseClaims = async () => {
    try {
      setLoading(true)
      const data = await expenseClaimsApi.getExpenseClaims()
      setExpenseClaims(data)
    } catch (error) {
      console.error('Error fetching expense claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForApproval = async (claimId: string) => {
    try {
      await expenseClaimsApi.submitForApproval(claimId)
      fetchExpenseClaims()
    } catch (error) {
      console.error('Error submitting for approval:', error)
    }
  }

  const handleApprove = async (claimId: string, action: 'approve' | 'reject') => {
    try {
      await expenseClaimsApi.approveExpenseClaim(claimId, {
        action,
        notes: approvalNotes,
        rejection_reason: action === 'reject' ? rejectionReason : undefined
      })
      setShowApprovalModal(false)
      setSelectedClaim(null)
      setApprovalNotes('')
      setRejectionReason('')
      fetchExpenseClaims()
    } catch (error) {
      console.error(`Error ${action}ing expense claim:`, error)
    }
  }

  const handleProcessPayment = async (claimId: string) => {
    try {
      await expenseClaimsApi.processPayment(claimId, paymentData)
      setShowPaymentModal(false)
      setSelectedClaim(null)
      setPaymentData({ payment_method: 'cash', payment_reference: '', notes: '' })
      fetchExpenseClaims()
    } catch (error) {
      console.error('Error processing payment:', error)
    }
  }

  const handleDelete = async (claimId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đề nghị hoàn ứng này?')) {
      try {
        await expenseClaimsApi.deleteExpenseClaim(claimId)
        fetchExpenseClaims()
      } catch (error) {
        console.error('Error deleting expense claim:', error)
      }
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
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'paid':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Nháp'
      case 'submitted':
        return 'Đã gửi'
      case 'approved':
        return 'Đã duyệt'
      case 'rejected':
        return 'Từ chối'
      case 'paid':
        return 'Đã thanh toán'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />
      case 'submitted':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'paid':
        return <DollarSign className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const filteredExpenseClaims = expenseClaims.filter(claim => {
    const matchesSearch = claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (claim.employee_name && claim.employee_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filter === 'all' || claim.status === filter
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Đề nghị Hoàn ứng</h3>
          <p className="text-sm text-gray-500">Quản lý đề nghị hoàn ứng của nhân viên</p>
        </div>
        <button
          onClick={onCreateExpenseClaim}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo đề nghị hoàn ứng
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'draft' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Nháp
        </button>
        <button
          onClick={() => setFilter('submitted')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Đã gửi
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Đã duyệt
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'rejected' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Từ chối
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Đã thanh toán
        </button>
      </div>

      {/* Expense Claims List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredExpenseClaims.map((claim) => (
            <li key={claim.id} className="hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Receipt className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{claim.claim_number}</p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                          {getStatusIcon(claim.status)}
                          <span className="ml-1">{getStatusText(claim.status)}</span>
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">
                          {claim.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          Nhân viên: {claim.employee_name || claim.employee_email || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Ngày gửi: {formatDate(claim.submission_date)}
                        </p>
                        {claim.rejection_reason && (
                          <p className="text-sm text-red-600">
                            Lý do từ chối: {claim.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(claim.total_amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {claim.item_count} khoản chi
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="text-gray-400 hover:text-gray-600" 
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {claim.status === 'draft' && (
                        <>
                          <button 
                            className="text-gray-400 hover:text-blue-600" 
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleSubmitForApproval(claim.id)}
                            className="text-gray-400 hover:text-green-600" 
                            title="Gửi duyệt"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(claim.id)}
                            className="text-gray-400 hover:text-red-600" 
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {claim.status === 'submitted' && (
                        <>
                          <button 
                            onClick={() => {
                              setSelectedClaim(claim)
                              setShowApprovalModal(true)
                            }}
                            className="text-gray-400 hover:text-green-600" 
                            title="Duyệt"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedClaim(claim)
                              setShowApprovalModal(true)
                            }}
                            className="text-gray-400 hover:text-red-600" 
                            title="Từ chối"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {claim.status === 'approved' && (
                        <button 
                          onClick={() => {
                            setSelectedClaim(claim)
                            setShowPaymentModal(true)
                          }}
                          className="text-gray-400 hover:text-blue-600" 
                          title="Thanh toán"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Phê duyệt đề nghị hoàn ứng
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Đề nghị: <strong>{selectedClaim.claim_number}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Nhân viên: <strong>{selectedClaim.employee_name || selectedClaim.employee_email}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Số tiền: <strong>{formatCurrency(selectedClaim.total_amount)}</strong>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập ghi chú về quyết định..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối (nếu từ chối)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false)
                    setSelectedClaim(null)
                    setApprovalNotes('')
                    setRejectionReason('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleApprove(selectedClaim.id, 'reject')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Từ chối
                </button>
                <button
                  onClick={() => handleApprove(selectedClaim.id, 'approve')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Duyệt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Thanh toán đề nghị hoàn ứng
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Đề nghị: <strong>{selectedClaim.claim_number}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Nhân viên: <strong>{selectedClaim.employee_name || selectedClaim.employee_email}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Số tiền: <strong>{formatCurrency(selectedClaim.total_amount)}</strong>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phương thức thanh toán
                </label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value as 'cash' | 'bank_transfer' | 'check' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank_transfer">Chuyển khoản</option>
                  <option value="check">Séc</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tham chiếu (tùy chọn)
                </label>
                <input
                  type="text"
                  value={paymentData.payment_reference}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số tham chiếu..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập ghi chú về thanh toán..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedClaim(null)
                    setPaymentData({ payment_method: 'cash', payment_reference: '', notes: '' })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleProcessPayment(selectedClaim.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Xác nhận thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
