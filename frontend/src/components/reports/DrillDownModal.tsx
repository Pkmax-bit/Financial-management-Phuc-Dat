'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle,
  Building2,
  CreditCard,
  PiggyBank,
  Scale,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink
} from 'lucide-react'
import { drillDownApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface DrillDownModalProps {
  isOpen: boolean
  onClose: () => void
  reportType: string
  accountId: string
  accountName: string
  startDate?: string
  endDate?: string
  asOfDate?: string
}

interface DrillDownTransaction {
  transaction_id: string
  transaction_type: string
  transaction_number: string
  transaction_date: string
  description: string
  reference?: string
  amount: number
  debit_amount: number
  credit_amount: number
  account_code: string
  account_name: string
  customer_name?: string
  vendor_name?: string
  employee_name?: string
  project_name?: string
  status: string
  created_at: string
}

interface DrillDownSummary {
  total_transactions: number
  total_amount: number
  total_debit: number
  total_credit: number
  date_range: string
  account_info: {
    account_code: string
    account_name: string
  }
}

interface DrillDownReport {
  report_type: string
  account_id: string
  account_code: string
  account_name: string
  start_date?: string
  end_date?: string
  as_of_date?: string
  currency: string
  generated_at: string
  summary: DrillDownSummary
  transactions: DrillDownTransaction[]
  report_title: string
  report_description: string
}

export default function DrillDownModal({ 
  isOpen, 
  onClose, 
  reportType, 
  accountId, 
  accountName,
  startDate,
  endDate,
  asOfDate
}: DrillDownModalProps) {
  const [report, setReport] = useState<DrillDownReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  useEffect(() => {
    if (isOpen) {
      fetchDrillDownData()
    }
  }, [isOpen, reportType, accountId, startDate, endDate, asOfDate, currentPage])

  const fetchDrillDownData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        reportType,
        accountId,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      }
      
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (asOfDate) params.asOfDate = asOfDate
      
      const response = await drillDownApi.getReportDetails(params)
      
      if (response.success && response.data) {
        setReport(response.data)
      } else {
        setError('Không thể tải chi tiết giao dịch')
      }
    } catch (err) {
      console.error('Error fetching drill-down data:', err)
      setError('Lỗi khi tải chi tiết giao dịch')
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
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getTransactionTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'invoice': 'Hóa đơn',
      'payment': 'Thanh toán',
      'sales_receipt': 'Phiếu thu bán hàng',
      'credit_memo': 'Credit Memo',
      'expense': 'Chi phí',
      'bill': 'Hóa đơn nhà cung cấp',
      'bill_payment': 'Thanh toán hóa đơn',
      'journal_entry': 'Bút toán kế toán',
      'purchase_order': 'Đơn đặt hàng',
      'expense_claim': 'Đề nghị hoàn ứng'
    }
    return typeLabels[type] || type
  }

  const getTransactionTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      'invoice': 'text-blue-600 bg-blue-100',
      'payment': 'text-green-600 bg-green-100',
      'sales_receipt': 'text-green-600 bg-green-100',
      'credit_memo': 'text-orange-600 bg-orange-100',
      'expense': 'text-red-600 bg-red-100',
      'bill': 'text-red-600 bg-red-100',
      'bill_payment': 'text-green-600 bg-green-100',
      'journal_entry': 'text-gray-600 bg-gray-100',
      'purchase_order': 'text-purple-600 bg-purple-100',
      'expense_claim': 'text-yellow-600 bg-yellow-100'
    }
    return typeColors[type] || 'text-gray-600 bg-gray-100'
  }

  const filteredTransactions = report?.transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Chi tiết Giao dịch</h2>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {/* TODO: Implement export */}}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin báo cáo</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tài khoản</label>
                  <p className="text-sm text-gray-600">{report?.report_title || `${accountName} (${accountId})`}</p>
                </div>
                {report?.summary.date_range && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kỳ báo cáo</label>
                    <p className="text-sm text-gray-600">{report.summary.date_range}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Mô tả</label>
                  <p className="text-sm text-gray-600">Báo cáo chi tiết về các giao dịch và bút toán kế toán</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải chi tiết giao dịch...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchDrillDownData}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {report && !loading && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Tổng giao dịch</p>
                      <p className="text-2xl font-bold text-blue-600">{report.summary.total_transactions}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Tổng số tiền</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(report.summary.total_amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-900">Tổng Nợ</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(report.summary.total_debit)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Tổng Có</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(report.summary.total_credit)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm giao dịch..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Hiển thị {filteredTransactions.length} / {report.transactions.length} giao dịch
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số chứng từ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loại
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mô tả
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tham chiếu
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nợ
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Có
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số tiền
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.transaction_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.transaction_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.transaction_type)}`}>
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.reference || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                            {transaction.debit_amount > 0 ? formatCurrency(transaction.debit_amount) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                            {transaction.credit_amount > 0 ? formatCurrency(transaction.credit_amount) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'posted' 
                                ? 'text-green-800 bg-green-100' 
                                : 'text-yellow-800 bg-yellow-100'
                            }`}>
                              {transaction.status === 'posted' ? 'Đã ghi sổ' : 'Nháp'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Không tìm thấy giao dịch nào</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {report.transactions.length > pageSize && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, report.transactions.length)} 
                    trong tổng số {report.transactions.length} giao dịch
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Trang {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={currentPage * pageSize >= report.transactions.length}
                      className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
