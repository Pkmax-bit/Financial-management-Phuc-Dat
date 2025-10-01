'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react'
import { salesReceiptsApi } from '@/lib/api'

interface SalesReceiptItem {
  product_id?: string
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  discount_rate?: number
  discount_amount?: number
  line_total: number
}

interface SalesReceipt {
  id: string
  receipt_number: string
  customer_id?: string
  issue_date: string
  line_items: SalesReceiptItem[]
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  payment_method: string
  notes?: string
  created_at: string
}

interface SalesReceiptsTabProps {
  onShowCreateModal: () => void
  onShowEditModal: (receipt: SalesReceipt) => void
  onShowDetailModal: (receipt: SalesReceipt) => void
}

export default function SalesReceiptsTab({ 
  onShowCreateModal, 
  onShowEditModal, 
  onShowDetailModal 
}: SalesReceiptsTabProps) {
  const [receipts, setReceipts] = useState<SalesReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMethod, setFilterMethod] = useState('all')

  useEffect(() => {
    fetchReceipts()
  }, [])

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      const data = await salesReceiptsApi.getSalesReceipts()
      setReceipts(data)
    } catch (error) {
      console.error('Error fetching sales receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (receiptId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phiếu thu này?')) return

    try {
      await salesReceiptsApi.deleteSalesReceipt(receiptId)
      setReceipts(receipts.filter(r => r.id !== receiptId))
    } catch (error) {
      console.error('Error deleting sales receipt:', error)
      alert('Lỗi khi xóa phiếu thu')
    }
  }

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterMethod === 'all' || receipt.payment_method === filterMethod
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

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      'Cash': 'Tiền mặt',
      'Credit Card': 'Thẻ tín dụng',
      'Bank Transfer': 'Chuyển khoản',
      'Debit Card': 'Thẻ ghi nợ'
    }
    return labels[method] || method
  }

  const getPaymentMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      'Cash': 'bg-green-100 text-green-800',
      'Credit Card': 'bg-blue-100 text-blue-800',
      'Bank Transfer': 'bg-purple-100 text-purple-800',
      'Debit Card': 'bg-orange-100 text-orange-800'
    }
    return colors[method] || 'bg-gray-100 text-gray-800'
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
          <h3 className="text-lg font-semibold text-gray-900">Phiếu Thu Bán Hàng</h3>
          <p className="text-sm text-black">Quản lý các giao dịch bán hàng thu tiền ngay</p>
        </div>
        <button
          onClick={onShowCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo Phiếu Thu
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo số phiếu, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-black" />
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả phương thức</option>
            <option value="Cash">Tiền mặt</option>
            <option value="Credit Card">Thẻ tín dụng</option>
            <option value="Bank Transfer">Chuyển khoản</option>
            <option value="Debit Card">Thẻ ghi nợ</option>
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Số Phiếu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Số Lượng SP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Tổng Tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Phương Thức
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Ghi Chú
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-black">
                    {searchTerm || filterMethod !== 'all' 
                      ? 'Không tìm thấy phiếu thu nào phù hợp' 
                      : 'Chưa có phiếu thu nào. Hãy tạo phiếu thu đầu tiên!'
                    }
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {receipt.receipt_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(receipt.issue_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {receipt.line_items.length} sản phẩm
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(receipt.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodColor(receipt.payment_method)}`}>
                        {getPaymentMethodLabel(receipt.payment_method)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black max-w-xs truncate">
                        {receipt.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onShowDetailModal(receipt)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onShowEditModal(receipt)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(receipt.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
      {filteredReceipts.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-black">
              Hiển thị {filteredReceipts.length} phiếu thu
            </div>
            <div className="text-sm font-semibold text-gray-900">
              Tổng cộng: {formatCurrency(
                filteredReceipts.reduce((sum, receipt) => sum + receipt.total_amount, 0)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
