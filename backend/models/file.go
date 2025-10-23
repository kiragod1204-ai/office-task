package models

import (
	"time"
)

// File represents a file attachment in the system
type File struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	OriginalName  string     `gorm:"type:varchar(255);not null" json:"original_name"`
	FileName      string     `gorm:"type:varchar(255);not null" json:"file_name"`
	FilePath      string     `gorm:"type:varchar(500);not null;unique" json:"file_path"`
	ThumbnailPath *string    `gorm:"type:varchar(500)" json:"thumbnail_path,omitempty"`
	FileSize      int64      `gorm:"not null" json:"file_size"`
	MimeType      string     `gorm:"type:varchar(100);not null" json:"mime_type"`
	FileHash      string     `gorm:"type:varchar(64);not null" json:"file_hash"`
	UploadedBy    uint       `gorm:"not null" json:"uploaded_by"`
	UploadedAt    time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"uploaded_at"`
	DocumentType  string     `gorm:"type:varchar(50);not null" json:"document_type"`
	DocumentID    uint       `gorm:"not null" json:"document_id"`
	AccessLevel   string     `gorm:"type:varchar(20);default:'restricted'" json:"access_level"`
	Summary       *string    `gorm:"type:text" json:"summary,omitempty"`
	OrderNumber   *int       `gorm:"type:integer" json:"order_number,omitempty"`
	CreatedAt     time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	DeletedAt     *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName specifies the table name for the File model
func (File) TableName() string {
	return "files"
}
