# Kế Hoạch: Tính Năng "Đo Lường Sức Mạnh Thị Trường"

## Tổng Quan & Mục Đích

> [!IMPORTANT]
> **Mục đích duy nhất:** Hiển thị **trạng thái thị trường hiện tại** đang đặt cược theo hướng nào với một cổ phiếu.
> **KHÔNG PHẢI** khuyến nghị mua/bán. Người dùng tự quyết định dựa vào thông tin này.

Giao diện gồm **3 đồng hồ gauge** (Dao động, Tổng hợp, TB động) + **bảng chi tiết** từng chỉ báo. Mỗi chỉ báo cho biết thị trường đang hành xử theo hướng nào, không đưa ra lời khuyên đầu tư.

---

## 🏛️ Quyết Định Thiết Kế Giao Diện

Dựa trên yêu cầu của người dùng, kiến trúc giao diện cho tính năng này như sau:

1.  **Vị trí hiển thị:** Thêm một nút chức năng (ví dụ: "Tín hiệu KT") vào **sidebar menu bên trái**. Cụ thể là nằm dưới phần **KỸ THUẬT** của nhóm **CÔNG CỤ NÂNG CAO** (cùng vị trí với các nút *Xu hướng, Key Level, Mô hình nến, Biểu đồ RRG...*). Khi người dùng click vào nút này, một panel hoặc modal chứa 3 đồng hồ và bảng chi tiết sẽ hiện ra.
2.  **Timeframe mặc định:** **1 ngày (1D)**. Dữ liệu sẽ được tính toán dựa trên nến ngày (Daily).
3.  **Cơ chế làm mới (Refresh):** **Không** tự động làm mới (Auto-refresh) vì tính chất timeframe 1D chỉ thay đổi ý nghĩa vào cuối ngày giao dịch. Thay vào đó, cung cấp một nút **"🔄 Làm mới"** thủ công cho người dùng.

---

## Cách Tiếp Cận: Tính Toán Server-Side

1. **Lấy dữ liệu giá OHLCV** từ API VNDirect (đã có sẵn trong `main.py`)
2. **Tính toán các chỉ báo** bằng thư viện Python `pandas-ta`
3. **Phân loại tín hiệu** theo logic chuẩn → trả JSON về frontend

---

## Định Nghĩa 3 Nhóm & Tooltip (Cập nhật từ ảnh)

### 🔵 Tín hiệu KT (Oscillators)
> *Tổng hợp các chỉ báo biến động như RSI, MACD, Bollinger Bands Width... giúp xác định trạng thái giao dịch. 1P (1 phút) sử dụng điểm giá realtime tại các phút gần nhất. 1D (1 day) là tổng hợp của giá hiện tại cho giá của hôm nay và các điểm giá đóng cửa của các ngày trước.*

**Chỉ báo:** RSI, Stoch K, StochRSI, MACD, MACD Histogram, ADX, Williams %R, CCI, ROC, Parabolic SAR, Ultimate Oscillator, Bollinger Band Width

### 🟢 Tổng hợp (Overall)
> *Tổng hợp các chỉ báo Biến động và các chỉ báo Trung bình để đưa ra kết luận cuối cùng về trạng thái giao dịch. Ví dụ: RSI(14) cho 1P là 14 điểm giá của 14 phút gần nhất; cho 1D là thị giá realtime hiện tại + giá đóng cửa của 13 ngày trước đó.*

**Tính toán:** Gộp toàn bộ kết quả Oscillators + Moving Averages

### 🟡 TB động (Moving Averages)
> *So sánh giá hiện tại của cổ phiếu với các giá trị trung bình hàm đơn (SMA) và hàm mũ (EMA) nhằm xác định trạng thái giao dịch.*

**Chỉ báo:** SMA + EMA cho khung 5, 10, 20, 50, 100, 200

---

## 5 Trạng Thái Sức Mạnh Thị Trường

Các trạng thái mô tả hành vi hiện tại của thị trường, **không phải lời khuyến nghị**:

