package services

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"errors"
	"fmt"
)

type DocumentService struct{}

func NewDocumentService() *DocumentService {
	return &DocumentService{}
}

// GetIncomingDocumentWithTasks retrieves an incoming document with all related tasks and files
func (s *DocumentService) GetIncomingDocumentWithTasks(documentID uint) (*models.IncomingDocument, error) {
	var document models.IncomingDocument

	err := database.DB.
		Preload("DocumentType").
		Preload("IssuingUnit").
		Preload("Processor").
		Preload("CreatedBy").
		Preload("Tasks.AssignedTo").
		Preload("Tasks.CreatedBy").
		Preload("Tasks.StatusHistory.ChangedBy").
		First(&document, documentID).Error

	if err != nil {
		return nil, err
	}

	return &document, nil
}

// GetOutgoingDocumentWithTasks retrieves an outgoing document with all related tasks
func (s *DocumentService) GetOutgoingDocumentWithTasks(documentID uint) (*models.OutgoingDocument, error) {
	var document models.OutgoingDocument

	err := database.DB.
		Preload("DocumentType").
		Preload("IssuingUnit").
		Preload("Drafter").
		Preload("Approver").
		Preload("CreatedBy").
		Preload("LinkedTasks.Task.AssignedTo").
		Preload("LinkedTasks.Task.CreatedBy").
		First(&document, documentID).Error

	if err != nil {
		return nil, err
	}

	return &document, nil
}

// GetDocumentFiles retrieves all files associated with a document
func (s *DocumentService) GetDocumentFiles(documentType string, documentID uint) ([]models.File, error) {
	var files []models.File

	err := database.DB.
		Where("document_type = ? AND document_id = ? AND deleted_at IS NULL", documentType, documentID).
		Order("uploaded_at DESC").
		Find(&files).Error

	if err != nil {
		return nil, err
	}

	return files, nil
}

// LinkTaskToIncomingDocument creates a link between a task and an incoming document
func (s *DocumentService) LinkTaskToIncomingDocument(taskID uint, documentID uint) error {
	// Verify task exists
	var task models.Task
	if err := database.DB.First(&task, taskID).Error; err != nil {
		return errors.New("công việc không tồn tại")
	}

	// Verify document exists
	var document models.IncomingDocument
	if err := database.DB.First(&document, documentID).Error; err != nil {
		return errors.New("văn bản đến không tồn tại")
	}

	// Update task with document ID
	task.IncomingDocumentID = &documentID
	task.TaskType = models.TaskTypeDocumentLinked

	if err := database.DB.Save(&task).Error; err != nil {
		return errors.New("không thể liên kết công việc với văn bản")
	}

	return nil
}

// UnlinkTaskFromIncomingDocument removes the link between a task and an incoming document
func (s *DocumentService) UnlinkTaskFromIncomingDocument(taskID uint) error {
	var task models.Task
	if err := database.DB.First(&task, taskID).Error; err != nil {
		return errors.New("công việc không tồn tại")
	}

	task.IncomingDocumentID = nil
	task.TaskType = models.TaskTypeIndependent

	if err := database.DB.Save(&task).Error; err != nil {
		return errors.New("không thể hủy liên kết công việc")
	}

	return nil
}

// GetDocumentStatistics returns statistics for documents
func (s *DocumentService) GetDocumentStatistics() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Incoming documents stats
	var incomingTotal, incomingReceived, incomingProcessing, incomingCompleted int64
	database.DB.Model(&models.IncomingDocument{}).Count(&incomingTotal)
	database.DB.Model(&models.IncomingDocument{}).Where("status = ?", models.IncomingStatusReceived).Count(&incomingReceived)
	database.DB.Model(&models.IncomingDocument{}).Where("status = ?", models.IncomingStatusProcessing).Count(&incomingProcessing)
	database.DB.Model(&models.IncomingDocument{}).Where("status = ?", models.IncomingStatusCompleted).Count(&incomingCompleted)

	stats["incoming"] = map[string]interface{}{
		"total":      incomingTotal,
		"received":   incomingReceived,
		"processing": incomingProcessing,
		"completed":  incomingCompleted,
	}

	// Outgoing documents stats
	var outgoingTotal, outgoingDraft, outgoingReview, outgoingApproved, outgoingSent int64
	database.DB.Model(&models.OutgoingDocument{}).Count(&outgoingTotal)
	database.DB.Model(&models.OutgoingDocument{}).Where("status = ?", models.OutgoingStatusDraft).Count(&outgoingDraft)
	database.DB.Model(&models.OutgoingDocument{}).Where("status = ?", models.OutgoingStatusReview).Count(&outgoingReview)
	database.DB.Model(&models.OutgoingDocument{}).Where("status = ?", models.OutgoingStatusApproved).Count(&outgoingApproved)
	database.DB.Model(&models.OutgoingDocument{}).Where("status = ?", models.OutgoingStatusSent).Count(&outgoingSent)

	stats["outgoing"] = map[string]interface{}{
		"total":    outgoingTotal,
		"draft":    outgoingDraft,
		"review":   outgoingReview,
		"approved": outgoingApproved,
		"sent":     outgoingSent,
	}

	return stats, nil
}

