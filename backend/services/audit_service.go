package services

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

type AuditService struct {
	db *gorm.DB
}

func NewAuditService() *AuditService {
	return &AuditService{
		db: database.DB,
	}
}

// LogActivity creates a new audit log entry
func (s *AuditService) LogActivity(c *gin.Context, action models.AuditAction, entityType models.AuditEntityType, entityID uint, description string, oldValues, newValues, metadata interface{}) error {
	userID, exists := c.Get("user_id")
	if !exists {
		return fmt.Errorf("user ID not found in context")
	}

	auditLog := &models.AuditLog{
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		UserID:      userID.(uint),
		IPAddress:   c.ClientIP(),
		UserAgent:   c.GetHeader("User-Agent"),
		Description: description,
		Success:     true,
		Timestamp:   time.Now(),
	}

	// Set old values if provided
	if oldValues != nil {
		if err := auditLog.SetOldValues(oldValues); err != nil {
			return fmt.Errorf("failed to set old values: %v", err)
		}
	}

	// Set new values if provided
	if newValues != nil {
		if err := auditLog.SetNewValues(newValues); err != nil {
			return fmt.Errorf("failed to set new values: %v", err)
		}
	}

	// Set metadata if provided
	if metadata != nil {
		if err := auditLog.SetMetadata(metadata); err != nil {
			return fmt.Errorf("failed to set metadata: %v", err)
		}
	}

	return s.db.Create(auditLog).Error
}

// LogFailedActivity creates an audit log entry for failed operations
func (s *AuditService) LogFailedActivity(c *gin.Context, action models.AuditAction, entityType models.AuditEntityType, entityID uint, description string, errorMessage string, metadata interface{}) error {
	userID, exists := c.Get("user_id")
	if !exists {
		return fmt.Errorf("user ID not found in context")
	}

	auditLog := &models.AuditLog{
		Action:       action,
		EntityType:   entityType,
		EntityID:     entityID,
		UserID:       userID.(uint),
		IPAddress:    c.ClientIP(),
		UserAgent:    c.GetHeader("User-Agent"),
		Description:  description,
		Success:      false,
		ErrorMessage: errorMessage,
		Timestamp:    time.Now(),
	}

	// Set metadata if provided
	if metadata != nil {
		if err := auditLog.SetMetadata(metadata); err != nil {
			return fmt.Errorf("failed to set metadata: %v", err)
		}
	}

	return s.db.Create(auditLog).Error
}

// LogWithDuration creates an audit log entry with execution duration
func (s *AuditService) LogWithDuration(c *gin.Context, action models.AuditAction, entityType models.AuditEntityType, entityID uint, description string, duration time.Duration, oldValues, newValues, metadata interface{}) error {
	userID, exists := c.Get("user_id")
	if !exists {
		return fmt.Errorf("user ID not found in context")
	}

	auditLog := &models.AuditLog{
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		UserID:      userID.(uint),
		IPAddress:   c.ClientIP(),
		UserAgent:   c.GetHeader("User-Agent"),
		Description: description,
		Success:     true,
		Duration:    duration.Milliseconds(),
		Timestamp:   time.Now(),
	}

	// Set values
	if oldValues != nil {
		auditLog.SetOldValues(oldValues)
	}
	if newValues != nil {
		auditLog.SetNewValues(newValues)
	}
	if metadata != nil {
		auditLog.SetMetadata(metadata)
	}

	return s.db.Create(auditLog).Error
}

// GetAuditLogs retrieves audit logs with filtering and pagination
func (s *AuditService) GetAuditLogs(filters map[string]interface{}, page, limit int) ([]models.AuditLog, int64, error) {
	var auditLogs []models.AuditLog
	var total int64

	query := s.db.Model(&models.AuditLog{}).Preload("User")

	// Apply filters
	if userID, ok := filters["user_id"]; ok && userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if action, ok := filters["action"]; ok && action != "" {
		query = query.Where("action = ?", action)
	}

	if entityType, ok := filters["entity_type"]; ok && entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}

	if entityID, ok := filters["entity_id"]; ok && entityID != "" {
		query = query.Where("entity_id = ?", entityID)
	}

	if success, ok := filters["success"]; ok {
		query = query.Where("success = ?", success)
	}

	if startDate, ok := filters["start_date"]; ok && startDate != "" {
		query = query.Where("timestamp >= ?", startDate)
	}

	if endDate, ok := filters["end_date"]; ok && endDate != "" {
		query = query.Where("timestamp <= ?", endDate)
	}

	if ipAddress, ok := filters["ip_address"]; ok && ipAddress != "" {
		query = query.Where("ip_address = ?", ipAddress)
	}

	// Get total count
	query.Count(&total)

	// Apply pagination and ordering
	offset := (page - 1) * limit
	err := query.Order("timestamp DESC").Offset(offset).Limit(limit).Find(&auditLogs).Error

	return auditLogs, total, err
}

