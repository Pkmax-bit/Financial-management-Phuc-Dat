'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

interface CreditMemoItem {
  product_id?: string
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  discount_rate?: number
  discount_amount?: number
  line_total: number
  reason?: string
}

interface CreditMemo {
  id: string
  credit_memo_number: string
  customer_id: string
  original_invoice_id?: string
  issue_date: string
  returned_items: CreditMemoItem[]
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  currency: string
  status: 'open' | 'applied' | 'closed'
  reason?: string
  applied_amount: number
  remaining_amount: number
  refund_amount: number
  notes?: string
  created_at: string
}

interface CreditMemosTabProps {
  onShowCreateModal: () => void
  onShowEditModal: (memo: CreditMemo) => void
  onShowDetailModal: (memo: CreditMemo) => void
  onShowApplyModal: (memo: CreditMemo) => void
  onShowRefundModal: (memo: CreditMemo) => void
}

export default function CreditMemosTab({ 
  onShowCreateModal, 
  onShowEditModal, 
  onShowDetailModal,
  onShowApplyModal,
  onShowRefundModal
}: CreditMemosTabProps) {
  const [memos, setMemos] = useState<CreditMemo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchCreditMemos()
  }, [])

  const fetchCreditMemos = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/sales/credit-memos')
      setMemos(data)
    } catch (error) {
      console.error('Error fetching credit memos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (memoId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa credit memo này?')) return

    try {
      await apiDelete(`/api/sales/credit-memos/${memoId}`)
      setMemos(memos.filter(m => m.id !== memoId))
    } catch (error) {
      console.error('Error deleting credit memo:', error)
      alert('Lỗi khi xóa credit memo')
    }
  }

  const filteredMemos = memos.filter(memo => {
    const matchesSearch = memo.credit_memo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || memo.status === filterStatus
    return matchesSearch && matchesFilter
  })

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
    const colors: { [key: string]: string } = {
      'open': 'bg-yellow-100 text-yellow-800',
      'applied': 'bg-blue-100 text-blue-800',
      'closed': 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'open': 'Mở',
      'applied': 'Đã áp dụng',
      'closed': 'Đã đóng'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Credit Memo</h3>
          <p className="text-sm text-black">Quản lý việc khách hàng trả lại hàng hoặc hủy dịch vụ</p>
        </div>
        <button
          onClick={onShowCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo Credit Memo
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo số credit memo, lý do..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-black" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">Mở</option>
            <option value="applied">Đã áp dụng</option>
            <option value="closed">Đã đóng</option>
          </select>
        </div>
      </div>

      {/* Credit Memos Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Số Credit Memo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Tổng Tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Đã Áp Dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Còn Lại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Lý Do
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMemos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-black">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Không tìm thấy credit memo nào phù hợp' 
                      : 'Chưa có credit memo nào. Hãy tạo credit memo đầu tiên!'
                    }
                  </td>
                </tr>
              ) : (
                filteredMemos.map((memo) => (
                  <tr key={memo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {memo.credit_memo_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(memo.issue_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(memo.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(memo.applied_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(memo.remaining_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(memo.status)}`}>
                        {getStatusLabel(memo.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black max-w-xs truncate">
                        {memo.reason || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onShowDetailModal(memo)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {memo.status === 'open' && (
                          <>
                            <button
                              onClick={() => onShowApplyModal(memo)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Áp dụng vào đơn hàng"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onShowRefundModal(memo)}
                              className="text-orange-600 hover:text-orange-900 p-1"
                              title="Hoàn tiền"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {memo.status === 'open' && (
                          <button
                            onClick={() => onShowEditModal(memo)}
                            className="text-yellow-600 hover:text-yellow-900 p-1"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {memo.status === 'open' && (
                          <button
                            onClick={() => handleDelete(memo.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {filteredMemos.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-black">
              Hiển thị {filteredMemos.length} credit memo
            </div>
            <div className="text-sm font-semibold text-gray-900">
              Tổng cộng: {formatCurrency(
                filteredMemos.reduce((sum, memo) => sum + memo.total_amount, 0)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
