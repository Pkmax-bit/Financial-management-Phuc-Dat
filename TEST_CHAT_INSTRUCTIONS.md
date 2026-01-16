# Hướng Dẫn Test Chat Với 2 Tài Khoản

## Chuẩn Bị

1. **Mở 2 Browser Windows hoặc 2 Browser Profiles:**
   - Window 1: Đăng nhập với tài khoản **Dương**
   - Window 2: Đăng nhập với tài khoản **Quân**

   Hoặc sử dụng:
   - Chrome + Chrome Incognito
   - Chrome + Firefox
   - Chrome + Edge

2. **Mở Developer Console:**
   - Window 1 (Dương): F12 → Console tab
   - Window 2 (Quân): F12 → Console tab

## Test Cases

### Test 1: User Dương Gửi Message

1. **Window 1 (Dương):**
   - Mở chat với User Quân
   - Gửi message: "Test message từ Dương"
   - **Kiểm tra Console Logs:**
     ```
     📤 API Response after sending message: {
       response: {...},
       hasId: true/false,
       ...
     }
     ✅ Adding real message from API response: <message_id>
     ```
   - **Kiểm tra UI:**
     - Message có hiển thị ngay sau khi gửi không?
     - Message có biến mất không?
     - Status "đang gửi" có biến mất không?

2. **Window 2 (Quân):**
   - **Kiểm tra Console Logs:**
     ```
     📡 Received broadcast (ANY event): {...}
     📨 handleNewMessage called with: {
       messageId: "...",
       senderId: "...",
       isOwnMessage: false,
       ...
     }
     ✅ Adding new message to list (from realtime): <message_id>
     ```
   - **Kiểm tra UI:**
     - Message có xuất hiện không?
     - Mất bao lâu để message xuất hiện? (Expected: <1 giây sau optimization)

### Test 2: User Quân Gửi Message

1. **Window 2 (Quân):**
   - Gửi message: "Test message từ Quân"
   - **Kiểm tra Console Logs:** (tương tự Test 1)
   - **Kiểm tra UI:** Message có hiển thị ngay không?

2. **Window 1 (Dương):**
   - **Kiểm tra Console Logs:** (tương tự Test 1)
   - **Kiểm tra UI:** Message có xuất hiện không?

### Test 3: Gửi Nhiều Messages Liên Tiếp

1. **Window 1 (Dương):**
   - Gửi 5 messages liên tiếp
   - **Kiểm tra:** Tất cả messages có hiển thị không?

2. **Window 2 (Quân):**
   - **Kiểm tra:** Tất cả messages có nhận được không?

## Console Logs Cần Kiểm Tra

### Khi Gửi Message (User A):

✅ **Expected Logs:**
```
📤 API Response after sending message: {
  response: { id: "...", ... },
  hasId: true,
  responseKeys: ["id", "conversation_id", "sender_id", ...],
  tempMessageId: "temp-..."
}
✅ Adding real message from API response: <message_id>
```

❌ **Nếu thấy:**
```
⚠️ No valid message in API response, keeping optimistic message
```
→ API response không hợp lệ, nhưng optimistic message sẽ được giữ

### Khi Nhận Message (User B):

✅ **Expected Logs:**
```
📡 Received broadcast (ANY event): {...}
📨 handleNewMessage called with: {
  messageId: "...",
  conversationId: "...",
  senderId: "...",
  isOwnMessage: false,
  ...
}
✅ Adding new message to list (from realtime): <message_id>
```

❌ **Nếu thấy:**
```
⚠️ Ignoring message from different conversation
```
→ Message từ conversation khác (bình thường nếu có nhiều conversations)

## Các Vấn Đề Có Thể Gặp

### 1. Message Biến Mất Sau Khi Gửi

**Kiểm tra:**
- Console có log `✅ Adding real message from API response` không?
- API response có `hasId: true` không?
- Có thấy `⚠️ No valid message in API response` không?

**Nếu có:**
- Copy toàn bộ console logs
- Kiểm tra API response format

### 2. Message Không Nhận Được (26-30s delay)

**Kiểm tra:**
- Console có log `📡 Received broadcast` không?
- Console có log `📨 handleNewMessage called` không?
- Có thấy `⚠️ Slow broadcast processing` không?

**Nếu có:**
- Kiểm tra database trigger đã chạy chưa
- Kiểm tra RLS policies
- Kiểm tra network latency

### 3. Duplicate Messages

**Kiểm tra:**
- Console có log `⚠️ Message already exists, updating instead` không?
- Có thấy message xuất hiện 2 lần không?

**Nếu có:**
- Code đã xử lý duplicates, nhưng có thể có race condition

## Checklist Test

- [ ] User Dương gửi message → Message hiển thị ngay
- [ ] User Dương gửi message → User Quân nhận được (<1s)
- [ ] User Quân gửi message → Message hiển thị ngay
- [ ] User Quân gửi message → User Dương nhận được (<1s)
- [ ] Gửi nhiều messages → Tất cả hiển thị đúng
- [ ] Không có duplicate messages
- [ ] Không có message biến mất

## Gửi Kết Quả

Nếu có vấn đề, hãy copy:
1. Console logs từ cả 2 windows
2. Screenshot UI (nếu có thể)
3. Mô tả vấn đề cụ thể

## Expected Results Sau Optimization

- ✅ **Latency:** <1 giây (thay vì 26-30s)
- ✅ **User A thấy message ngay:** Sau khi gửi xong
- ✅ **User B nhận message ngay:** <1 giây sau khi User A gửi
- ✅ **Không có message biến mất**
- ✅ **Không có duplicate messages**

