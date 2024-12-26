// mongo/init-mongodb.js
const bcrypt = require('bcrypt');

db = db.getSiblingDB('admin');
db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);

db = db.getSiblingDB(process.env.MONGO_DB_DATABASE);

// Create application user
db.createUser({
	user: process.env.MONGO_DB_USERNAME,
	pwd: process.env.MONGO_DB_PASSWORD,
	roles: [{ role: 'readWrite', db: process.env.MONGO_DB_DATABASE }],
});

// Create collections and initial data
db.createCollection('users');
const hashedPassword = bcrypt.hashSync(process.env.MONGO_DB_ADMINUSER_PASSWORD, 10);

db.users.insertOne({
	firstName: 'admin',
	lastName: 'admin',
	email: process.env.MONGO_DB_ADMIN_USERNAME,
	password: hashedPassword,
});
