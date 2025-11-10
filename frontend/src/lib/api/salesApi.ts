/**
 * Sales API Service
 * Handles all sales-related API calls (quotes, invoices, payments, sales receipts, credit memos)
 */

import { apiClient } from './client'

// Types
export interface Quote {
  id: string
  quote_number: string
  customer_id?: string
  project_id?: string
  issue_date: string
  expiry_date?: string
  status: string
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  notes?: string
  created_at?: string
  updated_at?: string
  customers?: {
    name: string
    email?: string
  }
  projects?: {
    name: string
    project_code?: string
  }
}

export interface QuoteCreate {
  quote_number: string
  customer_id?: string
  project_id?: string
  issue_date: string
  expiry_date?: string
  status?: string
  line_items: QuoteItem[]
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  notes?: string
}

export interface QuoteUpdate {
  quote_number?: string
  customer_id?: string
  project_id?: string
  issue_date?: string
  expiry_date?: string
  status?: string
  line_items?: QuoteItem[]
  subtotal?: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount?: number
  notes?: string
}

export interface QuoteItem {
  id?: string
  product_id?: string
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  unit?: string
  discount_rate?: number
  discount_amount?: number
  line_total: number
}

export interface Invoice {
  id: string
  invoice_number: string
  customer_id?: string
  project_id?: string
  issue_date: string
  due_date?: string
  payment_status: string
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  paid_date?: string
  notes?: string
  created_at?: string
  updated_at?: string
  customers?: {
    name: string
    email?: string
  }
  projects?: {
    name: string
    project_code?: string
  }
}

export interface InvoiceCreate {
  invoice_number: string
  customer_id?: string
  project_id?: string
  issue_date: string
  due_date?: string
  line_items: InvoiceItem[]
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  notes?: string
}

export interface InvoiceUpdate {
  invoice_number?: string
  customer_id?: string
  project_id?: string
  issue_date?: string
  due_date?: string
  line_items?: InvoiceItem[]
  subtotal?: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount?: number
  payment_status?: string
  notes?: string
}

export interface InvoiceItem {
  id?: string
  product_id?: string
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  unit?: string
  discount_rate?: number
  discount_amount?: number
  line_total: number
}

export interface Payment {
  id: string
  payment_number: string
  customer_id?: string
  invoice_id?: string
  payment_date: string
  payment_method: string
  amount: number
  reference?: string
  notes?: string
  created_at?: string
}

export interface PaymentCreate {
  payment_number: string
  customer_id?: string
  invoice_id?: string
  payment_date: string
  payment_method: string
  amount: number
  reference?: string
  notes?: string
  allocations?: PaymentAllocation[]
}

export interface PaymentAllocation {
  invoice_id: string
  amount: number
}

export interface SalesReceipt {
  id: string
  receipt_number: string
  customer_id?: string
  issue_date: string
  payment_method: string
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  notes?: string
  created_at?: string
}

export interface SalesReceiptCreate {
  customer_id?: string
  issue_date: string
  line_items: SalesReceiptItem[]
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  payment_method: string
  notes?: string
}

export interface SalesReceiptItem {
  product_id?: string
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  discount_rate?: number
  discount_amount?: number
  line_total: number
}

export interface CreditMemo {
  id: string
  memo_number: string
  customer_id?: string
  invoice_id?: string
  issue_date: string
  reason: string
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  total_amount: number
  notes?: string
  created_at?: string
}

export interface CreditMemoCreate {
  memo_number: string
  customer_id?: string
  invoice_id?: string
  issue_date: string
  reason: string
  line_items: CreditMemoItem[]
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  total_amount: number
  notes?: string
}

export interface CreditMemoItem {
  product_id?: string
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  line_total: number
}

interface GetQuotesParams {
  skip?: number
  limit?: number
  search?: string
  customer_id?: string
  status?: string
}

interface GetInvoicesParams {
  skip?: number
  limit?: number
  search?: string
  customer_id?: string
  status?: string
  payment_status?: string
}

interface GetPaymentsParams {
  skip?: number
  limit?: number
  search?: string
  customer_id?: string
  invoice_id?: string
}

interface GetSalesReceiptsParams {
  skip?: number
  limit?: number
  search?: string
  customer_id?: string
  payment_method?: string
}

interface GetCreditMemosParams {
  skip?: number
  limit?: number
  search?: string
  customer_id?: string
  invoice_id?: string
}

/**
 * Sales API Service
 */
