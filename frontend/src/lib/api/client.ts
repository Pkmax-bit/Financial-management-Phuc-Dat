/**
 * Base API Client
 * Provides caching, retry logic, error handling, and request deduplication
 */

import { supabase } from '../supabase'
import { getSecureHeaders, generateRequestId } from './security'

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

  // Token refresh state
  private refreshPromise: Promise<any> | null = null
  private refreshThreshold: number = 5 * 60 * 1000 // 5 minutes in milliseconds
  private redirectingToLogin: boolean = false // Flag to prevent multiple redirects

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:8000')
    this.cache = new Map()
    this.pendingRequests = new Map()
  }

  /**
   * Check if token is expired or about to expire
   */
  private isTokenExpiringSoon(session: any): boolean {
    if (!session?.access_token) {
      return false
    }

    try {
      // Supabase JWT tokens contain expiration in 'exp' claim
      // Parse JWT to get expiration (without verification, just for expiration check)
      const tokenParts = session.access_token.split('.')
      if (tokenParts.length !== 3) {
        return false
      }

      // Decode JWT payload (base64url)
      const payload = JSON.parse(
        atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/'))
      )

      // Check expiration
      if (!payload.exp) {
        return false
      }

      // exp is Unix timestamp in seconds
      const expiresAt = payload.exp * 1000
      const now = Date.now()
      const timeUntilExpiry = expiresAt - now

      // Return true if token expires within threshold (5 minutes)
      return timeUntilExpiry > 0 && timeUntilExpiry < this.refreshThreshold
    } catch (error) {
      // If we can't parse token, assume it's valid and don't refresh
      console.warn('Failed to parse token expiration:', error)
      return false
    }
  }

  /**
   * Refresh session token
   */
  private async refreshSession(): Promise<any> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    // Create refresh promise
    this.refreshPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()

        if (error) {
          console.warn('Failed to refresh session:', error)
          throw error
        }

        return data
      } finally {
        // Clear refresh promise after completion
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  /**
   * Get authentication headers with auto-refresh
   */
  private async getAuthHeaders(skipAuth: boolean = false): Promise<Record<string, string>> {
    try {
      console.log('[API] Getting auth headers...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      console.log('[API] Session error:', sessionError)
      console.log('[API] Session exists:', !!session)
      console.log('[API] Access token exists:', !!session?.access_token)

      if (sessionError) {
        console.warn('Failed to get session:', sessionError)
        if (!skipAuth) {
          // If auth is required and we can't get session, redirect to login if in browser
          if (typeof window !== 'undefined') {
            const loginUrl = '/login'
            console.warn('[API] No valid session, redirecting to login...')
            setTimeout(() => {
              window.location.href = loginUrl
            }, 100)
          }
          // If auth is required and we can't get session, throw error
          throw new ApiError('Not authenticated', 401)
        }
        return {
          'Content-Type': 'application/json',
        }
      }

      // If auth is required but no session, throw error
      if (!skipAuth && !session?.access_token) {
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          const loginUrl = '/login'
          console.warn('[API] No valid session, redirecting to login...')
          setTimeout(() => {
            window.location.href = loginUrl
          }, 100)
        }
        throw new ApiError('Not authenticated', 401)
      }

      // Check if token needs refresh
      if (session && this.isTokenExpiringSoon(session)) {
        try {
          // Refresh token before it expires
          const refreshed = await this.refreshSession()
          if (refreshed?.session?.access_token) {
            return {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshed.session.access_token}`,
            }
          }
        } catch (refreshError) {
          console.warn('Token refresh failed, using current token:', refreshError)
          // Fall through to use current token
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      return headers
    } catch (error) {
      // If it's already an ApiError, rethrow it
      if (error instanceof ApiError) {
        throw error
      }
      console.warn('Failed to get auth headers:', error)
      if (!skipAuth) {
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          const loginUrl = '/login'
          console.warn('[API] Authentication failed, redirecting to login...')
          setTimeout(() => {
            window.location.href = loginUrl
          }, 100)
        }
        throw new ApiError('Not authenticated', 401)
      }
      return {
        'Content-Type': 'application/json',
      }
    }
  }

  /**
   * Get secure headers with request signing
   */
  private async getSecureHeaders(
    method: string,
    path: string,
    body?: string,
    skipAuth: boolean = false
  ): Promise<Record<string, string>> {
    // Get base auth headers
    const authHeaders = await this.getAuthHeaders(skipAuth)

    // Add request signing headers if enabled
    // In development, this can be disabled
    const enableSigning = process.env.NEXT_PUBLIC_ENABLE_REQUEST_SIGNING !== 'false'

    if (enableSigning) {
      try {
        const secureHeaders = await getSecureHeaders(method, path, body)
        const requestId = generateRequestId()

        return {
          ...authHeaders,
          ...secureHeaders,
          'X-Request-ID': requestId,
        }
      } catch (error) {
        console.warn('Failed to generate secure headers:', error)
        // Fallback to auth headers only
        return {
          ...authHeaders,
          'X-Request-ID': generateRequestId(),
        }
      }
    }

    // Return auth headers with request ID
    return {
      ...authHeaders,
      'X-Request-ID': generateRequestId(),
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
    let url: string
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      url = endpoint
    } else {
      // Handle Next.js API routes locally (don't add baseUrl)
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint
      if (cleanEndpoint.startsWith('/api/')) {
        // Next.js API routes should be handled by Next.js server directly
        url = cleanEndpoint
      } else {
        // Other endpoints use the backend API server
        url = `${this.baseUrl}${cleanEndpoint}`
      }
    }
    const retries = options.retries ?? this.defaultRetries
    let lastError: Error | null = null

    // Get secure headers with request signing
    let path: string
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      path = new URL(endpoint).pathname
    } else {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint
      path = cleanEndpoint
    }
    const method = options.method || 'GET'
    
    // Handle FormData differently - don't stringify it
    const isFormData = options.body instanceof FormData
    const bodyString = options.body 
      ? (isFormData ? undefined : (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)))
      : undefined
    const skipAuth = options.skipAuth ?? false

    const headers = await this.getSecureHeaders(method, path, bodyString, skipAuth)
    if (options.headers) {
      Object.assign(headers, options.headers)
    }
    
    // For FormData, don't set Content-Type - browser will set it with boundary
    if (isFormData) {
      delete headers['Content-Type']
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
          // Parse error response first to check if it's an authentication error
          let errorData: any
          try {
            const text = await response.text()
            errorData = text ? JSON.parse(text) : {}
          } catch {
            errorData = { message: response.statusText }
          }

          const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`
          
          // Check if this is an authentication error (401 or 403 with auth-related message)
          const isAuthError = response.status === 401 || 
            (response.status === 403 && (
              errorMessage.toLowerCase().includes('not authenticated') ||
              errorMessage.toLowerCase().includes('authentication') ||
              errorMessage.toLowerCase().includes('unauthorized') ||
              errorMessage.toLowerCase().includes('token')
            ))

          // Handle authentication errors (401 or 403 with auth message)
          if (isAuthError) {
            // Try to refresh token and retry
            try {
              const refreshed = await this.refreshSession()
              if (refreshed?.session?.access_token) {
                // Update headers with new token and retry
                const newHeaders = await this.getSecureHeaders(method, path, bodyString, skipAuth)
                if (options.headers) {
                  Object.assign(newHeaders, options.headers)
                }
                requestOptions.headers = newHeaders

                // Retry with refreshed token
                if (attempt < retries - 1) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
                  continue
                }
              } else {
                // No valid session after refresh - only redirect if this is a real auth error
                // Check one more time if we have a session
                const { data: { session: finalCheck } } = await supabase.auth.getSession()
                if (!finalCheck?.access_token) {
                  // No valid session - redirect to login if in browser
                  if (typeof window !== 'undefined' && !this.redirectingToLogin) {
                    this.redirectingToLogin = true
                    const loginUrl = '/login'
                    console.warn('[API] No valid session after refresh, redirecting to login...')
                    setTimeout(() => {
                      window.location.href = loginUrl
                    }, 100)
                  }
                  throw new ApiError('Unauthorized - Token refresh failed', response.status)
                }
                // We have a session, so don't redirect - just throw the error
                throw new ApiError('Unauthorized - Token refresh failed', response.status)
              }
            } catch (refreshError) {
              // Refresh failed, check if we have a session
              const { data: { session } } = await supabase.auth.getSession()
              if (!session?.access_token) {
                // No valid session - only redirect if this is definitely an auth error
                // Don't redirect for other types of errors
                if (typeof window !== 'undefined' && isAuthError && !this.redirectingToLogin) {
                  this.redirectingToLogin = true
                  const loginUrl = '/login'
                  console.warn('[API] No valid session after refresh error, redirecting to login...')
                  setTimeout(() => {
                    window.location.href = loginUrl
                  }, 100)
                }
                throw new ApiError('Unauthorized', response.status)
              }
              // We have a session, so retry with current token (might work if it's a temporary issue)
              if (attempt < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
                continue
              }
              // If we have a session but refresh failed, don't redirect - just throw
              throw new ApiError('Request failed after token refresh attempt', response.status)
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
          
          // If authentication error and in browser, redirect to login
          // Only redirect if we haven't already initiated a redirect
          if (isAuthError && typeof window !== 'undefined' && !this.redirectingToLogin) {
            // Double-check we don't have a session before redirecting
            const { data: { session: finalSessionCheck } } = await supabase.auth.getSession()
            if (!finalSessionCheck?.access_token) {
              this.redirectingToLogin = true
              const loginUrl = '/login'
              console.warn('[API] Authentication failed, redirecting to login...')
              // Use setTimeout to allow error to be thrown first
              setTimeout(() => {
                window.location.href = loginUrl
              }, 100)
            }
          }
          
          throw new ApiError(errorMessage, response.status, errorData)
        }

        // Parse successful response
        // Check if response has content and is JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          return data as T
        } else {
          // For non-JSON responses (e.g., file uploads), return text or empty object
          const text = await response.text()
          try {
            return JSON.parse(text) as T
          } catch {
            return (text ? { message: text } : {}) as T
          }
        }
      } catch (error) {
        lastError = error as Error

        // Don't retry on 4xx errors (except 401, 403 auth errors, 429)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          // Check if 403 is an auth error by checking the error message
          const is403AuthError = error.status === 403 && (
            error.message.toLowerCase().includes('not authenticated') ||
            error.message.toLowerCase().includes('authentication') ||
            error.message.toLowerCase().includes('unauthorized') ||
            error.message.toLowerCase().includes('token')
          )
          
          if (error.status !== 401 && !is403AuthError && error.status !== 429) {
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

