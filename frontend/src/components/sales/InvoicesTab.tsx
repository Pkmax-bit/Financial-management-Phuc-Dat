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
  CheckCircle
} from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  customer_name?: string
  project_id?: string
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
  items: any[]
  notes?: string
  terms_and_conditions?: string
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
  searchTerm: string
  onCreateInvoice: () => void
}

export default function InvoicesTab({ searchTerm, onCreateInvoice }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sales/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/sales/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        fetchInvoices() // Refresh list
        // Show success message
      }
    } catch (error) {
      console.error('Error sending invoice:', error)
    }
  }

  const recordPayment = async (invoiceId: string, amount: number) => {
    try {
      const response = await fetch(`/api/sales/invoices/${invoiceId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_amount: amount,
          payment_date: new Date().toISOString().split('T')[0]
        }),
      })

      if (response.ok) {
        fetchInvoices() // Refresh list
        // Show success message
      }
    } catch (error) {
      console.error('Error recording payment:', error)
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
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer_name && invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    let matchesFilter = true
    if (filter === 'overdue') {
      matchesFilter = isOverdue(invoice.due_date, invoice.payment_status)
    } else if (filter !== 'all') {
      matchesFilter = invoice.status === filter || invoice.payment_status === filter
    }

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
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
            onClick={() => setFilter('draft')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'draft' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nháp
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'sent' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Đã gửi
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'pending' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Chờ thanh toán
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'overdue' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Quá hạn
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
        </div>

        <button
          onClick={onCreateInvoice}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số hóa đơn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thanh toán
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hạn thanh toán
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Receipt className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </span>
                      {invoice.is_recurring && (
                        <div className="text-xs text-purple-600">Định kỳ</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.customer_name || 'N/A'}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
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
                      className="text-gray-400 hover:text-gray-600" 
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {invoice.status === 'draft' && (
                      <>
                        <button 
                          className="text-gray-400 hover:text-blue-600" 
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => sendInvoice(invoice.id)}
                          className="text-gray-400 hover:text-green-600" 
                          title="Gửi hóa đơn"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    {(invoice.payment_status === 'pending' || invoice.payment_status === 'partial') && (
                      <button 
                        onClick={() => recordPayment(invoice.id, invoice.total_amount - invoice.paid_amount)}
                        className="text-gray-400 hover:text-green-600" 
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
                      className="text-gray-400 hover:text-red-600" 
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
        
        {filteredInvoices.length === 0 && (
          <div className="text-center py-8">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có hóa đơn</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bắt đầu bằng cách tạo hóa đơn mới.
            </p>
            <div className="mt-6">
              <button
                onClick={onCreateInvoice}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo hóa đơn đầu tiên
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}