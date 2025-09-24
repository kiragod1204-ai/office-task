# WEBAPP QUẢN LÝ VĂN BẢN VÀ ĐIỀU HÀNH CÔNG VIỆC

## 1. Chức năng đăng nhập
Người dùng nhập tên đăng nhập và mật khẩu do Quản trị cung cấp.  
Mật khẩu được ẩn đi và có thể chủ động bấm để hiển thị.

## 2. Chức năng Quản trị trang web (Admin)
**Chức năng đầy đủ của Quản trị viên (Admin)**

### 2.1. Quản lý tài khoản người dùng
- Tạo mới tài khoản với tên đăng nhập, mật khẩu và vai trò (*vanthu, truong, pho, canbo*).
- Cập nhật thông tin người dùng: đổi mật khẩu, đổi vai trò, kích hoạt hoặc vô hiệu hóa tài khoản.
- Xóa tài khoản không còn sử dụng.
- Hiển thị danh sách người dùng hiện có.
- Phân quyền truy cập theo vai trò.

### 2.2. Cấu hình danh mục hệ thống
- **Loại văn bản**: thêm, sửa, xóa các loại như Thông báo, Công văn, Quyết định…
- **Đơn vị phát hành**: thêm các cơ quan, tổ chức gửi văn bản đến.  
  **Đơn vị nhận**: cấu hình các đơn vị nhận văn bản đi.
- **Vai trò người dùng**: tùy chỉnh tên hiển thị hoặc quyền hạn nếu cần.

### 2.3. Gửi thông báo hệ thống
- Gửi thông báo đến toàn bộ người dùng trong hệ thống.
- Phân loại thông báo:
  - Bảo trì hệ thống
  - Nâng cấp phần mềm
  - Yêu cầu người dùng thực hiện thao tác (ví dụ: xử lý văn bản, cập nhật hồ sơ)
- Hiển thị thông báo nổi bật trên giao diện người dùng.

### 2.4. Theo dõi hoạt động hệ thống
- Xem tổng số văn bản đến, văn bản đi, nhiệm vụ đã phân công.
- Thống kê theo tháng, quý, năm.
- Lọc theo người dùng, loại văn bản, trạng thái xử lý.
- Kiểm tra tiến độ xử lý của Trưởng, Phó, Cán bộ.
- Phân tích văn bản chậm xử lý hoặc quá hạn.

### 2.5. Kiểm tra nhật ký xử lý văn bản
- Xem lịch sử xử lý từng văn bản: ai đã nhận, ai đã phân công, trạng thái hiện tại.
- Tra cứu theo số văn bản, ngày đến, đơn vị phát hành, trích yếu.
- Theo dõi các thay đổi trạng thái và người xử lý qua từng bước.

### 2.6. In và xuất báo cáo
- In danh sách văn bản đến, văn bản đi, nhiệm vụ đã giao.
- Lọc theo khoảng thời gian, người xử lý, trạng thái.
- *(Nâng cấp)* Xuất ra PDF hoặc Excel để lưu trữ hoặc gửi cấp trên.

### 2.7. Bảo trì và cấu hình hệ thống
- Đặt mật khẩu mặc định cho tài khoản mới.
- Đặt giới hạn thời gian xử lý văn bản theo loại.
- Xóa toàn bộ dữ liệu (reset hệ thống).
- Sao lưu và phục hồi dữ liệu hệ thống.

## 3. Chức năng Văn thư
**Chi tiết chức năng Văn thư**

### 3.1. Nhập văn bản đến
- Nhập thông tin chi tiết:
  - Ngày đến
  - Số đến (tự động tăng)
  - Số văn bản gốc
  - Ngày văn bản
  - Loại văn bản (chọn từ list cho Admin tạo)
  - Đơn vị phát hành (chọn từ list cho Admin tạo)
  - Trích yếu nội dung
  - Ghi chú nội bộ
- Chọn người xử lý từ danh sách tài khoản có vai trò Trưởng, Phó.
- Tải file văn bản vào hệ thống và chuyển xử lý.

### 3.2. Tạo văn bản đi
- Nhập thông tin:
  - Số văn bản
  - Ngày ban hành
  - Loại văn bản (chọn từ list cho Admin tạo)
  - Đơn vị phát hành (chọn từ list cho Admin tạo)
  - Trích yếu văn bản
  - Chọn người soạn thảo từ danh sách tài khoản có vai trò Trưởng, Phó, Cán bộ
  - Chọn người ký duyệt từ danh sách tài khoản có vai trò Trưởng, Phó
  - Ghi chú nội bộ
- Tải file văn bản đi vào hệ thống (file PDF có dấu đỏ, ký số sao y).

### 3.3. Danh sách văn bản
- Hiển thị danh sách văn bản đến và văn bản đi.
- Xem đầy đủ thông tin từng văn bản.
- Trạng thái xử lý: chưa xử lý, đã chuyển, đã phân công.
- Có thể cập nhật hoặc tra cứu lại.

### 3.4. Lọc văn bản theo khoảng thời gian
- Chọn *từ ngày* → *đến ngày*.
- Lọc văn bản đến hoặc văn bản đi theo thời gian.
- Hiển thị danh sách phù hợp để kiểm tra, đối chiếu.

### 3.5. In danh sách văn bản
- Sau khi lọc, có thể in danh sách văn bản đến hoặc đi.
- Nội dung in bao gồm: số, ngày, đơn vị, trích yếu, người xử lý/ký duyệt.
- In trực tiếp từ trình duyệt hoặc lưu thành PDF.

## 4. Chức năng Trưởng Công an xã
**Chi tiết chức năng của Trưởng Công an xã**

