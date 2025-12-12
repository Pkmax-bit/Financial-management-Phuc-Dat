# So sánh 2 Conversation Objects

## Conversation 1: Direct Chat (1-1)

```json
{
  "name": "Admin Cửa Phúc Đạt",
  "type": "direct",
  "id": "795575b5-1ebf-4eac-80eb-5f8c5e91aaf3",
  "last_message_at": null,
  "last_message_preview": null,
  "participant_count": 2,
  "project_id": null,
  "participants": [...]
}
```

## Conversation 2: Group Chat (Nhóm)

```json
{
  "name": "test",
  "type": "group",
  "id": "3866ca48-da99-4559-a257-0ece907e5e8e",
  "last_message_at": "2025-12-12T15:14:43.149331Z",
  "last_message_preview": "test",
  "participant_count": 4,
  "project_id": "08fd06ce-01da-42ef-9ec9-b45ea16baf2e",
  "participants": [...]
}
```

## So sánh chi tiết

### 1. Type (Loại conversation)

| Field | Conversation 1 | Conversation 2 |
|-------|---------------|---------------|
| `type` | `"direct"` | `"group"` |
| **Ý nghĩa** | Chat 1-1 giữa 2 người | Chat nhóm với nhiều người |

**Khác biệt:**
- **Direct**: Chỉ có 2 participants, không có tên nhóm (name được set từ tên người dùng)
- **Group**: Có nhiều hơn 2 participants, có tên nhóm riêng

---

### 2. Participants (Thành viên)

| Field | Conversation 1 | Conversation 2 |
|-------|---------------|---------------|
| `participant_count` | `2` | `4` |
| **Số lượng** | 2 người | 4 người |

**Participants trong Conversation 1:**
1. Admin Test (`ed57da6d-f1b2-4ead-bc98-d4a4a14b5d54`) - role: `member`
2. Admin Cửa Phúc Đạt (`a846cd29-49df-4408-a02a-9c92a7067ed5`) - role: `member`

**Participants trong Conversation 2:**
1. Admin Tủ Bếp Phúc Đạt (`2dde457d-3c97-4234-a37b-8cc2d39c53a0`) - role: `member`
2. Hoàng Quân (`74f5a334-748b-436d-8bfa-63ca399908a3`) - role: `member`
3. Admin Cửa Phúc Đạt (`a846cd29-49df-4408-a02a-9c92a7067ed5`) - role: `member`
4. Admin Test (`ed57da6d-f1b2-4ead-bc98-d4a4a14b5d54`) - role: `admin` ⭐

**Khác biệt:**
- Conversation 1: Tất cả participants đều có `role: "member"`
- Conversation 2: Có 1 participant với `role: "admin"` (Admin Test) - có quyền quản lý nhóm

---

### 3. Messages (Tin nhắn)

| Field | Conversation 1 | Conversation 2 |
|-------|---------------|---------------|
| `last_message_at` | `null` | `"2025-12-12T15:14:43.149331Z"` |
| `last_message_preview` | `null` | `"test"` |

**Khác biệt:**
- **Conversation 1**: Chưa có tin nhắn nào (`last_message_at = null`)
  - Đây là conversation mới tạo (15:22:31 hôm nay)
  - Chưa có ai gửi tin nhắn
  - Frontend sẽ hiển thị: "Chưa có tin nhắn nào"
  
- **Conversation 2**: Đã có tin nhắn
  - Tin nhắn cuối cùng: "test"
  - Thời gian: 2025-12-12T15:14:43
  - Frontend sẽ hiển thị preview: "test"

---

### 4. Project Link (Liên kết dự án)

| Field | Conversation 1 | Conversation 2 |
|-------|---------------|---------------|
| `project_id` | `null` | `"08fd06ce-01da-42ef-9ec9-b45ea16baf2e"` |

**Khác biệt:**
- **Conversation 1**: Không liên kết với dự án nào
- **Conversation 2**: Liên kết với dự án `08fd06ce-01da-42ef-9ec9-b45ea16baf2e`
  - Đây là group chat của dự án
  - Có thể hiển thị link đến dự án trong UI

---

### 5. Last Read Status (Trạng thái đọc)

**Conversation 1:**
- Tất cả participants có `last_read_at: null`
- Chưa có ai đọc (vì chưa có messages)

**Conversation 2:**
- Admin Test: `last_read_at: "2025-12-12T22:17:33.507151Z"` ✅ (đã đọc)
- Admin Cửa Phúc Đạt: `last_read_at: "2025-12-12T05:26:09.924134Z"` ✅ (đã đọc)
- Admin Tủ Bếp Phúc Đạt: `last_read_at: null` ❌ (chưa đọc)
- Hoàng Quân: `last_read_at: null` ❌ (chưa đọc)

**Khác biệt:**
- Conversation 1: Chưa có ai đọc (vì chưa có messages)
- Conversation 2: 2/4 người đã đọc tin nhắn cuối cùng

---

### 6. Created/Updated Times

**Conversation 1:**
- `created_at`: `"2025-12-12T15:22:31.723188Z"`
- `updated_at`: `"2025-12-12T15:22:31.723188Z"`
- **Mới tạo hôm nay** (15:22)

**Conversation 2:**
- `created_at`: `"2025-12-11T09:41:20.807019Z"`
- `updated_at`: `"2025-12-12T15:14:43.149331Z"`
- **Tạo từ hôm qua** (11/12), cập nhật lần cuối khi có tin nhắn mới (15:14)

**Khác biệt:**
- Conversation 1: Mới tạo, chưa có hoạt động
- Conversation 2: Đã tồn tại từ hôm qua, có hoạt động (tin nhắn mới)

---

## Tóm tắt khác biệt chính

| Tiêu chí | Conversation 1 (Direct) | Conversation 2 (Group) |
|----------|------------------------|------------------------|
| **Type** | `direct` (1-1) | `group` (nhóm) |
| **Participants** | 2 người | 4 người |
| **Messages** | ❌ Chưa có | ✅ Đã có |
| **Project Link** | ❌ Không có | ✅ Có (`08fd06ce-...`) |
| **Admin Role** | ❌ Không có | ✅ Có (Admin Test) |
| **Last Read** | ❌ Chưa có ai đọc | ✅ 2/4 đã đọc |
| **Age** | Mới tạo hôm nay | Tạo từ hôm qua |

---

## Ý nghĩa trong UI

### Conversation 1 (Direct):
- Hiển thị tên người dùng (không phải tên nhóm)
- Hiển thị "Chưa có tin nhắn nào"
- Không có badge unread (vì chưa có messages)
- Không có project link

### Conversation 2 (Group):
- Hiển thị tên nhóm: "test"
- Hiển thị preview tin nhắn cuối: "test"
- Có thể hiển thị project link
- Có thể hiển thị role "admin" cho Admin Test
- Có thể hiển thị số người chưa đọc (2 người)

---

## Kết luận

**Conversation 1** là một **direct chat mới tạo**, chưa có hoạt động nào.

**Conversation 2** là một **group chat đã có hoạt động**, liên kết với dự án, có tin nhắn và có người quản lý.

Cả hai đều có cấu trúc dữ liệu đúng và đầy đủ, chỉ khác nhau về:
- Loại conversation (direct vs group)
- Trạng thái hoạt động (mới tạo vs đã có messages)
- Liên kết với dự án (có vs không)

