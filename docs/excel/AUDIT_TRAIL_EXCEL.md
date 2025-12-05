# 👤 Audit Trail - Theo dõi người tạo nhân viên từ Excel

## ✨ Tính năng mới

Khi import nhân viên từ file Excel, hệ thống sẽ **tự động ghi nhận** thông tin người thực hiện import để theo dõi và audit.

---

## 🎯 Thông tin được lưu

### 1. Trong bảng `users`
Khi tạo user mới từ Excel, các trường sau được tự động điền:

| Trường | Giá trị | Mô tả |
|--------|---------|-------|
| `created_by` | UUID của user đang đăng nhập | Người tạo user này |
| `updated_by` | UUID của user đang đăng nhập | Người cập nhật lần cuối |
| `created_at` | Timestamp hiện tại | Thời gian tạo |
| `updated_at` | Timestamp hiện tại | Thời gian cập nhật |

### 2. Trong bảng `employees`
Khi tạo employee mới từ Excel, các trường sau được tự động điền:

| Trường | Giá trị | Mô tả |
|--------|---------|-------|
| `created_by` | UUID của user đang đăng nhập | Người tạo nhân viên này |
| `updated_by` | UUID của user đang đăng nhập | Người cập nhật lần cuối |
| `created_at` | Timestamp hiện tại | Thời gian tạo |
| `updated_at` | Timestamp hiện tại | Thời gian cập nhật |

---

## 🔒 Xác thực

### Endpoint yêu cầu đăng nhập
```python
@router.post("/upload-excel")
async def upload_excel(
    file: UploadFile = File(...),
    current_user: User = Depends(require_manager_or_admin)  # ← XÁC THỰC
):
```

**Quyền truy cập:**
- ✅ Admin
- ✅ Manager (accountant, sales)
- ❌ Các role khác

---

## 📝 Cách hoạt động

### Backend Flow:

```python
# 1. Lấy thông tin user đang đăng nhập
current_user_id = str(current_user.id)
current_user_email = current_user.email
print(f"👤 Import by: {current_user_email} (ID: {current_user_id})")

# 2. Tạo user record với audit trail
supabase.table("users").insert({
    "id": user_id,
    "email": email,
    # ... các trường khác ...
    "created_by": current_user_id,  # ← Ghi nhận người tạo
    "updated_by": current_user_id,  # ← Ghi nhận người cập nhật
    "created_at": datetime.utcnow().isoformat(),
    "updated_at": datetime.utcnow().isoformat()
}).execute()

# 3. Tạo employee record với audit trail
supabase.table("employees").insert({
    "id": str(uuid.uuid4()),
    # ... các trường khác ...
    "created_by": current_user_id,  # ← Ghi nhận người tạo
    "updated_by": current_user_id,  # ← Ghi nhận người cập nhật
    "created_at": datetime.utcnow().isoformat(),
    "updated_at": datetime.utcnow().isoformat()
}).execute()

# 4. Trả về response với thông tin import
return {
    "message": "Hoàn thành import",
    "success_count": success,
    "error_count": len(errors),
    "total_rows": len(df),
    "imported_by": current_user_email,      # ← Hiển thị cho user
    "imported_by_id": current_user_id,      # ← Có thể dùng cho audit
    "errors": errors[:20]
}
```

---

## 🖥️ Hiển thị trên Frontend

### Interface:
```typescript
interface UploadResult {
  message: string
  success_count: number
  error_count: number
  total_rows: number
  imported_by?: string        // ← Email của người import
  imported_by_id?: string     // ← UUID của người import
  errors: string[]
}
```

### UI Display:
```tsx
{result.imported_by && (
  <p className="text-blue-700 text-xs mt-2 pt-2 border-t border-blue-200">
    <span className="font-semibold">👤 Import bởi:</span> {result.imported_by}
  </p>
)}
```

**Screenshot minh họa:**
```
┌─────────────────────────────────────────┐
│ ✅ Kết quả import                       │
├─────────────────────────────────────────┤
│ Tổng số dòng: 10                        │
│ Thành công: 8                           │
│ Lỗi: 2                                  │
│ ─────────────────────────────────────── │
│ 👤 Import bởi: admin@company.com       │
└─────────────────────────────────────────┘
```

---

## 📊 Truy vấn Audit

### Query 1: Xem ai đã tạo nhân viên cụ thể
```sql
SELECT 
  e.employee_code,
  e.first_name,
  e.last_name,
  e.email,
  e.created_at,
  u.email AS created_by_email,
  u.full_name AS created_by_name
FROM employees e
LEFT JOIN users u ON e.created_by = u.id
WHERE e.id = '<employee_id>';
```

### Query 2: Xem tất cả nhân viên được tạo bởi user cụ thể
```sql
SELECT 
  e.employee_code,
  e.first_name,
  e.last_name,
  e.email,
  e.created_at
FROM employees e
WHERE e.created_by = '<user_id>'
ORDER BY e.created_at DESC;
```

