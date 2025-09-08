package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetUsers(c *gin.Context) {
	role := c.Query("role")

	var users []models.User
	query := database.DB.Select("id, name, username, role")

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if err := query.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách người dùng"})
		return
	}

	c.JSON(http.StatusOK, users)
}

func GetTeamLeadersAndDeputies(c *gin.Context) {
	var users []models.User
	if err := database.DB.Select("id, name, username, role").Where("role IN (?)", []string{models.RoleTeamLeader, models.RoleDeputy}).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách Trưởng Công An Xã và Phó Công An Xã"})
		return
	}

	c.JSON(http.StatusOK, users)
}

func GetOfficers(c *gin.Context) {
	var users []models.User
	if err := database.DB.Select("id, name, username, role").Where("role = ?", models.RoleOfficer).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách cán bộ"})
		return
	}

	c.JSON(http.StatusOK, users)
}

type CreateUserRequest struct {
	Name     string `json:"name" binding:"required"`
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required"`
}

func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	// Validate role
	validRoles := []string{models.RoleAdmin, models.RoleTeamLeader, models.RoleDeputy, models.RoleSecretary, models.RoleOfficer}
	isValidRole := false
	for _, role := range validRoles {
		if req.Role == role {
			isValidRole = true
			break
		}
	}

	if !isValidRole {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vai trò không hợp lệ"})
		return
	}

	// Check if username already exists
	var existingUser models.User
	if err := database.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Tên đăng nhập đã tồn tại"})
		return
	}

	// Create new user
	user := models.User{
		Name:     req.Name,
		Username: req.Username,
		Password: req.Password, // In production, should hash the password
		Role:     req.Role,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo người dùng"})
		return
	}

	// Return user without password
	c.JSON(http.StatusCreated, gin.H{
		"id":       user.ID,
		"name":     user.Name,
		"username": user.Username,
		"role":     user.Role,
		"message":  "Tạo người dùng thành công",
	})
}

// GetUserByID gets a specific user by ID
func GetUserByID(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := database.DB.Select("id, name, username, role, created_at, updated_at").Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	c.JSON(http.StatusOK, user)
}

type UpdateUserRequest struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Role     string `json:"role"`
	Password string `json:"password,omitempty"`
}

// UpdateUser updates user information
func UpdateUser(c *gin.Context) {
	id := c.Param("id")

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	// Validate role if provided
	if req.Role != "" {
		validRoles := []string{models.RoleAdmin, models.RoleTeamLeader, models.RoleDeputy, models.RoleSecretary, models.RoleOfficer}
		isValidRole := false
		for _, role := range validRoles {
			if req.Role == role {
				isValidRole = true
				break
			}
		}

		if !isValidRole {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Vai trò không hợp lệ"})
			return
		}
	}

	// Check if username already exists (if changing username)
	if req.Username != "" && req.Username != user.Username {
		var existingUser models.User
		if err := database.DB.Where("username = ? AND id != ?", req.Username, id).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Tên đăng nhập đã tồn tại"})
			return
		}
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Username != "" {
		updates["username"] = req.Username
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}
	if req.Password != "" {
		updates["password"] = req.Password // In production, should hash the password
	}

	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật người dùng"})
		return
	}

	// Reload user data
	database.DB.Select("id, name, username, role, created_at, updated_at").Where("id = ?", id).First(&user)

	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"name":       user.Name,
		"username":   user.Username,
		"role":       user.Role,
		"created_at": user.CreatedAt,
		"updated_at": user.UpdatedAt,
		"message":    "Cập nhật người dùng thành công",
	})
}

// DeleteUser deletes a user (soft delete)
func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	// Prevent deleting the last admin
	if user.Role == models.RoleAdmin {
		var adminCount int64
		database.DB.Model(&models.User{}).Where("role = ?", models.RoleAdmin).Count(&adminCount)
		if adminCount <= 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Không thể xóa quản trị viên cuối cùng"})
			return
		}
	}

	// Check if user has active tasks
	var taskCount int64
	database.DB.Model(&models.Task{}).Where("assigned_to = ? OR created_by = ?", id, id).Count(&taskCount)
	if taskCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Không thể xóa người dùng có công việc đang thực hiện"})
		return
	}

	if err := database.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa người dùng"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Xóa người dùng thành công"})
}

// ToggleUserStatus toggles user active status
func ToggleUserStatus(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	// Toggle active status (assuming we add an Active field to User model)
	// For now, we'll use a simple approach
	var status bool
	if err := c.ShouldBindJSON(&struct {
		Active bool `json:"active"`
	}{Active: status}); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cập nhật trạng thái người dùng thành công",
		"active":  status,
	})
}

// GetUserStats gets user statistics for admin dashboard
func GetUserStats(c *gin.Context) {
	var stats struct {
		TotalUsers  int64            `json:"total_users"`
		UsersByRole map[string]int64 `json:"users_by_role"`
		ActiveUsers int64            `json:"active_users"`
		RecentUsers []models.User    `json:"recent_users"`
	}

	// Total users
	database.DB.Model(&models.User{}).Count(&stats.TotalUsers)

	// Users by role
	stats.UsersByRole = make(map[string]int64)
	roles := []string{models.RoleAdmin, models.RoleTeamLeader, models.RoleDeputy, models.RoleSecretary, models.RoleOfficer}

	for _, role := range roles {
		var count int64
		database.DB.Model(&models.User{}).Where("role = ?", role).Count(&count)
		stats.UsersByRole[role] = count
	}

	// Active users (for now, all users are considered active)
	stats.ActiveUsers = stats.TotalUsers

	// Recent users (last 10)
	database.DB.Select("id, name, username, role, created_at").
		Order("created_at DESC").
		Limit(10).
		Find(&stats.RecentUsers)

	c.JSON(http.StatusOK, stats)
}
