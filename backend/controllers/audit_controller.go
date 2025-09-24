package controllers

import (
	"ai-code-agent-backend/models"
	"ai-code-agent-backend/services"
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type AuditController struct {
	auditService *services.AuditService
}

func NewAuditController() *AuditController {
	return &AuditController{
		auditService: services.NewAuditService(),
	}
}

// GetAuditLogs retrieves audit logs with filtering and pagination
// @Summary Get audit logs
// @Description Retrieve audit logs with optional filtering
// @Tags audit
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param user_id query int false "Filter by user ID"
// @Param action query string false "Filter by action"
// @Param entity_type query string false "Filter by entity type"
// @Param entity_id query int false "Filter by entity ID"
// @Param success query bool false "Filter by success status"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param ip_address query string false "Filter by IP address"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/audit/logs [get]
func (ac *AuditController) GetAuditLogs(c *gin.Context) {
	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Build filters
	filters := make(map[string]interface{})

	if userID := c.Query("user_id"); userID != "" {
		filters["user_id"] = userID
	}

	if action := c.Query("action"); action != "" {
		filters["action"] = action
	}

	if entityType := c.Query("entity_type"); entityType != "" {
		filters["entity_type"] = entityType
	}

	if entityID := c.Query("entity_id"); entityID != "" {
		filters["entity_id"] = entityID
	}

	if success := c.Query("success"); success != "" {
		if success == "true" {
			filters["success"] = true
		} else if success == "false" {
			filters["success"] = false
		}
	}

	if startDate := c.Query("start_date"); startDate != "" {
		filters["start_date"] = startDate + " 00:00:00"
	}

	if endDate := c.Query("end_date"); endDate != "" {
		filters["end_date"] = endDate + " 23:59:59"
	}

	if ipAddress := c.Query("ip_address"); ipAddress != "" {
		filters["ip_address"] = ipAddress
	}

	// Get audit logs
	auditLogs, total, err := ac.auditService.GetAuditLogs(filters, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve audit logs",
			"details": err.Error(),
		})
		return
	}

	// Calculate pagination info
	totalPages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"audit_logs": auditLogs,
		"pagination": gin.H{
			"current_page":   page,
			"total_pages":    totalPages,
			"total_items":    total,
			"items_per_page": limit,
		},
	})
}

// GetUserActivity retrieves user activity summary
// @Summary Get user activity
// @Description Retrieve user activity summary for a specific user
// @Tags audit
// @Accept json
// @Produce json
// @Param user_id path int true "User ID"
// @Param start_date query string false "Start date (YYYY-MM-DD)" default("2024-01-01")
// @Param end_date query string false "End date (YYYY-MM-DD)" default("2024-12-31")
// @Success 200 {object} models.UserActivity
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/audit/user-activity/{user_id} [get]
func (ac *AuditController) GetUserActivity(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// Parse date range
	startDateStr := c.DefaultQuery("start_date", "2024-01-01")
	endDateStr := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid start date format. Use YYYY-MM-DD",
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid end date format. Use YYYY-MM-DD",
		})
		return
	}

	// Add time to end date to include the entire day
	endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	activity, err := ac.auditService.GetUserActivity(uint(userID), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve user activity",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, activity)
}

// GetDocumentAuditTrail retrieves complete audit trail for a document
// @Summary Get document audit trail
// @Description Retrieve complete audit trail for a specific document
// @Tags audit
// @Accept json
// @Produce json
// @Param entity_type path string true "Entity type (incoming_document or outgoing_document)"
// @Param document_id path int true "Document ID"
// @Success 200 {array} models.AuditLog
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/audit/document-trail/{entity_type}/{document_id} [get]
func (ac *AuditController) GetDocumentAuditTrail(c *gin.Context) {
	entityTypeStr := c.Param("entity_type")
	documentIDStr := c.Param("document_id")

	// Validate entity type
	var entityType models.AuditEntityType
	switch entityTypeStr {
	case "incoming_document":
		entityType = models.AuditEntityIncomingDocument
	case "outgoing_document":
		entityType = models.AuditEntityOutgoingDocument
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid entity type. Must be 'incoming_document' or 'outgoing_document'",
		})
		return
	}

	documentID, err := strconv.ParseUint(documentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid document ID",
		})
		return
	}

	auditTrail, err := ac.auditService.GetDocumentAuditTrail(entityType, uint(documentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve document audit trail",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"audit_trail": auditTrail,
	})
}

// GetDocumentAuditSummary retrieves document processing summary
// @Summary Get document audit summary
// @Description Retrieve document processing summary with audit information
// @Tags audit
// @Accept json
// @Produce json
// @Param entity_type query string true "Entity type (incoming_document or outgoing_document)"
// @Param start_date query string false "Start date (YYYY-MM-DD)" default("2024-01-01")
// @Param end_date query string false "End date (YYYY-MM-DD)" default("2024-12-31")
// @Success 200 {array} models.DocumentAuditSummary
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/audit/document-summary [get]
func (ac *AuditController) GetDocumentAuditSummary(c *gin.Context) {
	entityTypeStr := c.Query("entity_type")

	// Validate entity type
	var entityType models.AuditEntityType
	switch entityTypeStr {
	case "incoming_document":
		entityType = models.AuditEntityIncomingDocument
	case "outgoing_document":
		entityType = models.AuditEntityOutgoingDocument
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid entity type. Must be 'incoming_document' or 'outgoing_document'",
		})
		return
	}

	// Parse date range
	startDateStr := c.DefaultQuery("start_date", "2024-01-01")
	endDateStr := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid start date format. Use YYYY-MM-DD",
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid end date format. Use YYYY-MM-DD",
		})
		return
	}

	// Add time to end date to include the entire day
	endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	summary, err := ac.auditService.GetDocumentAuditSummary(entityType, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve document audit summary",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"document_summary": summary,
	})
}

