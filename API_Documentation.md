# 📚 API Documentation - AI Code Agent Backend

## 🔗 Base URL
```
http://localhost:9090/api
```

## 🔐 Authentication
Tất cả API (trừ login) yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

---

## 👤 Authentication APIs

### 1. Đăng nhập
**POST** `/auth/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Quản trị viên",
    "role": "Quản trị viên"
  }
}
```

### 2. Lấy thông tin profile
**GET** `/profile`

**Response:**
```json
{
  "id": 1,
  "name": "Quản trị viên",
  "role": "Quản trị viên"
}
```

---

## 👥 User APIs

### 1. Lấy danh sách người dùng
**GET** `/users`

**Query Parameters:**
- `role` (optional): Lọc theo vai trò

**Response:**
```json
[
  {
    "id": 1,
    "name": "Quản trị viên",
    "username": "admin",
    "role": "Quản trị viên"
  }
]
```

### 2. Lấy danh sách Trưởng Công An Xã và Phó Công An Xã
**GET** `/users/team-leaders`

**Response:**
```json
[
  {
    "id": 2,
    "name": "Trưởng Công An Xã A",
    "username": "teamleader",
    "role": "Trưởng Công An Xã"
  },
  {
    "id": 3,
    "name": "Phó Công An Xã B",
    "username": "deputy",
    "role": "Phó Công An Xã"
  }
]
```

### 3. Lấy danh sách cán bộ
**GET** `/users/officers`

**Response:**
```json
[
  {
    "id": 5,
    "name": "Cán bộ D",
    "username": "officer",
    "role": "Cán bộ"
  }
]
```

### 4. Tạo người dùng mới
**POST** `/users`
**Quyền:** Chỉ Quản trị viên

**Request Body:**
```json
{
  "name": "Nguyễn Văn A",
  "username": "nguyenvana",
  "password": "password123",
  "role": "Cán bộ"
}
```

**Response:**
```json
{
  "id": 6,
  "name": "Nguyễn Văn A",
  "username": "nguyenvana",
  "role": "Cán bộ",
  "message": "Tạo người dùng thành công"
}
```

**Các vai trò hợp lệ:**
- `Quản trị viên`
- `Trưởng Công An Xã`
- `Phó Công An Xã`
- `Văn thư`
- `Cán bộ`

---

## 📋 Task APIs

### 1. Tạo công việc mới
**POST** `/tasks`
**Quyền:** Văn thư và Trưởng Công An Xã

**Request Body:**
```json
{
  "description": "Xử lý văn bản về kế hoạch năm 2024",
  "deadline": "2024-12-31T23:59:59Z",
  "assigned_to": 2,
  "incoming_file_id": 1
}
```

**Response:**
```json
{
  "ID": 1,
  "CreatedAt": "2024-01-15T10:00:00Z",
  "UpdatedAt": "2024-01-15T10:00:00Z",
  "DeletedAt": null,
  "description": "Xử lý văn bản về kế hoạch năm 2024",
  "deadline": "2024-12-31T23:59:59Z",
  "status": "Tiếp nhận văn bản",
  "assigned_to": 2,
  "created_by": 4,
  "incoming_file_id": 1,
  "report_file": "",
  "assigned_user": {
    "ID": 2,
    "name": "Trưởng Công An Xã A",
    "role": "Trưởng Công An Xã"
  },
  "creator": {
    "ID": 4,
    "name": "Văn thư C",
    "role": "Văn thư"
  },
  "incoming_file": {
    "ID": 1,
    "order_number": 1,
    "file_name": "van_ban_den_001.pdf"
  },
  "comments": []
}
```

### 2. Lấy danh sách công việc
**GET** `/tasks`

**Response:** Mảng các task objects (như trên)

**Lọc theo vai trò:**
- **Văn thư/Quản trị viên:** Xem tất cả công việc
- **Trưởng Công An Xã/Phó Công An Xã:** Xem công việc được gán hoặc do mình tạo
- **Cán bộ:** Chỉ xem công việc được gán cho mình

### 3. Lấy chi tiết công việc
**GET** `/tasks/:id`

**Response:** Task object với đầy đủ thông tin

### 4. Gán công việc
**PUT** `/tasks/:id/assign`
**Quyền:** Chỉ Trưởng Công An Xã và Phó Công An Xã

**Request Body:**
```json
{
  "assigned_to": 5
}
```

**Response:** Task object đã được cập nhật

### 5. Cập nhật trạng thái công việc
**PUT** `/tasks/:id/status`

**Request Body:**
```json
{
  "status": "Đang xử lí"
}
```

**Các trạng thái hợp lệ:**
- `Tiếp nhận văn bản`
- `Đang xử lí`
- `Xem xét`
- `Hoàn thành`

**Response:** Task object đã được cập nhật

### 6. Cập nhật công việc
**PUT** `/tasks/:id`
**Quyền:** Văn thư và Trưởng Công An Xã (chỉ công việc do mình tạo hoặc được gán)

