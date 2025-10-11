'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  BarChart3,
  PieChart,
  Package
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LayoutWithSidebar from '@/components/LayoutWithSidebar'
import StickyTopNav from '@/components/StickyTopNav'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import { exportToExcel } from '@/utils/reportExport'
import { FileSpreadsheet } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

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

interface QuoteItem {
  id: string
  quote_number: string
  description: string
  total_amount: number
  status: string
  created_at: string
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
  const projectId = params?.projectId as string
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
        .select('*')
        .eq('project_id', projectId)
        .neq('status', 'rejected')
        .order('created_at', { ascending: false })

      setQuotes(quotesData || [])

      // Fetch invoices (actual revenue - dùng tính lợi nhuận)
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['sent', 'paid'])  // sent = đã gửi, paid = đã thanh toán
        .order('created_at', { ascending: false })
      
      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError)
      }

      setInvoices(invoicesData || [])

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
    
    exportToExcel(reportData)
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
  const actualProfit = totalInvoices - totalExpenses  // Lợi nhuận = Hóa đơn - Chi phí dự án
  
  const profitVariance = actualProfit - plannedProfit

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

  // Pie chart for expense breakdown by employee
  const expenseByEmployee = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      if (expense.employee_id) {
        const employeeName = employees.get(expense.employee_id) || `Nhân viên ${expense.employee_id.slice(0, 8)}...`
        acc[employeeName] = (acc[employeeName] || 0) + expense.amount
      }
      return acc
    }, {} as { [key: string]: number })
  }, [expenses, employees])

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

  // Pie chart data for employee breakdown
  const employeePieData = {
    labels: Object.keys(expenseByEmployee),
    datasets: [{
      data: Object.values(expenseByEmployee),
      backgroundColor: [
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
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)',
        'rgba(83, 102, 255, 1)',
        'rgba(255, 99, 255, 1)',
        'rgba(99, 255, 132, 1)'
      ],
      borderWidth: 1
    }]
  }

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
        <StickyTopNav 
          title={`Báo cáo: ${project.name}`}
          subtitle={`${project.project_code} - ${project.customer_name}`}
        />

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng báo giá</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalQuotes)}</p>
                  <p className="text-xs text-gray-500">{quotes.length} báo giá</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng hóa đơn</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalInvoices)}</p>
                  <p className="text-xs text-gray-500">{invoices.length} hóa đơn</p>
                  {invoices.filter(i => i.payment_status === 'pending').length > 0 && (
                    <p className="text-xs text-orange-600 font-semibold mt-1">
                      ⚠️ {invoices.filter(i => i.payment_status === 'pending').length} chưa thanh toán
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng chi phí dự án</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                  <p className="text-xs text-gray-500">{expenses.length} chi phí đã duyệt</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${actualProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <TrendingUp className={`h-5 w-5 ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left Column - PLAN (Kế hoạch) */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blue-900">KẾ HOẠCH</h2>
                    <p className="text-sm text-blue-700">Báo giá & Chi phí dự kiến</p>
                  </div>
                </div>

                {/* Planned Revenue - Quotes */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Báo giá (Doanh thu dự kiến)</h3>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(totalQuotes)}</span>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {quotes.length > 0 ? (
                      quotes.map((quote) => (
                        <div key={quote.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{quote.quote_number}</p>
                            <p className="text-xs text-gray-500">{quote.description || 'Không có mô tả'}</p>
                            <p className="text-xs text-gray-400">{formatDate(quote.created_at)}</p>
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
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Chi phí dự kiến (Quote)</h3>
                      <p className="text-xs text-gray-500">Từ bảng Chi phí Quote</p>
                    </div>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(totalExpenseQuotes)}</span>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
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

                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Lợi nhuận dự kiến</p>
                    <p className={`text-lg font-bold ${plannedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(plannedProfit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - ACTUAL (Thực tế) */}
            <div className="space-y-6">
              <div className="bg-green-50 rounded-xl shadow-sm border-2 border-green-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-900">THỰC TẾ</h2>
                    <p className="text-sm text-green-700">Hóa đơn & Chi phí phát sinh</p>
                  </div>
                </div>

                {/* Actual Revenue - Invoices */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Hóa đơn (Doanh thu thực tế)</h3>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(totalInvoices)}</span>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {invoices.length > 0 ? (
                      invoices.map((invoice) => (
                        <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{invoice.invoice_number}</p>
                            <p className="text-xs text-gray-500">{invoice.description || 'Không có mô tả'}</p>
                            <p className="text-xs text-gray-400">{formatDate(invoice.created_at)}</p>
                          </div>
                          <div className="text-right space-y-1">
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
                      <p className="text-sm text-gray-500 text-center py-4">Chưa có hóa đơn</p>
                    )}
                  </div>
                </div>

                {/* Actual Costs - From project_expenses (approved only) */}
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Chi phí thực tế (Đã duyệt)</h3>
                      <p className="text-xs text-gray-500">Từ bảng Chi phí Dự án</p>
                    </div>
                    <span className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
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

                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Lợi nhuận thực tế</p>
                    <p className={`text-lg font-bold ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(actualProfit)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      = Hóa đơn ({formatCurrency(totalInvoices)}) - Chi phí ({formatCurrency(totalExpenses)})
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

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue - Expense - Profit Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <PieChart className="h-6 w-6 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Phân bổ Doanh thu – Chi phí – Lợi nhuận</h3>
              </div>
              {(totalInvoices > 0 || totalExpenses > 0) ? (
                <Pie 
                  data={revenueExpenseProfitPieData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'right' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || ''
                            const value = context.parsed || 0
                            const formatted = new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(value)
                            return `${label}: ${formatted}`
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Chưa có dữ liệu doanh thu/chi phí/lợi nhuận
                </div>
              )}
            </div>

            {/* Expense Pie Chart (by employee) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <PieChart className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Phân bổ Chi phí theo Nhân viên</h3>
              </div>
              {Object.keys(expenseByEmployee).length > 0 ? (
                <Pie 
                  data={employeePieData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'right' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || ''
                            const value = context.parsed || 0
                            const formatted = new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(value)
                            return `${label}: ${formatted}`
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Chưa có dữ liệu chi phí theo nhân viên
                </div>
              )}
            </div>

            
          </div>

          {/* Expense Comparison Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
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
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{item.category}</span>
                        </div>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Chi tiết Chi phí Kế hoạch & Thực tế</h3>
              <p className="text-gray-600">Danh sách đầy đủ các khoản chi phí đã duyệt</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Planned Expenses (Approved) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Chi phí Kế hoạch (Đã duyệt)
                  </h4>
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
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Chưa có chi phí kế hoạch đã duyệt</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-900">Tổng Kế hoạch (Đã duyệt):</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(expenseQuotes.filter((eq: any) => eq.status === 'approved').reduce((sum: number, eq: any) => sum + (eq.amount || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actual Expenses (Approved) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Chi phí Thực tế (Đã phát sinh)
                  </h4>
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
                    <div className="text-center py-12 text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Chưa có chi phí thực tế</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-green-100 rounded-lg">
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

          {/* Summary Section */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl shadow-sm border border-teal-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt Báo cáo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Tổng Doanh thu</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(totalInvoices)}</p>
                <p className="text-xs text-gray-500">Từ {invoices.length} hóa đơn</p>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Tổng Chi phí</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-gray-500">Từ {expenses.length} khoản chi</p>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Lợi nhuận ròng</p>
                <p className={`text-xl font-bold ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(actualProfit)}
                </p>
                <p className="text-xs text-gray-500">
                  Biên lợi nhuận: {totalInvoices > 0 ? ((actualProfit / totalInvoices) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-2">Nhận xét</p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>
                  • Chênh lệch doanh thu: 
                  <span className={`ml-2 font-semibold ${(totalInvoices - totalQuotes) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalInvoices - totalQuotes)}
                  </span>
                </li>
                <li>
                  • Chênh lệch chi phí: 
                  <span className={`ml-2 font-semibold ${(totalExpenses - totalExpenseQuotes) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(totalExpenses - totalExpenseQuotes)}
                  </span>
                </li>
                <li>
                  • Chênh lệch lợi nhuận: 
                  <span className={`ml-2 font-semibold ${profitVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(profitVariance)}
                  </span>
                </li>
              </ul>
            </div>
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

