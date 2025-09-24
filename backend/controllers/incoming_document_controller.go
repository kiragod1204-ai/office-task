package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"ai-code-agent-backend/services"
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

	userID, _ := c.Get("user_id")

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

	// Generate auto-increment arrival number
	var lastDoc models.IncomingDocument
	database.DB.Order("arrival_number desc").First(&lastDoc)
	arrivalNumber := lastDoc.ArrivalNumber + 1

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

	// Create incoming document
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

	if err := database.DB.Create(&incomingDoc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo văn bản đến"})
		return
	}

	// Load relations
	database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Processor").Preload("CreatedBy").First(&incomingDoc, incomingDoc.ID)

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
	case models.RoleSecretary, models.RoleAdmin:
		// Can see all documents
	case models.RoleTeamLeader, models.RoleDeputy:
		// Can see documents assigned to them or created by them
		query = query.Where("processor_id = ? OR created_by_id = ?", userID, userID)
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
	if err := database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Processor").Preload("CreatedBy").Preload("Tasks.AssignedTo").First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đến"})
		return
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

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var document models.IncomingDocument
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đến"})
		return
	}

	// Check permissions
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin:
		// Can update any document
	case models.RoleTeamLeader, models.RoleDeputy:
		// Can update documents assigned to them or created by them
		if document.ProcessorID == nil || *document.ProcessorID != userID.(uint) {
			if document.CreatedByID != userID.(uint) {
				c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền chỉnh sửa văn bản này"})
				return
			}
		}
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
	database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Processor").Preload("CreatedBy").First(&document, document.ID)

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
	database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Processor").Preload("CreatedBy").First(&document, document.ID)

	c.JSON(http.StatusOK, document)
}

// DeleteIncomingDocument deletes an incoming document
func DeleteIncomingDocument(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var document models.IncomingDocument
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đến"})
		return
	}

	// Check permissions
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin:
		// Can delete any document
	case models.RoleTeamLeader:
		// Can delete documents created by them
		if document.CreatedByID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền xóa văn bản này"})
			return
		}
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền xóa văn bản"})
		return
	}

	// Check if document has related tasks
	var taskCount int64
	database.DB.Model(&models.Task{}).Where("incoming_document_id = ?", id).Count(&taskCount)
	if taskCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không thể xóa văn bản đã có công việc liên quan"})
		return
	}

	// Delete file if exists
	if document.FilePath != "" {
		os.Remove(document.FilePath)
	}

	// Delete the document
	if err := database.DB.Delete(&document).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa văn bản đến"})
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
