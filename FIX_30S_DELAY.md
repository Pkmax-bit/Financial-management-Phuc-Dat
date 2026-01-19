# Fix Delay 30 Giây - Realtime Messages

## Nguyên Nhân Đã Tìm Thấy

### 1. MAX_RETRY_DELAY = 30s
**File:** `frontend/src/hooks/useRealtimeChat.ts`

**Vấn đề:**
- Khi realtime connection bị lỗi, retry delay có thể lên đến 30s
- Nếu connection fail nhiều lần, delay tích lũy

**Đã sửa:**
```typescript
// Trước:
const MAX_RETRY_DELAY = 30000 // 30 seconds

// Sau:
const MAX_RETRY_DELAY = 5000 // 5 seconds
```

### 2. Polling Interval Quá Lâu
**File:** `frontend/src/components/projects/ProjectTasksTab.tsx`

**Vấn đề:**
- Polling fallback có interval 5-15s
- Nếu realtime không hoạt động, phải đợi polling

**Đã sửa:**
```typescript
// Trước:
const baseInterval = 5000 // 5 seconds
const maxInterval = 15000 // 15 seconds

// Sau:
const baseInterval = 1000 // 1 second
const maxInterval = 5000 // 5 seconds
```

### 3. Tenant Bị Stop Khi Không Có Users
**Từ Supabase Logs:**
- "Stop tenant because of no connected users"
- Khi tenant bị stop, phải khởi động lại → mất thời gian

**Đã sửa:**
- Thêm **presence tracking** để keep connection alive
- Presence giúp tenant không bị stop

**Code:**
```typescript
// Thêm presence config
presence: {
  key: currentUserId,
}

// Track presence khi subscribe
channel.track({
  userId: currentUserId,
  online: true,
  lastSeen: new Date().toISOString()
})
```

## Các Thay Đổi

### 1. useRealtimeChat.ts
- ✅ Giảm `MAX_RETRY_DELAY` từ 30s → 5s
- ✅ Thêm presence config để keep connection alive
- ✅ Track presence khi subscribe

### 2. ProjectTasksTab.tsx
- ✅ Giảm polling interval từ 5-15s → 1-5s
- ✅ Giảm backoff multiplier từ 3x → 2x

## Expected Results

### Trước:
- Retry delay: có thể lên đến 30s
- Polling interval: 5-15s
- Tenant bị stop → phải restart

### Sau:
- Retry delay: tối đa 5s
- Polling interval: 1-5s
- Presence keep connection alive → tenant không bị stop

## Test

1. **Test Realtime Connection:**
   - Gửi message
   - Kiểm tra console logs
   - Expected: Message đến <1s

2. **Test Retry:**
   - Disconnect network tạm thời
   - Reconnect
   - Expected: Retry nhanh (<5s)

3. **Test Polling Fallback:**
   - Disable realtime tạm thời
   - Expected: Polling interval 1-5s (không phải 15s)

## Monitoring

### Console Logs Cần Kiểm Tra:

**Khi Connect:**
```
✅ Realtime chat connected: <conversation_id>
🔐 Channel config: { presence: { key: ... } }
```

**Khi Retry:**
```
🔄 Retrying connection in Xms (attempt Y/5)
```
Expected: X < 5000ms

**Khi Polling:**
```
[Polling] 🔄 Started polling fallback (interval: Xs)
```
Expected: X < 5s

## Files Changed

- ✅ `frontend/src/hooks/useRealtimeChat.ts`
- ✅ `frontend/src/components/projects/ProjectTasksTab.tsx`

## Next Steps

1. Test lại với 2 users
2. Kiểm tra console logs
3. Verify message đến <1s (thay vì 30s)


