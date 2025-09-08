# 👥 User Management System

Comprehensive user management system for Admin users with full CRUD operations and role-based access control.

## 🚀 Features

### 🔐 Admin-Only Access
- Only users with "Quản trị viên" role can access user management
- Secure role-based authorization on both frontend and backend
- Protected routes and API endpoints

### 📊 User Statistics Dashboard
- **Total Users**: Overview of all registered users
- **Users by Role**: Distribution across different roles
- **Active Users**: Currently active user count
- **Recent Users**: Latest 10 registered users

### 👤 User CRUD Operations

#### ✅ Create User
- **Form Fields**:
  - Full Name (Họ tên)
  - Username (Tên đăng nhập)
  - Password (Mật khẩu)
  - Role (Vai trò)
- **Validation**:
  - All fields required
  - Username uniqueness check
  - Role validation against predefined roles
- **Success**: User created and added to list with toast notification

#### 👁️ View User Details
- **User Information**:
  - ID, Name, Username
  - Role with color-coded badge
  - Creation date
  - Last update date
- **Modal Dialog**: Clean, organized display of user information

#### ✏️ Edit User
- **Editable Fields**:
  - Full Name
  - Username
  - Role
  - Password (optional - leave blank to keep current)
- **Validation**:
  - Username uniqueness (excluding current user)
  - Role validation
- **Success**: User updated with toast notification

#### 🗑️ Delete User
- **Safety Checks**:
  - Cannot delete the last admin user
  - Cannot delete users with active tasks
  - Confirmation dialog with warning
- **Soft Delete**: Uses GORM soft delete functionality
- **Success**: User removed from list with toast notification

### 🔍 Search & Filter
- **Search**: By name or username (case-insensitive)
- **Filter**: By role using dropdown
- **Real-time**: Instant filtering as you type
- **Combined**: Search and filter work together

### 🎨 User Interface

#### 📱 Responsive Design
- **Mobile-first**: Works on all screen sizes
- **Grid Layout**: Responsive card grid (1/2/3 columns)
- **Touch-friendly**: Large buttons and touch targets

#### 🎯 User Experience
- **Loading States**: Spinners during async operations
- **Toast Notifications**: Success/error feedback
- **Modal Dialogs**: Clean, focused interactions
- **Empty States**: Helpful messages when no data

#### 🎨 Visual Design
- **Color-coded Roles**: Each role has distinct colors
- **Icons**: Lucide React icons throughout
- **Cards**: Clean card-based layout
- **Badges**: Role indicators with appropriate styling

## 🛠️ Technical Implementation

### 🔧 Backend (Go/Gin)

#### 📡 API Endpoints
```go
// User CRUD
GET    /api/users              // List all users
GET    /api/users/:id          // Get user by ID
POST   /api/users              // Create new user (Admin only)
PUT    /api/users/:id          // Update user (Admin only)
DELETE /api/users/:id          // Delete user (Admin only)

// User Management
POST   /api/users/:id/toggle-status  // Toggle user status
GET    /api/users/stats              // Get user statistics

// Specialized Endpoints
GET    /api/users/team-leaders       // Get team leaders & deputies
GET    /api/users/officers           // Get officers only
```

#### 🔒 Security Features
- **JWT Authentication**: All endpoints require valid JWT
- **Role Authorization**: Admin-only endpoints protected
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: GORM ORM prevents SQL injection
- **Password Security**: Ready for password hashing implementation

#### 🗄️ Database Operations
- **GORM Integration**: Full ORM support
- **Soft Deletes**: Users are soft-deleted, not permanently removed
- **Constraints**: Username uniqueness enforced
- **Relationships**: Proper foreign key relationships with tasks

### ⚛️ Frontend (React/TypeScript)

#### 🏗️ Component Architecture
```typescript
UsersPage.tsx              // Main user management page
├── UserStats              // Statistics cards
├── SearchFilters          // Search and filter controls
├── UserGrid               // Responsive user cards
├── CreateUserDialog       // Create user modal
├── EditUserDialog         // Edit user modal
├── ViewUserDialog         // View user details modal
└── DeleteUserDialog       // Delete confirmation modal
```

#### 📦 State Management
- **React Hooks**: useState, useEffect for local state
- **Custom Hooks**: useToast for notifications
- **Context API**: useAuth for authentication state
- **API Integration**: Dedicated users API service

#### 🎯 TypeScript Integration
- **Type Safety**: Full TypeScript coverage
- **Interfaces**: Well-defined data structures
- **API Types**: Typed API requests/responses
- **Component Props**: Strongly typed component interfaces

## 🔄 User Workflow

### 👨‍💼 Admin User Journey

1. **Access**: Navigate to `/users` (Admin only)
2. **Overview**: View statistics and user distribution
3. **Search**: Find specific users by name/username
4. **Filter**: Filter by role if needed
5. **Actions**:
   - **Create**: Click "Tạo người dùng mới" → Fill form → Submit
   - **View**: Click eye icon → View details in modal
   - **Edit**: Click edit icon → Modify fields → Save
   - **Delete**: Click trash icon → Confirm → Delete

### 🔐 Role-Based Access

#### Quản trị viên (Admin)
- ✅ Full access to user management
- ✅ Create, read, update, delete users
- ✅ View all statistics
- ✅ Manage all roles

#### Other Roles
- ❌ No access to user management
- ❌ Redirected with permission denied message
- ❌ API calls blocked by authorization middleware

## 📊 Data Models

### 👤 User Model
```typescript
interface User {
  id: number
  name: string
  username: string
  role: string
  created_at?: string
  updated_at?: string
}
```

