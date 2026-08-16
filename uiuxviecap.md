# Kế hoạch Tái thiết kế UI/UX Dữ liệu VietCap

Sau khi phân tích giao diện hiện tại dưới góc nhìn của một chuyên gia UI/UX và Data Visualization, tôi nhận thấy bảng dữ liệu của chúng ta đang có rất nhiều tiềm năng để trở nên đẹp và chuyên nghiệp như các nền tảng tài chính hàng đầu thế giới (TradingView, Bloomberg Terminal, Simplize).

## Phân tích các "Điểm nghẽn" (Pain points) hiện tại
1. **Bảng dữ liệu (Grid) quá gò bó:** Việc sử dụng viền kẻ ô (viền dọc và ngang) dày đặc làm bảng trông rất nặng nề và rối mắt. Không gian trống (whitespace) chưa được tối ưu.
2. **Nút bấm lạc quẻ:** Các nút Export CSV, Excel, DTA đang dùng các khối màu đặc (Solid) Xanh, Đỏ... đặt cạnh nhau trông hơi thô và phá vỡ cấu trúc Dark Mode tổng thể.
3. **Phân cấp dữ liệu chưa đủ mạnh:** Các khoản mục Cha - Con mới chỉ được thụt lề, chưa có sự khác biệt đủ lớn về màu sắc nền, phông chữ để mắt người đọc quét (scan) nhanh.
4. **Icon cổ điển:** Sử dụng ký tự văn bản `[-]` màu tím làm nút đóng/mở nhìn khá giống các website thập niên 2000.
5. **Thiếu cảm giác tương tác:** Bảng quá dài nhưng khi di chuột không có hiệu ứng "bắt sáng" dòng (row hover), khiến người dùng rất dễ nhìn nhầm số liệu từ dòng này sang dòng kia. Số liệu âm/dương chưa có màu sắc cảnh báo.

---

## Proposed Changes (Đề xuất Giải pháp Thay đổi)

Tôi đề xuất "lột xác" phần VietCap này theo ngôn ngữ thiết kế **Modern Financial Dark Theme**:

### 1. Nâng cấp Bảng dữ liệu (Table Layout & Styling)
- **Minimal Borders (Viền tối giản):** Xóa bỏ hoàn toàn toàn bộ viền dọc (Vertical borders). Chỉ giữ lại các viền ngang rất mỏng (`border-bottom: 1px solid #2a2e39`). Cách này giúp dữ liệu dường như "nổi" lên và dễ đọc hơn gấp nhiều lần.
- **Row Hover Effect:** Bổ sung hiệu ứng đổi màu nền nhẹ (sang `#2a2e39`) khi người dùng rà chuột qua bất kỳ dòng nào.
- **Sticky Shadow:** Cột "Khoản mục" được cố định (sticky) ở bên trái sẽ được phủ thêm một lớp đổ bóng (box-shadow) mờ dọc theo viền phải, tạo cảm giác phân lớp 3D rõ ràng khi người dùng cuộn (scroll) dữ liệu ngang.

### 2. Định dạng Số liệu (Data Formatting)
- Tự động nhận diện các con số âm (Ví dụ: `-5,316.1`) và tô màu **Đỏ (Red - `#F23645`)**. Các con số bình thường giữ màu xám trắng. Tỷ lệ phần trăm dương (nếu mang ý nghĩa tích cực) có thể tô Xanh.
- Căn chỉnh lại khoảng cách (padding) của các ô số liệu để chúng thở hơn (tăng padding-right).

### 3. Hệ thống Phân cấp Typography (Hierarchy)
- **Danh mục Mẹ (Tổng tài sản, Định giá, Nguồn vốn):** Sử dụng nền tối hơn một chút (VD: `#181b24`), chữ in hoa (UPPERCASE), font đậm (Bold) và màu **Xanh dương TradingView (`#2962FF`)**.
- **Danh mục Con:** Font thường, màu xám sáng (`#d1d4dc`), thụt lề chuẩn xác.
- **Icon Đóng/Mở:** Thay thế ký tự văn bản `[-]` / `[+]` bằng Icon Mũi tên (Chevron SVG) tinh tế. Khi bấm sẽ có hoạt ảnh mũi tên xoay 90 độ mượt mà.

### 4. Thiết kế lại Hệ thống Nút bấm (Buttons)
- Chuyển các nút Export thành dạng **Outlined Buttons (Nút viền mỏng)**:
  - **Export Excel:** Nút nền trong suốt, viền xanh lá, chữ xanh lá. Khi trỏ chuột vào (hover) thì nền sáng lên màu xanh lá nhạt.
  - **Export CSV / DTA:** Tương tự, sử dụng viền xám sáng và chữ xám sáng, hover lên nền xám.
  - Cách thiết kế này vừa hiện đại, vừa hòa nhập hoàn hảo vào Dark Theme mà không bị "chói".
- Nút `< Prev`, `Next >`: Làm thanh thoát hơn, bo góc (border-radius) mềm mại và thêm hiệu ứng sáng lên khi hover.

## User Review Required

> [!NOTE]
> Theo yêu cầu của bạn, đây chỉ là **Bản Kế hoạch Đề xuất**. Bạn hãy đọc lướt qua xem các ý tưởng thiết kế (như đổi sang nút viền mỏng, bỏ viền dọc của bảng, đổi icon mũi tên, thêm màu đỏ cho số âm) đã đúng với gu thẩm mỹ mà bạn muốn hướng tới chưa?
> 
> Nếu bạn ưng ý, hãy nhấn **Proceed/Chấp nhận** hoặc bảo tôi "Bắt tay vào làm" để tôi tiến hành viết lại toàn bộ CSS và JS cho giao diện này!
