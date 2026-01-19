# Các Role và Chức Vụ trong Hệ Thống

## 1. User Roles (Vai trò người dùng hệ thống)

Được định nghĩa trong `backend/models/user.py` - `UserRole` enum:

### 1.1. ADMIN
- **Mã**: `admin`
- **Mô tả**: Quản trị viên hệ thống
- **Quyền hạn**:
  - Xem tất cả dự án (không cần là thành viên project_team)
  - Tạo, sửa, xóa dự án
  - Quản lý người dùng
  - Cập nhật tiến độ dự án
  - Tạo nhiệm vụ trong bất kỳ dự án nào

### 1.2. ACCOUNTANT
- **Mã**: `accountant`
- **Mô tả**: Kế toán
- **Quyền hạn**:
  - Xem tất cả dự án
  - Quản lý tài chính, hóa đơn, báo giá
  - Xem báo cáo tài chính

### 1.3. SALES
- **Mã**: `sales`
- **Mô tả**: Nhân viên bán hàng
- **Quyền hạn**:
  - Quản lý báo giá (quotes)
  - Quản lý khách hàng
  - Tạo và quản lý đơn hàng

### 1.4. WORKSHOP_EMPLOYEE
- **Mã**: `workshop_employee`
- **Mô tả**: Nhân viên xưởng sản xuất
- **Quyền hạn**:
  - Xem và cập nhật nhiệm vụ sản xuất
  - Quản lý vật tư, nguyên liệu

### 1.5. WORKER
- **Mã**: `worker`
- **Mô tả**: Công nhân
- **Quyền hạn**:
  - Xem nhiệm vụ được giao
  - Cập nhật tiến độ công việc

### 1.6. TRANSPORT
- **Mã**: `transport`
- **Mô tả**: Nhân viên vận chuyển
- **Quyền hạn**:
  - Quản lý nhiệm vụ vận chuyển
  - Cập nhật trạng thái giao hàng

### 1.7. EMPLOYEE
- **Mã**: `employee`
- **Mô tả**: Nhân viên chung (mặc định)
- **Quyền hạn**:
  - Xem dự án mà họ là thành viên
  - Tham gia vào nhiệm vụ được giao

### 1.8. CUSTOMER
- **Mã**: `customer`
- **Mô tả**: Khách hàng
- **Quyền hạn**:
  - Xem dự án của mình
  - Xem báo giá, hóa đơn

---

## 2. Project Team Roles (Vai trò trong dự án)

Được lưu trong bảng `project_team` - cột `role`:

### 2.1. MANAGER
- **Mã**: `manager`
- **Mô tả**: Quản lý dự án
- **Quyền hạn**:
  - Tạo, sửa, xóa nhiệm vụ trong dự án
  - Phân công nhiệm vụ
  - Cập nhật tiến độ dự án
  - Quản lý thành viên nhóm

### 2.2. OWNER
- **Mã**: `owner`
- **Mô tả**: Chủ sở hữu dự án
- **Quyền hạn**: Tương tự Manager

### 2.3. LEAD
- **Mã**: `lead`
- **Mô tả**: Trưởng nhóm
- **Quyền hạn**:
  - Tạo nhiệm vụ
  - Phân công công việc
  - Quản lý nhóm nhỏ

### 2.4. MEMBER
- **Mã**: `member`
- **Mô tả**: Thành viên dự án (mặc định)
- **Quyền hạn**:
  - Xem dự án và nhiệm vụ
  - Cập nhật tiến độ nhiệm vụ được giao
  - Tham gia thảo luận

### 2.5. PROJECT MANAGER
- **Mã**: `project manager`
- **Mô tả**: Quản lý dự án (alias)
- **Quyền hạn**: Tương tự Manager

### 2.6. QUẢN LÝ DỰ ÁN
- **Mã**: `quản lý dự án`
- **Mô tả**: Quản lý dự án (tiếng Việt)
- **Quyền hạn**: Tương tự Manager

### 2.7. NGƯỜI PHỤ TRÁCH
- **Mã**: `người phụ trách`
- **Mô tả**: Người phụ trách
- **Quyền hạn**: Tương tự Manager

### 2.8. NGƯỜI TẠO
- **Mã**: `người tạo`
- **Mô tả**: Người tạo dự án
- **Quyền hạn**: Tương tự Manager

---

## 3. Responsibility Types (RACI - Loại trách nhiệm)

Được lưu trong bảng `project_team` - cột `responsibility_type`:

### 3.1. ACCOUNTABLE
- **Mã**: `accountable`
- **Mô tả**: Người chịu trách nhiệm cuối cùng
- **Đặc điểm**:
  - Chịu trách nhiệm về kết quả cuối cùng
  - Thường là Manager hoặc Owner
  - Có quyền quyết định

### 3.2. RESPONSIBLE
- **Mã**: `responsible`
- **Mô tả**: Người thực hiện
- **Đặc điểm**:
  - Trực tiếp thực hiện công việc
  - Có thể có nhiều người responsible cho một nhiệm vụ

### 3.3. CONSULTED
- **Mã**: `consulted`
- **Mô tả**: Người được tư vấn
- **Đặc điểm**:
  - Cung cấp ý kiến, tư vấn
  - Tham gia vào quá trình quyết định

### 3.4. INFORMED
- **Mã**: `informed`
- **Mô tả**: Người được thông báo
- **Đặc điểm**:
  - Nhận thông tin về tiến độ
  - Không tham gia trực tiếp

---

## 4. Task Participant Roles (Vai trò trong nhiệm vụ)

Được định nghĩa trong `backend/models/task.py` - `TaskParticipantRole` enum:

