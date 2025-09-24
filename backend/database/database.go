package database

import (
	"ai-code-agent-backend/models"
	"io/ioutil"
	"log"
	"path/filepath"
	"strings"
	"time"

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
	DB.AutoMigrate(&models.DocumentType{})
	DB.AutoMigrate(&models.IssuingUnit{})
	DB.AutoMigrate(&models.ReceivingUnit{})
	DB.AutoMigrate(&models.IncomingDocument{})
	DB.AutoMigrate(&models.OutgoingDocument{})
	DB.AutoMigrate(&models.SystemNotification{})
	DB.AutoMigrate(&models.Task{})
	DB.AutoMigrate(&models.TaskStatusHistory{})
	DB.AutoMigrate(&models.Comment{})
	DB.AutoMigrate(&models.AuditLog{})
	DB.AutoMigrate(&models.IncomingFile{}) // Temporary for backward compatibility

	log.Println("Đã kết nối thành công đến PostgreSQL database")

	// Create files table for enhanced file management
	createFilesTable()

	// Run SQL migrations
	runMigrations()

	// Create default admin user if not exists
	createDefaultUsers()

	// Seed sample data for development/testing
	seedSampleData()
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

func runMigrations() {
	migrationPath := filepath.Join("database", "migrations", "001_enhance_schema.sql")

	// Read the migration file
	migrationSQL, err := ioutil.ReadFile(migrationPath)
	if err != nil {
		log.Printf("Warning: Could not read migration file %s: %v", migrationPath, err)
		return
	}

	// Execute the migration
	if err := DB.Exec(string(migrationSQL)).Error; err != nil {
		log.Printf("Warning: Error executing migration: %v", err)
	} else {
		log.Println("Database migration completed successfully")
	}
}

func seedSampleData() {
	// Seed configuration data first
	seedConfigurationData()

	// Check if sample data already exists
	var docCount int
	DB.Model(&models.IncomingDocument{}).Count(&docCount)

	if docCount > 0 {
		return // Sample data already exists
	}

	// Get document types and issuing units for sample data
	var docTypes []models.DocumentType
	var issuingUnits []models.IssuingUnit
	var users []models.User

	DB.Find(&docTypes)
	DB.Find(&issuingUnits)
	DB.Find(&users)

	if len(docTypes) == 0 || len(issuingUnits) == 0 || len(users) == 0 {
		log.Println("Skipping sample data creation - missing required data")
		return
	}

	// Find specific users for sample data
	var secretary, teamLeader, deputy, officer models.User
	for _, user := range users {
		switch user.Role {
		case models.RoleSecretary:
			secretary = user
		case models.RoleTeamLeader:
			teamLeader = user
		case models.RoleDeputy:
			deputy = user
		case models.RoleOfficer:
			officer = user
		}
	}

	// Create sample incoming documents
	sampleDocs := []models.IncomingDocument{
		{
			ArrivalDate:    time.Now().AddDate(0, 0, -5),
			ArrivalNumber:  1,
			OriginalNumber: "123/TB-UBND",
			DocumentDate:   time.Now().AddDate(0, 0, -7),
			DocumentTypeID: docTypes[0].ID,
			IssuingUnitID:  issuingUnits[0].ID,
			Summary:        "Thông báo về việc tăng cường công tác an ninh trật tự",
			InternalNotes:  "Cần xử lý khẩn cấp",
			ProcessorID:    &teamLeader.ID,
			Status:         models.IncomingStatusForwarded,
			CreatedByID:    secretary.ID,
		},
		{
			ArrivalDate:    time.Now().AddDate(0, 0, -3),
			ArrivalNumber:  2,
			OriginalNumber: "456/CV-CA",
			DocumentDate:   time.Now().AddDate(0, 0, -4),
			DocumentTypeID: docTypes[1].ID,
			IssuingUnitID:  issuingUnits[1].ID,
			Summary:        "Công văn về việc báo cáo tình hình an ninh địa bàn",
			InternalNotes:  "Báo cáo định kỳ hàng tháng",
			ProcessorID:    &deputy.ID,
			Status:         models.IncomingStatusAssigned,
			CreatedByID:    secretary.ID,
		},
		{
			ArrivalDate:    time.Now().AddDate(0, 0, -1),
			ArrivalNumber:  3,
			OriginalNumber: "789/QD-UBND",
			DocumentDate:   time.Now().AddDate(0, 0, -2),
			DocumentTypeID: docTypes[2].ID,
			IssuingUnitID:  issuingUnits[0].ID,
			Summary:        "Quyết định về việc phân công nhiệm vụ tuần tra",
			Status:         models.IncomingStatusReceived,
			CreatedByID:    secretary.ID,
		},
	}

	for _, doc := range sampleDocs {
		DB.Create(&doc)
	}

	// Create sample outgoing documents
	sampleOutgoing := []models.OutgoingDocument{
		{
			DocumentNumber: "01/BC-CAX",
			IssueDate:      time.Now().AddDate(0, 0, -2),
			DocumentTypeID: docTypes[4].ID,     // Báo cáo
			IssuingUnitID:  issuingUnits[4].ID, // UBND Xã
			Summary:        "Báo cáo tình hình an ninh trật tự tháng",
			DrafterID:      officer.ID,
			ApproverID:     teamLeader.ID,
			InternalNotes:  "Báo cáo định kỳ",
			Status:         models.OutgoingStatusApproved,
			CreatedByID:    secretary.ID,
		},
	}

	for _, doc := range sampleOutgoing {
		DB.Create(&doc)
	}

	// Create sample tasks
	sampleTasks := []models.Task{
		{
			Description:        "Xử lý văn bản thông báo tăng cường an ninh",
			Deadline:           &[]time.Time{time.Now().AddDate(0, 0, 3)}[0],
			DeadlineType:       models.DeadlineTypeSpecific,
			Status:             models.StatusProcessing,
			AssignedToID:       &deputy.ID,
			CreatedByID:        teamLeader.ID,
			IncomingDocumentID: &[]uint{1}[0],
			TaskType:           models.TaskTypeDocumentLinked,
			ProcessingNotes:    "Đã phân công cho tổ tuần tra",
		},
		{
			Description:  "Lập báo cáo tình hình an ninh tháng",
			Deadline:     &[]time.Time{time.Now().AddDate(0, 0, 7)}[0],
			DeadlineType: models.DeadlineTypeMonthly,
			Status:       models.StatusReceived,
			AssignedToID: &officer.ID,
			CreatedByID:  deputy.ID,
			TaskType:     models.TaskTypeIndependent,
		},
	}

	for _, task := range sampleTasks {
		DB.Create(&task)
	}

	log.Println("Sample data created successfully")
}

// IsUniqueConstraintError checks if the error is a unique constraint violation
func IsUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "duplicate key value violates unique constraint") ||
		strings.Contains(err.Error(), "UNIQUE constraint failed")
}

