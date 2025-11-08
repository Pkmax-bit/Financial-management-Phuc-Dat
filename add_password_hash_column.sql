-- =====================================================
-- THÊM CỘT PASSWORD_HASH VÀO BẢNG USERS
-- =====================================================
-- Script này sẽ thêm cột password_hash vào bảng users
-- để lưu trữ mật khẩu đã được hash
-- =====================================================

-- Thêm cột password_hash vào bảng users
ALTER TABLE users 
ADD COLUMN password_hash TEXT;

-- Thêm comment cho cột
COMMENT ON COLUMN users.password_hash IS 'Hashed password using bcrypt';

-- Tạo index cho password_hash (nếu cần)
-- CREATE INDEX idx_users_password_hash ON users(password_hash);

-- Kiểm tra cột đã được thêm
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'password_hash';

PRINT '=====================================================';
PRINT 'HOÀN THÀNH THÊM CỘT PASSWORD_HASH';
PRINT '=====================================================';
PRINT 'Đã thêm cột password_hash vào bảng users';
PRINT 'Cột này sẽ lưu trữ mật khẩu đã được hash bằng bcrypt';
PRINT '=====================================================';
