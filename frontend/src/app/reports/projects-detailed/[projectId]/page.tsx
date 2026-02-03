'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Calendar, FileSpreadsheet, CircleHelp, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { apiGet } from '@/lib/api'
import { getApiEndpoint } from '@/lib/apiUrl'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import StickyTopNav from '@/components/StickyTopNav'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js'

ChartJS.register(ArcElement, ChartTooltip, ChartLegend)

// Simplified: remove charts and exports for compact, non-flashy view

// Charts removed

interface ProjectDetail {
  id: string
  project_code: string
  name: string
  description: string
  customer_name: string
  status: string
  start_date: string
  end_date: string
  budget: number
}

interface QuoteLineItem {
  id: string
  name_product?: string | null
  description?: string | null
  quantity?: number | null
  unit?: string | null
}

interface QuoteItem {
  id: string
  quote_number: string
  description: string
  total_amount: number
  status: string
  created_at: string
  quote_items?: QuoteLineItem[]
}

interface InvoiceLineItem {
  id: string
  name_product?: string
  description?: string
  quantity: number
  unit?: string
}

interface InvoiceItem {
  id: string
  invoice_number: string
  description: string
  total_amount: number
  status: string
  payment_status: string
  due_date: string
  created_at: string
  invoice_items?: InvoiceLineItem[]
}

interface ExpenseItem {
  id: string
  expense_code: string
  description: string
  amount: number
  status: string
  expense_date: string
  category?: string
  department_id?: string
  employee_id?: string
}

interface ExpenseComparison {
  category: string
  department: string
  planned: number
  actual: number
  variance: number
  variance_percent: number
  status: 'over_budget' | 'under_budget' | 'on_budget'
  responsible_party: string
  note: string
}

