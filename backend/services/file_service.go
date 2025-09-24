package services

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"crypto/md5"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/gabriel-vasile/mimetype"
)

// FileService handles file operations with enhanced security and organization
type FileService struct{}

// FileUploadConfig defines configuration for file uploads
type FileUploadConfig struct {
	MaxSize        int64    // Maximum file size in bytes
	AllowedTypes   []string // Allowed MIME types
	AllowedExts    []string // Allowed file extensions
	GenerateThumbs bool     // Whether to generate thumbnails
	RequireAuth    bool     // Whether authentication is required
	AllowedRoles   []string // Roles allowed to upload
}

// FileInfo represents file information with metadata
type FileInfo struct {
	ID            uint      `json:"id"`
	OriginalName  string    `json:"original_name"`
	FileName      string    `json:"file_name"`
	FilePath      string    `json:"file_path"`
	ThumbnailPath string    `json:"thumbnail_path,omitempty"`
	FileSize      int64     `json:"file_size"`
	MimeType      string    `json:"mime_type"`
	FileHash      string    `json:"file_hash"`
	UploadedBy    uint      `json:"uploaded_by"`
	UploadedAt    time.Time `json:"uploaded_at"`
	DocumentType  string    `json:"document_type"` // "incoming", "outgoing", "task_report"
	DocumentID    uint      `json:"document_id"`
	AccessLevel   string    `json:"access_level"` // "public", "restricted", "private"
}

// Default configurations for different file types
var (
	DocumentUploadConfig = FileUploadConfig{
		MaxSize:        50 * 1024 * 1024, // 50MB
		AllowedTypes:   []string{"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "image/gif"},
		AllowedExts:    []string{".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".gif"},
		GenerateThumbs: true,
		RequireAuth:    true,
		AllowedRoles:   []string{models.RoleSecretary, models.RoleTeamLeader, models.RoleDeputy, models.RoleOfficer, models.RoleAdmin},
	}

	ImageUploadConfig = FileUploadConfig{
		MaxSize:        10 * 1024 * 1024, // 10MB
		AllowedTypes:   []string{"image/jpeg", "image/png", "image/gif", "image/webp"},
		AllowedExts:    []string{".jpg", ".jpeg", ".png", ".gif", ".webp"},
		GenerateThumbs: true,
		RequireAuth:    true,
		AllowedRoles:   []string{models.RoleSecretary, models.RoleTeamLeader, models.RoleDeputy, models.RoleOfficer, models.RoleAdmin},
	}
)

// NewFileService creates a new file service instance
func NewFileService() *FileService {
	return &FileService{}
}

// ValidateFile validates file against configuration
func (fs *FileService) ValidateFile(file multipart.File, header *multipart.FileHeader, config FileUploadConfig) error {
	// Check file size
	if header.Size > config.MaxSize {
		return fmt.Errorf("file size exceeds maximum allowed size of %d bytes", config.MaxSize)
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !contains(config.AllowedExts, ext) {
		return fmt.Errorf("file extension %s is not allowed", ext)
	}

	// Detect MIME type
	file.Seek(0, 0) // Reset file pointer
	mtype, err := mimetype.DetectReader(file)
	if err != nil {
		return fmt.Errorf("failed to detect file type: %v", err)
	}
	file.Seek(0, 0) // Reset file pointer again

	// Check MIME type
	if !contains(config.AllowedTypes, mtype.String()) {
		return fmt.Errorf("file type %s is not allowed", mtype.String())
	}

	return nil
}

// UploadFile handles file upload with enhanced security and organization
func (fs *FileService) UploadFile(file multipart.File, header *multipart.FileHeader, config FileUploadConfig, userID uint, documentType string, documentID uint) (*FileInfo, error) {
	// Validate file
	if err := fs.ValidateFile(file, header, config); err != nil {
		return nil, err
	}

	// Generate file hash for deduplication
	file.Seek(0, 0)
	hash := md5.New()
	if _, err := io.Copy(hash, file); err != nil {
		return nil, fmt.Errorf("failed to generate file hash: %v", err)
	}
	fileHash := fmt.Sprintf("%x", hash.Sum(nil))
	file.Seek(0, 0)

	// Check for duplicate files
	var existingFile FileInfo
	if err := database.DB.Where("file_hash = ? AND document_type = ?", fileHash, documentType).First(&existingFile).Error; err == nil {
		// File already exists, return existing file info
		return &existingFile, nil
	}

	// Create organized directory structure
	baseDir := "uploads"
	subDir := fs.getSubDirectory(documentType, time.Now())
	uploadsDir := filepath.Join(baseDir, subDir)

	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %v", err)
	}

	// Generate unique filename
	timestamp := time.Now().Unix()
	ext := filepath.Ext(header.Filename)
	baseFilename := strings.TrimSuffix(header.Filename, ext)
	// Sanitize filename
	baseFilename = fs.sanitizeFilename(baseFilename)
	filename := fmt.Sprintf("%s_%d_%d%s", baseFilename, documentID, timestamp, ext)
	filePath := filepath.Join(uploadsDir, filename)

	// Normalize path separators
	filePath = strings.ReplaceAll(filePath, "\\", "/")

	// Save file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %v", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return nil, fmt.Errorf("failed to save file: %v", err)
	}

	// Get file info
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %v", err)
	}

	// Detect MIME type
	file.Seek(0, 0)
	mtype, _ := mimetype.DetectReader(file)

	// Create file record
	fileRecord := FileInfo{
		OriginalName: header.Filename,
		FileName:     filename,
		FilePath:     filePath,
		FileSize:     fileInfo.Size(),
		MimeType:     mtype.String(),
		FileHash:     fileHash,
		UploadedBy:   userID,
		UploadedAt:   time.Now(),
		DocumentType: documentType,
		DocumentID:   documentID,
		AccessLevel:  "restricted", // Default to restricted access
	}

	// Generate thumbnail if needed and file is an image
	if config.GenerateThumbs && fs.isImageType(mtype.String()) {
		thumbnailPath, err := fs.generateThumbnail(filePath, uploadsDir)
		if err == nil {
			fileRecord.ThumbnailPath = thumbnailPath
		}
	}

	// Save to database (you'll need to create a files table)
	if err := database.DB.Table("files").Create(&fileRecord).Error; err != nil {
		// Clean up file if database save fails
		os.Remove(filePath)
		if fileRecord.ThumbnailPath != "" {
			os.Remove(fileRecord.ThumbnailPath)
		}
		return nil, fmt.Errorf("failed to save file record: %v", err)
	}

	return &fileRecord, nil
}

