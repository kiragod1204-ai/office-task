package models

import (
	"encoding/json"
	"time"

	"github.com/jinzhu/gorm"
)

// AuditAction represents the type of action performed
type AuditAction string

const (
	// Document actions
	AuditActionDocumentCreate   AuditAction = "document_create"
	AuditActionDocumentUpdate   AuditAction = "document_update"
	AuditActionDocumentDelete   AuditAction = "document_delete"
	AuditActionDocumentForward  AuditAction = "document_forward"
	AuditActionDocumentAssign   AuditAction = "document_assign"
	AuditActionDocumentProcess  AuditAction = "document_process"
	AuditActionDocumentComplete AuditAction = "document_complete"

	// Task actions
	AuditActionTaskCreate   AuditAction = "task_create"
	AuditActionTaskUpdate   AuditAction = "task_update"
	AuditActionTaskDelete   AuditAction = "task_delete"
	AuditActionTaskAssign   AuditAction = "task_assign"
	AuditActionTaskForward  AuditAction = "task_forward"
	AuditActionTaskDelegate AuditAction = "task_delegate"
	AuditActionTaskStart    AuditAction = "task_start"
	AuditActionTaskComplete AuditAction = "task_complete"

	// User actions
	AuditActionUserLogin      AuditAction = "user_login"
	AuditActionUserLogout     AuditAction = "user_logout"
	AuditActionUserCreate     AuditAction = "user_create"
	AuditActionUserUpdate     AuditAction = "user_update"
	AuditActionUserDelete     AuditAction = "user_delete"
	AuditActionUserActivate   AuditAction = "user_activate"
	AuditActionUserDeactivate AuditAction = "user_deactivate"

	// System actions
	AuditActionSystemConfig   AuditAction = "system_config"
	AuditActionFileUpload     AuditAction = "file_upload"
	AuditActionFileDownload   AuditAction = "file_download"
	AuditActionFileDelete     AuditAction = "file_delete"
	AuditActionReportGenerate AuditAction = "report_generate"
	AuditActionReportExport   AuditAction = "report_export"
)

// AuditEntityType represents the type of entity being audited
type AuditEntityType string

const (
	AuditEntityIncomingDocument AuditEntityType = "incoming_document"
	AuditEntityOutgoingDocument AuditEntityType = "outgoing_document"
	AuditEntityTask             AuditEntityType = "task"
	AuditEntityUser             AuditEntityType = "user"
	AuditEntitySystem           AuditEntityType = "system"
	AuditEntityFile             AuditEntityType = "file"
	AuditEntityReport           AuditEntityType = "report"
)

// AuditLog represents a comprehensive audit trail entry
type AuditLog struct {
	gorm.Model
	Action       AuditAction     `json:"action" gorm:"not null;index"`
	EntityType   AuditEntityType `json:"entity_type" gorm:"not null;index"`
	EntityID     uint            `json:"entity_id" gorm:"index"`
	UserID       uint            `json:"user_id" gorm:"not null;index"`
	IPAddress    string          `json:"ip_address"`
	UserAgent    string          `json:"user_agent"`
	Description  string          `json:"description" gorm:"not null"`
	OldValues    string          `json:"old_values" gorm:"type:text"` // JSON string of old values
	NewValues    string          `json:"new_values" gorm:"type:text"` // JSON string of new values
	Metadata     string          `json:"metadata" gorm:"type:text"`   // Additional context data
	Success      bool            `json:"success" gorm:"default:true;index"`
	ErrorMessage string          `json:"error_message"`
	Duration     int64           `json:"duration"` // Duration in milliseconds
	Timestamp    time.Time       `json:"timestamp" gorm:"not null;index"`

	// Relations
	User User `json:"user" gorm:"foreignkey:UserID"`
}

// SetOldValues sets the old values as JSON
func (a *AuditLog) SetOldValues(values interface{}) error {
	if values == nil {
		a.OldValues = ""
		return nil
	}
	jsonData, err := json.Marshal(values)
	if err != nil {
		return err
	}
	a.OldValues = string(jsonData)
	return nil
}

// SetNewValues sets the new values as JSON
func (a *AuditLog) SetNewValues(values interface{}) error {
	if values == nil {
		a.NewValues = ""
		return nil
	}
	jsonData, err := json.Marshal(values)
	if err != nil {
		return err
	}
	a.NewValues = string(jsonData)
	return nil
}

// SetMetadata sets the metadata as JSON
func (a *AuditLog) SetMetadata(metadata interface{}) error {
	if metadata == nil {
		a.Metadata = ""
		return nil
	}
	jsonData, err := json.Marshal(metadata)
	if err != nil {
		return err
	}
	a.Metadata = string(jsonData)
	return nil
}

// GetOldValues parses the old values JSON into the provided interface
func (a *AuditLog) GetOldValues(dest interface{}) error {
	if a.OldValues == "" {
		return nil
	}
	return json.Unmarshal([]byte(a.OldValues), dest)
}

// GetNewValues parses the new values JSON into the provided interface
func (a *AuditLog) GetNewValues(dest interface{}) error {
	if a.NewValues == "" {
		return nil
	}
	return json.Unmarshal([]byte(a.NewValues), dest)
}

// GetMetadata parses the metadata JSON into the provided interface
func (a *AuditLog) GetMetadata(dest interface{}) error {
	if a.Metadata == "" {
		return nil
	}
	return json.Unmarshal([]byte(a.Metadata), dest)
}

// UserActivity represents aggregated user activity data
type UserActivity struct {
	UserID          uint      `json:"user_id"`
	UserName        string    `json:"user_name"`
	UserRole        string    `json:"user_role"`
	LastActivity    time.Time `json:"last_activity"`
	TotalActions    int64     `json:"total_actions"`
	DocumentActions int64     `json:"document_actions"`
	TaskActions     int64     `json:"task_actions"`
	LoginCount      int64     `json:"login_count"`
	FailedActions   int64     `json:"failed_actions"`
}

// DocumentAuditSummary represents document processing audit summary
type DocumentAuditSummary struct {
	DocumentID     uint      `json:"document_id"`
	DocumentType   string    `json:"document_type"`
	DocumentNumber string    `json:"document_number"`
	Summary        string    `json:"summary"`
	CreatedAt      time.Time `json:"created_at"`
	CreatedBy      string    `json:"created_by"`
	CurrentStatus  string    `json:"current_status"`
	ProcessorName  string    `json:"processor_name"`
	TotalActions   int64     `json:"total_actions"`
	LastActivity   time.Time `json:"last_activity"`
	ProcessingTime int64     `json:"processing_time"` // Time in hours from creation to completion
}

// TaskAuditSummary represents task processing audit summary
type TaskAuditSummary struct {
	TaskID         uint      `json:"task_id"`
	Description    string    `json:"description"`
	CreatedAt      time.Time `json:"created_at"`
	CreatedBy      string    `json:"created_by"`
	AssignedTo     string    `json:"assigned_to"`
	CurrentStatus  string    `json:"current_status"`
	Deadline       time.Time `json:"deadline"`
	CompletedAt    time.Time `json:"completed_at"`
	TotalActions   int64     `json:"total_actions"`
	ProcessingTime int64     `json:"processing_time"` // Time in hours from assignment to completion
}
