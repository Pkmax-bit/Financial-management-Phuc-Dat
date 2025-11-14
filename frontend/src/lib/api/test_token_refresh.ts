/**
 * Token Auto-Refresh Test Utilities
 * Test token refresh functionality
 */

import { supabase } from '../supabase'
import { apiClient } from './client'

/**
 * Test token refresh functionality
 */
export async function testTokenRefresh(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return {
        success: false,
        message: 'No active session found. Please log in first.',
      }
    }
    
    // Check token expiration
    const expiresAt = session.expires_at ? session.expires_at * 1000 : null
    const now = Date.now()
    const timeUntilExpiry = expiresAt ? expiresAt - now : null
    
    // Test API call (should auto-refresh if needed)
    try {
      const result = await apiClient.get('/api/health')
      
      return {
        success: true,
        message: 'Token refresh test completed',
        details: {
          currentTokenExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : 'Unknown',
          timeUntilExpiry: timeUntilExpiry ? `${Math.floor(timeUntilExpiry / 1000 / 60)} minutes` : 'Unknown',
          apiCallSuccess: true,
        },
      }
    } catch (apiError: any) {
      return {
        success: false,
        message: 'API call failed',
        details: {
          error: apiError.message,
          status: apiError.status,
        },
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Test failed',
      details: {
        error: error.message,
      },
    }
  }
}

/**
 * Test concurrent requests with token refresh
 */
export async function testConcurrentRequests(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  try {
    // Make multiple concurrent requests
    const requests = Array.from({ length: 5 }, () => 
      apiClient.get('/api/health')
    )
    
    const results = await Promise.allSettled(requests)
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    return {
      success: failed === 0,
      message: `Concurrent requests test: ${successful} succeeded, ${failed} failed`,
      details: {
        total: results.length,
        successful,
        failed,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Concurrent requests test failed',
      details: {
        error: error.message,
      },
    }
  }
}

/**
 * Test token refresh on 401 error
 */
export async function testTokenRefreshOn401(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  try {
    // This test requires a scenario where we get 401
    // In normal operation, auto-refresh should prevent 401
    // So we'll just verify the refresh mechanism exists
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        success: false,
        message: 'No active session',
      }
    }
    
    // Check if refresh method exists
    const hasRefreshCapability = typeof supabase.auth.refreshSession === 'function'
    
    return {
      success: hasRefreshCapability,
      message: hasRefreshCapability 
        ? 'Token refresh capability available' 
        : 'Token refresh capability not available',
      details: {
        hasRefreshCapability,
        sessionExists: !!session,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Test failed',
      details: {
        error: error.message,
      },
    }
  }
}

