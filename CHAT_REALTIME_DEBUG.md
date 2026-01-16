# Debug Chat Realtime - Tin Nhắn Không Đến Ngay

## Vấn Đề

Khi user A gửi tin nhắn, user B chỉ nhận được khi user B gửi tin nhắn mới (không realtime).

## Nguyên Nhân Có Thể

1. **Trigger không hoạt động** - Database trigger không broadcast
2. **RLS Policies chặn** - RLS policies trên `realtime.messages` chặn broadcast
3. **Event name không đúng** - Event name không match với cách listen
4. **Channel subscription không đúng** - Channel không subscribe đúng topic

## Cách Kiểm Tra

### 1. Kiểm Tra Trigger

Chạy script `database/migrations/verify_broadcast_trigger.sql` để kiểm tra:

```sql
-- Kiểm tra function
SELECT proname, prosrc FROM pg_proc WHERE proname = 'broadcast_message_changes';

-- Kiểm tra trigger
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'messages_broadcast_trigger';

-- Kiểm tra RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'realtime' AND tablename = 'messages';
```

### 2. Kiểm Tra Console Logs

Mở browser console và kiểm tra:

- `✅ Realtime chat connected: <conversation_id>` - Kết nối thành công
- `📨 Received INSERT broadcast:` - Nhận được broadcast INSERT
- `📡 Received broadcast (any event):` - Nhận được broadcast (fallback)

Nếu không thấy logs này, có thể:
- Channel chưa subscribe thành công
- Trigger không hoạt động
- RLS policies chặn

### 3. Test Trigger Thủ Công

```sql
-- Test trigger bằng cách insert message (thay conversation_id và sender_id thực tế)
INSERT INTO internal_messages (
    id, 
    conversation_id, 
    sender_id, 
    content, 
    created_at
)
VALUES (
    gen_random_uuid(),
    'your-conversation-id',
    'your-sender-id',
    'Test message',
    NOW()
);

-- Sau đó kiểm tra xem có broadcast không trong console
```

### 4. Kiểm Tra RLS Policies

RLS policies trên `realtime.messages` phải cho phép:
- **SELECT**: Users có thể đọc broadcasts từ conversations họ tham gia
- **INSERT**: Users có thể gửi broadcasts (trigger tự động)

Kiểm tra:

```sql
-- Xem policies hiện tại
SELECT * FROM pg_policies 
WHERE schemaname = 'realtime' AND tablename = 'messages';

-- Test policy
SET ROLE authenticated;
SET request.jwt.claim.sub = 'your-user-id';
SELECT * FROM realtime.messages 
WHERE topic = 'conversation:your-conversation-id:messages';
```

## Cách Sửa

### Nếu Trigger Không Hoạt Động

1. Chạy lại migration:
```sql
-- Chạy lại migrate_chat_to_broadcast.sql
\i database/migrations/migrate_chat_to_broadcast.sql
```

2. Kiểm tra Realtime extension:
```sql
SELECT * FROM pg_extension WHERE extname = 'realtime';
```

### Nếu RLS Policies Chặn

1. Kiểm tra user có trong `internal_conversation_participants`:
```sql
SELECT * FROM internal_conversation_participants 
WHERE conversation_id = 'your-conversation-id' 
  AND user_id = 'your-user-id';
```

2. Kiểm tra RLS policies:
```sql
-- Policy phải cho phép SELECT và INSERT
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'realtime' AND tablename = 'messages';
```

### Nếu Event Name Không Đúng

Hook đã có fallback listener để catch mọi broadcast events. Kiểm tra console logs để xem event name thực tế.

### Nếu Channel Subscription Không Đúng

1. Kiểm tra channel name phải match với topic trong trigger:
   - Trigger: `'conversation:' || NEW.conversation_id::text || ':messages'`
   - Channel: `conversation:${conversationId}:messages`

2. Kiểm tra `supabase.realtime.setAuth()` đã được gọi chưa:
   - Hook tự động gọi `setAuth()` trước khi subscribe

## Debug Steps

1. **Mở 2 browser windows** (hoặc 2 users khác nhau)
2. **Mở console** ở cả 2 windows
3. **User A gửi message** → Kiểm tra console User A và User B
4. **Kiểm tra logs**:
   - User A: Có thấy `📨 Received INSERT broadcast:` không?
   - User B: Có thấy `📨 Received INSERT broadcast:` không?

### Nếu User A thấy nhưng User B không thấy:

- **RLS policies chặn** - User B không có quyền đọc broadcast
- **Channel subscription** - User B chưa subscribe đúng channel

### Nếu cả 2 đều không thấy:

- **Trigger không hoạt động** - Kiểm tra trigger trong database
- **Event name không đúng** - Kiểm tra console logs để xem event name thực tế

## Expected Behavior

Khi user A gửi message:

1. **Backend** insert vào `internal_messages`
2. **Trigger** `messages_broadcast_trigger` chạy
3. **Function** `broadcast_message_changes()` gọi `realtime.broadcast_changes()`
4. **Realtime** broadcast message đến channel `conversation:{id}:messages`
5. **User A và User B** (nếu đã subscribe) nhận được broadcast
6. **Hook** xử lý broadcast và gọi `onNewMessage()`
7. **UI** cập nhật với message mới

## Console Logs Expected

```
✅ Realtime chat connected: <conversation_id>
📨 Received INSERT broadcast: { payload: { record: {...} } }
```

Nếu không thấy logs này, có vấn đề với trigger hoặc subscription.

## Next Steps

1. Chạy `verify_broadcast_trigger.sql` để kiểm tra trigger
2. Kiểm tra console logs khi gửi message
3. Nếu vẫn không hoạt động, kiểm tra RLS policies
4. Test với 2 users khác nhau để xác nhận broadcast hoạt động

