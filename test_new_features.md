# Testing New Features for Trưởng Công An Xã

## Backend API Tests

### 1. Test Task Creation by Trưởng Công An Xã
```bash
# Login as team leader
curl -X POST http://localhost:9090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teamleader","password":"team123"}'

# Create task (should work now)
curl -X POST http://localhost:9090/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "description": "Test task created by team leader",
    "deadline": "2024-12-31T23:59:59Z",
    "assigned_to": 5,
    "incoming_file_id": 1
  }'
```

### 2. Test Task Update
```bash
# Update task
curl -X PUT http://localhost:9090/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "description": "Updated task description",
    "deadline": "2024-12-30T23:59:59Z"
  }'
```

### 3. Test Task Forward
```bash
# Forward task
curl -X POST http://localhost:9090/api/tasks/1/forward \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "assigned_to": 3,
    "comment": "Forwarding to deputy for review"
  }'
```

### 4. Test Task Delete
```bash
# Delete task
curl -X DELETE http://localhost:9090/api/tasks/1 \
  -H "Authorization: Bearer <token>"
```

## Frontend Tests

### 1. Login as Trưởng Công An Xã
- Username: `teamleader`
- Password: `team123`

### 2. Verify Navigation
- Should see "Tạo công việc" in navigation menu
- Should be able to access `/create-task` page

### 3. Test Task Management
- Go to any task detail page
- Should see "Quản lý công việc" section with:
  - Chỉnh sửa button (for tasks created by or assigned to team leader)
  - Chuyển tiếp button
  - Xóa công việc button (for tasks created by team leader, not completed)

### 4. Test Task Creation
- Go to "Tạo công việc" page
- Should be able to create tasks successfully
- Tasks should be assigned to team leaders or officers

## Expected Permissions

### Trưởng Công An Xã can:
- ✅ Create tasks
- ✅ Edit tasks they created or are assigned to
- ✅ Delete tasks they created (if not completed)
- ✅ Forward tasks to other users
- ✅ Assign tasks to team leaders or officers
- ✅ Update task status
- ✅ Add comments

### Trưởng Công An Xã cannot:
- ❌ Edit tasks created by others (unless assigned to them)
- ❌ Delete completed tasks
- ❌ Delete tasks created by others
- ❌ Access admin-only features (user management)

## Error Cases to Test

1. Try to edit a task not created by or assigned to team leader → Should get 403 Forbidden
2. Try to delete a completed task → Should get 400 Bad Request
3. Try to delete a task created by someone else → Should get 403 Forbidden
4. Forward task without selecting a user → Should show validation error