// CanUserUploadFile checks if a user has permission to upload files for a document
func (s *DocumentService) CanUserUploadFile(userRole string, documentType string, documentStatus string) bool {
	switch documentType {
	case "incoming":
		switch userRole {
		case models.RoleSecretary, models.RoleAdmin:
			return true // Can always upload
		case models.RoleTeamLeader, models.RoleDeputy:
			// Can upload additional files (notes, decisions)
			return documentStatus != models.IncomingStatusCompleted
		case models.RoleOfficer:
			// Can upload processing reports
			return documentStatus == models.IncomingStatusProcessing || documentStatus == models.IncomingStatusAssigned
		default:
			return false
		}

	case "outgoing":
		switch userRole {
		case models.RoleSecretary, models.RoleAdmin:
			return true // Can always upload
		case models.RoleTeamLeader, models.RoleDeputy:
			// Can upload drafts and signed versions
			return true
		case models.RoleOfficer:
			// Can upload draft documents
			return documentStatus == models.OutgoingStatusDraft || documentStatus == models.OutgoingStatusReview
		default:
			return false
		}

	default:
		return false
	}
}

// GetUploadPermissionMessage returns a user-friendly message about upload permissions
func (s *DocumentService) GetUploadPermissionMessage(userRole string, documentType string) string {
	switch documentType {
	case "incoming":
		switch userRole {
		case models.RoleSecretary, models.RoleAdmin:
			return "Bạn có thể upload văn bản đến và các file đính kèm"
		case models.RoleTeamLeader, models.RoleDeputy:
			return "Bạn có thể upload file ghi chú và quyết định xử lý"
		case models.RoleOfficer:
			return "Bạn có thể upload báo cáo xử lý công việc"
		default:
			return "Bạn không có quyền upload file"
		}

	case "outgoing":
		switch userRole {
		case models.RoleSecretary, models.RoleAdmin:
			return "Bạn có thể upload văn bản đi đã ký"
		case models.RoleTeamLeader, models.RoleDeputy:
			return "Bạn có thể upload bản thảo và văn bản đã ký"
		case models.RoleOfficer:
			return "Bạn có thể upload bản thảo văn bản"
		default:
			return "Bạn không có quyền upload file"
		}

	default:
		return "Loại văn bản không hợp lệ"
	}
}

// ValidateDocumentTransition validates if a status transition is allowed
func (s *DocumentService) ValidateDocumentTransition(documentType string, currentStatus string, newStatus string, userRole string) error {
	if documentType == "incoming" {
		return s.validateIncomingTransition(currentStatus, newStatus, userRole)
	} else if documentType == "outgoing" {
		return s.validateOutgoingTransition(currentStatus, newStatus, userRole)
	}
	return errors.New("loại văn bản không hợp lệ")
}

func (s *DocumentService) validateIncomingTransition(currentStatus string, newStatus string, userRole string) error {
	// Define allowed transitions
	allowedTransitions := map[string][]string{
		models.IncomingStatusReceived: {
			models.IncomingStatusForwarded,
			models.IncomingStatusAssigned,
		},
		models.IncomingStatusForwarded: {
			models.IncomingStatusAssigned,
			models.IncomingStatusProcessing,
		},
		models.IncomingStatusAssigned: {
			models.IncomingStatusProcessing,
		},
		models.IncomingStatusProcessing: {
			models.IncomingStatusCompleted,
			models.IncomingStatusAssigned, // Can reassign
		},
	}

	// Check if transition is allowed
	allowed := false
	if transitions, ok := allowedTransitions[currentStatus]; ok {
		for _, allowedStatus := range transitions {
			if allowedStatus == newStatus {
				allowed = true
				break
			}
		}
	}

	if !allowed {
		return fmt.Errorf("không thể chuyển từ trạng thái '%s' sang '%s'", currentStatus, newStatus)
	}

	// Check role permissions for specific transitions
	if newStatus == models.IncomingStatusCompleted {
		if userRole != models.RoleTeamLeader && userRole != models.RoleDeputy && userRole != models.RoleAdmin {
			return errors.New("chỉ Trưởng/Phó Công An Xã mới có thể hoàn thành văn bản")
		}
	}

	return nil
}

func (s *DocumentService) validateOutgoingTransition(currentStatus string, newStatus string, userRole string) error {
	// Define allowed transitions
	allowedTransitions := map[string][]string{
		models.OutgoingStatusDraft: {
			models.OutgoingStatusReview,
			models.OutgoingStatusRejected,
		},
		models.OutgoingStatusReview: {
			models.OutgoingStatusApproved,
			models.OutgoingStatusRejected,
			models.OutgoingStatusDraft, // Can send back to draft
		},
		models.OutgoingStatusApproved: {
			models.OutgoingStatusSent,
		},
		models.OutgoingStatusRejected: {
			models.OutgoingStatusDraft, // Can revise
		},
	}

	// Check if transition is allowed
	allowed := false
	if transitions, ok := allowedTransitions[currentStatus]; ok {
		for _, allowedStatus := range transitions {
			if allowedStatus == newStatus {
				allowed = true
				break
			}
		}
	}

	if !allowed {
		return fmt.Errorf("không thể chuyển từ trạng thái '%s' sang '%s'", currentStatus, newStatus)
	}

	// Check role permissions for specific transitions
	if newStatus == models.OutgoingStatusApproved || newStatus == models.OutgoingStatusRejected {
		if userRole != models.RoleTeamLeader && userRole != models.RoleDeputy && userRole != models.RoleAdmin {
			return errors.New("chỉ Trưởng/Phó Công An Xã mới có thể phê duyệt văn bản")
		}
	}

	return nil
}
