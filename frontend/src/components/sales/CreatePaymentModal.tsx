'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Plus, 
  Calendar,
  User,
  DollarSign,
  FileText,
  Save,
  CreditCard
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  tax_code?: string
}

interface Invoice {
  id: string
  invoice_number: string
  customer_name?: string
  total_amount: number
  currency: string
  status: string
}

interface CreatePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreatePaymentModal({ isOpen, onClose, onSuccess }: CreatePaymentModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    payment_number: '',
    customer_id: '',
    invoice_ids: [] as string[],
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: 'VND',
    payment_method: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'check' | 'digital_wallet' | 'other',
    payment_reference: '',
    bank_details: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      generatePaymentNumber()
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.customer_id) {
      fetchCustomerInvoices(formData.customer_id)
    }
  }, [formData.customer_id])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/api/customers')
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerInvoices = async (customerId: string) => {
    try {
      const data = await apiGet(`/api/sales/invoices?customer_id=${customerId}&status=sent,overdue`)
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const generatePaymentNumber = async () => {
    try {
      const data = await apiGet('/api/sales/payments/next-number')
      setFormData(prev => ({ ...prev, payment_number: data.payment_number }))
    } catch (error) {
      console.error('Error generating payment number:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault()
    
    if (!formData.customer_id || !formData.amount || formData.invoice_ids.length === 0) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    try {
      setSubmitting(true)

      const paymentData = {
        ...formData,
        status: asDraft ? 'pending' : 'completed'
      }

      await apiPost('/api/sales/payments', paymentData)
      onSuccess()
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('Có lỗi xảy ra khi tạo thanh toán')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInvoiceSelection = (invoiceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      invoice_ids: checked 
        ? [...prev.invoice_ids, invoiceId]
        : prev.invoice_ids.filter(id => id !== invoiceId)
    }))
  }

  const calculateTotalFromInvoices = () => {
    return invoices
      .filter(invoice => formData.invoice_ids.includes(invoice.id))
      .reduce((total, invoice) => total + invoice.total_amount, 0)
  }

  useEffect(() => {
    const calculatedAmount = calculateTotalFromInvoices()
    if (calculatedAmount > 0) {
      setFormData(prev => ({ ...prev, amount: calculatedAmount }))
    }
  }, [formData.invoice_ids, invoices])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tạo thanh toán mới</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={submitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Số thanh toán *
              </label>
              <input
                type="text"
                value={formData.payment_number}
                onChange={(e) => setFormData({...formData, payment_number: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Khách hàng *
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn khách hàng</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Ngày thanh toán *
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Phương thức thanh toán *
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({...formData, payment_method: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="cash">Tiền mặt</option>
                <option value="card">Thẻ</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="check">Séc</option>
                <option value="digital_wallet">Ví điện tử</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          {/* Invoice Selection */}
          {formData.customer_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn hóa đơn cần thanh toán *
              </label>
              <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                {invoices.length > 0 ? (
                  <div className="p-3 space-y-2">
                    {invoices.map((invoice) => (
                      <label key={invoice.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={formData.invoice_ids.includes(invoice.id)}
                          onChange={(e) => handleInvoiceSelection(invoice.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.invoice_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(invoice.total_amount)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    Không có hóa đơn nào cần thanh toán
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Số tiền *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn vị tiền tệ
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã tham chiếu
              </label>
              <input
                type="text"
                value={formData.payment_reference}
                onChange={(e) => setFormData({...formData, payment_reference: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mã giao dịch, số séc..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thông tin ngân hàng
              </label>
              <input
                type="text"
                value={formData.bank_details}
                onChange={(e) => setFormData({...formData, bank_details: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tên ngân hàng, số tài khoản..."
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ghi chú thêm về thanh toán..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={submitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? 'Đang lưu...' : 'Lưu nháp'}
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              disabled={submitting}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {submitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}