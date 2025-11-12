# System Feedback Attachments - Hướng dẫn Sử dụng

## 📋 Tổng quan

Hệ thống System Feedback đã được tích hợp tính năng upload attachments (hình ảnh, tài liệu) lên Supabase Storage. Attachments được lưu trữ trong storage và metadata được lưu trong field `attachments` (JSONB) của bảng `system_feedbacks`.

## 🗂️ Cấu trúc Storage

Files được lưu trong Supabase Storage bucket `minhchung_chiphi` với cấu trúc:

```
minhchung_chiphi/
└── SystemFeedbacks/
    └── {feedback_id}/
        ├── {unique_filename_1}
        ├── {unique_filename_2}
        └── ...
```

## 📊 Cấu trúc Database

Field `attachments` trong bảng `system_feedbacks` là JSONB array với format:

```json
[
  {
    "id": "uuid",
    "name": "screenshot.png",
    "url": "https://...",
    "type": "image",
    "size": 123456,
    "uploaded_at": "2025-01-20T10:00:00Z",
    "path": "SystemFeedbacks/{feedback_id}/{unique_filename}"
  }
]
```

## 🔌 API Endpoints

### 1. Upload Single Attachment

```http
POST /api/feedback/system/{feedback_id}/attachments
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: [file]
```

**Response:**
```json
{
  "id": "uuid",
  "name": "screenshot.png",
  "url": "https://...",
  "type": "image",
  "size": 123456,
  "uploaded_at": "2025-01-20T10:00:00Z",
  "path": "SystemFeedbacks/{feedback_id}/{unique_filename}"
}
```

### 2. Upload Multiple Attachments

```http
POST /api/feedback/system/{feedback_id}/attachments/multiple
Content-Type: multipart/form-data
Authorization: Bearer {token}

files: [file1, file2, ...]
```

**Response:**
```json
{
  "message": "Successfully uploaded 2 attachment(s)",
  "attachments": [
    {
      "id": "uuid1",
      "name": "screenshot1.png",
      "url": "https://...",
      "type": "image",
      "size": 123456,
      "uploaded_at": "2025-01-20T10:00:00Z",
      "path": "SystemFeedbacks/{feedback_id}/{unique_filename1}"
    },
    {
      "id": "uuid2",
      "name": "document.pdf",
      "url": "https://...",
      "type": "document",
      "size": 234567,
      "uploaded_at": "2025-01-20T10:00:01Z",
      "path": "SystemFeedbacks/{feedback_id}/{unique_filename2}"
    }
  ]
}
```

### 3. Delete Attachment

```http
DELETE /api/feedback/system/{feedback_id}/attachments/{attachment_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Attachment deleted successfully",
  "deleted_attachment": {
    "id": "uuid",
    "name": "screenshot.png",
    "url": "https://...",
    ...
  }
}
```

## 🔒 Permissions

- **User (employee)**: Chỉ có thể upload/delete attachments cho feedback của chính họ
- **Admin/Manager**: Có thể upload/delete attachments cho bất kỳ feedback nào

## 💻 Frontend Integration

### 1. Upload Attachment khi tạo Feedback

