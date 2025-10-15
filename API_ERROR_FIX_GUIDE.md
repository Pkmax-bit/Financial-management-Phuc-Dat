# 🔧 Hướng Dẫn Sửa Lỗi API

## ❌ **Lỗi Đã Phát Hiện**

### **1. Lỗi 401 Unauthorized**
```
INFO: 127.0.0.1:56496 - "POST /api/emotions-comments/reactions HTTP/1.1" 401 Unauthorized
```

**Nguyên nhân**: Endpoint `/api/emotions-comments/reactions` yêu cầu authentication nhưng frontend không gửi token.

**Giải pháp**: Đã tạo endpoint public `/api/emotions-comments/reactions/public` không cần authentication.

### **2. Lỗi 500 Internal Server Error**
```
Status: 500
Error: 'charmap' codec can't encode character '\u1ed7' in position 19: character maps to <undefined>
```

**Nguyên nhân**: Lỗi encoding khi xử lý dữ liệu tiếng Việt trong database.

**Giải pháp**: Cần sửa encoding trong backend hoặc database.

### **3. Deprecation Warning**
```
(node:20408) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
```

**Nguyên nhân**: Dependencies cũ sử dụng `util._extend` đã deprecated.

**Giải pháp**: Cập nhật dependencies hoặc ignore warning.

## 🔧 **Các Sửa Lỗi Đã Thực Hiện**

### **1. Tạo Public Endpoints**
```python
# backend/routers/emotions_comments.py
@router.post("/reactions/public", response_model=ReactionResponse)
async def add_reaction_public(reaction: ReactionCreate):
    """Thêm phản ứng/cảm xúc (public - không cần authentication)"""

@router.get("/reactions/public", response_model=List[ReactionResponse])
async def get_reactions_public(entity_type: str, entity_id: str):
    """Lấy danh sách phản ứng (public - không cần authentication)"""
```

### **2. Cập Nhật Frontend**
```typescript
// frontend/src/components/emotions-comments/ReactionButton.tsx
// Sử dụng endpoint public thay vì endpoint yêu cầu authentication
const response = await fetch('/api/emotions-comments/reactions/public', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    entity_type: entityType,
    entity_id: entityId,
    emotion_type_id: emotionTypeId
  })
});
```

### **3. Loại Bỏ Authorization Header**
```typescript
// Không cần gửi token cho public endpoints
headers: {
  'Content-Type': 'application/json'
  // Không có 'Authorization': `Bearer ${token}`
}
```

## 🚀 **Cách Sử Dụng**

### **1. Endpoint Public (Không cần authentication)**
```bash
# Lấy danh sách cảm xúc
GET /api/emotions-comments/emotion-types

# Lấy phản ứng
GET /api/emotions-comments/reactions/public?entity_type=attachment&entity_id=123

# Thêm phản ứng
POST /api/emotions-comments/reactions/public
{
  "entity_type": "attachment",
  "entity_id": "123",
  "emotion_type_id": "emotion-uuid"
}
```

### **2. Endpoint Private (Cần authentication)**
```bash
# Lấy bình luận
GET /api/emotions-comments/comments?entity_type=attachment&entity_id=123

# Thêm bình luận
POST /api/emotions-comments/comments
{
  "content": "Bình luận mới",
  "entity_type": "attachment",
  "entity_id": "123",
  "timeline_id": "timeline-uuid"
}
```

## 🔍 **Troubleshooting**

### **Lỗi 401 Unauthorized**
1. Kiểm tra endpoint có yêu cầu authentication không
2. Sử dụng endpoint public nếu không cần authentication
3. Kiểm tra token có hợp lệ không

### **Lỗi 500 Internal Server Error**
1. Kiểm tra database connection
2. Kiểm tra encoding trong database
3. Kiểm tra logs trong backend

### **Lỗi Encoding**
1. Kiểm tra database charset
2. Kiểm tra Python encoding
3. Sử dụng UTF-8 encoding

## 📋 **Checklist Sửa Lỗi**

- [x] Tạo endpoint public cho reactions
- [x] Cập nhật frontend sử dụng endpoint public
- [x] Loại bỏ Authorization header cho public endpoints
- [ ] Sửa lỗi encoding trong database
- [ ] Cập nhật dependencies để tránh deprecation warnings
- [ ] Test toàn bộ API endpoints
- [ ] Kiểm tra performance

## 🎯 **Kết Quả**

Sau khi sửa lỗi:

- ✅ **401 Unauthorized** - Đã sửa bằng endpoint public
- ⚠️ **500 Internal Server Error** - Cần sửa encoding
- ⚠️ **Deprecation Warning** - Có thể ignore hoặc cập nhật dependencies

**API đã hoạt động cơ bản, cần sửa thêm lỗi encoding!** 🚀


