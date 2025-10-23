# Link Outgoing Documents to Tasks - Feature Implementation

## Overview
Added functionality to link outgoing documents to tasks, allowing users to associate task work with the resulting outgoing documents (reports, responses, etc.).

## Changes Made

### 1. Backend API (Already Existed)
The backend already has the necessary endpoints:
- `POST /api/tasks/:id/outgoing-documents` - Link an outgoing document to a task
- `DELETE /api/tasks/:id/outgoing-documents/:outgoingDocId` - Unlink an outgoing document
- `GET /api/tasks/:id/outgoing-documents` - Get all linked outgoing documents for a task

### 2. Frontend API (`frontend/src/api/tasks.ts`)

**Added Interface:**
```typescript
export interface TaskOutgoingDocument {
  ID: number
  task_id: number
  outgoing_document_id: number
  linked_by_id: number
  notes: string
  CreatedAt: string
  outgoing_document?: {
    id: number
    document_number: string
    summary: string
    status: string
    issue_date: string
  }
}
```

**Added API Functions:**
```typescript
linkOutgoingDocument(taskId, data) - Link a document to task
unlinkOutgoingDocument(taskId, outgoingDocId) - Unlink a document
getTaskOutgoingDocuments(taskId) - Get all linked documents
```

### 3. New Component (`frontend/src/components/tasks/LinkOutgoingDocumentDialog.tsx`)

**Features:**
- ✅ Search and filter outgoing documents
- ✅ View already linked documents at the top
- ✅ Link/unlink documents with one click
- ✅ Visual indicators for linked documents
- ✅ Status badges for document status
- ✅ Document metadata display (number, summary, date, type)
- ✅ Loading states and error handling
- ✅ Responsive design with scrollable list

**UI Components:**
- Search bar with clear button
- Linked documents section (highlighted in blue)
- Available documents list
- Link/Unlink buttons with icons
- Status badges with color coding
- Loading spinners

### 4. Updated Task Detail Page (`frontend/src/pages/TaskDetailPage.tsx`)

**Added:**
- Import for `LinkOutgoingDocumentDialog`
- State for dialog open/close: `linkDocDialogOpen`
- Button in Actions section: "Liên kết văn bản đi"
- Dialog component at the end of the page

**Button Location:**
In the sidebar "Hành động" (Actions) card, under "Văn bản liên quan" section.

## User Flow

### Linking a Document
1. User opens task detail page
2. Clicks "Liên kết văn bản đi" button in Actions sidebar
3. Dialog opens showing:
   - Already linked documents (if any) at the top
   - Search bar to filter documents
   - List of available outgoing documents
4. User searches for document (optional)
5. User clicks "Liên kết" button next to desired document
6. Document is linked and moves to "Văn bản đã liên kết" section
7. Success toast notification appears

### Unlinking a Document
1. User opens link dialog
2. Sees linked documents in blue section at top
3. Clicks "Hủy" (Unlink) button with red icon
4. Document is unlinked and returns to available list
5. Success toast notification appears

## Visual Design

### Linked Documents Section
- Blue background (`bg-blue-50`)
- Blue border (`border-blue-200`)
- Document number and status badge
- Summary text
- Unlink button (red, ghost variant)

### Available Documents List
- White/gray background
- Hover effect
- Document number (blue, bold)
- Status badge with color coding
- Summary and metadata
- Link button (primary blue)

### Status Badge Colors
- **Draft** (Bản thảo): Gray
- **Review** (Đang xem xét): Yellow
- **Approved** (Đã phê duyệt): Green
- **Sent** (Đã gửi): Blue
- **Rejected** (Từ chối): Red

## Benefits

### For Users
1. **Clear Association**: Link tasks to their resulting documents
2. **Easy Tracking**: See which documents came from which tasks
3. **Quick Access**: Navigate between related tasks and documents
4. **Audit Trail**: Track document creation from task completion

### For Workflow
1. **Document Traceability**: Know the origin of every outgoing document
2. **Task Completion**: Verify tasks have produced required documents
3. **Reporting**: Generate reports on task-to-document relationships
4. **Compliance**: Maintain records of work and outputs

