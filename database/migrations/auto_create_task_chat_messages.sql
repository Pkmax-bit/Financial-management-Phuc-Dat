-- Migration: Tự động tạo tin nhắn hệ thống trong chat khi tạo / cập nhật nhiệm vụ
-- Mục tiêu:
--   - Khi tạo nhiệm vụ mới  -> tạo cuộc trò chuyện (nếu chưa có) + 1 tin nhắn hệ thống.
--   - Khi cập nhật nhiệm vụ -> thêm tin nhắn hệ thống mô tả thay đổi (status, priority, due_date, title).
--
-- Lưu ý:
--   - Conversation liên kết qua internal_conversations.task_id
--   - Tin nhắn lưu ở internal_messages với message_type = 'system'

-- Function: lấy hoặc tạo conversation cho task
CREATE OR REPLACE FUNCTION get_or_create_task_conversation(p_task_id UUID, p_task_title TEXT, p_created_by UUID)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Thử tìm conversation đã tồn tại cho task
    SELECT id INTO v_conversation_id
    FROM internal_conversations
    WHERE task_id = p_task_id
    ORDER BY created_at
    LIMIT 1;

    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    -- Nếu chưa có conversation và có created_by thì tạo mới
    IF p_created_by IS NULL THEN
        -- Không có user để gắn sender/conversation -> bỏ qua
        RETURN NULL;
    END IF;

    INSERT INTO internal_conversations (
        name,
        type,
        task_id,
        created_by
    )
    VALUES (
        COALESCE(NULLIF(p_task_title, ''), 'Nhiệm vụ'),
        'group',
        p_task_id,
        p_created_by
    )
    RETURNING id INTO v_conversation_id;

    -- Thêm người tạo task vào participants (nếu chưa có)
    INSERT INTO internal_conversation_participants (conversation_id, user_id)
    VALUES (v_conversation_id, p_created_by)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;


-- Function: tạo tin nhắn hệ thống khi tạo task mới
CREATE OR REPLACE FUNCTION auto_create_task_chat_message_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Chỉ xử lý nếu có người tạo task
    IF NEW.created_by IS NULL THEN
        RETURN NEW;
    END IF;

    -- Lấy hoặc tạo conversation cho task
    v_conversation_id := get_or_create_task_conversation(NEW.id, NEW.title, NEW.created_by);

    IF v_conversation_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Tạo tin nhắn hệ thống
    INSERT INTO internal_messages (
        conversation_id,
        sender_id,
        message_text,
        message_type
    )
    VALUES (
        v_conversation_id,
        NEW.created_by,
        'Nhiệm vụ mới được tạo: ' || COALESCE(NULLIF(NEW.title, ''), '(Không có tiêu đề)'),
        'system'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Function: tạo tin nhắn hệ thống khi cập nhật task
CREATE OR REPLACE FUNCTION auto_create_task_chat_message_on_update()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation_id UUID;
    v_change_message TEXT;
BEGIN
    -- Chỉ xử lý nếu có thay đổi quan trọng
    IF OLD.status = NEW.status 
       AND OLD.priority = NEW.priority 
       AND OLD.due_date IS NOT DISTINCT FROM NEW.due_date
       AND OLD.title = NEW.title THEN
        RETURN NEW;
    END IF;

    -- Nếu không có created_by thì bỏ qua (không có sender_id hợp lệ)
    IF NEW.created_by IS NULL THEN
        RETURN NEW;
    END IF;

    -- Lấy hoặc tạo conversation cho task
    v_conversation_id := get_or_create_task_conversation(NEW.id, NEW.title, NEW.created_by);

    IF v_conversation_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Xây dựng nội dung thay đổi (giống auto_notify_task_updated)
    v_change_message := '';

    IF OLD.status IS DISTINCT FROM NEW.status THEN
        v_change_message := v_change_message || 'Trạng thái: ' || OLD.status || ' → ' || NEW.status || '. ';
    END IF;

    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        v_change_message := v_change_message || 'Độ ưu tiên: ' || OLD.priority || ' → ' || NEW.priority || '. ';
    END IF;

    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
        IF NEW.due_date IS NOT NULL THEN
            v_change_message := v_change_message || 'Hạn chót: ' || TO_CHAR(NEW.due_date, 'DD/MM/YYYY') || '. ';
        ELSE
            v_change_message := v_change_message || 'Hạn chót đã được gỡ bỏ. ';
        END IF;
    END IF;

    IF v_change_message = '' THEN
        RETURN NEW;
    END IF;

    -- Tạo tin nhắn hệ thống mô tả thay đổi
    INSERT INTO internal_messages (
        conversation_id,
        sender_id,
        message_text,
        message_type
    )
    VALUES (
        v_conversation_id,
        NEW.created_by,
        'Nhiệm vụ "' || COALESCE(NULLIF(NEW.title, ''), '(Không có tiêu đề)') || '" đã được cập nhật: ' || v_change_message,
        'system'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Triggers
DROP TRIGGER IF EXISTS trigger_auto_create_task_chat_message_on_insert ON tasks;
CREATE TRIGGER trigger_auto_create_task_chat_message_on_insert
    AFTER INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_task_chat_message_on_insert();

DROP TRIGGER IF EXISTS trigger_auto_create_task_chat_message_on_update ON tasks;
CREATE TRIGGER trigger_auto_create_task_chat_message_on_update
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_task_chat_message_on_update();

COMMENT ON FUNCTION auto_create_task_chat_message_on_insert() IS
    'Tự động tạo tin nhắn hệ thống trong chat khi tạo nhiệm vụ mới';

COMMENT ON FUNCTION auto_create_task_chat_message_on_update() IS
    'Tự động tạo tin nhắn hệ thống trong chat khi nhiệm vụ được cập nhật (status, priority, due_date, title)';


