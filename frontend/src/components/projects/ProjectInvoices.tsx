'use client'

import { useState, useEffect } from 'react'
import { Receipt, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface InvoiceItem {
  id: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total: number
}

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  project_id: string
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue'
  paid_amount: number
  items: InvoiceItem[]
  notes?: string
  created_at: string
  updated_at: string
}

interface ProjectInvoicesProps {
  projectId: string
  projectName: string
}

const statusConfig = {
  draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-800', icon: Clock },
  sent: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-800', icon: Receipt },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800', icon: Clock }
}

const paymentStatusConfig = {
  pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
  partial: { label: 'Thanh toán một phần', color: 'bg-orange-100 text-orange-800' },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
  overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-800' }
}

export default function ProjectInvoices({ projectId, projectName }: ProjectInvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [projectId])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(`/api/projects/${projectId}/detailed-report?include_transactions=true`, {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.transactions?.invoices || [])
      } else if (response.status === 403) {
        setError('Bạn không có quyền xem dữ liệu đơn hàng')
      } else {
        setError('Không thể tải dữ liệu đơn hàng')
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setError('Lỗi khi tải dữ liệu đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Chưa có đơn hàng nào cho dự án này</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Tổng đơn hàng</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
          </p>
          <p className="text-sm text-gray-600">{invoices.length} đơn hàng</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Đã thanh toán</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(invoices.reduce((sum, inv) => sum + inv.paid_amount, 0))}
          </p>
          <p className="text-sm text-gray-600">
            {invoices.filter(inv => inv.payment_status === 'paid').length} đơn hàng
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Chờ thanh toán</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0))}
          </p>
          <p className="text-sm text-gray-600">
            {invoices.filter(inv => inv.payment_status !== 'paid').length} đơn hàng
          </p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách đơn hàng</h3>
        </div>
        <div className="divide-y">
          {invoices.map((invoice) => {
            const statusInfo = statusConfig[invoice.status]
            const paymentStatusInfo = paymentStatusConfig[invoice.payment_status]
            const StatusIcon = statusInfo.icon

            return (
              <div key={invoice.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Đơn hàng #{invoice.invoice_number}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusInfo.color}`}>
                        {paymentStatusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Ngày tạo: {formatDate(invoice.issue_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Hạn thanh toán: {formatDate(invoice.due_date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </p>
                    {invoice.paid_amount > 0 && (
                      <p className="text-sm text-green-600">
                        Đã thanh toán: {formatCurrency(invoice.paid_amount)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Invoice Items */}
                {invoice.items && invoice.items.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Chi tiết sản phẩm:</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {invoice.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-gray-600">{item.description}</p>
                              )}
                              <p className="text-sm text-gray-500">
                                Số lượng: {item.quantity} × {formatCurrency(item.unit_price)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(item.total)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tạm tính:</span>
                          <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.tax_rate > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Thuế ({invoice.tax_rate}%):</span>
                            <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center font-semibold text-lg">
                          <span>Tổng cộng:</span>
                          <span>{formatCurrency(invoice.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {invoice.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Ghi chú:</span> {invoice.notes}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
