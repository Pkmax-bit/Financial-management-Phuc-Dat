# Typing Indicator Implementation - Hoàn Thành

## Tổng Quan

Đã thêm typing indicator (hiển thị ai đang soạn tin nhắn) vào cả `InternalChat.tsx` và `ChatWidget.tsx` với realtime broadcast.

## Tính Năng Đã Implement

### ✅ InternalChat.tsx
- Typing indicator state và refs
- Typing channel setup khi conversation được chọn
- Broadcast typing status khi user gõ (throttle 1 giây)
- Listen typing events từ users khác
- UI hiển thị "X đang soạn..." với animation
- Auto-stop sau 2 giây không gõ
- Cleanup khi gửi message

### ✅ ChatWidget.tsx
- Tương tự như InternalChat.tsx
- Typing indicator hoạt động realtime

## Cách Hoạt Động

### 1. Khi User Gõ

```typescript
// Broadcast typing status (throttle 1 giây)
typingChannelRef.current.send({
  type: 'broadcast',
  event: 'typing',
  payload: {
    userId: currentUserId,
    userName: currentUserName,
    isTyping: true
  }
})

// Auto-stop sau 2 giây không gõ
typingTimeoutRef.current = setTimeout(() => {
  typingChannelRef.current.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      userId: currentUserId,
      userName: currentUserName,
      isTyping: false
    }
  })
}, 2000)
```

### 2. Khi Nhận Typing Events

```typescript
typingChannel
  .on('broadcast', { event: 'typing' }, (payload) => {
    const { userId, userName, isTyping: typingStatus } = payload.payload
    
    if (userId !== currentUserId && typingStatus) {
      // Thêm vào typingUsers map
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        newMap.set(userId, {
          userId,
          userName: userName || 'Người dùng',
          timestamp: Date.now()
        })
        return newMap
      })
    } else if (userId !== currentUserId && !typingStatus) {
      // Xóa khỏi typingUsers map
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        newMap.delete(userId)
        return newMap
      })
    }
  })
```

### 3. UI Hiển Thị

```tsx
{typingUsers.size > 0 && (
  <div className="px-4 py-2 bg-white border-t border-gray-100">
    {Array.from(typingUsers.values()).map((typingUser) => (
      <div key={typingUser.userId} className="flex items-center gap-2 text-sm text-gray-500 italic">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
        <span>{typingUser.userName} đang soạn...</span>
      </div>
    ))}
  </div>
)}
```

## Channel Setup

```typescript
const typingChannel = supabase.channel(`typing:conversation:${conversationId}`, {
  config: {
    broadcast: {
      self: false, // Không nhận broadcast của chính mình
      ack: false
    }
  }
})
```

## Tính Năng

- ✅ **Realtime**: Dùng Supabase Broadcast
- ✅ **Throttle**: Chỉ broadcast mỗi 1 giây để tránh spam
- ✅ **Auto-stop**: Tự động dừng sau 2 giây không gõ
- ✅ **Multi-user**: Hỗ trợ nhiều users typing cùng lúc
- ✅ **Cleanup**: Tự động xóa typing indicator cũ (>3 giây)
- ✅ **UI Animation**: 3 dots bouncing animation

## So Sánh với ProjectTasksTab

| Feature | ProjectTasksTab | InternalChat | ChatWidget |
|---------|----------------|--------------|------------|
| **Typing Indicator** | ✅ Có | ✅ Có (mới) | ✅ Có (mới) |
| **Realtime** | ✅ Client-side | ✅ Client-side | ✅ Client-side |
| **Throttle** | ✅ 1 giây | ✅ 1 giây | ✅ 1 giây |
| **Auto-stop** | ✅ 2 giây | ✅ 2 giây | ✅ 2 giây |

## Test

1. Mở 2 browser windows (hoặc 2 users)
2. Chọn cùng một conversation
3. User A bắt đầu gõ
4. User B sẽ thấy "User A đang soạn..."
5. User A dừng gõ 2 giây → indicator biến mất
6. User A gửi message → indicator biến mất ngay

## Files Changed

- ✅ `frontend/src/components/chat/InternalChat.tsx` (UPDATED)
- ✅ `frontend/src/components/chat/ChatWidget.tsx` (UPDATED)

## Notes

- Typing indicator chỉ hiển thị cho users khác (không hiển thị cho chính mình)
- Channel name: `typing:conversation:{conversationId}`
- Broadcast event: `typing`
- Payload: `{ userId, userName, isTyping: boolean }`

