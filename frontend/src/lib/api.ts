/**
 * OAuth2 API utilities for making authenticated requests
 * Uses Supabase session tokens instead of JWT
 * 
 * NOTE: This file now uses the new Base API Client for better caching, retry, and error handling
 * The old functions are kept for backward compatibility
 */

import { apiClient } from './api/client'
import { supabase } from './supabase'

/**
 * Make an authenticated API request using OAuth2 session tokens
 * @deprecated Use apiClient.request() directly for better caching and retry logic
 */
export async function apiRequest(url: string, options: {
  method?: string
  headers?: Record<string, string>
  body?: unknown
} = {}): Promise<any> {
  // Use the new API client for backward compatibility
  const method = options.method || 'GET'
  
  if (method === 'GET') {
    return apiClient.get(url, { headers: options.headers })
  } else if (method === 'POST') {
    return apiClient.post(url, options.body, { headers: options.headers })
  } else if (method === 'PUT') {
    return apiClient.put(url, options.body, { headers: options.headers })
  } else if (method === 'DELETE') {
    return apiClient.delete(url, { headers: options.headers })
  }
  
  return apiClient.request(url, {
    method: method as any,
    headers: options.headers,
    body: options.body as any,
  })
}

/**
 * GET request
 * @deprecated Use apiClient.get() directly for better caching
 */
export async function apiGet(url: string, headers?: Record<string, string>): Promise<any> {
  // If url is already a full URL, use it directly
  // Otherwise, apiClient will add baseUrl
  return apiClient.get(url, { headers })
}

/**
 * POST request
 * @deprecated Use apiClient.post() directly for better error handling
 */
export async function apiPost(url: string, body: unknown, headers?: Record<string, string>): Promise<any> {
  return apiClient.post(url, body as any, { headers })
}

/**
 * PUT request
 * @deprecated Use apiClient.put() directly for better error handling
 */
export async function apiPut(url: string, body: unknown, headers?: Record<string, string>): Promise<any> {
  return apiClient.put(url, body, { headers })
}

/**
 * DELETE request
 * @deprecated Use apiClient.delete() directly for better error handling
 */
export function apiDelete(url: string, headers?: Record<string, string>) {
  return apiClient.delete(url, { headers })
}

// Employee API functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const employeeApi = {
  // Get all employees with authentication
  getEmployees: (params?: {
    skip?: number
    limit?: number
    search?: string
    department_id?: string
    status?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.department_id) searchParams.append('department_id', params.department_id)
    if (params?.status) searchParams.append('status', params.status)
    
    const query = searchParams.toString()
    // Use relative path - apiClient will add baseUrl
    return apiGet(`/api/employees${query ? '?' + query : ''}`)
  },

  // Get employees with simple auth (fallback)
  getEmployeesSimple: () => {
    return apiGet('/api/employees/simple')
  },

  // Get employees public (no auth)
  getEmployeesPublic: () => {
    // Use relative path instead of full URL - apiClient will add baseUrl
    return apiGet('/api/employees/public-list')
  },

  // Get employee by ID
  getEmployee: (id: string) => {
    return apiGet(`/api/employees/${id}`)
  },

  // Create employee
  createEmployee: (data: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    department_id?: string
    position_id?: string
    hire_date: string
    salary?: number
    manager_id?: string
    employee_code?: string
  }) => {
    return apiPost('/api/employees', data)
  },

  // Update employee
  updateEmployee: (id: string, data: Record<string, unknown>) => {
    return apiPut(`/api/employees/${id}`, data)
  },

  // Delete employee
  deleteEmployee: (id: string) => {
    return apiDelete(`/api/employees/${id}`)
  },

  // Get employee statistics
  getEmployeeStats: () => {
    return apiGet('/api/employees/stats/overview')
  },

  // Get departments with authentication
  getDepartments: async () => {
    try {
      const response = await apiGet('/api/employees/departments/')
      return response || []
    } catch (error) {
      console.log('Auth departments failed, trying public endpoint')
      const response = await apiGet('/api/employees/public-departments')
      return response.departments || []
    }
  },

  // Create department
  createDepartment: async (data: {
    name: string
    description?: string
  }) => {
    const response = await apiPost('/api/employees/departments/', data)
    return response
  },

  // Get positions with authentication
  getPositions: async (department_id?: string) => {
    try {
      const response = await apiGet('/api/employees/positions/')
      return response || []
    } catch (error) {
      console.log('Auth positions failed, trying public endpoint')
      const response = await apiGet('/api/employees/public-positions')
      return response.positions || []
    }
  },

  // Create position
  createPosition: async (data: {
    title: string
    description?: string
    department_id?: string
  }) => {
    const response = await apiPost('/api/employees/positions/', data)
    return response
  },

  // Test endpoints
  testEmployees: () => {
    return apiGet('/api/employees/test')
  },

  testEmployeesSimple: () => {
    return apiGet('/api/employees/simple-test')
  },

  // Create sample data
  createSampleEmployees: () => {
    return apiPost('/api/employees/create-sample', {})
  },

  // Upload avatar for employee
  uploadAvatar: async (employeeId: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token')
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${API_BASE_URL}/api/upload/avatars/employees/${employeeId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(error.detail || 'Failed to upload avatar')
    }

    return response.json()
  }
}