| Trạng thái | Màu sắc | Ý nghĩa |
|-----------|---------|--------|
| **MUA MẠNH** | 🟢 Xanh đậm | Thị trường đang mua rất mạnh cổ phiếu này |
| **MUA** | 🟢 Xanh lá | Thị trường đang mua mạnh cổ phiếu này |
| **TR.TÍNH** | 🟡 Vàng | Thị trường đang trung lập với cổ phiếu này |
| **BÁN** | 🔴 Đỏ | Thị trường đang bán mạnh cổ phiếu này |
| **BÁN MẠNH** | 🔴 Đỏ đậm | Thị trường đang bán rất mạnh cổ phiếu này |

---

## ⚙️ Logic Tính Toán Đồng Hồ Gauge

### Bước 1 — Đếm tín hiệu trong từng nhóm

Sau khi phân loại từng chỉ báo → đếm 3 loại:

```
sell_count   = số chỉ báo cho tín hiệu BÁN
neutral_count = số chỉ báo cho tín hiệu TRUNG TÍNH
buy_count    = số chỉ báo cho tín hiệu MUA
total        = sell_count + neutral_count + buy_count
```

### Bước 2 — Tính Gauge Score

```python
gauge_score = (buy_count - sell_count) / total
# Kết quả nằm trong khoảng: -1.0 (toàn BÁN) → 0 (trung lập) → +1.0 (toàn MUA)
```

### Bước 3 — Phân loại trạng thái (xác nhận từ dữ liệu thực tế)

```
gauge_score >= +0.6   → MUA MẠNH
gauge_score >= +0.3   → MUA
-0.3 < gauge_score < +0.3 → TRUNG TÍNH
gauge_score <= -0.3   → BÁN
gauge_score <= -0.6   → BÁN MẠNH
```

**Kiểm chứng từ ảnh thực tế:**

| Case | B | T | M | Score | Kết quả thực | Công thức cho |
|------|---|---|---|-------|--------------|----------------|
| Osc 1D | 3 | 8 | 1 | **-0.167** | TR.TÍNH ✅ | -0.3 < -0.167 < 0.3 |
| Osc 1W | 6 | 6 | 0 | **-0.500** | BÁN ✅ | -0.6 < -0.5 ≤ -0.3 |
| Osc KHX | 7 | 3 | 2 | **-0.417** | BÁN ✅ | -0.6 < -0.417 ≤ -0.3 |
| Overall 1D | 14 | 8 | 2 | **-0.500** | BÁN ✅ | -0.6 < -0.5 ≤ -0.3 |
| Overall 1W | 16 | 6 | 0 | **-0.727** | BÁN MẠNH ✅ | ≤ -0.6 |
| Overall KHX | 16 | 4 | 2 | **-0.636** | BÁN MẠNH ✅ | ≤ -0.6 |
| MA 1D | 11 | 0 | 1 | **-0.833** | BÁN MẠNH ✅ | ≤ -0.6 |
| MA 1W | 10 | 0 | 0 | **-1.000** | BÁN MẠNH ✅ | ≤ -0.6 |

> **8/8 trường hợp khớp hoàn toàn** ✅

### Bước 4 — Tính góc kim đồng hồ (SVG)

```javascript
// gauge_score: -1.0 → +1.0
// needle_angle: 0° (trái, toàn BÁN) → 180° (phải, toàn MUA)

needle_angle = (gauge_score + 1) / 2 * 180;

// Ví dụ:
// gauge_score = -1.0 → 0°   (kim chỉ cực trái)
// gauge_score =  0.0 → 90°  (kim thẳng đứng, TRUNG TÍNH)
// gauge_score = +1.0 → 180° (kim chỉ cực phải)
// gauge_score = -0.636 → ((-0.636+1)/2)*180 = 32.7° (BÁN MẠNH, nghiêng nhiều về trái)
```

### Tóm Tắt Công Thức Trong Code

