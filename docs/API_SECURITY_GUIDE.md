# Hướng dẫn Bảo mật API

## Tổng quan

Khi API được gọi từ frontend, các thông tin như token, headers, và request body có thể bị nhìn thấy trong F12 Network tab. Đây là điều bình thường trong web development, nhưng chúng ta cần áp dụng các biện pháp bảo mật để bảo vệ dữ liệu nhạy cảm.

## ⚠️ Lưu ý quan trọng

**Không thể ẩn hoàn toàn** API requests khỏi F12 Network tab. Đây là cách trình duyệt hoạt động. Tuy nhiên, chúng ta có thể:

1. **Bảo vệ token** bằng cách sử dụng short-lived tokens và refresh tokens
2. **Mã hóa dữ liệu nhạy cảm** trong request/response
3. **Xác thực và phân quyền** chặt chẽ ở backend
4. **Giám sát và phát hiện** các hành vi bất thường

## 🔒 Các biện pháp bảo mật đã triển khai

### 1. JWT Token Authentication (Hiện tại)

**Cách hoạt động:**
- Frontend sử dụng Supabase JWT tokens
- Token được gửi trong header `Authorization: Bearer <token>`
- Backend xác thực token qua Supabase

**Ưu điểm:**
- ✅ Token có thời gian hết hạn
- ✅ Backend xác thực token trước mỗi request
- ✅ Token không chứa thông tin nhạy cảm (chỉ chứa user_id, email)

**Nhược điểm:**
- ⚠️ Token có thể bị đánh cắp nếu bị XSS attack
- ⚠️ Token có thể bị sử dụng lại nếu bị lộ

### 2. HTTPS (Bắt buộc cho Production)

**Cần đảm bảo:**
- ✅ Tất cả API calls phải qua HTTPS
- ✅ Không cho phép HTTP trong production
- ✅ Sử dụng SSL/TLS certificates hợp lệ

**Cấu hình:**
```env
# .env.production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 🛡️ Các biện pháp bảo mật nên triển khai

### 1. Token Rotation và Refresh Tokens

**Mục đích:** Giảm thiểu rủi ro khi token bị lộ

**Cách triển khai:**
- Access token: Short-lived (15-30 phút)
- Refresh token: Long-lived (7-30 ngày), lưu trong httpOnly cookie
- Tự động refresh token trước khi hết hạn

### 2. Request Signing (Chống Replay Attack)

**Mục đích:** Đảm bảo request không bị replay

**Cách hoạt động:**
- Mỗi request có timestamp và nonce
- Tính toán signature từ: method + url + body + timestamp + nonce + secret
- Backend verify signature và timestamp

### 3. Rate Limiting

**Mục đích:** Chống brute force và DDoS

**Cách triển khai:**
- Giới hạn số request mỗi phút/giờ theo IP
- Giới hạn số request mỗi phút/giờ theo user
- Block IP sau nhiều lần thất bại

### 4. CORS Configuration

**Mục đích:** Chỉ cho phép requests từ domain được phép

**Cấu hình hiện tại:**
```python
# backend/main.py
CORS_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

### 5. Encrypt Sensitive Data

**Mục đích:** Mã hóa dữ liệu nhạy cảm trong request/response

**Áp dụng cho:**
- Mật khẩu
- Số thẻ tín dụng
- Thông tin tài chính nhạy cảm
- API keys

### 6. Input Validation và Sanitization

**Mục đích:** Chống SQL injection, XSS, và các lỗ hổng khác

**Cách triển khai:**
- Validate tất cả input ở backend
- Sanitize user input
- Sử dụng parameterized queries

### 7. API Key cho Sensitive Endpoints

**Mục đích:** Thêm lớp bảo mật cho các endpoint nhạy cảm

**Cách triển khai:**
- Tạo API key cho mỗi client
- Gửi API key trong header `X-API-Key`
- Backend verify API key trước khi xử lý

### 8. Request ID và Logging

**Mục đích:** Theo dõi và phát hiện các hành vi bất thường

**Cách triển khai:**
- Mỗi request có unique ID
- Log tất cả requests với timestamp, IP, user
- Phát hiện patterns bất thường

## 📝 Triển khai cụ thể

### Bước 1: Cải thiện Token Management

Tạo file `frontend/src/lib/api/security.ts`:

```typescript
/**
 * API Security Utilities
 * Enhanced security for API requests
 */

import { supabase } from '../supabase'
import CryptoJS from 'crypto-js'

// Get API secret from environment (should be different for each client)
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET || 'default-secret-key'

/**
 * Generate request signature for replay attack protection
 */
export function generateRequestSignature(
  method: string,
  url: string,
  body: string | null,
  timestamp: number
): string {
  const nonce = CryptoJS.lib.WordArray.random(16).toString()
  const data = `${method}:${url}:${body || ''}:${timestamp}:${nonce}`
  const signature = CryptoJS.HmacSHA256(data, API_SECRET).toString()
  return `${signature}:${nonce}`
}

/**
 * Get secure headers with signature
 */
export async function getSecureHeaders(
  method: string,
  url: string,
  body?: any
): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  // Add request signature
  const timestamp = Date.now()
  const bodyString = body ? JSON.stringify(body) : null
  const signature = generateRequestSignature(method, url, bodyString, timestamp)
  
  headers['X-Request-Timestamp'] = timestamp.toString()
  headers['X-Request-Signature'] = signature
  headers['X-Request-ID'] = crypto.randomUUID()

  return headers
}

/**
 * Encrypt sensitive data before sending
 */
export function encryptSensitiveData(data: string, key: string = API_SECRET): string {
  return CryptoJS.AES.encrypt(data, key).toString()
}

/**
 * Decrypt sensitive data after receiving
 */
export function decryptSensitiveData(encryptedData: string, key: string = API_SECRET): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}
```

