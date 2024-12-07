console.log('################ HELLO #################');
db.createUser({
	user: process.env.MONGO_DB_USERNAME,
	pwd: passwordPrompt(),
	roles: [
		// {
		// 	role: 'readWrite',
		// 	db: process.env.MONGO_DB_DATABASE,
		// },
		{
			role: 'dbAdmin',
			db: process.env.MONGO_DB_DATABASE,
		},
	],
});
