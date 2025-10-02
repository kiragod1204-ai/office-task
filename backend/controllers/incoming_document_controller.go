package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"ai-code-agent-backend/services"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type CreateIncomingDocumentRequest struct {
	ArrivalDate    string `json:"arrival_date" binding:"required"`
	OriginalNumber string `json:"original_number" binding:"required"`
	DocumentDate   string `json:"document_date" binding:"required"`
	DocumentTypeID uint   `json:"document_type_id" binding:"required"`
	IssuingUnitID  uint   `json:"issuing_unit_id" binding:"required"`
	Summary        string `json:"summary" binding:"required"`
	InternalNotes  string `json:"internal_notes"`
	ProcessorID    *uint  `json:"processor_id"`
}

type UpdateIncomingDocumentRequest struct {
	OriginalNumber string `json:"original_number"`
	DocumentDate   string `json:"document_date"`
	DocumentTypeID uint   `json:"document_type_id"`
	IssuingUnitID  uint   `json:"issuing_unit_id"`
	Summary        string `json:"summary"`
	InternalNotes  string `json:"internal_notes"`
	ProcessorID    *uint  `json:"processor_id"`
	Status         string `json:"status"`
}

type AssignProcessorRequest struct {
	ProcessorID uint `json:"processor_id" binding:"required"`
}

// CreateIncomingDocument creates a new incoming document
func CreateIncomingDocument(c *gin.Context) {
	var req CreateIncomingDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Không thể xác định người dùng"})
		return
	}

	// Verify user exists
	var user models.User
	if err := database.DB.First(&user, userID.(uint)).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Người dùng không tồn tại"})
		return
	}

	// Parse dates
	arrivalDate, err := time.Parse("2006-01-02", req.ArrivalDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng ngày đến không hợp lệ"})
		return
	}

	documentDate, err := time.Parse("2006-01-02", req.DocumentDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng ngày văn bản không hợp lệ"})
		return
	}

	// Validate processor if provided (must be Team Leader or Deputy)
	if req.ProcessorID != nil {
		var processor models.User
		if err := database.DB.First(&processor, *req.ProcessorID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Người xử lý không tồn tại"})
			return
		}
		if !processor.IsTeamLeaderOrDeputy() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Người xử lý phải là Trưởng hoặc Phó Công An Xã"})
			return
		}
	}

	// Use database transaction to atomically generate arrival number
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get next arrival number using raw SQL for better atomicity
	var result struct {
		NextNumber int `gorm:"column:next_number"`
	}
	err = tx.Raw("SELECT COALESCE(MAX(arrival_number), 0) + 1 as next_number FROM incoming_documents").Scan(&result).Error
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo số đến"})
		return
	}
	arrivalNumber := result.NextNumber

	// Create the document
	incomingDoc := models.IncomingDocument{
		ArrivalDate:    arrivalDate,
		ArrivalNumber:  arrivalNumber,
		OriginalNumber: req.OriginalNumber,
		DocumentDate:   documentDate,
		DocumentTypeID: req.DocumentTypeID,
		IssuingUnitID:  req.IssuingUnitID,
		Summary:        req.Summary,
		InternalNotes:  req.InternalNotes,
		ProcessorID:    req.ProcessorID,
		Status:         models.IncomingStatusReceived,
		CreatedByID:    userID.(uint),
	}

	// Update status based on processor assignment
	if req.ProcessorID != nil {
		incomingDoc.Status = models.IncomingStatusForwarded
	}

	// Create the document within the transaction
	if err := tx.Create(&incomingDoc).Error; err != nil {
		tx.Rollback()
		if database.IsUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Số đến đã tồn tại, vui lòng thử lại"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo văn bản đến: " + err.Error()})
		}
		return
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể hoàn tất tạo văn bản đến"})
		return
	}

	// Load relations with explicit error handling
	if err := database.DB.Preload("DocumentType").First(&incomingDoc, incomingDoc.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tải loại văn bản"})
		return
	}

	if err := database.DB.Preload("IssuingUnit").First(&incomingDoc, incomingDoc.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tải đơn vị ban hành"})
		return
	}

	// Load processor if exists
	if incomingDoc.ProcessorID != nil {
		database.DB.Preload("Processor").First(&incomingDoc, incomingDoc.ID)
	}

	// Load CreatedBy explicitly
	var createdByUser models.User
	if err := database.DB.First(&createdByUser, incomingDoc.CreatedByID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tải thông tin người tạo"})
		return
	}
	incomingDoc.CreatedBy = createdByUser

	c.JSON(http.StatusCreated, incomingDoc)
}