### Bước 2: Cập nhật API Client

Cập nhật `frontend/src/lib/api/client.ts` để sử dụng secure headers:

```typescript
import { getSecureHeaders } from './security'

// Trong method getAuthHeaders, thay thế bằng:
private async getAuthHeaders(method: string = 'GET', url: string = '', body?: any): Promise<Record<string, string>> {
  return await getSecureHeaders(method, url, body)
}
```

### Bước 3: Backend Verification

Tạo middleware để verify request signature ở backend:

```python
# backend/middleware/security.py
from fastapi import Request, HTTPException, status
from datetime import datetime
import hmac
import hashlib
import time

def verify_request_signature(request: Request):
    """Verify request signature to prevent replay attacks"""
    signature_header = request.headers.get("X-Request-Signature")
    timestamp_header = request.headers.get("X-Request-Timestamp")
    
    if not signature_header or not timestamp_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing security headers"
        )
    
    # Check timestamp (prevent replay attacks older than 5 minutes)
    try:
        timestamp = int(timestamp_header)
        current_time = int(time.time() * 1000)
        if abs(current_time - timestamp) > 300000:  # 5 minutes
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Request timestamp expired"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid timestamp"
        )
    
    # Verify signature
    method = request.method
    url = str(request.url.path)
    body = request.body if hasattr(request, 'body') else b''
    body_str = body.decode() if body else ''
    
    # Extract nonce from signature
    parts = signature_header.split(':')
    if len(parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature format"
        )
    
    received_signature, nonce = parts
    
    # Recalculate signature
    api_secret = os.getenv("API_SECRET", "default-secret-key")
    data = f"{method}:{url}:{body_str}:{timestamp}:{nonce}"
    expected_signature = hmac.new(
        api_secret.encode(),
        data.encode(),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(received_signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid request signature"
        )
```

### Bước 4: Rate Limiting

Thêm rate limiting ở backend:

```python
# backend/middleware/rate_limit.py
from fastapi import Request, HTTPException, status
from collections import defaultdict
from datetime import datetime, timedelta
import time

# In-memory rate limit store (use Redis in production)
rate_limit_store = defaultdict(list)

def check_rate_limit(request: Request, max_requests: int = 100, window_seconds: int = 60):
    """Check if request exceeds rate limit"""
    client_ip = request.client.host
    user_id = getattr(request.state, 'user_id', None)
    identifier = user_id or client_ip
    
    now = time.time()
    window_start = now - window_seconds
    
    # Clean old entries
    rate_limit_store[identifier] = [
        timestamp for timestamp in rate_limit_store[identifier]
        if timestamp > window_start
    ]
    
    # Check limit
    if len(rate_limit_store[identifier]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )
    
    # Add current request
    rate_limit_store[identifier].append(now)
```

## 🎯 Best Practices

### 1. Không lưu token trong localStorage
- ✅ Sử dụng httpOnly cookies cho refresh tokens
- ✅ Sử dụng sessionStorage cho access tokens (tự động xóa khi đóng tab)

### 2. Token Expiration
- ✅ Access token: 15-30 phút
- ✅ Refresh token: 7-30 ngày
- ✅ Tự động refresh trước khi hết hạn

### 3. HTTPS Only
- ✅ Luôn sử dụng HTTPS trong production
- ✅ Redirect HTTP → HTTPS
- ✅ HSTS headers

### 4. Content Security Policy (CSP)
- ✅ Thêm CSP headers để chống XSS
- ✅ Chỉ cho phép scripts từ domain được phép

### 5. Monitoring và Alerting
- ✅ Log tất cả API requests
- ✅ Phát hiện patterns bất thường
- ✅ Alert khi có nhiều failed requests

## 📊 Monitoring

### Metrics cần theo dõi:
1. **Authentication failures**: Số lần login thất bại
2. **Rate limit hits**: Số lần vượt rate limit
3. **Invalid signatures**: Số lần signature không hợp lệ
4. **Suspicious IPs**: IPs có nhiều failed requests
5. **Token usage**: Số lần token được sử dụng

## ⚡ Quick Wins (Triển khai ngay)

1. ✅ **HTTPS**: Đảm bảo tất cả API calls qua HTTPS
2. ✅ **Token expiration**: Giảm thời gian sống của token
3. ✅ **Rate limiting**: Thêm rate limiting cơ bản
4. ✅ **CORS**: Cấu hình CORS chặt chẽ
5. ✅ **Input validation**: Validate tất cả input ở backend

## 🔐 Advanced Security (Triển khai sau)

1. **Request signing**: Chống replay attacks
2. **API keys**: Thêm API keys cho sensitive endpoints
3. **Encryption**: Mã hóa dữ liệu nhạy cảm
4. **IP whitelisting**: Chỉ cho phép IPs được phép
5. **WAF**: Web Application Firewall

## 📚 Tài liệu tham khảo

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

## ⚠️ Lưu ý cuối cùng

**Không có giải pháp nào hoàn hảo 100%**. Mục tiêu là:

1. **Làm khó** kẻ tấn công
2. **Phát hiện sớm** các hành vi bất thường
3. **Giảm thiểu thiệt hại** khi bị tấn công
4. **Tuân thủ** các best practices về bảo mật

Luôn cập nhật và cải thiện bảo mật theo thời gian!