// CheckFileAccess checks if user has access to a file
func (fs *FileService) CheckFileAccess(filePath string, userID uint, userRole string) error {
	// Security check - ensure file is in uploads directory
	if !strings.HasPrefix(filePath, "uploads/") {
		return fmt.Errorf("invalid file path")
	}

	// Get file record from database
	var fileRecord FileInfo
	if err := database.DB.Table("files").Where("file_path = ?", filePath).First(&fileRecord).Error; err != nil {
		return fmt.Errorf("file not found in database")
	}

	// Check access based on access level and user role
	switch fileRecord.AccessLevel {
	case "public":
		return nil // Anyone can access
	case "restricted":
		// Check if user has appropriate role or is the uploader
		if userRole == models.RoleAdmin || fileRecord.UploadedBy == userID {
			return nil
		}
		// Check if user has access to the associated document
		return fs.checkDocumentAccess(fileRecord.DocumentType, fileRecord.DocumentID, userID, userRole)
	case "private":
		// Only uploader and admin can access
		if userRole == models.RoleAdmin || fileRecord.UploadedBy == userID {
			return nil
		}
		return fmt.Errorf("access denied")
	}

	return fmt.Errorf("access denied")
}

// DeleteFile removes file and its thumbnail
func (fs *FileService) DeleteFile(filePath string, userID uint, userRole string) error {
	// Check access
	if err := fs.CheckFileAccess(filePath, userID, userRole); err != nil {
		return err
	}

	// Get file record
	var fileRecord FileInfo
	if err := database.DB.Table("files").Where("file_path = ?", filePath).First(&fileRecord).Error; err != nil {
		return fmt.Errorf("file not found")
	}

	// Remove physical files
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove file: %v", err)
	}

	if fileRecord.ThumbnailPath != "" {
		os.Remove(fileRecord.ThumbnailPath) // Ignore errors for thumbnail
	}

	// Remove database record
	if err := database.DB.Table("files").Delete(&fileRecord).Error; err != nil {
		return fmt.Errorf("failed to remove file record: %v", err)
	}

	return nil
}

