# 🧪 Hướng Dẫn Test Realtime Chat cho Task Comments

## ✅ Kiểm tra Setup

### 1. Kiểm tra Database
- ✅ Bảng `task_comments` đã có trong `supabase_realtime` publication
- ✅ Migration `ensure_realtime_task_comments` đã được apply

### 2. Kiểm tra Code Web
- ✅ `frontend/src/app/tasks/[taskId]/page.tsx` - Đã có Supabase Realtime subscription
- ✅ `frontend/src/components/projects/ProjectTasksTab.tsx` - Đã có subscription cho project tasks

## 🧪 Cách Test Realtime

### Test 1: Test trong Browser Console

1. **Mở trang Task Detail:**
   ```
   http://localhost:3000/tasks/{taskId}
   ```

2. **Mở Browser Console (F12)** và kiểm tra logs:
   ```javascript
   // Bạn sẽ thấy log này khi subscription thành công:
   "Subscribed to task comments realtime for task: {taskId}"
   ```

3. **Test INSERT (Tin nhắn mới):**
   - Gửi một tin nhắn mới trong task chat
   - Kiểm tra console log: `"Realtime comment update:"` với `event: "INSERT"`
   - Tin nhắn sẽ tự động xuất hiện mà không cần refresh

4. **Test UPDATE (Chỉnh sửa tin nhắn):**
   - Chỉnh sửa một tin nhắn
   - Kiểm tra console log: `"Realtime comment update:"` với `event: "UPDATE"`
   - Tin nhắn sẽ tự động cập nhật

5. **Test DELETE (Xóa tin nhắn):**
   - Xóa một tin nhắn
   - Kiểm tra console log: `"Realtime comment update:"` với `event: "DELETE"`
   - Tin nhắn sẽ tự động biến mất

### Test 2: Test Multi-User (2 Browser Windows)

1. **Mở 2 browser windows:**
   - Window 1: `http://localhost:3000/tasks/{taskId}` (User A)
   - Window 2: `http://localhost:3000/tasks/{taskId}` (User B - Incognito hoặc browser khác)

2. **Test realtime:**
   - User A gửi tin nhắn
   - User B sẽ thấy tin nhắn xuất hiện tự động (không cần refresh)
   - User B gửi tin nhắn
   - User A sẽ thấy tin nhắn xuất hiện tự động

### Test 3: Test với Android App

1. **Mở Web và Android cùng lúc:**
   - Web: `http://localhost:3000/tasks/{taskId}`
   - Android: Mở Task Detail và vào tab Chat

2. **Test realtime:**
   - Gửi tin nhắn từ Web → Android sẽ nhận được realtime
   - Gửi tin nhắn từ Android → Web sẽ nhận được realtime

## 🔍 Debugging

### Kiểm tra Subscription Status

Trong Browser Console, chạy:
```javascript
// Kiểm tra Supabase client
console.log('Supabase URL:', supabase.supabaseUrl)
console.log('Supabase Key:', supabase.supabaseKey?.substring(0, 20) + '...')

// Kiểm tra channels
// (Supabase client không expose channels trực tiếp, nhưng bạn có thể check logs)
```

### Kiểm tra Network Tab

1. Mở **Network Tab** trong DevTools
2. Filter: `WS` (WebSocket)
3. Tìm connection đến Supabase Realtime
4. Kiểm tra messages được gửi/nhận

### Common Issues

#### Issue 1: Subscription không kết nối
**Triệu chứng:** Không thấy log "Subscribed to task comments realtime"
**Giải pháp:**
- Kiểm tra Supabase URL và Key trong `.env.local`
- Kiểm tra bảng `task_comments` đã có trong publication chưa
- Kiểm tra network connection

#### Issue 2: Nhận được updates nhưng không reload
**Triệu chứng:** Thấy log "Realtime comment update" nhưng UI không update
**Giải pháp:**
- Kiểm tra function `loadComments()` có hoạt động không
- Kiểm tra React state có được update không

#### Issue 3: Nhận được updates từ task khác
**Triệu chứng:** Nhận được updates không liên quan
**Giải pháp:**
- Kiểm tra filter `task_id=eq.${taskId}` có đúng không
- Kiểm tra cleanup function có remove channel đúng không

## 📊 Expected Behavior

### Khi có tin nhắn mới (INSERT):
```javascript
// Console log:
{
  event: "INSERT",
  new: {
    id: "...",
    task_id: "...",
    comment: "...",
    user_id: "...",
    created_at: "..."
  },
  old: null
}
```

### Khi chỉnh sửa tin nhắn (UPDATE):
```javascript
// Console log:
{
  event: "UPDATE",
  new: {
    id: "...",
    comment: "Updated message..."
  },
  old: {
    id: "...",
    comment: "Original message..."
  }
}
```

### Khi xóa tin nhắn (DELETE):
```javascript
// Console log:
{
  event: "DELETE",
  new: null,
  old: {
    id: "...",
    task_id: "...",
    comment: "..."
  }
}
```

## ✅ Checklist Test

- [ ] Subscription thành công (thấy log "Subscribed")
- [ ] INSERT hoạt động (tin nhắn mới xuất hiện tự động)
- [ ] UPDATE hoạt động (tin nhắn chỉnh sửa cập nhật tự động)
- [ ] DELETE hoạt động (tin nhắn xóa biến mất tự động)
- [ ] Multi-user hoạt động (2 browser windows)
- [ ] Web ↔ Android hoạt động (nếu có)
- [ ] Cleanup hoạt động (unsubscribe khi rời trang)
- [ ] Filter đúng task_id (không nhận updates từ task khác)

## 🚀 Quick Test Script

Mở Browser Console và chạy:
```javascript
// Test realtime connection
const testRealtime = async () => {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('❌ Database connection error:', error)
    return
  }
  
  console.log('✅ Database connection OK')
  console.log('✅ Sample data:', data)
  
  // Check if subscription is active (check console logs)
  console.log('📡 Check console for "Subscribed to task comments realtime" message')
}

testRealtime()
```



