package models

import (
	"github.com/jinzhu/gorm"
)

type ReceivingUnit struct {
	gorm.Model
	Name        string `json:"name" gorm:"unique;not null"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active" gorm:"default:true"`
}
