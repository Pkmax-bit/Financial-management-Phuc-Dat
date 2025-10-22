-- Script để kiểm tra và cập nhật tổng đối tượng cha
-- Sử dụng khi cần kiểm tra tính chính xác của tổng đối tượng cha

-- 1. Kiểm tra tất cả đối tượng cha và con
SELECT 
    eo.id,
    eo.name,
    eo.is_parent,
    eo.parent_id,
    CASE 
        WHEN eo.parent_id IS NULL THEN 'Parent'
        ELSE 'Child'
    END as object_type
FROM expense_objects eo
ORDER BY eo.parent_id, eo.name;

-- 2. Kiểm tra tổng chi phí của từng đối tượng con
SELECT 
    eo.id as child_id,
    eo.name as child_name,
    eo.parent_id,
    COALESCE(SUM(pe.amount), 0) as total_amount
FROM expense_objects eo
LEFT JOIN project_expenses pe ON eo.id = pe.expense_object_id
WHERE eo.parent_id IS NOT NULL
GROUP BY eo.id, eo.name, eo.parent_id
ORDER BY eo.parent_id, eo.name;

-- 3. Kiểm tra tổng chi phí của từng đối tượng cha
SELECT 
    eo.id as parent_id,
    eo.name as parent_name,
    COALESCE(SUM(pe.amount), 0) as parent_total_amount
FROM expense_objects eo
LEFT JOIN project_expenses pe ON eo.id = pe.expense_object_id
WHERE eo.is_parent = true
GROUP BY eo.id, eo.name
ORDER BY eo.name;

-- 4. So sánh tổng đối tượng cha với tổng các đối tượng con
WITH child_totals AS (
    SELECT 
        eo.parent_id,
        SUM(pe.amount) as children_total
    FROM expense_objects eo
    JOIN project_expenses pe ON eo.id = pe.expense_object_id
    WHERE eo.parent_id IS NOT NULL
    GROUP BY eo.parent_id
),
parent_totals AS (
    SELECT 
        eo.id as parent_id,
        eo.name as parent_name,
        COALESCE(SUM(pe.amount), 0) as parent_total
    FROM expense_objects eo
    LEFT JOIN project_expenses pe ON eo.id = pe.expense_object_id
    WHERE eo.is_parent = true
    GROUP BY eo.id, eo.name
)
SELECT 
    pt.parent_id,
    pt.parent_name,
    pt.parent_total,
    COALESCE(ct.children_total, 0) as children_total,
    CASE 
        WHEN pt.parent_total = COALESCE(ct.children_total, 0) THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM parent_totals pt
LEFT JOIN child_totals ct ON pt.parent_id = ct.parent_id
ORDER BY pt.parent_name;

-- 5. Tìm các đối tượng cha có tổng không khớp
WITH child_totals AS (
    SELECT 
        eo.parent_id,
        SUM(pe.amount) as children_total
    FROM expense_objects eo
    JOIN project_expenses pe ON eo.id = pe.expense_object_id
    WHERE eo.parent_id IS NOT NULL
    GROUP BY eo.parent_id
),
parent_totals AS (
    SELECT 
        eo.id as parent_id,
        eo.name as parent_name,
        COALESCE(SUM(pe.amount), 0) as parent_total
    FROM expense_objects eo
    LEFT JOIN project_expenses pe ON eo.id = pe.expense_object_id
    WHERE eo.is_parent = true
    GROUP BY eo.id, eo.name
)
SELECT 
    pt.parent_id,
    pt.parent_name,
    pt.parent_total,
    COALESCE(ct.children_total, 0) as children_total,
    (pt.parent_total - COALESCE(ct.children_total, 0)) as difference
FROM parent_totals pt
LEFT JOIN child_totals ct ON pt.parent_id = ct.parent_id
WHERE pt.parent_total != COALESCE(ct.children_total, 0)
ORDER BY ABS(pt.parent_total - COALESCE(ct.children_total, 0)) DESC;

-- 6. Cập nhật tổng đối tượng cha (chạy cẩn thận!)
-- LƯU Ý: Script này sẽ cập nhật trực tiếp database, hãy backup trước khi chạy

-- Tạo function để cập nhật tổng đối tượng cha
CREATE OR REPLACE FUNCTION update_parent_expense_totals()
RETURNS void AS $$
DECLARE
    parent_record RECORD;
    child_total NUMERIC;
BEGIN
    -- Lặp qua tất cả đối tượng cha
    FOR parent_record IN 
        SELECT id, name FROM expense_objects WHERE is_parent = true
    LOOP
        -- Tính tổng chi phí của tất cả đối tượng con
        SELECT COALESCE(SUM(amount), 0) INTO child_total
        FROM project_expenses pe
        JOIN expense_objects eo ON pe.expense_object_id = eo.id
        WHERE eo.parent_id = parent_record.id;
        
        -- Kiểm tra xem đã có record tổng kết chưa
        IF EXISTS (
            SELECT 1 FROM project_expenses 
            WHERE expense_object_id = parent_record.id 
            AND description LIKE 'Tổng%'
        ) THEN
            -- Cập nhật record tổng kết
            UPDATE project_expenses 
            SET amount = child_total,
                updated_at = NOW()
            WHERE expense_object_id = parent_record.id 
            AND description LIKE 'Tổng%';
        ELSE
            -- Tạo record tổng kết mới
            INSERT INTO project_expenses (
                id, description, amount, expense_date, 
                expense_object_id, status, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                'Tổng ' || parent_record.name,
                child_total,
                CURRENT_DATE,
                parent_record.id,
                'pending',
                NOW(),
                NOW()
            );
        END IF;
        
        RAISE NOTICE 'Updated parent %: % VND', parent_record.name, child_total;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Chạy function để cập nhật tất cả tổng đối tượng cha
-- SELECT update_parent_expense_totals();

-- 7. Kiểm tra kết quả sau khi cập nhật
-- SELECT 
--     eo.id as parent_id,
--     eo.name as parent_name,
--     pe.amount as parent_total,
--     pe.description,
--     pe.created_at,
--     pe.updated_at
-- FROM expense_objects eo
-- LEFT JOIN project_expenses pe ON eo.id = pe.expense_object_id
-- WHERE eo.is_parent = true
-- ORDER BY eo.name;

-- 8. Xóa function sau khi sử dụng (tùy chọn)
-- DROP FUNCTION IF EXISTS update_parent_expense_totals();
