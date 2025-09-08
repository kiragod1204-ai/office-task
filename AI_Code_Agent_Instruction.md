
# 📘 AI Code Agent Project – System Instruction

## 🗂️ Mục tiêu hệ thống
Hệ thống quản lý công việc liên quan đến **văn bản đến** và **văn bản đi** theo quy trình phân công – thực hiện – đánh giá.

---

## 👥 Vai trò người dùng
- **Quản trị viên**
- **Trưởng Công An Xã**
- **Phó Công An Xã**
- **Văn thư**
- **Cán bộ**

---

## 📄 Thành phần công việc
- Văn bản đến (do Văn thư upload – chỉ xem)
- File báo cáo (nộp bởi người thực hiện, có thể thay thế)
- Mô tả
- Thời hạn
- Bình luận trao đổi

---

## 🔁 Quy trình xử lý công việc

1. **Tạo & Gán công việc**
   - Chỉ **Văn thư** có quyền tạo công việc & upload văn bản đến.
   - Sau khi tạo công việc, hệ thống sẽ tự sinh **số thứ tự tăng dần** cho văn bản đến.
   - Văn thư gán cho **Trưởng Công An Xã** hoặc **Phó Công An Xã** ⇒ trạng thái: `Tiếp nhận văn bản`.

2. **Tiếp nhận**
   - Trưởng Công An Xã/Phó Công An Xã có 3 lựa chọn:
     - **Tiếp nhận** ⇒ Trạng thái: `Đang xử lí`
     - **Chuyển tiếp** ⇒ Gán lại cho Trưởng Công An Xã/Phó Công An Xã khác
     - **Phân công** ⇒ Gán cho **Cán bộ** ⇒ Trạng thái: `Đang xử lí`

3. **Thực hiện & Báo cáo**
   - Cán bộ hoặc người nhận nhiệm vụ thực hiện công việc.
   - Upload **file báo cáo** (ghi đè nếu đã có).
   - Gửi công việc đến trạng thái `Xem xét` (gán lại cho Trưởng Công An Xã hoặc Phó Công An Xã).

4. **Đánh giá & Hoàn tất**
   - Trưởng Công An Xã/Phó Công An Xã xem xét:
     - Nếu đạt yêu cầu ⇒ Trạng thái: `Hoàn thành`
     - Nếu chưa đạt:
       - Trả lại người thực hiện kèm bình luận
       - Hoặc gán lại cho **Cán bộ khác**

---

## 🛠️ Công nghệ sử dụng
- **Backend**: Golang, Gin, SQLite
- **Frontend**: ReactJS, TailwindCSS, shadcn/ui
- **Ngôn ngữ hiển thị**: **Tiếng Việt 100%**

---