// GetTaskAuditSummary retrieves task processing summary
// @Summary Get task audit summary
// @Description Retrieve task processing summary with audit information
// @Tags audit
// @Accept json
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)" default("2024-01-01")
// @Param end_date query string false "End date (YYYY-MM-DD)" default("2024-12-31")
// @Success 200 {array} models.TaskAuditSummary
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/audit/task-summary [get]
func (ac *AuditController) GetTaskAuditSummary(c *gin.Context) {
	// Parse date range
	startDateStr := c.DefaultQuery("start_date", "2024-01-01")
	endDateStr := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid start date format. Use YYYY-MM-DD",
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid end date format. Use YYYY-MM-DD",
		})
		return
	}

	// Add time to end date to include the entire day
	endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	summary, err := ac.auditService.GetTaskAuditSummary(startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve task audit summary",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"task_summary": summary,
	})
}

// GetSystemStatistics retrieves system-wide audit statistics
// @Summary Get system statistics
// @Description Retrieve system-wide audit statistics
// @Tags audit
// @Accept json
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)" default("2024-01-01")
// @Param end_date query string false "End date (YYYY-MM-DD)" default("2024-12-31")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/audit/statistics [get]
func (ac *AuditController) GetSystemStatistics(c *gin.Context) {
	// Parse date range
	startDateStr := c.DefaultQuery("start_date", "2024-01-01")
	endDateStr := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid start date format. Use YYYY-MM-DD",
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid end date format. Use YYYY-MM-DD",
		})
		return
	}

	// Add time to end date to include the entire day
	endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	statistics, err := ac.auditService.GetSystemStatistics(startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve system statistics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, statistics)
}

// ExportAuditLogs exports audit logs to CSV
// @Summary Export audit logs
// @Description Export audit logs to CSV format
// @Tags audit
// @Accept json
// @Produce text/csv
// @Param user_id query int false "Filter by user ID"
// @Param action query string false "Filter by action"
// @Param entity_type query string false "Filter by entity type"
// @Param entity_id query int false "Filter by entity ID"
// @Param success query bool false "Filter by success status"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param ip_address query string false "Filter by IP address"
// @Success 200 {file} csv
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/audit/export [get]
func (ac *AuditController) ExportAuditLogs(c *gin.Context) {
	// Build filters (same as GetAuditLogs)
	filters := make(map[string]interface{})

	if userID := c.Query("user_id"); userID != "" {
		filters["user_id"] = userID
	}

	if action := c.Query("action"); action != "" {
		filters["action"] = action
	}

	if entityType := c.Query("entity_type"); entityType != "" {
		filters["entity_type"] = entityType
	}

	if entityID := c.Query("entity_id"); entityID != "" {
		filters["entity_id"] = entityID
	}

	if success := c.Query("success"); success != "" {
		if success == "true" {
			filters["success"] = true
		} else if success == "false" {
			filters["success"] = false
		}
	}

	if startDate := c.Query("start_date"); startDate != "" {
		filters["start_date"] = startDate + " 00:00:00"
	}

	if endDate := c.Query("end_date"); endDate != "" {
		filters["end_date"] = endDate + " 23:59:59"
	}

	if ipAddress := c.Query("ip_address"); ipAddress != "" {
		filters["ip_address"] = ipAddress
	}

	// Export audit logs
	records, err := ac.auditService.ExportAuditLogs(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to export audit logs",
			"details": err.Error(),
		})
		return
	}

	// Set CSV headers
	filename := fmt.Sprintf("audit_logs_%s.csv", time.Now().Format("2006-01-02_15-04-05"))
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	// Write CSV data
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	for _, record := range records {
		if err := writer.Write(record); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to write CSV data",
			})
			return
		}
	}
}

// CleanupOldAuditLogs removes old audit logs
// @Summary Cleanup old audit logs
// @Description Remove audit logs older than specified days (Admin only)
// @Tags audit
// @Accept json
// @Produce json
// @Param days query int false "Days to keep" default(365)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/audit/cleanup [delete]
func (ac *AuditController) CleanupOldAuditLogs(c *gin.Context) {
	// Check if user is admin
	userRole, exists := c.Get("user_role")
	if !exists || userRole.(string) != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only administrators can cleanup audit logs",
		})
		return
	}

	daysToKeep, err := strconv.Atoi(c.DefaultQuery("days", "365"))
	if err != nil || daysToKeep < 30 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid days parameter. Must be at least 30 days",
		})
		return
	}

	err = ac.auditService.CleanupOldAuditLogs(daysToKeep)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to cleanup audit logs",
			"details": err.Error(),
		})
		return
	}

	// Log the cleanup action
	ac.auditService.LogActivity(c, models.AuditActionSystemConfig, models.AuditEntitySystem, 0,
		fmt.Sprintf("Cleaned up audit logs older than %d days", daysToKeep), nil, nil,
		map[string]interface{}{"days_to_keep": daysToKeep})

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Successfully cleaned up audit logs older than %d days", daysToKeep),
	})
}
