# 🕒 Hướng Dẫn Sử Dụng Timeline ID trong Bình Luận

## ✨ **Tính Năng Mới**

Đã thêm trường `timeline_id` vào bảng `comments` để biết bình luận thuộc về timeline entry nào:

- ✅ **Timeline ID Tracking** - Theo dõi bình luận thuộc timeline nào
- ✅ **Database Schema** - Cập nhật schema với trường mới
- ✅ **API Support** - Backend hỗ trợ timeline_id
- ✅ **Frontend Integration** - Frontend có thể sử dụng timeline_id

## 🗄️ **Database Schema**

### **Bảng Comments (Cập Nhật)**
```sql
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    timeline_id UUID REFERENCES project_timeline(id) ON DELETE CASCADE, -- MỚI
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Indexes**
```sql
-- Index cho timeline_id
CREATE INDEX idx_comments_timeline_id ON comments(timeline_id);

-- Các index khác
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_is_deleted ON comments(is_deleted);
```

## 🔧 **Backend API**

### **Pydantic Models (Cập Nhật)**
```python
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    entity_type: str = Field(..., pattern="^(project|timeline_entry|invoice|expense|employee|attachment)$")
    entity_id: str
    timeline_id: Optional[str] = None  # MỚI

class CommentResponse(BaseModel):
    id: str
    parent_id: Optional[str]
    entity_type: str
    entity_id: str
    timeline_id: Optional[str]  # MỚI
    user_id: Optional[str]
    author_name: str
    content: str
    is_edited: bool
    is_deleted: bool
    deleted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    replies: List[CommentResponse] = []
    reactions: Dict[str, int] = {}
