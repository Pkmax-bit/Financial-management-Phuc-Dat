'use client'

import { useState, useEffect } from 'react'
import { X, Mail, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface EmailLog {
  id: string
  to_email: string
  subject: string
  status: string
  sent_at: string
  error_message?: string
  created_at: string
  custom_payment_terms?: {
    term1?: string
    term2?: string
    term3?: string
  }
  additional_notes?: string
  edited_by?: string
  edited_at?: string
}

interface QuoteEmailLogsModalProps {
  isOpen: boolean
  onClose: () => void
  quoteId: string
}

export default function QuoteEmailLogsModal({
  isOpen,
  onClose,
  quoteId
}: QuoteEmailLogsModalProps) {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)

  useEffect(() => {
    if (isOpen && quoteId) {
      fetchEmailLogs()
    }
  }, [isOpen, quoteId])

  const fetchEmailLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const response = await fetch(`http://localhost:8000/api/sales/quotes/${quoteId}/email-logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to load email logs')
      }

      const result = await response.json()
      setLogs(result.logs || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load email logs')
      console.error('Error fetching email logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
        return 'Đã gửi'
      case 'failed':
        return 'Thất bại'
      case 'pending':
        return 'Đang chờ'
      default:
        return status || 'N/A'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Lịch sử email đã gửi
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Đang tải lịch sử email...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-600 text-center">
                <p className="font-semibold">Lỗi khi tải lịch sử email</p>
                <p className="text-sm mt-2">{error}</p>
                <button
                  onClick={fetchEmailLogs}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Chưa có email nào được gửi</p>
                  <p className="text-sm mt-2">Lịch sử email sẽ hiển thị ở đây sau khi gửi email báo giá</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email người nhận
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tiêu đề
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày gửi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lỗi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log, index) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {log.to_email}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={log.subject}>
                              {log.subject}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.status)}
                              <span className="text-sm text-gray-900">
                                {getStatusText(log.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(log.sent_at || log.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {log.error_message ? (
                              <span className="text-red-600" title={log.error_message}>
                                {log.error_message.length > 50 
                                  ? `${log.error_message.substring(0, 50)}...` 
                                  : log.error_message}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Chi tiết chỉnh sửa email</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email người nhận:</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.to_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tiêu đề:</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Ngày gửi:</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedLog.sent_at || selectedLog.created_at)}
                  </p>
                </div>
                {(selectedLog.custom_payment_terms || selectedLog.additional_notes) && (
                  <>
                    {selectedLog.custom_payment_terms && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Điều khoản thanh toán tùy chỉnh:
                        </label>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                          {selectedLog.custom_payment_terms.term1 && (
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">CỌC ĐỢT 1:</span> {selectedLog.custom_payment_terms.term1}
                            </div>
                          )}
                          {selectedLog.custom_payment_terms.term2 && (
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">CỌC ĐỢT 2:</span> {selectedLog.custom_payment_terms.term2}
                            </div>
                          )}
                          {selectedLog.custom_payment_terms.term3 && (
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">CÒN LẠI:</span> {selectedLog.custom_payment_terms.term3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedLog.additional_notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Ghi chú bổ sung:
                        </label>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {selectedLog.additional_notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {!selectedLog.custom_payment_terms && !selectedLog.additional_notes && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Không có thông tin chỉnh sửa cho email này</p>
                    <p className="text-sm mt-2">Email được gửi với nội dung mặc định</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

