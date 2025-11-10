/**
 * Invoices API Service
 * Handles all invoice-related API calls
 */

import { apiClient } from './client'
import { salesApi } from './salesApi'

// Re-export Invoice types from salesApi
export type { Invoice, InvoiceCreate, InvoiceUpdate, InvoiceItem } from './salesApi'

interface GetInvoicesParams {
  skip?: number
  limit?: number
  search?: string
  customer_id?: string
  status?: string
  payment_status?: string
  project_id?: string
}

/**
 * Invoices API Service
 * Uses salesApi for invoice operations
 */
export const invoicesApi = {
  /**
   * Get all invoices with optional filtering
   */
  getInvoices: (params?: GetInvoicesParams): Promise<Invoice[]> => {
    return salesApi.getInvoices(params)
  },

  /**
   * Get single invoice by ID
   */
  getInvoice: (id: string): Promise<Invoice> => {
    return salesApi.getInvoice(id)
  },

  /**
   * Create new invoice
   */
  createInvoice: (data: InvoiceCreate): Promise<Invoice> => {
    return salesApi.createInvoice(data)
  },

  /**
   * Update invoice
   */
  updateInvoice: (id: string, data: InvoiceUpdate): Promise<Invoice> => {
    return salesApi.updateInvoice(id, data)
  },

  /**
   * Delete invoice
   */
  deleteInvoice: (id: string): Promise<void> => {
    return salesApi.deleteInvoice(id)
  },

  /**
   * Send invoice
   */
  sendInvoice: (id: string): Promise<Invoice> => {
    return salesApi.sendInvoice(id)
  },

  /**
   * Mark invoice as paid
   */
  markInvoiceAsPaid: (id: string): Promise<Invoice> => {
    return salesApi.markInvoiceAsPaid(id)
  },

  /**
   * Get invoice items for a project
   */
  getInvoiceItemsForProject: async (projectId: string): Promise<any[]> => {
    try {
      // Get all invoices for the project
      const invoices = await salesApi.getInvoices({ project_id: projectId })
      
      // Collect all invoice items
      const allItems: any[] = []
      
      for (const invoice of invoices) {
        try {
          // Note: This might need a specific endpoint for invoice items
          // For now, we'll return empty array and let the component handle it
          // In the future, we might need: GET /api/sales/invoices/{id}/items
        } catch (error) {
          console.error(`Error fetching items for invoice ${invoice.id}:`, error)
        }
      }
      
      return allItems
    } catch (error) {
      console.error('Error fetching invoice items for project:', error)
      return []
    }
  },
}

export default invoicesApi

