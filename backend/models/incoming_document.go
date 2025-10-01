package models

import (
	"encoding/json"
	"time"

	"github.com/jinzhu/gorm"
)

type IncomingDocument struct {
	gorm.Model
	ArrivalDate    time.Time `json:"arrival_date" gorm:"not null"`
	ArrivalNumber  int       `json:"arrival_number" gorm:"unique;not null"`
	OriginalNumber string    `json:"original_number" gorm:"not null"`
	DocumentDate   time.Time `json:"document_date" gorm:"not null"`
	DocumentTypeID uint      `json:"document_type_id" gorm:"not null"`
	IssuingUnitID  uint      `json:"issuing_unit_id" gorm:"not null"`
	Summary        string    `json:"summary" gorm:"not null"`
	InternalNotes  string    `json:"internal_notes"`
	ProcessorID    *uint     `json:"processor_id"`
	Status         string    `json:"status" gorm:"not null;default:'received'"`
	FilePath       string    `json:"file_path"`
	CreatedByID    uint      `json:"created_by_id" gorm:"not null"`

	// Relations
	DocumentType DocumentType `json:"document_type" gorm:"foreignkey:DocumentTypeID"`
	IssuingUnit  IssuingUnit  `json:"issuing_unit" gorm:"foreignkey:IssuingUnitID"`
	Processor    *User        `json:"processor" gorm:"foreignkey:ProcessorID"`
	CreatedBy    User         `json:"created_by" gorm:"foreignkey:CreatedByID"`
	Tasks        []Task       `json:"tasks" gorm:"foreignkey:IncomingDocumentID"`
}

// Status constants for incoming documents
const (
	IncomingStatusReceived   = "received"
	IncomingStatusForwarded  = "forwarded"
	IncomingStatusAssigned   = "assigned"
	IncomingStatusProcessing = "processing"
	IncomingStatusCompleted  = "completed"
)

// MarshalJSON provides custom JSON marshaling to include compatibility fields
func (doc *IncomingDocument) MarshalJSON() ([]byte, error) {
	type Alias IncomingDocument
	return json.Marshal(&struct {
		*Alias
		OrderNumber int    `json:"order_number"` // Compatibility field for arrival_number
		FileName    string `json:"file_name"`    // Compatibility field for file path
	}{
		Alias:       (*Alias)(doc),
		OrderNumber: doc.ArrivalNumber,
		FileName:    doc.Summary, // Use summary as file name for now
	})
}
