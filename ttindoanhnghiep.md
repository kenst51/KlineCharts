# Kế hoạch Tái thiết kế UI/UX: Thông tin Doanh nghiệp (Single-page)

Giao diện hiện tại đang sử dụng cấu trúc Tabs (Tổng quan, Cổ đông, Công ty liên kết, Sự kiện, Tin tức). Mặc dù gọn gàng, nhưng người dùng phải tốn nhiều thao tác click để xem toàn cảnh bức tranh của một doanh nghiệp. 

Với tư cách là một chuyên gia UI/UX, tôi đề xuất thiết kế lại trang này thành một **Bảng điều khiển duy nhất (Single-page Dashboard)**. Mọi thông tin sẽ được phân bổ trên một màn hình với bố cục Grid thông minh, giúp người xem nắm bắt 100% dữ liệu chỉ bằng thao tác cuộn chuột.

## User Review Required

> [!IMPORTANT]
> Dưới đây là phác thảo chi tiết bố cục mới. Bạn vui lòng xem qua và xác nhận (bấm Proceed) để tôi bắt đầu triển khai code nhé!

## Đề xuất Bố cục Mới (Layout Architecture)

Giao diện sẽ được chia làm 3 phần chính, tối ưu hóa không gian hiển thị trên màn hình máy tính (và tự động co lại thành 1 cột trên điện thoại).

### 1. Phần Header (Chiếm toàn chiều rộng)
- **Hồ sơ doanh nghiệp:** Tóm tắt ngắn gọn.
- **Chỉ số cơ bản (Grid):** Bố cục dạng thẻ nhỏ nằm ngang (Ngày niêm yết, Vốn hóa, KL Cổ phiếu...) giúp người dùng có cái nhìn tổng quan về quy mô ngay lập tức.

### 2. Cột Trái (Nội dung chính - Chiếm 65% chiều rộng)
Khu vực này tập trung vào cấu trúc "Lõi" của doanh nghiệp.
- **Card 1: Phân tích Cổ đông (Mới)**
  - Gộp chung biểu đồ tròn (Doughnut Chart - Cơ cấu) và Bảng danh sách Cổ đông lớn vào cùng một thẻ. 
  - Biểu đồ nằm bên trái, bảng chi tiết nằm bên phải.
- **Card 2: Hệ sinh thái (Công ty con & Liên kết)**
  - Hiển thị song song 2 bảng Công ty con và Công ty liên kết cạnh nhau để dễ dàng đối chiếu mức độ sở hữu.

### 3. Cột Phải (Sidebar Cập nhật - Chiếm 35% chiều rộng)
Khu vực này dành cho các thông tin mang tính thời sự, được thiết kế dưới dạng danh sách có thể cuộn (Scrollable) với thanh cuộn được làm mờ tinh tế.
- **Card 3: Tin tức mới nhất**
  - Giới hạn chiều cao (`max-height: 500px`), ưu tiên hiển thị hình ảnh thu nhỏ (thumbnail) và tiêu đề.
- **Card 4: Sự kiện sắp tới**
  - Dạng Timeline (Dòng thời gian) nhỏ gọn, giới hạn chiều cao.

## Proposed Changes (Chi tiết Kỹ thuật)

#### [DELETE] Gỡ bỏ logic Tabs
- Xóa bỏ thanh menu `.tabs` và các hàm `switchTab()` trong HTML/JS.

#### [MODIFY] `company.html` (CSS)
Bổ sung CSS Grid cho layout mới:
```css
.dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr; /* Tỷ lệ 65% - 35% */
    gap: 20px;
    align-items: start;
}
.scrollable-card {
    max-height: 500px;
    overflow-y: auto;
}
/* Tuỳ chỉnh thanh cuộn siêu mỏng, sang trọng */
.scrollable-card::-webkit-scrollbar { width: 4px; }
.scrollable-card::-webkit-scrollbar-thumb { background: #2a2e39; border-radius: 4px; }
```

#### [MODIFY] `company.html` (JavaScript)
Tối ưu hóa tốc độ tải trang bằng cách gọi toàn bộ 5 API (Overview, Shareholder Structure, Shareholder List, Relationships, Events, News) **song song cùng một lúc** bằng `Promise.all()` thay vì chờ người dùng click từng Tab:
```javascript
async function fetchAllData() {
    document.getElementById('loading').style.display = 'block';
    try {
        await Promise.all([
            fetchOverview(),
            fetchShareholderList(),
            fetchRelationships(),
            fetchEvents(),
            fetchNews()
        ]);
    } catch(e) {
        console.error(e);
    }
    document.getElementById('loading').style.display = 'none';
}
```

## Verification Plan
- Mở trang `company.html?symbol=FPT` hoặc `IDC`.
- Xác nhận toàn bộ thông tin (hồ sơ, biểu đồ, cổ đông, tin tức, sự kiện) hiển thị đầy đủ trên 1 trang duy nhất mà không cần bấm tab.
- Thử cuộn khung Tin tức/Sự kiện để xem tính năng Scrollable hoạt động mượt mà.
- Kiểm tra tính Responsive (co nhỏ trình duyệt xem có tự động chuyển thành 1 cột dọc hay không).
