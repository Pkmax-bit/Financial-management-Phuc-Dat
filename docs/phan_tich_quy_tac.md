# Phân tích quy tắc: Kính 8 ly giảm 2% khi diện tích tăng 5%, tối đa giảm 20%

## Quy tắc
- **Vật tư**: Kính 8 ly
- **Điều kiện**: Diện tích tăng ≥ 5%
- **Điều chỉnh**: Giảm 2%
- **Giới hạn**: Tối đa giảm 20%

## Tình huống: Diện tích tăng 50%

### Cách 1: Logic hiện tại (Áp dụng 1 lần)

**Cách hoạt động:**
- Quy tắc chỉ kiểm tra: Diện tích tăng 50% ≥ ngưỡng 5%? → **CÓ**
- Áp dụng quy tắc **MỘT LẦN**: Giảm 2%
- Giới hạn tối đa: -2% < -20% (không vượt) → Không áp dụng giới hạn

**Kết quả:**
- Số lượng kính ban đầu: 1.00
- Sau điều chỉnh: 1.00 × (1 - 2/100) = 1.00 × 0.98 = **0.98**
- Tổng giảm: **2%**

---

### Cách 2: Logic theo chu kỳ (Mỗi 5% tăng → giảm 2%)

**Cách hoạt động:**
- Diện tích tăng 50% = 50/5 = **10 lần** vượt ngưỡng 5%
- Mỗi lần vượt ngưỡng → giảm 2%
- Tổng giảm nếu không có giới hạn: 10 × 2% = **20%**
- Áp dụng giới hạn: 20% = 20% (đúng giới hạn) → **Giảm 20%**

**Kết quả:**
- Số lượng kính ban đầu: 1.00
- Sau điều chỉnh: 1.00 × (1 - 20/100) = 1.00 × 0.80 = **0.80**
- Tổng giảm: **20%** (đạt giới hạn tối đa)

---

## So sánh

| Cách | Diện tích tăng | Áp dụng quy tắc | Tổng giảm | Kết quả |
|------|----------------|-----------------|-----------|---------|
| **Cách 1** (hiện tại) | 50% | 1 lần | 2% | 0.98 |
| **Cách 2** (chu kỳ) | 50% | 10 lần | 20% | 0.80 |

---

## Ví dụ chi tiết với các mức tăng khác nhau

### Với Logic Chu kỳ (Cách 2):

| Diện tích tăng | Số lần vượt ngưỡng | Tổng giảm | Kết quả | Ghi chú |
|----------------|---------------------|-----------|---------|---------|
| 5% | 1 lần | 2% | 0.98 | Chưa đạt giới hạn |
| 10% | 2 lần | 4% | 0.96 | Chưa đạt giới hạn |
| 15% | 3 lần | 6% | 0.94 | Chưa đạt giới hạn |
| 25% | 5 lần | 10% | 0.90 | Chưa đạt giới hạn |
| 50% | 10 lần | 20% | 0.80 | **Đạt giới hạn** |
| 60% | 12 lần | 24% → 20% | 0.80 | **Giới hạn áp dụng** |
| 100% | 20 lần | 40% → 20% | 0.80 | **Giới hạn áp dụng** |

---

## Kết luận

**Logic hiện tại (Cách 1):**
- Áp dụng quy tắc chỉ 1 lần khi đạt ngưỡng
- Không tính theo số lần vượt ngưỡng
- Phù hợp cho: "Khi diện tích tăng ≥ 5%, giảm một lần 2%"

**Logic chu kỳ (Cách 2):**
- Áp dụng quy tắc theo số lần vượt ngưỡng
- Tính theo: (Diện tích tăng / Ngưỡng) × Giá trị điều chỉnh
- Phù hợp cho: "Mỗi 5% tăng → giảm 2%"

**Đề xuất:**
- Nếu mô tả là "giảm 2% **khi** diện tích tăng 5%" → Dùng **Cách 1**
- Nếu mô tả là "giảm 2% **cho mỗi** 5% tăng" → Dùng **Cách 2**

**Hiện tại code đang dùng Cách 1.**

