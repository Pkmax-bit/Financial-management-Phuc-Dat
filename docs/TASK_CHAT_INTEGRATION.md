# 🔗 Tích Hợp Chat Nội Bộ Với Tasks

## 📋 Tổng Quan

Hệ thống chat nội bộ đã được tích hợp với task management, cho phép:
- ✅ Tự động tạo conversation cho mỗi task
- ✅ Mở chat từ task detail page
- ✅ Liên kết conversation với task
- ✅ Tự động thêm task participants vào conversation

## 🚀 Setup

### Bước 1: Chạy Migration

Nếu đã chạy migration `create_internal_chat_tables.sql` trước đó, cần chạy thêm:

```sql
-- Chạy file này trong Supabase SQL Editor
database/migrations/add_task_id_to_internal_conversations.sql
```

**Hoặc nếu chưa chạy migration đầu tiên:**
- File `create_internal_chat_tables.sql` đã được cập nhật với trường `task_id`
- Chỉ cần chạy migration đó là đủ

### Bước 2: Verify

Kiểm tra cột `task_id` đã được thêm:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'internal_conversations' 
AND column_name = 'task_id';
```

## 🎯 Sử Dụng

### Từ Task Detail Page

1. Vào trang chi tiết nhiệm vụ (`/tasks/[taskId]`)
2. Click tab "Trao đổi"
3. Click button **"Mở Chat"** ở góc phải
4. Hệ thống sẽ:
   - Tự động tạo conversation nếu chưa có
   - Thêm tất cả task participants vào conversation
   - Mở chat page với conversation đó

### API Endpoint

**Get or Create Conversation for Task:**
```
GET /api/chat/tasks/{task_id}/conversation
```

**Response:**
```json
{
  "id": "conversation-uuid",
  "name": "Chat: Task Title",
  "type": "group",
  "task_id": "task-uuid",
  "participants": [...],
  ...
}
```

## 🔧 Cách Hoạt Động

### Tự Động Tạo Conversation

Khi gọi API `GET /api/chat/tasks/{task_id}/conversation`:

1. **Kiểm tra conversation đã tồn tại:**
   - Tìm conversation có `task_id = task_id`
   - Nếu có → trả về conversation đó

2. **Tạo mới nếu chưa có:**
   - Lấy tất cả task participants (từ `task_participants`)
   - Convert `employee_id` → `user_id` (từ bảng `employees`)
   - Thêm task creator vào participants
   - Tạo conversation với type = "group"
   - Tên conversation = "Chat: {task_title}"
   - Thêm tất cả participants vào conversation

### Participants

Conversation sẽ tự động bao gồm:
- ✅ Task participants (từ `task_participants`)
- ✅ Task creator (từ `tasks.created_by`)
- ✅ Current user (người đang mở chat)

## 📝 Notes

- **Mỗi task chỉ có 1 conversation:** Nếu đã có conversation cho task, sẽ trả về conversation đó
- **Participants tự động sync:** Khi có participant mới trong task, cần thêm vào conversation thủ công (hoặc có thể tự động hóa sau)
- **Task comments vs Internal chat:** 
  - Task comments: Hiển thị trong task detail page
  - Internal chat: Chat nội bộ riêng, có thể mở từ task hoặc từ menu Chat

## 🎨 UI Integration

### Task Detail Page

Button "Mở Chat" xuất hiện trong:
- Tab "Trao đổi" (Chat tab)
- Header của phần comments
- Màu xanh, icon ExternalLink

### Chat Page

Khi mở từ task:
- URL: `/chat?conversation={conversation_id}`
- Chat component tự động load conversation đó
- Hiển thị tên conversation = "Chat: {task_title}"

## 🔄 Future Enhancements

Có thể mở rộng thêm:
- [ ] Tự động sync participants khi task participants thay đổi
- [ ] Hiển thị task link trong conversation
- [ ] Notification khi có tin nhắn mới trong task conversation
- [ ] Quick action: Gửi task link trong chat
- [ ] Hiển thị task conversation trong task detail sidebar

## 🐛 Troubleshooting

### Lỗi: "No participants found"

**Nguyên nhân:** Task chưa có participants hoặc employees chưa có user_id

**Giải pháp:**
- Thêm participants vào task trước
- Đảm bảo employees có `user_id` liên kết với `users`

### Conversation không tự động tạo

**Kiểm tra:**
1. API endpoint có được gọi không?
2. Task có participants không?
3. Employees có user_id không?

### Không mở được conversation từ URL

**Kiểm tra:**
- URL có đúng format: `/chat?conversation={id}`?
- Conversation ID có tồn tại?
- User có quyền truy cập conversation?

## ✅ Hoàn Thành!

Tích hợp chat nội bộ với tasks đã sẵn sàng. Bạn có thể:
- Mở chat từ task detail page
- Chat với tất cả task participants
- Quản lý conversation riêng cho mỗi task

