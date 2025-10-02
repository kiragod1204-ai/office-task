package models

import (
	"time"
)

// TaskOutgoingDocument represents the relationship between a task and an outgoing document
type TaskOutgoingDocument struct {
	ID                 uint       `json:"id" gorm:"primary_key"`
	TaskID             uint       `json:"task_id" gorm:"not null;index"`
	OutgoingDocumentID uint       `json:"outgoing_document_id" gorm:"not null;index"`
	RelationshipType   string     `json:"relationship_type" gorm:"not null;default:'result'"` // "result", "reference", "related"
	Notes              string     `json:"notes"`
	CreatedByID        uint       `json:"created_by_id" gorm:"not null"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
	DeletedAt          *time.Time `json:"deleted_at" gorm:"index"`

	// Relations
	Task             Task             `json:"task" gorm:"foreignkey:TaskID"`
	OutgoingDocument OutgoingDocument `json:"outgoing_document" gorm:"foreignkey:OutgoingDocumentID"`
	CreatedBy        User             `json:"created_by" gorm:"foreignkey:CreatedByID"`
}

// Relationship type constants
const (
	RelationshipTypeResult    = "result"    // The outgoing document is a result/completion of the task
	RelationshipTypeReference = "reference" // The outgoing document references the task
	RelationshipTypeRelated   = "related"   // The outgoing document is related to the task
)
