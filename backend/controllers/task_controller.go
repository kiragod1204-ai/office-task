package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"ai-code-agent-backend/services"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Helper function to create task status history
func createTaskStatusHistory(taskID uint, oldStatus, newStatus string, changedByID uint, notes string) error {
	history := models.TaskStatusHistory{
		TaskID:      taskID,
		OldStatus:   oldStatus,
		NewStatus:   newStatus,
		ChangedByID: changedByID,
		Notes:       notes,
	}
	return database.DB.Create(&history).Error
}

type CreateTaskRequest struct {
	Description        string `json:"description" binding:"required"`
	Deadline           string `json:"deadline"`
	DeadlineType       string `json:"deadline_type"`
	AssignedTo         uint   `json:"assigned_to" binding:"required"`
	IncomingDocumentID *uint  `json:"incoming_document_id"`
	TaskType           string `json:"task_type"`
	ProcessingContent  string `json:"processing_content"`
	ProcessingNotes    string `json:"processing_notes"`
}

type AssignTaskRequest struct {
	AssignedTo uint `json:"assigned_to" binding:"required"`
}

func CreateTask(c *gin.Context) {
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")

	// Set default values
	taskType := req.TaskType
	if taskType == "" {
		if req.IncomingDocumentID != nil {
			taskType = models.TaskTypeDocumentLinked
		} else {
			taskType = models.TaskTypeIndependent
		}
	}

	deadlineType := req.DeadlineType
	if deadlineType == "" {
		deadlineType = models.DeadlineTypeSpecific
	}

	task := models.Task{
		Description:        req.Description,
		Status:             models.StatusNotStarted,
		AssignedToID:       &req.AssignedTo,
		CreatedByID:        userID.(uint),
		IncomingDocumentID: req.IncomingDocumentID,
		TaskType:           taskType,
		DeadlineType:       deadlineType,
		ProcessingContent:  req.ProcessingContent,
		ProcessingNotes:    req.ProcessingNotes,
	}

	// Parse deadline if provided
	if req.Deadline != "" {
		var deadline time.Time
		var err error

		// Try multiple date formats
		formats := []string{
			time.RFC3339,           // 2006-01-02T15:04:05Z07:00
			"2006-01-02T15:04:05Z", // 2006-01-02T15:04:05Z
			"2006-01-02T15:04:05",  // 2006-01-02T15:04:05 (datetime-local)
			"2006-01-02 15:04:05",  // 2006-01-02 15:04:05
			"2006-01-02",           // 2006-01-02 (date only)
		}

		for _, format := range formats {
			deadline, err = time.Parse(format, req.Deadline)
			if err == nil {
				break
			}
		}

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng thời gian không hợp lệ. Vui lòng sử dụng định dạng: YYYY-MM-DDTHH:MM:SS"})
			return
		}

		task.Deadline = &deadline
	}

	if err := database.DB.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo công việc"})
		return
	}

	// Create initial status history
	createTaskStatusHistory(task.ID, "", models.StatusNotStarted, userID.(uint), "Tạo công việc mới")

	// Load relations
	database.DB.Preload("AssignedTo").Preload("AssignedUser").Preload("CreatedBy").Preload("Creator").Preload("IncomingDocument.DocumentType").Preload("IncomingDocument.IssuingUnit").Preload("IncomingFile.DocumentType").Preload("IncomingFile.IssuingUnit").Preload("StatusHistory.ChangedBy").First(&task, task.ID)

	c.JSON(http.StatusCreated, task)
}

