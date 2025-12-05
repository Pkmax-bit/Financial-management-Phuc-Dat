# Hướng Dẫn Sửa Lỗi: Nút Test Email Vẫn Gửi Qua SMTP

## ⚠️ VẤN ĐỀ

Khi click nút "Test gửi email qua n8n", email vẫn gửi qua SMTP thay vì n8n.

**Log hiện tại:**
```
🔍 Testing email with provider: smtp
📧 Sending test email to: ...
   Provider: smtp
✅ Password reset email sent successfully to ...
```

**Log mong đợi (sau khi sửa):**
```
============================================================
🧪 TEST EMAIL VIA N8N (FORCE)
============================================================
📧 Email to: ...
🔗 n8n Webhook URL: https://brain.ai.vn/webhook/email
⚙️  Current EMAIL_PROVIDER setting: smtp
============================================================
🚀 Sending email via n8n webhook...
✅ Email sent via n8n to ... (Status: 200)
============================================================
✅ Email sent successfully via n8n!
============================================================
```

---

## ✅ CÁCH SỬA

### Bước 1: Kiểm tra file `.env`

Mở file `backend/.env` và đảm bảo có dòng:

```bash
N8N_WEBHOOK_URL=https://brain.ai.vn/webhook/email
```

**Lưu ý:**
- ✅ Không có dấu ngoặc kép
- ✅ Không có khoảng trắng thừa
- ✅ URL đúng với webhook trong n8n

### Bước 2: Restart Backend (QUAN TRỌNG!)

**Code đã được cập nhật để FORCE gửi qua n8n**, nhưng backend cần restart để load code mới.

**Cách restart:**

1. **Dừng backend:**
   - Tìm terminal đang chạy backend
   - Nhấn `Ctrl+C` để dừng

2. **Chạy lại backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

   Hoặc nếu bạn dùng lệnh khác, chạy lại lệnh đó.

3. **Đợi backend khởi động xong:**
   - Sẽ thấy: `INFO:     Application startup complete.`
   - Hoặc: `INFO:     Uvicorn running on http://127.0.0.1:8000`

### Bước 3: Test lại

1. Vào trang `/forgot-password`
2. Nhập email: `phannguyendangkhoa0915@gmail.com`
3. Click "Test gửi email qua n8n"
4. **Xem console backend** - phải thấy log mới với "🧪 TEST EMAIL VIA N8N (FORCE)"

### Bước 4: Kiểm tra kết quả

**Trong console backend phải thấy:**
```
============================================================
🧪 TEST EMAIL VIA N8N (FORCE)
============================================================
📧 Email to: phannguyendangkhoa0915@gmail.com
🔗 n8n Webhook URL: https://brain.ai.vn/webhook/email
⚙️  Current EMAIL_PROVIDER setting: smtp
============================================================
🚀 Sending email via n8n webhook...
✅ Email sent via n8n to phannguyendangkhoa0915@gmail.com (Status: 200)
============================================================
✅ Email sent successfully via n8n!
============================================================
```

**Trong n8n:**
1. Vào https://brain.ai.vn
2. Workflows → "Email Unified - Phúc Đạt"
3. Tab "Executions"
4. **Phải thấy execution mới** (màu xanh)

---

## 🔍 Nếu Vẫn Không Hoạt Động

### Kiểm tra 1: N8N_WEBHOOK_URL có được set không?

Truy cập: `http://localhost:8000/api/auth/email-config`

Xem `env_n8n_webhook_url`:
- ✅ Có URL → OK
- ❌ "NOT SET" → Cần thêm vào `.env` và restart

### Kiểm tra 2: Backend có reload code mới không?

Xem log khi start backend:
- Nếu thấy: `WARNING: WatchFiles detected changes` → Code đã được reload
- Nếu không thấy → Cần restart thủ công

### Kiểm tra 3: n8n Workflow có active không?

1. Vào https://brain.ai.vn
2. Workflows → "Email Unified - Phúc Đạt"
3. Kiểm tra công tắc ở góc trên bên phải phải là màu **XANH** (Active)
4. Nếu chưa active → Click để activate và lưu

### Kiểm tra 4: Test trực tiếp webhook n8n

Mở terminal và chạy:

```bash
curl -X POST https://brain.ai.vn/webhook/email -H "Content-Type: application/json" -d "{\"to_email\":\"phannguyendangkhoa0915@gmail.com\",\"subject\":\"Test\",\"html_content\":\"<h1>Test</h1>\",\"text_content\":\"Test\",\"email_type\":\"password_reset\",\"metadata\":{}}"
```

**Nếu webhook hoạt động:**
- ✅ Response 200 với JSON success
- ✅ Trong n8n có execution mới
- ✅ Email được gửi

**Nếu webhook không hoạt động:**
- ❌ Response 404: Workflow chưa active
- ❌ Response 500: Có lỗi trong workflow
- ❌ Timeout: n8n không truy cập được

---

## 📝 Tóm Tắt

**Vấn đề:** Code mới đã được cập nhật nhưng backend chưa reload.

**Giải pháp:**
1. ✅ Đảm bảo `N8N_WEBHOOK_URL` có trong `.env`
2. ✅ **Restart backend** (Ctrl+C rồi chạy lại)
3. ✅ Test lại và xem log mới
4. ✅ Kiểm tra execution trong n8n

**Sau khi restart, nút test sẽ FORCE gửi qua n8n, không phụ thuộc vào `EMAIL_PROVIDER` setting!**