**Request Body:**
```json
{
  "description": "Mô tả công việc mới",
  "deadline": "2024-12-31T23:59:59Z",
  "assigned_to": 3,
  "incoming_file_id": 2
}
```

**Response:** Task object đã được cập nhật

### 7. Xóa công việc
**DELETE** `/tasks/:id`
**Quyền:** Văn thư (tất cả công việc) và Trưởng Công An Xã (chỉ công việc do mình tạo, không thể xóa công việc đã hoàn thành)

**Response:**
```json
{
  "message": "Xóa công việc thành công"
}
```

### 8. Chuyển tiếp công việc
**POST** `/tasks/:id/forward`
**Quyền:** Trưởng Công An Xã và Phó Công An Xã

**Request Body:**
```json
{
  "assigned_to": 5,
  "comment": "Ghi chú khi chuyển tiếp (tùy chọn)"
}
```

**Response:** Task object đã được cập nhật

---

## 📁 File APIs

### 1. Upload văn bản đến
**POST** `/files/incoming`
**Quyền:** Chỉ Văn thư
**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File cần upload

**Response:**
```json
{
  "ID": 1,
  "CreatedAt": "2024-01-15T10:00:00Z",
  "UpdatedAt": "2024-01-15T10:00:00Z",
  "DeletedAt": null,
  "order_number": 1,
  "file_name": "van_ban_den_001.pdf",
  "file_path": "uploads/incoming/1705320000_van_ban_den_001.pdf",
  "uploaded_by": 4,
  "user": {
    "ID": 4,
    "name": "Văn thư C",
    "role": "Văn thư"
  }
}
```

### 2. Upload file báo cáo
**POST** `/files/report/:id`
**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File báo cáo cần upload

**Response:**
```json
{
  "message": "Upload file báo cáo thành công",
  "report_file": "uploads/reports/task_1_1705320000_bao_cao.pdf"
}
```

**Lưu ý:** 
- Tự động cập nhật trạng thái task thành "Xem xét"
- File mới sẽ ghi đè file cũ nếu có

### 3. Lấy danh sách văn bản đến
**GET** `/files/incoming`

**Response:**
```json
[
  {
    "ID": 1,
    "order_number": 1,
    "file_name": "van_ban_den_001.pdf",
    "file_path": "uploads/incoming/1705320000_van_ban_den_001.pdf",
    "uploaded_by": 4,
    "user": {
      "ID": 4,
      "name": "Văn thư C",
      "role": "Văn thư"
    }
  }
]
```

### 4. Download file
**GET** `/files/download?path=uploads/incoming/1705320000_van_ban_den_001.pdf`

**Response:** File binary data

**Lưu ý:** Chỉ cho phép download file trong thư mục `uploads/`

---

## 💬 Comment APIs

### 1. Tạo bình luận
**POST** `/tasks/:id/comments`

**Request Body:**
```json
{
  "content": "Cần bổ sung thêm thông tin về ngân sách"
}
```

**Response:**
```json
{
  "ID": 1,
  "CreatedAt": "2024-01-15T10:30:00Z",
  "UpdatedAt": "2024-01-15T10:30:00Z",
  "DeletedAt": null,
  "task_id": 1,
  "user_id": 2,
  "content": "Cần bổ sung thêm thông tin về ngân sách",
  "user": {
    "ID": 2,
    "name": "Trưởng Công An Xã A",
    "role": "Trưởng Công An Xã"
  }
}
```

### 2. Lấy danh sách bình luận của task
**GET** `/tasks/:id/comments`

**Response:** Mảng các comment objects (như trên)

---

## 📊 Dashboard APIs

### 1. Lấy thống kê dashboard
**GET** `/dashboard`

**Response:**
```json
{
  "total_tasks": 25,
  "tasks_by_status": {
    "Tiếp nhận văn bản": 5,
    "Đang xử lí": 8,
    "Xem xét": 7,
    "Hoàn thành": 5
  },
  "tasks_by_user": [
    {
      "user_id": 2,
      "user_name": "Trưởng Công An Xã A",
      "role": "Trưởng Công An Xã",
      "count": 10
    }
  ],
  "recent_tasks": [
    {
      "ID": 1,
      "description": "Xử lý văn bản về kế hoạch",
      "status": "Đang xử lí",
      "assigned_user": {
        "name": "Cán bộ D"
      }
    }
  ],
  "total_users": 5,
  "users_by_role": {
    "Quản trị viên": 1,
    "Trưởng Công An Xã": 1,
    "Phó Công An Xã": 1,
    "Văn thư": 1,
    "Cán bộ": 1
  },
  "total_files": 15,
  "tasks_this_month": 12,
  "completed_tasks": 5,
  "pending_tasks": 20,
  "overdue_tasks": 3
}
```

**Lọc dữ liệu theo vai trò:**
- **Quản trị viên:** Xem tất cả thống kê
- **Văn thư:** Xem thống kê công việc và người dùng
- **Trưởng Công An Xã/Phó Công An Xã:** Xem thống kê công việc liên quan
- **Cán bộ:** Chỉ xem thống kê công việc được gán

