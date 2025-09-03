# NestJS with MongoDB, Role-Based Access Control, Docker & Production Setup

## Project Overview

This NestJS application provides a complete authentication and authorization system with:

- **Full RBAC System**: Users, Roles, and Permissions
- **MongoDB Integration**: Using Mongoose ODM
- **JWT Authentication**: Secure token-based auth
- **Swagger Documentation**: Auto-generated API docs
- **Docker Containerization**: Development and production ready
- **Automatic Data Seeding**: Default permissions, roles, and super admin

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (see Environment Configuration section)
4. Start with Docker:

```bash
docker-compose up
```

## Core Components

### Main Application Setup

The **main.ts** file configures the NestJS application with Swagger documentation:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const PORT = parseInt(process.env.SERVER_PORT, 10) || 3000;

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Setup OpenAPI
	const config = new DocumentBuilder()
		.setTitle('SchaeferDevelopment NestJS API')
		.setDescription('API for SchaeferDevelopment')
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, documentFactory);

	app.useGlobalPipes(new ValidationPipe());
	await app.listen(PORT);
}
bootstrap();
```

### App Module Structure

The **app.module.ts** orchestrates all modules and sets up global configuration:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import mongodbConfig from './shared/config/mongodb.config';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { SeedModule } from './seed/seed.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: '.env',
			isGlobal: true,
			load: [mongodbConfig],
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('mongodb.uri'),
			}),
			inject: [ConfigService],
		}),
		AuthModule,
		UserModule,
		RoleModule,
		PermissionModule,
		SeedModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
	],
})
export class AppModule {}
```

## RBAC System

### Permission Model

The permission system uses a `resource:action` pattern with enums for consistency:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export enum PermissionAction {
	CREATE = 'create',
	READ = 'read',
	UPDATE = 'update',
	DELETE = 'delete',
	MANAGE = 'manage', // Full access
}

export enum PermissionResource {
	USER = 'user',
	ROLE = 'role',
	PERMISSION = 'permission',
	ALL = 'all', // All resources
}

@Schema({ timestamps: true })
export class Permission {
	@ApiProperty({ description: 'Permission name', example: 'user:read' })
	@Prop({ required: true, unique: true })
	name: string;

	@ApiProperty({ description: 'Permission description', example: 'Can read user information' })
	@Prop()
	description: string;

	@ApiProperty({ description: 'Action allowed', enum: PermissionAction })
	@Prop({ required: true, enum: PermissionAction })
	action: PermissionAction;

	@ApiProperty({ description: 'Resource the permission applies to', enum: PermissionResource })
	@Prop({ required: true, enum: PermissionResource })
	resource: PermissionResource;

	@ApiProperty({ description: 'Whether the permission is active', example: true })
	@Prop({ default: true })
	isActive: boolean;
}

export type PermissionDocument = Permission & Document;
export const PermissionSchema = SchemaFactory.createForClass(Permission);
```

### Role Model

Roles group permissions and can be assigned to users:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Role {
	@ApiProperty({ description: 'Role name', example: 'admin' })
	@Prop({ required: true, unique: true })
	name: string;

	@ApiProperty({ description: 'Role description', example: 'Administrator with full access' })
	@Prop()
	description: string;

	@ApiProperty({ description: 'List of permission IDs', type: [String] })
	@Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }] })
	permissions: Types.ObjectId[];

	@ApiProperty({ description: 'Whether the role is active', example: true })
	@Prop({ default: true })
	isActive: boolean;
}

export type RoleDocument = Role & Document;
export const RoleSchema = SchemaFactory.createForClass(Role);
```

### User Model

Users can have multiple roles and include audit fields:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User {
	@ApiProperty({ description: 'Users first name', example: 'Max' })
	@Prop()
	firstName: string;

	@ApiProperty({ description: 'Users last name', example: 'Mustermann' })
	@Prop()
	lastName: string;

	@ApiProperty({ description: 'Users email', example: 'default@example.com' })
	@Prop({ lowercase: true, unique: true })
	email: string;

	@ApiProperty({ description: 'Users password', example: 'MyVerySecurePassword' })
	@Prop({ select: false })
	password: string;

	@ApiProperty({ description: 'User roles', type: [String] })
	@Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
	roles: Types.ObjectId[];

	@ApiProperty({ description: 'Whether the user is active', example: true })
	@Prop({ default: true })
	isActive: boolean;

	@ApiProperty({ description: 'Last login timestamp' })
	@Prop()
	lastLogin: Date;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
```

### User Login DTO

For authentication requests:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class UserLoginDto {
	@ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
	email: string;

	@ApiProperty({ example: 'password123', description: 'The password of the user' })
	password: string;
}
```

## Authentication System

### Auth Service

Handles password hashing, user validation, and JWT generation:

```typescript
import { Injectable, forwardRef, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { UserLoginDto } from 'src/user/model/user-login.dto';

@Injectable()
export class AuthService {
	constructor(
		@Inject(forwardRef(() => UserService))
		private userService: UserService,
		private jwtService: JwtService,
	) {}

	public async validateUser(email: string, pass: string): Promise<any> {
		const query = { email: email };
		const user = await this.userService.findOneByEmail(query);
		if (!user) {
			throw new NotFoundException('Email Does not exist');
		}
		if (!user.isActive) {
			throw new UnauthorizedException('User account is deactivated');
		}
		const isMatched = await this.comparePasswords(pass, user.password);
		if (!isMatched) {
			throw new UnauthorizedException('Invalid Password');
		}

		// Update last login
		await this.userService.updateLastLogin(user._id);

		return user;
	}

	public async generateJwtToken(user: UserLoginDto): Promise<any> {
		// Get user with roles for JWT payload
		const userWithRoles = await this.userService.findOneByEmailWithRoles(user.email);

		const payload = {
			email: user.email,
			sub: userWithRoles._id,
			roles: userWithRoles.roles?.map((role) => role._id) || [],
		};

		return {
			access_token: this.jwtService.sign(payload),
		};
	}

	public async getHashedPassword(password: string): Promise<any> {
		return new Promise((resolve, reject) => {
			bcrypt.hash(password, 10, (err, hash) => {
				if (err) {
					reject(err);
				}
				resolve(hash);
			});
		});
	}

	private async comparePasswords(password: string, hashedPassword: string): Promise<any> {
		return bcrypt
			.compare(password, hashedPassword)
			.then((isMatch: boolean) => {
				return !!isMatch;
			})
			.catch((err) => err);
	}
}
```

### Permission-Based Guards

The permission guard checks if users have required permissions:

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserService } from '../../user/user.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private userService: UserService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredPermissions) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user) {
			throw new ForbiddenException('User not authenticated');
		}

		// Get user with populated roles and permissions
		const userWithRoles = await this.userService.findOneByEmailWithRoles(user.email);
		if (!userWithRoles) {
			throw new ForbiddenException('User not found');
		}

		// Extract all permissions from user's roles
		const userPermissions = new Set<string>();

		for (const role of userWithRoles.roles || []) {
			for (const permission of role.permissions || []) {
				userPermissions.add(permission.name);

				// Check for super admin permission
				if (permission.name === 'all:manage') {
					return true;
				}
			}
		}

		// Check if user has all required permissions
		const hasAllPermissions = requiredPermissions.every((permission) => userPermissions.has(permission));

		if (!hasAllPermissions) {
			throw new ForbiddenException(`Insufficient permissions. Required: ${requiredPermissions.join(', ')}`);
		}

		return true;
	}
}
```

### Permission Decorator

For easy permission requirements on endpoints:

```typescript
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
```

## User Management

### User Service

Handles all user operations with MongoDB:

```typescript
// Key methods include:
// - findOneByEmail(): Find user by email with optional password
// - findOneByEmailWithRoles(): Get user with populated roles and permissions
// - create(): Create new user with hashed password
// - assignRoleToUser(): Add role to user
// - removeRoleFromUser(): Remove role from user
// - findAll(): Get all active users
// - updateLastLogin(): Track user login times
```

### User Controller

REST endpoints for user management:

```typescript
@ApiTags('User')
@Controller('user')
export class UserController {
	// POST /user/create - Create new user (requires user:create permission)
	// GET /user/all - Get all users (requires user:read permission)
	// GET /user/profile - Get current user profile
	// GET /user/:id - Get user by ID (requires user:read permission)
	// PUT /user/update - Update user profile (requires user:update permission)
	// DELETE /user/delete - Delete user profile (requires user:delete permission)
	// POST /user/:userId/roles/:roleId - Assign role to user
	// DELETE /user/:userId/roles/:roleId - Remove role from user
}
```

## Data Seeding

### Automatic Seeding

The application automatically seeds default data on startup:

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class SeedService implements OnModuleInit {
	async onModuleInit() {
		await this.seedDefaultData();
	}

	async seedDefaultData() {
		// 1. Seed default permissions
		await this.permissionService.seedDefaultPermissions();

		// 2. Seed default roles
		await this.seedDefaultRoles();

		// 3. Create super admin user
		await this.createSuperAdminUser();
	}
}
```

