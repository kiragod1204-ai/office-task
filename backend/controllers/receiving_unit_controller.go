package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetReceivingUnits retrieves all active receiving units
func GetReceivingUnits(c *gin.Context) {
	var receivingUnits []models.ReceivingUnit

	if err := database.DB.Where("is_active = ?", true).Find(&receivingUnits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve receiving units"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": receivingUnits})
}

// GetAllReceivingUnits retrieves all receiving units including inactive ones (admin only)
func GetAllReceivingUnits(c *gin.Context) {
	var receivingUnits []models.ReceivingUnit

	if err := database.DB.Find(&receivingUnits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve receiving units"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": receivingUnits})
}

// GetReceivingUnit retrieves a specific receiving unit by ID
func GetReceivingUnit(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receiving unit ID"})
		return
	}

	var receivingUnit models.ReceivingUnit
	if err := database.DB.First(&receivingUnit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Receiving unit not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": receivingUnit})
}

// CreateReceivingUnit creates a new receiving unit
func CreateReceivingUnit(c *gin.Context) {
	var receivingUnit models.ReceivingUnit

	if err := c.ShouldBindJSON(&receivingUnit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if receivingUnit.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Receiving unit name is required"})
		return
	}

	// Set default values
	receivingUnit.IsActive = true

	if err := database.DB.Create(&receivingUnit).Error; err != nil {
		if database.IsUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Receiving unit name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create receiving unit"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": receivingUnit})
}

// UpdateReceivingUnit updates an existing receiving unit
func UpdateReceivingUnit(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receiving unit ID"})
		return
	}

	var receivingUnit models.ReceivingUnit
	if err := database.DB.First(&receivingUnit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Receiving unit not found"})
		return
	}

	var updateData models.ReceivingUnit
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if updateData.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Receiving unit name is required"})
		return
	}

	// Update fields
	receivingUnit.Name = updateData.Name
	receivingUnit.Description = updateData.Description
	receivingUnit.IsActive = updateData.IsActive

	if err := database.DB.Save(&receivingUnit).Error; err != nil {
		if database.IsUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Receiving unit name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update receiving unit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": receivingUnit})
}

// DeleteReceivingUnit soft deletes a receiving unit
func DeleteReceivingUnit(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receiving unit ID"})
		return
	}

	var receivingUnit models.ReceivingUnit
	if err := database.DB.First(&receivingUnit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Receiving unit not found"})
		return
	}

	if err := database.DB.Delete(&receivingUnit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete receiving unit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Receiving unit deleted successfully"})
}

// ToggleReceivingUnitStatus toggles the active status of a receiving unit
func ToggleReceivingUnitStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid receiving unit ID"})
		return
	}

	var receivingUnit models.ReceivingUnit
	if err := database.DB.First(&receivingUnit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Receiving unit not found"})
		return
	}

	receivingUnit.IsActive = !receivingUnit.IsActive

	if err := database.DB.Save(&receivingUnit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update receiving unit status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": receivingUnit})
}
