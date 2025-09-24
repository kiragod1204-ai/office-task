package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"ai-code-agent-backend/services"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// EnhancedUploadFile handles file upload with enhanced security and validation
func EnhancedUploadFile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")
	documentType := c.PostForm("document_type") // "incoming", "outgoing", "task_report"
	documentIDStr := c.PostForm("document_id")

	if documentType == "" || documentIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "document_type và document_id là bắt buộc"})
		return
	}

	documentID, err := strconv.ParseUint(documentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "document_id không hợp lệ"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không thể đọc file"})
		return
	}
	defer file.Close()

	// Initialize file service
	fileService := services.NewFileService()

	// Use appropriate config based on document type
	config := services.DocumentUploadConfig
	if strings.Contains(header.Header.Get("Content-Type"), "image/") {
		config = services.ImageUploadConfig
	}

	// Check if user role is allowed
	if !contains(config.AllowedRoles, userRole.(string)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền upload file"})
		return
	}

	// Upload file
	fileInfo, err := fileService.UploadFile(file, header, config, userID.(uint), documentType, uint(documentID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Upload file thành công",
		"file":    fileInfo,
	})
}

// Legacy function for backward compatibility
func UploadIncomingFile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không thể đọc file"})
		return
	}
	defer file.Close()

	// Create uploads directory if not exists
	uploadsDir := "uploads/incoming"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo thư mục upload"})
		return
	}

	// Generate unique filename
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("%d_%s", timestamp, header.Filename)
	filepath := filepath.Join(uploadsDir, filename)
	// Normalize path separators for cross-platform compatibility
	filepath = strings.ReplaceAll(filepath, "\\", "/")

	// Save file
	dst, err := os.Create(filepath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu file"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu file"})
		return
	}

	// Get next order number
	var lastFile models.IncomingFile
	database.DB.Order("order_number desc").First(&lastFile)
	orderNumber := lastFile.OrderNumber + 1

	// Save to database
	incomingFile := models.IncomingFile{
		OrderNumber: orderNumber,
		FileName:    header.Filename,
		FilePath:    filepath,
		UploadedBy:  userID.(uint),
	}

	if err := database.DB.Create(&incomingFile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu thông tin file"})
		return
	}

	// Load user relation
	database.DB.Preload("User").First(&incomingFile, incomingFile.ID)

	c.JSON(http.StatusCreated, incomingFile)
}

func UploadReportFile(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task ID không hợp lệ"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không thể đọc file"})
		return
	}
	defer file.Close()

	// Create uploads directory if not exists
	uploadsDir := "uploads/reports"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo thư mục upload"})
		return
	}

	// Generate unique filename
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("task_%d_%d_%s", taskID, timestamp, header.Filename)
	filepath := filepath.Join(uploadsDir, filename)
	// Normalize path separators for cross-platform compatibility
	filepath = strings.ReplaceAll(filepath, "\\", "/")

	// Save file
	dst, err := os.Create(filepath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu file"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu file"})
		return
	}

	// Update task with report file path
	var task models.Task
	if err := database.DB.First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Remove old report file if exists
	if task.ReportFile != "" {
		os.Remove(task.ReportFile)
	}

	task.ReportFile = filepath
	task.Status = models.StatusReview

	if err := database.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật công việc"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Upload file báo cáo thành công",
		"report_file": filepath,
	})
}

func GetIncomingFiles(c *gin.Context) {
	var files []models.IncomingFile
	if err := database.DB.Preload("User").Order("order_number desc").Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách file"})
		return
	}

	c.JSON(http.StatusOK, files)
}

// EnhancedDownloadFile handles file download with enhanced security checks
func EnhancedDownloadFile(c *gin.Context) {
	filePath := c.Query("path")
	if filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thiếu đường dẫn file"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")

	// Initialize file service
	fileService := services.NewFileService()

	// Check file access
	if err := fileService.CheckFileAccess(filePath, userID.(uint), userRole.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền truy cập file"})
		return
	}

	// Normalize path separators
	filePath = strings.ReplaceAll(filePath, "\\", "/")
	osFilePath := filepath.FromSlash(filePath)

	// Check if file exists
	if _, err := os.Stat(osFilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File không tồn tại"})
		return
	}

	// Set appropriate headers for download
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", "attachment; filename="+filepath.Base(filePath))
	c.Header("Content-Type", "application/octet-stream")

	c.File(osFilePath)
}

