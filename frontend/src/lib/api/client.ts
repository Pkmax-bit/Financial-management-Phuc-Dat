/**
 * Base API Client
 * Provides caching, retry logic, error handling, and request deduplication
 */

import { supabase } from '../supabase'

// Types
interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface RequestOptions extends RequestInit {
  useCache?: boolean
  cacheTTL?: number
  retries?: number
  skipAuth?: boolean
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Base API Client Class
 */
class ApiClient {
  private baseUrl: string
  private cache: Map<string, CacheEntry<any>>
  private pendingRequests: Map<string, Promise<any>>
  private defaultCacheTTL: number = 30000 // 30 seconds
  private defaultRetries: number = 3

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    this.cache = new Map()
    this.pendingRequests = new Map()
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      return headers
    } catch (error) {
      console.warn('Failed to get auth headers:', error)
      return {
        'Content-Type': 'application/json',
      }
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(key: string, ttl: number): boolean {
    const cached = this.cache.get(key)
    if (!cached) return false
    
    return Date.now() - cached.timestamp < ttl
  }

  /**
   * Get cached data
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    return cached.data as T
  }

  /**
   * Set cache data
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Create cache key from endpoint and options
   */
  private createCacheKey(endpoint: string, options: RequestOptions): string {
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${endpoint}:${body}`
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    // Check if endpoint is already a full URL
    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
    const retries = options.retries ?? this.defaultRetries
    let lastError: Error | null = null

    const headers = await this.getAuthHeaders()
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
    }

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions)

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 401) {
            // Try to refresh token (if possible)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) {
              throw new ApiError('Unauthorized', 401)
            }
            // Retry with new token
            if (attempt < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
              continue
            }
          }

          if (response.status === 429) {
            // Rate limit - wait and retry
            if (attempt < retries - 1) {
              const retryAfter = response.headers.get('Retry-After')
              const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
              await new Promise(resolve => setTimeout(resolve, waitTime))
              continue
            }
          }

          // Parse error response
          let errorData: any
          try {
            const text = await response.text()
            errorData = text ? JSON.parse(text) : {}
          } catch {
            errorData = { message: response.statusText }
          }

          const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`
          throw new ApiError(errorMessage, response.status, errorData)
        }

        // Parse successful response
        const data = await response.json()
        return data as T
      } catch (error) {
        lastError = error as Error

        // Don't retry on 4xx errors (except 401, 429)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          if (error.status !== 401 && error.status !== 429) {
            throw error
          }
        }

        // Exponential backoff
        if (attempt < retries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    throw lastError || new Error('Request failed after retries')
  }

  /**
   * Main request method with caching and deduplication
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const cacheKey = this.createCacheKey(endpoint, options)
    const useCache = options.useCache ?? false
    const cacheTTL = options.cacheTTL ?? this.defaultCacheTTL

    // Check cache for GET requests
    if (useCache && (options.method === 'GET' || !options.method)) {
      if (this.isCacheValid(cacheKey, cacheTTL)) {
        const cached = this.getCached<T>(cacheKey)
        if (cached !== null) {
          return cached
        }
      }
    }

    // Check for pending requests (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>
    }

    // Create new request
    const requestPromise = this.makeRequest<T>(endpoint, options)
      .then((data) => {
        // Cache successful responses
        if (useCache && (options.method === 'GET' || !options.method)) {
          this.setCache(cacheKey, data)
        }
        return data
      })
      .finally(() => {
        // Remove from pending after completion
        this.pendingRequests.delete(cacheKey)
      })

    this.pendingRequests.set(cacheKey, requestPromise)
    return requestPromise
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
      useCache: options.useCache ?? true, // Default to caching for GET
    })
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      useCache: false, // Don't cache POST requests
    })
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      useCache: false, // Don't cache PUT requests
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      useCache: false, // Don't cache DELETE requests
    })
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  /**
   * Invalidate cache for specific endpoint
   */
  invalidateCache(endpoint: string): void {
    const pattern = `:${endpoint}:`
    this.clearCache(pattern)
  }

  /**
   * Get cache stats (for debugging)
   */
  getCacheStats(): {
    size: number
    keys: string[]
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export { ApiClient, ApiError }
export type { RequestOptions }

