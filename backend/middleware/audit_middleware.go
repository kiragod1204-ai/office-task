package middleware

import (
	"ai-code-agent-backend/models"
	"ai-code-agent-backend/services"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// AuditMiddleware creates middleware for automatic audit logging
func AuditMiddleware() gin.HandlerFunc {
	auditService := services.NewAuditService()

	return func(c *gin.Context) {
		// Skip audit logging for certain endpoints
		if shouldSkipAudit(c.Request.URL.Path) {
			c.Next()
			return
		}

		// Record start time
		startTime := time.Now()

		// Capture request body for POST/PUT requests
		var requestBody []byte
		if c.Request.Method == "POST" || c.Request.Method == "PUT" {
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Create a custom response writer to capture response
		responseWriter := &responseBodyWriter{
			ResponseWriter: c.Writer,
			body:           &bytes.Buffer{},
		}
		c.Writer = responseWriter

		// Process request
		c.Next()

		// Calculate duration
		duration := time.Since(startTime)

		// Determine audit action and entity type based on the endpoint
		action, entityType, entityID := determineAuditInfo(c)

		if action != "" {
			// Get user ID from context
			_, exists := c.Get("user_id")
			if !exists {
				return // Skip if no user context
			}

			// Prepare audit log data
			description := generateDescription(c, action)

			// Parse request and response data
			var oldValues, newValues interface{}
			if c.Request.Method == "PUT" && len(requestBody) > 0 {
				// For updates, try to get old values (this would need to be implemented per controller)
				json.Unmarshal(requestBody, &newValues)
			} else if c.Request.Method == "POST" && len(requestBody) > 0 {
				json.Unmarshal(requestBody, &newValues)
			}

			// Prepare metadata
			metadata := map[string]interface{}{
				"method":      c.Request.Method,
				"endpoint":    c.Request.URL.Path,
				"status_code": c.Writer.Status(),
				"user_agent":  c.GetHeader("User-Agent"),
			}

			// Log the activity
			if c.Writer.Status() >= 400 {
				// Log as failed activity
				errorMessage := "Request failed"
				if responseWriter.body.Len() > 0 {
					var errorResponse map[string]interface{}
					if err := json.Unmarshal(responseWriter.body.Bytes(), &errorResponse); err == nil {
						if msg, ok := errorResponse["error"].(string); ok {
							errorMessage = msg
						}
					}
				}
				auditService.LogFailedActivity(c, action, entityType, entityID, description, errorMessage, metadata)
			} else {
				// Log as successful activity
				auditService.LogWithDuration(c, action, entityType, entityID, description, duration, oldValues, newValues, metadata)
			}
		}
	}
}

// responseBodyWriter captures response body for audit logging
type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (r responseBodyWriter) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

// shouldSkipAudit determines if audit logging should be skipped for certain endpoints
func shouldSkipAudit(path string) bool {
	skipPaths := []string{
		"/api/audit/",
		"/api/dashboard/",
		"/api/profile",
		"/api/files/download",
		"/api/files/thumbnail",
	}

	for _, skipPath := range skipPaths {
		if strings.Contains(path, skipPath) {
			return true
		}
	}

	return false
}

// determineAuditInfo determines the audit action, entity type, and entity ID based on the request
func determineAuditInfo(c *gin.Context) (models.AuditAction, models.AuditEntityType, uint) {
	path := c.Request.URL.Path
	method := c.Request.Method

	// Document operations
	if strings.Contains(path, "/incoming-documents") {
		switch method {
		case "POST":
			return models.AuditActionDocumentCreate, models.AuditEntityIncomingDocument, 0
		case "PUT":
			if strings.Contains(path, "/assign") {
				return models.AuditActionDocumentAssign, models.AuditEntityIncomingDocument, extractIDFromPath(path)
			}
			return models.AuditActionDocumentUpdate, models.AuditEntityIncomingDocument, extractIDFromPath(path)
		case "DELETE":
			return models.AuditActionDocumentDelete, models.AuditEntityIncomingDocument, extractIDFromPath(path)
		}
	}

	if strings.Contains(path, "/outgoing-documents") {
		switch method {
		case "POST":
			return models.AuditActionDocumentCreate, models.AuditEntityOutgoingDocument, 0
		case "PUT":
			return models.AuditActionDocumentUpdate, models.AuditEntityOutgoingDocument, extractIDFromPath(path)
		case "DELETE":
			return models.AuditActionDocumentDelete, models.AuditEntityOutgoingDocument, extractIDFromPath(path)
		}
	}

	// Task operations
	if strings.Contains(path, "/tasks") {
		switch method {
		case "POST":
			if strings.Contains(path, "/forward") {
				return models.AuditActionTaskForward, models.AuditEntityTask, extractIDFromPath(path)
			} else if strings.Contains(path, "/delegate") {
				return models.AuditActionTaskDelegate, models.AuditEntityTask, extractIDFromPath(path)
			}
			return models.AuditActionTaskCreate, models.AuditEntityTask, 0
		case "PUT":
			if strings.Contains(path, "/assign") {
				return models.AuditActionTaskAssign, models.AuditEntityTask, extractIDFromPath(path)
			} else if strings.Contains(path, "/status") {
				return models.AuditActionTaskUpdate, models.AuditEntityTask, extractIDFromPath(path)
			}
			return models.AuditActionTaskUpdate, models.AuditEntityTask, extractIDFromPath(path)
		case "DELETE":
			return models.AuditActionTaskDelete, models.AuditEntityTask, extractIDFromPath(path)
		}
	}

	// User operations
	if strings.Contains(path, "/users") && method != "GET" {
		switch method {
		case "POST":
			return models.AuditActionUserCreate, models.AuditEntityUser, 0
		case "PUT":
			return models.AuditActionUserUpdate, models.AuditEntityUser, extractIDFromPath(path)
		case "DELETE":
			return models.AuditActionUserDelete, models.AuditEntityUser, extractIDFromPath(path)
		}
	}

	// File operations
	if strings.Contains(path, "/files") {
		switch method {
		case "POST":
			return models.AuditActionFileUpload, models.AuditEntityFile, 0
		case "DELETE":
			return models.AuditActionFileDelete, models.AuditEntityFile, 0
		}
	}

	// System configuration operations
	if (strings.Contains(path, "/document-types") ||
		strings.Contains(path, "/issuing-units") ||
		strings.Contains(path, "/receiving-units") ||
		strings.Contains(path, "/notifications")) && method != "GET" {
		return models.AuditActionSystemConfig, models.AuditEntitySystem, extractIDFromPath(path)
	}

	return "", "", 0
}

// extractIDFromPath extracts the ID from the URL path
func extractIDFromPath(path string) uint {
	parts := strings.Split(path, "/")
	for i, part := range parts {
		if (part == "incoming-documents" || part == "outgoing-documents" ||
			part == "tasks" || part == "users" || part == "files") && i+1 < len(parts) {
			// Try to parse the next part as ID
			if id := parseUint(parts[i+1]); id > 0 {
				return id
			}
		}
	}
	return 0
}

// parseUint safely parses a string to uint
func parseUint(s string) uint {
	// Simple parsing - in production, you might want to use strconv.ParseUint
	var result uint
	for _, r := range s {
		if r >= '0' && r <= '9' {
			result = result*10 + uint(r-'0')
		} else {
			return 0 // Not a valid number
		}
	}
	return result
}

// generateDescription generates a human-readable description for the audit log
func generateDescription(c *gin.Context, action models.AuditAction) string {
	path := c.Request.URL.Path
	method := c.Request.Method

	switch action {
	case models.AuditActionDocumentCreate:
		if strings.Contains(path, "incoming") {
			return "Created new incoming document"
		}
		return "Created new outgoing document"
	case models.AuditActionDocumentUpdate:
		if strings.Contains(path, "incoming") {
			return "Updated incoming document"
		}
		return "Updated outgoing document"
	case models.AuditActionDocumentDelete:
		if strings.Contains(path, "incoming") {
			return "Deleted incoming document"
		}
		return "Deleted outgoing document"
	case models.AuditActionDocumentAssign:
		return "Assigned document processor"
	case models.AuditActionTaskCreate:
		return "Created new task"
	case models.AuditActionTaskUpdate:
		if strings.Contains(path, "status") {
			return "Updated task status"
		}
		return "Updated task"
	case models.AuditActionTaskDelete:
		return "Deleted task"
	case models.AuditActionTaskAssign:
		return "Assigned task"
	case models.AuditActionTaskForward:
		return "Forwarded task"
	case models.AuditActionTaskDelegate:
		return "Delegated task"
	case models.AuditActionUserCreate:
		return "Created new user"
	case models.AuditActionUserUpdate:
		return "Updated user information"
	case models.AuditActionUserDelete:
		return "Deleted user"
	case models.AuditActionFileUpload:
		return "Uploaded file"
	case models.AuditActionFileDelete:
		return "Deleted file"
	case models.AuditActionSystemConfig:
		return "Updated system configuration"
	default:
		return fmt.Sprintf("%s %s", method, path)
	}
}
