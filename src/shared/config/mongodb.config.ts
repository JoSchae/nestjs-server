import { registerAs } from '@nestjs/config';

/**
 * Mongo database connection config
 */
export default registerAs('mongodb', () => {
	const { MONGO_DB_PORT, MONGO_DB_HOSTNAME, MONGO_DB_DATABASE, MONGO_DB_USERNAME, MONGO_DB_PASSWORD } = process.env;
	return {
		uri: `mongodb://${MONGO_DB_USERNAME}:${MONGO_DB_PASSWORD}@${MONGO_DB_HOSTNAME}:${MONGO_DB_PORT}/${MONGO_DB_DATABASE}?authSource=${MONGO_DB_DATABASE}`,
	};
});
