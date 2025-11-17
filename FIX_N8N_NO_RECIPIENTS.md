# Sửa Lỗi: "No recipients defined" trong n8n

## ⚠️ VẤN ĐỀ

Email đã được gửi đến n8n thành công, nhưng node "Gửi Email Password" báo lỗi:
```
No recipients defined
Error code: EENVELOPE
```

**Nguyên nhân:** Node "Gửi Email Password" không nhận được field `to_email` từ node trước.

---

## ✅ CÁCH SỬA TRONG N8N

### Bước 1: Mở Workflow trong n8n

1. Vào https://brain.ai.vn
2. Workflows → "Email Unified - Phúc Đạt"
3. Click vào workflow để mở

### Bước 2: Sửa Node "Gửi Email Password"

1. **Click vào node "Gửi Email Password"** (node màu xanh ở output 1 của Switch)

2. **Tìm field "To Email"** và sửa từ:
   ```
   {{ $json.to_email }}
   ```
   
   Thành:
   ```
   {{ $json.to_email || $json.body?.to_email || '' }}
   ```

3. **Tương tự, sửa các field khác:**
   - **Subject:** `{{ $json.subject || $json.body?.subject || 'Password Reset' }}`
   - **Message (HTML):** `{{ $json.html_content || $json.body?.html_content || '' }}`
   - **Text:** `{{ $json.text_content || $json.body?.text_content || '' }}`

4. **Click "Save"** để lưu node

### Bước 3: Sửa Node "Gửi Email Báo Giá" (nếu cần)

1. **Click vào node "Gửi Email Báo Giá"**

2. **Sửa field "To Email"** thành:
   ```
   {{ $json.to_email || $json.body?.to_email || '' }}
   ```

3. **Sửa các field khác tương tự**

4. **Click "Save"**

### Bước 4: Sửa Node "Gửi Email Xác Nhận" (nếu cần)

1. **Click vào node "Gửi Email Xác Nhận"**

2. **Sửa field "To Email"** thành:
   ```
   {{ $json.to_email || $json.body?.to_email || '' }}
   ```

3. **Sửa các field khác tương tự**

4. **Click "Save"**

### Bước 5: Lưu và Activate Workflow

1. **Lưu workflow:** Click nút "Save" (Ctrl+S hoặc Cmd+S)
2. **Kiểm tra workflow đã active:** Công tắc ở góc trên bên phải phải là màu **XANH**

### Bước 6: Test lại

1. Vào trang `/forgot-password`
2. Nhập email và click "Test gửi email qua n8n"
3. Kiểm tra execution trong n8n - phải thành công (màu xanh)
4. Kiểm tra email inbox - phải nhận được email

---

## 🔍 CÁCH KIỂM TRA NHANH

### Kiểm tra Output của Node "Set - Lấy dữ liệu"

1. Vào execution gần nhất trong n8n
2. Click vào node "Set - Lấy dữ liệu"
3. Xem **Output** - phải có field `to_email` với giá trị email

**Nếu không thấy `to_email`:**
- Node "Set - Lấy dữ liệu" chưa map đúng
- Cần kiểm tra lại mapping trong node này

### Kiểm tra Input của Node "Gửi Email Password"

1. Click vào node "Gửi Email Password" trong execution
2. Xem **Input** - phải có field `to_email`
3. Xem **Parameters** - field "To Email" phải có giá trị

**Nếu "To Email" là empty:**
- Expression `{{ $json.to_email }}` không tìm thấy giá trị
- Cần sửa thành `{{ $json.to_email || $json.body?.to_email || '' }}`

---

## 📝 TÓM TẮT

**Vấn đề:** Node "Gửi Email Password" không nhận được `to_email`

**Giải pháp:**
1. ✅ Sửa field "To Email" trong node "Gửi Email Password"
2. ✅ Thêm fallback: `{{ $json.to_email || $json.body?.to_email || '' }}`
3. ✅ Lưu workflow
4. ✅ Test lại

**Sau khi sửa, email sẽ được gửi thành công qua n8n!**

