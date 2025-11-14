# Browser Console Test Guide - Token Auto-Refresh

## 📋 Prerequisites

1. **Application Running:**
   - Frontend: `npm run dev` (usually `http://localhost:3000`)
   - Backend: `python main.py` (usually `http://localhost:8000`)

2. **User Logged In:**
   - Must be authenticated in the application
   - Active Supabase session required

3. **Browser Console:**
   - Open Developer Tools (F12)
   - Go to Console tab

## 🧪 Test Methods

### Method 1: Using Test HTML Page (Recommended)

1. **Open Test Page:**
   ```
   http://localhost:3000/test_token_refresh.html
   ```

2. **Run Tests:**
   - Click "Run Test 1" - Basic Token Refresh
   - Click "Run Test 2" - Concurrent Requests
   - Click "Run Test 3" - Token Expiration Check
   - Click "Run Test 4" - API Health Check

3. **View Results:**
   - Results displayed in colored boxes
   - Green = Success
   - Red = Error
   - Blue = Info

### Method 2: Using Test Script (Easiest)

1. **Open Browser Console:**
   - Open your application
   - Press F12 (Developer Tools)
   - Go to Console tab

2. **Copy Test Script:**
   - Open file: `docs/BROWSER_CONSOLE_TEST_SCRIPT.js`
   - Copy entire content
   - Paste into browser console
   - Press Enter

3. **Run Tests:**
   ```javascript
   // Run all tests
   await testTokenAutoRefresh()
   
   // Or run individual tests
   await testBasicTokenRefresh()
   await testConcurrentRequests()
   await testTokenExpiration()
   ```

### Method 3: Direct Browser Console (Manual)

#### Step 1: Import Test Functions

```javascript
// In browser console, first ensure you're on the app page
// Then import the test module (if using module system)
```

#### Step 2: Check Current Session

```javascript
// Get Supabase client (if available in window)
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User:', session?.user)
console.log('Token:', session?.access_token?.substring(0, 20) + '...')
```

#### Step 3: Parse Token Expiration

```javascript
// Parse JWT token to get expiration
const token = session.access_token
const tokenParts = token.split('.')
const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')))
console.log('Token Payload:', payload)
console.log('Expires At:', new Date(payload.exp * 1000).toISOString())
console.log('Time Until Expiry:', Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60), 'minutes')
```

#### Step 4: Test API Call

```javascript
// Make API call (should auto-refresh if needed)
const API_URL = 'http://localhost:8000'
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${session.access_token}`
}

const response = await fetch(`${API_URL}/api/health`, {
  method: 'GET',
  headers: headers
})

console.log('Response Status:', response.status)
console.log('Response Data:', await response.json())
```

#### Step 5: Test Concurrent Requests

```javascript
// Make 5 concurrent requests
const requests = Array.from({ length: 5 }, () => 
  fetch(`${API_URL}/api/health`, {
    method: 'GET',
    headers: headers
  })
)

const results = await Promise.all(requests)
console.log('Results:', results.map(r => r.status))
```

#### Step 6: Test Manual Refresh

```javascript
// Manually refresh token
const { data, error } = await supabase.auth.refreshSession()

if (error) {
  console.error('Refresh Error:', error)
} else {
  console.log('Refresh Success:', data)
  console.log('New Token:', data.session.access_token.substring(0, 20) + '...')
}
```

## 📊 Expected Results

### Test 1: Basic Token Refresh

**Expected Output:**
```
✅ Session found
  User ID: [user-id]
  Email: [email]

📊 Token Status:
  Expires At: [timestamp]
  Time Until Expiry: [X] minutes
  ✅ Token is still valid (or ⚠️ expires soon)

📡 Testing API call...
✅ API call successful
  Duration: [X]ms
  Response: {...}
```

### Test 2: Concurrent Requests

**Expected Output:**
```
📡 Making 5 concurrent requests...

✅ Completed 5 requests in [X]ms
  Successful: 5
  Failed: 0

  Request 1: ✅ 200
  Request 2: ✅ 200
  Request 3: ✅ 200
  Request 4: ✅ 200
  Request 5: ✅ 200

  Final Token: [token-prefix]...
```

### Test 3: Token Expiration Check

**Expected Output:**
```
📊 Token Status:

  Expires At: [timestamp]
  Time Until Expiry: [X] minutes
  ✅ Token is still valid
  ℹ️  Auto-refresh will trigger when < 5 minutes remain

🔄 Testing manual refresh...
✅ Token refreshed successfully
  New Expires At: [new-timestamp]
```

### Test 4: API Health Check

**Expected Output:**
```
📡 API Health Check

  URL: http://localhost:8000/api/health
  Status: 200 OK
  Duration: [X]ms
  Response: {
    "status": "healthy",
    ...
  }
```

## 🔍 Verification Checklist

### Token Expiration:
- [ ] Token expiration parsed correctly
- [ ] Time until expiry calculated correctly
- [ ] Refresh threshold (5 minutes) works

### Auto-Refresh:
- [ ] Token refreshed when < 5 minutes remain
- [ ] New token used for requests
- [ ] No 401 errors during normal usage

### Race Conditions:
- [ ] Concurrent requests share refresh promise
- [ ] No duplicate refresh requests
- [ ] All requests succeed

### Error Handling:
- [ ] 401 errors trigger refresh and retry
- [ ] Refresh failures handled gracefully
- [ ] Errors logged appropriately

## 🐛 Troubleshooting

### Issue: "No active session"

**Solution:**
- Make sure you're logged in
- Check if session exists: `await supabase.auth.getSession()`
- Try refreshing the page

### Issue: "CORS error"

**Solution:**
- Check backend CORS configuration
- Verify API_URL is correct
- Check if backend is running

### Issue: "401 Unauthorized"

**Solution:**
- Token may be expired
- Try manual refresh: `await supabase.auth.refreshSession()`
- Check if token is valid

### Issue: "Network error"

**Solution:**
- Check if backend is running
- Verify API_URL is correct
- Check network connectivity

## 📝 Notes

1. **Token Lifetime:**
   - Supabase default: 1 hour
   - Refresh threshold: 5 minutes
   - Auto-refresh triggers when < 5 minutes remain

2. **JWT Parsing:**
   - Token format: `header.payload.signature`
   - Payload contains `exp` (expiration timestamp)
   - Timestamp is in seconds (Unix epoch)

3. **Refresh Behavior:**
   - Automatic before expiration
   - On 401 errors
   - Shared across concurrent requests

4. **Testing Tips:**
   - Use Network tab to monitor requests
   - Check Console for logs
   - Verify token changes after refresh

## ✅ Success Criteria

All tests should:
- ✅ Complete without errors
- ✅ Show token expiration correctly
- ✅ Trigger auto-refresh when needed
- ✅ Handle concurrent requests properly
- ✅ Retry on 401 errors
- ✅ Log appropriate messages

## 🎯 Next Steps

After successful testing:
1. Monitor production usage
2. Track refresh frequency
3. Alert on refresh failures
4. Optimize refresh threshold if needed

