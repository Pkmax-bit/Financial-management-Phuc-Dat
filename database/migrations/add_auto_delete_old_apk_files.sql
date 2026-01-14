-- Migration: Auto-delete old APK files when more than 3 versions exist
-- Keeps only the 3 newest APK files, but preserves all version records in database
-- Only removes file references (apk_file_path, file_size), keeps version name and all other data

-- Create function to delete old APK files (keeps only 3 newest)
CREATE OR REPLACE FUNCTION delete_old_apk_files()
RETURNS TRIGGER AS $$
DECLARE
    old_version_record RECORD;
    file_count INTEGER;
BEGIN
    -- Only process if this is a new version with APK file being inserted or updated
    IF (TG_OP = 'INSERT' AND NEW.apk_file_path IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND NEW.apk_file_path IS NOT NULL AND (OLD.apk_file_path IS NULL OR OLD.apk_file_path != NEW.apk_file_path)) THEN
        
        -- Count how many versions have APK files (including the new one)
        SELECT COUNT(*) INTO file_count
        FROM public.app_versions
        WHERE apk_file_path IS NOT NULL
            AND deleted_at IS NULL;
        
        -- If we have more than 3 versions with APK files, clear the oldest one
        IF file_count > 3 THEN
            -- Get the oldest version with an APK file (excluding the one we just inserted/updated)
            SELECT * INTO old_version_record
            FROM public.app_versions
            WHERE apk_file_path IS NOT NULL
                AND deleted_at IS NULL
                AND id != NEW.id
            ORDER BY version_code ASC, created_at ASC
            LIMIT 1;
            
            -- If we found an old version, clear its APK file path and size (but keep the record)
            IF old_version_record IS NOT NULL THEN
                -- Clear the APK file path and file size, but keep all other version information
                UPDATE public.app_versions
                SET 
                    apk_file_path = NULL,
                    file_size = NULL,
                    updated_at = NOW()
                WHERE id = old_version_record.id;
                
                -- Log the action
                RAISE NOTICE 'Cleared APK file for old version % (version_code: %, version_name: %). Version record kept.', 
                    old_version_record.id, 
                    old_version_record.version_code, 
                    old_version_record.version_name;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-delete old APK files
CREATE TRIGGER auto_delete_old_apk_files_trigger
    AFTER INSERT OR UPDATE ON public.app_versions
    FOR EACH ROW
    EXECUTE FUNCTION delete_old_apk_files();

-- Add comment
COMMENT ON FUNCTION delete_old_apk_files() IS 'Automatically clears APK file paths for old versions when more than 3 versions have APK files. Keeps version records (name, notes, etc.) but removes file references. Only the 3 newest versions keep their APK files.';

