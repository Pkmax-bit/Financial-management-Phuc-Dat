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
  Clock,
  HelpCircle,
  X,
  Package,
  CheckCircle2
} from 'lucide-react'
import CreateQuoteSidebarFullscreen from './CreateQuoteSidebarFullscreen'
import { apiGet, apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Quote {
  id: string
  quote_number: string
  customer_id: string
  customer_name?: string
  project_id?: string
  project_name?: string
  project_code?: string
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
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showConversionSuccess, setShowConversionSuccess] = useState(false)
  const [conversionData, setConversionData] = useState<{
    invoiceNumber: string
    totalAmount: number
    dueDate: string
    convertedItems: any[]
  } | null>(null)

  useEffect(() => {
    fetchQuotes()
  }, [])
  // Group quotes by project for display
  const groupedByProject = (() => {
    const groups: Record<string, { key: string; name: string; code?: string; quotes: Quote[] }> = {}
    for (const q of quotes) {
      const key = q.project_id || 'no_project'
      if (!groups[key]) {
        groups[key] = {
          key,
          name: q.project_name || 'Không có dự án',
          code: q.project_code,
          quotes: []
        }
      }
      groups[key].quotes.push(q)
    }
    return Object.values(groups)
  })()


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
      // Transform to include customer_name and project fields
      const transformed = (quotes || []).map((q: any) => ({
        ...q,
        customer_name: q.customers?.name,
        project_name: q.projects?.name,
        project_code: q.projects?.project_code
      }))
      setQuotes(transformed)
    } catch (error) {
      console.error('❌ Error fetching quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendQuote = async (quoteId: string) => {
    try {
      console.log('🔍 Sending quote email:', quoteId)
      
      // Show loading state
      const loadingMessage = document.createElement('div')
      loadingMessage.innerHTML = `
        <div style="
          position: fixed; 
          top: 20px; 
          right: 20px; 
          background: #3498db; 
          color: white; 
          padding: 15px 20px; 
          border-radius: 5px; 
          z-index: 10000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
          📧 Đang gửi email báo giá...
        </div>
      `
      document.body.appendChild(loadingMessage)
      
      // Call API to send quote email
      const response = await fetch(`http://localhost:8000/api/sales/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })
      
      // Remove loading message
      document.body.removeChild(loadingMessage)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to send quote email')
      }
      
      const result = await response.json()
      console.log('🔍 Quote email sent successfully:', result)
      
      // Show success notification with email details
      const successMessage = document.createElement('div')
      const emailStatus = result.email_sent ? 
        `✅ Email báo giá đã được gửi thành công đến ${result.customer_email || 'khách hàng'}!` :
        `⚠️ Báo giá đã được cập nhật nhưng không thể gửi email: ${result.email_error || 'Lỗi không xác định'}`
      
      successMessage.innerHTML = `
        <div style="
          position: fixed; 
          top: 20px; 
          right: 20px; 
          background: ${result.email_sent ? '#27ae60' : '#f39c12'}; 
          color: white; 
          padding: 15px 20px; 
          border-radius: 5px; 
          z-index: 10000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          animation: slideIn 0.3s ease-out;
          max-width: 400px;
        ">
          ${emailStatus}
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `
      document.body.appendChild(successMessage)
      
      // Auto remove success message after 7 seconds
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage)
        }
      }, 7000)
      
      fetchQuotes() // Refresh list
    } catch (error) {
      console.error('❌ Error sending quote email:', error)
      
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
          ❌ Lỗi gửi email: ${(error as Error).message}
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `
      document.body.appendChild(errorMessage)
      
      // Auto remove error message after 8 seconds
      setTimeout(() => {
        if (document.body.contains(errorMessage)) {
          document.body.removeChild(errorMessage)
        }
      }, 8000)
    }
  }

  const convertToInvoice = async (quoteId: string) => {
    try {
      console.log('🔍 Converting quote to invoice:', quoteId)
      
      // First, get the quote details with items
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          customers:customer_id(name, email),
          projects:project_id(name, project_code),
          quote_items(*)
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
      
      // Convert quote items to invoice items
      const convertedItems = []
      if (quote.quote_items && Array.isArray(quote.quote_items)) {
        for (const item of quote.quote_items) {
          const invoiceItem = {
            id: crypto.randomUUID(),
            invoice_id: '', // Will be set after invoice creation
            product_service_id: item.product_service_id,
            description: item.description || '',
            quantity: item.quantity || 0,
            unit_price: item.unit_price || 0,
            total_price: item.total_price || 0,
            name_product: item.name_product,
            unit: item.unit,
            discount_rate: item.discount_rate || 0.0,
            area: item.area,
            volume: item.volume,
            height: item.height,
            length: item.length,
            depth: item.depth,
            created_at: new Date().toISOString()
          }
          convertedItems.push(invoiceItem)
        }
      }

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
        items: [], // Empty JSONB field, items will be in invoice_items table
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
      
      // Create invoice items in invoice_items table
      if (convertedItems.length > 0) {
        // Update invoice_id for all converted items
        const invoiceItemsData = convertedItems.map(item => ({
          ...item,
          invoice_id: newInvoice.id
        }))
        
        const { data: invoiceItems, error: invoiceItemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItemsData)
          .select()
        
        if (invoiceItemsError) {
          console.error('❌ Error creating invoice items:', invoiceItemsError)
          // Don't throw error here as invoice was created successfully
        } else {
          console.log('🔍 Invoice items created successfully:', invoiceItems)
        }
      }
      
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
      
      // Set conversion data for success modal
      setConversionData({
        invoiceNumber,
        totalAmount: quote.total_amount,
        dueDate: dueDate.toLocaleDateString('vi-VN'),
        convertedItems
      })
      setShowConversionSuccess(true)
      
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

  const deleteQuote = async (quoteId: string) => {
    try {
      console.log('🔍 Deleting quote:', quoteId)
      
      // Show confirmation dialog
      const confirmed = window.confirm('Bạn có chắc chắn muốn xóa báo giá này? Hành động này không thể hoàn tác.')
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
          🗑️ Đang xóa báo giá...
        </div>
      `
      document.body.appendChild(loadingMessage)
      
      // Delete quote items first
      const { error: itemsError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', quoteId)
      
      if (itemsError) {
        console.error('❌ Error deleting quote items:', itemsError)
        throw new Error('Failed to delete quote items')
      }
      
      // Delete quote
      const { error: quoteError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)
      
      // Remove loading message
      document.body.removeChild(loadingMessage)
      
      if (quoteError) {
        console.error('❌ Error deleting quote:', quoteError)
        throw new Error(quoteError.message || 'Failed to delete quote')
      }
      
      console.log('🔍 Quote deleted successfully')
      
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
          ✅ Báo giá đã được xóa thành công!
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
      
      // Refresh quotes list
      await fetchQuotes()
      
    } catch (error) {
      console.error('❌ Error deleting quote:', error)
      
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
          ❌ Lỗi khi xóa báo giá: ${error instanceof Error ? error.message : 'Lỗi không xác định'}
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

  return (
    <div className="space-y-4">
      {/* Header with Help Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Báo giá</h2>
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
                      {quote.project_name ? (
                        <>{quote.project_code ? `${quote.project_code} - ` : ''}{quote.project_name}</>
                      ) : 'Không có dự án'}
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
                      onClick={() => window.open(`/sales/quotes/${quote.id}`, '_blank')}
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
                      onClick={() => deleteQuote(quote.id)}
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

      <CreateQuoteSidebarFullscreen
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchQuotes()
        }}
      />

      {/* Help Sidebar */}
      {showHelpModal && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-25" onClick={() => setShowHelpModal(false)}></div>
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  📚 Hướng dẫn sử dụng Báo giá
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
                    Module Báo giá giúp bạn tạo và quản lý các báo giá cho khách hàng, theo dõi trạng thái và chuyển đổi thành hóa đơn khi cần thiết.
                  </p>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">✨ Tính năng chính</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Plus className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tạo báo giá</p>
                          <p className="text-xs text-gray-500">Tạo báo giá mới với thông tin khách hàng và dự án</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Send className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Gửi báo giá</p>
                          <p className="text-xs text-gray-500">Gửi báo giá qua email cho khách hàng</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <DollarSign className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Chuyển thành hóa đơn</p>
                          <p className="text-xs text-gray-500">Chuyển báo giá đã chấp nhận thành hóa đơn</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Xem chi tiết</p>
                          <p className="text-xs text-gray-500">Xem thông tin chi tiết báo giá</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Edit className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Chỉnh sửa</p>
                          <p className="text-xs text-gray-500">Chỉnh sửa báo giá (chỉ khi ở trạng thái nháp)</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Trash2 className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Xóa báo giá</p>
                          <p className="text-xs text-gray-500">Xóa báo giá (chỉ khi ở trạng thái nháp)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Guide */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">📊 Trạng thái báo giá</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Nháp</span>
                      <span className="text-sm text-gray-600">Báo giá đang được soạn thảo, có thể chỉnh sửa</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Đã gửi</span>
                      <span className="text-sm text-gray-600">Đã gửi cho khách hàng, chờ phản hồi</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Đã chấp nhận</span>
                      <span className="text-sm text-gray-600">Khách hàng đã chấp nhận báo giá</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Từ chối</span>
                      <span className="text-sm text-gray-600">Khách hàng đã từ chối báo giá</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Hết hạn</span>
                      <span className="text-sm text-gray-600">Báo giá đã hết hạn hiệu lực</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Đã đóng</span>
                      <span className="text-sm text-gray-600">Báo giá đã được chuyển thành hóa đơn</span>
                    </div>
                  </div>
                </div>

                {/* Workflow */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">🔄 Quy trình làm việc</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                      <li><strong>Tạo báo giá:</strong> Tạo báo giá mới với thông tin khách hàng và sản phẩm</li>
                      <li><strong>Kiểm tra thông tin:</strong> Xem lại thông tin khách hàng, sản phẩm, giá cả</li>
                      <li><strong>Gửi báo giá:</strong> Gửi báo giá cho khách hàng qua email</li>
                      <li><strong>Theo dõi phản hồi:</strong> Chờ khách hàng phản hồi (chấp nhận/từ chối)</li>
                      <li><strong>Chuyển thành hóa đơn:</strong> Khi khách hàng chấp nhận, chuyển thành hóa đơn</li>
                    </ol>
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">💡 Mẹo sử dụng</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>Sử dụng bộ lọc để tìm báo giá theo trạng thái</li>
                      <li>Kiểm tra báo giá hết hạn thường xuyên</li>
                      <li>Gửi nhắc nhở cho khách hàng về báo giá</li>
                      <li>Chuyển báo giá đã chấp nhận thành hóa đơn ngay</li>
                      <li>Lưu trữ báo giá đã đóng để tham khảo</li>
                    </ul>
                  </div>
                </div>

                {/* Conversion Guide */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">🔄 Chuyển đổi báo giá</h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Khi nào có thể chuyển:</strong> Báo giá có trạng thái "Đã chấp nhận", "Đã gửi", hoặc "Đã xem"
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Khi nào không thể chuyển:</strong> Báo giá đã bị từ chối, hết hạn, hoặc đã được chuyển rồi
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Kết quả:</strong> Tạo hóa đơn mới và cập nhật trạng thái báo giá thành "Đã đóng"
                    </p>
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

      {/* Conversion Success Modal */}
      {showConversionSuccess && conversionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chuyển đổi thành công!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Báo giá đã được chuyển thành hóa đơn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConversionSuccess(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Invoice Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Thông tin hóa đơn</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Số hóa đơn</p>
                    <p className="font-medium text-gray-900">{conversionData.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng tiền</p>
                    <p className="font-medium text-gray-900">{formatCurrency(conversionData.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày đáo hạn</p>
                    <p className="font-medium text-gray-900">{conversionData.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Số items</p>
                    <p className="font-medium text-gray-900">{conversionData.convertedItems.length} sản phẩm/dịch vụ</p>
                  </div>
                </div>
              </div>

              {/* Converted Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Các sản phẩm/dịch vụ đã chuyển đổi
                </h4>
                <div className="space-y-3">
                  {conversionData.convertedItems.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{item.description}</h5>
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(item.total_price)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Số lượng:</span> {item.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Đơn giá:</span> {formatCurrency(item.unit_price)}
                        </div>
                        {item.name_product && (
                          <div className="col-span-2">
                            <span className="font-medium">Tên sản phẩm:</span> {item.name_product}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">Tổng cộng</p>
                    <p className="text-sm text-green-700">
                      {conversionData.convertedItems.length} items đã được chuyển đổi thành công
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(conversionData.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowConversionSuccess(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowConversionSuccess(false)
                  // Navigate to invoices tab (you can implement this based on your routing)
                  window.location.hash = '#invoices'
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Xem hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}