### Default Permissions

The system creates these permissions automatically:

- **User permissions**: user:create, user:read, user:update, user:delete, user:manage
- **Role permissions**: role:create, role:read, role:update, role:delete, role:manage
- **Permission permissions**: permission:create, permission:read, permission:update, permission:delete, permission:manage
- **Super admin**: all:manage (full system access)

### Default Roles

Four roles are created automatically:

1. **super_admin**: Full system access (all:manage)
2. **admin**: User and role management
3. **user_manager**: Can manage users
4. **user**: Basic user with read-only access

### Super Admin User

A default super admin is created:

- **Email**: superadmin@system.com
- **Password**: SuperAdmin123!
- **Role**: super_admin

⚠️ **Change this password immediately in production!**

## MongoDB Configuration

### Database Config

The **mongodb.config.ts** handles database connection:

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('mongodb', () => {
	const { MONGO_DB_PORT, MONGO_DB_HOSTNAME, MONGO_DB_DATABASE, MONGO_DB_USERNAME, MONGO_DB_PASSWORD } = process.env;
	return {
		uri: `mongodb://${MONGO_DB_USERNAME}:${MONGO_DB_PASSWORD}@${MONGO_DB_HOSTNAME}:${MONGO_DB_PORT}/${MONGO_DB_DATABASE}?authSource=${MONGO_DB_DATABASE}`,
	};
});
```

## Environment Configuration

Create a `.env` file with these variables:

```env
SERVER_PORT=3000
MONGO_DB_PORT=27017
MONGO_DB_USERNAME=nestjs_user
MONGO_DB_PASSWORD=nestjs_password
MONGO_DB_HOSTNAME=mongodb
MONGO_DB_DATABASE=nestjs-server
MONGO_DB_ADMIN_USERNAME=admin@admin.com
MONGO_DB_ADMINUSER_PASSWORD=adminpassword
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=rootpassword
CLOUDFLARE_APIKEY=noKeySet
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=3600s
```

## Docker Setup

### Docker Compose

The **docker-compose.yml** sets up the complete environment:

```yaml
services:
    nestjs:
        image: johannesschaefer/nestjs:${TAG:-dev}
        build:
            context: .
            dockerfile: ./dockerfiles/nestjs/Dockerfile
            target: dev
            args:
                - NODE_ENV=dev
        command: npm run start:debug
        volumes:
            - .:/usr/src/app
            - /usr/src/app/node_modules
        container_name: nestjs
        env_file:
            - .env
        depends_on:
            mongodb:
                condition: service_healthy
        networks:
            - app-network

    mongodb:
        image: johannesschaefer/mongo:${TAG:-dev}
        build:
            context: .
            dockerfile: ./dockerfiles/mongodb/Dockerfile
        container_name: mongodb
        env_file:
            - .env
        environment:
            - MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME}
            - MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD}
            - MONGO_INITDB_DATABASE=${MONGO_DB_DATABASE}
        volumes:
            - mongodb_data:/data/db/
            - mongodb_log:/var/log/mongodb/
            - ./mongo:/docker-entrypoint-initdb.d:ro
        networks:
            - app-network

volumes:
    mongodb_data:
    mongodb_log:

networks:
    app-network:
        driver: bridge
```

### NestJS Dockerfile

Multi-stage Dockerfile for development and production:

```dockerfile
# Build stage
FROM node:18.19.1-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install -g @nestjs/cli && npm ci

COPY . .
RUN npm run build

# Development stage
FROM node:18.19.1-alpine AS dev

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install -g @nestjs/cli && \
    npm ci

COPY . .

# Production stage
FROM node:18.19.1-alpine AS prod

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

USER node
CMD ["npm", "run", "start:prod"]
```

## API Usage

### Authentication Flow

1. **Login** to get JWT token:

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "superadmin@system.com",
  "password": "SuperAdmin123!"
}
```

2. **Use token** for protected endpoints:

```bash
GET /user/profile
Authorization: Bearer <your-jwt-token>
```

### Available Endpoints

- **Health Check**: GET `/health` (public)
- **Authentication**: POST `/auth/login` (public)
- **User Management**: `/user/*` (permission-based)
- **Role Management**: `/role/*` (permission-based)
- **Permission Management**: `/permission/*` (permission-based)

### Swagger Documentation

#### What is Swagger?

Swagger (now known as OpenAPI) is a powerful framework for API documentation that provides:

- **Interactive API Documentation**: Auto-generated, always up-to-date documentation
- **API Testing Interface**: Test endpoints directly from the browser
- **Code Generation**: Generate client SDKs in multiple languages
- **API Validation**: Ensure API matches documentation
- **Standard Format**: Industry-standard OpenAPI specification

#### Why Use Swagger?

1. **Developer Experience**: Developers can explore and test APIs without external tools
2. **Documentation Sync**: Documentation is generated from code, so it's always accurate
3. **Team Collaboration**: Frontend and backend teams can work with clear API contracts
4. **API Design**: Design-first approach with clear endpoint specifications
5. **Testing**: Built-in testing capabilities for all endpoints

