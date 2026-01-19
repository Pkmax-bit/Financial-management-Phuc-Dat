# Ràng Buộc Thời Gian - Chat Messages

## Tổng Quan

**Lưu ý quan trọng:** Hệ thống chat **KHÔNG sử dụng webhook** để gửi/nhận tin nhắn. Chat sử dụng:
- **Supabase Realtime Broadcast** (chính)
- **Polling fallback** (khi realtime không hoạt động)
- **API response** (backup)

## Các Ràng Buộc Thời Gian

### 1. Realtime Connection Retry

**File:** `frontend/src/hooks/useRealtimeChat.ts`

```typescript
const MAX_RETRY_ATTEMPTS = 5
const RETRY_DELAY_BASE = 1000 // 1 second
const MAX_RETRY_DELAY = 3000 // 3 seconds (tối đa)
```

**Cách hoạt động:**
- Khi connection fail, retry với exponential backoff
- Delay: `RETRY_DELAY_BASE * 2^(attempt-1)`, tối đa `MAX_RETRY_DELAY`
- Ví dụ: 1s → 2s → 3s → 3s → 3s (max 5 attempts)

**Ràng buộc:**
- Tối đa 5 lần retry
- Delay tối đa: **3 giây** giữa các lần retry

### 2. Polling Fallback Interval

**File:** `frontend/src/components/projects/ProjectTasksTab.tsx`

```typescript
const baseInterval = 1000 // 1 second
const maxInterval = 3000 // 3 seconds (tối đa)
const backoffMultiplier = Math.min(1 + (pollingAttemptsRef.current * 0.2), 1.5)
const pollingInterval = Math.min(baseInterval * backoffMultiplier, maxInterval)
```

**Cách hoạt động:**
- Polling chỉ chạy khi realtime không hoạt động
- Interval bắt đầu từ 1s, tăng dần đến tối đa 3s
- Ví dụ: 1s → 1.2s → 1.4s → ... → 3s (max)

**Ràng buộc:**
- Interval tối thiểu: **1 giây**
- Interval tối đa: **3 giây**

### 3. Fallback Timeout (Sau Khi Gửi)

**File:** `frontend/src/components/projects/ProjectTasksTab.tsx`

```typescript
const fallbackTimeout = setTimeout(() => {
  // Fetch comments after delay if realtime doesn't work
}, 3000) // Fallback after 3 seconds
```

**Cách hoạt động:**
- Sau khi gửi message, đợi 3 giây
- Nếu realtime không deliver message, fetch từ server
- Đảm bảo message không bị mất

**Ràng buộc:**
- Timeout: **3 giây** sau khi gửi

### 4. Realtime Connection Timeout

**Supabase Realtime:**
- Connection timeout: Mặc định từ Supabase
- Heartbeat interval: Tự động (Supabase quản lý)
- Presence timeout: Khi không có users, tenant có thể bị stop

**Ràng buộc:**
- Không có timeout cố định từ code
- Phụ thuộc vào Supabase Realtime server

### 5. API Response Timeout

**File:** `frontend/src/lib/api/client.ts`

```typescript
timeout: 60000, // 60 seconds timeout
```

**Ràng buộc:**
- API request timeout: **60 giây**
- Nếu quá 60s không có response → timeout error

## Timeline Từ Khi Gửi Đến Khi Nhận

### Scenario 1: Realtime Hoạt Động Tốt (Ideal)

```
T=0ms:    User A gửi message
T=50ms:   API response (message được tạo trong DB)
T=100ms:  Database trigger fire
T=150ms:  Broadcast được gửi
T=200ms:  User B nhận được broadcast
T=250ms:  Message hiển thị trên UI
```
**Tổng thời gian: ~250ms**

### Scenario 2: Realtime Chậm (Có Delay)

```
T=0ms:    User A gửi message
T=50ms:   API response
T=100ms:  Database trigger fire
T=500ms:  Broadcast được gửi (delay)
T=600ms:  User B nhận được broadcast
T=650ms:  Message hiển thị
```
**Tổng thời gian: ~650ms**

### Scenario 3: Realtime Không Hoạt Động (Polling Fallback)

```
T=0ms:    User A gửi message
T=50ms:   API response
T=1000ms: Polling check lần 1 (không thấy message mới)
T=2000ms: Polling check lần 2 (không thấy message mới)
T=3000ms: Polling check lần 3 → Tìm thấy message mới
T=3050ms: Message hiển thị
```
**Tổng thời gian: ~3 giây** (tối đa)

### Scenario 4: Realtime Fail + Retry

```
T=0ms:    User A gửi message
T=50ms:   API response
T=100ms:  Realtime connection fail
T=1100ms: Retry lần 1 (delay 1s)
T=2100ms: Retry lần 2 (delay 1s)
T=3100ms: Retry lần 3 (delay 1s) → Success
T=3200ms: Message hiển thị
```
**Tổng thời gian: ~3.2 giây** (trường hợp xấu nhất)

## Các Ràng Buộc Tổng Hợp

| Component | Timeout/Delay | Mô Tả |
|-----------|---------------|-------|
| **Realtime Retry** | 1-3s | Delay giữa các lần retry |
| **Polling Interval** | 1-3s | Khoảng thời gian giữa các lần poll |
| **Fallback Timeout** | 3s | Đợi trước khi fetch từ server |
| **API Timeout** | 60s | Timeout cho API requests |
| **Realtime Broadcast** | <1s (ideal) | Thời gian broadcast (phụ thuộc Supabase) |

## Expected Delivery Time

### Tốt (Realtime hoạt động):
- **<1 giây** (thường 200-500ms)

### Chấp nhận được:
- **1-3 giây** (realtime có delay hoặc polling)

### Có vấn đề:
- **>3 giây** (cần kiểm tra realtime connection)

## Không Có Webhook

**Quan trọng:** Hệ thống chat **KHÔNG sử dụng webhook** để gửi/nhận tin nhắn.

**Webhook chỉ có cho:**
- Email notifications (n8n webhook)
- Không liên quan đến chat messages

**Chat sử dụng:**
- Supabase Realtime Broadcast (real-time)
- Polling fallback (khi realtime fail)
- API response (backup)

## Tối Ưu Đã Thực Hiện

1. ✅ Giảm `MAX_RETRY_DELAY` từ 30s → 3s
2. ✅ Giảm polling interval từ 5-15s → 1-3s
3. ✅ Thêm presence tracking để keep connection alive
4. ✅ Fallback timeout: 3s (đảm bảo message không bị mất)

## Files Liên Quan

- `frontend/src/hooks/useRealtimeChat.ts` - Realtime connection & retry
- `frontend/src/components/projects/ProjectTasksTab.tsx` - Polling fallback
- `frontend/src/lib/api/client.ts` - API timeout
- `database/migrations/optimize_broadcast_performance.sql` - Database trigger


