package services

import (
	"ai-code-agent-backend/database"
	"ai-code-agent-backend/models"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

// FilterParams represents common filtering parameters
type FilterParams struct {
	Search    string
	StartDate string
	EndDate   string
	Status    string
	Page      int
	Limit     int
	SortBy    string
	SortOrder string
}

// DocumentFilterParams represents document-specific filtering parameters
type DocumentFilterParams struct {
	FilterParams
	DocumentTypeID string
	IssuingUnitID  string
	ProcessorID    string
	DrafterID      string
	ApproverID     string
}

// TaskFilterParams represents task-specific filtering parameters
type TaskFilterParams struct {
	FilterParams
	AssigneeID         string
	CreatedByID        string
	TaskType           string
	DeadlineType       string
	IncomingDocumentID string
	IsOverdue          string
	UrgencyLevel       string
}

// ParseFilterParams extracts common filter parameters from gin context
func ParseFilterParams(c *gin.Context) FilterParams {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	return FilterParams{
		Search:    c.Query("search"),
		StartDate: c.Query("start_date"),
		EndDate:   c.Query("end_date"),
		Status:    c.Query("status"),
		Page:      page,
		Limit:     limit,
		SortBy:    c.DefaultQuery("sort_by", "created_at"),
		SortOrder: c.DefaultQuery("sort_order", "desc"),
	}
}

// ParseDocumentFilterParams extracts document-specific filter parameters
func ParseDocumentFilterParams(c *gin.Context) DocumentFilterParams {
	return DocumentFilterParams{
		FilterParams:   ParseFilterParams(c),
		DocumentTypeID: c.Query("document_type_id"),
		IssuingUnitID:  c.Query("issuing_unit_id"),
		ProcessorID:    c.Query("processor_id"),
		DrafterID:      c.Query("drafter_id"),
		ApproverID:     c.Query("approver_id"),
	}
}

// ParseTaskFilterParams extracts task-specific filter parameters
func ParseTaskFilterParams(c *gin.Context) TaskFilterParams {
	return TaskFilterParams{
		FilterParams:       ParseFilterParams(c),
		AssigneeID:         c.Query("assignee_id"),
		CreatedByID:        c.Query("created_by_id"),
		TaskType:           c.Query("task_type"),
		DeadlineType:       c.Query("deadline_type"),
		IncomingDocumentID: c.Query("incoming_document_id"),
		IsOverdue:          c.Query("is_overdue"),
		UrgencyLevel:       c.Query("urgency_level"),
	}
}

// ApplyCommonFilters applies common filtering logic to a GORM query
func ApplyCommonFilters(query *gorm.DB, params FilterParams, dateField string) *gorm.DB {
	// Date range filtering
	if params.StartDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", params.StartDate); err == nil {
			query = query.Where(fmt.Sprintf("%s >= ?", dateField), parsedDate)
		}
	}
	if params.EndDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", params.EndDate); err == nil {
			query = query.Where(fmt.Sprintf("%s <= ?", dateField), parsedDate)
		}
	}

	// Status filtering
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	return query
}

// ApplyIncomingDocumentFilters applies incoming document specific filters
func ApplyIncomingDocumentFilters(query *gorm.DB, params DocumentFilterParams) *gorm.DB {
	// Apply common filters
	query = ApplyCommonFilters(query, params.FilterParams, "arrival_date")

	// Document type filtering
	if params.DocumentTypeID != "" {
		query = query.Where("document_type_id = ?", params.DocumentTypeID)
	}

	// Issuing unit filtering
	if params.IssuingUnitID != "" {
		query = query.Where("issuing_unit_id = ?", params.IssuingUnitID)
	}

	// Processor filtering
	if params.ProcessorID != "" {
		query = query.Where("processor_id = ?", params.ProcessorID)
	}

	// Search functionality
	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("original_number ILIKE ? OR summary ILIKE ?", searchPattern, searchPattern)
	}

	return query
}

