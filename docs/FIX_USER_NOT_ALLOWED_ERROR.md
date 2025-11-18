# 🔧 Sửa lỗi "User not allowed" khi tạo nhân viên

## 🚨 Vấn đề

Khi tạo nhân viên mới, gặp lỗi:
```
Failed to create user account: User not allowed
```

## 🔍 Nguyên nhân

Lỗi này xảy ra khi Supabase Auth API từ chối yêu cầu tạo user vì:
1. **Service key không có quyền admin** - Service key phải là `service_role` key, không phải `anon` key
2. **Service key không đúng** - Key trong file `.env` có thể đã hết hạn hoặc không đúng
3. **Cấu hình Supabase project** - Một số cài đặt trong Supabase Dashboard có thể chặn việc tạo user qua admin API

## ✅ Giải pháp

### Bước 1: Kiểm tra Service Key

1. Mở **Supabase Dashboard** → **Settings** → **API**
2. Tìm **Service Role Key** (không phải Anon key)
3. Copy key này (bắt đầu bằng `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Bước 2: Cập nhật file `.env`

Mở file `backend/.env` và kiểm tra:

```env
# Phải là SERVICE_ROLE key, không phải ANON key
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzOTExMiwiZXhwIjoyMDcyMTE1MTEyfQ.rlFwoXK_Yls7kRxL_lYqYWe3huJhs0V60Wa4Ddd7Ero
```

**Lưu ý quan trọng:**
- Key phải có `"role": "service_role"` trong JWT payload
- Không được dùng Anon key (có `"role": "anon"`)

### Bước 3: Kiểm tra JWT payload

Bạn có thể decode JWT để kiểm tra:

1. Vào https://jwt.io
2. Paste service key vào phần "Encoded"
3. Kiểm tra phần `payload`:
   ```json
   {
     "iss": "supabase",
     "ref": "mfmijckzlhevduwfigkl",
     "role": "service_role",  // ← Phải là "service_role"
     ...
   }
   ```

### Bước 4: Kiểm tra Supabase Project Settings

1. Vào **Supabase Dashboard** → **Authentication** → **Settings**
2. Kiểm tra các cài đặt:
   - **Enable email signup**: Phải bật
   - **Enable email confirmations**: Có thể tắt nếu dùng admin API
   - **Site URL**: Phải đúng

### Bước 5: Restart Backend

Sau khi cập nhật `.env`:

```bash
# Dừng backend (Ctrl+C)
# Khởi động lại
cd backend
python -m uvicorn main:app --reload
```

## 🧪 Kiểm tra Service Key

Tạo file test để kiểm tra:

```python
# test_service_key.py
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print("Testing Service Key...")
print(f"URL: {SUPABASE_URL}")
print(f"Key starts with: {SUPABASE_SERVICE_KEY[:20]}...")

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Test: List users (requires admin permission)
    users = supabase.auth.admin.list_users()
    print(f"✅ Service key works! Found {len(users)} users")
    
    # Test: Create a test user
    test_email = "test@example.com"
    try:
        result = supabase.auth.admin.create_user({
            "email": test_email,
            "password": "test123456",
            "email_confirm": True
        })
        print(f"✅ Can create users! Created: {result.user.email}")
        
        # Clean up: Delete test user
        supabase.auth.admin.delete_user(result.user.id)
        print("✅ Test user deleted")
    except Exception as e:
        print(f"❌ Cannot create users: {str(e)}")
        
except Exception as e:
    print(f"❌ Service key error: {str(e)}")
```

Chạy:
```bash
cd backend
python test_service_key.py
```

## 🔐 Bảo mật

**QUAN TRỌNG:** Service key có toàn quyền truy cập database và auth. Không bao giờ:
- ❌ Commit service key vào Git
- ❌ Chia sẻ service key công khai
- ❌ Dùng service key ở frontend
- ✅ Chỉ dùng ở backend
- ✅ Thêm vào `.gitignore`

## 📝 Checklist

- [ ] Service key là `service_role` key (không phải `anon` key)
- [ ] Service key được cập nhật trong `backend/.env`
- [ ] Backend đã được restart sau khi cập nhật
- [ ] Test script chạy thành công
- [ ] Có thể list users qua admin API
- [ ] Có thể create user qua admin API

## 🆘 Vẫn gặp lỗi?

Nếu vẫn gặp lỗi sau khi kiểm tra tất cả:

1. **Kiểm tra logs backend:**
   ```bash
   # Xem log chi tiết
   tail -f backend/logs/app.log
   ```

2. **Kiểm tra Supabase logs:**
   - Vào Supabase Dashboard → Logs → API Logs
   - Tìm các request tạo user và xem error chi tiết

3. **Liên hệ support:**
   - Tạo issue trên GitHub với:
     - Error message đầy đủ
     - Backend logs
     - Supabase project ID (không share service key!)