### 📈 User Statistics
```typescript
interface UserStats {
  total_users: number
  users_by_role: Record<string, number>
  active_users: number
  recent_users: User[]
}
```

### 📝 Request Types
```typescript
interface CreateUserRequest {
  name: string
  username: string
  password: string
  role: string
}

interface UpdateUserRequest {
  name?: string
  username?: string
  role?: string
  password?: string
}
```

## 🎨 UI Components

### 📊 Statistics Cards
- **Total Users**: Overall user count with active users
- **Role Distribution**: Top 3 roles with percentages
- **Visual Indicators**: Icons and color coding
- **Responsive Grid**: 1-4 columns based on screen size

### 🃏 User Cards
- **User Avatar**: Colored circle with user icon
- **User Info**: Name, username, role badge
- **Action Buttons**: View, edit, delete with icons
- **Role Badge**: Color-coded role indicator
- **Creation Date**: When available

### 🔍 Search & Filters
- **Search Input**: With search icon and placeholder
- **Role Dropdown**: All roles plus "All roles" option
- **Real-time Filtering**: Instant results
- **Combined Logic**: Search AND filter

### 📱 Modal Dialogs
- **Consistent Design**: All modals follow same pattern
- **Form Validation**: Client-side validation with feedback
- **Loading States**: Disabled buttons during operations
- **Error Handling**: Toast notifications for errors

## 🚀 Performance Optimizations

### ⚡ Frontend Performance
- **Efficient Filtering**: Client-side filtering for instant results
- **Optimized Re-renders**: Proper dependency arrays
- **Lazy Loading**: Components loaded on demand
- **Memoization**: Expensive calculations cached

### 🗄️ Backend Performance
- **Database Indexing**: Proper indexes on frequently queried fields
- **Query Optimization**: Efficient GORM queries
- **Pagination Ready**: Structure supports pagination
- **Caching Potential**: Ready for Redis caching implementation

## 🔒 Security Considerations

### 🛡️ Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Role Validation**: Server-side role checking
- **Protected Routes**: Frontend route protection
- **API Security**: All endpoints properly secured

### 🔐 Data Protection
- **Input Sanitization**: All inputs validated and sanitized
- **SQL Injection Prevention**: GORM ORM protection
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: Ready for CSRF token implementation

### 🚫 Business Logic Security
- **Admin Protection**: Cannot delete last admin
- **Data Integrity**: Cannot delete users with active tasks
- **Username Uniqueness**: Enforced at database level
- **Role Validation**: Only valid roles accepted

## 🧪 Testing Strategy

### 🔬 Unit Tests
- **Component Testing**: React Testing Library
- **API Testing**: Mock API responses
- **Utility Functions**: Pure function testing
- **Validation Logic**: Input validation testing

### 🔄 Integration Tests
- **API Integration**: Full API workflow testing
- **User Flows**: Complete user journey testing
- **Error Scenarios**: Error handling testing
- **Permission Testing**: Role-based access testing

## 📈 Future Enhancements

### 🚀 Planned Features
- **Bulk Operations**: Select multiple users for bulk actions
- **User Import/Export**: CSV import/export functionality
- **Advanced Filtering**: Date ranges, status filters
- **User Activity Logs**: Track user actions and changes
- **Password Policies**: Enforce strong password requirements
- **Two-Factor Authentication**: Enhanced security
- **User Groups**: Organize users into groups
- **Permission Management**: Granular permission control

### 🎯 Performance Improvements
- **Pagination**: Handle large user lists efficiently
- **Virtual Scrolling**: For very large datasets
- **Search Optimization**: Server-side search with indexing
- **Caching**: Redis caching for frequently accessed data
- **Real-time Updates**: WebSocket for live updates

### 🎨 UI/UX Enhancements
- **Advanced Search**: Multi-field search with operators
- **Sorting Options**: Sort by various fields
- **Column Customization**: Show/hide columns
- **Export Options**: PDF, Excel export
- **Dark Mode**: Theme switching support
- **Accessibility**: Enhanced screen reader support

## 📝 Usage Examples

### 🔧 API Usage
```javascript
// Create user
const newUser = await usersApi.createUser({
  name: "Nguyễn Văn A",
  username: "nguyenvana",
  password: "password123",
  role: "Cán bộ"
})

// Update user
const updatedUser = await usersApi.updateUser(userId, {
  name: "Nguyễn Văn B",
  role: "Trưởng Công An Xã"
})

// Get statistics
const stats = await usersApi.getUserStats()
```

### ⚛️ Component Usage
```jsx
// Use in admin dashboard
<UsersPage />

// Check admin access
{user?.role === 'Quản trị viên' && (
  <Link to="/users">Quản lý người dùng</Link>
)}
```

## 🎯 Best Practices

### 💻 Development
- **TypeScript First**: Always use TypeScript for type safety
- **Component Composition**: Break down into reusable components
- **Error Boundaries**: Implement error boundaries for robustness
- **Loading States**: Always show loading indicators
- **Optimistic Updates**: Update UI before API confirmation

### 🔒 Security
- **Validate Everything**: Never trust client-side validation alone
- **Principle of Least Privilege**: Give minimum required permissions
- **Audit Trails**: Log all administrative actions
- **Regular Reviews**: Periodically review user permissions

### 🎨 UI/UX
- **Consistent Design**: Follow design system guidelines
- **Accessibility**: Ensure keyboard navigation and screen reader support
- **Mobile First**: Design for mobile, enhance for desktop
- **User Feedback**: Always provide clear feedback for actions
- **Error Messages**: Make error messages helpful and actionable

---

**🎉 The user management system provides a comprehensive, secure, and user-friendly solution for managing users in the AI Code Agent application!**