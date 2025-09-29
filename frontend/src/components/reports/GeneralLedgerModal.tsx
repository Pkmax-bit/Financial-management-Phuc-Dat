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
  BookOpen,
  Calculator,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  PieChart,
  MapPin,
  Phone,
  Mail,
  Clock,
  Hash,
  Type,
  FileCheck
} from 'lucide-react'
import { generalLedgerApi } from '@/lib/api'
import DrillDownModal from './DrillDownModal'

interface GeneralLedgerModalProps {
  isOpen: boolean
  onClose: () => void
  startDate: string
  endDate: string
}

interface JournalEntry {
  id: string
  transaction_id: string
  transaction_type: string
  date: string
  account_id: string
  account_code: string
  account_name: string
  account_type: string
  description: string
  reference_number?: string
  debit_amount: number
  credit_amount: number
  currency: string
  created_at: string
  created_by?: string
}

interface GeneralLedgerEntry {
  journal_entry: JournalEntry
  running_balance: number
  balance_type: string
}

interface GeneralLedgerReport {
  report_period: string
  start_date: string
  end_date: string
  currency: string
  generated_at: string
  total_entries: number
  total_debits: number
  total_credits: number
  balance_check: boolean
  ledger_entries: GeneralLedgerEntry[]
  account_summary: Array<{
    account_id: string
    account_code: string
    account_name: string
    account_type: string
    total_debits: number
    total_credits: number
    transaction_count: number
    ending_balance: number
  }>
}

