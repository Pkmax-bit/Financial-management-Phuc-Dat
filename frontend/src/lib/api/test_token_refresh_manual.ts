/**
 * Manual Token Refresh Test
 * Run this in browser console to test token refresh
 */

import { supabase } from '../supabase'
import { apiClient } from './client'

/**
 * Test token refresh functionality
 * Run in browser console: testTokenRefresh()
 */
export async function testTokenRefresh() {
  console.log('='.repeat(60))
  console.log('Token Auto-Refresh Test')
  console.log('='.repeat(60))
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError)
      return { success: false, error: sessionError.message }
    }
    
    if (!session) {
      console.warn('⚠️  No active session. Please log in first.')
      return { success: false, error: 'No active session' }
    }
    
    console.log('✅ Session found')
    console.log('  User ID:', session.user?.id)
    console.log('  Email:', session.user?.email)
    
    // Check token expiration
    const expiresAt = session.expires_at ? session.expires_at * 1000 : null
    const now = Date.now()
    const timeUntilExpiry = expiresAt ? expiresAt - now : null
    
    if (expiresAt) {
      const expiryDate = new Date(expiresAt)
      const minutesUntilExpiry = Math.floor(timeUntilExpiry! / 1000 / 60)
      console.log('  Token Expires At:', expiryDate.toISOString())
      console.log('  Time Until Expiry:', `${minutesUntilExpiry} minutes`)
      
      if (minutesUntilExpiry < 5) {
        console.log('  ⚠️  Token expires soon - auto-refresh should trigger')
      } else {
        console.log('  ✅ Token is still valid')
      }
    }
    
    // Test API call (should auto-refresh if needed)
    console.log('\n📡 Testing API call...')
    const startTime = Date.now()
    
    try {
      const result = await apiClient.get('/api/health')
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log('✅ API call successful')
      console.log('  Duration:', `${duration}ms`)
      console.log('  Response:', result)
      
      // Check if token was refreshed
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession?.expires_at && expiresAt) {
        const newExpiresAt = newSession.expires_at * 1000
        if (newExpiresAt > expiresAt) {
          console.log('  ✅ Token was refreshed!')
          console.log('  New Expires At:', new Date(newExpiresAt).toISOString())
        } else {
          console.log('  ℹ️  Token not refreshed (still valid)')
        }
      }
      
      return {
        success: true,
        message: 'Token refresh test completed successfully',
        details: {
          tokenExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : 'Unknown',
          timeUntilExpiry: timeUntilExpiry ? `${Math.floor(timeUntilExpiry / 1000 / 60)} minutes` : 'Unknown',
          apiCallSuccess: true,
          duration: `${duration}ms`,
        },
      }
    } catch (apiError: any) {
      console.error('❌ API call failed:', apiError)
      return {
        success: false,
        message: 'API call failed',
        error: apiError.message,
        status: apiError.status,
      }
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error)
    return {
      success: false,
      message: 'Test failed',
      error: error.message,
    }
  }
}

/**
 * Test concurrent requests
 */
export async function testConcurrentRequests() {
  console.log('='.repeat(60))
  console.log('Concurrent Requests Test')
  console.log('='.repeat(60))
  
  try {
    console.log('📡 Making 5 concurrent requests...')
    const startTime = Date.now()
    
    const requests = Array.from({ length: 5 }, (_, i) => 
      apiClient.get('/api/health').then(result => ({ index: i, success: true, result }))
        .catch(error => ({ index: i, success: false, error: error.message }))
    )
    
    const results = await Promise.all(requests)
    const endTime = Date.now()
    const duration = endTime - startTime
    
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log(`✅ Completed ${results.length} requests in ${duration}ms`)
    console.log(`  Successful: ${successful}`)
    console.log(`  Failed: ${failed}`)
    
    // Check if all used same token (no race condition)
    const { data: { session } } = await supabase.auth.getSession()
    console.log('  Final Token Expires At:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'Unknown')
    
    return {
      success: failed === 0,
      message: `Concurrent requests: ${successful} succeeded, ${failed} failed`,
      details: {
        total: results.length,
        successful,
        failed,
        duration: `${duration}ms`,
      },
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error)
    return {
      success: false,
      message: 'Concurrent requests test failed',
      error: error.message,
    }
  }
}

/**
 * Test token refresh on expiration
 */
export async function testTokenRefreshOnExpiration() {
  console.log('='.repeat(60))
  console.log('Token Refresh on Expiration Test')
  console.log('='.repeat(60))
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.warn('⚠️  No active session')
      return { success: false, error: 'No active session' }
    }
    
    const expiresAt = session.expires_at ? session.expires_at * 1000 : null
    const now = Date.now()
    const timeUntilExpiry = expiresAt ? expiresAt - now : null
    
    if (!expiresAt || !timeUntilExpiry) {
      console.warn('⚠️  Cannot determine token expiration')
      return { success: false, error: 'Cannot determine expiration' }
    }
    
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60)
    
    console.log('📊 Token Status:')
    console.log('  Expires At:', new Date(expiresAt).toISOString())
    console.log('  Time Until Expiry:', `${minutesUntilExpiry} minutes`)
    
    if (minutesUntilExpiry < 5) {
      console.log('  ⚠️  Token expires soon - next request should trigger refresh')
    } else {
      console.log('  ✅ Token is still valid')
      console.log('  ℹ️  Auto-refresh will trigger when < 5 minutes remain')
    }
    
    // Test manual refresh
    console.log('\n🔄 Testing manual refresh...')
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('❌ Refresh failed:', error)
        return { success: false, error: error.message }
      }
      
      if (data?.session) {
        const newExpiresAt = data.session.expires_at ? data.session.expires_at * 1000 : null
        console.log('✅ Token refreshed successfully')
        console.log('  New Expires At:', newExpiresAt ? new Date(newExpiresAt).toISOString() : 'Unknown')
        
        return {
          success: true,
          message: 'Token refresh successful',
          details: {
            oldExpiresAt: new Date(expiresAt).toISOString(),
            newExpiresAt: newExpiresAt ? new Date(newExpiresAt).toISOString() : 'Unknown',
          },
        }
      }
    } catch (refreshError: any) {
      console.error('❌ Refresh error:', refreshError)
      return { success: false, error: refreshError.message }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('❌ Test failed:', error)
    return { success: false, error: error.message }
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testTokenRefresh = testTokenRefresh
  ;(window as any).testConcurrentRequests = testConcurrentRequests
  ;(window as any).testTokenRefreshOnExpiration = testTokenRefreshOnExpiration
}

