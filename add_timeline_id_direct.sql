-- Thêm cột timeline_id vào bảng comments
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS timeline_id UUID REFERENCES project_timeline(id) ON DELETE CASCADE;

-- Thêm index cho timeline_id
CREATE INDEX IF NOT EXISTS idx_comments_timeline_id ON comments(timeline_id);

-- Thêm comment cho cột
COMMENT ON COLUMN comments.timeline_id IS 'ID của timeline entry mà bình luận thuộc về';
