# 🔑 HƯỚNG DẪN CẤU HÌNH OPENAI API

## 📋 **BƯỚC 1: LẤY OPENAI API KEY**

### 1.1. Đăng ký tài khoản OpenAI:
- Truy cập: https://platform.openai.com/
- Đăng ký tài khoản hoặc đăng nhập
- Xác thực số điện thoại

### 1.2. Tạo API Key:
- Vào: https://platform.openai.com/api-keys
- Click "Create new secret key"
- Đặt tên: "Financial Management AI"
- Copy API key (chỉ hiển thị 1 lần!)

### 1.3. Nạp tiền vào tài khoản:
- Vào: https://platform.openai.com/account/billing
- Thêm thẻ tín dụng
- Nạp tối thiểu $5 để sử dụng

---

## 🔧 **BƯỚC 2: CẤU HÌNH ENVIRONMENT**

### 2.1. Tạo file `.env.local` trong thư mục `frontend/`:

```bash
# Supabase Configuration (đã có sẵn)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2.2. Thay thế `sk-your-openai-api-key-here` bằng API key thực tế

---

## 🚀 **BƯỚC 3: KIỂM TRA CẤU HÌNH**

### 3.1. Restart development server:
```bash
cd frontend
npm run dev
```

### 3.2. Test API connection:
- Vào trang `/expenses`
- Click "Thêm chi phí AI"
- Upload một hình ảnh hóa đơn
- Kiểm tra console log để xem có lỗi không

---

## 💰 **CHI PHÍ SỬ DỤNG**

### GPT-4 Vision Pricing (2024):
- **Input**: $0.01 per 1K tokens
- **Output**: $0.03 per 1K tokens
- **Ước tính**: ~$0.01-0.02 per image analysis

### Ví dụ chi phí:
- 100 hóa đơn/tháng = ~$1-2
- 1000 hóa đơn/tháng = ~$10-20

---

## 🔒 **BẢO MẬT**

### ✅ **DO (Nên làm):**
- Lưu API key trong `.env.local`
- Không commit `.env.local` vào git
- Sử dụng environment variables
- Monitor usage trong OpenAI dashboard

### ❌ **DON'T (Không nên):**
- Hardcode API key trong code
- Share API key qua chat/email
- Commit API key vào git
- Sử dụng API key công khai

---

## 🛠️ **TROUBLESHOOTING**

### Lỗi thường gặp:

#### 1. "OpenAI API key not configured"
```bash
# Kiểm tra file .env.local
cat frontend/.env.local

# Restart server
npm run dev
```

#### 2. "Insufficient quota"
```bash
# Kiểm tra billing
# https://platform.openai.com/account/billing
```

#### 3. "Invalid API key"
```bash
# Tạo API key mới
# https://platform.openai.com/api-keys
```

#### 4. "Rate limit exceeded"
```bash
# Đợi 1 phút rồi thử lại
# Hoặc upgrade plan
```

---

## 📊 **MONITORING**

### Theo dõi sử dụng:
- Dashboard: https://platform.openai.com/usage
- Usage limits: https://platform.openai.com/account/limits
- Billing: https://platform.openai.com/account/billing

### Alerts:
- Set up usage alerts
- Monitor monthly spending
- Track API calls

---

## 🎯 **TESTING**

### Test với hình ảnh mẫu:
1. Tìm hóa đơn có chữ rõ ràng
2. Chụp ảnh hoặc scan
3. Upload qua AI Receipt Upload
4. Kiểm tra kết quả phân tích

### Expected results:
```json
{
  "amount": 500000,
  "vendor": "Taxi ABC",
  "date": "2024-01-15",
  "description": "Chi phí đi lại",
  "project_mention": true,
  "confidence": 95
}
```

---

## 🚀 **NEXT STEPS**

Sau khi cấu hình xong:
1. ✅ Test AI receipt analysis
2. ✅ Verify project detection
3. ✅ Check cost tracking
4. ✅ Monitor API usage
5. ✅ Optimize prompts nếu cần

---

## 📞 **SUPPORT**

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Verify API key format
3. Check network connection
4. Review OpenAI status page
5. Contact support nếu cần

**OpenAI Status**: https://status.openai.com/
