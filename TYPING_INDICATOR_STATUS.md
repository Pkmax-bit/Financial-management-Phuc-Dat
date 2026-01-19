# Trạng Thái Typing Indicator và Presence trong Code

## Tổng Quan

### ✅ CÓ Typing Indicator (Realtime)
**File:** `frontend/src/components/projects/ProjectTasksTab.tsx`

### ❌ KHÔNG CÓ Typing Indicator
**File:** `frontend/src/components/chat/InternalChat.tsx`
**File:** `frontend/src/components/chat/ChatWidget.tsx`

---

## 1. ProjectTasksTab.tsx - CÓ Typing Indicator (Realtime)

### Cách Hoạt Động

#### A. Broadcast Typing Status (Gửi)
Khi user gõ vào input, code sẽ:
1. **Throttle**: Chỉ broadcast mỗi 1 giây để tránh spam
2. **Broadcast**: Gửi event `typing` qua Supabase Broadcast
3. **Auto-stop**: Tự động gửi `isTyping: false` sau 2 giây không gõ

**Code:**
```typescript
// Khi user gõ (line 1312-1350)
const handleChatMessageChange = (value: string) => {
  setChatMessage(value)
  
  if (value.trim().length > 0 && selectedTaskId && user && typingChannelRef.current) {
    const now = Date.now()
    // Throttle: only broadcast every 1 second
    if (now - lastTypingBroadcastRef.current > 1000) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          userName: user.full_name || user.email || 'Người dùng',
          taskId: selectedTaskId,
          isTyping: true
        }
      })
    }
    
    // Auto-stop after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          userName: user.full_name || user.email || 'Người dùng',
          taskId: selectedTaskId,
          isTyping: false
        }
      })
    }, 2000)
  }
}
```

#### B. Listen Typing Events (Nhận)
Code lắng nghe broadcast events từ users khác:

**Code:**
```typescript
// Line 969-993
typingChannel
  .on('broadcast', { event: 'typing' }, (payload) => {
    const { userId, userName, taskId: typingTaskId, isTyping: typingStatus } = payload.payload as any
    
    // Only show typing indicator for other users and if they're typing in the selected task
    if (userId !== user.id && typingTaskId === selectedTaskId && typingStatus) {
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        newMap.set(userId, {
          userId,
          userName: userName || 'Người dùng',
          timestamp: Date.now()
        })
        return newMap
      })
    } else if (userId !== user.id && (!typingStatus || typingTaskId !== selectedTaskId)) {
      // Remove typing indicator when user stops typing
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        newMap.delete(userId)
        return newMap
      })
    }
  })
```

#### C. Hiển Thị UI
**Code:**
```typescript
// Line 4043-4050
{typingUsers.size > 0 && Array.from(typingUsers.values()).map((typingUser) => {
  const member = groupMembersRef.current.find(m => m.employee_id === typingUser.userId)
  const displayName = member?.employee_name || typingUser.userName || 'Người dùng'
  
  return (
    <div key={typingUser.userId} className="flex w-full justify-start mb-1">
      <span className="text-sm text-gray-500 italic">
        {displayName} đang soạn...
      </span>
    </div>
  )
})}
```

### Channel Setup
```typescript
// Line ~950
const typingChannel = supabase.channel(`task:${projectId}:typing`, {
  config: {
    broadcast: {
      self: false, // Không nhận broadcast của chính mình
      ack: false
    }
  }
})
```

### Tính Năng
- ✅ **Realtime**: Dùng Supabase Broadcast
- ✅ **Throttle**: Chỉ broadcast mỗi 1 giây
- ✅ **Auto-stop**: Tự động dừng sau 2 giây
- ✅ **Task-specific**: Chỉ hiển thị cho task đang chọn
- ✅ **Multi-user**: Hỗ trợ nhiều users typing cùng lúc
- ✅ **Cleanup**: Tự động xóa typing indicator cũ (>3 giây)

---

## 2. InternalChat.tsx - KHÔNG CÓ Typing Indicator

### Trạng Thái Hiện Tại
- ❌ Không có typing indicator
- ❌ Không có presence (ai đang online)
- ✅ Có realtime messages (đã implement)

### Code Hiện Tại
Chỉ có realtime messages qua `useRealtimeChat` hook:
```typescript
const { isConnected, connectionStatus, error: realtimeError } = useRealtimeChat({
  conversationId: selectedConversation?.id || null,
  currentUserId,
  onNewMessage: handleNewMessage,
  onMessageUpdate: handleMessageUpdate,
  onMessageDelete: handleMessageDelete,
})
```

**Không có:**
- Typing indicator
- Presence tracking
- Online/offline status

---

## 3. ChatWidget.tsx - KHÔNG CÓ Typing Indicator

Tương tự như `InternalChat.tsx`, chỉ có realtime messages, không có typing indicator.

---

## So Sánh

| Feature | ProjectTasksTab | InternalChat | ChatWidget |
|---------|----------------|--------------|------------|
| **Realtime Messages** | ✅ Có | ✅ Có | ✅ Có |
| **Typing Indicator** | ✅ Có | ❌ Không | ❌ Không |
| **Presence (Online)** | ❌ Không | ❌ Không | ❌ Không |
| **Broadcast Method** | Client-side | Database trigger | Database trigger |

---

## Kết Luận

### ✅ Đã Có (ProjectTasksTab)
- Typing indicator realtime hoạt động tốt
- Dùng client-side broadcast
- Throttle và auto-stop

### ❌ Chưa Có (InternalChat & ChatWidget)
- Typing indicator
- Presence/Online status

### Cần Implement
Để thêm typing indicator vào `InternalChat.tsx` và `ChatWidget.tsx`, cần:

1. **Tạo typing channel** (tương tự ProjectTasksTab)
2. **Broadcast typing status** khi user gõ
3. **Listen typing events** từ users khác
4. **Hiển thị UI** "X đang soạn..."
5. **Auto-stop** sau 2 giây không gõ

Có thể tái sử dụng logic từ `ProjectTasksTab.tsx` và adapt cho chat conversations.


