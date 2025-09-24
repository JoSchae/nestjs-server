import { registerAs } from '@nestjs/config';

/**
 * Mongo database connection config
 */
export default registerAs('mongodb', () => {
	const { MONGO_DB_PORT, MONGO_DB_HOSTNAME, MONGO_DB_DATABASE, MONGO_DB_USERNAME, MONGO_DB_PASSWORD } = process.env;
	
	// URL encode username and password to handle special characters
	const encodedUsername = encodeURIComponent(MONGO_DB_USERNAME || '');
	const encodedPassword = encodeURIComponent(MONGO_DB_PASSWORD || '');
	
	return {
		uri: `mongodb://${encodedUsername}:${encodedPassword}@${MONGO_DB_HOSTNAME}:${MONGO_DB_PORT}/${MONGO_DB_DATABASE}?authSource=${MONGO_DB_DATABASE}`,
	};
});
