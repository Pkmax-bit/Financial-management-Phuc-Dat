# Kế Hoạch Triển Khai Bảo Mật API - Chi Tiết

## 🎯 Mục Tiêu

Triển khai các biện pháp bảo mật API theo từng phase, ưu tiên các biện pháp có lợi ích cao và effort thấp.

---

## 📅 Phase 1: Quick Wins (1-2 ngày)

### Task 1.1: Rate Limiting ⭐⭐⭐⭐⭐

**File cần tạo:**
- `backend/middleware/rate_limit.py`

**File cần sửa:**
- `backend/main.py`

**Các bước:**

1. **Tạo rate limit middleware:**
```python
# backend/middleware/rate_limit.py
from fastapi import Request, HTTPException, status
from collections import defaultdict
import time
from typing import Dict, List

class RateLimiter:
    def __init__(self):
        self.store: Dict[str, List[float]] = defaultdict(list)
    
    def check_rate_limit(
        self, 
        request: Request,
        max_requests: int = 100,
        window_seconds: int = 60
    ):
        """Check if request exceeds rate limit"""
        # Get identifier (user_id or IP)
        user_id = getattr(request.state, 'user_id', None)
        client_ip = request.client.host if request.client else 'unknown'
        identifier = user_id or f"ip:{client_ip}"
        
        now = time.time()
        window_start = now - window_seconds
        
        # Clean old entries
        self.store[identifier] = [
            timestamp for timestamp in self.store[identifier]
            if timestamp > window_start
        ]
        
        # Check limit
        if len(self.store[identifier]) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: {max_requests} requests per {window_seconds} seconds",
                headers={"Retry-After": str(window_seconds)}
            )
        
        # Add current request
        self.store[identifier].append(now)

# Global instance
rate_limiter = RateLimiter()
```

2. **Thêm vào main.py:**
```python
# backend/main.py
from middleware.rate_limit import rate_limiter

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health checks
    if request.url.path in ["/", "/health", "/docs", "/redoc", "/openapi.json"]:
        return await call_next(request)
    
    try:
        rate_limiter.check_rate_limit(request, max_requests=100, window_seconds=60)
    except HTTPException:
        raise
    
    response = await call_next(request)
    return response
```

**Testing:**
- Test với nhiều requests liên tiếp
- Test với different IPs
- Test với authenticated users

**Thời gian:** 1 giờ

---

### Task 1.2: CORS Enhancement ⭐⭐⭐⭐

**File cần sửa:**
- `backend/main.py`

**Các bước:**

1. **Cập nhật CORS configuration:**
```python
# backend/main.py
import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    # Production: Strict CORS
    allowed_origins = [
        os.getenv("FRONTEND_URL", "https://your-frontend.onrender.com"),
        # Add specific domains only
    ]
    # Remove wildcard, use specific origins
    cors_config = {
        "allow_origins": allowed_origins,
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "X-Request-ID"],
        "expose_headers": ["X-Request-ID"],
        "max_age": 3600,  # Cache preflight for 1 hour
    }
else:
    # Development: More permissive
    cors_config = {
        "allow_origins": ["*"],
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }

app.add_middleware(
    CORSMiddleware,
    **cors_config
)
```

**Testing:**
- Test CORS với frontend
- Test preflight requests
- Test với different origins

**Thời gian:** 30 phút

---

### Task 1.3: HTTPS Enforcement ⭐⭐⭐⭐⭐

**File cần sửa:**
- `backend/main.py` (hoặc cấu hình server)

**Các bước:**

1. **Thêm HTTPS redirect middleware:**
```python
# backend/main.py
@app.middleware("http")
async def https_redirect_middleware(request: Request, call_next):
    # Only in production
    if os.getenv("ENVIRONMENT") == "production":
        # Check if request is HTTP
        if request.url.scheme == "http":
            # Redirect to HTTPS
            https_url = request.url.replace(scheme="https")
            return RedirectResponse(url=str(https_url), status_code=301)
    
    response = await call_next(request)
    
    # Add security headers
    if os.getenv("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
    
    return response
```

**Testing:**
- Test HTTP redirect
- Test security headers
- Test với browser dev tools

**Thời gian:** 30 phút

---

### Task 1.4: Input Validation Enhancement ⭐⭐⭐⭐⭐

**File cần sửa:**
- Các Pydantic models trong `backend/models/`

**Các bước:**

1. **Tạo base validator:**
```python
# backend/utils/validators.py
from pydantic import validator
import re
from html import escape

def sanitize_string(value: str) -> str:
    """Sanitize string input"""
    if not value:
        return value
    # Remove potential XSS
    value = escape(value)
    # Remove SQL injection patterns
    value = re.sub(r'[;\'"\\]', '', value)
    return value.strip()

def validate_email(email: str) -> str:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValueError("Invalid email format")
    return email.lower()

def validate_phone(phone: str) -> str:
    """Validate phone number"""
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    if len(digits) < 10 or len(digits) > 15:
        raise ValueError("Invalid phone number")
    return digits
```

