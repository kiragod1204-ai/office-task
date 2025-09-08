package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type CreateTaskRequest struct {
	Description    string `json:"description" binding:"required"`
	Deadline       string `json:"deadline" binding:"required"`
	AssignedTo     uint   `json:"assigned_to" binding:"required"`
	IncomingFileID uint   `json:"incoming_file_id" binding:"required"`
}

type AssignTaskRequest struct {
	AssignedTo uint `json:"assigned_to" binding:"required"`
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func CreateTask(c *gin.Context) {
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	userID, _ := c.Get("user_id")
	deadline, err := time.Parse("2006-01-02T15:04:05Z", req.Deadline)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng thời gian không hợp lệ"})
		return
	}

	task := models.Task{
		Description:    req.Description,
		Deadline:       deadline,
		Status:         models.StatusReceived,
		AssignedTo:     req.AssignedTo,
		CreatedBy:      userID.(uint),
		IncomingFileID: req.IncomingFileID,
	}

	if err := database.DB.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo công việc"})
		return
	}

	// Load relations
	database.DB.Preload("AssignedUser").Preload("Creator").Preload("IncomingFile").First(&task, task.ID)

	c.JSON(http.StatusCreated, task)
}

func GetTasks(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var tasks []models.Task
	query := database.DB.Preload("AssignedUser").Preload("Creator").Preload("IncomingFile").Preload("Comments.User")

	// Filter based on role
	switch userRole.(string) {
	case models.RoleSecretary, models.RoleAdmin:
		// Can see all tasks
	case models.RoleTeamLeader, models.RoleDeputy:
		// Can see tasks assigned to them or created by them
		query = query.Where("assigned_to = ? OR created_by = ?", userID, userID)
	case models.RoleOfficer:
		// Can only see tasks assigned to them
		query = query.Where("assigned_to = ?", userID)
	}

	if err := query.Find(&tasks).Error; err != nil {
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

	c.JSON(http.StatusOK, tasksWithTime)
}

func GetTask(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var task models.Task
	if err := database.DB.Preload("AssignedUser").Preload("Creator").Preload("IncomingFile").Preload("Comments.User").First(&task, id).Error; err != nil {
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

	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	// Update assignment and status
	task.AssignedTo = req.AssignedTo
	if task.Status == models.StatusReceived {
		task.Status = models.StatusProcessing
	}

	if err := database.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể gán công việc"})
		return
	}

	// Load relations
	database.DB.Preload("AssignedUser").Preload("Creator").Preload("IncomingFile").First(&task, task.ID)

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
	if err := database.DB.Preload("AssignedUser").Preload("Creator").First(&task, id).Error; err != nil {
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
			"user":        task.Creator.Name,
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
	if task.AssignedTo > 0 {
		if len(stages) > 1 {
			stages[1]["user"] = task.AssignedUser.Name
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
			"created_at":    task.CreatedAt,
			"updated_at":    task.UpdatedAt,
			"deadline":      task.Deadline,
			"assigned_to":   task.AssignedUser.Name,
			"created_by":    task.Creator.Name,
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

func UpdateTaskStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	var task models.Task
	if err := database.DB.First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy công việc"})
		return
	}

	task.Status = req.Status
	if err := database.DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật trạng thái"})
		return
	}

	// Load relations
	database.DB.Preload("AssignedUser").Preload("Creator").Preload("IncomingFile").First(&task, task.ID)

	c.JSON(http.StatusOK, task)
}

type UpdateTaskRequest struct {
	Description    string `json:"description"`
	Deadline       string `json:"deadline"`
	AssignedTo     uint   `json:"assigned_to"`
	IncomingFileID uint   `json:"incoming_file_id"`
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
		if task.CreatedBy != userID.(uint) && task.AssignedTo != userID.(uint) {
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
		deadline, err := time.Parse("2006-01-02T15:04:05Z", req.Deadline)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng thời gian không hợp lệ"})
			return
		}
		updates["deadline"] = deadline
	}
	if req.AssignedTo > 0 {
		updates["assigned_to"] = req.AssignedTo
	}
	if req.IncomingFileID > 0 {
		updates["incoming_file_id"] = req.IncomingFileID
	}

	if err := database.DB.Model(&task).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật công việc"})
		return
	}

	// Load relations
	database.DB.Preload("AssignedUser").Preload("Creator").Preload("IncomingFile").First(&task, task.ID)

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
		if task.CreatedBy != userID.(uint) {
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
	oldAssignedTo := task.AssignedTo
	task.AssignedTo = req.AssignedTo

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

	// Load relations
	database.DB.Preload("AssignedUser").Preload("Creator").Preload("IncomingFile").First(&task, task.ID)

	c.JSON(http.StatusOK, task)
}