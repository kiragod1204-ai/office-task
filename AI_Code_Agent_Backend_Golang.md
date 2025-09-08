
# 🛠️ Backend – Golang (Gin) + SQLite

## 📦 Công nghệ
- **Go (Golang)** – Web framework chính
- **Gin** – Xử lý routing và HTTP server
- **SQLite** – Cơ sở dữ liệu nhẹ

---

## 📁 Cấu trúc dự án
```
backend/
├── main.go
├── router/
├── controllers/
├── models/
├── middleware/
└── database/
```

---

## 🔐 Phân quyền người dùng
- Sử dụng middleware để kiểm tra `Role` trước khi xử lý API.

---

## 📌 Các bảng chính
### User
```go
type User struct {
  ID       uint
  Name     string
  Role     string // Quản trị viên, Trưởng Công An Xã, Phó Công An Xã, Văn thư, Cán bộ
}
```

### IncomingFile
```go
type IncomingFile struct {
  ID          uint
  OrderNumber int
  FileName    string
  CreatedAt   time.Time
}
```

### Task
```go
type Task struct {
  ID             uint
  Description    string
  Deadline       time.Time
  Status         string
  AssignedTo     uint
  CreatedBy      uint
  IncomingFileID uint
  ReportFile     string
}
```

---

## 🔁 Luồng xử lý
- Văn thư tạo công việc → upload file → gán cho Trưởng Công An Xã/Phó Công An Xã → `Tiếp nhận văn bản`
- Trưởng Công An Xã/Phó Công An Xã lựa chọn hành động → gán nhiệm vụ hoặc xử lí trực tiếp
- Người làm upload file → chuyển sang `Xem xét`
- Trưởng Công An Xã/Phó Công An Xã → `Hoàn thành` hoặc phản hồi/gán lại

---

## 🔗 API gợi ý
| Method | Endpoint               | Chức năng                          |
|--------|------------------------|------------------------------------|
| POST   | /tasks                 | Tạo công việc                      |
| PUT    | /tasks/:id/assign      | Gán công việc                      |
| PUT    | /tasks/:id/status      | Cập nhật trạng thái                |
| POST   | /files/incoming        | Upload văn bản đến                 |
| POST   | /files/report          | Upload file báo cáo                |

---

## 🧪 Kiểm thử
- Dùng Postman test API
- Viết unit test với Go `testing`
