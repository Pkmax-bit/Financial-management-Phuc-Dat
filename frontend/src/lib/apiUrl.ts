/**
 * API URL utilities
 * Helper functions to get API base URL and construct full endpoint URLs
 */

/**
 * Get the API base URL
 * @returns The API base URL from environment variable or default
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

/**
 * Get the full API endpoint URL
 * @param endpoint - The API endpoint path (e.g., '/api/sales/quotes')
 * @returns The full URL with base URL and endpoint
 */
export function getApiEndpoint(endpoint: string): string {
  const baseUrl = getApiUrl()
  // Remove leading slash from endpoint if present, we'll add it
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${cleanEndpoint}`
}

// Default export for compatibility
export default {
  getApiUrl,
  getApiEndpoint,
}

