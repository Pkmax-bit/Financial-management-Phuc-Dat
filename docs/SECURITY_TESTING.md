# Security Testing Guide

## 📋 Tổng quan

Hướng dẫn test tất cả các biện pháp bảo mật đã triển khai trong hệ thống. Guide này cung cấp test cases, expected results, và troubleshooting cho từng security feature.

---

## 🔒 Test 1: Rate Limiting

### Mục đích
Verify rate limiting hoạt động đúng và chống DDoS attacks.

### Test Cases

#### Test 1.1: Basic Rate Limiting

**Steps:**
1. Make 100 requests trong 60 giây
2. Make request thứ 101
3. Verify response

**Expected:**
- ✅ Requests 1-100: Status 200 OK
- ✅ Request 101: Status 429 Too Many Requests
- ✅ Headers: `X-RateLimit-Limit: 100`, `X-RateLimit-Remaining: 0`
- ✅ Header: `Retry-After: [seconds]`

**Test Script:**
```bash
cd backend
python test_rate_limit_http.py
```

**Manual Test:**
```bash
# Make 101 requests quickly
for i in {1..101}; do
  curl -X GET http://localhost:8000/api/health
done
```

#### Test 1.2: Rate Limit Reset

**Steps:**
1. Make 100 requests (hit limit)
2. Wait 60 seconds
3. Make request mới

**Expected:**
- ✅ Request sau 60s: Status 200 OK
- ✅ Header: `X-RateLimit-Remaining: 99`

#### Test 1.3: Different IPs

**Steps:**
1. Make 100 requests từ IP A
2. Make 100 requests từ IP B

**Expected:**
- ✅ Both IPs có thể make 100 requests
- ✅ Rate limit per IP, không shared

**Test Script:**
```python
# backend/test_rate_limit_http.py
# Test với different IPs
```

---

## 🌐 Test 2: CORS Configuration

### Mục đích
Verify CORS chỉ cho phép requests từ allowed origins.

### Test Cases

#### Test 2.1: Allowed Origin

**Steps:**
1. Make request từ allowed origin (e.g., `http://localhost:3000`)
2. Check CORS headers

**Expected:**
- ✅ Status 200 OK
- ✅ Header: `Access-Control-Allow-Origin: http://localhost:3000`
- ✅ Header: `Access-Control-Allow-Credentials: true`
- ✅ Header: `Access-Control-Expose-Headers: X-Request-ID, X-RateLimit-*`

**Test Script:**
```bash
cd backend
python test_cors.py
```

**Manual Test:**
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS http://localhost:8000/api/health \
     -v
```

#### Test 2.2: Disallowed Origin

**Steps:**
1. Make request từ disallowed origin (e.g., `http://evil.com`)
2. Check CORS headers

**Expected (Production):**
- ✅ Status 200 OK (preflight)
- ✅ No `Access-Control-Allow-Origin` header
- ✅ Browser blocks request

**Expected (Development):**
- ✅ Status 200 OK
- ✅ Header: `Access-Control-Allow-Origin: *`

#### Test 2.3: Preflight Caching

**Steps:**
1. Make OPTIONS request
2. Check `Access-Control-Max-Age` header

**Expected:**
- ✅ Header: `Access-Control-Max-Age: 3600`
- ✅ Preflight cached for 1 hour

---

## 🔐 Test 3: HTTPS Enforcement & Security Headers

### Mục đích
Verify HTTPS redirect và security headers.

### Test Cases

#### Test 3.1: HTTP to HTTPS Redirect

**Steps:**
1. Make HTTP request (production mode)
2. Check response

**Expected (Production):**
- ✅ Status 301 Moved Permanently
- ✅ Header: `Location: https://...`
- ✅ Redirect to HTTPS

**Expected (Development):**
- ✅ No redirect
- ✅ HTTP allowed

**Test Script:**
```bash
cd backend
python test_https_security.py
```

**Manual Test:**
```bash
# Production mode
curl -L http://localhost:8000/api/health -v
```

#### Test 3.2: Security Headers

**Steps:**
1. Make HTTPS request
2. Check security headers

**Expected:**
- ✅ Header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- ✅ Header: `X-Content-Type-Options: nosniff`
- ✅ Header: `X-Frame-Options: DENY`
- ✅ Header: `X-XSS-Protection: 1; mode=block`

**Manual Test:**
```bash
curl -I https://yourdomain.com/api/health
```

---

## 🛡️ Test 4: Input Validation

### Mục đích
Verify input validation chống SQL injection và XSS.

### Test Cases

#### Test 4.1: XSS Payload

**Steps:**
1. Create customer với name: `<script>alert('xss')</script>`
2. Check response

**Expected:**
- ✅ Validation error hoặc
- ✅ Input sanitized (script tags removed)

**Test Script:**
```bash
cd backend
python test_input_validation.py
```

**Manual Test:**
```python
# Test XSS
payload = {
    "name": "<script>alert('xss')</script>",
    "email": "test@example.com"
}
response = requests.post("/api/customers", json=payload)
# Should sanitize or reject
```

#### Test 4.2: SQL Injection

