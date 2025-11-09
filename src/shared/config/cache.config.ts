import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
	ttl: {
		short: parseInt(process.env.CACHE_TTL_SHORT, 10) || 60,
		medium: parseInt(process.env.CACHE_TTL_MEDIUM, 10) || 300,
		long: parseInt(process.env.CACHE_TTL_LONG, 10) || 3600,
		veryLong: parseInt(process.env.CACHE_TTL_VERY_LONG, 10) || 86400,
	},
	max: parseInt(process.env.CACHE_MAX_ITEMS, 10) || 1000,
}));
