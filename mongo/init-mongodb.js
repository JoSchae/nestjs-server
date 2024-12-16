// mongo/init-mongodb.js
const bcrypt = require('bcrypt');

db.createUser({
	user: process.env.MONGO_DB_USERNAME,
	pwd: process.env.MONGO_DB_PASSWORD,
	roles: [{ role: 'readWrite', db: process.env.MONGO_DB_DATABASE }],
});
// db.createCollection('users');
// const hashedPassword = bcrypt.hashSync('admin', 10);
// db.users.insertOne({
// 	firstName: 'admin',
// 	lastName: 'admin',
// 	email: 'admin@admin.com',
// 	password: hashedPassword, // Store the hashed password
// });
