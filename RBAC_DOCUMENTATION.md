# Role-Based Access Control (RBAC) System

This NestJS application implements a comprehensive Role-Based Access Control (RBAC) system with permissions and roles management.

## Overview

The RBAC system consists of three main entities:

- **Users**: Application users that can be assigned roles
- **Roles**: Collections of permissions that can be assigned to users
- **Permissions**: Specific actions that can be performed on resources

## System Architecture

### Models

#### User Model

- `firstName`: User's first name
- `lastName`: User's last name
- `email`: Unique email address
- `password`: Hashed password
- `roles`: Array of role IDs assigned to the user
- `isActive`: Whether the user account is active
- `lastLogin`: Timestamp of last login

#### Role Model

- `name`: Unique role name (e.g., 'admin', 'user')
- `description`: Human-readable role description
- `permissions`: Array of permission IDs
- `isActive`: Whether the role is active

#### Permission Model

- `name`: Unique permission name (e.g., 'user:read')
- `description`: Human-readable permission description
- `action`: The action type (CREATE, READ, UPDATE, DELETE, MANAGE)
- `resource`: The resource type (USER, ROLE, PERMISSION, ALL)
- `isActive`: Whether the permission is active

### Permission Naming Convention

Permissions follow the format: `{resource}:{action}`

**Actions:**

- `create`: Create new resources
- `read`: Read/view resources
- `update`: Modify existing resources
- `delete`: Remove resources
- `manage`: Full control over resources

**Resources:**

- `user`: User management
- `role`: Role management
- `permission`: Permission management
- `all`: All resources (super admin)

**Examples:**

- `user:read` - Can view user information
- `user:create` - Can create new users
- `role:manage` - Full role management access
- `all:manage` - Super admin access to everything

## Default Roles and Permissions

The system automatically seeds default roles on startup:

### Super Admin (`super_admin`)

- **Permissions**: `all:manage`
- **Description**: Complete system access
- **Use Case**: System administrators

### Admin (`admin`)

- **Permissions**: `user:manage`, `role:read`, `permission:read`
- **Description**: User and basic role management
- **Use Case**: Application administrators

### User Manager (`user_manager`)

- **Permissions**: `user:create`, `user:read`, `user:update`, `user:delete`
- **Description**: Complete user management
- **Use Case**: HR or user management staff

### User (`user`)

- **Permissions**: `user:read`
- **Description**: Basic user with profile access
- **Use Case**: Regular application users

## Authentication & Authorization

### Guards

#### JwtAuthGuard

Validates JWT tokens and extracts user information.

#### PermissionsGuard

Checks if the authenticated user has required permissions.

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('user:create')
@Post('users')
createUser() {
  // Only users with 'user:create' permission can access
}
```

#### RolesGuard

Checks if the authenticated user has required roles.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles('admin', 'user_manager')
@Get('admin-dashboard')
getAdminDashboard() {
  // Only users with 'admin' or 'user_manager' roles can access
}
```

### Decorators

#### @RequirePermissions()

Requires specific permissions to access an endpoint.

```typescript
@RequirePermissions('user:read', 'user:update')
// User must have BOTH permissions
```

#### @RequireRoles()

Requires specific roles to access an endpoint.

```typescript
@RequireRoles('admin', 'moderator')
// User must have AT LEAST ONE of these roles
```

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### User Management

- `GET /user/profile` - Get current user profile
- `GET /user/all` - Get all users (requires `user:read`)
- `GET /user/:id` - Get user by ID (requires `user:read`)
- `POST /user/create` - Create user (requires `user:create`)
- `PUT /user/update` - Update user (requires `user:update`)
- `DELETE /user/delete` - Delete user (requires `user:delete`)
- `POST /user/:userId/roles/:roleId` - Assign role to user (requires `user:update`)
- `DELETE /user/:userId/roles/:roleId` - Remove role from user (requires `user:update`)

### Role Management

- `GET /roles` - Get all roles (requires `role:read`)
- `GET /roles/:id` - Get role by ID (requires `role:read`)
- `POST /roles` - Create role (requires `role:create`)
- `PATCH /roles/:id` - Update role (requires `role:update`)
- `DELETE /roles/:id` - Delete role (requires `role:delete`)
- `POST /roles/:roleId/permissions/:permissionId` - Add permission to role (requires `role:update`)
- `DELETE /roles/:roleId/permissions/:permissionId` - Remove permission from role (requires `role:update`)