**Steps:**
1. Create customer với name: `'; DROP TABLE users; --`
2. Check response

**Expected:**
- ✅ Validation error hoặc
- ✅ Input sanitized (SQL patterns removed)

**Manual Test:**
```python
payload = {
    "name": "'; DROP TABLE users; --",
    "email": "test@example.com"
}
response = requests.post("/api/customers", json=payload)
# Should sanitize or reject
```

#### Test 4.3: Invalid Email

**Steps:**
1. Create customer với invalid email: `invalid-email`
2. Check response

**Expected:**
- ✅ Validation error
- ✅ Error message: "Invalid email format"

**Manual Test:**
```python
payload = {
    "name": "Test Customer",
    "email": "invalid-email"
}
response = requests.post("/api/customers", json=payload)
# Should return 422 with validation error
```

#### Test 4.4: Invalid Phone

**Steps:**
1. Create customer với invalid phone: `123`
2. Check response

**Expected:**
- ✅ Validation error
- ✅ Error message: "Invalid phone format"

---

## 🔑 Test 5: Request Signing

### Mục đích
Verify request signing chống replay attacks.

### Test Cases

#### Test 5.1: Valid Signature

**Steps:**
1. Make request với valid signature
2. Check response

**Expected:**
- ✅ Status 200 OK
- ✅ Request processed successfully

**Test Script:**
```bash
cd backend
python test_request_signing.py
```

**Manual Test:**
```python
# Generate signature
timestamp = int(time.time())
nonce = str(uuid.uuid4())
body = json.dumps({"name": "Test"})
payload = f"POST|/api/customers|{timestamp}|{nonce}|{body}"
signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

headers = {
    "X-Request-Timestamp": str(timestamp),
    "X-Request-Nonce": nonce,
    "X-Request-Signature": signature,
    "Authorization": f"Bearer {token}"
}
response = requests.post("/api/customers", json={"name": "Test"}, headers=headers)
```

#### Test 5.2: Invalid Signature

**Steps:**
1. Make request với invalid signature
2. Check response

**Expected:**
- ✅ Status 401 Unauthorized
- ✅ Error: "Invalid request signature"

**Manual Test:**
```python
headers = {
    "X-Request-Timestamp": str(int(time.time())),
    "X-Request-Nonce": str(uuid.uuid4()),
    "X-Request-Signature": "invalid-signature",
    "Authorization": f"Bearer {token}"
}
response = requests.post("/api/customers", json={"name": "Test"}, headers=headers)
# Should return 401
```

#### Test 5.3: Expired Timestamp

**Steps:**
1. Make request với timestamp > 5 minutes ago
2. Check response

**Expected:**
- ✅ Status 401 Unauthorized
- ✅ Error: "Request timestamp is outside the allowed window"

**Manual Test:**
```python
old_timestamp = int(time.time()) - 400  # 6+ minutes ago
# ... generate signature with old_timestamp
# Should return 401
```

#### Test 5.4: Missing Headers

**Steps:**
1. Make request without security headers
2. Check response

**Expected (Production):**
- ✅ Status 401 Unauthorized
- ✅ Error: "Missing security headers"

**Expected (Development):**
- ✅ Status 200 OK (if signing disabled)
- ✅ Request processed

---

## 🔄 Test 6: Token Auto-Refresh

### Mục đích
Verify token tự động refresh trước khi hết hạn.

### Test Cases

#### Test 6.1: Token Expiring Soon

**Steps:**
1. Get current session
2. Check token expiration
3. If expires in < 5 minutes, make API request
4. Verify token was refreshed

**Expected:**
- ✅ Token refreshed automatically
- ✅ New token used for request
- ✅ Request succeeds

**Test Script:**
```bash
# Open browser console
# Run: await testTokenAutoRefresh()
```

**Manual Test:**
```javascript
// Browser console
const { data: { session } } = await supabase.auth.getSession()
// Parse JWT to check expiration
// Make API request
// Check if token was refreshed
```

#### Test 6.2: Concurrent Requests

**Steps:**
1. Make 5 concurrent API requests
2. Check if single refresh occurred

**Expected:**
- ✅ All requests succeed
- ✅ Single refresh promise shared
- ✅ No duplicate refreshes

**Test Script:**
```javascript
// Browser console
await testConcurrentRequests()
```

#### Test 6.3: 401 Error Handling

**Steps:**
1. Use expired token
2. Make API request
3. Verify auto-refresh and retry

**Expected:**
- ✅ 401 error received
- ✅ Token refreshed automatically
- ✅ Request retried with new token
- ✅ Request succeeds

**Test Script:**
```javascript
// Browser console
// Manually expire token or wait for expiration
// Make API request
// Verify refresh and retry
```

#### Test 6.4: Refresh Failure

**Steps:**
1. Simulate refresh failure (network error)
2. Make API request
3. Verify error handling

**Expected:**
- ✅ Refresh failure handled gracefully
- ✅ Error logged
- ✅ User notified if needed

---

## 📊 Test Summary Table