#### Accessing Swagger UI

Access the comprehensive API documentation at: `http://localhost:3000/api`

![Swagger UI Example](./swagger-example.png)

#### Using Swagger UI

**1. Exploring Endpoints**

- Browse all available API endpoints organized by tags (User, Auth, Roles, Permissions)
- View request/response schemas with examples
- See required parameters and data types

**2. Authentication**

- Click "Authorize" button in the top-right corner
- Enter your JWT token in the format: `Bearer <your-jwt-token>`
- Once authorized, all subsequent requests include the token

**3. Testing Endpoints**

- Click on any endpoint to expand it
- Click "Try it out" button
- Fill in required parameters
- Click "Execute" to make the actual API call
- View the response with status code, headers, and body

**4. Request/Response Examples**

- Each endpoint shows example request bodies
- Response examples with different HTTP status codes
- Schema definitions with data types and validation rules

#### Swagger Implementation in This Project

The Swagger setup in **main.ts** includes:

```typescript
const config = new DocumentBuilder()
	.setTitle('SchaeferDevelopment NestJS API') // API title
	.setDescription('API for SchaeferDevelopment') // API description
	.setVersion('1.0') // API version
	.addBearerAuth() // JWT authentication
	.build();
```

**Key Decorators Used:**

- `@ApiTags()` - Groups endpoints by feature (User, Auth, etc.)
- `@ApiOperation()` - Describes what the endpoint does
- `@ApiResponse()` - Documents possible response codes
- `@ApiProperty()` - Documents model properties
- `@ApiBearerAuth()` - Indicates JWT authentication required

#### Example Endpoint Documentation

```typescript
@Post('create')
@UseGuards(PermissionsGuard)
@RequirePermissions('user:create')
@ApiOperation({ summary: 'Create a new user' })
@ApiBody({ description: 'User data', type: User })
@ApiResponse({ status: 201, description: 'User created successfully.' })
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 409, description: 'User already exists.' })
public async create(@Request() req: any, @Response() res): Promise<any> {
    // Implementation
}
```

#### Available API Sections

**1. Authentication (`/auth`)**

- POST `/auth/login` - User login with email/password

**2. User Management (`/user`)**

- POST `/user/create` - Create new user (requires `user:create`)
- GET `/user/all` - List all users (requires `user:read`)
- GET `/user/profile` - Get current user profile
- GET `/user/:id` - Get user by ID (requires `user:read`)
- PUT `/user/update` - Update user profile (requires `user:update`)
- DELETE `/user/delete` - Delete user profile (requires `user:delete`)
- POST `/user/:userId/roles/:roleId` - Assign role to user
- DELETE `/user/:userId/roles/:roleId` - Remove role from user

**3. Role Management (`/roles`)**

- POST `/roles` - Create new role (requires `role:create`)
- GET `/roles` - List all roles (requires `role:read`)
- GET `/roles/:id` - Get role by ID
- PATCH `/roles/:id` - Update role (requires `role:update`)
- DELETE `/roles/:id` - Delete role (requires `role:delete`)
- POST `/roles/:roleId/permissions/:permissionId` - Add permission to role
- DELETE `/roles/:roleId/permissions/:permissionId` - Remove permission from role

**4. Permission Management (`/permissions`)**

- POST `/permissions` - Create new permission (requires `permission:create`)
- GET `/permissions` - List all permissions (requires `permission:read`)
- GET `/permissions/:id` - Get permission by ID
- PATCH `/permissions/:id` - Update permission (requires `permission:update`)
- DELETE `/permissions/:id` - Delete permission (requires `permission:delete`)
- POST `/permissions/seed` - Seed default permissions

**5. Health Check (`/health`)**

- GET `/health` - Service health check (public endpoint)

#### Testing Workflow with Swagger

**Step 1: Get Authentication Token**

1. Navigate to `/auth/login` endpoint
2. Click "Try it out"
3. Enter credentials:
    ```json
    {
    	"email": "superadmin@system.com",
    	"password": "SuperAdmin123!"
    }
    ```
4. Copy the `access_token` from the response

**Step 2: Authorize Swagger**

1. Click "Authorize" button at the top
2. Enter: `Bearer <your-access-token>`
3. Click "Authorize"

**Step 3: Test Protected Endpoints**

1. Try any user, role, or permission endpoint
2. Swagger automatically includes your token
3. View responses and test different scenarios

#### Swagger Best Practices in This Project

**1. Comprehensive Descriptions**

- Every endpoint has clear summary and description
- All possible response codes documented
- Request/response examples provided

**2. Security Documentation**

- JWT authentication clearly marked
- Permission requirements specified in descriptions
- Public endpoints clearly identified

**3. Model Documentation**

- All DTOs have `@ApiProperty()` decorators
- Examples provided for all fields
- Validation rules documented

**4. Error Documentation**

- Common error responses documented
- Consistent error formats
- Clear error messages

#### Advanced Swagger Features

**1. Response Schemas**
All endpoints return structured responses with proper typing:

```typescript
@ApiResponse({
  status: 200,
  description: 'User retrieved successfully',
  type: User
})
```

**2. Request Validation**
DTOs include validation decorators that appear in Swagger:

```typescript
@ApiProperty({ example: 'user@example.com' })
@IsEmail()
email: string;
```

**3. Enum Documentation**
Enums are automatically documented with all possible values:

```typescript
@ApiProperty({ enum: PermissionAction })
action: PermissionAction;
```

#### Swagger UI URLs

- **Development**: http://localhost:3000/api
- **Production**: https://schaeferdevelopment.tech/api
- **JSON Schema**: http://localhost:3000/api-json

Access comprehensive API documentation with full interactive testing capabilities at: `http://localhost:3000/api`

## Development Workflow

### Local Development

1. Start services:

```bash
docker-compose up
```

2. Check logs:

```bash
docker-compose logs -f nestjs
```

3. Access application:

- API: http://localhost:3000
- Swagger: http://localhost:3000/api

### Database Management

Connect to MongoDB:

