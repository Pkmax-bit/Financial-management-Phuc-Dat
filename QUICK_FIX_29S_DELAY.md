# Quick Fix: 29 Second Delay

## Vấn Đề

Tin nhắn mất **29 giây** mới đến người nhận.

## Nguyên Nhân Chính

**Supabase Realtime Tenant Shutdown** - Đây là nguyên nhân chính:
- Supabase shutdown Realtime tenant sau **30 giây** không có activity
- Khi có message mới, tenant phải khởi động lại → mất ~29-30 giây
- Presence tracking hiện tại chỉ track 1 lần khi connect, không update định kỳ

## Giải Pháp Đã Áp Dụng

### 1. Periodic Presence Update

**File:** `frontend/src/hooks/useRealtimeChat.ts`

Thêm periodic presence update mỗi **25 giây** để keep connection alive:

```typescript
// Update presence every 25 seconds (before 30s timeout)
presenceUpdateIntervalRef.current = setInterval(() => {
  if (channelRef.current && !isUnmountingRef.current) {
    channelRef.current.track({
      userId: currentUserId,
      online: true,
      lastSeen: new Date().toISOString()
    })
    console.log('🔄 Presence updated to keep connection alive')
  }
}, 25000) // 25 seconds
```

**Lý do:**
- Supabase shutdown tenant sau 30s không có activity
- Update presence mỗi 25s → tenant không bao giờ shutdown
- Connection luôn active → message delivery < 1 giây

### 2. Cleanup Interval

Đảm bảo cleanup interval khi component unmount:

```typescript
if (presenceUpdateIntervalRef.current) {
  clearInterval(presenceUpdateIntervalRef.current)
  presenceUpdateIntervalRef.current = null
}
```

## Testing

### Test 1: Verify Presence Update
1. Mở browser console
2. Xem logs: `🔄 Presence updated to keep connection alive`
3. Logs phải xuất hiện mỗi 25 giây

### Test 2: Message Delivery
1. User A gửi message
2. User B nhận được trong < 1 giây (thay vì 29 giây)

### Test 3: Long Idle
1. Để chat idle 1-2 phút
2. User A gửi message
3. User B vẫn nhận được trong < 1 giây (không còn 29s delay)

## Expected Results

- ✅ **Connection:** Luôn active (không bị shutdown)
- ✅ **Message delivery:** < 1 giây (thay vì 29 giây)
- ✅ **Presence update:** Mỗi 25 giây (console logs)

## Files Changed

- `frontend/src/hooks/useRealtimeChat.ts` - Thêm periodic presence update

## Next Steps

Nếu vẫn còn delay:
1. Kiểm tra Supabase Dashboard → Realtime logs
2. Chạy diagnostic script: `database/migrations/diagnose_realtime_delay.sql`
3. Kiểm tra network connection
4. Kiểm tra RLS policies performance


