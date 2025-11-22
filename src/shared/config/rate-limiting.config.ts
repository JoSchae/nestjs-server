import { registerAs } from '@nestjs/config';

export default registerAs('rateLimit', () => ({
	// Global rate limits
	global: {
		ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60000, // 1 minute
		limit: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per minute
	},
	auth: {
		ttl: parseInt(process.env.AUTH_RATE_LIMIT_TTL) || 60000, // 1 minute!
		limit: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 3, // Only 3 login attempts per 1 minute
	},
	userCreation: {
		ttl: parseInt(process.env.USER_CREATION_RATE_LIMIT_TTL) || 60000, // 1 minute
		limit: parseInt(process.env.USER_CREATION_RATE_LIMIT_MAX) || 3, // Only 3 new users per minute per IP
	},
	metrics: {
		ttl: parseInt(process.env.METRICS_RATE_LIMIT_TTL) || 60000, // 1 minute
		limit: parseInt(process.env.METRICS_RATE_LIMIT_MAX) || 10, // 10 requests per minute (expensive endpoint)
	},
	health: {
		ttl: parseInt(process.env.HEALTH_RATE_LIMIT_TTL) || 60000, // 1 minute
		limit: parseInt(process.env.HEALTH_RATE_LIMIT_MAX) || 30, // 30 requests per minute (allow monitoring systems)
	},
	telemetry: {
		ttl: parseInt(process.env.TELEMETRY_RATE_LIMIT_TTL) || 60000, // 1 minute
		limit: parseInt(process.env.TELEMETRY_RATE_LIMIT_MAX) || 100, // 100 requests per minute per company
	},
}));
