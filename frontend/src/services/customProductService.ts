import { getApiEndpoint } from '@/lib/apiUrl'
import { supabase } from '@/lib/supabase'
import {
    CustomProductCategory,
    CustomProductColumn,
    CustomProductOption,
    CreateCustomProductPayload,
    CustomProduct
} from '@/types/customProduct'

export const customProductService = {
    // Categories
    getCategories: async (activeOnly = true): Promise<CustomProductCategory[]> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint('/api/custom-products/categories?active_only=' + activeOnly), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) throw new Error('Failed to fetch categories')
        return response.json()
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
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        const response = await fetch(getApiEndpoint(`/api/custom-products/categories/${categoryId}/columns?active_only=${activeOnly}`), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) throw new Error('Failed to fetch columns by category')
        return response.json()
    },

    getOptions: async (columnId?: string, activeOnly = true): Promise<CustomProductOption[]> => {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        let url = `/api/custom-products/options?active_only=${activeOnly}`
        if (columnId) {
            url += `&column_id=${columnId}`
        }
        const response = await fetch(getApiEndpoint(url), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) throw new Error('Failed to fetch options')
        return response.json()
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
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        let url = `/api/custom-products/structures?active_only=${activeOnly}`
        if (categoryId) url += `&category_id=${categoryId}`

        const response = await fetch(getApiEndpoint(url), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        if (!response.ok) throw new Error('Failed to fetch structures')
        return response.json()
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
    generateProductName: async (categoryId: string, selectedOptions: Record<string, string>, structureId?: string): Promise<any> => {
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
    }
}
