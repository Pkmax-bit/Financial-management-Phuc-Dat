# Project Status Transitions - Khi Nào Trạng Thái Dự Án Được Chuyển Đổi

## 📋 Tổng Quan

Tài liệu này mô tả **khi nào** và **ở đâu** trạng thái của dự án được chuyển đổi trong hệ thống.

---

## ⚡ Tự Động Tính % Tiến Độ

Khi trạng thái dự án được thay đổi, hệ thống **tự động tính toán và cập nhật** % tiến độ dựa trên vị trí trạng thái:

**Công thức:** `(vị_trí_trạng_thái_hiện_tại / tổng_số_trạng_thái) × 100%`

- **Vị trí trạng thái hiện tại:** Thứ tự hiển thị của trạng thái hiện tại + 1 (đánh số từ 1)
- **Tổng số trạng thái:** Số lượng trạng thái đang hoạt động cho nhóm dự án (hoặc trạng thái toàn cục nếu không có nhóm)

### Ví dụ:
- Dự án có 4 trạng thái, trạng thái hiện tại ở vị trí 2 → Tiến độ = (2/4) × 100% = **50%**
- Dự án có 5 trạng thái, trạng thái hiện tại ở vị trí 4 → Tiến độ = (4/5) × 100% = **80%**
- Dự án có 3 trạng thái, trạng thái hiện tại ở vị trí 3 → Tiến độ = (3/3) × 100% = **100%**

### Chi tiết triển khai:
- Tiến độ được tính tự động khi `status_id` thay đổi trong endpoint `update_project`
- Tiến độ được tính tự động khi trạng thái thay đổi qua endpoint `update_project_status`
- Việc tính toán xem xét nhóm dự án để sử dụng trạng thái theo nhóm
- Tiến độ được giới hạn ở mức 100% và làm tròn đến 2 chữ số thập phân

---

## 🔐 Quyền cập nhật tiến độ

### Quyền cập nhật tiến độ (Progress Update Permissions)

Thành viên đội ngũ dự án có thể cập nhật tiến độ dự án của họ:

#### ✅ Được phép cập nhật tiến độ:
- **Admin**: Toàn quyền cập nhật tất cả dự án
- **Manager**: Toàn quyền cập nhật dự án họ quản lý
- **Tất cả thành viên đội ngũ dự án**: Bất kỳ ai là thành viên của đội ngũ dự án (active status)

#### ❌ Không được phép cập nhật tiến độ:
- Người dùng bên ngoài đội ngũ dự án

### Endpoints bị ảnh hưởng:
- `PUT /api/projects/{project_id}` - khi cập nhật trường `progress`
- `PUT /api/projects/{project_id}/status` - tự động cập nhật tiến độ khi chuyển trạng thái

### Kiểm tra quyền:
Hệ thống kiểm tra quyền dựa trên:
1. **Vai trò người dùng** (role)
2. **Trách nhiệm trong đội ngũ dự án** (responsibility_type trong project_team)

---

## 🔄 Các Trạng Thái Dự Án

Hệ thống có **5 trạng thái** dự án:

1. **`planning`** - Lập kế hoạch
2. **`active`** - Đang hoạt động
3. **`on_hold`** - Tạm dừng
4. **`completed`** - Hoàn thành
5. **`cancelled`** - Đã hủy

---

## 🎯 Các Trường Hợp Chuyển Đổi Trạng Thái

### 1. ✅ Tự Động Chuyển Đổi (Auto-Transition)

#### 1.1. Tự động chuyển từ `planning` → `active`

**Khi nào:**
- Khi **progress > 0** và status hiện tại là `planning`

**Ở đâu:**
- **Backend:** `backend/routers/projects.py` - `update_project()` endpoint
- **Logic:** Tự động khi update progress

**Code:**
```python
# backend/routers/projects.py (line 463-474)
# Auto-update status based on progress
if 'progress' in update_data:
    progress = update_data['progress']
    current_project = supabase.table("projects").select("status").eq("id", project_id).execute()
    current_status = current_project.data[0]['status'] if current_project.data else 'planning'
    
    # Auto-change status based on progress
    if progress > 0 and current_status == 'planning':
        update_data['status'] = 'active'
```

**Ví dụ:**
- Dự án đang ở trạng thái `planning` (progress = 0%)
- User update progress lên 10%
- → Hệ thống tự động chuyển status sang `active`

---

#### 1.2. Tự động chuyển sang `completed`

**Khi nào:**
- Khi **progress >= 100%** và status không phải `completed` hoặc `cancelled`

**Ở đâu:**
- **Backend:** `backend/routers/projects.py` - `update_project()` endpoint
- **Logic:** Tự động khi update progress

**Code:**
```python
# backend/routers/projects.py (line 473-474)
elif progress >= 100 and current_status not in ['completed', 'cancelled']:
    update_data['status'] = 'completed'
```

**Ví dụ:**
- Dự án đang ở trạng thái `active` (progress = 90%)
- User update progress lên 100%
- → Hệ thống tự động chuyển status sang `completed`

