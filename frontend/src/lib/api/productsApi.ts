/**
 * Products API Service
 * Handles all product-related API calls
 */

import { apiClient } from './client'

// Types
export interface Product {
  id: string
  name: string
  description?: string
  category_id?: string
  unit?: string
  price?: number
  cost?: number
  actual_material_cost?: number
  actual_material_components?: Array<{
    expense_object_id: string
    unit?: string
    unit_price: number
    quantity: number
  }>
  is_active?: boolean
  area?: number | null
  volume?: number | null
  height?: number | null
  length?: number | null
  depth?: number | null
  product_categories?: {
    name: string
  }
  created_at?: string
  updated_at?: string
}

export interface ProductCategory {
  id: string
  name: string
  description?: string
  parent_id?: string
}

export interface ProductCreate {
  name: string
  description?: string
  category_id?: string
  unit?: string
  price?: number
  cost?: number
  actual_material_cost?: number
  is_active?: boolean
  area?: number | null
  volume?: number | null
  height?: number | null
  length?: number | null
  depth?: number | null
}

export interface ProductUpdate {
  name?: string
  description?: string
  category_id?: string
  unit?: string
  price?: number
  cost?: number
  actual_material_cost?: number
  is_active?: boolean
  area?: number | null
  volume?: number | null
  height?: number | null
  length?: number | null
  depth?: number | null
}

interface GetProductsParams {
  skip?: number
  limit?: number
  search?: string
  category_id?: string
  is_active?: boolean
}

/**
 * Products API Service
 */
export const productsApi = {
  /**
   * Get all products with optional filtering
   */
  getProducts: (params?: GetProductsParams): Promise<Product[]> => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.category_id) searchParams.append('category_id', params.category_id)
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString())
    
    const query = searchParams.toString()
    return apiClient.get<Product[]>(`/api/sales/products${query ? '?' + query : ''}`, {
      useCache: true,
    })
  },

  /**
   * Get single product by ID
   */
  getProduct: (id: string): Promise<Product> => {
    return apiClient.get<Product>(`/api/sales/products/${id}`, {
      useCache: true,
    })
  },

  /**
   * Create new product
   */
  createProduct: (data: ProductCreate): Promise<Product> => {
    return apiClient.post<Product>('/api/sales/products', data)
  },

  /**
   * Update product
   */
  updateProduct: (id: string, data: ProductUpdate): Promise<Product> => {
    return apiClient.put<Product>(`/api/sales/products/${id}`, data)
  },

  /**
   * Delete product
   */
  deleteProduct: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/sales/products/${id}`)
  },

  /**
   * Get product categories
   */
  getProductCategories: (): Promise<ProductCategory[]> => {
    return apiClient.get<ProductCategory[]>('/api/sales/products/categories', {
      useCache: true,
    })
  },

  /**
   * Create product category
   */
  createProductCategory: (data: { name: string; description?: string; parent_id?: string }): Promise<ProductCategory> => {
    return apiClient.post<ProductCategory>('/api/sales/products/categories', data)
  },

  /**
   * Import products from Excel
   */
  importProducts: (data: { file: File }): Promise<{ imported: number; errors: any[] }> => {
    // Note: This might need FormData handling
    return apiClient.post<{ imported: number; errors: any[] }>('/api/sales/products/import', data)
  },
}

export default productsApi

