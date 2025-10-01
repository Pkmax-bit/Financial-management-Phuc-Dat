/**
 * Dashboard Service
 * Handles all dashboard-related API calls and data processing
 */

import { supabase } from '@/lib/supabase'

// Types
export interface DashboardStats {
  totalRevenue: number
  totalExpenses: number
  profitLoss: number
  cashBalance: number
  openInvoices: number
  overdueInvoices: number
  paidLast30Days: number
  pendingBills: number
  expensesByCategory: ExpenseCategory[]
  monthlyRevenueData: MonthlyData[]
  topCustomers: TopCustomer[]
  recentTransactions: Transaction[]
  bankAccounts: BankAccount[]
}

export interface ExpenseCategory {
  category: string
  amount: number
  color: string
}

export interface MonthlyData {
  month: string
  revenue: number
  expenses: number
}

export interface TopCustomer {
  name: string
  revenue: number
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
}

export interface BankAccount {
  name: string
  balance: number
  type: string
}

export interface CashflowProjection {
  projections: ProjectionMonth[]
  confidence: string
  basedOn: string
}

export interface ProjectionMonth {
  month: string
  projectedRevenue: number
  projectedExpenses: number
  projectedCashFlow: number
}

export interface PlannerEvent {
  id: string
  title: string
  date: string
  type: 'invoice' | 'bill' | 'expense' | 'payment'
  amount: number
  status: string
}

/**
 * Dashboard Service Class
 */
