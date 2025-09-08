package database

import (
	"ai-code-agent-backend/models"
	"log"

	"github.com/jinzhu/gorm"
	_ "github.com/lib/pq"
)

var DB *gorm.DB

func InitDatabase() {
	var err error

	// PostgreSQL connection string
	dbURL := "postgresql://dev_user:dev_password@5.189.151.150:5433/ai_code_agent?sslmode=disable"

	DB, err = gorm.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Không thể kết nối database PostgreSQL:", err)
	}

	// Configure connection pool
	DB.DB().SetMaxIdleConns(10)
	DB.DB().SetMaxOpenConns(100)

	// Auto migrate tables
	DB.AutoMigrate(&models.User{})
	DB.AutoMigrate(&models.IncomingFile{})
	DB.AutoMigrate(&models.Task{})
	DB.AutoMigrate(&models.Comment{})

	log.Println("Đã kết nối thành công đến PostgreSQL database")

	// Create default admin user if not exists
	createDefaultUsers()
}

func createDefaultUsers() {
	var count int
	DB.Model(&models.User{}).Count(&count)

	if count == 0 {
		defaultUsers := []models.User{
			{Name: "Quản trị viên", Username: "admin", Password: "admin123", Role: models.RoleAdmin},
			{Name: "Trưởng Công An Xã A", Username: "teamleader", Password: "team123", Role: models.RoleTeamLeader},
			{Name: "Phó Công An Xã B", Username: "deputy", Password: "deputy123", Role: models.RoleDeputy},
			{Name: "Văn thư C", Username: "secretary", Password: "secretary123", Role: models.RoleSecretary},
			{Name: "Cán bộ D", Username: "officer", Password: "officer123", Role: models.RoleOfficer},
		}

		for _, user := range defaultUsers {
			DB.Create(&user)
		}
		log.Println("Đã tạo người dùng mặc định")
	}
}
