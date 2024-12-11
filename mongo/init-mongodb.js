// const bcrypt = require('bcrypt');
db.createUser({
	user: process.env.MONGO_DB_USERNAME,
	pwd: process.env.MONGO_DB_PASSWORD,
	roles: [
		{
			role: 'dbAdmin',
			db: process.env.MONGO_DB_DATABASE,
		},
	],
});