// ApplyOutgoingDocumentFilters applies outgoing document specific filters
func ApplyOutgoingDocumentFilters(query *gorm.DB, params DocumentFilterParams) *gorm.DB {
	// Apply common filters
	query = ApplyCommonFilters(query, params.FilterParams, "issue_date")

	// Document type filtering
	if params.DocumentTypeID != "" {
		query = query.Where("document_type_id = ?", params.DocumentTypeID)
	}

	// Issuing unit filtering
	if params.IssuingUnitID != "" {
		query = query.Where("issuing_unit_id = ?", params.IssuingUnitID)
	}

	// Drafter filtering
	if params.DrafterID != "" {
		query = query.Where("drafter_id = ?", params.DrafterID)
	}

	// Approver filtering
	if params.ApproverID != "" {
		query = query.Where("approver_id = ?", params.ApproverID)
	}

	// Search functionality
	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("document_number ILIKE ? OR summary ILIKE ?", searchPattern, searchPattern)
	}

	return query
}

// ApplyTaskFilters applies task specific filters
func ApplyTaskFilters(query *gorm.DB, params TaskFilterParams) *gorm.DB {
	// Apply common filters
	query = ApplyCommonFilters(query, params.FilterParams, "created_at")

	// Assignee filtering
	if params.AssigneeID != "" {
		query = query.Where("assigned_to_id = ?", params.AssigneeID)
	}

	// Created by filtering
	if params.CreatedByID != "" {
		query = query.Where("created_by_id = ?", params.CreatedByID)
	}

	// Task type filtering
	if params.TaskType != "" {
		query = query.Where("task_type = ?", params.TaskType)
	}

	// Deadline type filtering
	if params.DeadlineType != "" {
		query = query.Where("deadline_type = ?", params.DeadlineType)
	}

	// Incoming document filtering
	if params.IncomingDocumentID != "" {
		query = query.Where("incoming_document_id = ?", params.IncomingDocumentID)
	}

	// Overdue filtering
	if params.IsOverdue == "true" {
		query = query.Where("deadline IS NOT NULL AND deadline < ?", time.Now())
	} else if params.IsOverdue == "false" {
		query = query.Where("deadline IS NULL OR deadline >= ?", time.Now())
	}

	// Urgency level filtering
	if params.UrgencyLevel != "" {
		now := time.Now()
		switch params.UrgencyLevel {
		case "critical":
			// Tasks overdue or due within 1 hour
			query = query.Where("deadline IS NOT NULL AND deadline <= ?", now.Add(time.Hour))
		case "urgent":
			// Tasks due within 1 day
			query = query.Where("deadline IS NOT NULL AND deadline <= ? AND deadline > ?", now.Add(24*time.Hour), now.Add(time.Hour))
		case "high":
			// Tasks due within 3 days
			query = query.Where("deadline IS NOT NULL AND deadline <= ? AND deadline > ?", now.Add(3*24*time.Hour), now.Add(24*time.Hour))
		case "medium":
			// Tasks due within 7 days
			query = query.Where("deadline IS NOT NULL AND deadline <= ? AND deadline > ?", now.Add(7*24*time.Hour), now.Add(3*24*time.Hour))
		case "normal":
			// Tasks due after 7 days or no deadline
			query = query.Where("deadline IS NULL OR deadline > ?", now.Add(7*24*time.Hour))
		}
	}

	// Search functionality
	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("description ILIKE ? OR processing_content ILIKE ? OR processing_notes ILIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	return query
}

// ApplySorting applies sorting to a GORM query
func ApplySorting(query *gorm.DB, sortBy, sortOrder string, allowedFields []string) *gorm.DB {
	// Validate sort field
	isValidField := false
	for _, field := range allowedFields {
		if field == sortBy {
			isValidField = true
			break
		}
	}
	if !isValidField {
		sortBy = "created_at"
	}

	// Validate sort order
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}

	return query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))
}

// ApplyPagination applies pagination to a GORM query
func ApplyPagination(query *gorm.DB, page, limit int) *gorm.DB {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit
	return query.Offset(offset).Limit(limit)
}

// GetPaginationInfo returns pagination information
func GetPaginationInfo(total int64, page, limit int) map[string]interface{} {
	totalPages := (total + int64(limit) - 1) / int64(limit)

	return map[string]interface{}{
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
		"has_next":    int64(page) < totalPages,
		"has_prev":    page > 1,
	}
}

