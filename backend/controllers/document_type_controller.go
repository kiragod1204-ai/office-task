package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetDocumentTypes retrieves all document types
func GetDocumentTypes(c *gin.Context) {
	var documentTypes []models.DocumentType

	if err := database.DB.Where("is_active = ?", true).Find(&documentTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve document types"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": documentTypes})
}

// GetAllDocumentTypes retrieves all document types including inactive ones (admin only)
func GetAllDocumentTypes(c *gin.Context) {
	var documentTypes []models.DocumentType

	if err := database.DB.Find(&documentTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve document types"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": documentTypes})
}

// GetDocumentType retrieves a specific document type by ID
func GetDocumentType(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document type ID"})
		return
	}

	var documentType models.DocumentType
	if err := database.DB.First(&documentType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document type not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": documentType})
}

// CreateDocumentType creates a new document type
func CreateDocumentType(c *gin.Context) {
	var documentType models.DocumentType

	if err := c.ShouldBindJSON(&documentType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if documentType.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Document type name is required"})
		return
	}

	// Set default values
	documentType.IsActive = true

	if err := database.DB.Create(&documentType).Error; err != nil {
		if database.IsUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Document type name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create document type"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": documentType})
}

// UpdateDocumentType updates an existing document type
func UpdateDocumentType(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document type ID"})
		return
	}

	var documentType models.DocumentType
	if err := database.DB.First(&documentType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document type not found"})
		return
	}

	var updateData models.DocumentType
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if updateData.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Document type name is required"})
		return
	}

	// Update fields
	documentType.Name = updateData.Name
	documentType.Description = updateData.Description
	documentType.IsActive = updateData.IsActive

	if err := database.DB.Save(&documentType).Error; err != nil {
		if database.IsUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Document type name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document type"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": documentType})
}

// DeleteDocumentType soft deletes a document type
func DeleteDocumentType(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document type ID"})
		return
	}

	var documentType models.DocumentType
	if err := database.DB.First(&documentType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document type not found"})
		return
	}

	if err := database.DB.Delete(&documentType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete document type"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Document type deleted successfully"})
}

// ToggleDocumentTypeStatus toggles the active status of a document type
func ToggleDocumentTypeStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document type ID"})
		return
	}

	var documentType models.DocumentType
	if err := database.DB.First(&documentType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Document type not found"})
		return
	}

	documentType.IsActive = !documentType.IsActive

	if err := database.DB.Save(&documentType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update document type status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": documentType})
}
