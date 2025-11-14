# Rate Limiting Test Results - Task 1.1

## ✅ Unit Tests - PASSED

### Test Results:

```
Testing Rate Limiting...
Config: {'max_requests': 100, 'window_seconds': 60, 'enabled': True}

Test 1: Normal requests (should pass)
  [OK] Request 1 passed
  [OK] Request 2 passed
  [OK] Request 3 passed
  [OK] Request 4 passed
  [OK] Request 5 passed

Test 2: Exceed limit (should fail after 100 requests)
  [EXPECTED] Request 96 failed (expected): Rate limit exceeded

Test 3: Different IPs (should have separate limits)
  [OK] Different IP can make requests

Test 4: Get rate limit info
  Rate limit info: {
    'identifier': 'ip:127.0.0.1',
    'requests_count': 100,
    'window_seconds': 60,
    'oldest_request': 1763091487.2271945,
    'newest_request': 1763091487.2282405
  }

[SUCCESS] All tests completed!
```

## 📋 HTTP Tests - Cần Backend Server

### Bước 1: Start Backend Server

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Hoặc nếu dùng virtual environment:
```bash
cd backend
venv\Scripts\activate  # Windows
# hoặc
source venv/bin/activate  # Linux/Mac
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Bước 2: Chạy HTTP Test Script

Trong terminal mới:
```bash
cd backend
python test_rate_limit_http.py
```

### Bước 3: Manual Testing với curl

#### Test 1: Health Check (Không bị rate limit)
```bash
# Make 150 requests - tất cả phải pass
for i in {1..150}; do 
  curl -s http://localhost:8000/health
  echo "Request $i"
done
```

#### Test 2: Normal Requests (Trong giới hạn)
```bash
# Make 10 requests - tất cả phải pass
for i in {1..10}; do 
  curl -i http://localhost:8000/api/employees
  echo "Request $i"
done
```

Kiểm tra headers:
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 90` (giảm dần)

#### Test 3: Rate Limit Exceeded
```bash
# Make 101 requests - request 101 sẽ bị 429
for i in {1..101}; do 
  response=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/employees)
  http_code=$(echo "$response" | tail -n1)
  if [ "$http_code" == "429" ]; then
    echo "Request $i: RATE LIMITED (429)"
    break
  fi
  echo "Request $i: OK ($http_code)"
done
```

Expected response khi bị rate limit:
```json
{
  "detail": "Rate limit exceeded: 100 requests per 60 seconds. Please try again in 45 seconds."
}
```

Headers:
- `HTTP/1.1 429 Too Many Requests`
- `Retry-After: 45`
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 0`

#### Test 4: Different Endpoints (Share rate limit)
```bash
# Test multiple endpoints - tất cả share cùng rate limit
curl -i http://localhost:8000/api/employees
curl -i http://localhost:8000/api/customers
curl -i http://localhost:8000/api/projects
```

Tất cả sẽ có cùng `X-RateLimit-Remaining` value.

## 🧪 Test với PowerShell (Windows)

### Test Health Check:
```powershell
1..150 | ForEach-Object {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
    Write-Host "Request $_: $($response.StatusCode)"
}
```

### Test Rate Limit:
```powershell
$failed = $false
1..101 | ForEach-Object {
    if (-not $failed) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/api/employees" -UseBasicParsing
            $remaining = $response.Headers["X-RateLimit-Remaining"]
            Write-Host "Request $_: OK, Remaining: $remaining"
        } catch {
            if ($_.Exception.Response.StatusCode -eq 429) {
                Write-Host "Request $_: RATE LIMITED (429)"
                $failed = $true
            }
        }
    }
}
```

## ✅ Expected Test Results

### ✅ Test 1: Health Check
- **Expected:** Tất cả 150 requests đều pass (200 OK)
- **Reason:** Health check endpoints không bị rate limit

### ✅ Test 2: Normal Requests
- **Expected:** 10 requests đầu tiên đều pass
- **Headers:** `X-RateLimit-Remaining` giảm từ 99 → 90

### ✅ Test 3: Rate Limit Exceeded
- **Expected:** Request 101 trả về 429 Too Many Requests
- **Headers:** 
  - `Retry-After: <seconds>`
  - `X-RateLimit-Remaining: 0`
- **Body:** JSON với detail message

### ✅ Test 4: Different Endpoints
- **Expected:** Tất cả endpoints share cùng rate limit
- **Headers:** Cùng `X-RateLimit-Remaining` value

## 🔍 Debugging

### Kiểm tra Rate Limit Config:
```python
from backend.middleware.rate_limit import get_rate_limit_config
print(get_rate_limit_config())
```

### Kiểm tra Rate Limit Info:
```python
from backend.middleware.rate_limit import rate_limiter
info = rate_limiter.get_rate_limit_info("ip:127.0.0.1", 60)
print(info)
```

### Kiểm tra Backend Logs:
Khi rate limit bị exceed, backend sẽ log:
```
INFO:     127.0.0.1:xxxxx - "GET /api/employees HTTP/1.1" 429 Too Many Requests
```

## 📊 Test Summary

| Test | Status | Notes |
|------|--------|-------|
| Unit Test - Normal Requests | ✅ PASS | 5 requests passed |
| Unit Test - Exceed Limit | ✅ PASS | Rate limit triggered correctly |
| Unit Test - Different IPs | ✅ PASS | Separate limits per IP |
| Unit Test - Rate Limit Info | ✅ PASS | Info returned correctly |
| HTTP Test - Health Check | ⏳ PENDING | Cần backend server running |
| HTTP Test - Normal Requests | ⏳ PENDING | Cần backend server running |
| HTTP Test - Rate Limit Exceeded | ⏳ PENDING | Cần backend server running |
| HTTP Test - Headers | ⏳ PENDING | Cần backend server running |

## 🎯 Next Steps

1. **Start backend server** (nếu chưa chạy)
2. **Run HTTP test script**: `python backend/test_rate_limit_http.py`
3. **Verify results** match expected behavior
4. **Mark task as completed** nếu tất cả tests pass

## ⚠️ Lưu Ý

- Rate limiting sử dụng **in-memory store**, nên khi restart server, rate limit sẽ reset
- Rate limiting dựa trên **IP address**, nên requests từ cùng IP sẽ share limit
- Health check endpoints (`/`, `/health`, `/docs`, `/redoc`) **KHÔNG** bị rate limit
- Rate limit window là **sliding window**, không phải fixed window

