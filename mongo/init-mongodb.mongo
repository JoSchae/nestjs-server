// MongoDB initialization script for NestJS RBAC system
print('Starting MongoDB initialization for NestJS RBAC system...');

// Switch to admin database for authentication
db = db.getSiblingDB('admin');

// Authenticate as root user if credentials are provided
if (process.env.MONGO_INITDB_ROOT_USERNAME && process.env.MONGO_INITDB_ROOT_PASSWORD) {
	db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);
	print('Authenticated as root user');
}

// Switch to application database
var dbName = process.env.MONGO_INITDB_DATABASE || 'nestjs-server';
db = db.getSiblingDB(dbName);
print('Switched to database: ' + dbName);

// Create application user for NestJS to use
var appUser = process.env.MONGO_DB_USERNAME || 'nestjs_user';
var appPassword = process.env.MONGO_DB_PASSWORD || 'nestjs_password';

try {
	db.createUser({
		user: appUser,
		pwd: appPassword,
		roles: [
			{
				role: 'readWrite',
				db: dbName,
			},
		],
	});
	print('Created application user: ' + appUser);
} catch (error) {
	print('User may already exist: ' + error.message);
}

// Create collections for RBAC system
print('Creating collections...');
db.createCollection('users');
db.createCollection('roles');
db.createCollection('permissions');

// Create indexes for better performance and data integrity
print('Creating indexes...');

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ roles: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: 1 });

// Role indexes
db.roles.createIndex({ name: 1 }, { unique: true });
db.roles.createIndex({ isActive: 1 });
db.roles.createIndex({ permissions: 1 });

// Permission indexes
db.permissions.createIndex({ name: 1 }, { unique: true });
db.permissions.createIndex({ action: 1, resource: 1 });
db.permissions.createIndex({ isActive: 1 });

// Create TTL index for sessions if you plan to store them in MongoDB
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('Indexes created successfully');

// Note: We don't create the initial admin user here anymore
// The NestJS application will handle seeding via the SeedService
// This ensures proper password hashing and role assignment through the application

print('MongoDB initialization completed successfully!');
print('The NestJS application will handle initial data seeding including:');
print('- Default permissions');
print('- Default roles');
print('- Super admin user');
print('Remember to set the following environment variables for the application:');
print('- JWT_SECRET (for production)');
print('- Super admin credentials will be: superadmin@system.com / SuperAdmin123!');