func createFilesTable() {
	sql := `
	CREATE TABLE IF NOT EXISTS files (
		id SERIAL PRIMARY KEY,
		original_name VARCHAR(255) NOT NULL,
		file_name VARCHAR(255) NOT NULL,
		file_path VARCHAR(500) NOT NULL UNIQUE,
		thumbnail_path VARCHAR(500),
		file_size BIGINT NOT NULL,
		mime_type VARCHAR(100) NOT NULL,
		file_hash VARCHAR(64) NOT NULL,
		uploaded_by INTEGER NOT NULL REFERENCES users(id),
		uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		document_type VARCHAR(50) NOT NULL,
		document_id INTEGER NOT NULL,
		access_level VARCHAR(20) DEFAULT 'restricted',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		deleted_at TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_files_document_type_id ON files(document_type, document_id);
	CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
	CREATE INDEX IF NOT EXISTS idx_files_file_hash ON files(file_hash);
	CREATE INDEX IF NOT EXISTS idx_files_access_level ON files(access_level);
	CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at);
	`

	if err := DB.Exec(sql).Error; err != nil {
		log.Printf("Warning: Could not create files table: %v", err)
	} else {
		log.Println("Files table created successfully")
	}
}

func seedConfigurationData() {
	// Seed Document Types
	var docTypeCount int
	DB.Model(&models.DocumentType{}).Count(&docTypeCount)

	if docTypeCount == 0 {
		defaultDocumentTypes := []models.DocumentType{
			{Name: "Thông báo", Description: "Văn bản thông báo chính thức", IsActive: true},
			{Name: "Công văn", Description: "Công văn hành chính", IsActive: true},
			{Name: "Quyết định", Description: "Quyết định hành chính", IsActive: true},
			{Name: "Chỉ thị", Description: "Chỉ thị từ cấp trên", IsActive: true},
			{Name: "Báo cáo", Description: "Báo cáo công tác", IsActive: true},
			{Name: "Tờ trình", Description: "Tờ trình đề xuất", IsActive: true},
			{Name: "Biên bản", Description: "Biên bản họp, kiểm tra", IsActive: true},
		}

		for _, docType := range defaultDocumentTypes {
			DB.Create(&docType)
		}
		log.Println("Đã tạo loại văn bản mặc định")
	}

	// Seed Issuing Units
	var issuingUnitCount int
	DB.Model(&models.IssuingUnit{}).Count(&issuingUnitCount)

	if issuingUnitCount == 0 {
		defaultIssuingUnits := []models.IssuingUnit{
			{Name: "UBND Tỉnh", Description: "Ủy ban nhân dân tỉnh", IsActive: true},
			{Name: "UBND Huyện", Description: "Ủy ban nhân dân huyện", IsActive: true},
			{Name: "UBND Xã", Description: "Ủy ban nhân dân xã", IsActive: true},
			{Name: "Công An Tỉnh", Description: "Công an tỉnh", IsActive: true},
			{Name: "Công An Huyện", Description: "Công an huyện", IsActive: true},
			{Name: "Công An Xã", Description: "Công an xã", IsActive: true},
			{Name: "Sở Nội Vụ", Description: "Sở Nội vụ", IsActive: true},
			{Name: "Văn phòng UBND", Description: "Văn phòng UBND các cấp", IsActive: true},
		}

		for _, unit := range defaultIssuingUnits {
			DB.Create(&unit)
		}
		log.Println("Đã tạo đơn vị ban hành mặc định")
	}

	// Seed Receiving Units
	var receivingUnitCount int
	DB.Model(&models.ReceivingUnit{}).Count(&receivingUnitCount)

	if receivingUnitCount == 0 {
		defaultReceivingUnits := []models.ReceivingUnit{
			{Name: "UBND Tỉnh", Description: "Ủy ban nhân dân tỉnh", IsActive: true},
			{Name: "UBND Huyện", Description: "Ủy ban nhân dân huyện", IsActive: true},
			{Name: "UBND Xã", Description: "Ủy ban nhân dân xã", IsActive: true},
			{Name: "Công An Tỉnh", Description: "Công an tỉnh", IsActive: true},
			{Name: "Công An Huyện", Description: "Công an huyện", IsActive: true},
			{Name: "Các Sở Ban Ngành", Description: "Các sở ban ngành tỉnh", IsActive: true},
			{Name: "Doanh nghiệp", Description: "Các doanh nghiệp", IsActive: true},
			{Name: "Tổ chức xã hội", Description: "Các tổ chức xã hội", IsActive: true},
		}

		for _, unit := range defaultReceivingUnits {
			DB.Create(&unit)
		}
		log.Println("Đã tạo đơn vị nhận mặc định")
	}
}