func GetTasks(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// Parse filter parameters
	filterParams := services.ParseTaskFilterParams(c)

	var tasks []models.Task
	query := database.DB.Preload("AssignedTo").Preload("AssignedUser").Preload("CreatedBy").Preload("Creator").Preload("IncomingDocument.DocumentType").Preload("IncomingDocument.IssuingUnit").Preload("IncomingFile.DocumentType").Preload("IncomingFile.IssuingUnit").Preload("Comments.User")

	// Filter based on role
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin:
		// Can see all tasks
	case models.RoleTeamLeader, models.RoleDeputy:
		// Can see tasks assigned to them or created by them
		query = query.Where("assigned_to_id = ? OR created_by_id = ?", userID, userID)
	case models.RoleOfficer:
		// Can only see tasks assigned to them
		query = query.Where("assigned_to_id = ?", userID)
	}

	// Apply advanced filters
	query = services.ApplyTaskFilters(query, filterParams)

	// Apply sorting
	allowedSortFields := []string{"created_at", "updated_at", "deadline", "status", "description"}
	query = services.ApplySorting(query, filterParams.SortBy, filterParams.SortOrder, allowedSortFields)

	// Get total count before pagination
	var total int64
	query.Model(&models.Task{}).Count(&total)

	// Apply pagination
	query = services.ApplyPagination(query, filterParams.Page, filterParams.Limit)

	// Get tasks
	if err := query.Preload("StatusHistory.ChangedBy").Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách công việc"})
		return
	}

	// Add remaining time information to each task
	type TaskWithRemainingTime struct {
		models.Task
		RemainingTime models.RemainingTimeInfo `json:"remaining_time"`
	}

	var tasksWithTime []TaskWithRemainingTime
	for _, task := range tasks {
		tasksWithTime = append(tasksWithTime, TaskWithRemainingTime{
			Task:          task,
			RemainingTime: task.GetRemainingTime(),
		})
	}

	// Return response with pagination info
	response := gin.H{
		"tasks":      tasksWithTime,
		"pagination": services.GetPaginationInfo(total, filterParams.Page, filterParams.Limit),
	}

	c.JSON(http.StatusOK, response)
}

func GetTask(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var task models.Task
	if err := database.DB.Preload("AssignedTo").Preload("AssignedUser").Preload("CreatedBy").Preload("Creator").Preload("IncomingDocument.DocumentType").Preload("IncomingDocument.IssuingUnit").Preload("IncomingFile.DocumentType").Preload("IncomingFile.IssuingUnit").Preload("Comments.User").Preload("StatusHistory.ChangedBy").First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Add remaining time information
	type TaskWithRemainingTime struct {
		models.Task
		RemainingTime models.RemainingTimeInfo `json:"remaining_time"`
	}

	taskWithTime := TaskWithRemainingTime{
		Task:          task,
		RemainingTime: task.GetRemainingTime(),
	}

	c.JSON(http.StatusOK, taskWithTime)
}

func AssignTask(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req AssignTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")

	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	oldStatus := task.Status

	// Update assignment and status
	task.AssignedToID = &req.AssignedTo
	if task.Status == models.StatusNotStarted {
		task.Status = models.StatusProcessing
	}

	if err := database.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể gán công việc"})
		return
	}

	// Create status history if status changed
	if oldStatus != task.Status {
		createTaskStatusHistory(task.ID, oldStatus, task.Status, userID.(uint), "Gán công việc và chuyển trạng thái")
	}

	// Load relations
	database.DB.Preload("AssignedTo").Preload("AssignedUser").Preload("CreatedBy").Preload("Creator").Preload("IncomingDocument.DocumentType").Preload("IncomingDocument.IssuingUnit").Preload("IncomingFile.DocumentType").Preload("IncomingFile.IssuingUnit").Preload("StatusHistory.ChangedBy").First(&task, task.ID)

	c.JSON(http.StatusOK, task)
}

