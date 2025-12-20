-- Migration: Create qr_login_sessions table for QR code login feature
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS qr_login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_token TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    CONSTRAINT qr_login_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qr_login_sessions_session_id ON qr_login_sessions(id);
CREATE INDEX IF NOT EXISTS idx_qr_login_sessions_user_id ON qr_login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_login_sessions_status ON qr_login_sessions(status);
CREATE INDEX IF NOT EXISTS idx_qr_login_sessions_expires_at ON qr_login_sessions(expires_at);

-- Add comment
COMMENT ON TABLE qr_login_sessions IS 'Stores QR code login sessions for quick mobile login';
COMMENT ON COLUMN qr_login_sessions.secret_token IS 'Secret token embedded in QR code for verification';
COMMENT ON COLUMN qr_login_sessions.status IS 'Session status: pending, verified, or expired';
COMMENT ON COLUMN qr_login_sessions.expires_at IS 'When the QR code session expires (typically 5 minutes)';

-- Enable Row Level Security (RLS)
ALTER TABLE qr_login_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage sessions
CREATE POLICY "Service role can manage QR sessions"
    ON qr_login_sessions
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create policy to allow users to read their own sessions (for status checking)
CREATE POLICY "Users can read their own QR sessions"
    ON qr_login_sessions
    FOR SELECT
    USING (auth.uid() = user_id);