```bash
docker exec -it mongodb mongosh -u root -p rootpassword
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Configurable expiration
- **Role-Based Access**: Granular permissions
- **Input Validation**: Class validator decorators
- **Environment Variables**: Secure configuration
- **Database Security**: Authentication enabled

## Production Considerations

1. **Change default passwords** immediately
2. **Use strong JWT secrets** (environment variables)
3. **Enable HTTPS** in production
4. **Regular security audits** of roles and permissions
5. **Monitor authentication logs**
6. **Database backups** and monitoring

## Nginx Reverse Proxy

### Nginx Configuration

The application includes nginx as a reverse proxy with separate configurations for development and production environments.

#### Development Configuration

The **nginx.dev.conf** provides basic HTTP proxying for local development:

```properties
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;
    default_type application/octet-stream;

    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    upstream backend {
        server nestjs:3000;
    }

    server {
        listen 80;
        listen [::]:80;
        server_name localhost;

        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }

        access_log /var/log/nginx/dev.access.log;
        error_log /var/log/nginx/dev.error.log warn;
    }
}
```


#### Production Configuration

The **nginx.prod.conf** is optimized for Cloudflare Tunnel and uses Cloudflare Origin CA certificates for SSL/TLS. You must create and mount these certificates for secure production deployment.

### Cloudflare Origin CA Certificate Setup

1. Go to your Cloudflare dashboard → SSL/TLS → Origin Server.
2. Create a new Origin Certificate for your domain (e.g., schaeferdevelopment.tech).
3. Download the certificate and key files.
4. Place them on your host system at:
	- `/etc/ssl/certs/cloudflare-origin-fullchain.pem`
	- `/etc/ssl/private/cloudflare-origin.key`
5. Ensure permissions allow Nginx to read these files (read-only recommended).

### Docker Compose Certificate Mounts

In production, the Nginx container mounts these files as follows (see `docker-compose.prod.pull.yml`):

```yaml
	 volumes:
		- /etc/ssl/certs/cloudflare-origin-fullchain.pem:/etc/ssl/certs/cloudflare-origin-fullchain.pem:ro
		- /etc/ssl/private/cloudflare-origin.key:/etc/ssl/private/cloudflare-origin.key:ro
```

### Cloudflare Tunnel Setup

To expose your service securely, set up a Cloudflare Tunnel:

1. Install `cloudflared` on your host: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Authenticate with your Cloudflare account: `cloudflared login`
3. Create and run a tunnel for your domain:
	```bash
	cloudflared tunnel create nestjs-server-tunnel
	cloudflared tunnel route dns nestjs-server-tunnel schaeferdevelopment.tech
	cloudflared tunnel run nestjs-server-tunnel
	```
4. Ensure your DNS records in Cloudflare point to the tunnel.

### Nginx Configuration for Cloudflare

Nginx is preconfigured for Cloudflare compatibility in `nginx/nginx.prod.conf` and `nginx/nginx.prod.cloudflare.conf`:

- Uses the mounted Origin CA cert/key for SSL
- Accepts real IP headers from Cloudflare
- Optimized security headers and gzip

Example SSL section:

```nginx
	 ssl_certificate /etc/ssl/certs/cloudflare-origin-fullchain.pem;
	 ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;
