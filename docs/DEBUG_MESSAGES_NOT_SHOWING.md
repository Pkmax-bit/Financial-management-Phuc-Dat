# Debug: Không thấy nội dung tin nhắn

## Các bước kiểm tra

### 1. Kiểm tra Console Logs

Mở **Browser DevTools** → **Console** và tìm các logs sau:

#### Khi chọn conversation:
```
🔄 Conversation selected: {conversation_id}, loading messages...
🔄 Loading messages for conversation {conversation_id}...
```

#### Khi load messages:
```
📥 First batch: {số lượng} messages, total: {tổng}, has_more: {true/false}
✅ Setting {số lượng} messages to state
📋 Sample message: {object}
```

#### Khi render messages:
```
📨 Rendering message: {id, text, sender, type, isDeleted}
```

### 2. Kiểm tra Network Requests

Mở **Browser DevTools** → **Network** tab:

1. Tìm request: `GET /api/chat/conversations/{conversation_id}/messages`
2. Kiểm tra **Response**:
   ```json
   {
     "messages": [...],
     "total": 0,
     "has_more": false
   }
   ```

**Nếu `messages` là mảng rỗng `[]`:**
- Conversation này chưa có messages trong database
- Kiểm tra database: `SELECT COUNT(*) FROM internal_messages WHERE conversation_id = '{id}' AND is_deleted = false`

**Nếu `messages` có dữ liệu nhưng không hiển thị:**
- Kiểm tra React state: `messages.length`
- Kiểm tra console logs để xem messages có được set vào state không

### 3. Kiểm tra React State

Thêm vào component (tạm thời để debug):

```typescript
useEffect(() => {
  console.log('🔍 Messages state changed:', {
    count: messages.length,
    messages: messages,
    selectedConversation: selectedConversation?.id,
    loadingMessages: loadingMessages
  })
}, [messages, selectedConversation, loadingMessages])
```

### 4. Kiểm tra Database

Chạy SQL query để kiểm tra messages trong database:

```sql
-- Kiểm tra số lượng messages
SELECT COUNT(*) as total_messages
FROM internal_messages 
WHERE conversation_id = '{conversation_id}' 
  AND is_deleted = false;

-- Xem chi tiết messages
SELECT 
    id,
    sender_id,
    message_text,
    message_type,
    created_at,
    is_deleted
FROM internal_messages 
WHERE conversation_id = '{conversation_id}' 
  AND is_deleted = false 
ORDER BY created_at ASC
LIMIT 10;
```

### 5. Kiểm tra UI Rendering

Kiểm tra trong **Browser DevTools** → **Elements**:

1. Tìm element: `<div className="space-y-2">` (container của messages)
2. Kiểm tra xem có child elements không
3. Nếu có child elements, kiểm tra xem có nội dung `message_text` không

### 6. Các nguyên nhân có thể

#### A. Messages không được load từ API
**Triệu chứng:**
- Console log: `📥 First batch: 0 messages`
- Network response: `{ messages: [], total: 0 }`

**Giải pháp:**
- Kiểm tra database có messages không
- Kiểm tra `conversation_id` có đúng không
- Kiểm tra RLS policies có cho phép đọc messages không

#### B. Messages được load nhưng không set vào state
**Triệu chứng:**
- Console log: `📥 First batch: 5 messages` nhưng `messages.length = 0`
- Network response có messages nhưng UI không hiển thị

**Giải pháp:**
- Kiểm tra `setMessages()` có được gọi không
- Kiểm tra có lỗi trong quá trình enrich messages không
- Kiểm tra `Message` model có validate đúng không

#### C. Messages được set vào state nhưng không render
**Triệu chứng:**
- Console log: `✅ Setting 5 messages to state`
- React DevTools: `messages.length = 5` nhưng UI không hiển thị

**Giải pháp:**
- Kiểm tra `messages.map()` có được gọi không
- Kiểm tra `MessageBubble` component có render không
- Kiểm tra CSS có ẩn messages không (display: none, opacity: 0, etc.)

#### D. Messages render nhưng không thấy nội dung
**Triệu chứng:**
- UI có message bubbles nhưng không có text

**Giải pháp:**
- Kiểm tra `message.message_text` có giá trị không
- Kiểm tra `MessageBubble` có render `message_text` không
- Kiểm tra CSS có ẩn text không (color: transparent, font-size: 0, etc.)

### 7. Quick Fix Checklist

- [ ] Kiểm tra console logs
- [ ] Kiểm tra network requests
- [ ] Kiểm tra database có messages không
- [ ] Kiểm tra React state (`messages.length`)
- [ ] Kiểm tra UI rendering (Elements tab)
- [ ] Kiểm tra `selectedConversation` có được set đúng không
- [ ] Kiểm tra `loadMessages()` có được gọi không
- [ ] Kiểm tra `MessageBubble` component có render không

### 8. Test với Conversation có Messages

Thử với conversation ID: `3866ca48-da99-4559-a257-0ece907e5e8e` (group chat có messages)

Nếu conversation này hiển thị messages nhưng conversation khác không:
- Vấn đề có thể là conversation đó chưa có messages
- Hoặc có vấn đề với permissions/RLS

