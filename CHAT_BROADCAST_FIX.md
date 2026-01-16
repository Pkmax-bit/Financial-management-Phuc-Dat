# 🔧 Sửa Lỗi Broadcast Payload Structure

## ❌ Vấn Đề

Code hiện tại đang expect `payload.payload` trực tiếp, nhưng `realtime.broadcast_changes()` trả về structure khác:

```json
{
  "payload": {
    "record": { ... },      // NEW record
    "old_record": { ... },  // OLD record (cho UPDATE/DELETE)
    "operation": "INSERT",  // INSERT, UPDATE, DELETE
    "table": "internal_messages",
    "schema": "public"
  }
}
```

## ✅ Giải Pháp

Cần sửa code để access `payload.payload.record` thay vì `payload.payload` trực tiếp.

## 📝 Code Cần Sửa

### File: `InternalChat.tsx` và `ChatWidget.tsx`

**Trước (SAI):**
```typescript
.on('broadcast', { event: 'INSERT' }, async (payload) => {
  const newMessage = payload.payload as any  // ❌ SAI
  // ...
})
```

**Sau (ĐÚNG):**
```typescript
.on('broadcast', { event: 'INSERT' }, async (payload) => {
  const newMessage = payload.payload.record as any  // ✅ ĐÚNG
  // ...
})
```

Tương tự cho UPDATE và DELETE:
- UPDATE: `payload.payload.record` (new record)
- DELETE: `payload.payload.old_record` (deleted record)

