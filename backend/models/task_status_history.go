package models

import (
	"github.com/jinzhu/gorm"
)

type TaskStatusHistory struct {
	gorm.Model
	TaskID      uint   `json:"task_id" gorm:"not null"`
	OldStatus   string `json:"old_status"`
	NewStatus   string `json:"new_status" gorm:"not null"`
	ChangedByID uint   `json:"changed_by_id" gorm:"not null"`
	Notes       string `json:"notes"`

	// Relations
	Task      Task `json:"task" gorm:"foreignkey:TaskID"`
	ChangedBy User `json:"changed_by" gorm:"foreignkey:ChangedByID"`
}
