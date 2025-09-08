# AI Code Agent Project Overview

## Backend (Go/Gin)

### Architecture
- **Framework**: Gin web framework
- **Database**: PostgreSQL with GORM ORM
- **Authentication**: JWT-based authentication
- **Structure**: MVC-like architecture with controllers, models, and middleware

### Key Components

1. **Main Server** (`main.go`):
   - Sets up Gin router with CORS middleware
   - Implements role-based access control
   - Defines API endpoints for authentication, users, tasks, files, and dashboard

2. **Models**:
   - **User**: Contains ID, name, username, password, and role
   - **Task**: Includes description, deadline, status, assigned user, creator, and related files
   - **IncomingFile**: Represents incoming documents with order number and file path
   - **Comment**: Task comments with user references

3. **Controllers**:
   - **Auth**: Login and profile management
   - **User**: CRUD operations for users (admin-only)
   - **Task**: Task creation, assignment, status updates, and workflow management
   - **File**: File upload/download functionality
   - **Dashboard**: Statistics and metrics

4. **Middleware**:
   - **Auth**: JWT token validation
   - **Role**: Role-based access control for protected endpoints

5. **Database**:
   - PostgreSQL connection with auto-migration
   - Default user creation for initial setup

### Key Features
- Role-based access control with 5 roles: Admin, Team Leader, Deputy, Secretary, Officer
- Task management with workflow tracking
- File upload/download for incoming documents and reports
- User management (CRUD operations for Admins)
- Dashboard with statistics and metrics
- Comment system for task collaboration

## Frontend (React/TypeScript)

### Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **UI Components**: Custom component library based on Radix UI
- **State Management**: React Context API for authentication

### Key Components

1. **Pages**:
   - **Dashboard**: Overview with statistics, charts, and notifications
   - **Tasks**: Task listing with filtering and detailed views
   - **User Management**: Admin-only user CRUD operations
   - **Incoming Files**: Document management
   - **Login**: Authentication page

2. **API Integration**:
   - Axios-based API clients for all backend endpoints
   - Automatic JWT token handling with interceptors
   - Type-safe API interfaces

3. **UI/UX Features**:
   - Responsive design with mobile support
   - Role-based UI rendering
   - Real-time notifications for overdue tasks
   - Interactive charts and statistics
   - Animated transitions and loading states
   - Form validation and error handling

### Key Features
- Authentication flow with token persistence
- Role-based navigation and content access
- Task management with status tracking
- User management interface for administrators
- File management for incoming documents
- Dashboard with comprehensive statistics
- Responsive design for all device sizes
- Real-time updates and notifications

## Integration Points

1. **Authentication**:
   - JWT tokens exchanged between frontend and backend
   - Protected routes on both sides
   - Automatic token refresh and logout on expiration

2. **Data Flow**:
   - RESTful API communication
   - Consistent data models between frontend and backend
   - Error handling and user feedback

3. **Security**:
   - Role-based access control enforced on both frontend and backend
   - Input validation on both sides
   - Protected API endpoints with JWT authentication

This is a comprehensive document management and task tracking system designed for organizational use, with distinct roles and responsibilities for different user types.