/**
 * Browser Console Test Script for Token Auto-Refresh
 * 
 * INSTRUCTIONS:
 * 1. Open your application in browser
 * 2. Make sure you're logged in
 * 3. Open Developer Tools (F12)
 * 4. Go to Console tab
 * 5. Copy and paste this entire script
 * 6. Run: await testTokenAutoRefresh()
 */

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Test 1: Basic Token Refresh
 */
async function testBasicTokenRefresh() {
  console.log('='.repeat(60))
  console.log('TEST 1: Basic Token Refresh')
  console.log('='.repeat(60))
  
  try {
    // Get Supabase client (assuming it's available in window or import)
    let supabase;
    if (window.supabase) {
      supabase = window.supabase;
    } else {
      // Try to get from Next.js app
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || window.location.origin;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || prompt('Enter Supabase Anon Key:');
      supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ No active session. Please log in first.');
      return { success: false, error: 'No active session' };
    }
    
    console.log('✅ Session found');
    console.log('  User ID:', session.user?.id);
    console.log('  Email:', session.user?.email);
    
    // Parse JWT token to get expiration
    try {
      const tokenParts = session.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        
        if (payload.exp) {
          const expiresAt = payload.exp * 1000;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60);
          
          console.log('\n📊 Token Status:');
          console.log('  Expires At:', new Date(expiresAt).toISOString());
          console.log('  Time Until Expiry:', `${minutesUntilExpiry} minutes`);
          
          if (minutesUntilExpiry < 5) {
            console.log('  ⚠️  Token expires soon - auto-refresh should trigger');
          } else {
            console.log('  ✅ Token is still valid');
          }
        }
      }
    } catch (e) {
      console.warn('⚠️  Could not parse token expiration:', e.message);
    }
    
    // Test API call (should auto-refresh if needed)
    console.log('\n📡 Testing API call...');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API call successful');
        console.log('  Duration:', `${duration}ms`);
        console.log('  Response:', data);
        
        // Check if token was refreshed
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession?.access_token && session.access_token !== newSession.access_token) {
          console.log('  ✅ Token was refreshed!');
        }
        
        return { success: true, duration, data };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (apiError) {
      console.error('❌ API call failed:', apiError.message);
      return { success: false, error: apiError.message };
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Concurrent Requests
 */
async function testConcurrentRequests() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 2: Concurrent Requests')
  console.log('='.repeat(60))
  
  try {
    // Get Supabase client
    let supabase;
    if (window.supabase) {
      supabase = window.supabase;
    } else {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || window.location.origin;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || prompt('Enter Supabase Anon Key:');
      supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ No active session');
      return { success: false, error: 'No active session' };
    }
    
    console.log('📡 Making 5 concurrent requests...');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const startTime = Date.now();
    
    const requests = Array.from({ length: 5 }, async (_, i) => {
      try {
        const response = await fetch(`${API_URL}/api/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        return { index: i, success: response.ok, status: response.status };
      } catch (error) {
        return { index: i, success: false, error: error.message };
      }
    });
    
    const results = await Promise.all(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Completed ${results.length} requests in ${duration}ms`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);
    
    results.forEach((r, i) => {
      console.log(`  Request ${i + 1}: ${r.success ? '✅' : '❌'} ${r.status || r.error || ''}`);
    });
    
    return { success: failed === 0, successful, failed, duration };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Token Expiration Check
 */
async function testTokenExpiration() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST 3: Token Expiration Check')
  console.log('='.repeat(60))
  
  try {
    // Get Supabase client
    let supabase;
    if (window.supabase) {
      supabase = window.supabase;
    } else {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || window.location.origin;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || prompt('Enter Supabase Anon Key:');
      supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ No active session');
      return { success: false, error: 'No active session' };
    }
    
    console.log('📊 Token Status:');
    
    // Parse JWT
    try {
      const tokenParts = session.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp) {
          const expiresAt = payload.exp * 1000;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60);
          
          console.log('  Expires At:', new Date(expiresAt).toISOString());
          console.log('  Time Until Expiry:', `${minutesUntilExpiry} minutes`);
          
          if (minutesUntilExpiry < 5) {
            console.log('  ⚠️  Token expires soon - next request should trigger refresh');
          } else {
            console.log('  ✅ Token is still valid');
            console.log('  ℹ️  Auto-refresh will trigger when < 5 minutes remain');
          }
        }
      }
    } catch (e) {
      console.warn('⚠️  Could not parse token:', e.message);
    }
    
    // Test manual refresh
    console.log('\n🔄 Testing manual refresh...');
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Refresh failed:', refreshError.message);
        return { success: false, error: refreshError.message };
      }
      
      if (data?.session) {
        console.log('✅ Token refreshed successfully');
        
        // Parse new token
        try {
          const tokenParts = data.session.access_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp) {
              const newExp = payload.exp * 1000;
              console.log('  New Expires At:', new Date(newExp).toISOString());
            }
          }
        } catch (e) {
          console.log('  New Token:', data.session.access_token.substring(0, 20) + '...');
        }
      }
      
      return { success: true };
    } catch (refreshError) {
      console.error('❌ Refresh error:', refreshError.message);
      return { success: false, error: refreshError.message };
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main test function - runs all tests
 */
async function testTokenAutoRefresh() {
  console.log('\n' + '='.repeat(60))
  console.log('TOKEN AUTO-REFRESH TEST SUITE')
  console.log('='.repeat(60))
  console.log('\nMake sure you are logged in to the application!\n')
  
  const results = [];
  
  // Test 1: Basic Token Refresh
  const result1 = await testBasicTokenRefresh();
  results.push({ name: 'Basic Token Refresh', ...result1 });
  
  // Test 2: Concurrent Requests
  const result2 = await testConcurrentRequests();
  results.push({ name: 'Concurrent Requests', ...result2 });
  
  // Test 3: Token Expiration
  const result3 = await testTokenExpiration();
  results.push({ name: 'Token Expiration', ...result3 });
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))
  
  results.forEach((r, i) => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.name}: ${r.success ? 'PASSED' : 'FAILED'}`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });
  
  const allPassed = results.every(r => r.success);
  console.log('\n' + '='.repeat(60))
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
  } else {
    console.log('❌ SOME TESTS FAILED');
  }
  console.log('='.repeat(60) + '\n');
  
  return results;
}

// Export for use
if (typeof window !== 'undefined') {
  window.testTokenAutoRefresh = testTokenAutoRefresh;
  window.testBasicTokenRefresh = testBasicTokenRefresh;
  window.testConcurrentRequests = testConcurrentRequests;
  window.testTokenExpiration = testTokenExpiration;
}

// Auto-run if in browser console
if (typeof window !== 'undefined' && window.console) {
  console.log('Token Auto-Refresh test functions loaded!');
  console.log('Run: await testTokenAutoRefresh()');
}