// GetUserActivity retrieves user activity summary
func (s *AuditService) GetUserActivity(userID uint, startDate, endDate time.Time) (*models.UserActivity, error) {
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}

	activity := &models.UserActivity{
		UserID:   userID,
		UserName: user.Name,
		UserRole: user.Role,
	}

	// Get last activity
	var lastLog models.AuditLog
	if err := s.db.Where("user_id = ? AND timestamp BETWEEN ? AND ?", userID, startDate, endDate).
		Order("timestamp DESC").First(&lastLog).Error; err == nil {
		activity.LastActivity = lastLog.Timestamp
	}

	// Get total actions
	s.db.Model(&models.AuditLog{}).Where("user_id = ? AND timestamp BETWEEN ? AND ?", userID, startDate, endDate).
		Count(&activity.TotalActions)

	// Get document actions
	s.db.Model(&models.AuditLog{}).Where("user_id = ? AND entity_type IN (?, ?) AND timestamp BETWEEN ? AND ?",
		userID, models.AuditEntityIncomingDocument, models.AuditEntityOutgoingDocument, startDate, endDate).
		Count(&activity.DocumentActions)

	// Get task actions
	s.db.Model(&models.AuditLog{}).Where("user_id = ? AND entity_type = ? AND timestamp BETWEEN ? AND ?",
		userID, models.AuditEntityTask, startDate, endDate).
		Count(&activity.TaskActions)

	// Get login count
	s.db.Model(&models.AuditLog{}).Where("user_id = ? AND action = ? AND timestamp BETWEEN ? AND ?",
		userID, models.AuditActionUserLogin, startDate, endDate).
		Count(&activity.LoginCount)

	// Get failed actions
	s.db.Model(&models.AuditLog{}).Where("user_id = ? AND success = false AND timestamp BETWEEN ? AND ?",
		userID, startDate, endDate).
		Count(&activity.FailedActions)

	return activity, nil
}

// GetDocumentAuditTrail retrieves complete audit trail for a document
func (s *AuditService) GetDocumentAuditTrail(entityType models.AuditEntityType, documentID uint) ([]models.AuditLog, error) {
	var auditLogs []models.AuditLog

	err := s.db.Where("entity_type = ? AND entity_id = ?", entityType, documentID).
		Preload("User").
		Order("timestamp ASC").
		Find(&auditLogs).Error

	return auditLogs, err
}

// GetDocumentAuditSummary retrieves document processing summary with audit information
func (s *AuditService) GetDocumentAuditSummary(entityType models.AuditEntityType, startDate, endDate time.Time) ([]models.DocumentAuditSummary, error) {
	var summaries []models.DocumentAuditSummary

	query := `
		SELECT 
			d.id as document_id,
			dt.name as document_type,
			COALESCE(d.original_number, d.document_number) as document_number,
			d.summary,
			d.created_at,
			creator.name as created_by,
			d.status as current_status,
			processor.name as processor_name,
			COUNT(al.id) as total_actions,
			MAX(al.timestamp) as last_activity,
			EXTRACT(EPOCH FROM (COALESCE(d.updated_at, NOW()) - d.created_at))/3600 as processing_time
		FROM %s d
		LEFT JOIN document_types dt ON d.document_type_id = dt.id
		LEFT JOIN users creator ON d.created_by_id = creator.id
		LEFT JOIN users processor ON d.processor_id = processor.id OR d.drafter_id = processor.id
		LEFT JOIN audit_logs al ON al.entity_type = ? AND al.entity_id = d.id
		WHERE d.created_at BETWEEN ? AND ?
		GROUP BY d.id, dt.name, d.original_number, d.document_number, d.summary, d.created_at, creator.name, d.status, processor.name, d.updated_at
		ORDER BY d.created_at DESC
	`

	tableName := "incoming_documents"
	if entityType == models.AuditEntityOutgoingDocument {
		tableName = "outgoing_documents"
	}

	err := s.db.Raw(fmt.Sprintf(query, tableName), entityType, startDate, endDate).Scan(&summaries).Error
	return summaries, err
}

