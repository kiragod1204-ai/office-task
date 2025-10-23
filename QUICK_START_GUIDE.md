# Quick Start Guide - Document Management System

## 🚀 Getting Started

### Starting the Application

#### Backend
```bash
cd backend
./run.sh          # Linux/macOS
# or
run.bat           # Windows
```
Server runs on: http://localhost:9090

#### Frontend
```bash
cd frontend
npm install       # First time only
npm run dev
```
Frontend runs on: http://localhost:3000

## 👥 Default User Accounts

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| admin | admin123 | Quản trị viên | Full system access |
| secretary | secretary123 | Văn thư | Create documents, upload files |
| teamleader | team123 | Trưởng Công An Xã | Approve, assign tasks |
| deputy | deputy123 | Phó Công An Xã | Approve, assign tasks |
| officer | officer123 | Cán bộ | Process tasks, upload reports |

## 📄 Working with Documents

### Creating an Incoming Document

1. **Login** as Secretary or Admin
2. Navigate to **Văn bản đến**
3. Click **Tạo văn bản đến**
4. Fill in the form:
   - Arrival date (Ngày đến)
   - Original number (Số ký hiệu)
   - Document date (Ngày văn bản)
   - Document type (Loại văn bản)
   - Issuing unit (Đơn vị ban hành)
   - Summary (Trích yếu)
   - Internal notes (optional)
   - Processor (optional - Team Leader/Deputy)
5. Click **Tạo văn bản**
6. **Upload file** on the document detail page

### Creating an Outgoing Document

1. **Login** as Secretary or Admin
2. Navigate to **Văn bản đi**
3. Click **Tạo văn bản đi**
4. Fill in the form:
   - Document number (Số văn bản)
   - Issue date (Ngày ban hành)
   - Document type (Loại văn bản)
   - Issuing unit (Đơn vị ban hành)
   - Summary (Trích yếu)
   - Drafter (Người soạn thảo)
   - Approver (Người phê duyệt)
   - Internal notes (optional)
5. Click **Tạo văn bản**
6. **Upload draft** on the document detail page

### Viewing Document Details

1. Navigate to **Văn bản đến** or **Văn bản đi**
2. Click on any document in the list
3. View comprehensive information:
   - Document details
   - Attached files
   - Related tasks
   - Activity timeline
   - Quick actions

## 📎 Uploading Files

### Role-Based Upload Permissions

#### Incoming Documents
- **Secretary/Admin**: Can upload anytime
- **Team Leader/Deputy**: Can upload notes and decisions (not on completed docs)
- **Officer**: Can upload processing reports (only during processing)

#### Outgoing Documents
- **Secretary/Admin**: Can upload anytime
- **Team Leader/Deputy**: Can upload drafts and signed versions
- **Officer**: Can upload drafts (only during draft/review)

### How to Upload

1. Open document detail page
2. Look for **Upload file** button in the Files section
3. Click the button
4. Select file from your computer
5. Wait for upload to complete
6. File appears in the file list

**Supported formats**: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (up to 10MB)

## 📋 Working with Tasks

### Creating a Task from Document

**Method 1: From Document Detail Page**
1. Open incoming document detail
2. Scroll to **Công việc liên quan** section
3. Click **Tạo công việc**
4. Fill in task details:
   - Description (Mô tả)
   - Deadline (Thời hạn)
   - Assigned to (Giao cho)
   - Processing notes (optional)
5. Click **Tạo công việc**
6. Task is automatically linked to the document

**Method 2: From Create Task Page**
1. Navigate to **Tạo công việc**
2. Fill in task details
3. Select **Văn bản đến** from dropdown
4. Complete the form
5. Click **Tạo công việc**

### Viewing Related Tasks

1. Open document detail page
2. Scroll to **Công việc liên quan** section
3. See all tasks linked to this document
4. Click on any task to view details
5. See task status, assignee, and deadline

### Task Workflow

```
Chưa bắt đầu → Đang xử lí → Xem xét → Hoàn thành
```

**As Officer:**
1. Receive task assignment
2. Update status to "Đang xử lí"
3. Upload processing report
4. Submit for review (Nộp để xem xét)