// GetIncomingDocuments retrieves incoming documents with advanced filtering
func GetIncomingDocuments(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Parse filter parameters
	filterParams := services.ParseDocumentFilterParams(c)

	var documents []models.IncomingDocument
	query := database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Processor").Preload("CreatedBy")

	// Apply role-based filtering
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin, models.RoleTeamLeader, models.RoleDeputy:
		// Can see all documents
	case models.RoleOfficer:
		// Can see documents where they have related tasks
		query = query.Joins("JOIN tasks ON tasks.incoming_document_id = incoming_documents.id").
			Where("tasks.assigned_to_id = ?", userID)
	}

	// Apply advanced filters
	query = services.ApplyIncomingDocumentFilters(query, filterParams)

	// Apply sorting
	allowedSortFields := []string{"arrival_date", "arrival_number", "document_date", "created_at", "updated_at"}
	query = services.ApplySorting(query, filterParams.SortBy, filterParams.SortOrder, allowedSortFields)

	// Get total count before pagination
	var total int64
	query.Model(&models.IncomingDocument{}).Count(&total)

	// Apply pagination
	query = services.ApplyPagination(query, filterParams.Page, filterParams.Limit)

	// Get documents
	if err := query.Find(&documents).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách văn bản đến"})
		return
	}

	// Load CreatedBy for each document explicitly
	for i := range documents {
		var createdByUser models.User
		if err := database.DB.First(&createdByUser, documents[i].CreatedByID).Error; err == nil {
			documents[i].CreatedBy = createdByUser
		}
	}

	// Return response with pagination info
	response := gin.H{
		"documents":  documents,
		"pagination": services.GetPaginationInfo(total, filterParams.Page, filterParams.Limit),
	}

	c.JSON(http.StatusOK, response)
}

// GetIncomingDocument retrieves a single incoming document by ID
func GetIncomingDocument(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var document models.IncomingDocument
	if err := database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Processor").Preload("Tasks.AssignedTo").First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đến"})
		return
	}

	// Load CreatedBy explicitly
	var createdByUser models.User
	if err := database.DB.First(&createdByUser, document.CreatedByID).Error; err == nil {
		document.CreatedBy = createdByUser
	}

	c.JSON(http.StatusOK, document)
}

// UpdateIncomingDocument updates an existing incoming document
func UpdateIncomingDocument(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req UpdateIncomingDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	userRole, _ := c.Get("user_role")

	var document models.IncomingDocument
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đến"})
		return
	}

	// Check permissions
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin, models.RoleTeamLeader, models.RoleDeputy:
		// Can update any document
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền chỉnh sửa văn bản"})
		return
	}

	// Update fields if provided
	updates := make(map[string]interface{})

	if req.OriginalNumber != "" {
		updates["original_number"] = req.OriginalNumber
	}
	if req.DocumentDate != "" {
		if documentDate, err := time.Parse("2006-01-02", req.DocumentDate); err == nil {
			updates["document_date"] = documentDate
		}
	}
	if req.DocumentTypeID > 0 {
		updates["document_type_id"] = req.DocumentTypeID
	}
	if req.IssuingUnitID > 0 {
		updates["issuing_unit_id"] = req.IssuingUnitID
	}
	if req.Summary != "" {
		updates["summary"] = req.Summary
	}
	if req.InternalNotes != "" {
		updates["internal_notes"] = req.InternalNotes
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.ProcessorID != nil {
		// Validate processor (must be Team Leader or Deputy)
		var processor models.User
		if err := database.DB.First(&processor, *req.ProcessorID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Người xử lý không tồn tại"})
			return
		}
		if !processor.IsTeamLeaderOrDeputy() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Người xử lý phải là Trưởng hoặc Phó Công An Xã"})
			return
		}
		updates["processor_id"] = *req.ProcessorID
		// Update status when processor is assigned
		if document.Status == models.IncomingStatusReceived {
			updates["status"] = models.IncomingStatusForwarded
		}
	}

	if err := database.DB.Model(&document).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật văn bản đến"})
		return
	}

	// Load relations
	database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Processor").First(&document, document.ID)

	// Load CreatedBy explicitly
	var createdByUser models.User
	if err := database.DB.First(&createdByUser, document.CreatedByID).Error; err == nil {
		document.CreatedBy = createdByUser
	}

	c.JSON(http.StatusOK, document)
}