// GetFileThumbnail serves file thumbnails
func GetFileThumbnail(c *gin.Context) {
	filePath := c.Query("path")
	if filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thiếu đường dẫn file"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")

	// Initialize file service
	fileService := services.NewFileService()

	// Check file access
	if err := fileService.CheckFileAccess(filePath, userID.(uint), userRole.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền truy cập file"})
		return
	}

	// Get file record to find thumbnail
	var fileRecord services.FileInfo
	if err := database.DB.Table("files").Where("file_path = ?", filePath).First(&fileRecord).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File không tồn tại"})
		return
	}

	if fileRecord.ThumbnailPath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thumbnail không tồn tại"})
		return
	}

	// Serve thumbnail
	osFilePath := filepath.FromSlash(fileRecord.ThumbnailPath)
	if _, err := os.Stat(osFilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Thumbnail không tồn tại"})
		return
	}

	c.File(osFilePath)
}

// GetFileInfo returns file information and metadata
func GetFileInfo(c *gin.Context) {
	filePath := c.Query("path")
	if filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thiếu đường dẫn file"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")

	// Initialize file service
	fileService := services.NewFileService()

	// Check file access
	if err := fileService.CheckFileAccess(filePath, userID.(uint), userRole.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền truy cập file"})
		return
	}

	// Get file record
	var fileRecord services.FileInfo
	if err := database.DB.Table("files").Where("file_path = ?", filePath).First(&fileRecord).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File không tồn tại"})
		return
	}

	c.JSON(http.StatusOK, fileRecord)
}

// DeleteFile removes a file
func DeleteFile(c *gin.Context) {
	filePath := c.Query("path")
	if filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thiếu đường dẫn file"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")

	// Initialize file service
	fileService := services.NewFileService()

	// Delete file
	if err := fileService.DeleteFile(filePath, userID.(uint), userRole.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Xóa file thành công"})
}

// GetFilesByDocument returns all files for a specific document
func GetFilesByDocument(c *gin.Context) {
	documentType := c.Query("document_type")
	documentIDStr := c.Query("document_id")

	if documentType == "" || documentIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "document_type và document_id là bắt buộc"})
		return
	}

	documentID, err := strconv.ParseUint(documentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "document_id không hợp lệ"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")

	// Get files for document
	var files []services.FileInfo
	query := database.DB.Table("files").Where("document_type = ? AND document_id = ? AND deleted_at IS NULL", documentType, documentID)

	// Apply access control
	if userRole.(string) != models.RoleAdmin {
		query = query.Where("access_level != ? OR uploaded_by = ?", "private", userID)
	}

	if err := query.Order("uploaded_at DESC").Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách file"})
		return
	}

	c.JSON(http.StatusOK, files)
}

// Legacy function for backward compatibility
func DownloadFile(c *gin.Context) {
	filePath := c.Query("path")
	if filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thiếu đường dẫn file"})
		return
	}

	// Normalize path separators
	filePath = strings.ReplaceAll(filePath, "\\", "/")

	// Debug logging
	fmt.Printf("Download request for file: %s\n", filePath)

	// Security check - ensure file is in uploads directory
	if !strings.HasPrefix(filePath, "uploads/") {
		fmt.Printf("Path validation failed: %s does not start with 'uploads/'\n", filePath)
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền truy cập file"})
		return
	}

	// Convert to OS-specific path for file operations
	osFilePath := filepath.FromSlash(filePath)

	// Check if file exists
	if _, err := os.Stat(osFilePath); os.IsNotExist(err) {
		fmt.Printf("File not found: %s (OS path: %s)\n", filePath, osFilePath)
		c.JSON(http.StatusNotFound, gin.H{"error": "File không tồn tại"})
		return
	}

	fmt.Printf("Serving file: %s (OS path: %s)\n", filePath, osFilePath)
	c.File(osFilePath)
}

// GetFileVersions returns version history for a document's files
func GetFileVersions(c *gin.Context) {
	documentType := c.Query("document_type")
	documentIDStr := c.Query("document_id")

	if documentType == "" || documentIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "document_type và document_id là bắt buộc"})
		return
	}

	documentID, err := strconv.ParseUint(documentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "document_id không hợp lệ"})
		return
	}

	// Get file versions (simplified - in real implementation, you'd track versions)
	var files []services.FileInfo
	query := database.DB.Table("files").Where("document_type = ? AND document_id = ? AND deleted_at IS NULL", documentType, documentID)

	if err := query.Order("uploaded_at DESC").Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy lịch sử phiên bản"})
		return
	}

	// Transform to version format
	versions := make([]map[string]interface{}, len(files))
	for i, file := range files {
		versions[i] = map[string]interface{}{
			"id":               file.ID,
			"version":          i + 1,
			"file_path":        file.FilePath,
			"original_name":    file.OriginalName,
			"file_size":        file.FileSize,
			"uploaded_at":      file.UploadedAt,
			"uploaded_by":      file.UploadedBy,
			"uploaded_by_name": "User", // You'd join with users table
			"is_current":       i == 0,
		}
	}

	c.JSON(http.StatusOK, versions)
}

