package main

import (
	"ai-code-agent-backend/controllers"
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/middleware"
	"ai-code-agent-backend/models"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	database.InitDatabase()
	defer database.DB.Close()

	// Create Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Public routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", controllers.Login)
	}

	// Protected routes
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// User routes
		api.GET("/profile", controllers.GetProfile)
		api.GET("/users", controllers.GetUsers)
		api.GET("/users/team-leaders", controllers.GetTeamLeadersAndDeputies)
		api.GET("/users/officers", controllers.GetOfficers)
		api.POST("/users", middleware.RequireRole(models.RoleAdmin), controllers.CreateUser)
		api.GET("/users/:id", middleware.RequireRole(models.RoleAdmin), controllers.GetUserByID)
		api.PUT("/users/:id", middleware.RequireRole(models.RoleAdmin), controllers.UpdateUser)
		api.DELETE("/users/:id", middleware.RequireRole(models.RoleAdmin), controllers.DeleteUser)
		api.POST("/users/:id/toggle-status", middleware.RequireRole(models.RoleAdmin), controllers.ToggleUserStatus)
		api.GET("/users/stats", middleware.RequireRole(models.RoleAdmin), controllers.GetUserStats)

		// Task routes
		api.POST("/tasks", middleware.RequireRole(models.RoleSecretary, models.RoleTeamLeader), controllers.CreateTask)
		api.GET("/tasks", controllers.GetTasks)
		api.GET("/tasks/:id", controllers.GetTask)
		api.GET("/tasks/:id/workflow", controllers.GetTaskWorkflow)
		api.PUT("/tasks/:id/assign", middleware.RequireRole(models.RoleTeamLeader, models.RoleDeputy), controllers.AssignTask)
		api.PUT("/tasks/:id/status", controllers.UpdateTaskStatus)
		api.PUT("/tasks/:id", middleware.RequireRole(models.RoleSecretary, models.RoleTeamLeader), controllers.UpdateTask)
		api.DELETE("/tasks/:id", middleware.RequireRole(models.RoleSecretary, models.RoleTeamLeader), controllers.DeleteTask)
		api.POST("/tasks/:id/forward", middleware.RequireRole(models.RoleTeamLeader, models.RoleDeputy), controllers.ForwardTask)
		api.POST("/tasks/:id/comments", controllers.CreateComment)
		api.GET("/tasks/:id/comments", controllers.GetTaskComments)

		// File routes
		api.POST("/files/incoming", middleware.RequireRole(models.RoleSecretary), controllers.UploadIncomingFile)
		api.POST("/files/report/:id", controllers.UploadReportFile)
		api.GET("/files/incoming", controllers.GetIncomingFiles)
		api.GET("/files/download", controllers.DownloadFile)

		// Dashboard routes
		api.GET("/dashboard/stats", controllers.GetDashboardStats)
		api.GET("/dashboard/user-tasks", controllers.GetUserTasks)
		api.GET("/dashboard/system-health", controllers.GetSystemHealth)
		api.GET("/dashboard/metrics", middleware.RequireRole(models.RoleAdmin), controllers.GetDetailedMetrics)
	}

	log.Println("Server đang chạy trên port 9090...")
	r.Run(":9090")
}
