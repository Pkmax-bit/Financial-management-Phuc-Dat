import { getApiEndpoint } from '@/lib/apiUrl'
import { supabase } from '@/lib/supabase'
import {
    CustomProductCategory,
    CustomProductColumn,
    CustomProductOption,
    CreateCustomProductPayload,
    CustomProduct
} from '@/types/customProduct'

// Cache for options to prevent duplicate API calls
const optionsCache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

// Debounce map to prevent rapid successive calls
const pendingRequests = new Map<string, Promise<any[]>>()

export const customProductService = {
    // Categories
    getCategories: async (activeOnly = true): Promise<CustomProductCategory[]> => {
        try {
            const session = await supabase.auth.getSession()
            const token = session.data.session?.access_token

            if (!token) {
                throw new Error('No authentication token available. Please log in again.')
            }

            const response = await fetch(getApiEndpoint('/api/custom-products/categories?active_only=' + activeOnly), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.')
                } else if (response.status === 403) {
                    throw new Error('You do not have permission to access this resource.')
                } else if (response.status === 429) {
                    throw new Error('Too many requests. Please wait a moment and try again.')
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.')
                } else {
                    throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`)
                }
            }

            return response.json()
        } catch (error) {
            // Handle network errors (TypeError from fetch)
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('Network error in getCategories:', error)
                throw new Error('Network connection failed. Please check your internet connection.')
            }
            console.error('Error in getCategories:', error)
            throw error
        }
    },

    createCategory: async (category: { name: string; description?: string }): Promise<CustomProductCategory> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint('/api/custom-products/categories'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(category),
        })
        if (!response.ok) throw new Error('Failed to create category')
        return response.json()
    },

    updateCategory: async (id: string, category: Partial<CustomProductCategory>): Promise<CustomProductCategory> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint(`/api/custom-products/categories/${id}`), {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(category),
        })
        if (!response.ok) throw new Error('Failed to update category')
        return response.json()
    },

    deleteCategory: async (id: string): Promise<void> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint(`/api/custom-products/categories/${id}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        if (!response.ok) throw new Error('Failed to delete category')
    },

    // Columns
    getColumns: async (activeOnly = true): Promise<CustomProductColumn[]> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint('/api/custom-products/columns?active_only=' + activeOnly), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) throw new Error('Failed to fetch columns')
        return response.json()
    },

    getColumnsByCategory: async (categoryId: string, activeOnly = true): Promise<CustomProductColumn[]> => {
        try {
            const session = await supabase.auth.getSession()
            const token = session.data.session?.access_token

            if (!token) {
                throw new Error('No authentication token available. Please log in again.')
            }

            const response = await fetch(getApiEndpoint(`/api/custom-products/categories/${categoryId}/columns?active_only=${activeOnly}`), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.')
                } else if (response.status === 403) {
                    throw new Error('You do not have permission to access this resource.')
                } else if (response.status === 429) {
                    throw new Error('Too many requests. Please wait a moment and try again.')
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.')
                } else {
                    throw new Error(`Failed to fetch columns by category: ${response.status} ${response.statusText}`)
                }
            }

            return response.json()
        } catch (error) {
            // Handle network errors (TypeError from fetch)
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('Network error in getColumnsByCategory:', error)
                throw new Error('Network connection failed. Please check your internet connection.')
            }
            console.error('Error in getColumnsByCategory:', error)
            throw error
        }
    },

    getOptions: async (columnId?: string, activeOnly = true): Promise<CustomProductOption[]> => {
        try {
            // Check cache first if columnId is provided
            if (columnId) {
                const cacheKey = `${columnId}_${activeOnly}`
                const cached = optionsCache.get(cacheKey)
                if (cached && (Date.now() - cached.timestamp) < CACHE_TIMEOUT) {
                    console.log(`Using cached options for column ${columnId}`)
                    return cached.data
                }

                // Check if there's already a pending request for this column
                const pendingKey = cacheKey
                if (pendingRequests.has(pendingKey)) {
                    console.log(`Waiting for pending request for column ${columnId}`)
                    return pendingRequests.get(pendingKey)
                }
            }

            const session = await supabase.auth.getSession()
            const token = session.data.session?.access_token

            if (!token) {
                throw new Error('No authentication token available. Please log in again.')
            }

            let url = `/api/custom-products/options?active_only=${activeOnly}`
            if (columnId) {
                url += `&column_id=${columnId}`
                const cacheKey = `${columnId}_${activeOnly}`

                // Create the request promise and store it to prevent duplicate calls
                const requestPromise = this._fetchOptions(url, token, columnId, activeOnly, cacheKey)
                pendingRequests.set(cacheKey, requestPromise)

                try {
                    return await requestPromise
                } finally {
                    // Clean up the pending request
                    pendingRequests.delete(cacheKey)
                }
            }

            // For non-column-specific requests, just fetch directly
            return await this._fetchOptions(url, token, columnId, activeOnly)
            const response = await fetch(getApiEndpoint(url), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.')
                } else if (response.status === 403) {
                    throw new Error('You do not have permission to access this resource.')
                } else if (response.status === 429) {
                    throw new Error('Too many requests. Please wait a moment and try again.')
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.')
                } else {
                    throw new Error(`Failed to fetch options: ${response.status} ${response.statusText}`)
                }
            }

            const data = await response.json()

            // Cache the results if columnId is provided
            if (columnId) {
                const cacheKey = `${columnId}_${activeOnly}`
                optionsCache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                })
            }

            return data
        } catch (error) {
            // Handle network errors (TypeError from fetch)
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('Network error in getOptions:', error)
                throw new Error('Network connection failed. Please check your internet connection.')
            }
            console.error('Error in getOptions:', error)
            throw error
        }
    },

    _fetchOptions: async (url: string, token: string, columnId?: string, activeOnly?: boolean, cacheKey?: string): Promise<CustomProductOption[]> => {
        const response = await fetch(getApiEndpoint(url), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication failed. Please log in again.')
            } else if (response.status === 403) {
                throw new Error('You do not have permission to access this resource.')
            } else if (response.status === 429) {
                throw new Error('Too many requests. Please wait a moment and try again.')
            } else if (response.status >= 500) {
                throw new Error('Server error. Please try again later.')
            } else {
                throw new Error(`Failed to fetch options: ${response.status} ${response.statusText}`)
            }
        }

        const data = await response.json()

        // Cache the results if cacheKey is provided
        if (cacheKey) {
            optionsCache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            })
        }

        return data
    },

    createProduct: async (product: CreateCustomProductPayload): Promise<CustomProduct> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint('/api/custom-products'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(product),
        })
        if (!response.ok) throw new Error('Failed to create custom product')
        return response.json()
    },

    updateProduct: async (id: string, product: Partial<CreateCustomProductPayload>): Promise<CustomProduct> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint(`/api/custom-products/${id}`), {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(product),
        })
        if (!response.ok) throw new Error('Failed to update custom product')
        return response.json()
    },

    deleteProduct: async (id: string): Promise<void> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint(`/api/custom-products/${id}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        if (!response.ok) throw new Error('Failed to delete custom product')
    },

    getProducts: async (categoryId?: string, search?: string, activeOnly = true): Promise<CustomProduct[]> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        let url = `/api/custom-products?active_only=${activeOnly}`
        if (categoryId) url += `&category_id=${categoryId}`
        if (search) url += `&search=${encodeURIComponent(search)}`

        const response = await fetch(getApiEndpoint(url), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) throw new Error('Failed to fetch custom products')
        return response.json()
    },

    getProduct: async (id: string): Promise<CustomProduct> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint(`/api/custom-products/${id}`), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) throw new Error('Failed to fetch custom product')
        return response.json()
    },

    // Structures
    getStructures: async (categoryId?: string, activeOnly = true): Promise<any[]> => {
        try {
            const session = await supabase.auth.getSession()
            const token = session.data.session?.access_token

            if (!token) {
                throw new Error('No authentication token available. Please log in again.')
            }

            let url = `/api/custom-products/structures?active_only=${activeOnly}`
            if (categoryId) url += `&category_id=${categoryId}`

            const response = await fetch(getApiEndpoint(url), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.')
                } else if (response.status === 403) {
                    throw new Error('You do not have permission to access this resource.')
                } else if (response.status === 429) {
                    throw new Error('Too many requests. Please wait a moment and try again.')
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.')
                } else {
                    throw new Error(`Failed to fetch structures: ${response.status} ${response.statusText}`)
                }
            }

            return response.json()
        } catch (error) {
            // Handle network errors (TypeError from fetch)
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('Network error in getStructures:', error)
                throw new Error('Network connection failed. Please check your internet connection.')
            }
            console.error('Error in getStructures:', error)
            throw error
        }
    },

    // New optimized method to get all dashboard data in one request
    getDashboardData: async (): Promise<any> => {
        try {
            const session = await supabase.auth.getSession()
            const token = session.data.session?.access_token

            if (!token) {
                throw new Error('No authentication token available. Please log in again.')
            }

            const response = await fetch(getApiEndpoint('/api/custom-products/dashboard-data'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.')
                } else if (response.status === 403) {
                    throw new Error('You do not have permission to access dashboard data.')
                } else if (response.status === 429) {
                    throw new Error('Too many requests. Please wait a moment and try again.')
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.')
                } else {
                    throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`)
                }
            }

            return response.json()
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('Network error in getDashboardData:', error)
                throw new Error('Network connection failed. Please check your internet connection.')
            }
            console.error('Error in getDashboardData:', error)
            throw error
        }
    },

    createStructure: async (structure: any): Promise<any> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint('/api/custom-products/structures'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(structure),
        })
        if (!response.ok) throw new Error('Failed to create structure')
        return response.json()
    },

    updateStructure: async (id: string, structure: Partial<any>): Promise<any> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint(`/api/custom-products/structures/${id}`), {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(structure),
        })
        if (!response.ok) throw new Error('Failed to update structure')
        return response.json()
    },

    deleteStructure: async (id: string): Promise<void> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint(`/api/custom-products/structures/${id}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        if (!response.ok) throw new Error('Failed to delete structure')
    },

    // Utility
    generateProductName: async (categoryId: string, selectedOptions: Record<string, string>, structureId?: string): Promise<{
      generated_name: string
      option_details: Array<{
        option_name: string
        column_name: string
        category_name: string
        full_text: string
      }>
      separator: string
      generated_parts: string[]
    }> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        let url = `/api/custom-products/generate-name?category_id=${categoryId}`
        Object.entries(selectedOptions).forEach(([key, value]) => {
            url += `&selected_options[${key}]=${value}`
        })
        if (structureId) url += `&structure_id=${structureId}`

        const response = await fetch(getApiEndpoint(url), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) throw new Error('Failed to generate product name')
        return response.json()
    },

    // Clear cache (useful for testing or when data changes)
    clearOptionsCache: () => {
        optionsCache.clear()
        pendingRequests.clear()
        console.log('Options cache cleared')
    }
}
