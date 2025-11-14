# Ví dụ Sử dụng File Upload System

## 📝 Ví dụ Frontend

### 1. Upload Receipt cho Expense

```typescript
// components/expenses/ExpenseForm.tsx
import { useState } from 'react'
import FileUpload from '@/components/common/FileUpload'

export default function ExpenseForm({ expenseId }: { expenseId?: string }) {
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)

  const handleReceiptUpload = (result: UploadResult) => {
    setReceiptUrl(result.url)
    // Optionally update expense immediately
    if (expenseId) {
      updateExpenseReceipt(expenseId, result.url)
    }
  }

  const handleExpenseSubmit = async (data: ExpenseData) => {
    await createExpense({
      ...data,
      receipt_url: receiptUrl
    })
  }

  return (
    <form onSubmit={handleExpenseSubmit}>
      {/* Other fields */}
      
      <FileUpload
        endpoint={`/api/uploads/expenses/${expenseId || 'new'}`}
        onSuccess={handleReceiptUpload}
        accept="image/*,application/pdf"
        label="Upload Receipt"
        currentFileUrl={receiptUrl}
        showDelete={!!expenseId}
        onDelete={() => setReceiptUrl(null)}
      />
      
      <button type="submit">Create Expense</button>
    </form>
  )
}
```

### 2. Upload Avatar cho Employee

```typescript
// components/employees/EmployeeForm.tsx
import ImageUpload from '@/components/common/ImageUpload'

export default function EmployeeForm({ employeeId }: { employeeId?: string }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url)
    if (employeeId) {
      updateEmployeeAvatar(employeeId, url)
    }
  }

  return (
    <form>
      {/* Other fields */}
      
      <ImageUpload
        endpoint={`/api/uploads/avatars/employees/${employeeId || 'new'}`}
        onSuccess={handleAvatarUpload}
        label="Employee Avatar"
        currentImageUrl={avatarUrl}
        showDelete={!!employeeId}
        onDelete={() => setAvatarUrl(null)}
        previewSize="md"
      />
    </form>
  )
}
```

### 3. Upload Multiple Attachments cho Invoice