### 4.1. Tiếp nhận và xử lý văn bản đến từ Văn thư
- Hiển thị danh sách văn bản đã được Văn thư chuyển xử lý cho Trưởng.
- Xem thông tin chi tiết: số đến, ngày đến, đơn vị phát hành, trích yếu, ghi chú.
- Phân công xử lý trực tiếp từ danh sách văn bản.

### 4.2. Phân công nhiệm vụ (gắn với văn bản hoặc độc lập)
- Chọn người nhận nhiệm vụ từ danh sách tài khoản có vai trò Trưởng, Phó, hoặc Cán bộ.
- Giao nhiệm vụ gắn với văn bản đến hoặc tạo nhiệm vụ riêng không liên quan đến văn bản.
- Nhập ghi chú nội dung phân công.

### 4.3. Đặt thời hạn và nhắc hẹn
- Chọn ngày hoàn thành cụ thể cho từng nhiệm vụ.
- Chọn mốc thời gian nhắc hẹn: theo tháng, quý, hoặc năm.
- Lưu thông tin để theo dõi tiến độ xử lý.

### 4.4. Theo dõi trạng thái xử lý nhiệm vụ
- Hiển thị danh sách nhiệm vụ đã phân công (gắn với văn bản hoặc riêng).
- Sắp xếp nhiệm vụ theo ngày hoàn thành tăng dần (ưu tiên gần đến hạn).
- Xem thông tin người xử lý, ghi chú, trạng thái.

### 4.5. In danh sách nhiệm vụ
- Lọc nhiệm vụ theo khoảng thời gian (*từ ngày* → *đến ngày*).
- In danh sách nhiệm vụ đã phân công trực tiếp từ trình duyệt.
- Nội dung in bao gồm: tên nhiệm vụ, người nhận, ngày hoàn thành, ghi chú, loại nhiệm vụ.

## 5. Chức năng Phó Trưởng Công an xã
**Chức năng đầy đủ của Phó Trưởng Công an xã**

### 5.1. Tiếp nhận văn bản được phân công xử lý
- Xem danh sách văn bản đến đã được Trưởng hoặc Văn thư chuyển xử lý cho Phó.
- Hiển thị thông tin chi tiết: số đến, ngày đến, đơn vị phát hành, trích yếu, ghi chú.
- Trạng thái ban đầu: “Đã phân công”.

### 5.2. Xử lý văn bản được giao
- Nhận nhiệm vụ xử lý văn bản đến.
- Nhập nội dung xử lý, ghi chú, biện pháp thực hiện.
- Cập nhật trạng thái: “Đang xử lý” → “Đã xử lý”.
- Lưu kết quả xử lý để Trưởng theo dõi.

### 5.3. Giao nhiệm vụ xử lý văn bản
- Có thể tự nhận nhiệm vụ (giao cho chính mình).
- Có thể giao nhiệm vụ cho Cán bộ từ danh sách tài khoản có vai trò *canbo*.
- Nhập ghi chú phân công, thời hạn hoàn thành.

### 5.4. Đặt thời hạn hoàn thành linh hoạt
- Chọn ngày cụ thể để hoàn thành nhiệm vụ.
- Hoặc chọn mốc thời gian:
  - Trong tháng này
  - Trong quý này
  - Trong năm nay
- Dữ liệu thời hạn được lưu để theo dõi tiến độ.

### 5.5. Theo dõi nhiệm vụ đã giao hoặc tự xử lý
- Xem danh sách nhiệm vụ đã giao cho Cán bộ hoặc tự xử lý.
- Sắp xếp nhiệm vụ theo thời hạn gần nhất.
- Hiển thị trạng thái, người nhận, ghi chú, kết quả xử lý.

### 5.6. In danh sách nhiệm vụ
- Lọc nhiệm vụ theo khoảng thời gian (*từ ngày* → *đến ngày*).
- In danh sách nhiệm vụ đã xử lý hoặc đang xử lý.
- Nội dung in gồm: tên nhiệm vụ, người nhận, thời hạn, trạng thái.

## 6. Chức năng Cán bộ
**Chức năng đầy đủ của Cán bộ Công an xã**

### 6.1. Tiếp nhận nhiệm vụ được phân công
- Xem danh sách văn bản hoặc nhiệm vụ được giao từ Trưởng hoặc Phó.
- Hiển thị thông tin chi tiết: số văn bản, trích yếu, người giao nhiệm vụ, thời hạn.
- Trạng thái ban đầu: “Chưa xử lý”.

### 6.2. Thực hiện xử lý nhiệm vụ
- Nhập kết quả xử lý: nội dung thực hiện, biện pháp, ghi chú.
- Cập nhật trạng thái: “Đang xử lý” → “Đã xử lý”.
- Có thể lưu tiến độ từng bước nếu nhiệm vụ kéo dài.

### 6.3. Quản lý thời hạn hoàn thành
- Xem thời hạn xử lý theo:
  - Ngày cụ thể
  - Mốc thời gian: trong tháng, quý, hoặc năm
- Nhận cảnh báo nếu nhiệm vụ gần đến hạn hoặc quá hạn.

### 6.4. Theo dõi nhiệm vụ đã nhận
- Hiển thị danh sách nhiệm vụ đang xử lý và đã hoàn thành.
- Sắp xếp theo thời hạn gần nhất để ưu tiên.
- Lọc theo trạng thái: chưa xử lý, đang xử lý, đã xử lý.

### 6.5. In danh sách nhiệm vụ đã xử lý
- Lọc nhiệm vụ theo khoảng thời gian (*từ ngày* → *đến ngày*).
- In danh sách nhiệm vụ đã hoàn thành hoặc đang xử lý.
- Nội dung in gồm: tên nhiệm vụ, người giao, thời hạn, kết quả.