---

### 2. 🖱️ Chuyển Đổi Thủ Công (Manual Transition)

#### 2.1. Qua Kanban Board (Drag & Drop)

**Khi nào:**
- User **drag & drop** project card từ column này sang column khác trong Kanban Board

**Ở đâu:**
- **Frontend:** `frontend/src/components/projects/KanbanBoard.tsx`
- **Function:** `updateProjectStatus()`

**Logic:**
```typescript
// frontend/src/components/projects/KanbanBoard.tsx (line 183-227)
const updateProjectStatus = async (project: ProjectItem, newStatus: ProjectStatus) => {
  const updateData: any = { status: newStatus }
  
  // Auto-set progress to 100% when moving to completed
  if (newStatus === 'completed') {
    updateData.progress = 100
  }
  // Auto-set progress to 0% when moving back to planning
  else if (newStatus === 'planning') {
    updateData.progress = 0
  }
  
  // Update project status and progress in database
  await supabase
    .from('projects')
    .update(updateData)
    .eq('id', project.id)
}
```

**Đặc biệt:**
- Khi chuyển sang `completed` → Tự động set `progress = 100%`
- Khi chuyển về `planning` → Tự động set `progress = 0%`
- Có confirmation dialog khi chuyển sang `completed`, `on_hold`, hoặc `cancelled`

**Ví dụ:**
- User drag project từ "Đang hoạt động" sang "Hoàn thành"
- → Status chuyển sang `completed` và progress = 100%

---

#### 2.2. Qua Edit Project Form

**Khi nào:**
- User **edit project** và thay đổi status trong form

**Ở đâu:**
- **Frontend:** 
  - `frontend/src/components/projects/EditProjectModal.tsx`
  - `frontend/src/components/projects/EditProjectSidebar.tsx`
- **Backend:** `backend/routers/projects.py` - `update_project()` endpoint

**Logic:**
- User chọn status mới trong dropdown
- Submit form → Gọi API `PUT /api/projects/{project_id}`
- Backend update status trong database

**Ví dụ:**
- User mở edit form
- Chọn status = `on_hold` từ dropdown
- Save → Status được update

---

#### 2.3. Qua API Endpoint Trực Tiếp

**Khi nào:**
- Gọi API endpoint để update status trực tiếp

**Ở đâu:**
- **Backend:** `backend/routers/projects.py` - `update_project_status()` endpoint
- **Endpoint:** `PUT /api/projects/{project_id}/status`

**Code:**
```python
# backend/routers/projects.py (line 1218-1256)
@router.put("/{project_id}/status")
async def update_project_status(
    project_id: str,
    status: str,
    current_user: User = Depends(require_manager_or_admin)
):
    """Update project status"""
    supabase.table("projects").update({
        "status": status,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", project_id).execute()
```

**Ví dụ:**
```bash
PUT /api/projects/{project_id}/status
Body: { "status": "on_hold" }
```

---

### 3. 🔄 Logic Hiển Thị (Display Logic)

#### 3.1. Kanban Board Auto-Display

**Khi nào:**
- Kanban Board tự động hiển thị status dựa trên progress (chỉ hiển thị, không thay đổi database)

**Ở đâu:**
- **Frontend:** `frontend/src/components/projects/KanbanBoard.tsx`

**Logic:**
```typescript
// frontend/src/components/projects/KanbanBoard.tsx (line 286-291)
let displayStatus = p.status

// Auto-display based on progress (for display only)
if (p.status === 'planning' && p.progress > 0) {
  displayStatus = 'active'
} else if (p.progress >= 100 && p.status !== 'cancelled' && p.status !== 'on_hold') {
  displayStatus = 'completed'
}
```

**Lưu ý:**
- Đây chỉ là **hiển thị**, không thay đổi status trong database
- Status thực tế vẫn giữ nguyên trong database

---

## 📊 Bảng Tóm Tắt Chuyển Đổi

| Trường Hợp | Khi Nào | Ở Đâu | Tự Động/Thủ Công |
|------------|---------|-------|------------------|
| **planning → active** | Progress > 0% | Backend `update_project()` | ✅ Tự động |
| **→ completed** | Progress >= 100% | Backend `update_project()` | ✅ Tự động |
| **Bất kỳ → Bất kỳ** | Drag & Drop trong Kanban | Frontend `KanbanBoard.tsx` | 🖱️ Thủ công |
| **Bất kỳ → Bất kỳ** | Edit project form | Frontend `EditProjectModal.tsx` | 🖱️ Thủ công |
| **Bất kỳ → Bất kỳ** | API call trực tiếp | Backend `update_project_status()` | 🖱️ Thủ công |

---

## 🔍 Chi Tiết Logic Chuyển Đổi

### Logic 1: Auto-Transition Based on Progress

**File:** `backend/routers/projects.py` (line 463-474)

**Điều kiện:**
1. User update `progress` field
2. Backend check current status
3. Apply auto-transition rules

