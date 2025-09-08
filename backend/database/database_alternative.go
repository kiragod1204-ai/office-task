package database

import (
	"ai-code-agent-backend/models"
	"log"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

// Alternative database initialization without CGO dependency
// Use this if you encounter CGO issues
func InitDatabaseAlternative() {
	var err error

	// Use the pure Go SQLite driver
	DB, err = gorm.Open("sqlite3", "ai_code_agent.db?_foreign_keys=on")
	if err != nil {
		log.Fatal("Không thể kết nối database:", err)
	}

	// Enable WAL mode for better performance
	DB.DB().Exec("PRAGMA journal_mode=WAL;")
	DB.DB().Exec("PRAGMA synchronous=NORMAL;")
	DB.DB().Exec("PRAGMA cache_size=1000;")
	DB.DB().Exec("PRAGMA temp_store=memory;")

	// Auto migrate tables
	DB.AutoMigrate(&models.User{})
	DB.AutoMigrate(&models.IncomingFile{})
	DB.AutoMigrate(&models.Task{})
	DB.AutoMigrate(&models.Comment{})

	// Create default admin user if not exists
	createDefaultUsers()
}
