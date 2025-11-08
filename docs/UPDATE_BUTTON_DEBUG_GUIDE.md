# Hướng dẫn debug nút cập nhật không lưu được

## 🔍 Vấn đề
Nút "Cập nhật" hoạt động nhưng không lưu được dữ liệu.

## 🛠️ Các bước debug

### 1. Kiểm tra Browser Console
1. Mở trang web và nhấn **F12** để mở Developer Tools
2. Chuyển sang tab **Console**
3. Bấm nút "Cập nhật" và tìm các log sau:
   - `🔄 Starting updateParentExpense...`
   - `📊 workshopParentObject:` (kiểm tra có dữ liệu không)
   - `📊 pendingExpenseData:` (kiểm tra có dữ liệu không)
   - `🔍 Searching for existing parent expense...`
   - `📊 existingParent found:` (kiểm tra có tìm thấy không)

### 2. Các lỗi thường gặp

#### **Lỗi 1: Missing required data**
```
❌ Missing required data: { workshopParentObject: null, pendingExpenseData: null }
```
**Nguyên nhân:** Dữ liệu cần thiết không được load
**Giải pháp:** Kiểm tra xem dialog có được mở đúng cách không

#### **Lỗi 2: No existing parent found**
```
❌ No existing parent found
```
**Nguyên nhân:** Không có chi phí parent nào trong database
**Giải pháp:** Chọn "Tạo chi phí mới" thay vì "Cập nhật"

#### **Lỗi 3: Error searching for existing parent**
```
❌ Error searching for existing parent: [error details]
```
**Nguyên nhân:** Lỗi database query
**Giải pháp:** Kiểm tra kết nối database

### 3. Kiểm tra Database

#### **Kiểm tra có chi phí parent không:**
```sql
-- Kiểm tra project_expenses có dữ liệu không
SELECT * FROM project_expenses WHERE expense_object_id IS NOT NULL;

-- Kiểm tra expense_objects có parent objects không
SELECT * FROM expense_objects WHERE parent_id IS NULL;

-- Kiểm tra projects có dữ liệu không
SELECT * FROM projects;
```

#### **Kiểm tra chi phí parent cụ thể:**
```sql
-- Thay thế 'parent_id' và 'project_id' bằng giá trị thực tế
SELECT * FROM project_expenses 
WHERE expense_object_id = 'parent_id' 
AND project_id = 'project_id';
```

### 4. Debugging Steps

#### **Bước 1: Kiểm tra Console Logs**
1. Mở Console (F12)
2. Bấm nút "Cập nhật"
3. Tìm log `📊 existingParent found:`
4. Nếu là `null` → Không có chi phí parent để cập nhật
5. Nếu có dữ liệu → Kiểm tra bước tiếp theo

#### **Bước 2: Kiểm tra Dữ liệu**
1. Kiểm tra `workshopParentObject` có đúng không
2. Kiểm tra `pendingExpenseData` có đúng không
3. Kiểm tra `project_id` có đúng không

#### **Bước 3: Kiểm tra Database**
1. Kiểm tra có chi phí parent trong database không
2. Kiểm tra `expense_object_id` có đúng không
3. Kiểm tra `project_id` có đúng không

### 5. Các giải pháp

#### **Giải pháp 1: Tạo chi phí mới**
Nếu không có chi phí parent để cập nhật:
1. Chọn "Tạo chi phí mới" thay vì "Cập nhật"
2. Điền thông tin chi phí
3. Bấm "Lưu"

#### **Giải pháp 2: Kiểm tra Database**
Nếu có lỗi database:
1. Kiểm tra kết nối Supabase
2. Kiểm tra quyền truy cập database
3. Kiểm tra cấu trúc bảng

#### **Giải pháp 3: Debug thêm**
Nếu vẫn không rõ nguyên nhân:
1. Thêm console.log vào các function khác
2. Kiểm tra network requests
3. Kiểm tra error messages

### 6. Checklist Debug

- [ ] Kiểm tra browser console có log `🔄 Starting updateParentExpense...` không
- [ ] Kiểm tra `workshopParentObject` có dữ liệu không
- [ ] Kiểm tra `pendingExpenseData` có dữ liệu không
- [ ] Kiểm tra `existingParent found:` có dữ liệu không
- [ ] Kiểm tra database có chi phí parent không
- [ ] Kiểm tra `expense_object_id` có đúng không
- [ ] Kiểm tra `project_id` có đúng không
- [ ] Thử chọn "Tạo chi phí mới" thay vì "Cập nhật"

### 7. Lỗi thường gặp

1. **"Thiếu dữ liệu cần thiết"** → Dialog không được mở đúng cách
2. **"Không tìm thấy chi phí đối tượng cha"** → Chưa có chi phí parent trong database
3. **"Lỗi khi tìm kiếm chi phí đối tượng cha"** → Lỗi database query
4. **"Lỗi khi cập nhật chi phí"** → Lỗi database update

### 8. Hướng dẫn sử dụng

#### **Khi nào dùng "Cập nhật":**
- Đã có chi phí parent trong database
- Muốn thay đổi số tiền của chi phí parent
- Muốn cập nhật thông tin chi phí parent

#### **Khi nào dùng "Tạo chi phí mới":**
- Chưa có chi phí parent trong database
- Muốn tạo chi phí parent mới
- Muốn tạo chi phí con mới

## 📞 Hỗ trợ

Nếu vẫn không giải quyết được, hãy:
1. Chụp screenshot console logs
2. Ghi lại các bước đã thử
3. Cung cấp thông tin database
4. Mô tả chi tiết lỗi gặp phải
