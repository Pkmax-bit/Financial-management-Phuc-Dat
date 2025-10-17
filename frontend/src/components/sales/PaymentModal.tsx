'use client'

import { useState, useEffect } from 'react'
import { X, DollarSign, Calculator, CreditCard } from 'lucide-react'

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

      const response = await fetch(`http://localhost:8000/api/sales/invoices/${invoice.id}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_amount: paymentAmount,
          payment_method: paymentMethod,
          payment_reference: paymentReference || undefined,
          payment_date: new Date().toISOString().split('T')[0]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Có lỗi xảy ra khi ghi nhận thanh toán')
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
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
          <div className="text-sm text-gray-600">
            <p><strong>Hóa đơn:</strong> {invoice.invoice_number}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chọn loại thanh toán
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePaymentType('full')}
                className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Calculator className="h-4 w-4 mr-1" />
                Toàn bộ
              </button>
              <button
                type="button"
                onClick={() => handlePaymentType('half')}
                className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Calculator className="h-4 w-4 mr-1" />
                Một nửa
              </button>
              <button
                type="button"
                onClick={() => handlePaymentType('custom')}
                className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Calculator className="h-4 w-4 mr-1" />
                Tùy chỉnh
              </button>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền thanh toán
            </label>
            <div className="relative">
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập số tiền"
                min="0"
                max={remainingAmount}
                step="1000"
              />
              <div className="absolute right-3 top-2 text-sm text-gray-500">
                VND
              </div>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Tối đa: {formatCurrency(remainingAmount)}
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương thức thanh toán
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã tham chiếu (tùy chọn)
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: REF123456"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Ghi chú về thanh toán..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
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
    </div>
  )
}
