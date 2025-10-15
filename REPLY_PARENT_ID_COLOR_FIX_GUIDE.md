# 💬 Hướng Dẫn Sửa Reply và Màu Chữ

## ✅ **Đã Hoàn Thành**

### **1. Lưu Parent ID Khi Reply**
```typescript
// CompactComments.tsx - handleSubmitReply
const response = await fetch(endpoint, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    content: replyText,
    entity_type: entityType,
    entity_id: entityId,
    timeline_id: timelineId, // Sử dụng timeline_id thực tế
    parent_id: parentId // ✅ Lưu parent_id của comment gốc
  })
})
```

### **2. Màu Chữ Rõ Ràng và Đen**
```typescript
// Input field cho reply
<input
  type="text"
  value={replyText}
  onChange={(e) => setReplyText(e.target.value)}
  placeholder="Trả lời..."
  className="w-full bg-transparent text-xs outline-none placeholder-gray-500 text-black font-medium"
  disabled={submitting}
  autoFocus
/>

// Input field cho comment mới
<input
  type="text"
  value={newComment}
  onChange={(e) => setNewComment(e.target.value)}
  placeholder="Viết bình luận..."
  className="w-full bg-transparent text-xs outline-none placeholder-gray-500 text-black font-medium"
  disabled={submitting}
/>

// Textarea cho EmotionsComments
<textarea
  value={newComment}
  onChange={(e) => setNewComment(e.target.value)}
  placeholder="Viết bình luận..."
  className="w-full p-3 border rounded resize-none bg-white text-black font-medium"
  rows={3}
/>
```

## 🔧 **Files Đã Sửa**

### **1. CompactComments.tsx**
- ✅ **`handleSubmitReply`** - Sử dụng API thực tế thay vì mock
- ✅ **Lưu `parent_id`** - Gửi parent_id của comment gốc
- ✅ **Màu chữ đen** - `text-black font-medium` cho input fields
- ✅ **Reload comments** - Load lại từ database sau khi reply

### **2. EmotionsComments.tsx**
- ✅ **API call** - Đã có `parent_id: replyingTo` trong API call
- ✅ **Màu chữ đen** - `text-black font-medium` cho textarea
- ✅ **Timeline ID** - Sử dụng timeline_id thực tế

### **3. FacebookStyleComments.tsx**
- ✅ **Timeline ID** - Đã có timelineId prop
- ✅ **API call** - Sử dụng timeline_id thực tế

## 📊 **Database Schema**

### **Comments Table với Parent ID**
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES comments(id),  -- ✅ Liên kết với comment cha
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

### **Query Comments với Parent ID**
```sql
-- Lấy comments gốc (parent_id IS NULL)
SELECT * FROM comments 
WHERE entity_type = 'attachment' 
  AND entity_id = 'attachment-id'
  AND parent_id IS NULL
ORDER BY created_at DESC;

-- Lấy replies của một comment
SELECT * FROM comments 
WHERE parent_id = 'parent-comment-id'
ORDER BY created_at ASC;
```

## 🎯 **Flow Hoạt Động**

### **1. Comment Gốc**
```typescript
// Tạo comment gốc
const commentData = {
  content: "Hình ảnh rất đẹp!",
  entity_type: "attachment",
  entity_id: "att-001",
  timeline_id: "timeline-123",
  parent_id: null  // ✅ Comment gốc có parent_id = null
}
```

### **2. Reply Comment**
```typescript
// Reply comment
const replyData = {
  content: "Cảm ơn bạn!",
  entity_type: "attachment", 
  entity_id: "att-001",
  timeline_id: "timeline-123",
  parent_id: "comment-123"  // ✅ Reply có parent_id = ID comment gốc
}
```

### **3. Database Structure**
```
Comment 1 (ID: comment-123, parent_id: null)
├── Reply 1 (ID: reply-456, parent_id: comment-123)
└── Reply 2 (ID: reply-789, parent_id: comment-123)

Comment 2 (ID: comment-456, parent_id: null)
└── Reply 3 (ID: reply-101, parent_id: comment-456)
```

## 🎨 **Màu Chữ và UI**

### **Trước**
```css
/* Màu chữ mờ, khó đọc */
className="w-full bg-transparent text-xs outline-none placeholder-gray-500"
```

### **Sau**
```css
/* Màu chữ đen, rõ ràng */
className="w-full bg-transparent text-xs outline-none placeholder-gray-500 text-black font-medium"
```

### **Kết Quả**
- ✅ **Chữ đen rõ ràng** - `text-black font-medium`
- ✅ **Dễ đọc** - Font weight medium
- ✅ **Consistent** - Tất cả input fields đều có màu chữ đen

## 📋 **Checklist Hoàn Thành**

- [x] Sửa `handleSubmitReply` để sử dụng API thực tế
- [x] Lưu `parent_id` khi tạo reply
- [x] Chỉnh màu chữ đen cho tất cả input fields
- [x] Reload comments sau khi reply
- [x] Error handling với fallback
- [x] Timeline ID được sử dụng đúng
- [x] Database schema hỗ trợ parent_id

## 🎉 **Kết Quả**

### **Trước**
- ❌ Mock data cho replies
- ❌ Không lưu parent_id
- ❌ Màu chữ mờ, khó đọc

### **Sau**
- ✅ API thực tế cho replies
- ✅ Lưu parent_id vào database
- ✅ Màu chữ đen rõ ràng
- ✅ Hierarchical comments hoạt động đúng

**Bây giờ khi trả lời bình luận sẽ lưu ID bình luận trước đó và parent_id, đồng thời màu chữ đã được chỉnh cho rõ ràng và đen!** 🚀


