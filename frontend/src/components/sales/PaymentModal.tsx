'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, Calculator, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getApiEndpoint, getApiUrl } from '@/lib/apiUrl'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invoice: {
    id: string
    invoice_number: string
    total_amount: number
    paid_amount: number
    customer_name?: string
  }
}

export default function PaymentModal({ isOpen, onClose, onSuccess, invoice }: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'check' | 'digital_wallet' | 'other'>('cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const remainingAmount = invoice.total_amount - invoice.paid_amount

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount(remainingAmount)
      setPaymentReference('')
      setNotes('')
    }
  }, [isOpen, remainingAmount])

  const handlePaymentType = (type: 'full' | 'half' | 'custom') => {
    switch (type) {
      case 'full':
        setPaymentAmount(remainingAmount)
        break
      case 'half':
        setPaymentAmount(remainingAmount / 2)
        break
      case 'custom':
        setPaymentAmount(0)
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentAmount <= 0) {
      alert('Số tiền thanh toán phải lớn hơn 0')
      return
    }

    if (paymentAmount > remainingAmount) {
      alert('Số tiền thanh toán không được vượt quá số tiền còn lại')
      return
    }

    try {
      setSubmitting(true)

      // Include Supabase access token for backend authorization
      const { data: { session } } = await supabase.auth.getSession()

      // Backend expects query params (FastAPI query), not JSON body
      const params = new URLSearchParams()
      params.set('payment_amount', String(paymentAmount))
      params.set('payment_method', paymentMethod)
      if (paymentReference) params.set('payment_reference', paymentReference)
      if (notes) params.set('notes', notes)
      // Include time (hour, minute, second) in payment date
      params.set('payment_date', new Date().toISOString())

      const response = await fetch(getApiEndpoint(`/api/sales/invoices/${invoice.id}/payment?${params.toString()}`), {
        method: 'PUT',
        headers: {
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        }
      })

      if (!response.ok) {
        // Parse error safely to avoid [object Object]
        let errorMessage = `HTTP ${response.status}`
        try {
          const raw = await response.text()
          if (raw) {
            try {
              const json = JSON.parse(raw)
              const inner = json.detail || json.message || json.error || json
              errorMessage = typeof inner === 'string' ? inner : JSON.stringify(inner)
            } catch {
              // Not JSON, use raw text
              errorMessage = raw
            }
          }
        } catch {
          // ignore parse failures
        }
        console.error('❌ Payment API error:', errorMessage)
        throw new Error(errorMessage || 'Có lỗi xảy ra khi ghi nhận thanh toán')
      }

      const result = await response.json()
      
      if (result.journal_entry_created) {
        alert('✅ Thanh toán đã được ghi nhận thành công!')
      } else {
        alert('✅ Thanh toán đã được ghi nhận thành công! (Lưu ý: Không tạo được bút toán kế toán)')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error recording payment:', error)
      alert(`❌ Lỗi: ${error instanceof Error ? error.message : 'Có lỗi xảy ra khi ghi nhận thanh toán'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Invisible backdrop for click detection - no visual blocking */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}

      {/* Right-side sidebar panel - does not cover the invoice list */}
      <div className={`fixed top-0 right-0 h-full w-[560px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Ghi nhận thanh toán
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Invoice Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="text-sm text-black">
            <p><strong>Đơn hàng:</strong> {invoice.invoice_number}</p>
            {invoice.customer_name && (
              <p><strong>Khách hàng:</strong> {invoice.customer_name}</p>
            )}
            <p><strong>Tổng tiền:</strong> {formatCurrency(invoice.total_amount)}</p>
            <p><strong>Đã thanh toán:</strong> {formatCurrency(invoice.paid_amount)}</p>
            <p className="text-red-600 font-semibold">
              <strong>Còn lại:</strong> {formatCurrency(remainingAmount)}
            </p>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Payment Type Buttons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-3">
              Chọn loại thanh toán
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePaymentType('full')}
                className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Calculator className="h-4 w-4 mr-1" />
                Toàn bộ
              </button>
              <button
                type="button"
                onClick={() => handlePaymentType('half')}
                className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Calculator className="h-4 w-4 mr-1" />
                Một nửa
              </button>
              <button
                type="button"
                onClick={() => handlePaymentType('custom')}
                className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Calculator className="h-4 w-4 mr-1" />
                Tùy chỉnh
              </button>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Số tiền thanh toán
            </label>
            <div className="relative">
              <input
                type="number"
                value={Number.isNaN(paymentAmount) ? '' : paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                placeholder="Nhập số tiền"
                min="0"
                step="0.01"
              />
              <div className="absolute right-3 top-2 text-sm text-black">
                VND
              </div>
            </div>
            <div className="mt-1 text-sm text-black">
              Tối đa: {formatCurrency(remainingAmount)}
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Phương thức thanh toán
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="cash">Tiền mặt</option>
              <option value="card">Thẻ</option>
              <option value="bank_transfer">Chuyển khoản</option>
              <option value="check">Séc</option>
              <option value="digital_wallet">Ví điện tử</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Payment Reference */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-black mb-2">
              Mã tham chiếu (tùy chọn)
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
              placeholder="VD: REF123456"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
              rows={3}
              placeholder="Ghi chú về thanh toán..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 p-6 pt-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || paymentAmount <= 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ghi nhận thanh toán
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
