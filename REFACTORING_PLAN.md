# Document Management System Refactoring Plan

## Overview
Refactor the system to make Incoming and Outgoing Documents the primary features with enhanced task linking, document viewing, and role-based file uploads.

## Key Changes

### 1. Backend Enhancements

#### A. Enhanced Document-Task Linking
- Add bidirectional relationship between documents and tasks
- Allow multiple tasks per document
- Show all related tasks in document detail view
- Add task creation directly from document view

#### B. Role-Based File Upload Permissions
- **Incoming Documents:**
  - Secretary: Upload initial document
  - Team Leader/Deputy: Upload additional files (notes, decisions)
  - Officer: Upload processing reports
  
- **Outgoing Documents:**
  - Secretary: Upload final signed document
  - Team Leader/Deputy: Upload draft and signed versions
  - Officer: Upload draft documents
  - Drafter: Upload working drafts

#### C. Enhanced File Management
- Multiple file attachments per document
- File versioning support
- File type categorization (original, draft, signed, attachment)
- Download all files as ZIP

### 2. Frontend Enhancements

#### A. Document-Centric Navigation
- Make documents the primary navigation focus
- Dashboard shows document statistics prominently
- Quick actions for document operations

#### B. Enhanced Document Detail View
- Show all related tasks
- File gallery with preview
- Timeline of document activities
- Quick task creation from document

#### C. Improved File Upload UI
- Drag-and-drop file upload
- Multiple file selection
- File preview before upload
- Progress indicators
- Role-based upload buttons

#### D. Document-Task Linking UI
- Link existing tasks to documents
- Create new tasks from documents
- View task status in document list
- Filter documents by task status

### 3. New Features

#### A. Document Workflow
- Visual workflow for document processing
- Status transitions with validation
- Automatic notifications on status changes

#### B. Bulk Operations
- Bulk file upload
- Bulk task creation from documents
- Bulk status updates

#### C. Advanced Search
- Search across documents and tasks
- Filter by multiple criteria
- Save search filters

## Implementation Priority

### Phase 1: Core Backend (High Priority)
1. ✅ Enhanced document-task relationship models
2. ✅ Multiple file attachments per document
3. ✅ Role-based file upload permissions
4. ✅ Document-task linking endpoints

### Phase 2: Core Frontend (High Priority)
1. ✅ Enhanced document detail pages
2. ✅ File upload components with role checks
3. ✅ Task linking UI
4. ✅ Document-centric dashboard

### Phase 3: Advanced Features (Medium Priority)
1. File versioning
2. Document workflow visualization
3. Bulk operations
4. Advanced search and filters

### Phase 4: Polish (Low Priority)
1. File preview/thumbnails
2. Activity timeline
3. Export/reporting features
4. Mobile responsiveness

## Files to Modify/Create

### Backend
- `backend/models/incoming_document.go` - Enhanced relationships
- `backend/models/outgoing_document.go` - Enhanced relationships
- `backend/controllers/incoming_document_controller.go` - New endpoints
- `backend/controllers/outgoing_document_controller.go` - New endpoints
- `backend/controllers/file_controller.go` - Enhanced file management
- `backend/services/document_service.go` - NEW: Document business logic
- `backend/middleware/file_upload.go` - NEW: Role-based upload validation

### Frontend
- `frontend/src/pages/IncomingDocumentDetailPage.tsx` - NEW: Enhanced detail view
- `frontend/src/pages/OutgoingDocumentDetailPage.tsx` - NEW: Enhanced detail view
- `frontend/src/components/documents/FileUploadZone.tsx` - NEW: Drag-drop upload
- `frontend/src/components/documents/DocumentTaskList.tsx` - NEW: Related tasks
- `frontend/src/components/documents/DocumentTimeline.tsx` - NEW: Activity timeline
- `frontend/src/components/documents/TaskLinkDialog.tsx` - NEW: Link tasks
- `frontend/src/api/documents.ts` - NEW: Unified document API

## Success Criteria
- ✅ Documents are the primary feature in navigation
- ✅ Easy file upload with role-based permissions
- ✅ Clear document-task relationships
- ✅ Intuitive document workflow
- ✅ Fast document search and filtering