```typescript
// components/system/SystemFeedbackForm.tsx
import { useState } from 'react'
import FileUpload from '@/components/common/FileUpload'

export default function SystemFeedbackForm() {
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<any[]>([])

  const handleCreateFeedback = async (data: FeedbackData) => {
    // Create feedback first
    const response = await fetch('/api/feedback/system', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    const feedback = await response.json()
    setFeedbackId(feedback.id)
    
    // Upload attachments if any
    if (attachments.length > 0) {
      await uploadAttachments(feedback.id, attachments)
    }
  }

  const handleAttachmentUpload = (result: UploadResult) => {
    setAttachments([...attachments, result])
  }

  const uploadAttachments = async (feedbackId: string, files: File[]) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    await fetch(`/api/feedback/system/${feedbackId}/attachments/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
  }

  return (
    <form onSubmit={handleCreateFeedback}>
      {/* Other fields */}
      
      {feedbackId ? (
        <FileUpload
          endpoint={`/api/feedback/system/${feedbackId}/attachments`}
          onSuccess={handleAttachmentUpload}
          accept="image/*,application/pdf"
          label="Upload Attachments"
          multiple={true}
        />
      ) : (
        <p className="text-sm text-gray-500">
          Create feedback first, then you can add attachments
        </p>
      )}
    </form>
  )
}
```

### 2. Hiển thị Attachments trong Feedback Detail

```typescript
// components/system/FeedbackDetail.tsx
export default function FeedbackDetail({ feedback }: { feedback: Feedback }) {
  const handleDeleteAttachment = async (attachmentId: string) => {
    await fetch(
      `/api/feedback/system/${feedback.id}/attachments/${attachmentId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    // Refresh feedback data
    refreshFeedback()
  }

  return (
    <div>
      <h3>Attachments</h3>
      {feedback.attachments && feedback.attachments.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {feedback.attachments.map((attachment) => (
            <div key={attachment.id} className="relative group">
              {attachment.type === 'image' ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-full h-32 object-cover rounded border"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <span className="ml-2 text-sm">{attachment.name}</span>
                </div>
              )}
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity"
              >
                <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
              </a>
              <button
                onClick={() => handleDeleteAttachment(attachment.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No attachments</p>
      )}
    </div>
  )
}
```

### 3. Upload Attachments sau khi tạo Feedback

```typescript
// Upload attachments to existing feedback
const uploadFeedbackAttachments = async (feedbackId: string, files: File[]) => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  const response = await fetch(
    `/api/feedback/system/${feedbackId}/attachments/multiple`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  )

  const result = await response.json()
  return result.attachments
}
```

## 📝 Ví dụ Sử dụng

### Backend (Python)

```python
# Upload attachment
from fastapi import UploadFile, File

@router.post("/{feedback_id}/attachments")
async def upload_attachment(
    feedback_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Endpoint đã được implement trong system_feedback.py
    pass
```

### Frontend (TypeScript/React)

```typescript
// Upload single attachment
const uploadAttachment = async (feedbackId: string, file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `/api/feedback/system/${feedbackId}/attachments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  )

  return await response.json()
}

// Upload multiple attachments
const uploadMultipleAttachments = async (feedbackId: string, files: File[]) => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  const response = await fetch(
    `/api/feedback/system/${feedbackId}/attachments/multiple`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  )

  return await response.json()
}

// Delete attachment
const deleteAttachment = async (feedbackId: string, attachmentId: string) => {
  const response = await fetch(
    `/api/feedback/system/${feedbackId}/attachments/${attachmentId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )

  return await response.json()
}
```

## 🎨 UI Components

### Attachment Gallery Component

```typescript
// components/system/FeedbackAttachments.tsx
import { X, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react'

interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploaded_at: string
}

export default function FeedbackAttachments({
  attachments,
  feedbackId,
  onDelete,
  canDelete = false
}: {
  attachments: Attachment[]
  feedbackId: string
  onDelete?: (attachmentId: string) => void
  canDelete?: boolean
}) {
  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Delete this attachment?')) return

    try {
      await fetch(
        `/api/feedback/system/${feedbackId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        }
      )
      onDelete?.(attachmentId)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4">
        No attachments
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="relative group">
          {attachment.type === 'image' ? (
            <img
              src={attachment.url}
              alt={attachment.name}
              className="w-full h-32 object-cover rounded border cursor-pointer"
              onClick={() => window.open(attachment.url, '_blank')}
            />
          ) : (
            <div className="w-full h-32 bg-gray-100 rounded border flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200"
              onClick={() => window.open(attachment.url, '_blank')}
            >
              <FileText className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-xs text-gray-600 text-center px-2 truncate w-full">
                {attachment.name}
              </span>
            </div>
          )}
          
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 left-2 bg-black bg-opacity-50 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          
          {canDelete && (
            <button
              onClick={() => handleDelete(attachment.id)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

## 🔧 Configuration

### File Size Limit
- Default: 10MB per file
- Configurable in `file_upload_service.py`

### Allowed File Types
- Images: JPEG, PNG, GIF, WebP, SVG
- Documents: PDF, DOC, DOCX, XLS, XLSX

## 🚨 Error Handling

- **404**: Feedback not found
- **403**: Permission denied (user trying to modify other's feedback)
- **400**: File too large or invalid file type
- **500**: Upload/delete failed

## 📈 Best Practices

1. **Upload sau khi tạo feedback**: Tạo feedback trước, sau đó upload attachments
2. **Validate file size**: Check file size trước khi upload
3. **Show progress**: Hiển thị progress bar khi upload nhiều files
4. **Error handling**: Xử lý lỗi và hiển thị thông báo cho user
5. **Cleanup**: Xóa files khi xóa feedback (có thể implement trigger)

## 🔄 Migration Notes

- Attachments cũ (nếu có) sẽ vẫn hoạt động nếu format đúng
- Có thể cần migrate attachments cũ sang format mới nếu cần
- Files được lưu trong Supabase Storage, không lưu trong database

