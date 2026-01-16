/**
 * Simple API endpoint test script
 * Tests project detail page endpoints for authentication issues
 */

const https = require('https')
const http = require('http')

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'

// Test project ID (update with actual project ID)
const TEST_PROJECT_ID = '6bf71318-f57f-405f-b137-f6770c99cd01'

// Test credentials (update with actual credentials)
const TEST_EMAIL = 'admin@test.com'
const TEST_PASSWORD = 'your-password-here' // Update this

let authToken = null

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      }
    }

    const req = client.request(requestOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          })
        }
      })
    })

    req.on('error', reject)
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }
    
    req.end()
  })
}

async function login() {
  console.log('🔐 Attempting to login...')
  
  // First, try to get session from Supabase
  // Note: This is a simplified test - in real scenario, you'd use Supabase client
  console.log('⚠️  Note: This test requires actual Supabase session token')
  console.log('   Please provide a valid session token or update the script to use Supabase client')
  
  return null
}

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`\n📡 Testing: ${name}`)
  console.log(`   ${method} ${url}`)
  
  try {
    const response = await makeRequest(url, {
      method,
      body: body ? JSON.stringify(body) : null
    })
    
    const status = response.status
    const isSuccess = status >= 200 && status < 300
    const isAuthError = status === 401 || status === 403
    
    if (isSuccess) {
      console.log(`   ✅ Success (${status})`)
      return { success: true, status }
    } else if (isAuthError) {
      console.log(`   ⚠️  Auth Error (${status}): ${response.data?.detail || response.data?.message || 'Authentication failed'}`)
      return { success: false, status, authError: true, message: response.data?.detail || response.data?.message }
    } else {
      console.log(`   ❌ Error (${status}): ${response.data?.detail || response.data?.message || 'Request failed'}`)
      return { success: false, status, message: response.data?.detail || response.data?.message }
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests')
  console.log('=' .repeat(50))
  
  // Test 1: Check if frontend is running
  console.log('\n📋 Test 1: Frontend Server Check')
  try {
    const response = await makeRequest(`${FRONTEND_URL}/login`)
    if (response.status === 200) {
      console.log('   ✅ Frontend server is running')
    } else {
      console.log(`   ⚠️  Frontend returned status ${response.status}`)
    }
  } catch (error) {
    console.log(`   ❌ Frontend server not accessible: ${error.message}`)
    console.log('   💡 Make sure frontend is running: npm run dev')
    return
  }
  
  // Test 2: Check if backend is running
  console.log('\n📋 Test 2: Backend Server Check')
  try {
    const response = await makeRequest(`${API_URL}/api/projects/auth/me`, { skipAuth: true })
    if (response.status === 200 || response.status === 401) {
      console.log('   ✅ Backend server is running')
    } else {
      console.log(`   ⚠️  Backend returned status ${response.status}`)
    }
  } catch (error) {
    console.log(`   ❌ Backend server not accessible: ${error.message}`)
    console.log('   💡 Make sure backend is running')
    return
  }
  
  // Note: For full authentication tests, you need a valid session token
  console.log('\n📋 Test 3: Authentication Required')
  console.log('   ⚠️  To test authenticated endpoints, you need:')
  console.log('   1. A valid Supabase session token')
  console.log('   2. Or update this script to use Supabase client for login')
  console.log('\n   The following endpoints would be tested with authentication:')
  console.log(`   - GET /api/projects/${TEST_PROJECT_ID}`)
  console.log(`   - GET /api/projects/${TEST_PROJECT_ID}/financial-summary`)
  console.log(`   - GET /api/tasks/project/${TEST_PROJECT_ID}/comments`)
  console.log(`   - POST /api/tasks/{taskId}/comments`)
  console.log(`   - POST /api/tasks/{taskId}/attachments`)
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ Basic connectivity tests completed')
  console.log('\n💡 To test authenticated endpoints:')
  console.log('   1. Open browser DevTools on project detail page')
  console.log('   2. Go to Application/Storage > Local Storage')
  console.log('   3. Find Supabase auth token')
  console.log('   4. Update TEST_TOKEN in this script')
  console.log('   5. Run: node test-api-endpoints.js')
}

// Run tests
runTests().catch(console.error)



