// ============================================
// API TYPES & INTERFACES
// Cho việc kết nối Frontend với Backend API
// ============================================

import { Status } from '../types';

// ============================================
// STATUS API TYPES
// ============================================

export interface StatusResponse {
  id: string;
  code: string;
  name: string;
  color: string;
  display_order: number;
  is_default: boolean;
  is_system: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStatusRequest {
  code: string;
  name: string;
  color: string;
  display_order?: number;
  description?: string;
}

export interface UpdateStatusRequest {
  name?: string;
  color?: string;
  display_order?: number;
  description?: string;
}

export interface ReorderStatusesRequest {
  status_ids: string[]; // Array of status IDs in new order
}

// ============================================
// API ENDPOINT PATHS
// ============================================

export const API_ENDPOINTS = {
  // Customer Statuses
  CUSTOMER_STATUSES: '/api/customer-statuses',
  CUSTOMER_STATUS: (id: string) => `/api/customer-statuses/${id}`,
  CUSTOMER_STATUSES_REORDER: '/api/customer-statuses/reorder',

  // Project Statuses
  PROJECT_STATUSES: '/api/project-statuses',
  PROJECT_STATUS: (id: string) => `/api/project-statuses/${id}`,
  PROJECT_STATUSES_REORDER: '/api/project-statuses/reorder',

  // Quote Statuses
  QUOTE_STATUSES: '/api/quote-statuses',
  QUOTE_STATUS: (id: string) => `/api/quote-statuses/${id}`,
  QUOTE_STATUSES_REORDER: '/api/quote-statuses/reorder',

  // Invoice Statuses
  INVOICE_STATUSES: '/api/invoice-statuses',
  INVOICE_STATUS: (id: string) => `/api/invoice-statuses/${id}`,
  INVOICE_STATUSES_REORDER: '/api/invoice-statuses/reorder',
} as const;

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================
// HELPER FUNCTIONS - Convert API Response to App Status
// ============================================

export function mapStatusResponseToStatus(response: StatusResponse): Status {
  return {
    id: response.id,
    name: response.name,
    color: response.color,
    order: response.display_order,
  };
}

export function mapStatusToCreateRequest(status: Omit<Status, 'id' | 'order'> & { code: string; order?: number }): CreateStatusRequest {
  return {
    code: status.code,
    name: status.name,
    color: status.color,
    display_order: status.order,
  };
}

// ============================================
// API CLIENT INTERFACE (for future implementation)
// ============================================

export interface StatusApiClient {
  // Get all statuses
  getAll(): Promise<StatusResponse[]>;
  
  // Get single status
  getById(id: string): Promise<StatusResponse>;
  
  // Create new status
  create(data: CreateStatusRequest): Promise<StatusResponse>;
  
  // Update status
  update(id: string, data: UpdateStatusRequest): Promise<StatusResponse>;
  
  // Delete status
  delete(id: string): Promise<void>;
  
  // Reorder statuses
  reorder(statusIds: string[]): Promise<void>;
}

// ============================================
// MODULE-SPECIFIC STATUS API TYPES
// ============================================

export type CustomerStatusApiClient = StatusApiClient;
export type ProjectStatusApiClient = StatusApiClient;
export type QuoteStatusApiClient = StatusApiClient;
export type InvoiceStatusApiClient = StatusApiClient;