export const salesApi = {
  // ============================================================================
  // QUOTES
  // ============================================================================

  /**
   * Get all quotes with optional filtering
   */
  getQuotes: (params?: GetQuotesParams): Promise<Quote[]> => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.customer_id) searchParams.append('customer_id', params.customer_id)
    if (params?.status) searchParams.append('status', params.status)
    
    const query = searchParams.toString()
    return apiClient.get<Quote[]>(`/api/sales/quotes${query ? '?' + query : ''}`, {
      useCache: true,
    })
  },

  /**
   * Get single quote by ID
   */
  getQuote: (id: string): Promise<Quote> => {
    return apiClient.get<Quote>(`/api/sales/quotes/${id}`, {
      useCache: true,
    })
  },

  /**
   * Get quote items
   */
  getQuoteItems: (id: string): Promise<QuoteItem[]> => {
    return apiClient.get<QuoteItem[]>(`/api/sales/quotes/${id}/items`, {
      useCache: true,
    })
  },

  /**
   * Create new quote
   */
  createQuote: (data: QuoteCreate): Promise<Quote> => {
    return apiClient.post<Quote>('/api/sales/quotes', data)
  },

  /**
   * Update quote
   */
  updateQuote: (id: string, data: QuoteUpdate): Promise<Quote> => {
    return apiClient.put<Quote>(`/api/sales/quotes/${id}`, data)
  },

  /**
   * Delete quote
   */
  deleteQuote: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/sales/quotes/${id}`)
  },

  /**
   * Approve quote
   */
  approveQuote: (id: string): Promise<Quote> => {
    return apiClient.post<Quote>(`/api/sales/quotes/${id}/approve`, {})
  },

  /**
   * Send quote
   */
  sendQuote: (id: string): Promise<Quote> => {
    return apiClient.post<Quote>(`/api/sales/quotes/${id}/send`, {})
  },

  /**
   * Accept quote
   */
  acceptQuote: (id: string): Promise<Quote> => {
    return apiClient.post<Quote>(`/api/sales/quotes/${id}/accept`, {})
  },

  /**
   * Convert quote to invoice
   */
  convertQuoteToInvoice: (id: string): Promise<Invoice> => {
    return apiClient.post<Invoice>(`/api/sales/quotes/${id}/convert-to-invoice`, {})
  },

  // ============================================================================
  // INVOICES
  // ============================================================================

  /**
   * Get all invoices with optional filtering
   */
  getInvoices: (params?: GetInvoicesParams): Promise<Invoice[]> => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.customer_id) searchParams.append('customer_id', params.customer_id)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.payment_status) searchParams.append('payment_status', params.payment_status)
    
    const query = searchParams.toString()
    return apiClient.get<Invoice[]>(`/api/sales/invoices${query ? '?' + query : ''}`, {
      useCache: true,
    })
  },

  /**
   * Get single invoice by ID
   */
  getInvoice: (id: string): Promise<Invoice> => {
    return apiClient.get<Invoice>(`/api/sales/invoices/${id}`, {
      useCache: true,
    })
  },

  /**
   * Create new invoice
   */
  createInvoice: (data: InvoiceCreate): Promise<Invoice> => {
    return apiClient.post<Invoice>('/api/sales/invoices', data)
  },

  /**
   * Update invoice
   */
  updateInvoice: (id: string, data: InvoiceUpdate): Promise<Invoice> => {
    return apiClient.put<Invoice>(`/api/sales/invoices/${id}`, data)
  },

  /**
   * Delete invoice
   */
  deleteInvoice: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/sales/invoices/${id}`)
  },

  /**
   * Send invoice
   */
  sendInvoice: (id: string): Promise<Invoice> => {
    return apiClient.post<Invoice>(`/api/sales/invoices/${id}/send`, {})
  },

  /**
   * Mark invoice as paid
   */
  markInvoiceAsPaid: (id: string): Promise<Invoice> => {
    return apiClient.post<Invoice>(`/api/sales/invoices/${id}/mark-paid`, {})
  },

  // ============================================================================
  // PAYMENTS
  // ============================================================================

  /**
   * Get all payments with optional filtering
   */
  getPayments: (params?: GetPaymentsParams): Promise<Payment[]> => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.customer_id) searchParams.append('customer_id', params.customer_id)
    if (params?.invoice_id) searchParams.append('invoice_id', params.invoice_id)
    
    const query = searchParams.toString()
    return apiClient.get<Payment[]>(`/api/sales/payments${query ? '?' + query : ''}`, {
      useCache: true,
    })
  },

  /**
   * Get single payment by ID
   */
  getPayment: (id: string): Promise<Payment> => {
    return apiClient.get<Payment>(`/api/sales/payments/${id}`, {
      useCache: true,
    })
  },

  /**
   * Create new payment
   */
  createPayment: (data: PaymentCreate): Promise<Payment> => {
    return apiClient.post<Payment>('/api/sales/payments', data)
  },

  /**
   * Update payment
   */
  updatePayment: (id: string, data: Partial<PaymentCreate>): Promise<Payment> => {
    return apiClient.put<Payment>(`/api/sales/payments/${id}`, data)
  },

  /**
   * Delete payment
   */
  deletePayment: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/sales/payments/${id}`)
  },

  // ============================================================================
  // SALES RECEIPTS
  // ============================================================================

  /**
   * Get all sales receipts with optional filtering
   */
  getSalesReceipts: (params?: GetSalesReceiptsParams): Promise<SalesReceipt[]> => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.customer_id) searchParams.append('customer_id', params.customer_id)
    if (params?.payment_method) searchParams.append('payment_method', params.payment_method)
    
    const query = searchParams.toString()
    return apiClient.get<SalesReceipt[]>(`/api/sales/receipts${query ? '?' + query : ''}`, {
      useCache: true,
    })
  },

  /**
   * Get single sales receipt by ID
   */
  getSalesReceipt: (id: string): Promise<SalesReceipt> => {
    return apiClient.get<SalesReceipt>(`/api/sales/receipts/${id}`, {
      useCache: true,
    })
  },

  /**
   * Create new sales receipt
   */
  createSalesReceipt: (data: SalesReceiptCreate): Promise<SalesReceipt> => {
    return apiClient.post<SalesReceipt>('/api/sales/receipts', data)
  },

  /**
   * Update sales receipt
   */
  updateSalesReceipt: (id: string, data: Partial<SalesReceiptCreate>): Promise<SalesReceipt> => {
    return apiClient.put<SalesReceipt>(`/api/sales/receipts/${id}`, data)
  },

  /**
   * Delete sales receipt
   */
  deleteSalesReceipt: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/sales/receipts/${id}`)
  },

  // ============================================================================
  // CREDIT MEMOS
  // ============================================================================

  /**
   * Get all credit memos with optional filtering
   */
  getCreditMemos: (params?: GetCreditMemosParams): Promise<CreditMemo[]> => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.customer_id) searchParams.append('customer_id', params.customer_id)
    if (params?.invoice_id) searchParams.append('invoice_id', params.invoice_id)
    
    const query = searchParams.toString()
    return apiClient.get<CreditMemo[]>(`/api/sales/credit-memos${query ? '?' + query : ''}`, {
      useCache: true,
    })
  },

  /**
   * Get single credit memo by ID
   */
  getCreditMemo: (id: string): Promise<CreditMemo> => {
    return apiClient.get<CreditMemo>(`/api/sales/credit-memos/${id}`, {
      useCache: true,
    })
  },

  /**
   * Create new credit memo
   */
  createCreditMemo: (data: CreditMemoCreate): Promise<CreditMemo> => {
    return apiClient.post<CreditMemo>('/api/sales/credit-memos', data)
  },

  /**
   * Update credit memo
   */
  updateCreditMemo: (id: string, data: Partial<CreditMemoCreate>): Promise<CreditMemo> => {
    return apiClient.put<CreditMemo>(`/api/sales/credit-memos/${id}`, data)
  },

  /**
   * Delete credit memo
   */
  deleteCreditMemo: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/sales/credit-memos/${id}`)
  },

  // ============================================================================
  // PROJECT INTEGRATION
  // ============================================================================

  /**
   * Get projects for a customer
   */
  getProjectsByCustomer: (customerId: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/api/sales/projects/by-customer/${customerId}`, {
      useCache: true,
    })
  },

  /**
   * Get project dropdown options
   */
  getProjectDropdownOptions: (customerId: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/api/sales/projects/dropdown-options/${customerId}`, {
      useCache: true,
    })
  },

  /**
   * Validate project-customer relationship
   */
  validateProjectCustomer: (projectId: string, customerId: string): Promise<boolean> => {
    return apiClient.get<boolean>(`/api/sales/validate-project-customer?project_id=${projectId}&customer_id=${customerId}`, {
      useCache: true,
    })
  },
}

export default salesApi