## Use Cases

### 1. Response Letters
- Task: "Trả lời công văn số 123"
- Linked Document: "Công văn trả lời 456/CV"

### 2. Reports
- Task: "Lập báo cáo tình hình tháng 12"
- Linked Document: "Báo cáo 789/BC"

### 3. Decisions
- Task: "Soạn thảo quyết định phân công"
- Linked Document: "Quyết định 012/QĐ"

### 4. Multiple Documents
- Task: "Xử lý văn bản khẩn"
- Linked Documents:
  - "Công văn báo cáo 111/CV"
  - "Tờ trình đề xuất 222/TT"
  - "Quyết định xử lý 333/QĐ"

## Technical Details

### API Endpoints Used
```
POST   /api/tasks/:id/outgoing-documents
DELETE /api/tasks/:id/outgoing-documents/:outgoingDocId
GET    /api/tasks/:id/outgoing-documents
GET    /api/outgoing-documents (for listing)
```

### Data Flow
1. User clicks "Liên kết văn bản đi"
2. Dialog loads all outgoing documents
3. Dialog loads already linked documents
4. User selects document to link
5. POST request to backend
6. Backend creates TaskOutgoingDocument record
7. Frontend refreshes linked documents list
8. Success notification shown

### Error Handling
- Network errors: Toast notification
- Already linked: Prevented by UI (button disabled)
- Permission errors: Toast notification
- Loading states: Spinner indicators

## Permissions

### Who Can Link Documents?
Currently, any user who can view the task detail page can link documents. This can be restricted by:
- Role-based checks
- Task status checks
- Document status checks

### Suggested Restrictions
- Only task assignee can link documents
- Only when task is in "Xem xét" or "Hoàn thành" status
- Only approved/sent outgoing documents can be linked

## Future Enhancements

### Potential Improvements
1. **Notes Field**: Add notes when linking (why this document is linked)
2. **Link Type**: Categorize links (response, report, decision, etc.)
3. **Bulk Linking**: Link multiple documents at once
4. **Auto-Linking**: Suggest documents based on task description
5. **Timeline**: Show when documents were linked in task history
6. **Notifications**: Notify relevant users when documents are linked
7. **Validation**: Prevent linking documents from different contexts
8. **Templates**: Create document templates from task types

### Quick Wins
1. Add link count badge in task list
2. Show linked documents in task card
3. Add "Create Document" button in link dialog
4. Add document preview in dialog
5. Add sorting/filtering in dialog

## Testing Checklist

- [x] Dialog opens correctly
- [x] Documents load properly
- [x] Search filters work
- [x] Link button works
- [x] Unlink button works
- [x] Linked documents show at top
- [x] Status badges display correctly
- [x] Loading states work
- [x] Error handling works
- [x] Toast notifications appear
- [x] Dialog closes properly
- [x] Task refreshes after linking
- [ ] Permissions enforced (if implemented)
- [ ] Multiple links work
- [ ] Concurrent linking handled

## Documentation

### For Users
**How to link an outgoing document to a task:**
1. Open the task detail page
2. Look for "Hành động" (Actions) section in the right sidebar
3. Click "Liên kết văn bản đi" button
4. Search for the document you want to link
5. Click "Liên kết" button next to the document
6. The document will appear in the "Văn bản đã liên kết" section

**How to unlink a document:**
1. Open the link dialog
2. Find the document in "Văn bản đã liên kết" section
3. Click the red "Hủy" button
4. The document will be unlinked

### For Developers
**To add linking to other components:**
```typescript
import { LinkOutgoingDocumentDialog } from '@/components/tasks/LinkOutgoingDocumentDialog';

// In your component
const [dialogOpen, setDialogOpen] = useState(false);

// Render
<LinkOutgoingDocumentDialog
  taskId={taskId}
  isOpen={dialogOpen}
  onClose={() => setDialogOpen(false)}
  onSuccess={() => {
    // Refresh your data
  }}
/>
```

## Conclusion

The outgoing document linking feature successfully provides a way to associate tasks with their resulting documents, improving traceability and workflow management. The implementation is user-friendly, performant, and follows the existing design patterns in the application.
