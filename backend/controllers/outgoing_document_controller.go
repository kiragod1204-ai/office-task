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

type CreateOutgoingDocumentRequest struct {
	DocumentNumber string `json:"document_number" binding:"required"`
	IssueDate      string `json:"issue_date" binding:"required"`
	DocumentTypeID uint   `json:"document_type_id" binding:"required"`
	IssuingUnitID  uint   `json:"issuing_unit_id" binding:"required"`
	Summary        string `json:"summary" binding:"required"`
	DrafterID      uint   `json:"drafter_id" binding:"required"`
	ApproverID     uint   `json:"approver_id" binding:"required"`
	InternalNotes  string `json:"internal_notes"`
}

type UpdateOutgoingDocumentRequest struct {
	DocumentNumber string `json:"document_number"`
	IssueDate      string `json:"issue_date"`
	DocumentTypeID uint   `json:"document_type_id"`
	IssuingUnitID  uint   `json:"issuing_unit_id"`
	Summary        string `json:"summary"`
	DrafterID      uint   `json:"drafter_id"`
	ApproverID     uint   `json:"approver_id"`
	InternalNotes  string `json:"internal_notes"`
	Status         string `json:"status"`
}

type UpdateApprovalStatusRequest struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"notes"`
}

// CreateOutgoingDocument creates a new outgoing document
func CreateOutgoingDocument(c *gin.Context) {
	var req CreateOutgoingDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	// Parse issue date
	issueDate, err := time.Parse("2006-01-02", req.IssueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng ngày ban hành không hợp lệ"})
		return
	}

	// Validate drafter (must be Team Leader, Deputy, or Officer)
	var drafter models.User
	if err := database.DB.First(&drafter, req.DrafterID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Người soạn thảo không tồn tại"})
		return
	}
	if !isDrafterRole(drafter.Role) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Người soạn thảo phải là Trưởng, Phó hoặc Cán bộ"})
		return
	}

	// Validate approver (must be Team Leader or Deputy)
	var approver models.User
	if err := database.DB.First(&approver, req.ApproverID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Người phê duyệt không tồn tại"})
		return
	}
	if !approver.IsTeamLeaderOrDeputy() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Người phê duyệt phải là Trưởng hoặc Phó Công An Xã"})
		return
	}

	// Create outgoing document
	outgoingDoc := models.OutgoingDocument{
		DocumentNumber: req.DocumentNumber,
		IssueDate:      issueDate,
		DocumentTypeID: req.DocumentTypeID,
		IssuingUnitID:  req.IssuingUnitID,
		Summary:        req.Summary,
		DrafterID:      req.DrafterID,
		ApproverID:     req.ApproverID,
		InternalNotes:  req.InternalNotes,
		Status:         models.OutgoingStatusDraft,
		CreatedByID:    userID.(uint),
	}

	if err := database.DB.Create(&outgoingDoc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo văn bản đi"})
		return
	}

	// Load relations
	database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Drafter").Preload("Approver").Preload("CreatedBy").First(&outgoingDoc, outgoingDoc.ID)

	c.JSON(http.StatusCreated, outgoingDoc)
}

// GetOutgoingDocuments retrieves outgoing documents with advanced filtering
func GetOutgoingDocuments(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Parse filter parameters
	filterParams := services.ParseDocumentFilterParams(c)

	var documents []models.OutgoingDocument
	query := database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Drafter").Preload("Approver").Preload("CreatedBy")

	// Apply role-based filtering
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin, models.RoleTeamLeader, models.RoleDeputy:
		// Can see all documents
	case models.RoleOfficer:
		// Can see documents where they are drafter or creator
		query = query.Where("drafter_id = ? OR created_by_id = ?", userID, userID)
	}

	// Apply advanced filters
	query = services.ApplyOutgoingDocumentFilters(query, filterParams)

	// Apply sorting
	allowedSortFields := []string{"issue_date", "document_number", "created_at", "updated_at"}
	query = services.ApplySorting(query, filterParams.SortBy, filterParams.SortOrder, allowedSortFields)

	// Get total count before pagination
	var total int64
	query.Model(&models.OutgoingDocument{}).Count(&total)

	// Apply pagination
	query = services.ApplyPagination(query, filterParams.Page, filterParams.Limit)

	// Get documents
	if err := query.Find(&documents).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách văn bản đi"})
		return
	}

	// Return response with pagination info
	response := gin.H{
		"documents":  documents,
		"pagination": services.GetPaginationInfo(total, filterParams.Page, filterParams.Limit),
	}

	c.JSON(http.StatusOK, response)
}

// GetOutgoingDocument retrieves a single outgoing document by ID
func GetOutgoingDocument(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var document models.OutgoingDocument
	if err := database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Drafter").Preload("Approver").Preload("CreatedBy").First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đi"})
		return
	}

	c.JSON(http.StatusOK, document)
}

// UpdateOutgoingDocument updates an existing outgoing document
func UpdateOutgoingDocument(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req UpdateOutgoingDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var document models.OutgoingDocument
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đi"})
		return
	}

	// Check permissions
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin, models.RoleTeamLeader, models.RoleDeputy:
		// Can update any document
	case models.RoleOfficer:
		// Can update documents where they are drafter or creator
		if document.DrafterID != userID.(uint) && document.CreatedByID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền chỉnh sửa văn bản này"})
			return
		}
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền chỉnh sửa văn bản"})
		return
	}

	// Update fields if provided
	updates := make(map[string]interface{})

	if req.DocumentNumber != "" {
		updates["document_number"] = req.DocumentNumber
	}
	if req.IssueDate != "" {
		if issueDate, err := time.Parse("2006-01-02", req.IssueDate); err == nil {
			updates["issue_date"] = issueDate
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
	if req.DrafterID > 0 {
		// Validate drafter
		var drafter models.User
		if err := database.DB.First(&drafter, req.DrafterID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Người soạn thảo không tồn tại"})
			return
		}
		if !isDrafterRole(drafter.Role) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Người soạn thảo phải là Trưởng, Phó hoặc Cán bộ"})
			return
		}
		updates["drafter_id"] = req.DrafterID
	}
	if req.ApproverID > 0 {
		// Validate approver
		var approver models.User
		if err := database.DB.First(&approver, req.ApproverID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Người phê duyệt không tồn tại"})
			return
		}
		if !approver.IsTeamLeaderOrDeputy() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Người phê duyệt phải là Trưởng hoặc Phó Công An Xã"})
			return
		}
		updates["approver_id"] = req.ApproverID
	}

	if err := database.DB.Model(&document).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật văn bản đi"})
		return
	}

	// Load relations
	database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Drafter").Preload("Approver").Preload("CreatedBy").First(&document, document.ID)

	c.JSON(http.StatusOK, document)
}

// UpdateApprovalStatus updates the approval status of an outgoing document
func UpdateApprovalStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req UpdateApprovalStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var document models.OutgoingDocument
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đi"})
		return
	}

	// Check if user is the approver or has admin/secretary role
	if userRole.(string) != models.RoleAdmin && userRole.(string) != models.RoleSecretary {
		if document.ApproverID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Chỉ người phê duyệt mới có thể thay đổi trạng thái phê duyệt"})
			return
		}
	}

	// Validate status transition
	validStatuses := []string{models.OutgoingStatusDraft, models.OutgoingStatusReview, models.OutgoingStatusApproved, models.OutgoingStatusSent, models.OutgoingStatusRejected}
	isValidStatus := false
	for _, status := range validStatuses {
		if req.Status == status {
			isValidStatus = true
			break
		}
	}
	if !isValidStatus {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Trạng thái không hợp lệ"})
		return
	}

	// Update status
	updates := map[string]interface{}{
		"status": req.Status,
	}
	if req.Notes != "" {
		updates["internal_notes"] = req.Notes
	}

	if err := database.DB.Model(&document).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật trạng thái phê duyệt"})
		return
	}

	// Load relations
	database.DB.Preload("DocumentType").Preload("IssuingUnit").Preload("Drafter").Preload("Approver").Preload("CreatedBy").First(&document, document.ID)

	c.JSON(http.StatusOK, document)
}

// DeleteOutgoingDocument deletes an outgoing document
func DeleteOutgoingDocument(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	userRole, _ := c.Get("user_role")

	var document models.OutgoingDocument
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đi"})
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

	// Check if document is already approved or sent
	if document.Status == models.OutgoingStatusApproved || document.Status == models.OutgoingStatusSent {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không thể xóa văn bản đã được phê duyệt hoặc đã gửi"})
		return
	}

	// Delete file if exists
	if document.FilePath != "" {
		os.Remove(document.FilePath)
	}

	// Delete the document
	if err := database.DB.Delete(&document).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa văn bản đi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Xóa văn bản đi thành công"})
}

// UploadOutgoingDocumentFile uploads a signed document file for an outgoing document
func UploadOutgoingDocumentFile(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var document models.OutgoingDocument
	if err := database.DB.First(&document, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đi"})
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
	allowedRoles := []string{models.RoleSecretary, models.RoleTeamLeader, models.RoleDeputy, models.RoleOfficer, models.RoleAdmin}
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
	fileInfo, err := fileService.UploadFile(file, header, config, userID.(uint), "outgoing", uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Remove old file if exists
	if document.FilePath != "" {
		fileService.DeleteFile(document.FilePath, userID.(uint), userRole.(string))
	}

	// Update document with file path and potentially change status
	document.FilePath = fileInfo.FilePath
	// If document is in draft status and file is uploaded, move to review
	if document.Status == models.OutgoingStatusDraft {
		document.Status = models.OutgoingStatusReview
	}

	if err := database.DB.Save(&document).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật thông tin file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Upload file thành công",
		"file_path": fileInfo.FilePath,
		"file_name": fileInfo.OriginalName,
		"file_info": fileInfo,
		"status":    document.Status,
	})
}

// GetDrafters returns list of users who can be assigned as drafters (Team Leaders, Deputies, Officers)
func GetDrafters(c *gin.Context) {
	var users []models.User
	if err := database.DB.Where("role IN (?, ?, ?) AND is_active = ?", models.RoleTeamLeader, models.RoleDeputy, models.RoleOfficer, true).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách người soạn thảo"})
		return
	}

	c.JSON(http.StatusOK, users)
}

// GetApprovers returns list of users who can be assigned as approvers (Team Leaders and Deputies)
func GetApprovers(c *gin.Context) {
	var users []models.User
	if err := database.DB.Where("role IN (?, ?) AND is_active = ?", models.RoleTeamLeader, models.RoleDeputy, true).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách người phê duyệt"})
		return
	}

	c.JSON(http.StatusOK, users)
}

// Helper function to check if a role can be a drafter
func isDrafterRole(role string) bool {
	return role == models.RoleTeamLeader || role == models.RoleDeputy || role == models.RoleOfficer
}