// GetTaskAuditSummary retrieves task processing summary with audit information
func (s *AuditService) GetTaskAuditSummary(startDate, endDate time.Time) ([]models.TaskAuditSummary, error) {
	var summaries []models.TaskAuditSummary

	query := `
		SELECT 
			t.id as task_id,
			t.description,
			t.created_at,
			creator.name as created_by,
			assignee.name as assigned_to,
			t.status as current_status,
			t.deadline,
			t.completion_date as completed_at,
			COUNT(al.id) as total_actions,
			CASE 
				WHEN t.completion_date IS NOT NULL THEN 
					EXTRACT(EPOCH FROM (t.completion_date - t.created_at))/3600
				ELSE 
					EXTRACT(EPOCH FROM (NOW() - t.created_at))/3600
			END as processing_time
		FROM tasks t
		LEFT JOIN users creator ON t.created_by_id = creator.id
		LEFT JOIN users assignee ON t.assigned_to_id = assignee.id
		LEFT JOIN audit_logs al ON al.entity_type = ? AND al.entity_id = t.id
		WHERE t.created_at BETWEEN ? AND ?
		GROUP BY t.id, t.description, t.created_at, creator.name, assignee.name, t.status, t.deadline, t.completion_date
		ORDER BY t.created_at DESC
	`

	err := s.db.Raw(query, models.AuditEntityTask, startDate, endDate).Scan(&summaries).Error
	return summaries, err
}

// GetSystemStatistics retrieves system-wide audit statistics
func (s *AuditService) GetSystemStatistics(startDate, endDate time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total activities
	var totalActivities int64
	s.db.Model(&models.AuditLog{}).Where("timestamp BETWEEN ? AND ?", startDate, endDate).Count(&totalActivities)
	stats["total_activities"] = totalActivities

	// Activities by action type
	var actionStats []struct {
		Action string `json:"action"`
		Count  int64  `json:"count"`
	}
	s.db.Model(&models.AuditLog{}).
		Select("action, COUNT(*) as count").
		Where("timestamp BETWEEN ? AND ?", startDate, endDate).
		Group("action").
		Order("count DESC").
		Scan(&actionStats)
	stats["action_statistics"] = actionStats

	// Activities by entity type
	var entityStats []struct {
		EntityType string `json:"entity_type"`
		Count      int64  `json:"count"`
	}
	s.db.Model(&models.AuditLog{}).
		Select("entity_type, COUNT(*) as count").
		Where("timestamp BETWEEN ? AND ?", startDate, endDate).
		Group("entity_type").
		Order("count DESC").
		Scan(&entityStats)
	stats["entity_statistics"] = entityStats

	// Most active users
	var userStats []struct {
		UserID   uint   `json:"user_id"`
		UserName string `json:"user_name"`
		Count    int64  `json:"count"`
	}
	s.db.Table("audit_logs").
		Select("audit_logs.user_id, users.name as user_name, COUNT(*) as count").
		Joins("LEFT JOIN users ON audit_logs.user_id = users.id").
		Where("audit_logs.timestamp BETWEEN ? AND ?", startDate, endDate).
		Group("audit_logs.user_id, users.name").
		Order("count DESC").
		Limit(10).
		Scan(&userStats)
	stats["user_statistics"] = userStats

	// Failed activities
	var failedActivities int64
	s.db.Model(&models.AuditLog{}).Where("success = false AND timestamp BETWEEN ? AND ?", startDate, endDate).Count(&failedActivities)
	stats["failed_activities"] = failedActivities

	// Average processing time
	var avgProcessingTime float64
	s.db.Model(&models.AuditLog{}).
		Where("duration > 0 AND timestamp BETWEEN ? AND ?", startDate, endDate).
		Select("AVG(duration)").
		Row().Scan(&avgProcessingTime)
	stats["average_processing_time"] = avgProcessingTime

	return stats, nil
}

// CleanupOldAuditLogs removes audit logs older than the specified number of days
func (s *AuditService) CleanupOldAuditLogs(daysToKeep int) error {
	cutoffDate := time.Now().AddDate(0, 0, -daysToKeep)
	return s.db.Where("created_at < ?", cutoffDate).Delete(&models.AuditLog{}).Error
}

// ExportAuditLogs exports audit logs to CSV format
func (s *AuditService) ExportAuditLogs(filters map[string]interface{}) ([][]string, error) {
	auditLogs, _, err := s.GetAuditLogs(filters, 1, 10000) // Get up to 10k records for export
	if err != nil {
		return nil, err
	}

	// CSV headers
	records := [][]string{
		{"Timestamp", "User", "Action", "Entity Type", "Entity ID", "Description", "Success", "IP Address", "Duration (ms)"},
	}

	// Add data rows
	for _, log := range auditLogs {
		record := []string{
			log.Timestamp.Format("2006-01-02 15:04:05"),
			log.User.Name,
			string(log.Action),
			string(log.EntityType),
			fmt.Sprintf("%d", log.EntityID),
			log.Description,
			fmt.Sprintf("%t", log.Success),
			log.IPAddress,
			fmt.Sprintf("%d", log.Duration),
		}
		records = append(records, record)
	}

	return records, nil
}
