// MongoDB initialization script for NestJS RBAC system
print('Starting MongoDB initialization for NestJS RBAC system...');

<<<<<<< HEAD
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
=======
// Check if required environment variables are set
if (!process.env.MONGO_INITDB_ROOT_USERNAME || !process.env.MONGO_INITDB_ROOT_PASSWORD) {
    print('ERROR: Root username and password environment variables are required');
    quit(1);
}

if (!process.env.MONGO_DB_USERNAME || !process.env.MONGO_DB_PASSWORD || !process.env.MONGO_DB_DATABASE) {
    print('ERROR: Database username, password, and database name environment variables are required');
    quit(1);
}

// Switch to admin database for authentication
db = db.getSiblingDB('admin');

// Authenticate as root user
try {
    db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);
    print('Successfully authenticated as root user');
} catch (error) {
    print('ERROR: Failed to authenticate as root user: ' + error);
    quit(1);
}

// Switch to application database
db = db.getSiblingDB(process.env.MONGO_DB_DATABASE);
print('Switched to database: ' + process.env.MONGO_DB_DATABASE);

// Check if application user already exists
var existingUser = db.getUser(process.env.MONGO_DB_USERNAME);
if (existingUser) {
    print('Application user already exists: ' + process.env.MONGO_DB_USERNAME);
} else {
    try {
        // Create application user
        db.createUser({
            user: process.env.MONGO_DB_USERNAME,
            pwd: process.env.MONGO_DB_PASSWORD,
            roles: [
                { role: 'readWrite', db: process.env.MONGO_DB_DATABASE },
                { role: 'dbAdmin', db: process.env.MONGO_DB_DATABASE }
            ],
        });
        print('Successfully created application user: ' + process.env.MONGO_DB_USERNAME);
    } catch (error) {
        print('ERROR: Failed to create application user: ' + error);
        quit(1);
    }
}

// Create collections if they don't exist
try {
    // Create collections for RBAC system
    if (!db.getCollectionNames().includes('users')) {
        db.createCollection('users');
        print('Created users collection');
    }
    
    if (!db.getCollectionNames().includes('roles')) {
        db.createCollection('roles');
        print('Created roles collection');
    }
    
    if (!db.getCollectionNames().includes('permissions')) {
        db.createCollection('permissions');
        print('Created permissions collection');
    }
} catch (error) {
    print('ERROR: Failed to create collections: ' + error);
}

// Create initial admin user with simple password hashing (not bcrypt)
// Note: The application will handle proper password hashing
try {
    var adminEmail = process.env.MONGO_DB_ADMIN_USERNAME || 'admin@admin.com';
    var adminPassword = process.env.MONGO_DB_ADMINUSER_PASSWORD || 'adminpassword';
    
    // Check if admin user already exists
    var existingAdmin = db.users.findOne({ email: adminEmail });
    if (!existingAdmin) {
        // Insert admin user - the application will handle password hashing on first login
        var adminUser = {
            firstName: 'Super',
            lastName: 'Admin',
            email: adminEmail,
            password: adminPassword, // This will be hashed by the application on first use
            roles: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        db.users.insertOne(adminUser);
        print('Successfully created admin user: ' + adminEmail);
        print('IMPORTANT: Admin password will be hashed by the application on first login');
    } else {
        print('Admin user already exists: ' + adminEmail);
    }
} catch (error) {
    print('ERROR: Failed to create admin user: ' + error);
}

print('MongoDB initialization completed successfully');
print('Database: ' + process.env.MONGO_DB_DATABASE);
print('Application user: ' + process.env.MONGO_DB_USERNAME);
print('Admin email: ' + (process.env.MONGO_DB_ADMIN_USERNAME || 'admin@admin.com'));
>>>>>>> 5c81e8e (Fix MongoDB authentication for production - add missing environment variables to GitHub Actions)