export default function GeneralLedgerModal({ isOpen, onClose, startDate, endDate }: GeneralLedgerModalProps) {
  const [report, setReport] = useState<GeneralLedgerReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  const [showDrillDown, setShowDrillDown] = useState(false)
  const [drillDownData, setDrillDownData] = useState<{
    accountId: string
    accountName: string
  } | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>('')
  const [includeRunningBalance, setIncludeRunningBalance] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchGeneralLedgerReport()
    }
  }, [isOpen, startDate, endDate, selectedAccount, selectedTransactionType, includeRunningBalance])

  const fetchGeneralLedgerReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await generalLedgerApi.getGeneralLedger(
        startDate, 
        endDate, 
        selectedAccount || undefined, 
        selectedTransactionType || undefined, 
        includeRunningBalance
      )
      
      if (response.success && response.data) {
        setReport(response.data)
      } else {
        setError('Không thể tải báo cáo Sổ cái')
      }
    } catch (err) {
      console.error('Error fetching general ledger report:', err)
      setError('Lỗi khi tải báo cáo Sổ cái')
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

  const handleAccountClick = (entry: GeneralLedgerEntry) => {
    setDrillDownData({
      accountId: entry.journal_entry.account_id,
      accountName: entry.journal_entry.account_name
    })
    setShowDrillDown(true)
  }

  const getAccountTypeColor = (accountType: string) => {
    switch (accountType.toLowerCase()) {
      case 'asset':
        return 'text-blue-600 bg-blue-100'
      case 'liability':
        return 'text-red-600 bg-red-100'
      case 'equity':
        return 'text-green-600 bg-green-100'
      case 'revenue':
        return 'text-purple-600 bg-purple-100'
      case 'expense':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredEntries = report?.ledger_entries.filter(entry =>
    entry.journal_entry.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.journal_entry.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.journal_entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.journal_entry.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.journal_entry.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const renderKeyMetrics = () => {
    if (!report) return null

    const metrics = [
      {
        title: "Tổng bút toán",
        value: report.total_entries,
        icon: FileText,
        color: "text-blue-600 bg-blue-100",
        description: "Số lượng bút toán trong kỳ"
      },
      {
        title: "Tổng Nợ",
        value: report.total_debits,
        icon: ArrowDownRight,
        color: "text-red-600 bg-red-100",
        description: "Tổng số tiền ghi Nợ"
      },
      {
        title: "Tổng Có",
        value: report.total_credits,
        icon: ArrowUpRight,
        color: "text-green-600 bg-green-100",
        description: "Tổng số tiền ghi Có"
      },
      {
        title: "Cân đối",
        value: report.balance_check ? "Cân đối" : "Không cân đối",
        icon: Scale,
        color: report.balance_check ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100",
        description: "Kiểm tra cân đối Nợ = Có"
      }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.title.includes('Nợ') || metric.title.includes('Có') ? formatCurrency(metric.value) : metric.value}
                  </p>
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${metric.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderAccountSummary = () => {
    if (!report || !report.account_summary.length) return null

    const topAccounts = report.account_summary.slice(0, 5)

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top 5 Tài khoản hoạt động</h3>
          <div className="text-sm text-gray-600">
            {report.account_summary.length} tài khoản có giao dịch
          </div>
        </div>
        
        <div className="space-y-3">
          {topAccounts.map((account, index) => (
            <div key={account.account_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getAccountTypeColor(account.account_type)}`}>
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{account.account_name}</div>
                  <div className="text-sm text-gray-500">
                    {account.account_code} • {account.transaction_count} giao dịch
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(account.ending_balance)}</div>
                <div className="text-sm text-gray-500">
                  Nợ: {formatCurrency(account.total_debits)} • Có: {formatCurrency(account.total_credits)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderGeneralLedgerTable = () => {
    if (!report) return null

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Sổ cái chi tiết</h3>
            <div className="text-sm text-gray-500">
              Hiển thị {paginatedEntries.length} / {filteredEntries.length} bút toán
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số chứng từ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại giao dịch
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tài khoản
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi Nợ
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi Có
                </th>
                {includeRunningBalance && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số dư
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedEntries.map((entry, index) => (
                <tr 
                  key={`${entry.journal_entry.id}-${index}`} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleAccountClick(entry)}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.journal_entry.date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Hash className="h-3 w-3 mr-1 text-gray-400" />
                      {entry.journal_entry.transaction_id}
                    </div>
                    {entry.journal_entry.reference_number && (
                      <div className="text-xs text-gray-500">
                        Ref: {entry.journal_entry.reference_number}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Type className="h-3 w-3 mr-1" />
                      {entry.journal_entry.transaction_type}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-1 rounded ${getAccountTypeColor(entry.journal_entry.account_type)}`}>
                        <BookOpen className="h-3 w-3" />
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {entry.journal_entry.account_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.journal_entry.account_code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {entry.journal_entry.description}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {entry.journal_entry.debit_amount > 0 ? formatCurrency(entry.journal_entry.debit_amount) : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {entry.journal_entry.credit_amount > 0 ? formatCurrency(entry.journal_entry.credit_amount) : '-'}
                  </td>
                  {includeRunningBalance && (
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      <div className={`font-medium ${entry.balance_type === 'Debit' ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(entry.running_balance)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.balance_type}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedEntries.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy bút toán nào</p>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Báo cáo Sổ cái</h2>
            <p className="text-gray-600">
              Kỳ báo cáo: {formatDate(startDate)} - {formatDate(endDate)}
            </p>
            <p className="text-sm text-gray-500">
              {report ? `Cập nhật lúc: ${formatDate(report.generated_at)}` : 'Đang tải...'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {/* TODO: Implement export */}}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải báo cáo Sổ cái...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchGeneralLedgerReport}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {report && !loading && (
            <div className="space-y-8">
              {/* Key Metrics */}
              {renderKeyMetrics()}

              {/* Account Summary */}
              {renderAccountSummary()}

              {/* Filters */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tìm kiếm
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm tài khoản, mô tả..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tài khoản
                    </label>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả tài khoản</option>
                      {report.account_summary.map(account => (
                        <option key={account.account_id} value={account.account_id}>
                          {account.account_code} - {account.account_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại giao dịch
                    </label>
                    <select
                      value={selectedTransactionType}
                      onChange={(e) => setSelectedTransactionType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả loại</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Payment">Payment</option>
                      <option value="Expense">Expense</option>
                      <option value="Bill">Bill</option>
                      <option value="Journal">Journal</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeRunningBalance}
                        onChange={(e) => setIncludeRunningBalance(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Hiển thị số dư</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* General Ledger Table */}
              {renderGeneralLedgerTable()}

              {/* Pagination */}
              {filteredEntries.length > pageSize && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, filteredEntries.length)} 
                    trong tổng số {filteredEntries.length} bút toán
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
                      disabled={currentPage * pageSize >= filteredEntries.length}
                      className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Report Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Thông tin báo cáo</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Tổng bút toán:</span> {report.total_entries}
                  </div>
                  <div>
                    <span className="font-medium">Tổng Nợ:</span> {formatCurrency(report.total_debits)}
                  </div>
                  <div>
                    <span className="font-medium">Tổng Có:</span> {formatCurrency(report.total_credits)}
                  </div>
                  <div>
                    <span className="font-medium">Cân đối:</span> 
                    <span className={`ml-1 ${report.balance_check ? 'text-green-600' : 'text-red-600'}`}>
                      {report.balance_check ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drill-Down Modal */}
        {drillDownData && (
          <DrillDownModal
            isOpen={showDrillDown}
            onClose={() => setShowDrillDown(false)}
            reportType="general-ledger"
            accountId={drillDownData.accountId}
            accountName={drillDownData.accountName}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>
    </div>
  )
}
