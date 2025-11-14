# Hướng dẫn Bảo mật API - Complete Guide

## 📋 Tổng quan

Khi API được gọi từ frontend, các thông tin như token, headers, và request body có thể bị nhìn thấy trong F12 Network tab. Đây là điều bình thường trong web development, nhưng chúng ta đã triển khai nhiều biện pháp bảo mật để bảo vệ dữ liệu nhạy cảm.

## ⚠️ Lưu ý quan trọng

**Không thể ẩn hoàn toàn** API requests khỏi F12 Network tab. Đây là cách trình duyệt hoạt động. Tuy nhiên, chúng ta đã triển khai:

1. ✅ **Token Auto-Refresh** - Tự động refresh token trước khi hết hạn
2. ✅ **Request Signing** - Chống replay attacks với HMAC-SHA256
3. ✅ **Rate Limiting** - Giới hạn số requests để chống DDoS
4. ✅ **CORS Enhancement** - Chỉ cho phép requests từ domain được phép
5. ✅ **HTTPS Enforcement** - Redirect HTTP → HTTPS và security headers
6. ✅ **Input Validation** - Chống SQL injection và XSS attacks
7. ✅ **Request ID Tracking** - Theo dõi và log tất cả requests

---

## 🔒 Các biện pháp bảo mật đã triển khai

### 1. ✅ JWT Token Authentication với Auto-Refresh

**Status:** ✅ **IMPLEMENTED**

**Cách hoạt động:**
- Frontend sử dụng Supabase JWT tokens
- Token được gửi trong header `Authorization: Bearer <token>`
- Backend xác thực token qua Supabase
- **Token tự động refresh trước khi hết hạn (< 5 phút)**

**Implementation:**
- File: `frontend/src/lib/api/client.ts`
- Method: `isTokenExpiringSoon()`, `refreshSession()`, `getAuthHeaders()`
- Auto-refresh khi token expires trong < 5 phút
- Race condition handling để tránh duplicate refreshes

**Code Example:**
```typescript
// Auto-refresh logic
private isTokenExpiringSoon(session: any): boolean {
  const tokenParts = session.access_token.split('.')
  const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')))
  const expiresAt = payload.exp * 1000
  const timeUntilExpiry = expiresAt - Date.now()
  return timeUntilExpiry > 0 && timeUntilExpiry < this.refreshThreshold // 5 minutes
}
```

**Ưu điểm:**
- ✅ Token có thời gian hết hạn
- ✅ Tự động refresh trước khi hết hạn
- ✅ Backend xác thực token trước mỗi request
- ✅ Race condition handling
- ✅ Graceful error handling

**Documentation:**
- [Token Auto-Refresh Implementation](./TOKEN_AUTO_REFRESH_IMPLEMENTATION.md)
- [Token Auto-Refresh Test Guide](./TOKEN_AUTO_REFRESH_TEST_GUIDE.md)

---

### 2. ✅ Request Signing (HMAC-SHA256)

**Status:** ✅ **IMPLEMENTED**

**Mục đích:** Chống replay attacks và đảm bảo request integrity

**Cách hoạt động:**
- Mỗi request có `timestamp`, `nonce`, và `signature`
- Signature được tính từ: `method + path + timestamp + nonce + body + secret`
- Backend verify signature và timestamp (5 minute window)
- Reject requests với invalid signature hoặc expired timestamp

**Implementation:**
- Frontend: `frontend/src/lib/api/security.ts`
- Backend: `backend/middleware/request_signing.py`
- Algorithm: HMAC-SHA256
- Timestamp window: 5 minutes

**Code Example:**
```typescript
// Frontend: Generate signature
export function generateRequestSignature(
  method: string,
  path: string,
  timestamp: number,
  nonce: string,
  body: string = ''
): string {
  const payload = `${method.toUpperCase()}|${path}|${timestamp}|${nonce}|${body}`
  const hmac = CryptoJS.HmacSHA256(payload, API_SECRET)
  return CryptoJS.enc.Hex.stringify(hmac)
}
```

```python
# Backend: Verify signature
def _generate_signature(self, method: str, path: str, timestamp: int, nonce: str, body: bytes) -> str:
    payload = f"{method.upper()}|{path}|{timestamp}|{nonce}|{body.decode('utf-8')}"
    return hmac.new(self.api_secret, payload.encode('utf-8'), hashlib.sha256).hexdigest()
```

**Headers:**
- `X-Request-Timestamp`: Unix timestamp (seconds)
- `X-Request-Nonce`: Unique nonce (UUID)
- `X-Request-Signature`: HMAC-SHA256 signature
- `X-Request-ID`: Unique request ID

