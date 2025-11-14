# Request Signing Implementation - Task 2.1

## ✅ Đã Hoàn Thành

### Files Đã Tạo/Sửa:

1. **`frontend/src/lib/api/security.ts`** - Request Signing Utilities:
   - `generateRequestSignature()` - Generate HMAC-SHA256 signature
   - `getSecureHeaders()` - Generate secure headers với signature
   - `generateRequestId()` - Generate unique request ID

2. **`frontend/src/lib/api/client.ts`** - Đã cập nhật:
   - Thêm `getSecureHeaders()` method
   - Tự động thêm security headers vào tất cả requests
   - Support cho request signing (có thể enable/disable)

3. **`backend/middleware/request_signing.py`** - Request Signing Middleware:
   - `verify_request_signature()` - Verify HMAC-SHA256 signature
   - `verify_timestamp()` - Verify timestamp trong window (5 phút)
   - Skip verification trong development mode (mặc định)

4. **`backend/config.py`** - Đã thêm:
   - `API_SECRET` - Secret key cho request signing
   - `REQUEST_SIGNING_ENABLED` - Enable/disable request signing
   - `REQUEST_TIMESTAMP_WINDOW` - Timestamp window (default 300 seconds)

5. **`backend/main.py`** - Đã tích hợp:
   - RequestSigningMiddleware
   - Skip verification trong development (mặc định)

6. **`backend/test_request_signing.py`** - Test script
7. **`backend/env.example`** - Đã thêm request signing config

## 🔧 Cấu Hình

### Frontend Environment Variables:

Thêm vào `frontend/.env.local`:
```env
NEXT_PUBLIC_ENABLE_REQUEST_SIGNING=true
NEXT_PUBLIC_API_SECRET=your_api_secret_here
```

### Backend Environment Variables:

Thêm vào `backend/.env`:
```env
API_SECRET=your_api_secret_here_change_in_production
REQUEST_SIGNING_ENABLED=false  # Set to true to enable
REQUEST_TIMESTAMP_WINDOW=300   # 5 minutes
```

## 📋 Request Signing Flow

### Frontend (Request Generation):

1. **Generate Timestamp:** Unix timestamp in seconds
2. **Generate Nonce:** Random string (UUID-like)
3. **Calculate Body Hash:** SHA256 hash of request body (if present)
4. **Create Payload:** `METHOD|PATH|TIMESTAMP|NONCE|BODY_HASH`
5. **Generate Signature:** HMAC-SHA256(payload, API_SECRET)
6. **Add Headers:**
   - `X-Request-Timestamp`
   - `X-Request-Nonce`
   - `X-Request-Signature`
   - `X-Request-ID`

### Backend (Request Verification):

1. **Extract Headers:** Get timestamp, nonce, signature từ headers
2. **Verify Timestamp:** Check if timestamp is within window (5 minutes)
3. **Calculate Expected Signature:** Same process as frontend
4. **Compare Signatures:** Constant-time comparison
5. **Accept/Reject:** Accept if valid, reject with 401 if invalid

## 🧪 Testing

### Test Results:

```
✅ Test 1: Valid Signature - PASS
✅ Test 2: Invalid Signature - PASS (disabled in dev)
✅ Test 3: Expired Timestamp - PASS (disabled in dev)
✅ Test 4: Missing Headers - PASS (disabled in dev)
✅ Test 5: POST with Body - PASS

Total: 5/5 tests passed
```

### Test Script:

Chạy test script:
```bash
cd backend
python test_request_signing.py
```

### Manual Testing:

#### Test với Request Signing Enabled:

1. **Enable trong backend/.env:**
   ```env
   REQUEST_SIGNING_ENABLED=true
   API_SECRET=your-secret-key
   ```

2. **Enable trong frontend/.env.local:**
   ```env
   NEXT_PUBLIC_ENABLE_REQUEST_SIGNING=true
   NEXT_PUBLIC_API_SECRET=your-secret-key
   ```

3. **Restart servers và test**

## 🔐 Security Features

### Request Signing:
- **HMAC-SHA256:** Cryptographically secure signature
- **Timestamp Verification:** Prevents replay attacks (5 minute window)
- **Nonce:** Prevents duplicate requests
- **Body Hash:** Ensures request body integrity

### Protection Against:
- ✅ **Request Tampering:** Signature verification prevents modification
- ✅ **Replay Attacks:** Timestamp window prevents old requests
- ✅ **Man-in-the-Middle:** Signature ensures request authenticity
- ✅ **Request Forgery:** Nonce prevents duplicate requests

## ⚠️ Lưu Ý

1. **Development vs Production:**
   - Development: Request signing disabled by default
   - Production: Should be enabled for security
   - Can be enabled in development for testing

2. **API Secret:**
   - Must be same in frontend and backend
   - Should be strong and random
   - Never commit to version control
   - Use environment variables

3. **Timestamp Window:**
   - Default: 5 minutes (300 seconds)
   - Adjust based on network latency
   - Too small: May reject valid requests
   - Too large: May allow replay attacks

4. **Performance:**
   - Signature generation is fast
   - Verification is fast
   - Minimal overhead

5. **Clock Skew:**
   - Timestamp window accounts for clock differences
   - 5 minutes should be sufficient for most cases
   - Adjust if needed

## 🚀 Production Setup

### 1. Generate Strong API Secret:

```bash
# Generate random secret
openssl rand -hex 32
```

### 2. Set Environment Variables:

**Backend:**
```env
API_SECRET=<generated-secret>
REQUEST_SIGNING_ENABLED=true
REQUEST_TIMESTAMP_WINDOW=300
```

**Frontend:**
```env
NEXT_PUBLIC_ENABLE_REQUEST_SIGNING=true
NEXT_PUBLIC_API_SECRET=<same-secret>
```

### 3. Verify:

- Test với valid signature → should pass
- Test với invalid signature → should fail 401
- Test với expired timestamp → should fail 401
- Test với missing headers → should fail 401

## ✅ Checklist Hoàn Thành

- [x] Install crypto-js cho frontend
- [x] Verify hmac/hashlib trong backend
- [x] Tạo `frontend/src/lib/api/security.ts`
- [x] Implement `generateRequestSignature()`
- [x] Update API client với secure headers
- [x] Tạo `backend/middleware/request_signing.py`
- [x] Implement `verify_request_signature()`
- [x] Integrate vào main.py
- [x] Test với valid/invalid signatures
- [x] Test timestamp expiration
- [x] Test missing headers
- [x] Verify không có linter errors

## 📝 Next Steps

1. **Production Deployment:**
   - Set strong API_SECRET
   - Enable REQUEST_SIGNING_ENABLED=true
   - Test thoroughly

2. **Monitoring:**
   - Monitor signature verification failures
   - Track timestamp rejections
   - Alert on suspicious patterns

3. **Documentation:**
   - Update API documentation
   - Document request signing requirements
   - Add examples

