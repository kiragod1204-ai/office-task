package controllers

import (
	"ai-code-agent-backend/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetFilterPresets returns common filter presets for different entity types
func GetFilterPresets(c *gin.Context) {
	presets := services.GetFilterPresets()
	c.JSON(http.StatusOK, gin.H{
		"presets": presets,
	})
}

// GetSearchSuggestions provides autocomplete suggestions for search queries
func GetSearchSuggestions(c *gin.Context) {
	searchType := c.Query("type")
	query := c.Query("q")
	limitStr := c.DefaultQuery("limit", "10")

	if searchType == "" || query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters: type and q"})
		return
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 10
	}

	suggestions, err := services.GetSearchSuggestions(searchType, query, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy gợi ý tìm kiếm"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"suggestions": suggestions,
	})
}

// GetFilterOptions returns available filter options for different entity types
func GetFilterOptions(c *gin.Context) {
	entityType := c.Query("type")

	if entityType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameter: type"})
		return
	}

	var options map[string]interface{}

	switch entityType {
	case "incoming_documents":
		options = map[string]interface{}{
			"statuses": []string{
				"received",
				"forwarded",
				"assigned",
				"processing",
				"completed",
			},
			"sort_fields": []string{
				"arrival_date",
				"arrival_number",
				"document_date",
				"created_at",
				"updated_at",
			},
		}
	case "outgoing_documents":
		options = map[string]interface{}{
			"statuses": []string{
				"draft",
				"review",
				"approved",
				"sent",
				"rejected",
			},
			"sort_fields": []string{
				"issue_date",
				"document_number",
				"created_at",
				"updated_at",
			},
		}
	case "tasks":
		options = map[string]interface{}{
			"statuses": []string{
				"Chưa bắt đầu",
				"Đang xử lí",
				"Xem xét",
				"Hoàn thành",
				"Tiếp nhận văn bản",
			},
			"task_types": []string{
				"document_linked",
				"independent",
			},
			"deadline_types": []string{
				"specific",
				"monthly",
				"quarterly",
				"yearly",
			},
			"urgency_levels": []string{
				"critical",
				"urgent",
				"high",
				"medium",
				"normal",
			},
			"sort_fields": []string{
				"created_at",
				"updated_at",
				"deadline",
				"status",
				"description",
			},
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity type"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"options": options,
	})
}

// SavedFilter represents a user's saved filter configuration
type SavedFilter struct {
	ID         uint                   `json:"id" gorm:"primary_key"`
	UserID     uint                   `json:"user_id" gorm:"not null"`
	Name       string                 `json:"name" gorm:"not null"`
	EntityType string                 `json:"entity_type" gorm:"not null"` // "incoming_documents", "outgoing_documents", "tasks"
	Filters    map[string]interface{} `json:"filters" gorm:"type:jsonb"`
	IsDefault  bool                   `json:"is_default" gorm:"default:false"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

// Note: The SavedFilter model should be added to the models package and migrated
// For now, we'll implement the endpoints but they won't work until the model is properly set up

// GetSavedFilters returns user's saved filter configurations
func GetSavedFilters(c *gin.Context) {
	// userID, _ := c.Get("user_id")
	entityType := c.Query("type")

	// TODO: Implement when SavedFilter model is added to database
	// For now, return empty array
	c.JSON(http.StatusOK, gin.H{
		"saved_filters": []interface{}{},
		"entity_type":   entityType,
	})
}

// SaveFilter saves a filter configuration for the user
func SaveFilter(c *gin.Context) {
	// userID, _ := c.Get("user_id")

	var req struct {
		Name       string                 `json:"name" binding:"required"`
		EntityType string                 `json:"entity_type" binding:"required"`
		Filters    map[string]interface{} `json:"filters" binding:"required"`
		IsDefault  bool                   `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	// TODO: Implement when SavedFilter model is added to database
	// For now, return success message
	c.JSON(http.StatusCreated, gin.H{
		"message": "Filter saved successfully",
		"filter": map[string]interface{}{
			"name":        req.Name,
			"entity_type": req.EntityType,
			"filters":     req.Filters,
			"is_default":  req.IsDefault,
		},
	})
}

// DeleteSavedFilter deletes a user's saved filter
func DeleteSavedFilter(c *gin.Context) {
	// userID, _ := c.Get("user_id")
	// filterID := c.Param("id")

	// TODO: Implement when SavedFilter model is added to database
	// For now, return success message
	c.JSON(http.StatusOK, gin.H{
		"message": "Filter deleted successfully",
	})
}
