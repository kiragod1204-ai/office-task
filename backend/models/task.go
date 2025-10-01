package models

import (
	"fmt"
	"time"

	"github.com/jinzhu/gorm"
)

type Task struct {
	gorm.Model
	Description        string     `json:"description" gorm:"not null"`
	Deadline           *time.Time `json:"deadline"`
	DeadlineType       string     `json:"deadline_type" gorm:"default:'specific'"` // "specific", "monthly", "quarterly", "yearly"
	Status             string     `json:"status" gorm:"not null"`
	AssignedToID       *uint      `json:"assigned_to_id"`
	CreatedByID        uint       `json:"created_by_id" gorm:"not null"`
	IncomingDocumentID *uint      `json:"incoming_document_id"`                       // Nullable for independent tasks
	TaskType           string     `json:"task_type" gorm:"default:'document_linked'"` // "document_linked", "independent"
	ProcessingContent  string     `json:"processing_content"`
	ProcessingNotes    string     `json:"processing_notes"`
	CompletionDate     *time.Time `json:"completion_date"`
	ReportFile         string     `json:"report_file"`

	// Relations
	AssignedTo       *User               `json:"assigned_to" gorm:"foreignkey:AssignedToID"`
	AssignedUser     *User               `json:"assigned_user" gorm:"foreignkey:AssignedToID"` // Compatibility field
	CreatedBy        User                `json:"created_by" gorm:"foreignkey:CreatedByID"`
	Creator          User                `json:"creator" gorm:"foreignkey:CreatedByID"` // Compatibility field
	IncomingDocument *IncomingDocument   `json:"incoming_document" gorm:"foreignkey:IncomingDocumentID"`
	IncomingFile     *IncomingDocument   `json:"incoming_file" gorm:"foreignkey:IncomingDocumentID"` // Compatibility field
	Comments         []Comment           `json:"comments" gorm:"foreignkey:TaskID"`
	StatusHistory    []TaskStatusHistory `json:"status_history" gorm:"foreignkey:TaskID"`
}

// Status constants
const (
	StatusReceived   = "Tiếp nhận văn bản"
	StatusProcessing = "Đang xử lí"
	StatusReview     = "Xem xét"
	StatusCompleted  = "Hoàn thành"
	StatusNotStarted = "Chưa bắt đầu"
)

// Task type constants
const (
	TaskTypeDocumentLinked = "document_linked"
	TaskTypeIndependent    = "independent"
)

// Deadline type constants
const (
	DeadlineTypeSpecific  = "specific"
	DeadlineTypeMonthly   = "monthly"
	DeadlineTypeQuarterly = "quarterly"
	DeadlineTypeYearly    = "yearly"
)

type Comment struct {
	gorm.Model
	TaskID  uint   `json:"task_id" gorm:"not null"`
	UserID  uint   `json:"user_id" gorm:"not null"`
	Content string `json:"content" gorm:"not null"`
	User    User   `json:"user" gorm:"foreignkey:UserID"`
}

// RemainingTimeInfo represents remaining time information
type RemainingTimeInfo struct {
	Text      string `json:"text"`
	IsOverdue bool   `json:"is_overdue"`
	Urgency   string `json:"urgency"`
	Days      int    `json:"days"`
	Hours     int    `json:"hours"`
	Minutes   int    `json:"minutes"`
}

// GetRemainingTime calculates remaining time for a task
func (t *Task) GetRemainingTime() RemainingTimeInfo {
	if t.Deadline == nil {
		return RemainingTimeInfo{
			Text:      "Không có hạn",
			IsOverdue: false,
			Urgency:   "normal",
			Days:      0,
			Hours:     0,
			Minutes:   0,
		}
	}

	now := time.Now()
	diff := t.Deadline.Sub(now)

	if diff < 0 {
		// Task is overdue
		overdueDuration := -diff
		days := int(overdueDuration.Hours() / 24)
		hours := int(overdueDuration.Hours()) % 24

		var text string
		if days > 0 {
			text = fmt.Sprintf("Quá hạn %d ngày", days)
		} else if hours > 0 {
			text = fmt.Sprintf("Quá hạn %d giờ", hours)
		} else {
			text = "Quá hạn"
		}

		return RemainingTimeInfo{
			Text:      text,
			IsOverdue: true,
			Urgency:   "critical",
			Days:      -days,
			Hours:     -hours,
			Minutes:   -int(overdueDuration.Minutes()) % 60,
		}
	}

	days := int(diff.Hours() / 24)
	hours := int(diff.Hours()) % 24
	minutes := int(diff.Minutes()) % 60

	var text string
	var urgency string

	if days > 7 {
		text = fmt.Sprintf("Còn %d ngày", days)
		urgency = "normal"
	} else if days > 3 {
		text = fmt.Sprintf("Còn %d ngày", days)
		urgency = "medium"
	} else if days > 1 {
		text = fmt.Sprintf("Còn %d ngày %d giờ", days, hours)
		urgency = "high"
	} else if days == 1 {
		text = fmt.Sprintf("Còn 1 ngày %d giờ", hours)
		urgency = "urgent"
	} else if hours > 0 {
		text = fmt.Sprintf("Còn %d giờ %d phút", hours, minutes)
		urgency = "urgent"
	} else {
		text = fmt.Sprintf("Còn %d phút", minutes)
		urgency = "critical"
	}

	return RemainingTimeInfo{
		Text:      text,
		IsOverdue: false,
		Urgency:   urgency,
		Days:      days,
		Hours:     hours,
		Minutes:   minutes,
	}
}
