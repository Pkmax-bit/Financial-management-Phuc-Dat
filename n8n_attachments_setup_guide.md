# Hướng dẫn cấu hình Attachments trong n8n Email Send Node

## Vấn đề
Trong n8n Email Send node, field "Attachments" trong Options có thể không nhận trực tiếp `{{ $json.processedAttachments }}`.

## Giải pháp

### Cách 1: Sử dụng trực tiếp (Thử trước)
Trong Email Send node → **Options** → **Attachments**, nhập:
```
{{ $json.processedAttachments }}
```

### Cách 2: Sử dụng Set node (Nếu cách 1 không hoạt động)

1. **Thêm Set node** giữa Function node và Email Send node
2. **Cấu hình Set node:**
   - Add field: `attachments`
   - Value: `={{ $json.processedAttachments }}`
   - Type: `Array`

3. **Trong Email Send node:**
   - Options → Attachments: `{{ $json.attachments }}`

### Cách 3: Sử dụng Code node để format lại (Khuyến nghị)

Thêm Code node trước Email Send node với code sau:

```javascript
// Format attachments cho n8n Email Send node
const processedAttachments = $input.item.json.processedAttachments || [];

// n8n Email Send node yêu cầu format đặc biệt
const formattedAttachments = processedAttachments.map(att => {
  const attachment = {
    filename: att.filename || att.name,
    content: att.content, // Buffer đã được decode
    contentType: att.contentType || att.mimeType || 'application/octet-stream'
  };
  
  // Thêm CID cho inline attachments
  if (att.cid) {
    attachment.cid = att.cid;
  }
  
  // Thêm contentDisposition cho inline
  if (att.contentDisposition) {
    attachment.contentDisposition = att.contentDisposition;
  }
  
  return attachment;
});

return {
  ...$input.item.json,
  formattedAttachments: formattedAttachments
};
```

Sau đó trong Email Send node:
- Options → Attachments: `{{ $json.formattedAttachments }}`

## Kiểm tra

1. **Test workflow** với dữ liệu mẫu
2. **Kiểm tra execution log** để xem attachments có được xử lý đúng không
3. **Gửi test email** và kiểm tra logo có hiển thị không

## Lưu ý

- Logo phải có trong HTML với `src="cid:company_logo"`
- Attachments phải có `cid: "company_logo"` để match với HTML
- Nếu logo không hiển thị, kiểm tra:
  - Function node có decode base64 đúng không
  - CID trong attachment có match với HTML không
  - Email client có hỗ trợ inline attachments không

