# 📋 Hướng Dẫn Lấy Thông Tin Nhiệm Vụ "test 7"

## 🎯 Mục đích

Lấy thông tin:
- ✅ Nhóm hiện tại của nhiệm vụ
- ✅ Thông tin nhiệm vụ "test 7"
- ✅ Tất cả thành viên của nhiệm vụ (từ các nguồn khác nhau)

---

## 🔧 Cách 1: Sử dụng SQL Query (KHUYẾN NGHỊ)

### Bước 1: Mở Supabase SQL Editor

```
1. Truy cập: https://app.supabase.com
2. Chọn project của bạn
3. Vào menu "SQL Editor"
4. Click "New Query"
```

### Bước 2: Copy và chạy SQL

**File:** `scripts/get_task_info.sql`

Copy toàn bộ nội dung file và paste vào SQL Editor, sau đó click "Run".

### Bước 3: Xem kết quả

Bạn sẽ thấy 6 kết quả:

1. **Task Info** - Thông tin nhiệm vụ
2. **Group Info** - Thông tin nhóm (nếu có)
3. **Assignments** - Từ bảng `task_assignments`
4. **Participants** - Từ bảng `task_participants`
5. **Group Members** - Từ bảng `task_group_members` (nếu có group_id)
6. **Assigned To** - Từ `tasks.assigned_to`
7. **Tổng hợp** - Tất cả thành viên từ tất cả nguồn

---

## 🐍 Cách 2: Sử dụng Python Script

### Bước 1: Cài đặt dependencies

```bash
cd backend
pip install python-dotenv supabase
```

### Bước 2: Kiểm tra .env

Đảm bảo file `backend/.env` có:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
# hoặc
SUPABASE_ANON_KEY=your_anon_key
```

### Bước 3: Chạy script

**Windows PowerShell:**
```powershell
cd backend
python ..\scripts\get_task_info.py
```

**Windows CMD:**
```cmd
cd backend
python ..\scripts\get_task_info.py
```

**Mac/Linux:**
```bash
cd backend
python ../scripts/get_task_info.py
```

### Bước 4: Xem kết quả

Script sẽ in ra:
- ✅ Thông tin nhiệm vụ
- ✅ Thông tin nhóm
- ✅ Danh sách assignments
- ✅ Danh sách participants
- ✅ Danh sách group members

---

## 📊 Cấu trúc dữ liệu

### Nguồn dữ liệu thành viên (theo thứ tự ưu tiên):

1. **task_assignments** (Ưu tiên cao nhất)
   - Bảng: `task_assignments`
   - Field: `assigned_to` → join với `employees`
   - Field: `assigned_to_name` (được tạo từ first_name + last_name)

2. **task_participants**
   - Bảng: `task_participants`
   - Field: `employee_id` → join với `employees`
   - Field: `role` (responsible, participant, observer)

3. **task_group_members** (nếu có group_id)
   - Bảng: `task_group_members`
   - Field: `employee_id` → join với `employees`
   - Field: `role`

4. **tasks.assigned_to** (Fallback)
   - Bảng: `tasks`
   - Field: `assigned_to` → join với `employees`
   - Field: `assigned_to_name` (được tạo từ first_name + last_name)

---

## 🔍 Query nhanh (Copy & Paste)

### Tìm task_id của "test 7"
```sql
SELECT id, title, group_id, assigned_to 
FROM tasks 
WHERE LOWER(title) LIKE '%test 7%' 
  AND deleted_at IS NULL;
```

### Lấy tất cả thành viên (thay YOUR_TASK_ID)
```sql
-- Từ assignments
SELECT 'assignments' as source, e.*
FROM task_assignments ta
JOIN employees e ON ta.assigned_to = e.id
WHERE ta.task_id = 'YOUR_TASK_ID'

UNION ALL

-- Từ participants
SELECT 'participants' as source, e.*
FROM task_participants tp
JOIN employees e ON tp.employee_id = e.id
WHERE tp.task_id = 'YOUR_TASK_ID'

UNION ALL

-- Từ group members
SELECT 'group_members' as source, e.*
FROM tasks t
JOIN task_group_members tgm ON tgm.group_id = t.group_id
JOIN employees e ON tgm.employee_id = e.id
WHERE t.id = 'YOUR_TASK_ID'
  AND t.group_id IS NOT NULL;
```

---

## 📝 Ví dụ kết quả

```
📋 NHIỆM VỤ: test 7
ID: abc-123-def
Trạng thái: in_progress
Ưu tiên: high

👤 Người phụ trách (từ task.assigned_to):
   - Tên: Nguyễn Văn A
   - Email: a@example.com

👥 NHÓM:
   - Tên: Nhóm Phát Triển
   - Mô tả: Nhóm làm việc phát triển

📝 ASSIGNMENTS:
   1. Nguyễn Văn A (ID: emp-001)
   2. Trần Văn B (ID: emp-002)

👥 PARTICIPANTS:
   1. Nguyễn Văn A (Vai trò: responsible)
   2. Trần Văn B (Vai trò: participant)

👥 GROUP MEMBERS:
   1. Nguyễn Văn A
   2. Trần Văn B
   3. Lê Văn C
```

---

## 🆘 Troubleshooting

### Không tìm thấy nhiệm vụ
- Kiểm tra tên nhiệm vụ có đúng không
- Kiểm tra nhiệm vụ có bị xóa không (`deleted_at IS NULL`)

### Không có thành viên
- Kiểm tra từng nguồn: assignments, participants, group_members
- Kiểm tra foreign keys có đúng không
- Kiểm tra employees có tồn tại không

### Lỗi khi chạy Python script
- Kiểm tra `.env` file có đúng không
- Kiểm tra đã cài `supabase` và `python-dotenv` chưa
- Kiểm tra SUPABASE_URL và KEY có đúng không

---

*File: GET_TASK_INFO_GUIDE.md*  
*Script: scripts/get_task_info.py*  
*SQL: scripts/get_task_info.sql*

