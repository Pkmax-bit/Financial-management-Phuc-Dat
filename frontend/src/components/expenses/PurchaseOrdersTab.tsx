'use client'

import { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
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
  ArrowRight
} from 'lucide-react'
import { purchaseOrdersApi } from '@/lib/api'

interface PurchaseOrder {
  id: string
  po_number: string
  vendor_id: string
  vendor_name: string
  vendor_email?: string
  issue_date: string
  delivery_date?: string
  total_amount: number
  currency: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'closed'
  notes?: string
  created_by?: string
  created_by_email?: string
  approved_by?: string
  approved_by_email?: string
  approved_at?: string
  created_at: string
  updated_at: string
  item_count: number
}

interface PurchaseOrdersTabProps {
  searchTerm: string
  onCreatePurchaseOrder: () => void
}

export default function PurchaseOrdersTab({ searchTerm, onCreatePurchaseOrder }: PurchaseOrdersTabProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')

  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const data = await purchaseOrdersApi.getPurchaseOrders()
      setPurchaseOrders(data)
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForApproval = async (poId: string) => {
    try {
      await purchaseOrdersApi.submitForApproval(poId)
      fetchPurchaseOrders()
    } catch (error) {
      console.error('Error submitting for approval:', error)
    }
  }

  const handleApprove = async (poId: string, action: 'approve' | 'reject') => {
    try {
      await purchaseOrdersApi.approvePurchaseOrder(poId, {
        action,
        notes: approvalNotes
      })
      setShowApprovalModal(false)
      setSelectedPO(null)
      setApprovalNotes('')
      fetchPurchaseOrders()
    } catch (error) {
      console.error(`Error ${action}ing purchase order:`, error)
    }
  }

  const handleConvertToBill = async (poId: string) => {
    try {
      await purchaseOrdersApi.convertToBill(poId, {})
      fetchPurchaseOrders()
    } catch (error) {
      console.error('Error converting to bill:', error)
    }
  }

  const handleDelete = async (poId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đơn đặt hàng này?')) {
      try {
        await purchaseOrdersApi.deletePurchaseOrder(poId)
        fetchPurchaseOrders()
      } catch (error) {
        console.error('Error deleting purchase order:', error)
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
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'closed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Nháp'
      case 'pending_approval':
        return 'Chờ duyệt'
      case 'approved':
        return 'Đã duyệt'
      case 'rejected':
        return 'Từ chối'
      case 'closed':
        return 'Đã đóng'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />
      case 'pending_approval':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'closed':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    const matchesSearch = po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || po.status === filter
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
          <h3 className="text-lg font-medium text-gray-900">Đơn Đặt Hàng</h3>
          <p className="text-sm text-black">Quản lý đơn đặt hàng và luồng phê duyệt</p>
        </div>
        <button
          onClick={onCreatePurchaseOrder}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo đơn đặt hàng
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-black'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'draft' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-black'
          }`}
        >
          Nháp
        </button>
        <button
          onClick={() => setFilter('pending_approval')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'pending_approval' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-black'
          }`}
        >
          Chờ duyệt
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-black'
          }`}
        >
          Đã duyệt
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'rejected' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-black'
          }`}
        >
          Từ chối
        </button>
      </div>

      {/* Purchase Orders List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredPurchaseOrders.map((po) => (
            <li key={po.id} className="hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShoppingCart className="h-8 w-8 text-black" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{po.po_number}</p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                          {getStatusIcon(po.status)}
                          <span className="ml-1">{getStatusText(po.status)}</span>
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-black">
                          Nhà cung cấp: {po.vendor_name}
                        </p>
                        <p className="text-sm text-black">
                          Ngày tạo: {formatDate(po.created_at)}
                        </p>
                        {po.delivery_date && (
                          <p className="text-sm text-black">
                            Ngày giao: {formatDate(po.delivery_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(po.total_amount)}
                      </p>
                      <p className="text-sm text-black">
                        {po.item_count} sản phẩm
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="text-black hover:text-black" 
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {po.status === 'draft' && (
                        <>
                          <button 
                            className="text-black hover:text-blue-600" 
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleSubmitForApproval(po.id)}
                            className="text-black hover:text-green-600" 
                            title="Gửi duyệt"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(po.id)}
                            className="text-black hover:text-red-600" 
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {po.status === 'pending_approval' && (
                        <>
                          <button 
                            onClick={() => {
                              setSelectedPO(po)
                              setShowApprovalModal(true)
                            }}
                            className="text-black hover:text-green-600" 
                            title="Duyệt"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedPO(po)
                              setShowApprovalModal(true)
                            }}
                            className="text-black hover:text-red-600" 
                            title="Từ chối"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {po.status === 'approved' && (
                        <button 
                          onClick={() => handleConvertToBill(po.id)}
                          className="text-black hover:text-blue-600" 
                          title="Chuyển thành hóa đơn"
                        >
                          <ArrowRight className="h-4 w-4" />
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
      {showApprovalModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Phê duyệt đơn đặt hàng
              </h3>
              <p className="text-sm text-black mb-4">
                Đơn đặt hàng: <strong>{selectedPO.po_number}</strong>
              </p>
              <p className="text-sm text-black mb-4">
                Nhà cung cấp: <strong>{selectedPO.vendor_name}</strong>
              </p>
              <p className="text-sm text-black mb-4">
                Tổng tiền: <strong>{formatCurrency(selectedPO.total_amount)}</strong>
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
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false)
                    setSelectedPO(null)
                    setApprovalNotes('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleApprove(selectedPO.id, 'reject')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Từ chối
                </button>
                <button
                  onClick={() => handleApprove(selectedPO.id, 'approve')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Duyệt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
