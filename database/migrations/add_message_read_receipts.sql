-- =====================================================
-- Migration: Add Read Receipts for Chat Messages
-- Date: 2026-01-13
-- Description: Track when messages are read by users
-- =====================================================

-- Create message_read_receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES task_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one read receipt per user per message
    UNIQUE(message_id, user_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON message_read_receipts(user_id);

-- Add type and file_url columns to task_comments if not exists (for better message handling)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='task_comments' AND column_name='type') THEN
        ALTER TABLE task_comments ADD COLUMN type VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='task_comments' AND column_name='file_url') THEN
        ALTER TABLE task_comments ADD COLUMN file_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='task_comments' AND column_name='is_pinned') THEN
        ALTER TABLE task_comments ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;
END $$;

-- RLS Policies for message_read_receipts
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Allow users to see all read receipts for messages they can see
CREATE POLICY "Users can view read receipts for accessible messages"
    ON message_read_receipts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM task_comments tc
            WHERE tc.id = message_read_receipts.message_id
        )
    );

-- Allow users to insert their own read receipts
CREATE POLICY "Users can insert their own read receipts"
    ON message_read_receipts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own read receipts
CREATE POLICY "Users can update their own read receipts"
    ON message_read_receipts FOR UPDATE
    USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE message_read_receipts IS 'Tracks when messages are read by users for read receipts (✓✓) feature';

