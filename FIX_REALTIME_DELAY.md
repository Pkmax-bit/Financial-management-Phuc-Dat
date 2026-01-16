# Fix Realtime Delay - Tin Nhắn Mất 3 Phút Mới Đến

## Vấn Đề

Khi 2 user chat, phải mất 3 phút thì mới nhận được tin nhắn của nhau. Điều này cho thấy realtime broadcast không hoạt động.

## Nguyên Nhân Có Thể

1. **Trigger không hoạt động** - Database trigger không broadcast
2. **RLS Policies chặn** - RLS policies trên `realtime.messages` chặn broadcast
3. **Channel subscription không đúng** - Channel không subscribe đúng topic
4. **Payload structure không match** - Payload structure khác với expected

## Cách Kiểm Tra

### 1. Kiểm Tra Trigger

Chạy script test:
```sql
\i database/migrations/test_broadcast_trigger.sql
```

Hoặc chạy SQL trực tiếp:
```sql
-- Kiểm tra trigger
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'messages_broadcast_trigger';

-- Kiểm tra function
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'broadcast_message_changes';
```

### 2. Kiểm Tra Console Logs

Mở browser console và kiểm tra:

**Khi subscribe:**
```
✅ Realtime chat connected: <conversation_id>
📡 Channel name: conversation:<conversation_id>:messages
```

**Khi có message mới:**
```
📡 Received broadcast (ANY event): {...}
📨 Detected INSERT from payload structure
🔍 Handling INSERT broadcast: {...}
📦 Extracted messageData for INSERT: {...}
✅ Calling onNewMessage with: {...}
```

**Nếu không thấy logs này:**
- Trigger không hoạt động
- RLS policies chặn
- Channel subscription không đúng

### 3. Test Trigger Thủ Công

```sql
-- Test trigger bằng cách insert message (thay conversation_id và sender_id thực tế)
INSERT INTO internal_messages (
    id, 
    conversation_id, 
    sender_id, 
    message_text, 
    created_at
)
VALUES (
    gen_random_uuid(),
    'your-conversation-id',
    'your-sender-id',
    'Test message',
    NOW()
);

-- Sau đó kiểm tra console xem có broadcast không
```

## Cách Sửa

### Bước 1: Chạy Fix Script

```sql
\i database/migrations/fix_broadcast_trigger.sql
```

Script này sẽ:
- Drop và recreate function `broadcast_message_changes()`
- Drop và recreate trigger `messages_broadcast_trigger`
- Verify trigger và function tồn tại
- Đảm bảo RLS policies đúng

### Bước 2: Kiểm Tra RLS Policies

```sql
-- Xem policies hiện tại
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'realtime' AND tablename = 'messages';

-- Test policy (thay user_id và conversation_id thực tế)
SET ROLE authenticated;
SET request.jwt.claim.sub = 'your-user-id';
SELECT * FROM realtime.messages 
WHERE topic = 'conversation:your-conversation-id:messages'
LIMIT 5;
```

### Bước 3: Kiểm Tra User Có Trong Participants

```sql
-- Kiểm tra user có trong participants không
SELECT * FROM internal_conversation_participants 
WHERE conversation_id = 'your-conversation-id' 
  AND user_id = 'your-user-id';
```

Nếu không có → User không thể nhận broadcasts (RLS chặn)

### Bước 4: Test Realtime

1. **Mở 2 browser windows** (hoặc 2 users)
2. **Mở console** ở cả 2 windows
3. **User A gửi message**
4. **Kiểm tra console**:

**Expected (User A):**
```
✅ Realtime chat connected: <conversation_id>
📡 Received broadcast (ANY event): {...}
📨 Detected INSERT from payload structure
✅ Calling onNewMessage with: {...}
```

**Expected (User B):**
```
✅ Realtime chat connected: <conversation_id>
📡 Received broadcast (ANY event): {...}
📨 Detected INSERT from payload structure
✅ Calling onNewMessage with: {...}
```

## Nếu Vẫn Không Hoạt Động

### Debug Steps

1. **Kiểm tra trigger có chạy không:**
   - Thêm logging vào function (không thể, nhưng có thể test bằng cách insert)
   - Kiểm tra `realtime.messages` table xem có records không

2. **Kiểm tra RLS policies:**
   - Test SELECT policy với user thực tế
   - Đảm bảo user có trong `internal_conversation_participants`

3. **Kiểm tra channel subscription:**
   - Console logs sẽ cho biết channel có subscribe thành công không
   - Kiểm tra `status === 'SUBSCRIBED'`

4. **Kiểm tra payload structure:**
   - Console logs sẽ show payload structure
   - Nếu payload structure khác, cần adjust code

## Expected Behavior

Khi user A gửi message:

1. **Backend** insert vào `internal_messages` ✅
2. **Trigger** `messages_broadcast_trigger` chạy ✅
3. **Function** `broadcast_message_changes()` gọi `realtime.broadcast_changes()` ✅
4. **Realtime** broadcast message đến channel `conversation:{id}:messages` ✅
5. **User A và User B** (nếu đã subscribe) nhận được broadcast ngay lập tức ✅
6. **Hook** xử lý broadcast và gọi `onNewMessage()` ✅
7. **UI** cập nhật với message mới ngay lập tức ✅

## Files Changed

- ✅ `database/migrations/fix_broadcast_trigger.sql` (NEW) - Script fix trigger
- ✅ `database/migrations/test_broadcast_trigger.sql` (NEW) - Script test trigger
- ✅ `frontend/src/hooks/useRealtimeChat.ts` (UPDATED) - Thêm logging chi tiết

## Next Steps

1. Chạy `fix_broadcast_trigger.sql` trong database
2. Restart backend server
3. Refresh frontend
4. Test chat giữa 2 users
5. Kiểm tra console logs để debug