// GetTaskWorkflow returns workflow information for a task
func GetTaskWorkflow(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var task models.Task
	if err := database.DB.Preload("AssignedTo").Preload("CreatedBy").First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Define workflow stages
	stages := []map[string]interface{}{
		{
			"id":          1,
			"name":        "Tiếp nhận văn bản",
			"description": "Văn bản được tiếp nhận và tạo công việc",
			"status":      models.StatusReceived,
			"icon":        "FileText",
			"completed":   true,
			"current":     task.Status == models.StatusReceived,
			"timestamp":   task.CreatedAt,
			"user":        task.CreatedBy.Name,
		},
		{
			"id":          2,
			"name":        "Đang xử lí",
			"description": "Công việc được gán và đang được xử lí",
			"status":      models.StatusProcessing,
			"icon":        "Settings",
			"completed":   task.Status == models.StatusReview || task.Status == models.StatusCompleted,
			"current":     task.Status == models.StatusProcessing,
			"timestamp":   nil,
			"user":        nil,
		},
		{
			"id":          3,
			"name":        "Xem xét",
			"description": "Báo cáo được gửi và đang chờ xem xét",
			"status":      models.StatusReview,
			"icon":        "Eye",
			"completed":   task.Status == models.StatusCompleted,
			"current":     task.Status == models.StatusReview,
			"timestamp":   nil,
			"user":        nil,
		},
		{
			"id":          4,
			"name":        "Hoàn thành",
			"description": "Công việc đã được hoàn thành",
			"status":      models.StatusCompleted,
			"icon":        "CheckCircle",
			"completed":   task.Status == models.StatusCompleted,
			"current":     task.Status == models.StatusCompleted,
			"timestamp":   nil,
			"user":        nil,
		},
	}

	// Add assigned user info for processing stage
	if task.AssignedToID != nil && *task.AssignedToID > 0 {
		if len(stages) > 1 && task.AssignedTo != nil {
			stages[1]["user"] = task.AssignedTo.Name
		}
	}

	// Get status change history from comments or create timestamps
	var comments []models.Comment
	database.DB.Preload("User").Where("task_id = ?", task.ID).Order("created_at asc").Find(&comments)

	// Try to determine timestamps from status changes
	for i := range stages {
		if stageStatus, ok := stages[i]["status"].(string); ok {
			// Find relevant comments that might indicate status changes
			for _, comment := range comments {
				if strings.Contains(strings.ToLower(comment.Content), strings.ToLower(stageStatus)) {
					stages[i]["timestamp"] = comment.CreatedAt
					stages[i]["user"] = comment.User.Name
					break
				}
			}
		}
	}

	// Calculate progress percentage
	completedStages := 0
	for _, stage := range stages {
		if completed, ok := stage["completed"].(bool); ok && completed {
			completedStages++
		}
	}
	progress := (completedStages * 100) / len(stages)

	response := map[string]interface{}{
		"task_id":  task.ID,
		"status":   task.Status,
		"stages":   stages,
		"progress": progress,
		"metadata": map[string]interface{}{
			"created_at": task.CreatedAt,
			"updated_at": task.UpdatedAt,
			"deadline":   task.Deadline,
			"assigned_to": func() string {
				if task.AssignedTo != nil {
					return task.AssignedTo.Name
				}
				return ""
			}(),
			"created_by":    task.CreatedBy.Name,
			"has_report":    task.ReportFile != "",
			"total_stages":  len(stages),
			"current_stage": getCurrentStageIndex(task.Status),
		},
	}

	c.JSON(http.StatusOK, response)
}

func getCurrentStageIndex(status string) int {
	switch status {
	case models.StatusReceived:
		return 1
	case models.StatusProcessing:
		return 2
	case models.StatusReview:
		return 3
	case models.StatusCompleted:
		return 4
	default:
		return 1
	}
}

