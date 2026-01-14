-- Migration: Create app_versions table for Android APK version management
-- This table stores version information and APK file metadata

-- Create app_versions table
CREATE TABLE IF NOT EXISTS public.app_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_code INTEGER NOT NULL UNIQUE,
    version_name VARCHAR(50) NOT NULL,
    min_supported_version_code INTEGER NOT NULL DEFAULT 1,
    update_required BOOLEAN NOT NULL DEFAULT false,
    apk_file_path TEXT, -- Path to APK file in Supabase Storage
    apk_file_url TEXT, -- Public URL to download APK
    file_size BIGINT, -- File size in bytes
    release_notes TEXT,
    changelog TEXT, -- Detailed changelog
    is_active BOOLEAN NOT NULL DEFAULT true, -- Only one active version at a time
    download_count INTEGER DEFAULT 0, -- Track downloads
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_versions_version_code ON public.app_versions(version_code);
CREATE INDEX IF NOT EXISTS idx_app_versions_is_active ON public.app_versions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_app_versions_created_at ON public.app_versions(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_app_versions_updated_at
    BEFORE UPDATE ON public.app_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_app_versions_updated_at();

-- Create function to ensure only one active version
CREATE OR REPLACE FUNCTION ensure_single_active_version()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a version as active, deactivate all others
    IF NEW.is_active = true THEN
        UPDATE public.app_versions
        SET is_active = false
        WHERE id != NEW.id AND is_active = true AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one active version
CREATE TRIGGER ensure_single_active_version_trigger
    BEFORE INSERT OR UPDATE ON public.app_versions
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION ensure_single_active_version();

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active versions (for public API)
CREATE POLICY "Anyone can read active app versions"
    ON public.app_versions
    FOR SELECT
    USING (is_active = true AND deleted_at IS NULL);

-- Policy: Authenticated users can read all versions
CREATE POLICY "Authenticated users can read all app versions"
    ON public.app_versions
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Only admins can manage app versions"
    ON public.app_versions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Insert initial version (Version 1.0)
INSERT INTO public.app_versions (
    version_code,
    version_name,
    min_supported_version_code,
    update_required,
    release_notes,
    is_active,
    created_by
) VALUES (
    1,
    '1.0',
    1,
    false,
    'Version 1.0 - Initial release',
    true,
    (SELECT id FROM auth.users WHERE role = 'admin' LIMIT 1)
) ON CONFLICT (version_code) DO NOTHING;

-- Create view for latest version (for easier queries)
CREATE OR REPLACE VIEW public.app_versions_latest AS
SELECT *
FROM public.app_versions
WHERE is_active = true
    AND deleted_at IS NULL
ORDER BY version_code DESC
LIMIT 1;

-- Grant permissions
GRANT SELECT ON public.app_versions TO anon, authenticated;
GRANT SELECT ON public.app_versions_latest TO anon, authenticated;
GRANT ALL ON public.app_versions TO authenticated;

-- Add comment
COMMENT ON TABLE public.app_versions IS 'Stores Android app version information and APK metadata';
COMMENT ON COLUMN public.app_versions.version_code IS 'Numeric version code (must increment for each release)';
COMMENT ON COLUMN public.app_versions.version_name IS 'Human-readable version name (e.g., "1.0", "1.1")';
COMMENT ON COLUMN public.app_versions.min_supported_version_code IS 'Minimum version code that is still supported';
COMMENT ON COLUMN public.app_versions.update_required IS 'If true, users must update to continue using the app';
COMMENT ON COLUMN public.app_versions.apk_file_path IS 'Path to APK file in Supabase Storage (e.g., "app-versions/v1.0/app-release.apk")';
COMMENT ON COLUMN public.app_versions.apk_file_url IS 'Public URL to download APK (e.g., Google Drive, GitHub Releases)';
COMMENT ON COLUMN public.app_versions.is_active IS 'Only one version can be active at a time (latest version)';

