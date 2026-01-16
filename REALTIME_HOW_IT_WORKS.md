# Cách Supabase Realtime Hoạt Động

## 🔄 Luồng Hoạt Động

### 1. Khi User A gửi tin nhắn:

```
User A (Browser/App)
    ↓
1. Gọi API POST /api/tasks/{taskId}/comments
    ↓
2. Backend insert vào database: INSERT INTO task_comments (...)
    ↓
3. PostgreSQL trigger event (tự động)
    ↓
4. Supabase Realtime Service nhận được change event
    ↓
5. Realtime Service broadcast event qua WebSocket
    ↓
6. Tất cả clients đang subscribe nhận được event
    ↓
7. User B (và User A) nhận được event ngay lập tức
```

## 📡 Cơ Chế Realtime

### A. Database Level (PostgreSQL)

1. **Publication**: Bảng `task_comments` phải có trong `supabase_realtime` publication
   ```sql
   -- Kiểm tra
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND tablename = 'task_comments';
   ```

2. **Automatic Trigger**: Khi có INSERT/UPDATE/DELETE, PostgreSQL tự động:
   - Ghi log vào WAL (Write-Ahead Log)
   - Supabase Realtime Service đọc WAL
   - Broadcast event qua WebSocket

3. **RLS Policies**: Phải cho phép SELECT để realtime hoạt động
   ```sql
   -- Policy hiện tại: "Authenticated users can read task comments"
   -- USING: true (cho phép tất cả authenticated users)
   ```

### B. Frontend Level (Web/Android)

1. **Subscribe to Channel**:
   ```typescript
   const channel = supabase
     .channel(`task-comments-${taskId}`)
     .on('postgres_changes', {
       event: '*', // INSERT, UPDATE, DELETE
       schema: 'public',
       table: 'task_comments',
       filter: `task_id=eq.${taskId}`
     }, (payload) => {
       // Xử lý event
     })
     .subscribe()
   ```

2. **Nhận Events**:
   - `INSERT`: Tin nhắn mới được tạo
   - `UPDATE`: Tin nhắn được chỉnh sửa
   - `DELETE`: Tin nhắn bị xóa

3. **Payload Structure**:
   ```typescript
   {
     eventType: 'INSERT' | 'UPDATE' | 'DELETE',
     new: { ...commentData }, // Dữ liệu mới (INSERT/UPDATE)
     old: { ...commentData }, // Dữ liệu cũ (UPDATE/DELETE)
     table: 'task_comments',
     schema: 'public'
   }
   ```

## 🔍 Kiểm Tra Setup

### 1. Database Setup ✅
```sql
-- Đã có trong publication
SELECT * FROM pg_publication_tables 
WHERE tablename = 'task_comments';
-- Kết quả: ✅ Có 1 row
```

### 2. RLS Policies ✅
```sql
-- Policy cho SELECT
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'task_comments' AND cmd = 'SELECT';
-- Kết quả: ✅ "Authenticated users can read task comments" với USING: true
```

### 3. Frontend Subscription ✅
- Code đã subscribe đúng cách
- Filter theo `task_id` để chỉ nhận events của task cụ thể
- Xử lý INSERT events ngay lập tức

## 🐛 Debugging

### Nếu User B không nhận được tin nhắn:

1. **Kiểm tra Subscription Status**:
   ```javascript
   channel.subscribe((status) => {
     console.log('Status:', status)
     // Phải là 'SUBSCRIBED'
   })
   ```

2. **Kiểm tra Console Logs**:
   - Có thấy log "📨 Realtime comment update" không?
   - Có thấy log "📥 New comment from other user" không?

3. **Kiểm tra WebSocket Connection**:
   - Mở DevTools → Network → WS
   - Xem có WebSocket connection không
   - Xem có messages được gửi/nhận không

4. **Kiểm tra RLS**:
   - User B có quyền SELECT trên task_comments không?
   - Policy có block realtime events không?

5. **Kiểm tra Filter**:
   - `task_id` trong event có match với `taskId` đang subscribe không?

## 🚀 Tối Ưu

### 1. Debounce cho UPDATE/DELETE
- INSERT: Xử lý ngay lập tức (không debounce)
- UPDATE/DELETE: Debounce 200-300ms để tránh spam

### 2. Optimistic Updates
- Hiển thị tin nhắn ngay khi User A gửi
- Thay thế bằng real message khi nhận được từ realtime

### 3. Error Handling
- Retry subscription nếu bị disconnect
- Fallback to polling nếu realtime fail

## 📝 Code Flow

### User A gửi tin nhắn:
```typescript
1. handleSendMessage()
   ↓
2. Tạo optimistic message (hiển thị ngay)
   ↓
3. Gọi API POST /api/tasks/{taskId}/comments
   ↓
4. Backend INSERT vào database
   ↓
5. Database trigger → Realtime Service → WebSocket
   ↓
6. User A nhận event → Replace optimistic với real message
   ↓
7. User B nhận event → Thêm tin nhắn mới vào UI
```

### User B nhận tin nhắn:
```typescript
1. Realtime event đến (INSERT)
   ↓
2. Kiểm tra: isFromCurrentUser? 
   - NO → Thêm vào UI ngay lập tức
   - YES → Replace optimistic message
   ↓
3. Update state → UI re-render → Hiển thị tin nhắn
```

## ⚠️ Lưu Ý

1. **RLS Policies**: Phải cho phép SELECT để realtime hoạt động
2. **Publication**: Bảng phải có trong `supabase_realtime` publication
3. **WebSocket**: Cần connection ổn định
4. **Filter**: Phải filter đúng `task_id` để tránh nhận events không liên quan
5. **User Authentication**: Phải authenticated để subscribe

## 🔧 Troubleshooting

### Vấn đề: User B không nhận được tin nhắn

**Nguyên nhân có thể:**
1. Subscription chưa SUBSCRIBED
2. RLS policy block
3. WebSocket connection bị disconnect
4. Filter không match
5. Event không được trigger

**Giải pháp:**
1. Kiểm tra console logs
2. Kiểm tra subscription status
3. Kiểm tra RLS policies
4. Kiểm tra WebSocket connection
5. Test với Supabase Dashboard → Realtime Inspector

