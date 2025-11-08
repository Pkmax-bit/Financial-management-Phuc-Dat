# 🎭 Hệ Thống Cảm Xúc và Bình Luận

Hệ thống cảm xúc và bình luận với cấu trúc nhánh cha con, hỗ trợ phản ứng cảm xúc và thông báo.

## 📋 Tính Năng

### 🗄️ Database Schema

#### 1. Bảng `emotion_types`
- Lưu trữ các loại cảm xúc/phản ứng
- Hỗ trợ emoji và màu sắc
- Có thể bật/tắt từng loại cảm xúc

#### 2. Bảng `comments` 
- Bình luận với cấu trúc nhánh cha con
- Hỗ trợ reply và nested comments
- Soft delete và edit tracking
- Liên kết với nhiều loại entity (project, timeline_entry, invoice, etc.)

#### 3. Bảng `user_reactions`
- Lưu trữ phản ứng của người dùng
- Một user chỉ có thể có một loại phản ứng trên một entity
- Hỗ trợ nhiều loại entity

#### 4. Bảng `comment_notifications`
- Thông báo về bình luận mới, reply, phản ứng
- Hỗ trợ đánh dấu đã đọc

#### 5. Bảng `comment_mentions`
- Lưu trữ mentions trong bình luận
- Tích hợp với hệ thống thông báo

### 🔧 API Endpoints

#### Emotion Types
- `GET /api/emotions-comments/emotion-types` - Lấy danh sách loại cảm xúc

#### Comments
- `POST /api/emotions-comments/comments` - Tạo bình luận mới
- `GET /api/emotions-comments/comments/{entity_type}/{entity_id}` - Lấy bình luận
- `PUT /api/emotions-comments/comments/{comment_id}` - Cập nhật bình luận
- `DELETE /api/emotions-comments/comments/{comment_id}` - Xóa bình luận

#### Reactions
- `POST /api/emotions-comments/reactions` - Thêm phản ứng
- `DELETE /api/emotions-comments/reactions/{entity_type}/{entity_id}` - Xóa phản ứng

### 🎨 React Components

#### 1. `EmotionsComments.tsx`
Component chính cho hệ thống bình luận:
- Hiển thị danh sách bình luận với cấu trúc nhánh cha con
- Form tạo bình luận mới
- Hỗ trợ reply và edit
- Hiển thị phản ứng cảm xúc
- Thông báo real-time

#### 2. `ReactionButton.tsx`
Component cho phản ứng cảm xúc:
- Hiển thị các nút cảm xúc
- Thống kê số lượng phản ứng
- Hỗ trợ chế độ compact và full

## 🚀 Cách Sử Dụng

### 1. Thiết Lập Database

```bash
python setup_emotions_comments.py
```

### 2. Sử Dụng Component

```tsx
import EmotionsComments from './components/emotions-comments/EmotionsComments';

function ProjectPage() {
  return (
    <div>
      <h1>Dự án ABC</h1>
      
      {/* Hệ thống bình luận cho dự án */}
      <EmotionsComments
        entityType="project"
        entityId="project-uuid"
        currentUserId="user-uuid"
        onCommentAdded={() => console.log('Có bình luận mới')}
        onReactionAdded={() => console.log('Có phản ứng mới')}
      />
    </div>
  );
}
```

### 3. Sử Dụng Component Phản Ứng

```tsx
import ReactionButton from './components/emotions-comments/ReactionButton';

function TimelineEntry({ entry }) {
  return (
    <div>
      <h3>{entry.title}</h3>
      <p>{entry.content}</p>
      
      {/* Nút phản ứng */}
      <ReactionButton
        entityType="timeline_entry"
        entityId={entry.id}
        currentUserId="user-uuid"
        compact={true}
      />
    </div>
  );
}
```

## 📊 Cấu Trúc Dữ Liệu

### Comment Object
```typescript
interface Comment {
  id: string;
  parent_id?: string;           // NULL cho bình luận gốc
  entity_type: string;          // 'project', 'timeline_entry', etc.
  entity_id: string;
  user_id?: string;
  author_name: string;
  content: string;
  is_edited: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  replies: Comment[];          // Bình luận con
  reactions: { [key: string]: number }; // Tổng hợp phản ứng
  user_reaction?: string;       // Phản ứng của user hiện tại
  total_replies: number;
  total_reactions: number;
}
```

### Emotion Type Object
```typescript
interface EmotionType {
  id: string;
  name: string;                // 'like', 'love', 'laugh', etc.
  display_name: string;        // 'Thích', 'Yêu thích', etc.
  emoji: string;               // '👍', '❤️', '😂', etc.
  color?: string;              // Hex color code
  is_active: boolean;
}
```

## 🔄 Workflow

### 1. Tạo Bình Luận
1. User nhập nội dung bình luận
2. Chọn entity_type và entity_id
3. Có thể reply vào bình luận khác (parent_id)
4. Hệ thống tạo thông báo cho tác giả bình luận cha

### 2. Phản Ứng Cảm Xúc
1. User click vào emoji
2. Nếu chưa có phản ứng → thêm mới
3. Nếu đã có phản ứng khác → thay thế
4. Nếu click vào phản ứng hiện tại → xóa

### 3. Cấu Trúc Nhánh Cha Con
- Bình luận gốc: `parent_id = NULL`
- Reply: `parent_id = ID của bình luận cha`
- Hỗ trợ nested replies (không giới hạn độ sâu)

## 🎯 Entity Types Hỗ Trợ

- `project` - Dự án
- `timeline_entry` - Mục timeline
- `invoice` - Hóa đơn
- `expense` - Chi phí
- `employee` - Nhân viên

## 🔧 Tùy Chỉnh

### Thêm Loại Cảm Xúc Mới
```sql
INSERT INTO emotion_types (name, display_name, emoji, color) 
VALUES ('excited', 'Hào hứng', '🤩', '#FF9800');
```

### Thêm Entity Type Mới
Cập nhật validation trong API và component để hỗ trợ entity type mới.

## 📱 Responsive Design

- Component tự động responsive
- Hỗ trợ mobile và desktop
- Touch-friendly cho mobile

## 🔒 Bảo Mật

- Xác thực user trước khi tạo/sửa/xóa
- Kiểm tra quyền sở hữu bình luận
- Soft delete để bảo toàn dữ liệu
- Rate limiting cho API

## 🚀 Performance

- Indexes được tối ưu cho queries
- Lazy loading cho replies
- Caching cho emotion types
- Pagination cho danh sách bình luận

## 🐛 Troubleshooting

### Lỗi Kết Nối Database
- Kiểm tra SUPABASE_URL và SUPABASE_ANON_KEY
- Đảm bảo RLS policies được thiết lập đúng

### Lỗi Component
- Kiểm tra props được truyền đúng
- Đảm bảo API endpoints hoạt động
- Kiểm tra console logs

### Lỗi Encoding
- Đảm bảo file được lưu với UTF-8 encoding
- Kiểm tra emoji support trong database