```python
def calculate_gauge(indicators: list) -> dict:
    sell = sum(1 for s in indicators if s == 'BAN')
    neutral = sum(1 for s in indicators if s == 'TRUNG_TINH')
    buy = sum(1 for s in indicators if s == 'MUA')
    total = sell + neutral + buy

    if total == 0:
        return {'state': 'TRUNG_TINH', 'score': 0, 'sell': 0, 'neutral': 0, 'buy': 0}

    score = (buy - sell) / total

    if score >= 0.6:   state = 'MUA_MANH'
    elif score >= 0.3: state = 'MUA'
    elif score > -0.3: state = 'TRUNG_TINH'
    elif score > -0.6: state = 'BAN'
    else:              state = 'BAN_MANH'

    needle_angle = (score + 1) / 2 * 180  # degrees for SVG

    return {'state': state, 'score': round(score, 3),
            'needle_angle': round(needle_angle, 1),
            'sell': sell, 'neutral': neutral, 'buy': buy}
```



---

## Thiết Kế Đồng Hồ Gauge (SVG)

### Cấu trúc hình học:
```
        Kim chỉ
          |
   [========●========]   ← Cung bán nguyệt
  Lực bán    Trung tính    Lực mua
  (trái)                  (phải)

  Gradient: đỏ → cam → vàng → xanh nhạt → xanh đậm
```

### Chi tiết kỹ thuật (SVG):
- **Cung nền:** `<path>` hình bán nguyệt (`strokeLinecap="round"`) dùng CSS conic-gradient
- **Gradient 5 vùng:**
  - 0°–36°: `#f44336` (BÁN MẠNH)
  - 36°–72°: `#ff7043` (BÁN)
  - 72°–108°: `#ffd600` (TRUNG TÍNH — giữa)
  - 108°–144°: `#66bb6a` (MUA)
  - 144°–180°: `#26a69a` (MUA MẠNH)
- **Kim đồng hồ:** `<line>` xoay từ tâm bán nguyệt, góc = `(sell_ratio * 180)°` từ trái
- **Nhãn kim chỉ:** Tên trạng thái (BÁN/MUA...) đổi màu theo trạng thái
- **Bộ đếm bên dưới:** 3 số Bán | Tr.Tính | Mua
- **Tooltip ℹ️:** Icon nhỏ, hover sẽ hiện popup giải thích (như ảnh mẫu)
- **Animation:** Kim đồng hồ quay mượt mà với `transition: transform 0.8s ease`

### Kích thước:
- Mỗi gauge chiếm ~1/3 chiều rộng panel
- 3 gauge xếp ngang, responsive trên mobile → xếp dọc

---

## Bộ Chọn Timeframe

Thanh nút bên phải trên cùng:

| Nhãn | Resolution gửi lên API |
|------|------------------------|
| 1p | `1` |
| 5p | `5` |
| 15p | `15` |
| 30p | `30` |
| 1 giờ | `60` |
| **1 ngày ✦ (mặc định)** | `D` |
| 1 tuần | `W` |

---

## Logic Phân Loại Tín Hiệu Từng Chỉ Báo

