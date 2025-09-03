// MongoDB initialization script for NestJS RBAC system
print('=== Starting MongoDB initialization for NestJS RBAC system ===');

// Check if required environment variables are set
if (!process.env.MONGO_DB_USERNAME || !process.env.MONGO_DB_PASSWORD || !process.env.MONGO_DB_DATABASE) {
	print('ERROR: Required environment variables missing:');
	print('- MONGO_DB_USERNAME: ' + (process.env.MONGO_DB_USERNAME || 'NOT SET'));
	print('- MONGO_DB_PASSWORD: ' + (process.env.MONGO_DB_PASSWORD ? 'SET' : 'NOT SET'));
	print('- MONGO_DB_DATABASE: ' + (process.env.MONGO_DB_DATABASE || 'NOT SET'));
	quit(1);
}

print('Environment variables loaded:');
print('- Database: ' + process.env.MONGO_DB_DATABASE);
print('- Username: ' + process.env.MONGO_DB_USERNAME);
print('- Password: ' + (process.env.MONGO_DB_PASSWORD ? 'SET' : 'NOT SET'));

// Switch to application database
db = db.getSiblingDB(process.env.MONGO_DB_DATABASE);
print('Switched to database: ' + process.env.MONGO_DB_DATABASE);

// Check if application user already exists
print('Checking if application user exists...');
try {
	var existingUsers = db.runCommand({ usersInfo: process.env.MONGO_DB_USERNAME });
	if (existingUsers.users && existingUsers.users.length > 0) {
		print('Application user already exists: ' + process.env.MONGO_DB_USERNAME);
		print('User details: ' + JSON.stringify(existingUsers.users[0], null, 2));
	} else {
		print('Creating application user: ' + process.env.MONGO_DB_USERNAME);
		// Create application user
		db.createUser({
			user: process.env.MONGO_DB_USERNAME,
			pwd: process.env.MONGO_DB_PASSWORD,
			roles: [
				{ role: 'readWrite', db: process.env.MONGO_DB_DATABASE },
				{ role: 'dbAdmin', db: process.env.MONGO_DB_DATABASE },
			],
		});
		print('✓ Successfully created application user: ' + process.env.MONGO_DB_USERNAME);

		// Verify user creation
		var verification = db.runCommand({ usersInfo: process.env.MONGO_DB_USERNAME });
		if (verification.users && verification.users.length > 0) {
			print('✓ User creation verified successfully');
		} else {
			print('✗ User creation verification failed');
			quit(1);
		}
	}
} catch (error) {
	print('ERROR: Failed to handle application user: ' + error);
	print('Error details: ' + JSON.stringify(error));
	quit(1);
}

// Create collections if they don't exist
print('Creating collections...');
try {
	// Create collections for RBAC system
	var collections = db.getCollectionNames();

	if (!collections.includes('users')) {
		db.createCollection('users');
		print('✓ Created users collection');
	} else {
		print('✓ Users collection already exists');
	}

	if (!collections.includes('roles')) {
		db.createCollection('roles');
		print('✓ Created roles collection');
	} else {
		print('✓ Roles collection already exists');
	}

	if (!collections.includes('permissions')) {
		db.createCollection('permissions');
		print('✓ Created permissions collection');
	} else {
		print('✓ Permissions collection already exists');
	}
} catch (error) {
	print('ERROR: Failed to create collections: ' + error);
}

// Create initial admin user with simple password hashing (not bcrypt)
// Note: The application will handle proper password hashing
print('Setting up initial admin user...');
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
		print('✓ Successfully created admin user: ' + adminEmail);
		print('✓ IMPORTANT: Admin password will be hashed by the application on first login');
	} else {
		print('✓ Admin user already exists: ' + adminEmail);
	}
} catch (error) {
	print('ERROR: Failed to create admin user: ' + error);
}

print('=== MongoDB initialization completed successfully ===');
print('Summary:');
print('- Database: ' + process.env.MONGO_DB_DATABASE);
print('- Application user: ' + process.env.MONGO_DB_USERNAME);
print('- Admin email: ' + (process.env.MONGO_DB_ADMIN_USERNAME || 'admin@admin.com'));
print('- Collections: users, roles, permissions');
print('=== End of initialization ===');
