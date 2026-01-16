# 🚀 Hướng Dẫn Migration Chat sang Broadcast

## 📋 Tổng Quan

Migration này chuyển chat realtime từ **Postgres Changes** (cách cũ) sang **Broadcast** (cách được Supabase khuyến nghị) để:
- ✅ Cải thiện performance (latency < 50ms)
- ✅ Hỗ trợ typing indicators và presence
- ✅ Tuân theo best practices của Supabase

## 🔧 Bước 1: Chạy Migration SQL

```bash
# Chạy migration trong Supabase SQL Editor hoặc psql
psql -h <your-db-host> -U <your-user> -d <your-database> -f database/migrations/migrate_chat_to_broadcast.sql
```

**Hoặc chạy trực tiếp trong Supabase Dashboard:**
1. Vào **Supabase Dashboard** → **SQL Editor**
2. Copy nội dung file `migrate_chat_to_broadcast.sql`
3. Chạy SQL

## ✅ Bước 2: Verify Migration

Kiểm tra xem trigger và policies đã được tạo:

```sql
-- Kiểm tra trigger
SELECT * FROM pg_trigger WHERE tgname = 'messages_broadcast_trigger';

-- Kiểm tra function
SELECT * FROM pg_proc WHERE proname = 'broadcast_message_changes';

-- Kiểm tra RLS policies
SELECT * FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'realtime';
```

## 📝 Bước 3: Frontend Code Đã Được Cập Nhật

Các file sau đã được cập nhật để sử dụng Broadcast:
- ✅ `frontend/src/components/chat/InternalChat.tsx`
- ✅ `frontend/src/components/chat/ChatWidget.tsx`

**Không cần thêm config** - code đã sẵn sàng!

## 🧪 Bước 4: Test

### Test Realtime Messaging:

1. **Mở 2 browser windows/tabs**
2. **Window 1:** Mở Internal Chat, chọn một conversation
3. **Window 2:** Mở cùng conversation
4. **Gửi tin nhắn từ Window 1**
5. ✅ **Window 2 sẽ tự động nhận tin nhắn mới** (không cần refresh)

### Test với Chat Widget:

1. Mở chat widget trên 2 tabs khác nhau
2. Gửi tin nhắn từ tab 1
3. ✅ Tab 2 sẽ tự động nhận tin nhắn

## 🔍 Troubleshooting

### Vấn đề: Không nhận được broadcast messages

**Kiểm tra 1: Trigger đã được tạo chưa?**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'messages_broadcast_trigger';
```

**Kiểm tra 2: RLS Policies**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'messages' 
AND schemaname = 'realtime';
```

**Kiểm tra 3: Console Logs**
- Mở DevTools → Console
- Tìm log: `✅ Broadcast subscription active for conversation:`
- Nếu thấy `❌ Broadcast subscription error`, kiểm tra RLS policies

### Vấn đề: Lỗi "permission denied"

Đảm bảo user đã đăng nhập và có quyền truy cập conversation:
```sql
-- Kiểm tra user có trong conversation participants không
SELECT * FROM internal_conversation_participants 
WHERE conversation_id = '<conversation-id>' 
AND user_id = auth.uid();
```

## 📊 So Sánh: Trước vs Sau

| Tiêu chí | Postgres Changes | Broadcast |
|----------|------------------|-----------|
| **Latency** | 100-500ms | < 50ms |
| **Typing Indicators** | ❌ | ✅ (có thể thêm) |
| **Presence** | ❌ | ✅ (có thể thêm) |
| **Message Ack** | ❌ | ✅ (có thể thêm) |
| **Khuyến nghị** | ⚠️ Không | ✅ Có |

## 🎯 Next Steps (Optional)

Sau khi migration thành công, có thể thêm:
1. **Typing Indicators** - Hiển thị "đang gõ..."
2. **Presence** - Hiển thị online/offline status
3. **Message Acknowledgment** - Xác nhận đã gửi/nhận
4. **Broadcast Replay** - Load lại tin nhắn khi reconnect

Xem file `CHAT_REALTIME_IMPROVEMENTS.md` để biết chi tiết.

## ✅ Checklist

- [x] Migration SQL đã được tạo
- [x] Frontend code đã được cập nhật
- [ ] Migration SQL đã được chạy
- [ ] Test realtime messaging thành công
- [ ] Verify không có lỗi trong console

---

**Lưu ý:** Migration này **không phá vỡ** code cũ. Nếu có vấn đề, có thể rollback bằng cách:
1. Xóa trigger: `DROP TRIGGER messages_broadcast_trigger ON internal_messages;`
2. Revert frontend code về Postgres Changes