// Expenses/Bills/Vendors simple APIs used by Expenses page
export const expensesApi = {
  getExpenses: async () => {
    try {
      console.log('🔍 Using public endpoint for expenses...')
      const result = await apiGet('/api/expenses/expenses/public')
      if (result === null) {
        throw new Error('Network error')
      }
      return result
    } catch (publicErr) {
      console.log('🔍 Public endpoint failed, falling back to Supabase...', publicErr)
      try {
        const { data } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false })
        return data || []
      } catch (supabaseErr) {
        console.log('🔍 Supabase also failed, returning empty array...', supabaseErr)
        return []
      }
    }
  }
}

export const billsApi = {
  getBills: async () => {
    try {
      console.log('🔍 Using public endpoint for bills...')
      const result = await apiGet('/api/expenses/bills/public')
      if (result === null) {
        throw new Error('Network error')
      }
      return result
    } catch (publicErr) {
      console.log('🔍 Public endpoint failed, falling back to Supabase...', publicErr)
      try {
        const { data } = await supabase
          .from('bills')
          .select('*')
          .order('created_at', { ascending: false })
        return data || []
      } catch (supabaseErr) {
        console.log('🔍 Supabase also failed, returning empty array...', supabaseErr)
        return []
      }
    }
  }
}

export const vendorsApi = {
  getVendors: async () => {
    try {
      console.log('🔍 Using public endpoint for vendors...')
      const result = await apiGet('/api/expenses/vendors/public')
      if (result === null) {
        throw new Error('Network error')
      }
      return result
    } catch (publicErr) {
      console.log('🔍 Public endpoint failed, falling back to Supabase...', publicErr)
      try {
        const { data } = await supabase
          .from('vendors')
          .select('*')
          .order('created_at', { ascending: true })
        return data || []
      } catch (supabaseErr) {
        console.log('🔍 Supabase also failed, returning empty array...', supabaseErr)
        return []
      }
    }
  }
}

