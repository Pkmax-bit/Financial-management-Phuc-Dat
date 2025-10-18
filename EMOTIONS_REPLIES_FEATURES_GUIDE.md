# 😊 Hướng Dẫn Thêm Chọn Cảm Xúc và Hiển Thị Đầy Đủ Replies

## ✅ **Đã Hoàn Thành**

### **1. Chọn Cảm Xúc (Emotion Picker)**

#### **State Management**
```typescript
const [showReactions, setShowReactions] = useState<string | null>(null)
const [showAllReplies, setShowAllReplies] = useState<{ [key: string]: boolean }>({})
```

#### **Nút Chọn Cảm Xúc**
```typescript
<button
  onClick={() => setShowReactions(showReactions === comment.id ? null : comment.id)}
  className="text-xs text-gray-600 hover:text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded-full transition-colors"
>
  😊 Cảm xúc
</button>
```

#### **Emotion Picker UI**
```typescript
{showReactions === comment.id && (
  <div className="mt-2 ml-11 flex gap-2">
    {['like', 'love', 'laugh', 'angry', 'sad', 'wow'].map((emotion) => (
      <button
        key={emotion}
        onClick={() => {
          handleReaction(comment.id, emotion)
          setShowReactions(null)
        }}
        className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all duration-200 shadow-sm"
        title={emotion}
      >
        {emotion === 'like' && '👍'}
        {emotion === 'love' && '❤️'}
        {emotion === 'laugh' && '😂'}
        {emotion === 'angry' && '😠'}
        {emotion === 'sad' && '😢'}
        {emotion === 'wow' && '😮'}
      </button>
    ))}
  </div>
)}
```

### **2. API Integration cho Reactions**

#### **Handle Reaction Function**
```typescript
const handleReaction = async (commentId: string, reactionType: string) => {
  try {
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const endpoint = token ? '/api/emotions-comments/reactions' : '/api/emotions-comments/reactions/public'
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        entity_type: 'comment',
        entity_id: commentId,
        emotion_type: reactionType
      })
    })
    
    if (response.ok) {
      onReactionAdded?.()
      // Reload comments to get updated reactions
      await loadComments()
    }
  } catch (error) {
    console.error('Error adding reaction:', error)
  }
}
```

### **3. Hiển Thị Đầy Đủ Replies**

#### **Limited Replies Display**
```typescript
{/* Show limited replies initially */}
{(showAllReplies[comment.id] ? comment.replies : comment.replies.slice(0, 2)).map((reply) => (
  <div key={reply.id} className="flex gap-3">
    {/* Reply content */}
  </div>
))}
```

#### **Show More/Less Button**
```typescript
{/* Show More/Less Button */}
{comment.replies.length > 2 && (
  <button
    onClick={() => setShowAllReplies(prev => ({
      ...prev,
      [comment.id]: !prev[comment.id]
    }))}
    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-1 rounded-full transition-colors"
  >
    {showAllReplies[comment.id] 
      ? `Ẩn ${comment.replies.length - 2} trả lời` 
      : `Xem thêm ${comment.replies.length - 2} trả lời`
    }
  </button>
)}
```

## 🎨 **UI/UX Features**

### **1. Emotion Picker Design**
- **6 emotions**: like, love, laugh, angry, sad, wow
- **Hover effects**: Scale animation (hover:scale-110)
- **Visual feedback**: Border và shadow effects
- **Auto-close**: Picker tự động đóng sau khi chọn

### **2. Show More/Less Design**
- **Conditional display**: Chỉ hiện khi có > 2 replies
- **Dynamic text**: "Xem thêm X trả lời" / "Ẩn X trả lời"
- **Smooth transitions**: Hover effects với blue theme
- **State management**: Toggle cho từng comment riêng biệt

### **3. Responsive Layout**
- **Mobile-friendly**: Compact design cho mobile
- **Desktop**: Full features với hover effects
- **Consistent spacing**: ml-11 cho alignment

## 🔧 **Files Đã Cập Nhật**

### **1. CompactComments.tsx**
- ✅ **State management** - showReactions, showAllReplies
- ✅ **Emotion picker** - 6 emotions với hover effects
- ✅ **API integration** - Real API calls cho reactions
- ✅ **Show more/less** - Toggle replies display
- ✅ **UI improvements** - Better spacing và colors

### **2. EmotionsComments.tsx**
- ✅ **State management** - showReactions, showAllReplies
- ✅ **Consistent UI** - Same features như CompactComments
- ✅ **API integration** - Real API calls
- ✅ **Responsive design** - Mobile và desktop friendly

## 📊 **Database Schema**

### **User Reactions Table**
```sql
CREATE TABLE user_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    emotion_type_id UUID REFERENCES emotion_types(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Emotion Types Table**
```sql
CREATE TABLE emotion_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default emotions
INSERT INTO emotion_types (name, emoji) VALUES
('like', '👍'),
('love', '❤️'),
('laugh', '😂'),
('angry', '😠'),
('sad', '😢'),
('wow', '😮');
```

## 🎯 **User Experience**

### **1. Emotion Selection Flow**
```
1. User clicks "😊 Cảm xúc" button
2. Emotion picker appears with 6 options
3. User clicks on desired emotion
4. API call is made to save reaction
5. Picker closes automatically
6. Comments reload to show updated reactions
```

### **2. Replies Display Flow**
```
1. Initially show only 2 replies
2. If more than 2 replies, show "Xem thêm X trả lời" button
3. User clicks to expand
4. All replies are shown
5. Button changes to "Ẩn X trả lời"
6. User can collapse again
```

## 🎉 **Kết Quả**

### **Trước**
- ❌ Chỉ có nút "👍 Thích" đơn giản
- ❌ Không có emotion picker
- ❌ Hiển thị tất cả replies (có thể dài)
- ❌ Không có API integration

### **Sau**
- ✅ **6 emotions** - like, love, laugh, angry, sad, wow
- ✅ **Emotion picker** - UI đẹp với hover effects
- ✅ **Show more/less** - Hiển thị thông minh replies
- ✅ **API integration** - Lưu reactions vào database
- ✅ **Real-time updates** - Reload comments sau reactions
- ✅ **Responsive design** - Hoạt động tốt trên mọi thiết bị

**Bây giờ người dùng có thể chọn cảm xúc đa dạng và xem đầy đủ các câu trả lời bình luận một cách thông minh!** 🚀



