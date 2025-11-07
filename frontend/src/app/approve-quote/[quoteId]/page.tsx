'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Calendar,
  DollarSign,
  User,
  Building,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'

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
  status: string
  notes?: string
  terms?: string
  product_components?: Array<{
    unit: string
    quantity: number
    unit_price: number
    expense_object_id: string
  }>
  created_by: string
  created_at: string
  updated_at: string
}

interface QuoteItem {
  id: string
  name_product: string
  description?: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
}

interface ApproveQuotePageProps {
  params: {
    quoteId: string
  }
}

export default function ApproveQuotePage({ params }: ApproveQuotePageProps) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { quoteId } = params

  useEffect(() => {
    fetchQuoteDetails()
  }, [quoteId])

  const fetchQuoteDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get quote details
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(getApiEndpoint(`/api/sales/quotes/${quoteId}`), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch quote details')
      }

      const quoteData = await response.json()
      setQuote(quoteData)

      // Get quote items
      const itemsResponse = await fetch(getApiEndpoint(`/api/sales/quotes/${quoteId}/items`), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        setQuoteItems(itemsData.items || [])
      }

    } catch (error) {
      console.error('Error fetching quote details:', error)
      setError('Không thể tải thông tin báo giá')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setApproving(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(getApiEndpoint(`/api/sales/quotes/${quoteId}/approve`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to approve quote')
      }

      const result = await response.json()
      setSuccess(true)
      
      // Show success message
      const successMessage = document.createElement('div')
      successMessage.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #d4edda; color: #155724; padding: 15px 20px; border-radius: 5px; border: 1px solid #c3e6cb; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center;">
            <div style="margin-right: 10px; font-size: 20px;">✅</div>
            <div>
              <strong>Báo giá đã được duyệt!</strong><br>
              Thông báo đã được gửi đến nhân viên và quản lý.
            </div>
          </div>
        </div>
      `
      document.body.appendChild(successMessage)
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage)
        }
      }, 5000)

    } catch (error) {
      console.error('Error approving quote:', error)
      setError('Không thể duyệt báo giá: ' + (error as Error).message)
    } finally {
      setApproving(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin báo giá...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchQuoteDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">📄</div>
          <p className="text-gray-600">Không tìm thấy báo giá</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Duyệt Báo Giá</h1>
              <p className="text-gray-600 mt-1">Số báo giá: {quote.quote_number}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                quote.status === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {quote.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
              </div>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin báo giá</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Ngày phát hành</div>
                    <div className="font-medium">{formatDate(quote.issue_date)}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Hiệu lực đến</div>
                    <div className="font-medium">{formatDate(quote.valid_until)}</div>
                  </div>
                </div>
              </div>

              {/* Quote Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết sản phẩm/dịch vụ</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">Tên sản phẩm</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b">Số lượng</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b">Đơn vị</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b">Đơn giá</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {quoteItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.name_product}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{item.unit}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms and Notes */}
              {quote.terms && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Điều khoản và điều kiện</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">{quote.terms}</p>
                </div>
              )}

              {quote.notes && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Ghi chú</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">{quote.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            {/* Total Amount */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng kết</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thuế ({quote.tax_rate}%):</span>
                  <span className="font-medium">{formatCurrency(quote.tax_amount)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(quote.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động</h3>
              
              {quote.status === 'approved' ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">Báo giá đã được duyệt</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {approving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang duyệt...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Duyệt Báo Giá
                      </>
                    )}
                  </button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    Khi duyệt, thông báo sẽ được gửi đến nhân viên và quản lý
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
