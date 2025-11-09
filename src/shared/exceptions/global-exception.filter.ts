import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logger/custom-logger.service';
import { MongoError } from 'mongodb';

export interface ErrorResponse {
	success: false;
	error: {
		code: string;
		message: string;
		details?: any;
		timestamp: string;
		path: string;
		method: string;
		correlationId?: string;
	};
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	private readonly logger = new CustomLoggerService();

	constructor() {
		this.logger.setContext('GlobalExceptionFilter');
	}

	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const correlationId = request.headers['X-Correlation-ID'] as string;
		const errorResponse = this.buildErrorResponse(exception, request, correlationId);

		// Log the error with context
		this.logError(exception, request, correlationId);

		response
			.status(errorResponse.error.code === 'INTERNAL_SERVER_ERROR' ? 500 : this.getHttpStatus(exception))
			.json(errorResponse);
	}

	private buildErrorResponse(exception: unknown, request: Request, correlationId?: string): ErrorResponse {
		const timestamp = new Date().toISOString();
		const path = request.url;
		const method = request.method;

		if (exception instanceof HttpException) {
			return {
				success: false,
				error: {
					code: this.getErrorCode(exception),
					message: this.getErrorMessage(exception),
					details: this.getErrorDetails(exception),
					timestamp,
					path,
					method,
					correlationId,
				},
			};
		}

		// Handle MongoDB errors
		if (this.isMongoError(exception)) {
			return {
				success: false,
				error: {
					code: this.getMongoErrorCode(exception as MongoError),
					message: this.getMongoErrorMessage(exception as MongoError),
					timestamp,
					path,
					method,
					correlationId,
				},
			};
		}

		// Handle validation errors
		if (this.isValidationError(exception)) {
			return {
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Validation failed',
					details: this.getValidationDetails(exception),
					timestamp,
					path,
					method,
					correlationId,
				},
			};
		}

		// Handle unknown errors
		return {
			success: false,
			error: {
				code: 'INTERNAL_SERVER_ERROR',
				message:
					process.env.NODE_ENV === 'production'
						? 'An unexpected error occurred'
						: (exception as Error)?.message || 'An unexpected error occurred',
				timestamp,
				path,
				method,
				correlationId,
			},
		};
	}

	private getHttpStatus(exception: unknown): number {
		if (exception instanceof HttpException) {
			return exception.getStatus();
		}

		if (this.isMongoError(exception)) {
			const mongoError = exception as MongoError;
			switch (mongoError.code) {
				case 11000: // Duplicate key
					return HttpStatus.CONFLICT;
				case 121: // Document validation failure
					return HttpStatus.BAD_REQUEST;
				default:
					return HttpStatus.INTERNAL_SERVER_ERROR;
			}
		}

		if (this.isValidationError(exception)) {
			return HttpStatus.BAD_REQUEST;
		}

		return HttpStatus.INTERNAL_SERVER_ERROR;
	}

	private getErrorCode(exception: HttpException): string {
		const status = exception.getStatus();
		const statusText = HttpStatus[status] || 'UNKNOWN_ERROR';
		return statusText;
	}

	private getErrorMessage(exception: HttpException): string {
		const exceptionResponse = exception.getResponse();

		if (typeof exceptionResponse === 'string') {
			return exceptionResponse;
		}

		if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
			const response = exceptionResponse as any;
			return response.message || response.error || exception.message;
		}

		return exception.message;
	}

	private getErrorDetails(exception: HttpException): any {
		const exceptionResponse = exception.getResponse();

		if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
			const response = exceptionResponse as any;

			// Return validation details if available
			if (response.message && Array.isArray(response.message)) {
				return { validation: response.message };
			}

			// Return other details
			if (response.details) {
				return response.details;
			}
		}

		return undefined;
	}

	private isMongoError(exception: unknown): boolean {
		return (
			exception instanceof MongoError ||
			(exception as any)?.name === 'MongoError' ||
			(exception as any)?.name === 'MongoServerError'
		);
	}

	private getMongoErrorCode(error: MongoError): string {
		switch (error.code) {
			case 11000:
				return 'DUPLICATE_KEY';
			case 121:
				return 'DOCUMENT_VALIDATION_FAILURE';
			case 2:
				return 'BAD_VALUE';
			case 13:
				return 'UNAUTHORIZED';
			default:
				return 'DATABASE_ERROR';
		}
	}

	private getMongoErrorMessage(error: MongoError): string {
		switch (error.code) {
			case 11000:
				const field = this.extractDuplicateField(error.message);
				return `Resource with this ${field} already exists`;
			case 121:
				return 'Document validation failed';
			case 2:
				return 'Invalid value provided';
			case 13:
				return 'Database operation not authorized';
			default:
				return 'Database operation failed';
		}
	}

	private extractDuplicateField(message: string): string {
		// Extract field name from MongoDB duplicate key error message
		const match = message.match(/index: (\w+)_\d+/);
		if (match) {
			return match[1];
		}

		// Fallback: look for field in curly braces
		const fieldMatch = message.match(/\{ (\w+):/);
		if (fieldMatch) {
			return fieldMatch[1];
		}

		return 'field';
	}

	private isValidationError(exception: unknown): boolean {
		return (
			(exception as any)?.name === 'ValidationError' ||
			(exception as any)?.isJoi === true ||
			(exception as any)?.name === 'ValidatorError'
		);
	}

	private getValidationDetails(exception: unknown): any {
		const error = exception as any;

		if (error.details && Array.isArray(error.details)) {
			// Joi validation errors
			return error.details.map((detail: any) => ({
				field: detail.path?.join('.'),
				message: detail.message,
				value: detail.context?.value,
			}));
		}

		if (error.errors) {
			// Mongoose validation errors
			return Object.keys(error.errors).map((field) => ({
				field,
				message: error.errors[field].message,
				value: error.errors[field].value,
			}));
		}

		return error.message || 'Validation failed';
	}

	private logError(exception: unknown, request: Request, correlationId?: string): void {
		const { method, url, body, query, params, headers } = request;
		const userAgent = headers['user-agent'];
		const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || request.ip;

		const logContext = {
			correlationId,
			method,
			url,
			userAgent,
			ip,
			body: this.sanitizeBody(body),
			query,
			params,
		};

		if (exception instanceof HttpException) {
			const status = exception.getStatus();

			if (status >= 500) {
				this.logger.error(`HTTP ${status} - ${exception.message}`, exception.stack, logContext);
			} else if (status >= 400) {
				this.logger.warn(`HTTP ${status} - ${exception.message}`, logContext);
			}
		} else {
			this.logger.error(
				`Unhandled exception: ${(exception as Error)?.message || 'Unknown error'}`,
				(exception as Error)?.stack,
				logContext,
			);
		}
	}

	private sanitizeBody(body: any): any {
		if (!body || typeof body !== 'object') {
			return body;
		}

		const sanitized = { ...body };
		const sensitiveFields = ['password', 'oldPassword', 'newPassword', 'token', 'secret'];

		sensitiveFields.forEach((field) => {
			if (sanitized[field]) {
				sanitized[field] = '[REDACTED]';
			}
		});

		return sanitized;
	}
}
