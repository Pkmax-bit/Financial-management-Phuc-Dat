-- Script Test: Flow hoàn chỉnh từ tạo dự án đến thêm file và thông báo
-- Mục đích: Test toàn bộ hệ thống quản lý nhiệm vụ
-- Ngày tạo: 2025-01-XX

-- ============================================
-- BƯỚC 1: TẠO DỰ ÁN
-- ============================================

-- Lấy thông tin customer và user để tạo dự án
DO $$
DECLARE
    v_customer_id UUID;
    v_user_id UUID;
    v_project_id UUID;
    v_task_id UUID;
    v_subtask_id UUID;
    v_employee_id_1 UUID;
    v_employee_id_2 UUID;
    v_employee_id_3 UUID;
    v_user_id_1 UUID;
    v_user_id_2 UUID;
    v_user_id_3 UUID;
    v_participant_id_1 UUID;
    v_participant_id_2 UUID;
    v_participant_id_3 UUID;
    v_notification_count INTEGER;
BEGIN
    -- Lấy customer đầu tiên
    SELECT id INTO v_customer_id
    FROM customers
    LIMIT 1;
    
    -- Lấy user đầu tiên (admin)
    SELECT id INTO v_user_id
    FROM users
    WHERE role IN ('admin', 'manager')
    LIMIT 1;
    
    IF v_customer_id IS NULL OR v_user_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy customer hoặc user để test';
    END IF;
    
    -- Tạo dự án
    INSERT INTO projects (
        name,
        customer_id,
        status,
        created_by,
        created_at,
        updated_at
    )
    VALUES (
        'Dự án Test - ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI'),
        v_customer_id,
        'planning',
        v_user_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_project_id;
    
    RAISE NOTICE '✓ Đã tạo dự án: %', v_project_id;
    
    -- ============================================
    -- BƯỚC 2: THÊM THÀNH VIÊN VÀO ĐỘI NGŨ DỰ ÁN
    -- ============================================
    
    -- Lấy 3 nhân viên khác nhau
    SELECT id, user_id INTO v_employee_id_1, v_user_id_1
    FROM employees
    WHERE user_id IS NOT NULL
        AND id != (SELECT id FROM employees WHERE user_id = v_user_id LIMIT 1)
    LIMIT 1;
    
    SELECT id, user_id INTO v_employee_id_2, v_user_id_2
    FROM employees
    WHERE user_id IS NOT NULL
        AND id != v_employee_id_1
        AND id != (SELECT id FROM employees WHERE user_id = v_user_id LIMIT 1)
    LIMIT 1;
    
    SELECT id, user_id INTO v_employee_id_3, v_user_id_3
    FROM employees
    WHERE user_id IS NOT NULL
        AND id != v_employee_id_1
        AND id != v_employee_id_2
        AND id != (SELECT id FROM employees WHERE user_id = v_user_id LIMIT 1)
    LIMIT 1;
    
    -- Thêm thành viên vào project_team với các vai trò khác nhau
    -- Nhân viên 1: accountable (responsible)
    INSERT INTO project_team (
        project_id,
        user_id,
        name,
        email,
        status,
        responsibility_type,
        created_at,
        updated_at
    )
    SELECT 
        v_project_id,
        v_user_id_1,
        e.first_name || ' ' || e.last_name,
        e.email,
        'active',
        'accountable',
        NOW(),
        NOW()
    FROM employees e
    WHERE e.id = v_employee_id_1
    ON CONFLICT DO NOTHING;
    
    -- Nhân viên 2: consulted (participant)
    INSERT INTO project_team (
        project_id,
        user_id,
        name,
        email,
        status,
        responsibility_type,
        created_at,
        updated_at
    )
    SELECT 
        v_project_id,
        v_user_id_2,
        e.first_name || ' ' || e.last_name,
        e.email,
        'active',
        'consulted',
        NOW(),
        NOW()
    FROM employees e
    WHERE e.id = v_employee_id_2
    ON CONFLICT DO NOTHING;
    
    -- Nhân viên 3: informed (observer)
    INSERT INTO project_team (
        project_id,
        user_id,
        name,
        email,
        status,
        responsibility_type,
        created_at,
        updated_at
    )
    SELECT 
        v_project_id,
        v_user_id_3,
        e.first_name || ' ' || e.last_name,
        e.email,
        'active',
        'informed',
        NOW(),
        NOW()
    FROM employees e
    WHERE e.id = v_employee_id_3
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✓ Đã thêm 3 thành viên vào đội ngũ dự án';
    
    -- ============================================
    -- BƯỚC 3: TẠO NHIỆM VỤ CHÍNH
    -- ============================================
    
    INSERT INTO tasks (
        title,
        description,
        status,
        priority,
        project_id,
        created_by,
        due_date,
        created_at,
        updated_at
    )
    VALUES (
        'Nhiệm vụ Test - Thiết kế hệ thống',
        'Thiết kế và phát triển hệ thống quản lý dự án với đầy đủ tính năng',
        'todo',
        'high',
        v_project_id,
        v_user_id,
        NOW() + INTERVAL '7 days',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_task_id;
    
    RAISE NOTICE '✓ Đã tạo nhiệm vụ chính: %', v_task_id;
    
    -- Kiểm tra xem participants đã được tự động thêm chưa (từ trigger)
    SELECT COUNT(*) INTO v_notification_count
    FROM task_notifications
    WHERE task_id = v_task_id
        AND notification_type = 'task_assigned';
    
    RAISE NOTICE '✓ Đã tạo % thông báo khi tạo task (tự động từ project_team)', v_notification_count;
    
    -- ============================================
    -- BƯỚC 4: THÊM THÀNH VIÊN VÀO NHIỆM VỤ (THỦ CÔNG)
    -- ============================================
    
    -- Thêm nhân viên 1 với vai trò responsible (đã có từ project_team, nhưng test thêm)
    INSERT INTO task_participants (
        task_id,
        employee_id,
        role,
        added_by,
        created_at
    )
    VALUES (
        v_task_id,
        v_employee_id_1,
        'responsible',
        v_user_id,
        NOW()
    )
    ON CONFLICT (task_id, employee_id) DO UPDATE SET role = 'responsible'
    RETURNING id INTO v_participant_id_1;
    
    -- Thêm nhân viên 2 với vai trò participant
    INSERT INTO task_participants (
        task_id,
        employee_id,
        role,
        added_by,
        created_at
    )
    VALUES (
        v_task_id,
        v_employee_id_2,
        'participant',
        v_user_id,
        NOW()
    )
    ON CONFLICT (task_id, employee_id) DO UPDATE SET role = 'participant'
    RETURNING id INTO v_participant_id_2;
    
    -- Thêm nhân viên 3 với vai trò observer
    INSERT INTO task_participants (
        task_id,
        employee_id,
        role,
        added_by,
        created_at
    )
    VALUES (
        v_task_id,
        v_employee_id_3,
        'observer',
        v_user_id,
        NOW()
    )
    ON CONFLICT (task_id, employee_id) DO UPDATE SET role = 'observer'
    RETURNING id INTO v_participant_id_3;
    
    RAISE NOTICE '✓ Đã thêm 3 thành viên vào nhiệm vụ với các vai trò khác nhau';
    
    -- Kiểm tra thông báo đã được tạo
    SELECT COUNT(*) INTO v_notification_count
    FROM task_notifications
    WHERE task_id = v_task_id
        AND notification_type = 'task_assigned';
    
    RAISE NOTICE '✓ Tổng số thông báo "task_assigned": %', v_notification_count;
    
    -- ============================================
    -- BƯỚC 5: TẠO NHIỆM VỤ NHỎ (SUB-TASK)
    -- ============================================
    
    INSERT INTO tasks (
        title,
        description,
        status,
        priority,
        project_id,
        parent_id,
        created_by,
        due_date,
        created_at,
        updated_at
    )
    VALUES (
        'Nhiệm vụ con - Thiết kế database',
        'Thiết kế cơ sở dữ liệu cho hệ thống',
        'todo',
        'medium',
        v_project_id,
        v_task_id,
        v_user_id,
        NOW() + INTERVAL '3 days',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_subtask_id;
    
    RAISE NOTICE '✓ Đã tạo nhiệm vụ con: %', v_subtask_id;
    
    -- Thêm thành viên vào subtask
    INSERT INTO task_participants (
        task_id,
        employee_id,
        role,
        added_by,
        created_at
    )
    VALUES (
        v_subtask_id,
        v_employee_id_1,
        'responsible',
        v_user_id,
        NOW()
    )
    ON CONFLICT (task_id, employee_id) DO NOTHING;
    
    INSERT INTO task_participants (
        task_id,
        employee_id,
        role,
        added_by,
        created_at
    )
    VALUES (
        v_subtask_id,
        v_employee_id_2,
        'participant',
        v_user_id,
        NOW()
    )
    ON CONFLICT (task_id, employee_id) DO NOTHING;
    
    RAISE NOTICE '✓ Đã thêm thành viên vào nhiệm vụ con';
    
    -- ============================================
    -- BƯỚC 6: THÊM FILE MẪU
    -- ============================================
    
    -- Tạo file attachment mẫu
    INSERT INTO task_attachments (
        task_id,
        file_name,
        original_file_name,
        file_url,
        file_type,
        file_size,
        uploaded_by,
        created_at
    )
    VALUES (
        v_task_id,
        'sample_design_document.pdf',
        'Tài liệu thiết kế mẫu.pdf',
        'https://example.com/files/sample_design_document.pdf',
        'application/pdf',
        1024000,
        v_user_id,
        NOW()
    );
    
    RAISE NOTICE '✓ Đã thêm file mẫu vào nhiệm vụ';
    
    -- ============================================
    -- BƯỚC 7: CẬP NHẬT NHIỆM VỤ (TEST THÔNG BÁO)
    -- ============================================
    
    -- Cập nhật status và priority để trigger thông báo
    UPDATE tasks
    SET status = 'in_progress',
        priority = 'urgent',
        updated_at = NOW()
    WHERE id = v_task_id;
    
    RAISE NOTICE '✓ Đã cập nhật nhiệm vụ (status, priority)';
    
    -- Kiểm tra thông báo đã được tạo
    SELECT COUNT(*) INTO v_notification_count
    FROM task_notifications
    WHERE task_id = v_task_id
        AND notification_type = 'task_updated';
    
    RAISE NOTICE '✓ Đã tạo % thông báo "task_updated" cho tất cả participants', v_notification_count;
    
    -- ============================================
    -- BƯỚC 8: CẬP NHẬT VAI TRÒ (TEST THÔNG BÁO)
    -- ============================================
    
    -- Cập nhật vai trò của nhân viên 2
    UPDATE task_participants
    SET role = 'responsible'
    WHERE id = v_participant_id_2
        AND role = 'participant';
    
    RAISE NOTICE '✓ Đã cập nhật vai trò của nhân viên 2 từ participant → responsible';
    
    -- Kiểm tra thông báo
    SELECT COUNT(*) INTO v_notification_count
    FROM task_notifications
    WHERE task_id = v_task_id
        AND employee_id = v_employee_id_2
        AND notification_type = 'role_updated';
    
    RAISE NOTICE '✓ Đã tạo % thông báo "role_updated"', v_notification_count;
    
    -- ============================================
    -- BƯỚC 9: TÓM TẮT KẾT QUẢ
    -- ============================================
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TÓM TẮT KẾT QUẢ TEST';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Project ID: %', v_project_id;
    RAISE NOTICE 'Task ID: %', v_task_id;
    RAISE NOTICE 'Sub-task ID: %', v_subtask_id;
    RAISE NOTICE 'Thành viên 1 (responsible): %', v_employee_id_1;
    RAISE NOTICE 'Thành viên 2 (participant → responsible): %', v_employee_id_2;
    RAISE NOTICE 'Thành viên 3 (observer): %', v_employee_id_3;
    RAISE NOTICE '';
    RAISE NOTICE 'Để xem chi tiết, chạy các query sau:';
    RAISE NOTICE '1. SELECT * FROM projects WHERE id = ''%'';', v_project_id;
    RAISE NOTICE '2. SELECT * FROM tasks WHERE id = ''%'' OR parent_id = ''%'';', v_task_id, v_task_id;
    RAISE NOTICE '3. SELECT * FROM task_participants WHERE task_id = ''%'' OR task_id = ''%'';', v_task_id, v_subtask_id;
    RAISE NOTICE '4. SELECT * FROM task_notifications WHERE task_id = ''%'' ORDER BY created_at DESC;', v_task_id;
    RAISE NOTICE '5. SELECT * FROM task_attachments WHERE task_id = ''%'';', v_task_id;
    RAISE NOTICE '========================================';
    
END $$;

-- ============================================
-- XEM KẾT QUẢ
-- ============================================

-- Xem project vừa tạo
SELECT 
    p.id,
    p.name,
    p.status,
    COUNT(DISTINCT pt.id) as team_members,
    COUNT(DISTINCT t.id) as tasks_count,
    COUNT(DISTINCT tp.id) as participants_count,
    COUNT(DISTINCT tn.id) as notifications_count
FROM projects p
LEFT JOIN project_team pt ON pt.project_id = p.id AND pt.status = 'active'
LEFT JOIN tasks t ON t.project_id = p.id
LEFT JOIN task_participants tp ON tp.task_id = t.id
LEFT JOIN task_notifications tn ON tn.task_id = t.id
WHERE p.name LIKE 'Dự án Test%'
GROUP BY p.id, p.name, p.status
ORDER BY p.created_at DESC
LIMIT 1;





