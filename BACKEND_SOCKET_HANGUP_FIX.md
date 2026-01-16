# 🔧 Giải Pháp Lỗi "Socket Hang Up" và "ECONNRESET"

## 🔴 Vấn Đề

Khi 3 tài khoản gửi tin nhắn cùng lúc, backend bị lỗi:
- `socket hang up`
- `ECONNRESET`
- `Internal Server Error (500)`

## ✅ Đã Tối Ưu Frontend

### 1. Retry Logic Cải Thiện
- ✅ Tăng số retry: 3 → **5 lần**
- ✅ Exponential backoff với jitter: 1s → 2s → 4s → 8s → 16s (max 5s)
- ✅ Random delay trước khi gửi: 100-300ms (tránh thundering herd)

### 2. Rate Limiting
- ✅ Minimum 300ms giữa các lần gửi
- ✅ Lock mechanism để tránh gửi đồng thời

### 3. Better Error Handling
- ✅ Phát hiện network errors tự động
- ✅ Retry cho socket hang up, ECONNRESET
- ✅ Logging chi tiết để debug

## 🔍 Nguyên Nhân Có Thể

### 1. Backend Quá Tải
- Database connection pool cạn
- Backend không xử lý được nhiều requests đồng thời
- Memory issues

### 2. Network/Proxy Issues
- Next.js proxy timeout
- Backend server crash/restart
- Connection pool exhausted

## 🛠️ Giải Pháp Backend (Cần Kiểm Tra)

### 1. Kiểm Tra Database Connection Pool

```python
# FastAPI/Starlette
# Tăng pool size trong database config
DATABASE_POOL_SIZE = 20  # Tăng từ 10 → 20
DATABASE_MAX_OVERFLOW = 10
```

### 2. Thêm Connection Timeout

```python
# Tăng timeout cho database queries
DATABASE_POOL_TIMEOUT = 30  # seconds
```

### 3. Thêm Rate Limiting ở Backend

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/api/tasks/{task_id}/comments")
@limiter.limit("10/minute")  # Giới hạn 10 requests/phút/user
async def create_comment(...):
    ...
```

### 4. Thêm Request Queue

```python
# Sử dụng asyncio.Queue để xử lý requests tuần tự
import asyncio

request_queue = asyncio.Queue(maxsize=100)

async def process_comment_queue():
    while True:
        request = await request_queue.get()
        try:
            await handle_create_comment(request)
        finally:
            request_queue.task_done()
```

### 5. Tối Ưu Database Query

```python
# Sử dụng connection pooling đúng cách
# Tránh N+1 queries
# Sử dụng batch inserts nếu có nhiều comments
```

## 📊 Monitoring

### Kiểm Tra Backend Logs

```bash
# Xem logs backend để tìm lỗi cụ thể
tail -f backend/logs/app.log | grep -i "error\|exception\|timeout"
```

### Kiểm Tra Database Connections

```sql
-- Kiểm tra số connections đang active
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Kiểm tra max connections
SHOW max_connections;
```

## 🚀 Quick Fixes

### Option 1: Tăng Timeout trong Next.js Config

```typescript
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
        // Thêm timeout
      }
    ]
  },
  // Thêm httpAgent với timeout
  httpAgentOptions: {
    keepAlive: true,
    timeout: 30000, // 30 seconds
  }
}
```

### Option 2: Thêm Circuit Breaker

```typescript
// Nếu backend fail quá nhiều, tạm dừng requests
let consecutiveFailures = 0
const MAX_FAILURES = 5
const CIRCUIT_BREAKER_TIMEOUT = 10000 // 10 seconds

if (consecutiveFailures >= MAX_FAILURES) {
  // Circuit breaker open - không gửi requests
  throw new Error('Backend temporarily unavailable')
}
```

## 📝 Checklist Debug

- [ ] Kiểm tra backend có đang chạy không
- [ ] Kiểm tra database connection pool size
- [ ] Kiểm tra backend logs để tìm lỗi cụ thể
- [ ] Kiểm tra network connection
- [ ] Test với 1 user trước, sau đó tăng lên 3 users
- [ ] Kiểm tra memory usage của backend
- [ ] Kiểm tra database query performance

## 🔄 Test Scenario

1. **Test với 1 user**: Gửi 10 tin nhắn liên tiếp
2. **Test với 2 users**: Gửi đồng thời
3. **Test với 3 users**: Gửi đồng thời (scenario hiện tại bị lỗi)

Nếu test 1 user OK nhưng 3 users fail → Backend cần tối ưu để xử lý concurrent requests.