### Oscillators (Tên hiển thị chính xác theo ảnh mẫu):
| Tên hiển thị | Chỉ số tính toán | Điều kiện MUA | Điều kiện BÁN | Ghi chú |
|---|---|---|---|---|
| RSI | RSI(14) | > 70 | < 30 | Còn lại → Trung Tính |
| STOCHK | Stochastic K(14) | **> 80** | **< 20** | ⚠️ Logic ban đầu bị đảo ngược - đã sửa |
| STOCHRSI_FASTK | StochRSI Fast K(14) | > 80 | < 20 | Tương tự STOCHK |
| MACD | MACD(12,26,9) | MACD **>** Signal | MACD **<** Signal | MACD **=** Signal (hiệu số = 0) → Trung Tính |
| MACD HISTOGRAM | MACD Histogram | > 0 **VÀ** đang tăng dần | < 0 **VÀ** đang giảm dần | Giá trị = 0 hoặc không rõ chiều → Trung Tính |
| ADX | ADX(14) | ADX > 25 **VÀ** giá đang tăng | ADX > 25 **VÀ** giá đang giảm | ADX < 25 → Trung Tính |
| WPR | Williams %R(14) | **> -20** | **< -80** | ⚠️ Logic bị đảo ngược - đã sửa (giá gần đỉnh = MUA, gần đáy = BÁN) |
| CCI | CCI(**14**) | **> 100** | **< -100** | ⚠️ Logic bị đảo ngược và chu kỳ sai (20→14) - đã sửa |
| ROC | ROC(14) | > 0 **VÀ** đang tăng dần | < 0 **VÀ** đang giảm dần | Chỉ dựa vào dấu (+/-) không đủ |
| SAR | Parabolic SAR | Giá > SAR | Giá < SAR | Giá ≈ SAR (±0.1%) → Trung Tính |
| ULTOSC | Ultimate Oscillator(14) | **> 70** | **< 30** | ⚠️ Logic bị đảo ngược - đã sửa |
| BB WIDTH | Bollinger Bands Width | BBW tăng **VÀ** giá tăng | BBW tăng **VÀ** giá giảm | BBW = 0 hoặc đứng yên/giảm → Trung Tính |

> [!CAUTION]
> **STOCHK ĐƯỢC SỬА LẠI:** Tooltip xác nhận: > 80 = **MUA**, < 20 = **BÁN** (ngược với phân tích cổ điển về RSI)

> [!CAUTION]
> **MACD HISTOGRAM ĐƯỢC SỬА LẠI:** Tooltip xác nhận:
> - Chỉ **> 0** không đủ → phải **> 0 VÀ đang tăng dần** mới = MUA
> - Chỉ **< 0** không đủ → phải **< 0 VÀ đang giảm dần** mới = BÁN
> - Trong code: `histogram[n]` vs `histogram[n-1]`

> [!CAUTION]
> **ROC ĐƯỢC SỬА LẠI (logic dước cập nhật):**
> Ảnh mẫu xác nhận: ROC = **-4.74** hiển thị **Tr.Tính** (không phải BÁN).
> Mặc dù tooltip nói *“nhỏ hơn 0... thị trường đang bán mạnh”*, thực tế app dùng logic **dựa vào chiều**:
> - ROC > 0 **VÀ** đang tăng dần → MUA | ROC < 0 **VÀ** đang giảm dần → BÁN
> - Trong code: `roc[n]` vs `roc[n-1]` để xác định chiều


> [!CAUTION]
> **WPR ĐƯỢC SỬА LẠI:** Ảnh xác nhận WPR = **-100.00 → BÁN** (không phải MUA như kế hoạch cũ).
> Logic đúng theo chủ đề “Sức mạnh thị trường”:
> - WPR **> -20** (giá gần đỉnh cao nhất) → thị trường đang đẩy giá lên → **MUA**
> - WPR **< -80** (giá gần đáy thấp nhất) → thị trường đang kéo giá xuống → **BÁN**
> - Xác nhận bổ sung: WPR = -42.37 → Tr.Tính ✅ (giữa -80 và -20)

> [!CAUTION]
> **CCI ĐƯỢC SỬА LẠI (2 lỗi):**
> 1. **Chu kỳ sai:** CCI(20) → CCI(**14**) — Tooltip xác nhận *“CCI(14) được tính cho 14 kỳ”*
> 2. **Logic bị đảo ngược:** Tooltip xác nhận:
>    - *“Giá trị tăng trên 100 → thị trường đang **mua mạnh**”* → **> 100 = MUA**
>    - *“Giá trị giảm xuống dưới -100 → thị trường đang **bán mạnh**”* → **< -100 = BÁN**
> - Xác nhận: CCI = -70.25 → Tr.Tính ✅ (nằm giữa -100 và 100)

