/**
 * Supabase client configuration for frontend
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          user_id: string
          employee_code: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          department_id: string | null
          position_id: string | null
          hire_date: string
          salary: number | null
          status: 'active' | 'inactive' | 'terminated' | 'on_leave'
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          employee_code: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          department_id?: string | null
          position_id?: string | null
          hire_date: string
          salary?: number | null
          status?: 'active' | 'inactive' | 'terminated' | 'on_leave'
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          employee_code?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          department_id?: string | null
          position_id?: string | null
          hire_date?: string
          salary?: number | null
          status?: 'active' | 'inactive' | 'terminated' | 'on_leave'
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          customer_code: string
          name: string
          type: 'individual' | 'company' | 'government'
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          country: string | null
          tax_id: string | null
          status: 'active' | 'inactive' | 'prospect'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_code: string
          name: string
          type: 'individual' | 'company' | 'government'
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          tax_id?: string | null
          status?: 'active' | 'inactive' | 'prospect'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_code?: string
          name?: string
          type?: 'individual' | 'company' | 'government'
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          tax_id?: string | null
          status?: 'active' | 'inactive' | 'prospect'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          project_code: string
          name: string
          description: string | null
          customer_id: string
          manager_id: string
          start_date: string
          end_date: string | null
          budget: number | null
          status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_code: string
          name: string
          description?: string | null
          customer_id: string
          manager_id: string
          start_date: string
          end_date?: string | null
          budget?: number | null
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_code?: string
          name?: string
          description?: string | null
          customer_id?: string
          manager_id?: string
          start_date?: string
          end_date?: string | null
          budget?: number | null
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          progress?: number
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          expense_code: string
          employee_id: string
          project_id: string | null
          category: 'travel' | 'meals' | 'accommodation' | 'transportation' | 'supplies' | 'equipment' | 'training' | 'other'
          description: string
          amount: number
          currency: string
          expense_date: string
          receipt_url: string | null
          status: 'pending' | 'approved' | 'rejected' | 'paid'
          approved_by: string | null
          approved_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          expense_code: string
          employee_id: string
          project_id?: string | null
          category: 'travel' | 'meals' | 'accommodation' | 'transportation' | 'supplies' | 'equipment' | 'training' | 'other'
          description: string
          amount: number
          currency?: string
          expense_date: string
          receipt_url?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'paid'
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          expense_code?: string
          employee_id?: string
          project_id?: string | null
          category?: 'travel' | 'meals' | 'accommodation' | 'transportation' | 'supplies' | 'equipment' | 'training' | 'other'
          description?: string
          amount?: number
          currency?: string
          expense_date?: string
          receipt_url?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'paid'
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          customer_id: string
          project_id: string | null
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
          items: any
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          customer_id: string
          project_id?: string | null
          issue_date: string
          due_date: string
          subtotal: number
          tax_rate?: number
          tax_amount?: number
          total_amount: number
          currency?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          payment_status?: 'pending' | 'partial' | 'paid' | 'overdue'
          paid_amount?: number
          items?: any
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          customer_id?: string
          project_id?: string | null
          issue_date?: string
          due_date?: string
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          currency?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          payment_status?: 'pending' | 'partial' | 'paid' | 'overdue'
          paid_amount?: number
          items?: any
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