```typescript
// components/invoices/InvoiceAttachments.tsx
import { useState } from 'react'

export default function InvoiceAttachments({ invoiceId }: { invoiceId: string }) {
  const [attachments, setAttachments] = useState<UploadResult[]>([])
  const [uploading, setUploading] = useState(false)

  const handleMultipleUpload = async (files: FileList) => {
    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/uploads/invoices/${invoiceId}/multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()
      setAttachments([...attachments, ...result.files])
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (attachmentId: string, path: string) => {
    try {
      // Delete from storage
      const token = localStorage.getItem('token')
      await fetch(`/api/uploads/invoices/${invoiceId}?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Remove from list
      setAttachments(attachments.filter(a => a.id !== attachmentId))
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Attachments
        </label>
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleMultipleUpload(e.target.files)}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Attachments List */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {attachments.map((attachment) => (
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
              </div>
            )}
            <button
              onClick={() => handleDelete(attachment.id, attachment.path)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-600 mt-1 truncate">{attachment.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 4. Upload Product Image

```typescript
// components/products/ProductForm.tsx
import ImageUpload from '@/components/common/ImageUpload'

export default function ProductForm({ productId }: { productId?: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleImageUpload = (url: string) => {
    setImageUrl(url)
    // Update product
    if (productId) {
      updateProduct(productId, { image_url: url })
    }
  }

  return (
    <form>
      <ImageUpload
        endpoint={`/api/uploads/products/${productId || 'new'}/images`}
        onSuccess={handleImageUpload}
        label="Product Image"
        currentImageUrl={imageUrl}
        previewSize="lg"
      />
    </form>
  )
}
```

### 5. Upload Project Images (Gallery)

```typescript
// components/projects/ProjectImages.tsx
import { useState } from 'react'
import ImageUpload from '@/components/common/ImageUpload'

export default function ProjectImages({ projectId }: { projectId: string }) {
  const [images, setImages] = useState<string[]>([])

  const handleImageUpload = (url: string) => {
    setImages([...images, url])
    // Save to database
    saveProjectImage(projectId, url)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Project Images</h3>
      
      {/* Upload New Image */}
      <ImageUpload
        endpoint={`/api/uploads/projects/${projectId}/images`}
        onSuccess={handleImageUpload}
        label="Add Project Image"
        previewSize="md"
      />

      {/* Images Gallery */}
      <div className="grid grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Project image ${index + 1}`}
              className="w-full h-48 object-cover rounded border"
            />
            <button
              onClick={() => {
                setImages(images.filter((_, i) => i !== index))
                deleteProjectImage(projectId, url)
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🔧 Backend Integration Examples

### 1. Update Expense với Receipt URL

```python
# backend/routers/expenses.py
from routers.file_upload import router as upload_router

@router.put("/expenses/{expense_id}")
async def update_expense(
    expense_id: str,
    expense_update: ExpenseUpdate,
    current_user: User = Depends(get_current_user)
):
    # ... existing code ...
    
    # If receipt_url is provided, it should be uploaded via file_upload endpoint first
    # Then this endpoint just updates the database
    supabase = get_supabase_client()
    result = supabase.table("expenses").update({
        **expense_update.dict(exclude_unset=True)
    }).eq("id", expense_id).execute()
    
    return result.data[0]
```

### 2. Lưu Invoice Attachments

```python
# backend/routers/invoices.py
from services.file_upload_service import get_file_upload_service

@router.post("/invoices/{invoice_id}/attachments")
async def create_invoice_attachment(
    invoice_id: str,
    attachment_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Save attachment info to database after upload"""
    supabase = get_supabase_client()
    
    result = supabase.table("invoice_attachments").insert({
        "invoice_id": invoice_id,
        "name": attachment_data["name"],
        "url": attachment_data["url"],
        "type": attachment_data["type"],
        "size": attachment_data["size"]
    }).execute()
    
    return result.data[0]
```

## 📱 Mobile/Responsive Considerations

```typescript
// Responsive image upload
<div className="w-full md:w-1/2 lg:w-1/3">
  <ImageUpload
    endpoint={endpoint}
    onSuccess={handleSuccess}
    previewSize="sm" // Use smaller preview on mobile
  />
</div>
```

## 🎨 Custom Styling

```typescript
// Custom styled upload button
<div className="custom-upload-wrapper">
  <FileUpload
    endpoint={endpoint}
    onSuccess={handleSuccess}
    label=""
  />
  <style jsx>{`
    .custom-upload-wrapper :global(.border-dashed) {
      border-color: #3b82f6;
      background: linear-gradient(to right, #eff6ff, #dbeafe);
    }
  `}</style>
</div>
```

## 🔄 Progress Tracking

```typescript
// With upload progress
const [uploadProgress, setUploadProgress] = useState(0)

const uploadWithProgress = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const xhr = new XMLHttpRequest()
  
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percentComplete = (e.loaded / e.total) * 100
      setUploadProgress(percentComplete)
    }
  })

  xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      const result = JSON.parse(xhr.responseText)
      onSuccess(result)
      setUploadProgress(0)
    }
  })

  xhr.open('POST', endpoint)
  xhr.setRequestHeader('Authorization', `Bearer ${token}`)
  xhr.send(formData)
}
```

## 🚨 Error Handling Best Practices

```typescript
const handleUpload = async (file: File) => {
  try {
    // Validate before upload
    if (file.size > maxSize) {
      throw new Error(`File too large. Max size: ${maxSize / 1024 / 1024}MB`)
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed')
    }

    // Upload
    const result = await uploadFile(file)
    onSuccess(result)
  } catch (error) {
    // Show user-friendly error
    const message = error instanceof Error ? error.message : 'Upload failed'
    toast.error(message)
    onError?.(message)
  }
}
```

