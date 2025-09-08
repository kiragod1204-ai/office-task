
# 💻 Frontend – ReactJS + shadcn/ui

## 📦 Công nghệ
- **ReactJS** – Giao diện người dùng
- **shadcn/ui** – Thư viện UI thành phần
- **TailwindCSS** – Tùy biến giao diện
- **React Router** – Điều hướng
- **Axios** – Gọi API

---

## 📁 Cấu trúc gợi ý
```
src/
├── components/
├── pages/
├── api/
├── context/
└── utils/
```

---

## 🎯 Tính năng chính
- Giao diện theo vai trò
- Upload file báo cáo / văn bản đến
- Quản lý công việc theo trạng thái
- Gán nhiệm vụ, phản hồi, bình luận

---

## 📋 Phân trang gợi ý
| URL             | Mô tả trang                        |
|------------------|-----------------------------------|
| `/login`         | Trang đăng nhập                   |
| `/dashboard`     | Trang tổng quan (theo vai trò)    |
| `/tasks/:id`     | Chi tiết công việc                |
| `/create-task`   | Tạo công việc (chỉ Văn thư)       |

---

## 🧩 Thành phần UI dùng từ shadcn/ui
- `Dialog`, `Select`, `Card`, `Calendar`, `Textarea`, `Tabs`, `Toast`, `Button`
- Dùng `Dialog` để hiển thị form gán nhiệm vụ

---

## 📝 Giao diện
- Toàn bộ giao diện sử dụng **Tiếng Việt**
- Giao diện linh hoạt theo trạng thái và quyền truy cập

---

## 🧪 Testing
- `Vitest`, `Jest` cho unit test
- `@testing-library/react` kiểm tra UI và accessibility
