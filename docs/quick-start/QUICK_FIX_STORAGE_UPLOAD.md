# ⚡ Hướng Dẫn Nhanh: Sửa Lỗi Upload File Tài Liệu

## 🚨 Lỗi Hiện Tại

```
Không thể upload file: Loại file 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
không được phép bởi cấu hình Supabase Storage bucket.
```

## ✅ Giải Pháp (5 Phút)

### Bước 1: Mở Supabase Dashboard
1. Vào https://supabase.com/dashboard
2. Đăng nhập và chọn project của bạn

### Bước 2: Vào Storage Settings
1. Click **Storage** ở sidebar bên trái
2. Click vào bucket **`minhchung_chiphi`**
3. Click vào tab **Settings** (KHÔNG phải Policies)

### Bước 3: Xóa MIME Type Restrictions (Cách Nhanh Nhất)

**Tìm phần "File type restrictions" hoặc "Allowed MIME types"**

**Option A: Xóa Tất Cả (Khuyến nghị)**
- Xóa **TẤT CẢ** các MIME types trong danh sách
- Hoặc tắt switch **"Restrict file types"**
- Click **Save** hoặc **Update**

**Option B: Thêm Các MIME Types Cần Thiết**

⚠️ **QUAN TRỌNG**: Supabase yêu cầu mỗi MIME type trên **MỘT DÒNG RIÊNG**, không phải comma-separated!

Cách nhập đúng:
1. Click vào ô input "Allowed MIME types"
2. Nhập **MỘT MIME type** trên mỗi dòng (nhấn Enter sau mỗi type):

```
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.ms-excel
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
text/plain
text/csv
application/octet-stream
image/jpeg
image/jpg
image/png
image/gif
image/webp
```

3. **KHÔNG** nhập dạng comma-separated như: `application/pdf, text/plain` ❌
4. Sau đó click **Save**

### Bước 4: Kiểm Tra
1. Quay lại ứng dụng
2. Thử upload lại file Excel/PDF/text
3. Nếu thành công → Xong! ✅

## 📝 Lưu Ý

- **MIME type restrictions** được cấu hình trong Dashboard, KHÔNG thể thay đổi qua SQL
- SQL migration chỉ cập nhật RLS policies (quyền truy cập)
- Sau khi cấu hình, cần **Save** để áp dụng thay đổi

## 🔍 Nếu Vẫn Lỗi

1. Kiểm tra lại đã **Save** chưa
2. Refresh trang và thử lại
3. Kiểm tra RLS policies trong tab **Policies** (xem file `update_storage_policy_all_documents.sql`)

## 📚 Xem Hướng Dẫn Chi Tiết

Xem file `HUONG_DAN_CAU_HINH_STORAGE_BUCKET.md` để biết thêm chi tiết.

