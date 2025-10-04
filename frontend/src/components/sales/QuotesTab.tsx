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
import CreateQuoteSidebar from './CreateQuoteSidebar'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'

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
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'closed' | 'converted'
  items: unknown[]
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
      console.log('🔍 Fetching quotes from database...')
      
      // Use Supabase directly to get quotes
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customers:customer_id(name, email),
          projects:project_id(name, project_code)
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Supabase error fetching quotes:', error)
        throw error
      }
      
      console.log('🔍 Quotes data from database:', quotes)
      setQuotes(quotes || [])
    } catch (error) {
      console.error('❌ Error fetching quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendQuote = async (quoteId: string) => {
    try {
      console.log('🔍 Sending quote:', quoteId)
      
      // Update quote status to 'sent' using Supabase
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', quoteId)
      
      if (error) {
        console.error('❌ Supabase error sending quote:', error)
        throw error
      }
      
      console.log('🔍 Quote sent successfully')
      fetchQuotes() // Refresh list
      // Show success message
    } catch (error) {
      console.error('❌ Error sending quote:', error)
    }
  }

  const convertToInvoice = async (quoteId: string) => {
    try {
      console.log('🔍 Converting quote to invoice:', quoteId)
      
      // First, get the quote details
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          customers:customer_id(name, email),
          projects:project_id(name, project_code)
        `)
        .eq('id', quoteId)
        .single()
      
      if (quoteError || !quote) {
        console.error('❌ Error fetching quote:', quoteError)
        throw new Error('Không thể tìm thấy báo giá')
      }
      
      console.log('🔍 Quote data:', quote)
      
      // Check if quote can be converted
      if (quote.status === 'closed' || quote.status === 'converted') {
        throw new Error('Báo giá này đã được chuyển thành hóa đơn rồi')
      }
      
      if (quote.status === 'declined') {
        throw new Error('Không thể chuyển báo giá đã bị từ chối')
      }
      
      if (quote.status === 'expired') {
        throw new Error('Không thể chuyển báo giá đã hết hạn')
      }
      
      // Generate invoice number
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
      const invoiceNumber = `INV-${dateStr}-${randomStr}`
      
      // Calculate due date (30 days from issue date)
      const issueDate = new Date(quote.issue_date)
      const dueDate = new Date(issueDate)
      dueDate.setDate(dueDate.getDate() + 30)
      
      // Create invoice from quote data
      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_id: quote.customer_id,
        project_id: quote.project_id,
        quote_id: quoteId, // Link to original quote
        issue_date: issueDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal: quote.subtotal,
        tax_rate: quote.tax_rate,
        tax_amount: quote.tax_amount,
        total_amount: quote.total_amount,
        currency: quote.currency,
        status: 'draft',
        payment_status: 'pending',
        paid_amount: 0.0,
        items: quote.items || [],
        notes: `Hóa đơn được tạo từ báo giá ${quote.quote_number}`,
        created_by: quote.created_by
      }
      
      console.log('🔍 Creating invoice with data:', invoiceData)
      
      // Create the invoice
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single()
      
      if (invoiceError) {
        console.error('❌ Error creating invoice:', invoiceError)
        throw new Error('Không thể tạo hóa đơn')
      }
      
      console.log('🔍 Invoice created successfully:', newInvoice)
      
      // Update quote status to 'closed' (following backend logic)
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ 
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)
      
      if (updateError) {
        console.error('❌ Error updating quote status:', updateError)
        // Don't throw error here as invoice was created successfully
      }
      
      console.log('🔍 Quote converted to invoice successfully')
      fetchQuotes() // Refresh list
      
      // Show success message
      alert(`✅ Báo giá đã được chuyển thành hóa đơn thành công!\n\n📄 Số hóa đơn: ${invoiceNumber}\n💰 Tổng tiền: ${formatCurrency(quote.total_amount)}\n📅 Ngày đáo hạn: ${dueDate.toLocaleDateString('vi-VN')}\n\nBạn có thể xem hóa đơn trong tab "Hóa đơn".`)
      
    } catch (error) {
      console.error('❌ Error converting quote:', error)
      alert(`Lỗi khi chuyển báo giá: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
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
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Số báo giá
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
                Hạn hiệu lực
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredQuotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-black mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {quote.quote_number}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-black mr-1" />
                    {formatDate(quote.valid_until)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {formatDate(quote.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      className="text-black hover:text-black" 
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {quote.status === 'draft' && (
                      <>
                        <button 
                          className="text-black hover:text-blue-600" 
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => sendQuote(quote.id)}
                          className="text-black hover:text-green-600" 
                          title="Gửi báo giá"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    {(quote.status === 'accepted' || quote.status === 'sent' || quote.status === 'viewed') && quote.status !== 'closed' && quote.status !== 'converted' && (
                      <button 
                        onClick={() => convertToInvoice(quote.id)}
                        className="text-black hover:text-purple-600" 
                        title="Chuyển thành hóa đơn"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button 
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
        
        {filteredQuotes.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-black" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có báo giá</h3>
            <p className="mt-1 text-sm text-black">
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

      <CreateQuoteSidebar
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchQuotes()
        }}
      />
    </div>
  )
}