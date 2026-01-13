-- =====================================================
-- Migration: Add Message Reactions
-- Date: 2026-01-13
-- Description: Track emoji reactions on messages
-- =====================================================

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES task_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    emoji VARCHAR(10) NOT NULL, -- Emoji character (❤️, 👍, 😂, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one reaction per user per message per emoji
    UNIQUE(message_id, user_id, emoji)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_emoji ON message_reactions(emoji);

-- RLS Policies for message_reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Allow users to see all reactions for messages they can see
CREATE POLICY "Users can view reactions for accessible messages"
    ON message_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM task_comments tc
            WHERE tc.id = message_reactions.message_id
        )
    );

-- Allow users to insert their own reactions
CREATE POLICY "Users can insert their own reactions"
    ON message_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reactions
CREATE POLICY "Users can delete their own reactions"
    ON message_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE message_reactions IS 'Tracks emoji reactions on chat messages (like Facebook/Zalo reactions)';