```

---

The **nginx.prod.conf** includes SSL/TLS, security headers, and production optimizations:

```properties
error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;
    default_type  application/octet-stream;

    map $http_x_forwarded_proto $redirect_scheme {
        https off;
        default on;
    }

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    upstream backend {
        server nestjs:3000;
        keepalive 32;
    }

    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        http2 on;
        server_name schaeferdevelopment.tech;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/schaeferdevelopment.tech/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/schaeferdevelopment.tech/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES256-GCM-SHA384;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;
        ssl_buffer_size 4k;

        # Security headers
        add_header Strict-Transport-Security "max-age=63072000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "accelerometer=(),camera=(),geolocation=(),gyroscope=(),magnetometer=(),microphone=(),payment=(),usb=()";

        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_buffering off;
            proxy_redirect off;
            proxy_read_timeout 240s;
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }

        access_log /var/log/nginx/schaeferdevelopment.tech.access.log;
        error_log /var/log/nginx/schaeferdevelopment.tech.error.log warn;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        listen [::]:80;
        server_name schaeferdevelopment.tech;

        if ($redirect_scheme = on) {
            return 301 https://$server_name$request_uri;
        }

        location / {
            proxy_pass http://backend;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

#### Nginx Dockerfile

The nginx container uses environment-specific configurations:

```dockerfile
FROM nginx:latest
ARG NODE_ENV
COPY ./nginx/nginx.${NODE_ENV}.conf /etc/nginx/nginx.conf
```

### Production Features

- **SSL/TLS termination** with Cloudflare Origin certificates
- **HTTP/2 support** for improved performance
- **Security headers** for protection against common attacks
- **Gzip compression** for reduced bandwidth usage
- **Connection keep-alive** for better performance
- **Automatic HTTP to HTTPS redirect**
- **Cloudflare Real IP configuration** for accurate visitor IPs

## Cloudflare Tunnel Integration

### Secure Connectivity Without Port Forwarding

The application uses Cloudflare Tunnel to provide secure connectivity without requiring port forwarding or exposing your origin server directly to the internet.

#### Benefits of Cloudflare Tunnel

- **No port forwarding required** - bypasses ISP restrictions
- **Enhanced security** - no open ports on your server
- **Automatic SSL/TLS** - Cloudflare handles SSL termination
- **Better performance** - Cloudflare's global CDN
- **DDoS protection** - built-in protection

#### Setup Process

1. **Install cloudflared** on your server
2. **Create and configure tunnel** with your domain
3. **Update DNS records** to point to tunnel endpoint
4. **Configure nginx** for Cloudflare compatibility

For detailed setup instructions, see: `cloudflare-tunnel-setup.md`

#### nginx Configuration for Cloudflare

The application includes Cloudflare-optimized nginx configuration with:

- **Real IP detection** for accurate visitor logs
- **Cloudflare IP ranges** for trusted proxy configuration
- **Security headers** optimized for Cloudflare
- **SSL certificate chain** for Full (strict) mode

```nginx
# Cloudflare Real IP configuration
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
# ... (all Cloudflare IP ranges)
real_ip_header CF-Connecting-IP;
```

## CI/CD with GitHub Actions

### Automated Deployment Pipeline

The repository includes a GitHub Actions workflow for automated Docker image building and deployment.

#### Workflow Configuration

The **deploy.yml** workflow handles building and pushing Docker images:

```yaml
name: create and push docker images

on:
    push:
        branches:
            - main
            - dev

jobs:
    build-and-push:
        runs-on: ubuntu-latest
        env:
            TAG: ${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
        steps:
            - name: Checkout code
              uses: actions/checkout@v3

            - name: Set up Docker Buildx
              uses: docker/setup-buildx-action@v3

            - name: Log in to Docker Hub
              uses: docker/login-action@v3
              with:
                  username: ${{ secrets.DOCKER_USERNAME }}
                  password: ${{ secrets.DOCKER_PASSWORD }}

            - name: Generate environment file
              run: |
                  cat << EOF > .env
                  NODE_ENV=${{ env.TAG }}
                  SERVER_PORT=3000
                  MONGO_DB_PORT=27017
                  MONGO_DB_USERNAME=${{ secrets.MONGO_DB_USERNAME }}
                  MONGO_DB_PASSWORD=${{ secrets.MONGO_DB_PASSWORD }}
                  MONGO_DB_HOSTNAME=mongodb
                  MONGO_DB_DATABASE=${{ secrets.MONGO_DB_DATABASE }}
                  MONGO_DB_ADMINUSER_PASSWORD=${{ secrets.MONGO_DB_ADMINUSER_PASSWORD }}
                  MONGO_INITDB_ROOT_USERNAME=${{ secrets.MONGO_INITDB_ROOT_USERNAME }}
                  MONGO_INITDB_ROOT_PASSWORD=${{ secrets.MONGO_INITDB_ROOT_PASSWORD }}
                  EOF

            - name: Clear Docker system cache
              run: |
                  docker system prune -af
                  docker builder prune -af

            - name: Build and push Docker images
              env:
                  CLOUDFLARE_APIKEY: ${{ secrets.CLOUDFLARE_APIKEY }}
                  NODE_ENV: ${{ env.TAG }}
              run: |
                  # Force remove any existing images with same tags
                  docker compose -f docker-compose.yml -f docker-compose.${{ env.TAG }}.yml down --rmi all || true

                  # Build with no cache and no build context reuse
                  DOCKER_BUILDKIT=1 docker compose -f docker-compose.yml -f docker-compose.${{ env.TAG }}.yml build --no-cache --pull

                  # Push the images
                  docker compose -f docker-compose.yml -f docker-compose.${{ env.TAG }}.yml push
```

#### Environment-Based Deployment

The workflow automatically:

1. **Detects branch**: `main` branch → `prod` tag, `dev` branch → `dev` tag
2. **Builds images**: Multi-stage Docker builds for each service
3. **Pushes to registry**: Docker Hub with appropriate tags
4. **Clears cache**: Ensures fresh builds without cached layers

#### Required GitHub Secrets

Set these secrets in your GitHub repository:

```
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password
MONGO_DB_USERNAME=your-mongo-username
MONGO_DB_PASSWORD=your-mongo-password
MONGO_DB_DATABASE=your-database-name
MONGO_DB_ADMINUSER_PASSWORD=admin-password
MONGO_INITDB_ROOT_USERNAME=mongo-root-username
MONGO_INITDB_ROOT_PASSWORD=mongo-root-password
```

#### Deployment Environments

##### Development (`dev` branch)

- **Purpose**: Testing and development
- **Access**: Local only (127.0.0.1:80)
- **Features**: Debug mode, file watching, development nginx config

##### Production (`main` branch)

- **Purpose**: Live production environment
- **Access**: Public with SSL (schaeferdevelopment.tech)
- **Features**: Optimized builds, SSL/TLS, security headers, Cloudflare Tunnel

### Multi-Environment Docker Compose

#### Development Environment

**docker-compose.dev.yml**:

```yaml
services:
    nestjs:
        image: johannesschaefer/nestjs:dev
        build:
            target: dev
            args:
                - NODE_ENV=dev
        command: npm run start:debug
    mongodb:
        image: johannesschaefer/mongo:dev
    nginx:
        image: johannesschaefer/nginx:dev
        build:
            context: .
            dockerfile: ./dockerfiles/nginx/Dockerfile
            args:
                - NODE_ENV=dev
        ports:
            - '127.0.0.1:80:80'
        depends_on:
            - nestjs
        networks:
            - app-network
```

#### Production Environment

**docker-compose.prod.yml**:

```yaml
services:
    nestjs:
        image: johannesschaefer/nestjs:prod
        build:
            target: prod
            args:
                - NODE_ENV=prod
        command: npm run start:prod
    mongodb:
        image: johannesschaefer/mongo:prod
    nginx:
        image: johannesschaefer/nginx:prod
        build:
            context: .
            dockerfile: ./dockerfiles/nginx/Dockerfile
            args:
                - NODE_ENV=prod
        volumes:
            - /etc/letsencrypt:/etc/letsencrypt:ro
        ports:
            - '80:80'
            - '443:443'
        depends_on:
            - nestjs
        networks:
            - app-network

networks:
    app-network:
        driver: bridge
```

## Complete File Reference

This section documents every file in the repository and its purpose.

### Root Configuration Files

#### **package.json**

Main npm configuration with all dependencies and scripts:

```json
{
	"name": "nestjs-server",
	"version": "0.0.1",
	"scripts": {
		"build": "nest build",
		"start": "nest start",
		"start:dev": "nest start --watch",
		"start:debug": "nest start --debug 9229 --watch",
		"start:prod": "node dist/main",
		"start:local": "./start-local.sh"
	}
}
```

#### **tsconfig.json**

TypeScript configuration for the project:

- Target: ES2021
- Module: CommonJS
- Strict type checking enabled
- Decorators and metadata support

#### **tsconfig.build.json**

TypeScript build configuration:

- Extends base tsconfig.json
- Excludes test files and node_modules

#### **nest-cli.json**

NestJS CLI configuration:

```json
{
	"collection": "@nestjs/schematics",
	"sourceRoot": "src",
	"compilerOptions": {
		"deleteOutDir": true
	}
}
```

#### **.env**

Environment variables for local development:

- Database connection settings
- JWT secrets
- Cloudflare API keys
- Server configuration

#### **.gitignore**

Git ignore patterns for:

- Node modules
- Build outputs
- Environment files
- IDE configurations

#### **.dockerignore**

Docker ignore patterns for:

- Development files
- Git history
- Documentation
- Test files

### Code Formatting & Linting

#### **.editorconfig**

Cross-editor coding style definitions:

```editorconfig
root = true

[*]
charset = utf-8
end_of_line = crlf
max_line_length = 120
indent_style = space
indent_size = 4
tab_width = 4

[*.sh]
end_of_line = lf
```

#### **.prettierrc**

Prettier code formatting configuration:

```json
{
	"singleQuote": true,
	"trailingComma": "all",
	"tabWidth": 4,
	"useTabs": true
}
```

#### **.eslintrc.js**

ESLint configuration with TypeScript and Prettier integration:

- TypeScript parser
- Prettier plugin integration
- Custom rule overrides for NestJS patterns

### Application Source Code

#### **src/main.ts**

Application bootstrap file:

- NestJS app creation
- Swagger/OpenAPI setup
- Global validation pipes
- Port configuration

#### **src/app.module.ts**

Root application module:

- MongoDB connection setup
- Global JWT guard configuration
- Module imports (Auth, User, Role, Permission, Seed)

#### **src/app.controller.ts**

Root application controller:

- Health check endpoint (`/health`)
- Public endpoint with `@SkipAuth()` decorator

#### **src/app.service.ts**

Root application service:

```typescript
@Injectable()
export class AppService {
	getPing(): string {
		return 'API is available';
	}
}
```

### Authentication Module (`src/auth/`)

#### **auth.module.ts**

Authentication module configuration:

- JWT module setup with async configuration
- Passport strategies registration
- Service and guard exports

#### **auth.service.ts**

Core authentication service:

- User validation with bcrypt
- JWT token generation with roles
- Password hashing utilities
- Last login tracking

#### **auth.controller.ts**

Authentication endpoints:

- POST `/auth/login` - User login with JWT generation
- Uses LocalAuthGuard and SkipAuth decorator

#### **guards/jwt-auth.guard.ts**

JWT authentication guard:

- Token extraction from Authorization header
- JWT verification with secret
- Public route bypass with `@SkipAuth()`

#### **guards/local-auth.guard.ts**

Local strategy guard for login:

- Extends Passport AuthGuard('local')
- Error handling for authentication failures

#### **guards/admin-auth.guard.ts**

Admin-specific authentication guard:

- Checks for admin email specifically
- Admin user validation

#### **guards/permissions.guard.ts**

Permission-based authorization guard:

- Checks user permissions against required permissions
- Supports super admin override (`all:manage`)
- Retrieves user with populated roles and permissions

#### **guards/roles.guard.ts**

Role-based authorization guard:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
	// Checks if user has required roles
	// Super admin bypass
	// Role name matching
}
```

#### **guards/localStrategy.ts**

Passport local strategy:

- Email/password validation
- User authentication through AuthService

#### **guards/jwtStrategy.ts**

Passport JWT strategy:

- JWT token validation
- User extraction from token payload

#### **guards/adminStrategy.ts**

Admin-specific Passport strategy:

- Admin user validation
- Enhanced security for admin operations

#### **guards/constants.ts**

JWT configuration constants:

```typescript
export const jwtConstants = {
	secret: process.env.JWT_SECRET || 'JWTSecret#@!',
};
```

#### **guards/skipAuth.decorator.ts**

Decorator to bypass authentication:

```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const SkipAuth = () => SetMetadata(IS_PUBLIC_KEY, true);
```

#### **decorators/permissions.decorator.ts**

Permission requirement decorator:

```typescript
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
```

#### **decorators/roles.decorator.ts**

Role requirement decorator:

```typescript
export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

