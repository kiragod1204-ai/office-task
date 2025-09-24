package controllers

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/middleware"
	"ai-code-agent-backend/models"
	"ai-code-agent-backend/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Username     string `json:"username" binding:"required"`
	Password     string `json:"password" binding:"required"`
	ShowPassword bool   `json:"show_password,omitempty"` // For password visibility toggle data
}

func Login(c *gin.Context) {
	auditService := services.NewAuditService()

	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	var user models.User
	if err := database.DB.Where("username = ? AND password = ?", req.Username, req.Password).First(&user).Error; err != nil {
		// Log failed login attempt
		if user.ID > 0 {
			// Set user context for audit logging
			c.Set("user_id", user.ID)
			auditService.LogFailedActivity(c, models.AuditActionUserLogin, models.AuditEntityUser, user.ID,
				"Failed login attempt", "Invalid credentials",
				map[string]interface{}{"username": req.Username})
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tên đăng nhập hoặc mật khẩu không đúng"})
		return
	}

	// Check if user account is active
	if !user.IsActive {
		// Set user context for audit logging
		c.Set("user_id", user.ID)
		auditService.LogFailedActivity(c, models.AuditActionUserLogin, models.AuditEntityUser, user.ID,
			"Failed login attempt", "Account is inactive",
			map[string]interface{}{"username": req.Username})
		c.JSON(http.StatusForbidden, gin.H{"error": "Tài khoản đã bị vô hiệu hóa"})
		return
	}

	// Update last login timestamp
	now := time.Now()
	user.LastLogin = &now
	database.DB.Save(&user)

	// Generate token with additional user metadata
	token, err := middleware.GenerateToken(user.ID, user.Role, user.Name, user.IsActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo token"})
		return
	}

	// Set user context for audit logging
	c.Set("user_id", user.ID)

	// Log successful login
	auditService.LogActivity(c, models.AuditActionUserLogin, models.AuditEntityUser, user.ID,
		"Successful login", nil, nil,
		map[string]interface{}{
			"username":   req.Username,
			"role":       user.Role,
			"login_time": now,
		})

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":         user.ID,
			"name":       user.Name,
			"role":       user.Role,
			"is_active":  user.IsActive,
			"last_login": user.LastLogin,
		},
	})
}

func Logout(c *gin.Context) {
	auditService := services.NewAuditService()

	// Log logout activity
	auditService.LogActivity(c, models.AuditActionUserLogout, models.AuditEntityUser, 0,
		"User logged out", nil, nil,
		map[string]interface{}{
			"logout_time": time.Now(),
		})

	c.JSON(http.StatusOK, gin.H{
		"message": "Đăng xuất thành công",
	})
}

func GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy người dùng"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"name":       user.Name,
		"role":       user.Role,
		"is_active":  user.IsActive,
		"last_login": user.LastLogin,
	})
}