**Configuration:**
```env
API_SECRET=your-secret-key-change-in-production
REQUEST_SIGNING_ENABLED=true
REQUEST_TIMESTAMP_WINDOW=300  # 5 minutes
```

**Documentation:**
- [Request Signing Implementation](./REQUEST_SIGNING_IMPLEMENTATION.md)
- [Request Signing Test Results](./REQUEST_SIGNING_TEST_RESULTS.md)

---

### 3. ✅ Rate Limiting

**Status:** ✅ **IMPLEMENTED**

**Mục đích:** Chống brute force và DDoS attacks

**Cách hoạt động:**
- In-memory sliding window rate limiter
- Giới hạn: 100 requests/phút theo IP hoặc user_id
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 429 Too Many Requests khi vượt limit

**Implementation:**
- File: `backend/middleware/rate_limit.py`
- Algorithm: Sliding window
- Store: In-memory (use Redis in production)

**Code Example:**
```python
def check_rate_limit(self, request: Request, max_requests: int = 100, window_seconds: int = 60):
    user_id = getattr(request.state, 'user_id', None)
    client_ip = request.client.host if request.client else 'unknown'
    identifier = user_id or f"ip:{client_ip}"
    
    current_time = time.time()
    window_start = current_time - window_seconds
    
    # Clean old entries
    requests = self.store[identifier]
    requests[:] = [ts for ts in requests if ts > window_start]
    
    if len(requests) >= max_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    requests.append(current_time)
```

**Configuration:**
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60
```

**Response Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Time when limit resets
- `Retry-After`: Seconds to wait before retry

**Documentation:**
- [Rate Limiting Implementation](./RATE_LIMITING_IMPLEMENTATION.md)
- [Rate Limiting Test Results](./RATE_LIMITING_TEST_RESULTS.md)

---

### 4. ✅ CORS Enhancement

**Status:** ✅ **IMPLEMENTED**

**Mục đích:** Chỉ cho phép requests từ domain được phép

**Cấu hình:**
- Production: Chỉ cho phép specific origins
- Development: Cho phép tất cả origins (`*`)
- Preflight caching: 1 hour (`max_age=3600`)
- Expose headers: `X-Request-ID`, `X-RateLimit-*`

**Implementation:**
- File: `backend/main.py`
- Middleware: FastAPI CORSMiddleware

**Code Example:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=[
        "X-Request-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "Retry-After"
    ],
    max_age=3600,  # Cache preflight requests for 1 hour
)
```

**Configuration:**
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ENVIRONMENT=production
```

**Documentation:**
- [CORS Enhancement Implementation](./CORS_ENHANCEMENT_IMPLEMENTATION.md)
- [CORS Test Results](./CORS_TEST_RESULTS.md)

---

### 5. ✅ HTTPS Enforcement và Security Headers

**Status:** ✅ **IMPLEMENTED**

**Mục đích:** Bảo vệ data trong transit và chống các attacks phổ biến

**Features:**
1. **HTTPS Redirect:** Tự động redirect HTTP → HTTPS trong production
2. **Security Headers:**
   - `Strict-Transport-Security`: max-age=31536000; includeSubDomains
   - `X-Content-Type-Options`: nosniff
   - `X-Frame-Options`: DENY
   - `X-XSS-Protection`: 1; mode=block

**Implementation:**
- HTTPS Redirect: `backend/middleware/https_redirect.py`
- Security Headers: `backend/middleware/security_headers.py`

**Code Example:**
```python
# HTTPS Redirect
if self.environment == "production" and request.url.scheme == "http":
    https_url = request.url.replace(scheme="https")
    return RedirectResponse(url=str(https_url), status_code=301)

