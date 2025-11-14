/**
 * Request Signing Utilities
 * Generates secure request signatures using HMAC-SHA256
 */

import CryptoJS from 'crypto-js'

/**
 * Get API secret from environment variable
 * In production, this should be stored securely
 */
function getApiSecret(): string {
  // In production, use environment variable
  // In development, use a default secret (should be changed)
  return process.env.NEXT_PUBLIC_API_SECRET || 'default-dev-secret-change-in-production'
}

/**
 * Generate a random nonce
 */
function generateNonce(): string {
  return CryptoJS.lib.WordArray.random(16).toString()
}

/**
 * Generate request signature using HMAC-SHA256
 * 
 * @param method HTTP method (GET, POST, etc.)
 * @param path Request path
 * @param timestamp Request timestamp (Unix timestamp in seconds)
 * @param nonce Random nonce
 * @param body Request body (optional, for POST/PUT requests)
 * @returns HMAC-SHA256 signature
 */
export function generateRequestSignature(
  method: string,
  path: string,
  timestamp: number,
  nonce: string,
  body?: string
): string {
  const apiSecret = getApiSecret()
  
  // Create signature payload
  // Format: method|path|timestamp|nonce|body_hash
  const bodyHash = body ? CryptoJS.SHA256(body).toString() : ''
  const payload = `${method.toUpperCase()}|${path}|${timestamp}|${nonce}|${bodyHash}`
  
  // Generate HMAC-SHA256 signature
  const signature = CryptoJS.HmacSHA256(payload, apiSecret).toString()
  
  return signature
}

/**
 * Generate secure headers for API requests
 * 
 * @param method HTTP method
 * @param path Request path
 * @param body Request body (optional)
 * @returns Object with security headers
 */
export async function getSecureHeaders(
  method: string,
  path: string,
  body?: string
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
  const nonce = generateNonce()
  const signature = generateRequestSignature(method, path, timestamp, nonce, body)
  
  return {
    'X-Request-Timestamp': timestamp.toString(),
    'X-Request-Nonce': nonce,
    'X-Request-Signature': signature,
  }
}

/**
 * Generate request ID (UUID v4)
 */
export function generateRequestId(): string {
  // Simple UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

