'use client'

import React, { useState } from 'react'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Building2, 
  CreditCard, 
  PiggyBank, 
  Users,
  FileText,
  Receipt,
  Calendar,
  ArrowLeft,
  Download,
  Filter
} from 'lucide-react'
import SimpleReportCard from './SimpleReportCard'
import SimpleReportView from './SimpleReportView'

interface SimpleReportsPageProps {
  onBack: () => void
}

export default function SimpleReportsPage({ onBack }: SimpleReportsPageProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const reports = [
    {
      id: 'profit-loss',
      title: 'P&L Report',
      description: 'Báo cáo Kết quả Kinh doanh',
      icon: BarChart3,
      color: 'purple'
    },
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      description: 'Báo cáo Cân đối Kế toán',
      icon: Building2,
      color: 'blue'
    },
    {
      id: 'cash-flow',
      title: 'Cash Flow',
      description: 'Báo cáo Lưu chuyển Tiền tệ',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'sales-customer',
      title: 'Doanh thu KH',
      description: 'Doanh thu theo Khách hàng',
      icon: Users,
      color: 'orange'
    },
    {
      id: 'expenses-vendor',
      title: 'Chi phí NCC',
      description: 'Chi phí theo Nhà cung cấp',
      icon: CreditCard,
      color: 'red'
    },
    {
      id: 'general-ledger',
      title: 'Sổ cái',
      description: 'Sổ Cái Tổng hợp',
      icon: FileText,
      color: 'indigo'
    }
  ]

  const handleReportClick = async (reportId: string) => {
    setSelectedReport(reportId)
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data for demo
      const mockData = {
        'balance-sheet': {
          as_of_date: "2024-03-31",
          currency: "VND",
          generated_at: new Date().toISOString(),
          assets: {
            total_assets: 184000000,
            current_assets: 134000000,
            fixed_assets: 50000000,
            asset_breakdown: [
              { category: "Cash", amount: 10000000, percentage: 5.4 },
              { category: "Accounts Receivable", amount: 124000000, percentage: 67.4 },
              { category: "Fixed Assets", amount: 50000000, percentage: 27.2 }
            ]
          },
          liabilities: {
            total_liabilities: 38000000,
            current_liabilities: 38000000,
            long_term_liabilities: 0,
            liability_breakdown: [
              { category: "Accounts Payable", amount: 38000000, percentage: 100.0 },
              { category: "Long-term Liabilities", amount: 0, percentage: 0.0 }
            ]
          },
          equity: {
            total_equity: 146000000,
            retained_earnings: 146000000,
            equity_breakdown: [
              { category: "Retained Earnings", amount: 146000000, percentage: 100.0 }
            ]
          },
          summary: {
            total_assets: 184000000,
            total_liabilities: 38000000,
            total_equity: 146000000,
            balance_check: true
          }
        },
        'cash-flow': {
          report_period: "01/01/2024 - 31/03/2024",
          start_date: "2024-01-01",
          end_date: "2024-03-31",
          currency: "VND",
          generated_at: new Date().toISOString(),
          beginning_cash: 10000000,
          ending_cash: 15000000,
          net_change_in_cash: 5000000,
          net_income: 25000000,
          operating_activities: {
            section_name: "Dòng tiền từ hoạt động kinh doanh",
            section_type: "operating",
            items: [
              { item_name: "Lợi nhuận ròng", amount: 25000000, is_inflow: true, description: "Từ báo cáo Kết quả Kinh doanh" },
              { item_name: "Khấu hao và phân bổ", amount: 5000000, is_inflow: true, description: "Chi phí không dùng tiền mặt" }
            ],
            subtotal: 30000000,
            net_cash_flow: 20000000
          },
          investing_activities: {
            section_name: "Dòng tiền từ hoạt động đầu tư",
            section_type: "investing",
            items: [
              { item_name: "Mua sắm Tài sản cố định", amount: 15000000, is_inflow: false, description: "Giao dịch Tài sản cố định" }
            ],
            subtotal: 15000000,
            net_cash_flow: -10000000
          },
          financing_activities: {
            section_name: "Dòng tiền từ hoạt động tài chính",
            section_type: "financing",
            items: [
              { item_name: "Vay dài hạn", amount: 20000000, is_inflow: true, description: "Giao dịch Vay dài hạn" }
            ],
            subtotal: 20000000,
            net_cash_flow: 15000000
          },
          total_operating_cash_flow: 20000000,
          total_investing_cash_flow: -10000000,
          total_financing_cash_flow: 15000000,
          net_cash_flow: 25000000,
          cash_flow_validation: true,
          total_transactions: 45,
          total_journal_entries: 45
        },
        'sales-customer': {
          report_period: "01/01/2024 - 31/03/2024",
          start_date: "2024-01-01",
          end_date: "2024-03-31",
          currency: "VND",
          generated_at: new Date().toISOString(),
          total_customers: 15,
          total_sales: 187000000,
          total_invoices: 25,
          total_sales_receipts: 12,
          average_order_value: 5054054,
          top_customers: [
            {
              customer_id: "1",
              customer_name: "Công ty ABC",
              customer_code: "KH001",
              customer_email: "contact@abc.com",
              customer_phone: "0123456789",
              total_sales: 55000000,
              total_invoices: 8,
              total_sales_receipts: 3,
              average_order_value: 5000000,
              last_transaction_date: "2024-03-15",
              growth_rate: 15.5,
              rank: 1
            }
          ],
          customer_segments: [
            { segment_name: "Khách hàng VIP", customer_count: 3, total_sales: 135000000, percentage: 72.2 },
            { segment_name: "Khách hàng thường", customer_count: 8, total_sales: 40000000, percentage: 21.4 }
          ],
          summary_stats: {
            highest_sales: 55000000,
            lowest_sales: 2000000,
            median_sales: 15000000,
            growth_rate: 12.3
          }
        }
      }
      
      setReportData(mockData[reportId as keyof typeof mockData])
    } catch (error) {
      console.error('Error loading report:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderReportView = () => {
    if (!selectedReport || !reportData) return null

    return (
      <SimpleReportView 
        reportType={selectedReport} 
        data={reportData} 
        onBack={() => setSelectedReport(null)} 
      />
    )
  }

  if (selectedReport) {
    return (
      <div className="space-y-6">
        {/* Report Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-black">Đang tải báo cáo...</span>
          </div>
        ) : (
          renderReportView()
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Phân tích</h1>
        <p className="text-black mt-2">Chọn báo cáo để xem chi tiết</p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <SimpleReportCard
            key={report.id}
            title={report.title}
            description={report.description}
            icon={report.icon}
            color={report.color}
            onClick={() => handleReportClick(report.id)}
          />
        ))}
      </div>
    </div>
  )
}
