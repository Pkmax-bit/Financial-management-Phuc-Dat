# 🔍 Phân Tích Lỗi "Socket Hang Up" và 500 Internal Server Error

## ❌ Lỗi Hiện Tại

```
Request URL: http://localhost:3000/api/tasks/project/{project_id}/comments
Status Code: 500 Internal Server Error
Error: socket hang up / ECONNRESET
```

## 🔍 Nguyên Nhân Thường Gặp

### 1. **Backend Server Timeout** ⏱️
- **Nguyên nhân:** Query quá lâu, vượt quá timeout của server
- **Dấu hiệu:** Connection bị đứt giữa chừng (ECONNRESET)
- **Giải pháp:** 
  - Tăng timeout settings
  - Tối ưu query (đã làm - batch processing)
  - Thêm pagination

### 2. **Backend Server Crash/Out of Memory** 💥
- **Nguyên nhân:** 
  - Query trả về quá nhiều data → Out of Memory
  - Exception không được catch → Server crash
- **Dấu hiệu:** Server không phản hồi, connection reset
- **Giải pháp:**
  - Limit số lượng records trả về
  - Thêm try-catch toàn diện
  - Monitor memory usage

### 3. **Database Connection Timeout** 🗄️
- **Nguyên nhân:** 
  - Supabase connection pool exhausted
  - Query quá phức tạp
  - Database overload
- **Dấu hiệu:** Timeout khi query database
- **Giải pháp:**
  - Connection pooling
  - Query optimization
  - Retry logic

### 4. **Network Issues** 🌐
- **Nguyên nhân:**
  - Proxy timeout (Next.js → Backend)
  - Keep-alive timeout quá ngắn
- **Dấu hiệu:** Connection reset giữa frontend và backend
- **Giải pháp:**
  - Tăng proxy timeout
  - Tăng keep-alive timeout

### 5. **Backend Process Killed** ⚠️
- **Nguyên nhân:**
  - OOM Killer (Out of Memory)
  - Process manager restart
  - System resource limit
- **Dấu hiệu:** Server đột ngột không phản hồi
- **Giải pháp:**
  - Monitor memory
  - Optimize code
  - Increase resource limits

## ✅ Giải Pháp Đã Áp Dụng

### 1. Batch Processing (Đã làm)
```python
# Chia query thành batches 100 tasks/batch
BATCH_SIZE = 100
for i in range(0, len(task_ids), BATCH_SIZE):
    batch_task_ids = task_ids[i:i + BATCH_SIZE]
    # Query từng batch
```

### 2. Error Handling (Đã làm)
```python
try:
    # Query batch
except Exception as batch_error:
    logger.warning(f"Error fetching comments for batch: {str(batch_error)}")
    continue  # Continue với batch tiếp theo
```

## 🔧 Giải Pháp Bổ Sung Cần Làm

### 1. Thêm Timeout và Limit cho Endpoint

```python
@router.get("/project/{project_id}/comments", response_model=List[TaskComment])
async def get_project_comments(
    project_id: str,
    limit: int = Query(1000, ge=1, le=5000),  # Limit số comments
    current_user: User = Depends(get_current_user)
):
    # ... existing code ...
    
    # Limit số comments trả về
    if len(all_comments) > limit:
        all_comments = all_comments[-limit:]  # Lấy limit comments mới nhất
```

### 2. Thêm Pagination

```python
@router.get("/project/{project_id}/comments", response_model=List[TaskComment])
async def get_project_comments(
    project_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user)
):
    # ... fetch comments ...
    
    # Paginate
    return enriched_comments[skip:skip+limit]
```

### 3. Tối Ưu Query - Chỉ Lấy Comments Mới Nhất

```python
# Thay vì lấy tất cả comments, chỉ lấy comments gần đây
comments_result = supabase.table("task_comments").select("""
    *,
    users:user_id(id, full_name),
    employees:employee_id(id, first_name, last_name)
""").in_("task_id", batch_task_ids)\
    .order("created_at", desc=True)\
    .limit(1000)\
    .execute()  # Limit 1000 comments mới nhất
```

### 4. Thêm Connection Retry

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def fetch_comments_with_retry(supabase, task_ids):
    # Query với retry logic
    pass
```

### 5. Tăng Timeout trong Next.js Config

```typescript
// next.config.ts
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${apiUrl}/api/:path*`,
      // Thêm timeout
    }
  ]
}
```

### 6. Thêm Response Streaming (Cho Large Data)

```python
from fastapi.responses import StreamingResponse
import json

@router.get("/project/{project_id}/comments")
async def get_project_comments_stream(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    async def generate():
        # Stream comments từng batch
        for batch in batches:
            yield json.dumps(batch) + "\n"
    
    return StreamingResponse(generate(), media_type="application/json")
```

## 🎯 Khuyến Nghị Ngay Lập Tức

### Priority 1: Thêm Limit và Timeout
1. Thêm `limit` parameter để giới hạn số comments
2. Thêm timeout cho Supabase queries
3. Tăng timeout trong Next.js proxy config

### Priority 2: Optimize Query
1. Chỉ lấy comments mới nhất (last 1000)
2. Thêm pagination
3. Cache kết quả nếu có thể

### Priority 3: Monitoring
1. Thêm logging chi tiết
2. Monitor memory usage
3. Track query performance

## 📊 Checklist Debug

- [ ] Kiểm tra backend logs để xem lỗi cụ thể
- [ ] Kiểm tra xem backend có đang chạy không
- [ ] Kiểm tra memory usage của backend
- [ ] Kiểm tra Supabase connection pool
- [ ] Test với project có ít tasks/comments trước
- [ ] Kiểm tra network latency giữa frontend và backend

## 🔍 Cách Debug

### 1. Kiểm tra Backend Logs
```bash
# Xem logs của backend
tail -f backend/logs/app.log
# hoặc
python backend/main.py  # Xem console output
```

### 2. Test API Trực Tiếp
```bash
curl -X GET "http://localhost:8000/api/tasks/project/6bf71318-f57f-405f-b137-f6770c99cd01/comments" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Kiểm tra Database Query
```python
# Thêm logging vào endpoint
logger.info(f"Fetching {len(task_ids)} tasks, estimated {estimated_comments} comments")
```

---

**Lưu ý:** Lỗi "socket hang up" thường xảy ra khi:
- Backend xử lý quá lâu (> 30-60s)
- Backend crash hoặc out of memory
- Network timeout
- Database connection timeout

**Giải pháp tốt nhất:** Thêm limit, pagination, và optimize query!
