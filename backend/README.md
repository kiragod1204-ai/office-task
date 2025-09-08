# 🚀 AI Code Agent Backend

Backend server cho hệ thống quản lý công việc văn bản đến/đi.

## 📋 Yêu cầu hệ thống

- **Go 1.21+** - [Tải về](https://golang.org/dl/)
- **PostgreSQL** - Database server
- **Docker** (khuyến nghị) - Để chạy PostgreSQL dễ dàng

## 🗄️ Cài đặt Database

### Cách 1: Sử dụng Docker (Khuyến nghị)
```bash
# Windows
setup-db.bat

# Linux/macOS
chmod +x setup-db.sh
./setup-db.sh
```

### Cách 2: Cài đặt PostgreSQL thủ công
1. Cài đặt PostgreSQL từ https://www.postgresql.org/download/
2. Tạo database và user:
```sql
CREATE DATABASE ai_code_agent;
CREATE USER dev_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE ai_code_agent TO dev_user;
```
3. Đảm bảo PostgreSQL chạy trên port 5433

## 🏃‍♂️ Chạy server

### Windows
```bash
# Chạy server (development)
run.bat

# Chạy với hot reload (development)
dev.bat

# Build executable
build.bat
```

### Linux/macOS
```bash
# Cấp quyền thực thi (chỉ lần đầu)
chmod +x *.sh

# Chạy server (development)
./run.sh

# Chạy với hot reload (development)
./dev.sh

# Build executable
./build.sh
```

### Manual (tất cả hệ điều hành)
```bash
# Cài đặt dependencies
go mod tidy

# Chạy server
go run main.go

# Build executable
go build -o ai-code-agent-backend main.go
```

## 🌐 Truy cập

- **Server URL**: http://localhost:9090
- **API Base**: http://localhost:9090/api
- **Database**: PostgreSQL on localhost:5433
- **Health Check**: http://localhost:9090/api/profile (cần token)

## 👤 Tài khoản mặc định

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Quản trị viên |
| teamleader | team123 | Trưởng Công An Xã |
| deputy | deputy123 | Phó Công An Xã |
| secretary | secretary123 | Văn thư |
| officer | officer123 | Cán bộ |

## 📁 Cấu trúc thư mục

```
backend/
├── main.go              # Entry point
├── models/              # Data models
├── controllers/         # API controllers
├── middleware/          # Middleware functions
├── database/           # Database setup
├── uploads/            # File uploads
│   ├── incoming/       # Văn bản đến
│   └── reports/        # File báo cáo
├── run.bat/.sh         # Run scripts
├── build.bat/.sh       # Build scripts
├── dev.bat/.sh         # Development scripts
└── .air.toml           # Hot reload config
```

## 🔧 Development

### Hot Reload
Scripts `dev.bat` và `dev.sh` sử dụng [Air](https://github.com/cosmtrek/air) để tự động restart server khi có thay đổi code.

### Database
- PostgreSQL database: `ai_code_agent`
- Connection: `postgresql://dev_user:dev_password@localhost:5433/ai_code_agent`
- Tự động tạo tables khi khởi động
- Tự động tạo user mặc định

### File Uploads
- Văn bản đến: `uploads/incoming/`
- File báo cáo: `uploads/reports/`
- Tự động tạo thư mục khi cần

## 🧪 Test API

```bash
# Login
curl -X POST http://localhost:9090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get tasks (cần token)
curl -X GET http://localhost:9090/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Dashboard
curl -X GET http://localhost:9090/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📚 API Documentation

Xem file `API_Documentation.md` để biết chi tiết về tất cả API endpoints.

## 🚨 Troubleshooting

### Lỗi "Không thể kết nối database PostgreSQL"
**Cách 1: Kiểm tra PostgreSQL đang chạy**
```bash
# Kiểm tra port 5433
netstat -an | findstr 5433

# Hoặc test connection
psql -h localhost -p 5433 -U dev_user -d ai_code_agent
```

**Cách 2: Restart PostgreSQL container**
```bash
docker-compose restart postgres
```

**Cách 3: Kiểm tra logs**
```bash
docker-compose logs postgres
```

### Lỗi "go: command not found"
- Cài đặt Go từ https://golang.org/dl/
- Thêm Go vào PATH

### Lỗi "permission denied" (Linux/macOS)
```bash
chmod +x *.sh
```

### Port 9090 đã được sử dụng
- Đổi port trong `main.go`: `r.Run(":9091")`
- Hoặc kill process đang dùng port 9090

### Database connection refused
- Đảm bảo PostgreSQL đang chạy trên port 5433
- Kiểm tra firewall không block port 5433
- Restart database container: `docker-compose restart postgres`

### Reset database
```bash
# Stop container
docker-compose down

# Remove volume (xóa tất cả dữ liệu)
docker volume rm backend_postgres_data

# Start lại
docker-compose up -d postgres
```

## 🔒 Security Notes

- JWT secret key nên được thay đổi trong production
- Password nên được hash (hiện tại lưu plain text)
- CORS được cấu hình cho development (cho phép tất cả origins)