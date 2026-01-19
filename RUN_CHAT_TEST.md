# Hướng Dẫn Chạy Test Chat Tự Động

## Cách 1: Sử dụng Playwright (Tự Động)

### Bước 1: Cài đặt Playwright

```bash
npm install -D @playwright/test playwright
npx playwright install chromium
```

### Bước 2: Chạy Test

```bash
npx playwright test test-chat-automated.ts --headed
```

(`--headed` để xem browser, bỏ đi để chạy headless)

## Cách 2: Test Thủ Công (Khuyến Nghị)

### Bước 1: Mở 2 Browser Windows

**Window 1 - Dương:**
- Mở Chrome (hoặc browser chính)
- Truy cập: `http://localhost:3000` (hoặc URL của app)
- Đăng nhập:
  - Email: `phucdatdoors7@gmail.com`
  - Password: `123456`

**Window 2 - Quân:**
- Mở Chrome Incognito (hoặc Firefox/Edge)
- Truy cập: `http://localhost:3000`
- Đăng nhập:
  - Email: `tranhoangquan2707@gmail.com`
  - Password: `123456`

### Bước 2: Mở Developer Console

**Window 1 (Dương):**
- Nhấn `F12` hoặc `Ctrl+Shift+I`
- Chọn tab **Console**

**Window 2 (Quân):**
- Nhấn `F12` hoặc `Ctrl+Shift+I`
- Chọn tab **Console**

### Bước 3: Test Gửi/Nhận Message

#### Test 1: Dương Gửi → Quân Nhận

1. **Window 1 (Dương):**
   - Mở chat với Quân
   - Gửi message: "Test từ Dương - " + timestamp
   - **Kiểm tra Console:**
     ```
     📤 API Response after sending message: {
       response: { id: "...", ... },
       hasId: true,
       ...
     }
     ✅ Adding real message from API response: <id>
     ```
   - **Kiểm tra UI:**
     - ✅ Message hiển thị ngay sau khi gửi
     - ✅ Message KHÔNG biến mất
     - ✅ Status "đang gửi" biến mất

2. **Window 2 (Quân):**
   - **Kiểm tra Console:**
     ```
     📡 Received broadcast (ANY event): {...}
     📨 handleNewMessage called with: {
       messageId: "...",
       isOwnMessage: false,
       ...
     }
     ✅ Adding new message to list (from realtime): <id>
     ```
   - **Kiểm tra UI:**
     - ✅ Message xuất hiện
     - ✅ Thời gian: <1 giây (sau optimization)

#### Test 2: Quân Gửi → Dương Nhận

Làm ngược lại Test 1

### Bước 4: Kiểm Tra Kết Quả

**Expected Results:**
- ✅ User gửi message → Message hiển thị ngay
- ✅ User nhận message → <1 giây (thay vì 26-30s)
- ✅ Không có message biến mất
- ✅ Không có duplicate messages

**Nếu có vấn đề:**
1. Copy console logs từ cả 2 windows
2. Screenshot UI (nếu có thể)
3. Mô tả vấn đề cụ thể

## Console Logs Quan Trọng

### Khi Gửi (User A):
```
📤 API Response after sending message: {
  response: { id: "...", ... },
  hasId: true,  ← Phải là true
  responseKeys: ["id", "conversation_id", ...],
  tempMessageId: "temp-..."
}
✅ Adding real message from API response: <message_id>
```

### Khi Nhận (User B):
```
📡 Received broadcast (ANY event): {...}
📨 handleNewMessage called with: {
  messageId: "...",
  conversationId: "...",
  senderId: "...",
  currentUserId: "...",
  isOwnMessage: false,
  messageText: "..."
}
✅ Adding new message to list (from realtime): <message_id>
```

## Troubleshooting

### Message Biến Mất:
- Kiểm tra `hasId: true` hay `false`
- Kiểm tra có log `⚠️ No valid response from API` không
- Copy toàn bộ console logs

### Message Không Nhận Được:
- Kiểm tra có log `📡 Received broadcast` không
- Kiểm tra có log `📨 handleNewMessage` không
- Kiểm tra `conversationId` có match không

### Latency Vẫn Cao (>1s):
- Kiểm tra có log `⚠️ Slow broadcast processing` không
- Kiểm tra network latency
- Kiểm tra database trigger đã chạy chưa

## Checklist

- [ ] Dương gửi → Message hiển thị ngay
- [ ] Dương gửi → Quân nhận được (<1s)
- [ ] Quân gửi → Message hiển thị ngay
- [ ] Quân gửi → Dương nhận được (<1s)
- [ ] Không có message biến mất
- [ ] Không có duplicate messages
- [ ] Console logs đúng format


