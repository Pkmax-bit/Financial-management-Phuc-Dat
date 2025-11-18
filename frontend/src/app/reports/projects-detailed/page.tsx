'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  FolderOpen, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  BarChart3,
  CircleHelp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import StickyTopNav from '@/components/StickyTopNav'
import * as XLSX from 'xlsx'
import { PROJECT_STATUS_FILTER_OPTIONS, getProjectStatusBadgeClass, getProjectStatusLabel } from '@/config/projectStatus'

interface ProjectSummary {
  id: string
  project_code: string
  name: string
  customer_name: string
  status: string
  start_date?: string | null
  end_date?: string | null
  
  // Planned (Kế hoạch)
  planned_revenue: number // From quotes
  planned_costs: number // From project budget
  
  // Actual (Thực tế)
  actual_revenue: number // From invoices
  actual_costs: number // From expenses
  
  // Profit
  planned_profit: number
  actual_profit: number
  profit_margin: number
  
  // Counts
  invoice_count: number
  expense_count: number
  quote_count: number
  unpaid_invoice_count: number
  partial_invoice_count: number
}

export default function ProjectsDetailedReportPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // Tour state
  const REPORT_LIST_TOUR_STORAGE_KEY = 'report-list-tour-status-v1'
  const [isReportListTourRunning, setIsReportListTourRunning] = useState(false)
  const reportListTourRef = useRef<any>(null)
  const reportListShepherdRef = useRef<any>(null)
  const reportListTourAutoStartAttemptedRef = useRef(false)
  type ReportListShepherdModule = typeof import('shepherd.js')
  type ReportListShepherdType = ReportListShepherdModule & { Tour: new (...args: any[]) => any }
  type ReportListShepherdTour = InstanceType<ReportListShepherdType['Tour']>

  useEffect(() => {
    checkUser()
    fetchProjectsData()
  }, [selectedMonth, selectedYear])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (userData) {
          setUser(userData)
        }
      }
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  const fetchProjectsData = async () => {
    setLoading(true)
    try {
      // Fetch projects with related data
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          project_code,
          name,
          status,
          start_date,
          end_date,
          budget,
          customers!inner(name)
        `)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      const periodStart = selectedMonth !== 'all'
        ? new Date(selectedYear, parseInt(selectedMonth) - 1, 1)
        : null
      const periodEnd = selectedMonth !== 'all'
        ? new Date(selectedYear, parseInt(selectedMonth), 0, 23, 59, 59)
        : null

      const projectsWithinPeriod = (projectsData || []).filter(project => {
        if (!periodStart || !periodEnd) {
          return true
        }

        const projectStart = project.start_date ? new Date(project.start_date) : null
        const projectEnd = project.end_date ? new Date(project.end_date) : null

        if (projectStart && projectStart > periodEnd) {
          return false
        }

        if (projectEnd && projectEnd < periodStart) {
          return false
        }

        return true
      })

      // For each project, fetch financial data
      const projectSummaries: ProjectSummary[] = await Promise.all(
        projectsWithinPeriod.map(async (project) => {
          // Build query for invoices with optional month filter
          let invoicesQuery = supabase
            .from('invoices')
            .select('total_amount, payment_status, issue_date')
            .eq('project_id', project.id)
            .in('status', ['sent', 'paid'])
          
          // Apply month filter if selected
          if (selectedMonth !== 'all') {
            const monthNum = parseInt(selectedMonth)
            const startDate = new Date(selectedYear, monthNum - 1, 1)
            const endDate = new Date(selectedYear, monthNum, 0, 23, 59, 59)
            invoicesQuery = invoicesQuery
              .gte('issue_date', startDate.toISOString())
              .lte('issue_date', endDate.toISOString())
          }
          
          // Fetch invoices (actual revenue) - Hóa đơn đã phát hành
          const { data: invoices, error: invoicesError } = await invoicesQuery
          
          // Debug log
          if (invoicesError) {
            console.error('Error fetching invoices for project:', project.id, invoicesError)
          }
          if (invoices && invoices.length > 0) {
            console.log('Invoices found for project:', project.name, invoices)
          }
          
          // Đếm số hóa đơn chưa thanh toán
          const unpaidInvoices = invoices?.filter(i => i.payment_status === 'pending').length || 0
          const partialInvoices = invoices?.filter(i => i.payment_status === 'partial').length || 0

          // Build query for expenses with optional month filter
          let expensesQuery = supabase
            .from('project_expenses')
            .select('amount, expense_date')
            .eq('project_id', project.id)
            .eq('status', 'approved')
          
          // Apply month filter if selected
          if (selectedMonth !== 'all') {
            const monthNum = parseInt(selectedMonth)
            const startDate = new Date(selectedYear, monthNum - 1, 1)
            const endDate = new Date(selectedYear, monthNum, 0, 23, 59, 59)
            expensesQuery = expensesQuery
              .gte('expense_date', startDate.toISOString())
              .lte('expense_date', endDate.toISOString())
          }
          
          // Fetch project expenses (actual costs) - Chi phí dự án đã duyệt
          const { data: projectExpenses } = await expensesQuery

          // Calculate totals - Tính toán từ dữ liệu thực tế
          const actual_revenue = invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0
          const actual_costs = projectExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
          
          // Lợi nhuận = Hóa đơn - Chi phí dự án đã duyệt
          const actual_profit = actual_revenue - actual_costs
          
          // Biên lợi nhuận = (Lợi nhuận / Doanh thu) * 100
          const profit_margin = actual_revenue > 0 ? (actual_profit / actual_revenue) * 100 : 0

          // Kế hoạch chỉ để hiển thị so sánh (không dùng tính lợi nhuận)
          const planned_revenue = project.budget || 0
          const planned_costs = project.budget ? project.budget * 0.7 : 0
          const planned_profit = planned_revenue - planned_costs

          return {
            id: project.id,
            project_code: project.project_code,
            name: project.name,
            customer_name: (Array.isArray(project.customers) ? (project.customers as any[])[0]?.name : (project.customers as any)?.name) || 'N/A',
            status: project.status,
            start_date: project.start_date || null,
            end_date: project.end_date || null,
            planned_revenue,
            planned_costs,
            actual_revenue,
            actual_costs,
            planned_profit,
            actual_profit,
            profit_margin,
            invoice_count: invoices?.length || 0,
            expense_count: projectExpenses?.length || 0,
            quote_count: 0,
            unpaid_invoice_count: unpaidInvoices,
            partial_invoice_count: partialInvoices
          }
        })
      )

      setProjects(projectSummaries)
    } catch (error) {
      console.error('Error fetching projects data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Tour function
  const startReportListTour = useCallback(async () => {
    if (typeof window === 'undefined') return

    if (reportListTourRef.current) {
      reportListTourRef.current.cancel()
      reportListTourRef.current = null
    }

    if (!reportListShepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: ReportListShepherdType })?.default ?? (module as unknown as ReportListShepherdType)
        reportListShepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = reportListShepherdRef.current
    if (!Shepherd) return

    const waitForElement = async (selector: string, retries = 20, delay = 100) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        if (document.querySelector(selector)) {
          return true
        }
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      return false
    }

    await waitForElement('[data-tour-id="report-list-header"]')
    await waitForElement('[data-tour-id="report-summary-cards"]')
    await waitForElement('[data-tour-id="report-summary-projects"]')
    await waitForElement('[data-tour-id="report-summary-revenue"]')
    await waitForElement('[data-tour-id="report-summary-costs"]')
    await waitForElement('[data-tour-id="report-summary-profit"]')
    await waitForElement('[data-tour-id="report-filters"]')
    await waitForElement('[data-tour-id="report-filter-search"]')
    await waitForElement('[data-tour-id="report-filter-status"]')
    await waitForElement('[data-tour-id="report-filter-year"]')
    await waitForElement('[data-tour-id="report-filter-month"]')
    await waitForElement('[data-tour-id="report-filter-download"]')
    await waitForElement('[data-tour-id="report-table"]')
    await waitForElement('[data-tour-id="report-table-action-button"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'report-list-intro',
      title: 'Hướng dẫn xem báo cáo chi phí dự án',
      text: 'Trang này hiển thị danh sách tất cả các dự án với thông tin tài chính tổng hợp. Bạn có thể xem doanh thu, chi phí, lợi nhuận và biên lợi nhuận của từng dự án.',
      attachTo: { element: '[data-tour-id="report-list-header"]', on: 'bottom' },
      buttons: [
        {
          text: 'Bỏ qua',
          action: () => tour.cancel(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-summary-intro',
      title: 'Khu vực tóm tắt',
      text: 'Bốn thẻ tóm tắt cung cấp bức tranh tổng quan nhanh về danh sách dự án. Tiếp tục để xem chi tiết từng chỉ số.',
      attachTo: { element: '[data-tour-id="report-summary-cards"]', on: 'bottom' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-summary-projects',
      title: 'Tổng dự án',
      text: 'Hiển thị số lượng dự án trong danh sách sau khi áp dụng bộ lọc. Con số này giúp bạn biết phạm vi báo cáo hiện tại.',
      attachTo: { element: '[data-tour-id="report-summary-projects"]', on: 'bottom' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-summary-revenue',
      title: 'Tổng doanh thu',
      text: 'Tổng số tiền đã xuất hóa đơn (đã gửi/đã thanh toán) cho các dự án. Dựa trên dữ liệu hóa đơn thực tế.',
      attachTo: { element: '[data-tour-id="report-summary-revenue"]', on: 'bottom' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-summary-costs',
      title: 'Tổng chi phí',
      text: 'Tổng chi phí thực tế đã duyệt từ bảng Chi phí Dự án. Con số này giúp đánh giá mức chi tiêu.',
      attachTo: { element: '[data-tour-id="report-summary-costs"]', on: 'bottom' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-summary-profit',
      title: 'Lợi nhuận',
      text: 'Lợi nhuận = Doanh thu - Chi phí. Màu xanh thể hiện lãi, màu đỏ báo hiệu đang lỗ hoặc vượt chi.',
      attachTo: { element: '[data-tour-id="report-summary-profit"]', on: 'bottom' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-filter-search',
      title: 'Tìm kiếm dự án',
      text: 'Nhập tên dự án, mã dự án hoặc tên khách hàng để lọc danh sách theo từ khóa.',
      attachTo: { element: '[data-tour-id="report-filter-search"]', on: 'bottom' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-filter-status',
      title: 'Lọc theo trạng thái',
      text: 'Chọn trạng thái dự án (Lập kế hoạch, Đang hoạt động, Hoàn thành, ...) để phân tích nhóm dự án cụ thể.',
      attachTo: { element: '[data-tour-id="report-filter-status"]', on: 'bottom' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-filter-time',
      title: 'Chọn thời gian',
      text: 'Sử dụng bộ lọc Năm và Tháng để giới hạn dữ liệu trong giai đoạn cần theo dõi. Chọn "Tất cả tháng" để xem toàn bộ năm.',
      attachTo: { element: '[data-tour-id="report-filter-year"]', on: 'bottom' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-filter-month',
      title: 'Lọc theo tháng',
      text: 'Kết hợp với bộ lọc tháng để phân tích chi tiết từng giai đoạn. Ví dụ: Chọn Tháng 6 để xem kết quả riêng của tháng 6.',
      attachTo: { element: '[data-tour-id="report-filter-month"]', on: 'bottom' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-filter-download',
      title: 'Xuất báo cáo',
      text: 'Nhấn "Tải Excel" để xuất dữ liệu đã lọc thành file Excel, bao gồm cả bảng tổng hợp và chi tiết từng dự án.',
      attachTo: { element: '[data-tour-id="report-filter-download"]', on: 'left' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-table-overview',
      title: 'Bảng danh sách dự án',
      text: 'Bảng hiển thị chi tiết từng dự án sau khi áp dụng bộ lọc. Các cột bao gồm thông tin dự án, khách hàng, trạng thái, doanh thu, chi phí, lợi nhuận và biên lợi nhuận.',
      attachTo: { element: '[data-tour-id="report-table"]', on: 'top' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Tiếp tục',
          action: () => tour.next()
        }
      ]
    })

    tour.addStep({
      id: 'report-table-action',
      title: 'Xem báo cáo chi tiết',
      text: 'Nhấn "Xem chi tiết" để mở báo cáo chi tiết của dự án, bao gồm phân tích kế hoạch vs thực tế và các chi phí liên quan.',
      attachTo: { element: '[data-tour-id="report-table-action-button"]', on: 'left' },
      buttons: [
        {
          text: 'Quay lại',
          action: () => tour.back(),
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Hoàn thành',
          action: () => tour.complete()
        }
      ]
    })

    tour.on('complete', () => {
      setIsReportListTourRunning(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem(REPORT_LIST_TOUR_STORAGE_KEY, 'completed')
      }
      reportListTourRef.current = null
    })

    tour.on('cancel', () => {
      setIsReportListTourRunning(false)
      reportListTourRef.current = null
    })

    reportListTourRef.current = tour
    setIsReportListTourRunning(true)
    tour.start()
  }, [])

  // Auto-start tour
  useEffect(() => {
    if (typeof window === 'undefined' || reportListTourAutoStartAttemptedRef.current) return

    const hasCompletedTour = localStorage.getItem(REPORT_LIST_TOUR_STORAGE_KEY) === 'completed'
    if (hasCompletedTour) {
      reportListTourAutoStartAttemptedRef.current = true
      return
    }

    if (!loading && projects.length >= 0) {
      reportListTourAutoStartAttemptedRef.current = true
      setTimeout(() => {
        startReportListTour()
      }, 800)
    }
  }, [loading, projects.length, startReportListTour])

  // Cleanup tour on unmount
  useEffect(() => {
    return () => {
      if (reportListTourRef.current) {
        reportListTourRef.current.cancel()
        reportListTourRef.current = null
      }
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate totals
  const totalPlannedRevenue = filteredProjects.reduce((sum, p) => sum + p.planned_revenue, 0)
  const totalActualRevenue = filteredProjects.reduce((sum, p) => sum + p.actual_revenue, 0)
  const totalActualCosts = filteredProjects.reduce((sum, p) => sum + p.actual_costs, 0)
  const totalActualProfit = filteredProjects.reduce((sum, p) => sum + p.actual_profit, 0)

  const getMonthYearText = () => {
    if (selectedMonth === 'all') {
      return `Tất cả tháng năm ${selectedYear}`
    }
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ]
    return `${monthNames[parseInt(selectedMonth) - 1]} năm ${selectedYear}`
  }

  const handleDownloadExcel = async () => {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new()

      // ===== SHEET 1: TỔNG HỢP =====
      const summaryData = filteredProjects.map((project, index) => ({
        'STT': index + 1,
        'Mã dự án': project.project_code,
        'Tên dự án': project.name,
        'Khách hàng': project.customer_name,
        'Trạng thái': getProjectStatusLabel(project.status),
        'Doanh thu thực tế (VND)': project.actual_revenue,
        'Chi phí thực tế (VND)': project.actual_costs,
        'Lợi nhuận (VND)': project.actual_profit,
        'Biên lợi nhuận (%)': Number(project.profit_margin.toFixed(2)),
        'Số hóa đơn': project.invoice_count,
        'Số chi phí': project.expense_count
      }))

      // Add summary row
      summaryData.push({
        'STT': 0,
        'Mã dự án': '',
        'Tên dự án': 'TỔNG CỘNG',
        'Khách hàng': '',
        'Trạng thái': '',
        'Doanh thu thực tế (VND)': totalActualRevenue,
        'Chi phí thực tế (VND)': totalActualCosts,
        'Lợi nhuận (VND)': totalActualProfit,
        'Biên lợi nhuận (%)': totalActualRevenue > 0 ? Number(((totalActualProfit / totalActualRevenue) * 100).toFixed(2)) : 0,
        'Số hóa đơn': filteredProjects.reduce((sum, p) => sum + p.invoice_count, 0),
        'Số chi phí': filteredProjects.reduce((sum, p) => sum + p.expense_count, 0)
      })

      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      summarySheet['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 15 },
        { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }
      ]
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng hợp')

      // Preload expense objects for name lookup
      const expenseObjectMap = new Map<string, string>()
      try {
        const { data: expenseObjects } = await supabase
          .from('expense_objects')
          .select('id, name')
        expenseObjects?.forEach((obj: any) => {
          if (obj?.id) {
            expenseObjectMap.set(obj.id, obj.name || '')
          }
        })
      } catch (error) {
        console.error('Error fetching expense objects for export:', error)
      }

      const getExpenseObjectName = (id?: string | null) => {
        if (!id) return 'Khác'
        return expenseObjectMap.get(id) || 'Khác'
      }

      // ===== SHEET 2+: CHI TIẾT TỪNG DỰ ÁN =====
      for (const project of filteredProjects) {
        // Fetch detailed data for this project
        const detailData: any[] = []

        // Header section
        detailData.push({ 'A': 'THÔNG TIN DỰ ÁN', 'B': '', 'C': '', 'D': '', 'E': '' })
        detailData.push({ 'A': 'Mã dự án:', 'B': project.project_code, 'C': '', 'D': '', 'E': '' })
        detailData.push({ 'A': 'Tên dự án:', 'B': project.name, 'C': '', 'D': '', 'E': '' })
        detailData.push({ 'A': 'Khách hàng:', 'B': project.customer_name, 'C': '', 'D': '', 'E': '' })
        detailData.push({ 'A': 'Trạng thái:', 'B': getProjectStatusLabel(project.status), 'C': '', 'D': '', 'E': '' })
        detailData.push({ 'A': '', 'B': '', 'C': '', 'D': '', 'E': '' })

        // Financial Summary
        detailData.push({ 'A': 'TÓM TẮT TÀI CHÍNH', 'B': 'Kế hoạch', 'C': 'Thực tế', 'D': 'Chênh lệch', 'E': '% Biến động' })
        detailData.push({ 
          'A': 'Doanh thu (VND)', 
          'B': project.planned_revenue,
          'C': project.actual_revenue,
          'D': project.actual_revenue - project.planned_revenue,
          'E': project.planned_revenue > 0 ? `${(((project.actual_revenue - project.planned_revenue) / project.planned_revenue) * 100).toFixed(1)}%` : '0%'
        })
        detailData.push({ 
          'A': 'Chi phí (VND)', 
          'B': project.planned_costs,
          'C': project.actual_costs,
          'D': project.actual_costs - project.planned_costs,
          'E': project.planned_costs > 0 ? `${(((project.actual_costs - project.planned_costs) / project.planned_costs) * 100).toFixed(1)}%` : '0%'
        })
        detailData.push({ 
          'A': 'Lợi nhuận (VND)', 
          'B': project.planned_profit,
          'C': project.actual_profit,
          'D': project.actual_profit - project.planned_profit,
          'E': project.planned_profit !== 0 ? `${(((project.actual_profit - project.planned_profit) / Math.abs(project.planned_profit)) * 100).toFixed(1)}%` : '0%'
        })
        detailData.push({ 
          'A': 'Biên lợi nhuận (%)', 
          'B': project.planned_revenue > 0 ? Number(((project.planned_profit / project.planned_revenue) * 100).toFixed(2)) : 0,
          'C': Number(project.profit_margin.toFixed(2)),
          'D': '',
          'E': ''
        })
        detailData.push({ 'A': '', 'B': '', 'C': '', 'D': '', 'E': '' })

        // ===== KẾ HOẠCH =====
        detailData.push({ 'A': '========== KẾ HOẠCH - BÁO GIÁ & CHI PHÍ DỰ KIẾN ==========', 'B': '', 'C': '', 'D': '', 'E': '' })
        detailData.push({ 'A': '', 'B': '', 'C': '', 'D': '', 'E': '' })

        // Fetch Quotes (Báo giá)
        const { data: quotes } = await supabase
          .from('quotes')
          .select(`
            quote_number,
            issue_date,
            total_amount,
            status,
            description,
            quote_items (
              name_product,
              description,
              quantity,
              unit
            )
          `)
          .eq('project_id', project.id)
          .order('issue_date', { ascending: false })

        detailData.push({ 'A': 'BÁO GIÁ (DOANH THU DỰ KIẾN)', 'B': '', 'C': '', 'D': '', 'E': '' })
        if (quotes && quotes.length > 0) {
          detailData.push({ 'A': 'Số báo giá', 'B': 'Ngày', 'C': 'Tổng tiền (VND)', 'D': 'Trạng thái', 'E': 'Sản phẩm' })
          for (const quote of quotes) {
            const items = Array.isArray(quote.quote_items) ? quote.quote_items : []
            const productsList = items.map((item: any) => {
              const title = item.name_product || item.description || 'Hạng mục'
              const quantity = item.quantity ?? item.qty ?? 0
              const unit = item.unit ? ` ${item.unit}` : ''
              return `${title} (SL: ${quantity}${unit})`
            }).join(', ')
            detailData.push({
              'A': quote.quote_number,
              'B': new Date(quote.issue_date).toLocaleDateString('vi-VN'),
              'C': quote.total_amount,
              'D': quote.status === 'draft' ? 'Nháp' : quote.status === 'sent' ? 'Đã gửi' : quote.status === 'accepted' ? 'Đã chấp nhận' : getProjectStatusLabel(quote.status),
              'E': productsList || 'Không có sản phẩm'
            })
          }
          detailData.push({ 
            'A': 'TỔNG BÁO GIÁ', 
            'B': '', 
            'C': quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0), 
            'D': `${quotes.length} báo giá`,
            'E': '' 
          })
        } else {
          detailData.push({ 'A': 'Chưa có báo giá', 'B': '', 'C': '', 'D': '', 'E': '' })
        }
        detailData.push({ 'A': '', 'B': '', 'C': '', 'D': '', 'E': '' })

        // Fetch Quote Expenses (Chi phí dự kiến)
        const { data: quoteExpenses, error: quoteExpensesError } = await supabase
          .from('project_expenses_quote')
          .select('*')
          .eq('project_id', project.id)

        if (quoteExpensesError) {
          console.error('Error fetching planned expenses for project', project.project_code, quoteExpensesError)
        }

        detailData.push({ 'A': 'CHI PHÍ DỰ KIẾN (TỪ BÁO GIÁ)', 'B': '', 'C': '', 'D': '', 'E': '' })
        if (quoteExpenses && quoteExpenses.length > 0) {
          detailData.push({ 'A': 'Đối tượng chi phí', 'B': 'Mô tả', 'C': 'Chi tiết vật tư', 'D': 'Thành tiền (VND)', 'E': 'Ngày' })
          
          for (const exp of quoteExpenses) {
            const objectName = getExpenseObjectName(exp.expense_object_id)
            const dateText = exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('vi-VN') : 'N/A'
            const itemDetails = Array.isArray(exp.invoice_items)
              ? exp.invoice_items.map((item: any) => {
                  const title = item.name_product || item.description || 'Hạng mục'
                  const quantity = item.quantity ?? item.qty ?? 0
                  const unit = item.unit ? ` ${item.unit}` : ''
                  const price = item.unit_price ?? item.price ?? item.unitPrice
                  const total = item.total_amount ?? item.total ?? item.line_total ?? item.lineTotal
                  const priceText = price ? `, Đơn giá: ${price}` : ''
                  const totalText = total ? `, Thành tiền: ${total}` : ''
                  return `${title} (SL: ${quantity}${unit}${priceText}${totalText})`
                }).join('; ')
              : ''

            detailData.push({
              'A': objectName,
              'B': exp.description || '',
              'C': itemDetails || (exp.expense_object_totals ? 'Có phân bổ vật tư' : ''),
              'D': exp.amount || 0,
              'E': dateText
            })
          }
          
          const totalQuoteExpenses = quoteExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
          detailData.push({ 
            'A': 'TỔNG CHI PHÍ DỰ KIẾN', 
            'B': '', 
            'C': '', 
            'D': totalQuoteExpenses,
            'E': '' 
          })
        } else {
          detailData.push({ 'A': 'Chưa có chi phí dự kiến', 'B': '', 'C': '', 'D': '', 'E': '' })
        }
        detailData.push({ 'A': '', 'B': '', 'C': '', 'D': '', 'E': '' })

        // ===== THỰC TẾ =====
        detailData.push({ 'A': '========== THỰC TẾ - HÓA ĐƠN & CHI PHÍ PHÁT SINH ==========', 'B': '', 'C': '', 'D': '', 'E': '' })
        detailData.push({ 'A': '', 'B': '', 'C': '', 'D': '', 'E': '' })

        // Fetch invoices for this project with items
        let invoicesQuery = supabase
          .from('invoices')
          .select(`
            invoice_number,
            issue_date,
            total_amount,
            payment_status,
            status,
            invoice_items (
              name_product,
              description,
              quantity,
              unit
            )
          `)
          .eq('project_id', project.id)
          .in('status', ['sent', 'paid'])
        
        if (selectedMonth !== 'all') {
          const monthNum = parseInt(selectedMonth)
          const startDate = new Date(selectedYear, monthNum - 1, 1)
          const endDate = new Date(selectedYear, monthNum, 0, 23, 59, 59)
          invoicesQuery = invoicesQuery
            .gte('issue_date', startDate.toISOString())
            .lte('issue_date', endDate.toISOString())
        }
        
        const { data: invoices } = await invoicesQuery

        // Invoices section
        detailData.push({ 'A': 'HÓA ĐƠN (DOANH THU THỰC TẾ)', 'B': '', 'C': '', 'D': '', 'E': '' })
        if (invoices && invoices.length > 0) {
          detailData.push({ 'A': 'Số HĐ', 'B': 'Ngày phát hành', 'C': 'Số tiền (VND)', 'D': 'Trạng thái TT', 'E': 'Sản phẩm' })
          for (const inv of invoices) {
            const items = Array.isArray(inv.invoice_items) ? inv.invoice_items : []
            const productsList = items.map((item: any) => {
              const title = item.name_product || item.description || 'Hạng mục'
              const quantity = item.quantity ?? item.qty ?? 0
              const unit = item.unit ? ` ${item.unit}` : ''
              return `${title} (SL: ${quantity}${unit})`
            }).join(', ')
            detailData.push({
              'A': inv.invoice_number,
              'B': new Date(inv.issue_date).toLocaleDateString('vi-VN'),
              'C': inv.total_amount,
              'D': inv.payment_status === 'paid' ? 'Đã thanh toán' : 
                   inv.payment_status === 'partial' ? 'TT 1 phần' : 'Chưa thanh toán',
              'E': productsList || 'Không có sản phẩm'
            })
          }
          detailData.push({ 
            'A': 'TỔNG DOANH THU THỰC TẾ', 
            'B': '', 
            'C': invoices.reduce((sum, inv) => sum + inv.total_amount, 0), 
            'D': `${invoices.length} hóa đơn`,
            'E': '' 
          })
        } else {
          detailData.push({ 'A': 'Chưa có hóa đơn', 'B': '', 'C': '', 'D': '', 'E': '' })
        }
        detailData.push({ 'A': '', 'B': '', 'C': '', 'D': '', 'E': '' })

        // Fetch expenses for this project with details
        let expensesQuery = supabase
          .from('project_expenses')
          .select('*')
          .eq('project_id', project.id)
        
        if (selectedMonth !== 'all') {
          const monthNum = parseInt(selectedMonth)
          const startDate = new Date(selectedYear, monthNum - 1, 1)
          const endDate = new Date(selectedYear, monthNum, 0, 23, 59, 59)
          expensesQuery = expensesQuery
            .gte('expense_date', startDate.toISOString())
            .lte('expense_date', endDate.toISOString())
        }
        
        const { data: expenses, error: expensesError } = await expensesQuery

        if (expensesError) {
          console.error('Error fetching actual expenses for project', project.project_code, expensesError)
        }

        // Expenses section
        detailData.push({ 'A': 'CHI PHÍ THỰC TẾ (ĐÃ DUYỆT)', 'B': '', 'C': '', 'D': '', 'E': '' })
        if (expenses && expenses.length > 0) {
          detailData.push({ 'A': 'Đối tượng chi phí', 'B': 'Mô tả', 'C': 'Chi tiết vật tư', 'D': 'Thành tiền (VND)', 'E': 'Ngày' })
          
          for (const exp of expenses) {
            const objectName = getExpenseObjectName(exp.expense_object_id)
            const dateText = exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('vi-VN') : 'N/A'
            const itemDetails = Array.isArray(exp.invoice_items)
              ? exp.invoice_items.map((item: any) => {
                  const title = item.name_product || item.description || 'Hạng mục'
                  const quantity = item.quantity ?? item.qty ?? 0
                  const unit = item.unit ? ` ${item.unit}` : ''
                  const price = item.unit_price ?? item.price ?? item.unitPrice
                  const total = item.total_amount ?? item.total ?? item.line_total ?? item.lineTotal
                  const priceText = price ? `, Đơn giá: ${price}` : ''
                  const totalText = total ? `, Thành tiền: ${total}` : ''
                  return `${title} (SL: ${quantity}${unit}${priceText}${totalText})`
                }).join('; ')
              : ''

            detailData.push({
              'A': objectName,
              'B': exp.description || '',
              'C': itemDetails || (exp.expense_object_totals ? 'Có phân bổ vật tư' : ''),
              'D': exp.amount || 0,
              'E': dateText
            })
          }
          
          detailData.push({ 
            'A': 'TỔNG CHI PHÍ THỰC TẾ', 
            'B': '', 
            'C': '', 
            'D': expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
            'E': '' 
          })
        } else {
          detailData.push({ 'A': 'Chưa có chi phí', 'B': '', 'C': '', 'D': '', 'E': '' })
        }
        detailData.push({ 'A': '', 'B': '', 'C': '', 'D': '', 'E': '' })

        // ===== SO SÁNH CHI PHÍ THEO ĐỐI TƯỢNG =====
        detailData.push({ 'A': '========== SO SÁNH CHI PHÍ THEO ĐỐI TƯỢNG ==========', 'B': '', 'C': '', 'D': '', 'E': '' })
        detailData.push({ 'A': '', 'B': '', 'C': '', 'D': '', 'E': '' })

        // Aggregate by expense_object
        const expenseByObject: Record<string, { planned: number; actual: number }> = {}
        
        // From Quote Expenses (Kế hoạch)
        if (quoteExpenses) {
          for (const exp of quoteExpenses) {
            let allocated = false

            if (exp.expense_object_totals && typeof exp.expense_object_totals === 'object') {
              Object.entries(exp.expense_object_totals as Record<string, number>).forEach(([objId, amt]) => {
                const key = getExpenseObjectName(objId)
                if (!expenseByObject[key]) {
                  expenseByObject[key] = { planned: 0, actual: 0 }
                }
                expenseByObject[key].planned += Number(amt) || 0
              })
              allocated = true
            }

            if (!allocated && Array.isArray(exp.invoice_items)) {
              exp.invoice_items.forEach((item: any) => {
                const lineTotal = Number(item.line_total ?? item.total ?? item.lineTotal ?? item.total_amount) || ((Number(item.unit_price ?? item.price ?? item.unitPrice) || 0) * (Number(item.quantity ?? item.qty) || 0))
                const componentsPct = item.components_pct || item.componentsPercent || {}
                if (componentsPct && typeof componentsPct === 'object') {
                  Object.entries(componentsPct as Record<string, number>).forEach(([objId, pct]) => {
                    const key = getExpenseObjectName(objId)
                    if (!expenseByObject[key]) {
                      expenseByObject[key] = { planned: 0, actual: 0 }
                    }
                    expenseByObject[key].planned += Math.round(lineTotal * (Number(pct) || 0) / 100)
                  })
                  allocated = true
                }
              })
            }

            if (!allocated) {
              const key = getExpenseObjectName(exp.expense_object_id)
              if (!expenseByObject[key]) {
                expenseByObject[key] = { planned: 0, actual: 0 }
              }
              expenseByObject[key].planned += Number(exp.amount) || 0
            }
          }
        }

        // From Project Expenses (Thực tế)
        if (expenses) {
          for (const exp of expenses) {
            let allocated = false

            if (exp.expense_object_totals && typeof exp.expense_object_totals === 'object') {
              Object.entries(exp.expense_object_totals as Record<string, number>).forEach(([objId, amt]) => {
                const key = getExpenseObjectName(objId)
                if (!expenseByObject[key]) {
                  expenseByObject[key] = { planned: 0, actual: 0 }
                }
                expenseByObject[key].actual += Number(amt) || 0
              })
              allocated = true
            }

            if (!allocated && Array.isArray(exp.invoice_items)) {
              exp.invoice_items.forEach((item: any) => {
                const lineTotal = Number(item.line_total ?? item.total ?? item.lineTotal ?? item.total_amount) || ((Number(item.unit_price ?? item.price ?? item.unitPrice) || 0) * (Number(item.quantity ?? item.qty) || 0))
                const componentsPct = item.components_pct || item.componentsPercent || {}
                if (componentsPct && typeof componentsPct === 'object') {
                  Object.entries(componentsPct as Record<string, number>).forEach(([objId, pct]) => {
                    const key = getExpenseObjectName(objId)
                    if (!expenseByObject[key]) {
                      expenseByObject[key] = { planned: 0, actual: 0 }
                    }
                    expenseByObject[key].actual += Math.round(lineTotal * (Number(pct) || 0) / 100)
                  })
                  allocated = true
                }
              })
            }

            if (!allocated) {
              const key = getExpenseObjectName(exp.expense_object_id)
              if (!expenseByObject[key]) {
                expenseByObject[key] = { planned: 0, actual: 0 }
              }
              expenseByObject[key].actual += Number(exp.amount) || 0
            }
          }
        }

        detailData.push({ 'A': 'SO SÁNH CHI PHÍ: KẾ HOẠCH VS THỰC TẾ', 'B': '', 'C': '', 'D': '', 'E': '' })
        if (Object.keys(expenseByObject).length > 0) {
          detailData.push({ 'A': 'Đối tượng chi phí', 'B': 'Kế hoạch (VND)', 'C': 'Thực tế (VND)', 'D': 'Chênh lệch (VND)', 'E': '% Biến động' })
          
          for (const [objName, values] of Object.entries(expenseByObject)) {
            const diff = values.actual - values.planned
            const percent = values.planned > 0 ? ((diff / values.planned) * 100).toFixed(1) : '0'
            detailData.push({
              'A': objName,
              'B': values.planned,
              'C': values.actual,
              'D': diff,
              'E': `${percent}%`
            })
          }
          
          const totalPlanned = Object.values(expenseByObject).reduce((sum: number, v) => sum + v.planned, 0)
          const totalActual = Object.values(expenseByObject).reduce((sum: number, v) => sum + v.actual, 0)
          const totalDiff = totalActual - totalPlanned
          const totalPercent = totalPlanned > 0 ? ((totalDiff / totalPlanned) * 100).toFixed(1) : '0'
          
          detailData.push({ 
            'A': 'TỔNG CỘNG', 
            'B': totalPlanned,
            'C': totalActual,
            'D': totalDiff,
            'E': `${totalPercent}%`
          })
        } else {
          detailData.push({ 'A': 'Chưa có dữ liệu so sánh', 'B': '', 'C': '', 'D': '', 'E': '' })
        }

        // Create worksheet for this project
        const projectSheet = XLSX.utils.json_to_sheet(detailData, { skipHeader: true })
        projectSheet['!cols'] = [
          { wch: 30 }, // Column A
          { wch: 18 }, // Column B
          { wch: 35 }, // Column C
          { wch: 20 }, // Column D
          { wch: 15 }  // Column E
        ]

        // Sanitize sheet name (remove invalid characters)
        const sanitizedName = project.project_code.replace(/[:\\\/?*\[\]]/g, '_').substring(0, 31)
        XLSX.utils.book_append_sheet(workbook, projectSheet, sanitizedName)
      }

      // Generate filename
      let fileName: string
      if (selectedMonth !== 'all') {
        const monthStr = selectedMonth.padStart(2, '0')
        fileName = `Bao_cao_du_an_chi_tiet_${selectedYear}_thang_${monthStr}.xlsx`
      } else {
        fileName = `Bao_cao_du_an_chi_tiet_${selectedYear}_tat_ca_thang.xlsx`
      }

      // Download file
      XLSX.writeFile(workbook, fileName)
    } catch (error) {
      console.error('Error downloading Excel:', error)
      alert('Có lỗi xảy ra khi tải xuống file Excel')
    }
  }

  return (
    <LayoutWithSidebar user={user} onLogout={handleLogout}>
      <div className="w-full">
        <StickyTopNav 
          title="Báo cáo Dự án Chi tiết" 
          subtitle="Phân tích chi tiết kế hoạch và thực tế của từng dự án"
        >
          <button
            onClick={startReportListTour}
            disabled={isReportListTourRunning}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Hướng dẫn xem báo cáo"
          >
            <CircleHelp className="h-4 w-4" />
            Hướng dẫn
          </button>
        </StickyTopNav>

        <div className="px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-tour-id="report-summary-cards">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour-id="report-summary-projects">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng dự án</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredProjects.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour-id="report-summary-revenue">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalActualRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour-id="report-summary-costs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng chi phí</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalActualCosts)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour-id="report-summary-profit">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${totalActualProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <TrendingUp className={`h-5 w-5 ${totalActualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lợi nhuận</p>
                  <p className={`text-2xl font-bold ${totalActualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalActualProfit)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6" data-tour-id="report-filters">
            <div className="flex flex-col gap-4">
              {/* Row 1: Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1" data-tour-id="report-filter-search">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm dự án..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="w-full sm:w-48" data-tour-id="report-filter-status">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 font-medium"
                  >
                    {PROJECT_STATUS_FILTER_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Month/Year Selection and Download */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <span className="font-medium">Báo cáo theo tháng:</span>
                </div>

                <div className="w-full sm:w-32" data-tour-id="report-filter-year">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 font-medium"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>Năm {year}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-40" data-tour-id="report-filter-month">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 font-medium"
                  >
                    <option value="all">Tất cả tháng</option>
                    <option value="1">Tháng 1</option>
                    <option value="2">Tháng 2</option>
                    <option value="3">Tháng 3</option>
                    <option value="4">Tháng 4</option>
                    <option value="5">Tháng 5</option>
                    <option value="6">Tháng 6</option>
                    <option value="7">Tháng 7</option>
                    <option value="8">Tháng 8</option>
                    <option value="9">Tháng 9</option>
                    <option value="10">Tháng 10</option>
                    <option value="11">Tháng 11</option>
                    <option value="12">Tháng 12</option>
                  </select>
                </div>

                <div className="flex-1 flex justify-end" data-tour-id="report-filter-download">
                  <button
                    onClick={handleDownloadExcel}
                    disabled={loading || filteredProjects.length === 0}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Download className="h-5 w-5" />
                    Tải Excel ({getMonthYearText()})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200" data-tour-id="report-table">
            <div className="p-6 border-b border-gray-200" data-tour-id="report-list-header">
              <h2 className="text-xl font-semibold text-gray-900">Danh sách dự án</h2>
              <p className="text-gray-600">Click vào dự án để xem báo cáo chi tiết</p>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dự án
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doanh thu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chi phí
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lợi nhuận
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Biên LN
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                <FolderOpen className="h-5 w-5 text-teal-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{project.name}</div>
                              <div className="text-sm text-gray-500">{project.project_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProjectStatusBadgeClass(project.status)}`}>
                            {getProjectStatusLabel(project.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">{formatCurrency(project.actual_revenue)}</div>
                          <div className="text-xs text-gray-500">
                            {project.invoice_count} hóa đơn
                            {project.unpaid_invoice_count > 0 && (
                              <span className="ml-1 text-orange-600 font-semibold">
                                ({project.unpaid_invoice_count} chưa TT)
                              </span>
                            )}
                            {project.partial_invoice_count > 0 && (
                              <span className="ml-1 text-yellow-600 font-semibold">
                                ({project.partial_invoice_count} TT 1 phần)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-red-600">{formatCurrency(project.actual_costs)}</div>
                          <div className="text-xs text-gray-500">{project.expense_count} chi phí</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${project.actual_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(project.actual_profit)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {project.actual_profit >= 0 ? 'Lãi' : 'Lỗ'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${project.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {project.profit_margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            data-tour-id="report-table-action-button"
                            onClick={() => router.push(`/reports/projects-detailed/${project.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Không tìm thấy dự án nào</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  )
}

