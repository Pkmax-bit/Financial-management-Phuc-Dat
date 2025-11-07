'use client'

import { useState, useEffect } from 'react'
import { getApiEndpoint } from '@/lib/apiUrl'
import { 
  Search,
  Filter,
  FileText,
  Receipt,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Send,
  Download
} from 'lucide-react'

interface AllSalesTabProps {
  searchTerm: string
}

interface Transaction {
  id: string
  type: 'estimate' | 'invoice' | 'sales_receipt' | 'credit_memo' | 'refund_receipt' | 'payment'
  number: string
  customer_name: string
  date: string
  amount: number
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'closed' | 'open' | 'overdue' | 'paid' | 'pending' | 'completed'
  due_date?: string
  payment_status?: 'pending' | 'partial' | 'paid'
}

export default function AllSalesTab({ searchTerm }: AllSalesTabProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchAllTransactions()
  }, [])

  const fetchAllTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiEndpoint('/api/sales/transactions'))
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'estimate':
        return <Receipt className="h-4 w-4 text-blue-600" />
      case 'invoice':
        return <FileText className="h-4 w-4 text-green-600" />
      case 'sales_receipt':
        return <DollarSign className="h-4 w-4 text-purple-600" />
      case 'payment':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <FileText className="h-4 w-4 text-black" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'estimate':
        return 'Báo giá'
      case 'invoice':
        return 'Hóa đơn'
      case 'sales_receipt':
        return 'Phiếu bán hàng'
      case 'credit_memo':
        return 'Ghi có'
      case 'refund_receipt':
        return 'Phiếu hoàn tiền'
      case 'payment':
        return 'Thanh toán'
      default:
        return type
    }
  }

  const getStatusColor = (status: string, type: string) => {
    if (type === 'payment') {
      return 'bg-green-100 text-green-800'
    }
    
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Nháp'
      case 'sent':
        return 'Đã gửi'
      case 'accepted':
        return 'Đã chấp nhận'
      case 'paid':
        return 'Đã thanh toán'
      case 'overdue':
        return 'Quá hạn'
      case 'pending':
        return 'Chờ xử lý'
      default:
        return status
    }
  }

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id))
    }
  }

  const handleBatchAction = (action: string) => {
    console.log(`Batch action: ${action} for transactions:`, selectedTransactions)
    // Implement batch actions like send reminders, print, etc.
  }

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = searchTerm === '' || 
        transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.number.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = filterType === 'all' || transaction.type === filterType
      const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus
      
      return matchesSearch && matchesType && matchesStatus
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'customer':
          aValue = a.customer_name.toLowerCase()
          bValue = b.customer_name.toLowerCase()
          break
        default:
          aValue = a.date
          bValue = b.date
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tất cả loại giao dịch</option>
            <option value="estimate">Báo giá</option>
            <option value="invoice">Hóa đơn</option>
            <option value="sales_receipt">Phiếu bán hàng</option>
            <option value="payment">Thanh toán</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="sent">Đã gửi</option>
            <option value="accepted">Đã chấp nhận</option>
            <option value="paid">Đã thanh toán</option>
            <option value="overdue">Quá hạn</option>
            <option value="pending">Chờ xử lý</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order as 'asc' | 'desc')
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date-desc">Ngày (Mới nhất)</option>
            <option value="date-asc">Ngày (Cũ nhất)</option>
            <option value="amount-desc">Số tiền (Cao nhất)</option>
            <option value="amount-asc">Số tiền (Thấp nhất)</option>
            <option value="customer-asc">Khách hàng (A-Z)</option>
            <option value="customer-desc">Khách hàng (Z-A)</option>
          </select>
        </div>

        {/* Batch Actions */}
        {selectedTransactions.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleBatchAction('send_reminder')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
            >
              <Send className="h-4 w-4 mr-1" />
              Gửi nhắc nhở ({selectedTransactions.length})
            </button>
            <button
              onClick={() => handleBatchAction('print')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              In
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Số chứng từ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => handleSelectTransaction(transaction.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(transaction.type)}
                      <span className="ml-2 text-sm text-gray-900">{getTypeLabel(transaction.type)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {transaction.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status, transaction.type)}`}>
                      {getStatusLabel(transaction.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-black hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-black">Không tìm thấy giao dịch nào</p>
          </div>
        )}
      </div>
      
      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-black">
        <span>Hiển thị {filteredTransactions.length} giao dịch</span>
        <span>
          Tổng giá trị: {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.amount, 0))}
        </span>
      </div>
    </div>
  )
}