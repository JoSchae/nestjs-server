// MongoDB initialization script for NestJS RBAC system
print('=== Starting MongoDB initialization for NestJS RBAC system ===');

// MongoDB initialization scripts receive environment variables directly
// These are set by Docker Compose and must be available
var dbName = _getEnv('MONGO_DB_DATABASE') || _getEnv('MONGO_INITDB_DATABASE');
var username = _getEnv('MONGO_DB_USERNAME');
var password = _getEnv('MONGO_DB_PASSWORD');
var adminEmail = _getEnv('MONGO_DB_ADMIN_USERNAME');
var adminPassword = _getEnv('MONGO_DB_ADMINUSER_PASSWORD');

// Verify all required environment variables are set
if (!dbName || !username || !password || !adminEmail || !adminPassword) {
	print('ERROR: Required environment variables missing:');
	print('- MONGO_DB_DATABASE: ' + (dbName || 'NOT SET'));
	print('- MONGO_DB_USERNAME: ' + (username || 'NOT SET'));
	print('- MONGO_DB_PASSWORD: ' + (password ? 'SET' : 'NOT SET'));
	print('- MONGO_DB_ADMIN_USERNAME: ' + (adminEmail || 'NOT SET'));
	print('- MONGO_DB_ADMINUSER_PASSWORD: ' + (adminPassword ? 'SET' : 'NOT SET'));
	quit(1);
}

print('Environment variables loaded:');
print('- Database: ' + dbName);
print('- Username: ' + username);
print('- Admin Email: ' + adminEmail);
print('- Password/Admin Password: SET');

// Switch to application database
db = db.getSiblingDB(dbName);
print('Switched to database: ' + dbName);

// Check if application user already exists
print('Checking if application user exists...');
try {
	var existingUsers = db.runCommand({ usersInfo: username });
	if (existingUsers.users && existingUsers.users.length > 0) {
		print('Application user already exists: ' + username);
		print('User details: ' + JSON.stringify(existingUsers.users[0], null, 2));
	} else {
		print('Creating application user: ' + username);
		// Create application user
		db.createUser({
			user: username,
			pwd: password,
			roles: [
				{ role: 'readWrite', db: dbName },
				{ role: 'dbAdmin', db: dbName },
			],
		});
		print('✓ Successfully created application user: ' + username);

		// Verify user creation
		var verification = db.runCommand({ usersInfo: username });
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

// Create metrics user in admin database for monitoring/exporter
print('Setting up metrics user in admin database...');
try {
	var metricsUser = 'metricsuser';
	var metricsPassword = 'MonitoringSystem123!';
	var adminDb = db.getSiblingDB('admin');
	var existingMetrics = adminDb.runCommand({ usersInfo: metricsUser });
	if (existingMetrics.users && existingMetrics.users.length > 0) {
		print('Metrics user already exists: ' + metricsUser);
	} else {
		print('Creating metrics user: ' + metricsUser);
		adminDb.createUser({
			user: metricsUser,
			pwd: metricsPassword,
			roles: [{ role: 'clusterMonitor', db: 'admin' }],
		});
		print('✓ Successfully created metrics user: ' + metricsUser);
	}
} catch (error) {
	print('ERROR: Failed to create metrics user: ' + error);
}

print('=== MongoDB initialization completed successfully ===');
print('Summary:');
print('- Database: ' + dbName);
print('- Application user: ' + username);
print('- Admin email: ' + adminEmail);
print('- Metrics user: ' + metricsUser);
print('- Collections: users, roles, permissions');
print('=== End of initialization ===');