### Permission Management

- `GET /permissions` - Get all permissions (requires `permission:read`)
- `GET /permissions/:id` - Get permission by ID (requires `permission:read`)
- `POST /permissions` - Create permission (requires `permission:create`)
- `PATCH /permissions/:id` - Update permission (requires `permission:update`)
- `DELETE /permissions/:id` - Delete permission (requires `permission:delete`)
- `POST /permissions/seed` - Seed default permissions (requires `permission:create`)

## Initial Setup

### Default Super Admin

On first startup, the system creates a default super admin user:

- **Email**: `superadmin@system.com`
- **Password**: `SuperAdmin123!`
- **Role**: `super_admin`

**⚠️ IMPORTANT**: Change this password immediately after first login!

### Database Seeding

The system automatically seeds:

1. Default permissions for all resources and actions
2. Default roles with appropriate permissions
3. Super admin user with super_admin role

## Usage Examples

### Creating a Custom Role

```typescript
// 1. Create permissions
const readPermission = await permissionService.create({
	name: 'blog:read',
	description: 'Read blog posts',
	action: PermissionAction.READ,
	resource: 'blog',
});

const writePermission = await permissionService.create({
	name: 'blog:create',
	description: 'Create blog posts',
	action: PermissionAction.CREATE,
	resource: 'blog',
});

// 2. Create role with permissions
const blogEditorRole = await roleService.create({
	name: 'blog_editor',
	description: 'Blog content editor',
	permissions: [readPermission._id, writePermission._id],
});

// 3. Assign role to user
await userService.assignRoleToUser(userId, blogEditorRole._id);
```

### Protecting Routes

```typescript
@Controller('blog')
export class BlogController {
	@Get()
	@RequirePermissions('blog:read')
	getAllPosts() {
		// Anyone with blog:read permission can access
	}

	@Post()
	@RequirePermissions('blog:create')
	createPost() {
		// Only users with blog:create permission can access
	}

	@Get('admin')
	@RequireRoles('admin', 'blog_editor')
	getAdminDashboard() {
		// Only admins or blog editors can access
	}
}
```

### Checking Permissions Programmatically

```typescript
@Injectable()
export class BlogService {
	constructor(private userService: UserService) {}

	async canUserEditPost(userEmail: string, postId: string): Promise<boolean> {
		const user = await this.userService.findOneByEmailWithRoles(userEmail);

		// Check if user has blog:update permission
		for (const role of user.roles) {
			for (const permission of role.permissions) {
				if (permission.name === 'blog:update' || permission.name === 'all:manage') {
					return true;
				}
			}
		}

		return false;
	}
}
```

## Best Practices

1. **Principle of Least Privilege**: Grant users only the minimum permissions needed
2. **Role Hierarchy**: Use role inheritance where appropriate
3. **Permission Granularity**: Create specific permissions rather than broad ones
4. **Regular Audits**: Periodically review user roles and permissions
5. **Secure Defaults**: New users should have minimal permissions by default

## Security Considerations

1. **JWT Security**: Use strong secrets and appropriate expiration times
2. **Password Policies**: Enforce strong password requirements
3. **Rate Limiting**: Implement rate limiting on authentication endpoints
4. **Audit Logging**: Log all permission-related activities
5. **Regular Updates**: Keep dependencies updated for security patches

## Environment Variables

```env
JWT_SECRET=your-strong-jwt-secret
JWT_EXPIRATION=1h
MONGODB_URI=mongodb://localhost:27017/your-database
```

## Error Handling

The system provides specific error messages for:

- Missing permissions: `ForbiddenException` with required permissions
- Missing roles: `ForbiddenException` with required roles
- Invalid tokens: `UnauthorizedException`
- Inactive users: `UnauthorizedException`

## Performance Considerations

- User roles and permissions are populated in a single query to minimize database calls
- JWT tokens include role IDs to reduce database lookups
- Permissions are cached in the user context during request lifecycle
- Soft deletes are used for roles and permissions to maintain referential integrity
