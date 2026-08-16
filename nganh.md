# Xây dựng Bản đồ Ngành & Thanh Tìm Kiếm Đa Năng

Kế hoạch này nhằm tận dụng tối đa dữ liệu từ hệ thống phân ngành ICB và bộ tìm kiếm của VietCap để biến tab "Ngành" thành một trung tâm phân tích vĩ mô (Screener).

## Đã Xác Nhận (Resolved)
- Đã xác nhận việc cập nhật `main.py` để bổ sung thêm các route Proxy phục vụ dữ liệu Ngành và Tìm kiếm.
- Bổ sung thêm tính năng lấy danh sách mã theo ID ngành (sẽ xây dựng một API Backend để xử lý việc lọc danh sách cổ phiếu theo `sectorId`).

## Proposed Changes

### Backend (`main.py`)
Bổ sung thêm 3 route Proxy mới để quản lý Request Headers tập trung:
- [MODIFY] [`main.py`](file:///d:/code%20antigravity/web%20new1/main.py)
  - Thêm `@app.get('/api/vietcap/sectors/icb-codes')` để lấy cây phân ngành.
  - Thêm `@app.get('/api/vietcap/company/search-bar')` để tìm kiếm bằng từ khóa.
  - Thêm API lọc theo ngành (Ví dụ: `@app.get('/api/vietcap/company/by-sector')`) xử lý tham số `sectorId=xxx` để lấy chính xác danh sách các mã cổ phiếu thuộc một ngành cụ thể.

### Frontend (`index.html` & CSS/JS)
- [MODIFY] [`index.html`](file:///d:/code%20antigravity/web%20new1/static/index.html)
  - Cấu trúc lại thẻ `<div id="appContent_nganh">` thành giao diện **2 cột (Master-Detail View)**.
  - Cột trái (Master): Sidebar hiển thị cây danh mục ICB đa cấp độ (Accordion Menu).
  - Cột phải (Detail): Chứa thanh tìm kiếm trung tâm (Omnibar) và một bảng lưới (Data Grid) lớn để hiển thị các cổ phiếu.
- [NEW] `sector_map.js` (hoặc chèn trực tiếp vào `vietcap.js`)
  - Viết logic `fetchIcbTree()` để lấy dữ liệu.
  - Viết logic `renderIcbTree(data)`: Tạo hàm đệ quy để render cấu trúc HTML lồng nhau từ dữ liệu JSON Cấp 1 -> Cấp 4.
  - Viết hàm `setupOmnibar()` để bắt sự kiện gõ phím, gọi API search, hiển thị dropdown gợi ý. Khi click vào gợi ý, tự động mở cây ICB bên trái đến đúng ngành của cổ phiếu đó.
  - **Bảng so sánh Cổ phiếu theo Ngành**: Khi click vào một nhánh Ngành, lấy danh sách mã và gọi hàng loạt API `statistics-financial` để thu thập các chỉ số cốt lõi (P/E, P/B, ROE). Render ra một Bảng So sánh (Comparison Table) đa chiều với trục dọc là Mã cổ phiếu, trục ngang là các chỉ số định giá/sinh lời. Tích hợp chức năng Sắp xếp (Sort) theo cột.

## Verification Plan

### Automated Tests
- Khởi động lại FastAPI backend và kiểm tra thủ công 2 endpoint `/api/vietcap/sectors/icb-codes` và `/api/vietcap/company/search-bar?query=FPT` xem có trả về HTTP 200 không.

### Manual Verification
1. Mở trang web, chuyển sang tab "Ngành".
2. Kiểm tra cột trái xem các thư mục ngành nghề có hiển thị theo cấu trúc cây đa cấp độ không. Thử click mở/đóng các nút.
3. Gõ ký tự "VNM" vào ô Search Omnibar, kiểm tra xem danh sách gợi ý có rớt xuống không và dữ liệu có đúng là của Vietcap không.
4. Click vào một nhánh Ngành (Ví dụ: "Ngân hàng"), kiểm tra Bảng so sánh Cổ phiếu hiện ra. Đảm bảo các chỉ số tài chính (P/E, P/B, ROE) được tính toán đúng và chức năng sắp xếp cột hoạt động hoàn hảo.