**Rules:**
- `planning` + progress > 0 → `active`
- Any status (except `completed`, `cancelled`) + progress >= 100 → `completed`

**Ví dụ:**
```
Status: planning, Progress: 0% → Update progress to 10% → Status: active
Status: active, Progress: 90% → Update progress to 100% → Status: completed
```

---

### Logic 2: Manual Transition via Kanban

**File:** `frontend/src/components/projects/KanbanBoard.tsx` (line 183-227)

**Điều kiện:**
1. User drag project card
2. Drop vào column khác
3. Check confirmation (nếu cần)
4. Update status và progress

**Rules:**
- Chuyển sang `completed` → Set `progress = 100%`
- Chuyển về `planning` → Set `progress = 0%`
- Chuyển sang `on_hold`, `cancelled` → Có confirmation dialog

**Ví dụ:**
```
Drag project từ "Đang hoạt động" → "Hoàn thành"
→ Status: completed, Progress: 100%
```

---

### Logic 3: Manual Transition via Edit Form

**File:** `frontend/src/components/projects/EditProjectModal.tsx`

**Điều kiện:**
1. User mở edit form
2. Chọn status mới từ dropdown
3. Submit form
4. Backend update status

**Rules:**
- User có thể chọn bất kỳ status nào
- Không có auto-transition
- Không tự động thay đổi progress

**Ví dụ:**
```
Edit project → Chọn status = "on_hold" → Save
→ Status: on_hold (progress giữ nguyên)
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Trạng Thái Không Thể Chuyển Ngược

**Không có logic tự động:**
- `completed` → `active` (phải thủ công)
- `cancelled` → `active` (phải thủ công)

**Lý do:**
- Đảm bảo tính nhất quán của dữ liệu
- Tránh nhầm lẫn

---

### 2. Progress và Status Có Liên Quan

**Khi chuyển status:**
- `completed` → Auto set `progress = 100%`
- `planning` → Auto set `progress = 0%`
- Các status khác → Progress giữ nguyên

**Khi update progress:**
- Progress > 0 + status = `planning` → Auto chuyển `active`
- Progress >= 100 → Auto chuyển `completed`

---

### 3. Permissions

**Ai có thể thay đổi status:**
- ✅ **Manager** - Có thể thay đổi
- ✅ **Admin** - Có thể thay đổi
- ❌ **Employee** - Không thể thay đổi (chỉ xem)

**Backend check:**
```python
current_user: User = Depends(require_manager_or_admin)
```

---

## 📝 Ví Dụ Thực Tế

### Ví Dụ 1: Dự Án Mới Tạo

```
1. Tạo dự án mới
   → Status: planning, Progress: 0%

2. Bắt đầu làm việc, update progress lên 5%
   → Status: active (tự động), Progress: 5%

3. Tiếp tục làm, update progress lên 100%
   → Status: completed (tự động), Progress: 100%
```

---

### Ví Dụ 2: Tạm Dừng Dự Án

```
1. Dự án đang active, progress: 50%

2. Manager drag project sang "Tạm dừng" trong Kanban
   → Status: on_hold, Progress: 50% (giữ nguyên)

3. Sau đó, manager drag lại sang "Đang hoạt động"
   → Status: active, Progress: 50% (giữ nguyên)
```

---

### Ví Dụ 3: Hủy Dự Án

```
1. Dự án đang planning hoặc active

2. Manager edit project, chọn status = "cancelled"
   → Status: cancelled, Progress: giữ nguyên

3. Dự án đã cancelled không thể tự động chuyển sang completed
   (ngay cả khi progress = 100%)
```

---

## 🔗 Related Code

### Backend
- `backend/routers/projects.py` - Line 463-474 (Auto-transition)
- `backend/routers/projects.py` - Line 1218-1256 (Manual update endpoint)
- `backend/models/project.py` - ProjectStatus enum

### Frontend
- `frontend/src/components/projects/KanbanBoard.tsx` - Drag & drop logic
- `frontend/src/components/projects/EditProjectModal.tsx` - Edit form
- `frontend/src/components/projects/EditProjectSidebar.tsx` - Edit sidebar

---

## ✅ Tổng Kết

### Các Cách Chuyển Đổi Trạng Thái:

1. ✅ **Tự động** - Khi update progress:
   - `planning` → `active` (progress > 0)
   - Any → `completed` (progress >= 100)

2. 🖱️ **Thủ công** - Qua Kanban Board:
   - Drag & drop project card
   - Auto-set progress khi cần

3. 🖱️ **Thủ công** - Qua Edit Form:
   - Chọn status mới trong dropdown
   - Submit form

4. 🖱️ **Thủ công** - Qua API:
   - Gọi `PUT /api/projects/{project_id}/status`

### Quy Tắc:
- ✅ Progress và Status có liên quan
- ✅ Một số chuyển đổi tự động
- ✅ Permissions: Chỉ Manager/Admin mới có thể thay đổi
- ⚠️ `completed` và `cancelled` không tự động chuyển ngược

