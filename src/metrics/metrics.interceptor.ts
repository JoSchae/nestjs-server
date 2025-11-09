import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CustomMetricsService } from './custom-metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	constructor(private readonly metricsService: CustomMetricsService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();
		const startTime = Date.now();

		return next.handle().pipe(
			tap(() => {
				const duration = (Date.now() - startTime) / 1000;
				const method = request.method;
				const route = request.route?.path || request.url;
				const statusCode = response.statusCode;

				this.metricsService.incrementHttpRequests(method, route, statusCode);
				this.metricsService.recordHttpRequestDuration(method, route, statusCode, duration);
			}),
			catchError((error) => {
				const duration = (Date.now() - startTime) / 1000;
				const method = request.method;
				const route = request.route?.path || request.url;
				const statusCode = error.status || 500;
				const errorType = error.name || 'UnknownError';

				this.metricsService.incrementHttpRequests(method, route, statusCode);
				this.metricsService.recordHttpRequestDuration(method, route, statusCode, duration);
				this.metricsService.incrementHttpErrors(method, route, statusCode, errorType);

				throw error;
			}),
		);
	}
}
