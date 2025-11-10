/**
 * Expenses API Service
 * Handles all expense-related API calls (expenses, bills, vendors)
 */

import { apiClient } from './client'

// Types
export interface Expense {
  id: string
  expense_code: string
  employee_id?: string
  description: string
  amount: number
  currency: string
  expense_date: string
  receipt_url?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  notes?: string
  id_parent?: string
  category_id?: string
  project_id?: string
  vendor?: string
  category?: string
  created_at?: string
  updated_at?: string
  employees?: {
    id: string
    user_id?: string
    first_name?: string
    last_name?: string
    email?: string
    users?: {
      full_name: string
      email: string
    }
  }
  expense_categories?: {
    id: string
    name: string
    description: string
  }
}

export interface ExpenseCreate {
  expense_code?: string
  employee_id?: string
  description: string
  amount: number
  currency?: string
  expense_date: string
  receipt_url?: string
  status?: 'pending' | 'approved' | 'rejected' | 'paid'
  notes?: string
  id_parent?: string
  category_id?: string
  project_id?: string
  vendor?: string
  category?: string
}

export interface ExpenseUpdate {
  description?: string
  amount?: number
  currency?: string
  expense_date?: string
  receipt_url?: string
  status?: 'pending' | 'approved' | 'rejected' | 'paid'
  notes?: string
  category_id?: string
  project_id?: string
  vendor?: string
  category?: string
}

export interface Bill {
  id: string
  bill_number: string
  vendor_id?: string
  vendor_name?: string
  description: string
  amount: number
  due_date: string
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  paid_date?: string
  notes?: string
  created_at?: string
}

export interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  tax_id?: string
  created_at?: string
}

interface GetExpensesParams {
  skip?: number
  limit?: number
  search?: string
  employee_id?: string
  project_id?: string
  customer_id?: string
  category?: string
  status_filter?: string
  is_billable?: boolean
  is_reimbursable?: boolean
  payment_method?: string
}

interface GetBillsParams {
  skip?: number
  limit?: number
  search?: string
  vendor_id?: string
  status?: string
}

/**
 * Expenses API Service
 */
export const expensesApi = {
  /**
   * Get all expenses with optional filtering
   */
  getExpenses: (params?: GetExpensesParams): Promise<Expense[]> => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.employee_id) searchParams.append('employee_id', params.employee_id)
    if (params?.project_id) searchParams.append('project_id', params.project_id)
    if (params?.customer_id) searchParams.append('customer_id', params.customer_id)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.status_filter) searchParams.append('status_filter', params.status_filter)
    if (params?.is_billable !== undefined) searchParams.append('is_billable', params.is_billable.toString())
    if (params?.is_reimbursable !== undefined) searchParams.append('is_reimbursable', params.is_reimbursable.toString())
    if (params?.payment_method) searchParams.append('payment_method', params.payment_method)
    
    const query = searchParams.toString()
    return apiClient.get<Expense[]>(`/api/expenses/expenses${query ? '?' + query : ''}`, {
      useCache: true,
    })
  },

  /**
   * Get public expenses (no auth required)
   */
  getExpensesPublic: (): Promise<Expense[]> => {
    return apiClient.get<Expense[]>('/api/expenses/expenses/public', {
      useCache: true,
    })
  },

  /**
   * Get single expense by ID
   */
  getExpense: (id: string): Promise<Expense> => {
    return apiClient.get<Expense>(`/api/expenses/expenses/${id}`, {
      useCache: true,
    })
  },

  /**
   * Create new expense
   */
  createExpense: (data: ExpenseCreate): Promise<Expense> => {
    return apiClient.post<Expense>('/api/expenses/expenses', data)
  },

  /**
   * Update expense
   */
  updateExpense: (id: string, data: ExpenseUpdate): Promise<Expense> => {
    return apiClient.put<Expense>(`/api/expenses/expenses/${id}`, data)
  },

  /**
   * Delete expense
   */
  deleteExpense: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/expenses/expenses/${id}`)
  },

  /**
   * Submit expense for approval
   */
  submitExpense: (id: string): Promise<Expense> => {
    return apiClient.post<Expense>(`/api/expenses/expenses/${id}/submit`, {})
  },

  /**
   * Approve expense
   */
  approveExpense: (id: string): Promise<Expense> => {
    return apiClient.put<Expense>(`/api/expenses/expenses/${id}/approve`, {})
  },

  /**
   * Reject expense
   */
  rejectExpense: (id: string): Promise<Expense> => {
    return apiClient.put<Expense>(`/api/expenses/expenses/${id}/reject`, {})
  },

  /**
   * Get bills with optional filtering
   */
  getBills: (params?: GetBillsParams): Promise<Bill[]> => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.vendor_id) searchParams.append('vendor_id', params.vendor_id)
    if (params?.status) searchParams.append('status', params.status)
    
    const query = searchParams.toString()
    return apiClient.get<Bill[]>(`/api/expenses/bills${query ? '?' + query : ''}`, {
      useCache: true,
    })
  },

  /**
   * Get public bills (no auth required)
   */
  getBillsPublic: (): Promise<Bill[]> => {
    return apiClient.get<Bill[]>('/api/expenses/bills/public', {
      useCache: true,
    })
  },

  /**
   * Get vendors
   */
  getVendors: (): Promise<Vendor[]> => {
    return apiClient.get<Vendor[]>('/api/expenses/vendors', {
      useCache: true,
    })
  },

  /**
   * Get public vendors (no auth required)
   */
  getVendorsPublic: (): Promise<Vendor[]> => {
    return apiClient.get<Vendor[]>('/api/expenses/vendors/public', {
      useCache: true,
    })
  },
}

export default expensesApi