# Security Headers
response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
response.headers["X-Content-Type-Options"] = "nosniff"
response.headers["X-Frame-Options"] = "DENY"
response.headers["X-XSS-Protection"] = "1; mode=block"
```

**Configuration:**
```env
ENVIRONMENT=production
```

**Documentation:**
- [HTTPS Security Headers Implementation](./HTTPS_SECURITY_HEADERS_IMPLEMENTATION.md)
- [HTTPS Security Test Results](./HTTPS_SECURITY_TEST_RESULTS.md)

---

### 6. ✅ Input Validation và Sanitization

**Status:** ✅ **IMPLEMENTED**

**Mục đích:** Chống SQL injection, XSS, và các lỗ hổng khác

**Features:**
- String sanitization (remove XSS và SQL injection patterns)
- Email validation (regex)
- Phone validation (format và length check)
- Name validation (length và character check)
- URL validation

**Implementation:**
- File: `backend/utils/validators.py`
- Applied to: `CustomerCreate`, `CustomerUpdate`, `EmployeeCreate`, `EmployeeUpdate`

**Code Example:**
```python
def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize string to prevent XSS and SQL injection"""
    if not value:
        return value
    
    # Remove potential XSS patterns
    value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)
    value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
    value = re.sub(r'on\w+\s*=', '', value, flags=re.IGNORECASE)
    
    # Remove potential SQL injection patterns
    value = re.sub(r'[\'";]', '', value)
    value = re.sub(r'--', '', value)
    value = re.sub(r'/\*.*?\*/', '', value, flags=re.DOTALL)
    
    # Limit length
    if len(value) > max_length:
        value = value[:max_length]
    
    return value.strip()
```

**Applied Models:**
- `CustomerCreate`, `CustomerUpdate`
- `EmployeeCreate`, `EmployeeUpdate`
- (Có thể mở rộng cho các models khác)

**Documentation:**
- [Input Validation Implementation](./INPUT_VALIDATION_IMPLEMENTATION.md)
- [Input Validation Test Results](./INPUT_VALIDATION_TEST_RESULTS.md)

---

### 7. ✅ Request ID Tracking

**Status:** ✅ **IMPLEMENTED**

**Mục đích:** Theo dõi và log tất cả requests để phát hiện hành vi bất thường

**Features:**
- Unique request ID cho mỗi request
- Header: `X-Request-ID`
- Logged trong backend để tracking

**Implementation:**
- File: `backend/middleware/request_id.py`
- Frontend: `frontend/src/lib/api/security.ts` (generateRequestId)

**Code Example:**
```typescript
// Frontend: Generate request ID
export function generateRequestId(): string {
  return uuidv4()
}
```

```python
# Backend: Add request ID
request_id = str(uuid.uuid4())
request.state.request_id = request_id
response.headers["X-Request-ID"] = request_id
```

---

## 📊 Tổng kết Implementation

### Phase 1: Quick Wins ✅
1. ✅ **Rate Limiting** - Chống DDoS và brute force
2. ✅ **CORS Enhancement** - Chỉ cho phép allowed origins
3. ✅ **HTTPS Enforcement** - Redirect HTTP → HTTPS
4. ✅ **Input Validation** - Chống SQL injection và XSS

### Phase 2: Advanced Security ✅
1. ✅ **Request Signing** - Chống replay attacks
2. ✅ **Token Auto-Refresh** - Tự động refresh token

---

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
# API Security
API_SECRET=your-secret-key-change-in-production
REQUEST_SIGNING_ENABLED=true
REQUEST_TIMESTAMP_WINDOW=300

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# CORS
CORS_ORIGINS=https://yourdomain.com
ENVIRONMENT=production
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_ENABLE_REQUEST_SIGNING=true
```

---

## 🧪 Testing

### Test Tools Available:

1. **Rate Limiting:**
   - `backend/test_rate_limit.py` - Unit tests
   - `backend/test_rate_limit_http.py` - HTTP tests

2. **CORS:**
   - `backend/test_cors.py` - CORS configuration tests

3. **HTTPS & Security Headers:**
   - `backend/test_https_security.py` - HTTPS redirect và security headers tests

4. **Input Validation:**
   - `backend/test_input_validation.py` - Validation tests

5. **Request Signing:**
   - `backend/test_request_signing.py` - Signature verification tests

6. **Token Auto-Refresh:**
   - `frontend/public/test_token_refresh.html` - Browser test page
   - `docs/BROWSER_CONSOLE_TEST_SCRIPT.js` - Console test script
   - `docs/BROWSER_CONSOLE_TEST_GUIDE.md` - Test guide

### Run Tests:

```bash
# Backend tests
cd backend
python test_rate_limit.py
python test_cors.py
python test_https_security.py
python test_input_validation.py
python test_request_signing.py

# Frontend tests
# Open: http://localhost:3000/test_token_refresh.html
```

---

## 🐛 Troubleshooting

### Issue: "Rate limit exceeded"

**Symptoms:**
- 429 Too Many Requests error
- `X-RateLimit-Remaining: 0` header

**Solutions:**
1. Wait for rate limit window to reset (check `Retry-After` header)
2. Increase `RATE_LIMIT_MAX_REQUESTS` if needed
3. Check for infinite loops in frontend code
4. Use request caching to reduce API calls

### Issue: "Invalid request signature"

**Symptoms:**
- 401 Unauthorized error
- "Invalid request signature" message

**Solutions:**
1. Check `API_SECRET` matches between frontend and backend
2. Verify `REQUEST_SIGNING_ENABLED=true` in backend
3. Check system clock synchronization (timestamp window)
4. Verify request headers are not modified by proxy/load balancer

### Issue: "Token refresh failed"

**Symptoms:**
- 401 Unauthorized after token expiration
- "Token refresh failed" in console

**Solutions:**
1. Check Supabase session is still valid
2. Verify network connectivity
3. Check browser console for errors
4. Try manual refresh: `await supabase.auth.refreshSession()`

### Issue: "CORS error"

**Symptoms:**
- CORS policy error in browser console
- Preflight request fails

**Solutions:**
1. Check `CORS_ORIGINS` includes your frontend domain
2. Verify `ENVIRONMENT=production` if using specific origins
3. Check backend CORS middleware is configured correctly
4. Verify preflight requests are handled (OPTIONS method)

### Issue: "Input validation failed"

**Symptoms:**
- Validation error when creating/updating records
- Special characters removed from input

**Solutions:**
1. Check input format (email, phone, etc.)
2. Verify input length is within limits
3. Remove potentially dangerous characters
4. Check validation error messages for details

---

## 📚 Best Practices

### 1. Token Management
- ✅ Use short-lived access tokens (1 hour)
- ✅ Auto-refresh before expiration (< 5 minutes)
- ✅ Store tokens securely (not in localStorage)
- ✅ Handle refresh failures gracefully

### 2. Request Security
- ✅ Always use HTTPS in production
- ✅ Sign all requests with HMAC-SHA256
- ✅ Include timestamp and nonce in requests
- ✅ Verify signatures on backend

### 3. Rate Limiting
- ✅ Set appropriate limits per use case
- ✅ Use Redis for distributed rate limiting in production
- ✅ Monitor rate limit hits
- ✅ Alert on suspicious patterns

### 4. Input Validation
- ✅ Validate all inputs on backend
- ✅ Sanitize user input
- ✅ Use parameterized queries
- ✅ Apply validation to all models

### 5. Monitoring
- ✅ Log all API requests with request ID
- ✅ Track rate limit hits
- ✅ Monitor authentication failures
- ✅ Alert on suspicious patterns

---

## 📈 Monitoring và Metrics

### Metrics cần theo dõi:

1. **Authentication:**
   - Token refresh frequency
   - Refresh failures
   - 401 errors

2. **Rate Limiting:**
   - Rate limit hits per IP/user
   - Top IPs hitting limits
   - Requests per minute/hour

3. **Request Signing:**
   - Invalid signatures
   - Expired timestamps
   - Missing headers

4. **Input Validation:**
   - Validation failures
   - XSS/SQL injection attempts
   - Invalid formats

5. **General:**
   - Total requests per endpoint
   - Average response time
   - Error rates

---

## 🔗 Documentation Links

### Implementation Guides:
- [Rate Limiting](./RATE_LIMITING_IMPLEMENTATION.md)
- [CORS Enhancement](./CORS_ENHANCEMENT_IMPLEMENTATION.md)
- [HTTPS Security Headers](./HTTPS_SECURITY_HEADERS_IMPLEMENTATION.md)
- [Input Validation](./INPUT_VALIDATION_IMPLEMENTATION.md)
- [Request Signing](./REQUEST_SIGNING_IMPLEMENTATION.md)
- [Token Auto-Refresh](./TOKEN_AUTO_REFRESH_IMPLEMENTATION.md)

### Test Results:
- [Rate Limiting Tests](./RATE_LIMITING_TEST_RESULTS.md)
- [CORS Tests](./CORS_TEST_RESULTS.md)
- [HTTPS Security Tests](./HTTPS_SECURITY_TEST_RESULTS.md)
- [Input Validation Tests](./INPUT_VALIDATION_TEST_RESULTS.md)
- [Request Signing Tests](./REQUEST_SIGNING_TEST_RESULTS.md)
- [Token Auto-Refresh Tests](./TOKEN_AUTO_REFRESH_TEST_RESULTS.md)

### Test Guides:
- [Browser Console Test Guide](./BROWSER_CONSOLE_TEST_GUIDE.md)
- [Token Auto-Refresh Test Guide](./TOKEN_AUTO_REFRESH_TEST_GUIDE.md)

### Planning:
- [API Security TODO](./API_SECURITY_TODO.md)
- [API Security Feasibility](./API_SECURITY_FEASIBILITY.md)
- [API Security Implementation Plan](./API_SECURITY_IMPLEMENTATION_PLAN.md)

---

## ⚠️ Lưu ý cuối cùng

**Không có giải pháp nào hoàn hảo 100%**. Mục tiêu là:

1. ✅ **Làm khó** kẻ tấn công
2. ✅ **Phát hiện sớm** các hành vi bất thường
3. ✅ **Giảm thiểu thiệt hại** khi bị tấn công
4. ✅ **Tuân thủ** các best practices về bảo mật

**Tất cả security measures đã được triển khai và tested!** 🎊

Luôn cập nhật và cải thiện bảo mật theo thời gian!
