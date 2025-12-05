# Hướng Dẫn Cấu Hình Supabase Storage Bucket để Upload Tài Liệu

## Vấn Đề

Khi upload file tài liệu (PDF, Excel, Word, text files), bạn gặp lỗi:
```
mime type application/pdf is not supported
mime type text/plain is not supported
mime type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet is not supported
```

## Nguyên Nhân

Supabase Storage bucket `minhchung_chiphi` có cấu hình MIME type restrictions chặn các loại file tài liệu.

## Giải Pháp

### Bước 1: Chạy SQL Migration (Cập nhật RLS Policies)

Chạy file migration để đảm bảo RLS policies cho phép upload:

```bash
# Nếu dùng Supabase CLI
supabase migration up

# Hoặc chạy trực tiếp file SQL trong Supabase Dashboard
# SQL Editor → New Query → Paste nội dung từ:
# database/migrations/update_storage_policy_all_documents.sql
```

### Bước 2: Cấu Hình Bucket Settings (QUAN TRỌNG)

**Đây là bước bắt buộc** - MIME type restrictions được cấu hình trong Supabase Dashboard, không thể thay đổi qua SQL.

#### Cách 1: Cho Phép Tất Cả MIME Types (Khuyến Nghị cho Development)

1. **Truy cập Supabase Dashboard**
   - Vào https://supabase.com/dashboard
   - Chọn project của bạn

2. **Mở Storage Settings**
   - Click vào **Storage** ở sidebar bên trái
   - Click vào bucket **`minhchung_chiphi`**
   - Click vào tab **Settings**

3. **Xóa MIME Type Restrictions**
   - Tìm phần **"File type restrictions"** hoặc **"Allowed MIME types"**
   - **Xóa tất cả** các MIME types trong danh sách (để trống)
   - Hoặc tắt tính năng **"Restrict file types"**
   - Click **Save**

#### Cách 2: Thêm Các MIME Types Cần Thiết (Khuyến Nghị cho Production)

1. **Truy cập Supabase Dashboard**
   - Vào https://supabase.com/dashboard
   - Chọn project của bạn

2. **Mở Storage Settings**
   - Click vào **Storage** → **Buckets** → **`minhchung_chiphi`** → **Settings**

3. **Thêm MIME Types**
   - Tìm phần **"File type restrictions"** hoặc **"Allowed MIME types"**
   
   ⚠️ **QUAN TRỌNG**: Supabase yêu cầu mỗi MIME type trên **MỘT DÒNG RIÊNG**, không phải comma-separated!
   
   - Click vào ô input
   - Nhập **MỘT MIME type** trên mỗi dòng (nhấn Enter sau mỗi type):

```
image/jpeg
image/jpg
image/png
image/gif
image/webp
image/svg+xml
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.ms-excel
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
application/vnd.ms-powerpoint
application/vnd.openxmlformats-officedocument.presentationml.presentation
text/plain
text/csv
text/html
application/octet-stream
```

   - **KHÔNG** nhập dạng comma-separated như: `application/pdf, text/plain` ❌
   - Mỗi MIME type phải trên một dòng riêng ✅

4. **Lưu Cấu Hình**
   - Click **Save** hoặc **Update**

### Bước 3: Kiểm Tra RLS Policies

1. **Vào Storage → Policies**
   - Click vào tab **Policies** trong bucket `minhchung_chiphi`

2. **Đảm Bảo Có Các Policies Sau:**
   - **Allow authenticated uploads** (INSERT)
   - **Allow authenticated downloads** (SELECT)
   - **Allow authenticated updates** (UPDATE)
   - **Allow authenticated deletes** (DELETE)

3. **Nếu Chưa Có, Tạo Policies Mới:**
   - Click **New Policy**
   - Chọn **"For full customization"**
   - Copy và paste SQL từ file `database/migrations/update_storage_policy_all_documents.sql`

### Bước 4: Kiểm Tra

Sau khi cấu hình xong, thử upload lại file:

1. Tạo một nhiệm vụ mới
2. Upload file PDF hoặc Excel
3. Nếu thành công, bạn sẽ thấy file trong danh sách attachments

## Lưu Ý

- **MIME type restrictions** được cấu hình ở cấp bucket settings, không thể thay đổi qua SQL
- **RLS policies** chỉ kiểm soát quyền truy cập (ai có thể upload/download), không kiểm soát MIME types
- Nếu vẫn gặp lỗi sau khi cấu hình, kiểm tra:
  - Bucket settings đã được lưu chưa
  - RLS policies đã được tạo chưa
  - User đã authenticated chưa (có token hợp lệ)

## Troubleshooting

### Lỗi: "mime type X is not supported"
- **Nguyên nhân**: MIME type chưa được thêm vào bucket settings
- **Giải pháp**: Thêm MIME type vào danh sách allowed types trong bucket settings

### Lỗi: "new row violates row-level security policy"
- **Nguyên nhân**: RLS policy chưa được cấu hình đúng
- **Giải pháp**: Chạy SQL migration `update_storage_policy_all_documents.sql`

### Lỗi: "Bucket not found"
- **Nguyên nhân**: Bucket `minhchung_chiphi` chưa được tạo
- **Giải pháp**: Tạo bucket mới trong Supabase Dashboard → Storage → New Bucket

## Tài Liệu Tham Khảo

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [File Type Restrictions](https://supabase.com/docs/guides/storage/file-limitations)