#### **decorators/get-user.decorator.ts**

User extraction decorator (currently empty - placeholder):

```typescript
// Empty file - placeholder for future user extraction decorator
```

### User Management Module (`src/user/`)

#### **user.module.ts**

User module configuration:

- User schema registration with MongoDB
- AuthModule circular dependency handling
- Service and controller registration

#### **user.service.ts**

User business logic service:

- `findOneByEmail()` - Find user with optional password
- `findOneByEmailWithRoles()` - Get user with populated roles/permissions
- `create()` - Create user with hashed password
- `assignRoleToUser()` - Add role to user
- `removeRoleFromUser()` - Remove role from user
- `findAll()` - Get all active users
- `updateLastLogin()` - Track login times

#### **user.controller.ts**

User REST API endpoints with proper DTO validation:

- POST `/user/create` - Create user (requires `user:create`) - Uses `CreateUserDto`
- GET `/user/all` - List users (requires `user:read`)
- GET `/user/profile` - Current user profile
- GET `/user/:id` - Get user by ID (requires `user:read`)
- PUT `/user/update` - Update profile (requires `user:update`) - Uses `UpdateUserDto`
- DELETE `/user/delete` - Delete profile (requires `user:delete`)
- POST `/user/:userId/roles/:roleId` - Assign role
- DELETE `/user/:userId/roles/:roleId` - Remove role

Key features:

- Uses DTOs for request validation and Swagger documentation
- Imports `CreateUserDto` and `UpdateUserDto` for type safety
- Proper API body documentation with DTOs instead of raw models
- Password validation with minimum 8 characters
- Email validation with proper format checking
- Global ValidationPipe enabled in `main.ts` processes all DTO validations
- Automatic 400 Bad Request responses for invalid data

#### **model/user.model.ts**

User MongoDB schema:

```typescript
@Schema({ timestamps: true })
export class User {
	firstName: string;
	lastName: string;
	email: string; // Unique, lowercase
	password: string; // Hidden by default
	roles: Types.ObjectId[]; // References to Role documents
	isActive: boolean; // Soft delete flag
	lastLogin: Date; // Login tracking
}
```

#### **model/user-login.dto.ts**

Login request DTO:

```typescript
export class UserLoginDto {
	@ApiProperty({ example: 'user@example.com' })
	email: string;

	@ApiProperty({ example: 'password123' })
	password: string;
}
```

#### **dto/create-user.dto.ts**

Create user DTO with validation and Swagger documentation:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
	@ApiProperty({ description: 'User first name', example: 'John' })
	@IsString()
	@IsNotEmpty()
	firstName: string;

	@ApiProperty({ description: 'User last name', example: 'Doe' })
	@IsString()
	@IsNotEmpty()
	lastName: string;

	@ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ description: 'User password', example: 'SecurePassword123!' })
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	password: string;

	@ApiProperty({ description: 'Whether the user is active', example: true, required: false })
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
```

#### **dto/update-user.dto.ts**

Update user DTO extending PartialType for optional updates:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, IsBoolean } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
	@ApiProperty({ description: 'User first name', example: 'John', required: false })
	@IsString()
	@IsOptional()
	firstName?: string;

	@ApiProperty({ description: 'User last name', example: 'Doe', required: false })
	@IsString()
	@IsOptional()
	lastName?: string;

	@ApiProperty({ description: 'User email address', example: 'john.doe@example.com', required: false })
	@IsEmail()
	@IsOptional()
	email?: string;

	@ApiProperty({ description: 'User password', example: 'SecurePassword123!', required: false })
	@IsString()
	@IsOptional()
	@MinLength(8)
	password?: string;

	@ApiProperty({ description: 'Whether the user is active', example: true, required: false })
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
```

### Role Management Module (`src/role/`)

#### **role.module.ts**

Role module configuration:

- Role schema registration
- Service and controller setup

#### **role.service.ts**

Role business logic:

- `create()` - Create new role with permission validation
- `findAll()` - Get all active roles with permissions
- `findByName()` - Find role by name
- `addPermissionToRole()` - Add permission to role
- `removePermissionFromRole()` - Remove permission from role
- Soft delete support

#### **role.controller.ts**

Role REST API endpoints:

- POST `/roles` - Create role (requires `role:create`)
- GET `/roles` - List roles (requires `role:read`)
- GET `/roles/:id` - Get role by ID
- PATCH `/roles/:id` - Update role (requires `role:update`)
- DELETE `/roles/:id` - Delete role (requires `role:delete`)
- POST `/roles/:roleId/permissions/:permissionId` - Add permission
- DELETE `/roles/:roleId/permissions/:permissionId` - Remove permission

#### **model/role.model.ts**

Role MongoDB schema:

```typescript
@Schema({ timestamps: true })
export class Role {
	name: string; // Unique role name
	description: string; // Role description
	permissions: Types.ObjectId[]; // References to Permission documents
	isActive: boolean; // Soft delete flag
}
```

#### **dto/create-role.dto.ts**

Create role DTO with validation:

```typescript
export class CreateRoleDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsArray()
	@IsOptional()
	permissions?: Types.ObjectId[];

	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
```

#### **dto/update-role.dto.ts**

Update role DTO:

```typescript
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
```

### Permission Management Module (`src/permission/`)

#### **permission.module.ts**

Permission module configuration:

- Permission schema registration
- Service and controller setup

#### **permission.service.ts**

Permission business logic:

- `create()` - Create new permission
- `findAll()` - Get all active permissions
- `findByName()` - Find permission by name
- `findByActionAndResource()` - Filter permissions
- `seedDefaultPermissions()` - Create default permissions
- Soft delete support

#### **permission.controller.ts**

Permission REST API endpoints:

- POST `/permissions` - Create permission (requires `permission:create`)
- GET `/permissions` - List permissions (requires `permission:read`)
- GET `/permissions/:id` - Get permission by ID
- PATCH `/permissions/:id` - Update permission (requires `permission:update`)
- DELETE `/permissions/:id` - Delete permission (requires `permission:delete`)
- POST `/permissions/seed` - Seed default permissions

