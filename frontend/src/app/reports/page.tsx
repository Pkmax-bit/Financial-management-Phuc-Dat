'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Users,
  FolderOpen,
  Receipt,
  FileText,
  Clock,
  Target,
  AlertCircle,
  Building2,
  CreditCard,
  PiggyBank,
  BookOpen,
  Calculator,
  Scale,
  ArrowLeft, 
  FileSpreadsheet, 
  Activity, 
  Banknote, 
  LineChart,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import PLReportModal from '@/components/reports/PLReportModal'
import BalanceSheetModal from '@/components/reports/BalanceSheetModal'
import CashFlowModal from '@/components/reports/CashFlowModal'
import SalesByCustomerModal from '@/components/reports/SalesByCustomerModal'
import ExpensesByVendorModal from '@/components/reports/ExpensesByVendorModal'
import GeneralLedgerModal from '@/components/reports/GeneralLedgerModal'

// 7 loại báo cáo chính
const REPORT_TYPES = [
      {
        id: 'pl-report',
    name: 'Báo cáo Kết quả kinh doanh (P&L)',
    description: 'Báo cáo lãi lỗ, doanh thu và chi phí',
        icon: TrendingUp,
    color: 'bg-blue-500',
        category: 'Tài chính'
      },
      {
        id: 'balance-sheet',
    name: 'Bảng cân đối kế toán',
    description: 'Tài sản, nợ phải trả và vốn chủ sở hữu',
    icon: Scale,
    color: 'bg-green-500',
        category: 'Tài chính'
      },
      {
        id: 'cash-flow',
    name: 'Báo cáo lưu chuyển tiền tệ',
    description: 'Dòng tiền vào và ra của doanh nghiệp',
    icon: PiggyBank,
    color: 'bg-purple-500',
        category: 'Tài chính'
      },
      {
    id: 'sales-by-customer',
    name: 'Báo cáo bán hàng theo khách hàng',
    description: 'Doanh thu và số lượng bán hàng theo từng khách hàng',
    icon: Building2,
    color: 'bg-orange-500',
        category: 'Bán hàng'
      },
      {
    id: 'expenses-by-vendor',
    name: 'Báo cáo chi phí theo nhà cung cấp',
    description: 'Chi phí và số lượng mua hàng theo nhà cung cấp',
    icon: CreditCard,
    color: 'bg-red-500',
        category: 'Chi phí'
      },
      {
        id: 'general-ledger',
    name: 'Sổ cái tổng hợp',
    description: 'Chi tiết tất cả giao dịch kế toán',
        icon: BookOpen,
    color: 'bg-indigo-500',
        category: 'Kế toán'
      },
      {
    id: 'project-reports',
    name: 'Báo cáo dự án',
    description: 'Phân tích hiệu quả và tiến độ dự án',
        icon: FolderOpen,
    color: 'bg-teal-500',
        category: 'Dự án'
  }
]

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<{ full_name?: string; role?: string; email?: string; id?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showPLModal, setShowPLModal] = useState(false)
  const [showBalanceSheetModal, setShowBalanceSheetModal] = useState(false)
  const [showCashFlowModal, setShowCashFlowModal] = useState(false)
  const [showSalesByCustomerModal, setShowSalesByCustomerModal] = useState(false)
  const [showExpensesByVendorModal, setShowExpensesByVendorModal] = useState(false)
  const [showGeneralLedgerModal, setShowGeneralLedgerModal] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser({
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: user.user_metadata?.role || 'user',
            email: user.email || '',
            id: user.id
          })
        }
      } catch (error) {
        console.error('Error getting user:', error)
        setError('Không thể tải thông tin người dùng')
      }
    }

    getUser()
  }, [])

    const handleReportClick = (reportId: string) => {
    switch (reportId) {
      case 'pl-report':
        router.push('/reports/pl-report')
        break
      case 'balance-sheet':
        router.push('/reports/balance-sheet')
        break
      case 'cash-flow':
        router.push('/reports/cash-flow')
        break
      case 'sales-by-customer':
        router.push('/reports/sales-by-customer')
        break
      case 'expenses-by-vendor':
        setShowExpensesByVendorModal(true)
        break
      case 'general-ledger':
        router.push('/reports/general-ledger')
        break
      case 'project-report':
        router.push('/reports/project-report')
        break
      default:
        console.log('Report not implemented:', reportId)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Tài chính':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Bán hàng':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'Chi phí':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'Kế toán':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'Dự án':
        return 'bg-teal-50 text-teal-700 border-teal-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
    }

    return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
                  <div>
              <h1 className="text-3xl font-bold text-gray-900">Báo cáo</h1>
              <p className="text-gray-600">Xem và tạo các báo cáo tài chính</p>
                  </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
          <div>
                <p className="text-sm text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">VND 0</p>
          </div>
        </div>
        </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
          <div>
                <p className="text-sm text-gray-600">Lợi nhuận</p>
                <p className="text-2xl font-bold text-gray-900">VND 0</p>
          </div>
          </div>
        </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
          <div>
                <p className="text-sm text-gray-600">Khách hàng</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
          </div>
        </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FolderOpen className="h-5 w-5 text-orange-600" />
          </div>
            <div>
                <p className="text-sm text-gray-600">Dự án</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REPORT_TYPES.map((report) => {
            const IconComponent = report.icon
            return (
              <div
                key={report.id}
                onClick={() => handleReportClick(report.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-300 group cursor-pointer"
              >
                <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${report.color} bg-opacity-10`}>
                      <IconComponent className={`h-6 w-6 ${report.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(report.category)}`}>
                      {report.category}
                  </div>
                </div>
                
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                    {report.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {report.description}
                  </p>
                  
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Eye className="h-4 w-4" />
                      <span>Xem báo cáo</span>
                  </div>
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Download className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                  </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPLModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              Báo cáo P&L
            </button>
            <button
              onClick={() => setShowBalanceSheetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Scale className="h-4 w-4" />
              Bảng cân đối
            </button>
            <button
              onClick={() => setShowCashFlowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PiggyBank className="h-4 w-4" />
              Lưu chuyển tiền tệ
            </button>
          <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
              <FolderOpen className="h-4 w-4" />
              Quản lý dự án
          </button>
        </div>
          </div>
        </div>

      {/* Modals */}
      {showPLModal && (
      <PLReportModal
        isOpen={showPLModal}
        onClose={() => setShowPLModal(false)}
          startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          endDate={new Date().toISOString().split('T')[0]}
      />
      )}

      {showBalanceSheetModal && (
      <BalanceSheetModal
        isOpen={showBalanceSheetModal}
        onClose={() => setShowBalanceSheetModal(false)}
          asOfDate={new Date().toISOString().split('T')[0]}
      />
      )}

      {showCashFlowModal && (
      <CashFlowModal
        isOpen={showCashFlowModal}
        onClose={() => setShowCashFlowModal(false)}
          startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          endDate={new Date().toISOString().split('T')[0]}
      />
      )}

      {showSalesByCustomerModal && (
      <SalesByCustomerModal
        isOpen={showSalesByCustomerModal}
        onClose={() => setShowSalesByCustomerModal(false)}
          startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          endDate={new Date().toISOString().split('T')[0]}
      />
      )}

      {showExpensesByVendorModal && (
      <ExpensesByVendorModal
        isOpen={showExpensesByVendorModal}
        onClose={() => setShowExpensesByVendorModal(false)}
          startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          endDate={new Date().toISOString().split('T')[0]}
      />
      )}

      {showGeneralLedgerModal && (
      <GeneralLedgerModal
        isOpen={showGeneralLedgerModal}
        onClose={() => setShowGeneralLedgerModal(false)}
          startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          endDate={new Date().toISOString().split('T')[0]}
      />
      )}
    </div>
  )
}