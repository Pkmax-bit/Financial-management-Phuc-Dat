# Cải Thiện Error Handling cho API Client

## Vấn Đề

API client đang retry 5 lần cho mọi 500 error, nhưng một số endpoints (như `/api/tasks/project/{id}/comments`) có thể mất nhiều thời gian và không nên retry quá nhiều lần.

## Các Cải Thiện Đã Thực Hiện

### 1. Giảm Retries cho Heavy Endpoints

**Trước:**
- Tất cả endpoints retry 5 lần cho 500 errors
- Không phân biệt giữa heavy và light endpoints

**Sau:**
- Heavy endpoints (như `/project/{id}/comments`) chỉ retry tối đa 2 lần
- Light endpoints vẫn retry 5 lần như bình thường

**Code:**
```typescript
const isHeavyEndpoint = url.includes('/project/') && url.includes('/comments')
const maxRetriesForHeavyEndpoint = 2

if (isHeavyEndpoint && attempt >= maxRetriesForHeavyEndpoint) {
  console.warn(`[API] Skipping further retries for heavy endpoint after ${attempt + 1} attempts:`, url)
  // Exit retry loop early
  break
}
```

### 2. Cải Thiện Error Logging

**Trước:**
- Chỉ log error message và endpoint
- Không có thông tin về response body

**Sau:**
- Log thêm `isHeavyEndpoint` flag
- Log response body preview (200 chars đầu tiên)
- Log errorData chi tiết hơn

**Code:**
```typescript
console.error(`[API] Server error ${response.status} after ${retries} attempts:`, {
  error: errorMessage,
  endpoint: url,
  errorData: errorData,
  attempts: retries,
  isHeavyEndpoint,
  responseBodyPreview
})
```

### 3. User-Friendly Error Messages

**Trước:**
- Generic error message cho tất cả endpoints

**Sau:**
- Custom message cho heavy endpoints
- Message rõ ràng hơn về cách xử lý

**Code:**
```typescript
const detailedMessage = isHeavyEndpoint 
  ? `Endpoint này có thể mất nhiều thời gian để xử lý (${response.status}). Vui lòng thử lại sau hoặc refresh trang.`
  : `Backend server error (${response.status}). Đã thử ${retries} lần nhưng không thành công. Vui lòng thử lại sau vài giây hoặc liên hệ admin nếu vấn đề tiếp tục.`
```

## Lợi Ích

1. **Giảm Server Load**: Heavy endpoints không retry quá nhiều lần
2. **Better UX**: User nhận được message rõ ràng hơn
3. **Better Debugging**: Logs chi tiết hơn để debug
4. **Faster Failure**: Heavy endpoints fail nhanh hơn thay vì chờ 5 retries

## Endpoints Được Coi Là "Heavy"

Hiện tại chỉ có:
- `/api/tasks/project/{project_id}/comments`

Có thể thêm các endpoints khác nếu cần:
```typescript
const isHeavyEndpoint = 
  (url.includes('/project/') && url.includes('/comments')) ||
  url.includes('/large-export') ||
  url.includes('/bulk-operation')
```

## Testing

1. Test với endpoint `/api/tasks/project/{id}/comments`:
   - Nếu backend trả về 500, chỉ retry 2 lần thay vì 5
   - Error message sẽ rõ ràng hơn

2. Test với endpoints khác:
   - Vẫn retry 5 lần như bình thường
   - Error message generic

## Next Steps

1. Monitor logs để xem có endpoints nào khác cần giảm retries không
2. Có thể thêm configuration để customize retries per endpoint
3. Có thể thêm circuit breaker pattern cho heavy endpoints