#### **model/permission.model.ts**

Permission MongoDB schema with enums:

```typescript
export enum PermissionAction {
	CREATE = 'create',
	READ = 'read',
	UPDATE = 'update',
	DELETE = 'delete',
	MANAGE = 'manage',
}

export enum PermissionResource {
	USER = 'user',
	ROLE = 'role',
	PERMISSION = 'permission',
	ALL = 'all',
}

@Schema({ timestamps: true })
export class Permission {
	name: string; // Format: "resource:action"
	description: string;
	action: PermissionAction;
	resource: PermissionResource;
	isActive: boolean;
}
```

#### **dto/create-permission.dto.ts**

Create permission DTO with validation:

```typescript
export class CreatePermissionDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsEnum(PermissionAction)
	@IsNotEmpty()
	action: PermissionAction;

	@IsEnum(PermissionResource)
	@IsNotEmpty()
	resource: PermissionResource;

	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
```

#### **dto/update-permission.dto.ts**

Update permission DTO:

```typescript
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
```

### Data Seeding Module (`src/seed/`)

#### **seed.module.ts**

Seed module configuration:

- Imports Permission, Role, and User modules
- Service registration

#### **seed.service.ts**

Automatic data seeding service:

- Implements `OnModuleInit` for startup seeding
- `seedDefaultPermissions()` - Creates system permissions
- `seedDefaultRoles()` - Creates system roles
- `createSuperAdminUser()` - Creates default admin user
- Runs automatically when application starts

### Shared Utilities (`src/shared/`)

#### **config/mongodb.config.ts**

MongoDB connection configuration:

```typescript
export default registerAs('mongodb', () => {
	const { MONGO_DB_PORT, MONGO_DB_HOSTNAME, MONGO_DB_DATABASE, MONGO_DB_USERNAME, MONGO_DB_PASSWORD } = process.env;
	return {
		uri: `mongodb://${MONGO_DB_USERNAME}:${MONGO_DB_PASSWORD}@${MONGO_DB_HOSTNAME}:${MONGO_DB_PORT}/${MONGO_DB_DATABASE}?authSource=${MONGO_DB_DATABASE}`,
	};
});
```

#### **src/utils/request.util.ts**

Request utility functions:

```typescript
export const extractTokenFromHeader = (request: Request): string | undefined => {
	const [type, token] = request.headers.authorization?.split(' ') || [];
	return type === 'Bearer' ? token : undefined;
};
```

### Test Files

#### **test/app.e2e-spec.ts**

End-to-end application tests:

- Application bootstrap testing
- Basic endpoint testing

#### **test/jest-e2e.json**

Jest configuration for e2e tests:

- Module resolution
- Test environment setup

#### **src/app.controller.spec.ts**

Unit tests for AppController:

- Health endpoint testing

#### **src/auth/auth.controller.spec.ts**

Authentication controller tests (placeholder)

#### **src/auth/auth.service.spec.ts**

Authentication service tests (placeholder)

#### **src/user/user.service.spec.ts**

User service tests (placeholder)

### Docker Configuration

#### **docker-compose.yml**

Base Docker Compose configuration:

- NestJS service definition
- MongoDB service with health checks
- Network configuration

#### **docker-compose.dev.yml**

Development environment overrides:

- Debug mode enabled
- File watching
- Local port binding (127.0.0.1:80)

#### **docker-compose.prod.yml**

Production environment configuration:

- Optimized builds
- SSL/TLS support
- Cloudflare Tunnel integration
- Public port exposure

#### **docker-compose.local.yml**

Local development configuration:

- Direct MongoDB access
- Local environment variables

#### **dockerfiles/nestjs/Dockerfile**

Multi-stage NestJS container:

```dockerfile
# Builder stage - compiles TypeScript
FROM node:18.19.1-alpine AS builder
# Development stage - with dev dependencies
FROM node:18.19.1-alpine AS dev
# Production stage - optimized runtime
FROM node:18.19.1-alpine AS prod
```

#### **dockerfiles/mongodb/Dockerfile**

MongoDB container with initialization:

- Node.js installation for init scripts
- Health check configuration
- Custom init script support

#### **dockerfiles/nginx/Dockerfile**

Environment-specific nginx configuration:

```dockerfile
FROM nginx:latest
ARG NODE_ENV
COPY ./nginx/nginx.${NODE_ENV}.conf /etc/nginx/nginx.conf
```

### Nginx Configuration

#### **nginx/nginx.dev.conf**

Development nginx configuration:

- Basic HTTP proxying
- Development-friendly settings
- Local access only

#### **nginx/nginx.prod.conf**

Production nginx configuration:

- SSL/TLS termination with Cloudflare Origin certificates
- Cloudflare Real IP configuration
- Security headers (HSTS, CSP, etc.)
- HTTP/2 support
- Gzip compression
- HTTP to HTTPS redirect

#### **nginx/nginx.prod.cloudflare.conf**

Cloudflare-optimized nginx configuration:

- Real IP detection from Cloudflare
- All Cloudflare IP ranges configured
- SSL certificate chain for Full (strict) mode
- Enhanced security headers

### MongoDB Setup

#### **mongo/init-mongodb.js**

MongoDB initialization script:

- User and database creation
- Collection setup
- Initial admin user creation
- Environment variable validation
- Proper error handling

### Development Tools

#### **start-local.sh**

Local development startup script that orchestrates the entire development environment:

```bash
#!/bin/bash
# Start docker-compose and npm in new terminal window
gnome-terminal -- bash -c '
    # Function to cleanup Docker resources
    cleanup() {
        echo "Stopping Docker containers and cleaning up..."
        docker compose -f docker-compose.local.yml down
        exit 0
    }

    # Trap Ctrl+C and process termination
    trap cleanup EXIT SIGINT SIGTERM

    docker compose -f docker-compose.local.yml up -d
    echo "Waiting for containers to be healthy..."

    while [[ "$(docker compose -f docker-compose.local.yml ps --format json | grep \"Health\": | grep healthy | wc -l)" != "$(docker compose -f docker-compose.local.yml ps --format json | grep \"Health\": | wc -l)" ]]; do
        echo "Containers still starting... waiting 5s"
        sleep 5
    done

    echo "All containers are healthy! Cleaning dist folder..."
    sudo rm -rf dist/
    sudo mkdir dist/
    sudo chown -R $USER:$USER dist/

    echo "Starting npm..."
    export MONGO_DB_HOSTNAME=localhost
    export MONGO_DB_PORT=27017
    npm run start:dev

    # Cleanup will be called automatically on exit
    read -p "Press Enter to close..."
