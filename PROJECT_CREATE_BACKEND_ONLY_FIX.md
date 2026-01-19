# Fix: Project Creation - Backend Only, No Frontend Direct Creation

## Vấn đề
- Frontend gặp lỗi RLS khi tạo project: `new row violates row-level security policy for table "task_groups"`
- User muốn chỉ backend được tạo dự án, frontend không được tạo trực tiếp

## Nguyên nhân
1. **Trigger tự động tạo task_groups**: Khi tạo project, trigger `trigger_ensure_task_group_on_project_create` tự động chạy function `ensure_task_group_for_project_category()` để tạo task_groups
2. **RLS Policy thiếu**: Function này chạy với quyền của user authenticated, không có quyền insert vào `task_groups` vì thiếu policy cho `service_role`
3. **Function không bypass RLS**: Function không dùng `SECURITY DEFINER` nên không thể bypass RLS

## Giải pháp đã áp dụng

### 1. Thêm RLS Policy cho service_role vào task_groups
```sql
-- Migration: add_service_role_policy_for_task_groups
CREATE POLICY "Service role can insert task_groups" 
ON task_groups 
FOR INSERT 
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role can read task_groups" 
ON task_groups 
FOR SELECT 
USING ((select auth.role()) = 'service_role');
```

### 2. Sửa function để bypass RLS
```sql
-- Migration: fix_ensure_task_group_function_rls
CREATE OR REPLACE FUNCTION public.ensure_task_group_for_project_category()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- Cho phép function bypass RLS
SET search_path = public
AS $$
-- ... function body
$$;
```

## Kết quả
- ✅ Backend có thể tạo project và task_groups tự động
- ✅ Trigger chạy function với quyền SECURITY DEFINER, bypass RLS
- ✅ Frontend chỉ gọi backend API, không tạo trực tiếp
- ✅ RLS policies được bảo vệ, chỉ service_role và authenticated users có quyền

## Kiểm tra
1. Tạo project từ frontend → Backend API được gọi
2. Trigger tự động tạo task_groups → Function chạy với SECURITY DEFINER
3. Tasks được tạo tự động → Backend service tạo tasks với service_role key

## Files đã thay đổi
- `database/migrations/add_service_role_policy_for_task_groups.sql` (via MCP)
- `database/migrations/fix_ensure_task_group_function_rls.sql` (via MCP)
- `backend/routers/projects.py` - Đã có validation và error handling
- `frontend/src/components/projects/CreateProjectModal.tsx` - Chỉ gọi backend API

## Lưu ý
- Function `ensure_task_group_for_project_category()` giờ chạy với quyền của function owner (thường là postgres hoặc service_role)
- Tất cả operations liên quan đến task_groups đều phải qua backend hoặc với service_role key
- Frontend không được phép insert trực tiếp vào task_groups
