import { Injectable, LoggerService } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
	correlationId?: string;
	userId?: string;
	userEmail?: string;
	requestMethod?: string;
	requestUrl?: string;
	userAgent?: string;
	ip?: string;
	[key: string]: any;
}

@Injectable()
export class CustomLoggerService implements LoggerService {
	private context = 'Application';
	private static asyncLocalStorage = new AsyncLocalStorage<LogContext>();
	private static logLevel: string = process.env.LOG_LEVEL || 'info';

	// Sensitive fields that should be redacted from logs
	private static readonly SENSITIVE_FIELDS = [
		'password',
		'token',
		'accessToken',
		'access_token',
		'refreshToken',
		'refresh_token',
		'secret',
		'authorization',
		'apiKey',
		'api_key',
		'creditCard',
		'ssn',
		'cvv',
	];

	setContext(context: string) {
		this.context = context;
	}

	static setLogLevel(level: string) {
		this.logLevel = level.toLowerCase();
	}

	static getLogLevel(): string {
		return this.logLevel;
	}

	private shouldLog(level: string): boolean {
		const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
		const currentLevelIndex = levels.indexOf(CustomLoggerService.logLevel);
		const messageLevelIndex = levels.indexOf(level);

		// If LOG_LEVEL is not valid, default to 'info'
		if (currentLevelIndex === -1) {
			return messageLevelIndex <= levels.indexOf('info');
		}

		return messageLevelIndex <= currentLevelIndex;
	}

	static setContext(context: LogContext) {
		this.asyncLocalStorage.enterWith(context);
	}

	static getContext(): LogContext {
		return this.asyncLocalStorage.getStore() || {};
	}

	static generateCorrelationId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Recursively sanitize an object by redacting sensitive fields
	 */
	private sanitizeData(data: any): any {
		if (data === null || data === undefined) {
			return data;
		}

		// Handle primitives
		if (typeof data !== 'object') {
			return data;
		}

		// Handle arrays
		if (Array.isArray(data)) {
			return data.map((item) => this.sanitizeData(item));
		}

		// Handle objects
		const sanitized: any = {};
		for (const [key, value] of Object.entries(data)) {
			const lowerKey = key.toLowerCase();

			// Check if this field should be redacted
			const isSensitive = CustomLoggerService.SENSITIVE_FIELDS.some((field) =>
				lowerKey.includes(field.toLowerCase()),
			);

			if (isSensitive) {
				sanitized[key] = '[REDACTED]';
			} else if (typeof value === 'object' && value !== null) {
				// Recursively sanitize nested objects
				sanitized[key] = this.sanitizeData(value);
			} else {
				sanitized[key] = value;
			}
		}

		return sanitized;
	}

	private formatMessage(level: string, message: any, optionalParams?: any[]): string {
		const context = CustomLoggerService.getContext();
		const timestamp = new Date().toISOString();

		const logEntry = {
			timestamp,
			level: level.toUpperCase(),
			context: this.context,
			message: typeof message === 'string' ? message : JSON.stringify(message),
			correlationId: context.correlationId,
			userId: context.userId,
			userEmail: context.userEmail,
			requestMethod: context.requestMethod,
			requestUrl: context.requestUrl,
			userAgent: context.userAgent,
			ip: context.ip,
			...context,
		};

		// Remove undefined values
		Object.keys(logEntry).forEach((key) => {
			if (logEntry[key] === undefined) {
				delete logEntry[key];
			}
		});

		if (optionalParams && optionalParams.length > 0) {
			logEntry['additionalData'] = optionalParams;
		}

		// Sanitize the entire log entry to remove sensitive data
		const sanitizedEntry = this.sanitizeData(logEntry);

		return JSON.stringify(sanitizedEntry);
	}

	log(message: any, ...optionalParams: any[]) {
		if (this.shouldLog('info')) {
			console.log(this.formatMessage('info', message, optionalParams));
		}
	}

	error(message: any, trace?: string, ...optionalParams: any[]) {
		if (this.shouldLog('error')) {
			const errorEntry = this.formatMessage('error', message, optionalParams);
			if (trace) {
				const parsedEntry = JSON.parse(errorEntry);
				parsedEntry.trace = trace;
				console.error(JSON.stringify(parsedEntry));
			} else {
				console.error(errorEntry);
			}
		}
	}

	warn(message: any, ...optionalParams: any[]) {
		if (this.shouldLog('warn')) {
			console.warn(this.formatMessage('warn', message, optionalParams));
		}
	}

	debug(message: any, ...optionalParams: any[]) {
		if (this.shouldLog('debug')) {
			console.debug(this.formatMessage('debug', message, optionalParams));
		}
	}

	verbose(message: any, ...optionalParams: any[]) {
		if (this.shouldLog('verbose')) {
			console.log(this.formatMessage('verbose', message, optionalParams));
		}
	}
}