// GetFilterPresets returns common filter presets
func GetFilterPresets() map[string]interface{} {
	return map[string]interface{}{
		"overdue_tasks": map[string]interface{}{
			"name":        "Overdue Tasks",
			"description": "Tasks that are past their deadline",
			"filters": map[string]interface{}{
				"is_overdue": "true",
			},
		},
		"pending_documents": map[string]interface{}{
			"name":        "Pending Documents",
			"description": "Documents waiting for processing",
			"filters": map[string]interface{}{
				"status": models.IncomingStatusReceived,
			},
		},
		"urgent_tasks": map[string]interface{}{
			"name":        "Urgent Tasks",
			"description": "Tasks due within 24 hours",
			"filters": map[string]interface{}{
				"urgency_level": "urgent",
			},
		},
		"draft_outgoing": map[string]interface{}{
			"name":        "Draft Outgoing Documents",
			"description": "Outgoing documents in draft status",
			"filters": map[string]interface{}{
				"status": models.OutgoingStatusDraft,
			},
		},
		"this_week": map[string]interface{}{
			"name":        "This Week",
			"description": "Items from this week",
			"filters": map[string]interface{}{
				"start_date": time.Now().AddDate(0, 0, -7).Format("2006-01-02"),
				"end_date":   time.Now().Format("2006-01-02"),
			},
		},
		"this_month": map[string]interface{}{
			"name":        "This Month",
			"description": "Items from this month",
			"filters": map[string]interface{}{
				"start_date": time.Now().AddDate(0, -1, 0).Format("2006-01-02"),
				"end_date":   time.Now().Format("2006-01-02"),
			},
		},
	}
}

// SearchSuggestions provides autocomplete suggestions for search
func GetSearchSuggestions(searchType, query string, limit int) ([]string, error) {
	if limit <= 0 {
		limit = 10
	}

	var suggestions []string
	searchPattern := "%" + strings.ToLower(query) + "%"

	switch searchType {
	case "incoming_documents":
		var results []struct {
			OriginalNumber string
			Summary        string
		}
		err := database.DB.Model(&models.IncomingDocument{}).
			Select("DISTINCT original_number, summary").
			Where("LOWER(original_number) LIKE ? OR LOWER(summary) LIKE ?", searchPattern, searchPattern).
			Limit(limit).
			Find(&results).Error
		if err != nil {
			return nil, err
		}
		for _, result := range results {
			if strings.Contains(strings.ToLower(result.OriginalNumber), strings.ToLower(query)) {
				suggestions = append(suggestions, result.OriginalNumber)
			}
			if strings.Contains(strings.ToLower(result.Summary), strings.ToLower(query)) && len(suggestions) < limit {
				suggestions = append(suggestions, result.Summary)
			}
		}

	case "outgoing_documents":
		var results []struct {
			DocumentNumber string
			Summary        string
		}
		err := database.DB.Model(&models.OutgoingDocument{}).
			Select("DISTINCT document_number, summary").
			Where("LOWER(document_number) LIKE ? OR LOWER(summary) LIKE ?", searchPattern, searchPattern).
			Limit(limit).
			Find(&results).Error
		if err != nil {
			return nil, err
		}
		for _, result := range results {
			if strings.Contains(strings.ToLower(result.DocumentNumber), strings.ToLower(query)) {
				suggestions = append(suggestions, result.DocumentNumber)
			}
			if strings.Contains(strings.ToLower(result.Summary), strings.ToLower(query)) && len(suggestions) < limit {
				suggestions = append(suggestions, result.Summary)
			}
		}

	case "tasks":
		var results []struct {
			Description string
		}
		err := database.DB.Model(&models.Task{}).
			Select("DISTINCT description").
			Where("LOWER(description) LIKE ?", searchPattern).
			Limit(limit).
			Find(&results).Error
		if err != nil {
			return nil, err
		}
		for _, result := range results {
			suggestions = append(suggestions, result.Description)
		}
	}

	return suggestions, nil
}
