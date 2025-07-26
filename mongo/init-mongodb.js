// MongoDB initialization script for NestJS RBAC system
print('Starting MongoDB initialization for NestJS RBAC system...');

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
				{ role: 'dbAdmin', db: process.env.MONGO_DB_DATABASE },
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
			updatedAt: new Date(),
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
