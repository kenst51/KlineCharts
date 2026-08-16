# Tích hợp Dữ liệu Cơ bản VietCap

Bản kế hoạch này mô tả quy trình xây dựng tính năng "VietCap" trên ứng dụng `web new1` nhằm mang đến cho người dùng bộ công cụ phân tích cơ bản chuyên sâu, đồng bộ dữ liệu tài chính trực tiếp từ hệ thống `iq-insight-service`.

## 1. Mục tiêu tính năng
- Thêm nút "VietCap" vào nhóm **CƠ BẢN** trong thanh **Công cụ nâng cao**.
- Cung cấp dữ liệu Báo cáo tài chính chi tiết với khả năng chuyển đổi linh hoạt giữa **Quý (12 quý gần nhất)** và **Năm (5 năm gần nhất)**, hỗ trợ nút bấm để xem ngược về lịch sử (Back).
- Trình bày Chỉ số tài chính (Ratios) một cách trực quan, chia thành các Card nhỏ theo từng phân loại (Định giá, Sinh lời, Thanh khoản...).

## 2. Thiết kế Giao diện (Frontend)
- **`index.html`**:
  - Khởi tạo `<button id="btnVietCap">` bên dưới phần CƠ BẢN.
  - Cấu trúc Modal `#vietcapModal` bao gồm:
    - **Thanh công cụ (Toolbar):** Nút chuyển đổi (Toggle) giữa `Quý` / `Năm`. Các nút `< Back` và `Next >` để dịch chuyển thời gian (ví dụ: lùi về 12 quý trước đó).
    - **Hệ thống Tabs:**
      - **Tab 1 - Báo cáo tài chính:** Bao gồm các Sub-tabs (Cân đối kế toán, Kết quả kinh doanh, Lưu chuyển tiền tệ). Dữ liệu được render dưới dạng Tree-table có thể mở rộng (`+`/`-`).
      - **Tab 2 - Chỉ số tài chính:** Giao diện dạng CSS Grid/Flexbox, chia thành các `Cards` riêng biệt như: Định giá (Valuation), Sinh lời (Profitability), Thanh khoản (Liquidity), Hiệu quả (Efficiency).

- **`fundamental.js`**:
  - Trạng thái (State): Lưu trữ `currentMode` ('quarter' | 'year'), `currentEndYear`, `currentEndQuarter` để quản lý phân trang khi người dùng bấm nút Back.
  - Viết thuật toán **đệ quy (recursive)** để render bảng BCTC có phân cấp (cha/con) dựa trên Metadata (API số 3) và Raw Data (API số 1).
  - Viết logic ánh xạ và phân nhóm dữ liệu API số 2 thành các mảng nhỏ để render vào các Card.

## 3. Xử lý logic Backend (FastAPI - `main.py`)
> [!IMPORTANT]
> Do trình duyệt thường chặn các yêu cầu khác nguồn (CORS Policy), Backend (`main.py`) sẽ đóng vai trò Proxy để ẩn danh và lấy dữ liệu từ `iq.vietcap.com.vn`.

Thêm các endpoint mới vào `main.py` có khả năng nhận tham số phục vụ cho việc lùi kỳ báo cáo:
1. `@app.get('/api/vietcap/financial-statement')`: Nhận tham số `type` (quý/năm), `year` (năm bắt đầu/kết thúc), và chuyển tiếp tới `/v1/company/{SYM}/financial-statement` của VCI để lấy đủ 12 quý hoặc 5 năm theo yêu cầu.
2. `@app.get('/api/vietcap/statistics-financial')`: Lấy dữ liệu các tỷ số tài chính, cũng hỗ trợ tham số thời gian tương tự.
3. `@app.get('/api/vietcap/metrics')`: Trỏ tới `/v1/company/{SYM}/financial-statement/metrics` (Chỉ cần gọi 1 lần để lấy từ điển Schema).

## 4. Quy trình vận hành & Ghép nối dữ liệu
1. **Khởi tạo:** Khi mở tính năng, mặc định tải `Quý`, tính toán năm hiện tại để tải 12 quý gần nhất.
2. **Ghép nối BCTC:** Hệ thống lấy Schema từ `/metrics` làm bộ khung, sau đó lấy các con số từ `/financial-statement` đắp vào các cột (mỗi cột là 1 kỳ). 
3. **Phân trang (Pagination):** Khi người dùng nhấn `< Back`, Frontend sẽ tính toán lại `year` (lùi đi 3 năm đối với Quý, hoặc lùi đi 5 năm đối với Năm), và gọi lại API Proxy để nạp dữ liệu cũ hơn mà không làm tải lại trang.
4. **Phân rã Ratios:** Dữ liệu trả về từ `/statistics-financial` sẽ được duyệt qua, tách các keys như `pe`, `pb` vào Card "Định giá"; `roe`, `roa` vào Card "Sinh lời", v.v.

---
*(Kế hoạch đã được cập nhật toàn bộ theo yêu cầu UX của người dùng: Hỗ trợ linh hoạt Quý/Năm, tải lượng lớn dữ liệu mặc định, có chức năng back lịch sử, và chia nhỏ giao diện Ratios).*
