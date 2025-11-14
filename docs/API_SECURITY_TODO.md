# 📋 TODO List - Bảo Mật API

## 🎯 Tổng Quan

Danh sách các task cần thực hiện để triển khai bảo mật API, được chia thành 2 phases.

**Phase 1 (Quick Wins):** 4-5 giờ - Tăng bảo mật cơ bản  
**Phase 2 (Advanced):** 3-5 ngày - Bảo mật nâng cao

---

## ✅ Phase 1: Quick Wins (Ưu tiên cao)

### 🔒 Task 1.1: Rate Limiting

- [x] **security-1**: Implement Rate Limiting ✅
  - Tạo `backend/middleware/rate_limit.py`
  - Implement in-memory rate limiter với defaultdict
  - Giới hạn: 100 requests/phút theo IP hoặc user_id
  - **Thời gian:** 30 phút

- [x] **security-2**: Integrate Rate Limiting vào main.py ✅
  - Thêm middleware vào FastAPI app
  - Skip rate limiting cho health check endpoints (/, /health, /docs)
  - **Thời gian:** 15 phút

- [x] **security-3**: Test Rate Limiting ✅
  - Test với nhiều requests liên tiếp (vượt limit)
  - Test với different IPs
  - Test với authenticated users
  - Verify 429 response và Retry-After header
  - **Thời gian:** 15 phút

**Tổng thời gian:** 1 giờ

---

### 🌐 Task 1.2: CORS Enhancement

- [x] **security-4**: Enhance CORS Configuration ✅
  - Cập nhật `backend/main.py`
  - Production: Chỉ cho phép specific origins
  - Development: Giữ nguyên "*" nhưng thêm max_age
  - Thêm expose_headers: ["X-Request-ID"]
  - **Thời gian:** 20 phút

- [x] **security-5**: Test CORS ✅
  - Test với frontend từ allowed origin
  - Test với frontend từ disallowed origin
  - Test preflight requests (OPTIONS)
  - Verify CORS headers trong response
  - **Thời gian:** 10 phút

**Tổng thời gian:** 30 phút

---

### 🔐 Task 1.3: HTTPS Enforcement

- [x] **security-6**: Implement HTTPS Enforcement ✅
  - Thêm middleware redirect HTTP → HTTPS trong production
  - Chỉ áp dụng khi ENVIRONMENT=production
  - **Thời gian:** 15 phút

- [x] **security-7**: Add Security Headers ✅
  - Strict-Transport-Security: max-age=31536000; includeSubDomains
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - **Thời gian:** 15 phút

- [x] **security-8**: Test HTTPS Redirect ✅
  - Test HTTP request → verify redirect 301
  - Test HTTPS request → verify no redirect
  - Verify security headers trong browser dev tools
  - **Thời gian:** 10 phút

**Tổng thời gian:** 40 phút

---

### 🛡️ Task 1.4: Input Validation Enhancement

- [x] **security-9**: Create Input Validators ✅
  - Tạo `backend/utils/validators.py`
  - Implement `sanitize_string()` - remove XSS và SQL injection patterns
  - Implement `validate_email()` - regex validation
  - Implement `validate_phone()` - format và length check
  - **Thời gian:** 45 phút

- [x] **security-10**: Apply Validation to Models ✅
  - Áp dụng validators vào `CustomerCreate`, `CustomerUpdate`
  - Áp dụng vào `EmployeeCreate`, `EmployeeUpdate`
  - Áp dụng vào các models quan trọng khác (Invoice, Quote, Project)
  - **Thời gian:** 1 giờ

- [x] **security-11**: Test Input Validation ✅
  - Test với XSS payloads: `<script>alert('xss')</script>`
  - Test với SQL injection: `'; DROP TABLE users; --`
  - Test với invalid email formats
  - Test với invalid phone numbers
  - Verify validation errors được trả về đúng
  - **Thời gian:** 30 phút

**Tổng thời gian:** 2 giờ 15 phút

---

## ⚠️ Phase 2: Advanced Security (Triển khai sau)

### 🔑 Task 2.1: Request Signing

- [x] **security-12**: Install Crypto Dependencies ✅
  - Frontend: `npm install crypto-js @types/crypto-js`
  - Backend: Verify có sẵn `hmac`, `hashlib` (Python stdlib)
  - **Thời gian:** 10 phút

- [x] **security-13**: Implement Request Signing (Frontend) ✅
  - Tạo `frontend/src/lib/api/security.ts`
  - Implement `generateRequestSignature()` function
  - Sử dụng HMAC-SHA256 với API_SECRET
  - Generate nonce và timestamp
  - **Thời gian:** 1 giờ

- [x] **security-14**: Update API Client ✅
  - Cập nhật `frontend/src/lib/api/client.ts`
  - Sử dụng `getSecureHeaders()` thay vì `getAuthHeaders()`
  - Thêm X-Request-Timestamp, X-Request-Signature, X-Request-ID headers
  - **Thời gian:** 30 phút