### 2. Lấy tóm tắt công việc
**GET** `/dashboard/tasks`

**Response:**
```json
[
  {
    "id": 1,
    "description": "Xử lý văn bản về kế hoạch năm 2024",
    "status": "Đang xử lí",
    "deadline": "2024-12-31T23:59:59Z",
    "assigned_to": "Cán bộ D",
    "created_by": "Văn thư C",
    "created_at": "2024-01-15T10:00:00Z",
    "is_overdue": false
  }
]
```

---

## 🔄 Workflow Examples

### Quy trình tạo và xử lý công việc:

1. **Văn thư upload văn bản đến:**
   ```bash
   POST /files/incoming
   # Upload file PDF
   ```

2. **Văn thư hoặc Trưởng Công An Xã tạo công việc:**
   ```bash
   POST /tasks
   {
     "description": "Xử lý văn bản về kế hoạch",
     "deadline": "2024-12-31T23:59:59Z",
     "assigned_to": 2,
     "incoming_file_id": 1
   }
   ```

3. **Trưởng Công An Xã tiếp nhận và phân công:**
   ```bash
   PUT /tasks/1/assign
   {
     "assigned_to": 5
   }
   ```

4. **Cán bộ upload báo cáo:**
   ```bash
   POST /files/report/1
   # Upload file báo cáo
   ```

5. **Trưởng Công An Xã đánh giá và hoàn tất:**
   ```bash
   PUT /tasks/1/status
   {
     "status": "Hoàn thành"
   }
   ```

### Quy trình quản lý công việc nâng cao:

1. **Trưởng Công An Xã chỉnh sửa công việc:**
   ```bash
   PUT /tasks/1
   {
     "description": "Mô tả đã được cập nhật",
     "deadline": "2024-12-31T23:59:59Z"
   }
   ```

2. **Trưởng Công An Xã chuyển tiếp công việc:**
   ```bash
   POST /tasks/1/forward
   {
     "assigned_to": 3,
     "comment": "Chuyển cho Phó Công An Xã xử lý"
   }
   ```

3. **Trưởng Công An Xã xóa công việc (nếu cần):**
   ```bash
   DELETE /tasks/1
   ```

---

## 🚨 Error Responses

Tất cả lỗi trả về format:
```json
{
  "error": "Mô tả lỗi bằng tiếng Việt"
}
```

**HTTP Status Codes:**
- `400` - Bad Request (Dữ liệu không hợp lệ)
- `401` - Unauthorized (Chưa đăng nhập)
- `403` - Forbidden (Không có quyền)
- `404` - Not Found (Không tìm thấy)
- `500` - Internal Server Error (Lỗi server)

---

## 🔧 Setup & Run

1. **Cài đặt PostgreSQL:**
   ```bash
   cd backend
   # Sử dụng Docker (khuyến nghị)
   setup-db.bat  # Windows
   ./setup-db.sh # Linux/macOS
   ```

2. **Cài đặt dependencies:**
   ```bash
   go mod tidy
   ```

3. **Chạy server:**
   ```bash
   go run main.go
   ```

3. **Test API với curl:**
   ```bash
   # Login
   curl -X POST http://localhost:9090/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   
   # Get tasks
   curl -X GET http://localhost:9090/api/tasks \
     -H "Authorization: Bearer <token>"
   ```

---

## 👤 Default Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Quản trị viên |
| teamleader | team123 | Trưởng Công An Xã |
| deputy | deputy123 | Phó Công An Xã |
| secretary | secretary123 | Văn thư |
| officer | officer123 | Cán bộ |

---

## 🆕 New Features Added

### Admin User Management
- Only Admin can create new users via `POST /api/users`
- Username uniqueness validation
- Role validation with predefined roles
- Secure user creation with proper error handling

### Dashboard Analytics
- Comprehensive statistics via `GET /api/dashboard`
- Task distribution by status and users
- Recent tasks overview via `GET /api/dashboard/tasks`
- Monthly task tracking
- Overdue task monitoring
- User and file statistics (Admin only)
- Role-based data filtering

### Additional API Endpoints

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| POST | `/api/users` | Tạo người dùng mới | Admin only |
| GET | `/api/dashboard` | Lấy thống kê tổng quan | All authenticated |
| GET | `/api/dashboard/tasks` | Lấy tóm tắt công việc | All authenticated |

## 🗄️ Database Configuration

The backend now uses **PostgreSQL** instead of SQLite:
- **Connection**: `postgresql://dev_user:dev_password@localhost:5433/ai_code_agent`
- **No CGO required** - Easier deployment and cross-compilation
- **Better performance** for concurrent operations
- **Production ready** with connection pooling

### Quick Database Setup
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Or use setup scripts
setup-db.bat  # Windows
./setup-db.sh # Linux/macOS
```

The backend now includes comprehensive user management and dashboard analytics features with PostgreSQL database, making it ready for production use with the React frontend.