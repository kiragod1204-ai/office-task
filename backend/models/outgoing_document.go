package models

import (
	"time"

	"github.com/jinzhu/gorm"
)

type OutgoingDocument struct {
	gorm.Model
	DocumentNumber string    `json:"document_number" gorm:"not null"`
	IssueDate      time.Time `json:"issue_date" gorm:"not null"`
	DocumentTypeID uint      `json:"document_type_id" gorm:"not null"`
	IssuingUnitID  uint      `json:"issuing_unit_id" gorm:"not null"`
	Summary        string    `json:"summary" gorm:"not null"`
	DrafterID      uint      `json:"drafter_id" gorm:"not null"`
	ApproverID     uint      `json:"approver_id" gorm:"not null"`
	InternalNotes  string    `json:"internal_notes"`
	Status         string    `json:"status" gorm:"not null;default:'draft'"`
	FilePath       string    `json:"file_path"`
	CreatedByID    uint      `json:"created_by_id" gorm:"not null"`

	// Relations
	DocumentType DocumentType `json:"document_type" gorm:"foreignkey:DocumentTypeID"`
	IssuingUnit  IssuingUnit  `json:"issuing_unit" gorm:"foreignkey:IssuingUnitID"`
	Drafter      User         `json:"drafter" gorm:"foreignkey:DrafterID"`
	Approver     User         `json:"approver" gorm:"foreignkey:ApproverID"`
	CreatedBy    User         `json:"created_by" gorm:"foreignkey:CreatedByID"`
}

// Status constants for outgoing documents
const (
	OutgoingStatusDraft    = "draft"
	OutgoingStatusReview   = "review"
	OutgoingStatusApproved = "approved"
	OutgoingStatusSent     = "sent"
	OutgoingStatusRejected = "rejected"
)