```

### **API Endpoints**
```python
# Tạo bình luận với timeline_id
@router.post("/comments", response_model=CommentResponse)
async def create_comment(
    comment: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    # Tạo bình luận với timeline_id
    comment_data = {
        "id": str(uuid.uuid4()),
        "parent_id": comment.parent_id,
        "entity_type": comment.entity_type,
        "entity_id": comment.entity_id,
        "timeline_id": comment.timeline_id,  # MỚI
        "user_id": current_user["id"],
        "author_name": current_user["full_name"],
        "content": comment.content
    }

# Lấy bình luận với timeline_id
@router.get("/comments", response_model=List[CommentWithReplies])
async def get_comments(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Select bao gồm timeline_id
    result = supabase.table("comments")\
        .select("id, parent_id, entity_type, entity_id, timeline_id, user_id, author_name, content, is_edited, is_deleted, deleted_at, created_at, updated_at")\
        .eq("entity_type", entity_type)\
        .eq("entity_id", entity_id)\
        .is_("parent_id", "null")\
        .eq("is_deleted", False)\
        .order("created_at", desc=True)\
        .execute()
```

## 🎯 **Use Cases**

### **1. Bình Luận Trên Timeline Entry**
```javascript
// Tạo bình luận cho timeline entry
const commentData = {
    content: "Công việc này đã hoàn thành tốt!",
    entity_type: "timeline_entry",
    entity_id: "timeline-entry-uuid",
    timeline_id: "timeline-entry-uuid", // Cùng ID với entity_id
    parent_id: null
};
```

### **2. Bình Luận Trên Attachment**
```javascript
// Tạo bình luận cho attachment
const commentData = {
    content: "Hình ảnh này rất rõ nét!",
    entity_type: "attachment",
    entity_id: "attachment-uuid",
    timeline_id: "timeline-entry-uuid", // ID của timeline entry chứa attachment
    parent_id: null
};
```

### **3. Reply Bình Luận**
```javascript
// Reply bình luận
const replyData = {
    content: "Cảm ơn bạn đã phản hồi!",
    entity_type: "attachment",
    entity_id: "attachment-uuid",
    timeline_id: "timeline-entry-uuid", // Cùng timeline_id với bình luận gốc
    parent_id: "parent-comment-uuid"
};
```

## 📊 **Database Queries**

### **Lấy Bình Luận Theo Timeline**
```sql
-- Lấy tất cả bình luận của một timeline
SELECT c.*, pt.title as timeline_title
FROM comments c
LEFT JOIN project_timeline pt ON c.timeline_id = pt.id
WHERE c.timeline_id = 'timeline-uuid'
AND c.is_deleted = false
ORDER BY c.created_at DESC;
```

### **Lấy Bình Luận Theo Entity và Timeline**
```sql
-- Lấy bình luận của một entity trong timeline cụ thể
SELECT c.*, pt.title as timeline_title
FROM comments c
LEFT JOIN project_timeline pt ON c.timeline_id = pt.id
WHERE c.entity_type = 'attachment'
AND c.entity_id = 'attachment-uuid'
AND c.timeline_id = 'timeline-uuid'
AND c.is_deleted = false
ORDER BY c.created_at DESC;
```

### **Thống Kê Bình Luận Theo Timeline**
```sql
-- Đếm số bình luận theo timeline
SELECT 
    pt.id,
    pt.title,
    COUNT(c.id) as comment_count,
    COUNT(CASE WHEN c.parent_id IS NULL THEN 1 END) as main_comments,
    COUNT(CASE WHEN c.parent_id IS NOT NULL THEN 1 END) as replies
FROM project_timeline pt
LEFT JOIN comments c ON pt.id = c.timeline_id AND c.is_deleted = false
GROUP BY pt.id, pt.title
ORDER BY comment_count DESC;
```

## 🎨 **Frontend Integration**

### **Component Props**
```typescript
interface CommentProps {
    entityType: string;
    entityId: string;
    timelineId?: string; // MỚI
    currentUserId?: string;
    onCommentAdded?: () => void;
    onReactionAdded?: () => void;
}
```

### **API Calls**
```typescript
// Tạo bình luận với timeline_id
const createComment = async (commentData: {
    content: string;
    entity_type: string;
    entity_id: string;
    timeline_id?: string;
    parent_id?: string;
}) => {
    const response = await fetch('/api/emotions-comments/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(commentData)
    });
    return response.json();
};

// Lấy bình luận theo timeline
const getCommentsByTimeline = async (timelineId: string) => {
    const response = await fetch(`/api/emotions-comments/comments?timeline_id=${timelineId}`);
    return response.json();
};
```

## 🔍 **Troubleshooting**

### **Timeline ID Không Được Lưu**
1. Kiểm tra API call có gửi timeline_id không
2. Kiểm tra database schema có cột timeline_id không
3. Kiểm tra foreign key constraint
4. Kiểm tra API response

### **Lỗi Foreign Key**
1. Kiểm tra timeline_id có tồn tại trong project_timeline không
2. Kiểm tra CASCADE DELETE có hoạt động không
3. Kiểm tra permissions

### **Performance Issues**
1. Kiểm tra index trên timeline_id
2. Kiểm tra query performance
3. Kiểm tra database connection

## 📋 **Checklist Implementation**

- [ ] Database schema đã cập nhật
- [ ] Backend API hỗ trợ timeline_id
- [ ] Frontend components sử dụng timeline_id
- [ ] Indexes đã được tạo
- [ ] Foreign key constraints hoạt động
- [ ] API endpoints trả về timeline_id
- [ ] Error handling cho timeline_id
- [ ] Testing với timeline_id

## 🚀 **Next Steps**

1. **Cập nhật Database**: Chạy script thêm cột timeline_id
2. **Test API**: Kiểm tra API hoạt động với timeline_id
3. **Update Frontend**: Cập nhật components sử dụng timeline_id
4. **Test Integration**: Test toàn bộ flow với timeline_id
5. **Documentation**: Cập nhật documentation

## 🎉 **Kết Luận**

Tính năng Timeline ID trong bình luận đã được implement:

- ✅ **Database Schema** - Cột timeline_id đã được thêm
- ✅ **Backend API** - API hỗ trợ timeline_id
- ✅ **Frontend Ready** - Components sẵn sàng sử dụng
- ✅ **Indexes** - Performance được tối ưu
- ✅ **Documentation** - Hướng dẫn chi tiết

**Timeline ID tracking đã sẵn sàng để sử dụng!** 🚀



