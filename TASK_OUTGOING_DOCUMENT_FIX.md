# Task-Outgoing Document Relationship Fix

## Problem Description
The issue was that **all tasks created were being incorrectly linked to all outgoing documents** created by the same user within a 24-hour window. This was causing confusion and incorrect data relationships in the task management system.

## Root Cause Analysis
The bug was located in the `GetTaskDocuments` function in `backend/controllers/task_controller.go` around lines 750-755. The problematic code was:

```go
// Find outgoing documents related to this task (through task report or other relationship)
var outgoingDocs []models.OutgoingDocument
database.DB.Preload("DocumentType").Preload("IssuingUnit").Where("created_by_id = ? AND created_at >= ? AND created_at <= ?",
    task.CreatedByID,
    task.CreatedAt.Add(-24*time.Hour),
    task.CreatedAt.Add(24*time.Hour)).Find(&outgoingDocs)
```

This query was using a **broad time-based search** that linked tasks to outgoing documents based on:
1. Same creator (`created_by_id`)
2. Time proximity (within 24 hours of task creation)

This logic was fundamentally flawed because it assumed any outgoing document created by the same user around the same time was related to the task.

## Solution Implemented

### 1. Fixed the Immediate Bug
- Removed the incorrect time-based linking logic
- Modified `GetTaskDocuments` to return only properly linked outgoing documents
- Updated `DownloadTaskOutgoingDocument` to return appropriate error when no relationship exists

### 2. Created Proper Database Schema
- **New Model**: `TaskOutgoingDocument` in `backend/models/task_outgoing_document.go`
- **Database Migration**: `backend/database/migrations/002_create_task_outgoing_document_table.sql`
- **Relationship Types**: 
  - `result` - The outgoing document is a result/completion of the task
  - `reference` - The outgoing document references the task
  - `related` - The outgoing document is related to the task

### 3. New API Endpoints
- `POST /api/tasks/:taskId/outgoing-documents` - Link task to outgoing document
- `DELETE /api/tasks/:taskId/outgoing-documents/:outgoingDocId` - Unlink task from outgoing document
- `GET /api/tasks/:taskId/outgoing-documents` - Get all relationships for a task

### 4. Updated Database Integration
- Added `TaskOutgoingDocument` model to database migrations
- Updated `database.go` to include the new model in auto-migration
- Enhanced migration system to support multiple migration files

## Files Modified

### New Files Created:
- `backend/models/task_outgoing_document.go` - Relationship model
- `backend/database/migrations/002_create_task_outgoing_document_table.sql` - Database migration
- `backend/controllers/task_outgoing_document_controller.go` - API endpoints

### Files Modified:
- `backend/controllers/task_controller.go` - Fixed linking logic
- `backend/database/database.go` - Added model and migration support
- `backend/main.go` - Added new API routes

## API Usage Examples

### Link a Task to an Outgoing Document
```bash
POST /api/tasks/123/outgoing-documents
{
  "outgoing_document_id": 456,
  "relationship_type": "result",
  "notes": "Văn bản đi là kết quả của công việc này"
}
```

### Get Task Documents (Now Returns Correct Data)
```bash
GET /api/tasks/123/documents
```

### Unlink Task from Outgoing Document
```bash
DELETE /api/tasks/123/outgoing-documents/456
```

## Benefits of the Fix

1. **Data Integrity**: Tasks are now only linked to outgoing documents when explicitly related
2. **Clear Relationships**: Proper relationship types with meaningful descriptions
3. **Audit Trail**: Each relationship includes creator information and timestamps
4. **Flexibility**: Support for different types of relationships (result, reference, related)
5. **Permission Control**: Proper access control for creating and removing relationships
6. **Scalability**: Database schema designed for efficient querying and indexing

## Migration Notes

The fix includes automatic database migration that will:
1. Create the new `task_outgoing_documents` table
2. Add proper indexes for performance
3. Set up foreign key constraints for data integrity

Existing tasks will no longer show incorrect outgoing document relationships. Users will need to explicitly create relationships using the new API endpoints.

## Issues Fixed During Implementation

### 1. Database Migration Error
- **Problem**: "column 'created_at' specified more than once" error
- **Cause**: Model used `gorm.Model` (which includes CreatedAt/UpdatedAt) plus explicit CreatedAt/UpdatedAt fields
- **Fix**: Replaced `gorm.Model` with explicit field definitions to avoid conflicts

### 2. Route Conflict Error
- **Problem**: `:taskId` in new path conflicted with existing `:id` wildcard
- **Cause**: Gin router couldn't distinguish between `/api/tasks/:id` and `/api/tasks/:taskId/outgoing-documents`
- **Fix**: Changed all new routes to use `:id` parameter for consistency

## Testing

The fix has been tested to ensure:
- Backend compiles successfully ✓
- Database migrations run correctly ✓
- API endpoints work as expected ✓
- No existing functionality is broken ✓
- Proper error handling for edge cases ✓
- Route conflicts resolved ✓
- Database schema conflicts resolved ✓

## Future Enhancements

Consider these potential improvements:
1. Frontend UI for managing task-outgoing document relationships
2. Bulk linking operations
3. Automatic relationship suggestions based on content analysis
4. Relationship history tracking
5. Export functionality for task-document relationship reports
