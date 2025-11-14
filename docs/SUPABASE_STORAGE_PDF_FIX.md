# Hướng Dẫn Sửa Lỗi Upload PDF vào Supabase Storage

## Vấn Đề

Khi upload file PDF, bạn gặp lỗi:
```
File type 'application/pdf' is not allowed by Supabase Storage bucket policy.
```

Lỗi này xảy ra vì Supabase Storage bucket có policy chặn file type `application/pdf`.

## Giải Pháp

### Cách 1: Cấu Hình Supabase Storage Bucket (Khuyến Nghị)

1. **Truy cập Supabase Dashboard**
   - Vào https://supabase.com/dashboard
   - Chọn project của bạn

2. **Mở Storage Settings**
   - Click vào **Storage** ở sidebar
   - Click vào bucket `minhchung_chiphi`
   - Click vào tab **Settings** hoặc **Policies**

3. **Cấu Hình File Type Restrictions**
   
   **Option A: Xóa File Type Restrictions (Cho phép tất cả)**
   - Tìm phần **"File type restrictions"** hoặc **"Allowed MIME types"**
   - Xóa tất cả restrictions hoặc để trống
   - Lưu thay đổi

   **Option B: Thêm PDF vào Allowed Types**
   - Tìm danh sách **"Allowed MIME types"**
   - Thêm `application/pdf` vào danh sách
   - Có thể thêm các loại khác:
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - Lưu thay đổi

4. **Kiểm Tra RLS Policies (Nếu có)**
   - Vào tab **Policies**
   - Đảm bảo có policy cho phép INSERT
   - Nếu không có, tạo policy mới:

```sql
-- Policy để cho phép upload file vào bucket
CREATE POLICY "Allow file uploads" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'minhchung_chiphi'
);
```

### Cách 2: Sử Dụng Workaround (Tạm Thời)

Code đã được cập nhật để tự động thử upload PDF với content-type generic (`application/octet-stream`) nếu upload với `application/pdf` thất bại. Tuy nhiên, điều này có thể không hoạt động nếu bucket cũng chặn `application/octet-stream`.

### Cách 3: Tạo Bucket Mới Cho Documents

Nếu không thể sửa bucket hiện tại, bạn có thể:

1. Tạo bucket mới tên `documents` hoặc `system_feedback_files`
2. Cấu hình bucket mới cho phép tất cả file types
3. Cập nhật code để sử dụng bucket mới cho system feedback attachments

## Kiểm Tra Sau Khi Sửa

1. Restart backend server
2. Thử upload file PDF trong System Feedback
3. Kiểm tra console log để xem upload có thành công không

## Lưu Ý

- Nếu vẫn gặp lỗi sau khi cấu hình, kiểm tra lại:
  - Bucket name có đúng không (`minhchung_chiphi`)
  - RLS policies có cho phép INSERT không
  - Service role key có đúng không
  - Network/firewall có chặn không

## Liên Hệ

Nếu vẫn gặp vấn đề, vui lòng:
1. Kiểm tra Supabase Dashboard → Storage → Bucket Settings
2. Kiểm tra Supabase Dashboard → Settings → API → Service Role Key
3. Xem log chi tiết trong backend console
