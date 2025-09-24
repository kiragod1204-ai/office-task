package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetIssuingUnits retrieves all active issuing units
func GetIssuingUnits(c *gin.Context) {
	var issuingUnits []models.IssuingUnit

	if err := database.DB.Where("is_active = ?", true).Find(&issuingUnits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve issuing units"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": issuingUnits})
}

// GetAllIssuingUnits retrieves all issuing units including inactive ones (admin only)
func GetAllIssuingUnits(c *gin.Context) {
	var issuingUnits []models.IssuingUnit

	if err := database.DB.Find(&issuingUnits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve issuing units"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": issuingUnits})
}

// GetIssuingUnit retrieves a specific issuing unit by ID
func GetIssuingUnit(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid issuing unit ID"})
		return
	}

	var issuingUnit models.IssuingUnit
	if err := database.DB.First(&issuingUnit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Issuing unit not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": issuingUnit})
}

// CreateIssuingUnit creates a new issuing unit
func CreateIssuingUnit(c *gin.Context) {
	var issuingUnit models.IssuingUnit

	if err := c.ShouldBindJSON(&issuingUnit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if issuingUnit.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Issuing unit name is required"})
		return
	}

	// Set default values
	issuingUnit.IsActive = true

	if err := database.DB.Create(&issuingUnit).Error; err != nil {
		if database.IsUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Issuing unit name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create issuing unit"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": issuingUnit})
}

// UpdateIssuingUnit updates an existing issuing unit
func UpdateIssuingUnit(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid issuing unit ID"})
		return
	}

	var issuingUnit models.IssuingUnit
	if err := database.DB.First(&issuingUnit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Issuing unit not found"})
		return
	}

	var updateData models.IssuingUnit
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if updateData.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Issuing unit name is required"})
		return
	}

	// Update fields
	issuingUnit.Name = updateData.Name
	issuingUnit.Description = updateData.Description
	issuingUnit.IsActive = updateData.IsActive

	if err := database.DB.Save(&issuingUnit).Error; err != nil {
		if database.IsUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Issuing unit name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update issuing unit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": issuingUnit})
}

// DeleteIssuingUnit soft deletes an issuing unit
func DeleteIssuingUnit(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid issuing unit ID"})
		return
	}

	var issuingUnit models.IssuingUnit
	if err := database.DB.First(&issuingUnit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Issuing unit not found"})
		return
	}

	if err := database.DB.Delete(&issuingUnit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete issuing unit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Issuing unit deleted successfully"})
}

// ToggleIssuingUnitStatus toggles the active status of an issuing unit
func ToggleIssuingUnitStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid issuing unit ID"})
		return
	}

	var issuingUnit models.IssuingUnit
	if err := database.DB.First(&issuingUnit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Issuing unit not found"})
		return
	}

	issuingUnit.IsActive = !issuingUnit.IsActive

	if err := database.DB.Save(&issuingUnit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update issuing unit status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": issuingUnit})
}
