# Supabase Realtime - Tài Liệu Chi Tiết

Tài liệu này giải thích chi tiết về công nghệ Supabase Realtime, cách hoạt động, các tính năng, và cách sử dụng trong dự án.

## 📋 Mục Lục

1. [Tổng quan về Supabase Realtime](#1-tổng-quan-về-supabase-realtime)
2. [Kiến trúc và Cách Hoạt Động](#2-kiến-trúc-và-cách-hoạt-động)
3. [Các Tính Năng Chính](#3-các-tính-năng-chính)
4. [Setup và Cấu Hình](#4-setup-và-cấu-hình)
5. [Implementation trong Dự Án](#5-implementation-trong-dự-án)
6. [Best Practices](#6-best-practices)
7. [Performance và Scaling](#7-performance-và-scaling)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Tổng quan về Supabase Realtime

### 1.1 Realtime là gì?

**Supabase Realtime** là một dịch vụ **globally distributed** cho phép:
- ✅ Gửi/nhận messages giữa các clients qua WebSocket
- ✅ Lắng nghe thay đổi database (INSERT, UPDATE, DELETE) real-time
- ✅ Broadcast messages giữa nhiều clients
- ✅ Track user presence (online/offline, typing indicators)

### 1.2 Công nghệ nền tảng

- **Elixir & Phoenix Framework**: Xử lý hàng triệu connections đồng thời
- **PostgreSQL Replication**: Stream database changes từ WAL (Write-Ahead Log)
- **WebSocket**: Persistent bidirectional connections
- **Phoenix Channels**: PubSub model cho message distribution
- **CRDT**: Conflict-free Replicated Data Type cho Presence

### 1.3 Ưu điểm so với các giải pháp khác

| Tính năng | Supabase Realtime | WebSocket tự build | Socket.io | Firebase |
|-----------|-------------------|-------------------|-----------|----------|
| **Setup** | ⭐⭐⭐⭐⭐ Dễ | ⭐⭐ Phức tạp | ⭐⭐⭐ Trung bình | ⭐⭐⭐⭐ Dễ |
| **Database Integration** | ⭐⭐⭐⭐⭐ Tự động | ❌ Không | ❌ Không | ⭐⭐⭐⭐ Tốt |
| **RLS Security** | ⭐⭐⭐⭐⭐ Built-in | ❌ Tự implement | ❌ Tự implement | ⭐⭐⭐⭐ Tốt |
| **Scalability** | ⭐⭐⭐⭐⭐ Global cluster | ⭐⭐ Tự scale | ⭐⭐⭐ Tốt | ⭐⭐⭐⭐⭐ Tốt |
| **Cost** | ⭐⭐⭐⭐ Hợp lý | ⭐⭐⭐ Tự maintain | ⭐⭐⭐ Tự maintain | ⭐⭐ Đắt |
| **Latency** | ⭐⭐⭐⭐⭐ Thấp | ⭐⭐⭐⭐⭐ Thấp | ⭐⭐⭐⭐⭐ Thấp | ⭐⭐⭐⭐ Tốt |

---

## 2. Kiến trúc và Cách Hoạt Động

### 2.1 Kiến trúc tổng thể

```
┌─────────────┐
│   Client 1  │◄──────┐
└──────┬──────┘       │
       │ WebSocket   │
       │             │
┌──────▼─────────────▼──────┐
│   Supabase Realtime      │
│   (Elixir/Phoenix)       │
│   ┌──────────────────┐   │
│   │  Phoenix PubSub  │   │
│   │  (PG2 Adapter)   │   │
│   └──────────────────┘   │
└──────┬───────────────────┘
       │
       │ PostgreSQL Replication
       │ (Logical Replication Slot)
       │
┌──────▼──────┐
│  PostgreSQL │
│  Database   │
└─────────────┘
```

### 2.2 Cách hoạt động

#### A. Postgres Changes (Database Replication)

1. **Client subscribe** đến table changes:
   ```typescript
   channel.on('postgres_changes', {
     event: 'INSERT',
     table: 'task_comments'
   }, callback)
   ```

2. **Realtime cluster** tạo **logical replication slot** trên PostgreSQL

3. **PostgreSQL** stream changes từ **WAL (Write-Ahead Log)** đến Realtime

4. **Realtime** filter và route messages đến subscribed clients

5. **Client** nhận updates qua WebSocket

#### B. Broadcast (Client-to-Client)

1. **Client A** gửi broadcast message:
   ```typescript
   channel.send({
     type: 'broadcast',
     event: 'typing',
     payload: { userId: '123', isTyping: true }
   })
   ```

2. **Realtime cluster** route message đến tất cả clients trong channel

3. **Client B, C, D...** nhận message qua WebSocket

#### C. Presence (Shared State)

1. **Client** track và sync state:
   ```typescript
   channel.track({ online: true, typing: false })
   ```

2. **Realtime** maintain CRDT (Conflict-free Replicated Data Type)

3. **All clients** receive presence updates

### 2.3 Global Cluster

- **Multi-region**: Clients có thể connect đến node gần nhất
- **Automatic routing**: Messages được route qua shortest path
- **High availability**: Nhiều nodes, tự động failover

---

## 3. Các Tính Năng Chính

### 3.1 Postgres Changes

**Mục đích**: Lắng nghe thay đổi database real-time

**Use cases**:
- ✅ Chat messages (INSERT new messages)
- ✅ Live notifications (INSERT notifications)
- ✅ Real-time dashboards (UPDATE metrics)

**Code Example**:
```typescript
const channel = supabase
  .channel('project-comments')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'task_comments',
    filter: 'task_id=eq.123' // Optional filter
  }, (payload) => {
    console.log('New comment:', payload.new)
  })
  .subscribe()
```

**Lưu ý**:
- ⚠️ Supabase không hỗ trợ `IN` filter, phải filter trong callback
- ⚠️ Mỗi change event phải check RLS policy → có thể bottleneck
- ⚠️ Database changes processed trên single thread → maintain order

### 3.2 Broadcast

**Mục đích**: Gửi messages giữa clients (không qua database)

**Use cases**:
- ✅ Typing indicators
- ✅ Cursor tracking
- ✅ Game events
- ✅ Custom notifications

**Code Example**:
```typescript
// Listen
channel
  .on('broadcast', { event: 'typing' }, (payload) => {
    console.log('User typing:', payload.payload)
  })
  .subscribe()

// Send
channel.send({
  type: 'broadcast',
  event: 'typing',
  payload: {
    userId: user.id,
    isTyping: true
  }
})
```

**Ưu điểm**:
- ✅ Low latency (không qua database)
- ✅ Không tốn database resources
- ✅ Perfect cho high-frequency updates

### 3.3 Presence

**Mục đích**: Track và sync shared state (online/offline, typing, etc.)

**Use cases**:
- ✅ Online/offline status
- ✅ Active user counters
- ✅ Shared cursors

**Code Example**:
```typescript
// Track presence
channel.track({
  online: true,
  typing: false,
  userId: user.id
})

// Listen to presence changes
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  console.log('Online users:', state)
})
```

**Lưu ý**:
- ⚠️ Presence có computational overhead → dùng ít
- ⚠️ CRDT sync có thể tốn bandwidth

---

## 4. Setup và Cấu Hình

### 4.1 Enable Realtime cho Table

**Bước 1**: Vào Supabase Dashboard → Database → Replication

**Bước 2**: Enable Realtime cho table `task_comments`

**Hoặc dùng SQL**:
```sql
-- Enable Realtime for table
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
```

### 4.2 Setup RLS Policies

**Bắt buộc** cho Postgres Changes và Broadcast:

```sql
-- Allow authenticated users to SELECT (receive broadcasts)
CREATE POLICY "authenticated_users_can_receive" 
ON realtime.messages
FOR SELECT TO authenticated 
USING (true);

-- Allow authenticated users to INSERT (send broadcasts)
CREATE POLICY "authenticated_users_can_send" 
ON realtime.messages
FOR INSERT TO authenticated 
WITH CHECK (true);

-- Allow SELECT on task_comments for authenticated users
CREATE POLICY "users_can_read_comments"
ON task_comments
FOR SELECT TO authenticated
USING (true);
```

### 4.3 Initialize Client

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## 5. Implementation trong Dự Án

### 5.1 Channel 1: Database Changes (Messages)

**File**: `frontend/src/components/projects/ProjectTasksTab.tsx`

```typescript
// Subscribe to INSERT, UPDATE, DELETE events
const channel = supabase
  .channel(`project-comments-${projectId}`, {
    config: {
      broadcast: { self: true },
      presence: { key: projectId }
    }
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'task_comments'
  }, (payload) => {
    const newComment = payload.new
    const taskId = newComment?.task_id
    
    // Filter by task_id (Supabase doesn't support IN filter)
    if (taskId && taskIds.includes(taskId)) {
      // Handle new comment
      setAllComments(prev => [...prev, newComment])
    }
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    table: 'task_comments'
  }, (payload) => {
    // Handle update
    fetchAllComments(true)
  })
  .on('postgres_changes', {
    event: 'DELETE',
    table: 'task_comments'
  }, (payload) => {
    // Handle delete
    fetchAllComments(true)
  })
  .subscribe()
```

**Tối ưu**:
- ✅ Subscribe riêng cho từng event type (tránh "mismatch" error)
- ✅ Filter trong callback (vì không hỗ trợ IN filter)
- ✅ Handle optimistic messages (replace temp messages với real ones)

### 5.2 Channel 2: Typing Indicators (Broadcast)

```typescript
// Create typing channel
const typingChannel = supabase.channel(`typing:project:${projectId}`, {
  config: {
    presence: { key: user.id }
  }
})

// Listen for typing events
typingChannel
  .on('broadcast', { event: 'typing' }, (payload) => {
    const { userId, userName, taskId, isTyping } = payload.payload
    
    // Only show for other users
    if (userId !== user.id && taskId === selectedTaskId && isTyping) {
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        newMap.set(userId, { userId, userName, timestamp: Date.now() })
        return newMap
      })
    }
  })
  .subscribe()

// Broadcast typing status (throttled)
if (now - lastTypingBroadcastRef.current > 1000) {
  typingChannel.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      userId: user.id,
      userName: user.full_name,
      taskId: selectedTaskId,
      isTyping: true
    }
  })
}
```

**Tối ưu**:
- ✅ Throttle broadcasts (1 giây) để tránh spam
- ✅ Chỉ hiển thị cho người khác (không hiển thị cho chính mình)
- ✅ Auto cleanup sau 3 giây không có update

---

## 6. Best Practices

### 6.1 Channel Naming

**Pattern**: `scope:id:entity`

```typescript
// ✅ Good
'project-comments-123'
'typing:project:123'
'room:456:messages'

// ❌ Bad
'channel1'
'comments'
'typing'
```

### 6.2 Use Private Channels

```typescript
// ✅ Recommended for production
const channel = supabase.channel('room:123:messages', {
  config: { private: true }
})
```

### 6.3 Cleanup Subscriptions

```typescript
useEffect(() => {
  const channel = supabase.channel('room:123:messages')
  
  return () => {
    supabase.removeChannel(channel) // ✅ Always cleanup
  }
}, [])
```

### 6.4 Throttle Broadcasts

```typescript
// ✅ Throttle để tránh spam
const lastBroadcast = useRef(0)

if (Date.now() - lastBroadcast.current > 1000) {
  channel.send({ ... })
  lastBroadcast.current = Date.now()
}
```

### 6.5 Handle Reconnection

```typescript
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected')
  } else if (status === 'CHANNEL_ERROR') {
    console.error('Error, retrying...')
    // Supabase tự động retry
  } else if (status === 'TIMED_OUT') {
    console.warn('Timeout, reconnecting...')
  }
})
```

### 6.6 Optimistic UI

```typescript
// ✅ Hiển thị message ngay, không đợi server
setAllComments(prev => [...prev, optimisticMessage])

// ✅ Replace với real message khi nhận được
channel.on('postgres_changes', { event: 'INSERT' }, (payload) => {
  // Remove optimistic, add real
  setAllComments(prev => 
    prev.filter(m => !m.id.startsWith('temp-'))
      .concat(payload.new)
  )
})
```

---

## 7. Performance và Scaling

### 7.1 Benchmarks (từ Supabase Docs)

**Broadcast Performance**:
- ✅ **32,000 concurrent users**
- ✅ **224,000 messages/sec** throughput
- ✅ **6ms median latency**
- ✅ **28ms p95 latency**

**Postgres Changes**:
- ⚠️ **Bottleneck ở database**: Mỗi change phải check RLS
- ⚠️ **Single thread**: Maintain order → không scale với compute
- ⚠️ **Estimate throughput**: Dựa trên database performance

### 7.2 Scaling Considerations

**Postgres Changes**:
- ❌ Không scale tốt với nhiều users
- ✅ Dùng cho development hoặc low-traffic
- ✅ Nên migrate sang Broadcast cho production

**Broadcast**:
- ✅ Scale tốt (32K+ concurrent users)
- ✅ Low latency
- ✅ Perfect cho high-frequency updates

**Recommendation**:
```typescript
// ❌ Avoid: Postgres Changes với nhiều users
channel.on('postgres_changes', { table: 'messages' }, ...)

// ✅ Better: Broadcast từ database trigger
// Backend trigger broadcasts khi INSERT
channel.on('broadcast', { event: 'new_message' }, ...)
```

### 7.3 Database Trigger for Broadcast

**Thay vì Postgres Changes, dùng Broadcast từ trigger**:

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION broadcast_message_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'project:' || NEW.project_id::text || ':messages',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger
CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION broadcast_message_changes();
```

**Frontend**:
```typescript
// Listen to broadcast instead of postgres_changes
channel
  .on('broadcast', { event: 'INSERT' }, (payload) => {
    // Handle new message
  })
  .subscribe()
```

---

## 8. Troubleshooting

### 8.1 Realtime không hoạt động

**Checklist**:

1. **Realtime enabled?**
   - Dashboard → Database → Replication
   - Enable cho table `task_comments`

2. **RLS Policies?**
   ```sql
   -- Check policies
   SELECT * FROM pg_policies WHERE tablename = 'task_comments';
   ```

3. **Authentication?**
   ```typescript
   const { data: { session } } = await supabase.auth.getSession()
   console.log('Session:', session) // Should not be null
   ```

4. **Subscription status?**
   ```typescript
   channel.subscribe((status) => {
     console.log('Status:', status) // Should be 'SUBSCRIBED'
   })
   ```

### 8.2 "Mismatch between server and client bindings"

**Nguyên nhân**: Subscribe với `event: '*'` không được hỗ trợ

**Fix**: Subscribe riêng cho từng event type:
```typescript
// ❌ Bad
.on('postgres_changes', { event: '*', table: 'task_comments' }, ...)

// ✅ Good
.on('postgres_changes', { event: 'INSERT', table: 'task_comments' }, ...)
.on('postgres_changes', { event: 'UPDATE', table: 'task_comments' }, ...)
.on('postgres_changes', { event: 'DELETE', table: 'task_comments' }, ...)
```

### 8.3 Typing indicator không hiển thị

**Checklist**:

1. **Channel subscribed?**
   ```typescript
   typingChannel.subscribe((status) => {
     console.log('Typing channel status:', status)
   })
   ```

2. **Broadcast sent?**
   ```typescript
   // Check if message is sent
   typingChannel.send({ ... })
   ```

3. **Filter correct?**
   ```typescript
   // Make sure taskId matches
   if (typingTaskId === selectedTaskId && isTyping) {
     // Show indicator
   }
   ```

### 8.4 High Latency

**Causes**:
- Database RLS checks (Postgres Changes)
- Network distance
- High message volume

**Solutions**:
- ✅ Migrate từ Postgres Changes sang Broadcast
- ✅ Use database triggers để broadcast
- ✅ Throttle broadcasts
- ✅ Use regional Realtime nodes

---

## 📚 Tài Liệu Tham Khảo

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture)
- [Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)
- [Getting Started](https://supabase.com/docs/guides/realtime/getting_started)
- [Broadcast Guide](https://supabase.com/docs/guides/realtime/broadcast)
- [Presence Guide](https://supabase.com/docs/guides/realtime/presence)
- [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)

---

## 🎯 Tóm Tắt

### Supabase Realtime là gì?
- **Globally distributed** Elixir/Phoenix cluster
- **WebSocket-based** real-time communication
- **3 tính năng chính**: Postgres Changes, Broadcast, Presence

### Khi nào dùng gì?
- **Postgres Changes**: Development, low-traffic
- **Broadcast**: Production, high-frequency updates, typing indicators
- **Presence**: Online status, user counters

### Best Practices:
1. ✅ Use private channels
2. ✅ Follow naming conventions
3. ✅ Always cleanup subscriptions
4. ✅ Throttle broadcasts
5. ✅ Handle reconnection
6. ✅ Use optimistic UI

### Performance:
- **Broadcast**: 32K+ users, 224K msgs/sec, 6ms latency
- **Postgres Changes**: Bottleneck ở database RLS

---

**Tác giả**: Auto (AI Assistant)  
**Ngày tạo**: 2024  
**Phiên bản**: 1.0



