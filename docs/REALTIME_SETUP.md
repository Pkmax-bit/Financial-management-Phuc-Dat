# 🔴 Real-time Messaging Setup Guide

## 📋 Tổng Quan

Hệ thống chat sử dụng **Supabase Realtime** để nhận tin nhắn real-time. Khi một người gửi tin nhắn, người nhận sẽ nhận được ngay lập tức mà không cần refresh trang.

## ✅ Kiểm Tra Real-time Đã Hoạt Động

### Bước 1: Kiểm Tra Supabase Realtime Đã Enable

1. Đăng nhập vào **Supabase Dashboard**
2. Vào **Database** > **Replication**
3. Tìm bảng `internal_messages`
4. Đảm bảo toggle đã được **BẬT** (ON)

### Bước 2: Enable Realtime Nếu Chưa Có

Nếu bảng `internal_messages` chưa được enable, chạy SQL sau trong **Supabase SQL Editor**:

```sql
-- Enable Realtime cho bảng internal_messages
ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
```

### Bước 3: Verify Realtime Đã Hoạt Động

Chạy SQL để kiểm tra:

```sql
-- Kiểm tra bảng đã được thêm vào publication chưa
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'internal_messages';
```

Kết quả mong đợi: Phải có 1 dòng với `tablename = 'internal_messages'`

## 🔧 Cách Hoạt Động

### 1. Real-time Subscriptions

Hệ thống sử dụng 3 loại subscriptions:

#### a) **INSERT** - Tin nhắn mới
```typescript
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'internal_messages',
  filter: `conversation_id=eq.${conversationId}`
}, (payload) => {
  // Tin nhắn mới được thêm vào danh sách ngay lập tức
})
```

#### b) **UPDATE** - Chỉnh sửa tin nhắn
```typescript
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'internal_messages',
  filter: `conversation_id=eq.${conversationId}`
}, (payload) => {
  // Tin nhắn được cập nhật trong danh sách
})
```

#### c) **DELETE** - Xóa tin nhắn
```typescript
.on('postgres_changes', {
  event: 'DELETE',
  schema: 'public',
  table: 'internal_messages',
  filter: `conversation_id=eq.${conversationId}`
}, (payload) => {
  // Tin nhắn bị xóa khỏi danh sách
})
```

### 2. Components Sử Dụng Real-time

#### **InternalChat.tsx**
- Subscription cho conversation đang mở
- Tự động cập nhật khi có tin nhắn mới/sửa/xóa

#### **ChatWidget.tsx**
- Subscription cho conversation trong widget
- Cập nhật real-time cho widget chat

#### **useNewMessages.ts**
- Subscription global cho tất cả tin nhắn
- Cập nhật unread count và hiển thị notification

## 🧪 Test Real-time

### Test 1: Gửi Tin Nhắn

1. Mở 2 trình duyệt (hoặc 2 tab) với 2 tài khoản khác nhau
2. Cả 2 cùng vào cùng 1 conversation
3. Người A gửi tin nhắn
4. **Kết quả mong đợi**: Người B nhận được tin nhắn ngay lập tức (không cần refresh)

### Test 2: Chỉnh Sửa Tin Nhắn

1. Người A gửi tin nhắn "Hello"
2. Người A chỉnh sửa thành "Hello World"
3. **Kết quả mong đợi**: Người B thấy tin nhắn được cập nhật ngay lập tức

### Test 3: Xóa Tin Nhắn

1. Người A xóa tin nhắn
2. **Kết quả mong đợi**: Người B thấy tin nhắn biến mất ngay lập tức

## 🐛 Troubleshooting

### Vấn đề: Tin nhắn không hiển thị real-time

**Nguyên nhân có thể:**
1. Supabase Realtime chưa được enable
2. RLS policies chặn subscription
3. Network/Firewall chặn WebSocket connection

**Giải pháp:**

#### 1. Kiểm Tra Realtime Đã Enable
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'internal_messages';
```

Nếu không có kết quả, chạy:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
```

#### 2. Kiểm Tra RLS Policies

Đảm bảo RLS policies cho phép SELECT:
```sql
-- Kiểm tra policies
SELECT * FROM pg_policies 
WHERE tablename = 'internal_messages';
```

#### 3. Kiểm Tra Console Logs

Mở **Browser Console** (F12) và tìm:
- ✅ `Real-time subscription active for conversation: ...` - Đã kết nối thành công
- ❌ `Real-time subscription error` - Có lỗi kết nối

#### 4. Kiểm Tra Network

Trong **Browser DevTools** > **Network**:
- Tìm tab **WS** (WebSocket)
- Phải có connection đến Supabase Realtime
- Status phải là **101 Switching Protocols**

### Vấn đề: Subscription không hoạt động

**Giải pháp:**

1. **Restart Supabase Realtime Service** (nếu có quyền)
2. **Kiểm tra Supabase Project Status** - Đảm bảo project không bị pause
3. **Kiểm tra Quota** - Đảm bảo không vượt quá giới hạn Realtime connections

### Vấn đề: Tin nhắn bị duplicate

**Nguyên nhân:** Optimistic update + Real-time update tạo duplicate

**Giải pháp:** Code đã xử lý bằng cách kiểm tra `!messages.find(m => m.id === newMessage.id)` trước khi thêm

## 📊 Monitoring

### Kiểm Tra Realtime Connections

Trong Supabase Dashboard:
1. Vào **Database** > **Replication**
2. Xem số lượng active connections
3. Kiểm tra logs nếu có lỗi

### Browser Console Logs

Khi subscription hoạt động, bạn sẽ thấy:
```
✅ Real-time subscription active for conversation: [conversation-id]
```

Khi có lỗi:
```
❌ Real-time subscription error for conversation: [conversation-id]
```

## 🎯 Best Practices

1. **Luôn cleanup subscriptions** khi component unmount
2. **Kiểm tra subscription status** trước khi sử dụng
3. **Handle errors gracefully** - fallback về polling nếu real-time fail
4. **Optimize subscriptions** - chỉ subscribe conversation đang mở

## 📝 Notes

- Real-time chỉ hoạt động khi Supabase Realtime được enable
- Cần RLS policies đúng để subscription hoạt động
- WebSocket connection cần network ổn định
- Free tier Supabase có giới hạn số connections

## ✅ Checklist

- [ ] Supabase Realtime đã enable cho `internal_messages`
- [ ] RLS policies đã được setup đúng
- [ ] Test gửi tin nhắn real-time giữa 2 người
- [ ] Test chỉnh sửa tin nhắn real-time
- [ ] Test xóa tin nhắn real-time
- [ ] Console logs hiển thị "✅ Real-time subscription active"
- [ ] WebSocket connection thành công trong Network tab

## 🎉 Hoàn Thành!

Nếu tất cả checklist đều ✅, hệ thống real-time messaging đã sẵn sàng!

