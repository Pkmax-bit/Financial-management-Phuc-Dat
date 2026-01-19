# Tối Ưu Hóa Chat Realtime

## Tổng Quan

Đã tối ưu hóa code chat realtime để đảm bảo hoạt động ổn định, tự động reconnect, và xử lý lỗi tốt hơn.

## Các Cải Tiến Chính

### 1. Custom Hook `useRealtimeChat`

Tạo hook tối ưu tại `frontend/src/hooks/useRealtimeChat.ts` với các tính năng:

#### ✅ Tự Động Reconnect
- Tự động reconnect khi mất kết nối
- Exponential backoff retry (1s → 2s → 4s → 8s → 16s → 30s max)
- Tối đa 5 lần retry trước khi dừng

#### ✅ Error Handling
- Xử lý các lỗi connection (CHANNEL_ERROR, TIMED_OUT, CLOSED)
- Logging chi tiết để debug
- Callback `onConnectionChange` để UI có thể hiển thị trạng thái

#### ✅ Connection Status Monitoring
- `isConnected`: boolean - trạng thái kết nối
- `connectionStatus`: 'connecting' | 'connected' | 'disconnected' | 'error'
- `error`: Error object nếu có lỗi

#### ✅ Sender Info Caching
- Cache thông tin sender để tránh query nhiều lần
- Tự động clear cache khi unmount để tránh memory leak

#### ✅ Memory Leak Prevention
- Cleanup đúng cách khi component unmount
- Sử dụng `isUnmountingRef` để tránh race conditions
- Clear timeouts và channels

#### ✅ Payload Handling
- Xử lý đúng cấu trúc payload từ `realtime.broadcast_changes()`
- Hỗ trợ cả `payload.payload.record` và `payload.payload` (fallback)

### 2. Debounce cho `loadConversations`

- Debounce 500ms để tránh gọi API quá nhiều khi có nhiều messages
- Giảm tải cho server và cải thiện performance

### 3. Cập Nhật Components

#### `InternalChat.tsx`
- Thay thế code realtime cũ bằng `useRealtimeChat` hook
- Thêm handlers: `handleNewMessage`, `handleMessageUpdate`, `handleMessageDelete`
- Sử dụng `debouncedLoadConversations` thay vì gọi trực tiếp

#### `ChatWidget.tsx`
- Tương tự như `InternalChat.tsx`
- Đảm bảo consistency giữa 2 components

## Cấu Trúc Code

### Hook Usage

```typescript
const { isConnected, connectionStatus, error } = useRealtimeChat({
  conversationId: selectedConversation?.id || null,
  currentUserId,
  onNewMessage: handleNewMessage,
  onMessageUpdate: handleMessageUpdate,
  onMessageDelete: handleMessageDelete,
  onConnectionChange: (connected) => {
    // Handle connection status change
  },
})
```

### Message Handlers

```typescript
const handleNewMessage = useCallback((message: Message) => {
  setMessages(prev => {
    const exists = prev.find(m => m.id === message.id)
    if (exists) return prev
    return [...prev, message]
  })
  debouncedLoadConversations()
}, [debouncedLoadConversations])
```

## Lợi Ích

1. **Ổn Định Hơn**: Tự động reconnect khi mất kết nối
2. **Performance Tốt Hơn**: Debounce và caching giảm số lượng API calls
3. **Dễ Debug**: Logging chi tiết và connection status
4. **Tránh Memory Leaks**: Cleanup đúng cách
5. **Code Sạch Hơn**: Tách logic realtime vào hook riêng, dễ maintain

## Testing

### Test Cases

1. **Mất Kết Nối**
   - Tắt internet → Kiểm tra reconnect tự động
   - Kiểm tra retry logic

2. **Nhiều Messages**
   - Gửi nhiều messages liên tiếp → Kiểm tra debounce hoạt động
   - Kiểm tra không có duplicate messages

3. **Memory Leaks**
   - Mở/đóng chat nhiều lần → Kiểm tra không có memory leaks
   - Kiểm tra cleanup đúng cách

4. **Connection Status**
   - Kiểm tra `isConnected` và `connectionStatus` cập nhật đúng

## Monitoring

### Console Logs

- `✅ Realtime chat connected` - Kết nối thành công
- `⚠️ Realtime chat disconnected` - Mất kết nối
- `🔄 Retrying connection in Xms (attempt Y/5)` - Đang retry
- `❌ Max retry attempts reached` - Đã hết số lần retry

### Connection Status

- `connecting`: Đang kết nối
- `connected`: Đã kết nối
- `disconnected`: Đã ngắt kết nối
- `error`: Có lỗi

## Next Steps (Optional)

1. **Typing Indicators**: Thêm typing indicators với Broadcast
2. **Presence**: Thêm presence để hiển thị online/offline status
3. **Connection UI**: Hiển thị connection status trong UI (badge, indicator)
4. **Metrics**: Thêm metrics để theo dõi connection quality

## Files Changed

- ✅ `frontend/src/hooks/useRealtimeChat.ts` (NEW)
- ✅ `frontend/src/components/chat/InternalChat.tsx` (UPDATED)
- ✅ `frontend/src/components/chat/ChatWidget.tsx` (UPDATED)

## Notes

- Hook tự động cleanup khi `conversationId` thay đổi
- Retry logic sử dụng exponential backoff để tránh spam
- Sender info cache được clear khi unmount để tránh memory leaks
- Debounce 500ms là balance tốt giữa responsiveness và performance


