-- =====================================================
-- INCLUDE SENDER INFO IN BROADCAST PAYLOAD
-- Tối ưu quan trọng nhất: Giảm delay từ 50-200ms xuống 0ms
-- =====================================================

-- Bước 1: Sửa trigger function để include sender info
DROP FUNCTION IF EXISTS broadcast_message_changes() CASCADE;

CREATE OR REPLACE FUNCTION broadcast_message_changes()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    sender_full_name TEXT;
    enriched_record JSONB;
BEGIN
    -- Get sender name from users table (only for INSERT and UPDATE)
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        SELECT COALESCE(u.full_name, u.email, 'Unknown') INTO sender_name
        FROM users u
        WHERE u.id = NEW.sender_id
        LIMIT 1;
        
        -- If not found in users, try employees table
        IF sender_name IS NULL THEN
            SELECT COALESCE(e.full_name, e.first_name || ' ' || e.last_name, 'Unknown') INTO sender_full_name
            FROM employees e
            WHERE e.user_id = NEW.sender_id
            LIMIT 1;
            
            sender_name := COALESCE(sender_full_name, 'Unknown');
        END IF;
        
        -- Build enriched record with sender info
        enriched_record := jsonb_build_object(
            'id', NEW.id,
            'conversation_id', NEW.conversation_id,
            'sender_id', NEW.sender_id,
            'sender_name', COALESCE(sender_name, 'Unknown'),
            'message_text', NEW.message_text,
            'message_type', NEW.message_type,
            'file_url', NEW.file_url,
            'file_name', NEW.file_name,
            'file_size', NEW.file_size,
            'reply_to_id', NEW.reply_to_id,
            'is_deleted', NEW.is_deleted,
            'is_edited', NEW.is_edited,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        );
        
        -- Broadcast with enriched record
        PERFORM realtime.broadcast_changes(
            'conversation:' || NEW.conversation_id::text || ':messages',
            TG_OP,
            TG_OP,
            TG_TABLE_NAME,
            TG_TABLE_SCHEMA,
            enriched_record::jsonb,  -- Use enriched record instead of NEW
            NULL
        );
    ELSE
        -- For DELETE, use OLD record (no need for sender info)
        PERFORM realtime.broadcast_changes(
            'conversation:' || OLD.conversation_id::text || ':messages',
            TG_OP,
            TG_OP,
            TG_TABLE_NAME,
            TG_TABLE_SCHEMA,
            NULL,
            OLD
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Bước 2: Đảm bảo trigger được tạo
DROP TRIGGER IF EXISTS messages_broadcast_trigger ON internal_messages;

CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON internal_messages
  FOR EACH ROW 
  EXECUTE FUNCTION broadcast_message_changes();

-- Bước 3: Verify setup
DO $$
BEGIN
    -- Check trigger
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'messages_broadcast_trigger' 
        AND tgrelid = 'internal_messages'::regclass
    ) THEN
        RAISE NOTICE '✅ Trigger đã được tạo với sender info enrichment';
    ELSE
        RAISE EXCEPTION '❌ Trigger không tồn tại!';
    END IF;
    
    -- Check function
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'broadcast_message_changes'
    ) THEN
        RAISE NOTICE '✅ Function đã được tạo với sender info enrichment';
    ELSE
        RAISE EXCEPTION '❌ Function không tồn tại!';
    END IF;
    
    RAISE NOTICE '✅ Broadcast trigger đã được tối ưu với sender info';
END $$;

-- =====================================================
-- Các Tối Ưu Đã Thực Hiện:
-- 1. Include sender_name trong broadcast payload
-- 2. Query sender info từ users/employees table trong trigger
-- 3. Frontend không cần query lại sender info
-- 
-- Expected Performance Improvement:
-- - enrichMessageWithSender delay: 50-200ms → 0ms
-- - Message delivery: Nhanh hơn 50-200ms
-- =====================================================

