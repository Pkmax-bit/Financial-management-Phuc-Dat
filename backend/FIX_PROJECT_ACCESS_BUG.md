# Sửa Lỗi: Users Không Có Trong Project Team Vẫn Thấy Dự Án

## 🐛 Vấn Đề

Các user không có trong `project_team` vẫn có thể thấy dự án vì:

1. **Frontend truy cập trực tiếp Supabase** - Bỏ qua logic kiểm tra của backend
2. **Một số endpoint backend không kiểm tra project_team**

## ✅ Đã Sửa

### 1. Backend Endpoints

#### `/api/projects/list-ids`
- **Trước**: Không có authentication, trả về tất cả dự án
- **Sau**: Có authentication, chỉ trả về dự án mà user có trong `project_team` (trừ Admin/Accountant)

#### `/api/projects/by-customer/{customer_id}`
- **Trước**: Chỉ kiểm tra `customer_id`, không kiểm tra `project_team`
- **Sau**: Kiểm tra cả `customer_id` VÀ `project_team` membership

#### `/api/projects/dropdown-options/{customer_id}`
- **Trước**: Chỉ kiểm tra `customer_id`, không kiểm tra `project_team`
- **Sau**: Kiểm tra cả `customer_id` VÀ `project_team` membership

### 2. Frontend Cần Sửa

Frontend đang truy cập trực tiếp Supabase ở các file sau (cần sửa để dùng API):

1. **`frontend/src/components/projects/ProjectsTab.tsx`** (dòng 95-122)
   - Đang dùng: `supabase.from('projects').select(...)`
   - Cần sửa: Dùng API `/api/projects`

2. **`frontend/src/components/sales/QuotesTab.tsx`** (dòng 115-118)
   - Đang dùng: `supabase.from('projects').select(...)`
   - Cần sửa: Dùng API `/api/projects` hoặc `/api/projects/list-ids`

3. **`frontend/src/components/sales/InvoicesTab.tsx`** (dòng 104-107)
   - Đang dùng: `supabase.from('projects').select(...)`
   - Cần sửa: Dùng API `/api/projects` hoặc `/api/projects/list-ids`

4. **`frontend/src/components/sales/CreateQuoteSidebar.tsx`** (dòng 148-153)
   - Đang dùng: `supabase.from('projects').select(...)`
   - Cần sửa: Dùng API `/api/projects/by-customer/{customer_id}`

5. **`frontend/src/components/sales/CreateQuoteSidebarFullscreen.tsx`** (dòng 971-976)
   - Đang dùng: `supabase.from('projects').select(...)`
   - Cần sửa: Dùng API `/api/projects/by-customer/{customer_id}`

## 🔧 Cách Sửa Frontend

### Ví dụ: Sửa ProjectsTab.tsx

**Trước:**
```typescript
const fetchProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select(`...`)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  setProjects(data || [])
}
```

**Sau:**
```typescript
const fetchProjects = async () => {
  try {
    const response = await fetch(getApiEndpoint('/api/projects'), {
      headers: {
        'Authorization': `Bearer ${token}` // Lấy từ auth context
      }
    })
    
    if (!response.ok) throw new Error('Failed to fetch projects')
    
    const projects = await response.json()
    setProjects(projects || [])
  } catch (error) {
    console.error('Error fetching projects:', error)
  }
}
```

### Ví dụ: Sửa CreateQuoteSidebar.tsx

**Trước:**
```typescript
const fetchProjectsByCustomer = async (customerId: string) => {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, project_code, name, status')
    .eq('customer_id', customerId)
    .in('status', ['planning', 'active'])
    .order('name')
  
  setProjects(projects || [])
}
```

**Sau:**
```typescript
const fetchProjectsByCustomer = async (customerId: string) => {
  try {
    const response = await fetch(
      getApiEndpoint(`/api/projects/by-customer/${customerId}`),
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (!response.ok) throw new Error('Failed to fetch projects')
    
    const result = await response.json()
    setProjects(result.projects || [])
  } catch (error) {
    console.error('Error fetching projects:', error)
    setProjects([])
  }
}
```

## ✅ Kết Quả Sau Khi Sửa

- ✅ Chỉ Admin và Accountant xem tất cả dự án
- ✅ Users khác chỉ xem dự án mà họ có trong `project_team` (status = 'active')
- ✅ Frontend không thể bypass logic kiểm tra của backend
- ✅ Tất cả truy cập dự án đều qua API với authentication

## 🧪 Test

Sau khi sửa, chạy lại script test:

```powershell
cd backend
python test_project_access_verification.py
```

Kết quả mong đợi:
- Users không có trong `project_team` → Không thấy dự án
- Users có trong `project_team` → Thấy dự án
- Admin/Accountant → Thấy tất cả dự án

---

**Trạng thái:** ✅ Backend đã sửa, ⚠️ Frontend cần sửa

