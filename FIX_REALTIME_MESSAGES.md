# Fix Realtime Messages - Typing Hoạt Động Nhưng Messages Không

## Vấn Đề

- ✅ Typing indicator hoạt động realtime (client-side broadcast)
- ❌ Messages không đến realtime (database trigger broadcast)

## Nguyên Nhân

Typing indicator và messages dùng 2 cách broadcast khác nhau:

1. **Typing Indicator**: Client-side broadcast (gửi trực tiếp từ client)
   ```javascript
   channel.send({
     type: 'broadcast',
     event: 'typing',
     payload: { userId, isTyping }
   })
   ```
   → Hoạt động vì gửi trực tiếp qua WebSocket

2. **Messages**: Database trigger broadcast (gửi từ database)
   ```sql
   -- Trigger chạy khi INSERT vào internal_messages
   PERFORM realtime.broadcast_changes(...)
   ```
   → Không hoạt động vì có thể:
     - Trigger không chạy
     - RLS policies chặn
     - Event name không match
     - Payload structure khác

## Giải Pháp

### 1. Đã Thêm Logging Chi Tiết

Hook `useRealtimeChat` giờ có logging chi tiết để debug:
- `📡 Received broadcast (ANY event)` - Nhận được mọi broadcast
- `📨 Detected INSERT from payload structure` - Phát hiện INSERT
- `🔍 Handling INSERT broadcast` - Đang xử lý
- `📦 Extracted messageData` - Data đã extract
- `✅ Calling onNewMessage` - Gọi callback

### 2. Listen Tất Cả Broadcast Events

Đã thay đổi thứ tự:
- **Trước**: Listen specific events (INSERT, UPDATE, DELETE) trước
- **Sau**: Listen ALL events trước, rồi mới listen specific events

Lý do: Đảm bảo catch được mọi broadcast, kể cả khi event name không match.

### 3. Xử Lý Payload Linh Hoạt

Hỗ trợ nhiều cấu trúc payload:
```javascript
// Cấu trúc 1: payload.payload.record
payload.payload.record

// Cấu trúc 2: payload.record
payload.record

// Cấu trúc 3: payload.payload trực tiếp
payload.payload

// Cấu trúc 4: payload trực tiếp
payload
```

## Cách Test

1. **Mở 2 browser windows** (hoặc 2 users)
2. **Mở console** ở cả 2 windows
3. **User A gửi message**
4. **Kiểm tra console**:

### Expected Logs (User A - người gửi):
```
✅ Realtime chat connected: <conversation_id>
📡 Received broadcast (ANY event): {...}
📨 Detected INSERT from payload structure
🔍 Handling INSERT broadcast: {...}
📦 Extracted messageData for INSERT: {...}
✅ Calling onNewMessage with: {...}
```

### Expected Logs (User B - người nhận):
```
✅ Realtime chat connected: <conversation_id>
📡 Received broadcast (ANY event): {...}
📨 Detected INSERT from payload structure
🔍 Handling INSERT broadcast: {...}
📦 Extracted messageData for INSERT: {...}
✅ Calling onNewMessage with: {...}
```

## Nếu Vẫn Không Hoạt Động

### Kiểm Tra 1: Trigger Có Hoạt Động Không?

Chạy SQL:
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

Nếu không có → Chạy lại migration:
```sql
\i database/migrations/migrate_chat_to_broadcast.sql
```

### Kiểm Tra 2: RLS Policies Có Chặn Không?

```sql
-- Kiểm tra policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'realtime' AND tablename = 'messages';

-- Kiểm tra user có trong participants không
SELECT * FROM internal_conversation_participants 
WHERE conversation_id = 'your-conversation-id';
```

### Kiểm Tra 3: Console Logs

Nếu không thấy `📡 Received broadcast (ANY event)`:
- Trigger không hoạt động
- RLS policies chặn
- Channel subscription không đúng

Nếu thấy `📡 Received broadcast` nhưng không thấy `📨 Detected INSERT`:
- Payload structure khác với expected
- Kiểm tra logs để xem payload structure thực tế

## So Sánh Typing vs Messages

| Feature | Typing Indicator | Messages |
|---------|-----------------|----------|
| **Cách gửi** | Client-side broadcast | Database trigger |
| **Channel** | Same channel | Same channel |
| **Event** | Custom event name | Operation name (INSERT) |
| **Payload** | Custom structure | Database record structure |
| **RLS** | Không cần (client-side) | Cần RLS policies |
| **Trigger** | Không cần | Cần trigger |

## Next Steps

1. Test với logging mới
2. Kiểm tra console logs khi gửi message
3. Nếu vẫn không hoạt động, kiểm tra trigger và RLS policies
4. Share console logs để debug tiếp


