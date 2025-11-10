/**
 * Project Expenses API Service
 * Handles all project expense-related API calls
 */

import { apiClient } from './client'

// Types
export interface ProjectExpense {
  id: string
  project_id: string
  expense_object_id?: string
  description: string
  amount: number
  expense_date: string
  category?: string
  status: string
  vendor?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface ProjectExpenseCreate {
  project_id: string
  expense_object_id?: string
  description: string
  amount: number
  expense_date: string
  category?: string
  status?: string
  vendor?: string
  notes?: string
}

export interface ProjectExpenseUpdate {
  description?: string
  amount?: number
  expense_date?: string
  category?: string
  status?: string
  vendor?: string
  notes?: string
  expense_object_id?: string
}

export interface ProjectExpenseQuote {
  id: string
  project_id: string
  expense_object_id?: string
  description: string
  amount: number
  expense_date: string
  category?: string
  status: string
  vendor?: string
  notes?: string
  created_at?: string
}

export interface ProjectExpenseQuoteCreate {
  project_id: string
  expense_object_id?: string
  description: string
  amount: number
  expense_date: string
  category?: string
  status?: string
  vendor?: string
  notes?: string
  id_parent?: string
}

interface GetProjectExpensesParams {
  project_id?: string
  category?: string
  status?: string
  skip?: number
  limit?: number
}

interface GetInvoiceItemsForProjectParams {
  project_id: string
  category?: 'planned' | 'actual'
}

interface GetQuoteItemsForProjectParams {
  project_id: string
}

/**
 * Project Expenses API Service
 */
export const projectExpensesApi = {
  /**
   * Get all project expenses with optional filtering
   */
  getProjectExpenses: (params?: GetProjectExpensesParams): Promise<ProjectExpense[]> => {
    const searchParams = new URLSearchParams()
    if (params?.project_id) searchParams.append('project_id', params.project_id)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return apiClient.get<ProjectExpense[]>(`/api/project-expenses${query ? '?' + query : ''}`, {
      useCache: true,
    })
  },

  /**
   * Get single project expense by ID
   */
  getProjectExpense: (id: string): Promise<ProjectExpense> => {
    return apiClient.get<ProjectExpense>(`/api/project-expenses/${id}`, {
      useCache: true,
    })
  },

  /**
   * Create new project expense
   */
  createProjectExpense: (data: ProjectExpenseCreate): Promise<ProjectExpense> => {
    return apiClient.post<ProjectExpense>('/api/project-expenses', data)
  },

  /**
   * Update project expense
   */
  updateProjectExpense: (id: string, data: ProjectExpenseUpdate): Promise<ProjectExpense> => {
    return apiClient.put<ProjectExpense>(`/api/project-expenses/${id}`, data)
  },

  /**
   * Delete project expense
   */
  deleteProjectExpense: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/project-expenses/${id}`)
  },

  /**
   * Create project expense quote (planned expense)
   */
  createProjectExpenseQuote: (data: ProjectExpenseQuoteCreate): Promise<ProjectExpenseQuote> => {
    return apiClient.post<ProjectExpenseQuote>('/api/project-expenses/quotes', data)
  },

  /**
   * Approve project expense quote
   */
  approveProjectExpenseQuote: (id: string): Promise<ProjectExpenseQuote> => {
    return apiClient.put<ProjectExpenseQuote>(`/api/project-expenses/quotes/${id}/approve`, {})
  },

  /**
   * Get invoice items for a project (for actual expenses)
   * This is a helper method that might need to be implemented differently
   */
  getInvoiceItemsForProject: async (projectId: string, category?: 'planned' | 'actual'): Promise<any[]> => {
    // This might need to call a different endpoint or use a different API
    // For now, we'll use a generic approach
    try {
      const response = await apiClient.get(`/api/projects/${projectId}/invoice-items`, {
        useCache: true,
      })
      return response || []
    } catch (error) {
      console.error('Error fetching invoice items:', error)
      return []
    }
  },

  /**
   * Get quote items for a project (for planned expenses)
   */
  getQuoteItemsForProject: async (projectId: string): Promise<any[]> => {
    try {
      // This might need to call quotes API with project_id filter
      const response = await apiClient.get(`/api/sales/quotes?project_id=${projectId}`, {
        useCache: true,
      })
      return response || []
    } catch (error) {
      console.error('Error fetching quote items:', error)
      return []
    }
  },

  /**
   * Get expense objects
   */
  getExpenseObjects: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/api/expense-objects', {
        useCache: true,
      })
      return response || []
    } catch (error) {
      console.error('Error fetching expense objects:', error)
      return []
    }
  },
}

export default projectExpensesApi

