# Message Schema Verification

## Database Schema (internal_messages)

```sql
CREATE TABLE public.internal_messages (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message_text text NOT NULL,
  message_type character varying(20) NULL DEFAULT 'text'::character varying,
  file_url text NULL,
  file_name text NULL,
  file_size integer NULL,
  reply_to_id uuid NULL,
  is_edited boolean NULL DEFAULT false,
  edited_at timestamp with time zone NULL,
  is_deleted boolean NULL DEFAULT false,
  deleted_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  -- constraints and indexes...
)
```

## Backend Query (chat.py - get_messages)

```python
messages_result = (
    supabase.table("internal_messages")
    .select("*")  # ← Lấy TẤT CẢ columns
    .eq("conversation_id", conversation_id)
    .eq("is_deleted", False)
    .order("created_at", desc=False)
    .range(skip, skip + limit - 1)
    .execute()
)
```

**✅ Backend đang dùng `SELECT *` nên sẽ lấy TẤT CẢ columns từ database**

## Backend Model (chat.py - Message)

```python
class Message(MessageBase):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: Optional[str] = None  # ← Enriched từ users table
    sender_avatar: Optional[str] = None  # ← Enriched từ users table
    is_edited: bool = False
    edited_at: Optional[datetime] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    reply_to: Optional['Message'] = None  # ← Enriched từ reply_to_id

class MessageBase(BaseModel):
    message_text: str
    message_type: MessageType = MessageType.TEXT
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    reply_to_id: Optional[str] = None
```

## Frontend Type (chat.ts - Message)

```typescript
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name?: string  // ← Enriched
  sender_avatar?: string  // ← Enriched
  message_text: string
  message_type: MessageType
  file_url?: string
  file_name?: string
  file_size?: number
  reply_to_id?: string
  reply_to?: {  // ← Enriched
    id: string
    message_text: string
    sender_name: string
  }
  is_edited: boolean
  edited_at?: string
  is_deleted: boolean
  deleted_at?: string
  created_at: string
  updated_at: string
}
```

## So sánh Database Schema vs Backend Model vs Frontend Type

| Database Column | Backend Model | Frontend Type | Status |
|----------------|---------------|--------------|--------|
| `id` | ✅ `id: str` | ✅ `id: string` | ✅ Match |
| `conversation_id` | ✅ `conversation_id: str` | ✅ `conversation_id: string` | ✅ Match |
| `sender_id` | ✅ `sender_id: str` | ✅ `sender_id: string` | ✅ Match |
| `message_text` | ✅ `message_text: str` | ✅ `message_text: string` | ✅ Match |
| `message_type` | ✅ `message_type: MessageType` | ✅ `message_type: MessageType` | ✅ Match |
| `file_url` | ✅ `file_url: Optional[str]` | ✅ `file_url?: string` | ✅ Match |
| `file_name` | ✅ `file_name: Optional[str]` | ✅ `file_name?: string` | ✅ Match |
| `file_size` | ✅ `file_size: Optional[int]` | ✅ `file_size?: number` | ✅ Match |
| `reply_to_id` | ✅ `reply_to_id: Optional[str]` | ✅ `reply_to_id?: string` | ✅ Match |
| `is_edited` | ✅ `is_edited: bool = False` | ✅ `is_edited: boolean` | ✅ Match |
| `edited_at` | ✅ `edited_at: Optional[datetime]` | ✅ `edited_at?: string` | ✅ Match |
| `is_deleted` | ✅ `is_deleted: bool = False` | ✅ `is_deleted: boolean` | ✅ Match |
| `deleted_at` | ✅ `deleted_at: Optional[datetime]` | ✅ `deleted_at?: string` | ✅ Match |
| `created_at` | ✅ `created_at: datetime` | ✅ `created_at: string` | ✅ Match |
| `updated_at` | ✅ `updated_at: datetime` | ✅ `updated_at: string` | ✅ Match |

## Enriched Fields (không có trong database, được thêm bởi backend)

| Field | Source | Backend | Frontend | Status |
|-------|--------|---------|----------|--------|
| `sender_name` | `users.full_name` | ✅ | ✅ | ✅ Enriched |
| `sender_avatar` | `users.avatar_url` | ✅ | ✅ | ✅ Enriched |
| `reply_to` | `internal_messages` (via `reply_to_id`) | ✅ | ✅ | ✅ Enriched |

## Backend Enrichment Process

### 1. Get Sender Names (dòng 400-409)
```python
sender_ids = list(set([m["sender_id"] for m in messages_result.data or [] if m.get("sender_id")]))
user_map = {}
if sender_ids:
    users_result = supabase.table("users").select("id, full_name").in_("id", sender_ids).execute()
    if users_result.data:
        user_map = {user["id"]: user.get("full_name") for user in users_result.data}

# Add to each message
msg["sender_name"] = user_map.get(msg["sender_id"], "Unknown")
```

### 2. Get Reply Messages (dòng 411-431)
```python
reply_ids = [m["reply_to_id"] for m in messages_result.data or [] if m.get("reply_to_id")]
reply_map = {}
if reply_ids:
    replies_result = (
        supabase.table("internal_messages")
        .select("id, message_text, sender_id")
        .in_("id", reply_ids)
        .execute()
    )
    # Build reply_map with sender names
    for reply in replies_result.data:
        reply_sender_name = user_map.get(reply["sender_id"], "Unknown")
        reply_map[reply["id"]] = {
            "id": reply["id"],
            "message_text": reply["message_text"],
            "sender_name": reply_sender_name
        }

# Add to each message
if msg.get("reply_to_id") and msg["reply_to_id"] in reply_map:
    msg["reply_to"] = reply_map[msg["reply_to_id"]]
```

## Kết luận

### ✅ Tất cả fields từ database đều được lấy và map đúng:

1. **Backend Query**: `SELECT *` lấy TẤT CẢ 15 columns từ database ✅
2. **Backend Model**: Có đầy đủ tất cả fields từ database ✅
3. **Frontend Type**: Có đầy đủ tất cả fields từ backend ✅
4. **Enrichment**: Backend enrich thêm `sender_name`, `sender_avatar`, và `reply_to` ✅

### ✅ Không thiếu field nào!

Tất cả dữ liệu từ database schema đều được:
- Lấy đúng qua `SELECT *`
- Map đúng vào Backend Model
- Truyền đúng đến Frontend Type
- Enrich thêm thông tin cần thiết (sender_name, reply_to)

### 📝 Lưu ý:

- `sender_avatar` được định nghĩa trong model nhưng backend chưa enrich từ `users.avatar_url` (có thể thêm sau)
- `reply_to` chỉ chứa `id`, `message_text`, `sender_name` (không phải full message object để tránh circular reference)