| Test | Feature | Status | Script | Manual |
|------|---------|--------|--------|--------|
| 1.1 | Rate Limiting - Basic | ✅ | `test_rate_limit_http.py` | curl loop |
| 1.2 | Rate Limiting - Reset | ✅ | Manual | Wait 60s |
| 1.3 | Rate Limiting - Different IPs | ✅ | `test_rate_limit_http.py` | - |
| 2.1 | CORS - Allowed Origin | ✅ | `test_cors.py` | curl with Origin |
| 2.2 | CORS - Disallowed Origin | ✅ | `test_cors.py` | curl with Origin |
| 2.3 | CORS - Preflight Caching | ✅ | `test_cors.py` | OPTIONS request |
| 3.1 | HTTPS - Redirect | ✅ | `test_https_security.py` | curl HTTP |
| 3.2 | HTTPS - Security Headers | ✅ | `test_https_security.py` | curl -I |
| 4.1 | Input Validation - XSS | ✅ | `test_input_validation.py` | POST with XSS |
| 4.2 | Input Validation - SQL Injection | ✅ | `test_input_validation.py` | POST with SQL |
| 4.3 | Input Validation - Invalid Email | ✅ | `test_input_validation.py` | POST invalid email |
| 4.4 | Input Validation - Invalid Phone | ✅ | `test_input_validation.py` | POST invalid phone |
| 5.1 | Request Signing - Valid | ✅ | `test_request_signing.py` | POST with signature |
| 5.2 | Request Signing - Invalid | ✅ | `test_request_signing.py` | POST invalid signature |
| 5.3 | Request Signing - Expired | ✅ | `test_request_signing.py` | POST old timestamp |
| 5.4 | Request Signing - Missing | ✅ | `test_request_signing.py` | POST no headers |
| 6.1 | Token Refresh - Auto | ✅ | Browser console | `testTokenAutoRefresh()` |
| 6.2 | Token Refresh - Concurrent | ✅ | Browser console | `testConcurrentRequests()` |
| 6.3 | Token Refresh - 401 Retry | ✅ | Browser console | Manual test |
| 6.4 | Token Refresh - Failure | ✅ | Browser console | Simulate error |

---

## 🧪 Running All Tests

### Backend Tests

```bash
cd backend

# Rate Limiting
python test_rate_limit.py
python test_rate_limit_http.py

# CORS
python test_cors.py

# HTTPS & Security Headers
python test_https_security.py

# Input Validation
python test_input_validation.py

# Request Signing
python test_request_signing.py
```

### Frontend Tests

```bash
# Option 1: Test HTML Page
# Open: http://localhost:3000/test_token_refresh.html

# Option 2: Browser Console
# Copy: docs/BROWSER_CONSOLE_TEST_SCRIPT.js
# Paste into browser console
# Run: await testTokenAutoRefresh()
```

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: Tests fail with "Connection refused"

**Solution:**
- Ensure backend is running: `python main.py`
- Check API_URL is correct
- Verify port is not in use

#### Issue: CORS tests fail

**Solution:**
- Check `CORS_ORIGINS` environment variable
- Verify `ENVIRONMENT` is set correctly
- Check middleware order in `main.py`

#### Issue: Request signing tests fail

**Solution:**
- Verify `API_SECRET` matches between frontend and backend
- Check `REQUEST_SIGNING_ENABLED=true` in backend
- Verify system clock is synchronized

#### Issue: Token refresh tests fail

**Solution:**
- Ensure user is logged in
- Check Supabase session is valid
- Verify network connectivity
- Check browser console for errors

---

## 📝 Test Checklist

### Before Testing:
- [ ] Backend is running
- [ ] Frontend is running
- [ ] User is logged in (for token tests)
- [ ] Environment variables are set
- [ ] Test scripts are available

### During Testing:
- [ ] Run each test case
- [ ] Verify expected results
- [ ] Check error messages
- [ ] Log any failures
- [ ] Document issues

### After Testing:
- [ ] Review test results
- [ ] Fix any failures
- [ ] Update documentation
- [ ] Commit test results

---

## 📚 Related Documentation

- [API Security Guide](./API_SECURITY_GUIDE.md) - Complete security guide
- [Rate Limiting Tests](./RATE_LIMITING_TEST_RESULTS.md) - Rate limiting test results
- [CORS Tests](./CORS_TEST_RESULTS.md) - CORS test results
- [HTTPS Security Tests](./HTTPS_SECURITY_TEST_RESULTS.md) - HTTPS test results
- [Input Validation Tests](./INPUT_VALIDATION_TEST_RESULTS.md) - Validation test results
- [Request Signing Tests](./REQUEST_SIGNING_TEST_RESULTS.md) - Request signing test results
- [Token Auto-Refresh Tests](./TOKEN_AUTO_REFRESH_TEST_RESULTS.md) - Token refresh test results
- [Browser Console Test Guide](./BROWSER_CONSOLE_TEST_GUIDE.md) - Browser testing guide

---

## ✅ Success Criteria

All tests should:
- ✅ Complete without errors
- ✅ Match expected results
- ✅ Handle edge cases gracefully
- ✅ Log appropriate messages
- ✅ Provide clear error messages

**Happy Testing!** 🎉

