package models

import (
	"github.com/jinzhu/gorm"
)

// IncomingFile - temporary model for backward compatibility
// This will be removed when file management is properly implemented
type IncomingFile struct {
	gorm.Model
	OrderNumber int    `json:"order_number" gorm:"unique;not null"`
	FileName    string `json:"file_name" gorm:"not null"`
	FilePath    string `json:"file_path" gorm:"not null"`
	UploadedBy  uint   `json:"uploaded_by" gorm:"not null"`
	User        User   `json:"user" gorm:"foreignkey:UploadedBy"`
}
