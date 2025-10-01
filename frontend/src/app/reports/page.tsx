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
  Eye,
  FileSpreadsheet,
  Activity,
  Banknote,
  LineChart
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import PLReportModal from '@/components/reports/PLReportModal'
import BalanceSheetModal from '@/components/reports/BalanceSheetModal'
import CashFlowModal from '@/components/reports/CashFlowModal'
import SalesByCustomerModal from '@/components/reports/SalesByCustomerModal'
import ExpensesByVendorModal from '@/components/reports/ExpensesByVendorModal'
import GeneralLedgerModal from '@/components/reports/GeneralLedgerModal'

// Report types configuration
const REPORT_TYPES = [
  {
    id: 'financial',
    name: 'Báo cáo Tài chính',
    icon: DollarSign,
    color: 'bg-blue-500',
    reports: [
      {
        id: 'pl-report',
        name: 'Báo cáo Kết quả kinh doanh (P&L)',
        description: 'Báo cáo lãi lỗ, doanh thu và chi phí',
        icon: TrendingUp,
        modal: 'PLReportModal'
      },
      {
        id: 'balance-sheet',
        name: 'Bảng cân đối kế toán',
        description: 'Tài sản, nợ phải trả và vốn chủ sở hữu',
        icon: Scale,
        modal: 'BalanceSheetModal'
      },
      {
        id: 'cash-flow',
        name: 'Báo cáo lưu chuyển tiền tệ',
        description: 'Dòng tiền vào và ra của doanh nghiệp',
        icon: PiggyBank,
        modal: 'CashFlowModal'
      }
    ]
  },
  {
    id: 'sales',
    name: 'Báo cáo Bán hàng',
    icon: Users,
    color: 'bg-green-500',
    reports: [
      {
        id: 'sales-by-customer',
        name: 'Báo cáo bán hàng theo khách hàng',
        description: 'Doanh thu và số lượng bán hàng theo từng khách hàng',
        icon: Building2,
        modal: 'SalesByCustomerModal'
      },
      {
        id: 'sales-summary',
        name: 'Tổng hợp bán hàng',
        description: 'Tổng quan doanh thu, đơn hàng và xu hướng',
        icon: BarChart3,
        modal: null
      }
    ]
  },
  {
    id: 'expenses',
    name: 'Báo cáo Chi phí',
    icon: Receipt,
    color: 'bg-red-500',
    reports: [
      {
        id: 'expenses-by-vendor',
        name: 'Báo cáo chi phí theo nhà cung cấp',
        description: 'Chi phí và số lượng mua hàng theo nhà cung cấp',
        icon: CreditCard,
        modal: 'ExpensesByVendorModal'
      },
      {
        id: 'expenses-summary',
        name: 'Tổng hợp chi phí',
        description: 'Tổng quan chi phí theo danh mục và thời gian',
        icon: PieChart,
        modal: null
      }
    ]
  },
  {
    id: 'accounting',
    name: 'Báo cáo Kế toán',
    icon: BookOpen,
    color: 'bg-purple-500',
    reports: [
      {
        id: 'general-ledger',
        name: 'Sổ cái tổng hợp',
        description: 'Chi tiết tất cả giao dịch kế toán',
        icon: FileText,
        modal: 'GeneralLedgerModal'
      },
      {
        id: 'trial-balance',
        name: 'Bảng cân đối thử',
        description: 'Kiểm tra tính cân đối của sổ sách',
        icon: Calculator,
        modal: null
      }
    ]
  },
  {
    id: 'projects',
    name: 'Báo cáo Dự án',
    icon: FolderOpen,
    color: 'bg-orange-500',
    reports: [
      {
        id: 'project-profitability',
        name: 'Lợi nhuận dự án',
        description: 'Phân tích lợi nhuận theo từng dự án',
        icon: Target,
        modal: null
      },
      {
        id: 'project-timeline',
        name: 'Tiến độ dự án',
        description: 'Trạng thái và tiến độ thực hiện dự án',
        icon: Clock,
        modal: null
      }
    ]
  }
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCategory, setSelectedCategory] = useState('financial')
  const [dateRange, setDateRange] = useState('30')
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

  const handleReportClick = (report: any) => {
    if (report.modal) {
      switch (report.modal) {
        case 'PLReportModal':
          setShowPLModal(true)
          break
        case 'BalanceSheetModal':
          setShowBalanceSheetModal(true)
          break
        case 'CashFlowModal':
          setShowCashFlowModal(true)
          break
        case 'SalesByCustomerModal':
          setShowSalesByCustomerModal(true)
          break
        case 'ExpensesByVendorModal':
          setShowExpensesByVendorModal(true)
          break
        case 'GeneralLedgerModal':
          setShowGeneralLedgerModal(true)
          break
        default:
          console.log('Report not implemented yet:', report.id)
      }
    } else {
      console.log('Report not implemented yet:', report.id)
    }
  }

  const getCategoryReports = () => {
    const category = REPORT_TYPES.find(cat => cat.id === selectedCategory)
    return category ? category.reports : []
  }

  const getOverviewStats = () => {
    return [
      {
        title: 'Tổng doanh thu',
        value: '₫125,000,000',
        change: '+12.5%',
        trend: 'up',
        icon: DollarSign,
        color: 'text-green-600'
      },
      {
        title: 'Tổng chi phí',
        value: '₫85,000,000',
        change: '+8.2%',
        trend: 'up',
        icon: Receipt,
        color: 'text-red-600'
      },
      {
        title: 'Lợi nhuận',
        value: '₫40,000,000',
        change: '+15.3%',
        trend: 'up',
        icon: TrendingUp,
        color: 'text-blue-600'
      },
      {
        title: 'Số báo cáo',
        value: '24',
        change: '+2',
        trend: 'up',
        icon: FileText,
        color: 'text-purple-600'
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-black" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Báo cáo</h1>
                <p className="text-black mt-1">Quản lý và xem tất cả các loại báo cáo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">7 ngày qua</option>
                <option value="30">30 ngày qua</option>
                <option value="90">90 ngày qua</option>
                <option value="365">1 năm qua</option>
              </select>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                <span>Xuất báo cáo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Danh sách báo cáo
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getOverviewStats().map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-black">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className={`text-sm mt-1 ${stat.color}`}>
                        {stat.change} so với kỳ trước
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORT_TYPES.slice(0, 6).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveTab('reports')
                      setSelectedCategory(category.id)
                    }}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      <category.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-black">{category.reports.length} báo cáo</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Category Filter */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn loại báo cáo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORT_TYPES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      <category.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-black">{category.reports.length} báo cáo</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {REPORT_TYPES.find(cat => cat.id === selectedCategory)?.name} - Danh sách báo cáo
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getCategoryReports().map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleReportClick(report)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <report.icon className="h-6 w-6 text-black" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{report.name}</h4>
                          <p className="text-sm text-black mb-4">{report.description}</p>
                          <div className="flex items-center space-x-2">
                            <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                              <Eye className="h-4 w-4" />
                              <span>Xem báo cáo</span>
                            </button>
                            <button className="flex items-center space-x-1 text-black hover:text-gray-700 text-sm font-medium">
                              <Download className="h-4 w-4" />
                              <span>Xuất file</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPLModal && (
        <PLReportModal
          isOpen={showPLModal}
          onClose={() => setShowPLModal(false)}
        />
      )}
      
      {showBalanceSheetModal && (
        <BalanceSheetModal
          isOpen={showBalanceSheetModal}
          onClose={() => setShowBalanceSheetModal(false)}
        />
      )}
      
      {showCashFlowModal && (
        <CashFlowModal
          isOpen={showCashFlowModal}
          onClose={() => setShowCashFlowModal(false)}
        />
      )}
      
      {showSalesByCustomerModal && (
        <SalesByCustomerModal
          isOpen={showSalesByCustomerModal}
          onClose={() => setShowSalesByCustomerModal(false)}
        />
      )}
      
      {showExpensesByVendorModal && (
        <ExpensesByVendorModal
          isOpen={showExpensesByVendorModal}
          onClose={() => setShowExpensesByVendorModal(false)}
        />
      )}
      
      {showGeneralLedgerModal && (
        <GeneralLedgerModal
          isOpen={showGeneralLedgerModal}
          onClose={() => setShowGeneralLedgerModal(false)}
        />
      )}
    </div>
  )
}