// AssignProcessor assigns a processor to an incoming document
func AssignProcessor(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req AssignProcessorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	var document models.IncomingDocument
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đến"})
		return
	}

	// Validate processor (must be Team Leader or Deputy)
	var processor models.User
	if err := database.DB.First(&processor, req.ProcessorID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Người xử lý không tồn tại"})
		return
	}
	if !processor.IsTeamLeaderOrDeputy() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Người xử lý phải là Trưởng hoặc Phó Công An Xã"})
		return
	}

	// Update processor and status
	document.ProcessorID = &req.ProcessorID
	if document.Status == models.IncomingStatusReceived {
		document.Status = models.IncomingStatusForwarded
	}

	if err := database.DB.Save(&document).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể gán người xử lý"})
		return
	}

	// Load relations
	database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Processor").First(&document, document.ID)

	// Load CreatedBy explicitly
	var createdByUser models.User
	if err := database.DB.First(&createdByUser, document.CreatedByID).Error; err == nil {
		document.CreatedBy = createdByUser
	}

	c.JSON(http.StatusOK, document)
}

// DeleteIncomingDocument deletes an incoming document
func DeleteIncomingDocument(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	userRole, _ := c.Get("user_role")

	var document models.IncomingDocument
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đến"})
		return
	}

	// Check permissions
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin, models.RoleTeamLeader, models.RoleDeputy:
		// Can delete any document
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền xóa văn bản"})
		return
	}

	// Check if document has related tasks (including soft-deleted tasks)
	var tasks []models.Task
	database.DB.Unscoped().Where("incoming_document_id = ?", id).Find(&tasks)

	if len(tasks) > 0 {
		// Get active (non-deleted) tasks
		var activeTasks []models.Task
		database.DB.Where("incoming_document_id = ?", id).Find(&activeTasks)

		if len(activeTasks) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":         fmt.Sprintf("Không thể xóa văn bản đã có %d công việc liên quan. Vui lòng xóa các công việc liên quan trước.", len(activeTasks)),
				"related_tasks": len(activeTasks),
			})
			return
		}
	}

	// Start transaction for safe deletion
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete associated files from the new file system
	var associatedFiles []struct {
		FilePath string `json:"file_path"`
	}

	// Get all files associated with this document
	if err := tx.Raw("SELECT file_path FROM files WHERE document_type = 'incoming' AND document_id = ? AND deleted_at IS NULL", id).Scan(&associatedFiles).Error; err == nil {
		// Mark files as deleted in database (soft delete)
		if err := tx.Exec("UPDATE files SET deleted_at = NOW() WHERE document_type = 'incoming' AND document_id = ?", id).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa files liên quan"})
			return
		}

		// Delete physical files
		for _, file := range associatedFiles {
			if file.FilePath != "" {
				os.Remove(file.FilePath)
			}
		}
	}

	// Delete legacy file if exists
	if document.FilePath != "" {
		os.Remove(document.FilePath)
	}

	// Delete the document (soft delete)
	if err := tx.Delete(&document).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa văn bản đến"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể hoàn tất xóa văn bản"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Xóa văn bản đến thành công"})
}

// UploadIncomingDocumentFile uploads a file for an incoming document
func UploadIncomingDocumentFile(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var document models.IncomingDocument
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đến"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không thể đọc file"})
		return
	}
	defer file.Close()

	// Initialize file service
	fileService := services.NewFileService()

	// Use document upload config
	config := services.DocumentUploadConfig

	// Check if user role is allowed
	allowedRoles := []string{models.RoleSecretary, models.RoleAdmin}
	roleAllowed := false
	for _, role := range allowedRoles {
		if userRole.(string) == role {
			roleAllowed = true
			break
		}
	}
	if !roleAllowed {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền upload file"})
		return
	}

	// Upload file using enhanced service
	fileInfo, err := fileService.UploadFile(file, header, config, userID.(uint), "incoming", uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Remove old file if exists
	if document.FilePath != "" {
		fileService.DeleteFile(document.FilePath, userID.(uint), userRole.(string))
	}

	// Update document with new file path
	document.FilePath = fileInfo.FilePath
	if err := database.DB.Save(&document).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật thông tin file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Upload file thành công",
		"file_path": fileInfo.FilePath,
		"file_name": fileInfo.OriginalName,
		"file_info": fileInfo,
	})
}

// GetProcessors returns list of users who can be assigned as processors (Team Leaders and Deputies)
func GetProcessors(c *gin.Context) {
	var users []models.User
	if err := database.DB.Where("role IN (?, ?) AND is_active = ?", models.RoleTeamLeader, models.RoleDeputy, true).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách người xử lý"})
		return
	}

	c.JSON(http.StatusOK, users)
}
