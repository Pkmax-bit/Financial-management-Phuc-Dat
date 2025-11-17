# Giới Hạn Email Gửi Trong 1 Ngày

## 📊 Tổng Quan

Giới hạn số email có thể gửi trong 1 ngày phụ thuộc vào **Email Provider** bạn đang sử dụng.

## 📧 Giới Hạn Theo Provider

### 1. **Resend** (Khuyến Nghị) ⭐

| Gói | Giới Hạn | Tương Đương/ngày |
|-----|----------|-------------------|
| Free | 3,000 emails/tháng | **~100 emails/ngày** |
| Paid | Tùy gói | Tùy gói |

**Cấu hình:**
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
```

---

### 2. **SendGrid**

| Gói | Giới Hạn | Tương Đương/ngày |
|-----|----------|-------------------|
| Free | 100 emails/ngày | **100 emails/ngày** |

**Cấu hình:**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
```

---

### 3. **Mailgun**

| Gói | Giới Hạn | Tương Đương/ngày |
|-----|----------|-------------------|
| Free | 5,000 emails/tháng | **~166 emails/ngày** |

**Cấu hình:**
```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_api_key_here
```

---

### 4. **Gmail SMTP**

| Loại Tài Khoản | Giới Hạn |
|----------------|----------|
| Personal Gmail | **~500 emails/ngày** |
| Google Workspace | **~2,000 emails/ngày** |

⚠️ **Lưu ý:** Render CHẶN các cổng SMTP, nên Gmail SMTP **KHÔNG HOẠT ĐỘNG** trên Render.

**Cấu hình (chỉ cho local):**
```env
EMAIL_PROVIDER=smtp
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

---

### 5. **n8n** (Qua Webhook)

Giới hạn phụ thuộc vào **SMTP provider được cấu hình trong n8n workflow**:

- Nếu n8n dùng **Gmail SMTP**: ~500 emails/ngày
- Nếu n8n dùng **Resend**: ~100 emails/ngày (free tier)
- Nếu n8n dùng **SendGrid**: 100 emails/ngày (free tier)
- Nếu n8n dùng **Mailgun**: ~166 emails/ngày (free tier)

**Cấu hình:**
```env
EMAIL_PROVIDER=n8n
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
```

---

## 🔢 Rate Limiting Trong Code

**Lưu ý:** Rate limiting trong code (100 requests/phút) là giới hạn cho **API requests**, **KHÔNG phải** giới hạn email.

```env
RATE_LIMIT_MAX_REQUESTS=100        # Max requests per window
RATE_LIMIT_WINDOW_SECONDS=60       # Time window (60 seconds = 1 phút)
```

**Tính toán:**
- 100 requests/phút = 6,000 requests/giờ = **144,000 requests/ngày**
- Nhưng mỗi request có thể gửi 1 email, nên giới hạn thực tế vẫn là giới hạn của Email Provider

---

## 📈 So Sánh Nhanh

| Provider | Free Tier (emails/ngày) | Khuyến Nghị |
|----------|------------------------|-------------|
| **Resend** | ~100 | ✅ **Dễ setup, không cần verify domain** |
| **SendGrid** | 100 | ✅ Phổ biến |
| **Mailgun** | ~166 | ✅ Nhiều nhất (free tier) |
| **Gmail SMTP** | ~500 | ⚠️ Không dùng được trên Render |
| **n8n** | Tùy provider | ✅ Linh hoạt |

---

## 💡 Khuyến Nghị

### Cho Production (Render):
1. **Resend** - Dễ setup nhất, 100 emails/ngày (free)
2. **Mailgun** - Nhiều nhất, 166 emails/ngày (free)
3. **SendGrid** - Phổ biến, 100 emails/ngày (free)

### Cho Local Development:
- **Gmail SMTP** - 500 emails/ngày (đủ cho testing)

### Nếu Cần Nhiều Hơn:
- Nâng cấp lên gói paid của Resend/Mailgun/SendGrid
- Hoặc dùng nhiều providers và phân tải

---

## 🔍 Kiểm Tra Giới Hạn Hiện Tại

### Xem Provider Đang Dùng:
```bash
# Kiểm tra env var
echo $EMAIL_PROVIDER
```

### Xem Logs:
- Resend: Dashboard → Analytics
- SendGrid: Dashboard → Activity
- Mailgun: Dashboard → Logs
- Gmail: Không có dashboard, cần tự theo dõi

---

## ⚠️ Lưu Ý Quan Trọng

1. **Giới hạn là theo ngày**, không phải theo thời gian thực
2. **Vượt quá giới hạn** có thể dẫn đến:
   - Email bị từ chối
   - Tài khoản bị tạm khóa
   - Cần nâng cấp gói
3. **Rate limiting trong code** chỉ giới hạn số requests, không giới hạn email
4. **Nên monitor** số email đã gửi để tránh vượt quá giới hạn

---

## 📚 Tài Liệu Tham Khảo

- [Resend Pricing](https://resend.com/pricing)
- [SendGrid Pricing](https://sendgrid.com/pricing/)
- [Mailgun Pricing](https://www.mailgun.com/pricing/)
- [Gmail Sending Limits](https://support.google.com/a/answer/166852)

---

**Cập nhật lần cuối**: 2025-01-XX

