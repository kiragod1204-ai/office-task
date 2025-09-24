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
		auth.POST("/logout", middleware.AuthMiddleware(), controllers.Logout)
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
		api.POST("/tasks/:id/delegate", middleware.RequireRole(models.RoleTeamLeader, models.RoleDeputy), controllers.DelegateTask)
		api.PUT("/tasks/:id/processing", controllers.UpdateProcessingContent)
		api.GET("/tasks/:id/history", controllers.GetTaskStatusHistory)
		api.POST("/tasks/:id/comments", controllers.CreateComment)
		api.GET("/tasks/:id/comments", controllers.GetTaskComments)

		// Enhanced File routes
		api.POST("/files/upload", controllers.EnhancedUploadFile)
		api.GET("/files/download", controllers.EnhancedDownloadFile)
		api.GET("/files/thumbnail", controllers.GetFileThumbnail)
		api.GET("/files/info", controllers.GetFileInfo)
		api.DELETE("/files/delete", controllers.DeleteFile)
		api.GET("/files/by-document", controllers.GetFilesByDocument)
		api.GET("/files/versions", controllers.GetFileVersions)

		// Admin File Management routes
		api.GET("/admin/files", middleware.RequireRole(models.RoleAdmin), controllers.GetAllFiles)
		api.GET("/admin/files/stats", middleware.RequireRole(models.RoleAdmin), controllers.GetFileStats)
		api.PUT("/admin/files/access", middleware.RequireRole(models.RoleAdmin), controllers.UpdateFileAccess)
		api.DELETE("/admin/files/bulk-delete", middleware.RequireRole(models.RoleAdmin), controllers.BulkDeleteFiles)

		// Legacy file routes (for backward compatibility)
		api.POST("/files/incoming", middleware.RequireRole(models.RoleSecretary), controllers.UploadIncomingFile)
		api.POST("/files/report/:id", controllers.UploadReportFile)
		api.GET("/files/incoming", controllers.GetIncomingFiles)
		api.GET("/files/download-legacy", controllers.DownloadFile)

		// Dashboard routes
		api.GET("/dashboard/stats", controllers.GetDashboardStats)
		api.GET("/dashboard/user-tasks", controllers.GetUserTasks)
		api.GET("/dashboard/system-health", controllers.GetSystemHealth)
		api.GET("/dashboard/metrics", middleware.RequireRole(models.RoleAdmin), controllers.GetDetailedMetrics)

		// Document Type routes
		api.GET("/document-types", controllers.GetDocumentTypes)
		api.GET("/document-types/all", middleware.RequireRole(models.RoleAdmin), controllers.GetAllDocumentTypes)
		api.GET("/document-types/:id", controllers.GetDocumentType)
		api.POST("/document-types", middleware.RequireRole(models.RoleAdmin), controllers.CreateDocumentType)
		api.PUT("/document-types/:id", middleware.RequireRole(models.RoleAdmin), controllers.UpdateDocumentType)
		api.DELETE("/document-types/:id", middleware.RequireRole(models.RoleAdmin), controllers.DeleteDocumentType)
		api.POST("/document-types/:id/toggle-status", middleware.RequireRole(models.RoleAdmin), controllers.ToggleDocumentTypeStatus)

		// Issuing Unit routes
		api.GET("/issuing-units", controllers.GetIssuingUnits)
		api.GET("/issuing-units/all", middleware.RequireRole(models.RoleAdmin), controllers.GetAllIssuingUnits)
		api.GET("/issuing-units/:id", controllers.GetIssuingUnit)
		api.POST("/issuing-units", middleware.RequireRole(models.RoleAdmin), controllers.CreateIssuingUnit)
		api.PUT("/issuing-units/:id", middleware.RequireRole(models.RoleAdmin), controllers.UpdateIssuingUnit)
		api.DELETE("/issuing-units/:id", middleware.RequireRole(models.RoleAdmin), controllers.DeleteIssuingUnit)
		api.POST("/issuing-units/:id/toggle-status", middleware.RequireRole(models.RoleAdmin), controllers.ToggleIssuingUnitStatus)

		// Receiving Unit routes
		api.GET("/receiving-units", controllers.GetReceivingUnits)
		api.GET("/receiving-units/all", middleware.RequireRole(models.RoleAdmin), controllers.GetAllReceivingUnits)
		api.GET("/receiving-units/:id", controllers.GetReceivingUnit)
		api.POST("/receiving-units", middleware.RequireRole(models.RoleAdmin), controllers.CreateReceivingUnit)
		api.PUT("/receiving-units/:id", middleware.RequireRole(models.RoleAdmin), controllers.UpdateReceivingUnit)
		api.DELETE("/receiving-units/:id", middleware.RequireRole(models.RoleAdmin), controllers.DeleteReceivingUnit)
		api.POST("/receiving-units/:id/toggle-status", middleware.RequireRole(models.RoleAdmin), controllers.ToggleReceivingUnitStatus)

		// System Notification routes
		notificationController := controllers.NewSystemNotificationController()
		api.GET("/notifications", notificationController.GetNotifications)
		api.GET("/notifications/active", notificationController.GetActiveNotifications)
		api.GET("/notifications/:id", notificationController.GetNotification)
		api.POST("/notifications", middleware.RequireRole(models.RoleAdmin), notificationController.CreateNotification)
		api.PUT("/notifications/:id", middleware.RequireRole(models.RoleAdmin), notificationController.UpdateNotification)
		api.DELETE("/notifications/:id", middleware.RequireRole(models.RoleAdmin), notificationController.DeleteNotification)
		api.POST("/notifications/:id/deactivate", middleware.RequireRole(models.RoleAdmin), notificationController.DeactivateNotification)

		// Incoming Document routes
		api.GET("/incoming-documents", controllers.GetIncomingDocuments)
		api.GET("/incoming-documents/:id", controllers.GetIncomingDocument)
		api.POST("/incoming-documents", middleware.RequireRole(models.RoleSecretary, models.RoleAdmin), controllers.CreateIncomingDocument)
		api.PUT("/incoming-documents/:id", middleware.RequireRole(models.RoleSecretary, models.RoleTeamLeader, models.RoleDeputy, models.RoleAdmin), controllers.UpdateIncomingDocument)
		api.DELETE("/incoming-documents/:id", middleware.RequireRole(models.RoleSecretary, models.RoleTeamLeader, models.RoleAdmin), controllers.DeleteIncomingDocument)
		api.POST("/incoming-documents/:id/assign", middleware.RequireRole(models.RoleSecretary, models.RoleTeamLeader, models.RoleDeputy, models.RoleAdmin), controllers.AssignProcessor)
		api.POST("/incoming-documents/:id/upload", middleware.RequireRole(models.RoleSecretary, models.RoleAdmin), controllers.UploadIncomingDocumentFile)
		api.GET("/incoming-documents/processors", controllers.GetProcessors)

		// Outgoing Document routes
		api.GET("/outgoing-documents", controllers.GetOutgoingDocuments)
		api.GET("/outgoing-documents/:id", controllers.GetOutgoingDocument)
		api.POST("/outgoing-documents", middleware.RequireRole(models.RoleSecretary, models.RoleAdmin), controllers.CreateOutgoingDocument)
		api.PUT("/outgoing-documents/:id", middleware.RequireRole(models.RoleSecretary, models.RoleTeamLeader, models.RoleDeputy, models.RoleOfficer, models.RoleAdmin), controllers.UpdateOutgoingDocument)
		api.DELETE("/outgoing-documents/:id", middleware.RequireRole(models.RoleSecretary, models.RoleTeamLeader, models.RoleAdmin), controllers.DeleteOutgoingDocument)
		api.POST("/outgoing-documents/:id/approval", middleware.RequireRole(models.RoleTeamLeader, models.RoleDeputy, models.RoleSecretary, models.RoleAdmin), controllers.UpdateApprovalStatus)
		api.POST("/outgoing-documents/:id/upload", middleware.RequireRole(models.RoleSecretary, models.RoleTeamLeader, models.RoleDeputy, models.RoleOfficer, models.RoleAdmin), controllers.UploadOutgoingDocumentFile)
		api.GET("/outgoing-documents/drafters", controllers.GetDrafters)
		api.GET("/outgoing-documents/approvers", controllers.GetApprovers)

		// Filter and Search routes
		api.GET("/filters/presets", controllers.GetFilterPresets)
		api.GET("/filters/options", controllers.GetFilterOptions)
		api.GET("/filters/saved", controllers.GetSavedFilters)
		api.POST("/filters/saved", controllers.SaveFilter)
		api.DELETE("/filters/saved/:id", controllers.DeleteSavedFilter)
		api.GET("/search/suggestions", controllers.GetSearchSuggestions)

		// Audit Trail routes
		auditController := controllers.NewAuditController()
		api.GET("/audit/logs", middleware.RequireRole(models.RoleAdmin, models.RoleTeamLeader), auditController.GetAuditLogs)
		api.GET("/audit/user-activity/:user_id", middleware.RequireRole(models.RoleAdmin, models.RoleTeamLeader), auditController.GetUserActivity)
		api.GET("/audit/document-trail/:entity_type/:document_id", middleware.RequireRole(models.RoleAdmin, models.RoleTeamLeader, models.RoleDeputy), auditController.GetDocumentAuditTrail)
		api.GET("/audit/document-summary", middleware.RequireRole(models.RoleAdmin, models.RoleTeamLeader), auditController.GetDocumentAuditSummary)
		api.GET("/audit/task-summary", middleware.RequireRole(models.RoleAdmin, models.RoleTeamLeader), auditController.GetTaskAuditSummary)
		api.GET("/audit/statistics", middleware.RequireRole(models.RoleAdmin), auditController.GetSystemStatistics)
		api.GET("/audit/export", middleware.RequireRole(models.RoleAdmin, models.RoleTeamLeader), auditController.ExportAuditLogs)
		api.DELETE("/audit/cleanup", middleware.RequireRole(models.RoleAdmin), auditController.CleanupOldAuditLogs)
	}

	log.Println("Server đang chạy trên port 9090...")
	r.Run(":9090")
}
