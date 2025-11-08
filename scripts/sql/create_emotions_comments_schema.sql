-- =====================================================
-- HỆ THỐNG CẢM XÚC VÀ BÌNH LUẬN VỚI CẤU TRÚC NHÁNH CHA CON
-- =====================================================

-- Bảng lưu trữ các loại cảm xúc/phản ứng
CREATE TABLE IF NOT EXISTS emotion_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng bình luận với cấu trúc nhánh cha con
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- NULL cho bình luận gốc
    entity_type VARCHAR(50) NOT NULL, -- 'project', 'timeline_entry', 'invoice', 'expense', etc.
    entity_id UUID NOT NULL, -- ID của entity được bình luận
    timeline_id UUID REFERENCES project_timeline(id) ON DELETE CASCADE, -- ID của timeline entry
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng lưu trữ cảm xúc/phản ứng của người dùng
CREATE TABLE IF NOT EXISTS user_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'comment', 'timeline_entry', 'project', etc.
    entity_id UUID NOT NULL, -- ID của entity được phản ứng
    emotion_type_id UUID REFERENCES emotion_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, entity_type, entity_id, emotion_type_id) -- Một user chỉ có thể có một loại cảm xúc trên một entity
);

-- Bảng lưu trữ thông báo về bình luận và phản ứng
CREATE TABLE IF NOT EXISTS comment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'new_comment', 'reply', 'reaction', 'mention'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng lưu trữ mentions trong bình luận
CREATE TABLE IF NOT EXISTS comment_mentions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    mentioned_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES CHO HIỆU SUẤT
-- =====================================================

-- Indexes cho bảng comments
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_timeline_id ON comments(timeline_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);

-- Indexes cho bảng user_reactions
CREATE INDEX IF NOT EXISTS idx_user_reactions_user_id ON user_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reactions_entity ON user_reactions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_reactions_emotion_type ON user_reactions(emotion_type_id);
CREATE INDEX IF NOT EXISTS idx_user_reactions_created_at ON user_reactions(created_at);

-- Indexes cho bảng comment_notifications
CREATE INDEX IF NOT EXISTS idx_comment_notifications_user_id ON comment_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_notifications_comment_id ON comment_notifications(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_notifications_is_read ON comment_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_comment_notifications_created_at ON comment_notifications(created_at);

-- Indexes cho bảng comment_mentions
CREATE INDEX IF NOT EXISTS idx_comment_mentions_comment_id ON comment_mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_user_id ON comment_mentions(mentioned_user_id);

-- =====================================================
-- TRIGGERS VÀ FUNCTIONS
-- =====================================================

-- Function để cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers cho updated_at
CREATE TRIGGER update_emotion_types_updated_at 
    BEFORE UPDATE ON emotion_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function để tạo thông báo khi có bình luận mới
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Tạo thông báo cho tác giả của bình luận cha (nếu có)
    IF NEW.parent_id IS NOT NULL THEN
        INSERT INTO comment_notifications (user_id, comment_id, notification_type)
        SELECT c.user_id, NEW.id, 'reply'
        FROM comments c
        WHERE c.id = NEW.parent_id AND c.user_id != NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger để tạo thông báo
CREATE TRIGGER trigger_create_comment_notification
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- =====================================================
-- DỮ LIỆU MẪU CHO CẢM XÚC
-- =====================================================

-- Thêm các loại cảm xúc mặc định
INSERT INTO emotion_types (name, display_name, emoji, color) VALUES
('like', 'Thích', '👍', '#4CAF50'),
('love', 'Yêu thích', '❤️', '#F44336'),
('laugh', 'Cười', '😂', '#FF9800'),
('wow', 'Wow', '😮', '#9C27B0'),
('sad', 'Buồn', '😢', '#2196F3'),
('angry', 'Tức giận', '😠', '#F44336'),
('dislike', 'Không thích', '👎', '#757575'),
('celebrate', 'Chúc mừng', '🎉', '#FF5722')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- COMMENTS VÀ DOCUMENTATION
-- =====================================================

COMMENT ON TABLE emotion_types IS 'Bảng lưu trữ các loại cảm xúc/phản ứng có thể sử dụng';
COMMENT ON TABLE comments IS 'Bảng bình luận với cấu trúc nhánh cha con, hỗ trợ reply và nested comments';
COMMENT ON TABLE user_reactions IS 'Bảng lưu trữ phản ứng/cảm xúc của người dùng trên các entity';
COMMENT ON TABLE comment_notifications IS 'Bảng thông báo về bình luận và phản ứng';
COMMENT ON TABLE comment_mentions IS 'Bảng lưu trữ mentions trong bình luận';

COMMENT ON COLUMN comments.parent_id IS 'ID của bình luận cha, NULL nếu là bình luận gốc';
COMMENT ON COLUMN comments.entity_type IS 'Loại entity được bình luận (project, timeline_entry, invoice, etc.)';
COMMENT ON COLUMN comments.entity_id IS 'ID của entity được bình luận';
COMMENT ON COLUMN comments.timeline_id IS 'ID của timeline entry mà bình luận thuộc về';
COMMENT ON COLUMN comments.is_edited IS 'Đánh dấu bình luận đã được chỉnh sửa';
COMMENT ON COLUMN comments.is_deleted IS 'Đánh dấu bình luận đã bị xóa (soft delete)';

COMMENT ON COLUMN user_reactions.entity_type IS 'Loại entity được phản ứng (comment, timeline_entry, project, etc.)';
COMMENT ON COLUMN user_reactions.entity_id IS 'ID của entity được phản ứng';
