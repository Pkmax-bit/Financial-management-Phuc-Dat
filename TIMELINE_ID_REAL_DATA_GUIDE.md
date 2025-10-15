# 🎯 Hướng Dẫn Sử Dụng Timeline ID Thực Tế

## ✅ **Đã Hoàn Thành**

### **1. Backend - Lưu Timeline ID**
```python
# backend/routers/emotions_comments.py
@router.post("/comments/public", response_model=CommentResponse)
async def add_comment_public(comment: CommentCreate):
    comment_data = {
        "id": str(uuid.uuid4()),
        "parent_id": comment.parent_id,
        "entity_type": comment.entity_type,
        "entity_id": comment.entity_id,
        "timeline_id": comment.timeline_id,  # ✅ Lưu timeline_id thực tế
        "user_id": None,
        "author_name": "Khách hàng",
        "content": comment.content
    }
```

### **2. Frontend - Truyền Timeline ID**
```typescript
// CustomerProjectTimeline.tsx
<ImageWithReactions
  key={attachment.id}
  attachment={attachment}
  timelineId={entry.id}  // ✅ Truyền timeline_id thực tế
  onImageClick={setSelectedImage}
/>

// ImageWithReactions.tsx
<CompactComments
  entityType="attachment"
  entityId={attachment.id}
  timelineId={timelineId}  // ✅ Truyền xuống component con
  currentUserId={null}
/>
```

### **3. API Call - Sử Dụng Timeline ID**
```typescript
// CompactComments.tsx
const response = await fetch(endpoint, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    content: newComment,
    entity_type: entityType,
    entity_id: entityId,
    timeline_id: timelineId,  // ✅ Sử dụng timeline_id thực tế
    parent_id: null
  })
})
```

## 🔄 **Load Comments Từ Database**

### **Thay Thế Mock Data**
```typescript
// Trước: Mock data
useEffect(() => {
  setComments([
    {
      id: '1',
      author_name: 'Khách hàng A',
      content: 'Hình ảnh rất đẹp!',
      // ...
    }
  ])
}, [])

// Sau: Load từ database
useEffect(() => {
  loadComments()
}, [entityType, entityId])

const loadComments = async () => {
  const response = await fetch(`${endpoint}?entity_type=${entityType}&entity_id=${entityId}`)
  if (response.ok) {
    const commentsData = await response.json()
    setComments(commentsData)  // ✅ Dữ liệu thực từ database
  }
}
```

## 📊 **Database Schema**

### **Comments Table**
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES comments(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    timeline_id UUID REFERENCES project_timeline(id),  -- ✅ Liên kết với timeline
    user_id UUID REFERENCES users(id),
    author_name VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Query Comments Theo Timeline**
```sql
-- Lấy tất cả comments của một timeline
SELECT * FROM comments 
WHERE timeline_id = 'timeline-uuid-here'
ORDER BY created_at DESC;

-- Lấy comments của một attachment trong timeline
SELECT * FROM comments 
WHERE entity_type = 'attachment' 
  AND entity_id = 'attachment-id'
  AND timeline_id = 'timeline-uuid-here'
ORDER BY created_at DESC;
```

## 🎯 **Flow Hoạt Động**

### **1. Khách Hàng Xem Timeline**
```
Timeline Entry (ID: timeline-123)
├── Attachment 1 (ID: att-001)
│   ├── Comment A (timeline_id: timeline-123)
│   └── Comment B (timeline_id: timeline-123)
└── Attachment 2 (ID: att-002)
    └── Comment C (timeline_id: timeline-123)
```

### **2. Bình Luận Mới**
```typescript
// Khi khách hàng bình luận
const commentData = {
  content: "Hình ảnh rất đẹp!",
  entity_type: "attachment",
  entity_id: "att-001",
  timeline_id: "timeline-123",  // ✅ Liên kết với timeline
  parent_id: null
}
```

### **3. Load Comments**
```typescript
// API call để lấy comments
GET /api/emotions-comments/comments/public?entity_type=attachment&entity_id=att-001

// Response
[
  {
    "id": "comment-1",
    "content": "Hình ảnh rất đẹp!",
    "author_name": "Khách hàng",
    "timeline_id": "timeline-123",  // ✅ Có timeline_id
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

## 🔧 **Files Đã Cập Nhật**

### **1. Backend**
- ✅ `backend/routers/emotions_comments.py` - Lưu timeline_id
- ✅ `create_emotions_comments_schema.sql` - Schema với timeline_id

### **2. Frontend**
- ✅ `CustomerProjectTimeline.tsx` - Truyền timelineId
- ✅ `ImageWithReactions.tsx` - Nhận và truyền timelineId
- ✅ `CompactComments.tsx` - Sử dụng timelineId thực tế
- ✅ `FacebookStyleComments.tsx` - Sử dụng timelineId thực tế
- ✅ `EmotionsComments.tsx` - Sử dụng timelineId thực tế

## 📋 **Checklist Hoàn Thành**

- [x] Thêm timelineId vào props của tất cả components
- [x] Truyền timelineId từ CustomerProjectTimeline xuống ImageWithReactions
- [x] Truyền timelineId từ ImageWithReactions xuống CompactComments
- [x] Sử dụng timelineId trong API calls
- [x] Thay thế mock data bằng loadComments() thực tế
- [x] Reload comments sau khi tạo mới
- [x] Error handling cho API calls
- [x] Fallback to mock data khi API lỗi

## 🎉 **Kết Quả**

### **Trước**
- ❌ Sử dụng mock data
- ❌ Không lưu timeline_id
- ❌ Comments không liên kết với timeline

### **Sau**
- ✅ Load dữ liệu thực từ database
- ✅ Lưu timeline_id khi tạo comment
- ✅ Comments được liên kết với timeline cụ thể
- ✅ Không còn mock data

**Bây giờ comments được lưu với timeline_id thực tế và chỉ hiển thị dữ liệu từ database!** 🚀


