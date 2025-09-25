/**
 * Type definitions for Financial Management System
 */

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'employee' | 'viewer'
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export interface Employee {
  id: string
  user_id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  department_id?: string
  position_id?: string
  hire_date: string
  salary?: number
  status: 'active' | 'inactive' | 'terminated' | 'on_leave'
  manager_id?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  customer_code: string
  name: string
  type: 'individual' | 'company' | 'government'
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  tax_id?: string
  status: 'active' | 'inactive' | 'prospect'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  project_code: string
  name: string
  description?: string
  customer_id: string
  manager_id: string
  start_date: string
  end_date?: string
  budget?: number
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  expense_code: string
  employee_id: string
  project_id?: string
  category: 'travel' | 'meals' | 'accommodation' | 'transportation' | 'supplies' | 'equipment' | 'training' | 'other'
  description: string
  amount: number
  currency: string
  expense_date: string
  receipt_url?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  approved_by?: string
  approved_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  project_id?: string
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue'
  paid_amount: number
  items: InvoiceItem[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'manager' | 'employee' | 'viewer'
}

// Dashboard types
export interface DashboardStats {
  total_employees: number
  total_customers: number
  total_projects: number
  total_expenses: number
  total_invoices: number
  pending_expenses: number
  overdue_invoices: number
  monthly_revenue: number
  monthly_expenses: number
}