### 4.1. RESPONSIBLE
- **Mã**: `responsible`
- **Mô tả**: Người phụ trách nhiệm vụ
- **Quyền hạn**:
  - Chịu trách nhiệm hoàn thành nhiệm vụ
  - Có thể cập nhật trạng thái, tiến độ
  - Một nhiệm vụ có thể có nhiều người responsible

### 4.2. PARTICIPANT
- **Mã**: `participant`
- **Mô tả**: Người tham gia
- **Quyền hạn**:
  - Tham gia thực hiện nhiệm vụ
  - Cập nhật tiến độ
  - Tham gia thảo luận

### 4.3. OBSERVER
- **Mã**: `observer`
- **Mô tả**: Người quan sát
- **Quyền hạn**:
  - Xem nhiệm vụ và tiến độ
  - Tham gia thảo luận
  - Không thể cập nhật trạng thái

---

## 5. Task Group Roles (Vai trò trong nhóm nhiệm vụ)

Được định nghĩa trong `backend/models/task.py` - `TaskGroupRole` enum:

### 5.1. OWNER
- **Mã**: `owner`
- **Mô tả**: Chủ sở hữu nhóm
- **Quyền hạn**:
  - Quản lý toàn bộ nhóm
  - Thêm/xóa thành viên
  - Xóa nhóm

### 5.2. ADMIN
- **Mã**: `admin`
- **Mô tả**: Quản trị viên nhóm
- **Quyền hạn**:
  - Quản lý thành viên
  - Chỉnh sửa thông tin nhóm
  - Không thể xóa nhóm

### 5.3. MEMBER
- **Mã**: `member`
- **Mô tả**: Thành viên nhóm (mặc định)
- **Quyền hạn**:
  - Xem và tham gia nhiệm vụ trong nhóm
  - Tạo nhiệm vụ mới

---

## 6. Chat/Conversation Roles (Vai trò trong cuộc trò chuyện)

Được sử dụng trong `backend/routers/chat.py`:

### 6.1. ADMIN
- **Mã**: `admin`
- **Mô tả**: Quản trị viên nhóm chat
- **Quyền hạn**:
  - Thêm/xóa thành viên
  - Xóa tin nhắn
  - Quản lý nhóm
  - Chỉ có trong group chat

### 6.2. MEMBER
- **Mã**: `member`
- **Mô tả**: Thành viên nhóm chat
- **Quyền hạn**:
  - Gửi tin nhắn
  - Xem lịch sử chat
  - Không thể quản lý nhóm

---

## 7. Tóm tắt Quyền Hạn

### 7.1. Tạo Dự Án
- **ADMIN**: ✅
- **ACCOUNTANT**: ✅
- **MANAGER** (user role): ✅
- **Các role khác**: ❌

### 7.2. Tạo Nhiệm vụ trong Dự Án
- **ADMIN**: ✅ (tất cả dự án)
- **ACCOUNTANT**: ✅ (tất cả dự án)
- **MANAGER** (project team role): ✅ (trong dự án của họ)
- **OWNER** (project team role): ✅ (trong dự án của họ)
- **LEAD** (project team role): ✅ (trong dự án của họ)
- **MEMBER** (project team role): ❌

### 7.3. Xem Tất Cả Dự Án
- **ADMIN**: ✅
- **ACCOUNTANT**: ✅
- **Các role khác**: ❌ (chỉ xem dự án họ là thành viên)

### 7.4. Cập Nhật Tiến Độ Dự Án
- **ADMIN**: ✅
- **MANAGER** (user role): ✅
- **MANAGER** (project team role): ✅
- **Thành viên project_team**: ✅ (bất kỳ role nào)

---

## 8. Lưu Ý

1. **User Role vs Project Team Role**:
   - User Role: Vai trò trong toàn hệ thống (ADMIN, ACCOUNTANT, SALES, etc.)
   - Project Team Role: Vai trò trong một dự án cụ thể (MANAGER, OWNER, MEMBER, etc.)

2. **Responsibility Type (RACI)**:
   - Độc lập với role
   - Mô tả loại trách nhiệm trong dự án
   - Có thể kết hợp: một người có thể vừa là MANAGER (role) vừa là ACCOUNTABLE (responsibility_type)

3. **Task Participant Role**:
   - Chỉ áp dụng cho nhiệm vụ cụ thể
   - Một người có thể có role khác nhau trong các nhiệm vụ khác nhau

4. **Default Values**:
   - User role mặc định: `EMPLOYEE`
   - Project team role mặc định: `member`
   - Task participant role mặc định: `participant`
   - Task group role mặc định: `member`

---

## 9. Ví dụ Sử Dụng

### Ví dụ 1: Tạo dự án với manager
```python
# User có role = "admin" hoặc "manager" (user role)
# Khi tạo dự án, manager_id được set
# Manager tự động được thêm vào project_team với:
#   - role = "manager"
#   - responsibility_type = "accountable"
```

### Ví dụ 2: Thêm người phụ trách nhiệm vụ lớn
```python
# Thêm vào task_participants với:
#   - role = "responsible"
#   - employee_id = "uuid-của-nhân-viên"
# Một nhiệm vụ có thể có nhiều người responsible
```

### Ví dụ 3: Cấu trúc quyền hạn
```
ADMIN (user role)
  └─> Có thể làm mọi thứ
  
MANAGER (user role)
  └─> Có thể tạo dự án
  
MANAGER (project team role)
  └─> Có thể tạo nhiệm vụ trong dự án
  
MEMBER (project team role)
  └─> Chỉ xem và cập nhật nhiệm vụ được giao
```