type UpdateTaskStatusRequest struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"notes"`
}

func UpdateTaskStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req UpdateTaskStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")

	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	oldStatus := task.Status
	task.Status = req.Status

	// Set completion date if task is completed
	if req.Status == models.StatusCompleted && task.CompletionDate == nil {
		now := time.Now()
		task.CompletionDate = &now
	}

	if err := database.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật trạng thái"})
		return
	}

	// Create status history
	notes := req.Notes
	if notes == "" {
		notes = "Cập nhật trạng thái công việc"
	}
	createTaskStatusHistory(task.ID, oldStatus, task.Status, userID.(uint), notes)

	// Load relations
	database.DB.Preload("AssignedTo").Preload("AssignedUser").Preload("CreatedBy").Preload("Creator").Preload("IncomingDocument.DocumentType").Preload("IncomingDocument.IssuingUnit").Preload("StatusHistory.ChangedBy").First(&task, task.ID)

	c.JSON(http.StatusOK, task)
}

type UpdateTaskRequest struct {
	Description        string `json:"description"`
	Deadline           string `json:"deadline"`
	DeadlineType       string `json:"deadline_type"`
	AssignedTo         uint   `json:"assigned_to"`
	IncomingDocumentID *uint  `json:"incoming_document_id"`
	TaskType           string `json:"task_type"`
	ProcessingContent  string `json:"processing_content"`
	ProcessingNotes    string `json:"processing_notes"`
}

func UpdateTask(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Check permissions
	if userRole.(string) == models.RoleSecretary {
		// Secretary can update any task
	} else if userRole.(string) == models.RoleTeamLeader {
		// Team leader can update tasks they created or are assigned to
		if task.CreatedByID != userID.(uint) && (task.AssignedToID == nil || *task.AssignedToID != userID.(uint)) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền chỉnh sửa công việc này"})
			return
		}
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền chỉnh sửa công việc"})
		return
	}

	// Update fields if provided
	updates := make(map[string]interface{})
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Deadline != "" {
		var deadline time.Time
		var err error

		// Try multiple date formats
		formats := []string{
			time.RFC3339,           // 2006-01-02T15:04:05Z07:00
			"2006-01-02T15:04:05Z", // 2006-01-02T15:04:05Z
			"2006-01-02T15:04:05",  // 2006-01-02T15:04:05 (datetime-local)
			"2006-01-02 15:04:05",  // 2006-01-02 15:04:05
			"2006-01-02",           // 2006-01-02 (date only)
		}

		for _, format := range formats {
			deadline, err = time.Parse(format, req.Deadline)
			if err == nil {
				break
			}
		}

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng thời gian không hợp lệ. Vui lòng sử dụng định dạng: YYYY-MM-DDTHH:MM:SS"})
			return
		}

		updates["deadline"] = deadline
	}
	if req.DeadlineType != "" {
		updates["deadline_type"] = req.DeadlineType
	}
	if req.AssignedTo > 0 {
		updates["assigned_to_id"] = req.AssignedTo
	}
	if req.IncomingDocumentID != nil {
		updates["incoming_document_id"] = req.IncomingDocumentID
	}
	if req.TaskType != "" {
		updates["task_type"] = req.TaskType
	}
	if req.ProcessingContent != "" {
		updates["processing_content"] = req.ProcessingContent
	}
	if req.ProcessingNotes != "" {
		updates["processing_notes"] = req.ProcessingNotes
	}

	if err := database.DB.Model(&task).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật công việc"})
		return
	}

	// Create status history for update
	createTaskStatusHistory(task.ID, task.Status, task.Status, userID.(uint), "Cập nhật thông tin công việc")

	// Load relations
	database.DB.Preload("AssignedTo").Preload("AssignedUser").Preload("CreatedBy").Preload("Creator").Preload("IncomingDocument.DocumentType").Preload("IncomingDocument.IssuingUnit").Preload("StatusHistory.ChangedBy").First(&task, task.ID)

	c.JSON(http.StatusOK, task)
}

func DeleteTask(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Check permissions
	if userRole.(string) == models.RoleSecretary {
		// Secretary can delete any task
	} else if userRole.(string) == models.RoleTeamLeader {
		// Team leader can delete tasks they created
		if task.CreatedByID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền xóa công việc này"})
			return
		}
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền xóa công việc"})
		return
	}

	// Check if task can be deleted (only if not completed)
	if task.Status == models.StatusCompleted {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không thể xóa công việc đã hoàn thành"})
		return
	}

	// Delete related comments first
	if err := database.DB.Where("task_id = ?", id).Delete(&models.Comment{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa bình luận liên quan"})
		return
	}

	// Delete the task
	if err := database.DB.Delete(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa công việc"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Xóa công việc thành công"})
}

type ForwardTaskRequest struct {
	AssignedTo uint   `json:"assigned_to" binding:"required"`
	Comment    string `json:"comment"`
}

type DelegateTaskRequest struct {
	AssignedTo uint   `json:"assigned_to" binding:"required"`
	Notes      string `json:"notes"`
}

type UpdateProcessingContentRequest struct {
	ProcessingContent string `json:"processing_content"`
	ProcessingNotes   string `json:"processing_notes"`
}

func ForwardTask(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req ForwardTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")

	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Update assignment
	oldAssignedTo := task.AssignedToID
	task.AssignedToID = &req.AssignedTo

	if err := database.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể chuyển tiếp công việc"})
		return
	}

	// Add comment about forwarding
	var oldAssignedUser, newAssignedUser models.User
	database.DB.First(&oldAssignedUser, oldAssignedTo)
	database.DB.First(&newAssignedUser, req.AssignedTo)

	forwardComment := models.Comment{
		TaskID:  uint(id),
		UserID:  userID.(uint),
		Content: "Đã chuyển tiếp công việc từ " + oldAssignedUser.Name + " đến " + newAssignedUser.Name,
	}

	if req.Comment != "" {
		forwardComment.Content += ". Ghi chú: " + req.Comment
	}

	database.DB.Create(&forwardComment)

	// Create status history for forwarding
	notes := fmt.Sprintf("Chuyển tiếp công việc từ %s đến %s", oldAssignedUser.Name, newAssignedUser.Name)
	if req.Comment != "" {
		notes += ". Ghi chú: " + req.Comment
	}
	createTaskStatusHistory(task.ID, task.Status, task.Status, userID.(uint), notes)

	// Load relations
	database.DB.Preload("AssignedTo").Preload("AssignedUser").Preload("CreatedBy").Preload("Creator").Preload("IncomingDocument.DocumentType").Preload("IncomingDocument.IssuingUnit").Preload("StatusHistory.ChangedBy").First(&task, task.ID)

	c.JSON(http.StatusOK, task)
}
func DelegateTask(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req DelegateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Check if user can delegate this task
	if userRole.(string) != models.RoleTeamLeader && userRole.(string) != models.RoleDeputy {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền ủy quyền công việc"})
		return
	}

	// Check if user is assigned to this task or created it
	if task.AssignedToID == nil || (*task.AssignedToID != userID.(uint) && task.CreatedByID != userID.(uint)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chỉ có thể ủy quyền công việc được gán cho mình"})
		return
	}

	// Verify the target user exists and has appropriate role
	var targetUser models.User
	if err := database.DB.First(&targetUser, req.AssignedTo).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Người được ủy quyền không tồn tại"})
		return
	}

	// Role-based delegation rules
	switch userRole.(string) {
	case models.RoleTeamLeader:
		// Team leaders can delegate to Deputies and Officers
		if targetUser.Role != models.RoleDeputy && targetUser.Role != models.RoleOfficer {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Trưởng phòng chỉ có thể ủy quyền cho Phó phòng hoặc Cán bộ"})
			return
		}
	case models.RoleDeputy:
		// Deputies can only delegate to Officers
		if targetUser.Role != models.RoleOfficer {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Phó phòng chỉ có thể ủy quyền cho Cán bộ"})
			return
		}
	}

	oldAssignedToID := task.AssignedToID
	task.AssignedToID = &req.AssignedTo

	if err := database.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể ủy quyền công việc"})
		return
	}

	// Create status history for delegation
	var oldAssignedUser models.User
	if oldAssignedToID != nil {
		database.DB.First(&oldAssignedUser, *oldAssignedToID)
	}

	notes := fmt.Sprintf("Ủy quyền công việc từ %s đến %s", oldAssignedUser.Name, targetUser.Name)
	if req.Notes != "" {
		notes += ". Ghi chú: " + req.Notes
	}

	createTaskStatusHistory(task.ID, task.Status, task.Status, userID.(uint), notes)

	// Load relations
	database.DB.Preload("AssignedTo").Preload("AssignedUser").Preload("CreatedBy").Preload("Creator").Preload("IncomingDocument.DocumentType").Preload("IncomingDocument.IssuingUnit").Preload("StatusHistory.ChangedBy").First(&task, task.ID)

	c.JSON(http.StatusOK, task)
}

func UpdateProcessingContent(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req UpdateProcessingContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")

	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Check if user can update processing content (must be assigned to the task)
	if task.AssignedToID == nil || *task.AssignedToID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Chỉ người được gán công việc mới có thể cập nhật nội dung xử lý"})
		return
	}

	// Update processing content
	task.ProcessingContent = req.ProcessingContent
	task.ProcessingNotes = req.ProcessingNotes

	if err := database.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật nội dung xử lý"})
		return
	}

	// Create status history for content update
	createTaskStatusHistory(task.ID, task.Status, task.Status, userID.(uint), "Cập nhật nội dung xử lý công việc")

	// Load relations
	database.DB.Preload("AssignedTo").Preload("AssignedUser").Preload("CreatedBy").Preload("Creator").Preload("IncomingDocument.DocumentType").Preload("IncomingDocument.IssuingUnit").Preload("StatusHistory.ChangedBy").First(&task, task.ID)

	c.JSON(http.StatusOK, task)
}

func GetTaskStatusHistory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var history []models.TaskStatusHistory
	if err := database.DB.Preload("ChangedBy").Where("task_id = ?", id).Order("created_at asc").Find(&history).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy lịch sử trạng thái"})
		return
	}

	c.JSON(http.StatusOK, history)
}

// DownloadTaskIncomingDocument downloads the incoming document file for a task
func DownloadTaskIncomingDocument(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task ID không hợp lệ"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")

	// Get task with incoming document
	var task models.Task
	if err := database.DB.Preload("IncomingDocument").First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	if task.IncomingDocument == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Công việc không có văn bản đến"})
		return
	}

	// Check if user has access to this task
	canAccess := false
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin:
		canAccess = true
	case models.RoleTeamLeader, models.RoleDeputy:
		canAccess = task.AssignedToID != nil && *task.AssignedToID == userID.(uint) || task.CreatedByID == userID.(uint)
	case models.RoleOfficer:
		canAccess = task.AssignedToID != nil && *task.AssignedToID == userID.(uint)
	}

	if !canAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền truy cập văn bản này"})
		return
	}

	// Check if file exists
	if task.IncomingDocument.FilePath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Văn bản không có file đính kèm"})
		return
	}

	filePath := task.IncomingDocument.FilePath
	osFilePath := filepath.FromSlash(filePath)

	if _, err := os.Stat(osFilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File không tồn tại"})
		return
	}

	// Generate download filename
	filename := fmt.Sprintf("van-ban-den-%d-%s.pdf", task.IncomingDocument.ArrivalNumber,
		strings.ReplaceAll(task.IncomingDocument.Summary, " ", "-"))

	// Set headers for download
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/pdf")

	c.File(osFilePath)
}

// DownloadTaskOutgoingDocument downloads the outgoing document file for a task
func DownloadTaskOutgoingDocument(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task ID không hợp lệ"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")

	// Get task and find related outgoing document
	var task models.Task
	if err := database.DB.First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Find outgoing document related to this task (through task report or other relationship)
	// For now, we'll look for outgoing documents created by the same user or around the same time
	var outgoingDoc models.OutgoingDocument
	if err := database.DB.Where("created_by_id = ? AND created_at >= ? AND created_at <= ?",
		task.CreatedByID,
		task.CreatedAt.Add(-24*time.Hour),
		task.CreatedAt.Add(24*time.Hour)).First(&outgoingDoc).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy văn bản đi liên quan"})
		return
	}

	// Check if user has access to this task
	canAccess := false
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin:
		canAccess = true
	case models.RoleTeamLeader, models.RoleDeputy:
		canAccess = task.AssignedToID != nil && *task.AssignedToID == userID.(uint) || task.CreatedByID == userID.(uint)
	case models.RoleOfficer:
		canAccess = task.AssignedToID != nil && *task.AssignedToID == userID.(uint)
	}

	if !canAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền truy cập văn bản này"})
		return
	}

	// Check if file exists
	if outgoingDoc.FilePath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Văn bản không có file đính kèm"})
		return
	}

	filePath := outgoingDoc.FilePath
	osFilePath := filepath.FromSlash(filePath)

	if _, err := os.Stat(osFilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File không tồn tại"})
		return
	}

	// Generate download filename
	filename := fmt.Sprintf("van-ban-di-%s-%s.pdf", outgoingDoc.DocumentNumber,
		strings.ReplaceAll(outgoingDoc.Summary, " ", "-"))

	// Set headers for download
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/pdf")

	c.File(osFilePath)
}

// GetTaskDocuments returns all documents (incoming and outgoing) related to a task
func GetTaskDocuments(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task ID không hợp lệ"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole, _ := c.Get("user_role")

	// Get task with incoming document
	var task models.Task
	if err := database.DB.Preload("IncomingDocument.DocumentType").Preload("IncomingDocument.IssuingUnit").First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Check if user has access to this task
	canAccess := false
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin:
		canAccess = true
	case models.RoleTeamLeader, models.RoleDeputy:
		canAccess = task.AssignedToID != nil && *task.AssignedToID == userID.(uint) || task.CreatedByID == userID.(uint)
	case models.RoleOfficer:
		canAccess = task.AssignedToID != nil && *task.AssignedToID == userID.(uint)
	}

	if !canAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không có quyền truy cập công việc này"})
		return
	}

	// Find outgoing documents related to this task (through task report or other relationship)
	var outgoingDocs []models.OutgoingDocument
	database.DB.Preload("DocumentType").Preload("IssuingUnit").Where("created_by_id = ? AND created_at >= ? AND created_at <= ?",
		task.CreatedByID,
		task.CreatedAt.Add(-24*time.Hour),
		task.CreatedAt.Add(24*time.Hour)).Find(&outgoingDocs)

	// Prepare response
	response := gin.H{
		"task_id":            taskID,
		"incoming_document":  nil,
		"outgoing_documents": outgoingDocs,
	}

	if task.IncomingDocument != nil {
		response["incoming_document"] = task.IncomingDocument
	}

	c.JSON(http.StatusOK, response)
}
