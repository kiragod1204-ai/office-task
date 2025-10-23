# Backend File System Refactoring Summary

## Overview
Refactored the backend file management system to use a centralized `file_service.go` and `models.File` struct for all file operations.

## Changes Made

### 1. Created `backend/models/file.go`
- New File model with all necessary fields
- Proper GORM tags and JSON serialization
- Soft delete support with `deleted_at` field
- Fields include:
  - ID, OriginalName, FileName, FilePath
  - ThumbnailPath (pointer for optional)
  - FileSize, MimeType, FileHash
  - UploadedBy, UploadedAt
  - DocumentType, DocumentID
  - AccessLevel, Summary, OrderNumber
  - CreatedAt, UpdatedAt, DeletedAt

### 2. Updated `backend/services/file_service.go`
- Changed `UploadFile()` return type from `*FileInfo` to `*models.File`
- Updated to use `models.File` instead of `FileInfo` struct
- Fixed duplicate file check to include `deleted_at IS NULL`
- Updated `DeleteFile()` to use `models.File` and handle pointer fields
- Updated `CheckFileAccess()` to use `models.File`
- Proper handling of `ThumbnailPath` as pointer

### 3. Updated `backend/services/document_service.go`
- Changed `GetDocumentFiles()` return type from `[]map[string]interface{}` to `[]models.File`
- Simplified query using GORM's Find() instead of Raw SQL
- Added proper WHERE clause with `deleted_at IS NULL`

### 4. Updated `backend/controllers/file_controller.go`
- Replaced all `services.FileInfo` references with `models.File`
- Updated all database queries to use `models.File` model
- Fixed `GetFileThumbnail()` to handle pointer `ThumbnailPath`
- Updated `GetFilesByDocument()` to use models
- Updated `GetAllFiles()` to use models
- Updated `GetFileInfo()` to use models
- Updated `GetFileVersions()` to use models
- Updated `GetFileStats()` to use Model() method
- Updated `UpdateFileAccess()` to use Model() method

### 5. Controllers Already Using Files Table Correctly
- `backend/controllers/incoming_document_controller.go`
  - `UploadIncomingDocumentFile()` - uses FileService
  - `GetIncomingDocumentFiles()` - uses DocumentService
  
- `backend/controllers/outgoing_document_controller.go`
  - `UploadOutgoingDocumentFile()` - uses FileService
  - `GetOutgoingDocumentFiles()` - uses DocumentService

- `backend/controllers/task_controller.go`
  - `DownloadTaskIncomingDocument()` - queries files table directly
  - `DownloadTaskOutgoingDocument()` - queries files table directly

## File Operations Flow

### Upload Flow
1. Controller receives file upload request
2. Calls `fileService.UploadFile()`
3. FileService validates, saves physical file, generates hash
4. Creates `models.File` record in database
5. Returns `*models.File` with all metadata

### Download Flow
1. Controller receives download request with file path
2. Calls `fileService.CheckFileAccess()` for security
3. FileService queries `models.File` from database
4. Checks access level and user permissions
5. Controller serves file using `c.File()`

### List Files Flow
1. Controller receives request for document files
2. Calls `documentService.GetDocumentFiles(documentType, documentID)`
3. DocumentService queries files table with GORM
4. Returns `[]models.File` with all metadata
5. Controller returns JSON response

### Delete Flow
1. Controller receives delete request
2. Calls `fileService.DeleteFile()`
3. FileService checks access permissions
4. Soft deletes `models.File` record (sets deleted_at)
5. Removes physical file and thumbnail

## Benefits

1. **Centralized Logic**: All file operations go through file_service.go
2. **Type Safety**: Using models.File instead of map[string]interface{}
3. **Consistent API**: All controllers use the same service methods
4. **Security**: Centralized access control in CheckFileAccess()
5. **Soft Deletes**: Files can be recovered if needed
6. **Metadata Rich**: Full file information available in all responses
7. **Deduplication**: File hash prevents duplicate uploads
8. **Thumbnails**: Automatic thumbnail generation for images

## API Endpoints Using File System

### File Management
- `POST /api/files/upload` - EnhancedUploadFile
- `GET /api/files/download` - EnhancedDownloadFile
- `GET /api/files/info` - GetFileInfo
- `GET /api/files/thumbnail` - GetFileThumbnail
- `DELETE /api/files` - DeleteFile
- `GET /api/files/by-document` - GetFilesByDocument
- `GET /api/files/versions` - GetFileVersions

### Document-Specific
- `POST /api/incoming-documents/:id/upload` - UploadIncomingDocumentFile
- `GET /api/incoming-documents/:id/files` - GetIncomingDocumentFiles
- `POST /api/outgoing-documents/:id/upload` - UploadOutgoingDocumentFile
- `GET /api/outgoing-documents/:id/files` - GetOutgoingDocumentFiles

### Task-Related
- `GET /api/tasks/:id/incoming-document/download` - DownloadTaskIncomingDocument
- `GET /api/tasks/:id/outgoing-document/download` - DownloadTaskOutgoingDocument

### Admin
- `GET /api/files/all` - GetAllFiles (admin only)
- `GET /api/files/stats` - GetFileStats (admin only)
- `PUT /api/files/access` - UpdateFileAccess (admin only)
- `DELETE /api/files/bulk` - BulkDeleteFiles (admin only)

## Database Schema

```sql
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL UNIQUE,
    thumbnail_path VARCHAR(500),
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    document_type VARCHAR(50) NOT NULL,
    document_id INTEGER NOT NULL,
    access_level VARCHAR(20) DEFAULT 'restricted',
    summary TEXT,
    order_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

## Next Steps

1. Test all file upload endpoints
2. Test all file download endpoints
3. Verify file access control works correctly
4. Test soft delete and recovery
5. Monitor file storage and cleanup deleted files periodically
6. Add file versioning if needed
7. Implement file compression for large files
8. Add virus scanning for uploaded files