> [!CAUTION]
> **ULTOSC ĐƯỢC SỬА LẠI:** Tooltip xác nhận:
> - *“Giá trị tăng trên 70 → thị trường đang **mua mạnh**”* → **> 70 = MUA**
> - *“Giá trị giảm xuống dưới 30 → thị trường đang **bán mạnh**”* → **< 30 = BÁN**
> - Xác nhận: ULTOSC = 0.00 → Bán ✅ (0 < 30 = BÁN)

> [!NOTE]
> **QUY LUẬT CHUNG ĐÃ PHÁT HIỆN:** Hầu hết các chỉ báo đều theo quy luật **“Giá trị cao = Thị trường mua = MUA”** (khác với phân tích quá mua/quá bán cổ điển):
> STOCHK, WPR, CCI, ULTOSC đều bị đảo ngược so với giáo trình kỹ thuật truyền thống.


> [!NOTE]
> **XÁC NHẬN TỪ ẢNH (bộ 1):** Các chỉ báo sau khớp đúng logic đã có trong kế hoạch:
> - ADX = 24.18 → **Tr.Tính** ✅ (ADX < 25)
> - WPR = -42.37 → **Tr.Tính** ✅ (nằm giữa -80 và -20)
> - CCI = 17.21 → **Tr.Tính** ✅ (nằm giữa -100 và 100)
> - ULTOSC = 34.17 → **Tr.Tính** ✅ (nằm giữa 30 và 70)
> - SAR = 67.73 → **Mua** ✅ (giá hiện tại > SAR)
> - BB WIDTH = 0.19 → **Tr.Tính** ✅ (BBW không rõ chiều tăng/giảm)

> [!NOTE]
> **XÁC NHẬN TỪ ẢNH (bộ 2):** Thêm bằng chứng xác nhận từ ảnh mới:
> - RSI ≈ 46.45 → **Tr.Tính** ✅ (nằm giữa 30 và 70)
> - STOCHK = 57.63 → **Tr.Tính** ✅ (nằm giữa 20 và 80)
> - STOCHRSI_FASTK = 0.00 → **Bán** ✅ (< 20 = BÁN — xác nhận logic đã sửa)
> - MACD = 0.25 → **Mua** ✅ (MACD > Signal Line)
> - MACD HISTOGRAM = 0.30 → **Tr.Tính** ✅ ⭐ (> 0 nhưng đang giảm dần → xác nhận direction-based)
> - ADX = 22.37 → **Tr.Tính** ✅ (ADX < 25)

> [!NOTE]
> **XÁC NHẬN TỪ ẢNH (bộ 3) — EDGE CASES khi giá trị = 0:**
> - RSI = 0.00 → **Bán** ✅ (0 < 30 = BÁN — xử lý đúng khi không đủ dữ liệu)
> - STOCHK = 0.00 → **Bán** ✅ (0 < 20 = BÁN)
> - STOCHRSI_FASTK = 0.00 → **Bán** ✅ (0 < 20 = BÁN)
> - **MACD = 0.00 → Tr.Tính** ✅ (MACD = Signal = 0, hiệu số = 0 → không MUA không BÁN)
> - **MACD HISTOGRAM = 0.00 → Tr.Tính** ✅ (= 0 → không rõ chiều → Trung Tính)
> - ADX = 0.00 → **Tr.Tính** ✅ (0 < 25 → Trung Tính)
> - **SAR = 1.30 → Tr.Tính** ✅ (giá ≈ SAR trong vùng quá độ)
> - **ULTOSC = 0.00 → Bán** ✅ (0 < 30 = BÁN — xác nhận ngưỡng < 30)
> - BB WIDTH = 0.00 → **Tr.Tính** ✅ (= 0, không có biến động → Trung Tính)

