package models

import (
	"fmt"
	"time"

	"github.com/jinzhu/gorm"
)

type Task struct {
	gorm.Model
	Description    string    `json:"description" gorm:"not null"`
	Deadline       time.Time `json:"deadline"`
	Status         string    `json:"status" gorm:"not null"`
	AssignedTo     uint      `json:"assigned_to"`
	CreatedBy      uint      `json:"created_by" gorm:"not null"`
	IncomingFileID uint      `json:"incoming_file_id" gorm:"not null"`
	ReportFile     string    `json:"report_file"`

	// Relations
	AssignedUser User         `json:"assigned_user" gorm:"foreignkey:AssignedTo"`
	Creator      User         `json:"creator" gorm:"foreignkey:CreatedBy"`
	IncomingFile IncomingFile `json:"incoming_file" gorm:"foreignkey:IncomingFileID"`
	Comments     []Comment    `json:"comments" gorm:"foreignkey:TaskID"`
}

// Status constants
const (
	StatusReceived   = "Tiếp nhận văn bản"
	StatusProcessing = "Đang xử lí"
	StatusReview     = "Xem xét"
	StatusCompleted  = "Hoàn thành"
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
