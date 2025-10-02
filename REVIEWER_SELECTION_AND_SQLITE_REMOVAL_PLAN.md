# Plan: Implement Reviewer Selection and Remove SQLite

## Current State Analysis

### Frontend (TaskManagementActions.tsx)
- ✅ Already has reviewer selection dialog with search functionality
- ✅ Uses `ChooseReviewerRequest` and `GetAvailableReviewers` API calls
- ✅ Has proper UI for selecting reviewers with search, filtering, and confirmation
- ✅ Includes notes functionality for reviewer selection

### Backend (task_controller.go)
- ✅ Already has `ChooseReviewer`, `GetAvailableReviewers`, and `SubmitForReview` endpoints
- ✅ Proper role-based permissions (officers can choose reviewers)
- ✅ Reviewer validation (Team Leader or Deputy only)
- ✅ Status history tracking for reviewer selection

### Database
- ✅ Main database.go uses PostgreSQL
- ❌ Has SQLite alternative file (database_alternative.go) that needs removal
- ❌ Some SQLite references still exist

## Tasks to Complete

### 1. Remove SQLite from Backend
- [ ] Delete `database_alternative.go` file
- [ ] Remove any SQLite imports from go.mod
- [ ] Update any references to SQLite alternative initialization
- [ ] Ensure all scripts and documentation reference PostgreSQL only

### 2. Enhance Reviewer Selection (if needed)
- [ ] Verify current reviewer selection functionality works properly
- [ ] Test search functionality in frontend
- [ ] Ensure proper error handling and validation
- [ ] Verify role-based permissions work correctly

### 3. Testing and Verification
- [ ] Test reviewer selection flow end-to-end
- [ ] Verify database connections work with PostgreSQL only
- [ ] Test all task management actions after SQLite removal
- [ ] Ensure no broken references remain

## Implementation Details

### SQLite Removal Steps
1. Remove the alternative database file
2. Clean up any imports or references
3. Update build scripts if they reference SQLite
4. Test that PostgreSQL connection works properly

### Reviewer Selection Verification
The current implementation already includes:
- Search functionality for reviewers
- Role-based filtering (Team Leader/Deputy only)
- Proper UI with confirmation dialogs
- Notes functionality
- Status history tracking

## Risk Assessment
- **Low Risk**: SQLite removal - the main application already uses PostgreSQL
- **Low Risk**: Reviewer selection - already implemented and functional
- **Medium Risk**: Ensuring no broken references after SQLite removal

## Success Criteria
1. ✅ SQLite completely removed from codebase
2. ✅ Application starts and connects to PostgreSQL successfully
3. ✅ Reviewer selection functionality works as expected
4. ✅ All existing task management features continue to work
5. ✅ No build errors or runtime errors related to database