// Admin functions

// GetAllFiles returns all files with filtering (admin only)
func GetAllFiles(c *gin.Context) {
	var files []services.FileInfo
	query := database.DB.Table("files").Where("deleted_at IS NULL")

	// Apply filters
	if documentType := c.Query("documentType"); documentType != "" {
		query = query.Where("document_type = ?", documentType)
	}
	if mimeType := c.Query("mimeType"); mimeType != "" {
		if strings.HasSuffix(mimeType, "/") {
			query = query.Where("mime_type LIKE ?", mimeType+"%")
		} else {
			query = query.Where("mime_type = ?", mimeType)
		}
	}
	if accessLevel := c.Query("accessLevel"); accessLevel != "" {
		query = query.Where("access_level = ?", accessLevel)
	}
	if dateFrom := c.Query("dateFrom"); dateFrom != "" {
		query = query.Where("uploaded_at >= ?", dateFrom)
	}
	if dateTo := c.Query("dateTo"); dateTo != "" {
		query = query.Where("uploaded_at <= ?", dateTo+" 23:59:59")
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("original_name ILIKE ?", "%"+search+"%")
	}

	if err := query.Order("uploaded_at DESC").Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách file"})
		return
	}

	c.JSON(http.StatusOK, files)
}

// GetFileStats returns file statistics (admin only)
func GetFileStats(c *gin.Context) {
	var stats struct {
		TotalFiles int64                  `json:"totalFiles"`
		TotalSize  int64                  `json:"totalSize"`
		ByType     map[string]interface{} `json:"byType"`
	}

	// Get total files and size
	database.DB.Table("files").Where("deleted_at IS NULL").Count(&stats.TotalFiles)
	database.DB.Table("files").Where("deleted_at IS NULL").Select("COALESCE(SUM(file_size), 0)").Row().Scan(&stats.TotalSize)

	// Get stats by document type
	var typeStats []struct {
		DocumentType string `json:"document_type"`
		Count        int64  `json:"count"`
		Size         int64  `json:"size"`
	}
	database.DB.Table("files").
		Select("document_type, COUNT(*) as count, COALESCE(SUM(file_size), 0) as size").
		Where("deleted_at IS NULL").
		Group("document_type").
		Find(&typeStats)

	stats.ByType = make(map[string]interface{})
	for _, stat := range typeStats {
		stats.ByType[stat.DocumentType] = map[string]interface{}{
			"count": stat.Count,
			"size":  stat.Size,
		}
	}

	c.JSON(http.StatusOK, stats)
}

// UpdateFileAccess updates file access level (admin only)
func UpdateFileAccess(c *gin.Context) {
	var request struct {
		FilePath    string `json:"file_path" binding:"required"`
		AccessLevel string `json:"access_level" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate access level
	validLevels := []string{"public", "restricted", "private"}
	if !contains(validLevels, request.AccessLevel) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mức truy cập không hợp lệ"})
		return
	}

	// Update file access level
	result := database.DB.Table("files").
		Where("file_path = ? AND deleted_at IS NULL", request.FilePath).
		Update("access_level", request.AccessLevel)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật mức truy cập"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "File không tồn tại"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật mức truy cập thành công"})
}

// BulkDeleteFiles deletes multiple files (admin only)
func BulkDeleteFiles(c *gin.Context) {
	var request struct {
		FilePaths []string `json:"file_paths" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(request.FilePaths) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Danh sách file trống"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Initialize file service
	fileService := services.NewFileService()

	var errors []string
	var successCount int

	for _, filePath := range request.FilePaths {
		if err := fileService.DeleteFile(filePath, userID.(uint), userRole.(string)); err != nil {
			errors = append(errors, fmt.Sprintf("Không thể xóa %s: %s", filePath, err.Error()))
		} else {
			successCount++
		}
	}

	response := gin.H{
		"message":       fmt.Sprintf("Đã xóa %d/%d file thành công", successCount, len(request.FilePaths)),
		"success_count": successCount,
		"total_count":   len(request.FilePaths),
	}

	if len(errors) > 0 {
		response["errors"] = errors
	}

	c.JSON(http.StatusOK, response)
}

// Utility function
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