'
```

**What this script does:**

1. **New Terminal Window**: Opens a new terminal to keep the process isolated
2. **Cleanup Function**: Defines cleanup procedure for Docker containers
3. **Signal Handling**: Traps Ctrl+C and exit signals for graceful shutdown
4. **Docker Startup**: Launches local Docker services (`docker-compose.local.yml`)
5. **Health Check Waiting**: Polls containers until all are healthy
6. **Dist Cleanup**: Removes and recreates the TypeScript output directory
7. **Environment Setup**: Sets localhost MongoDB connection for local development
8. **NestJS Start**: Launches NestJS in development mode with hot reload
9. **Auto Cleanup**: Automatically stops Docker containers when script exits

**Usage:**

```bash
./start-local.sh
```

This script is perfect for local development as it:

- Isolates Docker containers from your main shell
- Ensures all services are ready before starting NestJS
- Provides clean shutdown when you're done developing
- Uses localhost MongoDB connection (not Docker network)

### CI/CD Pipeline

#### **.github/workflows/deploy.yml**

GitHub Actions deployment workflow:

- Branch-based deployments (dev/prod)
- Docker image building and pushing
- Environment file generation
- Cache management
- Multi-stage builds

### VS Code Configuration

#### **.vscode/settings.json**

VS Code workspace settings:

- TypeScript configuration
- Formatter settings
- Extension recommendations

#### **.vscode/launch.json**

VS Code debug configuration:

- Node.js debugging setup
- Environment variables
- Debug ports

### Documentation

#### **README.md**

Project overview and setup instructions:

- Project description
- Installation steps
- Development workflow
- API documentation links

#### **LICENSE**

MIT License for the project

#### **RBAC_DOCUMENTATION.md**

Detailed RBAC system documentation:

- Permission system explanation
- Role hierarchy
- Implementation details

#### **install and configure nginx.md**

Nginx setup and configuration guide

#### **setup/setup-instructions.md**

Original tutorial documentation

#### **setup/setup-instructions-actual.md**

This comprehensive tutorial

#### **setup/swagger-example.png**

Swagger UI screenshot example

## Project Structure

```
nestjs-server/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline
├── .vscode/
│   ├── launch.json              # Debug configuration
│   └── settings.json            # Workspace settings
├── dockerfiles/
│   ├── mongodb/
│   │   └── Dockerfile           # MongoDB with init scripts
│   ├── nestjs/
│   │   └── Dockerfile           # Multi-stage NestJS container
│   └── nginx/
│       └── Dockerfile           # Environment-specific nginx
├── mongo/
│   └── init-mongodb.js          # MongoDB initialization script
├── nginx/
│   ├── nginx.dev.conf           # Development nginx config
│   ├── nginx.prod.conf          # Production nginx config
│   └── nginx.prod.cloudflare.conf # Cloudflare-optimized config
├── setup/
│   ├── setup-instructions-actual.md # This comprehensive guide
│   └── swagger-example.png      # Swagger UI screenshot
├── cloudflare-tunnel-setup.md   # Cloudflare Tunnel configuration guide
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── decorators/
│   │   │   ├── get-user.decorator.ts    # User extraction (placeholder)
│   │   │   ├── permissions.decorator.ts # Permission requirements
│   │   │   └── roles.decorator.ts       # Role requirements
│   │   ├── guards/
│   │   │   ├── admin-auth.guard.ts      # Admin authentication
│   │   │   ├── adminStrategy.ts         # Admin Passport strategy
│   │   │   ├── constants.ts             # JWT constants
│   │   │   ├── jwt-auth.guard.ts        # JWT authentication
│   │   │   ├── jwtStrategy.ts           # JWT Passport strategy
│   │   │   ├── local-auth.guard.ts      # Local authentication
│   │   │   ├── localStrategy.ts         # Local Passport strategy
│   │   │   ├── permissions.guard.ts     # Permission-based authorization
│   │   │   ├── roles.guard.ts           # Role-based authorization
│   │   │   └── skipAuth.decorator.ts    # Public endpoint decorator
│   │   ├── auth.controller.spec.ts      # Controller tests
│   │   ├── auth.controller.ts           # Authentication endpoints
│   │   ├── auth.module.ts              # Authentication module
│   │   ├── auth.service.spec.ts        # Service tests
│   │   └── auth.service.ts             # Authentication business logic
│   ├── permission/                      # Permission management
│   │   ├── dto/
│   │   │   ├── create-permission.dto.ts # Create permission validation
│   │   │   └── update-permission.dto.ts # Update permission validation
│   │   ├── model/
│   │   │   └── permission.model.ts      # Permission MongoDB schema
│   │   ├── permission.controller.ts     # Permission REST API
│   │   ├── permission.module.ts         # Permission module
│   │   └── permission.service.ts        # Permission business logic
│   ├── role/                           # Role management
│   │   ├── dto/
│   │   │   ├── create-role.dto.ts      # Create role validation
│   │   │   └── update-role.dto.ts      # Update role validation
│   │   ├── model/
│   │   │   └── role.model.ts           # Role MongoDB schema
│   │   ├── role.controller.ts          # Role REST API
│   │   ├── role.module.ts             # Role module
│   │   └── role.service.ts            # Role business logic
│   ├── seed/                          # Data seeding
│   │   ├── seed.module.ts             # Seed module
│   │   └── seed.service.ts            # Automatic data seeding
│   ├── shared/                        # Shared utilities
│   │   └── config/
│   │       └── mongodb.config.ts      # MongoDB configuration
│   ├── user/                          # User management
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts     # Create user validation with Swagger
│   │   │   └── update-user.dto.ts     # Update user validation with Swagger
│   │   ├── model/
│   │   │   ├── user.model.ts          # User MongoDB schema
│   │   │   └── user-login.dto.ts      # Login request DTO
│   │   ├── user.controller.ts         # User REST API
│   │   ├── user.module.ts            # User module
│   │   ├── user.service.spec.ts      # Service tests
│   │   └── user.service.ts           # User business logic
│   ├── utils/
│   │   └── request.util.ts           # Request utility functions
│   ├── app.controller.spec.ts        # App controller tests
│   ├── app.controller.ts            # Root controller (health check)
│   ├── app.module.ts               # Root application module
│   ├── app.service.ts              # Root service
│   └── main.ts                     # Application bootstrap
├── test/
│   ├── app.e2e-spec.ts            # End-to-end tests
│   └── jest-e2e.json              # E2E test configuration
├── .dockerignore                   # Docker ignore patterns
├── .editorconfig                   # Cross-editor coding style
├── .env                           # Environment variables
├── .eslintrc.js                   # ESLint configuration
├── .gitignore                     # Git ignore patterns
├── .prettierrc                    # Prettier configuration
├── docker-compose.dev.yml         # Development Docker config
├── docker-compose.local.yml       # Local development config
├── docker-compose.prod.yml        # Production Docker config
├── docker-compose.yml             # Base Docker config
├── install and configure nginx.md # Nginx setup guide
├── LICENSE                        # MIT License
├── nest-cli.json                 # NestJS CLI configuration
├── package.json                  # npm configuration
├── package-lock.json             # npm lock file
├── RBAC_DOCUMENTATION.md         # RBAC system documentation
├── README.md                     # Project overview
├── start-local.sh               # Local development script
├── tsconfig.build.json          # TypeScript build config
└── tsconfig.json               # TypeScript configuration
```