// Helper functions

func (fs *FileService) getSubDirectory(documentType string, uploadTime time.Time) string {
	year := uploadTime.Format("2006")
	month := uploadTime.Format("01")
	return filepath.Join(documentType, year, month)
}

func (fs *FileService) sanitizeFilename(filename string) string {
	// Remove or replace unsafe characters
	unsafe := []string{"/", "\\", ":", "*", "?", "\"", "<", ">", "|", " "}
	result := filename
	for _, char := range unsafe {
		result = strings.ReplaceAll(result, char, "_")
	}
	return result
}

func (fs *FileService) isImageType(mimeType string) bool {
	imageTypes := []string{"image/jpeg", "image/png", "image/gif", "image/webp"}
	return contains(imageTypes, mimeType)
}

func (fs *FileService) generateThumbnail(filePath, uploadsDir string) (string, error) {
	// Open source image
	src, err := imaging.Open(filePath)
	if err != nil {
		return "", err
	}

	// Create thumbnail (200x200 max, maintaining aspect ratio)
	thumbnail := imaging.Fit(src, 200, 200, imaging.Lanczos)

	// Generate thumbnail filename
	ext := filepath.Ext(filePath)
	baseName := strings.TrimSuffix(filepath.Base(filePath), ext)
	thumbnailName := fmt.Sprintf("%s_thumb.jpg", baseName)
	thumbnailPath := filepath.Join(uploadsDir, "thumbnails", thumbnailName)

	// Create thumbnails directory
	thumbnailDir := filepath.Dir(thumbnailPath)
	if err := os.MkdirAll(thumbnailDir, 0755); err != nil {
		return "", err
	}

	// Save thumbnail
	if err := imaging.Save(thumbnail, thumbnailPath, imaging.JPEGQuality(80)); err != nil {
		return "", err
	}

	return strings.ReplaceAll(thumbnailPath, "\\", "/"), nil
}

func (fs *FileService) checkDocumentAccess(documentType string, documentID uint, userID uint, userRole string) error {
	switch documentType {
	case "incoming":
		var doc models.IncomingDocument
		if err := database.DB.First(&doc, documentID).Error; err != nil {
			return fmt.Errorf("document not found")
		}
		// Check if user is processor, creator, or has appropriate role
		if doc.ProcessorID != nil && *doc.ProcessorID == userID {
			return nil
		}
		if doc.CreatedByID == userID {
			return nil
		}
		if userRole == models.RoleAdmin || userRole == models.RoleSecretary {
			return nil
		}
	case "outgoing":
		var doc models.OutgoingDocument
		if err := database.DB.First(&doc, documentID).Error; err != nil {
			return fmt.Errorf("document not found")
		}
		// Check if user is drafter, approver, creator, or has appropriate role
		if doc.DrafterID == userID || doc.ApproverID == userID || doc.CreatedByID == userID {
			return nil
		}
		if userRole == models.RoleAdmin || userRole == models.RoleSecretary {
			return nil
		}
	case "task_report":
		var task models.Task
		if err := database.DB.First(&task, documentID).Error; err != nil {
			return fmt.Errorf("task not found")
		}
		// Check if user is assigned to task, creator, or has appropriate role
		if task.AssignedToID != nil && *task.AssignedToID == userID {
			return nil
		}
		if task.CreatedByID == userID {
			return nil
		}
		if userRole == models.RoleAdmin || userRole == models.RoleTeamLeader {
			return nil
		}
	}
	return fmt.Errorf("access denied")
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
