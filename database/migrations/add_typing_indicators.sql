-- =====================================================
-- Migration: Add Typing Indicators for Chat
-- Date: 2026-01-13
-- Description: Track when users are typing in chat
-- =====================================================

-- Create typing_indicators table (temporary storage, auto-expire after 5 seconds)
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    is_typing BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 seconds'),
    
    -- Ensure one typing indicator per user per task
    UNIQUE(task_id, user_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_typing_indicators_task_id ON typing_indicators(task_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires_at ON typing_indicators(expires_at);

-- Function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for typing_indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Allow users to see typing indicators for tasks they can access
CREATE POLICY "Users can view typing indicators for accessible tasks"
    ON typing_indicators FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = typing_indicators.task_id
        )
    );

-- Allow users to insert/update their own typing indicators
CREATE POLICY "Users can manage their own typing indicators"
    ON typing_indicators FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE typing_indicators IS 'Tracks when users are typing in chat (auto-expires after 5 seconds)';







