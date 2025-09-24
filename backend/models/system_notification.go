package models

import (
	"time"

	"github.com/jinzhu/gorm"
)

type SystemNotification struct {
	gorm.Model
	Title       string     `json:"title" gorm:"not null"`
	Content     string     `json:"content" gorm:"not null"`
	Type        string     `json:"type" gorm:"not null"` // "maintenance", "upgrade", "action_required"
	IsActive    bool       `json:"is_active" gorm:"default:true"`
	ExpiresAt   *time.Time `json:"expires_at"`
	CreatedByID uint       `json:"created_by_id" gorm:"not null"`

	// Relations
	CreatedBy User `json:"created_by" gorm:"foreignkey:CreatedByID"`
}

// Notification type constants
const (
	NotificationTypeMaintenance    = "maintenance"
	NotificationTypeUpgrade        = "upgrade"
	NotificationTypeActionRequired = "action_required"
)
