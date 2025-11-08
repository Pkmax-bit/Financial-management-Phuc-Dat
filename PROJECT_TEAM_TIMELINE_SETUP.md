# Hướng dẫn Setup Đội ngũ và Timeline

## 🎯 Tính năng mới

### 1. **Đội ngũ thi công (Project Team)**
- ✅ Quản lý thành viên dự án
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Thông tin chi tiết: tên, vai trò, email, phone, ngày bắt đầu, giá/giờ, kỹ năng
- ✅ Trạng thái hoạt động (active/inactive)
- ✅ Thống kê đội ngũ

### 2. **Timeline dự án (Project Timeline)**
- ✅ Ghi nhận thời gian và tiến độ
- ✅ Upload hình ảnh và tài liệu lên Supabase Storage
- ✅ Phân loại: milestone, update, issue, meeting
- ✅ Trạng thái: pending, in_progress, completed
- ✅ Quản lý tệp đính kèm

## 🗄️ Database Schema

### Bảng `project_team`
```sql
- id (UUID, Primary Key)
- project_id (UUID, Foreign Key)
- name (VARCHAR)
- role (VARCHAR) - project_manager, developer, designer, tester, other
- email (VARCHAR, Optional)
- phone (VARCHAR, Optional)
- start_date (DATE)
- hourly_rate (DECIMAL, Optional)
- status (VARCHAR) - active, inactive
- skills (TEXT[], Optional)
- avatar (TEXT, Optional)
- created_at, updated_at (TIMESTAMP)
```

### Bảng `project_timeline`
```sql
- id (UUID, Primary Key)
- project_id (UUID, Foreign Key)
- title (VARCHAR)
- description (TEXT)
- date (TIMESTAMP)
- type (VARCHAR) - milestone, update, issue, meeting
- status (VARCHAR) - pending, in_progress, completed
- created_by (VARCHAR)
- created_at (TIMESTAMP)
```

### Bảng `timeline_attachments`
```sql
- id (UUID, Primary Key)
- timeline_entry_id (UUID, Foreign Key)
- name (VARCHAR)
- url (TEXT)
- type (VARCHAR) - image, document, other
- size (BIGINT)
- uploaded_at (TIMESTAMP)
```

## 🚀 Setup Instructions

### 1. **Tạo Database Tables**
```bash
# Chạy script tạo bảng
python setup_project_team_timeline.py
```

### 2. **Cấu hình Supabase Storage**
1. Vào Supabase Dashboard → Storage
2. Tạo bucket mới tên `minhchung_chiphi`
3. Cấu hình RLS policies cho bucket
4. Set public access nếu cần

### 3. **Cấu hình Environment Variables**

#### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. **API Endpoints**

#### Team Management
- `GET /api/projects/{project_id}/team` - Lấy danh sách đội ngũ
- `POST /api/projects/{project_id}/team` - Thêm thành viên
- `PUT /api/projects/{project_id}/team/{member_id}` - Cập nhật thành viên
- `DELETE /api/projects/{project_id}/team/{member_id}` - Xóa thành viên

#### Timeline Management
- `GET /api/projects/{project_id}/timeline` - Lấy timeline
- `POST /api/projects/{project_id}/timeline` - Thêm mục timeline
- `PUT /api/projects/{project_id}/timeline/{entry_id}` - Cập nhật timeline
- `DELETE /api/projects/{project_id}/timeline/{entry_id}` - Xóa timeline

### 5. **File Upload Storage**
- **Bucket**: `minhchung_chiphi`
- **Path**: `Timeline/{project_id}/{filename}`
- **Supported Types**: Images, Documents, Other files
- **Max Size**: Configurable in Supabase

## 🎨 UI Components

### 1. **ProjectTeam Component**
- 📊 Thống kê đội ngũ (tổng thành viên, đang hoạt động, quản lý, kỹ năng)
- 👥 Danh sách thành viên với avatar, thông tin chi tiết
- ➕ Form thêm/chỉnh sửa thành viên
- 🗑️ Xóa thành viên với confirmation

### 2. **ProjectTimeline Component**
- 📅 Thống kê timeline (tổng mục, hoàn thành, đang thực hiện, tệp đính kèm)
- 📝 Danh sách mục timeline với phân loại và trạng thái
- 📎 Upload và quản lý tệp đính kèm
- ➕ Form thêm/chỉnh sửa mục timeline

## 🔧 Features

### Team Management Features
- ✅ **Role Management**: project_manager, developer, designer, tester, other
- ✅ **Status Tracking**: active, inactive
- ✅ **Skills Management**: Array of skills per member
- ✅ **Hourly Rate**: Optional pricing per member
- ✅ **Contact Info**: Email and phone
- ✅ **Avatar Support**: Optional profile pictures

### Timeline Features
- ✅ **Entry Types**: milestone, update, issue, meeting
- ✅ **Status Tracking**: pending, in_progress, completed
- ✅ **File Attachments**: Images, documents, other files
- ✅ **Date/Time Tracking**: Precise timestamps
- ✅ **Creator Tracking**: Who created each entry
- ✅ **File Management**: Upload, download, delete attachments

### File Upload Features
- ✅ **Supabase Storage**: Secure file storage
- ✅ **File Type Detection**: Automatic categorization
- ✅ **Size Tracking**: File size monitoring
- ✅ **URL Generation**: Public URLs for downloads
- ✅ **Error Handling**: Upload failure recovery

## 🎯 Usage

### 1. **Accessing Team Management**
1. Vào project detail page
2. Click tab "Đội ngũ"
3. Sử dụng các chức năng CRUD

### 2. **Accessing Timeline**
1. Vào project detail page  
2. Click tab "Timeline"
3. Thêm mục timeline với file đính kèm

### 3. **File Upload Process**
1. Chọn files trong form timeline
2. Files được upload lên Supabase Storage
3. URLs được lưu trong database
4. Files có thể download từ timeline entries

## 🔒 Security

### RLS Policies
- **project_team**: Users can view/insert/update/delete
- **project_timeline**: Users can view/insert/update/delete  
- **timeline_attachments**: Users can view/insert/update/delete

### File Upload Security
- ✅ **Type Validation**: Only allowed file types
- ✅ **Size Limits**: Configurable file size limits
- ✅ **Path Security**: Organized file structure
- ✅ **Access Control**: RLS policies for storage

## 🚀 Next Steps

1. **Test API Endpoints**: Verify all CRUD operations
2. **Test File Upload**: Upload và download files
3. **Configure Storage**: Set up Supabase storage bucket
4. **Set Environment Variables**: Configure all required env vars
5. **Test UI Components**: Verify team và timeline components

## 📝 Notes

- **Authentication**: Temporarily disabled for testing
- **File Storage**: Uses Supabase Storage with organized paths
- **Database**: PostgreSQL with proper relationships
- **UI**: Responsive design with modern components
- **Error Handling**: Comprehensive error handling throughout

## 🎉 Completion Status

- ✅ **Backend APIs**: Complete
- ✅ **Database Schema**: Complete  
- ✅ **Frontend Components**: Complete
- ✅ **File Upload**: Complete
- ✅ **UI Integration**: Complete
- ✅ **Documentation**: Complete

**Tính năng đội ngũ và timeline đã sẵn sàng sử dụng!** 🎊
