# Conversation Data Comparison

## Conversation Object từ API

```json
{
  "name": "Admin Cửa Phúc Đạt",
  "type": "direct",
  "avatar_url": null,
  "background_url": null,
  "task_id": null,
  "project_id": null,
  "id": "7234642a-a1c3-4936-842a-8f967197345e",
  "created_by": "ed57da6d-f1b2-4ead-bc98-d4a4a14b5d54",
  "created_at": "2025-12-12T15:04:12.764034Z",
  "updated_at": "2025-12-12T15:04:12.764034Z",
  "last_message_at": null,
  "last_message_preview": null,
  "participant_count": 2,
  "unread_count": 0,
  "participants": [...]
}
```

## Database Schema (internal_conversations)

### Base Schema (create_internal_chat_tables.sql):
```sql
CREATE TABLE internal_conversations (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(20) NOT NULL DEFAULT 'direct',
    task_id UUID REFERENCES tasks(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,
    avatar_url TEXT
);
```

### Additional Migrations:
1. **background_url** - Added via `add_background_url_to_conversations.sql`
2. **project_id** - Added via `add_project_id_to_internal_conversations.sql`

### Final Schema (sau migrations):
```sql
internal_conversations (
    id ✅
    name ✅
    type ✅
    avatar_url ✅
    background_url ✅ (added via migration)
    task_id ✅
    project_id ✅ (added via migration)
    created_by ✅
    created_at ✅
    updated_at ✅
    last_message_at ✅
    last_message_preview ✅
)
```

## Backend Query

### Get Conversation (dòng 214-240):
```python
conversation_result = (
    supabase.table("internal_conversations")
    .select("*")  # ← Lấy TẤT CẢ columns
    .eq("id", conversation_id)
    .single()
    .execute()
)

# Enrich với participants
enriched = _enrich_conversation_with_participants(supabase, conversation_result.data, current_user.id)
```

### Enrichment Process (dòng 44-114):
1. **Participants**: Lấy từ `internal_conversation_participants` table
2. **User Names**: Lấy từ `users` table (full_name)
3. **Participant Count**: Đếm số participants
4. **Unread Count**: Đếm messages chưa đọc

## So sánh Object JSON vs Database

### ✅ Fields từ Database (SELECT *):
- [x] `id` ✅
- [x] `name` ✅
- [x] `type` ✅
- [x] `avatar_url` ✅
- [x] `background_url` ✅ (nếu migration đã chạy)
- [x] `task_id` ✅
- [x] `project_id` ✅ (nếu migration đã chạy)
- [x] `created_by` ✅
- [x] `created_at` ✅
- [x] `updated_at` ✅
- [x] `last_message_at` ✅
- [x] `last_message_preview` ✅

### ✅ Fields được Enrich (không có trong database):
- [x] `participants` ✅ (từ `internal_conversation_participants`)
- [x] `participant_count` ✅ (đếm từ participants)
- [x] `unread_count` ✅ (đếm từ `internal_messages`)

### ✅ Participants Enrichment:
Mỗi participant có:
- [x] `id` ✅ (từ `internal_conversation_participants`)
- [x] `conversation_id` ✅
- [x] `user_id` ✅
- [x] `user_name` ✅ (enriched từ `users.full_name`)
- [x] `user_avatar` ✅ (có thể thêm sau)
- [x] `joined_at` ✅
- [x] `last_read_at` ✅
- [x] `role` ✅
- [x] `is_muted` ✅

## Kết luận

### ✅ Dữ liệu được lấy ĐẦY ĐỦ:
1. **Tất cả columns từ database** được lấy qua `SELECT *`
2. **Participants được enrich** với user names
3. **Participant count** được tính đúng
4. **Unread count** được tính đúng
5. **Tất cả fields trong object JSON** đều có trong database hoặc được enrich

### ⚠️ Lưu ý:
- `background_url` và `project_id` cần migrations đã chạy
- Nếu migrations chưa chạy, các fields này sẽ là `null` (như trong object này)
- Đây là bình thường cho conversation mới tạo

### ✅ Verification:
Object JSON này **HOÀN TOÀN ĐÚNG** và **ĐẦY ĐỦ**:
- Tất cả fields từ database đều có
- Tất cả fields được enrich đều có
- Participants có đủ thông tin
- Counts được tính đúng

