package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
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
