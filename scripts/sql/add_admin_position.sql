-- =====================================================
-- SCRIPT THÊM CHỨC VỤ ADMIN CHO PHÒNG BAN QUẢN LÝ
-- =====================================================
-- Script này thêm chức vụ "admin" vào phòng ban "Quản lý"
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. KIỂM TRA VÀ LẤY ID PHÒNG BAN QUẢN LÝ
-- =====================================================

-- Tìm phòng ban "Quản lý" (có thể có id là 'dept-001' hoặc tìm theo name/code)
DO $$
DECLARE
    v_dept_id UUID;
    v_position_code VARCHAR(50);
    v_position_id UUID;
BEGIN
    -- Tìm phòng ban "Quản lý" theo code hoặc name
    SELECT id INTO v_dept_id
    FROM departments
    WHERE (code = 'MGMT' OR name = 'Quản lý')
    AND is_active = true
    LIMIT 1;

    -- Nếu không tìm thấy, thử tìm theo id cố định
    IF v_dept_id IS NULL THEN
        SELECT id INTO v_dept_id
        FROM departments
        WHERE id = 'dept-001'
        LIMIT 1;
    END IF;

    -- Kiểm tra xem chức vụ admin đã tồn tại chưa
    IF v_dept_id IS NOT NULL THEN
        SELECT id INTO v_position_id
        FROM positions
        WHERE name = 'Admin' 
        AND department_id = v_dept_id
        LIMIT 1;

        -- Nếu chưa tồn tại, tạo mới
        IF v_position_id IS NULL THEN
            -- Tạo mã chức vụ
            v_position_code := 'POS-MGMT-ADMIN';
            
            -- Kiểm tra mã có trùng không
            WHILE EXISTS (SELECT 1 FROM positions WHERE code = v_position_code) LOOP
                v_position_code := 'POS-MGMT-ADMIN-' || floor(random() * 1000)::text;
            END LOOP;

            -- Tạo chức vụ admin
            INSERT INTO positions (
                id,
                name,
                code,
                description,
                department_id,
                salary_range_min,
                salary_range_max,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                'Admin',
                v_position_code,
                'Quản trị viên hệ thống - Phòng Quản lý',
                v_dept_id,
                30000000,  -- Lương tối thiểu: 30 triệu
                60000000,  -- Lương tối đa: 60 triệu
                true,
                now(),
                now()
            )
            RETURNING id INTO v_position_id;

            RAISE NOTICE '✅ Đã tạo chức vụ Admin thành công!';
            RAISE NOTICE '   - ID: %', v_position_id;
            RAISE NOTICE '   - Mã: %', v_position_code;
            RAISE NOTICE '   - Phòng ban: Quản lý (ID: %)', v_dept_id;
        ELSE
            RAISE NOTICE '⚠️ Chức vụ Admin đã tồn tại trong phòng ban Quản lý!';
            RAISE NOTICE '   - ID: %', v_position_id;
        END IF;
    ELSE
        RAISE NOTICE '❌ Không tìm thấy phòng ban "Quản lý"!';
        RAISE NOTICE '   Vui lòng tạo phòng ban "Quản lý" trước khi chạy script này.';
    END IF;
END $$;

-- =====================================================
-- 2. KIỂM TRA KẾT QUẢ
-- =====================================================

-- Hiển thị chức vụ Admin vừa tạo (nếu có)
SELECT 
    p.id,
    p.name as "Tên chức vụ",
    p.code as "Mã chức vụ",
    p.description as "Mô tả",
    d.name as "Phòng ban",
    p.salary_range_min as "Lương tối thiểu",
    p.salary_range_max as "Lương tối đa",
    p.is_active as "Hoạt động",
    p.created_at as "Ngày tạo"
FROM positions p
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.name = 'Admin' 
AND (d.code = 'MGMT' OR d.name = 'Quản lý')
ORDER BY p.created_at DESC;

