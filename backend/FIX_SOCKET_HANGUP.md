# 🔧 Giải Pháp Khắc Phục Lỗi "Socket Hang Up" - Backend

## 🔴 Nguyên Nhân Chính

1. **Uvicorn chạy với cấu hình mặc định:**
   - Chỉ 1 worker (single-threaded)
   - Không có timeout settings
   - Không có connection limits
   - Không có rate limiting

2. **Supabase Database Connection:**
   - Connection pool có thể cạn kiệt
   - Không có connection pooling configuration
   - Queries có thể chạy quá lâu

3. **Nhiều requests đồng thời:**
   - 3 users gửi tin nhắn cùng lúc
   - Backend không xử lý được concurrent requests

## ✅ Giải Pháp

### Solution 1: Tối Ưu Uvicorn Configuration

**File: `backend/main.py`**

Thay đổi phần cuối:

```python
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Thay đổi từ "localhost"
        port=8000,
        reload=True,
        log_level="info",
        # Thêm các settings sau:
        workers=2,  # Tăng số workers (nếu có đủ RAM)
        timeout_keep_alive=75,  # Tăng timeout
        limit_concurrency=100,  # Giới hạn concurrent connections
        limit_max_requests=1000,  # Restart worker sau 1000 requests (tránh memory leak)
        backlog=2048,  # Tăng backlog queue
    )
```

**Lưu ý:** Nếu chạy trên Windows, `workers` không hoạt động. Chỉ dùng trên Linux/Mac.

### Solution 2: Tạo File Chạy Production

**File: `backend/run_production.py`**

```python
"""
Production server runner với cấu hình tối ưu
"""
import uvicorn
import multiprocessing

if __name__ == "__main__":
    # Tính số workers dựa trên CPU cores
    workers = max(2, multiprocessing.cpu_count())
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        workers=workers,  # Số workers = số CPU cores
        log_level="info",
        timeout_keep_alive=75,
        limit_concurrency=200,
        limit_max_requests=1000,
        backlog=2048,
        access_log=True,
    )
```

### Solution 3: Thêm Rate Limiting Middleware

**File: `backend/middleware/rate_limit.py`** (Tạo mới)

```python
"""
Rate Limiting Middleware
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
import time
from typing import Dict, Tuple

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        # Lấy IP address
        client_ip = request.client.host if request.client else "unknown"
        
        # Kiểm tra rate limit
        now = time.time()
        minute_ago = now - 60
        
        # Lọc requests trong 1 phút qua
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if req_time > minute_ago
        ]
        
        # Kiểm tra số requests
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=429,
                detail="Quá nhiều requests. Vui lòng thử lại sau."
            )
        
        # Thêm request hiện tại
        self.requests[client_ip].append(now)
        
        # Xử lý request
        response = await call_next(request)
        return response
```

**Thêm vào `main.py`:**

```python
from middleware.rate_limit import RateLimitMiddleware

# Thêm sau CORS middleware
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=100  # 100 requests/phút/user
)
```

### Solution 4: Tối Ưu Database Connection (Nếu dùng Supabase Client)

**File: `backend/database.py`** (Tạo mới nếu chưa có)

```python
"""
Database connection pool configuration
"""
from supabase import create_client, Client
from config import settings
import asyncio
from typing import Optional

# Global Supabase client với connection pooling
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Get or create Supabase client with connection pooling"""
    global _supabase_client
    
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
            options={
                "db": {
                    "schema": "public",
                },
                "auth": {
                    "auto_refresh_token": True,
                    "persist_session": False,  # Không persist session để tránh memory leak
                },
                "global": {
                    "headers": {
                        "x-client-info": "financial-management-backend",
                    },
                },
            }
        )
    
    return _supabase_client
```

### Solution 5: Thêm Request Timeout Middleware

**File: `backend/middleware/timeout.py`** (Tạo mới)

```python
"""
Request Timeout Middleware
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio

class TimeoutMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, timeout: int = 30):
        super().__init__(app)
        self.timeout = timeout
    
    async def dispatch(self, request: Request, call_next):
        try:
            # Tạo timeout task
            response = await asyncio.wait_for(
                call_next(request),
                timeout=self.timeout
            )
            return response
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504,
                detail=f"Request timeout sau {self.timeout} giây"
            )
```

**Thêm vào `main.py`:**

```python
from middleware.timeout import TimeoutMiddleware

app.add_middleware(TimeoutMiddleware, timeout=30)  # 30 seconds timeout
```

## 🚀 Cách Áp Dụng

### Bước 1: Cập nhật `main.py`

```python
# Thay đổi phần cuối của main.py
if __name__ == "__main__":
    import sys
    import os
    
    # Kiểm tra môi trường
    is_production = os.getenv("ENVIRONMENT") == "production"
    
    if is_production:
        # Production: Chạy với workers
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            workers=2,  # Tăng số workers
            log_level="info",
            timeout_keep_alive=75,
            limit_concurrency=100,
            limit_max_requests=1000,
        )
    else:
        # Development: Chạy với reload
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="debug",
            timeout_keep_alive=75,
        )
```

### Bước 2: Tạo các middleware files

1. Tạo `backend/middleware/rate_limit.py`
2. Tạo `backend/middleware/timeout.py`
3. Thêm vào `main.py`

### Bước 3: Test

```bash
# Restart backend
cd backend
python main.py

# Test với nhiều requests
# Mở 3 browser windows và gửi tin nhắn cùng lúc
```

## 📊 Monitoring

### Kiểm tra số connections:

```python
# Thêm endpoint để check health
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "workers": 1,  # Sẽ thay đổi nếu dùng workers
    }
```

### Kiểm tra logs:

```bash
# Xem logs realtime
tail -f backend/logs/app.log | grep -i "error\|timeout\|connection"
```

## ⚠️ Lưu Ý

1. **Windows:** Không hỗ trợ `workers` trong uvicorn. Chỉ dùng trên Linux/Mac hoặc production server.

2. **Memory:** Tăng workers sẽ tăng memory usage. Monitor memory usage.

3. **Database:** Supabase có giới hạn connections. Không tăng quá nhiều workers nếu không cần.

4. **Testing:** Test từng solution một, không áp dụng tất cả cùng lúc.