// Customer API functions
export const customerApi = {
  // Get all customers with authentication
  getCustomers: (params?: {
    skip?: number
    limit?: number
    search?: string
    type?: string
    status?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.type) searchParams.append('type', params.type)
    if (params?.status) searchParams.append('status', params.status)
    
    const query = searchParams.toString()
    // Use relative path - apiClient will add baseUrl
    return apiGet(`/api/customers${query ? '?' + query : ''}`)
  },

  // Get customers public (no auth)
  getCustomersPublic: () => {
    // Use relative path instead of full URL - apiClient will add baseUrl
    return apiGet('/api/customers/public-list')
  },

  // Get customer by ID
  getCustomer: (id: string) => {
    return apiGet(`/api/customers/${id}`)
  },

  // Create customer
  createCustomer: (data: {
    customer_code: string
    name: string
    type: 'individual' | 'company' | 'government'
    email?: string
    phone?: string
    address?: string
    city?: string
    country?: string
    tax_id?: string
    status?: 'active' | 'inactive' | 'prospect'
    credit_limit?: number
    payment_terms?: number
    notes?: string
    assigned_to?: string
  }) => {
    return apiPost(`/api/customers`, data)
  },

  // Update customer
  updateCustomer: (id: string, data: Record<string, unknown>) => {
    return apiPut(`/api/customers/${id}`, data)
  },

  // Delete customer
  deleteCustomer: (id: string, hardDelete: boolean = false) => {
    const url = `/api/customers/${id}${hardDelete ? '?hard_delete=true' : ''}`
    return apiDelete(url)
  },

  // Get customer statistics
  getCustomerStats: () => {
    return apiGet(`/api/customers/stats/overview`)
  }
}

