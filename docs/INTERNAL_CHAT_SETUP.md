# 💬 Hệ Thống Chat Nội Bộ - Hướng Dẫn Setup

## 📋 Tổng Quan

Hệ thống chat nội bộ cho nhân viên với giao diện giống Zalo, hỗ trợ:
- ✅ Chat 1-1 và nhóm
- ✅ Bong bóng chat đẹp mắt
- ✅ Real-time messaging với Supabase Realtime
- ✅ Reply tin nhắn
- ✅ Chỉnh sửa và xóa tin nhắn
- ✅ Đánh dấu đã đọc
- ✅ Tìm kiếm cuộc trò chuyện

## 🚀 Cài Đặt

### Bước 1: Chạy Database Migration

Chạy file migration để tạo các bảng cần thiết:

```sql
-- Chạy file này trong Supabase SQL Editor hoặc psql
database/migrations/create_internal_chat_tables.sql
```

**Hoặc chạy từ terminal:**

```bash
# Nếu dùng Supabase CLI
supabase db push

# Hoặc chạy trực tiếp SQL file
psql -h your-db-host -U your-user -d your-database -f database/migrations/create_internal_chat_tables.sql
```

### Bước 2: Verify Tables Đã Tạo

Kiểm tra các bảng đã được tạo:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'internal_%';
```

Kết quả mong đợi:
- `internal_conversations`
- `internal_conversation_participants`
- `internal_messages`

### Bước 3: Kiểm Tra RLS Policies

Đảm bảo Row Level Security (RLS) đã được bật:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'internal_%';
```

### Bước 4: Restart Backend

Restart backend để load router mới:

```bash
# Windows
restart_backend.bat

# Hoặc manual
cd backend
python -m uvicorn main:app --reload
```

### Bước 5: Enable Supabase Realtime (Optional)

Để có real-time messaging, cần enable Realtime cho bảng `internal_messages`:

1. Vào Supabase Dashboard
2. Database > Replication
3. Tìm bảng `internal_messages`
4. Bật toggle để enable replication

**Hoặc chạy SQL:**

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
```

## 📁 Cấu Trúc Files

```
backend/
├── models/
│   └── chat.py                    # Chat models (Conversation, Message, Participant)
├── routers/
│   └── chat.py                    # Chat API endpoints
└── main.py                        # Đã thêm chat router

frontend/
├── src/
│   ├── app/
│   │   └── chat/
│   │       └── page.tsx           # Chat page
│   ├── components/
│   │   └── chat/
│   │       └── InternalChat.tsx   # Chat UI component
│   └── types/
│       └── chat.ts                # TypeScript types

database/
└── migrations/
    └── create_internal_chat_tables.sql  # Database schema
```

## 🎯 Sử Dụng

### Truy Cập Chat

1. Đăng nhập vào hệ thống
2. Click vào "Chat nội bộ" trong navigation menu
3. Chọn hoặc tạo cuộc trò chuyện mới

### Tạo Cuộc Trò Chuyện Mới

**API Endpoint:**
```
POST /api/chat/conversations
```

**Request Body:**
```json
{
  "name": "Tên nhóm (optional, chỉ cho group)",
  "type": "direct" | "group",
  "participant_ids": ["user_id_1", "user_id_2"]
}
```

### Gửi Tin Nhắn

**API Endpoint:**
```
POST /api/chat/conversations/{conversation_id}/messages
```

**Request Body:**
```json
{
  "message_text": "Nội dung tin nhắn",
  "reply_to_id": "message_id (optional)"
}
```

## 🔧 API Endpoints

### Conversations

- `GET /api/chat/conversations` - Lấy danh sách cuộc trò chuyện
- `GET /api/chat/conversations/{id}` - Lấy chi tiết cuộc trò chuyện
- `POST /api/chat/conversations` - Tạo cuộc trò chuyện mới

### Messages

- `GET /api/chat/conversations/{id}/messages` - Lấy tin nhắn
- `POST /api/chat/conversations/{id}/messages` - Gửi tin nhắn
- `PUT /api/chat/messages/{id}` - Chỉnh sửa tin nhắn
- `DELETE /api/chat/messages/{id}` - Xóa tin nhắn (soft delete)

### Read Status

- `POST /api/chat/conversations/{id}/read` - Đánh dấu đã đọc

## 🎨 Tính Năng UI

### Bong Bóng Chat

- **Tin nhắn của bạn**: Màu xanh dương, căn phải
- **Tin nhắn người khác**: Màu trắng, căn trái
- **Tin nhắn đã xóa**: Màu xám, in nghiêng

### Actions

- **Reply**: Click icon Reply để trả lời tin nhắn
- **Edit**: Click icon Edit để chỉnh sửa tin nhắn của bạn
- **Delete**: Click icon Trash để xóa tin nhắn của bạn

### Real-time Updates

Khi có tin nhắn mới, hệ thống tự động:
- Cập nhật danh sách cuộc trò chuyện
- Hiển thị tin nhắn mới trong chat
- Cập nhật unread count

## 🐛 Troubleshooting

### Lỗi: "Could not find relationship"

**Nguyên nhân:** PostgREST schema cache chưa được refresh

**Giải pháp:**
1. Vào Supabase Dashboard > Settings > API
2. Click "Reload schema"
3. Đợi 10-30 giây
4. Restart backend

### Lỗi: "Permission denied"

**Nguyên nhân:** RLS policies chưa được setup đúng

**Giải pháp:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'internal_%';

-- Re-run migration nếu cần
```

### Real-time không hoạt động

**Nguyên nhân:** Realtime chưa được enable cho bảng

**Giải pháp:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages;
```

## 📝 Notes

- Chat hỗ trợ soft delete (tin nhắn bị xóa vẫn còn trong DB nhưng hiển thị "[Tin nhắn đã bị xóa]")
- Unread count được tính dựa trên `last_read_at` của participant
- Direct conversations tự động lấy tên từ participant khác
- Group conversations cần set tên khi tạo

## 🎉 Hoàn Thành!

Hệ thống chat nội bộ đã sẵn sàng sử dụng. Truy cập `/chat` để bắt đầu chat!

