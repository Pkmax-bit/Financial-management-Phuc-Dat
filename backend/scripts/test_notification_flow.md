# Test thông báo đã thêm

Cách kiểm tra nhanh (thủ công) sau khi đăng nhập app (frontend + backend đang chạy).

## 1. Thông báo khi được thêm vào đội ngũ

- Vào **Dự án** → chọn một dự án → tab **Đội ngũ**.
- Thêm thành viên mới (chọn user đã có `user_id` trong hệ thống).
- **Kỳ vọng:** Thành viên đó đăng nhập bằng tài khoản đó sẽ thấy 1 thông báo "Bạn đã được thêm vào đội ngũ dự án [tên dự án]" (icon Users).
- Các thành viên khác trong đội ngũ thấy "Thành viên mới: [tên dự án]" (đã có sẵn).

## 2. Thông báo khi có nhiệm vụ được gán

- Vào **Nhiệm vụ** (hoặc Dự án → Nhiệm vụ) → **Tạo nhiệm vụ mới**, chọn **Người thực hiện** (assigned_to hoặc assignee_ids).
- **Kỳ vọng:** User tương ứng với nhân viên được gán thấy thông báo "Nhiệm vụ mới: [tiêu đề]" (icon CheckSquare), link dẫn đến `/tasks/{task_id}`.

## 3. Thông báo checklist (thêm / sửa / xóa)

- Vào một **Nhiệm vụ** có trong dự án → thêm **Checklist** mới (tiêu đề bất kỳ).
- **Kỳ vọng:** Cả đội ngũ dự án thấy "Checklist mới: [tiêu đề]" (icon ListChecks).
- **Sửa** tiêu đề checklist → đội ngũ thấy "Checklist đã cập nhật: ...".
- **Xóa** checklist → đội ngũ thấy "Checklist đã xóa: ...".

## 4. Thông báo checklist item (thêm / sửa / xóa)

- Trong nhiệm vụ, mở một **Checklist** → **Thêm item** (công việc), đồng thời **gán người** (assignments) cho item đó.
- **Kỳ vọng:** Người được gán (có user_id) thấy thông báo "Công việc đã thêm: [nội dung item]" (icon List).
- **Sửa** nội dung item (hoặc gán thêm người) → người được gán thấy "Công việc đã cập nhật: ...".
- **Xóa** item → người từng được gán item đó thấy "Công việc đã xóa: ...".

## 5. Kiểm tra trên giao diện

- Icon **chuông** góc trên (hoặc trong Cài đặt/header) hiển thị số thông báo chưa đọc.
- Bấm chuông → chỉ hiện **chưa đọc**; bấm "Xem tất cả" mở trang **Thông báo** (đã đọc + chưa đọc).
- Trang **Thông báo** (`/notifications`) hiển thị đầy đủ, có icon đúng theo từng loại (Users, CheckSquare, ListChecks, List, Bell).

## Lưu ý

- Thông báo chỉ tạo được cho user có **user_id** (đã liên kết nhân viên với tài khoản đăng nhập). Thành viên đội ngũ/nhân viên không có `user_id` sẽ không nhận thông báo.
- Backend cần có `SUPABASE_URL` và `SUPABASE_SERVICE_KEY` trong `.env` để ghi vào bảng `notifications`.
- Đã có RLS: policy **UPDATE** cho bảng `notifications` (đánh dấu đã đọc).