// Detailed Cost Breakdown API functions
export const detailedCostApi = {
  // Invoice Products
  getInvoiceProducts: (params?: {
    invoice_id?: string
    project_id?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.invoice_id) searchParams.append('invoice_id', params.invoice_id)
    if (params?.project_id) searchParams.append('project_id', params.project_id)
    
    const url = `/api/cost-breakdown/invoice-products${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  },

  createInvoiceProduct: (data: {
    invoice_id: string
    product_code?: string
    product_name: string
    unit_price: number
    quantity: number
    unit: string
    total_amount: number
  }) => {
    return apiPost(`/api/cost-breakdown/invoice-products`, data)
  },

  // Cost Breakdowns
  getCostBreakdowns: (params?: {
    project_id?: string
    status?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.project_id) searchParams.append('project_id', params.project_id)
    if (params?.status) searchParams.append('status', params.status)
    
    const url = `/api/cost-breakdown/cost-breakdowns${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  },

  createCostBreakdown: (data: {
    invoice_product_id: string
    project_id: string
    design_cost: number
    design_percentage: number
    material_cost: number
    material_percentage: number
    labor_cost: number
    labor_percentage: number
    transportation_cost: number
    transportation_percentage: number
    project_management_cost: number
    project_management_percentage: number
    total_cost: number
    profit: number
    profit_percentage: number
  }) => {
    return apiPost(`/api/cost-breakdown/cost-breakdowns`, data)
  },

  updateCostBreakdown: (breakdown_id: string, data: any) => {
    return apiPut(`/api/cost-breakdown/cost-breakdowns/${breakdown_id}`, data)
  },

  approveCostBreakdown: (breakdown_id: string) => {
    return apiPost(`/api/cost-breakdown/cost-breakdowns/${breakdown_id}/approve`, {})
  },

  // Cost Ratios
  getCostRatios: (project_id?: string) => {
    const url = `/api/cost-breakdown/cost-ratios${project_id ? '?project_id=' + project_id : ''}`
    return apiGet(url)
  },

  createCostRatio: (data: {
    project_id?: string
    category: string
    default_percentage: number
    min_percentage?: number
    max_percentage?: number
    description?: string
  }) => {
    return apiPost(`/api/cost-breakdown/cost-ratios`, data)
  },

  // Project Cost Tracking
  getProjectCostTracking: (project_id: string) => {
    return apiGet(`/api/cost-breakdown/project-tracking/${project_id}`)
  },

  createProjectCostTracking: (data: {
    project_id: string
    invoice_product_id: string
    planned_design_cost: number
    planned_material_cost: number
    planned_labor_cost: number
    planned_transportation_cost: number
    planned_management_cost: number
    planned_total_cost: number
    actual_design_cost: number
    actual_material_cost: number
    actual_labor_cost: number
    actual_transportation_cost: number
    actual_management_cost: number
    actual_total_cost: number
  }) => {
    return apiPost(`/api/cost-breakdown/project-tracking`, data)
  },

  // Project Cost Summary
  getProjectCostSummary: (project_id: string) => {
    return apiGet(`/api/cost-breakdown/project-summary/${project_id}`)
  },

  // Detailed Cost Report
  getDetailedCostReport: (project_id: string) => {
    return apiGet(`/api/cost-breakdown/detailed-report/${project_id}`)
  },

  // Calculate Cost Breakdown
  calculateCostBreakdown: (invoice_product_id: string, project_id: string) => {
    return apiPost(`/api/cost-breakdown/calculate-breakdown/${invoice_product_id}?project_id=${project_id}`, {})
  },

  // Cost Parties
  getCostParties: (type?: string) => {
    const url = `/api/cost-breakdown/cost-parties${type ? '?type=' + type : ''}`
    return apiGet(url)
  },

  createCostParty: (data: {
    name: string
    code: string
    type: string
    description?: string
    contact_person?: string
    email?: string
    phone?: string
    address?: string
  }) => {
    return apiPost(`/api/cost-breakdown/cost-parties`, data)
  },

  // Cost Categories
  getCostCategories: (parent_category?: string) => {
    const url = `/api/cost-breakdown/cost-categories${parent_category ? '?parent_category=' + parent_category : ''}`
    return apiGet(url)
  },

  createCostCategory: (data: {
    name: string
    code: string
    parent_category: string
    description?: string
  }) => {
    return apiPost(`/api/cost-breakdown/cost-categories`, data)
  },

  // Product Cost by Party
  getProductCostByParty: (params?: {
    project_id?: string
    invoice_product_id?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.project_id) searchParams.append('project_id', params.project_id)
    if (params?.invoice_product_id) searchParams.append('invoice_product_id', params.invoice_product_id)
    
    const url = `/api/cost-breakdown/product-cost-by-party${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  },

  createProductCostByParty: (data: {
    invoice_product_id: string
    project_id: string
    cost_party_id: string
    cost_category_id: string
    planned_cost: number
    planned_percentage: number
    actual_cost?: number
    actual_percentage?: number
    notes?: string
  }) => {
    return apiPost(`/api/cost-breakdown/product-cost-by-party`, data)
  },

  updateProductCostByParty: (cost_id: string, data: any) => {
    return apiPut(`/api/cost-breakdown/product-cost-by-party/${cost_id}`, data)
  },

  // Project Products Cost Detail
  getProjectProductsCostDetail: (project_id: string) => {
    return apiGet(`/api/cost-breakdown/project-products-detail/${project_id}`)
  },

  // Project Cost by Category
  getProjectCostByCategory: (project_id: string) => {
    return apiGet(`/api/cost-breakdown/project-cost-by-category/${project_id}`)
  }
}

// Project API functions
export const projectApi = {
  // Get all projects
  getProjects: (params?: {
    skip?: number
    limit?: number
    search?: string
    status?: string
    customer_id?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.customer_id) searchParams.append('customer_id', params.customer_id)
    
    const url = `/api/projects${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  },

  // Get project by ID
  getProject: (id: string) => {
    return apiGet(`/api/projects/${id}`)
  },

  // Create project
  createProject: (data: {
    name: string
    project_code: string
    description?: string
    status: string
    priority: string
    budget?: number
    start_date: string
    end_date?: string
    customer_id?: string
    manager_id?: string
    category_id?: string
    hourly_rate?: number
    progress?: number
    actual_cost?: number
  }) => {
    return apiPost(`/api/projects`, data)
  },

  // Update project
  updateProject: (id: string, data: Record<string, unknown>) => {
    return apiPut(`/api/projects/${id}`, data)
  },

  // Delete project
  deleteProject: (id: string) => {
    return apiDelete(`/api/projects/${id}`)
  },

  // Search projects
  searchProjects: (query: string, limit?: number) => {
    const searchParams = new URLSearchParams()
    searchParams.append('q', query)
    if (limit) searchParams.append('limit', limit.toString())
    
    const url = `/api/projects/search?${searchParams.toString()}`
    return apiGet(url)
  },

  // Get project statuses
  getProjectStatuses: (categoryId?: string) => {
    const url = categoryId && categoryId !== 'all'
      ? `/api/projects/statuses?category_id=${categoryId}`
      : '/api/projects/statuses'
    return apiGet(url)
  }
}

// Project Categories API functions
export const projectCategoryApi = {
  // Get all project categories
  getCategories: (isActive?: boolean) => {
    const searchParams = new URLSearchParams()
    if (isActive !== undefined) searchParams.append('is_active', isActive.toString())
    const url = `/api/project-categories${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  },

  // Get category by ID
  getCategory: (id: string) => {
    return apiGet(`/api/project-categories/${id}`)
  },

  // Create category
  createCategory: (data: {
    name: string
    code: string
    description?: string
    color?: string
    icon?: string
    display_order?: number
    is_active?: boolean
  }) => {
    return apiPost(`/api/project-categories`, data)
  },

  // Update category
  updateCategory: (id: string, data: Record<string, unknown>) => {
    return apiPut(`/api/project-categories/${id}`, data)
  },

  // Delete category
  deleteCategory: (id: string) => {
    return apiDelete(`/api/project-categories/${id}`)
  }
}

// Project Category Members API functions (many-to-many relationship)
export const projectCategoryMembersApi = {
  // Add project to category
  addProjectToCategory: (projectId: string, categoryId: string) => {
    return apiPost('/api/project-category-members', {
      project_id: projectId,
      category_id: categoryId
    })
  },

  // Remove project from category
  removeProjectFromCategory: (memberId: string) => {
    return apiDelete(`/api/project-category-members/${memberId}`)
  },

  // Get all categories for a project
  getProjectCategories: (projectId: string) => {
    return apiGet(`/api/project-category-members/projects/${projectId}/categories`)
  },

  // Get all projects in a category
  getCategoryProjects: (categoryId: string) => {
    return apiGet(`/api/project-category-members/categories/${categoryId}/projects`)
  }
}

// Project Status Flow Rules API functions
export const projectStatusFlowRulesApi = {
  // Get all flow rules
  getFlowRules: (params?: { is_active?: boolean; status_id?: string; category_id?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString())
    if (params?.status_id) searchParams.append('status_id', params.status_id)
    if (params?.category_id) searchParams.append('category_id', params.category_id)
    const url = `/api/project-status-flow-rules${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  },

  // Get flow rule by ID
  getFlowRule: (id: string) => {
    return apiGet(`/api/project-status-flow-rules/${id}`)
  },

  // Create flow rule
  createFlowRule: (data: {
    status_id: string
    category_id: string
    action_type?: 'add' | 'remove'
    is_active?: boolean
    priority?: number
    description?: string
  }) => {
    return apiPost('/api/project-status-flow-rules', data)
  },

  // Update flow rule
  updateFlowRule: (id: string, data: Record<string, unknown>) => {
    return apiPut(`/api/project-status-flow-rules/${id}`, data)
  },

  // Delete flow rule
  deleteFlowRule: (id: string) => {
    return apiDelete(`/api/project-status-flow-rules/${id}`)
  }
}

// Balance Sheet API functions
export const balanceSheetApi = {
  getBalanceSheet: (asOfDate: string) => {
    return apiGet(`/api/reports/balance-sheet?as_of_date=${asOfDate}`)
  }
}

// Cash Flow API functions
export const cashFlowApi = {
  getCashFlowStatement: (startDate: string, endDate: string) => {
    return apiGet(`/api/reports/cash-flow?start_date=${startDate}&end_date=${endDate}`)
  }
}

// Drill Down API functions
export const drillDownApi = {
  getDrillDownReport: (params: {
    reportType: string
    accountId: string
    startDate: string
    endDate: string
  }) => {
    const searchParams = new URLSearchParams()
    searchParams.append('report_type', params.reportType)
    searchParams.append('account_id', params.accountId)
    searchParams.append('start_date', params.startDate)
    searchParams.append('end_date', params.endDate)
    
    const url = `/api/reports/drill-down?${searchParams.toString()}`
    return apiGet(url)
  }
}

// Expenses by Vendor API functions
export const expensesVendorApi = {
  getExpensesByVendor: (params?: {
    startDate?: string
    endDate?: string
    vendor_id?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.append('start_date', params.startDate)
    if (params?.endDate) searchParams.append('end_date', params.endDate)
    if (params?.vendor_id) searchParams.append('vendor_id', params.vendor_id)
    
    const url = `/api/reports/expenses-by-vendor${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  }
}

// General Ledger API functions
export const generalLedgerApi = {
  getGeneralLedger: (params: {
    startDate: string
    endDate: string
    account_id?: string
  }) => {
    const searchParams = new URLSearchParams()
    searchParams.append('start_date', params.startDate)
    searchParams.append('end_date', params.endDate)
    if (params.account_id) searchParams.append('account_id', params.account_id)
    
    const url = `/api/reports/general-ledger?${searchParams.toString()}`
    return apiGet(url)
  }
}

// P&L Reports API functions
export const plReportsApi = {
  getPLReport: (params: {
    startDate: string
    endDate: string
    reportType?: string
  }) => {
    const searchParams = new URLSearchParams()
    searchParams.append('start_date', params.startDate)
    searchParams.append('end_date', params.endDate)
    if (params.reportType) searchParams.append('report_type', params.reportType)
    
    const url = `/api/reports/pl-report?${searchParams.toString()}`
    return apiGet(url)
  }
}

// Sales by Customer API functions
export const salesCustomerApi = {
  getSalesByCustomer: (params?: {
    startDate?: string
    endDate?: string
    customer_id?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.append('start_date', params.startDate)
    if (params?.endDate) searchParams.append('end_date', params.endDate)
    if (params?.customer_id) searchParams.append('customer_id', params.customer_id)
    
    const url = `/api/reports/sales-by-customer${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  }
}

// Sales Receipts API functions
export const salesReceiptsApi = {
  // Get all sales receipts
  getSalesReceipts: (params?: {
    skip?: number
    limit?: number
    search?: string
    customer_id?: string
    payment_method?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.customer_id) searchParams.append('customer_id', params.customer_id)
    if (params?.payment_method) searchParams.append('payment_method', params.payment_method)
    
    const url = `/api/sales/receipts${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  },

  // Get sales receipt by ID
  getSalesReceipt: (id: string) => {
    return apiGet(`/api/sales/receipts/${id}`)
  },

  // Create sales receipt
  createSalesReceipt: (data: {
    customer_id?: string
    issue_date: string
    line_items: Array<{
      product_id?: string
      product_name: string
      description?: string
      quantity: number
      unit_price: number
      discount_rate?: number
      discount_amount?: number
      line_total: number
    }>
    subtotal: number
    tax_rate?: number
    tax_amount?: number
    discount_amount?: number
    total_amount: number
    payment_method: string
    notes?: string
  }) => {
    return apiPost(`/api/sales/receipts`, data)
  },

  // Update sales receipt
  updateSalesReceipt: (id: string, data: Record<string, unknown>) => {
    return apiPut(`/api/sales/receipts/${id}`, data)
  },

  // Delete sales receipt
  deleteSalesReceipt: (id: string) => {
    return apiDelete(`/api/sales/receipts/${id}`)
  }
}

// Purchase Orders API functions
export const purchaseOrdersApi = {
  getPurchaseOrders: (params?: {
    skip?: number
    limit?: number
    search?: string
    vendor_id?: string
    status?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.vendor_id) searchParams.append('vendor_id', params.vendor_id)
    if (params?.status) searchParams.append('status', params.status)
    
    const url = `/api/purchase-orders${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  },

  getPurchaseOrder: (id: string) => {
    return apiGet(`/api/purchase-orders/${id}`)
  },

  createPurchaseOrder: (data: any) => {
    return apiPost(`/api/purchase-orders`, data)
  },

  updatePurchaseOrder: (id: string, data: Record<string, unknown>) => {
    return apiPut(`/api/purchase-orders/${id}`, data)
  },

  deletePurchaseOrder: (id: string) => {
    return apiDelete(`/api/purchase-orders/${id}`)
  },

  submitForApproval: (id: string) => {
    return apiPost(`/api/purchase-orders/${id}/submit`, {})
  },

  approvePurchaseOrder: (id: string, data: any) => {
    return apiPost(`/api/purchase-orders/${id}/approve`, data)
  },

  convertToBill: (id: string, data: any) => {
    return apiPost(`/api/purchase-orders/${id}/convert-to-bill`, data)
  }
}

// Expense Claims API functions
export const expenseClaimsApi = {
  getExpenseClaims: (params?: {
    skip?: number
    limit?: number
    search?: string
    employee_id?: string
    status?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.employee_id) searchParams.append('employee_id', params.employee_id)
    if (params?.status) searchParams.append('status', params.status)
    
    const url = `/api/expense-claims${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  },

  getExpenseClaim: (id: string) => {
    return apiGet(`/api/expense-claims/${id}`)
  },

  createExpenseClaim: (data: any) => {
    return apiPost(`/api/expense-claims`, data)
  },

  updateExpenseClaim: (id: string, data: Record<string, unknown>) => {
    return apiPut(`/api/expense-claims/${id}`, data)
  },

  deleteExpenseClaim: (id: string) => {
    return apiDelete(`/api/expense-claims/${id}`)
  },

  submitForApproval: (id: string) => {
    return apiPost(`/api/expense-claims/${id}/submit`, {})
  },

  approveExpenseClaim: (id: string, data: any) => {
    return apiPost(`/api/expense-claims/${id}/approve`, data)
  },

  processPayment: (id: string, data: any) => {
    return apiPost(`/api/expense-claims/${id}/process-payment`, data)
  }
}

// Budgeting API functions
export const budgetingApi = {
  getBudgets: (params?: {
    skip?: number
    limit?: number
    search?: string
    department_id?: string
    status?: string
    start_date?: string
    end_date?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.department_id) searchParams.append('department_id', params.department_id)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.start_date) searchParams.append('start_date', params.start_date)
    if (params?.end_date) searchParams.append('end_date', params.end_date)
    
    const url = `/api/budgets${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    return apiGet(url)
  },

  getBudget: (id: string) => {
    return apiGet(`/api/budgets/${id}`)
  },

  createBudget: (data: any) => {
    return apiPost(`/api/budgets`, data)
  },

  updateBudget: (id: string, data: Record<string, unknown>) => {
    return apiPut(`/api/budgets/${id}`, data)
  },

  deleteBudget: (id: string) => {
    return apiDelete(`/api/budgets/${id}`)
  },

  getBudgetStats: () => {
    return apiGet(`/api/budgets/stats`)
  },

  approveBudget: (id: string, data: any) => {
    return apiPost(`/api/budgets/${id}/approve`, data)
  },

  getBudgetReport: (id: string) => {
    return apiGet(`/api/budgets/${id}/report`)
  },

  updateBudgetActuals: (id: string) => {
    return apiPost(`/api/budgets/${id}/update-actuals`, {})
  }
}

// Export all APIs
export default {
  employeeApi,
  customerApi,
  detailedCostApi,
  expensesApi,
  billsApi,
  vendorsApi,
  projectApi,
  balanceSheetApi,
  cashFlowApi,
  drillDownApi,
  expensesVendorApi,
  generalLedgerApi,
  plReportsApi,
  salesCustomerApi,
  salesReceiptsApi,
  purchaseOrdersApi,
  expenseClaimsApi,
  budgetingApi,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
}