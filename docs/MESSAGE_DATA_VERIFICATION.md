# Message Data Verification Guide

## Database Schema (internal_messages)

```sql
CREATE TABLE internal_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    reply_to_id UUID,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Backend API Response (get_messages)

### Query từ Database:
```python
messages_result = (
    supabase.table("internal_messages")
    .select("*")  # ← Lấy TẤT CẢ columns từ database
    .eq("conversation_id", conversation_id)
    .eq("is_deleted", False)
    .order("created_at", desc=False)
    .range(skip, skip + limit - 1)
    .execute()
)
```

### Enrichment Process:
1. **Sender Name**: Lấy từ `users` table dựa trên `sender_id`
2. **Reply To**: Lấy từ `internal_messages` table dựa trên `reply_to_id`
3. **Total Count**: Đếm tổng số messages (không bị deleted)

### Response Structure:
```python
MessageListResponse(
    messages=[Message(...)],  # List of enriched messages
    total=total,              # Total count from database
    has_more=has_more         # (skip + limit) < total
)
```

## Frontend Type (Message)

```typescript
interface Message {
  // From database
  id: string
  conversation_id: string
  sender_id: string
  message_text: string
  message_type: MessageType
  file_url?: string
  file_name?: string
  file_size?: number
  reply_to_id?: string
  is_edited: boolean
  edited_at?: string
  is_deleted: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
  
  // Enriched by backend
  sender_name?: string        // ← Từ users table
  sender_avatar?: string      // ← Có thể thêm sau
  reply_to?: {                // ← Từ internal_messages table
    id: string
    message_text: string
    sender_name: string
  }
}
```

## Verification Checklist

### ✅ Database → Backend API
- [x] `SELECT *` lấy tất cả columns từ database
- [x] Filter `is_deleted = False`
- [x] Order by `created_at ASC` (oldest first)
- [x] Pagination với `skip` và `limit`
- [x] Enrich `sender_name` từ `users` table
- [x] Enrich `reply_to` từ `internal_messages` table
- [x] Return `total` count và `has_more` flag

### ✅ Backend API → Frontend
- [x] TypeScript types match với backend response
- [x] All fields are optional where appropriate
- [x] `sender_name` được enrich đúng
- [x] `reply_to` được enrich đúng

### ⚠️ Potential Issues

1. **Conversation mới chưa có messages**:
   - `last_message_at: null` → Không có messages trong database
   - API sẽ trả về `{ messages: [], total: 0, has_more: false }`
   - Frontend sẽ hiển thị "Chưa có tin nhắn nào"

2. **RLS Policies**:
   - Cần đảm bảo user có quyền xem messages
   - Check `internal_conversation_participants` table

3. **Missing sender_name**:
   - Nếu user không có trong `users` table → `sender_name = "Unknown"`
   - Cần kiểm tra xem user có tồn tại không

## Test Query để kiểm tra

```sql
-- Kiểm tra messages trong database
SELECT COUNT(*) 
FROM internal_messages 
WHERE conversation_id = '7234642a-a1c3-4936-842a-8f967197345e' 
  AND is_deleted = false;

-- Kiểm tra messages với sender info
SELECT 
    m.*,
    u.full_name as sender_name
FROM internal_messages m
LEFT JOIN users u ON m.sender_id = u.id
WHERE m.conversation_id = '7234642a-a1c3-4936-842a-8f967197345e'
  AND m.is_deleted = false
ORDER BY m.created_at ASC;

-- Kiểm tra participants
SELECT * 
FROM internal_conversation_participants
WHERE conversation_id = '7234642a-a1c3-4936-842a-8f967197345e';
```

## Debug Steps

1. **Kiểm tra Console Logs**:
   - Mở F12 → Console
   - Chọn conversation
   - Xem logs: `🔄 Loading messages...`, `📥 First batch: ...`, `✅ Loaded ...`

2. **Kiểm tra Network Tab**:
   - Mở F12 → Network
   - Filter: `/api/chat/conversations/{id}/messages`
   - Xem response: `{ messages: [], total: 0, has_more: false }`

3. **Kiểm tra Database**:
   - Query trực tiếp database để xem có messages không
   - Kiểm tra RLS policies có block không

## Verification Results

### Conversation: `7234642a-a1c3-4936-842a-8f967197345e`

**Database Query Result:**
```sql
SELECT COUNT(*) FROM internal_messages 
WHERE conversation_id = '7234642a-a1c3-4936-842a-8f967197345e' 
AND is_deleted = false;
-- Result: 0 messages ✅
```

**Conclusion:**
- ✅ Database: 0 messages (conversation mới chưa có messages)
- ✅ API Response: `{ messages: [], total: 0, has_more: false }` (đúng)
- ✅ Frontend: Hiển thị "Chưa có tin nhắn nào" (đúng)
- ✅ Code xử lý đúng trường hợp không có messages

**Flow khi gửi message đầu tiên:**
1. User gửi message → Optimistic UI update (hiển thị ngay)
2. Backend insert vào database → Trigger update `last_message_at`
3. Real-time subscription nhận INSERT event → Thêm message vào list
4. Reload messages để lấy message từ server (thay optimistic message)
5. Conversation list được update với `last_message_at` mới