class DashboardService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No access token available')
      }

      // Try to fetch from backend API first
      try {
        const response = await fetch(`${this.baseUrl}/api/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Successfully fetched dashboard stats from backend API')
          return data
        } else {
          console.log('Backend API not available, falling back to direct Supabase queries')
          throw new Error('Backend API failed')
        }
      } catch (apiError) {
        console.log('Backend API error, using direct Supabase queries:', apiError)
        // Fallback to direct Supabase queries
        return await this.getDashboardStatsFromSupabase()
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }

  /**
   * Get dashboard stats directly from Supabase (fallback method)
   */
  private async getDashboardStatsFromSupabase(): Promise<DashboardStats> {
    try {
      // Date calculations
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      // Parallel queries for better performance
      const [
        invoicesResponse,
        expensesResponse,
        billsResponse,
        bankAccountsResponse
      ] = await Promise.all([
        // Invoices query
        supabase
          .from('invoices')
          .select(`
            id,
            total_amount,
            payment_status,
            paid_date,
            due_date,
            issue_date,
            customer_id,
            customers(name)
          `),

        // Expenses query
        supabase
          .from('expenses')
          .select('amount, category, status, expense_date')
          .gte('expense_date', thirtyDaysAgo.toISOString().split('T')[0]),

        // Bills query
        supabase
          .from('bills')
          .select('id, amount, status, due_date, vendor_name'),

        // Bank accounts query
        supabase
          .from('bank_accounts')
          .select('account_name, balance, account_type, is_active')
          .eq('is_active', true)
      ])

      // Process invoices data
      const invoices = invoicesResponse.data || []
      const expenses = expensesResponse.data || []
      const bills = billsResponse.data || []
      const bankAccounts = bankAccountsResponse.data || []

      // Calculate revenue (paid invoices in last 30 days)
      const paidInvoices = invoices.filter(invoice => 
        invoice.payment_status === 'paid' && 
        invoice.paid_date && 
        new Date(invoice.paid_date) >= thirtyDaysAgo
      )
      const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

      // Calculate expenses (approved expenses in last 30 days)
      const approvedExpenses = expenses.filter(expense => 
        expense.status === 'approved' || expense.status === 'paid'
      )
      const totalExpenses = approvedExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

      // Calculate other metrics
      const profitLoss = totalRevenue - totalExpenses
      const cashBalance = bankAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)

      // Count open and overdue invoices
      const openInvoices = invoices.filter(invoice => 
        invoice.payment_status === 'pending' || invoice.payment_status === 'partial'
      ).length

      const overdueInvoices = invoices.filter(invoice => 
        invoice.due_date && 
        new Date(invoice.due_date) < now && 
        (invoice.payment_status === 'pending' || invoice.payment_status === 'partial')
      ).length

      // Count pending bills
      const pendingBills = bills.filter(bill => 
        bill.status === 'pending' || bill.status === 'partial'
      ).length

      // Calculate expenses by category
      const categoryTotals: Record<string, number> = {}
      approvedExpenses.forEach(expense => {
        const category = expense.category || 'Other'
        categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0)
      })

      const expensesByCategory = Object.entries(categoryTotals).map(([category, amount], index) => ({
        category,
        amount,
        color: this.getCategoryColor(category, index)
      }))

      // Calculate monthly data (simplified - last 6 months)
      const monthlyRevenueData = this.calculateMonthlyData(invoices, expenses)

      // Calculate top customers
      const topCustomers = this.calculateTopCustomers(paidInvoices)

      // Format bank accounts
      const formattedBankAccounts = bankAccounts.map(account => ({
        name: account.account_name || 'Unknown Account',
        balance: account.balance || 0,
        type: account.account_type || 'Banking Account'
      }))

      return {
        totalRevenue,
        totalExpenses,
        profitLoss,
        cashBalance,
        openInvoices,
        overdueInvoices,
        paidLast30Days: totalRevenue,
        pendingBills,
        expensesByCategory,
        monthlyRevenueData,
        topCustomers,
        recentTransactions: [], // Placeholder for now
        bankAccounts: formattedBankAccounts
      }

    } catch (error) {
      console.error('Error fetching data from Supabase:', error)
      throw new Error('Failed to fetch dashboard data')
    }
  }

  /**
   * Get cashflow projection
   */
  async getCashflowProjection(months: number = 6): Promise<CashflowProjection> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`${this.baseUrl}/api/dashboard/cashflow/projection?months=${months}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch cashflow projection')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching cashflow projection:', error)
      // Return fallback data
      return {
        projections: [],
        confidence: 'low',
        basedOn: 'insufficient data'
      }
    }
  }

  /**
   * Get planner events
   */
  async getPlannerEvents(): Promise<PlannerEvent[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`${this.baseUrl}/api/dashboard/planner/events`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Planner events API error:', response.status, errorText)
        throw new Error(`Failed to fetch planner events: ${response.status} ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching planner events:', error)
      return []
    }
  }

  /**
   * Calculate what-if scenario
   */
  async calculateScenario(scenarioData: {
    revenue_change: number
    expense_change: number
    new_expense: number
    months: number
  }) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`${this.baseUrl}/api/dashboard/planner/scenario`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenarioData)
      })

      if (!response.ok) {
        throw new Error('Failed to calculate scenario')
      }

      return await response.json()
    } catch (error) {
      console.error('Error calculating scenario:', error)
      throw error
    }
  }

  /**
   * Helper method to get category colors
   */
  private getCategoryColor(category: string, index: number): string {
    const colors = [
      '#3B82F6', '#EF4444', '#F59E0B', '#10B981', 
      '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
      '#EC4899', '#6366F1'
    ]
    
    const categoryColorMap: Record<string, string> = {
      'travel': '#3B82F6',
      'meals': '#10B981',
      'accommodation': '#F59E0B',
      'transportation': '#8B5CF6',
      'supplies': '#EF4444',
      'equipment': '#06B6D4',
      'training': '#84CC16',
      'marketing': '#EC4899',
      'other': '#6B7280'
    }

    return categoryColorMap[category.toLowerCase()] || colors[index % colors.length]
  }

  /**
   * Calculate monthly revenue/expense data
   */
  private calculateMonthlyData(invoices: any[], expenses: any[]): MonthlyData[] {
    const monthlyData: MonthlyData[] = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      // Revenue for this month
      const monthRevenue = invoices
        .filter(invoice => 
          invoice.payment_status === 'paid' && 
          invoice.paid_date &&
          new Date(invoice.paid_date) >= monthDate && 
          new Date(invoice.paid_date) < nextMonth
        )
        .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

      // Expenses for this month
      const monthExpenses = expenses
        .filter(expense =>
          expense.expense_date &&
          new Date(expense.expense_date) >= monthDate &&
          new Date(expense.expense_date) < nextMonth &&
          (expense.status === 'approved' || expense.status === 'paid')
        )
        .reduce((sum, expense) => sum + (expense.amount || 0), 0)

      monthlyData.push({
        month: monthDate.toLocaleDateString('vi-VN', { month: 'short' }),
        revenue: monthRevenue,
        expenses: monthExpenses
      })
    }

    return monthlyData
  }

  /**
   * Calculate top customers by revenue
   */
  private calculateTopCustomers(paidInvoices: any[]): TopCustomer[] {
    const customerTotals: Record<string, { name: string; revenue: number }> = {}

    paidInvoices.forEach(invoice => {
      const customerId = invoice.customer_id
      const customerName = invoice.customers?.name || `Customer ${customerId}`
      const amount = invoice.total_amount || 0

      if (!customerTotals[customerId]) {
        customerTotals[customerId] = { name: customerName, revenue: 0 }
      }
      customerTotals[customerId].revenue += amount
    })

    return Object.values(customerTotals)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  /**
   * Refresh dashboard cache (if implemented)
   */
  async refreshDashboard(): Promise<void> {
    // Implementation for cache invalidation if needed
    console.log('Dashboard cache refreshed')
  }
}

// Export singleton instance
export const dashboardService = new DashboardService()
export default dashboardService