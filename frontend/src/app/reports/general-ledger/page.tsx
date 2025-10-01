'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  BookOpen, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface LedgerEntry {
  id: string
  date: string
  description: string
  account: string
  debit: number
  credit: number
  balance: number
  reference: string
  type: string
}

export default function GeneralLedgerPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<LedgerEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch data from database - only real data, no mock/hardcode
      const [invoicesResult, billsResult, expensesResult, projectsResult, timeEntriesResult] = await Promise.all([
        // Get invoices for revenue entries
        supabase
          .from('invoices')
          .select(`
            id,
            total_amount,
            paid_amount,
            payment_status,
            created_at,
            invoice_number,
            customers!inner(name)
          `)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59'),
        
        // Get bills for expense entries
        supabase
          .from('bills')
          .select(`
            id,
            amount,
            paid_amount,
            status,
            created_at,
            bill_number,
            vendors!inner(name)
          `)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59'),
        
        // Get expenses for expense entries
        supabase
          .from('expenses')
          .select(`
            id,
            amount,
            status,
            expense_date,
            description,
            category,
            employees!inner(first_name, last_name)
          `)
          .eq('status', 'approved')
          .gte('expense_date', startDate)
          .lte('expense_date', endDate),
        
        // Get projects for project entries
        supabase
          .from('projects')
          .select(`
            id,
            budget,
            actual_cost,
            status,
            created_at,
            project_code,
            name,
            customers!inner(name)
          `)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59'),
        
        // Get time entries for labor costs
        supabase
          .from('time_entries')
          .select(`
            id,
            hours,
            hourly_rate,
            billable,
            date,
            description,
            employees!inner(first_name, last_name),
            projects!inner(name)
          `)
          .eq('billable', true)
          .gte('date', startDate)
          .lte('date', endDate)
      ])

      // Process ledger entries from real database
      const ledgerEntries: LedgerEntry[] = []
      let runningBalance = 0

      // Process invoices (Revenue entries)
      if (invoicesResult.data) {
        invoicesResult.data.forEach(invoice => {
          // Revenue entry
          ledgerEntries.push({
            id: `invoice_${invoice.id}`,
            date: invoice.created_at,
            description: `Doanh thu từ hóa đơn ${invoice.invoice_number} - ${invoice.customers?.name}`,
            account: 'Doanh thu bán hàng',
            debit: 0,
            credit: invoice.total_amount || 0,
            balance: runningBalance += (invoice.total_amount || 0),
            reference: invoice.invoice_number || '',
            type: 'revenue'
          })

          // Accounts receivable entry
          if ((invoice.total_amount || 0) > (invoice.paid_amount || 0)) {
            ledgerEntries.push({
              id: `receivable_${invoice.id}`,
              date: invoice.created_at,
              description: `Phải thu khách hàng - ${invoice.customers?.name}`,
              account: 'Phải thu khách hàng',
              debit: (invoice.total_amount || 0) - (invoice.paid_amount || 0),
              credit: 0,
              balance: runningBalance -= ((invoice.total_amount || 0) - (invoice.paid_amount || 0)),
              reference: invoice.invoice_number || '',
              type: 'receivable'
            })
          }
        })
      }

      // Process bills (Expense entries)
      if (billsResult.data) {
        billsResult.data.forEach(bill => {
          // Expense entry
          ledgerEntries.push({
            id: `bill_${bill.id}`,
            date: bill.created_at,
            description: `Chi phí từ hóa đơn ${bill.bill_number} - ${bill.vendors?.name}`,
            account: 'Chi phí mua hàng',
            debit: bill.amount || 0,
            credit: 0,
            balance: runningBalance -= (bill.amount || 0),
            reference: bill.bill_number || '',
            type: 'expense'
          })

          // Accounts payable entry
          if ((bill.amount || 0) > (bill.paid_amount || 0)) {
            ledgerEntries.push({
              id: `payable_${bill.id}`,
              date: bill.created_at,
              description: `Phải trả nhà cung cấp - ${bill.vendors?.name}`,
              account: 'Phải trả nhà cung cấp',
              debit: 0,
              credit: (bill.amount || 0) - (bill.paid_amount || 0),
              balance: runningBalance += ((bill.amount || 0) - (bill.paid_amount || 0)),
              reference: bill.bill_number || '',
              type: 'payable'
            })
          }
        })
      }

      // Process expenses (Operating expense entries)
      if (expensesResult.data) {
        expensesResult.data.forEach(expense => {
          ledgerEntries.push({
            id: `expense_${expense.id}`,
            date: expense.expense_date,
            description: `${expense.description} - ${expense.employees?.first_name} ${expense.employees?.last_name}`,
            account: `Chi phí ${expense.category}`,
            debit: expense.amount || 0,
            credit: 0,
            balance: runningBalance -= (expense.amount || 0),
            reference: `EXP-${expense.id.slice(0, 8)}`,
            type: 'expense'
          })
        })
      }

      // Process projects (Project entries)
      if (projectsResult.data) {
        projectsResult.data.forEach(project => {
          // Project budget entry
          if (project.budget && project.budget > 0) {
            ledgerEntries.push({
              id: `project_budget_${project.id}`,
              date: project.created_at,
              description: `Ngân sách dự án ${project.project_code} - ${project.name}`,
              account: 'Ngân sách dự án',
              debit: 0,
              credit: project.budget,
              balance: runningBalance += project.budget,
              reference: project.project_code,
              type: 'project'
            })
          }

          // Project cost entry
          if (project.actual_cost && project.actual_cost > 0) {
            ledgerEntries.push({
              id: `project_cost_${project.id}`,
              date: project.created_at,
              description: `Chi phí dự án ${project.project_code} - ${project.name}`,
              account: 'Chi phí dự án',
              debit: project.actual_cost,
              credit: 0,
              balance: runningBalance -= project.actual_cost,
              reference: project.project_code,
              type: 'project'
            })
          }
        })
      }

      // Process time entries (Labor cost entries)
      if (timeEntriesResult.data) {
        timeEntriesResult.data.forEach(entry => {
          const laborCost = (entry.hours || 0) * (entry.hourly_rate || 0)
          if (laborCost > 0) {
            ledgerEntries.push({
              id: `time_${entry.id}`,
              date: entry.date,
              description: `Chi phí lao động - ${entry.employees?.first_name} ${entry.employees?.last_name} (${entry.projects?.name})`,
              account: 'Chi phí lao động',
              debit: laborCost,
              credit: 0,
              balance: runningBalance -= laborCost,
              reference: `TIME-${entry.id.slice(0, 8)}`,
              type: 'labor'
            })
          }
        })
      }

      // Sort entries by date
      ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setData(ledgerEntries)
    } catch (err) {
      console.error('Error fetching general ledger data:', err)
      setError('Không thể tải dữ liệu báo cáo từ cơ sở dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      fetchData()
    }
  }, [startDate, endDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const handleExport = () => {
    console.log('Exporting General Ledger...')
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedEntries(newExpanded)
  }

  const filteredData = data.filter(entry =>
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reference.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue, bValue
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
        break
      case 'amount':
        aValue = Math.max(a.debit, a.credit)
        bValue = Math.max(b.debit, b.credit)
        break
      default:
        aValue = a[sortBy as keyof LedgerEntry] as string
        bValue = b[sortBy as keyof LedgerEntry] as string
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getTotalDebits = () => {
    return data.reduce((sum, entry) => sum + entry.debit, 0)
  }

  const getTotalCredits = () => {
    return data.reduce((sum, entry) => sum + entry.credit, 0)
  }

  const getAccountTypes = () => {
    const accounts = new Set(data.map(entry => entry.account))
    return Array.from(accounts)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sổ cái tổng hợp</h1>
                <p className="text-gray-600">Chi tiết tất cả giao dịch kế toán</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Bộ lọc:</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mô tả, tài khoản hoặc số tham chiếu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Data */}
        {data && !loading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng giao dịch</p>
                    <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng nợ</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalDebits())}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng có</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalCredits())}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Số dư cuối</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(data[data.length - 1]?.balance || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* General Ledger Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Sổ cái tổng hợp</h2>
                <p className="text-gray-600">Từ {startDate} đến {endDate}</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-1">
                          Ngày
                          {sortBy === 'date' && (
                            sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tài khoản
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center gap-1">
                          Số tiền nợ
                          {sortBy === 'amount' && (
                            sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số tiền có
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số dư
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tham chiếu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedData.map((entry, index) => (
                      <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleExpanded(entry.id)}
                              className="mr-2 text-gray-400 hover:text-gray-600"
                            >
                              {expandedEntries.has(entry.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <span className="truncate max-w-xs">{entry.description}</span>
                          </div>
                          {expandedEntries.has(entry.id) && (
                            <div className="mt-2 text-xs text-gray-500">
                              <p>Loại: {entry.type}</p>
                              <p>ID: {entry.id}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.type === 'revenue' ? 'bg-green-100 text-green-800' :
                            entry.type === 'expense' ? 'bg-red-100 text-red-800' :
                            entry.type === 'receivable' ? 'bg-blue-100 text-blue-800' :
                            entry.type === 'payable' ? 'bg-orange-100 text-orange-800' :
                            entry.type === 'project' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.account}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(entry.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.reference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