### Query 3: Thống kê số lượng nhân viên được tạo bởi mỗi user
```sql
SELECT 
  u.email,
  u.full_name,
  COUNT(e.id) AS total_created
FROM users u
LEFT JOIN employees e ON e.created_by = u.id
GROUP BY u.id, u.email, u.full_name
ORDER BY total_created DESC;
```

### Query 4: Xem nhân viên được tạo trong khoảng thời gian
```sql
SELECT 
  e.employee_code,
  e.first_name,
  e.last_name,
  e.created_at,
  u.email AS created_by_email
FROM employees e
LEFT JOIN users u ON e.created_by = u.id
WHERE e.created_at BETWEEN '2024-01-01' AND '2024-12-31'
  AND e.created_by IS NOT NULL
ORDER BY e.created_at DESC;
```

---

## 🔍 Log trong Console

### Backend logs:
```
📤 Upload started by user: admin@company.com
🔍 Loading departments and positions...
✅ Found 5 departments
✅ Found 12 positions
👤 Import by: admin@company.com (ID: 123e4567-e89b-12d3-a456-426614174000)
🔄 Processing 10 employees...
✅ Dòng 2: nguyen.vana@company.com
✅ Dòng 3: tran.vanb@company.com
❌ Dòng 4: Email đã tồn tại
✅ Dòng 5: le.vand@company.com
🎉 Import completed: 8 success, 2 errors
```

---

## 🎯 Use Cases

### 1. Truy xuất nguồn gốc
```
❓ Câu hỏi: "Ai đã tạo nhân viên này?"
✅ Trả lời: Xem trường created_by trong database
```

### 2. Audit compliance
```
❓ Câu hỏi: "Khi nào và ai đã import 100 nhân viên mới?"
✅ Trả lời: Query employees với created_at và created_by
```

### 3. Trách nhiệm
```
❓ Câu hỏi: "User X đã tạo bao nhiêu nhân viên?"
✅ Trả lời: COUNT employees WHERE created_by = user_X_id
```

### 4. Khắc phục sự cố
```
❓ Câu hỏi: "Có nhân viên nào bị tạo sai không?"
✅ Trả lời: Xem created_by để liên hệ người đã import
```

---

## 📋 Best Practices

### 1. Luôn đăng nhập trước khi import
```
✅ Đăng nhập với tài khoản cá nhân
❌ Không share account để import
```

### 2. Kiểm tra thông tin trước khi import
```
✅ Review file Excel kỹ trước
✅ Test với file nhỏ trước
❌ Không import hàng loạt mà không kiểm tra
```

### 3. Lưu file Excel đã import
```
✅ Lưu file với tên: import_YYYYMMDD_HH_user.xlsx
✅ Backup file để có thể rollback nếu cần
```

### 4. Ghi chú trong hệ thống
```
✅ Nếu cần, thêm note giải thích batch import
✅ Communicate với team về việc import
```

---

## 🔐 Security & Privacy

### 1. Access Control
- Chỉ Admin/Manager mới import được
- created_by tự động lấy từ session
- Không thể fake created_by

### 2. Data Integrity
- UUID không thể sửa sau khi tạo
- Timestamp chính xác đến millisecond
- Foreign key constraint đảm bảo tính toàn vẹn

### 3. GDPR Compliance
- Lưu thông tin người tạo để audit
- Có thể xóa nếu user request (GDPR right to be forgotten)
- Log retention policy có thể cấu hình

---

## ✅ Checklist

Khi import nhân viên từ Excel:

- [ ] Đã đăng nhập với tài khoản cá nhân
- [ ] Có quyền Admin hoặc Manager
- [ ] File Excel đã được kiểm tra kỹ
- [ ] Hiểu rằng thông tin import sẽ được ghi nhận
- [ ] Sẵn sàng chịu trách nhiệm cho việc import
- [ ] Đã backup file Excel để có thể rollback

---

## 🆘 Troubleshooting

### Vấn đề: Không thấy "Import bởi" trong kết quả
**Nguyên nhân:** Backend chưa restart sau khi update code  
**Giải pháp:** Restart backend với `restart_backend.bat`

### Vấn đề: created_by là NULL trong database
**Nguyên nhân:** Import với version cũ trước khi có audit trail  
**Giải pháp:** Employees mới sẽ có đầy đủ thông tin

### Vấn đề: Muốn biết ai đã import nhân viên cũ
**Nguyên nhân:** Audit trail chỉ áp dụng từ version này trở đi  
**Giải pháp:** Không thể truy xuất cho records cũ

---

## 🎉 Kết luận

Tính năng **Audit Trail** giúp:
- ✅ Truy xuất nguồn gốc dữ liệu
- ✅ Đảm bảo trách nhiệm giải trình
- ✅ Hỗ trợ compliance và audit
- ✅ Khắc phục sự cố nhanh hơn

**Tất cả nhân viên được import từ Excel đều có ghi nhận đầy đủ thông tin người tạo!**

---

*Feature: Audit Trail for Excel Import*  
*Version: 2.1*  
*Date: November 11, 2025*