**As Team Leader/Deputy:**
1. Review submitted work
2. Approve (Hoàn thành) or request rework
3. Add comments if needed

## 🔍 Searching and Filtering

### Document Search
1. Navigate to document list page
2. Use search box to find documents
3. Filter by:
   - Status
   - Document type
   - Issuing unit
   - Date range
   - Processor/Drafter

### Task Search
1. Navigate to **Công việc**
2. Use filters:
   - Status
   - Assigned to
   - Created by
   - Deadline range
   - Priority

## 📊 Dashboard Overview

### What You'll See
- **Document Statistics**: Total incoming/outgoing documents by status
- **Task Statistics**: Tasks by status and urgency
- **Recent Activity**: Latest documents and tasks
- **Pending Items**: Items requiring your attention
- **Quick Actions**: Common operations

### Role-Based Dashboard

**Secretary/Admin:**
- All documents and tasks
- System statistics
- User activity

**Team Leader/Deputy:**
- Assigned documents
- Tasks to review
- Team performance

**Officer:**
- Assigned tasks
- Pending work
- Deadlines

## 💡 Tips and Best Practices

### Document Management
1. **Always add summary**: Makes searching easier
2. **Upload files immediately**: Don't forget to attach documents
3. **Use internal notes**: Add context for your team
4. **Assign processor early**: Speed up workflow
5. **Check related tasks**: Ensure all work is tracked

### Task Management
1. **Link to documents**: Always connect tasks to source documents
2. **Set realistic deadlines**: Consider workload
3. **Add processing notes**: Document your work
4. **Upload reports**: Attach evidence of completion
5. **Use comments**: Communicate with team

### File Management
1. **Use descriptive names**: Make files easy to identify
2. **Check file size**: Keep under 10MB
3. **Use correct format**: PDF for official documents
4. **Version control**: Upload new version when updating
5. **Download before editing**: Keep local backups

## 🔧 Troubleshooting

### Can't Upload File
**Problem**: Upload button is disabled or missing
**Solution**: 
- Check your role permissions
- Verify document status allows uploads
- Ensure file size is under 10MB
- Check file format is supported

### Can't See Document
**Problem**: Document doesn't appear in list
**Solution**:
- Check your role permissions
- Verify filters aren't hiding it
- Refresh the page
- Check if document was deleted

### Can't Create Task
**Problem**: Create task button is disabled
**Solution**:
- Check your role (Secretary or Team Leader only)
- Verify you're logged in
- Check if document exists
- Refresh the page

### File Won't Download
**Problem**: Download fails or file is corrupted
**Solution**:
- Check your internet connection
- Try again in a few moments
- Contact admin if file is missing
- Verify file was uploaded correctly

## 📞 Getting Help

### In-App Help
- Hover over buttons for tooltips
- Check error messages for guidance
- Look for info icons (ℹ️) for explanations

### Common Questions

**Q: Who can create documents?**
A: Secretary and Admin only

**Q: Who can upload files?**
A: Depends on role and document status (see permissions above)

**Q: How do I link a task to a document?**
A: Create task from document detail page or select document when creating task

**Q: Can I delete a document?**
A: Yes, if you're Secretary/Admin and document has no active tasks

**Q: How do I change document status?**
A: Status changes automatically based on workflow actions

## 🎯 Quick Reference

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Quick search (coming soon)
- `Esc`: Close dialogs
- `Enter`: Submit forms

### Status Colors
- 🔵 Blue: In progress
- 🟢 Green: Completed
- 🟡 Yellow: Pending review
- 🔴 Red: Overdue/Rejected
- ⚪ Gray: Not started

### Priority Levels
- **Normal**: Standard processing
- **High**: Expedited handling
- **Urgent**: Immediate attention required

## 📚 Additional Resources

- **API Documentation**: See `API_Documentation.md`
- **Feature Summary**: See `FEATURE_SUMMARY.md`
- **Refactoring Details**: See `DOCUMENT_MANAGEMENT_REFACTORING.md`
- **System Instructions**: See `AI_Code_Agent_Instruction.md`

---

**Need more help?** Contact your system administrator or refer to the detailed documentation files.
