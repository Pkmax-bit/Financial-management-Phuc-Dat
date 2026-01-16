# Fix Tin Nhắn Biến Mất và Không Nhận Realtime

## Vấn Đề

1. **Tin nhắn biến mất**: Sau khi gửi tin nhắn, sau một khoảng thời gian đang gửi rồi gửi xong, tin nhắn lại biến mất
2. **Không nhận tin nhắn realtime**: Không load tin nhắn mới nhất ngay lập tức khi người khác nhắn tin

## Nguyên Nhân

### 1. Tin Nhắn Biến Mất

**Trước:**
```typescript
// Sau khi gửi message thành công
await loadMessages(selectedConversation.id) // Reload TẤT CẢ messages
```

**Vấn đề:**
- `loadMessages()` sẽ `setMessages([])` hoặc `setMessages(firstMessages)` 
- Điều này có thể xóa optimistic message (temp ID) trước khi message thật từ server được load
- Nếu có race condition với realtime broadcast, message có thể bị mất

**Sau:**
```typescript
// Chỉ replace optimistic message với real message từ server
if (response && response.id) {
  setMessages(prev => {
    const filtered = prev.filter(msg => msg.id !== tempMessageId)
    const exists = filtered.find(msg => msg.id === response.id)
    if (exists) {
      // Message đã có từ realtime, chỉ update
      return filtered.map(msg => 
        msg.id === response.id ? { ...msg, ...response } : msg
      )
    } else {
      // Thêm message thật
      return [...filtered, response as Message]
    }
  })
}
```

### 2. Không Nhận Tin Nhắn Realtime

**Vấn đề:**
- `handleNewMessage` không check conversation_id
- Có thể xử lý messages từ conversations khác
- Duplicate check có thể loại bỏ message nếu ID không match đúng

**Sửa:**
- Thêm check `message.conversation_id !== selectedConversation?.id`
- Update message nếu đã tồn tại thay vì ignore
- Thêm logging chi tiết để debug

## Các Thay Đổi

### 1. InternalChat.tsx

#### A. Sửa handleSendMessage
- **Trước**: Reload tất cả messages sau khi gửi
- **Sau**: Chỉ replace optimistic message với real message từ server response
- **Lợi ích**: Tin nhắn không bị mất, realtime vẫn hoạt động

#### B. Sửa handleNewMessage
- Thêm check conversation_id
- Update message nếu đã tồn tại thay vì ignore
- Thêm logging chi tiết

### 2. ChatWidget.tsx

Tương tự như InternalChat.tsx

## Expected Behavior

### Khi User A Gửi Message:

1. **Optimistic Update**: Message hiển thị ngay với temp ID
2. **API Call**: Gửi message đến server
3. **Server Response**: Nhận message thật từ server
4. **Replace**: Thay optimistic message bằng message thật
5. **Realtime Broadcast**: Trigger broadcast message đến User B
6. **User B Nhận**: Nhận broadcast và hiển thị message ngay

### Khi User B Nhận Message:

1. **Realtime Broadcast**: Nhận broadcast từ channel
2. **handleNewMessage**: Xử lý message
3. **Check Conversation**: Verify message thuộc conversation đang mở
4. **Add to List**: Thêm message vào danh sách
5. **UI Update**: Hiển thị message ngay lập tức

## Console Logs Expected

### Khi Gửi Message:
```
✅ Realtime chat connected: <conversation_id>
📨 handleNewMessage called with: { messageId, conversationId, ... }
✅ Adding new message to list: <message_id>
```

### Khi Nhận Message:
```
📡 Received broadcast (ANY event): {...}
📨 Detected INSERT from payload structure
🔍 Handling INSERT broadcast: {...}
📦 Extracted messageData for INSERT: {...}
✅ Calling onNewMessage with: {...}
📨 handleNewMessage called with: { messageId, conversationId, ... }
✅ Adding new message to list: <message_id>
```

## Nếu Vẫn Không Hoạt Động

1. **Kiểm tra console logs**:
   - Có thấy `📡 Received broadcast` không?
   - Có thấy `📨 handleNewMessage called` không?
   - Message có đúng conversation_id không?

2. **Kiểm tra trigger**:
   - Chạy `fix_broadcast_trigger.sql`
   - Test trigger bằng `test_broadcast_trigger.sql`

3. **Kiểm tra RLS policies**:
   - User có trong `internal_conversation_participants` không?
   - RLS policies có đúng không?

## Files Changed

- ✅ `frontend/src/components/chat/InternalChat.tsx` (UPDATED)
- ✅ `frontend/src/components/chat/ChatWidget.tsx` (UPDATED)

## Testing

1. **Test Tin Nhắn Không Biến Mất**:
   - User A gửi message
   - Kiểm tra message vẫn hiển thị sau khi gửi xong
   - Message không bị mất

2. **Test Realtime**:
   - User A gửi message
   - User B nhận message ngay lập tức (không cần refresh)
   - Kiểm tra console logs