> [!IMPORTANT]
> **QUY TẮC XỬ LÝ EDGE CASE CHUNG trong code:**
> - Khi giá trị chỉ báo là `NaN` hoặc `None` (không đủ dữ liệu lịch sử) → **Trung Tính**
> - Khi `MACD - Signal = 0` chính xác → **Trung Tính** (không phân loại MUA/BÁN)
> - Khi `BB WIDTH = 0` hoặc `MACD HISTOGRAM = 0` chính xác → **Trung Tính**
> - Khi `SAR ≈ Giá (±0.1%)` → **Trung Tính** (vùng đảo chiều chưa xác định)


### Moving Averages (SMA & EMA):

**Logic cơ bản:**
```
Giá hiện tại > MA → MUA  (xu hướng tăng)
Giá hiện tại < MA → BÁN  (xu hướng giảm)
Giá hiện tại ≈ MA (±0.1%) → TRUNG TÍNH
MA không tính được (chưa đủ dữ liệu) → hiển thị — (không có tín hiệu)
```

**Bảng hiển thị TB động (3 cột):**

| Khung | Hàm đơn (SMA) | Tín hiệu | Hàm mũ (EMA) | Tín hiệu |
|-------|------------|---------|------------|----------|
| MA5 | Giá trị SMA5 | MUA/BÁN/Tr.Tính | Giá trị EMA5 | MUA/BÁN/Tr.Tính |
| MA10 | SMA10 | ... | EMA10 | ... |
| MA20 | SMA20 | ... | EMA20 | ... |
| MA50 | SMA50 | ... | EMA50 | ... |
| MA100 | SMA100 | ... | EMA100 | ... |
| MA200 | SMA200 (hoặc — nếu đư᨟ng dữ liệu < 200 phiên) | ... | EMA200 | ... |

**Xác nhận từ ảnh (giá KHX = 14.20):**
| Khung | Hàm đơn | Kết quả | Hàm mũ | Kết quả | Lý do |
|-------|-----------|---------|---------|---------|-------|
| MA5 | 14.20 | **Tr.Tính** ✅ | 14.23 | **Bán** ✅ | SMA5 = giá chính xác → Tolerance |
| MA10 | 14.26 | **Bán** ✅ | 14.44 | **Bán** ✅ | Giá < MA |
| MA20 | 15.00 | **Bán** ✅ | 15.12 | **Bán** ✅ | Giá < MA |
| MA50 | 17.49 | **Bán** ✅ | 16.84 | **Bán** ✅ | Giá < MA |
| MA100 | 18.75 | **Bán** ✅ | 18.11 | **Bán** ✅ | Giá < MA |
| MA200 | — | (không hiển thị) ✅ | — | (không hiển thị) ✅ | Chưa đủ 200 phiên dữ liệu |

> [!IMPORTANT]
> **MA5 SMA = 14.20 = giá hiện tại → Tr.Tính** xác nhận logic tolerance ±0.1% trong kế hoạch.
> **MA200 = —** khi cổ phiếu chưa có 200 phiên giao dịch: **hiển thị —, không tính vào tổng đếm MUA/BÁN**.



---

## 📋 Bảng Tổng Hợp: Khi Nào Hiển Thị TRUNG TÍNH

### Oscillators

| Chỉ báo | Điều kiện TRUNG TÍNH |
|---------|----------------------|
| **RSI** | 30 ≤ RSI ≤ 70 |
| **STOCHK** | 20 ≤ STOCHK ≤ 80 |
| **STOCHRSI_FASTK** | 20 ≤ STOCHRSI_FASTK ≤ 80 |
| **MACD** | MACD = Signal (hiệu số = 0 chính xác) |
| **MACD HISTOGRAM** | Histogram = 0 chính xác — **HOẶC** — Histogram > 0 nhưng đang giảm — **HOẶC** — Histogram < 0 nhưng đang tăng |
| **ADX** | ADX < 25 (xu hướng yếu, không phân biệt được tăng/giảm) |
| **WPR** | -80 ≤ WPR ≤ -20 |
| **CCI** | -100 ≤ CCI ≤ 100 |
| **ROC** | ROC > 0 nhưng đang giảm — **HOẶC** — ROC < 0 nhưng đang tăng — **HOẶC** — ROC = 0 |
| **SAR** | Giá ≈ SAR (trong ngưỡng ±0.1%) |
| **ULTOSC** | 30 ≤ ULTOSC ≤ 70 |
| **BB WIDTH** | BBW = 0 — **HOẶC** — BBW đứng yên — **HOẶC** — BBW đang giảm |

