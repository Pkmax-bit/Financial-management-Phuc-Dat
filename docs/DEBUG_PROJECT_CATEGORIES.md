# Debug: Project Categories không hiển thị

## Kiểm tra các bước sau:

### 1. Kiểm tra Migration đã chạy chưa

Chạy SQL sau trong Supabase SQL Editor để kiểm tra:

```sql
-- Kiểm tra bảng có tồn tại không
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'project_categories'
);

-- Kiểm tra có dữ liệu không
SELECT COUNT(*) FROM project_categories;

-- Xem danh sách categories
SELECT id, name, code, is_active FROM project_categories ORDER BY display_order;
```

### 2. Nếu bảng chưa tồn tại, chạy Migration

Chạy file migration:
```sql
-- Copy nội dung từ database/migrations/create_project_categories.sql
-- và chạy trong Supabase SQL Editor
```

### 3. Kiểm tra API Endpoint

Mở browser console và kiểm tra:
- Network tab: Xem request đến `/api/projects/categories?is_active=true` có thành công không
- Console: Xem có log "✅ Categories fetched:" không

### 4. Test API trực tiếp

Mở browser và truy cập:
```
http://localhost:8000/api/projects/categories?is_active=true
```
(Thay localhost:8000 bằng URL backend của bạn)

Hoặc dùng curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/projects/categories?is_active=true
```

### 5. Kiểm tra Authentication

Đảm bảo bạn đã đăng nhập và có token hợp lệ. API endpoint yêu cầu authentication.

### 6. Kiểm tra Backend Logs

Xem backend logs để tìm lỗi:
- Nếu dùng Supabase: Kiểm tra Supabase logs
- Nếu dùng local backend: Xem console output

### 7. Tạo Categories thủ công (nếu cần)

Nếu migration không tạo được categories mặc định, chạy SQL:

```sql
INSERT INTO project_categories (name, code, description, color, icon, display_order) VALUES
    ('Dự án cửa', 'door-project', 'Dự án lắp đặt và thi công cửa', '#4ECDC4', 'door', 1),
    ('Dự án tủ bếp', 'kitchen-cabinet-project', 'Dự án thiết kế và thi công tủ bếp', '#FF6B6B', 'chef-hat', 2)
ON CONFLICT (code) DO NOTHING;
```

## Các lỗi thường gặp:

1. **"Failed to fetch project categories"**
   - Bảng `project_categories` chưa tồn tại → Chạy migration
   - Lỗi authentication → Kiểm tra token

2. **Dropdown trống nhưng không có lỗi**
   - Migration chưa tạo dữ liệu mặc định → Chạy SQL insert ở trên
   - API trả về mảng rỗng → Kiểm tra `is_active = true`

3. **CORS error**
   - Kiểm tra backend CORS settings
   - Đảm bảo frontend URL được whitelist

## Debug trong Frontend

Mở browser console và kiểm tra:
```javascript
// Test API trực tiếp
fetch('/api/projects/categories?is_active=true', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```












