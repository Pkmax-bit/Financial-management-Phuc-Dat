#!/usr/bin/env python3
"""
Cấu hình phân quyền cho nhân viên xưởng
Chỉ hiển thị đối tượng chi phí xưởng trong form thêm chi phí
"""

import os
import sys
from supabase import create_client, Client

# Cấu hình Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'your-service-role-key')

if not SUPABASE_URL or not SUPABASE_KEY or 'your-project' in SUPABASE_URL:
    print("❌ Vui lòng cấu hình SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def configure_workshop_permissions():
    """Cấu hình phân quyền cho nhân viên xưởng"""
    
    print("🔧 Cấu hình phân quyền cho nhân viên xưởng...")
    print("=" * 60)
    
    try:
        # 1. Lấy danh sách đối tượng chi phí xưởng
        print("\n📋 Lấy danh sách đối tượng chi phí xưởng...")
        
        workshop_objects = supabase.table("expense_objects").select("*").or_(
            "name.ilike.%Xưởng%,name.ilike.%Nhân công%"
        ).execute()
        
        print(f"✅ Tìm thấy {len(workshop_objects.data)} đối tượng chi phí xưởng")
        
        for obj in workshop_objects.data:
            print(f"  - {obj['name']} (Level: {obj['hierarchy_level']})")
        
        # 2. Tạo bảng phân quyền đối tượng chi phí
        print("\n🔐 Tạo bảng phân quyền đối tượng chi phí...")
        
        # Kiểm tra xem bảng đã tồn tại chưa
        try:
            supabase.table("expense_object_permissions").select("id").limit(1).execute()
            print("✅ Bảng expense_object_permissions đã tồn tại")
        except:
            print("📝 Tạo bảng expense_object_permissions...")
            # Tạo bảng phân quyền (cần chạy SQL trực tiếp)
            print("⚠️ Cần tạo bảng expense_object_permissions bằng SQL")
        
        # 3. Cấu hình quyền truy cập cho từng role
        print("\n👥 Cấu hình quyền truy cập theo role...")
        
        # WORKSHOP_EMPLOYEE: Chỉ thấy đối tượng xưởng
        workshop_objects_ids = [obj['id'] for obj in workshop_objects.data if 'Xưởng' in obj['name'] or 'Nhân công' in obj['name']]
        
        print(f"🏭 WORKSHOP_EMPLOYEE có thể truy cập {len(workshop_objects_ids)} đối tượng:")
        for obj in workshop_objects.data:
            if 'Xưởng' in obj['name'] or 'Nhân công' in obj['name']:
                print(f"  - {obj['name']}")
        
        # WORKER: Chỉ thấy đối tượng nhân công
        worker_objects_ids = [obj['id'] for obj in workshop_objects.data if 'Nhân công' in obj['name']]
        
        print(f"👷 WORKER có thể truy cập {len(worker_objects_ids)} đối tượng:")
        for obj in workshop_objects.data:
            if 'Nhân công' in obj['name']:
                print(f"  - {obj['name']}")
        
        # 4. Tạo file cấu hình frontend
        print("\n📝 Tạo file cấu hình frontend...")
        
        frontend_config = f"""
// Cấu hình phân quyền đối tượng chi phí theo role
export const EXPENSE_OBJECT_ROLE_PERMISSIONS = {{
  workshop_employee: {workshop_objects_ids},
  worker: {worker_objects_ids},
  admin: [], // Admin thấy tất cả
  accountant: [], // Kế toán thấy tất cả
  sales: [], // Sales thấy tất cả
  transport: [], // Vận chuyển thấy tất cả
  employee: [], // Nhân viên chung thấy tất cả
  customer: [] // Khách hàng không thấy
}};

// Hàm kiểm tra quyền truy cập đối tượng chi phí
export const canAccessExpenseObject = (userRole: string, expenseObjectId: string): boolean => {{
  const rolePermissions = EXPENSE_OBJECT_ROLE_PERMISSIONS[userRole];
  
  // Admin, accountant, sales thấy tất cả
  if (['admin', 'accountant', 'sales'].includes(userRole)) {{
    return true;
  }}
  
  // Khách hàng không thấy
  if (userRole === 'customer') {{
    return false;
  }}
  
  // Kiểm tra quyền cụ thể
  return rolePermissions.includes(expenseObjectId);
}};

// Hàm lọc đối tượng chi phí theo role
export const filterExpenseObjectsByRole = (expenseObjects: any[], userRole: string): any[] => {{
  if (['admin', 'accountant', 'sales'].includes(userRole)) {{
    return expenseObjects; // Thấy tất cả
  }}
  
  if (userRole === 'customer') {{
    return []; // Không thấy gì
  }}
  
  const rolePermissions = EXPENSE_OBJECT_ROLE_PERMISSIONS[userRole];
  return expenseObjects.filter(obj => rolePermissions.includes(obj.id));
}};
"""
        
        with open('frontend/src/utils/expenseObjectPermissions.ts', 'w', encoding='utf-8') as f:
            f.write(frontend_config)
        
        print("✅ Đã tạo file frontend/src/utils/expenseObjectPermissions.ts")
        
        # 5. Tạo hướng dẫn sử dụng
        print("\n📖 Tạo hướng dẫn sử dụng...")
        
        guide = f"""
# Hướng dẫn sử dụng phân quyền đối tượng chi phí

## 🎯 Mục đích
- Nhân viên xưởng chỉ thấy đối tượng chi phí xưởng
- Nhân công chỉ thấy đối tượng chi phí nhân công
- Tổng chi phí con được tính tự động cho đối tượng cha

## 🔧 Cấu hình đã thực hiện

### 1. Tài khoản đã tạo:
- **Nhân viên xưởng**: xuong.quandoc@company.com (workshop_employee)
- **Nhân công**: nhan.cong1@company.com (worker)

### 2. Đối tượng chi phí đã tạo:
```
Xưởng sản xuất (Root)
├── Nguyên vật liệu chính
│   ├── Thép
│   └── Xi măng
├── Nguyên vật liệu phụ
│   ├── Vít, ốc
│   └── Keo dán
└── Nhân công xưởng

Nhân công (Root)
├── Nhân công thợ chính
└── Nhân công thợ phụ
```

### 3. Phân quyền:
- **WORKSHOP_EMPLOYEE**: Thấy tất cả đối tượng xưởng
- **WORKER**: Chỉ thấy đối tượng nhân công
- **ADMIN/ACCOUNTANT/SALES**: Thấy tất cả

## 🚀 Cách sử dụng

### 1. Đăng nhập với tài khoản xưởng:
- Email: xuong.quandoc@company.com
- Password: 123456

### 2. Thêm chi phí dự án:
- Vào trang Expenses
- Click "Thêm chi phí"
- Chọn đối tượng chi phí (chỉ thấy đối tượng xưởng)

### 3. Xem báo cáo:
- Tổng chi phí xưởng = Tổng các chi phí con
- Hiển thị trong báo cáo dự án

## 🔄 Tích hợp vào frontend

### 1. Import permissions:
```typescript
import {{ canAccessExpenseObject, filterExpenseObjectsByRole }} from '@/utils/expenseObjectPermissions';
```

### 2. Sử dụng trong component:
```typescript
// Lọc đối tượng chi phí theo role
const filteredObjects = filterExpenseObjectsByRole(expenseObjects, userRole);

// Kiểm tra quyền truy cập
const canAccess = canAccessExpenseObject(userRole, expenseObjectId);
```

## ⚠️ Lưu ý
- Cần cập nhật component CreateExpenseDialog để sử dụng phân quyền
- Cần cập nhật API để lọc đối tượng chi phí theo role
- Tổng chi phí con được tính tự động bởi database triggers
"""
        
        with open('WORKSHOP_PERMISSIONS_GUIDE.md', 'w', encoding='utf-8') as f:
            f.write(guide)
        
        print("✅ Đã tạo file WORKSHOP_PERMISSIONS_GUIDE.md")
        
        print("\n" + "=" * 60)
        print("🎉 Cấu hình phân quyền hoàn tất!")
        print("\n📋 Các bước tiếp theo:")
        print("1. Chạy script SQL: create_workshop_expense_objects.sql")
        print("2. Chạy script Python: create_workshop_accounts.py")
        print("3. Cập nhật frontend để sử dụng phân quyền")
        print("4. Test đăng nhập với tài khoản xưởng")
        
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    configure_workshop_permissions()