- [x] **security-15**: Implement Request Verification (Backend) ✅
  - Tạo `backend/middleware/request_signing.py`
  - Implement `verify_request_signature()` function
  - Verify timestamp (5 minute window)
  - Verify signature với HMAC-SHA256
  - **Thời gian:** 1 giờ

- [x] **security-16**: Integrate Security Middleware ✅
  - Thêm security middleware vào `backend/main.py`
  - Cho phép skip verification trong development mode
  - Handle missing headers gracefully
  - **Thời gian:** 30 phút

- [x] **security-17**: Test Request Signing ✅
  - Test với valid signature → should pass
  - Test với invalid signature → should fail 401
  - Test với expired timestamp → should fail 401
  - Test với missing headers → should fail 401 (production) hoặc pass (development)
  - Test clock skew scenarios
  - **Thời gian:** 1 giờ

**Tổng thời gian:** 4-5 giờ (1 ngày)

---

### 🔄 Task 2.2: Token Auto-Refresh

- [ ] **security-18**: Implement Token Auto-Refresh
  - Cập nhật `frontend/src/lib/api/client.ts`
  - Check token expiration trước mỗi request
  - Tự động refresh nếu token sắp hết hạn (< 5 phút)
  - Sử dụng Supabase `refreshSession()`
  - **Thời gian:** 2 giờ

- [ ] **security-19**: Handle Race Conditions
  - Implement request queue khi đang refresh token
  - Tránh multiple refresh requests đồng thời
  - Tránh infinite refresh loop
  - Handle refresh failure gracefully
  - **Thời gian:** 2 giờ

- [ ] **security-20**: Test Token Rotation
  - Test với single tab → verify auto-refresh
  - Test với multiple tabs → verify không có race condition
  - Test với token expiration → verify refresh flow
  - Test với refresh failure → verify error handling
  - **Thời gian:** 1 giờ

**Tổng thời gian:** 5 giờ (1 ngày)

---

## 📚 Documentation Tasks

- [ ] **security-21**: Update API_SECURITY_GUIDE.md
  - Cập nhật tài liệu với các biện pháp đã triển khai
  - Thêm examples và code snippets
  - Thêm troubleshooting section
  - **Thời gian:** 1 giờ

- [ ] **security-22**: Create Security Testing Guide
  - Tạo `docs/SECURITY_TESTING.md`
  - Hướng dẫn test từng biện pháp bảo mật
  - Test cases và expected results
  - **Thời gian:** 1 giờ

---

## 📊 Tổng Kết

### Phase 1 (Quick Wins):
- **Tổng số task:** 11 tasks
- **Tổng thời gian:** ~4 giờ 25 phút
- **Ưu tiên:** ⭐⭐⭐⭐⭐ (Cao nhất)
- **Lợi ích:** ⭐⭐⭐⭐⭐ (Rất cao)
- **Rủi ro:** ⭐ (Rất thấp)

### Phase 2 (Advanced):
- **Tổng số task:** 8 tasks
- **Tổng thời gian:** ~2-3 ngày
- **Ưu tiên:** ⭐⭐⭐ (Trung bình)
- **Lợi ích:** ⭐⭐⭐⭐ (Cao)
- **Rủi ro:** ⭐⭐⭐ (Trung bình)

---

## 🎯 Lộ Trình Đề Xuất

### Tuần 1: Phase 1 (Quick Wins)
- **Ngày 1:** Task 1.1 + 1.2 (Rate Limiting + CORS) - 1.5 giờ
- **Ngày 2:** Task 1.3 + 1.4 (HTTPS + Validation) - 3 giờ
- **Ngày 3:** Testing và fix bugs - 2 giờ

### Tuần 2-3: Phase 2 (Advanced) - Tùy chọn
- **Tuần 2:** Task 2.1 (Request Signing) - 1 ngày
- **Tuần 3:** Task 2.2 (Token Refresh) - 1 ngày

---

## ✅ Checklist Hoàn Thành

Sau khi hoàn thành mỗi task, đánh dấu checkbox và cập nhật status trong TODO system.

**Lưu ý:** 
- Bắt đầu với Phase 1 trước
- Test kỹ từng task trước khi chuyển sang task tiếp theo
- Document lại các thay đổi
- Commit code sau mỗi task hoàn thành

---

## 🔗 Liên Kết

- [API Security Guide](./API_SECURITY_GUIDE.md) - Hướng dẫn chi tiết
- [Feasibility Analysis](./API_SECURITY_FEASIBILITY.md) - Đánh giá tính khả thi
- [Implementation Plan](./API_SECURITY_IMPLEMENTATION_PLAN.md) - Kế hoạch triển khai chi tiết

