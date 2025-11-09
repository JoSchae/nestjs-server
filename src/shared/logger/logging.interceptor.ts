import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from './custom-logger.service';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new CustomLoggerService();

	constructor() {
		this.logger.setContext('LoggingInterceptor');
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest<Request>();
		const response = context.switchToHttp().getResponse<Response>();
		const { method, url, headers, ip } = request;

		// Generate or extract correlation ID
		const correlationId = (headers['X-Correlation-ID'] as string) || CustomLoggerService.generateCorrelationId();

		// Extract user information if available
		const user = (request as any).user;
		const userId = user?.sub || user?.id;
		const userEmail = user?.email;

		// Set up logging context
		const logContext = {
			correlationId,
			userId,
			userEmail,
			requestMethod: method,
			requestUrl: url,
			userAgent: headers['user-agent'],
			ip: ip || (headers['x-forwarded-for'] as string) || (headers['x-real-ip'] as string),
		};

		CustomLoggerService.setContext(logContext);

		// Set correlation ID in response headers
		response.setHeader('X-Correlation-ID', correlationId);

		const startTime = Date.now();

		this.logger.log(`Incoming ${method} ${url}`, {
			headers: this.sanitizeHeaders(headers),
			query: request.query,
			params: request.params,
		});

		return next.handle().pipe(
			tap({
				next: (data) => {
					const duration = Date.now() - startTime;
					this.logger.log(`Completed ${method} ${url} - ${response.statusCode}`, {
						statusCode: response.statusCode,
						duration: `${duration}ms`,
						responseSize: response.get('content-length') || 'unknown',
					});
				},
				error: (error) => {
					const duration = Date.now() - startTime;
					this.logger.error(`Failed ${method} ${url}`, error.stack, {
						statusCode: response.statusCode,
						duration: `${duration}ms`,
						error: {
							name: error.name,
							message: error.message,
						},
					});
				},
			}),
		);
	}

	private sanitizeHeaders(headers: any): any {
		const sanitized = { ...headers };

		// Remove sensitive headers
		const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
		sensitiveHeaders.forEach((header) => {
			if (sanitized[header]) {
				sanitized[header] = '[REDACTED]';
			}
		});

		return sanitized;
	}
}
