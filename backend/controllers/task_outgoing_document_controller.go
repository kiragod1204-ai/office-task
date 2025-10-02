package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateTaskOutgoingDocumentRequest struct {
	OutgoingDocumentID uint   `json:"outgoing_document_id" binding:"required"`
	RelationshipType   string `json:"relationship_type"`
	Notes              string `json:"notes"`
}

// LinkTaskToOutgoingDocument creates a relationship between a task and an outgoing document
func LinkTaskToOutgoingDocument(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task ID không hợp lệ"})
		return
	}

	var req CreateTaskOutgoingDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	// Validate task exists
	var task models.Task
	if err := database.DB.First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Validate outgoing document exists
	var outgoingDoc models.OutgoingDocument
	if err := database.DB.First(&outgoingDoc, req.OutgoingDocumentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đi"})
		return
	}

	// Set default relationship type if not provided
	relationshipType := req.RelationshipType
	if relationshipType == "" {
		relationshipType = models.RelationshipTypeResult
	}

	// Validate relationship type
	validTypes := []string{models.RelationshipTypeResult, models.RelationshipTypeReference, models.RelationshipTypeRelated}
	isValidType := false
	for _, validType := range validTypes {
		if relationshipType == validType {
			isValidType = true
			break
		}
	}
	if !isValidType {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Loại quan hệ không hợp lệ"})
		return
	}

	// Check if relationship already exists
	var existingRelationship models.TaskOutgoingDocument
	if err := database.DB.Where("task_id = ? AND outgoing_document_id = ?", taskID, req.OutgoingDocumentID).First(&existingRelationship).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Công việc đã được liên kết với văn bản này"})
		return
	}

	// Create the relationship
	relationship := models.TaskOutgoingDocument{
		TaskID:             uint(taskID),
		OutgoingDocumentID: req.OutgoingDocumentID,
		RelationshipType:   relationshipType,
		Notes:              req.Notes,
		CreatedByID:        userID.(uint),
	}

	if err := database.DB.Create(&relationship).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo liên kết"})
		return
	}

	// Load relations for response
	database.DB.Preload("Task").Preload("OutgoingDocument.DocumentType").Preload("OutgoingDocument.IssuingUnit").Preload("CreatedBy").First(&relationship, relationship.ID)

	c.JSON(http.StatusCreated, relationship)
}

// UnlinkTaskFromOutgoingDocument removes a relationship between a task and an outgoing document
func UnlinkTaskFromOutgoingDocument(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task ID không hợp lệ"})
		return
	}

	outgoingDocID, err := strconv.Atoi(c.Param("outgoingDocId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Outgoing Document ID không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Find the relationship
	var relationship models.TaskOutgoingDocument
	if err := database.DB.Where("task_id = ? AND outgoing_document_id = ?", taskID, outgoingDocID).First(&relationship).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy liên kết"})
		return
	}

	// Check permissions - admin, secretary, or the creator can unlink
	if userRole.(string) != models.RoleAdmin && userRole.(string) != models.RoleSecretary && relationship.CreatedByID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền xóa liên kết này"})
		return
	}

	// Delete the relationship
	if err := database.DB.Delete(&relationship).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa liên kết"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Xóa liên kết thành công"})
}

// GetTaskOutgoingDocumentRelationships returns all relationships for a task
func GetTaskOutgoingDocumentRelationships(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task ID không hợp lệ"})
		return
	}

	// Validate task exists
	var task models.Task
	if err := database.DB.First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Get all relationships for this task
	var relationships []models.TaskOutgoingDocument
	if err := database.DB.Preload("OutgoingDocument.DocumentType").Preload("OutgoingDocument.IssuingUnit").Preload("CreatedBy").
		Where("task_id = ?", taskID).Find(&relationships).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách liên kết"})
		return
	}

	c.JSON(http.StatusOK, relationships)
}