2. **Áp dụng vào models:**
```python
# backend/models/customer.py
from utils.validators import sanitize_string, validate_email, validate_phone

class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return sanitize_string(v)
    
    @validator('email')
    def validate_email_field(cls, v):
        if v:
            return validate_email(v)
        return v
    
    @validator('phone')
    def validate_phone_field(cls, v):
        if v:
            return validate_phone(v)
        return v
```

**Testing:**
- Test với XSS payloads
- Test với SQL injection attempts
- Test với invalid formats

**Thời gian:** 2 giờ

---

## 📅 Phase 2: Advanced Security (3-5 ngày)

### Task 2.1: Request Signing ⚠️

**Files cần tạo:**
- `frontend/src/lib/api/security.ts`
- `backend/middleware/security.py`

**Files cần sửa:**
- `frontend/src/lib/api/client.ts`
- `backend/main.py`

**Các bước:**

1. **Install dependencies:**
```bash
# Frontend
cd frontend
npm install crypto-js
npm install --save-dev @types/crypto-js
```

2. **Frontend implementation:**
```typescript
// frontend/src/lib/api/security.ts
import CryptoJS from 'crypto-js'

const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET || 'default-secret'

export function generateRequestSignature(
  method: string,
  url: string,
  body: string | null,
  timestamp: number
): { signature: string; nonce: string } {
  const nonce = CryptoJS.lib.WordArray.random(16).toString()
  const data = `${method}:${url}:${body || ''}:${timestamp}:${nonce}`
  const signature = CryptoJS.HmacSHA256(data, API_SECRET).toString()
  return { signature: `${signature}:${nonce}`, nonce }
}
```

3. **Backend verification:**
```python
# backend/middleware/security.py
import hmac
import hashlib
import time
from fastapi import Request, HTTPException, status

def verify_request_signature(request: Request):
    """Verify request signature"""
    signature_header = request.headers.get("X-Request-Signature")
    timestamp_header = request.headers.get("X-Request-Timestamp")
    
    if not signature_header or not timestamp_header:
        # In development, allow requests without signature
        if os.getenv("ENVIRONMENT") == "development":
            return True
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing security headers"
        )
    
    # Verify timestamp (5 minute window)
    try:
        timestamp = int(timestamp_header)
        current_time = int(time.time() * 1000)
        if abs(current_time - timestamp) > 300000:
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
    api_secret = os.getenv("API_SECRET", "default-secret")
    method = request.method
    url = str(request.url.path)
    body = await request.body() if hasattr(request, 'body') else b''
    body_str = body.decode() if body else ''
    
    parts = signature_header.split(':')
    if len(parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature format"
        )
    
    received_signature, nonce = parts
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
    
    return True
```

**Thời gian:** 1 ngày (bao gồm testing)

---

## 📝 Checklist Triển Khai

### Phase 1 Checklist:
- [ ] Task 1.1: Rate Limiting
  - [ ] Tạo middleware
  - [ ] Thêm vào main.py
  - [ ] Test với nhiều requests
  - [ ] Test với different users/IPs
- [ ] Task 1.2: CORS Enhancement
  - [ ] Cập nhật CORS config
  - [ ] Test với frontend
  - [ ] Test preflight requests
- [ ] Task 1.3: HTTPS Enforcement
  - [ ] Thêm redirect middleware
  - [ ] Thêm security headers
  - [ ] Test redirect
- [ ] Task 1.4: Input Validation
  - [ ] Tạo validators
  - [ ] Áp dụng vào models
  - [ ] Test với malicious inputs

### Phase 2 Checklist:
- [ ] Task 2.1: Request Signing
  - [ ] Install dependencies
  - [ ] Frontend implementation
  - [ ] Backend verification
  - [ ] Testing kỹ lưỡng

---

## 🧪 Testing Plan

### Unit Tests:
- Rate limiting với different scenarios
- CORS với different origins
- Input validation với malicious inputs
- Request signing với valid/invalid signatures

### Integration Tests:
- Full API flow với security enabled
- Error handling
- Performance impact

### Manual Tests:
- Browser dev tools (F12)
- Network tab inspection
- Security headers verification

---

## 📊 Success Metrics

### Phase 1:
- ✅ Rate limiting blocks excessive requests
- ✅ CORS chỉ cho phép allowed origins
- ✅ HTTPS redirect hoạt động
- ✅ Input validation blocks malicious inputs

### Phase 2:
- ✅ Request signing prevents replay attacks
- ✅ No performance degradation (< 10ms overhead)
- ✅ All existing APIs still work

---

## ⚠️ Rollback Plan

Nếu có vấn đề:

1. **Rate Limiting:** Có thể disable bằng environment variable
2. **CORS:** Có thể revert về "*" tạm thời
3. **Request Signing:** Có thể disable trong development mode

---

## 🎯 Kết Luận

**Phase 1 (Quick Wins):** ✅ **Nên triển khai ngay**
- Effort thấp
- Lợi ích cao
- Rủi ro thấp

**Phase 2 (Advanced):** ⚠️ **Triển khai sau khi đánh giá Phase 1**
- Effort cao hơn
- Cần testing kỹ
- Có thể không cần thiết tùy use case

