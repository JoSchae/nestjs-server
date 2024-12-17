// mongo/init-mongodb.js
const bcrypt = require('bcrypt');

db.use('auth');
db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);
// creates a db user
db.createUser({
	user: process.env.MONGO_DB_USERNAME,
	pwd: process.env.MONGO_DB_PASSWORD,
	roles: [{ role: 'dbAdmin', db: process.env.MONGO_DB_DATABASE }],
});
db.use('process.env.MONGO_DB_DATABASE');
db.auth(process.env.MONGO_DB_USERNAME, process.env.MONGO_DB_PASSWORD);
db.createCollection('users');
const hashedPassword = bcrypt.hashSync(process.env.MONGO_DB_ADMINUSER_PASSWORD, 10);
// creates a nestjs user
db.users.insertOne({
	firstName: 'admin',
	lastName: 'admin',
	email: process.env.MONGO_DB_ADMINUSER_PASSWORD,
	password: hashedPassword, // Store the hashed password
});
