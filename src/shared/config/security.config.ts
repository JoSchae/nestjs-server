import { registerAs } from '@nestjs/config';
import { CustomLoggerService } from '../logger/custom-logger.service';

const logger = new CustomLoggerService();
logger.setContext('SecurityConfig');

function createOriginValidator() {
	return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
		// Allow requests with no origin header
		// This includes: native apps, mobile apps, Postman, server-to-server calls
		if (!origin) {
			return callback(null, true);
		}

		// Allow localhost on any port for development
		if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
			return callback(null, true);
		}

		// Check against explicitly allowed origins from environment
		const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];
		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		}

		// Reject all other origins
		logger.warn(`CORS blocked origin: ${origin}`, {
			origin,
			allowedOrigins,
			service: 'SecurityConfig',
			method: 'createOriginValidator',
		});
		callback(new Error('Not allowed by CORS'));
	};
}

export default registerAs('security', () => ({
	requestLimits: {
		jsonLimit: process.env.JSON_PAYLOAD_LIMIT || '10mb',
		urlEncodedLimit: process.env.URL_ENCODED_LIMIT || '10mb',
		rawLimit: process.env.RAW_PAYLOAD_LIMIT || '10mb',
		fileUploadLimit: process.env.FILE_UPLOAD_LIMIT || '50mb',
	},
	cors: {
		origin: createOriginValidator(),
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
	},
}));