### Moving Averages (SMA & EMA)

| Điều kiện | Kết quả |
|-----------|---------|
| Giá ≈ MA (trong ngưỡng ±0.1%) | **TRUNG TÍNH** |
| MA = `NaN` / `None` / `—` (chưa đủ dữ liệu) | **Không hiển thị** (bỏ qua, không đếm vào tổng) |

### Edge Cases Chung (Mọi chỉ báo)

| Tình huống | Kết quả |
|-----------|---------|
| Giá trị = `NaN` hoặc `None` (thiếu dữ liệu lịch sử) | **TRUNG TÍNH** |
| Chỉ báo direction-based: chiều không rõ (bằng nhau) | **TRUNG TÍNH** |
| Giá trị nằm giữa ngưỡng MUA và BÁN | **TRUNG TÍNH** |

---



## Bảng Chi Tiết Giao Diện

### Bảng Dao động / Oscillators (2 cột song song):
- Cột **"Giá trị"**: Con số tính toán thực tế
- Cột **"Lực M/B"**: Trạng thái thị trường hiện tại *(Không phải khuyến nghị)*

```
| Tên          | Giá trị | Lực M/B  |
|--------------|---------|---------|
| RSI ⓘ        | 40.82   | Tr.Tính |
| STOCHK ⓘ     | 61.90   | Tr.Tính |
| STOCHRSI_FASTK ⓘ | 0.00 | Bán  |
| MACD ⓘ       | -0.27   | Mua     |
| MACD HISTOGRAM ⓘ | 0.08 | Tr.Tính|
| ADX ⓘ        | 36.49   | Bán     |
```

> ⓘ = Icon tooltip hover giải thích ý nghĩa từng chỉ báo (không mang ý nghĩa khuyến nghị)

**Disclaimer nhỏ ở cuối panel:**
> *"Các số liệu trên phản ánh hành vi thị trường theo chỉ báo kỹ thuật, không phải khuyến nghị đầu tư."*

### Bảng TB Động (3 cột):
```
| Khung  | Hàm đơn ⓘ  |         | Hàm mũ ⓘ  |         |
|--------|------------|---------|-----------|---------|
|        | Giá trị    | Tín hiệu| Giá trị   | Tín hiệu|
| MA5    | 11.86      | Bán     | 11.81     | Bán     |
| MA10   | 11.83      | Bán     | 11.81     | Bán     |
| MA20   | 11.74      | Mua     | 11.96     | Bán     |
| MA50   | 12.79      | Bán     | 12.60     | Bán     |
| MA100  | 13.62      | Bán     | 13.40     | Bán     |
| MA200  | 14.71      | Bán     | 14.71     | Bán     |
```

---

## Thứ Tự File Cần Thay Đổi

| File | Thay Đổi |
|------|---------|
| `requirements.txt` | Thêm `pandas-ta` |
| `main.py` | Thêm endpoint `/api/technical-signals?symbol=&resolution=` |
| `static/index.html` | Thêm tab + gauge SVG + bảng Oscillators + bảng MA |

---

## Câu Hỏi Mở Cần Xác Nhận

> [!IMPORTANT]
> **Vị trí tab "Tín hiệu KT":** Đặt ở panel bên dưới biểu đồ chính, hay trong sidebar bên phải?

> [!NOTE]
> **Timeframe mặc định:** Đề xuất `1 ngày` (D) — như ảnh mẫu. Bạn có đồng ý không?

> [!NOTE]
> **Tự động làm mới:** Có cần auto-refresh tín hiệu mỗi X phút không?
