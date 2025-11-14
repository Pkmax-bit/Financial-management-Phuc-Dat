# Hệ thống Upload Hình ảnh và File

## 📋 Tổng quan

Hệ thống đã được tích hợp tính năng upload hình ảnh và file tổng quát, cho phép upload file từ nhiều module khác nhau trong hệ thống quản lý tài chính.

## 🎯 Tính năng

### ✅ Đã triển khai

1. **Service Upload Tổng quát** (`file_upload_service.py`)
   - Upload file/hình ảnh lên Supabase Storage
   - Validate file type và size
   - Hỗ trợ upload đơn và upload nhiều file
   - Tự động tạo tên file unique
   - Xóa file từ storage

2. **API Endpoints** (`file_upload.py`)
   - Upload file tổng quát với folder path tùy chỉnh
   - Upload nhiều file cùng lúc
   - Upload hình ảnh (chỉ images)
   - Xóa file
   - Endpoints tiện ích cho các use case phổ biến

3. **Tích hợp sẵn**
   - Project Timeline (đã có sẵn)
   - Project Team (avatar)

## 🚀 Sử dụng

### 1. Upload File Tổng quát

```typescript
// Frontend - Upload file bất kỳ
const formData = new FormData()
formData.append('file', file)

const response = await fetch(`/api/uploads/Expenses/${expenseId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const result = await response.json()
// result: { id, name, url, type, size, uploaded_at, path, content_type }
```

### 2. Upload Hình ảnh

```typescript
// Frontend - Upload chỉ hình ảnh
const formData = new FormData()
formData.append('file', imageFile)

const response = await fetch(`/api/uploads/images/Products/${productId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

### 3. Upload Nhiều File

```typescript
// Frontend - Upload nhiều file
const formData = new FormData()
files.forEach(file => {
  formData.append('files', file)
})

const response = await fetch(`/api/uploads/Invoices/${invoiceId}/multiple`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const result = await response.json()
// result: { files: [...], errors: [...] }
```

### 4. Sử dụng Endpoints Tiện ích

```typescript
// Upload receipt cho expense
POST /api/uploads/expenses/{expense_id}

// Upload attachment cho invoice
POST /api/uploads/invoices/{invoice_id}

// Upload receipt cho bill
POST /api/uploads/bills/{bill_id}

// Upload hình ảnh cho project
POST /api/uploads/projects/{project_id}/images

// Upload hình ảnh cho product
POST /api/uploads/products/{product_id}/images

// Upload avatar
POST /api/uploads/avatars/{entity_type}/{entity_id}
// entity_type: employees, customers, vendors, etc.
```

## 📁 Cấu trúc Storage

Files được lưu trong Supabase Storage bucket `minhchung_chiphi` với cấu trúc:

```
minhchung_chiphi/
├── Expenses/
│   └── {expense_id}/
│       └── {unique_filename}
├── Invoices/
│   └── {invoice_id}/
│       └── {unique_filename}
├── Bills/
│   └── {bill_id}/
│       └── {unique_filename}
├── Projects/
│   └── {project_id}/
│       ├── Images/
│       └── Timeline/
├── Products/
│   └── {product_id}/
│       └── Images/
├── Avatars/
│   ├── employees/
│   ├── customers/
│   └── vendors/
└── Quotes/
    └── {quote_id}/
```

## 🔧 Cấu hình

### Backend Config (`config.py`)

```python
# File Upload Settings
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
UPLOAD_DIRECTORY = os.getenv("UPLOAD_DIRECTORY", "uploads")
```

### Environment Variables

```env
# Supabase Storage
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# File Upload (optional)
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

## 📝 Đề xuất Tích hợp

### 1. **Expenses Module** ✅ Đề xuất

**Mục đích**: Upload hóa đơn/chứng từ chi phí

**Cách tích hợp**:
- Model `Expense` đã có field `receipt_url`
- Thêm button "Upload Receipt" trong form tạo/sửa expense
- Sử dụng endpoint: `POST /api/uploads/expenses/{expense_id}`
- Lưu URL vào `receipt_url` field

**Ví dụ code**:
```typescript
// Frontend component
const handleReceiptUpload = async (file: File, expenseId: string) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(`/api/uploads/expenses/${expenseId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })
  
  const { url } = await response.json()
  
  // Update expense with receipt_url
  await updateExpense(expenseId, { receipt_url: url })
}
```

### 2. **Invoices Module** ✅ Đề xuất

**Mục đích**: Upload file đính kèm hóa đơn (PDF, hình ảnh)

**Cách tích hợp**:
- Tạo bảng `invoice_attachments` hoặc thêm field `attachments` (JSONB)
- Thêm section "Attachments" trong invoice detail page
- Sử dụng endpoint: `POST /api/uploads/invoices/{invoice_id}`
- Lưu danh sách attachments vào database

**Database Schema**:
```sql
CREATE TABLE invoice_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    size BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. **Bills Module** ✅ Đề xuất

**Mục đích**: Upload hóa đơn mua hàng từ vendor

**Cách tích hợp**:
- Model `Bill` đã có field `receipt_url`
- Tương tự Expenses module
- Sử dụng endpoint: `POST /api/uploads/bills/{bill_id}`

### 4. **Quotes Module** ✅ Đề xuất

**Mục đích**: Upload file đính kèm báo giá (PDF, hình ảnh sản phẩm)

**Cách tích hợp**:
- Tạo bảng `quote_attachments`
- Thêm section upload trong quote form
- Sử dụng endpoint: `POST /api/uploads/Quotes/{quote_id}`

### 5. **Products/Services Module** ✅ Đề xuất

**Mục đích**: Upload hình ảnh sản phẩm/dịch vụ

**Cách tích hợp**:
- Thêm field `image_url` hoặc `images` (array) vào model
- Thêm image upload trong product form
- Sử dụng endpoint: `POST /api/uploads/products/{product_id}/images`
- Hiển thị hình ảnh trong product list và detail

### 6. **Projects Module** ✅ Đề xuất

**Mục đích**: Upload hình ảnh dự án (tiến độ, công trình, etc.)

**Cách tích hợp**:
- Tạo bảng `project_images` hoặc sử dụng timeline attachments
- Thêm gallery trong project detail page
- Sử dụng endpoint: `POST /api/uploads/projects/{project_id}/images`

### 7. **Employees Module** ✅ Đề xuất

**Mục đích**: Upload avatar nhân viên

**Cách tích hợp**:
- Model có thể đã có field `avatar` hoặc `avatar_url`
- Thêm avatar upload trong employee form
- Sử dụng endpoint: `POST /api/uploads/avatars/employees/{employee_id}`
- Hiển thị avatar trong employee list và profile

### 8. **Customers/Vendors Module** ✅ Đề xuất

**Mục đích**: Upload logo khách hàng/nhà cung cấp

**Cách tích hợp**:
- Thêm field `logo_url` vào models
- Thêm logo upload trong customer/vendor form
- Sử dụng endpoint: `POST /api/uploads/avatars/customers/{customer_id}`
- Hiển thị logo trong customer/vendor list

### 9. **Expense Claims Module** ✅ Đề xuất

**Mục đích**: Upload chứng từ cho từng item trong expense claim

**Cách tích hợp**:
- Model `ExpenseClaimItem` có thể thêm field `receipt_url`
- Thêm upload button cho mỗi item
- Sử dụng endpoint: `POST /api/uploads/ExpenseClaims/{claim_id}/{item_id}`

## 🎨 UI Components Đề xuất

### 1. ImageUpload Component

```typescript
// components/common/ImageUpload.tsx
interface ImageUploadProps {
  onUpload: (url: string) => void
  folderPath: string
  maxSize?: number
  accept?: string
  multiple?: boolean
}
```

### 2. FileUploadButton Component

```typescript
// components/common/FileUploadButton.tsx
interface FileUploadButtonProps {
  endpoint: string
  onSuccess: (result: UploadResponse) => void
  onError?: (error: string) => void
  accept?: string
  maxSize?: number
  label?: string
}
```

### 3. ImageGallery Component

```typescript
// components/common/ImageGallery.tsx
interface ImageGalleryProps {
  images: Array<{ url: string; name: string }>
  onDelete?: (url: string) => void
  editable?: boolean
}
```

## 🔒 Bảo mật

1. **Authentication**: Tất cả endpoints yêu cầu authentication
2. **File Type Validation**: Chỉ cho phép các file type được định nghĩa
3. **File Size Limit**: Giới hạn kích thước file (mặc định 10MB)
4. **Unique Filenames**: Tự động tạo tên file unique để tránh conflict
5. **Path Sanitization**: Làm sạch đường dẫn file để tránh path traversal

## 📊 File Types Hỗ trợ

### Images
- JPEG/JPG
- PNG
- GIF
- WebP
- SVG

### Documents
- PDF
- DOC/DOCX
- XLS/XLSX

## 🚨 Error Handling

Service tự động xử lý các lỗi:
- File quá lớn → HTTP 400
- File type không hợp lệ → HTTP 400
- Upload thất bại → HTTP 500
- File không tồn tại khi xóa → HTTP 404

## 📈 Best Practices

1. **Compress Images**: Nén hình ảnh trước khi upload để tiết kiệm storage
2. **Lazy Loading**: Load hình ảnh khi cần thiết
3. **CDN**: Sử dụng CDN cho public URLs nếu có
4. **Cleanup**: Xóa file cũ khi update hoặc delete entity
5. **Backup**: Backup quan trọng trước khi xóa

## 🔄 Migration Guide

### Để tích hợp vào module hiện có:

1. **Thêm upload button vào form**
2. **Gọi API endpoint tương ứng**
3. **Lưu URL vào database**
4. **Hiển thị hình ảnh/file trong UI**

### Ví dụ: Tích hợp vào Expenses

```typescript
// 1. Thêm state
const [receiptUrl, setReceiptUrl] = useState<string | null>(null)

// 2. Upload handler
const handleReceiptUpload = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(`/api/uploads/expenses/${expenseId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })
  
  const { url } = await response.json()
  setReceiptUrl(url)
}

// 3. Save với receipt_url
await createExpense({
  ...expenseData,
  receipt_url: receiptUrl
})

// 4. Display receipt
{receiptUrl && (
  <img src={receiptUrl} alt="Receipt" className="max-w-md" />
)}
```

## 📚 API Reference

Xem chi tiết API tại: `/docs` (Swagger UI) hoặc `/redoc`

## 🐛 Troubleshooting

### File không upload được
- Kiểm tra file size < MAX_FILE_SIZE
- Kiểm tra file type trong allowed types
- Kiểm tra Supabase Storage bucket permissions

### URL không hiển thị được
- Kiểm tra bucket có public access không
- Kiểm tra RLS policies trong Supabase
- Kiểm tra URL format

### Upload chậm
- Kiểm tra file size (nên compress images)
- Kiểm tra network connection
- Xem xét sử dụng async upload với progress bar

## 📝 Notes

- Tất cả files được lưu trong Supabase Storage
- Public URLs được tự động generate
- File names được tự động tạo unique để tránh conflict
- Service có thể tái sử dụng cho nhiều module khác nhau