export default function ProjectDetailedReportDetailPage() {
  const params = useParams()
  // Extract projectId immediately to avoid direct params access
  // Extract projectId immediately to avoid direct params access - destructure to prevent enumeration
  const { projectId: paramProjectId } = params || {}
  const projectId = (paramProjectId ?? '') as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Project data
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [expenseQuotes, setExpenseQuotes] = useState<any[]>([])
  const [employees, setEmployees] = useState<Map<string, string>>(new Map())
  const [expenseObjectNames, setExpenseObjectNames] = useState<Map<string, string>>(new Map())
  const [showExpenseObjectDetails, setShowExpenseObjectDetails] = useState<boolean>(true)
  const [payments, setPayments] = useState<any[]>([])

  // Tour state
  const REPORT_DETAIL_TOUR_STORAGE_KEY = 'report-detail-tour-status-v1'
  const [isReportDetailTourRunning, setIsReportDetailTourRunning] = useState(false)
  const reportDetailTourRef = useRef<any>(null)
  const reportDetailShepherdRef = useRef<any>(null)
  const reportDetailTourAutoStartAttemptedRef = useRef(false)
  type ReportDetailShepherdModule = typeof import('shepherd.js')
  type ReportDetailShepherdType = ReportDetailShepherdModule & { Tour: new (...args: any[]) => any }
  type ReportDetailShepherdTour = InstanceType<ReportDetailShepherdType['Tour']>

  useEffect(() => {
    checkUser()
    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

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

  const fetchProjectData = async () => {
    setLoading(true)
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          project_code,
          name,
          description,
          status,
          start_date,
          end_date,
          budget,
          customers!inner(name)
        `)
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError

      const customerName = Array.isArray(projectData.customers) 
        ? projectData.customers[0]?.name 
        : (projectData.customers as any)?.name || 'N/A'

      setProject({
        ...projectData,
        customer_name: customerName
      })

      // Fetch quotes (planned revenue - chỉ để so sánh)
      const { data: quotesData } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            id,
            name_product,
            description,
            quantity,
            unit
          )
        `)
        .eq('project_id', projectId)
        .neq('status', 'rejected')
        .order('created_at', { ascending: false })

      setQuotes(quotesData || [])

      // Fetch invoices (actual revenue - dùng tính lợi nhuận)
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (
            id,
            name_product,
            description,
            quantity,
            unit
          )
        `)
        .eq('project_id', projectId)
        .in('status', ['sent', 'paid'])  // sent = đã gửi, paid = đã thanh toán
        .order('created_at', { ascending: false })
      
      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError)
      }

      setInvoices(invoicesData || [])

      // Fetch payment history for this project
      try {
        const paymentsData = await apiGet(getApiEndpoint(`/api/sales/payment-methods/projects/${projectId}/payments`))
        if (paymentsData && Array.isArray(paymentsData)) {
          // Sort by date (newest first)
          const sortedPayments = paymentsData.sort((a: any, b: any) => 
            new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
          )
          setPayments(sortedPayments)
        }
      } catch (error) {
        console.error('Error fetching payment history:', error)
        setPayments([])
      }

       // Fetch project expenses (actual costs - dùng tính lợi nhuận)
       const { data: projectExpensesData } = await supabase
         .from('project_expenses')
         .select('*')
         .eq('project_id', projectId)
         .eq('status', 'approved')
         .order('expense_date', { ascending: false })

      setExpenses(projectExpensesData || [])

      // Fetch project expense quotes (planned costs - dùng so sánh)
      const { data: projectExpenseQuotesData } = await supabase
        .from('project_expenses_quote')
        .select('*')
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false })

      setExpenseQuotes(projectExpenseQuotesData || [])

      // Fetch expense objects for name mapping
      const { data: expenseObjectsRows } = await supabase
        .from('expense_objects')
        .select('id, name')

      if (Array.isArray(expenseObjectsRows)) {
        const map = new Map<string, string>()
        expenseObjectsRows.forEach((r: any) => {
          if (r?.id) map.set(r.id, r.name || '')
        })
        setExpenseObjectNames(map)
      }

      // Resolve employee full names via employees.user_id -> users.full_name
      const employeeIds = Array.from(new Set([
        ...(projectExpensesData || []).map((e: any) => e.employee_id).filter(Boolean),
        ...(projectExpenseQuotesData || []).map((e: any) => e.employee_id).filter(Boolean),
      ])) as string[]

      if (employeeIds.length > 0) {
        const { data: empRows } = await supabase
          .from('employees')
          .select('id, user_id')
          .in('id', employeeIds)

        if (empRows && empRows.length > 0) {
          const userIds = Array.from(new Set(empRows.map((r: any) => r.user_id).filter(Boolean))) as string[]
          if (userIds.length > 0) {
            const { data: userRows } = await supabase
              .from('users')
              .select('id, full_name')
              .in('id', userIds)

            if (userRows) {
              const map = new Map<string, string>()
              // Build map from employee_id -> user.full_name
              empRows.forEach((emp: any) => {
                const user = userRows.find((u: any) => u.id === emp.user_id)
                if (user?.full_name) {
                  map.set(emp.id, user.full_name)
                }
              })
              setEmployees(map)
            }
          }
        }
      }

     } catch (error) {
      console.error('Error fetching project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Tour function
  const startReportDetailTour = useCallback(async () => {
    if (typeof window === 'undefined') return

    if (reportDetailTourRef.current) {
      reportDetailTourRef.current.cancel()
      reportDetailTourRef.current = null
    }

    if (!reportDetailShepherdRef.current) {
      try {
        const module = await import('shepherd.js')
        const shepherdInstance = (module as unknown as { default?: ReportDetailShepherdType })?.default ?? (module as unknown as ReportDetailShepherdType)
        reportDetailShepherdRef.current = shepherdInstance
      } catch (error) {
        console.error('Failed to load Shepherd.js', error)
        return
      }
    }

    const Shepherd = reportDetailShepherdRef.current
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

    await waitForElement('[data-tour-id="report-detail-page-header"]')
    await waitForElement('[data-tour-id="report-detail-summary"]')
    await waitForElement('[data-tour-id="report-detail-summary-quotes"]')
    await waitForElement('[data-tour-id="report-detail-summary-invoices"]')
    await waitForElement('[data-tour-id="report-detail-summary-expenses"]')
    await waitForElement('[data-tour-id="report-detail-summary-profit"]')
    await waitForElement('[data-tour-id="report-detail-plan-vs-actual"]')
    await waitForElement('[data-tour-id="report-detail-plan-overview"]')
    await waitForElement('[data-tour-id="report-detail-plan-quotes"]')
    await waitForElement('[data-tour-id="report-detail-plan-costs"]')
    await waitForElement('[data-tour-id="report-detail-plan-profit"]')
    await waitForElement('[data-tour-id="report-detail-actual-overview"]')
    await waitForElement('[data-tour-id="report-detail-actual-invoices"]')
    await waitForElement('[data-tour-id="report-detail-actual-expenses"]')
    await waitForElement('[data-tour-id="report-detail-actual-profit"]')
    await waitForElement('[data-tour-id="report-detail-analysis"]')
    await waitForElement('[data-tour-id="report-detail-expense-lists"]')
    await waitForElement('[data-tour-id="report-detail-planned-list"]')
    await waitForElement('[data-tour-id="report-detail-actual-list"]')
    await waitForElement('[data-tour-id="report-detail-planned-total"]')
    await waitForElement('[data-tour-id="report-detail-actual-total"]')
    await waitForElement('[data-tour-id="report-detail-charts"]')
    await waitForElement('[data-tour-id="report-chart-revenue-expense-profit"]')
    await waitForElement('[data-tour-id="report-chart-expense-objects"]')
    await waitForElement('[data-tour-id="report-detail-summary-section"]')
    await waitForElement('[data-tour-id="report-summary-total-revenue"]')
    await waitForElement('[data-tour-id="report-summary-total-cost"]')
    await waitForElement('[data-tour-id="report-summary-net-profit"]')
    await waitForElement('[data-tour-id="report-summary-total-quotes"]')
    await waitForElement('[data-tour-id="report-summary-variance"]')
    await waitForElement('[data-tour-id="report-detail-expense-objects"]')

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'bg-white rounded-xl shadow-xl border border-gray-100',
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    })

    tour.addStep({
      id: 'report-detail-intro',
      title: 'Báo cáo chi tiết dự án',
      text: 'Trang này tổng hợp toàn bộ dữ liệu tài chính của dự án: kế hoạch, thực tế, phân tích chênh lệch và danh sách chi phí.',
      attachTo: { element: '[data-tour-id="report-detail-page-header"]', on: 'bottom' },
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
      id: 'report-detail-summary-intro',
      title: 'Khu vực tóm tắt',
      text: 'Các thẻ dưới đây giúp bạn nắm nhanh tình hình chung của dự án. Tiếp tục để xem từng chỉ số cụ thể.',
      attachTo: { element: '[data-tour-id="report-detail-summary"]', on: 'bottom' },
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
      id: 'report-detail-summary-quotes',
      title: 'Tổng báo giá',
      text: 'Tổng giá trị các báo giá (doanh thu dự kiến) và số lượng báo giá đã lập cho dự án.',
      attachTo: { element: '[data-tour-id="report-detail-summary-quotes"]', on: 'bottom' },
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
      id: 'report-detail-summary-invoices',
      title: 'Tổng đơn hàng',
      text: 'Tổng doanh thu thực tế từ đơn hàng đã phát hành và số lượng đơn hàng. Có cảnh báo cho đơn hàng chưa thanh toán.',
      attachTo: { element: '[data-tour-id="report-detail-summary-invoices"]', on: 'bottom' },
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
      id: 'report-detail-summary-expenses',
      title: 'Tổng chi phí',
      text: 'Tổng chi phí thực tế đã duyệt cùng số lượng khoản chi. Báo cáo lấy dữ liệu từ bảng Chi phí Dự án.',
      attachTo: { element: '[data-tour-id="report-detail-summary-expenses"]', on: 'bottom' },
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
      id: 'report-detail-summary-profit',
      title: 'Lợi nhuận thực tế',
      text: 'Lợi nhuận = Tổng đơn hàng - Tổng chi phí. Biên lợi nhuận (%) giúp đánh giá hiệu quả dự án.',
      attachTo: { element: '[data-tour-id="report-detail-summary-profit"]', on: 'bottom' },
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
      id: 'report-detail-plan-overview',
      title: 'Cột Kế hoạch',
      text: 'Cột bên trái biểu diễn dữ liệu kế hoạch (màu xanh dương) gồm doanh thu dự kiến và chi phí dự kiến.',
      attachTo: { element: '[data-tour-id="report-detail-plan-overview"]', on: 'top' },
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
      id: 'report-detail-plan-quotes',
      title: 'Báo giá (Kế hoạch)',
      text: 'Danh sách các báo giá của dự án, bao gồm mô tả, sản phẩm và trạng thái. Dùng để theo dõi doanh thu dự kiến.',
      attachTo: { element: '[data-tour-id="report-detail-plan-quotes"]', on: 'top' },
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
      id: 'report-detail-plan-costs',
      title: 'Chi phí dự kiến',
      text: 'Liệt kê các chi phí kế hoạch, nhân sự phụ trách và phòng ban. Tổng số tiền hiển thị ở góc phải.',
      attachTo: { element: '[data-tour-id="report-detail-plan-costs"]', on: 'top' },
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
      id: 'report-detail-plan-profit',
      title: 'Lợi nhuận dự kiến',
      text: 'Tổng lợi nhuận dự kiến dựa trên kế hoạch (Báo giá - Chi phí dự kiến).',
      attachTo: { element: '[data-tour-id="report-detail-plan-profit"]', on: 'top' },
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
      id: 'report-detail-actual-overview',
      title: 'Cột Thực tế',
      text: 'Cột bên phải (màu xanh lá) thể hiện dữ liệu thực tế phát sinh: đơn hàng đã lập và chi phí đã duyệt.',
      attachTo: { element: '[data-tour-id="report-detail-actual-overview"]', on: 'top' },
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
      id: 'report-detail-actual-invoices',
      title: 'Đơn hàng thực tế',
      text: 'Danh sách đơn hàng đã phát hành, trạng thái thanh toán và sản phẩm chi tiết. Sử dụng để đối chiếu doanh thu.',
      attachTo: { element: '[data-tour-id="report-detail-actual-invoices"]', on: 'top' },
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
      id: 'report-detail-actual-expenses',
      title: 'Chi phí thực tế',
      text: 'Chi tiết từng khoản chi thực tế đã duyệt, kèm nhân sự, phòng ban và cảnh báo vượt kế hoạch.',
      attachTo: { element: '[data-tour-id="report-detail-actual-expenses"]', on: 'top' },
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
      id: 'report-detail-actual-profit',
      title: 'Lợi nhuận thực tế',
      text: 'Tính toán lợi nhuận thực tế và chênh lệch so với kế hoạch để đánh giá hiệu quả dự án.',
      attachTo: { element: '[data-tour-id="report-detail-actual-profit"]', on: 'top' },
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
      id: 'report-detail-analysis',
      title: 'Bảng phân tích chi phí',
      text: 'Bảng so sánh chi tiết từng đối tượng chi phí giữa kế hoạch và thực tế, kèm phần trăm biến động và ghi chú.',
      attachTo: { element: '[data-tour-id="report-detail-analysis"]', on: 'top' },
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
      id: 'report-detail-expense-lists',
      title: 'Danh sách chi phí',
      text: 'Phần dưới hiển thị toàn bộ chi phí kế hoạch và chi phí thực tế đã duyệt để bạn rà soát chi tiết từng khoản.',
      attachTo: { element: '[data-tour-id="report-detail-expense-lists"]', on: 'top' },
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
      id: 'report-detail-planned-list',
      title: 'Chi phí kế hoạch',
      text: 'Danh sách các khoản chi kế hoạch đã duyệt, kèm mô tả, nhân sự, phòng ban và ghi chú.',
      attachTo: { element: '[data-tour-id="report-detail-planned-list"]', on: 'top' },
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
      id: 'report-detail-planned-total',
      title: 'Tổng chi phí kế hoạch',
      text: 'Tổng số tiền của toàn bộ chi phí kế hoạch đã duyệt để so sánh với thực tế.',
      attachTo: { element: '[data-tour-id="report-detail-planned-total"]', on: 'left' },
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
      id: 'report-detail-actual-list',
      title: 'Chi phí thực tế',
      text: 'Danh sách chi phí thực tế đã phát sinh, bao gồm trạng thái, nhân sự phụ trách và cảnh báo vượt kế hoạch.',
      attachTo: { element: '[data-tour-id="report-detail-actual-list"]', on: 'top' },
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
      id: 'report-detail-actual-total',
      title: 'Tổng chi phí thực tế',
      text: 'Tổng số tiền chi phí thực tế để đối chiếu với kế hoạch và lợi nhuận.',
      attachTo: { element: '[data-tour-id="report-detail-actual-total"]', on: 'left' },
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
      id: 'report-detail-charts-intro',
      title: 'Biểu đồ trực quan',
      text: 'Hai biểu đồ tròn giúp bạn hiểu rõ hơn về tài chính dự án. Tiếp tục để xem từng biểu đồ.',
      attachTo: { element: '[data-tour-id="report-detail-charts"]', on: 'top' },
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
      id: 'report-chart-revenue-expense-profit',
      title: 'Biểu đồ: Doanh thu – Chi phí – Lợi nhuận',
      text: 'Biểu đồ này hiển thị tỷ lệ giữa doanh thu, chi phí và lợi nhuận thực tế:\n\n• Màu xanh dương = Doanh thu (từ đơn hàng)\n• Màu đỏ = Chi phí (đã duyệt)\n• Màu xanh lá = Lợi nhuận (chênh lệch)\n\nDi chuột vào từng phần để xem số tiền chi tiết. Biểu đồ giúp bạn nhanh chóng đánh giá tỷ lệ giữa các thành phần tài chính.',
      attachTo: { element: '[data-tour-id="report-chart-revenue-expense-profit"]', on: 'bottom' },
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
      id: 'report-chart-expense-objects',
      title: 'Biểu đồ: Theo đối tượng chi phí',
      text: 'Biểu đồ này phân bổ chi phí theo từng đối tượng chi phí:\n\n• Mỗi màu đại diện cho một đối tượng chi phí (Vật liệu, Nhân công, Vận chuyển, ...)\n• Kích thước phần biểu đồ tỷ lệ với số tiền chi phí\n• Giúp xác định đối tượng nào chiếm tỷ trọng lớn nhất\n\nDi chuột vào từng phần để xem tên đối tượng và số tiền chi tiết.',
      attachTo: { element: '[data-tour-id="report-chart-expense-objects"]', on: 'bottom' },
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
      id: 'report-detail-summary-section-intro',
      title: 'Tóm tắt Báo cáo',
      text: 'Phần này tổng hợp các chỉ số quan trọng của dự án. Tiếp tục để xem từng chỉ số cụ thể.',
      attachTo: { element: '[data-tour-id="report-detail-summary-section"]', on: 'top' },
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
      id: 'report-summary-total-revenue',
      title: 'Tổng Doanh thu',
      text: 'Tổng số tiền từ các đơn hàng đã phát hành (doanh thu thực tế). Hiển thị số lượng đơn hàng đã tạo.',
      attachTo: { element: '[data-tour-id="report-summary-total-revenue"]', on: 'bottom' },
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
      id: 'report-summary-total-cost',
      title: 'Tổng Chi phí',
      text: 'Tổng số tiền chi phí đã duyệt. Hiển thị số lượng khoản chi phí đã phát sinh.',
      attachTo: { element: '[data-tour-id="report-summary-total-cost"]', on: 'bottom' },
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
      id: 'report-summary-net-profit',
      title: 'Lợi nhuận ròng',
      text: 'Chênh lệch giữa doanh thu và chi phí. Biên lợi nhuận (%) = (Lợi nhuận / Doanh thu) × 100.\n\nMàu xanh = Lãi, Màu đỏ = Lỗ',
      attachTo: { element: '[data-tour-id="report-summary-net-profit"]', on: 'bottom' },
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
      id: 'report-summary-total-quotes',
      title: 'Tổng báo giá',
      text: 'Tổng số tiền từ các báo giá (doanh thu dự kiến). Dùng để so sánh với doanh thu thực tế từ đơn hàng.',
      attachTo: { element: '[data-tour-id="report-summary-total-quotes"]', on: 'bottom' },
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
      id: 'report-summary-variance',
      title: 'Chênh lệch',
      text: 'Chênh lệch giữa doanh thu và chi phí (tổng quan). Công thức: Doanh thu - Chi phí.\n\nGiúp đánh giá nhanh tình hình tài chính của dự án.',
      attachTo: { element: '[data-tour-id="report-summary-variance"]', on: 'bottom' },
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
      id: 'report-detail-expense-objects',
      title: 'Chi phí theo Đối tượng',
      text: 'Bảng này so sánh chi phí kế hoạch và thực tế theo từng đối tượng chi phí:\n\n• Đối tượng: Tên đối tượng chi phí (Vật liệu, Nhân công, Vận chuyển, ...)\n• Kế hoạch: Số tiền dự kiến cho đối tượng này\n• Thực tế: Số tiền đã chi thực tế\n• Chênh lệch: Số tiền chênh lệch (dương = vượt, âm = tiết kiệm)\n• %: Phần trăm chênh lệch\n\nMàu đỏ = Vượt kế hoạch, Màu xanh = Tiết kiệm\n\nBạn có thể nhấn nút "Ẩn"/"Hiện" để ẩn/hiện bảng này.',
      attachTo: { element: '[data-tour-id="report-detail-expense-objects"]', on: 'top' },
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
      setIsReportDetailTourRunning(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem(REPORT_DETAIL_TOUR_STORAGE_KEY, 'completed')
      }
      reportDetailTourRef.current = null
    })

    tour.on('cancel', () => {
      setIsReportDetailTourRunning(false)
      reportDetailTourRef.current = null
    })

    reportDetailTourRef.current = tour
    setIsReportDetailTourRunning(true)
    tour.start()
  }, [])

  // Auto-start tour
  useEffect(() => {
    if (typeof window === 'undefined' || reportDetailTourAutoStartAttemptedRef.current) return

    const hasCompletedTour = localStorage.getItem(REPORT_DETAIL_TOUR_STORAGE_KEY) === 'completed'
    if (hasCompletedTour) {
      reportDetailTourAutoStartAttemptedRef.current = true
      return
    }

    if (!loading && project) {
      reportDetailTourAutoStartAttemptedRef.current = true
      setTimeout(() => {
        startReportDetailTour()
      }, 800)
    }
  }, [loading, project, startReportDetailTour])

  // Cleanup tour on unmount
  useEffect(() => {
    return () => {
      if (reportDetailTourRef.current) {
        reportDetailTourRef.current.cancel()
        reportDetailTourRef.current = null
      }
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }


  const handleExportToExcel = () => {
    if (!project) return
    
    const reportData = {
      project: {
        name: project.name,
        project_code: project.project_code,
        customer_name: project.customer_name,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date
      },
      summary: {
        totalQuotes,
        totalInvoices,
        totalExpenses,
        actualProfit,
        profitMargin: totalInvoices > 0 ? (actualProfit / totalInvoices) * 100 : 0,
        unpaidInvoices: invoices.filter(i => i.payment_status === 'pending').length,
        partialInvoices: invoices.filter(i => i.payment_status === 'partial').length,
        plannedCosts: totalExpenseQuotes
      },
      invoices: invoices.map(inv => ({
        invoice_number: inv.invoice_number,
        description: inv.description || '',
        total_amount: inv.total_amount,
        status: inv.status,
        payment_status: inv.payment_status,
        created_at: inv.created_at
      })),
      expenses: expenses.map(exp => ({
        expense_code: exp.expense_code || '',
        description: exp.description || '',
        amount: exp.amount,
        status: exp.status,
        expense_date: exp.expense_date
      })),
      quotes: quotes.map(q => ({
        quote_number: q.quote_number,
        description: q.description || '',
        total_amount: q.total_amount,
        status: q.status,
        created_at: q.created_at
      })),
      expenseComparison: expenseComparison.map(item => ({
        category: item.category,
        department: item.department,
        planned: item.planned,
        actual: item.actual,
        variance: item.variance,
        variance_percent: item.variance_percent,
        status: item.status,
        responsible_party: item.responsible_party,
        note: item.note
      }))
    }
    
    // Export disabled for compact view
    return
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'paid': 'bg-blue-100 text-blue-800',
      'sent': 'bg-purple-100 text-purple-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'draft': 'Nháp',
      'pending': 'Chờ duyệt',
      'approved': 'Đã duyệt',
      'rejected': 'Từ chối',
      'paid': 'Đã thanh toán',
      'sent': 'Đã gửi'
    }
    return texts[status] || status
  }

  const getPaymentStatusText = (paymentStatus: string) => {
    const texts: { [key: string]: string } = {
      'pending': 'Chưa thanh toán',
      'partial': 'Thanh toán 1 phần',
      'paid': 'Đã thanh toán'
    }
    return texts[paymentStatus] || paymentStatus
  }

  const getPaymentStatusColor = (paymentStatus: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-orange-100 text-orange-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800'
    }
    return colors[paymentStatus] || 'bg-gray-100 text-gray-800'
  }

  // Calculate totals
  // KẾ HOẠCH (chỉ để hiển thị so sánh)
  const totalQuotes = quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0)
  const totalExpenseQuotes = expenseQuotes.filter((eq: any) => eq.status === 'approved').reduce((sum, eq) => sum + (eq.amount || 0), 0) // Chỉ tính chi phí đã duyệt
  const plannedProfit = totalQuotes - totalExpenseQuotes
  
  // THỰC TẾ (dùng để tính lợi nhuận cuối)
  const totalInvoices = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const actualProfit = totalInvoices - totalExpenses  // Lợi nhuận = Đơn hàng - Chi phí dự án
  
  const profitVariance = actualProfit - plannedProfit

  // Efficiency and management cost adjustment
  const normalizeLower = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  // Detect management expense object ids by name contains 'quản lý'
  const managementObjectIds = useMemo(() => {
    const ids: string[] = []
    expenseObjectNames.forEach((name, id) => {
      const n = normalizeLower(name || '')
      if (n.includes('quan ly')) ids.push(id)
    })
    return ids
  }, [expenseObjectNames])

  // Planned management cost from project_expenses_quote (approved):
  // Prefer expense_object_totals for management ids, else components_pct per invoice item, else fallback expense_object_id match
  const approvedPlannedManagementCost = useMemo(() => {
    if (!managementObjectIds || managementObjectIds.length === 0) return 0
    let total = 0
    ;((expenseQuotes || []) as any[])
      .filter((eq: any) => eq.status === 'approved')
      .forEach((eq: any) => {
        let added = false
        // 1) Direct totals per object
        if (eq.expense_object_totals && typeof eq.expense_object_totals === 'object') {
          managementObjectIds.forEach((mId) => {
            if (mId in eq.expense_object_totals) {
              total += Number((eq.expense_object_totals as any)[mId]) || 0
              added = true
            }
          })
        }
        // 2) Components % per line item
        if (!added && Array.isArray(eq.invoice_items)) {
          eq.invoice_items.forEach((it: any) => {
            const lineTotal = Number(it.line_total ?? it.total ?? it.lineTotal) || ((Number(it.unit_price ?? it.price ?? it.unitPrice) || 0) * (Number(it.quantity ?? it.qty) || 0))
            const componentsPct = it.components_pct || {}
            if (componentsPct && typeof componentsPct === 'object') {
              managementObjectIds.forEach((mId) => {
                const pct = Number((componentsPct as any)[mId]) || 0
                if (pct > 0) {
                  total += Math.round(lineTotal * pct / 100)
                  added = true
                }
              })
            }
          })
        }
        // 3) Fallback: entire eq.amount belongs to management if its expense_object_id is management
        if (!added && eq.expense_object_id && managementObjectIds.includes(eq.expense_object_id)) {
          total += Number(eq.amount) || 0
        }
      })
    return total
  }, [expenseQuotes, managementObjectIds])
  const efficiencyRatio = plannedProfit > 0 ? (actualProfit / plannedProfit) : 0

  // SO SÁNH CHI PHÍ THEO DANH MỤC (Thực tế vs Kế hoạch)
  const expenseComparison: ExpenseComparison[] = useMemo(() => {
    // Group PLANNED costs by category (từ project_expenses_quote)
    const plannedMap = new Map<string, { 
      amount: number
      department: string
      employees: Set<string>
    }>()
    
    // Only include APPROVED planned quotes
    const approvedPlanned = (expenseQuotes || []).filter((eq: any) => eq.status === 'approved')
    approvedPlanned.forEach(eq => {
      const category = eq.description?.split(' ')[0] || 'Khác'
      const current = plannedMap.get(category) || { 
        amount: 0, 
        department: 'Chưa xác định',
        employees: new Set()
      }
      
      current.amount += eq.amount || 0
      
      // Get department info from department_id
      if (eq.department_id) {
        current.department = `Department ${eq.department_id}`
      }
       if (eq.employee_id) {
         current.employees.add(employees.get(eq.employee_id) || `Employee ${eq.employee_id}`)
       }
      
      plannedMap.set(category, current)
    })
    
    // Group ACTUAL costs by category (từ project_expenses)
    const actualMap = new Map<string, { 
      amount: number
      department: string
      employees: Set<string>
    }>()
    
    expenses.forEach(exp => {
      const category = exp.description?.split(' ')[0] || 'Khác'
      const current = actualMap.get(category) || { 
        amount: 0, 
        department: 'Chưa xác định',
        employees: new Set()
      }
      
      current.amount += exp.amount || 0
      
      // Get department info from department_id
      if (exp.department_id) {
        current.department = `Department ${exp.department_id}`
      }
       if (exp.employee_id) {
         current.employees.add(employees.get(exp.employee_id) || `Employee ${exp.employee_id}`)
       }
      
      actualMap.set(category, current)
    })
    
    // Compare categories that exist in approved planned OR actual expenses
    const allCategories = new Set([...plannedMap.keys(), ...actualMap.keys()])
    
    const comparisons: ExpenseComparison[] = []
    
    allCategories.forEach(category => {
      const plannedData = plannedMap.get(category) || { amount: 0, department: 'Chưa xác định', employees: new Set() }
      const actualData = actualMap.get(category) || { amount: 0, department: 'Chưa xác định', employees: new Set() }
      
      const planned = plannedData.amount
      const actual = actualData.amount
      const variance = actual - planned
      const variance_percent = planned > 0 ? (variance / planned) * 100 : 0
      
      // Skip if both planned and actual are 0
      if (planned === 0 && actual === 0) {
        return
      }
      
      // Use department from actual if available, otherwise from planned
      const department = actualData.department !== 'Chưa xác định' 
        ? actualData.department 
        : plannedData.department
      
      let status: 'over_budget' | 'under_budget' | 'on_budget' = 'on_budget'
      let responsible_party = department
      let note = 'Đúng kế hoạch'
      
      if (planned === 0) {
        // Có chi phí thực tế nhưng không có kế hoạch
        status = 'over_budget'
        responsible_party = `${department} (Chi phí ngoài kế hoạch)`
        note = `Chi phí phát sinh ${formatCurrency(actual)} - Không có trong kế hoạch ban đầu`
      } else if (actual === 0) {
        // Có kế hoạch nhưng chưa chi
        status = 'under_budget'
        responsible_party = `${department} (Chưa thực hiện)`
        note = `Chưa phát sinh chi phí - Kế hoạch ${formatCurrency(planned)}`
      } else if (Math.abs(variance_percent) >= 5) {
        if (variance > 0) {
          status = 'over_budget'
          responsible_party = `${department} (Chịu trách nhiệm vượt chi)`
          note = `Vượt chi ${formatCurrency(variance)} - Bộ phận chịu trách nhiệm giải trình`
        } else {
          status = 'under_budget'
          responsible_party = `${department} (Được hưởng phần tiết kiệm)`
          note = `Tiết kiệm ${formatCurrency(Math.abs(variance))} - Được hưởng phần dư`
        }
      }
      
      comparisons.push({
        category,
        department,
        planned,
        actual,
        variance,
        variance_percent,
        status,
        responsible_party,
        note
      })
    })
    
    return comparisons.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
   }, [expenses, expenseQuotes, employees])

  // Approved planned maps for per-item badge logic
  const approvedPlannedQuotes = useMemo(() => (expenseQuotes || []).filter((eq: any) => eq.status === 'approved'), [expenseQuotes])
  const approvedPlannedTotal = useMemo(() => approvedPlannedQuotes.reduce((sum: number, eq: any) => sum + (eq.amount || 0), 0), [approvedPlannedQuotes])
  const plannedByDescription = useMemo(() => {
    const map = new Map<string, number>()
    approvedPlannedQuotes.forEach((eq: any) => {
      const key = (eq.description || '').trim().toLowerCase()
      if (!key) return
      map.set(key, (map.get(key) || 0) + (eq.amount || 0))
    })
    return map
  }, [approvedPlannedQuotes])
  const plannedByCategoryToken = useMemo(() => {
    const map = new Map<string, number>()
    approvedPlannedQuotes.forEach((eq: any) => {
      const token = ((eq.description || '').trim().toLowerCase().split(' ')[0]) || 'khác'
      map.set(token, (map.get(token) || 0) + (eq.amount || 0))
    })
    return map
  }, [approvedPlannedQuotes])
  const getPlannedAmountForExpense = (desc?: string) => {
    const key = (desc || '').trim().toLowerCase()
    if (key && plannedByDescription.has(key)) return plannedByDescription.get(key) || 0
    const token = (key.split(' ')[0]) || 'khác'
    return plannedByCategoryToken.get(token) || 0
  }

  // Chart data for comparison
  const comparisonChartData = {
    labels: ['Doanh thu', 'Chi phí', 'Lợi nhuận'],
    datasets: [
      {
        label: 'Kế hoạch',
        data: [totalQuotes, totalExpenseQuotes, plannedProfit],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Thực tế',
        data: [totalInvoices, totalExpenses, actualProfit],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      }
    ]
  }

  // Pie chart for revenue-expense-profit breakdown
  const revenueExpenseProfitPieData = {
    labels: ['Doanh thu', 'Chi phí', 'Lợi nhuận'],
    datasets: [{
      data: [totalInvoices, totalExpenses, actualProfit],
      backgroundColor: [
        'rgba(59, 130, 246, 0.6)',   // revenue - blue
        'rgba(239, 68, 68, 0.6)',    // expense - red
        'rgba(16, 185, 129, 0.6)'    // profit  - green
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(239, 68, 68)',
        'rgb(16, 185, 129)'
      ],
      borderWidth: 1
    }]
  }

  // Pie chart for expense breakdown by category
  const expenseCategories = expenses.reduce((acc, expense) => {
    const category = expense.category || 'other'
    acc[category] = (acc[category] || 0) + expense.amount
    return acc
  }, {} as { [key: string]: number })

  // Expense breakdown by expense object (actual): supports invoice_items.components_pct and expense_object_totals
  const expenseByObject = useMemo(() => {
    const totals: { [key: string]: number } = {}
    ;(expenses || []).forEach((exp: any) => {
      let allocated = false
      // 1) Use explicit totals if provided
      if (exp.expense_object_totals && typeof exp.expense_object_totals === 'object') {
        Object.entries(exp.expense_object_totals as Record<string, number>).forEach(([objId, amt]) => {
          const key = objId || 'khac'
          totals[key] = (totals[key] || 0) + (Number(amt) || 0)
        })
        allocated = true
      }
      // 2) Use per-item components_pct if present
      if (!allocated && Array.isArray(exp.invoice_items)) {
        exp.invoice_items.forEach((it: any) => {
          const lineTotal = Number(it.line_total ?? it.total ?? it.lineTotal) || ((Number(it.unit_price ?? it.price ?? it.unitPrice) || 0) * (Number(it.quantity ?? it.qty) || 0))
          const componentsPct = it.components_pct || {}
          if (componentsPct && typeof componentsPct === 'object') {
            Object.entries(componentsPct as Record<string, number>).forEach(([objId, pct]) => {
              const allocation = Math.round(lineTotal * (Number(pct) || 0) / 100)
              const key = objId || 'khac'
              totals[key] = (totals[key] || 0) + allocation
            })
            allocated = true
          }
        })
      }
      // 3) Fallback: single expense_object_id amount
      if (!allocated) {
        const key = exp.expense_object_id || 'khac'
        totals[key] = (totals[key] || 0) + (Number(exp.amount) || 0)
      }
    })
    return totals
  }, [expenses])

  // Planned by expense object (from project_expenses_quote): supports invoice_items.components_pct and expense_object_totals
  const plannedByObject = useMemo(() => {
    const totals: { [key: string]: number } = {}
    ;((expenseQuotes || []) as any[])
      .filter((eq: any) => eq.status === 'approved')
      .forEach((eq: any) => {
        let allocated = false
        if (eq.expense_object_totals && typeof eq.expense_object_totals === 'object') {
          Object.entries(eq.expense_object_totals as Record<string, number>).forEach(([objId, amt]) => {
            const key = objId || 'khac'
            totals[key] = (totals[key] || 0) + (Number(amt) || 0)
          })
          allocated = true
        }
        if (!allocated && Array.isArray(eq.invoice_items)) {
          eq.invoice_items.forEach((it: any) => {
            const lineTotal = Number(it.line_total ?? it.total ?? it.lineTotal) || ((Number(it.unit_price ?? it.price ?? it.unitPrice) || 0) * (Number(it.quantity ?? it.qty) || 0))
            const componentsPct = it.components_pct || {}
            if (componentsPct && typeof componentsPct === 'object') {
              Object.entries(componentsPct as Record<string, number>).forEach(([objId, pct]) => {
                const allocation = Math.round(lineTotal * (Number(pct) || 0) / 100)
                const key = objId || 'khac'
                totals[key] = (totals[key] || 0) + allocation
              })
              allocated = true
            }
          })
        }
        if (!allocated) {
          const key = eq.expense_object_id || 'khac'
          totals[key] = (totals[key] || 0) + (Number(eq.amount) || 0)
        }
      })
    return totals
  }, [expenseQuotes])

  // Combined list of object ids for table - only show objects that have expenses
  const combinedObjectIds = useMemo(() => {
    const ids = new Set<string>()
    // Only include objects that have planned or actual expenses
    Object.keys(plannedByObject || {}).forEach(id => {
      if ((plannedByObject[id] || 0) > 0) {
        ids.add(id)
      }
    })
    Object.keys(expenseByObject || {}).forEach(id => {
      if ((expenseByObject[id] || 0) > 0) {
        ids.add(id)
      }
    })
    return Array.from(ids)
  }, [plannedByObject, expenseByObject])

  const expensePieData = {
    labels: Object.keys(expenseCategories).map(key => {
      const labels: { [key: string]: string } = {
        'materials': 'Vật liệu',
        'labor': 'Nhân công',
        'equipment': 'Thiết bị',
        'transport': 'Vận chuyển',
        'other': 'Khác'
      }
      return labels[key] || key
    }),
    datasets: [{
      data: Object.values(expenseCategories),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
      ],
      borderWidth: 1
    }]
  }

  // Pie chart data for expense objects and profit (only show objects with expenses)
  const expenseObjectsAndProfitPieData = useMemo(() => {
    // Only include objects that have actual expenses
    const objectIdsWithExpenses = Array.from(expenseObjectNames.keys()).filter(id => (expenseByObject[id] || 0) > 0)
    const labels = [...objectIdsWithExpenses.map(id => expenseObjectNames.get(id) || 'Khác'), 'Lợi nhuận']
    const values = [
      ...objectIdsWithExpenses.map(id => expenseByObject[id] || 0),
      Math.max(0, actualProfit)
    ]
    const colorsBase = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(199, 199, 199, 0.6)',
      'rgba(83, 102, 255, 0.6)',
      'rgba(255, 99, 255, 0.6)',
      'rgba(99, 255, 132, 0.6)'
    ]
    const borderBase = colorsBase.map(c => c.replace('0.6', '1'))
    const backgroundColor = labels.map((_, i) => colorsBase[i % colorsBase.length])
    const borderColor = labels.map((_, i) => borderBase[i % borderBase.length])
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor,
        borderColor,
        borderWidth: 1
      }]
    }
  }, [expenseObjectNames, expenseByObject, actualProfit])

  if (loading) {
    return (
      <LayoutWithSidebar user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải báo cáo...</p>
          </div>
        </div>
      </LayoutWithSidebar>
    )
  }

  if (!project) {
    return (
      <LayoutWithSidebar user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600">Không tìm thấy dự án</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Quay lại
            </button>
          </div>
        </div>
      </LayoutWithSidebar>
    )
  }

  return (
    <LayoutWithSidebar user={user} onLogout={handleLogout}>
      <div className="w-full">
        <div data-tour-id="report-detail-page-header">
          <StickyTopNav 
            title={`Báo cáo: ${project.name}`}
            subtitle={`${project.project_code} - ${project.customer_name}`}
          >
          <button
            onClick={startReportDetailTour}
            disabled={isReportDetailTourRunning}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Hướng dẫn xem báo cáo chi tiết"
          >
            <CircleHelp className="h-4 w-4" />
          </button>
          </StickyTopNav>
        </div>

        <div className="px-2 sm:px-4 lg:px-6 xl:px-8 py-6">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </button>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-tour-id="report-detail-summary">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour-id="report-detail-summary-quotes">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"></div>
                <div>
                  <p className="text-sm text-gray-600">Tổng báo giá</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalQuotes)}</p>
                  <p className="text-xs text-gray-500">{quotes.length} báo giá</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour-id="report-detail-summary-invoices">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"></div>
                <div>
                  <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalInvoices)}</p>
                  <p className="text-xs text-gray-500">{invoices.length} đơn hàng</p>
                  {invoices.filter(i => i.payment_status === 'pending').length > 0 && (
                    <p className="text-xs text-orange-600 font-semibold mt-1">
                      ⚠️ {invoices.filter(i => i.payment_status === 'pending').length} chưa thanh toán
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour-id="report-detail-summary-expenses">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg"></div>
                <div>
                  <p className="text-sm text-gray-600">Tổng chi phí dự án</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                  <p className="text-xs text-gray-500">{expenses.length} chi phí đã duyệt</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour-id="report-detail-summary-profit">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${actualProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}></div>
                <div>
                  <p className="text-sm text-gray-600">Lợi nhuận thực tế</p>
                  <p className={`text-xl font-bold ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(actualProfit)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Biên LN: {totalInvoices > 0 ? ((actualProfit / totalInvoices) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout: Plan vs Actual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-tour-id="report-detail-plan-vs-actual">
            {/* Left Column - PLAN (Kế hoạch) */}
            <div className="flex flex-col">
              <div className="bg-blue-50 rounded-xl shadow-sm border-2 border-blue-200 p-6 flex flex-col h-full" data-tour-id="report-detail-plan-overview">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg"></div>
                  <div>
                    <h2 className="text-xl font-bold text-blue-900">KẾ HOẠCH</h2>
                    <p className="text-sm text-blue-700">Báo giá & Chi phí dự kiến</p>
                  </div>
                </div>

                {/* Planned Revenue - Quotes */}
                <div className="bg-white rounded-lg p-4 mb-4 flex flex-col flex-1" data-tour-id="report-detail-plan-quotes">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Báo giá (Doanh thu dự kiến)</h3>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(totalQuotes)}</span>
                  </div>
                  
                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto" style={{ maxHeight: '16rem' }}>
                    {quotes.length > 0 ? (
                      quotes.map((quote) => (
                        <div key={quote.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{quote.quote_number}</p>
                            <p className="text-xs text-gray-500">{quote.description || 'Không có mô tả'}</p>
                            <p className="text-xs text-gray-400">{formatDate(quote.created_at)}</p>
                        {Array.isArray(quote.quote_items) && quote.quote_items.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Sản phẩm</p>
                            <ul className="space-y-1">
                              {quote.quote_items.map((item) => (
                                <li key={item.id} className="flex justify-between items-center text-xs text-gray-600">
                                  <span className="truncate pr-2">
                                    {item.name_product || item.description || 'Hạng mục'}
                                  </span>
                                  {item.quantity !== null && item.quantity !== undefined && (
                                    <span className="font-medium text-gray-900">
                                      {item.quantity}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-blue-600">{formatCurrency(quote.total_amount)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(quote.status)}`}>
                              {getStatusText(quote.status)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Chưa có báo giá</p>
                    )}
                  </div>
                </div>

                {/* Planned Costs - From project_expenses_quote */}
                <div className="bg-white rounded-lg p-4 flex flex-col flex-1" data-tour-id="report-detail-plan-costs">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Chi phí dự kiến (Quote)</h3>
                      <p className="text-xs text-gray-500">Từ bảng Chi phí Quote</p>
                    </div>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(totalExpenseQuotes)}</span>
                  </div>
                  
                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto mb-3" style={{ maxHeight: '16rem' }}>
                    {expenseQuotes.length > 0 ? (
                      expenseQuotes.map((expenseQuote) => (
                        <div key={expenseQuote.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                          <div className="flex-1">
                             <p className="text-sm font-medium text-gray-900">{expenseQuote.description || 'Không có mô tả'}</p>
                             {expenseQuote.employee_id && (
                               <p className="text-xs text-gray-500 mt-1">
                                 👤 Nhân viên: {employees.get(expenseQuote.employee_id) || expenseQuote.employee_id}
                               </p>
                             )}
                            <p className="text-xs text-gray-400 mt-1">
                              📅 {formatDate(expenseQuote.expense_date)}
                            </p>
                            {expenseQuote.department_id && (
                              <p className="text-xs text-gray-500">
                                🏷️ Phòng ban: {expenseQuote.department_id}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-600">{formatCurrency(expenseQuote.amount)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(expenseQuote.status)}`}>
                              {getStatusText(expenseQuote.status)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Chưa có chi phí kế hoạch</p>
                    )}
                  </div>

                  <div className="mt-3 p-3 bg-blue-50 rounded-lg" data-tour-id="report-detail-plan-profit">
                    <p className="text-sm font-medium text-blue-900">Lợi nhuận dự kiến</p>
                    <p className={`text-lg font-bold ${plannedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(plannedProfit)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      = Báo giá ({formatCurrency(totalQuotes)}) - Chi phí ({formatCurrency(totalExpenseQuotes)})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - ACTUAL (Thực tế) */}
            <div className="flex flex-col">
              <div className="bg-green-50 rounded-xl shadow-sm border-2 border-green-200 p-6 flex flex-col h-full" data-tour-id="report-detail-actual-overview">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-600 rounded-lg"></div>
                  <div>
                    <h2 className="text-xl font-bold text-green-900">THỰC TẾ</h2>
                    <p className="text-sm text-green-700">Đơn hàng & Chi phí phát sinh</p>
                  </div>
                </div>

                {/* Actual Revenue - Invoices */}
                <div className="bg-white rounded-lg p-4 mb-4 flex flex-col flex-1" data-tour-id="report-detail-actual-invoices">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Đơn hàng (Doanh thu thực tế)</h3>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(totalInvoices)}</span>
                  </div>
                  
                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto" style={{ maxHeight: '16rem' }}>
                    {invoices.length > 0 ? (
                      invoices.map((invoice) => (
                        <div key={invoice.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{invoice.invoice_number}</p>
                            <p className="text-xs text-gray-500">{invoice.description || 'Không có mô tả'}</p>
                            <p className="text-xs text-gray-400">{formatDate(invoice.created_at)}</p>
                            {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-1">Sản phẩm:</p>
                                <div className="space-y-1">
                                  {invoice.invoice_items.map((item) => (
                                    <div key={item.id} className="text-xs text-gray-600">
                                      • {item.name_product || item.description || 'Sản phẩm'}: {item.quantity || 0}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right space-y-1 ml-4">
                            <p className="text-sm font-semibold text-green-600">{formatCurrency(invoice.total_amount)}</p>
                            <div className="flex flex-col gap-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                                {getStatusText(invoice.status)}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusColor(invoice.payment_status)}`}>
                                {getPaymentStatusText(invoice.payment_status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Chưa có đơn hàng</p>
                    )}
                  </div>
                </div>

                {/* Actual Costs - From project_expenses (approved only) */}
                <div className="bg-white rounded-lg p-4 flex flex-col flex-1" data-tour-id="report-detail-actual-expenses">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Chi phí thực tế (Đã duyệt)</h3>
                      <p className="text-xs text-gray-500">Từ bảng Chi phí Dự án</p>
                    </div>
                    <span className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                  </div>
                  
                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto" style={{ maxHeight: '16rem' }}>
                    {expenses.length > 0 ? (
                      expenses.map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <div className="flex-1">
                             <p className="text-sm font-medium text-gray-900">{expense.description || 'Không có mô tả'}</p>
                             {expense.employee_id && (
                               <p className="text-xs text-gray-500 mt-1">
                                 👤 Nhân viên: {employees.get(expense.employee_id) || expense.employee_id}
                               </p>
                             )}
                            <p className="text-xs text-gray-400 mt-1">
                              📅 {formatDate(expense.expense_date)}
                            </p>
                            {expense.department_id && (
                              <p className="text-xs text-gray-500">
                                🏷️ Phòng ban: {expense.department_id}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-red-600">{formatCurrency(expense.amount)}</p>
                            {(() => {
                              const planned = getPlannedAmountForExpense(expense.description)
                              return expense.amount > planned ? (
                                <span className={`text-xs px-2 py-1 rounded-full bg-red-100 text-red-700`}>
                                  Vượt kế hoạch
                                </span>
                              ) : null
                            })()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Chưa có chi phí thực tế</p>
                    )}
                  </div>

                  <div className="mt-3 p-3 bg-green-50 rounded-lg" data-tour-id="report-detail-actual-profit">
                    <p className="text-sm font-medium text-green-900">Lợi nhuận thực tế</p>
                    <p className={`text-lg font-bold ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(actualProfit)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      = Đơn hàng ({formatCurrency(totalInvoices)}) - Chi phí ({formatCurrency(totalExpenses)})
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Chênh lệch với kế hoạch: 
                      <span className={`ml-1 font-semibold ${profitVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profitVariance)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History - Full Width Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8" data-tour-id="report-detail-payment-history">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Lịch sử thanh toán</h3>
                    <p className="text-sm text-gray-600">Chi tiết các giao dịch thanh toán của dự án</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-500">{payments.length} giao dịch</span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {payments.length > 0 ? (
                  payments.map((payment: any) => (
                    <div key={payment.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm font-semibold text-gray-900">{payment.payment_number || 'N/A'}</p>
                          {payment.invoice_number && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {payment.invoice_number}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Ngày thanh toán</p>
                            <p className="text-sm text-gray-900">
                              {new Date(payment.payment_date).toLocaleString('vi-VN', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Phương thức</p>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {payment.payment_method === 'cash' ? 'Tiền mặt' :
                               payment.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                               payment.payment_method === 'card' ? 'Thẻ' :
                               payment.payment_method === 'check' ? 'Séc' :
                               payment.payment_method === 'digital_wallet' ? 'Ví điện tử' :
                               payment.payment_method === 'other' ? 'Khác' :
                               payment.payment_method || 'N/A'}
                            </span>
                          </div>
                          {payment.reference_number && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Số tham chiếu</p>
                              <p className="text-sm text-gray-900">{payment.reference_number}</p>
                            </div>
                          )}
                        </div>
                        {payment.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
                            <p className="text-sm text-gray-700 italic">{payment.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-6">
                        <p className="text-xs text-gray-500 mb-1">Số tiền</p>
                        <p className="text-lg font-bold text-green-600">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(payment.amount || 0)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Chưa có lịch sử thanh toán</p>
                  </div>
                )}
              </div>
              
              {payments.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-blue-900">Tổng đã thanh toán:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expense Comparison Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8" data-tour-id="report-detail-analysis">
            <div className="p-6 border-b border-gray-200" data-tour-id="report-detail-header">
              <h3 className="text-xl font-semibold text-gray-900">Phân tích Chi phí - Kế hoạch vs Thực tế</h3>
              <p className="text-gray-600">So sánh chi tiết và quy trách nhiệm từng khoản chi phí</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kế hoạch
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thực tế
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chênh lệch
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Biến động
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trách nhiệm / Hưởng lợi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenseComparison.map((item, index) => (
                    <tr key={index} className={`
                      ${item.status === 'over_budget' ? 'bg-red-50' : 
                        item.status === 'under_budget' ? 'bg-green-50' : 
                        'bg-white'}
                    `}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(item.planned)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(item.actual)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${
                        item.variance > 0 ? 'text-red-600' : 
                        item.variance < 0 ? 'text-green-600' : 
                        'text-gray-600'
                      }`}>
                        {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'over_budget' ? 'bg-red-100 text-red-800' :
                          item.status === 'under_budget' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.variance > 0 ? '↑' : item.variance < 0 ? '↓' : '='} {Math.abs(item.variance_percent).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className={`font-semibold ${
                          item.status === 'over_budget' ? 'text-red-700' :
                          item.status === 'under_budget' ? 'text-green-700' :
                          'text-gray-700'
                        }`}>
                          {item.responsible_party}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`${
                          item.status === 'over_budget' ? 'text-red-600' :
                          item.status === 'under_budget' ? 'text-green-600' :
                          'text-gray-600'
                        }`}>
                          {item.note}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">TỔNG CỘNG</td>
                     <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                       {formatCurrency(approvedPlannedTotal)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(totalExpenses)}
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-bold ${
                       (totalExpenses - approvedPlannedTotal) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                       {(totalExpenses - approvedPlannedTotal) > 0 ? '+' : ''}{formatCurrency(totalExpenses - approvedPlannedTotal)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold">
                       {approvedPlannedTotal > 0 ? ((totalExpenses - approvedPlannedTotal) / approvedPlannedTotal * 100).toFixed(1) : 0}%
                    </td>
                    <td colSpan={2} className="px-6 py-4 text-sm font-semibold text-gray-900">
                       {totalExpenses > approvedPlannedTotal ? 
                        '⚠️ Dự án vượt ngân sách - Cần xem xét' : 
                        '✅ Dự án tiết kiệm ngân sách'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Legend */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Chú giải:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mt-0.5"></div>
                  <div>
                    <p className="text-sm font-medium text-red-700">Vượt chi (Over Budget)</p>
                    <p className="text-xs text-gray-600">Bộ phận chịu trách nhiệm giải trình và xử lý</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mt-0.5"></div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Tiết kiệm (Under Budget)</p>
                    <p className="text-xs text-gray-600">Bộ phận được hưởng phần tiết kiệm theo quy định</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mt-0.5"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Đúng kế hoạch (On Budget)</p>
                    <p className="text-xs text-gray-600">Chênh lệch dưới 5%, được chấp nhận</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Expenses List - Planned & Actual */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8" data-tour-id="report-detail-expense-lists">
            <div className="p-6 border-b border-gray-200" data-tour-id="report-detail-expense-lists-header">
              <h3 className="text-xl font-semibold text-gray-900">Chi tiết Chi phí Kế hoạch & Thực tế</h3>
              <p className="text-gray-600">Danh sách đầy đủ các khoản chi phí đã duyệt</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Planned Expenses (Approved) */}
              <div data-tour-id="report-detail-planned-list">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Chi phí Kế hoạch (Đã duyệt)</h4>
                  <span className="text-sm font-medium text-blue-600">
                    {expenseQuotes.filter((eq: any) => eq.status === 'approved').length} khoản
                  </span>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {expenseQuotes.filter((eq: any) => eq.status === 'approved').length > 0 ? (
                    expenseQuotes
                      .filter((eq: any) => eq.status === 'approved')
                      .map((expenseQuote: any) => (
                        <div key={expenseQuote.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                                {expenseQuote.id_parent && (
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    📂 Chi phí con
                                  </span>
                                )}
                              </div>
                               <p className="font-medium text-gray-900">{expenseQuote.description || 'Không có mô tả'}</p>
                               {expenseQuote.employee_id && (
                                 <p className="text-xs text-gray-500 mt-1">
                                   👤 Nhân viên: {employees.get(expenseQuote.employee_id) || expenseQuote.employee_id}
                                 </p>
                               )}
                              <p className="text-xs text-gray-500 mt-1">
                                📅 {formatDate(expenseQuote.expense_date)}
                              </p>
                              {expenseQuote.department_id && (
                                <p className="text-xs text-gray-500">
                                  🏷️ Phòng ban: {expenseQuote.department_id}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-blue-600">
                                {formatCurrency(expenseQuote.amount)}
                              </p>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                ✓ Đã duyệt
                              </span>
                            </div>
                          </div>
                          {expenseQuote.notes && (
                            <p className="text-xs text-gray-600 mt-2 italic border-t border-blue-200 pt-2">
                              💭 {expenseQuote.notes}
                            </p>
                          )}
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">Chưa có chi phí kế hoạch đã duyệt</div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-blue-100 rounded-lg" data-tour-id="report-detail-planned-total">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-900">Tổng Kế hoạch (Đã duyệt):</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(expenseQuotes.filter((eq: any) => eq.status === 'approved').reduce((sum: number, eq: any) => sum + (eq.amount || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actual Expenses (Approved) */}
              <div data-tour-id="report-detail-actual-list">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Chi phí Thực tế (Đã phát sinh)</h4>
                  <span className="text-sm font-medium text-green-600">
                    {expenses.length} khoản
                  </span>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {expenses.length > 0 ? (
                    expenses.map((expense: any) => (
                      <div key={expense.id} className="border border-green-200 rounded-lg p-4 bg-green-50 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                              {expense.id_parent && (
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                  📂 Chi phí con
                                </span>
                              )}
                            </div>
                             <p className="font-medium text-gray-900">{expense.description || 'Không có mô tả'}</p>
                             {expense.employee_id && (
                               <p className="text-xs text-gray-500 mt-1">
                                 👤 Nhân viên: {employees.get(expense.employee_id) || expense.employee_id}
                               </p>
                             )}
                            <p className="text-xs text-gray-500 mt-1">
                              📅 {formatDate(expense.expense_date)}
                            </p>
                            {expense.department_id && (
                              <p className="text-xs text-gray-500">
                                🏷️ Phòng ban: {expense.department_id}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(expense.amount)}
                            </p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                              ✓ Đã phát sinh
                            </span>
                          </div>
                        </div>
                        {expense.notes && (
                          <p className="text-xs text-gray-600 mt-2 italic border-t border-green-200 pt-2">
                            💭 {expense.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">Chưa có chi phí thực tế</div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-green-100 rounded-lg" data-tour-id="report-detail-actual-total">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-900">Tổng Thực tế (Đã phát sinh):</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Summary */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Chi phí Kế hoạch</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(expenseQuotes.filter((eq: any) => eq.status === 'approved').reduce((sum: number, eq: any) => sum + (eq.amount || 0), 0))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {expenseQuotes.filter((eq: any) => eq.status === 'approved').length} khoản đã duyệt
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Chi phí Thực tế</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalExpenses)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {expenses.length} khoản đã phát sinh
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Chênh lệch</p>
                  <p className={`text-2xl font-bold ${
                    (totalExpenses - expenseQuotes.filter((eq: any) => eq.status === 'approved').reduce((sum: number, eq: any) => sum + (eq.amount || 0), 0)) > 0 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {formatCurrency(totalExpenses - expenseQuotes.filter((eq: any) => eq.status === 'approved').reduce((sum: number, eq: any) => sum + (eq.amount || 0), 0))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalExpenses > expenseQuotes.filter((eq: any) => eq.status === 'approved').reduce((sum: number, eq: any) => sum + (eq.amount || 0), 0)
                      ? '⚠️ Vượt kế hoạch'
                      : '✅ Tiết kiệm'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts - Doanh thu/Lợi nhuận/Chi phí & Đối tượng chi phí */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-tour-id="report-detail-charts">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour-id="report-chart-revenue-expense-profit">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu – Chi phí – Lợi nhuận</h3>
              {(totalInvoices > 0 || totalExpenses > 0) ? (
                <Pie
                  data={revenueExpenseProfitPieData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || ''
                            const value = (context.parsed as number) || 0
                            const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
                            return `${label}: ${formatted}`
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-sm text-gray-500">Chưa có dữ liệu để hiển thị biểu đồ.</div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-tour-id="report-chart-expense-objects">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Theo đối tượng chi phí</h3>
              {(expenseObjectsAndProfitPieData?.labels?.length > 0) ? (
                <Pie
                  data={expenseObjectsAndProfitPieData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || ''
                            const value = (context.parsed as number) || 0
                            const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
                            return `${label}: ${formatted}`
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-sm text-gray-500">Chưa có dữ liệu để hiển thị biểu đồ.</div>
              )}
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl shadow-sm border border-teal-200 p-6" data-tour-id="report-detail-summary-section">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt Báo cáo</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4" data-tour-id="report-summary-total-revenue">
                <p className="text-sm text-gray-600 mb-1">Tổng Doanh thu</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(totalInvoices)}</p>
                <p className="text-xs text-gray-500">Từ {invoices.length} đơn hàng</p>
              </div>
              
              <div className="bg-white rounded-lg p-4" data-tour-id="report-summary-total-cost">
                <p className="text-sm text-gray-600 mb-1">Tổng Chi phí</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-gray-500">Từ {expenses.length} khoản chi</p>
              </div>
              
              <div className="bg-white rounded-lg p-4" data-tour-id="report-summary-net-profit">
                <p className="text-sm text-gray-600 mb-1">Lợi nhuận ròng</p>
                <p className={`text-xl font-bold ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(actualProfit)}
                </p>
                <p className="text-xs text-gray-500">
                  Biên lợi nhuận: {totalInvoices > 0 ? ((actualProfit / totalInvoices) * 100).toFixed(1) : 0}%
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4" data-tour-id="report-summary-total-quotes">
                <p className="text-sm text-gray-600 mb-1">Tổng báo giá</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalQuotes)}</p>
                <p className="text-xs text-gray-500">Từ {quotes.length} báo giá</p>
              </div>
              
              <div className="bg-white rounded-lg p-4" data-tour-id="report-summary-variance">
                <p className="text-sm text-gray-600 mb-1">Chênh lệch (Doanh thu − Chi phí)</p>
                <p className={`text-xl font-bold ${ (totalInvoices - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600' }`}>
                  {formatCurrency(totalInvoices - totalExpenses)}
                </p>
                <p className="text-xs text-gray-500">Tổng quan chênh lệch</p>
              </div>
            </div>
          </div>

          {/* Planned vs Actual by Expense Object */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200" data-tour-id="report-detail-expense-objects">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chi phí theo Đối tượng: Kế hoạch vs Thực tế</h3>
                <p className="text-gray-600">Nhóm theo đối tượng chi phí, kèm chênh lệch</p>
              </div>
              <button
                onClick={() => setShowExpenseObjectDetails(v => !v)}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                {showExpenseObjectDetails ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            {showExpenseObjectDetails && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đối tượng</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kế hoạch</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thực tế</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chênh lệch</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {combinedObjectIds.map((id) => {
                    const name = expenseObjectNames.get(id) || (id === 'khac' ? 'Khác' : id)
                    const planned = plannedByObject[id] || 0
                    const actual = expenseByObject[id] || 0
                    const variance = actual - planned
                    const variancePct = planned > 0 ? (variance / planned) * 100 : 0
                    return (
                      <tr key={id} className={`${variance > 0 ? 'bg-red-50' : variance < 0 ? 'bg-green-50' : 'bg-white'}`}>
                        <td className="px-6 py-3 text-sm text-gray-900">{name}</td>
                        <td className="px-6 py-3 text-right text-sm text-gray-900">{formatCurrency(planned)}</td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(actual)}</td>
                        <td className={`px-6 py-3 text-right text-sm font-bold ${variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : 'text-gray-600'}`}>{variance > 0 ? '+' : ''}{formatCurrency(variance)}</td>
                        <td className="px-6 py-3 text-center text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variance > 0 ? 'bg-red-100 text-red-800' : variance < 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {variance > 0 ? '↑' : variance < 0 ? '↓' : '='} {Math.abs(variancePct).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Export Buttons */}
           <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="h-5 w-5" />
              Xuất Excel
            </button>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  )
}

