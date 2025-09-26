'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react'
import CreateQuoteModal from './CreateQuoteModal'
import { apiGet, apiPost } from '@/lib/api'

interface Quote {
  id: string
  quote_number: string
  customer_id: string
  customer_name?: string
  project_id?: string
  issue_date: string
  valid_until: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  currency: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'closed'
  items: any[]
  notes?: string
  terms_and_conditions?: string
  sent_at?: string
  viewed_at?: string
  accepted_at?: string
  declined_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

interface QuotesTabProps {
  searchTerm: string
  onCreateQuote: () => void
  shouldOpenCreateModal?: boolean
}

export default function QuotesTab({ searchTerm, onCreateQuote, shouldOpenCreateModal }: QuotesTabProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchQuotes()
  }, [])

  useEffect(() => {
    if (shouldOpenCreateModal) {
      setShowCreateModal(true)
    }
  }, [shouldOpenCreateModal])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/sales/quotes')
      setQuotes(data)
    } catch (error) {
      console.error('Error fetching quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendQuote = async (quoteId: string) => {
    try {
      await apiPost(`/api/sales/quotes/${quoteId}/send`, {})
      fetchQuotes() // Refresh list
      // Show success message
    } catch (error) {
      console.error('Error sending quote:', error)
    }
  }

  const convertToInvoice = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/sales/quotes/${quoteId}/convert-to-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        fetchQuotes() // Refresh list
        // Show success message
      }
    } catch (error) {
      console.error('Error converting quote:', error)
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
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-yellow-100 text-yellow-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
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
      case 'accepted':
        return 'Đã chấp nhận'
      case 'declined':
        return 'Từ chối'
      case 'expired':
        return 'Hết hạn'
      case 'closed':
        return 'Đã đóng'
      default:
        return status
    }
  }

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.customer_name && quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filter === 'all' || quote.status === filter

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
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'accepted' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Đã chấp nhận
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo báo giá
        </button>
      </div>

      {/* Quotes Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số báo giá
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
                Hạn hiệu lực
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredQuotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {quote.quote_number}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {quote.customer_name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(quote.total_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                    {getStatusText(quote.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    {formatDate(quote.valid_until)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(quote.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      className="text-gray-400 hover:text-gray-600" 
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {quote.status === 'draft' && (
                      <>
                        <button 
                          className="text-gray-400 hover:text-blue-600" 
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => sendQuote(quote.id)}
                          className="text-gray-400 hover:text-green-600" 
                          title="Gửi báo giá"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    {quote.status === 'accepted' && (
                      <button 
                        onClick={() => convertToInvoice(quote.id)}
                        className="text-gray-400 hover:text-purple-600" 
                        title="Chuyển thành hóa đơn"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
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
        
        {filteredQuotes.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có báo giá</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bắt đầu bằng cách tạo báo giá mới.
            </p>
            <div className="mt-6">
              <button
                onClick={onCreateQuote}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo báo giá đầu tiên
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateQuoteModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchQuotes()
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}