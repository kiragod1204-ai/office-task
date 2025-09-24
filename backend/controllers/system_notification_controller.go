package controllers

import (
	"net/http"
	"strconv"
	"time"

	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

type SystemNotificationController struct{}

func NewSystemNotificationController() *SystemNotificationController {
	return &SystemNotificationController{}
}

type CreateNotificationRequest struct {
	Title     string     `json:"title" binding:"required"`
	Content   string     `json:"content" binding:"required"`
	Type      string     `json:"type" binding:"required"`
	ExpiresAt *time.Time `json:"expires_at"`
}

type UpdateNotificationRequest struct {
	Title     string     `json:"title"`
	Content   string     `json:"content"`
	Type      string     `json:"type"`
	IsActive  *bool      `json:"is_active"`
	ExpiresAt *time.Time `json:"expires_at"`
}

// CreateNotification creates a new system notification
func (c *SystemNotificationController) CreateNotification(ctx *gin.Context) {
	var req CreateNotificationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate notification type
	validTypes := []string{models.NotificationTypeMaintenance, models.NotificationTypeUpgrade, models.NotificationTypeActionRequired}
	isValidType := false
	for _, validType := range validTypes {
		if req.Type == validType {
			isValidType = true
			break
		}
	}
	if !isValidType {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification type"})
		return
	}

	// Get user ID from context
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	notification := models.SystemNotification{
		Title:       req.Title,
		Content:     req.Content,
		Type:        req.Type,
		IsActive:    true,
		ExpiresAt:   req.ExpiresAt,
		CreatedByID: userID.(uint),
	}

	if err := database.DB.Create(&notification).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	// Load the created notification with relations
	database.DB.Preload("CreatedBy").First(&notification, notification.ID)

	ctx.JSON(http.StatusCreated, notification)
}

// GetNotifications retrieves all notifications with optional filtering
func (c *SystemNotificationController) GetNotifications(ctx *gin.Context) {
	var notifications []models.SystemNotification
	query := database.DB.Preload("CreatedBy")

	// Filter by active status
	if activeStr := ctx.Query("active"); activeStr != "" {
		if active, err := strconv.ParseBool(activeStr); err == nil {
			query = query.Where("is_active = ?", active)
		}
	}

	// Filter by type
	if notificationType := ctx.Query("type"); notificationType != "" {
		query = query.Where("type = ?", notificationType)
	}

	// Filter by expiration (only non-expired)
	if ctx.Query("non_expired") == "true" {
		query = query.Where("expires_at IS NULL OR expires_at > ?", time.Now())
	}

	if err := query.Order("created_at DESC").Find(&notifications).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notifications"})
		return
	}

	ctx.JSON(http.StatusOK, notifications)
}

// GetActiveNotifications retrieves all active, non-expired notifications for display
func (c *SystemNotificationController) GetActiveNotifications(ctx *gin.Context) {
	var notifications []models.SystemNotification

	query := database.DB.Where("is_active = ?", true).
		Where("expires_at IS NULL OR expires_at > ?", time.Now()).
		Order("created_at DESC")

	if err := query.Find(&notifications).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve active notifications"})
		return
	}

	ctx.JSON(http.StatusOK, notifications)
}

// GetNotification retrieves a specific notification by ID
func (c *SystemNotificationController) GetNotification(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	var notification models.SystemNotification
	if err := database.DB.Preload("CreatedBy").First(&notification, uint(id)).Error; err != nil {
		if gorm.IsRecordNotFoundError(err) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notification"})
		return
	}

	ctx.JSON(http.StatusOK, notification)
}

// UpdateNotification updates an existing notification
func (c *SystemNotificationController) UpdateNotification(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	var req UpdateNotificationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var notification models.SystemNotification
	if err := database.DB.First(&notification, uint(id)).Error; err != nil {
		if gorm.IsRecordNotFoundError(err) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find notification"})
		return
	}

	// Update fields if provided
	if req.Title != "" {
		notification.Title = req.Title
	}
	if req.Content != "" {
		notification.Content = req.Content
	}
	if req.Type != "" {
		// Validate notification type
		validTypes := []string{models.NotificationTypeMaintenance, models.NotificationTypeUpgrade, models.NotificationTypeActionRequired}
		isValidType := false
		for _, validType := range validTypes {
			if req.Type == validType {
				isValidType = true
				break
			}
		}
		if !isValidType {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification type"})
			return
		}
		notification.Type = req.Type
	}
	if req.IsActive != nil {
		notification.IsActive = *req.IsActive
	}
	if req.ExpiresAt != nil {
		notification.ExpiresAt = req.ExpiresAt
	}

	if err := database.DB.Save(&notification).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	// Load the updated notification with relations
	database.DB.Preload("CreatedBy").First(&notification, notification.ID)

	ctx.JSON(http.StatusOK, notification)
}

// DeleteNotification soft deletes a notification
func (c *SystemNotificationController) DeleteNotification(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	var notification models.SystemNotification
	if err := database.DB.First(&notification, uint(id)).Error; err != nil {
		if gorm.IsRecordNotFoundError(err) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find notification"})
		return
	}

	if err := database.DB.Delete(&notification).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Notification deleted successfully"})
}

// DeactivateNotification deactivates a notification without deleting it
func (c *SystemNotificationController) DeactivateNotification(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	var notification models.SystemNotification
	if err := database.DB.First(&notification, uint(id)).Error; err != nil {
		if gorm.IsRecordNotFoundError(err) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find notification"})
		return
	}

	notification.IsActive = false
	if err := database.DB.Save(&notification).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate notification"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Notification deactivated successfully"})
}

// CleanupExpiredNotifications removes expired notifications (can be called periodically)
func (c *SystemNotificationController) CleanupExpiredNotifications() error {
	return database.DB.Where("expires_at IS NOT NULL AND expires_at < ?", time.Now()).
		Delete(&models.SystemNotification{}).Error
}
