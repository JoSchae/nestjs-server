# NestJS Server - Postman Collections

This directory contains Postman collections for testing all the NestJS Server API endpoints.

## 📁 Collections

- **`App_API.postman_collection.json`** - General app endpoints (health check)
- **`Auth_API.postman_collection.json`** - Authentication endpoints
- **`User_API.postman_collection.json`** - User management endpoints
- **`Role_API.postman_collection.json`** - Role management endpoints
- **`Permission_API.postman_collection.json`** - Permission management endpoints
- **`Full_Test_Suite.postman_collection.json`** - Complete integration test suite
- **`NestJS_Server.postman_environment.json`** - Environment variables

## 🚀 Quick Start

### 1. Import Collections

1. Open Postman
2. Click **Import**
3. Drag and drop all `.json` files from this directory
4. Or use **File** → **Import** and select all files

### 2. Set Up Environment

1. Import `NestJS_Server.postman_environment.json`
2. Select the "NestJS Server Environment" from the environment dropdown
3. Update the `baseUrl` if your server runs on a different port

### 3. Get Started

1. **Health Check**: Run "App API" → "Health Check" to verify server is running
2. **Login**: Run "Auth API" → "Login" to get authentication token
3. **Explore**: The token will be automatically saved and used in subsequent requests

## 🔐 Authentication Flow

### Default Admin Credentials

- **Email**: `superadmin@system.com`
- **Password**: `SuperAdmin123!`

### Token Management

The collections are configured to automatically:

- Extract JWT token from login response
- Store it in collection variables
- Use it in Authorization headers for protected endpoints

## 📚 Available API Endpoints

This NestJS server template provides the following API endpoints:

### 🏥 Health Check
- `GET /health` - Server health status

### 🔐 Authentication
- `POST /auth/login` - User login

### 👤 User Management
- `GET /user/all` - Get all users
- `GET /user/profile` - Get current user profile
- `POST /user` - Create new user
- `PUT /user/:id` - Update user
- `DELETE /user/:id` - Delete user

### 👥 Role Management
- `GET /roles` - Get all roles
- `POST /roles` - Create new role
- `PUT /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role

### 🔑 Permission Management
- `GET /permissions` - Get all permissions
- `POST /permissions` - Create new permission
- `PUT /permissions/:id` - Update permission
- `DELETE /permissions/:id` - Delete permission

## 🧪 Testing

### Full Test Suite

The `Full_Test_Suite.postman_collection.json` includes:

1. **Health Check** - Verify server is running
2. **Admin Login** - Authenticate and get token
3. **Permission Tests** - Test permission endpoints
4. **Role Tests** - Test role endpoints
5. **User Tests** - Test user endpoints

Each request includes automated tests for:
- Response time validation
- Status code verification
- Response structure validation

### Individual Collections

Each API has its own collection with focused tests:

- **App API**: Basic health and status checks
- **Auth API**: Login and authentication flows
- **User API**: Complete user CRUD operations
- **Role API**: Role management operations
- **Permission API**: Permission management operations

## 🌍 Environment Variables

The environment includes these variables:

- `baseUrl` - API base URL (default: `http://localhost:3000`)
- `token` - JWT authentication token (auto-populated after login)
- `userId` - User ID for user operations
- `roleId` - Role ID for role operations
- `permissionId` - Permission ID for permission operations

## 🚨 Important Notes

This is a **base NestJS server template** that includes core authentication and user management features. The Postman collections have been specifically created for this template and only include endpoints that exist in the base implementation.

If you extend this server with additional features (like configuration management, templates, file uploads, etc.), you'll need to:

1. Add new API endpoints to your controllers
2. Create corresponding Postman requests
3. Update the Full_Test_Suite accordingly

The collections are designed to be easily extensible for your specific use case.

## 📝 Collection Structure

Each collection follows this structure:

```
Collection Name
├── Setup (if needed)
├── Create Operations
├── Read Operations
├── Update Operations
├── Delete Operations
└── Error Cases
```

This makes it easy to understand and maintain the test suites as your API grows.
