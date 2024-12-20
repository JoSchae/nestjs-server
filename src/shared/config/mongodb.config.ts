import { registerAs } from '@nestjs/config';

const isDevelopment = process.env.NODE_ENV !== 'prod';

/**
 * Mongo database connection config
 */
export default registerAs('mongodb', () => {
	const { MONGO_DB_PORT, MONGO_DB_HOSTNAME, MONGO_DB_DATABASE, MONGO_DB_USERNAME, MONGO_DB_PASSWORD } = process.env;
	return {
		uri: isDevelopment
			? `mongodb://${MONGO_DB_USERNAME}:${MONGO_DB_PASSWORD}@${MONGO_DB_HOSTNAME}:${MONGO_DB_PORT}/${MONGO_DB_DATABASE}`
			: `mongodb+srv://${MONGO_DB_USERNAME}:${MONGO_DB_PASSWORD}@${MONGO_DB_HOSTNAME}/${MONGO_DB_DATABASE}?retryWrites=true&w=majority`,
	};
});
